import { homeIllustrationAssets, type HomeIllustrationAsset } from "@/lib/home/homeIllustrationAssets";

const TRAINING_BALL_SCAN_PROGRESS = 0.56;
const TRAINING_FENNEC_SCAN_PROGRESS = 0.79;
const TRAINING_RADAR_ENTRY_DURATION_MS = 250;
const TRAINING_RADAR_BASE_TRAVEL_DURATION_MS = 2500;
const TRAINING_RADAR_PASS_BUFFER_MS = 200;

export const TRAINING_RADAR_SLOW_ZONES = [
  {
    id: "ball",
    centerProgress: TRAINING_BALL_SCAN_PROGRESS,
    width: 0.1,
    extraDurationMs: 220,
  },
  {
    id: "fennec",
    centerProgress: TRAINING_FENNEC_SCAN_PROGRESS,
    width: 0.16,
    extraDurationMs: 380,
  },
] as const;

const TRAINING_RADAR_TRAVEL_DURATION_MS =
  TRAINING_RADAR_BASE_TRAVEL_DURATION_MS +
  TRAINING_RADAR_SLOW_ZONES.reduce(
    (total, zone) => total + zone.extraDurationMs,
    0,
  );

export const TRAINING_RADAR_TIMING = {
  passDurationMs:
    TRAINING_RADAR_ENTRY_DURATION_MS +
    TRAINING_RADAR_TRAVEL_DURATION_MS +
    TRAINING_RADAR_PASS_BUFFER_MS,
  entryDurationMs: TRAINING_RADAR_ENTRY_DURATION_MS,
  travelDurationMs: TRAINING_RADAR_TRAVEL_DURATION_MS,
  contactDurationMs: 180,
  wireframeDelayMs: 820,
  fadeDelayMs: 1500,
  targetLifetimeMs: 2300,
  fadeDurationMs: 800,
} as const;

export const TRAINING_VOLUME_SCAN_TIMING = {
  activeDurationMs: 380,
  ballActiveDurationMs: 540,
  fennecActiveDurationMs: 720,
  contourDelayMs: 60,
  fadeDurationMs: 210,
  leadMs: 120,
  totalDurationMs: 610,
} as const;

export const TRAINING_RADAR_CYCLE_MS =
  TRAINING_RADAR_TIMING.passDurationMs * 4;

export const TRAINING_RADAR_FIELD_PATH =
  "M 0 414 C 360 423 650 415 836 412 C 1070 409 1365 421 1672 411 L 1672 941 L 0 941 Z";

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

type TrainingObjectScan = {
  angle: `${number}deg`;
  contourDelayMs: number;
  durationMs: number;
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
  contourAsset: HomeIllustrationAsset;
  depth: "trainingCarFar" | "trainingCarMid" | "trainingCarNear";
  grounding: TrainingActorGrounding;
  glowAsset: HomeIllustrationAsset;
  id: "left-car" | "back-right-car" | "front-right-car";
  objectScan: TrainingObjectScan;
  placement: TrainingTargetPlacement;
  scanHitProgress: number;
  surfaceAsset: HomeIllustrationAsset;
  type: "car";
  wireframeAsset: HomeIllustrationAsset;
};

export type TrainingBallRadarTarget = {
  baseAsset: HomeIllustrationAsset;
  contourAsset: HomeIllustrationAsset;
  depth: "trainingBall";
  energyAsset: HomeIllustrationAsset;
  grounding: TrainingActorGrounding;
  id: "ball";
  scanHitProgress: number;
  surfaceAsset: HomeIllustrationAsset;
  type: "ball";
};

export type TrainingFennecVolumeScanTarget = {
  contourAsset: HomeIllustrationAsset;
  depth: "trainingFennec";
  id: "fennec";
  impactAsset: HomeIllustrationAsset;
  scanHitProgress: number;
  scanRange: {
    endProgress: number;
    startProgress: number;
  };
  surfaceAsset: HomeIllustrationAsset;
  type: "fennec";
};

export type TrainingRadarTarget = TrainingCarRadarTarget | TrainingBallRadarTarget;
export type TrainingVolumeScanTarget =
  | TrainingRadarTarget
  | TrainingFennecVolumeScanTarget;

const assets = homeIllustrationAssets.training;

export const trainingCarRadarTargets = [
  {
    id: "left-car",
    type: "car",
    baseAsset: assets.distantCarLeft,
    surfaceAsset: assets.surfaceScanCar01,
    contourAsset: assets.contourScanCar01,
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
      target: { x: 0.375, groundY: 0.465, scale: 0.82 },
      shadow: { width: 0.045, height: 0.02 },
    },
    objectScan: {
      angle: "-19deg",
      durationMs: 380,
      contourDelayMs: 40,
    },
    scanHitProgress: 0.45,
  },
  {
    id: "back-right-car",
    type: "car",
    baseAsset: assets.distantCarBackRight,
    surfaceAsset: assets.surfaceScanCar02,
    contourAsset: assets.contourScanCar02,
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
      target: { x: 0.72, groundY: 0.45, scale: 0.76 },
      shadow: { width: 0.035, height: 0.016 },
    },
    objectScan: {
      angle: "-20deg",
      durationMs: 380,
      contourDelayMs: 50,
    },
    scanHitProgress: 0.743,
  },
  {
    id: "front-right-car",
    type: "car",
    baseAsset: assets.distantCarFrontRight,
    surfaceAsset: assets.surfaceScanCar03,
    contourAsset: assets.contourScanCar03,
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
      target: { x: 0.8, groundY: 0.49, scale: 0.86 },
      shadow: { width: 0.085, height: 0.026 },
    },
    objectScan: {
      angle: "-18deg",
      durationMs: 380,
      contourDelayMs: 60,
    },
    scanHitProgress: 0.811,
  },
] as const satisfies readonly TrainingCarRadarTarget[];

export const trainingBallRadarTarget = {
  id: "ball",
  type: "ball",
  baseAsset: assets.ball,
  surfaceAsset: assets.ballSurfaceScan,
  contourAsset: assets.ballContourScan,
  depth: "trainingBall",
  energyAsset: assets.ballEnergyGold,
  grounding: {
    sourceAnchor: { x: 0.5062, groundY: 0.5569 },
    target: { x: 0.5062, groundY: 0.5615, scale: 0.97 },
    shadow: { width: 0.075, height: 0.024 },
  },
  scanHitProgress: TRAINING_BALL_SCAN_PROGRESS,
} as const satisfies TrainingBallRadarTarget;

export const trainingRadarTargets = [
  ...trainingCarRadarTargets,
  trainingBallRadarTarget,
] as const satisfies readonly TrainingRadarTarget[];

export const trainingFennecVolumeScanTarget = {
  id: "fennec",
  type: "fennec",
  surfaceAsset: assets.fennecSurfaceScan,
  contourAsset: assets.fennecContourScan,
  impactAsset: assets.fennecRimLight,
  depth: "trainingFennec",
  scanHitProgress: TRAINING_FENNEC_SCAN_PROGRESS,
  scanRange: {
    startProgress: 0.613,
    endProgress: 0.924,
  },
} as const satisfies TrainingFennecVolumeScanTarget;

export const trainingVolumeScanTargets = [
  ...trainingRadarTargets,
  trainingFennecVolumeScanTarget,
] as const satisfies readonly TrainingVolumeScanTarget[];

export type TrainingRadarTargetId = (typeof trainingRadarTargets)[number]["id"];
export type TrainingVolumeScanTargetId =
  (typeof trainingVolumeScanTargets)[number]["id"];

function clampTrainingRadarProgress(progress: number) {
  return Math.min(1, Math.max(0, progress));
}

function smoothTrainingRadarStep(progress: number) {
  const clampedProgress = clampTrainingRadarProgress(progress);
  return clampedProgress * clampedProgress * (3 - 2 * clampedProgress);
}

function getTrainingRadarMovementProgress(
  progress: number,
  direction: TrainingRadarDirection,
) {
  const sceneProgress = clampTrainingRadarProgress(progress);
  return direction === "rtl" ? 1 - sceneProgress : sceneProgress;
}

function getTrainingRadarElapsedTravelMs(
  movementProgress: number,
  direction: TrainingRadarDirection,
) {
  const baseElapsedMs =
    TRAINING_RADAR_BASE_TRAVEL_DURATION_MS * movementProgress;
  const slowdownElapsedMs = TRAINING_RADAR_SLOW_ZONES.reduce(
    (total, zone) => {
      const centerProgress =
        direction === "rtl" ? 1 - zone.centerProgress : zone.centerProgress;
      const zoneStart = centerProgress - zone.width / 2;
      const zoneProgress = (movementProgress - zoneStart) / zone.width;

      return (
        total +
        zone.extraDurationMs * smoothTrainingRadarStep(zoneProgress)
      );
    },
    0,
  );

  return baseElapsedMs + slowdownElapsedMs;
}

export function getTrainingRadarTravelDelayForProgress(
  progress: number,
  direction: TrainingRadarDirection,
) {
  const movementProgress = getTrainingRadarMovementProgress(
    progress,
    direction,
  );

  return Math.round(
    getTrainingRadarElapsedTravelMs(movementProgress, direction),
  );
}

export function getTrainingRadarDelayForProgress(
  progress: number,
  direction: TrainingRadarDirection,
) {
  return (
    TRAINING_RADAR_TIMING.entryDurationMs +
    getTrainingRadarTravelDelayForProgress(progress, direction)
  );
}

function getTrainingRadarTravelEasing(direction: TrainingRadarDirection) {
  const sampleCount = 50;
  const points = Array.from({ length: sampleCount + 1 }, (_, index) => {
    const movementProgress = index / sampleCount;
    const elapsedProgress =
      getTrainingRadarElapsedTravelMs(movementProgress, direction) /
      TRAINING_RADAR_TIMING.travelDurationMs;

    return `${movementProgress.toFixed(3)} ${(elapsedProgress * 100).toFixed(3)}%`;
  });

  return `linear(${points.join(", ")})`;
}

export const TRAINING_RADAR_TRAVEL_EASING = {
  ltr: getTrainingRadarTravelEasing("ltr"),
  rtl: getTrainingRadarTravelEasing("rtl"),
} as const;

export function getTrainingRadarRangeTiming(
  scanRange: { endProgress: number; startProgress: number },
  direction: TrainingRadarDirection,
) {
  const sceneStartProgress =
    direction === "ltr" ? scanRange.startProgress : scanRange.endProgress;
  const sceneEndProgress =
    direction === "ltr" ? scanRange.endProgress : scanRange.startProgress;
  const movementStartProgress = getTrainingRadarMovementProgress(
    sceneStartProgress,
    direction,
  );
  const movementEndProgress = getTrainingRadarMovementProgress(
    sceneEndProgress,
    direction,
  );
  const startElapsedMs = getTrainingRadarElapsedTravelMs(
    movementStartProgress,
    direction,
  );
  const endElapsedMs = getTrainingRadarElapsedTravelMs(
    movementEndProgress,
    direction,
  );
  const durationMs = endElapsedMs - startElapsedMs;
  const sampleCount = 16;
  const easingPoints = Array.from({ length: sampleCount + 1 }, (_, index) => {
    const localProgress = index / sampleCount;
    const movementProgress =
      movementStartProgress +
      (movementEndProgress - movementStartProgress) * localProgress;
    const elapsedProgress =
      (getTrainingRadarElapsedTravelMs(movementProgress, direction) -
        startElapsedMs) /
      durationMs;

    return `${localProgress.toFixed(3)} ${(elapsedProgress * 100).toFixed(3)}%`;
  });

  return {
    durationMs: Math.round(durationMs),
    easing: `linear(${easingPoints.join(", ")})`,
    startDelayMs:
      TRAINING_RADAR_TIMING.entryDurationMs + Math.round(startElapsedMs),
  };
}

export function getTrainingRadarHitDelayMs(
  target: TrainingVolumeScanTarget,
  direction: TrainingRadarDirection,
) {
  return getTrainingRadarDelayForProgress(
    target.scanHitProgress,
    direction,
  );
}
