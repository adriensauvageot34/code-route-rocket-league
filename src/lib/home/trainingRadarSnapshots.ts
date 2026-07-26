import {
  getTrainingRadarRangeTiming,
  TRAINING_RADAR_TIMING,
  TRAINING_VOLUME_SCAN_TIMING,
  trainingRadarTargets,
  trainingVolumeScanTargets,
  type TrainingRadarTarget,
  type TrainingRadarTargetId,
  type TrainingVolumeScanTarget,
  type TrainingVolumeScanTargetId,
} from "@/lib/home/trainingRadarTargets";
import type {
  TrainingRadarClockSnapshot,
  TrainingRadarPassMode,
} from "@/lib/home/trainingRadarClock";

export type TrainingRadarFrameState = TrainingRadarClockSnapshot & {
  active: boolean;
};

export type TrainingRadarVolumeScanPhase =
  | "hidden"
  | "active"
  | "hold"
  | "fade";

export type TrainingRadarLayerSnapshot = {
  brightness: number;
  maskProgress: number;
  opacity: number;
  saturation: number;
};

export type TrainingRadarVolumeScanState = {
  phase: TrainingRadarVolumeScanPhase;
  localElapsedMs: number;
  activeProgress: number;
  surfaceProgress: number;
  contourProgress: number;
  holdProgress: number;
  fadeProgress: number;
  surfaceOpacityFactor: number;
  contourOpacityFactor: number;
  surface: TrainingRadarLayerSnapshot;
  contour: TrainingRadarLayerSnapshot;
};

export type TrainingRadarVolumeScanSnapshot = Record<
  TrainingVolumeScanTargetId,
  TrainingRadarVolumeScanState
>;

export type TrainingRadarTacticalPhase =
  | "hidden"
  | "contact"
  | "active"
  | "hold"
  | "fade";

export type TrainingRadarTacticalState = {
  phase: TrainingRadarTacticalPhase;
  localElapsedMs: number;
  contactProgress: number;
  activeProgress: number;
  holdProgress: number;
  fadeProgress: number;
  opacityFactor: number;
  contactPulseOpacity: number;
  contactPulseScale: number;
  wireframeOpacity: number;
  glowOpacity: number;
  energyOpacity: number;
  energyBrightness: number;
  energySaturation: number;
};

export type TrainingRadarTacticalSnapshot = Record<
  TrainingRadarTargetId,
  TrainingRadarTacticalState
>;

export type TrainingRadarFennecEffectsState = {
  activeProgress: number;
  baseOpacity: number;
  impactOpacity: number;
  headlightOpacity: number;
  rearAccentOpacity: number;
};

export type TrainingRadarParticlePassSnapshot = {
  passKey: number;
  passMode: TrainingRadarPassMode;
  passStartedAtMs: number;
};

export type TrainingRadarTemporalSnapshot = {
  frameState: TrainingRadarFrameState;
  radarVisibility: number;
  volume: TrainingRadarVolumeScanSnapshot;
  tactical: TrainingRadarTacticalSnapshot;
  fennecEffects: TrainingRadarFennecEffectsState;
  particlePasses: readonly TrainingRadarParticlePassSnapshot[];
};

export function createTrainingRadarFrameState(
  active: boolean,
  running: boolean,
  clockSnapshot: TrainingRadarClockSnapshot,
): TrainingRadarFrameState {
  return {
    ...clockSnapshot,
    active,
    running: running && clockSnapshot.running,
  };
}

type LayerStyleKeyframe = {
  progress: number;
  opacity: number;
  brightness: number;
  saturation: number;
};

const VOLUME_STYLE_KEYFRAMES = {
  car: {
    surface: [
      { progress: 0, opacity: 0.18, brightness: 1.18, saturation: 1.28 },
      { progress: 0.18, opacity: 0.3, brightness: 1.18, saturation: 1.28 },
      { progress: 0.72, opacity: 0.34, brightness: 1.18, saturation: 1.28 },
      { progress: 1, opacity: 0.22, brightness: 1.18, saturation: 1.28 },
    ],
    contour: [
      { progress: 0, opacity: 0.12, brightness: 1.3, saturation: 1.34 },
      { progress: 0.2, opacity: 0.24, brightness: 1.3, saturation: 1.34 },
      { progress: 0.62, opacity: 0.3, brightness: 1.3, saturation: 1.34 },
      { progress: 1, opacity: 0.14, brightness: 1.3, saturation: 1.34 },
    ],
  },
  ball: {
    surface: [
      { progress: 0, opacity: 0.3, brightness: 1, saturation: 1 },
      { progress: 0.18, opacity: 0.68, brightness: 1.3, saturation: 1.24 },
      {
        progress: 0.72,
        opacity: 0.42,
        brightness: 1.1288,
        saturation: 1.1083,
      },
      { progress: 1, opacity: 0.32, brightness: 1.04, saturation: 1.04 },
    ],
    contour: [
      { progress: 0, opacity: 0.18, brightness: 1.28, saturation: 1.3 },
      { progress: 0.2, opacity: 0.58, brightness: 1.28, saturation: 1.3 },
      { progress: 0.66, opacity: 0.4, brightness: 1.28, saturation: 1.3 },
      { progress: 1, opacity: 0.2, brightness: 1.28, saturation: 1.3 },
    ],
  },
} as const satisfies Record<
  "car" | "ball",
  Record<"surface" | "contour", readonly LayerStyleKeyframe[]>
>;

const FENNEC_TACTICAL_EMPHASIS_DURATION_MS = 650;
const FENNEC_TACTICAL_IMPACT_KEYFRAMES = [
  { progress: 0, opacity: 0 },
  { progress: 0.12, opacity: 0.15 },
  { progress: 0.18, opacity: 0.45 },
  { progress: 0.25, opacity: 0.2 },
  { progress: 0.32, opacity: 0.55 },
  { progress: 0.4, opacity: 0.3 },
  { progress: 0.48, opacity: 0.6 },
  { progress: 0.57, opacity: 0.4 },
  { progress: 0.66, opacity: 0.52 },
  { progress: 0.76, opacity: 0.25 },
  { progress: 0.86, opacity: 0.1 },
  { progress: 1, opacity: 0 },
] as const;

type FennecImpactKeyframe =
  (typeof FENNEC_TACTICAL_IMPACT_KEYFRAMES)[number];

const HIDDEN_FENNEC_EFFECTS_STATE: TrainingRadarFennecEffectsState = {
  activeProgress: 0,
  baseOpacity: 1,
  impactOpacity: 0,
  headlightOpacity: 0.05,
  rearAccentOpacity: 0.08,
};

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function interpolate(left: number, right: number, progress: number) {
  return left + (right - left) * progress;
}

function interpolateKeyframes(
  keyframes: readonly LayerStyleKeyframe[],
  progress: number,
) {
  const clamped = clampProgress(progress);
  let left = keyframes[0];
  let right = keyframes[keyframes.length - 1];

  for (let index = 1; index < keyframes.length; index += 1) {
    if (clamped <= keyframes[index].progress) {
      left = keyframes[index - 1];
      right = keyframes[index];
      break;
    }
  }

  const range = Math.max(0.0001, right.progress - left.progress);
  const localProgress = clampProgress((clamped - left.progress) / range);
  return {
    opacity: interpolate(left.opacity, right.opacity, localProgress),
    brightness: interpolate(
      left.brightness,
      right.brightness,
      localProgress,
    ),
    saturation: interpolate(
      left.saturation,
      right.saturation,
      localProgress,
    ),
  };
}

function getVolumeActiveDurationMs(target: TrainingVolumeScanTarget) {
  if (target.type === "car") return target.objectScan.durationMs;
  if (target.type === "ball") {
    return TRAINING_VOLUME_SCAN_TIMING.ballActiveDurationMs;
  }
  return getTrainingRadarRangeTiming(target.scanRange).durationMs;
}

function getVolumeContourDelayMs(target: TrainingVolumeScanTarget) {
  return target.type === "car"
    ? target.objectScan.contourDelayMs
    : TRAINING_VOLUME_SCAN_TIMING.contourDelayMs;
}

function getHiddenVolumeState(
  target: TrainingVolumeScanTarget,
  localElapsedMs = 0,
): TrainingRadarVolumeScanState {
  const isFennec = target.type === "fennec";
  return {
    phase: "hidden",
    localElapsedMs,
    activeProgress: 0,
    surfaceProgress: 0,
    contourProgress: 0,
    holdProgress: 0,
    fadeProgress: 0,
    surfaceOpacityFactor: 0,
    contourOpacityFactor: 0,
    surface: {
      brightness: isFennec ? 1.18 : 1,
      maskProgress: 0,
      opacity: 0,
      saturation: isFennec ? 1.2 : 1,
    },
    contour: {
      brightness: isFennec ? 1.06 : 1,
      maskProgress: 0,
      opacity: 0,
      saturation: isFennec ? 1.08 : 1,
    },
  };
}

function getVolumeLayerSnapshot(
  target: TrainingVolumeScanTarget,
  layer: "surface" | "contour",
  phase: TrainingRadarVolumeScanPhase,
  progress: number,
  opacityFactor: number,
): TrainingRadarLayerSnapshot {
  if (target.type === "fennec") {
    if (layer === "surface") {
      return {
        brightness: 1.18,
        maskProgress: progress,
        opacity: phase === "hidden" ? 0 : 0.48 * opacityFactor,
        saturation: 1.2,
      };
    }

    let opacity = 0.14;
    if (phase === "active") {
      opacity =
        progress <= 0.28
          ? interpolate(0.06, 0.18, progress / 0.28)
          : interpolate(0.18, 0, (progress - 0.28) / 0.72);
    }
    return {
      brightness: 1.06,
      maskProgress: progress,
      opacity: phase === "hidden" ? 0 : opacity * opacityFactor,
      saturation: 1.08,
    };
  }

  const keyframes = VOLUME_STYLE_KEYFRAMES[target.type][layer];
  const style = interpolateKeyframes(keyframes, progress);
  return {
    ...style,
    maskProgress: progress,
    opacity: phase === "hidden" ? 0 : style.opacity * opacityFactor,
  };
}

export function getTrainingRadarVolumeScanState(
  frameState: Pick<
    TrainingRadarFrameState,
    "passMode" | "elapsedMs" | "running"
  >,
  target: TrainingVolumeScanTarget,
): TrainingRadarVolumeScanState {
  if (!frameState.running || frameState.passMode !== "volume") {
    return getHiddenVolumeState(target);
  }

  const localElapsedMs = frameState.elapsedMs - target.scanDelayMs;
  if (localElapsedMs < 0) {
    return getHiddenVolumeState(target, localElapsedMs);
  }

  const activeDurationMs = getVolumeActiveDurationMs(target);
  const holdDurationMs = TRAINING_VOLUME_SCAN_TIMING.holdDurationMs;
  const fadeDurationMs = TRAINING_VOLUME_SCAN_TIMING.fadeDurationMs;
  const fadeStartMs = activeDurationMs + holdDurationMs;
  const hiddenStartMs = fadeStartMs + fadeDurationMs;

  if (localElapsedMs >= hiddenStartMs) {
    return getHiddenVolumeState(target, localElapsedMs);
  }

  const phase: TrainingRadarVolumeScanPhase =
    localElapsedMs < activeDurationMs
      ? "active"
      : localElapsedMs < fadeStartMs
        ? "hold"
        : "fade";
  const activeProgress =
    phase === "active"
      ? clampProgress(localElapsedMs / Math.max(1, activeDurationMs))
      : 1;
  const contourDelayMs = getVolumeContourDelayMs(target);
  const contourProgress =
    phase === "active"
      ? clampProgress(
          (localElapsedMs - contourDelayMs) /
            Math.max(1, activeDurationMs - contourDelayMs),
        )
      : 1;
  const holdProgress =
    phase === "active"
      ? 0
      : phase === "hold"
        ? clampProgress(
            (localElapsedMs - activeDurationMs) /
              Math.max(1, holdDurationMs),
          )
        : 1;
  const fadeProgress =
    phase === "fade"
      ? clampProgress(
          (localElapsedMs - fadeStartMs) / Math.max(1, fadeDurationMs),
        )
      : 0;
  const opacityFactor = 1 - fadeProgress;
  const surfaceProgress = phase === "active" ? activeProgress : 1;

  return {
    phase,
    localElapsedMs,
    activeProgress,
    surfaceProgress,
    contourProgress,
    holdProgress,
    fadeProgress,
    surfaceOpacityFactor: opacityFactor,
    contourOpacityFactor: opacityFactor,
    surface: getVolumeLayerSnapshot(
      target,
      "surface",
      phase,
      surfaceProgress,
      opacityFactor,
    ),
    contour: getVolumeLayerSnapshot(
      target,
      "contour",
      phase,
      contourProgress,
      opacityFactor,
    ),
  };
}

function getHiddenTacticalState(
  localElapsedMs: number,
): TrainingRadarTacticalState {
  return {
    phase: "hidden",
    localElapsedMs,
    contactProgress: 0,
    activeProgress: 0,
    holdProgress: 0,
    fadeProgress: 0,
    opacityFactor: 0,
    contactPulseOpacity: 0,
    contactPulseScale: 0.72,
    wireframeOpacity: 0,
    glowOpacity: 0,
    energyOpacity: 0,
    energyBrightness: 1,
    energySaturation: 1,
  };
}

function getContactPulse(progress: number) {
  if (progress <= 0.38) {
    const localProgress = progress / 0.38;
    return {
      opacity: interpolate(0, 1, localProgress),
      scale: interpolate(0.72, 1.04, localProgress),
    };
  }
  const localProgress = (progress - 0.38) / 0.62;
  return {
    opacity: interpolate(1, 0.12, localProgress),
    scale: interpolate(1.04, 1.12, localProgress),
  };
}

function withTacticalVisuals(
  target: TrainingRadarTarget,
  state: Omit<
    TrainingRadarTacticalState,
    | "contactPulseOpacity"
    | "contactPulseScale"
    | "wireframeOpacity"
    | "glowOpacity"
    | "energyOpacity"
    | "energyBrightness"
    | "energySaturation"
  >,
): TrainingRadarTacticalState {
  const contactPulse =
    target.type === "car" && state.phase === "contact"
      ? getContactPulse(state.contactProgress)
      : { opacity: 0, scale: 0.72 };
  const visible = state.phase !== "hidden" && state.phase !== "contact";
  const ballContact = target.type === "ball" && state.phase === "contact";

  return {
    ...state,
    contactPulseOpacity: contactPulse.opacity,
    contactPulseScale: contactPulse.scale,
    wireframeOpacity:
      target.type === "car" && visible ? 0.3 * state.opacityFactor : 0,
    glowOpacity:
      target.type === "car" && visible ? 0.09 * state.opacityFactor : 0,
    energyOpacity:
      target.type === "ball"
        ? ballContact
          ? 0.86
          : visible
            ? 0.52 * state.opacityFactor
            : 0
        : 0,
    energyBrightness: ballContact ? 1.55 : visible ? 1.3 : 1,
    energySaturation: ballContact ? 1.32 : visible ? 1.2 : 1,
  };
}

export function getTrainingRadarTacticalState(
  frameState: Pick<
    TrainingRadarFrameState,
    "passMode" | "elapsedMs" | "running"
  >,
  target: TrainingRadarTarget,
): TrainingRadarTacticalState {
  if (!frameState.running) return getHiddenTacticalState(0);

  if (frameState.passMode === "volume") {
    const fadeProgress = clampProgress(
      frameState.elapsedMs / TRAINING_RADAR_TIMING.fadeDurationMs,
    );
    if (fadeProgress >= 1) {
      return getHiddenTacticalState(frameState.elapsedMs);
    }
    return withTacticalVisuals(target, {
      phase: "fade",
      localElapsedMs: frameState.elapsedMs,
      contactProgress: 1,
      activeProgress: 1,
      holdProgress: 1,
      fadeProgress,
      opacityFactor: Math.pow(1 - fadeProgress, 2),
    });
  }

  const localElapsedMs = frameState.elapsedMs - target.tacticalDelayMs;
  if (localElapsedMs < 0) return getHiddenTacticalState(localElapsedMs);

  const contactProgress = clampProgress(
    localElapsedMs / TRAINING_RADAR_TIMING.contactDurationMs,
  );
  if (contactProgress < 1) {
    return withTacticalVisuals(target, {
      phase: "contact",
      localElapsedMs,
      contactProgress,
      activeProgress: 0,
      holdProgress: 0,
      fadeProgress: 0,
      opacityFactor: 1,
    });
  }

  const activeStartedAtMs =
    target.tacticalDelayMs + TRAINING_RADAR_TIMING.contactDurationMs;
  if (frameState.elapsedMs < TRAINING_RADAR_TIMING.passDurationMs) {
    return withTacticalVisuals(target, {
      phase: "active",
      localElapsedMs,
      contactProgress: 1,
      activeProgress: clampProgress(
        (frameState.elapsedMs - activeStartedAtMs) /
          Math.max(
            1,
            TRAINING_RADAR_TIMING.passDurationMs - activeStartedAtMs,
          ),
      ),
      holdProgress: 0,
      fadeProgress: 0,
      opacityFactor: 1,
    });
  }

  return withTacticalVisuals(target, {
    phase: "hold",
    localElapsedMs,
    contactProgress: 1,
    activeProgress: 1,
    holdProgress: clampProgress(
      (frameState.elapsedMs - TRAINING_RADAR_TIMING.passDurationMs) /
        TRAINING_RADAR_TIMING.tacticalHoldDurationMs,
    ),
    fadeProgress: 0,
    opacityFactor: 1,
  });
}

function getFennecImpactOpacity(progress: number) {
  let left: FennecImpactKeyframe = FENNEC_TACTICAL_IMPACT_KEYFRAMES[0];
  let right: FennecImpactKeyframe =
    FENNEC_TACTICAL_IMPACT_KEYFRAMES[
      FENNEC_TACTICAL_IMPACT_KEYFRAMES.length - 1
    ];

  for (
    let index = 1;
    index < FENNEC_TACTICAL_IMPACT_KEYFRAMES.length;
    index += 1
  ) {
    if (progress <= FENNEC_TACTICAL_IMPACT_KEYFRAMES[index].progress) {
      left = FENNEC_TACTICAL_IMPACT_KEYFRAMES[index - 1];
      right = FENNEC_TACTICAL_IMPACT_KEYFRAMES[index];
      break;
    }
  }

  const range = Math.max(0.0001, right.progress - left.progress);
  return interpolate(
    left.opacity,
    right.opacity,
    clampProgress((progress - left.progress) / range),
  );
}

export function getTrainingRadarFennecEffectsState(
  frameState: Pick<
    TrainingRadarFrameState,
    "elapsedMs" | "passMode" | "running"
  >,
): TrainingRadarFennecEffectsState {
  if (!frameState.running || frameState.passMode !== "tactical") {
    return HIDDEN_FENNEC_EFFECTS_STATE;
  }

  const fennecTarget = trainingVolumeScanTargets.find(
    (target) => target.id === "fennec",
  );
  if (!fennecTarget) return HIDDEN_FENNEC_EFFECTS_STATE;

  const localElapsedMs = frameState.elapsedMs - fennecTarget.tacticalDelayMs;
  if (
    localElapsedMs < 0 ||
    localElapsedMs >= FENNEC_TACTICAL_EMPHASIS_DURATION_MS
  ) {
    return HIDDEN_FENNEC_EFFECTS_STATE;
  }

  const activeProgress = clampProgress(
    localElapsedMs / FENNEC_TACTICAL_EMPHASIS_DURATION_MS,
  );
  const impactOpacity = getFennecImpactOpacity(activeProgress);
  return {
    activeProgress,
    baseOpacity: 1 - impactOpacity,
    impactOpacity,
    headlightOpacity: 0.05,
    rearAccentOpacity: 0.08,
  };
}

function getPassDurationMs(passMode: TrainingRadarPassMode) {
  return (
    TRAINING_RADAR_TIMING.passDurationMs +
    (passMode === "tactical"
      ? TRAINING_RADAR_TIMING.tacticalHoldDurationMs
      : 0)
  );
}

function getParticlePasses(
  frameState: TrainingRadarFrameState,
): readonly TrainingRadarParticlePassSnapshot[] {
  if (!frameState.running || frameState.passKey === 0) return [];

  const currentPass: TrainingRadarParticlePassSnapshot = {
    passKey: frameState.passKey,
    passMode: frameState.passMode,
    passStartedAtMs: frameState.passStartedAtMs,
  };
  if (frameState.passKey === 1) return [currentPass];

  const previousMode =
    frameState.passMode === "volume" ? "tactical" : "volume";
  return [
    {
      passKey: frameState.passKey - 1,
      passMode: previousMode,
      passStartedAtMs:
        frameState.passStartedAtMs - getPassDurationMs(previousMode),
    },
    currentPass,
  ];
}

export function getTrainingRadarVisibility(progress: number) {
  if (progress <= 0) return 0;
  if (progress < 0.08) return progress / 0.08;
  if (progress <= 0.88) return 1;
  if (progress < 1) return (1 - progress) / 0.12;
  return 0;
}

export function getTrainingRadarTemporalSnapshot(
  frameState: TrainingRadarFrameState,
): TrainingRadarTemporalSnapshot {
  const volume = Object.fromEntries(
    trainingVolumeScanTargets.map((target) => [
      target.id,
      getTrainingRadarVolumeScanState(frameState, target),
    ]),
  ) as TrainingRadarVolumeScanSnapshot;
  const tactical = Object.fromEntries(
    trainingRadarTargets.map((target) => [
      target.id,
      getTrainingRadarTacticalState(frameState, target),
    ]),
  ) as TrainingRadarTacticalSnapshot;

  return {
    frameState,
    radarVisibility:
      frameState.active && frameState.running
        ? getTrainingRadarVisibility(frameState.radarProgress)
        : 0,
    volume,
    tactical,
    fennecEffects: getTrainingRadarFennecEffectsState(frameState),
    particlePasses: getParticlePasses(frameState),
  };
}
