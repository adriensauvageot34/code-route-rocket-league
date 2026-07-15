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
        <SceneLayer asset={assets.cageProjectorsGlow} />
        <SceneLayer asset={assets.cageProjectorsHaze} />
      </SceneGroup>

      <SceneGroup depth="distant" layer={2} name="ground-reflection">
        <SceneLayer asset={assets.groundReflection} />
      </SceneGroup>

      <SceneGroup depth="foreground" layer={3} name="motion-trail">
        <SceneLayer asset={assets.motionTrail} />
      </SceneGroup>

      <SceneGroup depth="fennec" layer={4} name="fennec">
        <SceneLayer asset={assets.fennecBase} />
        <SceneLayer asset={assets.exhaustEnergy} />
      </SceneGroup>

      <SceneGroup depth="foreground" future layer={5} name="impact">
        <SceneLayer asset={assets.groundImpact} />
      </SceneGroup>

      <SceneGroup depth="foreground" future layer={6} name="transition" />
    </div>
  );
}
