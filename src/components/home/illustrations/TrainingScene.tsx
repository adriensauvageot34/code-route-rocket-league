"use client";

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
  trainingBallRadarTarget,
  trainingCarRadarTargets,
  type TrainingCarRadarTarget,
  type TrainingRadarTargetId,
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

export function TrainingScene({ active, launching }: TrainingSceneProps) {
  const {
    passDirection,
    passKey,
    running,
    sceneRef,
    targetPhases,
  } = useTrainingRadarSequence({ active, launching });
  const getTargetPhase = (targetId: TrainingRadarTargetId) =>
    targetPhases[targetId];

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
        <SceneLayer asset={assets.parallaxGroundBarrier} preload />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingGround" layer={6} name="training-radar-surface">
        <TrainingRadarOverlay
          active={running}
          direction={passDirection}
          key={`training-radar-surface-${passKey}`}
          variant="surface"
        />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingParticlesFar" layer={7} name="training-particles-far">
        <TrainingParticleField preset="far" />
      </SceneGroup>

      <SceneGroup depth={trainingFarCarTarget.depth} layer={8} name={`training-${trainingFarCarTarget.id}`}>
        <TrainingGroundedCar
          phase={getTargetPhase(trainingFarCarTarget.id)}
          target={trainingFarCarTarget}
        />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingParticlesMid" layer={9} name="training-particles-mid">
        <TrainingParticleField preset="mid" />
      </SceneGroup>

      <SceneGroup depth={trainingMidCarTarget.depth} layer={10} name={`training-${trainingMidCarTarget.id}`}>
        <TrainingGroundedCar
          phase={getTargetPhase(trainingMidCarTarget.id)}
          target={trainingMidCarTarget}
        />
      </SceneGroup>

      <SceneGroup depth={trainingNearCarTarget.depth} layer={11} name={`training-${trainingNearCarTarget.id}`}>
        <TrainingGroundedCar
          phase={getTargetPhase(trainingNearCarTarget.id)}
          target={trainingNearCarTarget}
        />
      </SceneGroup>

      <SceneGroup depth={trainingBallRadarTarget.depth} layer={12} name="ball">
        <TrainingGroundedBall
          phase={getTargetPhase(trainingBallRadarTarget.id)}
          target={trainingBallRadarTarget}
        />
      </SceneGroup>

      <SceneGroup depth="trainingGround" layer={13} name="training-radar-sweep">
        <TrainingRadarOverlay
          active={running}
          direction={passDirection}
          key={`training-radar-sweep-${passKey}`}
          variant="sweep"
        />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingParticlesNear" layer={14} name="training-particles-near">
        <TrainingParticleField preset="near" />
      </SceneGroup>

      <SceneGroup depth="trainingFennec" layer={15} name="fennec">
        <div aria-hidden="true" className="training-fennec-contact-shadow" />
        <SceneLayer asset={assets.fennecBase} />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingFennec" layer={16} name="fennec-lights-glow">
        <SceneLayer asset={assets.lightsVioletGlow} className="training-lights-glow" />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="foreground" future layer={17} name="transition">
        <SceneLayer asset={assets.transitionWaveGold} className="training-transition-wave-local" />
      </SceneGroup>
    </div>
  );
}
