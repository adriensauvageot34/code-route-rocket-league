import {
  TRAINING_GPU_LOGICAL_HEIGHT,
  TRAINING_GPU_LOGICAL_WIDTH,
} from "@/lib/home/gpu/trainingGpuConstants";
import {
  TRAINING_GPU_FENNEC_IMPACT_FRAME,
  TRAINING_GPU_FENNEC_SURFACE_FRAME,
  type TrainingGpuObjectFrame,
} from "@/lib/home/gpu/trainingGpuFennecFrames";
import type { TrainingGpuObjectAssetEntry } from "@/lib/home/gpu/trainingGpuObjectManifest";
import type {
  TrainingGpuObjectRegistration,
  TrainingGpuObjectRenderRect,
} from "@/lib/home/gpu/trainingGpuObjectTypes";

function parsePercentage(value: `${number}%`) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid Training GPU percentage: ${value}.`);
  }
  return parsed / 100;
}

function parseAspectRatio(value: `${number} / ${number}`) {
  const parts = value.split("/");
  const width = Number.parseFloat(parts[0]?.trim() ?? "");
  const height = Number.parseFloat(parts[1]?.trim() ?? "");
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(`Invalid Training GPU aspect ratio: ${value}.`);
  }
  return width / height;
}

function getSceneCropRect(
  entry: TrainingGpuObjectAssetEntry,
): TrainingGpuObjectRenderRect {
  return {
    x:
      (entry.crop.x / entry.sourceSize.width) *
      TRAINING_GPU_LOGICAL_WIDTH,
    y:
      (entry.crop.y / entry.sourceSize.height) *
      TRAINING_GPU_LOGICAL_HEIGHT,
    width:
      (entry.crop.width / entry.sourceSize.width) *
      TRAINING_GPU_LOGICAL_WIDTH,
    height:
      (entry.crop.height / entry.sourceSize.height) *
      TRAINING_GPU_LOGICAL_HEIGHT,
  };
}

function placeCropInFrame(
  entry: TrainingGpuObjectAssetEntry,
  frame: TrainingGpuObjectRenderRect,
): TrainingGpuObjectRenderRect {
  return {
    x: frame.x + (entry.crop.x / entry.sourceSize.width) * frame.width,
    y: frame.y + (entry.crop.y / entry.sourceSize.height) * frame.height,
    width: (entry.crop.width / entry.sourceSize.width) * frame.width,
    height: (entry.crop.height / entry.sourceSize.height) * frame.height,
  };
}

function getPercentageFrameRect(
  frame: TrainingGpuObjectFrame,
): TrainingGpuObjectRenderRect {
  return {
    x: (frame.left / 100) * TRAINING_GPU_LOGICAL_WIDTH,
    y: (frame.top / 100) * TRAINING_GPU_LOGICAL_HEIGHT,
    width: (frame.width / 100) * TRAINING_GPU_LOGICAL_WIDTH,
    height: (frame.height / 100) * TRAINING_GPU_LOGICAL_HEIGHT,
  };
}

function getGroundedSceneRect(
  registration: TrainingGpuObjectRegistration,
  entry: TrainingGpuObjectAssetEntry,
): TrainingGpuObjectRenderRect {
  if (!("grounding" in registration.target)) {
    throw new Error(
      `${registration.id} does not define a grounded-scene transform.`,
    );
  }

  const sourceRect = getSceneCropRect(entry);
  const { sourceAnchor, target: destination } =
    registration.target.grounding;
  const originX = sourceAnchor.x * TRAINING_GPU_LOGICAL_WIDTH;
  const originY = sourceAnchor.groundY * TRAINING_GPU_LOGICAL_HEIGHT;
  const translationX =
    (destination.x - sourceAnchor.x) * TRAINING_GPU_LOGICAL_WIDTH;
  const translationY =
    (destination.groundY - sourceAnchor.groundY) *
    TRAINING_GPU_LOGICAL_HEIGHT;

  return {
    x:
      originX +
      (sourceRect.x - originX) * destination.scale +
      translationX,
    y:
      originY +
      (sourceRect.y - originY) * destination.scale +
      translationY,
    width: sourceRect.width * destination.scale,
    height: sourceRect.height * destination.scale,
  };
}

function getTargetFrameRect(
  registration: TrainingGpuObjectRegistration,
  entry: TrainingGpuObjectAssetEntry,
): TrainingGpuObjectRenderRect {
  if (!("placement" in registration.target)) {
    throw new Error(
      `${registration.id} does not define a target-frame placement.`,
    );
  }

  const placement = registration.target.placement;
  const frameWidth =
    parsePercentage(placement.width) * TRAINING_GPU_LOGICAL_WIDTH;
  const frame = {
    x: parsePercentage(placement.left) * TRAINING_GPU_LOGICAL_WIDTH,
    y: parsePercentage(placement.top) * TRAINING_GPU_LOGICAL_HEIGHT,
    width: frameWidth,
    height: frameWidth / parseAspectRatio(placement.aspectRatio),
  };

  return placeCropInFrame(entry, frame);
}

export function getTrainingGpuObjectRenderRect(
  registration: TrainingGpuObjectRegistration,
  assetEntry: TrainingGpuObjectAssetEntry,
): TrainingGpuObjectRenderRect {
  switch (assetEntry.placementSpace) {
    case "scene":
      return getSceneCropRect(assetEntry);
    case "grounded-scene":
      return getGroundedSceneRect(registration, assetEntry);
    case "target-frame":
      return getTargetFrameRect(registration, assetEntry);
    case "fennec-surface-frame":
      if (registration.id !== "fennec") {
        throw new Error(
          `${registration.id} cannot use the Fennec surface frame.`,
        );
      }
      return placeCropInFrame(
        assetEntry,
        getPercentageFrameRect(TRAINING_GPU_FENNEC_SURFACE_FRAME),
      );
    case "fennec-impact-frame":
      if (registration.id !== "fennec") {
        throw new Error(
          `${registration.id} cannot use the Fennec impact frame.`,
        );
      }
      return placeCropInFrame(
        assetEntry,
        getPercentageFrameRect(TRAINING_GPU_FENNEC_IMPACT_FRAME),
      );
  }
}
