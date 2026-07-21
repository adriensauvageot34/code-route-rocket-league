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
  "src/components/home/illustrations/CompetitiveScene.tsx",
  "src/components/home/illustrations/SceneGroup.tsx",
  "src/lib/home/homeDashboardViewModel.ts",
  "src/lib/home/getHomeDashboardViewModel.ts",
  "src/lib/home/homeIllustrationAssets.ts",
  "src/lib/home/homeSceneParallax.ts",
  "src/lib/home/homeLaunch.ts",
  "src/lib/home/trainingParticlePresets.ts",
  "src/lib/home/trainingRadarTargets.ts",
  "src/hooks/useParallaxController.ts",
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
const competitiveScene = files["src/components/home/illustrations/CompetitiveScene.tsx"];
const sceneGroup = files["src/components/home/illustrations/SceneGroup.tsx"];
const sceneDepths = files["src/lib/home/homeSceneParallax.ts"];
const homeLaunch = files["src/lib/home/homeLaunch.ts"];
const parallaxController = files["src/hooks/useParallaxController.ts"];
const trainingParticlePresets = files["src/lib/home/trainingParticlePresets.ts"];
const trainingRadarTargets = files["src/lib/home/trainingRadarTargets.ts"];
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

assert(modeIllustration.includes("<TrainingScene active={active} launching={launching} />") && modeIllustration.includes("<CompetitiveScene />"), "One selected scene must render with Training lifecycle state.");
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
for (const radarProp of ["active: boolean", "passKey: number"]) {
  assert(trainingParticleField.includes(radarProp), `Radar particle field missing synchronization prop: ${radarProp}.`);
}
assert(trainingParticleField.includes("TRAINING_RADAR_SWEEP") && trainingParticleField.includes("getTrainingRadarDelayForProgress"), "Particle delays must derive from the same central linear sweep geometry as the radar.");
assert(
  trainingParticleField.includes("getParticleScanDelayMs") &&
    trainingParticleField.includes("getRadarCoreOffset…302 tokens truncated…ed particle trail.");
assert(trainingParticleField.includes("memo(function TrainingParticleSprite"), "Each launched particle must finish without being restarted by later radar updates.");
assert(trainingParticleField.includes("--particle-rise-end") && trainingParticleField.includes("--particle-glow-soft") && trainingParticleField.includes("--particle-fragment-rise-end"), "Particle trail must expose lift, glow decay and disintegration fragments.");
assert(trainingScene.includes("active={running}") && trainingScene.includes("passKey={passKey}") && !trainingScene.includes("direction={passDirection}"), "All particle depths must receive the live LTR radar pass without a direction branch.");
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
assert(trainingRadarSequence.includes('export type TrainingRadarPassMode = "volume" | "tactical"') && trainingRadarSequence.includes('nextPassMode = passMode === "volume" ? "tactical" : "volume"'), "Radar passes must alternate explicitly between volume and tactical modes.");
assert(!trainingRadarSequence.includes('"rtl"') && !trainingRadarSequence.includes("passDirection") && !trainingRadarTargets.includes("TrainingRadarDirection"), "The radar state and timing model must have no RTL branch.");
assert(trainingRadarSequence.includes("for (const volumeTarget of trainingVolumeScanTargets)") && trainingRadarSequence.includes("if (passMode === \"volume\")") && trainingRadarSequence.includes("scheduleVolumePass();"), "The volume pass must scan every configured volume target.");
assert(trainingRadarSequence.includes("for (const target of trainingRadarTargets)") && trainingRadarSequence.includes("scheduleTacticalPass();") && trainingRadarSequence.includes('[target.id]: "active"'), "The tactical pass must cumulatively activate every configured object.");
assert(trainingRadarSequence.includes('passMode === "volume" ? HIDDEN_TACTICAL_PHASES : current.tacticalPhases') && trainingRadarSequence.includes('passMode === "volume" ? false : current.fennecTacticalActive'), "A volume pass must atomically clear all prior tactical activations.");
assert(trainingRadarSequence.includes("volumeScanPhases: HIDDEN_VOLUME_SCAN_PHASES") && !trainingRadarSequence.includes("Math.random"), "Every pass must reset temporary volume scans and never select a random tactical target.");
for (const target of ["left-car", "back-right-car", "front-right-car", "ball", "fennec"]) {
  assert(trainingRadarTargets.includes(`id: "${target}"`), `Missing training radar target: ${target}`);
}
assert(trainingRadarTargets.includes("trainingVolumeScanTargets") && trainingRadarTargets.includes("trainingFennecVolumeScanTarget") && trainingRadarTargets.includes("scanHitProgress: TRAINING_FENNEC_SCAN_PROGRESS"), "The Fennec must join only the systematic volume target collection at its calibrated radar hit.");
for (const timing of ["TRAINING_RADAR_ENTRY_DURATION_MS = 250", "TRAINING_RADAR_TRAVEL_DURATION_MS = 2500", "TRAINING_RADAR_EXIT_DURATION_MS = 200", "TRAINING_RADAR_PAUSE_DURATION_MS = 180", "contactDurationMs: 180", "wireframeDelayMs: 820", "fadeDelayMs: 1500", "targetLifetimeMs: 2300", "fadeDurationMs: 800", "activeDurationMs: 380", "ballActiveDurationMs: 540", "fennecActiveDurationMs: 720", "contourDelayMs: 60", "fadeDurationMs: 210", "leadMs: 120", "totalDurationMs: 610"]) {
  assert(trainingRadarTargets.includes(timing), `Missing centralized radar timing: ${timing}`);
}
assert(!trainingRadarTargets.includes("slowZone") && !trainingRadarTargets.includes("extraDurationMs") && !trainingRadarTargets.includes("smoothTrainingRadarStep"), "Ball and Fennec slow zones must be removed from the central timeline.");
assert(/TRAINING_RADAR_TIMING\.entryDurationMs\s*\+\s*Math\.round\([\s\S]*?clampTrainingRadarProgress\(progress\)\s*\*\s*TRAINING_RADAR_TIMING\.travelDurationMs/s.test(trainingRadarTargets), "Radar target hits must use the linear entry plus progress times travel formula.");
assert(/\(scanRange\.endProgress - scanRange\.startProgress\)\s*\*\s*TRAINING_RADAR_TIMING\.travelDurationMs/s.test(trainingRadarTargets), "Range duration must be linear in endProgress minus startProgress.");
assert(trainingRadarTargets.includes('TRAINING_RADAR_TRAVEL_EASING = "linear"') && trainingRadarOverlay.includes('"--radar-travel-easing": TRAINING_RADAR_TRAVEL_EASING') && css.includes("var(--radar-travel-easing)"), "The visual radar and target scheduling must share one linear timeline.");
assert(trainingRadarTargets.includes("TRAINING_RADAR_EXIT_DURATION_MS") && trainingRadarTargets.includes("TRAINING_RADAR_PAUSE_DURATION_MS") && trainingRadarSequence.includes("TRAINING_RADAR_TIMING.passDurationMs"), "Entry, travel, exit and hidden reset pause must stay centralized.");
assert(trainingRadarSequence.includes('volumeTarget.type === "ball"') && trainingRadarSequence.includes('volumeTarget.type === "fennec"') && trainingGroundedActor.includes("TRAINING_VOLUME_SCAN_TIMING.ballActiveDurationMs") && trainingScene.includes("getTrainingRadarRangeTiming"), "The ball must keep its longer fixed reveal while the Fennec consumes the exact shared radar-range timing.");
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
assert(parallaxController.includes("requestAnimationFrame") && parallaxController.includes("cancelAnimationFrame"), "Parallax must create and cancel its frame.");
assert(
  parallaxController.includes("new ResizeObserver") &&
    parallaxController.includes("entry.contentRect.width") &&
    parallaxController.includes("resizeObserver.disconnect()"),
  "Training safety scale must be calculated at mount and recalculated by ResizeObserver."
);
const parallaxFrameBody =
  parallaxController.match(/function animate\(timestamp: number\)([\s\S]*?)function stopAnimation/)?.[1] ?? "";
assert(
  !parallaxFrameBody.includes("clientWidth") &&
    !parallaxFrameBody.includes("contentRect") &&
    !parallaxFrameBody.includes("getBoundingClientRect"),
  "Parallax animation frames must not measure layout."
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
assert(trainingRadarSequence.includes("tacticalPhases") && !trainingRadarSequence.includes("activeTacticalTargetId") && trainingRadarSequence.includes("...current.tacticalPhases"), "The tactical pass must accumulate activated objects instead of replacing one selected target.");
assert(trainingRadarSequence.includes("volumeScanPhases") && trainingRadarSequence.includes("for (const volumeTarget of trainingVolumeScanTargets)") && trainingRadarSequence.includes("getTrainingRadarHitDelayMs(volumeTarget)"), "The volume pass must schedule hit-synchronous temporary scans for all five 3D objects.");
assert(/setVolumeScan\([\s\S]*?volumeTarget\.id,[\s\S]*?"active",[\s\S]*?volumeTarget\.id === "fennec" \? "reveal"/s.test(trainingRadarSequence) && /setVolumeScan\(volumeTarget\.id, "fade"\)/s.test(trainingRadarSequence) && /setVolumeScan\([\s\S]*?volumeTarget\.id,[\s\S]*?"hidden",[\s\S]*?volumeTarget\.id === "fennec" \? "hidden"/s.test(trainingRadarSequence), "Each volume scan must reveal, fade and return to hidden without persistence.");
assert(trainingRadarSequence.includes("schedule(beginPass, TRAINING_RADAR_TIMING.passDurationMs)"), "Each LTR pass must end with the centralized hidden reset pause before the next mode.");
for (const phaseType of ['TrainingTacticalPhase = "hidden" | "contact" | "active"', 'TrainingVolumeScanPhase = "hidden" | "active" | "fade"', 'TrainingFennecSurfaceMode = "hidden" | "reveal"']) {
  assert(trainingRadarSequence.includes(phaseType), `Separated radar phase model missing: ${phaseType}.`);
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
assert(parallaxController.includes("AUTO_DRIFT_PERIOD_MS = 20000") && parallaxController.includes("-Math.sin(autoAngle)"), "Automatic camera must follow one continuous 20-second center-left-center-right cycle.");
assert(parallaxController.includes('removeEventListener("pointermove"'), "Parallax pointer listener must clean up.");
assert(parallaxController.includes('document.removeEventListener("visibilitychange"'), "Parallax visibility listener must clean up.");
assert(parallaxController.includes("intersectionObserver?.disconnect()"), "Parallax observer must disconnect.");
assert(!parallaxController.includes("useState"), "Parallax must not update React state per frame.");

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
assert(trainingRadarTargets.includes("getTrainingRadarRangeTiming") && trainingRadarTargets.includes("startProgress: 0.613") && trainingRadarTargets.includes("endProgress: 0.924") && trainingRadarSequence.includes("fennecRangeTiming?.startDelayMs") && trainingRadarSequence.includes("fennecRangeTiming?.durationMs"), "The Fennec volume lifecycle must use exact linear timing across its measured width.");
assert(trainingScene.includes("--training-volume-scan-easing") && trainingScene.includes("--training-fennec-mask-start-position") && trainingScene.includes("data-surface-scan-mode={fennecSurfaceMode}"), "The temporary Fennec surface scan must consume the central LTR range timing.");
assert(/data-surface-scan-mode="reveal"[\s\S]*?training-radar-fennec-surface-mask[\s\S]*?opacity:\s*0\.48;[\s\S]*?training-fennec-volume-surface-ltr/s.test(fennecScanCss) && /data-volume-scan-phase="fade"[\s\S]*?training-radar-fennec-surface-mask[\s\S]*?opacity:\s*0;/s.test(fennecScanCss), "The Fennec surface scan must reveal then fade during the volume pass only.");
assert(trainingScene.includes('className="training-fennec-base-frame"') && trainingScene.includes('className="training-fennec-base"') && trainingScene.includes('data-tactical-active={fennecTacticalActive ? "true" : "false"}'), "The Fennec base and im-light must expose the separate tactical state.");
assert(/\.training-radar-fennec-impact\s*\{[\s\S]*?--training-fennec-detail-peak:\s*0\.3;[\s\S]*?filter:\s*none;/s.test(css), "The im-light must remain readable without diffuse glow.");
assert(/\.training-fennec-base-frame\[data-tactical-active="false"\]\s*\{[\s\S]*?opacity:\s*1;[\s\S]*?animation:\s*none;/s.test(css) && /data-tactical-active="false"[\s\S]*?\.training-radar-fennec-impact\s*\{[\s\S]*?opacity:\s*0;[\s\S]*?animation:\s*none;/s.test(fennecScanCss), "Inactive tactical state must restore the Fennec base and hide im-light immediately.");
assert(/\.training-fennec-base-frame\[data-tactical-active="true"\]\s*\{[\s\S]*?training-fennec-tactical-base-activate 650ms linear both;/s.test(css) && /data-tactical-active="true"[\s\S]*?\.training-radar-fennec-impact\s*\{[\s\S]*?training-fennec-tactical-impact-activate 650ms linear both;[\s\S]*?mask-image:\s*none;/s.test(fennecScanCss), "Active tactical state must drive one synchronized Fennec base/im-light flicker.");
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
