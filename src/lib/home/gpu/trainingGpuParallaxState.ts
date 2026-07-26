export type TrainingGpuParallaxPoint = {
  x: number;
  y: number;
};

export type TrainingGpuParallaxSnapshot = {
  point: TrainingGpuParallaxPoint;
  effectiveTranslationX: Readonly<Record<string, number>>;
  effectiveScaleX: Readonly<Record<string, number>>;
  revision: number;
};

let currentSnapshot: TrainingGpuParallaxSnapshot = {
  point: { x: 0, y: 0 },
  effectiveTranslationX: {},
  effectiveScaleX: {},
  revision: 0,
};

export function setTrainingGpuParallaxSnapshot(
  point: TrainingGpuParallaxPoint,
  effectiveTranslationX: Readonly<Record<string, number>>,
  effectiveScaleX: Readonly<Record<string, number>>,
) {
  currentSnapshot = {
    point: { x: point.x, y: point.y },
    effectiveTranslationX: { ...effectiveTranslationX },
    effectiveScaleX: { ...effectiveScaleX },
    revision: currentSnapshot.revision + 1,
  };
}

export function getTrainingGpuParallaxSnapshot() {
  return currentSnapshot;
}
