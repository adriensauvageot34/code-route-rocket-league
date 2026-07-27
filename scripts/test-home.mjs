import { existsSync, readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(path) {
  assert(existsSync(path), `Missing expected file: ${path}`);
  return readFileSync(path, "utf8");
}

const paths = {
  css: "src/app/home.css",
  launchOverlay: "src/components/home/HomeLaunchOverlay.tsx",
  trainingScene:
    "src/components/home/illustrations/TrainingScene.tsx",
  trainingStaticFallback:
    "src/components/home/illustrations/TrainingStaticFallback.tsx",
  trainingEnvironment:
    "src/components/home/illustrations/TrainingEnvironmentLayer.tsx",
  trainingGpuCanvas:
    "src/components/home/illustrations/gpu/TrainingGpuCanvas.tsx",
  trainingSequence:
    "src/components/home/illustrations/TrainingRadarSequence.tsx",
  staticAssets: "src/lib/home/trainingStaticFallbackAssets.ts",
  rendererMode: "src/hooks/useTrainingRendererMode.ts",
  illustrationAssets: "src/lib/home/homeIllustrationAssets.ts",
  radarAssets: "src/lib/home/gpu/trainingGpuRadarAssets.ts",
};

const files = Object.fromEntries(
  Object.entries(paths).map(([name, path]) => [name, read(path)]),
);

const retiredTrainingDomFiles = [
  "src/components/home/illustrations/TrainingGroundedActor.tsx",
  "src/components/home/illustrations/TrainingParticleField.tsx",
  "src/components/home/illustrations/TrainingRadarOverlay.tsx",
  "src/hooks/useTrainingDomCriticalAssets.ts",
  "src/hooks/useTrainingDomRadarDriver.ts",
  "src/lib/home/trainingDomRadarApplier.ts",
];

for (const path of retiredTrainingDomFiles) {
  assert(!existsSync(path), `Retired Training DOM file still exists: ${path}`);
}

assert(
  files.rendererMode.includes('requested: "gpu"') &&
    files.rendererMode.includes(
      'searchParams.get("trainingRenderer") === "dom" ? "dom" : "gpu"',
    ),
  "Training must default to GPU and reserve the explicit dom query for the static fallback.",
);

assert(
  files.trainingScene.includes("<TrainingGpuCanvas") &&
    files.trainingScene.includes("<TrainingStaticFallback") &&
    files.trainingScene.includes('activeRendererMode === "dom"'),
  "TrainingScene must select between the consolidated GPU renderer and the static fallback.",
);

assert(
  files.trainingScene.includes(
    'activeRendererMode === "gpu" &&',
  ) &&
    files.trainingScene.includes("gpuCriticalReady"),
  "The animated radar sequence must only start once the active GPU renderer is ready.",
);

assert(
  !files.trainingScene.includes("TrainingGroundedActor") &&
    !files.trainingScene.includes("TrainingParticleField") &&
    !files.trainingScene.includes("TrainingRadarOverlay") &&
    !files.trainingScene.includes("useTrainingDomRadarDriver"),
  "TrainingScene must not retain the retired animated DOM renderer.",
);

const staticBasePaths = [
  "/ui/training-objects/left-car/base.webp",
  "/ui/training-objects/back-right-car/base.webp",
  "/ui/training-objects/front-right-car/base.webp",
  "/ui/training-objects/ball/base.webp",
  "/ui/training-objects/fennec/base.webp",
];

for (const path of staticBasePaths) {
  assert(
    files.staticAssets.includes(path),
    `Static Training fallback is missing ${path}.`,
  );
}

assert(
  (files.staticAssets.match(/\/base\.webp"/g) ?? []).length === 5,
  "The static Training fallback must contain exactly five grounded base objects.",
);

assert(
  !/(requestAnimationFrame|setTimeout|setInterval)/.test(
    files.trainingStaticFallback + files.staticAssets,
  ),
  "The static Training fallback must not create animation frames or timers.",
);

assert(
  files.trainingStaticFallback.includes("training-static-contact-shadow") &&
    files.trainingStaticFallback.includes("data-training-static-actor"),
  "Static actors must keep their CSS grounding shadows and stable object identifiers.",
);

assert(
  (files.trainingGpuCanvas.match(/useRef<HTMLCanvasElement>/g) ?? []).length ===
    3 &&
    files.trainingGpuCanvas.includes("TrainingGpuConsolidatedRenderer"),
  "The GPU renderer must retain its three consolidated canvases.",
);

assert(
  files.trainingGpuCanvas.includes("applyDomSnapshot") &&
    files.trainingScene.includes("applyDomSnapshot={null}"),
  "The consolidated GPU renderer must not target a retired DOM radar applier.",
);

assert(
  files.trainingSequence.includes("window.setTimeout") &&
    !files.trainingStaticFallback.includes("TrainingRadarSequence"),
  "The MasterClock sequence may keep its single GPU timer, but the static fallback must not mount it.",
);

const environmentWebpPaths = [
  "/ui/training-environment/parallax-plan-05-ciel.webp",
  "/ui/training-environment/parallax-plan-04-skyline-lointaine.webp",
  "/ui/training-environment/parallax-plan-03-batiments-intermediaires.webp",
  "/ui/training-environment/parallax-plan-02-batiments-proches.webp",
  "/ui/training-environment/parallax-plan-01-sol.webp",
  "/ui/training-environment/parallax-plan-01-barriere.webp",
];

for (const path of environmentWebpPaths) {
  assert(
    files.illustrationAssets.includes(path),
    `Training environment catalog is missing ${path}.`,
  );
}

assert(
  files.illustrationAssets.includes(
    "/ui/training-environment/matrice-analyse.webp",
  ) &&
    !files.illustrationAssets.includes("legacyPath"),
  "The tactical terrain and environment must use runtime WebP paths without legacy retries.",
);

assert(
  files.radarAssets.includes("asset.scenePlacement") &&
    files.radarAssets.includes("sourceDimensions") &&
    files.radarAssets.includes("crop"),
  "The tactical terrain loader must map its catalog crop into source space.",
);

assert(
  files.trainingEnvironment.includes("error: boolean") &&
    !files.trainingEnvironment.includes("fallback"),
  "Environment loading must report errors without requesting legacy PNG fallbacks.",
);

assert(
  !files.launchOverlay.includes("training.transition") &&
    files.launchOverlay.includes("homeIllustrationAssets.competitive"),
  "Training launch must use its cover only while Competitive keeps its transition asset.",
);

const retiredRuntimePaths = [
  "/ui/training-background.png",
  "/ui/matrice_analyse.png",
  "/ui/training-fennec-base.png",
  "/ui/training-ball.png",
  "/ui/fennec-base reflection overlay.png",
];

for (const path of retiredRuntimePaths) {
  assert(
    !Object.values(files).some((source) => source.includes(path)),
    `Retired Training runtime path is still referenced: ${path}`,
  );
}

assert(
  !files.css.includes("training-radar-overlay") &&
    !files.css.includes("training-particle-field") &&
    !files.css.includes("training-lights-glow") &&
    !files.css.includes("@keyframes training-"),
  "Retired animated Training DOM CSS must be removed.",
);

console.log("Home and Training static architecture checks passed.");
