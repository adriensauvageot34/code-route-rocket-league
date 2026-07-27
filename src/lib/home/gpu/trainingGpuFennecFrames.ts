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

export type TrainingGpuFennecGroundAnchor = {
  x: number;
  groundY: number;
  pivot: {
    x: number;
    y: number;
  };
};

/** Wheel-contact centroid calibrated from the current base and effect frames. */
export const TRAINING_GPU_FENNEC_GROUND_ANCHOR = {
  x: 0.774,
  groundY: 0.835,
  pivot: {
    x: 0.52,
    y: 0.86,
  },
} as const satisfies TrainingGpuFennecGroundAnchor;
