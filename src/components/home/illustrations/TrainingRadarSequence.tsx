"use client";

import {
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  getTrainingRadarRangeTiming,
  TRAINING_RADAR_TIMING,
  TRAINING_VOLUME_SCAN_TIMING,
  trainingFennecVolumeScanTarget,
  trainingRadarTargets,
  trainingVolumeScanTargets,
  type TrainingRadarTargetId,
  type TrainingVolumeScanTargetId,
} from "@/lib/home/trainingRadarTargets";

export type TrainingRadarPassMode = "volume" | "tactical";
export type TrainingTacticalPhase = "hidden" | "contact" | "active";
export type TrainingVolumeScanPhase = "hidden" | "active" | "hold" | "fade";
export type TrainingFennecSurfaceMode = "hidden" | "reveal";

type TrainingRadarSequenceState = {
  fennecSurfaceMode: TrainingFennecSurfaceMode;
  fennecTacticalActive: boolean;
  passKey: number;
  passMode: TrainingRadarPassMode;
  running: boolean;
  tacticalPhases: Record<TrainingRadarTargetId, TrainingTacticalPhase>;
  volumeScanPhases: Record<TrainingVolumeScanTargetId, TrainingVolumeScanPhase>;
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

const HIDDEN_VOLUME_SCAN_PHASES: Record<TrainingVolumeScanTargetId, TrainingVolumeScanPhase> = {
  "left-car": "hidden",
  "back-right-car": "hidden",
  "front-right-car": "hidden",
  ball: "hidden",
  fennec: "hidden",
};

const INITIAL_SEQUENCE_STATE: TrainingRadarSequenceState = {
  fennecSurfaceMode: "hidden",
  fennecTacticalActive: false,
  passKey: 0,
  passMode: "volume",
  running: false,
  tacticalPhases: HIDDEN_TACTICAL_PHASES,
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
    let nextPassMode: TrainingRadarPassMode = "volume";

    function schedule(callback: () => void, delayMs: number) {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!cancelled) callback();
      }, delayMs);
      timers.add(timer);
    }

    function setVolumeScan(
      targetId: TrainingVolumeScanTargetId,
      phase: TrainingVolumeScanPhase,
      surfaceMode?: TrainingFennecSurfaceMode,
    ) {
      setSequence((current) => ({
        ...current,
        fennecSurfaceMode: surfaceMode ?? current.fennecSurfaceMode,
        volumeScanPhases: {
          ...current.volumeScanPhases,
          [targetId]: phase,
        },
      }));
    }

    function scheduleVolumePass() {
      for (const volumeTarget of trainingVolumeScanTargets) {
        const fennecRangeTiming =
          volumeTarget.type === "fennec"
            ? getTrainingRadarRangeTiming(volumeTarget.scanRange)
            : null;
        const startDelayMs = volumeTarget.scanDelayMs;
        const activeDurationMs =
          fennecRangeTiming?.durationMs ??
          (volumeTarget.type === "ball"
            ? TRAINING_VOLUME_SCAN_TIMING.ballActiveDurationMs
            : TRAINING_VOLUME_SCAN_TIMING.activeDurationMs);
        schedule(() => {
          setVolumeScan(
            volumeTarget.id,
            "active",
            volumeTarget.id === "fennec" ? "reveal" : undefined,
          );
        }, startDelayMs);

        schedule(() => {
          setVolumeScan(volumeTarget.id, "hold");
        }, startDelayMs + activeDurationMs);

        schedule(
          () => {
            setVolumeScan(volumeTarget.id, "fade");
          },
          startDelayMs +
            activeDurationMs +
            TRAINING_VOLUME_SCAN_TIMING.holdDurationMs,
        );

        schedule(
          () => {
            setVolumeScan(
              volumeTarget.id,
              "hidden",
              volumeTarget.id === "fennec" ? "hidden" : undefined,
            );
          },
          startDelayMs +
            activeDurationMs +
            TRAINING_VOLUME_SCAN_TIMING.holdDurationMs +
            TRAINING_VOLUME_SCAN_TIMING.fadeDurationMs,
        );
      }
    }

    function scheduleTacticalPass() {
      for (const target of trainingRadarTargets) {
        const hitDelayMs = target.tacticalDelayMs;

        schedule(() => {
          setSequence((current) => ({
            ...current,
            tacticalPhases: {
              ...current.tacticalPhases,
              [target.id]: "contact",
            },
          }));
        }, hitDelayMs);

        schedule(() => {
          setSequence((current) => ({
            ...current,
            tacticalPhases: {
              ...current.tacticalPhases,
              [target.id]: "active",
            },
          }));
        }, hitDelayMs + TRAINING_RADAR_TIMING.contactDurationMs);
      }

      schedule(() => {
        setSequence((current) => ({
          ...current,
          fennecTacticalActive: true,
        }));
      }, trainingFennecVolumeScanTarget.tacticalDelayMs);
    }

    function beginPass() {
      const passMode = nextPassMode;
      nextPassMode = passMode === "volume" ? "tactical" : "volume";

      setSequence((current) => ({
        ...current,
        fennecSurfaceMode: "hidden",
        fennecTacticalActive:
          passMode === "volume" ? false : current.fennecTacticalActive,
        passKey: current.passKey + 1,
        passMode,
        running: true,
        tacticalPhases:
          passMode === "volume" ? HIDDEN_TACTICAL_PHASES : current.tacticalPhases,
        volumeScanPhases: HIDDEN_VOLUME_SCAN_PHASES,
      }));

      if (passMode === "volume") {
        scheduleVolumePass();
      } else {
        scheduleTacticalPass();
      }

      const nextPassDelayMs =
        TRAINING_RADAR_TIMING.passDurationMs +
        (passMode === "tactical"
          ? TRAINING_RADAR_TIMING.tacticalHoldDurationMs
          : 0);

      schedule(beginPass, nextPassDelayMs);
    }

    beginPass();

    return () => {
      cancelled = true;
      for (const timer of timers) window.clearTimeout(timer);
      timers.clear();
    };
  }, [shouldRun]);

  return {
    fennecSurfaceMode: shouldRun ? sequence.fennecSurfaceMode : "hidden",
    fennecTacticalActive: shouldRun && sequence.fennecTacticalActive,
    passKey: shouldRun ? sequence.passKey : 0,
    passMode: shouldRun ? sequence.passMode : "volume",
    running: shouldRun && sequence.running,
    sceneRef,
    tacticalPhases: shouldRun
      ? sequence.tacticalPhases
      : HIDDEN_TACTICAL_PHASES,
    volumeScanPhases: shouldRun
      ? sequence.volumeScanPhases
      : HIDDEN_VOLUME_SCAN_PHASES,
  };
}
