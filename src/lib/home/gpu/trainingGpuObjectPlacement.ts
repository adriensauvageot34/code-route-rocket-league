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

function transformGroundedSceneRect(
  registration: TrainingGpuObjectRegistration,
  sourceRect: TrainingGpuObjectRenderRect,
): TrainingGpuObjectRenderRect {
  if (!("grounding" in registration.target)) {
    throw new Error(
      `${registration.id} does not define a grounded-scene transform.`,
    );
  }

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

function getGroundedSceneRect(
  registration: TrainingGpuObjectRegistration,
  entry: TrainingGpuObjectAssetEntry,
): TrainingGpuObjectRenderRect {
  return transformGroundedSceneRect(registration, getSceneCropRect(entry));
}

function getTargetFrameContainerRect(
  registration: TrainingGpuObjectRegistration,
): TrainingGpuObjectRenderRect {
  if (!("placement" in registration.target)) {
    throw new Error(
      `${registration.id} does not define a target-frame placement.`,
    );
  }

  const placement = registration.target.placement;
  const frameWidth =
    parsePercentage(placement.width) * TRAINING_GPU_LOGICAL_WIDTH;
  return {
    x: parsePercentage(placement.left) * TRAINING_GPU_LOGICAL_WIDTH,
    y: parsePercentage(placement.top) * TRAINING_GPU_LOGICAL_HEIGHT,
    width: frameWidth,
    height: frameWidth / parseAspectRatio(placement.aspectRatio),
  };
}

function getTargetFrameRect(
  registration: TrainingGpuObjectRegistration,
  entry: TrainingGpuObjectAssetEntry,
): TrainingGpuObjectRenderRect {
  return placeCropInFrame(entry, getTargetFrameContainerRect(registration));
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

export function getTrainingGpuObjectSceneRenderRect(
  registration: TrainingGpuObjectRegistration,
  assetEntry: TrainingGpuObjectAssetEntry,
): TrainingGpuObjectRenderRect {
  const renderRect = getTrainingGpuObjectRenderRect(
    registration,
    assetEntry,
  );

  return assetEntry.placementSpace === "target-frame" &&
    registration.kind === "car"
    ? transformGroundedSceneRect(registration, renderRect)
    : renderRect;
}


export type TrainingGpuObjectFitMode = "contain" | "cover" | "fill";

export type TrainingGpuObjectLocalFrame = {
  width: number;
  height: number;
};

export type TrainingGpuObjectLocalTransform = {
  scaleX: number;
  scaleY: number;
  translateXPercent: number;
  translateYPercent: number;
};

export function getTrainingGpuObjectLocalQuad(
  entry: TrainingGpuObjectAssetEntry,
  frame: TrainingGpuObjectLocalFrame,
  fitMode: TrainingGpuObjectFitMode,
): TrainingGpuObjectRenderRect {
  const sourceWidth = entry.sourceSize.width;
  const sourceHeight = entry.sourceSize.height;
  let scaleX = frame.width / sourceWidth;
  let scaleY = frame.height / sourceHeight;

  if (fitMode !== "fill") {
    const uniformScale =
      fitMode === "contain"
        ? Math.min(scaleX, scaleY)
        : Math.max(scaleX, scaleY);
    scaleX = uniformScale;
    scaleY = uniformScale;
  }

  const fittedWidth = sourceWidth * scaleX;
  const fittedHeight = sourceHeight * scaleY;
  const offsetX = (frame.width - fittedWidth) / 2;
  const offsetY = (frame.height - fittedHeight) / 2;

  return {
    x: offsetX + entry.crop.x * scaleX,
    y: offsetY + entry.crop.y * scaleY,
    width: entry.crop.width * scaleX,
    height: entry.crop.height * scaleY,
  };
}

export function transformTrainingGpuObjectLocalQuad(
  quad: TrainingGpuObjectRenderRect,
  frame: TrainingGpuObjectLocalFrame,
  transform: TrainingGpuObjectLocalTransform,
): TrainingGpuObjectRenderRect {
  const centerX = frame.width / 2;
  const centerY = frame.height / 2;

  return {
    x:
      centerX +
      (quad.x - centerX) * transform.scaleX +
      (transform.translateXPercent / 100) * frame.width,
    y:
      centerY +
      (quad.y - centerY) * transform.scaleY +
      (transform.translateYPercent / 100) * frame.height,
    width: quad.width * transform.scaleX,
    height: quad.height * transform.scaleY,
  };
}

export function convertTrainingGpuSceneRectToLocalCanvasRect(
  sceneRect: TrainingGpuObjectRenderRect,
  canvasSceneRect: TrainingGpuObjectRenderRect,
  localFrame: TrainingGpuObjectLocalFrame,
): TrainingGpuObjectRenderRect {
  if (
    canvasSceneRect.width <= 0 ||
    canvasSceneRect.height <= 0 ||
    localFrame.width <= 0 ||
    localFrame.height <= 0
  ) {
    throw new Error("Training GPU object canvas geometry must be positive.");
  }

  const scaleX = localFrame.width / canvasSceneRect.width;
  const scaleY = localFrame.height / canvasSceneRect.height;
  return {
    x: (sceneRect.x - canvasSceneRect.x) * scaleX,
    y: (sceneRect.y - canvasSceneRect.y) * scaleY,
    width: sceneRect.width * scaleX,
    height: sceneRect.height * scaleY,
  };
}

export function convertTrainingGpuLogicalSceneRectToLocalCanvasRect(
  sceneRect: TrainingGpuObjectRenderRect,
  localFrame: TrainingGpuObjectLocalFrame,
): TrainingGpuObjectRenderRect {
  return convertTrainingGpuSceneRectToLocalCanvasRect(
    sceneRect,
    {
      x: 0,
      y: 0,
      width: TRAINING_GPU_LOGICAL_WIDTH,
      height: TRAINING_GPU_LOGICAL_HEIGHT,
    },
    localFrame,
  );
}

function getTrainingGpuObjectCanvasSceneRect(
  registration: TrainingGpuObjectRegistration,
): TrainingGpuObjectRenderRect {
  if (registration.kind === "car") {
    return transformGroundedSceneRect(
      registration,
      getTargetFrameContainerRect(registration),
    );
  }
  if (registration.kind === "ball") {
    return transformGroundedSceneRect(registration, {
      x: 0,
      y: 0,
      width: TRAINING_GPU_LOGICAL_WIDTH,
      height: TRAINING_GPU_LOGICAL_HEIGHT,
    });
  }
  throw new Error(`${registration.id} has no prepared GPU base canvas.`);
}

export function getTrainingGpuObjectBaseQuadInCanvasSpace(
  registration: TrainingGpuObjectRegistration,
  baseEntry: TrainingGpuObjectAssetEntry,
  localFrame: TrainingGpuObjectLocalFrame,
): TrainingGpuObjectRenderRect {
  return convertTrainingGpuSceneRectToLocalCanvasRect(
    getTrainingGpuObjectRenderRect(registration, baseEntry),
    getTrainingGpuObjectCanvasSceneRect(registration),
    localFrame,
  );
}
