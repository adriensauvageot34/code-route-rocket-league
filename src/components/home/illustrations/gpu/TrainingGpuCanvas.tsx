"use client";

import { useEffect, useRef } from "react";
import { SceneGroup } from "@/components/home/illustrations/SceneGroup";
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
  onParticlesReadyChange: (ready: boolean) => void;
  onRadarReadyChange: (ready: boolean) => void;
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
  onParticlesReadyChange,
  onRadarReadyChange,
  radarClock,
  running,
}: TrainingGpuCanvasProps) {
  const stackRef = useRef<HTMLDivElement>(null);
  const surfaceCanvasRef = useRef<HTMLCanvasElement>(null);
  const sweepCanvasRef = useRef<HTMLCanvasElement>(null);
  const farParticlesCanvasRef = useRef<HTMLCanvasElement>(null);
  const midParticlesCanvasRef = useRef<HTMLCanvasElement>(null);
  const nearParticlesCanvasRef = useRef<HTMLCanvasElement>(null);
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
    const farParticlesCanvas = farParticlesCanvasRef.current;
    const midParticlesCanvas = midParticlesCanvasRef.current;
    const nearParticlesCanvas = nearParticlesCanvasRef.current;
    if (
      !stack ||
      !surfaceCanvas ||
      !sweepCanvas ||
      !farParticlesCanvas ||
      !midParticlesCanvas ||
      !nearParticlesCanvas
    ) {
      return;
    }

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    onRadarReadyChange(false);
    onParticlesReadyChange(false);

    async function initializeRenderer() {
      try {
        let fieldMaskPixels: Uint8Array | null = null;
        let terrainImage: HTMLImageElement | null = null;

        try {
          fieldMaskPixels = createTrainingGpuRadarFieldMask();
          terrainImage =
            await loadTrainingGpuRadarTerrain(tacticalTerrainPath);
        } catch {
          fieldMaskPixels = null;
          terrainImage = null;
        }

        if (cancelled) return;

        const renderer = new TrainingGpuRenderer(
          {
            particles: {
              far: farParticlesCanvas,
              mid: midParticlesCanvas,
              near: nearParticlesCanvas,
            },
            radar: {
              surface: surfaceCanvas,
              sweep: sweepCanvas,
            },
          },
          {
            createFrameState: (nowMs) =>
              createGpuFrameState(
                lifecycleRef.current,
                radarClock,
                nowMs,
              ),
            fieldMaskPixels,
            onParticlesReadyChange,
            onRadarReadyChange,
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

        if (!renderer.initialize()) {
          resizeObserver.disconnect();
          resizeObserver = null;
          renderer.destroy();
          rendererRef.current = null;
          onRadarReadyChange(false);
          onParticlesReadyChange(false);
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
        if (!cancelled) {
          onRadarReadyChange(false);
          onParticlesReadyChange(false);
        }
      }
    }

    void initializeRenderer();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      rendererRef.current?.destroy();
      rendererRef.current = null;
      onRadarReadyChange(false);
      onParticlesReadyChange(false);
    };
  }, [
    onParticlesReadyChange,
    onRadarReadyChange,
    radarClock,
  ]);

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
    <>
      <SceneGroup depth="trainingGround" layer={6} name="training-radar-gpu">
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

      <SceneGroup
        blendMode="screen"
        depth="trainingParticlesFar"
        layer={9}
        name="training-particles-gpu-far"
      >
        <canvas
          aria-hidden="true"
          className="training-gpu-canvas training-gpu-particle-canvas training-gpu-particles-far"
          ref={farParticlesCanvasRef}
        />
      </SceneGroup>

      <SceneGroup
        blendMode="screen"
        depth="trainingParticlesMid"
        layer={11}
        name="training-particles-gpu-mid"
      >
        <canvas
          aria-hidden="true"
          className="training-gpu-canvas training-gpu-particle-canvas training-gpu-particles-mid"
          ref={midParticlesCanvasRef}
        />
      </SceneGroup>

      <SceneGroup
        blendMode="screen"
        depth="trainingParticlesNear"
        layer={15}
        name="training-particles-gpu-near"
      >
        <canvas
          aria-hidden="true"
          className="training-gpu-canvas training-gpu-particle-canvas training-gpu-particles-near"
          ref={nearParticlesCanvasRef}
        />
      </SceneGroup>
    </>
  );
}
