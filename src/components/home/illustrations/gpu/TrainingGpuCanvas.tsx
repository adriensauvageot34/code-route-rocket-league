"use client";

import { useEffect, useRef } from "react";
import { SceneGroup } from "@/components/home/illustrations/SceneGroup";
import { TrainingGpuConsolidatedRenderer } from "@/lib/home/gpu/TrainingGpuConsolidatedRenderer";
import {
  createTrainingGpuRadarFieldMask,
  loadTrainingGpuRadarTerrain,
} from "@/lib/home/gpu/trainingGpuRadarAssets";
import {
  TRAINING_GPU_LOGICAL_HEIGHT,
  TRAINING_GPU_LOGICAL_WIDTH,
  TRAINING_GPU_MAX_DPR,
  TRAINING_GPU_RENDER_SCALE,
} from "@/lib/home/gpu/trainingGpuConstants";
import type { TrainingGpuFrameState } from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingGpuLifecycleSnapshot } from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
import type { TrainingGpuPreparedObjectId } from "@/lib/home/gpu/trainingGpuObjectAssetCatalog";
import type { TrainingGpuDecodedObjectAssetSet } from "@/lib/home/gpu/TrainingGpuObjectAssetLoader";
import type { TrainingRadarClock } from "@/lib/home/trainingRadarClock";
import type { TrainingCameraFrameApplier } from "@/lib/home/trainingCamera";
import {
  createTrainingRadarFrameState,
  type TrainingRadarTemporalSnapshot,
} from "@/lib/home/trainingRadarSnapshots";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";

type TrainingGpuCanvasProps = {
  active: boolean;
  applyCameraSnapshot: TrainingCameraFrameApplier;
  applyDomSnapshot:
    | ((snapshot: TrainingRadarTemporalSnapshot) => void)
    | null;
  debugCollector: TrainingGpuDebugCollector | null;
  onBasesReadyChange: (ready: boolean) => void;
  onCriticalErrorChange: (error: boolean) => void;
  onFennecBaseReadyChange: (ready: boolean) => void;
  onFennecEffectsReadyChange: (ready: boolean) => void;
  onFennecVolumeReadyChange: (ready: boolean) => void;
  onLifecycleStateChange: (state: TrainingGpuLifecycleSnapshot) => void;
  onParticlesReadyChange: (ready: boolean) => void;
  onRadarReadyChange: (ready: boolean) => void;
  onVolumeScansReadyChange: (ready: boolean) => void;
  onTacticalReadyChange: (ready: boolean) => void;
  onResizePendingChange: (pending: boolean) => void;
  radarClock: TrainingRadarClock;
  running: boolean;
  volumeAssets: Partial<
    Record<TrainingGpuPreparedObjectId, TrainingGpuDecodedObjectAssetSet>
  > | null;
};

type TrainingGpuLifecycleState = Pick<
  TrainingGpuFrameState,
  "active" | "running"
>;

type TrainingGpuConsolidatedCanvases = ConstructorParameters<
  typeof TrainingGpuConsolidatedRenderer
>[0];

const tacticalTerrainAsset =
  homeIllustrationAssets.training.tacticalTerrain;

function createGpuFrameState(
  lifecycle: TrainingGpuLifecycleState,
  radarClock: TrainingRadarClock,
  nowMs: number,
): TrainingGpuFrameState {
  const clockSnapshot = radarClock.sample(nowMs);
  return createTrainingRadarFrameState(
    lifecycle.active,
    lifecycle.running,
    clockSnapshot,
  );
}

export function TrainingGpuCanvas({
  active,
  applyCameraSnapshot,
  applyDomSnapshot,
  debugCollector,
  onBasesReadyChange,
  onCriticalErrorChange,
  onFennecBaseReadyChange,
  onFennecEffectsReadyChange,
  onFennecVolumeReadyChange,
  onLifecycleStateChange,
  onParticlesReadyChange,
  onRadarReadyChange,
  onVolumeScansReadyChange,
  onTacticalReadyChange,
  onResizePendingChange,
  radarClock,
  running,
  volumeAssets,
}: TrainingGpuCanvasProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const surfaceCanvasRef = useRef<HTMLCanvasElement>(null);
  const sweepCanvasRef = useRef<HTMLCanvasElement>(null);
  const sceneCanvasRef = useRef<HTMLCanvasElement>(null);
  const lifecycleRef = useRef<TrainingGpuLifecycleState>({
    active,
    running,
  });
  const rendererRef =
    useRef<TrainingGpuConsolidatedRenderer | null>(null);
  const volumeAssetsRef = useRef(volumeAssets);

  lifecycleRef.current = { active, running };
  volumeAssetsRef.current = volumeAssets;

  useEffect(() => {
    const stack = stackRef.current;
    const surfaceCanvas = surfaceCanvasRef.current;
    const sweepCanvas = sweepCanvasRef.current;
    const sceneCanvas = sceneCanvasRef.current;
    if (!stack || !surfaceCanvas || !sweepCanvas || !sceneCanvas) {
      return;
    }

    const stackElement: HTMLDivElement = stack;
    const canvases: TrainingGpuConsolidatedCanvases = {
      radar: {
        surface: surfaceCanvas,
        sweep: sweepCanvas,
      },
      scene: sceneCanvas,
    };

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let resizeFrameId: number | null = null;
    let resizePending = false;
    let resizeGeneration = 0;
    let lastViewportSignature = "";
    let dprQuery: MediaQueryList | null = null;
    let removeResizeSignals: (() => void) | null = null;
    const setResizePending = (pending: boolean) => {
      if (resizePending === pending) return;
      resizePending = pending;
      onResizePendingChange(pending);
    };
    const resetReadiness = () => {
      onCriticalErrorChange(false);
      onBasesReadyChange(false);
      onFennecBaseReadyChange(false);
      onFennecEffectsReadyChange(false);
      onFennecVolumeReadyChange(false);
      onRadarReadyChange(false);
      onParticlesReadyChange(false);
      onVolumeScansReadyChange(false);
      onTacticalReadyChange(false);
    };
    resetReadiness();

    async function initializeRenderer() {
      try {
        let fieldMaskPixels: Uint8Array | null = null;
        let terrainImage: TexImageSource | null = null;
        let radarPreparationFailed = false;
        try {
          fieldMaskPixels = createTrainingGpuRadarFieldMask();
          terrainImage =
            await loadTrainingGpuRadarTerrain(tacticalTerrainAsset);
        } catch {
          fieldMaskPixels = null;
          terrainImage = null;
          radarPreparationFailed = true;
        }
        if (cancelled) return;

        const renderer = new TrainingGpuConsolidatedRenderer(
          canvases,
          {
            applyCameraSnapshot,
            applyDomSnapshot,
            createFrameState: (nowMs) =>
              createGpuFrameState(
                lifecycleRef.current,
                radarClock,
                nowMs,
              ),
            debugCollector,
            fieldMaskPixels,
            onBasesReadyChange,
            onFennecBaseReadyChange,
            onFennecEffectsReadyChange,
            onFennecVolumeReadyChange,
            onLifecycleStateChange,
            onParticlesReadyChange,
            onRadarReadyChange,
            onVolumeScansReadyChange,
            onTacticalReadyChange,
            terrainImage,
          },
        );
        rendererRef.current = renderer;

        const applyResize = () => {
          resizeFrameId = null;
          if (cancelled || document.visibilityState !== "visible") return;
          const { width: cssWidth, height: cssHeight } =
            stackElement.getBoundingClientRect();
          if (
            !Number.isFinite(cssWidth) ||
            !Number.isFinite(cssHeight) ||
            cssWidth <= 0 ||
            cssHeight <= 0
          ) {
            setResizePending(true);
            return;
          }
          const effectiveDpr = Math.min(
            window.devicePixelRatio || 1,
            TRAINING_GPU_MAX_DPR,
          );
          const viewport = {
            cssWidth,
            cssHeight,
            pixelWidth: Math.round(cssWidth * effectiveDpr),
            pixelHeight: Math.round(cssHeight * effectiveDpr),
            effectiveDpr,
            logicalWidth: TRAINING_GPU_LOGICAL_WIDTH,
            logicalHeight: TRAINING_GPU_LOGICAL_HEIGHT,
            renderScale: TRAINING_GPU_RENDER_SCALE,
          };
          const signature = [
            viewport.cssWidth,
            viewport.cssHeight,
            viewport.pixelWidth,
            viewport.pixelHeight,
            viewport.effectiveDpr,
            viewport.renderScale,
          ].join(":");
          if (signature !== lastViewportSignature) {
            lastViewportSignature = signature;
            resizeGeneration += 1;
            renderer.resize(viewport);
            debugCollector?.setGlobal({ resizeGeneration });
          }
          setResizePending(false);
        };
        const scheduleResize = () => {
          if (cancelled) return;
          setResizePending(true);
          if (
            resizeFrameId === null &&
            document.visibilityState === "visible"
          ) {
            resizeFrameId = window.requestAnimationFrame(applyResize);
          }
        };
        const registerDprQuery = () => {
          dprQuery?.removeEventListener("change", handleDprChange);
          dprQuery = window.matchMedia(
            `(resolution: ${window.devicePixelRatio || 1}dppx)`,
          );
          dprQuery.addEventListener("change", handleDprChange);
        };
        const handleDprChange = () => {
          registerDprQuery();
          scheduleResize();
        };
        const handleVisibilityChange = () => {
          if (document.visibilityState !== "visible") {
            if (resizeFrameId !== null) {
              window.cancelAnimationFrame(resizeFrameId);
              resizeFrameId = null;
            }
            setResizePending(true);
            return;
          }
          scheduleResize();
        };
        resizeObserver = new ResizeObserver(scheduleResize);
        resizeObserver.observe(stackElement);
        window.addEventListener("resize", scheduleResize);
        window.addEventListener("orientationchange", scheduleResize);
        window.visualViewport?.addEventListener("resize", scheduleResize);
        document.addEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        registerDprQuery();
        removeResizeSignals = () => {
          window.removeEventListener("resize", scheduleResize);
          window.removeEventListener("orientationchange", scheduleResize);
          window.visualViewport?.removeEventListener(
            "resize",
            scheduleResize,
          );
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
          );
          dprQuery?.removeEventListener("change", handleDprChange);
          dprQuery = null;
          if (resizeFrameId !== null) {
            window.cancelAnimationFrame(resizeFrameId);
            resizeFrameId = null;
          }
        };
        applyResize();

        renderer.setFrameState(
          createGpuFrameState(lifecycleRef.current, radarClock, 0),
        );
        if (!renderer.initialize()) {
          resizeObserver.disconnect();
          resizeObserver = null;
          removeResizeSignals();
          removeResizeSignals = null;
          renderer.destroy();
          rendererRef.current = null;
          resetReadiness();
          onCriticalErrorChange(true);
          return;
        }
        renderer.setVolumeAssets(volumeAssetsRef.current);
        if (
          document.visibilityState === "visible" &&
          (radarPreparationFailed ||
            !renderer.isRadarReadyForStartup() ||
            (volumeAssetsRef.current !== null &&
              !renderer.hasCriticalSceneResourcesForStartup()))
        ) {
          onCriticalErrorChange(true);
        }
        if (lifecycleRef.current.active && lifecycleRef.current.running) {
          renderer.start();
        }
      } catch {
        resizeObserver?.disconnect();
        resizeObserver = null;
        removeResizeSignals?.();
        removeResizeSignals = null;
        rendererRef.current?.destroy();
        rendererRef.current = null;
        if (!cancelled) {
          resetReadiness();
          onCriticalErrorChange(true);
        }
      }
    }

    void initializeRenderer();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      removeResizeSignals?.();
      rendererRef.current?.destroy();
      rendererRef.current = null;
      resetReadiness();
    };
  }, [
    applyCameraSnapshot,
    applyDomSnapshot,
    debugCollector,
    onBasesReadyChange,
    onCriticalErrorChange,
    onFennecBaseReadyChange,
    onFennecEffectsReadyChange,
    onFennecVolumeReadyChange,
    onLifecycleStateChange,
    onParticlesReadyChange,
    onRadarReadyChange,
    onTacticalReadyChange,
    onResizePendingChange,
    onVolumeScansReadyChange,
    radarClock,
  ]);

  useEffect(() => {
    const renderer = rendererRef.current;
    renderer?.setVolumeAssets(volumeAssets);
    if (
      renderer &&
      volumeAssets !== null &&
      !renderer.hasCriticalSceneResourcesForStartup()
    ) {
      onCriticalErrorChange(true);
    }
  }, [onCriticalErrorChange, volumeAssets]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setFrameState(
      createGpuFrameState(lifecycleRef.current, radarClock, 0),
    );
    if (active && running) renderer.start();
    else renderer.stop();
  }, [active, radarClock, running]);

  return (
    <>
      <SceneGroup
        depth="trainingGround"
        layer={6}
        name="training-radar-gpu"
      >
        <div
          aria-hidden="true"
          className="training-gpu-radar-stack"
          ref={stackRef}
        >
          <canvas
            aria-hidden="true"
            className="training-gpu-canvas training-gpu-radar-surface"
            ref={surfaceCanvasRef}
          />
          <canvas
            aria-hidden="true"
            className="training-gpu-canvas training-gpu-radar-sweep"
            ref={sweepCanvasRef}
          />
        </div>
      </SceneGroup>
      <div
        aria-hidden="true"
        className="training-gpu-scene-layer"
        data-scene-group="training-gpu-consolidated-scene"
      >
        <canvas
          aria-hidden="true"
          className="training-gpu-canvas training-gpu-scene-canvas"
          ref={sceneCanvasRef}
        />
      </div>
    </>
  );
}
