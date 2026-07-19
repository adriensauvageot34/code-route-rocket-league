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
  TRAINING_VOLUME_SCAN_TIMING,
  trainingRadarTargets,
  type TrainingRadarDirection,
  type TrainingRadarTargetId,
} from "@/lib/home/trainingRadarTargets";

export type TrainingTacticalPhase =
  | "hidden"
  | "contact"
  | "wireframe"
  | "fade";

export type TrainingVolumeScanPhase = "hidden" | "active" | "fade";

type TrainingRadarSequenceState = {
  passDirection: TrainingRadarDirection;
  passKey: number;
  passTargetId: TrainingRadarTargetId | null;
  running: boolean;
  tacticalPhases: Record<TrainingRadarTargetId, TrainingTacticalPhase>;
  volumeScanDirections: Record<TrainingRadarTargetId, TrainingRadarDirection>;
  volumeScanPhases: Record<TrainingRadarTargetId, TrainingVolumeScanPhase>;
};

type UseTrainingRadarSequenceOptions = {
  active: boolean;
  launching: boolean;
};

const HIDDEN_TACTICAL_PHASES: Record<TrainingRadarTargetId, TrainingTacticalPhase> = {
  "left-car": "hidden",
  "back-right-car": "hidden",
  "front-right-car": "hidden",
  ball: "hidden",
};

const HIDDEN_VOLUME_SCAN_PHASES: Record<TrainingRadarTargetId, TrainingVolumeScanPhase> = {
  "left-car": "hidden",
  "back-right-car": "hidden",
  "front-right-car": "hidden",
  ball: "hidden",
};

const INITIAL_VOLUME_SCAN_DIRECTIONS: Record<TrainingRadarTargetId, TrainingRadarDirection> = {
  "left-car": "ltr",
  "back-right-car": "ltr",
  "front-right-car": "ltr",
  ball: "ltr",
};

const INITIAL_SEQUENCE_STATE: TrainingRadarSequenceState = {
  passDirection: "ltr",
  passKey: 0,
  passTargetId: null,
  running: false,
  tacticalPhases: HIDDEN_TACTICAL_PHASES,
  volumeScanDirections: INITIAL_VOLUME_SCAN_DIRECTIONS,
  volumeScanPhases: HIDDEN_VOLUME_SCAN_PHASES,
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
    let activeTacticalTargetId: TrainingRadarTargetId | null = null;

    function schedule(callback: () => void, delayMs: number) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!cancelled) callback();
      }, delayMs);
      timers.add(timer);
    }

    function activateTacticalTarget(targetId: TrainingRadarTargetId) {
      activeTacticalTargetId = targetId;
      setSequence((current) => ({
        ...current,
        tacticalPhases: {
          ...HIDDEN_TACTICAL_PHASES,
          [targetId]: "contact",
        },
      }));
    }

    function setTacticalPhaseIfActive(
      targetId: TrainingRadarTargetId,
      phase: TrainingTacticalPhase,
    ) {
      if (activeTacticalTargetId !== targetId) return;

      setSequence((current) => ({
        ...current,
        tacticalPhases: {
          ...current.tacticalPhases,
          [targetId]: phase,
        },
      }));
    }

    function setVolumeScan(
      targetId: TrainingRadarTargetId,
      phase: TrainingVolumeScanPhase,
      direction?: TrainingRadarDirection,
    ) {
      setSequence((current) => ({
        ...current,
        volumeScanDirections: direction
          ? { ...current.volumeScanDirections, [targetId]: direction }
          : current.volumeScanDirections,
        volumeScanPhases: {
          ...current.volumeScanPhases,
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

      for (const volumeTarget of trainingRadarTargets) {
        const volumeHitDelayMs = getTrainingRadarHitDelayMs(
          volumeTarget,
          passDirection,
        );

        schedule(() => {
          setVolumeScan(volumeTarget.id, "active", passDirection);
        }, volumeHitDelayMs);

        schedule(() => {
          setVolumeScan(volumeTarget.id, "fade");
        }, volumeHitDelayMs + TRAINING_VOLUME_SCAN_TIMING.activeDurationMs);

        schedule(() => {
          setVolumeScan(volumeTarget.id, "hidden");
        }, volumeHitDelayMs + TRAINING_VOLUME_SCAN_TIMING.totalDurationMs);
      }

      const tacticalHitDelayMs = getTrainingRadarHitDelayMs(target, passDirection);

      schedule(() => {
        activateTacticalTarget(target.id);
      }, tacticalHitDelayMs);

      schedule(() => {
        setTacticalPhaseIfActive(target.id, "wireframe");
      }, tacticalHitDelayMs + TRAINING_RADAR_TIMING.wireframeDelayMs);

      schedule(() => {
        setTacticalPhaseIfActive(target.id, "fade");
      }, tacticalHitDelayMs + TRAINING_RADAR_TIMING.fadeDelayMs);

      schedule(() => {
        setTacticalPhaseIfActive(target.id, "hidden");
        if (activeTacticalTargetId === target.id) activeTacticalTargetId = null;
      }, tacticalHitDelayMs + TRAINING_RADAR_TIMING.targetLifetimeMs);

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
    tacticalPhases: shouldRun
      ? sequence.tacticalPhases
      : HIDDEN_TACTICAL_PHASES,
    volumeScanDirections: shouldRun
      ? sequence.volumeScanDirections
      : INITIAL_VOLUME_SCAN_DIRECTIONS,
    volumeScanPhases: shouldRun
      ? sequence.volumeScanPhases
      : HIDDEN_VOLUME_SCAN_PHASES,
  };
}
