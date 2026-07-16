"use client";

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  getTrainingRadarHitDelayMs,
  TRAINING_RADAR_TIMING,
  trainingRadarTargets,
  type TrainingRadarDirection,
  type TrainingRadarTargetId,
} from "@/lib/home/trainingRadarTargets";

export type TrainingRadarPhase = "hidden" | "glow" | "hold" | "fade";

type TrainingRadarSequenceState = {
  passDirection: TrainingRadarDirection;
  passKey: number;
  passTargetId: TrainingRadarTargetId | null;
  running: boolean;
  targetPhases: Record<TrainingRadarTargetId, TrainingRadarPhase>;
};

type UseTrainingRadarSequenceOptions = {
  active: boolean;
  launching: boolean;
};

const HIDDEN_TARGET_PHASES: Record<TrainingRadarTargetId, TrainingRadarPhase> = {
  "left-car": "hidden",
  "back-right-car": "hidden",
  "front-right-car": "hidden",
  ball: "hidden",
};

const INITIAL_SEQUENCE_STATE: TrainingRadarSequenceState = {
  passDirection: "ltr",
  passKey: 0,
  passTargetId: null,
  running: false,
  targetPhases: HIDDEN_TARGET_PHASES,
};

export function useTrainingRadarSequence({
  active,
  launching,
}: UseTrainingRadarSequenceOptions): TrainingRadarSequenceState & {
  sceneRef: RefObject<HTMLDivElement | null>;
} {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [motionAvailable, setMotionAvailable] = useState(false);
  const [sequence, setSequence] = useState<TrainingRadarSequenceState>(INITIAL_SEQUENCE_STATE);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
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
      const resetTimer = window.setTimeout(() => {
        setSequence(INITIAL_SEQUENCE_STATE);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    const timers = new Set<number>();
    let cancelled = false;
    let targetIndex = 0;

    function schedule(callback: () => void, delayMs: number) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!cancelled) callback();
      }, delayMs);
      timers.add(timer);
    }

    function setTargetPhase(
      targetId: TrainingRadarTargetId,
      phase: TrainingRadarPhase,
    ) {
      setSequence((current) => ({
        ...current,
        targetPhases: {
          ...current.targetPhases,
          [targetId]: phase,
        },
      }));
    }

    function beginPass() {
      const target = trainingRadarTargets[targetIndex];
      const passDirection: TrainingRadarDirection =
        targetIndex % 2 === 0 ? "ltr" : "rtl";
      targetIndex = (targetIndex + 1) % trainingRadarTargets.length;

      setSequence((current) => ({
        ...current,
        passDirection,
        passKey: current.passKey + 1,
        passTargetId: target.id,
        running: true,
      }));

      const hitDelayMs = getTrainingRadarHitDelayMs(target, passDirection);

      schedule(() => {
        setTargetPhase(target.id, "glow");
      }, hitDelayMs);

      schedule(() => {
        setTargetPhase(target.id, "hold");
      }, hitDelayMs + TRAINING_RADAR_TIMING.glowDurationMs);

      schedule(() => {
        setTargetPhase(target.id, "fade");
      }, hitDelayMs + target.visibleDurationMs);

      schedule(() => {
        setTargetPhase(target.id, "hidden");
      }, hitDelayMs + target.visibleDurationMs + TRAINING_RADAR_TIMING.fadeDurationMs);

      schedule(beginPass, TRAINING_RADAR_TIMING.passDurationMs);
    }

    beginPass();

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
      timers.clear();
    };
  }, [shouldRun]);

  return {
    passDirection: shouldRun ? sequence.passDirection : "ltr",
    passKey: shouldRun ? sequence.passKey : 0,
    passTargetId: shouldRun ? sequence.passTargetId : null,
    running: shouldRun && sequence.running,
    sceneRef,
    targetPhases: shouldRun ? sequence.targetPhases : HIDDEN_TARGET_PHASES,
  };
}
