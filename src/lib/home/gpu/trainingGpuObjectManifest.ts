import { trainingGpuObjectRegistry } from "@/lib/home/gpu/trainingGpuObjectRegistry";
import {
  TRAINING_GPU_OBJECT_ASSET_ROLES,
  TRAINING_GPU_OBJECT_PLACEMENT_SPACES,
  type TrainingGpuObjectAssetRole,
  type TrainingGpuObjectId,
  type TrainingGpuObjectPlacementSpace,
} from "@/lib/home/gpu/trainingGpuObjectTypes";

export type TrainingGpuObjectCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TrainingGpuObjectSourceSize = {
  width: number;
  height: number;
};

export type TrainingGpuObjectOutputSize = {
  width: number;
  height: number;
};

export type TrainingGpuObjectAssetEntry = {
  file: string;
  sourceSize: TrainingGpuObjectSourceSize;
  crop: TrainingGpuObjectCrop;
  outputSize: TrainingGpuObjectOutputSize;
  paddingPx: number;
  alignmentGroup: string;
  placementSpace: TrainingGpuObjectPlacementSpace;
};

export type TrainingGpuObjectAssetManifest = {
  version: 1;
  objectId: TrainingGpuObjectId;
  assets: Partial<
    Record<TrainingGpuObjectAssetRole, TrainingGpuObjectAssetEntry>
  >;
};

export type TrainingGpuObjectManifestValidationResult =
  | { valid: true }
  | { valid: false; errors: readonly string[] };

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

function hasPositiveSize(size: TrainingGpuObjectSourceSize) {
  return (
    isFiniteNumber(size.width) &&
    isFiniteNumber(size.height) &&
    size.width > 0 &&
    size.height > 0
  );
}

function getAlignmentSignature(entry: TrainingGpuObjectAssetEntry) {
  return JSON.stringify({
    sourceSize: entry.sourceSize,
    crop: entry.crop,
    outputSize: entry.outputSize,
    paddingPx: entry.paddingPx,
    placementSpace: entry.placementSpace,
  });
}

export function validateTrainingGpuObjectManifest(
  manifest: TrainingGpuObjectAssetManifest,
): TrainingGpuObjectManifestValidationResult {
  const errors: string[] = [];
  const registration = trainingGpuObjectRegistry.find(
    (candidate) => candidate.id === manifest.objectId,
  );

  if (manifest.version !== 1) {
    errors.push("Manifest version must be 1.");
  }
  if (!registration) {
    errors.push(`Unknown Training GPU objectId: ${String(manifest.objectId)}.`);
  }

  const alignmentSignatures = new Map<string, string>();
  const assetEntries = Object.entries(manifest.assets) as [
    string,
    TrainingGpuObjectAssetEntry | undefined,
  ][];

  for (const [roleName, entry] of assetEntries) {
    if (
      !TRAINING_GPU_OBJECT_ASSET_ROLES.includes(
        roleName as TrainingGpuObjectAssetRole,
      )
    ) {
      errors.push(`Unknown asset role: ${roleName}.`);
      continue;
    }
    if (!entry) continue;

    if (entry.file.trim().length === 0) {
      errors.push(`${roleName}: file must not be empty.`);
    }
    if (entry.alignmentGroup.trim().length === 0) {
      errors.push(`${roleName}: alignmentGroup must not be empty.`);
    }
    if (!hasPositiveSize(entry.sourceSize)) {
      errors.push(`${roleName}: sourceSize must be finite and positive.`);
    }

    const crop = entry.crop;
    if (
      !isFiniteNumber(crop.x) ||
      !isFiniteNumber(crop.y) ||
      !isFiniteNumber(crop.width) ||
      !isFiniteNumber(crop.height)
    ) {
      errors.push(`${roleName}: crop coordinates must be finite.`);
    }
    if (crop.width <= 0 || crop.height <= 0) {
      errors.push(`${roleName}: crop size must be strictly positive.`);
    }
    if (
      crop.x < 0 ||
      crop.y < 0 ||
      crop.x + crop.width > entry.sourceSize.width ||
      crop.y + crop.height > entry.sourceSize.height
    ) {
      errors.push(`${roleName}: crop must stay inside sourceSize.`);
    }

    if (!hasPositiveSize(entry.outputSize)) {
      errors.push(`${roleName}: outputSize must be finite and positive.`);
    }
    if (
      entry.outputSize.width !== crop.width ||
      entry.outputSize.height !== crop.height
    ) {
      errors.push(`${roleName}: outputSize must match crop size exactly.`);
    }
    if (!isFiniteNumber(entry.paddingPx) || entry.paddingPx < 0) {
      errors.push(`${roleName}: paddingPx must be finite and non-negative.`);
    }
    if (
      !TRAINING_GPU_OBJECT_PLACEMENT_SPACES.includes(entry.placementSpace)
    ) {
      errors.push(`${roleName}: unknown placementSpace.`);
    }

    const signature = getAlignmentSignature(entry);
    const existingSignature = alignmentSignatures.get(entry.alignmentGroup);
    if (existingSignature && existingSignature !== signature) {
      errors.push(
        `${roleName}: alignmentGroup "${entry.alignmentGroup}" has incompatible sourceSize, crop, outputSize, paddingPx, or placementSpace.`,
      );
    } else {
      alignmentSignatures.set(entry.alignmentGroup, signature);
    }
  }

  if (registration) {
    for (const requiredRole of registration.assetRoles) {
      if (!manifest.assets[requiredRole]) {
        errors.push(
          `${manifest.objectId}: required asset role "${requiredRole}" is missing.`,
        );
      }
    }
  }

  return errors.length === 0
    ? { valid: true }
    : { valid: false, errors };
}
