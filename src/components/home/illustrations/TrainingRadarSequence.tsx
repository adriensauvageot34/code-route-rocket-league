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

export type TrainingRadarPhase =
  | "hidden"
  | "contact"
  | "surface"
  | "contour"
  | "wireframe"
  | "fade";

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
    let activeTargetId: TrainingRadarTargetId | null = null;

    function schedule(callback: () => void, delayMs: number) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!cancelled) callback();
      }, delayMs);
      timers.add(timer);
    }

    function activateTarget(targetId: TrainingRadarTargetId) {
      activeTargetId = targetId;
      setSequence((current) => ({
        ...current,
        targetPhases: {
          ...HIDDEN_TARGET_PHASES,
          [targetId]: "contact",
        },
      }));
    }

    function setTargetPhaseIfActive(
      targetId: TrainingRadarTargetId,
      phase: TrainingRadarPhase,
    ) {
      if (activeTargetId !== targetId) return;

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
        activateTarget(target.id);
      }, hitDelayMs);

      schedule(() => {
        setTargetPhaseIfActive(target.id, "surface");
      }, hitDelayMs + TRAINING_RADAR_TIMING.surfaceDelayMs);

      schedule(() => {
        setTargetPhaseIfActive(target.id, "contour");
      }, hitDelayMs + TRAINING_RADAR_TIMING.contourDelayMs);

      schedule(() => {
        setTargetPhaseIfActive(target.id, "wireframe");
      }, hitDelayMs + TRAINING_RADAR_TIMING.wireframeDelayMs);

      schedule(() => {
        setTargetPhaseIfActive(target.id, "fade");
      }, hitDelayMs + TRAINING_RADAR_TIMING.fadeDelayMs);

      schedule(() => {
        setTargetPhaseIfActive(target.id, "hidden");
        if (activeTargetId === target.id) activeTargetId = null;
      }, hitDelayMs + TRAINING_RADAR_TIMING.targetLifetimeMs);

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
