"use client";

import { useEffect, useRef, useState } from "react";
import { TrainingGpuRenderer } from "@/lib/home/gpu/TrainingGpuRenderer";
import {
  TRAINING_GPU_LOGICAL_HEIGHT,
  TRAINING_GPU_LOGICAL_WIDTH,
  TRAINING_GPU_MAX_DPR,
  TRAINING_GPU_RENDER_SCALE,
} from "@/lib/home/gpu/trainingGpuConstants";
import type {
  TrainingGpuFrameState,
  TrainingGpuPassMode,
} from "@/lib/home/gpu/trainingGpuTypes";
import { TRAINING_RADAR_TIMING } from "@/lib/home/trainingRadarTargets";

type TrainingGpuCanvasProps = {
  active: boolean;
  passKey: number;
  passMode: TrainingGpuPassMode;
  running: boolean;
};

type TrainingGpuInputState = Pick<
  TrainingGpuFrameState,
  "active" | "passKey" | "passMode" | "running"
>;

function createGpuFrameState(
  input: TrainingGpuInputState,
  passStartedAtMs: number,
  nowMs: number,
): TrainingGpuFrameState {
  const passElapsedMs = Math.max(0, nowMs - passStartedAtMs);
  const radarProgress = Math.min(
    1,
    passElapsedMs / TRAINING_RADAR_TIMING.passDurationMs,
  );

  return {
    ...input,
    nowMs,
    passElapsedMs,
    radarProgress,
  };
}

export function TrainingGpuCanvas({
  active,
  passKey,
  passMode,
  running,
}: TrainingGpuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<TrainingGpuInputState>({
    active,
    passKey,
    passMode,
    running,
  });
  const lastPassKeyRef = useRef(passKey);
  const passStartedAtMsRef = useRef(0);
  const rendererRef = useRef<TrainingGpuRenderer | null>(null);
  const [contextUnavailable, setContextUnavailable] = useState(false);

  inputRef.current = { active, passKey, passMode, running };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initialNowMs = performance.now();
    passStartedAtMsRef.current = initialNowMs;
    lastPassKeyRef.current = passKey;

    const renderer = new TrainingGpuRenderer(canvas, (nowMs) =>
      createGpuFrameState(inputRef.current, passStartedAtMsRef.current, nowMs),
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
      inputRef.current,
      passStartedAtMsRef.current,
      initialNowMs,
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
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const nowMs = performance.now();

    if (lastPassKeyRef.current !== passKey) {
      lastPassKeyRef.current = passKey;
      passStartedAtMsRef.current = nowMs;
    }

    renderer.setFrameState(
      createGpuFrameState(inputRef.current, passStartedAtMsRef.current, nowMs),
    );

    if (active && running) {
      renderer.start();
    } else {
      renderer.stop();
    }
  }, [active, passKey, passMode, running]);

  if (contextUnavailable) return null;

  return (
    <canvas
      aria-hidden="true"
      className="training-gpu-canvas"
      ref={canvasRef}
    />
  );
}
