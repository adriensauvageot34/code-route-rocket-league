export const homeSceneDepths = {
  background: { translationX: 3, translationY: 3, rotation: 0.04, scale: 1.02 },
  distant: { translationX: 5, translationY: 5, rotation: 0.07, scale: 1.03 },
  focal: { translationX: 7, translationY: 7, rotation: 0.1, scale: 1.04 },
  fennec: { translationX: 11, translationY: 11, rotation: 0.16, scale: 1.05 },
  foreground: { translationX: 14, translationY: 14, rotation: 0.2, scale: 1.06 },
  trainingSky: { translationX: 3, translationY: 1, rotation: 0, scale: 1.02 },
  trainingSkyline: { translationX: 7, translationY: 1, rotation: 0, scale: 1.03, scaleY: 1 },
  trainingMid: { translationX: 22, translationY: 1.4, rotation: 0, scale: 1.06, scaleY: 1 },
  trainingNear: { translationX: 34, translationY: 1.6, rotation: 0, scale: 1.08, scaleY: 1 },
  trainingGround: { translationX: 27, translationY: 2, rotation: 0, scale: 1.07, scaleY: 1 },
  trainingParticlesFar: { translationX: 10, translationY: 0.8, rotation: 0, scale: 1 },
  trainingParticlesMid: { translationX: 31, translationY: 2.6, rotation: 0, scale: 1.01 },
  trainingParticlesNear: { translationX: 50, translationY: 4.4, rotation: 0, scale: 1.02 },
  trainingCarFar: { translationX: 22, translationY: 2, rotation: 0, scale: 1.07 },
  trainingCarMid: { translationX: 23, translationY: 2, rotation: 0, scale: 1.07 },
  trainingCarNear: { translationX: 25, translationY: 2, rotation: 0, scale: 1.07 },
  trainingBall: { translationX: 28, translationY: 2, rotation: 0, scale: 1.07 },
  trainingFennec: { translationX: 34, translationY: 2, rotation: 0, scale: 1.08 }
} as const;

export type HomeSceneDepth = keyof typeof homeSceneDepths;

export const trainingParallaxSafetyDepths = [
  "trainingSkyline",
  "trainingMid",
  "trainingNear",
  "trainingGround"
] as const satisfies readonly HomeSceneDepth[];

export type TrainingParallaxSafetyDepth = (typeof trainingParallaxSafetyDepths)[number];

export const TRAINING_PARALLAX_SAFETY_MARGIN_PX = 10;
export const TRAINING_PARALLAX_MAX_SCALE_X = 1.1;

export function calculateTrainingParallaxSafety(
  renderedContainerWidth: number,
  requestedTranslationX: number
) {
  if (!Number.isFinite(renderedContainerWidth) || renderedContainerWidth <= 0) {
    return { scaleX: 1, translationX: 0 };
  }

  const maximumOverscanPerSide =
    ((TRAINING_PARALLAX_MAX_SCALE_X - 1) * renderedContainerWidth) / 2;
  const safetyMargin = Math.min(TRAINING_PARALLAX_SAFETY_MARGIN_PX, maximumOverscanPerSide);
  const translationX = Math.min(
    Math.abs(requestedTranslationX),
    Math.max(0, maximumOverscanPerSide - safetyMargin)
  );
  const scaleX =
    1 + (2 * (translationX + safetyMargin)) / renderedContainerWidth;

  return { scaleX, translationX };
}
