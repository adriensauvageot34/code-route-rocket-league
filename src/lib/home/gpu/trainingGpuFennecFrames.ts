export type TrainingGpuObjectFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const TRAINING_GPU_FENNEC_SURFACE_FRAME = {
  left: 15.8085,
  top: 6.1722,
  width: 80.4954,
  height: 88.9024,
} as const satisfies TrainingGpuObjectFrame;

export const TRAINING_GPU_FENNEC_IMPACT_FRAME = {
  left: 39.8085,
  top: 35.1722,
  width: 56.4954,
  height: 58,
} as const satisfies TrainingGpuObjectFrame;
