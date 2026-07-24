import type { HomeIllustrationAsset } from "@/lib/home/homeIllustrationAssets";
import type {
  TrainingBallRadarTarget,
  TrainingCarRadarTarget,
  TrainingFennecVolumeScanTarget,
} from "@/lib/home/trainingRadarTargets";
import type { TrainingGpuObjectAssetManifest } from "@/lib/home/gpu/trainingGpuObjectManifest";
import type { TrainingGpuVolumeScanState } from "@/lib/home/gpu/trainingGpuVolumeScanTiming";

export const TRAINING_GPU_OBJECT_IDS = [
  "left-car",
  "back-right-car",
  "front-right-car",
  "ball",
  "fennec",
] as const;

export type TrainingGpuObjectId = (typeof TRAINING_GPU_OBJECT_IDS)[number];

export const TRAINING_GPU_OBJECT_KINDS = ["car", "ball", "fennec"] as const;

export type TrainingGpuObjectKind =
  (typeof TRAINING_GPU_OBJECT_KINDS)[number];

export const TRAINING_GPU_OBJECT_ASSET_ROLES = [
  "base",
  "volumeSurface",
  "volumeContour",
  "tacticalWireframe",
  "tacticalGlow",
  "tacticalEnergy",
  "tacticalImpact",
  "headlightGlow",
  "rearAccent",
] as const;

export type TrainingGpuObjectAssetRole =
  (typeof TRAINING_GPU_OBJECT_ASSET_ROLES)[number];

export const TRAINING_GPU_OBJECT_PLACEMENT_SPACES = [
  "scene",
  "grounded-scene",
  "target-frame",
  "fennec-surface-frame",
  "fennec-impact-frame",
] as const;

export type TrainingGpuObjectPlacementSpace =
  (typeof TRAINING_GPU_OBJECT_PLACEMENT_SPACES)[number];

export type TrainingGpuObjectTarget =
  | TrainingCarRadarTarget
  | TrainingBallRadarTarget
  | TrainingFennecVolumeScanTarget;

export type TrainingGpuObjectAssetBinding = {
  alignmentGroup: string;
  asset: HomeIllustrationAsset;
  placementSpace: TrainingGpuObjectPlacementSpace;
  role: TrainingGpuObjectAssetRole;
};

export type TrainingGpuObjectAlignmentGroup = {
  assetRoles: readonly TrainingGpuObjectAssetRole[];
  id: string;
  placementSpace: TrainingGpuObjectPlacementSpace;
  sourceSize: {
    width: number;
    height: number;
  };
};

export type TrainingGpuObjectRegistration = {
  alignmentGroups: readonly TrainingGpuObjectAlignmentGroup[];
  assetBindings: Readonly<
    Partial<Record<TrainingGpuObjectAssetRole, TrainingGpuObjectAssetBinding>>
  >;
  assetRoles: readonly TrainingGpuObjectAssetRole[];
  depth: TrainingGpuObjectTarget["depth"];
  id: TrainingGpuObjectId;
  kind: TrainingGpuObjectKind;
  layer: number;
  target: TrainingGpuObjectTarget;
};

export type TrainingGpuObjectRenderRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TrainingGpuObjectTextureSet = {
  manifest: TrainingGpuObjectAssetManifest;
  textures: Partial<Record<TrainingGpuObjectAssetRole, WebGLTexture>>;
};

export type TrainingGpuObjectRenderState = {
  id: TrainingGpuObjectId;
  renderRects: Partial<
    Record<TrainingGpuObjectAssetRole, TrainingGpuObjectRenderRect>
  >;
  volumeScan: TrainingGpuVolumeScanState;
};
