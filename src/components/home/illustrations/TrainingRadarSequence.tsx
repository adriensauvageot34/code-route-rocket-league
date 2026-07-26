"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { TRAINING_RADAR_TIMING } from "@/lib/home/trainingRadarTargets";
import type { TrainingRadarPassMode } from "@/lib/home/trainingRadarClock";

type TrainingRadarSequenceState = {
  absolutePassIndex: number;
  callbackLatenessMs: number;
  cumulativeTheoreticalDriftMs: 0;
  globalTimersActive: 0 | 1;
  nextPassBoundaryMs: number;
  objectTimersActive: 0;
  passKey: number;
  passMode: TrainingRadarPassMode;
  passStartedAtMs: number;
  running: boolean;
  skippedPasses: number;
};

type UseTrainingRadarSequenceOptions = {
  active: boolean;
  launching: boolean;
};

type AbsoluteTrainingRadarPass = {
  absolutePassIndex: number;
  nextPassBoundaryMs: number;
  passMode: TrainingRadarPassMode;
  passStartedAtMs: number;
};

const VOLUME_PASS_DURATION_MS = TRAINING_RADAR_TIMING.passDurationMs;
const TACTICAL_PASS_DURATION_MS =
  TRAINING_RADAR_TIMING.passDurationMs +
  TRAINING_RADAR_TIMING.tacticalHoldDurationMs;
const ABSOLUTE_CYCLE_DURATION_MS =
  VOLUME_PASS_DURATION_MS + TACTICAL_PASS_DURATION_MS;

const INITIAL_SEQUENCE_STATE: TrainingRadarSequenceState = {
  absolutePassIndex: 0,
  callbackLatenessMs: 0,
  cumulativeTheoreticalDriftMs: 0,
  globalTimersActive: 0,
  nextPassBoundaryMs: 0,
  objectTimersActive: 0,
  passKey: 0,
  passMode: "volume",
  passStartedAtMs: 0,
  running: false,
  skippedPasses: 0,
};

export function getAbsoluteTrainingRadarPass(
  cycleStartedAtMs: number,
  nowMs: number,
): AbsoluteTrainingRadarPass {
  const elapsedMs = Math.max(0, nowMs - cycleStartedAtMs);
  const cycleIndex = Math.floor(elapsedMs / ABSOLUTE_CYCLE_DURATION_MS);
  const cycleOffsetMs = elapsedMs - cycleIndex * ABSOLUTE_CYCLE_DURATION_MS;
  const cyclePassIndex = cycleOffsetMs < VOLUME_PASS_DURATION_MS ? 0 : 1;
  const absolutePassIndex = cycleIndex * 2 + cyclePassIndex;
  const cycleBoundaryMs =
    cycleStartedAtMs + cycleIndex * ABSOLUTE_CYCLE_DURATION_MS;
  const passMode: TrainingRadarPassMode =
    cyclePassIndex === 0 ? "volume" : "tactical";
  const passStartedAtMs =
    cycleBoundaryMs +
    (cyclePassIndex === 0 ? 0 : VOLUME_PASS_DURATION_MS);
  const nextPassBoundaryMs =
    passStartedAtMs +
    (passMode === "volume"
      ? VOLUME_PASS_DURATION_MS
      : TACTICAL_PASS_DURATION_MS);

  return {
    absolutePassIndex,
    nextPassBoundaryMs,
    passMode,
    passStartedAtMs,
  };
}

export function useTrainingRadarSequence({
  active,
  launching,
}: UseTrainingRadarSequenceOptions): TrainingRadarSequenceState & {
  sceneRef: RefObject<HTMLDivElement | null>;
} {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [motionAvailable, setMotionAvailable] = useState(false);
  const [sequence, setSequence] = useState<TrainingRadarSequenceState>(
    INITIAL_SEQUENCE_STATE,
  );

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let documentVisible = document.visibilityState === "visible";
    let illustrationVisible = true;
    let observer: IntersectionObserver | null = null;

    function syncAvailability() {
      setMotionAvailable(
        documentVisible && illustrationVisible && !reducedMotionQuery.matches,
      );
    }

    function handleVisibilityChange() {
      documentVisible = document.visibilityState === "visible";
      syncAvailability();
    }

    reducedMotionQuery.addEventListener("change", syncAvailability);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          illustrationVisible = entry?.isIntersecting ?? true;
          syncAvailability();
        },
        { rootMargin: "80px", threshold: 0.01 },
      );
      observer.observe(scene);
    }

    syncAvailability();

    return () => {
      reducedMotionQuery.removeEventListener("change", syncAvailability);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer?.disconnect();
    };
  }, []);

  const shouldRun = active && !launching && motionAvailable;

  useEffect(() => {
    if (!shouldRun) {
      setSequence(INITIAL_SEQUENCE_STATE);
      return;
    }

    const cycleStartedAtMs = performance.now();
    let cancelled = false;
    let globalTimerId: number | null = null;
    let previousAbsolutePassIndex = -1;
    let skippedPasses = 0;

    function syncFromAbsoluteTime(expectedBoundaryMs = 0) {
      if (cancelled) return;

      const nowMs = performance.now();
      const pass = getAbsoluteTrainingRadarPass(cycleStartedAtMs, nowMs);
      if (previousAbsolutePassIndex >= 0) {
        skippedPasses += Math.max(
          0,
          pass.absolutePassIndex - previousAbsolutePassIndex - 1,
        );
      }
      previousAbsolutePassIndex = pass.absolutePassIndex;

      setSequence({
        absolutePassIndex: pass.absolutePassIndex,
        callbackLatenessMs:
          expectedBoundaryMs > 0
            ? Math.max(0, nowMs - expectedBoundaryMs)
            : 0,
        cumulativeTheoreticalDriftMs: 0,
        globalTimersActive: 1,
        nextPassBoundaryMs: pass.nextPassBoundaryMs,
        objectTimersActive: 0,
        passKey: pass.absolutePassIndex + 1,
        passMode: pass.passMode,
        passStartedAtMs: pass.passStartedAtMs,
        running: true,
        skippedPasses,
      });

      const nextBoundaryMs = pass.nextPassBoundaryMs;
      globalTimerId = window.setTimeout(
        () => syncFromAbsoluteTime(nextBoundaryMs),
        Math.max(0, nextBoundaryMs - performance.now()),
      );
    }

    syncFromAbsoluteTime();

    return () => {
      cancelled = true;
      if (globalTimerId !== null) window.clearTimeout(globalTimerId);
    };
  }, [shouldRun]);

  return {
    ...sequence,
    sceneRef,
  };
}
