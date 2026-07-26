"use client";

import {
  useCallback,
  useEffect,
  useRef,
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
import { TrainingRadarOverlay } from "@/components/home/illustrations/TrainingRadarOverlay";
import { useTrainingRadarSequence } from "@/components/home/illustrations/TrainingRadarSequence";
import { TrainingParticleField } from "@/components/home/illustrations/TrainingParticleField";
import { useTrainingDomRadarDriver } from "@/hooks/useTrainingDomRadarDriver";
import { useTrainingGpuObjectAssets } from "@/hooks/useTrainingGpuObjectAssets";
import { useTrainingRadarClock } from "@/hooks/useTrainingRadarClock";
import { useTrainingRendererMode } from "@/hooks/useTrainingRendererMode";
import { useTrainingRendererDebug } from "@/hooks/useTrainingRendererDebug";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
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

export function TrainingScene({ active, launching }: TrainingSceneProps) {
  const trainingRendererMode = useTrainingRendererMode();
  const { debugEnabled, debugCollector } = useTrainingRendererDebug();
  const {
    absolutePassIndex,
    callbackLatenessMs,
    cumulativeTheoreticalDriftMs,
    globalTimersActive,
    nextPassBoundaryMs,
    objectTimersActive,
    passKey,
    passMode,
    passStartedAtMs,
    running,
    sceneRef,
    skippedPasses,
  } = useTrainingRadarSequence({ active, launching });
  const radarClock = useTrainingRadarClock({
    passKey,
    passMode,
    passStartedAtMs,
    running,
  });
  const leftCarVolumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const backRightCarVolumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const frontRightCarVolumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const ballVolumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const fennecVolumeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [gpuBasesReady, setGpuBasesReady] = useState(false);
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
  const useGpuRenderer = trainingRendererMode === "gpu";
  const gpuObjectAssetState = useTrainingGpuObjectAssets(
    useGpuRenderer,
    debugCollector,
  );
  const showDomBase = !useGpuRenderer || !gpuBasesReady;
  const showDomRadar = !useGpuRenderer || !gpuRadarReady;
  const showDomParticles = !useGpuRenderer || !gpuParticlesReady;
  const showDomVolumeScan = !useGpuRenderer || !gpuVolumeScansReady;
  const showDomTactical = !useGpuRenderer || !gpuTacticalReady;
  const applyDomSnapshot = useTrainingDomRadarDriver({
    active,
    debugCollector,
    mode: trainingRendererMode,
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

  useEffect(() => {
    debugCollector?.setGlobal({
      mode: trainingRendererMode,
      illustrationActive: active,
      radarRunning: running,
      globalTimersActive,
      objectTimersActive,
      absolutePassIndex,
      nextPassBoundaryMs,
      callbackLatenessMs,
      skippedPasses,
      cumulativeTheoreticalDriftMs,
      passStartedAtMs,
    });
  }, [
    absolutePassIndex,
    active,
    callbackLatenessMs,
    cumulativeTheoreticalDriftMs,
    debugCollector,
    globalTimersActive,
    nextPassBoundaryMs,
    objectTimersActive,
    passStartedAtMs,
    running,
    skippedPasses,
    trainingRendererMode,
  ]);

  return (
    <div
      className="home-scene training-scene"
      data-launching={launching ? "true" : "false"}
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
      data-training-renderer={trainingRendererMode}
      ref={sceneRef}
    >
      <SceneGroup depth="trainingSky" layer={0} name="training-sky">
        <SceneLayer asset={assets.parallaxSky} preload />
      </SceneGroup>

      <SceneGroup depth="trainingSkyline" layer={1} name="training-far-skyline">
        <SceneLayer
          asset={assets.parallaxFarSkyline}
          className="training-city-layer training-city-far"
          preload
        />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingMid" layer={2} name="training-atmospheric-haze">
        <div aria-hidden="true" className="training-atmospheric-haze" />
      </SceneGroup>

      <SceneGroup depth="trainingMid" layer={3} name="training-mid-buildings">
        <SceneLayer
          asset={assets.parallaxMidBuildings}
          className="training-city-layer training-city-middle"
        />
      </SceneGroup>

      <SceneGroup depth="trainingNear" layer={4} name="training-near-buildings">
        <SceneLayer
          asset={assets.parallaxNearBuildings}
          className="training-city-layer training-city-near"
        />
      </SceneGroup>

      <SceneGroup depth="trainingGround" layer={5} name="training-ground">
        <SceneLayer asset={assets.parallaxGround} preload />
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
          applyDomSnapshot={applyDomSnapshot}
          debugCollector={debugCollector}
          onBasesReadyChange={handleGpuBasesReadyChange}
          onFennecBaseReadyChange={handleGpuFennecBaseReadyChange}
          onFennecEffectsReadyChange={handleGpuFennecEffectsReadyChange}
          onFennecVolumeReadyChange={handleGpuFennecVolumeReadyChange}
          onParticlesReadyChange={handleGpuParticlesReadyChange}
          onRadarReadyChange={handleGpuRadarReadyChange}
          onVolumeScansReadyChange={handleGpuVolumeScansReadyChange}
          onTacticalReadyChange={handleGpuTacticalReadyChange}
          radarClock={radarClock}
          running={running}
          volumeAssets={gpuVolumeAssets}
          leftCarVolumeCanvasRef={leftCarVolumeCanvasRef}
          backRightCarVolumeCanvasRef={backRightCarVolumeCanvasRef}
          frontRightCarVolumeCanvasRef={frontRightCarVolumeCanvasRef}
          ballVolumeCanvasRef={ballVolumeCanvasRef}
          fennecVolumeCanvasRef={fennecVolumeCanvasRef}
        />
      ) : null}

      <SceneGroup depth="trainingGround" layer={8} name="training-barrier">
        <SceneLayer asset={assets.parallaxBarrier} preload />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingParticlesFar" layer={9} name="training-particles-far">
        <TrainingParticleField
          domVisible={showDomParticles}
          preset="far"
        />
      </SceneGroup>

      <SceneGroup depth={trainingFarCarTarget.depth} layer={10} name={`training-${trainingFarCarTarget.id}`}>
        <TrainingGroundedCar
          gpuVolumeCanvasRef={leftCarVolumeCanvasRef}
          showDomBase={showDomBase}
          showDomVolumeScan={showDomVolumeScan}
          showDomTactical={showDomTactical}
          showGpuVolumeCanvas={useGpuRenderer}
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
          gpuVolumeCanvasRef={backRightCarVolumeCanvasRef}
          showDomBase={showDomBase}
          showDomVolumeScan={showDomVolumeScan}
          showDomTactical={showDomTactical}
          showGpuVolumeCanvas={useGpuRenderer}
          target={trainingMidCarTarget}
        />
      </SceneGroup>

      <SceneGroup depth={trainingNearCarTarget.depth} layer={13} name={`training-${trainingNearCarTarget.id}`}>
        <TrainingGroundedCar
          gpuVolumeCanvasRef={frontRightCarVolumeCanvasRef}
          showDomBase={showDomBase}
          showDomVolumeScan={showDomVolumeScan}
          showDomTactical={showDomTactical}
          showGpuVolumeCanvas={useGpuRenderer}
          target={trainingNearCarTarget}
        />
      </SceneGroup>

      <SceneGroup depth={trainingBallRadarTarget.depth} layer={14} name="ball">
        <TrainingGroundedBall
          gpuVolumeCanvasRef={ballVolumeCanvasRef}
          showDomBase={showDomBase}
          showDomVolumeScan={showDomVolumeScan}
          showDomTactical={showDomTactical}
          showGpuVolumeCanvas={useGpuRenderer}
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
        {useGpuRenderer ? (
          <canvas
            aria-hidden="true"
            className="training-gpu-canvas training-gpu-fennec-canvas"
            ref={fennecVolumeCanvasRef}
          />
        ) : null}
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
          mode={trainingRendererMode}
          radarClock={radarClock}
          radarRunning={running}
        />
      ) : null}
    </div>
  );
}
