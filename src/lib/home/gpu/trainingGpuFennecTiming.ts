import type { TrainingGpuFrameState } from "@/lib/home/gpu/trainingGpuTypes";
import { trainingFennecVolumeScanTarget } from "@/lib/home/trainingRadarTargets";

export type TrainingGpuFennecEffectsState = {
  activeProgress: number;
  baseOpacity: number;
  impactOpacity: number;
};

const FENNEC_TACTICAL_EMPHASIS_DURATION_MS = 650;

const FENNEC_TACTICAL_IMPACT_KEYFRAMES = [
  { progress: 0, opacity: 0 },
  { progress: 0.12, opacity: 0.15 },
  { progress: 0.18, opacity: 0.45 },
  { progress: 0.25, opacity: 0.2 },
  { progress: 0.32, opacity: 0.55 },
  { progress: 0.4, opacity: 0.3 },
  { progress: 0.48, opacity: 0.6 },
  { progress: 0.57, opacity: 0.4 },
  { progress: 0.66, opacity: 0.52 },
  { progress: 0.76, opacity: 0.25 },
  { progress: 0.86, opacity: 0.1 },
  { progress: 1, opacity: 0 },
] as const;

type TrainingGpuFennecImpactKeyframe =
  (typeof FENNEC_TACTICAL_IMPACT_KEYFRAMES)[number];

const HIDDEN_FENNEC_EFFECTS_STATE: TrainingGpuFennecEffectsState = {
  activeProgress: 0,
  baseOpacity: 1,
  impactOpacity: 0,
};

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function interpolate(left: number, right: number, progress: number) {
  return left + (right - left) * progress;
}

function getImpactOpacity(progress: number) {
  let left: TrainingGpuFennecImpactKeyframe =
    FENNEC_TACTICAL_IMPACT_KEYFRAMES[0];
  let right: TrainingGpuFennecImpactKeyframe =
    FENNEC_TACTICAL_IMPACT_KEYFRAMES[
      FENNEC_TACTICAL_IMPACT_KEYFRAMES.length - 1
    ];

  for (
    let index = 1;
    index < FENNEC_TACTICAL_IMPACT_KEYFRAMES.length;
    index += 1
  ) {
    if (progress <= FENNEC_TACTICAL_IMPACT_KEYFRAMES[index].progress) {
      left = FENNEC_TACTICAL_IMPACT_KEYFRAMES[index - 1];
      right = FENNEC_TACTICAL_IMPACT_KEYFRAMES[index];
      break;
    }
  }

  const range = Math.max(0.0001, right.progress - left.progress);
  return interpolate(
    left.opacity,
    right.opacity,
    clampProgress((progress - left.progress) / range),
  );
}

export function getTrainingGpuFennecEffectsState(
  frameState: Pick<
    TrainingGpuFrameState,
    "elapsedMs" | "passMode" | "running"
  >,
): TrainingGpuFennecEffectsState {
  if (!frameState.running || frameState.passMode !== "tactical") {
    return HIDDEN_FENNEC_EFFECTS_STATE;
  }

  const localElapsedMs =
    frameState.elapsedMs - trainingFennecVolumeScanTarget.tacticalDelayMs;
  if (
    localElapsedMs < 0 ||
    localElapsedMs >= FENNEC_TACTICAL_EMPHASIS_DURATION_MS
  ) {
    return HIDDEN_FENNEC_EFFECTS_STATE;
  }

  const activeProgress = clampProgress(
    localElapsedMs / FENNEC_TACTICAL_EMPHASIS_DURATION_MS,
  );
  const impactOpacity = getImpactOpacity(activeProgress);
  return {
    activeProgress,
    baseOpacity: 1 - impactOpacity,
    impactOpacity,
  };
}
