"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
import type { TrainingRendererMode } from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingRadarClock } from "@/lib/home/trainingRadarClock";
import {
  TrainingDomRadarApplier,
  type TrainingDomApplyMetrics,
} from "@/lib/home/trainingDomRadarApplier";
import {
  createTrainingRadarFrameState,
  getTrainingRadarTemporalSnapshot,
  type TrainingRadarTemporalSnapshot,
} from "@/lib/home/trainingRadarSnapshots";

type UseTrainingDomRadarDriverInput = {
  active: boolean;
  debugCollector: TrainingGpuDebugCollector | null;
  mode: TrainingRendererMode;
  radarClock: TrainingRadarClock;
  rootRef: RefObject<HTMLDivElement | null>;
  running: boolean;
};

const EMPTY_METRICS: TrainingDomApplyMetrics = {
  changedValues: 0,
  updates: 0,
};

export function useTrainingDomRadarDriver({
  active,
  debugCollector,
  mode,
  radarClock,
  rootRef,
  running,
}: UseTrainingDomRadarDriverInput) {
  const applierRef = useRef<TrainingDomRadarApplier | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const applier = new TrainingDomRadarApplier(root);
    applierRef.current = applier;
    return () => {
      applier.destroy();
      if (applierRef.current === applier) applierRef.current = null;
    };
  }, [rootRef]);

  const applySnapshot = useCallback(
    (snapshot: TrainingRadarTemporalSnapshot) => {
      const metrics = applierRef.current?.apply(snapshot) ?? EMPTY_METRICS;
      debugCollector?.setGlobal({
        domUpdatesPerFrame: metrics.updates,
        domChangedValuesPerFrame: metrics.changedValues,
      });
      return metrics;
    },
    [debugCollector],
  );

  useEffect(() => {
    if (mode !== "dom" || !active || !running) {
      const clockSnapshot = radarClock.sample(performance.now());
      applySnapshot(
        getTrainingRadarTemporalSnapshot(
          createTrainingRadarFrameState(
            active,
            running,
            clockSnapshot,
          ),
        ),
      );
      debugCollector?.setGlobal({
        activeDriver: "none",
        trainingRafCount: 0,
      });
      return;
    }

    let animationFrameId: number | null = null;
    let cancelled = false;

    const renderFrame = (nowMs: number) => {
      animationFrameId = null;
      if (cancelled) return;
      const clockSnapshot = radarClock.sample(nowMs);
      const snapshot = getTrainingRadarTemporalSnapshot(
        createTrainingRadarFrameState(active, running, clockSnapshot),
      );
      applySnapshot(snapshot);
      debugCollector?.recordFrame(nowMs);
      debugCollector?.setGlobal({
        activeDriver: "dom",
        rendererActive: true,
        rendererSuspended: false,
        rafActive: true,
        trainingRafCount: 1,
        passMode: snapshot.frameState.passMode,
        passProgress: snapshot.frameState.radarProgress,
        passKey: snapshot.frameState.passKey,
        passStartedAtMs: snapshot.frameState.passStartedAtMs,
        masterClockNowMs: snapshot.frameState.nowMs,
      });
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    animationFrameId = window.requestAnimationFrame(renderFrame);

    return () => {
      cancelled = true;
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      debugCollector?.setGlobal({
        activeDriver: "none",
        rendererActive: false,
        rendererSuspended: true,
        rafActive: false,
        trainingRafCount: 0,
      });
    };
  }, [
    active,
    applySnapshot,
    debugCollector,
    mode,
    radarClock,
    running,
  ]);

  return applySnapshot;
}
