import type { TrainingGpuFrameState } from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingGpuPreparedObjectId } from "@/lib/home/gpu/trainingGpuObjectAssetCatalog";
import {
  TRAINING_RADAR_TIMING,
  trainingRadarTargets,
  type TrainingRadarTarget,
} from "@/lib/home/trainingRadarTargets";

export type TrainingGpuTacticalPhase =
  | "hidden"
  | "contact"
  | "active"
  | "hold"
  | "fade";

export type TrainingGpuTacticalState = {
  phase: TrainingGpuTacticalPhase;
  localElapsedMs: number;
  contactProgress: number;
  activeProgress: number;
  holdProgress: number;
  fadeProgress: number;
  opacityFactor: number;
};

export type TrainingGpuTacticalSnapshot = Record<
  TrainingGpuPreparedObjectId,
  TrainingGpuTacticalState
>;

const TACTICAL_TARGET_IDS = [
  "left-car",
  "back-right-car",
  "front-right-car",
  "ball",
] as const satisfies readonly TrainingGpuPreparedObjectId[];

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

function hiddenState(localElapsedMs: number): TrainingGpuTacticalState {
  return {
    phase: "hidden",
    localElapsedMs,
    contactProgress: 0,
    activeProgress: 0,
    holdProgress: 0,
    fadeProgress: 0,
    opacityFactor: 0,
  };
}

export function getTrainingGpuTacticalState(
  frameState: Pick<TrainingGpuFrameState, "passMode" | "elapsedMs">,
  target: TrainingRadarTarget,
): TrainingGpuTacticalState {
  if (frameState.passMode === "volume") {
    const fadeProgress = clampProgress(
      frameState.elapsedMs / TRAINING_RADAR_TIMING.fadeDurationMs,
    );
    if (fadeProgress >= 1) return hiddenState(frameState.elapsedMs);

    return {
      phase: "fade",
      localElapsedMs: frameState.elapsedMs,
      contactProgress: 1,
      activeProgress: 1,
      holdProgress: 1,
      fadeProgress,
      opacityFactor: Math.pow(1 - fadeProgress, 2),
    };
  }

  const localElapsedMs = frameState.elapsedMs - target.tacticalDelayMs;
  if (localElapsedMs < 0) return hiddenState(localElapsedMs);

  const contactProgress = clampProgress(
    localElapsedMs / TRAINING_RADAR_TIMING.contactDurationMs,
  );
  if (contactProgress < 1) {
    return {
      phase: "contact",
      localElapsedMs,
      contactProgress,
      activeProgress: 0,
      holdProgress: 0,
      fadeProgress: 0,
      opacityFactor: 1,
    };
  }

  const activeStartedAtMs =
    target.tacticalDelayMs + TRAINING_RADAR_TIMING.contactDurationMs;
  const holdStartedAtMs = TRAINING_RADAR_TIMING.passDurationMs;
  if (frameState.elapsedMs < holdStartedAtMs) {
    return {
      phase: "active",
      localElapsedMs,
      contactProgress: 1,
      activeProgress: clampProgress(
        (frameState.elapsedMs - activeStartedAtMs) /
          Math.max(1, holdStartedAtMs - activeStartedAtMs),
      ),
      holdProgress: 0,
      fadeProgress: 0,
      opacityFactor: 1,
    };
  }

  return {
    phase: "hold",
    localElapsedMs,
    contactProgress: 1,
    activeProgress: 1,
    holdProgress: clampProgress(
      (frameState.elapsedMs - holdStartedAtMs) /
        TRAINING_RADAR_TIMING.tacticalHoldDurationMs,
    ),
    fadeProgress: 0,
    opacityFactor: 1,
  };
}

export function getTrainingGpuTacticalSnapshot(
  frameState: Pick<TrainingGpuFrameState, "passMode" | "elapsedMs">,
): TrainingGpuTacticalSnapshot {
  return Object.fromEntries(
    TACTICAL_TARGET_IDS.map((objectId) => {
      const target = trainingRadarTargets.find(
        (candidate) => candidate.id === objectId,
      );
      if (!target) {
        throw new Error(`Missing Training tactical target: ${objectId}.`);
      }
      return [objectId, getTrainingGpuTacticalState(frameState, target)];
    }),
  ) as TrainingGpuTacticalSnapshot;
}
