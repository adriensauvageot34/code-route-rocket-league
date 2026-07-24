"use client";

import { useCallback, useState, type CSSProperties } from "react";
import { SceneGroup, SceneLayer } from "@/components/home/illustrations/SceneGroup";
import {
  TrainingGroundedBall,
  TrainingGroundedCar,
} from "@/components/home/illustrations/TrainingGroundedActor";
import { TrainingGpuCanvas } from "@/components/home/illustrations/gpu/TrainingGpuCanvas";
import { TrainingRadarOverlay } from "@/components/home/illustrations/TrainingRadarOverlay";
import { useTrainingRadarSequence } from "@/components/home/illustrations/TrainingRadarSequence";
import { TrainingParticleField } from "@/components/home/illustrations/TrainingParticleField";
import { useTrainingGpuObjectAssets } from "@/hooks/useTrainingGpuObjectAssets";
import { useTrainingRadarClock } from "@/hooks/useTrainingRadarClock";
import { useTrainingRendererMode } from "@/hooks/useTrainingRendererMode";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
import {
  getTrainingRadarRangeTiming,
  TRAINING_VOLUME_SCAN_TIMING,
  trainingBallRadarTarget,
  trainingCarRadarTargets,
  trainingFennecVolumeScanTarget,
  type TrainingCarRadarTarget,
  type TrainingRadarTargetId,
  type TrainingVolumeScanTargetId,
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
  const {
    fennecSurfaceMode,
    fennecTacticalActive,
    passKey,
    passMode,
    running,
    sceneRef,
    tacticalPhases,
    volumeScanPhases,
  } = useTrainingRadarSequence({ active, launching });
  const radarClock = useTrainingRadarClock({ passKey, passMode, running });
  const [gpuRadarReady, setGpuRadarReady] = useState(false);
  const [gpuParticlesReady, setGpuParticlesReady] = useState(false);
  const handleGpuRadarReadyChange = useCallback((ready: boolean) => {
    setGpuRadarReady(ready);
  }, []);
  const handleGpuParticlesReadyChange = useCallback((ready: boolean) => {
    setGpuParticlesReady(ready);
  }, []);
  const useGpuRenderer = trainingRendererMode === "gpu";
  const gpuObjectAssetState = useTrainingGpuObjectAssets(useGpuRenderer);
  const showDomRadar = !useGpuRenderer || !gpuRadarReady;
  const showDomParticles = !useGpuRenderer || !gpuParticlesReady;
  const getTacticalPhase = (targetId: TrainingRadarTargetId) =>
    tacticalPhases[targetId];
  const getVolumeScanPhase = (targetId: TrainingVolumeScanTargetId) =>
    volumeScanPhases[targetId];
  const trainingFennecScanStyle = getTrainingFennecScanStyle();

  return (
    <div
      className="home-scene training-scene"
      data-launching={launching ? "true" : "false"}
      data-radar-active={running ? "true" : "false"}
      data-gpu-radar-ready={useGpuRenderer && gpuRadarReady ? "true" : "false"}
      data-gpu-particles-ready={
        useGpuRenderer && gpuParticlesReady ? "true" : "false"
      }
      data-gpu-object-assets-status={gpuObjectAssetState.status}
      data-radar-pass-mode={passMode}
      data-scene="training"
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

      {showDomRadar ? (
        <>
          <SceneGroup blendMode="screen" depth="trainingGround" layer={6} name="training-radar-surface">
            <TrainingRadarOverlay
              active={running}
              key={`training-radar-surface-${passKey}`}
              variant="surface"
            />
          </SceneGroup>

          <SceneGroup depth="trainingGround" layer={7} name="training-radar-sweep">
            <TrainingRadarOverlay
              active={running}
              key={`training-radar-sweep-${passKey}`}
              variant="sweep"
            />
          </SceneGroup>
        </>
      ) : null}

      {useGpuRenderer ? (
        <TrainingGpuCanvas
          active={active}
          onParticlesReadyChange={handleGpuParticlesReadyChange}
          onRadarReadyChange={handleGpuRadarReadyChange}
          radarClock={radarClock}
          running={running}
        />
      ) : null}

      <SceneGroup depth="trainingGround" layer={8} name="training-barrier">
        <SceneLayer asset={assets.parallaxBarrier} preload />
      </SceneGroup>

      {showDomParticles ? (
        <SceneGroup blendMode="screen" depth="trainingParticlesFar" layer={9} name="training-particles-far">
          <TrainingParticleField
            active={running}
            passKey={passKey}
            preset="far"
          />
        </SceneGroup>
      ) : null}

      <SceneGroup depth={trainingFarCarTarget.depth} layer={10} name={`training-${trainingFarCarTarget.id}`}>
        <TrainingGroundedCar
          target={trainingFarCarTarget}
          tacticalPhase={getTacticalPhase(trainingFarCarTarget.id)}
          volumeScanPhase={getVolumeScanPhase(trainingFarCarTarget.id)}
        />
      </SceneGroup>

      {showDomParticles ? (
        <SceneGroup blendMode="screen" depth="trainingParticlesMid" layer={11} name="training-particles-mid">
          <TrainingParticleField
            active={running}
            passKey={passKey}
            preset="mid"
          />
        </SceneGroup>
      ) : null}

      <SceneGroup depth={trainingMidCarTarget.depth} layer={12} name={`training-${trainingMidCarTarget.id}`}>
        <TrainingGroundedCar
          target={trainingMidCarTarget}
          tacticalPhase={getTacticalPhase(trainingMidCarTarget.id)}
          volumeScanPhase={getVolumeScanPhase(trainingMidCarTarget.id)}
        />
      </SceneGroup>

      <SceneGroup depth={trainingNearCarTarget.depth} layer={13} name={`training-${trainingNearCarTarget.id}`}>
        <TrainingGroundedCar
          target={trainingNearCarTarget}
          tacticalPhase={getTacticalPhase(trainingNearCarTarget.id)}
          volumeScanPhase={getVolumeScanPhase(trainingNearCarTarget.id)}
        />
      </SceneGroup>

      <SceneGroup depth={trainingBallRadarTarget.depth} layer={14} name="ball">
        <TrainingGroundedBall
          target={trainingBallRadarTarget}
          tacticalPhase={getTacticalPhase(trainingBallRadarTarget.id)}
          volumeScanPhase={getVolumeScanPhase(trainingBallRadarTarget.id)}
        />
      </SceneGroup>

      {showDomParticles ? (
        <SceneGroup blendMode="screen" depth="trainingParticlesNear" layer={15} name="training-particles-near">
          <TrainingParticleField
            active={running}
            passKey={passKey}
            preset="near"
          />
        </SceneGroup>
      ) : null}

      <SceneGroup depth="trainingFennec" layer={16} name="fennec">
        <div aria-hidden="true" className="training-fennec-contact-shadow" />
        <div
          className="training-fennec-base-frame"
          data-tactical-active={fennecTacticalActive ? "true" : "false"}
          style={trainingFennecScanStyle}
        >
          <SceneLayer asset={assets.fennecBase} className="training-fennec-base" />
        </div>
        <div
          className="training-radar-fennec-target"
          data-surface-scan-mode={fennecSurfaceMode}
          data-tactical-active={fennecTacticalActive ? "true" : "false"}
          data-volume-scan-phase={getVolumeScanPhase(trainingFennecVolumeScanTarget.id)}
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
    </div>
  );
}
