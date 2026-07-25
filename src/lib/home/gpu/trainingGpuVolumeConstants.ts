export type TrainingGpuVolumeLayer = "surface" | "contour";

export type TrainingGpuVolumeStyleKeyframe = {
  progress: number;
  opacity: number;
  brightness: number;
  saturation: number;
};

export const TRAINING_GPU_VOLUME_CAR_MASK = {
  startCenterX: 1.3,
  endCenterX: -0.3,
  scaleX: 2.2,
  scaleY: 1.7,
} as const;

export const TRAINING_GPU_VOLUME_BALL_MASK = {
  startCenterX: 0.88,
  endCenterX: 0.12,
  scaleX: 2.2,
  scaleY: 1,
} as const;

export const TRAINING_GPU_VOLUME_BALL_TRANSFORMS = {
  surface: {
    scaleX: 0.4,
    scaleY: 0.415,
    translateXPercent: 0.48,
    translateYPercent: -3.3,
  },
  contour: {
    scaleX: 0.375,
    scaleY: 0.385,
    translateXPercent: 0.48,
    translateYPercent: -3.15,
  },
} as const;

export const TRAINING_GPU_VOLUME_STYLE_KEYFRAMES = {
  car: {
    surface: [
      { progress: 0, opacity: 0.18, brightness: 1.18, saturation: 1.28 },
      { progress: 0.18, opacity: 0.3, brightness: 1.18, saturation: 1.28 },
      { progress: 0.72, opacity: 0.34, brightness: 1.18, saturation: 1.28 },
      { progress: 1, opacity: 0.22, brightness: 1.18, saturation: 1.28 },
    ],
    contour: [
      { progress: 0, opacity: 0.12, brightness: 1.3, saturation: 1.34 },
      { progress: 0.2, opacity: 0.24, brightness: 1.3, saturation: 1.34 },
      { progress: 0.62, opacity: 0.3, brightness: 1.3, saturation: 1.34 },
      { progress: 1, opacity: 0.14, brightness: 1.3, saturation: 1.34 },
    ],
  },
  ball: {
    surface: [
      { progress: 0, opacity: 0.3, brightness: 1, saturation: 1 },
      { progress: 0.18, opacity: 0.68, brightness: 1.3, saturation: 1.24 },
      {
        progress: 0.72,
        opacity: 0.42,
        brightness: 1.1288,
        saturation: 1.1083,
      },
      { progress: 1, opacity: 0.32, brightness: 1.04, saturation: 1.04 },
    ],
    contour: [
      { progress: 0, opacity: 0.18, brightness: 1.28, saturation: 1.3 },
      { progress: 0.2, opacity: 0.58, brightness: 1.28, saturation: 1.3 },
      { progress: 0.66, opacity: 0.4, brightness: 1.28, saturation: 1.3 },
      { progress: 1, opacity: 0.2, brightness: 1.28, saturation: 1.3 },
    ],
  },
} as const satisfies Record<
  "car" | "ball",
  Record<TrainingGpuVolumeLayer, readonly TrainingGpuVolumeStyleKeyframe[]>
>;
