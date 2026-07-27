import {
  trainingBallRadarTarget,
  trainingCarRadarTargets,
  trainingFennecVolumeScanTarget,
  type TrainingCarRadarTarget,
} from "@/lib/home/trainingRadarTargets";
import type {
  TrainingGpuObjectAssetRole,
  TrainingGpuObjectId,
  TrainingGpuObjectKind,
  TrainingGpuObjectRegistration,
} from "@/lib/home/gpu/trainingGpuObjectTypes";

const CAR_ASSET_ROLES = [
  "base",
  "volumeSurface",
  "volumeContour",
  "tacticalWireframe",
  "tacticalGlow",
] as const satisfies readonly TrainingGpuObjectAssetRole[];

const BALL_ASSET_ROLES = [
  "base",
  "volumeSurface",
  "volumeContour",
  "tacticalEnergy",
] as const satisfies readonly TrainingGpuObjectAssetRole[];

const FENNEC_ASSET_ROLES = [
  "base",
  "volumeSurface",
  "volumeContour",
  "tacticalImpact",
  "headlightGlow",
  "rearAccent",
] as const satisfies readonly TrainingGpuObjectAssetRole[];

export const TRAINING_GPU_OBJECT_REQUIRED_ASSET_ROLES = {
  car: CAR_ASSET_ROLES,
  ball: BALL_ASSET_ROLES,
  fennec: FENNEC_ASSET_ROLES,
} as const satisfies Record<
  TrainingGpuObjectKind,
  readonly TrainingGpuObjectAssetRole[]
>;

function getCarTarget(id: TrainingCarRadarTarget["id"]) {
  const target = trainingCarRadarTargets.find(
    (candidate) => candidate.id === id,
  );
  if (!target) {
    throw new Error(`Missing Training GPU object target: ${id}.`);
  }
  return target;
}

function createCarRegistration(
  target: TrainingCarRadarTarget,
  layer: number,
): TrainingGpuObjectRegistration {
  return {
    id: target.id,
    kind: "car",
    layer,
    depth: target.depth,
    target,
    assetRoles: CAR_ASSET_ROLES,
  };
}

const ballRegistration: TrainingGpuObjectRegistration = {
  id: trainingBallRadarTarget.id,
  kind: "ball",
  layer: 14,
  depth: trainingBallRadarTarget.depth,
  target: trainingBallRadarTarget,
  assetRoles: BALL_ASSET_ROLES,
};

const fennecRegistration: TrainingGpuObjectRegistration = {
  id: trainingFennecVolumeScanTarget.id,
  kind: "fennec",
  layer: 16,
  depth: trainingFennecVolumeScanTarget.depth,
  target: trainingFennecVolumeScanTarget,
  assetRoles: FENNEC_ASSET_ROLES,
};

export const trainingGpuObjectRegistry = [
  createCarRegistration(getCarTarget("left-car"), 10),
  createCarRegistration(getCarTarget("back-right-car"), 12),
  createCarRegistration(getCarTarget("front-right-car"), 13),
  ballRegistration,
  fennecRegistration,
] as const satisfies readonly TrainingGpuObjectRegistration[];

export function getTrainingGpuObjectRegistration(
  id: TrainingGpuObjectId,
) {
  const registration = trainingGpuObjectRegistry.find(
    (candidate) => candidate.id === id,
  );
  if (!registration) {
    throw new Error(`Unknown Training GPU object: ${id}.`);
  }
  return registration;
}
