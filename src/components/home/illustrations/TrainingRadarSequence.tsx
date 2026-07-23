"use client";

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  TRAINING_RADAR_TIMING,
} from "@/lib/home/trainingRadarTargets";

export type TrainingRadarPassMode = "volume" | "tactical";

type TrainingRadarSequenceState = {
  passKey: number;
  passMode: TrainingRadarPassMode;
  running: boolean;
};

type UseTrainingRadarSequenceOptions = {
  active: boolean;
  launching: boolean;
};

const INITIAL_SEQUENCE_STATE: TrainingRadarSequenceState = {
  passKey: 0,
  passMode: "volume",
  running: false,
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
      setSequence(INITIAL_SEQUENCE_STATE);
      return;
    }

    let cancelled = false;
    let passTimer: number | null = null;
    let nextPassMode: TrainingRadarPassMode = "volume";

    function beginPass() {
      if (cancelled) return;

      const passMode = nextPassMode;
      nextPassMode = passMode === "volume" ? "tactical" : "volume";

      setSequence((current) => ({
        passKey: current.passKey + 1,
        passMode,
        running: true,
      }));

      const nextPassDelayMs =
        TRAINING_RADAR_TIMING.passDurationMs +
        (passMode === "tactical"
          ? TRAINING_RADAR_TIMING.tacticalHoldDurationMs
          : 0);

      passTimer = window.setTimeout(beginPass, nextPassDelayMs);
    }

    beginPass();

    return () => {
      cancelled = true;
      if (passTimer !== null) window.clearTimeout(passTimer);
    };
  }, [shouldRun]);

  return {
    passKey: shouldRun ? sequence.passKey : 0,
    passMode: shouldRun ? sequence.passMode : "volume",
    running: shouldRun && sequence.running,
    sceneRef,
  };
}
