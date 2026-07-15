export const homeSceneDepths = {
  background: { translation: 3, rotation: 0.04 },
  distant: { translation: 5, rotation: 0.07 },
  focal: { translation: 7, rotation: 0.1 },
  fennec: { translation: 11, rotation: 0.16 },
  foreground: { translation: 14, rotation: 0.2 }
} as const;

export type HomeSceneDepth = keyof typeof homeSceneDepths;
