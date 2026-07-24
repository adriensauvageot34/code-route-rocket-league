import type { TrainingGpuObjectId } from "@/lib/home/gpu/trainingGpuObjectTypes";

export const TRAINING_GPU_PREPARED_OBJECT_IDS = [
  "left-car",
  "back-right-car",
  "front-right-car",
  "ball",
] as const satisfies readonly TrainingGpuObjectId[];

export type TrainingGpuPreparedObjectId =
  (typeof TRAINING_GPU_PREPARED_OBJECT_IDS)[number];

export const TRAINING_GPU_OBJECT_MANIFEST_URLS = {
  "left-car": "/ui/training-objects/left-car/manifest.json",
  "back-right-car": "/ui/training-objects/back-right-car/manifest.json",
  "front-right-car": "/ui/training-objects/front-right-car/manifest.json",
  ball: "/ui/training-objects/ball/manifest.json",
} as const satisfies Record<TrainingGpuPreparedObjectId, `/ui/${string}`>;

export function isTrainingGpuPreparedObjectId(
  value: TrainingGpuObjectId,
): value is TrainingGpuPreparedObjectId {
  return (TRAINING_GPU_PREPARED_OBJECT_IDS as readonly TrainingGpuObjectId[]).includes(
    value,
  );
}
