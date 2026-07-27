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
  pointsByDepth: createCenteredPointsByDepth(),
  point: { x: 0, y: 0 },
  effectiveTranslationX: {},
  effectiveScaleX: {},
  revision: 0,
};

function sameNumber(left: number | undefined, right: number | undefined) {
  return Math.abs((left ?? 0) - (right ?? 0)) < 0.000001;
}

function createCenteredPointsByDepth() {
  const points: Partial<
    Record<HomeSceneDepth, TrainingGpuParallaxPoint>
  > = {};
  for (const depth of TRAINING_CAMERA_DEPTHS) {
    points[depth] = { x: 0, y: 0 };
  }
  return points;
}

function snapshotChanged(
  effectiveTranslationX: Readonly<Record<string, number>>,
  effectiveScaleX: Readonly<Record<string, number>>,
) {
  for (const depth of TRAINING_CAMERA_DEPTHS) {
    if (
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
  _camera: TrainingCameraSnapshot,
  effectiveTranslationX: Readonly<Record<string, number>>,
  effectiveScaleX: Readonly<Record<string, number>>,
) {
  if (
    !snapshotChanged(
      effectiveTranslationX,
      effectiveScaleX,
    )
  ) {
    return false;
  }
  currentSnapshot = {
    cameraScale: 1,
    pointsByDepth: createCenteredPointsByDepth(),
    point: { x: 0, y: 0 },
    effectiveTranslationX: { ...effectiveTranslationX },
    effectiveScaleX: { ...effectiveScaleX },
    revision: currentSnapshot.revision + 1,
  };
  return true;
}

export function getTrainingGpuParallaxSnapshot() {
  return currentSnapshot;
}
