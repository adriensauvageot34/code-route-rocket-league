export type TrainingRendererMode = "dom" | "gpu";

export type TrainingGpuPassMode = "volume" | "tactical";

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
  passMode: TrainingGpuPassMode;
  nowMs: number;
  passElapsedMs: number;
  radarProgress: number;
};
