import { existsSync, readFileSync } from "node:fs";

const expectedFiles = [
  "src/app/page.tsx",
  "src/app/home.css",
  "src/components/AppFrame.tsx",
  "src/components/OrientationGate.tsx",
  "src/components/home/AccessibleTooltip.tsx",
  "src/components/home/HomeDashboard.tsx",
  "src/components/home/HomeHeader.tsx",
  "src/components/home/HomeLaunchOverlay.tsx",
  "src/components/home/HomeStatisticsPanel.tsx",
  "src/components/home/HomeViewSelector.tsx",
  "src/components/home/ModePreviewPanel.tsx",
  "src/components/home/PrimaryHomeAction.tsx",
  "src/components/home/illustrations/ModeIllustration.tsx",
  "src/components/home/illustrations/TrainingScene.tsx",
  "src/components/home/illustrations/TrainingGroundedActor.tsx",
  "src/components/home/illustrations/TrainingParticleField.tsx",
  "src/components/home/illustrations/TrainingRadarOverlay.tsx",
  "src/components/home/illustrations/TrainingRadarSequence.tsx",
  "src/components/home/illustrations/gpu/TrainingGpuCanvas.tsx",
  "src/components/home/illustrations/gpu/TrainingGpuDebugPanel.tsx",
  "src/components/home/illustrations/CompetitiveScene.tsx",
  "src/components/home/illustrations/SceneGroup.tsx",
  "src/lib/home/homeDashboardViewModel.ts",
  "src/lib/home/getHomeDashboardViewModel.ts",
  "src/lib/home/homeIllustrationAssets.ts",
  "src/lib/home/homeSceneParallax.ts",
  "src/lib/home/trainingCamera.ts",
  "src/lib/home/homeLaunch.ts",
  "src/lib/home/trainingParticlePresets.ts",
  "src/lib/home/trainingParticleTiming.ts",
  "src/lib/home/trainingDomRadarApplier.ts",
  "src/lib/home/trainingRadarClock.ts",
  "src/lib/home/trainingRadarSnapshots.ts",
  "src/lib/home/trainingRadarTargets.ts",
  "src/lib/home/gpu/TrainingGpuConsolidatedRenderer.ts",
  "src/lib/home/gpu/TrainingGpuSceneRenderer.ts",
  "src/lib/home/gpu/TrainingGpuObjectAssetLoader.ts",
  "src/lib/home/gpu/trainingGpuObjectAssetCatalog.ts",
  "src/lib/home/gpu/trainingGpuObjectManifest.ts",
  "src/lib/home/gpu/trainingGpuBaseUtils.ts",
  "src/lib/home/gpu/trainingGpuFennecTiming.ts",
  "src/lib/home/gpu/trainingGpuObjectRegistry.ts",
  "src/lib/home/gpu/trainingGpuObjectPlacement.ts",
  "src/lib/home/gpu/trainingGpuParallaxState.ts",
  "src/lib/home/gpu/debug/TrainingGpuDebugCollector.ts",
  "src/lib/home/gpu/debug/trainingGpuDebugTypes.ts",
  "src/lib/home/gpu/trainingGpuTacticalShaders.ts",
  "src/lib/home/gpu/trainingGpuTacticalTiming.ts",
  "src/lib/home/gpu/trainingGpuTacticalUtils.ts",
  "src/lib/home/gpu/trainingGpuTypes.ts",
  "src/lib/home/gpu/trainingGpuVolumeScanTiming.ts",
  "src/lib/home/gpu/trainingGpuVolumeUtils.ts",
  "src/hooks/useParallaxController.ts",
  "src/hooks/useTrainingDomRadarDriver.ts",
  "src/hooks/useTrainingGpuObjectAssets.ts",
  "src/hooks/useTrainingRadarClock.ts",
  "src/hooks/useTrainingRendererDebug.ts",
  "src/hooks/useTrainingRendererMode.ts",
  "src/types/home.ts",
];

const legacyHomeFiles = [
  "src/components/home/HomeDashboardModules.tsx",
  "src/components/home/HistoryCard.tsx",
  "src/components/home/LockedFeatureCard.tsx",
  "src/components/home/ModeSelector.tsx",
  "src/components/home/PermitCard.tsx",
  "src/components/home/PlayerProfileCard.tsx",
  "src/components/home/RecentSessionCard.tsx",
  "src/components/home/ResourceCard.tsx",
  "src/components/home/SkillProgressCard.tsx",
  "src/components/home/WeaknessSummaryCard.tsx",
  "src/components/home/WeeklyPriorityCard.tsx",
];

function read(path) {
  if (!existsSync(path)) throw new Error(`Missing expected file: ${path}`);
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const files = Object.fromEntries(expectedFiles.map((path) => [path, read(path)]));
const page = files["src/app/page.tsx"];
const appFrame = files["src/components/AppFrame.tsx"];
const orientationGate = files["src/components/OrientationGate.tsx"];
const homeDashboard = files["src/components/home/HomeDashboard.tsx"];
const homeHeader = files["src/components/home/HomeHeader.tsx"];
const homeLaunchOverlay = files["src/components/home/HomeLaunchOverlay.tsx"];
const statisticsPanel = files["src/components/home/HomeStatisticsPanel.tsx"];
const viewSelector = files["src/components/home/HomeViewSelector.tsx"];
const tooltip = files["src/components/home/AccessibleTooltip.tsx"];
const modePreview = files["src/components/home/ModePreviewPanel.tsx"];
const primaryAction = files["src/components/home/PrimaryHomeAction.tsx"];
const modeIllustration = files["src/components/home/illustrations/ModeIllustration.tsx"];
const trainingScene = files["src/components/home/illustrations/TrainingScene.tsx"];
const trainingGroundedActor = files["src/components/home/illustrations/TrainingGroundedActor.tsx"];
const trainingParticleField = files["src/components/home/illustrations/TrainingParticleField.tsx"];
const trainingRadarOverlay = files["src/components/home/illustrations/TrainingRadarOverlay.tsx"];
const trainingRadarSequence = files["src/components/home/illustrations/TrainingRadarSequence.tsx"];
const trainingGpuCanvas = files["src/components/home/illustrations/gpu/TrainingGpuCanvas.tsx"];
const trainingGpuDebugPanel = files["src/components/home/illustrations/gpu/TrainingGpuDebugPanel.tsx"];
const competitiveScene = files["src/components/home/illustrations/CompetitiveScene.tsx"];
const sceneGroup = files["src/components/home/illustrations/SceneGroup.tsx"];
const sceneDepths = files["src/lib/home/homeSceneParallax.ts"];
const trainingCamera = files["src/lib/home/trainingCamera.ts"];
const homeLaunch = files["src/lib/home/homeLaunch.ts"];
const parallaxController = files["src/hooks/useParallaxController.ts"];
const trainingParticlePresets = files["src/lib/home/trainingParticlePresets.ts"];
const trainingParticleTiming = files["src/lib/home/trainingParticleTiming.ts"];
const trainingDomRadarApplier = files["src/lib/home/trainingDomRadarApplier.ts"];
const trainingRadarClock = files["src/lib/home/trainingRadarClock.ts"];
const trainingRadarSnapshots = files["src/lib/home/trainingRadarSnapshots.ts"];
const trainingRadarTargets = files["src/lib/home/trainingRadarTargets.ts"];
const trainingGpuConsolidatedRenderer = files["src/lib/home/gpu/TrainingGpuConsolidatedRenderer.ts"];
const trainingGpuSceneRenderer = files["src/lib/home/gpu/TrainingGpuSceneRenderer.ts"];
const trainingGpuRenderer = trainingGpuConsolidatedRenderer;
const trainingGpuObjectAssetLoader = files["src/lib/home/gpu/TrainingGpuObjectAssetLoader.ts"];
const trainingGpuObjectAssetCatalog = files["src/lib/home/gpu/trainingGpuObjectAssetCatalog.ts"];
const trainingGpuObjectManifest = files["src/lib/home/gpu/trainingGpuObjectManifest.ts"];
const trainingGpuBaseUtils = files["src/lib/home/gpu/trainingGpuBaseUtils.ts"];
const trainingGpuFennecTiming = files["src/lib/home/gpu/trainingGpuFennecTiming.ts"];
const trainingGpuFennecVolumeUtils = trainingGpuSceneRenderer;
const trainingGpuObjectRegistry = files["src/lib/home/gpu/trainingGpuObjectRegistry.ts"];
const trainingGpuObjectPlacement = files["src/lib/home/gpu/trainingGpuObjectPlacement.ts"];
const trainingGpuParallaxState = files["src/lib/home/gpu/trainingGpuParallaxState.ts"];
const trainingGpuDebugCollector = files["src/lib/home/gpu/debug/TrainingGpuDebugCollector.ts"];
const trainingGpuDebugTypes = files["src/lib/home/gpu/debug/trainingGpuDebugTypes.ts"];
const trainingGpuTacticalTiming = files["src/lib/home/gpu/trainingGpuTacticalTiming.ts"];
const trainingGpuTacticalUtils = files["src/lib/home/gpu/trainingGpuTacticalUtils.ts"];
const trainingGpuTypes = files["src/lib/home/gpu/trainingGpuTypes.ts"];
const trainingGpuVolumeScanTiming = files["src/lib/home/gpu/trainingGpuVolumeScanTiming.ts"];
const trainingRendererDebugHook = files["src/hooks/useTrainingRendererDebug.ts"];
const trainingRendererModeHook = files["src/hooks/useTrainingRendererMode.ts"];
const trainingGpuVolumeUtils = files["src/lib/home/gpu/trainingGpuVolumeUtils.ts"];
const trainingGpuObjectAssetsHook = files["src/hooks/useTrainingGpuObjectAssets.ts"];
const trainingDomRadarDriver = files["src/hooks/useTrainingDomRadarDriver.ts"];
const trainingRadarClockHook = files["src/hooks/useTrainingRadarClock.ts"];
const homeIllustrationAssets = files["src/lib/home/homeIllustrationAssets.ts"];
const types = files["src/types/home.ts"];
const viewModel = files["src/lib/home/homeDashboardViewModel.ts"];
const css = files["src/app/home.css"];

assert(page.includes("HomeDashboard") && page.includes("getHomeDashboardViewModel"), "Home must use its adapter and dashboard.");
assert(page.includes('variant="home"'), "Home must keep the dedicated app frame.");
assert(!page.includes("getQuestionSummaries"), "Home must not read question data directly.");
assert(appFrame.includes('variant?: "default" | "game" | "home"'), "AppFrame must keep the home variant.");
assert(!orientationGate.includes("OrientationLockType"), "Session orientation must compile without experimental DOM types.");
assert(orientationGate.includes('lock?: (orientation: "landscape")'), "Session orientation behavior must stay unchanged.");

for (const snippet of [
  'HomeModeId = "training" | "competitive"',
  'HomeViewId = "statistics" | HomeModeId',
  'WeeklyFocusState = "pending" | "choice_required" | "active" | "renewal_due"',
  "statistics: HomeStatisticsSummary",
  "strengths: SkillInsight[]",
  "weaknesses: SkillInsight[]",
  "recentSessions: HomeSessionSummary[]",
  "allSessionsHref?: string",
]) {
  assert(types.includes(snippet), `Home contract missing: ${snippet}`);
}

assert(viewModel.includes('selectedView = input.selectedView ?? "statistics"'), "Statistics must be selected by default.");
assert(viewModel.includes('id: "statistics"') && viewModel.indexOf('id: "statistics"') < viewModel.indexOf('id: "training"'), "Statistics must be the first view.");
assert(viewModel.includes("permitProgress: clampPercentage(input.permitProgress ?? 0)"), "Permit progress must default through the ViewModel.");
assert(viewModel.includes("Number.isFinite(value) ? Math.round(value) : 0"), "Permit progress must normalize to a finite integer.");
assert(viewModel.includes("Math.min(100, Math.max(0, normalizedValue))"), "Permit progress must be clamped from 0 to 100.");
assert(viewModel.includes("strengths: (input.strengths ?? []).slice(0, 3)"), "Strengths must be capped at three.");
assert(viewModel.includes("weaknesses: (input.weaknesses ?? []).slice(0, 3)"), "Weaknesses must be capped at three.");
assert(viewModel.includes("recentSessions: (input.recentSessions ?? []).slice(0, 3)"), "Recent sessions must be capped at three.");
assert(viewModel.includes('href: "/session"'), "Training CTA must keep /session.");
assert(viewModel.includes('label: "Permis n\\u00e9cessaire"'), "Competitive must use the requested permit wording.");
assert(viewModel.includes('feedback: "Ma\\u00eetrise les bases pour obtenir le permis."'), "Competitive tooltip wording must be present.");
assert(!viewModel.includes("Positionnement") && !viewModel.includes("Gestion du boost"), "No default player skill may be invented.");

assert(viewSelector.includes('role="radiogroup"') && viewSelector.includes('role="radio"'), "The three views must keep radio semantics.");
assert(viewSelector.includes("ArrowRight") && viewSelector.includes('"Home", "End"'), "View selector must support full keyboard navigation.");
assert(viewSelector.includes("choiceRefs.current[nextIndex]?.focus()"), "Keyboard selection must move actual focus.");
assert(viewSelector.includes('view.id !== "statistics"'), "Statistics must not mount a mode preview.");
assert(viewSelector.includes("modePreviews[view.id]"), "Training and Competitive must keep their detailed cards.");
assert(!modePreview.includes("ModeIllustration"), "Mode detail cards must not contain scene canvases.");

assert(trainingGpuCanvas.includes("const surfaceCanvas = surfaceCanvasRef.current") && trainingGpuCanvas.includes("const sweepCanvas = sweepCanvasRef.current") && trainingGpuCanvas.includes("const sceneCanvas = sceneCanvasRef.current") && trainingGpuCanvas.includes('window.addEventListener("resize", handleResize)') && trainingGpuCanvas.includes('window.removeEventListener("resize", resizeCanvases)'), "The three GPU canvas refs must be captured before asynchronous initialization and the geometry/DPR listener must be cleaned up.");
assert(trainingGpuConsolidatedRenderer.includes("function getWebGl2Context") && trainingGpuSceneRenderer.includes("function getWebGl2Context") && !trainingGpuVolumeUtils.includes("canvas.getContext"), "Only the three consolidated canvas owners may acquire WebGL2 contexts.");
assert(trainingGpuVolumeUtils.includes("if (assets === this.assets) return") && trainingGpuVolumeUtils.includes("this.initializeVolumeSubsystem()") && trainingGpuVolumeUtils.includes("this.initializeBaseSubsystem()") && trainingGpuVolumeUtils.includes("this.initializeTacticalSubsystem()"), "Repeated object asset installation must be idempotent without recreating base, volume or tactical textures.");
assert(trainingGpuVolumeUtils.includes('reportVolumeFailureOnce("initialization failed"') && trainingGpuVolumeUtils.includes('reportVolumeFailureOnce("render failed"') && trainingGpuVolumeUtils.includes('process.env.NODE_ENV === "production"'), "Volume failures must expose one development-only diagnostic without production noise.");
assert(!trainingGpuVolumeUtils.includes("requestAnimationFrame") && !trainingGpuVolumeUtils.includes("setTimeout") && !trainingGpuVolumeUtils.includes("setInterval") && !trainingGpuFennecVolumeUtils.includes("requestAnimationFrame") && !trainingGpuFennecVolumeUtils.includes("setTimeout") && !trainingGpuFennecVolumeUtils.includes("setInterval"), "Object effects must stay on the renderer MasterClock without their own loop or timers.");
assert(!trainingGpuTacticalTiming.includes("requestAnimationFrame") && !trainingGpuTacticalTiming.includes("setTimeout") && !trainingGpuTacticalTiming.includes("setInterval") && trainingGpuTacticalTiming.includes("getTrainingRadarTemporalSnapshot") && trainingGpuVolumeScanTiming.includes("getTrainingRadarTemporalSnapshot"), "GPU timing compatibility modules must delegate to the neutral MasterClock snapshot without timers.");
assert(trainingRadarSnapshots.includes('"hidden"') && trainingRadarSnapshots.includes('"contact"') && trainingRadarSnapshots.includes('"active"') && trainingRadarSnapshots.includes('"hold"') && trainingRadarSnapshots.includes('"fade"') && trainingRadarSnapshots.includes("getTrainingRadarTacticalState"), "Canonical tactical snapshots must cover contact, stable activation, global hold and next-volume fade.");
assert(trainingGpuVolumeUtils.includes("target.contextLost = true") && trainingGpuVolumeUtils.includes("this.setBaseReady(false)") && trainingGpuVolumeUtils.includes("this.setVolumeReady(false)") && trainingGpuVolumeUtils.includes("this.setTacticalReady(false)") && trainingGpuVolumeUtils.includes("this.options.onContextRestored()"), "A shared object context loss must restore all independent DOM fallbacks until current-time rendering succeeds.");
assert(trainingGpuVolumeUtils.includes("cssWidth <= 0") && trainingGpuVolumeUtils.includes("target.viewport = null") && trainingGpuVolumeUtils.includes("if (!this.hasViewports())"), "Zero-sized object canvases must never be reported ready.");
assert(/removeEventListener\(\s*"webglcontextlost"/.test(trainingGpuSceneRenderer) && trainingGpuSceneRenderer.includes("this.releaseParticleResources();") && trainingGpuSceneRenderer.includes("this.releaseObjectResources();") && !trainingGpuVolumeUtils.includes("addEventListener"), "Consolidated teardown must release scene resources and its sole listener pair while utilities own no context listeners.");
assert(/finally\s*\{\s*gl\.deleteShader\(vertexShader\);/.test(trainingGpuVolumeUtils) && trainingGpuTacticalUtils.includes("gl.deleteTexture(texture);") && trainingGpuTacticalUtils.includes("gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);"), "Failed tactical shader and texture creation must release partial GPU resources and restore upload state.");
assert(trainingScene.includes("const showDomBase = !useGpuRenderer || !gpuBasesReady") && trainingScene.includes('data-gpu-bases-ready=') && (trainingScene.match(/showDomBase=\{showDomBase\}/g) ?? []).length === 4 && (trainingGroundedActor.match(/data-dom-base-visible=/g) ?? []).length === 2, "The four object bases must stay mounted and switch atomically to their preserved DOM Image fallbacks.");
assert(/const showDomVolumeScan\s*=\s*!useGpuRenderer \|\|\s*!gpuVolumeScansReady/.test(trainingScene) && trainingScene.includes('data-gpu-volume-scans-ready='), "The four object volume scans must switch atomically to the DOM fallback.");
assert(/const showDomTactical\s*=\s*!useGpuRenderer \|\|\s*!gpuTacticalReady/.test(trainingScene) && trainingScene.includes('data-gpu-tactical-ready=') && trainingGpuCanvas.includes("onTacticalReadyChange"), "Tactical readiness and its four-object DOM fallback must remain independent from volume readiness.");
assert(trainingGroundedActor.includes("showDomTactical") && trainingGroundedActor.includes("target.wireframeAsset.path") && trainingGroundedActor.includes("target.glowAsset.path") && trainingGroundedActor.includes("target.energyAsset.path"), "Wireframe, glow and tactical-energy images must remain available as DOM fallbacks.");
assert(trainingGroundedActor.includes("training-grounded-actor-base") && trainingGroundedActor.includes("training-ball-launch-energy") && css.includes('.training-radar-car-target[data-tactical-phase="contact"]::before'), "Bases, launch energy and the procedural DOM contact pulse must remain intact.");
assert((trainingGroundedActor.match(/<canvas/g) ?? []).length === 0 && !trainingGroundedActor.includes("tacticalCanvas") && !trainingGpuCanvas.includes("tacticalCanvas"), "Grounded actors must not retain per-object or tactical canvases after consolidation.");
assert(!trainingGpuTacticalUtils.includes("getContext(") && !trainingGpuTacticalUtils.includes("requestAnimationFrame"), "Tactical resources must reuse existing WebGL2 contexts and the renderer RAF.");
assert(trainingGpuTacticalUtils.includes('"left-car": ["tacticalWireframe", "tacticalGlow"]') && trainingGpuTacticalUtils.includes('"back-right-car": ["tacticalWireframe", "tacticalGlow"]') && trainingGpuTacticalUtils.includes('"front-right-car": ["tacticalWireframe", "tacticalGlow"]') && trainingGpuTacticalUtils.includes('ball: ["tacticalEnergy"]'), "Exactly six car tactical textures and one ball tactical texture must be installed.");
assert(trainingGpuTacticalUtils.includes('fitMode = registration.kind === "ball" ? "cover" : "contain"') && trainingGpuTacticalUtils.includes("getTrainingGpuObjectLocalQuad(asset.entry"), "Every tactical role must derive its local quad independently from its validated manifest entry.");
assert(trainingGpuBaseUtils.includes("createTrainingGpuBaseResources") && trainingGpuBaseUtils.includes("assets.assets.base") && trainingGpuBaseUtils.includes("gl.ONE_MINUS_SRC_ALPHA") && !trainingGpuBaseUtils.includes("requestAnimationFrame") && !trainingGpuBaseUtils.includes("getContext("), "Four independent base textures must reuse the object contexts, shared VAOs and renderer lifecycle with normal premultiplied blending.");
assert(trainingGpuObjectPlacement.includes("getTrainingGpuObjectBaseQuadInCanvasSpace") && trainingGpuObjectPlacement.includes("convertTrainingGpuSceneRectToLocalCanvasRect") && trainingGpuObjectPlacement.includes("getTrainingGpuObjectRenderRect(registration, baseEntry)") && !trainingGpuObjectPlacement.includes("getBoundingClientRect"), "Grounded-scene base crops must be converted mechanically into cached local canvas rectangles without DOM layout reads.");
assert(trainingGpuVolumeUtils.includes("target.baseQuad = baseAsset") && trainingGpuVolumeUtils.includes("this.renderBaseTarget(this.targets[objectId])") && trainingGpuVolumeUtils.indexOf("this.renderBaseTarget(this.targets[objectId])") < trainingGpuVolumeUtils.indexOf("renderVolume(snapshot"), "Base quads must be cached during geometry updates and rendered before object effects.");
const trainingGpuAnimatedObjectFrame = trainingGpuSceneRenderer.slice(trainingGpuSceneRenderer.indexOf("private renderObject("), trainingGpuSceneRenderer.indexOf("private renderVolume("));
assert(trainingGpuAnimatedObjectFrame.includes("renderTrainingGpuBaseTarget(") && trainingGpuAnimatedObjectFrame.indexOf("renderTrainingGpuBaseTarget(") < trainingGpuAnimatedObjectFrame.indexOf("this.renderVolume(") && trainingGpuAnimatedObjectFrame.indexOf("this.renderVolume(") < trainingGpuAnimatedObjectFrame.indexOf("this.renderTactical(") && trainingGpuConsolidatedRenderer.includes("renderStaticFrame") && !trainingGpuConsolidatedRenderer.slice(trainingGpuConsolidatedRenderer.indexOf("private canAnimate()"), trainingGpuConsolidatedRenderer.indexOf("private syncAnimationLoop()")).includes("Ready"), "Animated scene draws must keep base, volume and tactical order while static bases never keep the RAF alive.");
assert(trainingGpuVolumeUtils.includes('textures: baseResourceTargets.length') && trainingGpuVolumeUtils.includes('programs: baseResourceTargets.length') && trainingGpuBaseUtils.includes("getTrainingGpuBaseTextureBytes"), "Base diagnostics must report exactly one texture and one program per prepared object.");
assert(css.includes(".training-gpu-scene-layer") && css.includes(".training-gpu-scene-canvas") && css.includes("mix-blend-mode: normal") && trainingGpuSceneRenderer.includes("gl.ONE_MINUS_SRC_COLOR"), "The consolidated scene canvas must composite normally while preserving screen-style effect blending inside WebGL.");
assert(trainingGroundedActor.includes("target.baseAsset.path") && trainingGroundedActor.includes("training-ball-launch-energy") && (trainingGroundedActor.match(/<canvas/g) ?? []).length === 0, "DOM base fallbacks and launch energy must remain intact without any local object canvas.");
assert(trainingRadarTargets.includes("contactDurationMs: 360") && trainingRadarTargets.includes("tacticalHoldDurationMs: 1800") && trainingRadarTargets.includes("fadeDurationMs: 800"), "Central tactical timings must remain unchanged.");
assert(trainingScene.includes('name="fennec"') && trainingGpuObjectAssetCatalog.includes('"fennec"') && trainingGpuObjectAssetCatalog.includes("/ui/training-objects/fennec/manifest.json") && trainingGpuVolumeUtils.includes('TrainingGpuVolumeObjectId = Exclude<') && trainingGpuTacticalUtils.includes('TrainingGpuTacticalObjectId = Exclude<') && trainingGpuTacticalUtils.includes('"fennec"') && trainingGpuTacticalUtils.includes("dedicated Fennec pipeline") && !trainingGpuBaseUtils.includes('"fennec"'), "The Fennec volume path must stay isolated from the four established object renderers.");
assert(["left-car", "back-right-car", "front-right-car", "ball", "fennec"].every((id) => trainingGpuObjectAssetCatalog.includes(id)) && (trainingGpuObjectAssetCatalog.match(/\/manifest\.json/g) ?? []).length === 5 && trainingGpuObjectAssetLoader.includes("estimatedTextureBytes") && trainingGpuObjectAssetLoader.includes("entry.outputSize.width * entry.outputSize.height * 4"), "The GPU loader must load five prepared manifests and expose their future RGBA texture memory.");
assert(trainingGpuObjectManifest.includes("crop must stay inside sourceSize") && trainingGpuObjectManifest.includes("outputSize must match crop size exactly") && trainingGpuObjectAssetLoader.includes("image.naturalWidth !== entry.outputSize.width"), "Fennec manifests and decoded image dimensions must retain the shared strict validation.");
assert(!trainingScene.includes("training-gpu-fennec-canvas") && trainingGpuSceneRenderer.includes('getTrainingGpuObjectRegistration("fennec")') && !trainingGpuObjectAssetLoader.includes("requestAnimationFrame") && !trainingGpuObjectAssetLoader.includes("setTimeout") && !trainingGpuObjectAssetLoader.includes("setInterval"), "Fennec rendering must reuse the consolidated scene owner without a local canvas, loop or timer.");
assert(homeIllustrationAssets.includes("/ui/training-lights-violet-glow-screen.png") && !trainingGpuObjectAssetCatalog.includes("lights-violet-glow-screen") && !trainingGpuObjectAssetCatalog.includes("headlightGlow:") && trainingScene.includes('name="fennec-lights-glow"'), "The full-scene violet screen halo must stay separate from the local Fennec headlight role.");
assert(!trainingGpuSceneRenderer.includes("TrainingGpuFennecVolumeSubsystem") && !trainingGpuSceneRenderer.includes("fennecCanvas") && trainingGpuSceneRenderer.includes("private renderFennec("), "Fennec must be drawn by the consolidated scene owner without another context or canvas.");
assert(trainingGpuObjectRegistry.includes('"fennec-surface-frame"') && trainingGpuObjectRegistry.includes('"fennec:contour-scene"') && /"scene",\s*trainingFennecVolumeScanTarget\.contourAsset/.test(trainingGpuObjectRegistry) && trainingGpuSceneRenderer.includes("sceneQuad(registration, asset") && trainingGpuObjectPlacement.includes("convertTrainingGpuLogicalSceneRectToLocalCanvasRect"), "Fennec surface and contour must keep their distinct manifest placement spaces with scene conversion.");
const fennecVolumeRenderStart = trainingGpuSceneRenderer.indexOf("private renderFennecVolume(");
const fennecVolumeRender = trainingGpuSceneRenderer.slice(fennecVolumeRenderStart, trainingGpuSceneRenderer.indexOf("\n  private renderFennecEffects(", fennecVolumeRenderStart));
assert(fennecVolumeRender.includes('["surface", "contour"]') && !fennecVolumeRender.includes("getBoundingClientRect"), "The consolidated scene must render Fennec surface before contour without per-frame layout reads.");
assert(trainingGpuSceneRenderer.includes("snapshot.volume.fennec") && trainingGpuSceneRenderer.includes("state.surface") && trainingGpuSceneRenderer.includes("state.contour") && trainingRadarSnapshots.includes("getTrainingRadarVolumeScanState"), "The Fennec scan must join the canonical absolute MasterClock volume snapshot and reproduce active, hold, fade and hidden states.");
assert(trainingScene.includes("gpuFennecVolumeReady") && trainingScene.includes('data-gpu-fennec-volume-ready=') && css.includes('.training-scene[data-gpu-fennec-volume-ready="true"]') && css.includes(".training-radar-fennec-surface-mask") && css.includes(".training-radar-fennec-contour"), "Fennec volume readiness must atomically swap both preserved DOM fallbacks only after a valid GPU render.");
assert(trainingScene.includes("trainingFennecVolumeScanTarget.surfaceAsset") && trainingScene.includes("trainingFennecVolumeScanTarget.contourAsset") && trainingScene.includes("trainingFennecVolumeScanTarget.impactAsset") && trainingScene.includes("assets.fennecBase") && trainingScene.includes("assets.fennecHeadlightGlow") && trainingScene.includes("assets.fennecRearAccent") && trainingScene.includes('name="fennec-lights-glow"'), "Fennec base, tactical impact, local lights, contact shadow and global violet halo must remain in the DOM after the volume-only migration.");
assert(trainingGpuObjectAssetsHook.includes("Promise.allSettled") && trainingGpuObjectAssetsHook.includes("Object.fromEntries(loadedEntries)") && trainingScene.includes('gpuObjectAssetState.status === "error"'), "A local Fennec asset failure must preserve partial decoded sets so the four established GPU objects stay independent.");
assert(trainingGpuSceneRenderer.includes('recordContextLost(subsystem)') && trainingGpuSceneRenderer.includes('recordContextRestored(subsystem)') && trainingGpuSceneRenderer.includes("this.setAllReady(false)") && trainingGpuSceneRenderer.includes("this.options.onContextRestored()"), "Scene context loss must restore all DOM fallbacks and restoration must resume the current absolute frame.");
assert(trainingGpuDebugTypes.includes('| "fennec-volume"') && trainingGpuDebugCollector.includes('"fennec-volume": createSubsystemState()') && trainingGpuDebugPanel.includes('"fennec-volume"') && trainingGpuSceneRenderer.includes('"fennec-volume"') && trainingGpuSceneRenderer.includes("estimatedTextureBytes"), "debugRenderer=1 must expose consolidated Fennec readiness, texture memory and context recovery.");
assert(!trainingGpuFennecTiming.includes("requestAnimationFrame") && !trainingGpuFennecTiming.includes("setTimeout") && !trainingGpuFennecTiming.includes("setInterval") && trainingGpuFennecTiming.includes("getTrainingRadarFennecEffectsState"), "Fennec tactical effects must delegate to the shared absolute MasterClock without a second loop or timer.");
assert(trainingRadarSnapshots.includes("baseOpacity: 1 - impactOpacity") && trainingRadarSnapshots.includes("FENNEC_TACTICAL_EMPHASIS_DURATION_MS = 650") && trainingRadarSnapshots.includes("{ progress: 1, opacity: 0 }"), "The shared Fennec base and tactical impact must use inverse validated curves that return to their neutral values.");
assert(!trainingScene.includes("training-gpu-fennec-canvas") && trainingGpuSceneRenderer.includes("this.renderFennecEffects(") && !trainingGpuSceneRenderer.includes("requestAnimationFrame"), "Fennec volume and local tactical effects must share the consolidated scene context, renderer RAF and clock sample.");
const fennecEffectsRenderStart = trainingGpuSceneRenderer.indexOf("private renderFennecEffects(");
const fennecEffectsRender = trainingGpuSceneRenderer.slice(fennecEffectsRenderStart, trainingGpuSceneRenderer.indexOf("\n  private beginFennecProgram(", fennecEffectsRenderStart));
assert(fennecEffectsRender.indexOf("tacticalImpact") < fennecEffectsRender.indexOf("rearAccent") && fennecEffectsRender.indexOf("rearAccent") < fennecEffectsRender.indexOf("headlightGlow") && trainingGpuSceneRenderer.includes("textures: fennecCount * 3"), "The consolidated Fennec pass must draw tactical impact, rear accent and headlight glow in their validated order with exactly three effect textures.");
assert(trainingGpuSceneRenderer.includes("fennec.assetSet.assets.tacticalImpact") && trainingGpuSceneRenderer.includes("fennec.assetSet.assets.rearAccent") && trainingGpuSceneRenderer.includes("fennec.assetSet.assets.headlightGlow") && trainingGpuSceneRenderer.includes("sceneQuad(registration"), "Each Fennec effect must keep its distinct manifest placement in scene coordinates.");
assert(trainingScene.includes("gpuFennecEffectsReady") && trainingScene.includes('data-gpu-fennec-effects-ready=') && css.includes('.training-scene[data-gpu-fennec-effects-ready="true"]') && css.includes(".training-radar-fennec-impact") && css.includes(".training-fennec-headlight-glow") && css.includes(".training-fennec-rear-accent"), "Fennec effect readiness must atomically hide all three preserved DOM fallbacks only after their first valid shared-canvas draw.");
assert(trainingScene.includes("assets.fennecBase") && !css.includes("--training-fennec-gpu-base-opacity") && !trainingGpuSceneRenderer.includes("--training-fennec-gpu-base-opacity") && !trainingGpuSceneRenderer.includes("setDomBaseOpacity"), "The temporary DOM opacity bridge must remain removed once base opacity feeds WebGL directly.");
assert(homeIllustrationAssets.includes("/ui/training-lights-violet-glow-screen.png") && trainingScene.includes('name="fennec-lights-glow"') && !trainingGpuSceneRenderer.includes("lights-violet-glow-screen"), "The global violet screen halo must remain a separate DOM group.");
assert(trainingGpuDebugTypes.includes('| "fennec-effects"') && trainingGpuDebugCollector.includes('"fennec-effects": createSubsystemState()') && trainingGpuDebugPanel.includes('"fennec-effects"') && trainingGpuSceneRenderer.includes('"fennec-effects"'), "debugRenderer=1 must report consolidated Fennec effects independently.");
assert(trainingGpuObjectRegistry.includes('fennecBaseGroup = "fennec:base-scene"') && trainingGpuSceneRenderer.includes("fennec.assetSet.assets.base") && trainingGpuSceneRenderer.includes("snapshot.fennecEffects.baseOpacity"), "The GPU Fennec base must use manifest scene placement and shared absolute opacity.");
const fennecFrameRenderStart = trainingGpuSceneRenderer.indexOf("private renderFennec(");
const fennecFrameRender = trainingGpuSceneRenderer.slice(fennecFrameRenderStart, trainingGpuSceneRenderer.indexOf("\n  private renderFennecVolume", fennecFrameRenderStart));
const fennecCanAnimate = trainingGpuConsolidatedRenderer.slice(trainingGpuConsolidatedRenderer.indexOf("private canAnimate()"), trainingGpuConsolidatedRenderer.indexOf("\n  private syncAnimationLoop()"));
assert(fennecFrameRender.indexOf("this.renderUnmaskedFennecLayer(") < fennecFrameRender.indexOf("this.renderFennecVolume(") && fennecFrameRender.indexOf("this.renderFennecVolume(") < fennecFrameRender.indexOf("this.renderFennecEffects("), "The consolidated scene must preserve Fennec base, volume and local effects order.");
assert(trainingGpuSceneRenderer.includes("gl.ONE_MINUS_SRC_COLOR") && trainingGpuConsolidatedRenderer.includes("renderStaticFrame") && !fennecCanAnimate.includes("isBaseReady"), "The Fennec base must render in first and static frames without starting a base-only RAF.");
assert(trainingScene.includes("gpuFennecBaseReady") && trainingScene.includes('data-gpu-fennec-base-ready=') && css.includes('.training-scene[data-gpu-fennec-base-ready="true"]') && css.includes(".training-fennec-base-frame") && css.includes('.training-scene[data-launching="true"] .training-fennec-base-frame'), "The preserved DOM Fennec base fallback must hide only after an independent successful GPU base draw and return for launch.");
assert(trainingGpuSceneRenderer.includes('"fennec-base"') && trainingGpuSceneRenderer.includes("textures: fennecCount") && trainingGpuDebugTypes.includes('| "fennec-base"') && trainingGpuDebugCollector.includes('"fennec-base": createSubsystemState()') && trainingGpuDebugPanel.includes('"fennec-base"'), "debugRenderer=1 must expose Fennec base readiness, one texture, memory, static renders, errors and shared-context recovery.");
assert(!trainingScene.includes("training-gpu-fennec-canvas") && trainingGpuSceneRenderer.includes("fennec.assetSet.assets.base") && trainingGpuObjectAssetCatalog.includes('"fennec"'), "GPU mode must render all five prepared objects through the single consolidated scene context.");

assert(
  trainingRendererDebugHook.includes('TRAINING_RENDERER_DEBUG_PARAM = "debugRenderer"') &&
    trainingRendererDebugHook.includes('=== "1"') &&
    trainingScene.includes("debugEnabled && debugCollector ? ("),
  "Renderer diagnostics must activate only with debugRenderer=1 and must not render a panel otherwise.",
);
assert(
  trainingGpuDebugPanel.includes("const PANEL_REFRESH_MS = 250") &&
    trainingGpuDebugPanel.includes("window.setInterval(refresh, PANEL_REFRESH_MS)") &&
    trainingGpuDebugPanel.includes("window.clearInterval(panelTimerId)"),
  "The React diagnostics panel must poll at four hertz and clean up its timer.",
);
assert(
  trainingGpuDebugTypes.includes('| "bases"') &&
    trainingGpuDebugCollector.includes("bases: createSubsystemState()") &&
    trainingGpuDebugCollector.includes('recordStaticRender(subsystem: TrainingGpuDebugSubsystemName)') &&
    trainingGpuDebugPanel.includes('"bases"'),
  "Local renderer diagnostics must expose base readiness, CPU, resources, errors, shared context events and static renders.",
);
assert(
  trainingGpuDebugTypes.includes('| "tactical"') &&
    trainingGpuDebugCollector.includes("tactical: createSubsystemState()") &&
    trainingGpuDebugPanel.includes('"tactical"'),
  "Local renderer diagnostics must expose tactical readiness, CPU, resources, errors and shared context events.",
);

assert(
  trainingGpuDebugCollector.includes("new Float64Array(capacity)") &&
    trainingGpuDebugCollector.includes("FRAME_SAMPLE_CAPACITY = 240") &&
    trainingGpuDebugCollector.includes("CPU_SAMPLE_CAPACITY = 120") &&
    !trainingGpuDebugCollector.includes(".push(..."),
  "Renderer frame and CPU histories must stay bounded in circular buffers.",
);
assert(
  trainingGpuDebugPanel.includes("new PerformanceObserver") &&
    trainingGpuDebugPanel.includes('observe({ type: "longtask", buffered: false })') &&
    trainingGpuDebugPanel.includes("longTaskObserver.disconnect()"),
  "Long tasks must be observed and disconnected only while the debug panel is mounted.",
);
const trainingRendererCoreDebugSources =
  trainingGpuDebugCollector +
  trainingGpuDebugTypes +
  trainingRendererDebugHook;
const trainingRendererDebugSources =
  trainingGpuDebugPanel + trainingRendererCoreDebugSources;
assert(
  !trainingRendererCoreDebugSources.includes("requestAnimationFrame") &&
    !trainingRendererCoreDebugSources.includes("new TrainingRadarClock") &&
    !trainingRendererCoreDebugSources.includes("setTimeout") &&
    !trainingRendererCoreDebugSources.includes("setInterval("),
  "Diagnostics must not create an effect clock, RAF loop, or uncontrolled timer.",
);
assert(
  trainingGpuDebugPanel.includes("window.setInterval(") &&
    !/(fetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket)/.test(
      trainingRendererDebugSources,
    ),
  "Diagnostics may use only the bounded panel timer and must never send telemetry.",
);
assert(
  trainingGpuDebugPanel.includes("Copier le rapport JSON") &&
    trainingGpuDebugPanel.includes("navigator.clipboard?.writeText") &&
    trainingGpuDebugPanel.includes("Rapport JSON à copier manuellement") &&
    trainingGpuDebugPanel.includes("getSafeReportUrl"),
  "Renderer diagnostics must export a sanitized local JSON report with a manual fallback.",
);
assert(
  trainingGpuDebugCollector.includes('recordSubsystemCpu(') &&
    trainingGpuDebugCollector.includes("p95FrameMs") &&
    trainingGpuDebugCollector.includes("over20Ms") &&
    trainingGpuDebugCollector.includes("over33Ms") &&
    trainingGpuDebugCollector.includes("over50Ms"),
  "Diagnostics must expose bounded frame metrics and CPU timings.",
);
assert(
  /recordSubsystemCpu\(\s*"radar"/.test(trainingGpuConsolidatedRenderer) &&
    /recordSubsystemCpu\(\s*"bases"/.test(trainingGpuConsolidatedRenderer) &&
    trainingGpuConsolidatedRenderer.includes("publishFrameMetrics(") &&
    trainingGpuSceneRenderer.includes("setSubsystemResources(") &&
    !trainingGpuConsolidatedRenderer.includes("TrainingGpuDebugPanel"),
  "The consolidated owners must report context resources and per-frame GPU work without importing React presentation.",
);
assert(
  trainingGpuObjectAssetLoader.includes("recordManifestLoaded") &&
    trainingGpuObjectAssetLoader.includes("recordImageDecoded") &&
    trainingGpuVolumeUtils.includes("recordTextureUpload"),
  "Manifest, image decode, and texture upload diagnostics must remain passive loading measurements.",
);
assert(
  trainingGpuDebugCollector.includes("recordContextLost") &&
    trainingGpuDebugCollector.includes("recordContextRestored") &&
    trainingGpuDebugTypes.includes("estimatedTextureBytes"),
  "Context events and theoretical texture memory must be present in local reports.",
);
assert(
  trainingRendererModeHook.includes('useState<TrainingRendererMode>("dom")') &&
    /const showDomRadar\s*=\s*!useGpuRenderer \|\|\s*!gpuRadarReady/.test(trainingScene) &&
    /const showDomParticles\s*=\s*!useGpuRenderer \|\|\s*!gpuParticlesReady/.test(trainingScene) &&
    /const showDomVolumeScan\s*=\s*!useGpuRenderer \|\|\s*!gpuVolumeScansReady/.test(trainingScene) &&
    /const showDomTactical\s*=\s*!useGpuRenderer \|\|\s*!gpuTacticalReady/.test(trainingScene),
  "DOM mode and every existing DOM fallback must remain the default.",
);
assert(
  !trainingRendererDebugSources.includes("FRAGMENT_SHADER") &&
    !trainingRendererDebugSources.includes("trainingParticlePresets") &&
    !trainingRendererDebugSources.includes("trainingRadarTargets"),
  "Renderer diagnostics must not migrate or redefine a visual effect.",
);

assert(homeDashboard.includes("useState<HomeViewId>(viewModel.selectedView)"), "Dashboard must initialize from the selected home view.");
assert(homeDashboard.includes('selectedView === "statistics"'), "Statistics panel must be the default right context.");
assert(homeDashboard.includes("<HomeStatisticsPanel") && homeDashboard.includes("<ModeIllustration"), "Right context must switch between statistics and one scene.");
assert(homeDashboard.includes('selectedView !== "training"'), "Only Training may enter the launch flow.");
assert(!homeDashboard.includes("HomeDashboardModules"), "Legacy lower grid must not render.");
assert(homeDashboard.includes("resetParallax(200)"), "Training launch must still recenter parallax.");
assert(homeDashboard.includes("router.push(destination)"), "Training launch must still navigate after its animation.");
assert((homeDashboard.match(/window\.setTimeout/g) ?? []).length === 1, "Training launch must keep one timer.");
assert(homeDashboard.includes("clearTimeout(launchTimerRef.current)"), "Training launch timer must clean up.");
assert(homeDashboard.includes('aria-busy={launchingMode !== null}'), "Launch state must remain accessible.");
assert(homeLaunch.includes("HOME_LAUNCH_DURATION_MS = 2000"), "Training launch must remain exactly two seconds.");
assert(!homeLaunchOverlay.includes("setTimeout") && !modeIllustration.includes("setTimeout"), "Scene and overlay must not duplicate the launch timer.");

assert(statisticsPanel.includes("Aucune session pour le moment."), "Statistics must expose an honest empty session state.");
assert(statisticsPanel.includes("Pas encore assez de donnees."), "Strengths and weaknesses must expose honest empty states.");
assert(statisticsPanel.includes("statistics.recentSessions.length > 1 && statistics.allSessionsHref"), "All sessions link must require real data and a route.");
assert(statisticsPanel.includes("session.href ?"), "Session links must render only when a real href exists.");
assert(statisticsPanel.includes('statistics.targetedSessions.state === "available" && statistics.targetedSessions.href'), "Targeted sessions link must require availability and a real route.");
assert(statisticsPanel.indexOf("insight.skill") < statisticsPanel.indexOf("insight.cognitiveCause"), "Rocket League skill must precede its cognitive cause.");

assert(homeHeader.includes('role="progressbar"'), "Header must expose a semantic permit progress bar.");
for (const attribute of ["aria-valuemin", "aria-valuemax", "aria-valuenow"]) {
  assert(homeHeader.includes(attribute), `Permit progress missing ${attribute}.`);
}
assert(homeHeader.includes("permitProgress} %"), "Header must display the ViewModel permit percentage.");
assert(homeHeader.includes("<AccessibleTooltip"), "Permit progress must have an interactive accessible tooltip.");
assert(tooltip.includes('event.key !== "Escape"'), "Tooltip must close with Escape.");
assert(tooltip.includes("onMouseEnter") && tooltip.includes("onFocus") && tooltip.includes("onClick"), "Tooltip must work with hover, focus and touch/click.");
assert(tooltip.includes("onClick={() => setIsOpen(true)}"), "Touch activation must not immediately toggle the focused tooltip closed.");
assert(tooltip.includes('role="tooltip"') && tooltip.includes("aria-describedby"), "Tooltip must be programmatically described.");
assert(tooltip.includes('removeEventListener("pointerdown"'), "Tooltip outside-click listener must clean up.");
assert(primaryAction.includes("AccessibleTooltip") && !primaryAction.includes(" disabled={isLaunching}"), "Locked Competitive info must stay interactive.");
assert(primaryAction.includes("event.preventDefault()") && primaryAction.includes("onLaunch(action)"), "Training CTA must retain controlled launch.");

assert(modeIllustration.includes("<TrainingScene") && modeIllustration.includes("active={active}") && modeIllustration.includes("launching={launching}") && modeIllustration.includes("applyCameraSnapshot={applyTrainingCameraSnapshot}") && modeIllustration.includes("<CompetitiveScene />"), "One selected scene must render with Training lifecycle state and the shared camera sampler.");
assert(modeIllustration.includes("getLaunchGeometry") && modeIllustration.includes("resetParallax"), "Scene launch handle must stay intact.");
assert(sceneGroup.includes("scene-parallax") && sceneGroup.includes("scene-idle") && sceneGroup.includes("scene-launch"), "Scene transform wrappers must stay independent.");
assert(
  sceneGroup.includes("homeSceneDepths[depth]") &&
    sceneGroup.includes('"--scene-parallax-scale-x"') &&
    sceneGroup.includes('"--scene-parallax-scale-y"'),
  "Scene transforms must separate horizontal safety scale from vertical scene scale."
);
for (const asset of ["parallaxSky", "parallaxFarSkyline", "parallaxMidBuildings", "parallaxNearBuildings", "parallaxGround", "parallaxBarrier"]) {
  assert(trainingScene.includes(`assets.${asset}`), `Training parallax layer missing: ${asset}`);
}
assert(!trainingScene.includes("parallaxGroundBarrier") && homeIllustrationAssets.includes('/ui/parallax-plan-01-sol.png') && homeIllustrationAssets.includes('/ui/parallax-plan-01-barriere.png'), "Training must compose separate pitch and barrier assets.");
assert(homeIllustrationAssets.includes('/ui/matrice_analyse.png') && !homeIllustrationAssets.includes('/ui/terrain_matrice_analyse.png'), "Training radar must reveal the barrier-free tactical pitch matrix only.");
assert(!trainingScene.includes("TrainingAnalysisOverlay") && !trainingScene.includes("assets.background"), "Legacy Training background and analysis circles must not render.");
assert(!trainingScene.includes("distantCarsOcclusion"), "Legacy distant-car occlusion sheet must not render.");
assert(trainingScene.includes('name={`training-${trainingFarCarTarget.id}`}') && trainingScene.includes("<TrainingGroundedCar"), "Training cars must render as individual grounded scene groups.");
for (const target of ["left-car", "back-right-car", "front-right-car"]) {
  assert(trainingRadarTargets.includes(`id: "${target}"`), `Grounded Training car missing: ${target}`);
}
assert(trainingScene.includes('name="training-radar-surface"') && trainingScene.includes('name="training-radar-sweep"') && !trainingScene.includes('name="training-radar-targets"'), "Training radar surfaces must stay behind the grounded actors.");
assert(trainingScene.indexOf('name="training-radar-sweep"') < trainingScene.indexOf('name="training-barrier"') && trainingScene.indexOf('name="training-barrier"') < trainingScene.indexOf('name="training-particles-far"'), "The stable barrier must occlude the ground scan while remaining behind Training actors.");
assert(trainingScene.includes('depth="trainingMid" layer={2} name="training-atmospheric-haze"') && trainingScene.indexOf('name="training-atmospheric-haze"') < trainingScene.indexOf('name="training-mid-buildings"') && !trainingScene.includes("training-horizon-haze"), "Training haze must move with and remain behind the second skyline plane.");
assert(trainingScene.includes('name="ball"') && trainingScene.includes('name="fennec"') && trainingScene.includes('name="fennec-lights-glow"'), "Training ball, Fennec and separate light-glow groups must remain.");
for (const premiumFennecLayer of ["fennecHeadlightGlow", "fennecRearAccent"]) {
  assert(trainingScene.includes(`assets.${premiumFennecLayer}`), `Missing permanent premium Fennec layer: ${premiumFennecLayer}.`);
}
assert(!homeIllustrationAssets.includes("fennec-base reflection overlay.png") && !trainingScene.includes("assets.fennecReflection"), "The parasitic Fennec reflection overlay must never be registered or rendered.");
assert(trainingScene.includes("assets.lightsVioletGlow") && trainingScene.indexOf('name="fennec"') < trainingScene.indexOf('name="fennec-lights-glow"'), "The violet screen asset must render in a separate group above the Fennec.");
for (const fennecVolumeAsset of ["fennecSurfaceScan", "fennecContourScan", "fennecRimLight"]) {
  assert(trainingRadarTargets.includes(fennecVolumeAsset), `Missing Fennec systematic volume asset: ${fennecVolumeAsset}.`);
}
for (const fennecAssetPath of ["/ui/training-fennec-base.png", "/ui/fennec-base surface-scan overlay.png", "/ui/fennec-base contour-scan overlay.png", "/ui/fennec-base im light overlay.png"]) {
  assert(homeIllustrationAssets.includes(fennecAssetPath), `Missing calibrated Fennec asset: ${fennecAssetPath}.`);
}
assert(trainingScene.includes("training-radar-fennec-target") && trainingScene.includes("trainingFennecVolumeScanTarget.surfaceAsset") && trainingScene.includes("trainingFennecVolumeScanTarget.contourAsset") && trainingScene.includes("trainingFennecVolumeScanTarget.impactAsset") && trainingScene.includes("data-volume-scan-phase") && trainingScene.includes("data-tactical-active"), "The Fennec volume overlays and separate tactical im-light state must share the calibrated target.");
assert(trainingScene.includes('className="training-transition-wave-local"'), "Prepared Training transition layer must remain.");

for (const [preset, expectedCount] of Object.entries({ far: 6, mid: 5, near: 3 })) {
  assert(
    trainingParticlePresets.includes(`${preset}: ${expectedCount},`),
    `Training particle count must stay deterministic for ${preset}: ${expectedCount}.`
  );
  assert(
    trainingScene.includes(`depth="trainingParticles${preset[0].toUpperCase()}${preset.slice(1)}"`) &&
      trainingScene.includes(`preset="${preset}"`),
    `Training particle trail missing from the ${preset} parallax depth.`
  );
}
assert(trainingParticlePresets.includes("far: 1107") && trainingParticlePresets.includes("mid: 2284") && trainingParticlePresets.includes("near: 3916"), "Training particles must use fixed per-depth seeds.");
assert(!trainingParticlePresets.includes("Math.random"), "Training particles must not use nondeterministic randomness.");
for (const visibilityTuning of [
  "size: [2.2, 3.4]",
  "opacity: [0.78, 0.94]",
  "size: [2.8, 4.5]",
  "opacity: [0.82, 1]",
  "size: [3.6, 5.4]",
  "opacity: [0.86, 1]",
  "glow: [18, 25]",
]) {
  assert(trainingParticlePresets.includes(visibilityTuning), `Radar-linked tactical particles lost their calibrated tuning: ${visibilityTuning}.`);
}
for (const lifetimeTuning of [
  "durationMs: [950, 1150]",
  "durationMs: [1050, 1300]",
  "durationMs: [1150, 1400]",
  "rise: [12, 18]",
  "driftX: [5, 10]",
]) {
  assert(trainingParticlePresets.includes(lifetimeTuning), `Radar trail timing or lift missing: ${lifetimeTuning}.`);
}
const radarTrailParticleCounts = { "violet-dust": 5, "gold-dot": 2, "tactical-spark": 7 };
for (const [kind, expectedCount] of Object.entries(radarTrailParticleCounts)) {
  assert(trainingParticlePresets.includes(`"${kind}": ${expectedCount}`), `Radar trail particle count missing for ${kind}: ${expectedCount}.`);
}
assert(Object.values(radarTrailParticleCounts).reduce((total, count) => total + count, 0) === 14, "Training radar trail must render exactly 14 readable particles per pass.");
assert(trainingParticlePresets.includes("(index + 0.5 + (random() - 0.5) * 0.44) / expectedCount"), "Radar particles must span the sweep from left to right instead of clustering.");
assert(trainingParticlePresets.includes("exclusionZones") && trainingParticlePresets.includes("isTooClose"), "Particle generation must keep actor exclusions and anti-cluster spacing.");
assert(trainingParticlePresets.includes("normalizedX ** 2 + normalizedY ** 2 < 1"), "Actor exclusions must use precise elliptical masks.");
assert(trainingParticleField.includes('aria-hidden="true"') && trainingParticleField.includes('data-particle-kind={particle.kind}'), "Particles must remain decorative and expose their deterministic visual kind.");
assert(trainingParticleField.includes("domVisible: boolean") && trainingParticleField.includes("data-particle-birth-ms") && trainingParticleField.includes("data-particle-duration-ms"), "Radar particles must expose cached absolute-timing metadata to the DOM applier.");
assert(
  trainingParticleField.includes("getTrainingParticleBirthDelayMs") &&
    trainingParticleTiming.includes("TRAINING_RADAR_SWEEP") &&
    trainingParticleTiming.includes("getTrainingRadarDelayForProgress"),
  "Particle delays must derive from the same central linear sweep geometry as the radar.",
);
assert(trainingParticleField.includes("--particle-rise-end") && trainingParticleField.includes("--particle-fragment-rise-end") && css.includes("--particle-glow-soft"), "Particle trail must expose lift, glow decay and disintegration fragments.");
assert((trainingParticleField.match(/data-particle-slot=/g) ?? []).length === 1 && trainingDomRadarApplier.includes("snapshot.particlePasses") && !trainingScene.includes("direction={passDirection}"), "All particle depths must retain two cached pass bands sampled from the live LTR MasterClock without a direction branch.");
assert(!/(<img|<video|<canvas|\.png|\.gif|requestAnimationFrame)/.test(trainingParticleField + trainingParticlePresets), "Particle rendering must stay HTML/CSS-only without a per-frame React loop.");
assert(trainingRadarOverlay.includes('id="training-radar-terrain-core-mask"') && trainingRadarOverlay.includes('className="training-tactical-terrain-core"'), "The tactical mesh must receive a dedicated high-intensity reveal under the radar core.");
assert(trainingRadarOverlay.includes('className="training-radar-core-glow"') && trainingRadarOverlay.includes('className="training-radar-core-line"'), "The radar must separate its soft halo from its sharp central scan line.");

for (const orderedName of [
  'name="training-radar-sweep"',
  'name="training-barrier"',
  'name="training-particles-far"',
  `name={\`training-${'${trainingFarCarTarget.id}'}\`}`,
  'name="training-particles-mid"',
  `name={\`training-${'${trainingMidCarTarget.id}'}\`}`,
  'name="training-particles-near"',
  'name="fennec"',
  'name="fennec-lights-glow"',
]) {
  assert(trainingScene.includes(orderedName), `Missing particle depth-order marker: ${orderedName}`);
}
const trainingParticleOrder = [
  'name="training-radar-sweep"',
  'name="training-barrier"',
  'name="training-particles-far"',
  `name={\`training-${'${trainingFarCarTarget.id}'}\`}`,
  'name="training-particles-mid"',
  `name={\`training-${'${trainingMidCarTarget.id}'}\`}`,
  'name="training-particles-near"',
  'name="fennec"',
  'name="fennec-lights-glow"',
].map((marker) => trainingScene.indexOf(marker));
assert(trainingParticleOrder.every((position, index) => index === 0 || position > trainingParticleOrder[index - 1]), "Particle groups must keep their intended actor occlusion order.");
assert(trainingScene.includes('data-launching={launching ? "true" : "false"}'), "Training particle lifecycle must receive launch state.");
assert(trainingGroundedActor.includes("training-grounded-actor-base") && trainingGroundedActor.includes("training-contact-shadow"), "Grounded actors must share one transformed base and contact shadow.");
assert(trainingGroundedActor.includes("training-radar-car-surface") && trainingGroundedActor.includes("training-radar-car-contour") && trainingGroundedActor.includes("training-radar-car-wireframe") && trainingGroundedActor.includes("training-radar-car-glow"), "Cars must layer surface, contour, wireframe and glow inside their grounded container.");
assert(!trainingRadarTargets.includes("TRAINING_OBJECT_SCAN_TARGET_ID") && !trainingGroundedActor.includes("usesObjectScanV1"), "No adversary car may remain locked behind the retired car-03 prototype gate.");
assert(trainingRadarTargets.match(/objectScan: \{/g)?.length === 3 && trainingGroundedActor.includes('data-object-scan="aligned"'), "All three adversary cars must carry their own radar-aligned scan configuration.");
assert(!trainingGroundedActor.includes("training-object-local-scan-line") && trainingGroundedActor.includes("training-radar-object-surface") && trainingGroundedActor.includes("training-radar-object-contour"), "Every adversary car must render surface and contour volume layers without a decorative local line.");
assert(trainingGroundedActor.includes("training-ball-contact-shadow") && trainingGroundedActor.includes("training-radar-ball-energy"), "Ball energy and contact treatment must share the grounded ball container.");
assert(trainingGroundedActor.includes('src={target.surfaceAsset.path}') && trainingGroundedActor.includes('src={target.contourAsset.path}') && !trainingGroundedActor.includes('<span className="training-radar-ball-volume'), "The ball volume scan must render its aligned surface and contour image assets, not CSS spans.");
assert(homeIllustrationAssets.includes('/ui/training-ball Overlay surface-scan.png') && homeIllustrationAssets.includes('/ui/training-ball overlay contour-scan.png') && homeIllustrationAssets.includes('/ui/training-ball-energy-gold.png'), "Ball volume and tactical energy assets must remain explicitly separate.");
assert(trainingRadarOverlay.includes('viewBox="0 0 1672 941"') && trainingRadarOverlay.includes("TRAINING_RADAR_FIELD_PATH"), "Training radar must share and clip to the logical field canvas.");
assert(trainingRadarOverlay.includes('data-radar-direction="ltr"') && !trainingRadarOverlay.includes("TrainingRadarDirection") && !trainingScene.includes("passDirection"), "Both radar layers must be permanently LTR.");
assert(trainingRadarOverlay.includes('id="training-radar-field-surface-mask"') && trainingRadarOverlay.includes('id="training-radar-field-sweep-mask"'), "Every radar layer must use a field surface mask.");
assert(!trainingRadarTargets.includes("TRAINING_OBJECT_SCAN_OCCLUSION") && !trainingRadarOverlay.includes("training-radar-object-notch") && !trainingScene.includes("objectTransferActive"), "The fixed car-03 capsule prototype must stay removed from the stable ground radar.");
assert(!trainingRadarOverlay.includes('clipPath="url(#training-radar-field') && trainingRadarOverlay.includes('M -286 340 L 2 340'), "Training scan must keep the broad legacy reveal zone behind its strict field mask.");
assert(trainingRadarOverlay.includes('stopColor="black"') && trainingRadarOverlay.includes('offset="0.04" stopColor="#707070"') && trainingRadarOverlay.includes('offset="0.6" stopColor="#e8e8e8"'), "Training radar depth must stay weak at the horizon but remain readable through the car zone.");
assert(trainingRadarTargets.includes('"M 0 414 C 360 423') && trainingScene.indexOf('name="training-radar-sweep"') < trainingScene.indexOf('name="training-barrier"'), "The radar must be tightly masked to the visible pitch below the stable barrier.");
assert(trainingRadarOverlay.includes('mix-blend-mode') === false && css.includes("mix-blend-mode: screen"), "Black tactical terrain must be screen blended in CSS.");
assert(trainingRadarSequence.includes("document.visibilityState") && trainingRadarSequence.includes("IntersectionObserver") && trainingRadarSequence.includes("prefers-reduced-motion"), "Radar lifecycle must follow page, illustration, and motion visibility.");
assert(!trainingRadarSequence.includes("requestAnimationFrame"), "Radar must not create a per-frame React loop.");
assert(trainingRadarSequence.includes('cyclePassIndex === 0 ? "volume" : "tactical"') && trainingRadarSequence.includes("absolutePassIndex = cycleIndex * 2 + cyclePassIndex"), "Radar passes must alternate explicitly from one absolute cycle index.");
assert(!trainingRadarSequence.includes('"rtl"') && !trainingRadarSequence.includes("passDirection") && !trainingRadarTargets.includes("TrainingRadarDirection"), "The radar state and timing model must have no RTL branch.");
assert(!trainingRadarSequence.includes("scheduleVolumePass") && !trainingRadarSequence.includes("scheduleTacticalPass") && !trainingRadarSequence.includes("function schedule("), "Per-object volume and tactical schedulers must stay removed.");
assert(!trainingRadarSequence.includes("volumeScanPhases") && !trainingRadarSequence.includes("tacticalPhases") && !trainingRadarSequence.includes("fennecSurfaceMode") && !trainingRadarSequence.includes("fennecTacticalActive"), "The React sequence must expose global pass state only.");
assert((trainingRadarSequence.match(/window\.setTimeout/g) ?? []).length === 1 && trainingRadarSequence.includes("globalTimerId") && trainingRadarSequence.includes("objectTimersActive: 0"), "Exactly one global pass-boundary timer may remain and object timer count must stay zero.");
assert(trainingRadarSequence.includes("const cycleStartedAtMs = performance.now()") && trainingRadarSequence.includes("passStartedAtMs") && trainingRadarSequence.includes("nextPassBoundaryMs"), "The scheduler must retain one absolute origin, pass start and next absolute boundary.");
assert(trainingRadarSequence.includes("getAbsoluteTrainingRadarPass(cycleStartedAtMs, nowMs)") && trainingRadarSequence.includes("pass.absolutePassIndex - previousAbsolutePassIndex - 1") && !trainingRadarSequence.includes("while ("), "Late callbacks must jump directly to the theoretical pass without replaying missed passes.");
assert(!trainingRadarSequence.includes("Math.random"), "The deterministic absolute pass scheduler must never select a random target.");
assert(trainingRadarClockHook.includes("passStartedAtMs") && trainingRadarClockHook.includes("radarClock.beginPass") && !trainingRadarClockHook.includes("performance.now"), "The clock hook must receive the exact scheduler origin without creating a second timestamp.");
assert(trainingRadarClock.includes("this.passStartedAtMs = passStartedAtMs") && trainingRadarClock.includes("safeNowMs - this.passStartedAtMs"), "TrainingRadarClock must remain the unique absolute elapsed-time source.");
assert(trainingRadarSnapshots.includes("export function getTrainingRadarTemporalSnapshot") && !trainingRadarSnapshots.includes("document.") && !trainingRadarSnapshots.includes("window.") && !trainingRadarSnapshots.includes("performance.now") && !trainingRadarSnapshots.includes("setState"), "Canonical temporal snapshots must be pure and deterministic.");
assert(trainingGpuConsolidatedRenderer.includes("const snapshot = getTrainingRadarTemporalSnapshot(frameState)") && trainingGpuConsolidatedRenderer.includes("this.options.applyDomSnapshot?.(snapshot)") && trainingGpuConsolidatedRenderer.includes("this.sceneRenderer.render("), "The consolidated GPU RAF must calculate one shared frame snapshot and hand that same value to GPU and DOM.");
assert((trainingGpuCanvas.match(/<canvas/g) ?? []).length === 3, "Training GPU mode must mount exactly three canvases.");
assert(!trainingScene.includes("VolumeCanvasRef") && !trainingGroundedActor.includes("<canvas"), "Old per-object GPU canvases and refs must stay removed.");
assert(trainingGpuCanvas.includes("TrainingGpuConsolidatedRenderer") && trainingGpuCanvas.includes("sceneCanvasRef"), "Training must use the consolidated scene owner.");
assert((trainingGpuConsolidatedRenderer.match(/getWebGl2Context\(/g) ?? []).length === 3 && (trainingGpuSceneRenderer.match(/getWebGl2Context\(/g) ?? []).length === 3, "The runtime owners must centralize initial WebGL2 acquisition and explicit restore acquisition for the three remaining canvases.");
assert((trainingGpuSceneRenderer.match(/\bgl\.clear\(gl\.COLOR_BUFFER_BIT\)/g) ?? []).length === 1 && trainingGpuSceneRenderer.includes("this.gl.clear(this.gl.COLOR_BUFFER_BIT)"), "The consolidated scene must use one frame clear plus one explicit idle clear path.");
assert(trainingGpuSceneRenderer.includes('this.renderParticles("far"') && trainingGpuSceneRenderer.indexOf('this.renderParticles("far"') < trainingGpuSceneRenderer.indexOf('this.renderObject("left-car"') && trainingGpuSceneRenderer.indexOf('this.renderParticles("mid"') < trainingGpuSceneRenderer.indexOf('this.renderObject("back-right-car"') && trainingGpuSceneRenderer.indexOf('this.renderParticles("near"') < trainingGpuSceneRenderer.indexOf("this.renderFennec("), "Consolidated draw order must preserve the original depth interleave.");
assert(trainingGpuSceneRenderer.includes("sharedResources?.volume") && trainingGpuSceneRenderer.includes("sharedResources?.base") && trainingGpuSceneRenderer.includes("sharedResources?.tactical"), "Compatible object programs, VAOs and buffers must be shared inside the scene context.");
assert(trainingGpuSceneRenderer.includes("Object.values(this.particleResources)[0]?.quadBuffer"), "Particle depths must share their compatible quad buffer.");
assert(trainingGpuConsolidatedRenderer.includes("webglcontextlost") && trainingGpuConsolidatedRenderer.includes("webglcontextrestored") && trainingGpuSceneRenderer.includes("webglcontextlost") && trainingGpuSceneRenderer.includes("webglcontextrestored"), "Each consolidated context owner must handle loss and restore centrally.");
assert(parallaxController.includes("setTrainingGpuParallaxSnapshot") && trainingGpuSceneRenderer.includes("getTrainingGpuParallaxSnapshot") && trainingGpuParallaxState.includes("effectiveScaleX"), "GPU parallax must consume the existing controller state without layout reads or another RAF.");
assert(trainingDomRadarDriver.includes('mode !== "dom"') && trainingDomRadarDriver.includes("window.requestAnimationFrame(renderFrame)") && !trainingDomRadarDriver.includes("setState"), "The alternative DOM driver must own one RAF only in DOM mode and never render React per frame.");
assert(trainingScene.includes("useGpuRenderer ? (") && trainingScene.includes("<TrainingGpuCanvas") && trainingScene.includes("applyDomSnapshot={applyDomSnapshot}"), "GPU mode must mount the GPU RAF and reuse it to keep DOM fallbacks synchronized.");
assert(trainingDomRadarApplier.includes("constructor(private readonly root") && trainingDomRadarApplier.includes("this.valueCache") && !trainingDomRadarApplier.slice(trainingDomRadarApplier.indexOf("apply(snapshot:"), trainingDomRadarApplier.indexOf("destroy()")).includes("querySelector") && !trainingDomRadarApplier.includes("getBoundingClientRect"), "The DOM applier must cache references, avoid per-frame layout reads and only write changed values.");
assert(trainingDomRadarApplier.includes("trainingVolumeScanTargets") === false && trainingDomRadarApplier.includes("trainingRadarTargets") && trainingDomRadarApplier.includes("snapshot.volume.fennec"), "The cached DOM applier must cover all configured cars/ball plus the Fennec.");
assert(css.includes('.training-scene[data-training-time-source="master-clock"]') && css.includes("animation-play-state: paused") && css.includes("--training-volume-surface-opacity") && css.includes("--training-tactical-wireframe-opacity"), "MasterClock DOM effects must expose the absolute current values instead of starting an independent CSS timeline.");
assert(trainingGpuDebugTypes.includes("globalTimersActive") && trainingGpuDebugTypes.includes("objectTimersActive") && trainingGpuDebugTypes.includes("activeDriver") && trainingGpuDebugTypes.includes("trainingRafCount") && trainingGpuDebugTypes.includes("skippedPasses") && trainingGpuDebugTypes.includes("domChangedValuesPerFrame") && trainingGpuDebugTypes.includes("drawCallsPerFrame") && trainingGpuDebugTypes.includes("clearCallsPerFrame") && trainingGpuDebugTypes.includes("textureBindsPerFrame"), "Debug snapshots must expose scheduler, RAF, context and per-frame GPU work metrics.");
for (const target of ["left-car", "back-right-car", "front-right-car", "ball", "fennec"]) {
  assert(trainingRadarTargets.includes(`id: "${target}"`), `Missing training radar target: ${target}`);
}
for (const [targetId, scanDelayMs, tacticalDelayMs] of [
  ["left-car", 1250, 1350],
  ["ball", 1600, 1550],
  ["fennec", 1783, 2000],
  ["back-right-car", 2108, 2100],
  ["front-right-car", 2200, 2200],
]) {
  const targetStart = trainingRadarTargets.indexOf(`id: "${targetId}",`);
  const targetBlock = trainingRadarTargets.slice(targetStart, targetStart + 1200);
  assert(targetStart >= 0 && targetBlock.includes(`scanDelayMs: ${scanDelayMs}`) && targetBlock.includes(`tacticalDelayMs: ${tacticalDelayMs}`), `Incorrect calibrated scan/tactical delay for ${targetId}.`);
}
assert(trainingRadarSnapshots.includes("frameState.elapsedMs - target.scanDelayMs") && trainingRadarSnapshots.includes("frameState.elapsedMs - target.tacticalDelayMs") && trainingRadarSnapshots.includes("fennecTarget.tacticalDelayMs"), "Canonical volume and tactical snapshots must consume their separate calibrated delays.");
assert(!trainingRadarSequence.includes("getTrainingRadarHitDelayMs") && !trainingRadarTargets.includes("getTrainingRadarHitDelayMs"), "Calibrated target delays must not be replaced by one shared derived hit delay.");
assert(trainingRadarTargets.includes("trainingVolumeScanTargets") && trainingRadarTargets.includes("trainingFennecVolumeScanTarget") && trainingRadarTargets.includes("scanHitProgress: TRAINING_FENNEC_SCAN_PROGRESS"), "The Fennec must join only the systematic volume target collection at its calibrated radar hit.");
for (const timing of ["TRAINING_RADAR_ENTRY_DURATION_MS = 250", "TRAINING_RADAR_TRAVEL_DURATION_MS = 2500", "TRAINING_RADAR_EXIT_DURATION_MS = 200", "TRAINING_RADAR_PAUSE_DURATION_MS = 180", "tacticalHoldDurationMs: 1800", "contactDurationMs: 360", "wireframeDelayMs: 820", "fadeDelayMs: 1500", "targetLifetimeMs: 2300", "fadeDurationMs: 800", "activeDurationMs: 380", "ballActiveDurationMs: 540", "fennecActiveDurationMs: 720", "contourDelayMs: 60", "holdDurationMs: 350", "fadeDurationMs: 400", "leadMs: 120"]) {
  assert(trainingRadarTargets.includes(timing), `Missing centralized radar timing: ${timing}`);
}
assert(!trainingRadarTargets.includes("slowZone") && !trainingRadarTargets.includes("extraDurationMs") && !trainingRadarTargets.includes("smoothTrainingRadarStep"), "Ball and Fennec slow zones must be removed from the central timeline.");
assert(/TRAINING_RADAR_TIMING\.entryDurationMs\s*\+\s*Math\.round\([\s\S]*?clampTrainingRadarProgress\(progress\)\s*\*\s*TRAINING_RADAR_TIMING\.travelDurationMs/s.test(trainingRadarTargets), "Radar target hits must use the linear entry plus progress times travel formula.");
assert(/\(scanRange\.endProgress - scanRange\.startProgress\)\s*\*\s*TRAINING_RADAR_TIMING\.travelDurationMs/s.test(trainingRadarTargets), "Range duration must be linear in endProgress minus startProgress.");
assert(trainingRadarTargets.includes('TRAINING_RADAR_TRAVEL_EASING = "linear"') && trainingDomRadarApplier.includes("TRAINING_RADAR_SWEEP.startX") && trainingRadarClock.includes("TRAINING_RADAR_TIMING.travelDurationMs"), "The visual radar and target scheduling must share one linear absolute timeline.");
assert(trainingRadarTargets.includes("TRAINING_RADAR_EXIT_DURATION_MS") && trainingRadarTargets.includes("TRAINING_RADAR_PAUSE_DURATION_MS") && trainingRadarSequence.includes("TRAINING_RADAR_TIMING.passDurationMs"), "Entry, travel, exit and hidden reset pause must stay centralized.");
assert(trainingRadarSnapshots.includes('target.type === "ball"') && trainingRadarSnapshots.includes('target.type === "fennec"') && trainingGroundedActor.includes("TRAINING_VOLUME_SCAN_TIMING.ballActiveDurationMs") && trainingScene.includes("getTrainingRadarRangeTiming"), "The ball must keep its longer fixed reveal while the Fennec consumes the exact shared radar-range timing.");
for (const placement of ['left: "34.76%"', 'left: "69.28%"', 'left: "73.84%"']) {
  assert(trainingRadarTargets.includes(placement), `Missing calibrated wireframe placement: ${placement}`);
}
for (const grounding of ["groundY: 0.465", "groundY: 0.45", "groundY: 0.49", "groundY: 0.5615"]) {
  assert(trainingRadarTargets.includes(grounding), `Missing grounded actor contact: ${grounding}`);
}
assert(competitiveScene.includes('name="cage"') && competitiveScene.includes('name="ground-reflection"'), "Competitive cage composition must remain.");
assert(competitiveScene.includes('name="motion-trail"') && competitiveScene.includes('name="fennec"'), "Competitive car composition must remain.");
for (const depth of ["3", "5", "7", "11", "14"]) {
  assert(sceneDepths.includes(`translationX: ${depth}`), `Missing legacy parallax depth: ${depth}px`);
}
assert(sceneDepths.includes("rotation: 0.2"), "Parallax rotation must remain capped at 0.2deg.");
for (const trainingDepth of ["trainingSky", "trainingSkyline", "trainingMid", "trainingNear", "trainingGround", "trainingParticlesFar", "trainingParticlesMid", "trainingParticlesNear", "trainingCarFar", "trainingCarMid", "trainingCarNear", "trainingBall", "trainingFennec"]) {
  assert(sceneDepths.includes(`${trainingDepth}:`), `Missing Training parallax depth: ${trainingDepth}`);
}
for (const amplitude of [3, 7, 22, 27, 23, 25, 28, 34]) {
  assert(sceneDepths.includes(`translationX: ${amplitude}`), `Missing Training horizontal amplitude: ${amplitude}px`);
}
assert(sceneDepths.includes("trainingParticlesFar: { translationX: 10, translationY: 0.8") && sceneDepths.includes("trainingParticlesMid: { translationX: 31, translationY: 2.6") && sceneDepths.includes("trainingParticlesNear: { translationX: 50, translationY: 4.4"), "Particle parallax must increase distinctly from far to near.");
assert(
  !parallaxController.includes("requestAnimationFrame") &&
    !parallaxController.includes("cancelAnimationFrame") &&
    !parallaxController.includes("setTimeout") &&
    !parallaxController.includes("setInterval"),
  "Parallax must reuse an existing Training MasterClock RAF without a private loop or timer."
);
assert(
  !parallaxController.includes("pointermove") &&
    !parallaxController.includes("pointerleave") &&
    !parallaxController.includes("POINTER_IDLE_DELAY_MS") &&
    !parallaxController.includes("AUTO_DRIFT_PERIOD_MS") &&
    !parallaxController.includes("AUTO_DRIFT_Y") &&
    !trainingCamera.includes("Math.sin"),
  "Pointer input and permanent sinusoidal drift must be absent from cinematic parallax."
);
assert(
  parallaxController.includes("new ResizeObserver") &&
    parallaxController.includes("entry.contentRect.width") &&
    parallaxController.includes("resizeObserver.disconnect()"),
  "Training safety scale must be calculated at mount and recalculated by ResizeObserver."
);
assert(
  !parallaxController.includes("getBoundingClientRect") &&
    trainingGpuCanvas.includes("new ResizeObserver") &&
    trainingGpuCanvas.includes("stackElement.getBoundingClientRect()"),
  "Parallax must avoid per-frame layout reads while renderer resize keeps its cached measurement path."
);
assert(
  trainingCamera.includes("getTrainingCameraSnapshot") &&
    trainingCamera.includes("sampleTrainingCameraSpring") &&
    trainingCamera.includes("Math.exp(-omega * elapsedSeconds)") &&
    trainingCamera.includes("frameState.passStartedAtMs") &&
    trainingCamera.includes("frameState.elapsedMs"),
  "The camera snapshot and critically damped spring must be sampled from absolute MasterClock time."
);
assert(
  trainingGpuConsolidatedRenderer.includes("applyCameraSnapshot(snapshot)") &&
    trainingDomRadarDriver.includes("applyCameraSnapshot(snapshot)") &&
    trainingGpuCanvas.includes("applyCameraSnapshot") &&
    modeIllustration.includes("applyTrainingCameraSnapshot"),
  "GPU and DOM drivers must consume the same MasterClock camera snapshot in their existing RAF."
);
assert(
  trainingCamera.includes("TRAINING_CAMERA_PROFILE_SETTLE_MS") &&
    trainingCamera.includes("TRAINING_CAMERA_DEPTH_PROFILES") &&
    trainingCamera.includes('"particles-near": 320') &&
    trainingCamera.includes("fennec: 600"),
  "Depth response profiles must be centralized for sky, architecture, ground, particles, objects, ball and Fennec."
);
assert(
  trainingCamera.includes("TRAINING_CAMERA_MAX_SCALE = 1.012") &&
    trainingCamera.includes("Math.min(") &&
    modeIllustration.includes('className="scene-camera"') &&
    css.includes("scale(var(--training-camera-scale, 1))"),
  "The shared DOM/GPU camera wrapper must cap global push-in at 1.012."
);
assert(
  trainingCamera.includes("options.reducedMotion || !options.active") &&
    parallaxController.includes("prefers-reduced-motion: reduce") &&
    parallaxController.includes('modeRef.current !== "training"'),
  "Reduced motion must stay centered and Competitive must not receive autonomous choreography."
);
assert(
  parallaxController.includes("resetToCenter") &&
    parallaxController.includes("sampleTrainingCameraSpring") &&
    parallaxController.includes("resetRef.current?.resolve()"),
  "resetToCenter must preserve its Promise API, use the analytic spring and never leave a pending reset."
);
assert(
  parallaxController.includes("cssValueCacheRef") &&
    parallaxController.includes("cache.get(name) === value") &&
    trainingGpuParallaxState.includes("snapshotChanged") &&
    trainingGpuParallaxState.includes("return false"),
  "Stable camera frames must deduplicate both CSS writes and GPU parallax updates."
);
assert(
  trainingCamera.includes("contactElapsedMs >= 0") &&
    trainingCamera.includes("contactElapsedMs <= TRAINING_CAMERA_CONTACT_DURATION_MS") &&
    trainingCamera.includes("4 * clamped * (1 - clamped)") &&
    trainingCamera.includes("frameState.passMode === \"volume\""),
  "Contact impulses must be short absolute-time envelopes that are not replayed after missed frames."
);
assert(
  sceneDepths.includes("calculateTrainingParallaxSafety") &&
    sceneDepths.includes("(2 * (translationX + safetyMargin)) / renderedContainerWidth"),
  "Training horizontal overscan must use the documented safety formula."
);
assert(
  sceneDepths.includes("TRAINING_PARALLAX_SAFETY_MARGIN_PX = 10") &&
    sceneDepths.includes("TRAINING_PARALLAX_MAX_SCALE_X = 1.1"),
  "Training overscan must keep a ten-pixel margin and cap horizontal zoom."
);
for (const safetyDepth of ["trainingSkyline", "trainingMid", "trainingNear", "trainingGround"]) {
  assert(
    sceneDepths.includes(`  "${safetyDepth}"`),
    `Dynamic Training safety depth missing: ${safetyDepth}`
  );
}
const trainingSafetyDepthSource = sceneDepths.match(/trainingParallaxSafetyDepths = \[([\s\S]*?)\]/)?.[1] ?? "";
assert(!trainingSafetyDepthSource.includes("trainingParticles"), "HTML particle planes must not enter raster overscan safety scaling.");

const requestedTrainingTranslations = {
  trainingSkyline: 7,
  trainingMid: 22,
  trainingNear: 34,
  trainingGround: 27,
};
const trainingSafetyMargin = 10;
const trainingMaximumScale = 1.1;

function calculateExpectedTrainingSafety(width, requestedTranslationX) {
  const maximumOverscanPerSide = ((trainingMaximumScale - 1) * width) / 2;
  const safetyMargin = Math.min(trainingSafetyMargin, maximumOverscanPerSide);
  const translationX = Math.min(
    requestedTranslationX,
    Math.max(0, maximumOverscanPerSide - safetyMargin)
  );
  const scaleX = 1 + (2 * (translationX + safetyMargin)) / width;
  return { safetyMargin, scaleX, translationX };
}

for (const width of [1672, 1166, 1180, 820, 320]) {
  for (const [name, requestedTranslationX] of Object.entries(requestedTrainingTranslations)) {
    const safety = calculateExpectedTrainingSafety(width, requestedTranslationX);
    const overscanPerSide = ((safety.scaleX - 1) * width) / 2;

    assert(safety.scaleX <= trainingMaximumScale + 1e-9, `${name} zoom exceeds cap at ${width}px.`);
    for (const cameraX of [-1, 0, 1]) {
      const requiredCoverage = Math.abs(cameraX * safety.translationX) + safety.safetyMargin;
      assert(
        overscanPerSide + 1e-9 >= requiredCoverage,
        `${name} exposes an edge at x=${cameraX} and ${width}px.`
      );
    }
  }
}
assert(
  calculateExpectedTrainingSafety(820, 34).translationX < 34 &&
    calculateExpectedTrainingSafety(320, 34).translationX <
      calculateExpectedTrainingSafety(820, 34).translationX,
  "Small screens must reduce horizontal travel instead of increasing zoom past the cap."
);
assert(trainingRadarSnapshots.includes("trainingRadarTargets.map") && !trainingRadarSequence.includes("activeTacticalTargetId"), "The tactical snapshot must accumulate every configured object from absolute time instead of selecting one target.");
assert(trainingRadarSnapshots.includes("trainingVolumeScanTargets.map") && trainingRadarSnapshots.includes("getTrainingRadarVolumeScanState(frameState, target)"), "The canonical volume snapshot must calculate calibrated temporary scans for all five 3D objects.");
const volumeSnapshotSource = trainingRadarSnapshots.slice(trainingRadarSnapshots.indexOf("export function getTrainingRadarVolumeScanState"), trainingRadarSnapshots.indexOf("function getHiddenTacticalState"));
const volumePhaseOrder = ['"active"', '"hold"', '"fade"'].map((phase) => volumeSnapshotSource.indexOf(phase));
assert(volumePhaseOrder.every((position, index) => position >= 0 && (index === 0 || position > volumePhaseOrder[index - 1])), "Each volume scan must follow active, hold, fade, then hidden in order.");
assert(volumeSnapshotSource.includes("TRAINING_VOLUME_SCAN_TIMING.holdDurationMs") && volumeSnapshotSource.includes("TRAINING_VOLUME_SCAN_TIMING.fadeDurationMs"), "Volume hold and fade boundaries must derive independently from unchanged central timings.");
assert(trainingRadarSequence.includes("TACTICAL_PASS_DURATION_MS") && trainingRadarSequence.includes("TRAINING_RADAR_TIMING.tacticalHoldDurationMs") && trainingRadarSequence.includes("nextPassBoundaryMs"), "Only the tactical absolute pass may add the 1800ms post-radar hold.");
for (const phaseType of ['TrainingRadarTacticalPhase =', 'TrainingRadarVolumeScanPhase =']) {
  assert(trainingRadarSnapshots.includes(phaseType), `Canonical radar phase model missing: ${phaseType}.`);
}
assert(
  css.includes("translate3d(0, -8%, 0) scaleY(1)") &&
    css.includes("translate3d(0, -4%, 0) scaleY(1.02)"),
  "Middle and near skyline planes must use vertical placement without horizontal CSS zoom."
);
const middleCityCss = css.match(/\.training-city-middle\s*\{[^}]*\}/s)?.[0] ?? "";
const nearCityCss = css.match(/\.training-city-near\s*\{[^}]*\}/s)?.[0] ?? "";
assert(
  !/\bscale\(/.test(middleCityCss) && !/\bscale\(/.test(nearCityCss),
  "Middle and near skyline images must not reintroduce a second horizontal scale."
);
assert(sceneDepths.includes("trainingMid: { translationX: 22") && sceneDepths.includes("trainingNear: { translationX: 34"), "The first two skyline planes must have strong and distinct foreground parallax.");
assert(css.includes("inset: 11% -6% 61%") && css.includes("ellipse at 52% 82%"), "The skyline haze must retain the latest calibrated horizon placement.");
assert(/document\.removeEventListener\(\s*"visibilitychange"/.test(parallaxController), "Parallax visibility listener must clean up.");
assert(parallaxController.includes("intersectionObserver?.disconnect()"), "Parallax observer must disconnect.");
assert(!parallaxController.includes("useState"), "Parallax must not update React state per frame.");
assert(
  trainingGpuDebugTypes.includes("cameraSourceEvent") &&
    trainingGpuDebugTypes.includes("pointerListenersActive") &&
    trainingGpuDebugTypes.includes("additionalParallaxRafCount") &&
    trainingGpuDebugPanel.includes("cameraCssWritesAvoided") &&
    trainingGpuDebugPanel.includes("cameraGpuUpdatesAvoided"),
  "debugRenderer must report camera state, avoided updates, pointer listeners and extra RAF count."
);

for (const line of css.split("\n")) {
  if (line.includes("font-size")) {
    assert(!line.includes("vw") && !line.includes("clamp("), `Font size must not scale with viewport width: ${line.trim()}`);
  }
}

assert(css.includes("height: 100svh") && css.includes("overflow-y: hidden"), "Desktop home must fit the available viewport without scrolling.");
assert(css.includes("@media (min-width: 1024px) and (min-height: 720px)"), "No-scroll desktop rule must start at the requested format.");
assert(css.includes("@media (max-width: 820px)"), "Portrait tablet and mobile layouts must stack.");
assert(css.includes(".home-statistics-panel") && css.includes(".statistics-lower-grid"), "Statistics panel layout must exist.");
assert(/\.home-statistics-panel\s*\{[^}]*height:\s*auto;/s.test(css), "Empty statistics content must shrink to its natural height.");
assert(!/\.home-statistics-panel\s*\{[^}]*border:\s*1px/s.test(css), "Statistics groups must not sit inside one visible outer card.");
for (const separatedGroup of ["statistics-weekly-focus", "statistics-insight", "statistics-targeted", "statistics-sessions"]) {
  assert(css.includes(`.${separatedGroup}`), `Missing separated statistics group: ${separatedGroup}`);
}
assert(css.includes("aspect-ratio: 1672 / 941"), "Scene ratio must remain 1672x941.");
assert(css.includes('.mode-illustration[data-motion-active="false"]'), "Hidden and offscreen scene motion must pause.");
assert(css.includes("@media (prefers-reduced-motion: reduce)"), "Reduced motion support must remain.");
assert(css.includes("3% 44.2%") && css.includes("82% 44.7%") && css.includes("97% 44.2%"), "Particles must be clipped below the curved terrain horizon.");
for (const preset of ["far", "mid", "near"]) {
  assert(css.includes(`data-particle-preset="${preset}"`), `Missing CSS depth band for ${preset} radar particles.`);
}
for (const keyframe of ["training-radar-particle-birth-flash", "training-radar-particle-disintegrate", "training-radar-particle-fragment"]) {
  assert(css.includes(`@keyframes ${keyframe}`), `Missing radar trail particle animation: ${keyframe}.`);
}
for (const kind of ["violet-dust", "gold-dot", "tactical-spark"]) {
  assert(css.includes(`data-particle-kind="${kind}"`), `Missing radar trail particle shape: ${kind}.`);
}
assert(css.includes("var(--particle-delay) 1 forwards") && !css.includes("var(--particle-delay) infinite"), "Radar particles must play once after each scan hit, never loop independently.");
assert(css.includes("drop-shadow(0 0 var(--particle-glow) currentColor)") && css.includes("drop-shadow(0 0 0 transparent)"), "Particles must leave the radar glowing and end with no glow.");
assert(trainingParticleField.includes('className="training-particle-birth-flash"') && css.includes("var(--particle-kick-x)") && css.includes("scale(1.22)"), "Each radar particle must receive a visible birth flash and directional ejection impulse.");
assert(css.includes("var(--particle-rise-mid)") && css.includes("var(--particle-rise-soft)") && css.includes("var(--particle-rise-end)"), "Particles must rise progressively while disintegrating.");
assert(css.includes("var(--particle-fragment-rise-mid)") && css.includes("var(--particle-fragment-rise-end)"), "Each radar particle must shed a secondary rising fragment.");
for (const removedWormMarker of ["training-metal-shard-jitter", "training-neon-streak-flash", "hard-glint", "neon-streak"]) {
  assert(!css.includes(removedWormMarker) && !trainingParticlePresets.includes(removedWormMarker), `Legacy worm-like particle effect must stay removed: ${removedWormMarker}.`);
}
assert(css.includes("clip-path: polygon(0 42%, 67% 0") && css.includes('data-particle-kind="tactical-spark"'), "Radar particles must use compact tactical fragments instead of large soft circles.");
assert(css.includes(".training-radar-core-line") && css.includes("stroke-width: 2.5px") && css.includes(".training-tactical-terrain-core"), "The radar core must stay thin, sharp and visibly linked to the saturated tactical mesh.");
for (const layeredScanMarker of ["training-object-contact", "training-object-surface-scan-ltr", "training-object-contour-scan-ltr", "training-ball-volume-surface", "training-ball-volume-contour", "training-fennec-volume-surface-ltr", "training-fennec-volume-detail-ltr", "training-object-tactical-wireframe", "training-object-tactical-glow", "training-fennec-tactical-base-activate", "training-fennec-tactical-impact-activate"]) {
  assert(css.includes(layeredScanMarker), `Layered Training object scan CSS missing: ${layeredScanMarker}.`);
}
for (const obsoleteRtlMarker of ["training-object-surface-scan-rtl", "training-object-contour-scan-rtl", "training-ball-volume-surface-rtl", "training-ball-volume-contour-rtl", "training-fennec-volume-surface-rtl", "training-fennec-volume-detail-rtl"]) {
  assert(!css.includes(obsoleteRtlMarker), `Obsolete RTL scan CSS must be removed: ${obsoleteRtlMarker}.`);
}
assert(css.includes("opacity: 0.34") && css.includes("opacity: 0.3") && css.includes("mask-position: 130% 50%") && css.includes("mask-position: -30% 50%"), "Surface and contour scans must reveal progressively behind the aligned local line at restrained opacity.");
assert(trainingRadarTargets.includes('angle: "-19deg"') && trainingRadarTargets.includes("durationMs: 380") && trainingGroundedActor.includes("--training-volume-scan-duration") && trainingGroundedActor.includes("--training-volume-contour-delay"), "Each car volume scan must expose its own mask axis and short persistence timing.");
assert(css.includes("calc(90deg + var(--training-object-scan-angle))") && css.includes("var(--training-volume-scan-duration)") && css.includes("var(--training-volume-contour-delay)"), "Directional surface mask and near-immediate contour must share the short volume-scan timing.");
assert(css.includes('[data-volume-scan-phase="active"]') && css.includes('[data-tactical-active="true"]') && !css.includes("data-radar-active"), "Systematic volume reveal and selective tactical activation must use separate CSS state channels.");
assert(css.includes("opacity: 0.3") && css.includes("opacity: 0.09") && css.includes("--training-target-lifetime"), "Selective tactical wireframe and glow must keep their longer restrained lifecycle.");
for (const premiumClass of ["training-fennec-rim-light", "training-lights-glow", "training-fennec-headlight-glow", "training-fennec-rear-accent"]) {
  assert(css.includes(premiumClass), `Premium Fennec treatment missing: ${premiumClass}.`);
}
for (const safeOpacity of ["opacity: 0.32", "opacity: 0.24", "opacity: 0.3", "opacity: 0.09"]) {
  assert(css.includes(safeOpacity), `Safe Training overlay opacity missing: ${safeOpacity}.`);
}
assert(!css.includes("training-fennec-reflection"), "The removed Fennec reflection overlay must not retain dead rendering CSS.");
assert(/\.training-fennec-headlight-glow\s*\{[\s\S]*?opacity:\s*0\.05;[\s\S]*?animation:\s*none;/s.test(css), "The legacy Fennec headlight overlay must remain strongly reduced to avoid doubling the screen glow.");
assert(/\.training-lights-glow\s*\{[\s\S]*?opacity:\s*0\.48;[\s\S]*?mix-blend-mode:\s*screen;[\s\S]*?animation:\s*training-lights-breathe 3\.6s ease-in-out infinite;/s.test(css), "The violet Fennec light asset must breathe visibly as a separate screen layer.");
assert(/@keyframes training-lights-breathe\s*\{[\s\S]*?opacity:\s*0\.48;[\s\S]*?brightness\(0\.86\)[\s\S]*?opacity:\s*0\.76;[\s\S]*?brightness\(1\.12\)/s.test(css), "The separate violet lights must restore the stronger legacy breathing range.");
assert(css.includes("training-ball-volume-surface-ltr") && css.includes("training-ball-volume-contour-ltr"), "The ball volume scan must visibly traverse the ball during the LTR volume pass.");
assert(css.includes("--training-ball-volume-mask-angle: 90deg") && !css.includes('.training-radar-ball-target[data-radar-direction="rtl"]'), "The ball mask must stay permanently oriented for LTR travel.");
assert(/@keyframes training-ball-volume-surface-ltr\s*\{[\s\S]*?mask-position:\s*88% 50%;[\s\S]*?mask-position:\s*12% 50%;/s.test(css), "The LTR ball mask must enter the sphere immediately instead of starting far outside it.");
assert(/\.training-radar-ball-target\[data-tactical-phase="contact"\][\s\S]*?opacity:\s*0\.86;[\s\S]*?brightness\(1\.55\) saturate\(1\.32\)/s.test(css) && /\.training-radar-ball-target\[data-tactical-phase="active"\][\s\S]*?opacity:\s*0\.52;[\s\S]*?brightness\(1\.3\) saturate\(1\.2\)/s.test(css), "The tactical ball must keep a strong contact flash and remain clearly gold while active.");
assert(/\.training-radar-car-target\[data-volume-scan-phase="hold"\][\s\S]*?\.training-radar-object-surface\s*\{[\s\S]*?opacity:\s*0\.22;[\s\S]*?animation:\s*none;[\s\S]*?mask-position:\s*-30% 50%;/s.test(css) && /\.training-radar-car-target\[data-volume-scan-phase="hold"\][\s\S]*?\.training-radar-object-contour\s*\{[\s\S]*?opacity:\s*0\.14;/s.test(css), "Car volume scans must hold their final surface and contour briefly after traversal.");
assert(/\.training-radar-ball-target\[data-volume-scan-phase="hold"\][\s\S]*?\.training-radar-ball-volume-surface\s*\{[\s\S]*?opacity:\s*0\.32;[\s\S]*?animation:\s*none;[\s\S]*?mask-position:\s*12% 50%;/s.test(css) && /\.training-radar-ball-target\[data-volume-scan-phase="hold"\][\s\S]*?\.training-radar-ball-volume-contour\s*\{[\s\S]*?opacity:\s*0\.2;/s.test(css), "Ball volume scans must hold their aligned final frame before fading.");
assert(/@keyframes training-object-surface-scan-ltr\s*\{[\s\S]*?100%\s*\{\s*opacity:\s*0\.22;/s.test(css) && /@keyframes training-object-contour-scan-ltr\s*\{[\s\S]*?100%\s*\{\s*opacity:\s*0\.14;/s.test(css) && /@keyframes training-ball-volume-surface-ltr\s*\{[\s\S]*?100%\s*\{\s*opacity:\s*0\.32;/s.test(css) && /@keyframes training-ball-volume-contour-ltr\s*\{[\s\S]*?100%\s*\{\s*opacity:\s*0\.2;/s.test(css), "Active volume keyframes must end at hold opacity instead of disappearing immediately.");
assert(/\.training-radar-ball-volume-surface\s*\{[\s\S]*?transparent 39\.5%,[\s\S]*?black 47% 53%,[\s\S]*?transparent 60\.5%/s.test(css), "The systematic ball surface scan must expose a readable volumetric window without a full reveal.");
assert(/\.training-radar-ball-volume-contour\s*\{[\s\S]*?transparent 41\.5%,[\s\S]*?black 47\.5% 52\.5%,[\s\S]*?transparent 58\.5%/s.test(css), "The systematic ball contour scan must reinforce the readable moving window without a full reveal.");
assert(!css.includes("black 0 46%") && !css.includes("black 42% 66%"), "The ball volume scan must never reuse a broad full-layer reveal mask.");
assert(css.includes("opacity: 0.68") && css.includes("opacity: 0.58") && css.includes("mask-position: 88% 50%") && css.includes("mask-position: 12% 50%"), "The aligned ball assets must expose a readable directional surface and contour pass.");
assert(/\.training-radar-ball-volume-surface,[\s\S]*?\.training-radar-ball-volume-contour\s*\{[\s\S]*?inset:\s*0;[\s\S]*?width:\s*100% !important;[\s\S]*?height:\s*100% !important;[\s\S]*?object-fit:\s*contain;/s.test(css), "Square ball scan assets must preserve their intrinsic canvas without cover enlargement.");
assert(css.includes("--training-ball-volume-scale-x: 0.4") && css.includes("--training-ball-volume-scale-y: 0.415") && css.includes("--training-ball-volume-scale-x: 0.375") && css.includes("--training-ball-volume-scale-y: 0.385"), "Surface and contour assets must retain their measured scale calibration against the base ball.");
assert(css.includes("--training-ball-volume-translate-x: 0.48%") && css.includes("--training-ball-volume-translate-y: -3.3%") && css.includes("--training-ball-volume-translate-y: -3.15%"), "Ball scan assets must retain their measured center calibration against the base ball.");
assert(!css.includes("width: 8.6%") && !css.includes("translate(-50%, -88%)"), "The obsolete undersized and offset ball fallback must stay removed.");
const ballVolumeKeyframes = css.slice(css.indexOf("@keyframes training-ball-volume-surface-ltr"), css.indexOf("@keyframes training-object-tactical-wireframe"));
assert(!ballVolumeKeyframes.includes("scale(") && !ballVolumeKeyframes.includes("width:"), "The systematic ball volume scan must not resize or displace the ball.");
const tacticalTargetCollection = trainingRadarTargets.slice(trainingRadarTargets.indexOf("export const trainingRadarTargets"), trainingRadarTargets.indexOf("export const trainingFennecVolumeScanTarget"));
assert(!tacticalTargetCollection.includes('id: "fennec"') && trainingRadarTargets.includes('id: "fennec"'), "The Fennec must receive systematic volume scans without joining tactical target selection.");
const fennecScene = trainingScene.slice(trainingScene.indexOf('name="fennec"'), trainingScene.indexOf('name="fennec-lights-glow"'));
const fennecScanCss = css.slice(css.indexOf(".training-radar-fennec-target"), css.indexOf('.scene-group[data-scene-group="fennec-lights-glow"]'));
const fennecSurfaceMaskCss = css.slice(css.indexOf(".training-radar-fennec-surface-mask {"), css.indexOf(".training-radar-fennec-surface-frame {"));
const fennecSurfaceKeyframes = css.slice(css.indexOf("@keyframes training-fennec-volume-surface-ltr"), css.indexOf("@keyframes training-fennec-volume-detail-ltr"));
assert(!fennecScene.includes("training-object-local-scan-line") && !fennecScanCss.includes("::before") && !fennecScanCss.includes("::after"), "The Fennec volume scan must never render a local line or pseudo-line.");
assert(fennecScene.includes('className="training-radar-fennec-surface-mask"') && fennecScene.includes('className="training-radar-fennec-surface-frame"'), "The calibrated Fennec image must be nested inside a separate full-canvas radar mask.");
assert(/\.training-radar-fennec-surface-mask\s*\{[\s\S]*?--training-fennec-surface-mask-angle:\s*90deg;[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;[\s\S]*?width:\s*100%;[\s\S]*?height:\s*100%;[\s\S]*?opacity:\s*0;[\s\S]*?linear-gradient\(\s*var\(--training-fennec-surface-mask-angle\)[\s\S]*?black 0 50%,[\s\S]*?transparent 53%[\s\S]*?mask-size:\s*200% 100%;/s.test(css), "The temporary radar mask must remain full-canvas with one fixed 90-degree orientation.");
assert(!fennecSurfaceMaskCss.includes("--training-fennec-volume-mask-angle"), "The Fennec surface mask must keep its fixed LTR orientation.");
assert(/\.training-radar-fennec-surface-frame\s*\{[\s\S]*?left:\s*15\.8085%;[\s\S]*?top:\s*6\.1722%;[\s\S]*?width:\s*80\.4954%;[\s\S]*?height:\s*88\.9024%;/s.test(css), "The surface frame must preserve the latest main calibration.");
assert(/\.training-radar-fennec-surface\s*\{[\s\S]*?width:\s*100% !important;[\s\S]*?height:\s*100% !important;[\s\S]*?object-fit:\s*fill;[\s\S]*?object-position:\s*center;[\s\S]*?opacity:\s*1;[\s\S]*?brightness\(1\.18\) contrast\(1\.34\) saturate\(1\.2\);[\s\S]*?transition:\s*none;/s.test(css), "The calibrated surface image must preserve its measured non-uniform X/Y frame with object-fit fill.");
assert(!fennecScanCss.includes('url("/ui/training-fennec-base.png")') && !fennecScanCss.includes("mask-composite"), "The base Fennec image must never be reused as a CSS mask for the surface-scan.");
assert(/\.training-radar-fennec-contour\s*\{[\s\S]*?--training-fennec-detail-peak:\s*0\.18;[\s\S]*?--training-fennec-detail-tail:\s*0;[\s\S]*?transparent 44%,[\s\S]*?black 49% 52%,[\s\S]*?transparent 56%/s.test(css), "The Fennec contour must remain a lighter reinforcement behind the surface reveal.");
assert(trainingScene.includes('className="training-radar-fennec-impact-frame"') && /\.training-radar-fennec-impact-frame\s*\{[\s\S]*?left:\s*39\.8085%;[\s\S]*?top:\s*35\.1722%;[\s\S]*?width:\s*56\.4954%;[\s\S]*?height:\s*58%;[\s\S]*?z-index:\s*2;[\s\S]*?pointer-events:\s*none;/s.test(css), "The im-light must preserve the exact calibration currently on main while staying below the surface scan.");
assert(/\.training-radar-fennec-impact\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?inset:\s*0;[\s\S]*?width:\s*100% !important;[\s\S]*?height:\s*100% !important;[\s\S]*?object-fit:\s*fill;[\s\S]*?object-position:\s*center;/s.test(css) && !/\.training-radar-fennec-impact\s*\{[\s\S]*?clip-path:/s.test(fennecScanCss), "The calibrated im-light must fill only its own frame without the obsolete crop.");
assert(/\.training-radar-fennec-surface-mask\s*\{[\s\S]*?z-index:\s*3;/s.test(css) && /\.training-radar-fennec-contour\s*\{[\s\S]*?z-index:\s*4;/s.test(css), "The calibrated im-light must stay below the surface scan and contour.");
assert(/@keyframes training-fennec-volume-surface-ltr\s*\{[\s\S]*?mask-position:\s*var\(--training-fennec-mask-start-position\) 50%;[\s\S]*?mask-position:\s*var\(--training-fennec-mask-end-position\) 50%;/s.test(css) && !fennecSurfaceKeyframes.includes("opacity:"), "The temporary Fennec volume pass must animate only its LTR mask position.");
assert(trainingRadarTargets.includes("getTrainingRadarRangeTiming") && trainingRadarTargets.includes("startProgress: 0.613") && trainingRadarTargets.includes("endProgress: 0.924") && trainingRadarTargets.includes("scanDelayMs: 1783") && trainingRadarSnapshots.includes("getTrainingRadarRangeTiming(target.scanRange)"), "The Fennec volume lifecycle must use its calibrated start delay and exact linear duration across its measured width.");
assert(trainingScene.includes("--training-volume-scan-easing") && trainingScene.includes("--training-fennec-mask-start-position") && trainingDomRadarApplier.includes('volume.phase === "active" ? "reveal" : "hidden"'), "The temporary Fennec surface scan must consume the central LTR range timing from the absolute DOM applier.");
assert(trainingRadarSnapshots.includes('opacity: phase === "hidden" ? 0 : 0.48 * opacityFactor') && trainingDomRadarApplier.includes("`--training-volume-${layer}-opacity`") && trainingDomRadarApplier.includes("`--training-volume-${layer}-mask-position`"), "The Fennec surface scan must reveal then fade from canonical absolute opacity and mask values.");
assert(/data-volume-scan-phase="hold"[\s\S]*?training-radar-fennec-surface-mask[\s\S]*?opacity:\s*0\.48;[\s\S]*?animation:\s*none;[\s\S]*?mask-position:\s*var\(--training-fennec-mask-end-position\) 50%;/s.test(fennecScanCss) && /data-volume-scan-phase="hold"[\s\S]*?training-radar-fennec-contour[\s\S]*?opacity:\s*0\.14;[\s\S]*?animation:\s*none;/s.test(fennecScanCss), "The Fennec volume scan must hold its fully revealed surface and discreet contour before fading.");
assert(trainingScene.includes('className="training-fennec-base-frame"') && trainingScene.includes('className="training-fennec-base"') && trainingDomRadarApplier.includes("--training-fennec-base-opacity") && trainingDomRadarApplier.includes("--training-fennec-impact-opacity"), "The Fennec base and im-light must consume their separate canonical tactical values.");
assert(/\.training-radar-fennec-impact\s*\{[\s\S]*?--training-fennec-detail-peak:\s*0\.3;[\s\S]*?filter:\s*none;/s.test(css), "The im-light must remain readable without diffuse glow.");
assert(/\.training-fennec-base-frame\[data-tactical-active="false"\]\s*\{[\s\S]*?opacity:\s*1;[\s\S]*?animation:\s*none;/s.test(css) && /data-tactical-active="false"[\s\S]*?\.training-radar-fennec-impact\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?animation:\s*none;/s.test(fennecScanCss), "Inactive tactical state must restore the Fennec base and hide im-light immediately.");
assert(/\.training-fennec-base-frame\[data-tactical-active="true"\]\s*\{[\s\S]*?training-fennec-tactical-base-activate 650ms linear both;/s.test(css) && /data-tactical-active="true"[\s\S]*?\.training-radar-fennec-impact\s*\{[\s\S]*?training-fennec-tactical-impact-activate 650ms linear both;[\s\S]*?mask-image:\s*none;/s.test(fennecScanCss) && css.includes("--training-fennec-impact-opacity"), "Legacy fallbacks must remain present while the MasterClock override drives one synchronized Fennec base/im-light flicker.");
assert(/@keyframes training-fennec-tactical-base-activate\s*\{[\s\S]*?0%\s*\{\s*opacity:\s*1;[\s\S]*?100%\s*\{\s*opacity:\s*0\.4;/s.test(css) && /@keyframes training-fennec-tactical-impact-activate\s*\{[\s\S]*?0%\s*\{\s*opacity:\s*0;[\s\S]*?100%\s*\{\s*opacity:\s*0\.6;/s.test(css), "The Fennec tactical activation must settle at base 0.4 and im-light 0.6.");
assert(!css.includes("training-fennec-base-persisted-crossfade") && !css.includes("training-fennec-impact-persisted-crossfade") && !css.includes('data-surface-scan-mode="persisted"') && !css.includes('data-surface-scan-mode="erase"'), "Legacy persisted and RTL erase crossfade controls must be removed.");
assert(!fennecScanCss.includes("blur(") && !fennecScanCss.includes("drop-shadow("), "Fennec volume overlays must stay crisp without diffuse blur or glow spread.");
assert(!fennecScanCss.includes("49.2% 50.8%") && !fennecScanCss.includes("49.5% 50.5%") && !fennecScanCss.includes("49.7% 50.3%"), "Fennec masks must not regress to ultra-thin line cores.");
assert(!trainingScene.includes("fennecReflection") && !trainingRadarTargets.includes("wireframeAsset: assets.fennec") && !trainingRadarTargets.includes("glowAsset: assets.fennec"), "The Fennec volume scan must not restore reflection or tactical target overlays.");
assert(/\.training-fennec-rear-accent\s*\{[\s\S]*?opacity:\s*0\.08;/s.test(css), "Fennec rear accent must remain very subtle.");
assert(css.includes(".training-radar-ball-target::before") && css.includes("display: none"), "The ball must not render the full-canvas contact ring.");
assert(css.includes('.mode-illustration[data-active="false"] .training-particle-core') && css.includes('.mode-illustration[data-motion-active="false"] .training-particle-core::after'), "Inactive and offscreen particle and fragment animations must pause.");
assert(css.includes('.training-scene[data-launching="true"] .training-particle-field') && css.includes("transition: opacity 240ms ease-out"), "Particles must fade and pause during launch.");
assert(css.includes("transparent 44%") && css.includes("rgb(0 0 0 / 0.22) 47%") && css.includes("rgb(0 0 0 / 0.78) 73%") && css.includes("black 100%"), "Radar particles must be hidden at the horizon, readable in the middle and strongest in the foreground.");
assert(css.includes("brightness(2.2)") && css.includes("var(--particle-delay) 1 forwards"), "Radar particles must flash immediately at emission while staying hidden before the scan line arrives.");
assert(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.training-particle-field\s*\{\s*display:\s*none;/s.test(css), "Reduced motion must hide the radar particle trail together with the radar.");

assert(css.includes("@keyframes training-radar-traverse") && !css.includes("@keyframes training-analysis-scan"), "Training must use the clipped field radar instead of legacy circles.");
assert(css.includes("@keyframes training-launch-ball-energy") && css.includes("@keyframes home-training-launch-wave"), "Training launch keyframes must remain untouched.");
assert(css.includes("@keyframes competitive-launch-fennec"), "Competitive prepared launch keyframes must remain.");

for (const legacyPath of legacyHomeFiles) {
  assert(!existsSync(legacyPath), `Legacy home component must be removed: ${legacyPath}`);
}

const forbiddenVisibleWording = [
  "mode verrouille",
  "permis verrouille",
  "top mondial",
  "classement mondial",
  "faux rang",
  "218 sessions",
  "45h",
  "78%",
  "68%",
];
for (const [path, content] of Object.entries(files)) {
  const lower = content.toLowerCase();
  for (const wording of forbiddenVisibleWording) {
    assert(!lower.includes(wording), `Forbidden home wording found in ${path}: ${wording}`);
  }
}

for (const [path, content] of Object.entries(files)) {
  for (const forbidden of ["content.json", "@/lib/questions", "getQuestionSummaries", "getActiveQuestions", "error_tags"]) {
    assert(!content.includes(forbidden), `Home layer must not read pedagogical internals in ${path}: ${forbidden}`);
  }
}

console.log("Home dashboard validation OK");
console.log("Covered states: statistics default, training launch, competitive locked preview, permit 0-100, weekly focus lifecycle, empty insights, targeted sessions locked, up to three real sessions.");
