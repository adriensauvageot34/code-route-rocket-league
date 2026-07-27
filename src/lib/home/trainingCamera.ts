import {
  homeSceneDepths,
  type HomeSceneDepth,
} from "@/lib/home/homeSceneParallax";
import type { TrainingRadarTemporalSnapshot } from "@/lib/home/trainingRadarSnapshots";

export type TrainingCameraPhase = "neutral";

export type TrainingCameraPoint = {
  x: number;
  y: number;
};

export type TrainingCameraVector = TrainingCameraPoint & {
  scale: number;
};

export type TrainingCameraProfile =
  | "sky"
  | "skyline"
  | "architecture-mid"
  | "architecture-near"
  | "ground"
  | "particles-far"
  | "particles-mid"
  | "particles-near"
  | "objects"
  | "ball"
  | "fennec";

export type TrainingCameraSnapshot = TrainingCameraVector & {
  contactCount: number;
  depthPoints: Readonly<Record<HomeSceneDepth, TrainingCameraPoint>>;
  phase: TrainingCameraPhase;
  profilePoints: Readonly<
    Record<TrainingCameraProfile, TrainingCameraPoint>
  >;
  progress: number;
  sourceEvent: string;
  stabilized: boolean;
  startedAtMs: number;
  targetScale: number;
  targetX: number;
  targetY: number;
};

export type TrainingCameraApplyMetrics = {
  absoluteResumeCorrect: boolean;
  cameraSnapshot: TrainingCameraSnapshot;
  cssWrites: number;
  cssWritesAvoided: number;
  gpuUpdates: number;
  gpuUpdatesAvoided: number;
  missedFrames: number;
};

export type TrainingCameraFrameApplier = (
  snapshot: TrainingRadarTemporalSnapshot,
) => TrainingCameraApplyMetrics;

const TRAINING_CAMERA_PROFILES = [
  "sky",
  "skyline",
  "architecture-mid",
  "architecture-near",
  "ground",
  "particles-far",
  "particles-mid",
  "particles-near",
  "objects",
  "ball",
  "fennec",
] as const satisfies readonly TrainingCameraProfile[];

export const TRAINING_CAMERA_DEPTHS = Object.keys(
  homeSceneDepths,
) as HomeSceneDepth[];

function centeredDepthPoints() {
  const points = {} as Record<HomeSceneDepth, TrainingCameraPoint>;
  for (const depth of TRAINING_CAMERA_DEPTHS) {
    points[depth] = { x: 0, y: 0 };
  }
  return points;
}

function centeredProfilePoints() {
  const points = {} as Record<
    TrainingCameraProfile,
    TrainingCameraPoint
  >;
  for (const profile of TRAINING_CAMERA_PROFILES) {
    points[profile] = { x: 0, y: 0 };
  }
  return points;
}

export function getCenteredTrainingCameraSnapshot(): TrainingCameraSnapshot {
  return {
    x: 0,
    y: 0,
    scale: 1,
    contactCount: 0,
    depthPoints: centeredDepthPoints(),
    phase: "neutral",
    profilePoints: centeredProfilePoints(),
    progress: 1,
    sourceEvent: "neutral",
    stabilized: true,
    startedAtMs: 0,
    targetScale: 1,
    targetX: 0,
    targetY: 0,
  };
}
