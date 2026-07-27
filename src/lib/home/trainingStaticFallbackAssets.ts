import type { HomeSceneDepth } from "@/lib/home/homeSceneParallax";

export type TrainingStaticFallbackAsset = {
  crop: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
  depth: HomeSceneDepth;
  id: "left-car" | "back-right-car" | "front-right-car" | "ball" | "fennec";
  layer: number;
  outputSize: {
    height: number;
    width: number;
  };
  path: `/ui/training-objects/${string}/base.webp`;
  sourceSize: {
    height: number;
    width: number;
  };
};

export const TRAINING_STATIC_FALLBACK_ASSETS = [
  {
    crop: { x: 584, y: 232, width: 104, height: 80 },
    depth: "trainingCarFar",
    id: "left-car",
    layer: 10,
    outputSize: { width: 104, height: 80 },
    path: "/ui/training-objects/left-car/base.webp",
    sourceSize: { width: 1672, height: 941 },
  },
  {
    crop: { x: 1152, y: 216, width: 96, height: 72 },
    depth: "trainingCarMid",
    id: "back-right-car",
    layer: 12,
    outputSize: { width: 96, height: 72 },
    path: "/ui/training-objects/back-right-car/base.webp",
    sourceSize: { width: 1672, height: 941 },
  },
  {
    crop: { x: 1232, y: 296, width: 176, height: 104 },
    depth: "trainingCarNear",
    id: "front-right-car",
    layer: 13,
    outputSize: { width: 176, height: 104 },
    path: "/ui/training-objects/front-right-car/base.webp",
    sourceSize: { width: 1672, height: 941 },
  },
  {
    crop: { x: 720, y: 312, width: 240, height: 240 },
    depth: "trainingBall",
    id: "ball",
    layer: 14,
    outputSize: { width: 240, height: 240 },
    path: "/ui/training-objects/ball/base.webp",
    sourceSize: { width: 1672, height: 941 },
  },
  {
    crop: { x: 1008, y: 428, width: 552, height: 416 },
    depth: "trainingFennec",
    id: "fennec",
    layer: 16,
    outputSize: { width: 552, height: 416 },
    path: "/ui/training-objects/fennec/base.webp",
    sourceSize: { width: 1672, height: 941 },
  },
] as const satisfies readonly TrainingStaticFallbackAsset[];
