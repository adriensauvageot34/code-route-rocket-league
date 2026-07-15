export type HomeIllustrationBlendMode = "normal" | "screen";

export type HomeIllustrationAsset = {
  path: `/ui/${string}`;
  role: string;
  dimensions: {
    width: number;
    height: number;
  };
  alpha: "transparent" | "opaque" | "none";
  blendMode: HomeIllustrationBlendMode;
  notes?: string;
};

export const homeIllustrationAssets = {
  training: {
    background: {
      path: "/ui/training-background.png",
      role: "training stadium background",
      dimensions: { width: 1672, height: 941 },
      alpha: "none",
      blendMode: "normal"
    },
    fennecBase: {
      path: "/ui/training-fennec-base.png",
      role: "training Fennec base layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    lightsVioletGlow: {
      path: "/ui/training-lights-violet-glow-screen.png",
      role: "violet headlight glow on black",
      dimensions: { width: 1672, height: 941 },
      alpha: "none",
      blendMode: "screen"
    },
    ball: {
      path: "/ui/training-ball.png",
      role: "training ball base layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    ballEnergyGold: {
      path: "/ui/training-ball-energy-gold.png",
      role: "gold ball energy layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    transitionWaveGold: {
      path: "/ui/training-transition-wave-gold.png",
      role: "gold transition wave on black",
      dimensions: { width: 1672, height: 941 },
      alpha: "none",
      blendMode: "screen"
    },
    distantCarsOcclusion: {
      path: "/ui/training-distant-cars-occlusion.png",
      role: "distant cars occlusion layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    }
  },
  competitive: {
    background: {
      path: "/ui/competitive-background.webp",
      role: "competitive stadium background",
      dimensions: { width: 1672, height: 941 },
      alpha: "none",
      blendMode: "normal"
    },
    cageBase: {
      path: "/ui/competitive-cage-base.png",
      role: "competitive cage base layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    cageNeonGold: {
      path: "/ui/competitive-cage-neon-gold.png",
      role: "gold cage neon layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    cageProjectorsGlow: {
      path: "/ui/competitive-cage-projectors-glow-screen.png",
      role: "cage projector glow on black",
      dimensions: { width: 1672, height: 941 },
      alpha: "none",
      blendMode: "screen"
    },
    cageProjectorsHaze: {
      path: "/ui/competitive-cage-projectors-haze-screen.png",
      role: "alternate projector haze on black",
      dimensions: { width: 1671, height: 941 },
      alpha: "none",
      blendMode: "screen",
      notes: "Retained because it is not an exact duplicate of cageProjectorsGlow."
    },
    fennecBase: {
      path: "/ui/competitive-fennec-base.png",
      role: "competitive Fennec base layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    exhaustEnergy: {
      path: "/ui/competitive-exhaust-energy.png",
      role: "competitive exhaust energy layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    motionTrail: {
      path: "/ui/competitive-motion-trail.png",
      role: "competitive motion trail layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    groundReflection: {
      path: "/ui/competitive-ground-reflection.png",
      role: "ground reflection on black",
      dimensions: { width: 1672, height: 941 },
      alpha: "none",
      blendMode: "screen"
    },
    groundImpact: {
      path: "/ui/competitive-ground-impact.png",
      role: "competitive ground impact layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    }
  },
  support: {
    rlgsLogo: {
      path: "/ui/rlgs-logo-transparent.png",
      role: "transparent RLGS support logo",
      dimensions: { width: 1254, height: 1254 },
      alpha: "transparent",
      blendMode: "normal"
    },
    scoreHudBlue: {
      path: "/ui/score-hud-blue.png",
      role: "blue team score HUD",
      dimensions: { width: 1579, height: 451 },
      alpha: "transparent",
      blendMode: "normal"
    },
    scoreHudOrange: {
      path: "/ui/score-hud-orange.png",
      role: "orange team score HUD",
      dimensions: { width: 1638, height: 489 },
      alpha: "transparent",
      blendMode: "normal"
    }
  }
} as const satisfies Record<string, Record<string, HomeIllustrationAsset>>;
