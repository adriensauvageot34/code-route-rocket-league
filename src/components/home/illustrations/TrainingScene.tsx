import { SceneGroup, SceneLayer } from "@/components/home/illustrations/SceneGroup";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";

const assets = homeIllustrationAssets.training;

export function TrainingScene() {
  return (
    <div className="home-scene training-scene" data-scene="training">
      <SceneGroup depth="background" layer={0} name="decor">
        <SceneLayer asset={assets.background} preload />
      </SceneGroup>

      <SceneGroup depth="distant" layer={1} name="analysis-distant-cars">
        <SceneLayer asset={assets.distantCarsOcclusion} />
      </SceneGroup>

      <SceneGroup depth="focal" layer={2} name="ball">
        <SceneLayer asset={assets.ball} />
        <SceneLayer asset={assets.ballEnergyGold} />
      </SceneGroup>

      <SceneGroup depth="fennec" layer={3} name="fennec">
        <SceneLayer asset={assets.fennecBase} />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="fennec" layer={4} name="fennec-lights-glow">
        <SceneLayer asset={assets.lightsVioletGlow} />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="foreground" future layer={5} name="transition">
        <SceneLayer asset={assets.transitionWaveGold} />
      </SceneGroup>
    </div>
  );
}
