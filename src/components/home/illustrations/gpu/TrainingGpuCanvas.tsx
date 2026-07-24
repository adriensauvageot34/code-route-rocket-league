"use client";

import { useEffect, useRef, useState } from "react";
import { TrainingGpuRenderer } from "@/lib/home/gpu/TrainingGpuRenderer";
import {
  TRAINING_GPU_LOGICAL_HEIGHT,
  TRAINING_GPU_LOGICAL_WIDTH,
  TRAINING_GPU_MAX_DPR,
  TRAINING_GPU_RENDER_SCALE,
} from "@/lib/home/gpu/trainingGpuConstants";
import type { TrainingGpuFrameState } from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingRadarClock } from "@/lib/home/trainingRadarClock";

type TrainingGpuCanvasProps = {
  active: boolean;
  radarClock: TrainingRadarClock;
  running: boolean;
};

type TrainingGpuLifecycleState = Pick<
  TrainingGpuFrameState,
  "active" | "running"
>;

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
  radarClock,
  running,
}: TrainingGpuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lifecycleRef = useRef<TrainingGpuLifecycleState>({
    active,
    running,
  });
  const rendererRef = useRef<TrainingGpuRenderer | null>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);

  lifecycleRef.current = { active, running };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new TrainingGpuRenderer(canvas, (nowMs) =>
      createGpuFrameState(lifecycleRef.current, radarClock, nowMs),
    );

    if (!renderer.available) {
      renderer.destroy();
      setContextUnavailable(true);
      return;
    }

    rendererRef.current = renderer;

    const resizeCanvas = () => {
      const { width: cssWidth, height: cssHeight } =
        canvas.getBoundingClientRect();

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

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    resizeCanvas();

    const frameState = createGpuFrameState(
      lifecycleRef.current,
      radarClock,
      0,
    );
    renderer.setFrameState(frameState);

    if (frameState.active && frameState.running) {
      renderer.start();
    }

    return () => {
      resizeObserver.disconnect();
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [radarClock]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const frameState = createGpuFrameState(
      lifecycleRef.current,
      radarClock,
      0,
    );
    renderer.setFrameState(frameState);

    if (active && running) {
      renderer.start();
    } else {
      renderer.stop();
    }
  }, [active, radarClock, running]);

  if (contextUnavailable) return null;

  return (
    <canvas
      aria-hidden="true"
      className="training-gpu-canvas"
      ref={canvasRef}
    />
  );
}
