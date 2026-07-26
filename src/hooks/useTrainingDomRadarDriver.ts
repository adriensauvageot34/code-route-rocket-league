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
import type {
  TrainingCameraApplyMetrics,
  TrainingCameraFrameApplier,
} from "@/lib/home/trainingCamera";
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
  applyCameraSnapshot: TrainingCameraFrameApplier;
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

function publishCameraDebug(
  debugCollector: TrainingGpuDebugCollector | null,
  metrics: TrainingCameraApplyMetrics,
) {
  const camera = metrics.cameraSnapshot;
  debugCollector?.setGlobal({
    cameraAbsoluteResumeCorrect: metrics.absoluteResumeCorrect,
    cameraContactsObserved: camera.contactCount,
    cameraCssWrites: metrics.cssWrites,
    cameraCssWritesAvoided: metrics.cssWritesAvoided,
    cameraDepthProfile: "multi-depth",
    cameraGpuUpdates: metrics.gpuUpdates,
    cameraGpuUpdatesAvoided: metrics.gpuUpdatesAvoided,
    cameraMissedFrames: metrics.missedFrames,
    cameraPhase: camera.phase,
    cameraScale: camera.scale,
    cameraSegmentStartedAtMs: camera.startedAtMs,
    cameraSource: "master-clock",
    cameraSourceEvent: camera.sourceEvent,
    cameraStabilized: camera.stabilized,
    cameraTargetScale: camera.targetScale,
    cameraTargetX: camera.targetX,
    cameraTargetY: camera.targetY,
    cameraX: camera.x,
    cameraY: camera.y,
    additionalParallaxRafCount: 0,
    pointerListenersActive: 0,
  });
}

export function useTrainingDomRadarDriver({
  active,
  applyCameraSnapshot,
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
      const snapshot = getTrainingRadarTemporalSnapshot(
        createTrainingRadarFrameState(
          active,
          running,
          clockSnapshot,
        ),
      );
      publishCameraDebug(
        debugCollector,
        applyCameraSnapshot(snapshot),
      );
      applySnapshot(snapshot);
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
      publishCameraDebug(
        debugCollector,
        applyCameraSnapshot(snapshot),
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
    applyCameraSnapshot,
    applySnapshot,
    debugCollector,
    mode,
    radarClock,
    running,
  ]);

  return applySnapshot;
}
