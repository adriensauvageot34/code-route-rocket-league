"use client";

import type { CSSProperties } from "react";
import { SceneGroup, SceneLayer } from "@/components/home/illustrations/SceneGroup";
import {
  TrainingGroundedBall,
  TrainingGroundedCar,
} from "@/components/home/illustrations/TrainingGroundedActor";
import { TrainingRadarOverlay } from "@/components/home/illustrations/TrainingRadarOverlay";
import { useTrainingRadarSequence } from "@/components/home/illustrations/TrainingRadarSequence";
import { TrainingParticleField } from "@/components/home/illustrations/TrainingParticleField";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
import {
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

const trainingFennecScanStyle = {
  "--training-volume-contour-delay": `${TRAINING_VOLUME_SCAN_TIMING.contourDelayMs}ms`,
  "--training-volume-fade-duration": `${TRAINING_VOLUME_SCAN_TIMING.fadeDurationMs}ms`,
  "--training-volume-scan-duration": `${TRAINING_VOLUME_SCAN_TIMING.activeDurationMs}ms`,
} as CSSProperties;

export function TrainingScene({ active, launching }: TrainingSceneProps) {
  const {
    passDirection,
    passKey,
    running,
    sceneRef,
    tacticalPhases,
    volumeScanDirections,
    volumeScanPhases,
  } = useTrainingRadarSequence({ active, launching });
  const getTacticalPhase = (targetId: TrainingRadarTargetId) =>
    tacticalPhases[targetId];
  const getVolumeScanDirection = (targetId: TrainingVolumeScanTargetId) =>
    volumeScanDirections[targetId];
  const getVolumeScanPhase = (targetId: TrainingVolumeScanTargetId) =>
    volumeScanPhases[targetId];

  return (
    <div
      className="home-scene training-scene"
      data-launching={launching ? "true" : "false"}
      data-radar-active={running ? "true" : "false"}
      data-scene="training"
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
          active={running}
          direction={passDirection}
          key={`training-radar-surface-${passKey}`}
          variant="surface"
        />
      </SceneGroup>

      <SceneGroup depth="trainingGround" layer={7} name="training-radar-sweep">
        <TrainingRadarOverlay
          active={running}
          direction={passDirection}
          key={`training-radar-sweep-${passKey}`}
          variant="sweep"
        />
      </SceneGroup>

      <SceneGroup depth="trainingGround" layer={8} name="training-barrier">
        <SceneLayer asset={assets.parallaxBarrier} preload />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingParticlesFar" layer={9} name="training-particles-far">
        <TrainingParticleField
          active={running}
          direction={passDirection}
          passKey={passKey}
          preset="far"
        />
      </SceneGroup>

      <SceneGroup depth={trainingFarCarTarget.depth} layer={10} name={`training-${trainingFarCarTarget.id}`}>
        <TrainingGroundedCar
          direction={getVolumeScanDirection(trainingFarCarTarget.id)}
          target={trainingFarCarTarget}
          tacticalPhase={getTacticalPhase(trainingFarCarTarget.id)}
          volumeScanPhase={getVolumeScanPhase(trainingFarCarTarget.id)}
        />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingParticlesMid" layer={11} name="training-particles-mid">
        <TrainingParticleField
          active={running}
          direction={passDirection}
          passKey={passKey}
          preset="mid"
        />
      </SceneGroup>

      <SceneGroup depth={trainingMidCarTarget.depth} layer={12} name={`training-${trainingMidCarTarget.id}`}>
        <TrainingGroundedCar
          direction={getVolumeScanDirection(trainingMidCarTarget.id)}
          target={trainingMidCarTarget}
          tacticalPhase={getTacticalPhase(trainingMidCarTarget.id)}
          volumeScanPhase={getVolumeScanPhase(trainingMidCarTarget.id)}
        />
      </SceneGroup>

      <SceneGroup depth={trainingNearCarTarget.depth} layer={13} name={`training-${trainingNearCarTarget.id}`}>
        <TrainingGroundedCar
          direction={getVolumeScanDirection(trainingNearCarTarget.id)}
          target={trainingNearCarTarget}
          tacticalPhase={getTacticalPhase(trainingNearCarTarget.id)}
          volumeScanPhase={getVolumeScanPhase(trainingNearCarTarget.id)}
        />
      </SceneGroup>

      <SceneGroup depth={trainingBallRadarTarget.depth} layer={14} name="ball">
        <TrainingGroundedBall
          direction={getVolumeScanDirection(trainingBallRadarTarget.id)}
          target={trainingBallRadarTarget}
          tacticalPhase={getTacticalPhase(trainingBallRadarTarget.id)}
          volumeScanPhase={getVolumeScanPhase(trainingBallRadarTarget.id)}
        />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingParticlesNear" layer={15} name="training-particles-near">
        <TrainingParticleField
          active={running}
          direction={passDirection}
          passKey={passKey}
          preset="near"
        />
      </SceneGroup>

      <SceneGroup depth="trainingFennec" layer={16} name="fennec">
        <div aria-hidden="true" className="training-fennec-contact-shadow" />
        <SceneLayer asset={assets.fennecBase} />
        <div
          className="training-radar-fennec-target"
          data-radar-direction={getVolumeScanDirection(trainingFennecVolumeScanTarget.id)}
          data-volume-scan-phase={getVolumeScanPhase(trainingFennecVolumeScanTarget.id)}
          style={trainingFennecScanStyle}
        >
          <SceneLayer
            asset={trainingFennecVolumeScanTarget.surfaceAsset}
            className="training-radar-fennec-surface"
          />
          <SceneLayer
            asset={trainingFennecVolumeScanTarget.contourAsset}
            className="training-radar-fennec-contour"
          />
          <SceneLayer
            asset={trainingFennecVolumeScanTarget.impactAsset}
            className="training-radar-fennec-impact"
          />
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
