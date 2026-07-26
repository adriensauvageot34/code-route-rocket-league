import {
  TRAINING_RADAR_SWEEP,
  trainingRadarTargets,
} from "@/lib/home/trainingRadarTargets";
import type {
  TrainingRadarLayerSnapshot,
  TrainingRadarTacticalState,
  TrainingRadarTemporalSnapshot,
  TrainingRadarVolumeScanState,
} from "@/lib/home/trainingRadarSnapshots";

export type TrainingDomApplyMetrics = {
  changedValues: number;
  updates: number;
};

type CachedParticle = {
  birthDelayMs: number;
  durationMs: number;
  element: HTMLElement;
};

type CachedParticleBand = {
  element: HTMLElement;
  particles: CachedParticle[];
};

type CachedParticleField = {
  bands: CachedParticleBand[];
  element: HTMLElement;
};

const CAR_MASK_START_PERCENT = 130;
const CAR_MASK_END_PERCENT = -30;
const BALL_MASK_START_PERCENT = 88;
const BALL_MASK_END_PERCENT = 12;
const FENNEC_SURFACE_MASK_START_PERCENT = 38.7;
const FENNEC_SURFACE_MASK_END_PERCENT = 7.6;
const FENNEC_CONTOUR_MASK_START_PERCENT = 43;
const FENNEC_CONTOUR_MASK_END_PERCENT = 9;

function formatNumber(value: number, digits = 4) {
  return Number.isFinite(value) ? value.toFixed(digits) : "0";
}

function interpolate(left: number, right: number, progress: number) {
  return left + (right - left) * progress;
}

export class TrainingDomRadarApplier {
  private readonly valueCache = new WeakMap<Element, Map<string, string>>();
  private readonly radarMotions: SVGGraphicsElement[];
  private readonly radarOverlays: SVGSVGElement[];
  private readonly objectTargets = new Map<string, HTMLElement>();
  private readonly particleFields: CachedParticleField[];
  private readonly fennecTarget: HTMLElement | null;
  private readonly fennecBaseFrame: HTMLElement | null;
  private readonly fennecHeadlight: HTMLElement | null;
  private readonly fennecRearAccent: HTMLElement | null;

  constructor(private readonly root: HTMLElement) {
    this.radarMotions = Array.from(
      root.querySelectorAll<SVGGraphicsElement>(".training-radar-motion"),
    );
    this.radarOverlays = Array.from(
      root.querySelectorAll<SVGSVGElement>(".training-radar-overlay"),
    );
    for (const target of trainingRadarTargets) {
      const element = root.querySelector<HTMLElement>(
        `.training-grounded-actor[data-radar-target="${target.id}"] .training-radar-object-target`,
      );
      if (element) this.objectTargets.set(target.id, element);
    }
    this.fennecTarget = root.querySelector<HTMLElement>(
      ".training-radar-fennec-target",
    );
    this.fennecBaseFrame = root.querySelector<HTMLElement>(
      ".training-fennec-base-frame",
    );
    this.fennecHeadlight = root.querySelector<HTMLElement>(
      ".training-fennec-headlight-glow",
    );
    this.fennecRearAccent = root.querySelector<HTMLElement>(
      ".training-fennec-rear-accent",
    );
    this.particleFields = Array.from(
      root.querySelectorAll<HTMLElement>(".training-particle-field"),
    ).map((element) => ({
      element,
      bands: Array.from(
        element.querySelectorAll<HTMLElement>(".training-particle-band"),
      ).map((band) => ({
        element: band,
        particles: Array.from(
          band.querySelectorAll<HTMLElement>(".training-particle"),
        ).map((particle) => ({
          birthDelayMs: Number(particle.dataset.particleBirthMs ?? 0),
          durationMs: Number(particle.dataset.particleDurationMs ?? 0),
          element: particle,
        })),
      })),
    }));
  }

  apply(snapshot: TrainingRadarTemporalSnapshot): TrainingDomApplyMetrics {
    const metrics: TrainingDomApplyMetrics = {
      changedValues: 0,
      updates: 0,
    };
    this.applyRadar(snapshot, metrics);
    this.applyObjects(snapshot, metrics);
    this.applyFennec(snapshot, metrics);
    this.applyParticles(snapshot, metrics);
    return metrics;
  }

  destroy() {
    this.objectTargets.clear();
    this.radarMotions.length = 0;
    this.radarOverlays.length = 0;
    this.particleFields.length = 0;
  }

  private applyRadar(
    snapshot: TrainingRadarTemporalSnapshot,
    metrics: TrainingDomApplyMetrics,
  ) {
    const startedAt = metrics.changedValues;
    const radarX = interpolate(
      TRAINING_RADAR_SWEEP.startX,
      TRAINING_RADAR_SWEEP.endX,
      snapshot.frameState.radarProgress,
    );
    const overlayOpacity =
      snapshot.frameState.active && snapshot.frameState.running ? "1" : "0";
    const motionOpacity = formatNumber(snapshot.radarVisibility);
    const transform = `translate3d(${formatNumber(radarX, 2)}px, 0, 0)`;

    for (const overlay of this.radarOverlays) {
      this.writeStyle(overlay, "opacity", overlayOpacity, metrics);
    }
    for (const motion of this.radarMotions) {
      this.writeStyle(motion, "opacity", motionOpacity, metrics);
      this.writeStyle(motion, "transform", transform, metrics);
    }
    if (metrics.changedValues > startedAt) metrics.updates += 1;
  }

  private applyObjects(
    snapshot: TrainingRadarTemporalSnapshot,
    metrics: TrainingDomApplyMetrics,
  ) {
    for (const target of trainingRadarTargets) {
      const element = this.objectTargets.get(target.id);
      if (!element) continue;
      const startedAt = metrics.changedValues;
      const volume = snapshot.volume[target.id];
      const tactical = snapshot.tactical[target.id];
      this.writeAttribute(
        element,
        "data-volume-scan-phase",
        volume.phase,
        metrics,
      );
      this.writeAttribute(
        element,
        "data-tactical-phase",
        tactical.phase,
        metrics,
      );
      this.writeAttribute(
        element,
        "data-tactical-active",
        tactical.phase === "hidden" ? "false" : "true",
        metrics,
      );

      const maskStart =
        target.type === "ball"
          ? BALL_MASK_START_PERCENT
          : CAR_MASK_START_PERCENT;
      const maskEnd =
        target.type === "ball" ? BALL_MASK_END_PERCENT : CAR_MASK_END_PERCENT;
      this.writeVolumeLayer(
        element,
        "surface",
        volume.surface,
        interpolate(maskStart, maskEnd, volume.surface.maskProgress),
        metrics,
      );
      this.writeVolumeLayer(
        element,
        "contour",
        volume.contour,
        interpolate(maskStart, maskEnd, volume.contour.maskProgress),
        metrics,
      );
      this.writeTactical(element, tactical, metrics);
      if (metrics.changedValues > startedAt) metrics.updates += 1;
    }
  }

  private applyFennec(
    snapshot: TrainingRadarTemporalSnapshot,
    metrics: TrainingDomApplyMetrics,
  ) {
    const target = this.fennecTarget;
    if (!target) return;
    const startedAt = metrics.changedValues;
    const volume = snapshot.volume.fennec;
    const effects = snapshot.fennecEffects;

    this.writeAttribute(
      target,
      "data-volume-scan-phase",
      volume.phase,
      metrics,
    );
    this.writeAttribute(
      target,
      "data-surface-scan-mode",
      volume.phase === "active" ? "reveal" : "hidden",
      metrics,
    );
    this.writeAttribute(
      target,
      "data-tactical-active",
      effects.impactOpacity > 0 ? "true" : "false",
      metrics,
    );
    this.writeVolumeLayer(
      target,
      "surface",
      volume.surface,
      interpolate(
        FENNEC_SURFACE_MASK_START_PERCENT,
        FENNEC_SURFACE_MASK_END_PERCENT,
        volume.surface.maskProgress,
      ),
      metrics,
    );
    this.writeVolumeLayer(
      target,
      "contour",
      volume.contour,
      interpolate(
        FENNEC_CONTOUR_MASK_START_PERCENT,
        FENNEC_CONTOUR_MASK_END_PERCENT,
        volume.contour.maskProgress,
      ),
      metrics,
    );
    this.writeStyle(
      target,
      "--training-fennec-impact-opacity",
      formatNumber(effects.impactOpacity),
      metrics,
    );
    if (this.fennecBaseFrame) {
      this.writeAttribute(
        this.fennecBaseFrame,
        "data-tactical-active",
        effects.impactOpacity > 0 ? "true" : "false",
        metrics,
      );
      this.writeStyle(
        this.fennecBaseFrame,
        "--training-fennec-base-opacity",
        formatNumber(effects.baseOpacity),
        metrics,
      );
    }
    if (this.fennecHeadlight) {
      this.writeStyle(
        this.fennecHeadlight,
        "opacity",
        formatNumber(effects.headlightOpacity),
        metrics,
      );
    }
    if (this.fennecRearAccent) {
      this.writeStyle(
        this.fennecRearAccent,
        "opacity",
        formatNumber(effects.rearAccentOpacity),
        metrics,
      );
    }
    if (metrics.changedValues > startedAt) metrics.updates += 1;
  }

  private applyParticles(
    snapshot: TrainingRadarTemporalSnapshot,
    metrics: TrainingDomApplyMetrics,
  ) {
    const passes = snapshot.particlePasses;
    for (const field of this.particleFields) {
      const startedAt = metrics.changedValues;
      this.writeAttribute(
        field.element,
        "data-active",
        snapshot.frameState.running ? "true" : "false",
        metrics,
      );
      for (let index = 0; index < field.bands.length; index += 1) {
        const band = field.bands[index];
        const pass = passes[passes.length - field.bands.length + index];
        this.writeAttribute(
          band.element,
          "data-pass-active",
          pass ? "true" : "false",
          metrics,
        );
        this.writeAttribute(
          band.element,
          "data-particle-pass",
          pass ? String(pass.passKey) : "0",
          metrics,
        );
        for (const particle of band.particles) {
          const localElapsedMs = pass
            ? snapshot.frameState.nowMs -
              pass.passStartedAtMs -
              particle.birthDelayMs
            : -1;
          const visible =
            localElapsedMs >= 0 && localElapsedMs < particle.durationMs;
          this.writeStyle(
            particle.element,
            "visibility",
            visible ? "visible" : "hidden",
            metrics,
          );
          this.writeStyle(
            particle.element,
            "--particle-sample-delay",
            `${-Math.max(0, localElapsedMs).toFixed(2)}ms`,
            metrics,
          );
        }
      }
      if (metrics.changedValues > startedAt) metrics.updates += 1;
    }
  }

  private writeVolumeLayer(
    element: HTMLElement,
    layer: "surface" | "contour",
    state: TrainingRadarLayerSnapshot,
    maskPositionPercent: number,
    metrics: TrainingDomApplyMetrics,
  ) {
    this.writeStyle(
      element,
      `--training-volume-${layer}-opacity`,
      formatNumber(state.opacity),
      metrics,
    );
    this.writeStyle(
      element,
      `--training-volume-${layer}-brightness`,
      formatNumber(state.brightness),
      metrics,
    );
    this.writeStyle(
      element,
      `--training-volume-${layer}-saturation`,
      formatNumber(state.saturation),
      metrics,
    );
    this.writeStyle(
      element,
      `--training-volume-${layer}-mask-position`,
      `${formatNumber(maskPositionPercent, 3)}% 50%`,
      metrics,
    );
  }

  private writeTactical(
    element: HTMLElement,
    state: TrainingRadarTacticalState,
    metrics: TrainingDomApplyMetrics,
  ) {
    this.writeStyle(
      element,
      "--training-contact-opacity",
      formatNumber(state.contactPulseOpacity),
      metrics,
    );
    this.writeStyle(
      element,
      "--training-contact-scale",
      formatNumber(state.contactPulseScale),
      metrics,
    );
    this.writeStyle(
      element,
      "--training-tactical-wireframe-opacity",
      formatNumber(state.wireframeOpacity),
      metrics,
    );
    this.writeStyle(
      element,
      "--training-tactical-glow-opacity",
      formatNumber(state.glowOpacity),
      metrics,
    );
    this.writeStyle(
      element,
      "--training-tactical-energy-opacity",
      formatNumber(state.energyOpacity),
      metrics,
    );
    this.writeStyle(
      element,
      "--training-tactical-energy-brightness",
      formatNumber(state.energyBrightness),
      metrics,
    );
    this.writeStyle(
      element,
      "--training-tactical-energy-saturation",
      formatNumber(state.energySaturation),
      metrics,
    );
  }

  private writeAttribute(
    element: Element,
    name: string,
    value: string,
    metrics: TrainingDomApplyMetrics,
  ) {
    if (!this.cacheValue(element, `attribute:${name}`, value)) return;
    element.setAttribute(name, value);
    metrics.changedValues += 1;
  }

  private writeStyle(
    element: ElementCSSInlineStyle,
    name: string,
    value: string,
    metrics: TrainingDomApplyMetrics,
  ) {
    const target = element as unknown as Element;
    if (!this.cacheValue(target, `style:${name}`, value)) return;
    element.style.setProperty(name, value);
    metrics.changedValues += 1;
  }

  private cacheValue(element: Element, key: string, value: string) {
    let cache = this.valueCache.get(element);
    if (!cache) {
      cache = new Map<string, string>();
      this.valueCache.set(element, cache);
    }
    if (cache.get(key) === value) return false;
    cache.set(key, value);
    return true;
  }
}
