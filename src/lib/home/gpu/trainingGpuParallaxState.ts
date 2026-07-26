import type { HomeSceneDepth } from "@/lib/home/homeSceneParallax";
import {
  TRAINING_CAMERA_DEPTHS,
  type TrainingCameraSnapshot,
} from "@/lib/home/trainingCamera";

export type TrainingGpuParallaxPoint = {
  x: number;
  y: number;
};

export type TrainingGpuParallaxSnapshot = {
  cameraScale: number;
  pointsByDepth: Readonly<
    Partial<Record<HomeSceneDepth, TrainingGpuParallaxPoint>>
  >;
  point: TrainingGpuParallaxPoint;
  effectiveTranslationX: Readonly<Record<string, number>>;
  effectiveScaleX: Readonly<Record<string, number>>;
  revision: number;
};

let currentSnapshot: TrainingGpuParallaxSnapshot = {
  cameraScale: 1,
  pointsByDepth: {},
  point: { x: 0, y: 0 },
  effectiveTranslationX: {},
  effectiveScaleX: {},
  revision: 0,
};

function sameNumber(left: number | undefined, right: number | undefined) {
  return Math.abs((left ?? 0) - (right ?? 0)) < 0.000001;
}

function snapshotChanged(
  camera: TrainingCameraSnapshot,
  effectiveTranslationX: Readonly<Record<string, number>>,
  effectiveScaleX: Readonly<Record<string, number>>,
) {
  if (
    !sameNumber(currentSnapshot.point.x, camera.x) ||
    !sameNumber(currentSnapshot.point.y, camera.y) ||
    !sameNumber(currentSnapshot.cameraScale, camera.scale)
  ) {
    return true;
  }
  for (const depth of TRAINING_CAMERA_DEPTHS) {
    const previousPoint = currentSnapshot.pointsByDepth[depth];
    const nextPoint = camera.depthPoints[depth];
    if (
      !sameNumber(previousPoint?.x, nextPoint.x) ||
      !sameNumber(previousPoint?.y, nextPoint.y) ||
      !sameNumber(
        currentSnapshot.effectiveTranslationX[depth],
        effectiveTranslationX[depth],
      ) ||
      !sameNumber(
        currentSnapshot.effectiveScaleX[depth],
        effectiveScaleX[depth],
      )
    ) {
      return true;
    }
  }
  return false;
}

export function setTrainingGpuParallaxSnapshot(
  camera: TrainingCameraSnapshot,
  effectiveTranslationX: Readonly<Record<string, number>>,
  effectiveScaleX: Readonly<Record<string, number>>,
) {
  if (
    !snapshotChanged(
      camera,
      effectiveTranslationX,
      effectiveScaleX,
    )
  ) {
    return false;
  }
  const pointsByDepth: Partial<
    Record<HomeSceneDepth, TrainingGpuParallaxPoint>
  > = {};
  for (const depth of TRAINING_CAMERA_DEPTHS) {
    pointsByDepth[depth] = {
      x: camera.depthPoints[depth].x,
      y: camera.depthPoints[depth].y,
    };
  }
  currentSnapshot = {
    cameraScale: camera.scale,
    pointsByDepth,
    point: { x: camera.x, y: camera.y },
    effectiveTranslationX: { ...effectiveTranslationX },
    effectiveScaleX: { ...effectiveScaleX },
    revision: currentSnapshot.revision + 1,
  };
  return true;
}

export function getTrainingGpuParallaxSnapshot() {
  return currentSnapshot;
}
