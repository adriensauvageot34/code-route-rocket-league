import { SceneGroup, SceneLayer } from "@/components/home/illustrations/SceneGroup";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";

const assets = homeIllustrationAssets.competitive;

export function CompetitiveScene() {
  return (
    <div className="home-scene competitive-scene" data-scene="competitive">
      <SceneGroup depth="background" layer={0} name="decor">
        <SceneLayer asset={assets.background} preload />
      </SceneGroup>

      <SceneGroup depth="focal" layer={1} name="cage">
        <SceneLayer asset={assets.cageBase} />
        <SceneLayer asset={assets.cageNeonGold} />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="focal" layer={2} name="cage-projectors-glow">
        <SceneLayer asset={assets.cageProjectorsGlow} />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="focal" layer={3} name="cage-projectors-haze">
        <SceneLayer asset={assets.cageProjectorsHaze} />
      </SceneGroup>

      <SceneGroup blendMode="screen" depth="distant" layer={4} name="ground-reflection">
        <SceneLayer asset={assets.groundReflection} />
      </SceneGroup>

      <SceneGroup depth="fennec" layer={5} name="fennec">
        <SceneLayer asset={assets.fennecBase} />
      </SceneGroup>

      <SceneGroup depth="fennec" layer={6} name="fennec-exhaust-energy">
        <SceneLayer asset={assets.exhaustEnergy} className="competitive-exhaust-energy" />
      </SceneGroup>

      <SceneGroup depth="foreground" layer={7} name="motion-trail">
        <SceneLayer asset={assets.motionTrail} />
      </SceneGroup>

      <SceneGroup depth="foreground" future layer={8} name="impact">
        <SceneLayer asset={assets.groundImpact} />
      </SceneGroup>

      <SceneGroup depth="foreground" future layer={9} name="transition" />
    </div>
  );
}
