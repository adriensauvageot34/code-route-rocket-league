"use client";

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
import type {
  TrainingGpuDebugResourceCounts,
  TrainingGpuDebugSnapshot,
  TrainingGpuDebugSubsystemName,
} from "@/lib/home/gpu/debug/trainingGpuDebugTypes";
import type { TrainingRendererMode } from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingRadarClock } from "@/lib/home/trainingRadarClock";

const PANEL_REFRESH_MS = 250;
const SUBSYSTEM_NAMES = [
  "bases",
  "radar",
  "particles",
  "volume",
  "fennec-base",
  "fennec-volume",
  "fennec-effects",
  "tactical",
] as const satisfies readonly TrainingGpuDebugSubsystemName[];

type TrainingGpuDebugPanelProps = {
  collector: TrainingGpuDebugCollector;
  illustrationActive: boolean;
  mode: TrainingRendererMode;
  radarClock: TrainingRadarClock;
  radarRunning: boolean;
};

function formatNumber(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.0";
}

function formatBytes(value: number) {
  if (value <= 0) return "0 B";
  const units = ["B", "KiB", "MiB", "GiB"];
  let amount = value;
  let unitIndex = 0;
  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }
  return `${amount.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function getSafeReportUrl() {
  const source = new URL(window.location.href);
  const safe = new URL(source.origin + source.pathname);
  for (const name of ["trainingRenderer", "debugRenderer"]) {
    const value = source.searchParams.get(name);
    if (value !== null) safe.searchParams.set(name, value);
  }
  return safe.href;
}

function createReport(snapshot: TrainingGpuDebugSnapshot) {
  return {
    createdAtLocal: new Date().toLocaleString(),
    createdAtIso: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    url: getSafeReportUrl(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    textureMemoryNote:
      "Approximation théorique: largeur × hauteur × 4 octets; ce n’est pas la mémoire GPU réelle.",
    ...snapshot,
  };
}

function ResourceLine({
  resources,
}: {
  resources: TrainingGpuDebugResourceCounts;
}) {
  return (
    <span>
      ctx {resources.contexts} · prog {resources.programs} · buf{" "}
      {resources.buffers} · VAO {resources.vertexArrays} · tex{" "}
      {resources.textures} · ≈ {formatBytes(resources.estimatedTextureBytes)}
    </span>
  );
}

export function TrainingGpuDebugPanel({
  collector,
  illustrationActive,
  mode,
  radarClock,
  radarRunning,
}: TrainingGpuDebugPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [fallbackJson, setFallbackJson] = useState("");
  const fallbackRef: RefObject<HTMLTextAreaElement | null> =
    useRef<HTMLTextAreaElement>(null);
  const [snapshot, setSnapshot] = useState(() => collector.getSnapshot());

  useEffect(() => {
    const refresh = () => {
      const clock = radarClock.sample(performance.now());
      collector.setGlobal({
        mode,
        illustrationActive,
        radarRunning,
        tabVisibility: document.visibilityState,
        passMode: clock.passMode,
        passProgress: clock.radarProgress,
        passKey: clock.passKey,
        masterClockNowMs: clock.nowMs,
      });
      setSnapshot(collector.getSnapshot());
    };

    refresh();
    const panelTimerId = window.setInterval(refresh, PANEL_REFRESH_MS);
    return () => {
      window.clearInterval(panelTimerId);
    };
  }, [collector, illustrationActive, mode, radarClock, radarRunning]);

  useEffect(() => {
    const supported =
      typeof PerformanceObserver !== "undefined" &&
      PerformanceObserver.supportedEntryTypes?.includes("longtask");
    collector.setLongTasksAvailable(Boolean(supported));
    if (!supported) return;

    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        collector.recordLongTask(entry.duration);
      }
    });
    longTaskObserver.observe({ type: "longtask", buffered: false });

    return () => {
      longTaskObserver.disconnect();
    };
  }, [collector]);

  useEffect(() => {
    if (fallbackJson) fallbackRef.current?.select();
  }, [fallbackJson]);

  const copyReport = async () => {
    const json = JSON.stringify(createReport(collector.getSnapshot()), null, 2);
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable.");
      }
      await navigator.clipboard.writeText(json);
      setFallbackJson("");
    } catch {
      setFallbackJson(json);
    }
  };

  if (collapsed) {
    return (
      <aside className="training-renderer-debug-panel is-collapsed">
        <button type="button" onClick={() => setCollapsed(false)}>
          Renderer debug
        </button>
      </aside>
    );
  }

  const frame = snapshot.frames;
  const global = snapshot.global;
  const assets = snapshot.assets;
  const longTasks = snapshot.longTasks;

  return (
    <aside
      aria-label="Diagnostic local du renderer Training"
      className="training-renderer-debug-panel"
    >
      <header>
        <strong>Training renderer</strong>
        <button type="button" onClick={() => setCollapsed(true)}>
          Réduire
        </button>
      </header>

      <section>
        <b>Global</b>
        <span>
          {global.mode.toUpperCase()} · renderer{" "}
          {global.rendererActive ? "actif" : "suspendu"} · RAF{" "}
          {global.rafActive ? "actif" : "arrêté"}
        </span>
        <span>
          illustration {global.illustrationActive ? "active" : "inactive"} ·
          radar {global.radarRunning ? "actif" : "arrêté"} · onglet{" "}
          {global.tabVisibility}
        </span>
        <span>
          passe {global.passMode} · {formatNumber(global.passProgress * 100, 1)}%
          · key {global.passKey} · clock{" "}
          {formatNumber(global.masterClockNowMs, 0)} ms
        </span>
        <span>
          DPR {formatNumber(global.dpr, 2)} · scale{" "}
          {formatNumber(global.renderScale, 2)} · CSS{" "}
          {formatNumber(global.viewportCssWidth, 0)}×
          {formatNumber(global.viewportCssHeight, 0)} · pixels{" "}
          {global.viewportPixelWidth}×{global.viewportPixelHeight}
        </span>
        <span>
          lifecycle {global.runtimeState} · contexte {global.contextState} ·
          resize {global.resizePending ? "pending" : "stable"} · génération{" "}
          {global.resizeGeneration}
        </span>
        <span>
          driver {global.activeDriver} · RAF Training{" "}
          {global.trainingRafCount} · timers globaux{" "}
          {global.globalTimersActive} · timers objets{" "}
          {global.objectTimersActive}
        </span>
        <span>
          pass start {formatNumber(global.passStartedAtMs, 0)} ms · index{" "}
          {global.absolutePassIndex} · prochaine frontière{" "}
          {formatNumber(global.nextPassBoundaryMs, 0)} ms
        </span>
        <span>
          callback +{formatNumber(global.callbackLatenessMs, 1)} ms · passes
          sautées {global.skippedPasses} · dérive théorique{" "}
          {formatNumber(global.cumulativeTheoreticalDriftMs, 1)} ms
        </span>
        <span>
          DOM updates/frame {formatNumber(global.domUpdatesPerFrame, 1)} ·
          valeurs modifiées/frame{" "}
          {formatNumber(global.domChangedValuesPerFrame, 1)}
        </span>
        <span>
          caméra {global.cameraSource} · phase {global.cameraPhase} ·
          événement {global.cameraSourceEvent}
        </span>
        <span>
          cam x {formatNumber(global.cameraX, 4)} · y{" "}
          {formatNumber(global.cameraY, 4)} · scale{" "}
          {formatNumber(global.cameraScale, 5)}
        </span>
        <span>
          cible {formatNumber(global.cameraTargetX, 4)} /{" "}
          {formatNumber(global.cameraTargetY, 4)} /{" "}
          {formatNumber(global.cameraTargetScale, 5)} · segment{" "}
          {formatNumber(global.cameraSegmentStartedAtMs, 0)} ms
        </span>
        <span>
          caméra{" "}
          {global.cameraStabilized ? "stabilisée" : "en mouvement"} · profil{" "}
          {global.cameraDepthProfile} · contacts{" "}
          {global.cameraContactsObserved}
        </span>
        <span>
          CSS {global.cameraCssWrites} écrites /{" "}
          {global.cameraCssWritesAvoided} évitées · GPU{" "}
          {global.cameraGpuUpdates} mises à jour /{" "}
          {global.cameraGpuUpdatesAvoided} évitées
        </span>
        <span>
          frames manquées {global.cameraMissedFrames} · reprise absolue{" "}
          {global.cameraAbsoluteResumeCorrect ? "oui" : "non"} · listeners
          pointeur {global.pointerListenersActive} · RAF parallaxe{" "}
          {global.additionalParallaxRafCount}
        </span>
        <span>
          canvases {global.canvasCount} · contextes {global.contextCount} ·
          draws {global.drawCallsPerFrame} · clears{" "}
          {global.clearCallsPerFrame}
        </span>
        <span>
          programmes/frame {global.programChangesPerFrame} · textures/frame{" "}
          {global.textureBindsPerFrame} · blends/frame{" "}
          {global.blendChangesPerFrame} · FBO/frame{" "}
          {global.framebufferChangesPerFrame}
        </span>
      </section>

      <section>
        <b>Frames ({frame.sampleCount})</b>
        <span>
          FPS lissé {formatNumber(frame.smoothedFps)} · moyen{" "}
          {formatNumber(frame.averageFps)}
        </span>
        <span>
          frame moy. {formatNumber(frame.averageFrameMs, 2)} ms · p95{" "}
          {formatNumber(frame.p95FrameMs, 2)} · max{" "}
          {formatNumber(frame.maximumFrameMs, 2)}
        </span>
        <span>
          &gt;20 {frame.over20Ms} · &gt;33 {frame.over33Ms} · &gt;50{" "}
          {frame.over50Ms}
        </span>
      </section>

      <section>
        <b>Sous-systèmes</b>
        {SUBSYSTEM_NAMES.map((name) => {
          const subsystem = snapshot.subsystems[name];
          return (
            <span key={name}>
              {name}: init {String(subsystem.initialized)} · prêt{" "}
              {String(subsystem.ready)} · contexte {subsystem.contextState} ·
              CPU {formatNumber(subsystem.lastCpuMs, 3)}/
              {formatNumber(subsystem.averageCpuMs, 3)} ms · restaurations{" "}
              {subsystem.contextRestorations}
              {name === "bases"
                ? ` · rendus statiques ${subsystem.staticRenders}`
                : ""}
              {subsystem.lastError ? ` · erreur: ${subsystem.lastError}` : ""}
            </span>
          );
        })}
      </section>

      <section>
        <b>Ressources</b>
        <ResourceLine resources={snapshot.resources} />
        {SUBSYSTEM_NAMES.map((name) => (
          <span key={name}>
            {name}:{" "}
            <ResourceLine resources={snapshot.subsystems[name].resources} />
          </span>
        ))}
        <small>
          Mémoire textures théorique = largeur × hauteur × 4 octets.
        </small>
      </section>

      <section>
        <b>Canvases</b>
        {SUBSYSTEM_NAMES.flatMap((name) =>
          snapshot.subsystems[name].canvases.map((canvas) => (
            <span key={canvas.id}>
              {canvas.id}: CSS {formatNumber(canvas.cssWidth, 0)}×
              {formatNumber(canvas.cssHeight, 0)} · pixels {canvas.pixelWidth}×
              {canvas.pixelHeight}
            </span>
          )),
        )}
      </section>

      <section>
        <b>Assets</b>
        <span>
          {assets.status} · manifests {assets.loadedManifests}/
          {assets.expectedManifests} · images {assets.loadedAssets}/
          {assets.expectedAssets} · erreurs{" "}
          {assets.manifestsInError + assets.assetsInError}
        </span>
        <span>
          manifests {formatNumber(assets.manifestLoadMs, 2)} ms · décodage{" "}
          {formatNumber(assets.imageDecodeMs, 2)} ms · uploads{" "}
          {formatNumber(assets.textureUploadMs, 2)} ms
        </span>
      </section>

      <section>
        <b>Long tasks</b>
        <span>
          {longTasks.available
            ? `${longTasks.count} · dernière ${formatNumber(
                longTasks.lastDurationMs,
                1,
              )} ms · max ${formatNumber(
                longTasks.maximumRecentMs,
                1,
              )} ms · somme ${formatNumber(longTasks.totalRecentMs, 1)} ms`
            : "indisponible"}
        </span>
      </section>

      <button type="button" onClick={copyReport}>
        Copier le rapport JSON
      </button>
      {fallbackJson ? (
        <textarea
          aria-label="Rapport JSON à copier manuellement"
          readOnly
          ref={fallbackRef}
          value={fallbackJson}
        />
      ) : null}
    </aside>
  );
}
