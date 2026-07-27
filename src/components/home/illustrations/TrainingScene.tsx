"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { SceneGroup, SceneLayer } from "@/components/home/illustrations/SceneGroup";
import {
  TrainingGroundedBall,
  TrainingGroundedCar,
} from "@/components/home/illustrations/TrainingGroundedActor";
import { TrainingGpuCanvas } from "@/components/home/illustrations/gpu/TrainingGpuCanvas";
import { TrainingGpuDebugPanel } from "@/components/home/illustrations/gpu/TrainingGpuDebugPanel";
import {
  TrainingEnvironmentLayer,
  type TrainingEnvironmentAssetLoadResult,
} from "@/components/home/illustrations/TrainingEnvironmentLayer";
import { TrainingRadarOverlay } from "@/components/home/illustrations/TrainingRadarOverlay";
import { useTrainingRadarSequence } from "@/components/home/illustrations/TrainingRadarSequence";
import { TrainingParticleField } from "@/components/home/illustrations/TrainingParticleField";
import { useTrainingDomRadarDriver } from "@/hooks/useTrainingDomRadarDriver";
import { useTrainingDomCriticalAssets } from "@/hooks/useTrainingDomCriticalAssets";
import { useTrainingGpuObjectAssets } from "@/hooks/useTrainingGpuObjectAssets";
import { useTrainingRadarClock } from "@/hooks/useTrainingRadarClock";
import { useTrainingRendererMode } from "@/hooks/useTrainingRendererMode";
import { useTrainingRendererDebug } from "@/hooks/useTrainingRendererDebug";
import { useTrainingSceneStartup } from "@/hooks/useTrainingSceneStartup";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
import type { TrainingCameraFrameApplier } from "@/lib/home/trainingCamera";
import type {
  TrainingGpuLifecycleSnapshot,
  TrainingRendererFallbackReason,
} from "@/lib/home/gpu/trainingGpuTypes";
import {
  getTrainingRadarRangeTiming,
  TRAINING_VOLUME_SCAN_TIMING,
  trainingBallRadarTarget,
  trainingCarRadarTargets,
  trainingFennecVolumeScanTarget,
  type TrainingCarRadarTarget,
} from "@/lib/home/trainingRadarTargets";

const assets = homeIllustrationAssets.training;

type TrainingSceneProps = {
  active: boolean;
  applyCameraSnapshot: TrainingCameraFrameApplier;
  launching: boolean;
};

function getTrainingCarTarget(depth: TrainingCarRadarTarget["depth"]) {
  const target = trainingCarRadarTargets.find((candidate) => candidate.depth === depth);

  if (!target) {
    throw new Error(`Missing training car target for depth: ${depth}`);
  }

  return target;
}

const trainingFarCarTarget = getTrainingCarTarget("trainingCarFar");
const trainingMidCarTarget = getTrainingCarTarget("trainingCarMid");
const trainingNearCarTarget = getTrainingCarTarget("trainingCarNear");

const INITIAL_ENVIRONMENT_ASSET_STATE = {
  sky: { fallback: false, settled: false },
  skyline: { fallback: false, settled: false },
  "mid-buildings": { fallback: false, settled: false },
  "near-buildings": { fallback: false, settled: false },
  ground: { fallback: false, settled: false },
  barrier: { fallback: false, settled: false },
};

const INITIAL_GPU_LIFECYCLE: TrainingGpuLifecycleSnapshot = {
  activeDriver: "none",
  contextState: "unavailable",
  runtimeState: "preparing",
};

type TrainingFennecScanStyle = CSSProperties & {
  "--training-fennec-mask-end-position": string;
  "--training-fennec-mask-start-position": string;
  "--training-volume-contour-delay": string;
  "--training-volume-fade-duration": string;
  "--training-volume-scan-duration": string;
  "--training-volume-scan-easing": string;
};

function getTrainingFennecScanStyle(): TrainingFennecScanStyle {
  const rangeTiming = getTrainingRadarRangeTiming(
    trainingFennecVolumeScanTarget.scanRange,
  );

  return {
    "--training-fennec-mask-end-position": `${(
      (1 - trainingFennecVolumeScanTarget.scanRange.endProgress) *
      100
    ).toFixed(1)}%`,
    "--training-fennec-mask-start-position": `${(
      (1 - trainingFennecVolumeScanTarget.scanRange.startProgress) *
      100
    ).toFixed(1)}%`,
    "--training-volume-contour-delay": `${TRAINING_VOLUME_SCAN_TIMING.contourDelayMs}ms`,
    "--training-volume-fade-duration": `${TRAINING_VOLUME_SCAN_TIMING.fadeDurationMs}ms`,
    "--training-volume-scan-duration": `${rangeTiming.durationMs}ms`,
    "--training-volume-scan-easing": rangeTiming.easing,
  };
}

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
  const handleGpuBasesReadyChange = useCallback((ready: boolean) => {
    setGpuBasesReady(ready);
  }, []);
  const handleGpuCriticalErrorChange = useCallback((error: boolean) => {
    setGpuCriticalError(error);
  }, []);
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
  const handleGpuRadarReadyChange = useCallback((ready: boolean) => {
    setGpuRadarReady(ready);
  }, []);
  const handleGpuParticlesReadyChange = useCallback((ready: boolean) => {
    setGpuParticlesReady(ready);
  }, []);
  const handleGpuVolumeScansReadyChange = useCallback((ready: boolean) => {
    setGpuVolumeScansReady(ready);
  }, []);
  const handleGpuFennecVolumeReadyChange = useCallback((ready: boolean) => {
    setGpuFennecVolumeReady(ready);
  }, []);
  const handleGpuFennecBaseReadyChange = useCallback((ready: boolean) => {
    setGpuFennecBaseReady(ready);
  }, []);
  const handleGpuFennecEffectsReadyChange = useCallback((ready: boolean) => {
    setGpuFennecEffectsReady(ready);
  }, []);
  const handleGpuTacticalReadyChange = useCallback((ready: boolean) => {
    setGpuTacticalReady(ready);
  }, []);
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
  const domCriticalAssetState = useTrainingDomCriticalAssets(
    rendererResolved && (!useGpuRenderer || gpuCriticalFailed),
  );
  const environmentReady = Object.values(environmentAssetState).every(
    (state) => state.settled,
  );
  const environmentFallback = Object.values(environmentAssetState).some(
    (state) => state.fallback,
  );
  const gpuCriticalReady =
    useGpuRenderer &&
    gpuObjectAssetState.status === "ready" &&
    gpuBasesReady &&
    gpuRadarReady &&
    gpuVolumeScansReady &&
    gpuFennecBaseReady &&
    gpuFennecVolumeReady;
  const domCriticalReady = domCriticalAssetState.status === "ready";
  const criticalAssetsReady =
    rendererResolved &&
    environmentReady &&
    (useGpuRenderer
      ? gpuCriticalReady || (gpuCriticalFailed && domCriticalReady)
      : domCriticalReady);
  const startupFallback =
    environmentFallback ||
    gpuCriticalFailed ||
    domCriticalAssetState.hasError;
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
    readyToStart: startupStage === "running",
  });
  const radarClock = useTrainingRadarClock({
    passKey,
    passMode,
    passStartedAtMs,
    running,
  });
  const activeRendererMode =
    !rendererResolved ||
    requestedRendererMode === "dom" ||
    gpuCriticalFailed
      ? "dom"
      : "gpu";
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
      : useGpuRenderer
        ? gpuLifecycle.runtimeState
        : "preparing";
  const activeDriver =
    launching || !documentVisible || !running
      ? "none"
      : activeRendererMode === "dom"
        ? "dom"
        : gpuLifecycle.activeDriver;
  const showDomBase =
    !useGpuRenderer || gpuCriticalFailed || !gpuBasesReady || launching;
  const showDomRadar =
    reducedMotion ||
    !useGpuRenderer ||
    gpuCriticalFailed ||
    !gpuRadarReady ||
    launching;
  const showDomParticles =
    !useGpuRenderer || gpuCriticalFailed || !gpuParticlesReady || launching;
  const showDomVolumeScan =
    !useGpuRenderer ||
    gpuCriticalFailed ||
    !gpuVolumeScansReady ||
    launching;
  const showDomTactical =
    !useGpuRenderer || gpuCriticalFailed || !gpuTacticalReady || launching;
  const applyDomSnapshot = useTrainingDomRadarDriver({
    active,
    applyCameraSnapshot,
    debugCollector,
    mode: activeRendererMode,
    radarClock,
    rootRef: sceneRef,
    running,
  });
  const gpuVolumeAssets =
    gpuObjectAssetState.status === "ready" ||
    gpuObjectAssetState.status === "error"
      ? gpuObjectAssetState.objects
      : null;
  const trainingFennecScanStyle = getTrainingFennecScanStyle();
  const handleEnvironmentAssetSettled = useCallback(
    ({ assetId, fallback }: TrainingEnvironmentAssetLoadResult) => {
      setEnvironmentAssetState((current) => {
        const previous = current[assetId as keyof typeof current];
        if (previous?.settled && previous.fallback === fallback) {
          return current;
        }

        return {
          ...current,
          [assetId]: { fallback, settled: true },
        };
      });
    },
    [],
  );

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
    callbackLatenessMs,
    cumulativeTheoreticalDriftMs,
    cycleStartedAtMs,
    debugCollector,
    documentVisible,
    globalTimersActive,
    nextPassBoundaryMs,
    objectTimersActive,
    activeDriver,
    gpuLifecycle.contextState,
    gpuResizePending,
    passStartedAtMs,
    running,
    reducedMotion,
    runtimeState,
    skippedPasses,
    activeRendererMode,
    rendererFallback,
    rendererFallbackReason,
    rendererResolved,
    requestedRendererMode,
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

      <SceneGroup depth="trainingGround" layer={5} name="training-ground">
        <TrainingEnvironmentLayer
          asset={assets.parallaxGround}
          assetId="ground"
          onError={handleEnvironmentAssetSettled}
          onLoad={handleEnvironmentAssetSettled}
          preload
        />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingGround" layer={6} name="training-radar-surface">
        <TrainingRadarOverlay
          domVisible={showDomRadar}
          variant="surface"
        />
      </SceneGroup>

      <SceneGroup depth="trainingGround" layer={7} name="training-radar-sweep">
        <TrainingRadarOverlay
          domVisible={showDomRadar}
          variant="sweep"
        />
      </SceneGroup>

      {useGpuRenderer ? (
        <TrainingGpuCanvas
          active={active}
          applyCameraSnapshot={applyCameraSnapshot}
          applyDomSnapshot={applyDomSnapshot}
          debugCollector={debugCollector}
          onBasesReadyChange={handleGpuBasesReadyChange}
          onCriticalErrorChange={handleGpuCriticalErrorChange}
          onFennecBaseReadyChange={handleGpuFennecBaseReadyChange}
          onFennecEffectsReadyChange={handleGpuFennecEffectsReadyChange}
          onFennecVolumeReadyChange={handleGpuFennecVolumeReadyChange}
          onLifecycleStateChange={handleGpuLifecycleStateChange}
          onParticlesReadyChange={handleGpuParticlesReadyChange}
          onRadarReadyChange={handleGpuRadarReadyChange}
          onVolumeScansReadyChange={handleGpuVolumeScansReadyChange}
          onTacticalReadyChange={handleGpuTacticalReadyChange}
          onResizePendingChange={setGpuResizePending}
          radarClock={radarClock}
          running={running && !gpuCriticalFailed}
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

      <SceneGroup blendMode="screen" depth="trainingParticlesFar" layer={9} name="training-particles-far">
        <TrainingParticleField
          domVisible={showDomParticles}
          preset="far"
        />
      </SceneGroup>

      <SceneGroup depth={trainingFarCarTarget.depth} layer={10} name={`training-${trainingFarCarTarget.id}`}>
        <TrainingGroundedCar
          showDomBase={showDomBase}
          showDomVolumeScan={showDomVolumeScan}
          showDomTactical={showDomTactical}
          target={trainingFarCarTarget}
        />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingParticlesMid" layer={11} name="training-particles-mid">
        <TrainingParticleField
          domVisible={showDomParticles}
          preset="mid"
        />
      </SceneGroup>

      <SceneGroup depth={trainingMidCarTarget.depth} layer={12} name={`training-${trainingMidCarTarget.id}`}>
        <TrainingGroundedCar
          showDomBase={showDomBase}
          showDomVolumeScan={showDomVolumeScan}
          showDomTactical={showDomTactical}
          target={trainingMidCarTarget}
        />
      </SceneGroup>

      <SceneGroup depth={trainingNearCarTarget.depth} layer={13} name={`training-${trainingNearCarTarget.id}`}>
        <TrainingGroundedCar
          showDomBase={showDomBase}
          showDomVolumeScan={showDomVolumeScan}
          showDomTactical={showDomTactical}
          target={trainingNearCarTarget}
        />
      </SceneGroup>

      <SceneGroup depth={trainingBallRadarTarget.depth} layer={14} name="ball">
        <TrainingGroundedBall
          showDomBase={showDomBase}
          showDomVolumeScan={showDomVolumeScan}
          showDomTactical={showDomTactical}
          target={trainingBallRadarTarget}
        />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingParticlesNear" layer={15} name="training-particles-near">
        <TrainingParticleField
          domVisible={showDomParticles}
          preset="near"
        />
      </SceneGroup>

      <SceneGroup depth="trainingFennec" layer={16} name="fennec">
        <div aria-hidden="true" className="training-fennec-contact-shadow" />
        <div
          className="training-fennec-base-frame"
          data-tactical-active="false"
          style={trainingFennecScanStyle}
        >
          <SceneLayer asset={assets.fennecBase} className="training-fennec-base" />
        </div>
        <div
          className="training-radar-fennec-target"
          data-surface-scan-mode="hidden"
          data-tactical-active="false"
          data-volume-scan-phase="hidden"
          style={trainingFennecScanStyle}
        >
          <div className="training-radar-fennec-surface-mask">
            <div className="training-radar-fennec-surface-frame">
              <SceneLayer
                asset={trainingFennecVolumeScanTarget.surfaceAsset}
                className="training-radar-fennec-surface"
              />
            </div>
          </div>
          <SceneLayer
            asset={trainingFennecVolumeScanTarget.contourAsset}
            className="training-radar-fennec-contour"
          />
          <div className="training-radar-fennec-impact-frame">
            <SceneLayer
              asset={trainingFennecVolumeScanTarget.impactAsset}
              className="training-radar-fennec-impact"
            />
          </div>
        </div>
        <SceneLayer asset={assets.fennecHeadlightGlow} className="training-fennec-headlight-glow" />
        <SceneLayer asset={assets.fennecRearAccent} className="training-fennec-rear-accent" />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingFennec" layer={17} name="fennec-lights-glow">
        <SceneLayer asset={assets.lightsVioletGlow} className="training-lights-glow" />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="foreground" future layer={18} name="transition">
        <SceneLayer asset={assets.transitionWaveGold} className="training-transition-wave-local" />
      </SceneGroup>

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
