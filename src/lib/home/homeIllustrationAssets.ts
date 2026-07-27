export type HomeIllustrationBlendMode = "normal" | "screen";

export type HomeIllustrationScenePlacement = {
  sourceDimensions: {
    width: number;
    height: number;
  };
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  placementSpace: "source-scene";
};

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
  scenePlacement?: HomeIllustrationScenePlacement;
};

export const homeIllustrationAssets = {
  training: {
    parallaxSky: {
      path: "/ui/training-environment/parallax-plan-05-ciel.webp",
      role: "training parallax starry sky",
      dimensions: { width: 1672, height: 941 },
      alpha: "opaque",
      blendMode: "normal",
      scenePlacement: {
        sourceDimensions: { width: 1672, height: 941 },
        crop: { x: 0, y: 0, width: 1672, height: 941 },
        placementSpace: "source-scene",
      },
    },
    parallaxFarSkyline: {
      path: "/ui/training-environment/parallax-plan-04-skyline-lointaine.webp",
      role: "training parallax far skyline",
      dimensions: { width: 1672, height: 360 },
      alpha: "transparent",
      blendMode: "normal",
      scenePlacement: {
        sourceDimensions: { width: 1672, height: 941 },
        crop: { x: 0, y: 0, width: 1672, height: 360 },
        placementSpace: "source-scene",
      },
    },
    parallaxMidBuildings: {
      path: "/ui/training-environment/parallax-plan-03-batiments-intermediaires.webp",
      role: "training parallax middle buildings",
      dimensions: { width: 1672, height: 336 },
      alpha: "transparent",
      blendMode: "normal",
      scenePlacement: {
        sourceDimensions: { width: 1672, height: 941 },
        crop: { x: 0, y: 253, width: 1672, height: 336 },
        placementSpace: "source-scene",
      },
    },
    parallaxNearBuildings: {
      path: "/ui/training-environment/parallax-plan-02-batiments-proches.webp",
      role: "training parallax near buildings",
      dimensions: { width: 1672, height: 400 },
      alpha: "transparent",
      blendMode: "normal",
      scenePlacement: {
        sourceDimensions: { width: 1672, height: 941 },
        crop: { x: 0, y: 244, width: 1672, height: 400 },
        placementSpace: "source-scene",
      },
    },
    parallaxGround: {
      path: "/ui/training-environment/parallax-plan-01-sol.webp",
      role: "training parallax pitch surface",
      dimensions: { width: 1672, height: 576 },
      alpha: "transparent",
      blendMode: "normal",
      scenePlacement: {
        sourceDimensions: { width: 1672, height: 941 },
        crop: { x: 0, y: 365, width: 1672, height: 576 },
        placementSpace: "source-scene",
      },
    },
    parallaxBarrier: {
      path: "/ui/training-environment/parallax-plan-01-barriere.webp",
      role: "stable training pitch barrier",
      dimensions: { width: 1672, height: 128 },
      alpha: "transparent",
      blendMode: "normal",
      scenePlacement: {
        sourceDimensions: { width: 1672, height: 941 },
        crop: { x: 0, y: 344, width: 1672, height: 128 },
        placementSpace: "source-scene",
      },
    },
    tacticalTerrain: {
      path: "/ui/training-environment/matrice-analyse.webp",
      role: "barrier-free tactical pitch matrix revealed by radar",
      dimensions: { width: 1536, height: 632 },
      alpha: "transparent",
      blendMode: "screen",
      notes: "Cropped WebP restored at source-scene offset (0, 392), then clipped to the pitch, masked, and screen blended.",
      scenePlacement: {
        sourceDimensions: { width: 1536, height: 1024 },
        crop: { x: 0, y: 392, width: 1536, height: 632 },
        placementSpace: "source-scene",
      },
    },
  },
  competitive: {
    background: {
      path: "/ui/competitive-background.webp",
      role: "competitive stadium background",
      dimensions: { width: 1672, height: 941 },
      alpha: "none",
      blendMode: "normal",
    },
    cageBase: {
      path: "/ui/competitive-cage-base.png",
      role: "competitive cage base layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal",
    },
    cageNeonGold: {
      path: "/ui/competitive-cage-neon-gold.png",
      role: "gold cage neon layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal",
    },
    cageProjectorsGlow: {
      path: "/ui/competitive-cage-projectors-glow-screen.png",
      role: "cage projector glow on black",
      dimensions: { width: 1672, height: 941 },
      alpha: "none",
      blendMode: "screen",
    },
    cageProjectorsHaze: {
      path: "/ui/competitive-cage-projectors-haze-screen.png",
      role: "alternate projector haze on black",
      dimensions: { width: 1671, height: 941 },
      alpha: "none",
      blendMode: "screen",
      notes: "Retained because it is not an exact duplicate of cageProjectorsGlow.",
    },
    fennecBase: {
      path: "/ui/competitive-fennec-base.png",
      role: "competitive Fennec base layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal",
    },
    exhaustEnergy: {
      path: "/ui/competitive-exhaust-energy.png",
      role: "competitive exhaust energy layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal",
    },
    motionTrail: {
      path: "/ui/competitive-motion-trail.png",
      role: "competitive motion trail layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal",
    },
    groundReflection: {
      path: "/ui/competitive-ground-reflection.png",
      role: "ground reflection on black",
      dimensions: { width: 1672, height: 941 },
      alpha: "none",
      blendMode: "screen",
    },
    groundImpact: {
      path: "/ui/competitive-ground-impact.png",
      role: "competitive ground impact layer",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal",
    },
  },
  support: {
    rlgsLogo: {
      path: "/ui/rlgs-logo-transparent.png",
      role: "transparent RLGS support logo",
      dimensions: { width: 1254, height: 1254 },
      alpha: "transparent",
      blendMode: "normal",
    },
    scoreHudBlue: {
      path: "/ui/score-hud-blue.png",
      role: "blue team score HUD",
      dimensions: { width: 1579, height: 451 },
      alpha: "transparent",
      blendMode: "normal",
    },
    scoreHudOrange: {
      path: "/ui/score-hud-orange.png",
      role: "orange team score HUD",
      dimensions: { width: 1638, height: 489 },
      alpha: "transparent",
      blendMode: "normal",
    },
  },
} as const satisfies Record<string, Record<string, HomeIllustrationAsset>>;
