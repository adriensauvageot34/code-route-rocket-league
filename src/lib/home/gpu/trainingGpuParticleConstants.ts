import type {
  TrainingParticleKind,
  TrainingParticlePresetName,
} from "@/lib/home/trainingParticlePresets";

export type TrainingGpuParticleDepth = TrainingParticlePresetName;

export const TRAINING_GPU_PARTICLE_DEPTHS = [
  "far",
  "mid",
  "near",
] as const satisfies readonly TrainingGpuParticleDepth[];

export const TRAINING_GPU_PARTICLE_COMPONENT = {
  core: 0,
  birthFlash: 1,
  fragment: 2,
} as const;

export const TRAINING_GPU_PARTICLE_KIND: Record<TrainingParticleKind, number> = {
  "violet-dust": 0,
  "gold-dot": 1,
  "tactical-spark": 2,
};

export const TRAINING_GPU_PARTICLE_COLORS = {
  violetDust: [160, 104, 248],
  goldDot: [241, 181, 83],
  tacticalSpark: [215, 158, 255],
  tacticalPurple: [137, 79, 211],
  warmWhite: [255, 238, 196],
} as const;

export const TRAINING_GPU_PARTICLE_PROPORTIONS = {
  core: 1,
  tacticalSparkWidth: 1.9,
  tacticalSparkHeight: 0.32,
  fragment: 0.35,
  birthFlashWidth: 2.4,
  birthFlashMinimumWidth: 4,
  minimumThinDimension: 1,
} as const;

export const TRAINING_GPU_PARTICLE_KEYFRAMES = {
  core: [0, 0.06, 0.24, 0.64, 1],
  birthFlash: [0, 0.05, 0.16, 1],
  fragment: [0, 0.08, 0.6, 1],
} as const;

export const TRAINING_GPU_PARTICLE_EASING = {
  core: [0.16, 0.74, 0.22, 1],
  fragment: [0.2, 0.7, 0.2, 1],
} as const;

export const TRAINING_GPU_PARTICLE_TERRAIN_ALPHA_STOPS = [
  [0, 0],
  [0.44, 0],
  [0.47, 0.22],
  [0.6, 0.5],
  [0.73, 0.78],
  [0.86, 0.94],
  [1, 1],
] as const;

export const TRAINING_GPU_PARTICLE_TERRAIN_TOP_STOPS = [
  [0.03, 0.442],
  [0.22, 0.448],
  [0.4, 0.443],
  [0.5, 0.441],
  [0.65, 0.439],
  [0.82, 0.447],
  [0.97, 0.442],
] as const;

export const TRAINING_GPU_PARTICLE_DEPTH_BANDS = {
  far: [
    [0.03, 0.445],
    [0.97, 0.445],
    [0.98, 0.57],
    [0.02, 0.57],
  ],
  mid: [
    [0.024, 0.52],
    [0.976, 0.52],
    [0.992, 0.775],
    [0.008, 0.775],
  ],
  near: [
    [0.01, 0.675],
    [0.99, 0.675],
    [1, 1],
    [0, 1],
  ],
} as const;

export const TRAINING_GPU_PARTICLE_PASS_CAPACITY = 2;
export const TRAINING_GPU_PARTICLE_COMPONENTS_PER_PARTICLE = 3;
export const TRAINING_GPU_PARTICLE_INSTANCE_FLOATS = 14;
