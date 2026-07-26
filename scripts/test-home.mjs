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
  "src/lib/home/homeLaunch.ts",
  "src/lib/home/trainingParticlePresets.ts",
  "src/lib/home/trainingParticleTiming.ts",
  "src/lib/home/trainingRadarTargets.ts",
  "src/lib/home/gpu/TrainingGpuRenderer.ts",
  "src/lib/home/gpu/TrainingGpuObjectAssetLoader.ts",
  "src/lib/home/gpu/trainingGpuObjectAssetCatalog.ts",
  "src/lib/home/gpu/trainingGpuObjectManifest.ts",
  "src/lib/home/gpu/trainingGpuBaseUtils.ts",
  "src/lib/home/gpu/trainingGpuObjectPlacement.ts",
  "src/lib/home/gpu/debug/TrainingGpuDebugCollector.ts",
  "src/lib/home/gpu/debug/trainingGpuDebugTypes.ts",
  "src/lib/home/gpu/trainingGpuTacticalShaders.ts",
  "src/lib/home/gpu/trainingGpuTacticalTiming.ts",
  "src/lib/home/gpu/trainingGpuTacticalUtils.ts",
  "src/lib/home/gpu/trainingGpuVolumeUtils.ts",
  "src/hooks/useParallaxController.ts",
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
const homeLaunch = files["src/lib/home/homeLaunch.ts"];
const parallaxController = files["src/hooks/useParallaxController.ts"];
const trainingParticlePresets = files["src/lib/home/trainingParticlePresets.ts"];
const trainingParticleTiming = files["src/lib/home/trainingParticleTiming.ts"];
const trainingRadarTargets = files["src/lib/home/trainingRadarTargets.ts"];
const trainingGpuRenderer = files["src/lib/home/gpu/TrainingGpuRenderer.ts"];
const trainingGpuObjectAssetLoader = files["src/lib/home/gpu/TrainingGpuObjectAssetLoader.ts"];
const trainingGpuObjectAssetCatalog = files["src/lib/home/gpu/trainingGpuObjectAssetCatalog.ts"];
const trainingGpuObjectManifest = files["src/lib/home/gpu/trainingGpuObjectManifest.ts"];
const trainingGpuBaseUtils = files["src/lib/home/gpu/trainingGpuBaseUtils.ts"];
const trainingGpuObjectPlacement = files["src/lib/home/gpu/trainingGpuObjectPlacement.ts"];
const trainingGpuDebugCollector = files["src/lib/home/gpu/debug/TrainingGpuDebugCollector.ts"];
const trainingGpuDebugTypes = files["src/lib/home/gpu/debug/trainingGpuDebugTypes.ts"];
const trainingGpuTacticalTiming = files["src/lib/home/gpu/trainingGpuTacticalTiming.ts"];
const trainingGpuTacticalUtils = files["src/lib/home/gpu/trainingGpuTacticalUtils.ts"];
const trainingRendererDebugHook = files["src/hooks/useTrainingRendererDebug.ts"];
const trainingRendererModeHook = files["src/hooks/useTrainingRendererMode.ts"];
const trainingGpuVolumeUtils = files["src/lib/home/gpu/trainingGpuVolumeUtils.ts"];
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

assert(trainingGpuCanvas.includes("const mountedCanvases = {") && trainingGpuCanvas.includes("} = mountedCanvases;") && trainingGpuCanvas.includes('window.addEventListener("resize", resizeCanvases)') && trainingGpuCanvas.includes('window.removeEventListener("resize", resizeCanvases)'), "GPU canvas refs must be captured before asynchronous initialization and geometry/DPR refresh listeners must be cleaned up.");
assert(trainingGpuRenderer.includes("function getWebGl2Context") && trainingGpuVolumeUtils.includes("function getWebGl2Context"), "All GPU subsystems must retain an explicitly typed WebGL2 context boundary.");
assert(trainingGpuVolumeUtils.includes("if (assets === this.assets) return") && trainingGpuVolumeUtils.includes("this.initializeVolumeSubsystem()") && trainingGpuVolumeUtils.includes("this.initializeBaseSubsystem()") && trainingGpuVolumeUtils.includes("this.initializeTacticalSubsystem()"), "Repeated object asset installation must be idempotent without recreating base, volume or tactical textures.");
assert(trainingGpuVolumeUtils.includes('reportVolumeFailureOnce("initialization failed"') && trainingGpuVolumeUtils.includes('reportVolumeFailureOnce("render failed"') && trainingGpuVolumeUtils.includes('process.env.NODE_ENV === "production"'), "Volume failures must expose one development-only diagnostic without production noise.");
assert(!trainingGpuVolumeUtils.includes("requestAnimationFrame") && !trainingGpuVolumeUtils.includes("setTimeout") && !trainingGpuVolumeUtils.includes("setInterval"), "Object effects must stay on the renderer MasterClock without their own loop or timers.");
assert(!trainingGpuTacticalTiming.includes("requestAnimationFrame") && !trainingGpuTacticalTiming.includes("setTimeout") && !trainingGpuTacticalTiming.includes("setInterval") && trainingGpuTacticalTiming.includes("frameState.passMode") && trainingGpuTacticalTiming.includes("frameState.elapsedMs") && trainingGpuTacticalTiming.includes("target.tacticalDelayMs"), "GPU tactical timing must be an absolute MasterClock snapshot without timers.");
assert(trainingGpuTacticalTiming.includes('"hidden"') && trainingGpuTacticalTiming.includes('"contact"') && trainingGpuTacticalTiming.includes('"active"') && trainingGpuTacticalTiming.includes('"hold"') && trainingGpuTacticalTiming.includes('"fade"') && trainingGpuTacticalTiming.includes("getTrainingGpuTacticalSnapshot"), "Tactical snapshots must cover contact, stable activation, global hold and next-volume fade.");
assert(trainingGpuVolumeUtils.includes("target.contextLost = true") && trainingGpuVolumeUtils.includes("this.setBaseReady(false)") && trainingGpuVolumeUtils.includes("this.setVolumeReady(false)") && trainingGpuVolumeUtils.includes("this.setTacticalReady(false)") && trainingGpuVolumeUtils.includes("this.options.onContextRestored()"), "A shared object context loss must restore all independent DOM fallbacks until current-time rendering succeeds.");
assert(trainingGpuVolumeUtils.includes("cssWidth <= 0") && trainingGpuVolumeUtils.includes("target.viewport = null") && trainingGpuVolumeUtils.includes("if (!this.hasViewports())"), "Zero-sized object canvases must never be reported ready.");
assert(trainingGpuVolumeUtils.includes('removeEventListener(\n        "webglcontextlost"') && trainingGpuVolumeUtils.includes("this.releaseBaseResources();") && trainingGpuVolumeUtils.includes("this.releaseVolumeResources();") && trainingGpuVolumeUtils.includes("this.releaseTacticalResources();"), "Object teardown must release base, volume and tactical resources plus context listeners.");
assert(trainingGpuVolumeUtils.includes("finally {\n    gl.deleteShader(vertexShader);") && trainingGpuTacticalUtils.includes("gl.deleteTexture(texture);") && trainingGpuTacticalUtils.includes("gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);"), "Failed tactical shader and texture creation must release partial GPU resources and restore upload state.");
assert(trainingScene.includes("const showDomBase = !useGpuRenderer || !gpuBasesReady") && trainingScene.includes('data-gpu-bases-ready=') && (trainingScene.match(/showDomBase=\{showDomBase\}/g) ?? []).length === 4 && (trainingGroundedActor.match(/showDomBase \? \(/g) ?? []).length === 2, "The four object bases must switch atomically to their preserved DOM Image fallbacks.");
assert(trainingScene.includes("const showDomVolumeScan = !useGpuRenderer || !gpuVolumeScansReady") && trainingScene.includes('data-gpu-volume-scans-ready='), "The four object volume scans must switch atomically to the DOM fallback.");
assert(trainingScene.includes("const showDomTactical = !useGpuRenderer || !gpuTacticalReady") && trainingScene.includes('data-gpu-tactical-ready=') && trainingGpuCanvas.includes("onTacticalReadyChange"), "Tactical readiness and its four-object DOM fallback must remain independent from volume readiness.");
assert(trainingGroundedActor.includes("showDomTactical") && trainingGroundedActor.includes("target.wireframeAsset.path") && trainingGroundedActor.includes("target.glowA×Í¶òÚ$z{-®éÜj×C²÷2çFW7B†772’Â$6"föÇVÖR66ç2×W7B†öÆBF†V—"f–æÂ7W&f6RæB6öçF÷W"'&–VfÇ’gFW"G&fW'6Ââ"“°¦76W'B‚õÂçG&–æ–ær×&F"Ö&ÆÂ×F&vWEÅ¶FF×föÇVÖR×66â×†6SÒ&†öÆB%ÅÕµÇ5Å5Ò£õÂçG&–æ–ær×&F"Ö&ÆÂ×föÇVÖR×7W&f6UÇ2¥ÇµµÇ5Å5Ò£ö÷6—G“¥Ç2£Âã3#µµÇ5Å5Ò£öæ–ÖF–öã¥Ç2¦æöæSµµÇ5Å5Ò£öÖ6²×÷6—F–öã¥Ç2£"RSS²÷2çFW7B†772’bbõÂçG&–æ–ær×&F"Ö&ÆÂ×F&vWEÅ¶FF×föÇVÖR×66â×†6SÒ&†öÆB%ÅÕµÇ5Å5Ò£õÂçG&–æ–ær×&F"Ö&ÆÂ×föÇVÖRÖ6öçF÷W%Ç2¥ÇµµÇ5Å5Ò£ö÷6—G“¥Ç2£Âã#²÷2çFW7B†772’Â$&ÆÂföÇVÖR66ç2×W7B†öÆBF†V—"Æ–væVBf–æÂg&ÖR&Vf÷&RfF–ærâ"“°¦76W'B‚ô¶W–g&ÖW2G&–æ–ærÖö&¦V7B×7W&f6R×66âÖÇG%Ç2¥ÇµµÇ5Å5Ò£óUÇ2¥ÇµÇ2¦÷6—G“¥Ç2£Âã##²÷2çFW7B†772’bbô¶W–g&ÖW2G&–æ–ærÖö&¦V7BÖ6öçF÷W"×66âÖÇG%Ç2¥ÇµµÇ5Å5Ò£óUÇ2¥ÇµÇ2¦÷6—G“¥Ç2£ÂãC²÷2çFW7B†772’bbô¶W–g&ÖW2G&–æ–ærÖ&ÆÂ×föÇVÖR×7W&f6RÖÇG%Ç2¥ÇµµÇ5Å5Ò£óUÇ2¥ÇµÇ2¦÷6—G“¥Ç2£Âã3#²÷2çFW7B†772’bbô¶W–g&ÖW2G&–æ–ærÖ&ÆÂ×föÇVÖRÖ6öçF÷W"ÖÇG%Ç2¥ÇµµÇ5Å5Ò£óUÇ2¥ÇµÇ2¦÷6—G“¥Ç2£Âã#²÷2çFW7B†772’Â$7F—fRföÇVÖR¶W–g&ÖW2×W7BVæBB†öÆB÷6—G’–ç7FVBöbF—6V&–ær–ÖÖVF–FVÇ’â"“°¦76W'B‚õÂçG&–æ–ær×&F"Ö&ÆÂ×föÇVÖR×7W&f6UÇ2¥ÇµµÇ5Å5Ò£÷G&ç7&VçB3•ÂãRRÅµÇ5Å5Ò£ö&Æ6²CrRS2RÅµÇ5Å5Ò£÷G&ç7&VçBcÂãRR÷2çFW7B†772’Â%F†R7—7FVÖF–2&ÆÂ7W&f6R66â×W7BW‡÷6R&VF&ÆRföÇVÖWG&–2v–æF÷rv—F†÷WBgVÆÂ&WfVÂâ"“°¦76W'B‚õÂçG&–æ–ær×&F"Ö&ÆÂ×föÇVÖRÖ6öçF÷W%Ç2¥ÇµµÇ5Å5Ò£÷G&ç7&VçBCÂãRRÅµÇ5Å5Ò£ö&Æ6²CuÂãRRS%ÂãRRÅµÇ5Å5Ò£÷G&ç7&VçBS…ÂãRR÷2çFW7B†772’Â%F†R7—7FVÖF–2&ÆÂ6öçF÷W"66â×W7B&V–æf÷&6RF†R&VF&ÆRÖ÷f–ærv–æF÷rv—F†÷WBgVÆÂ&WfVÂâ"“°¦76W'B‚772æ–æ6ÇVFW2‚&&Æ6²CbR"’bb772æ–æ6ÇVFW2‚&&Æ6²C"RcbR"’Â%F†R&ÆÂföÇVÖR66â×W7BæWfW"&WW6R'&öBgVÆÂÖÆ–W"&WfVÂÖ6²â"“°¦76W'B†772æ–æ6ÇVFW2‚&÷6—G“¢ãc‚"’bb772æ–æ6ÇVFW2‚&÷6—G“¢ãS‚"’bb772æ–æ6ÇVFW2‚&Ö6²×÷6—F–öã¢ƒ‚RSR"’bb772æ–æ6ÇVFW2‚&Ö6²×÷6—F–öã¢"RSR"’Â%F†RÆ–væVB&ÆÂ76WG2×W7BW‡÷6R&VF&ÆRF—&V7F–öæÂ7W&f6RæB6öçF÷W"72â"“°¦76W'B‚õÂçG&–æ–ær×&F"Ö&ÆÂ×föÇVÖR×7W&f6RÅµÇ5Å5Ò£õÂçG&–æ–ær×&F"Ö&ÆÂ×föÇVÖRÖ6öçF÷W%Ç2¥ÇµµÇ5Å5Ò£ö–ç6WC¥Ç2£µµÇ5Å5Ò£÷v–GFƒ¥Ç2£R–×÷'FçCµµÇ5Å5Ò£ö†V–v‡C¥Ç2£R–×÷'FçCµµÇ5Å5Ò£öö&¦V7BÖf—C¥Ç2¦6öçF–ã²÷2çFW7B†772’Â%7V&R&ÆÂ66â76WG2×W7B&W6W'fRF†V—"–çG&–ç6–26çf2v—F†÷WB6÷fW"VæÆ&vVÖVçBâ"“°¦76W'B†772æ–æ6ÇVFW2‚"Ò×G&–æ–ærÖ&ÆÂ×föÇVÖR×66ÆR×ƒ¢ãB"’bb772æ–æ6ÇVFW2‚"Ò×G&–æ–ærÖ&ÆÂ×föÇVÖR×66ÆR×“¢ãCR"’bb772æ–æ6ÇVFW2‚"Ò×G&–æ–ærÖ&ÆÂ×föÇVÖR×66ÆR×ƒ¢ã3sR"’bb772æ–æ6ÇVFW2‚"Ò×G&–æ–ærÖ&ÆÂ×föÇVÖR×66ÆR×“¢ã3ƒR"’Â%7W&f6RæB6öçF÷W"76WG2×W7B&WF–âF†V—"ÖV7W&VB66ÆR6Æ–'&F–öâv–ç7BF†R&6R&ÆÂâ"“°¦76W'B†772æ–æ6ÇVFW2‚"Ò×G&–æ–ærÖ&ÆÂ×föÇVÖR×G&ç6ÆFR×ƒ¢ãC‚R"’bb772æ–æ6ÇVFW2‚"Ò×G&–æ–ærÖ&ÆÂ×föÇVÖR×G&ç6ÆFR×“¢Ó2ã2R"’bb772æ–æ6ÇVFW2‚"Ò×G&–æ–ærÖ&ÆÂ×föÇVÖR×G&ç6ÆFR×“¢Ó2ãRR"’Â$&ÆÂ66â76WG2×W7B&WF–âF†V—"ÖV7W&VB6VçFW"6Æ–'&F–öâv–ç7BF†R&6R&ÆÂâ"“°¦76W'B‚772æ–æ6ÇVFW2‚'v–GFƒ¢‚ãbR"’bb772æ–æ6ÇVFW2‚'G&ç6ÆFR‚ÓSRÂÓƒ‚R’"’Â%F†Rö'6öÆWFRVæFW'6—¦VBæBöfg6WB&ÆÂfÆÆ&6²×W7B7F’&VÖ÷fVBâ"“°¦6öç7B&ÆÅföÇVÖT¶W–g&ÖW2Ò772ç6Æ–6R†772æ–æFW„öb‚$¶W–g&ÖW2G&–æ–ærÖ&ÆÂ×föÇVÖR×7W&f6RÖÇG""’Â772æ–æFW„öb‚$¶W–g&ÖW2G&–æ–ærÖö&¦V7B×F7F–6Â×v—&Vg&ÖR"’“°¦76W'B‚&ÆÅföÇVÖT¶W–g&ÖW2æ–æ6ÇVFW2‚'66ÆR‚"’bb&ÆÅföÇVÖT¶W–g&ÖW2æ–æ6ÇVFW2‚'v–GFƒ¢"’Â%F†R7—7FVÖF–2&ÆÂföÇVÖR66â×W7Bæ÷B&W6—¦R÷"F—7Æ6RF†R&ÆÂâ"“°¦6öç7BF7F–6ÅF&vWD6öÆÆV7F–öâÒG&–æ–æu&F%F&vWG2ç6Æ–6R‡G&–æ–æu&F%F&vWG2æ–æFW„öb‚&W‡÷'B6öç7BG&–æ–æu&F%F&vWG2"’ÂG&–æ–æu&F%F&vWG2æ–æFW„öb‚&W‡÷'B6öç7BG&–æ–ætfVææV5föÇVÖU66åF&vWB"’“°¦76W'B‚F7F–6ÅF&vWD6öÆÆV7F–öâæ–æ6ÇVFW2‚v–C¢&fVææV2"r’bbG&–æ–æu&F%F&vWG2æ–æ6ÇVFW2‚v–C¢&fVææV2"r’Â%F†RfVææV2×W7B&V6V—fR7—7FVÖF–2föÇVÖR66ç2v—F†÷WB¦ö–æ–ærF7F–6ÂF&vWB6VÆV7F–öââ"“°¦6öç7BfVææV566VæRÒG&–æ–æu66VæRç6Æ–6R‡G&–æ–æu66VæRæ–æFW„öb‚væÖSÒ&fVææV2"r’ÂG&–æ–æu66VæRæ–æFW„öb‚væÖSÒ&fVææV2ÖÆ–v‡G2ÖvÆ÷r"r’“°¦6öç7BfVææV566ä772Ò772ç6Æ–6R†772æ–æFW„öb‚"çG&–æ–ær×&F"ÖfVææV2×F&vWB"’Â772æ–æFW„öb‚rç66VæRÖw&÷W¶FF×66VæRÖw&÷WÒ&fVææV2ÖÆ–v‡G2ÖvÆ÷r%Òr’“°¦6öç7BfVææV57W&f6TÖ6´772Ò772ç6Æ–6R†772æ–æFW„öb‚"çG&–æ–ær×&F"ÖfVææV2×7W&f6RÖÖ6²²"’Â772æ–æFW„öb‚"çG&–æ–ær×&F"ÖfVææV2×7W&f6RÖg&ÖR²"’“°¦6öç7BfVææV57W&f6T¶W–g&ÖW2Ò772ç6Æ–6R†772æ–æFW„öb‚$¶W–g&ÖW2G&–æ–ærÖfVææV2×föÇVÖR×7W&f6RÖÇG""’Â772æ–æFW„öb‚$¶W–g&ÖW2G&–æ–ærÖfVææV2×föÇVÖRÖFWF–ÂÖÇG""’“°¦76W'B‚fVææV566VæRæ–æ6ÇVFW2‚'G&–æ–ærÖö&¦V7BÖÆö6Â×66âÖÆ–æR"’bbfVææV566ä772æ–æ6ÇVFW2‚#£¦&Vf÷&R"’bbfVææV566ä772æ–æ6ÇVFW2‚#£¦gFW""’Â%F†RfVææV2föÇVÖR66â×W7BæWfW"&VæFW"Æö6ÂÆ–æR÷"6WVFòÖÆ–æRâ"“°¦76W'B†fVææV566VæRæ–æ6ÇVFW2‚v6Æ74æÖSÒ'G&–æ–ær×&F"ÖfVææV2×7W&f6RÖÖ6²"r’bbfVææV566VæRæ–æ6ÇVFW2‚v6Æ74æÖSÒ'G&–æ–ær×&F"ÖfVææV2×7W&f6RÖg&ÖR"r’Â%F†R6Æ–'&FVBfVææV2–ÖvR×W7B&RæW7FVB–ç6–FR6W&FRgVÆÂÖ6çf2&F"Ö6²â"“°¦76W'B‚õÂçG&–æ–ær×&F"ÖfVææV2×7W&f6RÖÖ6µÇ2¥ÇµµÇ5Å5Ò£òÒ×G&–æ–ærÖfVææV2×7W&f6RÖÖ6²ÖævÆS¥Ç2£“FVsµµÇ5Å5Ò£÷÷6—F–öã¥Ç2¦'6öÇWFSµµÇ5Å5Ò£ö–ç6WC¥Ç2£µµÇ5Å5Ò£÷v–GFƒ¥Ç2£SµµÇ5Å5Ò£ö†V–v‡C¥Ç2£SµµÇ5Å5Ò£ö÷6—G“¥Ç2£µµÇ5Å5Ò£öÆ–æV"Öw&F–VçEÂ…Ç2§f%Â‚Ò×G&–æ–ærÖfVææV2×7W&f6RÖÖ6²ÖævÆUÂ•µÇ5Å5Ò£ö&Æ6²SRÅµÇ5Å5Ò£÷G&ç7&VçBS2UµÇ5Å5Ò£öÖ6²×6—¦S¥Ç2£#RS²÷2çFW7B†772’Â%F†RFV×÷&'’&F"Ö6²×W7B&VÖ–âgVÆÂÖ6çf2v—F‚öæRf—†VB“ÖFVw&VR÷&–VçFF–öââ"“°¦76W'B‚fVææV57W&f6TÖ6´772æ–æ6ÇVFW2‚"Ò×G&–æ–ærÖfVææV2×föÇVÖRÖÖ6²ÖævÆR"’Â%F†RfVææV27W&f6RÖ6²×W7B¶VW—G2f—†VBÅE"÷&–VçFF–öââ"“°¦76W'B‚õÂçG&–æ–ær×&F"ÖfVææV2×7W&f6RÖg&ÖUÇ2¥ÇµµÇ5Å5Ò£öÆVgC¥Ç2£UÂãƒƒRSµµÇ5Å5Ò£÷F÷¥Ç2£eÂãs#"SµµÇ5Å5Ò£÷v–GFƒ¥Ç2£ƒÂãC“SBSµµÇ5Å5Ò£ö†V–v‡C¥Ç2£ƒ…Âã“#BS²÷2çFW7B†772’Â%F†R7W&f6Rg&ÖR×W7B&W6W'fRF†RÆFW7BÖ–â6Æ–'&F–öââ"“°¦76W'B‚õÂçG&–æ–ær×&F"ÖfVææV2×7W&f6UÇ2¥ÇµµÇ5Å5Ò£÷v–GFƒ¥Ç2£R–×÷'FçCµµÇ5Å5Ò£ö†V–v‡C¥Ç2£R–×÷'FçCµµÇ5Å5Ò£öö&¦V7BÖf—C¥Ç2¦f–ÆÃµµÇ5Å5Ò£öö&¦V7B×÷6—F–öã¥Ç2¦6VçFW#µµÇ5Å5Ò£ö÷6—G“¥Ç2£µµÇ5Å5Ò£ö'&–v‡FæW75ÂƒÂã…Â’6öçG&7EÂƒÂã3EÂ’6GW&FUÂƒÂã%Â“µµÇ5Å5Ò£÷G&ç6—F–öã¥Ç2¦æöæS²÷2çFW7B†772’Â%F†R6Æ–'&FVB7W&f6R–ÖvR×W7B&W6W'fR—G2ÖV7W&VBæöâ×Væ–f÷&Ò‚õ’g&ÖRv—F‚ö&¦V7BÖf—Bf–ÆÂâ"“°¦76W'B‚fVææV566ä772æ–æ6ÇVFW2‚wW&Â‚"÷V’÷G&–æ–ærÖfVææV2Ö&6Rçær"’r’bbfVææV566ä772æ–æ6ÇVFW2‚&Ö6²Ö6ö×÷6—FR"’Â%F†R&6RfVææV2–ÖvR×W7BæWfW"&R&WW6VB2552Ö6²f÷"F†R7W&f6R×66ââ"“°¦76W'B‚õÂçG&–æ–ær×&F"ÖfVææV2Ö6öçF÷W%Ç2¥ÇµµÇ5Å5Ò£òÒ×G&–æ–ærÖfVææV2ÖFWF–Â×V³¥Ç2£ÂãƒµµÇ5Å5Ò£òÒ×G&–æ–ærÖfVææV2ÖFWF–Â×F–Ã¥Ç2£µµÇ5Å5Ò£÷G&ç7&VçBCBRÅµÇ5Å5Ò£ö&Æ6²C’RS"RÅµÇ5Å5Ò£÷G&ç7&VçBSbR÷2çFW7B†772’Â%F†RfVææV26öçF÷W"×W7B&VÖ–âÆ–v‡FW"&V–æf÷&6VÖVçB&V†–æBF†R7W&f6R&WfVÂâ"“°¦76W'B‡G&–æ–æu66VæRæ–æ6ÇVFW2‚v6Æ74æÖSÒ'G&–æ–ær×&F"ÖfVææV2Ö–×7BÖg&ÖR"r’bbõÂçG&–æ–ær×&F"ÖfVææV2Ö–×7BÖg&ÖUÇ2¥ÇµµÇ5Å5Ò£öÆVgC¥Ç2£3•ÂãƒƒRSµµÇ5Å5Ò£÷F÷¥Ç2£3UÂãs#"SµµÇ5Å5Ò£÷v–GFƒ¥Ç2£SeÂãC“SBSµµÇ5Å5Ò£ö†V–v‡C¥Ç2£S‚SµµÇ5Å5Ò£÷¢Ö–æFWƒ¥Ç2£#µµÇ5Å5Ò£÷ö–çFW"ÖWfVçG3¥Ç2¦æöæS²÷2çFW7B†772’Â%F†R–ÒÖÆ–v‡B×W7B&W6W'fRF†RW†7B6Æ–'&F–öâ7W'&VçFÇ’öâÖ–âv†–ÆR7F––ær&VÆ÷rF†R7W&f6R66ââ"“°¦76W'B‚õÂçG&–æ–ær×&F"ÖfVææV2Ö–×7EÇ2¥ÇµµÇ5Å5Ò£÷÷6—F–öã¥Ç2¦'6öÇWFSµµÇ5Å5Ò£ö–ç6WC¥Ç2£µµÇ5Å5Ò£÷v–GFƒ¥Ç2£R–×÷'FçCµµÇ5Å5Ò£ö†V–v‡C¥Ç2£R–×÷'FçCµµÇ5Å5Ò£öö&¦V7BÖf—C¥Ç2¦f–ÆÃµµÇ5Å5Ò£öö&¦V7B×÷6—F–öã¥Ç2¦6VçFW#²÷2çFW7B†772’bbõÂçG&–æ–ær×&F"ÖfVææV2Ö–×7EÇ2¥ÇµµÇ5Å5Ò£ö6Æ—×Fƒ¢÷2çFW7B†fVææV566ä772’Â%F†R6Æ–'&FVB–ÒÖÆ–v‡B×W7Bf–ÆÂöæÇ’—G2÷vâg&ÖRv—F†÷WBF†Rö'6öÆWFR7&÷â"“°¦76W'B‚õÂçG&–æ–ær×&F"ÖfVææV2×7W&f6RÖÖ6µÇ2¥ÇµµÇ5Å5Ò£÷¢Ö–æFWƒ¥Ç2£3²÷2çFW7B†772’bbõÂçG&–æ–ær×&F"ÖfVææV2Ö6öçF÷W%Ç2¥ÇµµÇ5Å5Ò£÷¢Ö–æFWƒ¥Ç2£C²÷2çFW7B†772’Â%F†R6Æ–'&FVB–ÒÖÆ–v‡B×W7B7F’&VÆ÷rF†R7W&f6R66âæB6öçF÷W"â"“°¦76W'B‚ô¶W–g&ÖW2G&–æ–ærÖfVææV2×föÇVÖR×7W&f6RÖÇG%Ç2¥ÇµµÇ5Å5Ò£öÖ6²×÷6—F–öã¥Ç2§f%Â‚Ò×G&–æ–ærÖfVææV2ÖÖ6²×7F'B×÷6—F–öåÂ’SSµµÇ5Å5Ò£öÖ6²×÷6—F–öã¥Ç2§f%Â‚Ò×G&–æ–ærÖfVææV2ÖÖ6²ÖVæB×÷6—F–öåÂ’SS²÷2çFW7B†772’bbfVææV57W&f6T¶W–g&ÖW2æ–æ6ÇVFW2‚&÷6—G“¢"’Â%F†RFV×÷&'’fVææV2föÇVÖR72×W7Bæ–ÖFRöæÇ’—G2ÅE"Ö6²÷6—F–öââ"“°¦76W'B‡G&–æ–æu&F%F&vWG2æ–æ6ÇVFW2‚&vWEG&–æ–æu&F%&ævUF–Ö–ær"’bbG&–æ–æu&F%F&vWG2æ–æ6ÇVFW2‚'7F'E&öw&W73¢ãc2"’bbG&–æ–æu&F%F&vWG2æ–æ6ÇVFW2‚&VæE&öw&W73¢ã“#B"’bbG&–æ–æu&F%F&vWG2æ–æ6ÇVFW2‚'66äFVÆ”×3¢sƒ2"’bbG&–æ–æu&F%6WVVæ6Ræ–æ6ÇVFW2‚&fVææV5&ævUF–Ö–æsòæGW&F–öä×2"’Â%F†RfVææV2föÇVÖRÆ–fV7–6ÆR×W7BW6R—G26Æ–'&FVB7F'BFVÆ’æBW†7BÆ–æV"GW&F–öâ7&÷72—G2ÖV7W&VBv–GF‚â"“°¦76W'B‡G&–æ–æu66VæRæ–æ6ÇVFW2‚"Ò×G&–æ–ær×föÇVÖR×66âÖV6–ær"’bbG&–æ–æu66VæRæ–æ6ÇVFW2‚"Ò×G&–æ–ærÖfVææV2ÖÖ6²×7F'B×÷6—F–öâ"’bbG&–æ–æu66VæRæ–æ6ÇVFW2‚&FF×7W&f6R×66âÖÖöFS×¶fVææV57W&f6TÖöFWÒ"’Â%F†RFV×÷&'’fVææV27W&f6R66â×W7B6öç7VÖRF†R6VçG&ÂÅE"&ævRF–Ö–ærâ"“°¦76W'B‚öFF×7W&f6R×66âÖÖöFSÒ'&WfVÂ%µÇ5Å5Ò£÷G&–æ–ær×&F"ÖfVææV2×7W&f6RÖÖ6µµÇ5Å5Ò£ö÷6—G“¥Ç2£ÂãCƒµµÇ5Å5Ò£÷G&–æ–ærÖfVææV2×föÇVÖR×7W&f6RÖÇG"÷2çFW7B†fVææV566ä772’bböFF×föÇVÖR×66â×†6SÒ&fFR%µÇ5Å5Ò£÷G&–æ–ær×&F"ÖfVææV2×7W&f6RÖÖ6µµÇ5Å5Ò£ö÷6—G“¥Ç2£²÷2çFW7B†fVææV566ä772’Â%F†RfVææV27W&f6R66â×W7B&WfVÂF†VâfFRGW&–ærF†RföÇVÖR72öæÇ’â"“°¦76W'B‚öFF×föÇVÖR×66â×†6SÒ&†öÆB%µÇ5Å5Ò£÷G&–æ–ær×&F"ÖfVææV2×7W&f6RÖÖ6µµÇ5Å5Ò£ö÷6—G“¥Ç2£ÂãCƒµµÇ5Å5Ò£öæ–ÖF–öã¥Ç2¦æöæSµµÇ5Å5Ò£öÖ6²×÷6—F–öã¥Ç2§f%Â‚Ò×G&–æ–ærÖfVææV2ÖÖ6²ÖVæB×÷6—F–öåÂ’SS²÷2çFW7B†fVææV566ä772’bböFF×föÇVÖR×66â×†6SÒ&†öÆB%µÇ5Å5Ò£÷G&–æ–ær×&F"ÖfVææV2Ö6öçF÷W%µÇ5Å5Ò£ö÷6—G“¥Ç2£ÂãCµµÇ5Å5Ò£öæ–ÖF–öã¥Ç2¦æöæS²÷2çFW7B†fVææV566ä772’Â%F†RfVææV2föÇVÖR66â×W7B†öÆB—G2gVÆÇ’&WfVÆVB7W&f6RæBF—67&VWB6öçF÷W"&Vf÷&RfF–ærâ"“°¦76W'B‡G&–æ–æu66VæRæ–æ6ÇVFW2‚v6Æ74æÖSÒ'G&–æ–ærÖfVææV2Ö&6RÖg&ÖR"r’bbG&–æ–æu66VæRæ–æ6ÇVFW2‚v6Æ74æÖSÒ'G&–æ–ærÖfVææV2Ö&6R"r’bbG&–æ–æu66VæRæ–æ6ÇVFW2‚vFF×F7F–6ÂÖ7F—fS×¶fVææV5F7F–6Ä7F—fRò'G'VR"¢&fÇ6R'Òr’Â%F†RfVææV2&6RæB–ÒÖÆ–v‡B×W7BW‡÷6RF†R6W&FRF7F–6Â7FFRâ"“°¦76W'B‚õÂçG&–æ–ær×&F"ÖfVææV2Ö–×7EÇ2¥ÇµµÇ5Å5Ò£òÒ×G&–æ–ærÖfVææV2ÖFWF–Â×V³¥Ç2£Âã3µµÇ5Å5Ò£öf–ÇFW#¥Ç2¦æöæS²÷2çFW7B†772’Â%F†R–ÒÖÆ–v‡B×W7B&VÖ–â&VF&ÆRv—F†÷WBF–fgW6RvÆ÷râ"“°¦76W'B‚õÂçG&–æ–ærÖfVææV2Ö&6RÖg&ÖUÅ¶FF×F7F–6ÂÖ7F—fSÒ&fÇ6R%ÅÕÇ2¥ÇµµÇ5Å5Ò£ö÷6—G“¥Ç2£µµÇ5Å5Ò£öæ–ÖF–öã¥Ç2¦æöæS²÷2çFW7B†772’bböFF×F7F–6ÂÖ7F—fSÒ&fÇ6R%µÇ5Å5Ò£õÂçG&–æ–ær×&F"ÖfVææV2Ö–×7EÇ2¥ÇµµÇ5Å5Ò£ö÷6—G“¥Ç2£µµÇ5Å5Ò£öæ–ÖF–öã¥Ç2¦æöæS²÷2çFW7B†fVææV566ä772’Â$–æ7F—fRF7F–6Â7FFR×W7B&W7F÷&RF†RfVææV2&6RæB†–FR–ÒÖÆ–v‡B–ÖÖVF–FVÇ’â"“°¦76W'B‚õÂçG&–æ–ærÖfVææV2Ö&6RÖg&ÖUÅ¶FF×F7F–6ÂÖ7F—fSÒ'G'VR%ÅÕÇ2¥ÇµµÇ5Å5Ò£÷G&–æ–ærÖfVææV2×F7F–6ÂÖ&6RÖ7F—fFRcS×2Æ–æV"&÷Fƒ²÷2çFW7B†772’bböFF×F7F–6ÂÖ7F—fSÒ'G'VR%µÇ5Å5Ò£õÂçG&–æ–ær×&F"ÖfVææV2Ö–×7EÇ2¥ÇµµÇ5Å5Ò£÷G&–æ–ærÖfVææV2×F7F–6ÂÖ–×7BÖ7F—fFRcS×2Æ–æV"&÷FƒµµÇ5Å5Ò£öÖ6²Ö–ÖvS¥Ç2¦æöæS²÷2çFW7B†fVææV566ä772’Â$7F—fRF7F–6Â7FFR×W7BG&—fRöæR7–æ6‡&öæ—¦VBfVææV2&6Rö–ÒÖÆ–v‡BfÆ–6¶W"â"“°¦76W'B‚ô¶W–g&ÖW2G&–æ–ærÖfVææV2×F7F–6ÂÖ&6RÖ7F—fFUÇ2¥ÇµµÇ5Å5Ò£óUÇ2¥ÇµÇ2¦÷6—G“¥Ç2£µµÇ5Å5Ò£óUÇ2¥ÇµÇ2¦÷6—G“¥Ç2£ÂãC²÷2çFW7B†772’bbô¶W–g&ÖW2G&–æ–ærÖfVææV2×F7F–6ÂÖ–×7BÖ7F—fFUÇ2¥ÇµµÇ5Å5Ò£óUÇ2¥ÇµÇ2¦÷6—G“¥Ç2£µµÇ5Å5Ò£óUÇ2¥ÇµÇ2¦÷6—G“¥Ç2£Âãc²÷2çFW7B†772’Â%F†RfVææV2F7F–6Â7F—fF–öâ×W7B6WGFÆRB&6RãBæB–ÒÖÆ–v‡Bãbâ"“°¦76W'B‚772æ–æ6ÇVFW2‚'G&–æ–ærÖfVææV2Ö&6R×W'6—7FVBÖ7&÷76fFR"’bb772æ–æ6ÇVFW2‚'G&–æ–ærÖfVææV2Ö–×7B×W'6—7FVBÖ7&÷76fFR"’bb772æ–æ6ÇVFW2‚vFF×7W&f6R×66âÖÖöFSÒ'W'6—7FVB"r’bb772æ–æ6ÇVFW2‚vFF×7W&f6R×66âÖÖöFSÒ&W&6R"r’Â$ÆVv7’W'6—7FVBæB%DÂW&6R7&÷76fFR6öçG&öÇ2×W7B&R&VÖ÷fVBâ"“°¦76W'B‚fVææV566ä772æ–æ6ÇVFW2‚&&ÇW"‚"’bbfVææV566ä772æ–æ6ÇVFW2‚&G&÷×6†F÷r‚"’Â$fVææV2föÇVÖR÷fW&Æ—2×W7B7F’7&—7v—F†÷WBF–fgW6R&ÇW"÷"vÆ÷r7&VBâ"“°¦76W'B‚fVææV566ä772æ–æ6ÇVFW2‚#C’ã"RSã‚R"’bbfVææV566ä772æ–æ6ÇVFW2‚#C’ãRRSãRR"’bbfVææV566ä772æ–æ6ÇVFW2‚#C’ãrRSã2R"’Â$fVææV2Ö6·2×W7Bæ÷B&Vw&W72FòVÇG&×F†–âÆ–æR6÷&W2â"“°¦76W'B‚G&–æ–æu66VæRæ–æ6ÇVFW2‚&fVææV5&VfÆV7F–öâ"’bbG&–æ–æu&F%F&vWG2æ–æ6ÇVFW2‚'v—&Vg&ÖT76WC¢76WG2æfVææV2"’bbG&–æ–æu&F%F&vWG2æ–æ6ÇVFW2‚&vÆ÷t76WC¢76WG2æfVææV2"’Â%F†RfVææV2föÇVÖR66â×W7Bæ÷B&W7F÷&R&VfÆV7F–öâ÷"F7F–6ÂF&vWB÷fW&Æ—2â"“°¦76W'B‚õÂçG&–æ–ærÖfVææV2×&V"Ö66VçEÇ2¥ÇµµÇ5Å5Ò£ö÷6—G“¥Ç2£Âãƒ²÷2çFW7B†772’Â$fVææV2&V"66VçB×W7B&VÖ–âfW'’7V'FÆRâ"“°¦76W'B†772æ–æ6ÇVFW2‚"çG&–æ–ær×&F"Ö&ÆÂ×F&vWC£¦&Vf÷&R"’bb772æ–æ6ÇVFW2‚&F—7Æ“¢æöæR"’Â%F†R&ÆÂ×W7Bæ÷B&VæFW"F†RgVÆÂÖ6çf26öçF7B&–ærâ"“°¦76W'B†772æ–æ6ÇVFW2‚ræÖöFRÖ–ÆÇW7G&F–öå¶FFÖ7F—fSÒ&fÇ6R%ÒçG&–æ–ær×'F–6ÆRÖ6÷&Rr’bb772æ–æ6ÇVFW2‚ræÖöFRÖ–ÆÇW7G&F–öå¶FFÖÖ÷F–öâÖ7F—fSÒ&fÇ6R%ÒçG&–æ–ær×'F–6ÆRÖ6÷&S£¦gFW"r’Â$–æ7F—fRæBöfg67&VVâ'F–6ÆRæBg&vÖVçBæ–ÖF–öç2×W7BW6Râ"“°¦76W'B†772æ–æ6ÇVFW2‚rçG&–æ–ær×66VæU¶FFÖÆVæ6†–æsÒ'G'VR%ÒçG&–æ–ær×'F–6ÆRÖf–VÆBr’bb772æ–æ6ÇVFW2‚'G&ç6—F–öã¢÷6—G’#C×2V6RÖ÷WB"’Â%'F–6ÆW2×W7BfFRæBW6RGW&–ærÆVæ6‚â"“°¦76W'B†772æ–æ6ÇVFW2‚'G&ç7&VçBCBR"’bb772æ–æ6ÇVFW2‚'&v"ƒòã#"’CrR"’bb772æ–æ6ÇVFW2‚'&v"ƒòãs‚’s2R"’bb772æ–æ6ÇVFW2‚&&Æ6²R"’Â%&F"'F–6ÆW2×W7B&R†–FFVâBF†R†÷&—¦öâÂ&VF&ÆR–âF†RÖ–FFÆRæB7G&öævW7B–âF†Rf÷&Vw&÷VæBâ"“°¦76W'B†772æ–æ6ÇVFW2‚&'&–v‡FæW72ƒ"ã"’"’bb772æ–æ6ÇVFW2‚'f"‚Ò×'F–6ÆRÖFVÆ’’f÷'v&G2"’Â%&F"'F–6ÆW2×W7BfÆ6‚–ÖÖVF–FVÇ’BVÖ—76–öâv†–ÆR7F––ær†–FFVâ&Vf÷&RF†R66âÆ–æR'&—fW2â"“°¦76W'B‚ôÖVF–Â‡&VfW'2×&VGV6VBÖÖ÷F–öã¢&VGV6UÂ•µÇ5Å5Ò£õÂçG&–æ–ær×'F–6ÆRÖf–VÆEÇ2¥ÇµÇ2¦F—7Æ“¥Ç2¦æöæS²÷2çFW7B†772’Â%&VGV6VBÖ÷F–öâ×W7B†–FRF†R&F"'F–6ÆRG&–ÂFövWF†W"v—F‚F†R&F"â"“° ¦76W'B†772æ–æ6ÇVFW2‚$¶W–g&ÖW2G&–æ–ær×&F"×G&fW'6R"’bb772æ–æ6ÇVFW2‚$¶W–g&ÖW2G&–æ–ærÖæÇ—6—2×66â"’Â%G&–æ–ær×W7BW6RF†R6Æ—VBf–VÆB&F"–ç7FVBöbÆVv7’6—&6ÆW2â"“°¦76W'B†772æ–æ6ÇVFW2‚$¶W–g&ÖW2G&–æ–ærÖÆVæ6‚Ö&ÆÂÖVæW&w’"’bb772æ–æ6ÇVFW2‚$¶W–g&ÖW2†öÖR×G&–æ–ærÖÆVæ6‚×vfR"’Â%G&–æ–ærÆVæ6‚¶W–g&ÖW2×W7B&VÖ–âVçF÷V6†VBâ"“°¦76W'B†772æ–æ6ÇVFW2‚$¶W–g&ÖW26ö×WF—F—fRÖÆVæ6‚ÖfVææV2"’Â$6ö×WF—F—fR&W&VBÆVæ6‚¶W–g&ÖW2×W7B&VÖ–ââ"“° ¦f÷"†6öç7BÆVv7•F‚öbÆVv7”†öÖTf–ÆW2’°¢76W'B‚W†—7G57–æ2†ÆVv7•F‚’ÂÆVv7’†öÖR6ö×öæVçB×W7B&R&VÖ÷fVC¢G¶ÆVv7•F‡Ö“°§Ð ¦6öç7Bf÷&&–FFVåf—6–&ÆUv÷&F–ærÒ°¢&ÖöFRfW'&÷V–ÆÆR"À¢'W&Ö—2fW'&÷V–ÆÆR"À¢'F÷ÖöæF–Â"À¢&6Æ76VÖVçBÖöæF–Â"À¢&fW‚&ær"À¢##‚6W76–öç2"À¢#CV‚"À¢#s‚R"À¢#c‚R"À¥Ó°¦f÷"†6öç7B·F‚Â6öçFVçEÒöbö&¦V7BæVçG&–W2†f–ÆW2’’°¢6öç7BÆ÷vW"Ò6öçFVçBçFôÆ÷vW$66R‚“°¢f÷"†6öç7Bv÷&F–æröbf÷&&–FFVåf—6–&ÆUv÷&F–ær’°¢76W'B‚Æ÷vW"æ–æ6ÇVFW2‡v÷&F–ær’Âf÷&&–FFVâ†öÖRv÷&F–ærf÷VæB–âG·F‡Ó¢G·v÷&F–æwÖ“°¢Ð§Ð ¦f÷"†6öç7B·F‚Â6öçFVçEÒöbö&¦V7BæVçG&–W2†f–ÆW2’’°¢f÷"†6öç7Bf÷&&–FFVâöb²&6öçFVçBæ§6öâ"Â$öÆ–"÷VW7F–öç2"Â&vWEVW7F–öå7VÖÖ&–W2"Â&vWD7F—fUVW7F–öç2"Â&W'&÷%÷Fw2%Ò’°¢76W'B‚6öçFVçBæ–æ6ÇVFW2†f÷&&–FFVâ’Â†öÖRÆ–W"×W7Bæ÷B&VBVFvöv–6Â–çFW&æÇ2–âG·F‡Ó¢G¶f÷&&–FFVçÖ“°¢Ð§Ð ¦6öç6öÆRæÆör‚$†öÖRF6†&ö&BfÆ–FF–öâô²"“°¦6öç6öÆRæÆör‚$6÷fW&VB7FFW3¢7FF—7F–72FVfVÇBÂG&–æ–ærÆVæ6‚Â6ö×WF—F—fRÆö6¶VB&Wf–WrÂW&Ö—BÓÂvVV¶Ç’fö7W2Æ–fV7–6ÆRÂV×G’–ç6–v‡G2ÂF&vWFVB6W76–öç2Æö6¶VBÂWFòF‡&VR&VÂ6W76–öç2â"“° 