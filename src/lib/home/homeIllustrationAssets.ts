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
    parallaxSky: {
      path: "/ui/parallax-plan-05-ciel.png",
      role: "training parallax starry sky",
      dimensions: { width: 1672, height: 941 },
      alpha: "opaque",
      blendMode: "normal"
    },
    parallaxFarSkyline: {
      path: "/ui/parallax-plan-04-skyline-lointaine.png",
      role: "training parallax far skyline",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    parallaxMidBuildings: {
      path: "/ui/parallax-plan-03-batiments-intermediaires.png",
      role: "training parallax middle buildings",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    parallaxNearBuildings: {
      path: "/ui/parallax-plan-02-batiments-proches.png",
      role: "training parallax near buildings",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    parallaxGround: {
      path: "/ui/parallax-plan-01-sol.png",
      role: "training parallax pitch surface",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    parallaxBarrier: {
      path: "/ui/parallax-plan-01-barriere.png",
      role: "stable training pitch barrier",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    tacticalTerrain: {
      path: "/ui/matrice_analyse.png",
      role: "barrier-free tactical pitch matrix revealed by radar",
      dimensions: { width: 1672, height: 941 },
      alpha: "none",
      blendMode: "screen",
      notes: "Barrier-free source is always clipped to the pitch, masked, and screen blended."
    },
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
    fennecRimLight: {
      path: "/ui/fennec-base im light overlay.png",
      role: "permanent premium Fennec rim light",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "screen"
    },
    fennecHeadlightGlow: {
      path: "/ui/fennec-base headlight glow overlay.png",
      role: "soft permanent Fennec headlight glow",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "screen"
    },
    fennecRearAccent: {
      path: "/ui/fennec-base rear accent glow.png",
      role: "subtle Fennec rear accent glow",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "screen"
    },
    fennecSurfaceScan: {
      path: "/ui/fennec-base surface-scan overlay.png",
      role: "reserved Fennec surface scan",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "screen"
    },
    fennecContourScan: {
      path: "/ui/fennec-base contour-scan overlay.png",
      role: "reserved Fennec contour scan",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "screen"
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
    ballSurfaceScan: {
      path: "/ui/training-ball Overlay surface-scan.png",
      role: "ball surface volume scan",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "screen"
    },
    ballContourScan: {
      path: "/ui/training-ball overlay contour-scan.png",
      role: "ball contour scan",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "screen"
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
    },
    distantCarLeft: {
      path: "/ui/training-distant-car-left.png",
      role: "training distant left car",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    distantCarFrontRight: {
      path: "/ui/training-distant-car-front-right.png",
      role: "training distant front-right car",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    distantCarBackRight: {
      path: "/ui/training-distant-car-back-right.png",
      role: "training distant back-right car",
      dimensions: { width: 1672, height: 941 },
      alpha: "transparent",
      blendMode: "normal"
    },
    wireframeCar01: {
      path: "/ui/training-wireframe-car-01-transparent.png",
      role: "wireframe overlay matched to the distant left car",
      dimensions: { width: 1607, height: 979 },
      alpha: "transparent",
      blendMode: "normal"
    },
    surfaceScanCar01: {
      path: "/ui/car-01 overlay surface-scan.png",
      role: "surface scan matched to the distant left car",
      dimensions: { width: 1607, height: 979 },
      alpha: "transparent",
      blendMode: "screen"
    },
    contourScanCar01: {
      path: "/ui/car-01 overlay contour-scan.png",
      role: "contour scan matched to the distant left car",
      dimensions: { width: 1607, height: 979 },
      alpha: "transparent",
      blendMode: "screen"
    },
    wireframeCar01Glow: {
      path: "/ui/training-wireframe-car-01-radar-glow.png",
      role: "radar glow matched to wireframe car 01",
      dimensions: { width: 1607, height: 979 },
      alpha: "transparent",
      blendMode: "screen"
    },
    wireframeCar02: {
      path: "/ui/training-wireframe-car-02-transparent.png",
      role: "wireframe overlay matched to the distant back-right car",
      dimensions: { width: 1612, height: 975 },
      alpha: "transparent",
      blendMode: "normal"
    },
    surfaceScanCar02: {
      path: "/ui/car-02 overlay surface-scan.png",
      role: "surface scan matched to the distant back-right car",
      dimensions: { width: 1612, height: 975 },
      alpha: "transparent",
      blendMode: "screen"
    },
    contourScanCar02: {
      path: "/ui/car-02 overlay contour-scan.png",
      role: "contour scan matched to the distant back-right car",
      dimensions: { width: 1612, height: 975 },
      alpha: "transparent",
      blendMode: "screen"
    },
    wireframeCar02Glow: {
      path: "/ui/training-wireframe-car-02-radar-glow.png",
      role: "radar glow matched to wireframe car 02",
      dimensions: { width: 1612, height: 975 },
      alpha: "transparent",
      blendMode: "screen"
    },
    wireframeCar03: {
      path: "/ui/training-wireframe-car-03-transparent.png",
      role: "wireframe overlay matched to the distant front-right car",
      dimensions: { width: 1619, height: 972 },
      alpha: "transparent",
      blendMode: "normal"
    },
    surfaceScanCar03: {
      path: "/ui/car-03 overlay surface-scan.png",
      role: "surface scan matched to the distant front-right car",
      dimensions: { width: 1619, height: 972 },
      alpha: "transparent",
      blendMode: "screen"
    },
    contourScanCar03: {
      path: "/ui/car-03 overlay contour-scan.png",
      role: "contour scan matched to the distant front-right car",
      dimensions: { width: 1619, height: 972 },
      alpha: "transparent",
      blendMode: "screen"
    },
    wireframeCar03Glow: {
      path: "/ui/training-wireframe-car-03-radar-glow.png",
      role: "radar glow matched to wireframe car 03",
      dimensions: { width: 1619, height: 972 },
      alpha: "transparent",
      blendMode: "screen"
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
