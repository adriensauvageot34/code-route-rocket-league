import { homeIllustrationAssets, type HomeIllustrationAsset } from "@/lib/home/homeIllustrationAssets";

export const TRAINING_RADAR_TIMING = {
  passDurationMs: 1750,
  entryDurationMs: 250,
  travelDurationMs: 1500,
  targetRiseDurationMs: 150,
  glowDurationMs: 320,
  visibleDurationMs: 3000,
  fadeDurationMs: 550,
} as const;

export const TRAINING_RADAR_CYCLE_MS =
  TRAINING_RADAR_TIMING.passDurationMs * 4;

export const TRAINING_RADAR_FIELD_PATH =
  "M 0 360 C 360 372 650 360 836 357 C 1070 354 1365 366 1672 356 L 1672 941 L 0 941 Z";

export const TRAINING_RADAR_SWEEP = {
  startX: -260,
  endX: 1710,
} as const;

export type TrainingRadarDirection = "ltr" | "rtl";

type TrainingTargetPlacement = {
  aspectRatio: `${number} / ${number}`;
  left: `${number}%`;
  top: `${number}%`;
  transformOrigin: `${number}% ${number}%`;
  width: `${number}%`;
};

type TrainingActorGrounding = {
  sourceAnchor: {
    x: number;
    groundY: number;
  };
  target: {
    x: number;
    groundY: number;
    scale: number;
  };
  shadow: {
    height: number;
    width: number;
  };
};

export type TrainingCarRadarTarget = {
  baseAsset: HomeIllustrationAsset;
  depth: "trainingCarFar" | "trainingCarMid" | "trainingCarNear";
  grounding: TrainingActorGrounding;
  glowAsset: HomeIllustrationAsset;
  id: "left-car" | "back-right-car" | "front-right-car";
  placement: TrainingTargetPlacement;
  scanHitProgress: number;
  type: "car";
  visibleDurationMs: number;
  wireframeAsset: HomeIllustrationAsset;
};

export type TrainingBallRadarTarget = {
  baseAsset: HomeIllustrationAsset;
  depth: "trainingBall";
  energyAsset: HomeIllustrationAsset;
  grounding: TrainingActorGrounding;
  id: "ball";
  scanHitProgress: number;
  type: "ball";
  visibleDurationMs: number;
};

export type TrainingRadarTarget = TrainingCarRadarTarget | TrainingBallRadarTarget;

const assets = homeIllustrationAssets.training;

export const trainingCarRadarTargets = [
  {
    id: "left-car",
    type: "car",
    baseAsset: assets.distantCarLeft,
    depth: "trainingCarFar",
    wireframeAsset: assets.wireframeCar01,
    glowAsset: assets.wireframeCar01Glow,
    placement: {
      left: "34.76%",
      top: "25.3%",
      width: "6.45%",
      aspectRatio: "1607 / 979",
      transformOrigin: "50% 82%",
    },
    grounding: {
      sourceAnchor: { x: 0.3801, groundY: 0.3135 },
      target: { x: 0.375, groundY: 0.43, scale: 0.82 },
      shadow: { width: 0.045, height: 0.02 },
    },
    scanHitProgress: 0.45,
    visibleDurationMs: TRAINING_RADAR_TIMING.visibleDurationMs,
  },
  {
    id: "back-right-car",
    type: "car",
    baseAsset: assets.distantCarBackRight,
    depth: "trainingCarMid",
    wireframeAsset: assets.wireframeCar02,
    glowAsset: assets.wireframeCar02Glow,
    placement: {
      left: "69.28%",
      top: "24.26%",
      width: "4.74%",
      aspectRatio: "1612 / 975",
      transformOrigin: "50% 82%",
    },
    grounding: {
      sourceAnchor: { x: 0.7168, groundY: 0.2891 },
      target: { x: 0.72, groundY: 0.415, scale: 0.76 },
      shadow: { width: 0.035, height: 0.016 },
    },
    scanHitProgress: 0.743,
    visibleDurationMs: TRAINING_RADAR_TIMING.visibleDurationMs,
  },
  {
    id: "front-right-car",
    type: "car",
    baseAsset: assets.distantCarFrontRight,
    depth: "trainingCarNear",
    wireframeAsset: assets.wireframeCar03,
    glowAsset: assets.wireframeCar03Glow,
    placement: {
      left: "73.84%",
      top: "31.83%",
      width: "9.93%",
      aspectRatio: "1619 / 972",
      transformOrigin: "50% 82%",
    },
    grounding: {
      sourceAnchor: { x: 0.7886, groundY: 0.407 },
      target: { x: 0.8, groundY: 0.46, scale: 0.86 },
      shadow: { width: 0.085, height: 0.026 },
    },
    scanHitProgress: 0.811,
    visibleDurationMs: TRAINING_RADAR_TIMING.visibleDurationMs,
  },
] as const satisfies readonly TrainingCarRadarTarget[];

export const trainingBallRadarTarget = {
  id: "ball",
  type: "ball",
  baseAsset: assets.ball,
  depth: "trainingBall",
  energyAsset: assets.ballEnergyGold,
  grounding: {
    sourceAnchor: { x: 0.5062, groundY: 0.5569 },
    target: { x: 0.5062, groundY: 0.5615, scale: 0.97 },
    shadow: { width: 0.075, height: 0.024 },
  },
  scanHitProgress: 0.56,
  visibleDurationMs: TRAINING_RADAR_TIMING.visibleDurationMs,
} as const satisfies TrainingBallRadarTarget;

export const trainingRadarTargets = [
  ...trainingCarRadarTargets,
  trainingBallRadarTarget,
] as const satisfies readonly TrainingRadarTarget[];

export type TrainingRadarTargetId = (typeof trainingRadarTargets)[number]["id"];

export function getTrainingRadarHitDelayMs(
  target: TrainingRadarTarget,
  direction: TrainingRadarDirection,
) {
  const hitProgress =
    direction === "rtl" ? 1 - target.scanHitProgress : target.scanHitProgress;

  return Math.round(
    TRAINING_RADAR_TIMING.entryDurationMs +
      TRAINING_RADAR_TIMING.travelDurationMs * hitProgress,
  );
}
