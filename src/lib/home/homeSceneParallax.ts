export const homeSceneDepths = {
  background: { translation: 3, rotation: 0.04, scale: 1.02 },
  distant: { translation: 5, rotation: 0.07, scale: 1.03 },
  focal: { translation: 7, rotation: 0.1, scale: 1.04 },
  fennec: { translation: 11, rotation: 0.16, scale: 1.05 },
  foreground: { translation: 14, rotation: 0.2, scale: 1.06 },
  trainingSky: { translation: 3, rotation: 0, scale: 1.02 },
  trainingSkyline: { translation: 5, rotation: 0, scale: 1.03 },
  trainingMid: { translation: 8, rotation: 0, scale: 1.04 },
  trainingNear: { translation: 12, rotation: 0, scale: 1.05 },
  trainingGround: { translation: 17, rotation: 0, scale: 1.07 },
  trainingActors: { translation: 20, rotation: 0, scale: 1.07 },
  trainingFennec: { translation: 24, rotation: 0, scale: 1.08 }
} as const;

export type HomeSceneDepth = keyof typeof homeSceneDepths;
