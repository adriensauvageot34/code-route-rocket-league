import { homeIllustrationAssets, type HomeIllustrationAsset } from "@/lib/home/homeIllustrationAssets";

export const TRAINING_RADAR_TIMING = {
  passDurationMs: 4600,
  entryDurationMs: 250,
  travelDurationMs: 1300,
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

type TrainingTargetPlacement = {
  aspectRatio: `${number} / ${number}`;
  left: `${number}%`;
  top: `${number}%`;
  transformOrigin: `${number}% ${number}%`;
  width: `${number}%`;
};

type TrainingCarRadarTarget = {
  glowAsset: HomeIllustrationAsset;
  id: "left-car" | "back-right-car" | "front-right-car";
  placement: TrainingTargetPlacement;
  scanHitProgress: number;
  type: "car";
  visibleDurationMs: number;
  wireframeAsset: HomeIllustrationAsset;
};

type TrainingBallRadarTarget = {
  energyAsset: HomeIllustrationAsset;
  id: "ball";
  scanHitProgress: number;
  type: "ball";
  visibleDurationMs: number;
};

export type TrainingRadarTarget = TrainingCarRadarTarget | TrainingBallRadarTarget;

const assets = homeIllustrationAssets.training;

export const trainingRadarTargets = [
  {
    id: "left-car",
    type: "car",
    wireframeAsset: assets.wireframeCar01,
    glowAsset: assets.wireframeCar01Glow,
    placement: {
      left: "34.76%",
      top: "25.3%",
      width: "6.45%",
      aspectRatio: "1607 / 979",
      transformOrigin: "50% 82%",
    },
    scanHitProgress: 0.454,
    visibleDurationMs: TRAINING_RADAR_TIMING.visibleDurationMs,
  },
  {
    id: "back-right-car",
    type: "car",
    wireframeAsset: assets.wireframeCar02,
    glowAsset: assets.wireframeCar02Glow,
    placement: {
      left: "69.28%",
      top: "24.26%",
      width: "4.74%",
      aspectRatio: "1612 / 975",
      transformOrigin: "50% 82%",
    },
    scanHitProgress: 0.725,
    visibleDurationMs: TRAINING_RADAR_TIMING.visibleDurationMs,
  },
  {
    id: "front-right-car",
    type: "car",
    wireframeAsset: assets.wireframeCar03,
    glowAsset: assets.wireframeCar03Glow,
    placement: {
      left: "73.84%",
      top: "31.83%",
      width: "9.93%",
      aspectRatio: "1619 / 972",
      transformOrigin: "50% 82%",
    },
    scanHitProgress: 0.801,
    visibleDurationMs: TRAINING_RADAR_TIMING.visibleDurationMs,
  },
  {
    id: "ball",
    type: "ball",
    energyAsset: assets.ballEnergyGold,
    scanHitProgress: 0.548,
    visibleDurationMs: TRAINING_RADAR_TIMING.visibleDurationMs,
  },
] as const satisfies readonly TrainingRadarTarget[];

export type TrainingRadarTargetId = (typeof trainingRadarTargets)[number]["id"];

export function getTrainingRadarHitDelayMs(target: TrainingRadarTarget) {
  return Math.round(
    TRAINING_RADAR_TIMING.entryDurationMs +
      TRAINING_RADAR_TIMING.travelDurationMs * target.scanHitProgress,
  );
}
