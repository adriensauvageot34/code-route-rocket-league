"use client";

import { SceneGroup, SceneLayer } from "@/components/home/illustrations/SceneGroup";
import {
  TrainingGroundedBall,
  TrainingGroundedCar,
} from "@/components/home/illustrations/TrainingGroundedActor";
import { TrainingRadarOverlay } from "@/components/home/illustrations/TrainingRadarOverlay";
import { useTrainingRadarSequence } from "@/components/home/illustrations/TrainingRadarSequence";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
import {
  trainingBallRadarTarget,
  trainingCarRadarTargets,
  type TrainingRadarTargetId,
} from "@/lib/home/trainingRadarTargets";

const assets = homeIllustrationAssets.training;

type TrainingSceneProps = {
  active: boolean;
  launching: boolean;
};

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

      {trainingCarRadarTargets.map((target, index) => (
        <SceneGroup
          depth={target.depth}
          key={target.id}
          layer={7 + index}
          name={`training-${target.id}`}
        >
          <TrainingGroundedCar
            phase={getTargetPhase(target.id)}
            target={target}
          />
        </SceneGroup>
      ))}

      <SceneGroup depth={trainingBallRadarTarget.depth} layer={10} name="ball">
        <TrainingGroundedBall
          phase={getTargetPhase(trainingBallRadarTarget.id)}
          target={trainingBallRadarTarget}
        />
      </SceneGroup>

      <SceneGroup depth="trainingGround" layer={11} name="training-radar-sweep">
        <TrainingRadarOverlay
          active={running}
          direction={passDirection}
          key={`training-radar-sweep-${passKey}`}
          variant="sweep"
        />
      </SceneGroup>

      <SceneGroup depth="trainingFennec" layer={12} name="fennec">
        <div aria-hidden="true" className="training-fennec-contact-shadow" />
        <SceneLayer asset={assets.fennecBase} />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingFennec" layer={13} name="fennec-lights-glow">
        <SceneLayer asset={assets.lightsVioletGlow} className="training-lights-glow" />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="foreground" future layer={14} name="transition">
        <SceneLayer asset={assets.transitionWaveGold} className="training-transition-wave-local" />
      </SceneGroup>
    </div>
  );
}
