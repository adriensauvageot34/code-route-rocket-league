"use client";

import { SceneGroup, SceneLayer } from "@/components/home/illustrations/SceneGroup";
import { TrainingRadarOverlay } from "@/components/home/illustrations/TrainingRadarOverlay";
import {
  TrainingRadarSequence,
  useTrainingRadarSequence,
} from "@/components/home/illustrations/TrainingRadarSequence";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";

const assets = homeIllustrationAssets.training;

type TrainingSceneProps = {
  active: boolean;
  launching: boolean;
};

export function TrainingScene({ active, launching }: TrainingSceneProps) {
  const {
    activeTargetId,
    passDirection,
    passKey,
    phase,
    running,
    sceneRef,
  } = useTrainingRadarSequence({ active, launching });

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
        <SceneLayer asset={assets.parallaxFarSkyline} preload />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingMid" layer={2} name="training-atmospheric-haze">
        <div aria-hidden="true" className="training-atmospheric-haze" />
      </SceneGroup>

      <SceneGroup depth="trainingMid" layer={3} name="training-mid-buildings">
        <SceneLayer asset={assets.parallaxMidBuildings} />
      </SceneGroup>

      <SceneGroup depth="trainingNear" layer={4} name="training-near-buildings">
        <SceneLayer asset={assets.parallaxNearBuildings} />
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

      <SceneGroup depth="trainingActors" layer={7} name="training-distant-cars">
        <SceneLayer asset={assets.distantCarLeft} />
        <SceneLayer asset={assets.distantCarBackRight} />
        <SceneLayer asset={assets.distantCarFrontRight} />
      </SceneGroup>

      <SceneGroup depth="trainingActors" layer={8} name="ball">
        <SceneLayer asset={assets.ball} />
        <SceneLayer asset={assets.ballEnergyGold} className="training-ball-launch-energy" />
      </SceneGroup>

      <SceneGroup depth="trainingGround" layer={9} name="training-radar-sweep">
        <TrainingRadarOverlay
          active={running}
          direction={passDirection}
          key={`training-radar-sweep-${passKey}`}
          variant="sweep"
        />
      </SceneGroup>

      <SceneGroup depth="trainingActors" layer={10} name="training-radar-targets">
        <TrainingRadarSequence
          activeTargetId={activeTargetId}
          phase={phase}
        />
      </SceneGroup>

      <SceneGroup depth="trainingFennec" layer={11} name="fennec">
        <SceneLayer asset={assets.fennecBase} />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="trainingFennec" layer={12} name="fennec-lights-glow">
        <SceneLayer asset={assets.lightsVioletGlow} className="training-lights-glow" />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="foreground" future layer={13} name="transition">
        <SceneLayer asset={assets.transitionWaveGold} className="training-transition-wave-local" />
      </SceneGroup>
    </div>
  );
}
