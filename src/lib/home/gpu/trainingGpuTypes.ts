import type { TrainingRadarPassMode } from "@/lib/home/trainingRadarClock";

export type TrainingRendererMode = "dom" | "gpu";

export type { TrainingRadarPassMode };

export type TrainingGpuViewport = {
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  effectiveDpr: number;
  logicalWidth: number;
  logicalHeight: number;
  renderScale: number;
};

export type TrainingGpuFrameState = {
  active: boolean;
  running: boolean;
  passKey: number;
  passMode: TrainingRadarPassMode;
  passStartedAtMs: number;
  nowMs: number;
  elapsedMs: number;
  radarProgress: number;
  passDurationMs: number;
};
