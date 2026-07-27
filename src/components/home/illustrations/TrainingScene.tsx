"use client";

import { useCallback, useEffect, useState } from "react";
import { SceneGroup } from "@/components/home/illustrations/SceneGroup";
import { TrainingEnvironmentLayer } from "@/components/home/illustrations/TrainingEnvironmentLayer";
import type { TrainingEnvironmentAssetLoadResult } from "@/components/home/illustrations/TrainingEnvironmentLayer";
import { TrainingGpuCanvas } from "@/components/home/illustrations/gpu/TrainingGpuCanvas";
import { TrainingGpuDebugPanel } from "@/components/home/illustrations/gpu/TrainingGpuDebugPanel";
import { useTrainingRadarSequence } from "@/components/home/illustrations/TrainingRadarSequence";
import { TrainingStaticFallback } from "@/components/home/illustrations/TrainingStaticFallback";
import { useTrainingGpuObjectAssets } from "@/hooks/useTrainingGpuObjectAssets";
import { useTrainingRadarClock } from "@/hooks/useTrainingRadarClock";
import { useTrainingRendererDebug } from "@/hooks/useTrainingRendererDebug";
import { useTrainingRendererMode } from "@/hooks/useTrainingRendererMode";
import { useTrainingSceneStartup } from "@/hooks/useTrainingSceneStartup";
import { useTrainingStaticFallbackAssets } from "@/hooks/useTrainingStaticFallbackAssets";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
import type { TrainingCameraFrameApplier } from "@/lib/home/trainingCamera";
import type {
  TrainingGpuLifecycleSnapshot,
  TrainingRendererFallbackReason,
} from "@/lib/home/gpu/trainingGpuTypes";
import {
  createTrainingRadarFrameState,
  getTrainingRadarTemporalSnapshot,
} from "@/lib/home/trainingRadarSnapshots";

const assets = homeIllustrationAssets.training;

type TrainingSceneProps = {
  active: boolean;
  applyCameraSnapshot: TrainingCameraFrameApplier;
  launching: boolean;
};

const INITIAL_ENVIRONMENT_ASSET_STATE = {
  sky: { error: false, settled: false },
  skyline: { error: false, settled: false },
  "mid-buildings": { error: false, settled: false },
  "near-buildings": { error: false, settled: false },
  ground: { error: false, settled: false },
  barrier: { error: false, settled: false },
};

const INITIAL_GPU_LIFECYCLE: TrainingGpuLifecycleSnapshot = {
  activeDriver: "none",
  contextState: "unavailable",
  runtimeState: "preparing",
};

export function TrainingScene({
  active,
  applyCameraSnapshot,
  launching,
}: TrainingSceneProps) {
  const rendererRequest = useTrainingRendererMode();
  const requestedRendererMode = rendererRequest.requested;
  const rendererResolved = rendererRequest.resolved;
  const { debugEnabled, debugCollector } = useTrainingRendererDebug();
  const [environmentAssetState, setEnvironmentAssetState] = useState(
    INITIAL_ENVIRONMENT_ASSET_STATE,
  );
  const [gpuBasesReady, setGpuBasesReady] = useState(false);
  const [gpuCriticalError, setGpuCriticalError] = useState(false);
  const [gpuLifecycle, setGpuLifecycle] =
    useState<TrainingGpuLifecycleSnapshot>(INITIAL_GPU_LIFECYCLE);
  const [gpuLifecycleObserved, setGpuLifecycleObserved] = useState(false);
  const [gpuContextWasAvailable, setGpuContextWasAvailable] =
    useState(false);
  const [gpuResizePending, setGpuResizePending] = useState(false);
  const [gpuRadarReady, setGpuRadarReady] = useState(false);
  const [gpuParticlesReady, setGpuParticlesReady] = useState(false);
  const [gpuVolumeScansReady, setGpuVolumeScansReady] = useState(false);
  const [gpuFennecBaseReady, setGpuFennecBaseReady] = useState(false);
  const [gpuFennecEffectsReady, setGpuFennecEffectsReady] = useState(false);
  const [gpuFennecVolumeReady, setGpuFennecVolumeReady] = useState(false);
  const [gpuTacticalReady, setGpuTacticalReady] = useState(false);

  const handleGpuLifecycleStateChange = useCallback(
    (snapshot: TrainingGpuLifecycleSnapshot) => {
      setGpuLifecycle(snapshot);
      setGpuLifecycleObserved(true);
      if (
        snapshot.contextState === "available" ||
        snapshot.contextState === "restored"
      ) {
        setGpuContextWasAvailable(true);
      }
      setGpuCriticalError(
        snapshot.contextState !== "available" &&
          snapshot.contextState !== "restored",
      );
    },
    [],
  );

  const useGpuRenderer =
    rendererResolved && requestedRendererMode === "gpu";
  const gpuObjectAssetState = useTrainingGpuObjectAssets(
    useGpuRenderer,
    debugCollector,
  );
  const gpuRuntimeUnavailable =
    useGpuRenderer &&
    gpuLifecycleObserved &&
    gpuLifecycle.contextState !== "available" &&
    gpuLifecycle.contextState !== "restored";
  const gpuCriticalFailed =
    useGpuRenderer &&
    (gpuCriticalError ||
      gpuRuntimeUnavailable ||
      gpuObjectAssetState.status === "error");
  const activeRendererMode =
    !rendererResolved ||
    requestedRendererMode === "dom" ||
    gpuCriticalFailed
      ? "dom"
      : "gpu";
  const staticAssetState = useTrainingStaticFallbackAssets(
    rendererResolved && activeRendererMode === "dom",
  );
  const environmentReady = Object.values(environmentAssetState).every(
    (state) => state.settled,
  );
  const environmentError = Object.values(environmentAssetState).some(
    (state) => state.error,
  );
  const gpuCriticalReady =
    useGpuRenderer &&
    gpuObjectAssetState.status === "ready" &&
    gpuBasesReady &&
    gpuRadarReady &&
    gpuVolumeScansReady &&
    gpuFennecBaseReady &&
    gpuFennecVolumeReady;
  const staticAssetsReady = staticAssetState.status === "ready";
  const criticalAssetsReady =
    rendererResolved &&
    environmentReady &&
    (activeRendererMode === "gpu" ? gpuCriticalReady : staticAssetsReady);
  const startupFallback =
    environmentError ||
    activeRendererMode === "dom" ||
    staticAssetState.hasError;
  const {
    documentVisible,
    handleTransitionEnd: handleStartupTransitionEnd,
    reducedMotion,
    stage: startupStage,
  } = useTrainingSceneStartup({
    active,
    criticalAssetsReady,
    launching,
  });
  const {
    absolutePassIndex,
    callbackLatenessMs,
    cumulativeTheoreticalDriftMs,
    cycleStartedAtMs,
    globalTimersActive,
    nextPassBoundaryMs,
    objectTimersActive,
    passKey,
    passMode,
    passStartedAtMs,
    running,
    sceneRef,
    skippedPasses,
  } = useTrainingRadarSequence({
    active,
    launching,
    readyToStart:
      startupStage === "running" &&
      activeRendererMode === "gpu" &&
      !gpuCriticalFailed &&
      gpuCriticalReady,
  });
  const radarClock = useTrainingRadarClock({
    passKey,
    passMode,
    passStartedAtMs,
    running,
  });
  const rendererFallbackReason: TrainingRendererFallbackReason =
    !rendererResolved
      ? "none"
      : requestedRendererMode === "dom"
        ? "explicit-dom"
        : gpuObjectAssetState.status === "error"
          ? "critical-asset-failed"
          : gpuLifecycle.contextState === "restore-failed"
            ? "restore-failed"
            : gpuRuntimeUnavailable
              ? gpuContextWasAvailable
                ? "context-lost"
                : "webgl2-unavailable"
              : gpuCriticalError
                ? "initialization-failed"
                : "none";
  const rendererFallback =
    rendererResolved &&
    requestedRendererMode === "gpu" &&
    activeRendererMode === "dom";
  const runtimeState = launching
    ? "launching"
    : !documentVisible
      ? "suspended-hidden"
      : activeRendererMode === "dom"
        ? "dom-fallback"
        : gpuLifecycle.runtimeState;
  const activeDriver =
    launching ||
    !documentVisible ||
    !running ||
    activeRendererMode === "dom"
      ? "none"
      : gpuLifecycle.activeDriver;
  const showStaticFallback =
    activeRendererMode === "dom" || !gpuBasesReady || launching;
  const gpuVolumeAssets =
    gpuObjectAssetState.status === "ready" ||
    gpuObjectAssetState.status === "error"
      ? gpuObjectAssetState.objects
      : null;

  const handleEnvironmentAssetSettled = useCallback(
    ({ assetId, error }: TrainingEnvironmentAssetLoadResult) => {
      setEnvironmentAssetState((current) => {
        const previous = current[assetId as keyof typeof current];
        if (previous?.settled && previous.error === error) {
          return current;
        }

        return {
          ...current,
          [assetId]: { error, settled: true },
        };
      });
    },
    [],
  );

  useEffect(() => {
    if (!rendererResolved || activeRendererMode !== "dom") return;
    const staticSnapshot = getTrainingRadarTemporalSnapshot(
      createTrainingRadarFrameState(
        false,
        false,
        radarClock.sample(performance.now()),
      ),
    );
    applyCameraSnapshot(staticSnapshot);
  }, [
    activeRendererMode,
    applyCameraSnapshot,
    radarClock,
    rendererResolved,
  ]);

  useEffect(() => {
    debugCollector?.setGlobal({
      mode: activeRendererMode,
      rendererRequested: requestedRendererMode,
      rendererEffective: activeRendererMode,
      rendererResolved,
      rendererFallback,
      rendererFallbackReason,
      illustrationActive: active,
      radarRunning: running,
      globalTimersActive,
      objectTimersActive,
      absolutePassIndex,
      nextPassBoundaryMs,
      callbackLatenessMs,
      skippedPasses,
      cumulativeTheoreticalDriftMs,
      cycleStartedAtMs,
      documentVisible,
      contextState: useGpuRenderer
        ? gpuLifecycle.contextState
        : "unavailable",
      runtimeState,
      resizePending: gpuResizePending,
      reducedMotion,
      activeDriver,
      passStartedAtMs,
    });
  }, [
    absolutePassIndex,
    active,
    activeDriver,
    activeRendererMode,
    callbackLatenessMs,
    cumulativeTheoreticalDriftMs,
    cycleStartedAtMs,
    debugCollector,
    documentVisible,
    globalTimersActive,
    gpuLifecycle.contextState,
    gpuResizePending,
    nextPassBoundaryMs,
    objectTimersActive,
    passStartedAtMs,
    reducedMotion,
    rendererFallback,
    rendererFallbackReason,
    rendererResolved,
    requestedRendererMode,
    running,
    runtimeState,
    skippedPasses,
    useGpuRenderer,
  ]);

  return (
    <div
      className="home-scene training-scene"
      data-launching={launching ? "true" : "false"}
      data-training-critical-assets-ready={
        criticalAssetsReady ? "true" : "false"
      }
      data-training-environment-ready={environmentReady ? "true" : "false"}
      data-training-document-visible={documentVisible ? "true" : "false"}
      data-training-runtime-state={runtimeState}
      data-training-context-state={
        useGpuRenderer ? gpuLifecycle.contextState : "unavailable"
      }
      data-training-resize-pending={gpuResizePending ? "true" : "false"}
      data-training-reduced-motion={reducedMotion ? "true" : "false"}
      data-training-active-driver={activeDriver}
      data-training-gpu-critical-ready={gpuCriticalReady ? "true" : "false"}
      data-training-startup-fallback={startupFallback ? "true" : "false"}
      data-training-startup-stage={startupStage}
      data-training-renderer-requested={requestedRendererMode}
      data-training-renderer-effective={activeRendererMode}
      data-training-renderer-resolved={rendererResolved ? "true" : "false"}
      data-training-renderer-fallback={rendererFallback ? "true" : "false"}
      data-training-renderer-fallback-reason={rendererFallbackReason}
      data-radar-active={running ? "true" : "false"}
      data-gpu-bases-ready={useGpuRenderer && gpuBasesReady ? "true" : "false"}
      data-gpu-radar-ready={useGpuRenderer && gpuRadarReady ? "true" : "false"}
      data-gpu-particles-ready={
        useGpuRenderer && gpuParticlesReady ? "true" : "false"
      }
      data-gpu-object-assets-status={gpuObjectAssetState.status}
      data-gpu-fennec-base-ready={
        useGpuRenderer && gpuFennecBaseReady ? "true" : "false"
      }
      data-gpu-fennec-effects-ready={
        useGpuRenderer && gpuFennecEffectsReady ? "true" : "false"
      }
      data-gpu-fennec-volume-ready={
        useGpuRenderer && gpuFennecVolumeReady ? "true" : "false"
      }
      data-gpu-tactical-ready={
        useGpuRenderer && gpuTacticalReady ? "true" : "false"
      }
      data-gpu-volume-scans-ready={
        useGpuRenderer && gpuVolumeScansReady ? "true" : "false"
      }
      data-radar-pass-mode={passMode}
      data-scene="training"
      data-training-time-source="master-clock"
      data-training-renderer={activeRendererMode}
      onTransitionEnd={handleStartupTransitionEnd}
      ref={sceneRef}
    >
      <SceneGroup depth="trainingSky" layer={0} name="training-sky">
        <TrainingEnvironmentLayer
          asset={assets.parallaxSky}
          assetId="sky"
          onError={handleEnvironmentAssetSettled}
          onLoad={handleEnvironmentAssetSettled}
          preload
        />
      </SceneGroup>

      <SceneGroup depth="trainingSkyline" layer={1} name="training-far-skyline">
        <TrainingEnvironmentLayer
          asset={assets.parallaxFarSkyline}
          assetId="skyline"
          className="training-city-layer training-city-far"
          onError={handleEnvironmentAssetSettled}
          onLoad={handleEnvironmentAssetSettled}
          preload
        />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingMid" layer={2} name="training-atmospheric-haze">
        <div aria-hidden="true" className="training-atmospheric-haze" />
      </SceneGroup>

      <SceneGroup depth="trainingMid" layer={3} name="training-mid-buildings">
        <TrainingEnvironmentLayer
          asset={assets.parallaxMidBuildings}
          assetId="mid-buildings"
          className="training-city-layer training-city-middle"
          onError={handleEnvironmentAssetSettled}
          onLoad={handleEnvironmentAssetSettled}
        />
      </SceneGroup>

      <SceneGroup depth="trainingNear" layer={4} name="training-near-buildings">
        <TrainingEnvironmentLayer
          asset={assets.parallaxNearBuildings}
          assetId="near-buildings"
          className="training-city-layer training-city-near"
          onError={handleEnvironmentAssetSettled}
          onLoad={handleEnvironmentAssetSettled}
        />
      </SceneGroup>

      {/* Ground, radar, GPU objects, shadows, and barrier share this transformable parent to prevent relative camera drift. */}
      <div
        className="training-world-plane"
        data-training-world-plane="true"
      >
        <SceneGroup depth="trainingGround" layer={5} name="training-ground">
          <TrainingEnvironmentLayer
            asset={assets.parallaxGround}
            assetId="ground"
            onError={handleEnvironmentAssetSettled}
            onLoad={handleEnvironmentAssetSettled}
            preload
          />
        </SceneGroup>

        {useGpuRenderer ? (
          <TrainingGpuCanvas
            active={active}
            applyCameraSnapshot={applyCameraSnapshot}
            applyDomSnapshot={null}
            debugCollector={debugCollector}
            onBasesReadyChange={setGpuBasesReady}
            onCriticalErrorChange={setGpuCriticalError}
            onFennecBaseReadyChange={setGpuFennecBaseReady}
            onFennecEffectsReadyChange={setGpuFennecEffectsReady}
            onFennecVolumeReadyChange={setGpuFennecVolumeReady}
            onLifecycleStateChange={handleGpuLifecycleStateChange}
            onParticlesReadyChange={setGpuParticlesReady}
            onRadarReadyChange={setGpuRadarReady}
            onVolumeScansReadyChange={setGpuVolumeScansReady}
            onTacticalReadyChange={setGpuTacticalReady}
            onResizePendingChange={setGpuResizePending}
            radarClock={radarClock}
            running={
              running &&
              activeRendererMode === "gpu" &&
              !gpuCriticalFailed
            }
            volumeAssets={gpuVolumeAssets}
          />
        ) : null}

        <SceneGroup depth="trainingGround" layer={8} name="training-barrier">
          <TrainingEnvironmentLayer
            asset={assets.parallaxBarrier}
            assetId="barrier"
            onError={handleEnvironmentAssetSettled}
            onLoad={handleEnvironmentAssetSettled}
            preload
          />
        </SceneGroup>

        {showStaticFallback ? <TrainingStaticFallback /> : null}
      </div>

      {debugEnabled && debugCollector ? (
        <TrainingGpuDebugPanel
          collector={debugCollector}
          illustrationActive={active}
          mode={activeRendererMode}
          radarClock={radarClock}
          radarRunning={running}
        />
      ) : null}
    </div>
  );
}
