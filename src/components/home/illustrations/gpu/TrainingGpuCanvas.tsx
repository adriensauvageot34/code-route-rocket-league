"use client";

import { useEffect, useRef } from "react";
import { TrainingGpuRenderer } from "@/lib/home/gpu/TrainingGpuRenderer";
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
import type { TrainingRadarClock } from "@/lib/home/trainingRadarClock";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";

type TrainingGpuCanvasProps = {
  active: boolean;
  onReadyChange: (ready: boolean) => void;
  radarClock: TrainingRadarClock;
  running: boolean;
};

type TrainingGpuLifecycleState = Pick<
  TrainingGpuFrameState,
  "active" | "running"
>;

const tacticalTerrainPath =
  homeIllustrationAssets.training.tacticalTerrain.path;

function createGpuFrameState(
  lifecycle: TrainingGpuLifecycleState,
  radarClock: TrainingRadarClock,
  nowMs: number,
): TrainingGpuFrameState {
  const clockSnapshot = radarClock.sample(nowMs);

  return {
    ...clockSnapshot,
    active: lifecycle.active,
    running: lifecycle.running && clockSnapshot.running,
  };
}

export function TrainingGpuCanvas({
  active,
  onReadyChange,
  radarClock,
  running,
}: TrainingGpuCanvasProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const surfaceCanvasRef = useRef<HTMLCanvasElement>(null);
  const sweepCanvasRef = useRef<HTMLCanvasElement>(null);
  const lifecycleRef = useRef<TrainingGpuLifecycleState>({
    active,
    running,
  });
  const rendererRef = useRef<TrainingGpuRenderer | null>(null);

  lifecycleRef.current = { active, running };

  useEffect(() => {
    const stack = stackRef.current;
    const surfaceCanvas = surfaceCanvasRef.current;
    const sweepCanvas = sweepCanvasRef.current;
    if (!stack || !surfaceCanvas || !sweepCanvas) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    onReadyChange(false);

    async function initializeRenderer() {
      try {
        const fieldMaskPixels = createTrainingGpuRadarFieldMask();
        const terrainImage =
          await loadTrainingGpuRadarTerrain(tacticalTerrainPath);

        if (cancelled) return;

        const renderer = new TrainingGpuRenderer(
          {
            surface: surfaceCanvas,
            sweep: sweepCanvas,
          },
          {
            createFrameState: (nowMs) =>
              createGpuFrameState(
                lifecycleRef.current,
                radarClock,
                nowMs,
              ),
            fieldMaskPixels,
            onReadyChange,
            terrainImage,
          },
        );
        rendererRef.current = renderer;

        const resizeCanvases = () => {
          const { width: cssWidth, height: cssHeight } =
            stack.getBoundingClientRect();

          if (
            !Number.isFinite(cssWidth) ||
            !Number.isFinite(cssHeight) ||
            cssWidth <= 0 ||
            cssHeight <= 0
          ) {
            return;
          }

          const effectiveDpr = Math.min(
            window.devicePixelRatio || 1,
            TRAINING_GPU_MAX_DPR,
          );
          const pixelWidth = Math.round(cssWidth * effectiveDpr);
          const pixelHeight = Math.round(cssHeight * effectiveDpr);

          renderer.resize({
            cssWidth,
            cssHeight,
            pixelWidth,
            pixelHeight,
            effectiveDpr,
            logicalWidth: TRAINING_GPU_LOGICAL_WIDTH,
            logicalHeight: TRAINING_GPU_LOGICAL_HEIGHT,
            renderScale: TRAINING_GPU_RENDER_SCALE,
          });
        };

        resizeObserver = new ResizeObserver(resizeCanvases);
        resizeObserver.observe(stack);
        resizeCanvases();

        renderer.setFrameState(
          createGpuFrameState(lifecycleRef.current, radarClock, 0),
        );

        if (!renderer.available || !renderer.initialize()) {
          resizeObserver.disconnect();
          resizeObserver = null;
          renderer.destroy();
          rendererRef.current = null;
          onReadyChange(false);
          return;
        }

        if (lifecycleRef.current.active && lifecycleRef.current.running) {
          renderer.start();
        }
      } catch {
        resizeObserver?.disconnect();
        resizeObserver = null;
        rendererRef.current?.destroy();
        rendererRef.current = null;
        if (!cancelled) onReadyChange(false);
      }
    }

    void initializeRenderer();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      rendererRef.current?.destroy();
      rendererRef.current = null;
      onReadyChange(false);
    };
  }, [onReadyChange, radarClock]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.setFrameState(
      createGpuFrameState(lifecycleRef.current, radarClock, 0),
    );

    if (active && running) {
      renderer.start();
    } else {
      renderer.stop();
    }
  }, [active, radarClock, running]);

  return (
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
  );
}
