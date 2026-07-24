import type { TrainingGpuFrameState } from "@/lib/home/gpu/trainingGpuTypes";
import {
  getTrainingRadarRangeTiming,
  TRAINING_VOLUME_SCAN_TIMING,
} from "@/lib/home/trainingRadarTargets";
import { trainingGpuObjectRegistry } from "@/lib/home/gpu/trainingGpuObjectRegistry";
import type {
  TrainingGpuObjectId,
  TrainingGpuObjectRegistration,
} from "@/lib/home/gpu/trainingGpuObjectTypes";

export type TrainingGpuVolumeScanPhase =
  | "hidden"
  | "active"
  | "hold"
  | "fade";

export type TrainingGpuVolumeScanState = {
  phase: TrainingGpuVolumeScanPhase;
  localElapsedMs: number;
  activeProgress: number;
  surfaceProgress: number;
  contourProgress: number;
  holdProgress: number;
  fadeProgress: number;
  surfaceOpacityFactor: number;
  contourOpacityFactor: number;
};

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getHiddenState(localElapsedMs = 0): TrainingGpuVolumeScanState {
  return {
    phase: "hidden",
    localElapsedMs,
    activeProgress: 0,
    surfaceProgress: 0,
    contourProgress: 0,
    holdProgress: 0,
    fadeProgress: 0,
    surfaceOpacityFactor: 0,
    contourOpacityFactor: 0,
  };
}

function getActiveDurationMs(
  registration: TrainingGpuObjectRegistration,
) {
  const target = registration.target;
  if (target.type === "car") {
    return target.objectScan.durationMs;
  }
  if (target.type === "ball") {
    return TRAINING_VOLUME_SCAN_TIMING.ballActiveDurationMs;
  }
  return getTrainingRadarRangeTiming(target.scanRange).durationMs;
}

function getContourDelayMs(
  registration: TrainingGpuObjectRegistration,
) {
  return registration.target.type === "car"
    ? registration.target.objectScan.contourDelayMs
    : TRAINING_VOLUME_SCAN_TIMING.contourDelayMs;
}

export function getTrainingGpuVolumeScanState(
  frameState: TrainingGpuFrameState,
  registration: TrainingGpuObjectRegistration,
): TrainingGpuVolumeScanState {
  if (!frameState.running || frameState.passMode !== "volume") {
    return getHiddenState();
  }

  const localElapsedMs =
    frameState.elapsedMs - registration.target.scanDelayMs;
  if (localElapsedMs < 0) {
    return getHiddenState(localElapsedMs);
  }

  const activeDurationMs = getActiveDurationMs(registration);
  const holdDurationMs = TRAINING_VOLUME_SCAN_TIMING.holdDurationMs;
  const fadeDurationMs = TRAINING_VOLUME_SCAN_TIMING.fadeDurationMs;
  const holdStartMs = activeDurationMs;
  const fadeStartMs = holdStartMs + holdDurationMs;
  const hiddenStartMs = fadeStartMs + fadeDurationMs;

  if (localElapsedMs >= hiddenStartMs) {
    return getHiddenState(localElapsedMs);
  }

  const phase: TrainingGpuVolumeScanPhase =
    localElapsedMs < holdStartMs
      ? "active"
      : localElapsedMs < fadeStartMs
        ? "hold"
        : "fade";
  const activeProgress =
    phase === "active"
      ? clampProgress(localElapsedMs / Math.max(1, activeDurationMs))
      : 1;
  const contourDelayMs = getContourDelayMs(registration);
  const contourDurationMs = Math.max(
    1,
    activeDurationMs - contourDelayMs,
  );
  const contourProgress =
    phase === "active"
      ? clampProgress(
          (localElapsedMs - contourDelayMs) / contourDurationMs,
        )
      : 1;
  const holdProgress =
    phase === "active"
      ? 0
      : phase === "hold"
        ? clampProgress(
            (localElapsedMs - activeDurationMs) /
              Math.max(1, holdDurationMs),
          )
        : 1;
  const fadeProgress =
    phase === "fade"
      ? clampProgress(
          (localElapsedMs - fadeStartMs) /
            Math.max(1, fadeDurationMs),
        )
      : 0;
  const opacityFactor = 1 - fadeProgress;

  return {
    phase,
    localElapsedMs,
    activeProgress,
    surfaceProgress: phase === "active" ? activeProgress : 1,
    contourProgress,
    holdProgress,
    fadeProgress,
    surfaceOpacityFactor: opacityFactor,
    contourOpacityFactor: opacityFactor,
  };
}

export function getTrainingGpuVolumeScanSnapshot(
  frameState: TrainingGpuFrameState,
): Record<TrainingGpuObjectId, TrainingGpuVolumeScanState> {
  const snapshot = {} as Record<
    TrainingGpuObjectId,
    TrainingGpuVolumeScanState
  >;

  for (const registration of trainingGpuObjectRegistry) {
    snapshot[registration.id] = getTrainingGpuVolumeScanState(
      frameState,
      registration,
    );
  }

  return snapshot;
}
