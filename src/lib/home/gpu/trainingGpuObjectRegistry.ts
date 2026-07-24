import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
import {
  trainingBallRadarTarget,
  trainingCarRadarTargets,
  trainingFennecVolumeScanTarget,
  type TrainingCarRadarTarget,
} from "@/lib/home/trainingRadarTargets";
import type {
  TrainingGpuObjectAlignmentGroup,
  TrainingGpuObjectAssetBinding,
  TrainingGpuObjectAssetRole,
  TrainingGpuObjectId,
  TrainingGpuObjectKind,
  TrainingGpuObjectPlacementSpace,
  TrainingGpuObjectRegistration,
} from "@/lib/home/gpu/trainingGpuObjectTypes";

const trainingAssets = homeIllustrationAssets.training;

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

function createAlignmentGroup(
  id: string,
  placementSpace: TrainingGpuObjectPlacementSpace,
  assetRoles: readonly TrainingGpuObjectAssetRole[],
  sourceSize: { width: number; height: number },
): TrainingGpuObjectAlignmentGroup {
  return {
    assetRoles,
    id,
    placementSpace,
    sourceSize,
  };
}

function createBinding(
  role: TrainingGpuObjectAssetRole,
  alignmentGroup: string,
  placementSpace: TrainingGpuObjectPlacementSpace,
  asset: TrainingGpuObjectAssetBinding["asset"],
): TrainingGpuObjectAssetBinding {
  return {
    alignmentGroup,
    asset,
    placementSpace,
    role,
  };
}

function createCarRegistration(
  target: TrainingCarRadarTarget,
  layer: number,
): TrainingGpuObjectRegistration {
  const baseGroup = `${target.id}:base-scene`;
  const surfaceGroup = `${target.id}:volume-surface-target`;
  const contourGroup = `${target.id}:volume-contour-target`;
  const wireframeGroup = `${target.id}:wireframe-target`;
  const glowGroup = `${target.id}:glow-target`;

  return {
    id: target.id,
    kind: "car",
    layer,
    depth: target.depth,
    target,
    assetRoles: CAR_ASSET_ROLES,
    alignmentGroups: [
      createAlignmentGroup(
        baseGroup,
        "grounded-scene",
        ["base"],
        target.baseAsset.dimensions,
      ),
      createAlignmentGroup(
        surfaceGroup,
        "target-frame",
        ["volumeSurface"],
        target.surfaceAsset.dimensions,
      ),
      createAlignmentGroup(
        contourGroup,
        "target-frame",
        ["volumeContour"],
        target.contourAsset.dimensions,
      ),
      createAlignmentGroup(
        wireframeGroup,
        "target-frame",
        ["tacticalWireframe"],
        target.wireframeAsset.dimensions,
      ),
      createAlignmentGroup(
        glowGroup,
        "target-frame",
        ["tacticalGlow"],
        target.glowAsset.dimensions,
      ),
    ],
    assetBindings: {
      base: createBinding(
        "base",
        baseGroup,
        "grounded-scene",
        target.baseAsset,
      ),
      volumeSurface: createBinding(
        "volumeSurface",
        surfaceGroup,
        "target-frame",
        target.surfaceAsset,
      ),
      volumeContour: createBinding(
        "volumeContour",
        contourGroup,
        "target-frame",
        target.contourAsset,
      ),
      tacticalWireframe: createBinding(
        "tacticalWireframe",
        wireframeGroup,
        "target-frame",
        target.wireframeAsset,
      ),
      tacticalGlow: createBinding(
        "tacticalGlow",
        glowGroup,
        "target-frame",
        target.glowAsset,
      ),
    },
  };
}

const leftCar = getCarTarget("left-car");
const backRightCar = getCarTarget("back-right-car");
const frontRightCar = getCarTarget("front-right-car");

const ballBaseEnergyGroup = "ball:base-energy-scene";
const ballVolumeGroup = "ball:volume-square";
const fennecBaseGroup = "fennec:base-scene";
const fennecHeadlightGroup = "fennec:headlight-scene";
const fennecRearGroup = "fennec:rear-scene";
const fennecSurfaceGroup = "fennec:surface-frame";
const fennecContourGroup = "fennec:contour-scene";
const fennecImpactGroup = "fennec:impact";

const ballRegistration: TrainingGpuObjectRegistration = {
  id: trainingBallRadarTarget.id,
  kind: "ball",
  layer: 14,
  depth: trainingBallRadarTarget.depth,
  target: trainingBallRadarTarget,
  assetRoles: BALL_ASSET_ROLES,
  alignmentGroups: [
    createAlignmentGroup(
      ballBaseEnergyGroup,
      "grounded-scene",
      ["base", "tacticalEnergy"],
      trainingBallRadarTarget.baseAsset.dimensions,
    ),
    createAlignmentGroup(
      ballVolumeGroup,
      "grounded-scene",
      ["volumeSurface", "volumeContour"],
      trainingBallRadarTarget.surfaceAsset.dimensions,
    ),
  ],
  assetBindings: {
    base: createBinding(
      "base",
      ballBaseEnergyGroup,
      "grounded-scene",
      trainingBallRadarTarget.baseAsset,
    ),
    volumeSurface: createBinding(
      "volumeSurface",
      ballVolumeGroup,
      "grounded-scene",
      trainingBallRadarTarget.surfaceAsset,
    ),
    volumeContour: createBinding(
      "volumeContour",
      ballVolumeGroup,
      "grounded-scene",
      trainingBallRadarTarget.contourAsset,
    ),
    tacticalEnergy: createBinding(
      "tacticalEnergy",
      ballBaseEnergyGroup,
      "grounded-scene",
      trainingBallRadarTarget.energyAsset,
    ),
  },
};

const fennecRegistration: TrainingGpuObjectRegistration = {
  id: trainingFennecVolumeScanTarget.id,
  kind: "fennec",
  layer: 16,
  depth: trainingFennecVolumeScanTarget.depth,
  target: trainingFennecVolumeScanTarget,
  assetRoles: FENNEC_ASSET_ROLES,
  alignmentGroups: [
    createAlignmentGroup(
      fennecBaseGroup,
      "scene",
      ["base"],
      trainingAssets.fennecBase.dimensions,
    ),
    createAlignmentGroup(
      fennecHeadlightGroup,
      "scene",
      ["headlightGlow"],
      trainingAssets.fennecHeadlightGlow.dimensions,
    ),
    createAlignmentGroup(
      fennecRearGroup,
      "scene",
      ["rearAccent"],
      trainingAssets.fennecRearAccent.dimensions,
    ),
    createAlignmentGroup(
      fennecSurfaceGroup,
      "fennec-surface-frame",
      ["volumeSurface"],
      trainingFennecVolumeScanTarget.surfaceAsset.dimensions,
    ),
    createAlignmentGroup(
      fennecContourGroup,
      "scene",
      ["volumeContour"],
      trainingFennecVolumeScanTarget.contourAsset.dimensions,
    ),
    createAlignmentGroup(
      fennecImpactGroup,
      "fennec-impact-frame",
      ["tacticalImpact"],
      trainingFennecVolumeScanTarget.impactAsset.dimensions,
    ),
  ],
  assetBindings: {
    base: createBinding(
      "base",
      fennecBaseGroup,
      "scene",
      trainingAssets.fennecBase,
    ),
    headlightGlow: createBinding(
      "headlightGlow",
      fennecHeadlightGroup,
      "scene",
      trainingAssets.fennecHeadlightGlow,
    ),
    rearAccent: createBinding(
      "rearAccent",
      fennecRearGroup,
      "scene",
      trainingAssets.fennecRearAccent,
    ),
    volumeSurface: createBinding(
      "volumeSurface",
      fennecSurfaceGroup,
      "fennec-surface-frame",
      trainingFennecVolumeScanTarget.surfaceAsset,
    ),
    volumeContour: createBinding(
      "volumeContour",
      fennecContourGroup,
      "scene",
      trainingFennecVolumeScanTarget.contourAsset,
    ),
    tacticalImpact: createBinding(
      "tacticalImpact",
      fennecImpactGroup,
      "fennec-impact-frame",
      trainingFennecVolumeScanTarget.impactAsset,
    ),
  },
};

export const trainingGpuObjectRegistry = [
  createCarRegistration(leftCar, 10),
  createCarRegistration(backRightCar, 12),
  createCarRegistration(frontRightCar, 13),
  ballRegistration,
  fennecRegistration,
] as const satisfies readonly TrainingGpuObjectRegistration[];

export function getTrainingGpuObjectRegistration(id: TrainingGpuObjectId) {
  const registration = trainingGpuObjectRegistry.find(
    (candidate) => candidate.id === id,
  );
  if (!registration) {
    throw new Error(`Unknown Training GPU object: ${id}.`);
  }
  return registration;
}
