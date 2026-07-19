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
assert(trainingScene.includes('name="ball"') && trainingScene.includes('name="fennec"'), "Training ball and Fennec groups must remain.");
for (const premiumFennecLayer of ["fennecReflection", "fennecHeadlightGlow", "fennecRearAccent"]) {
  assert(trainingScene.includes(`assets.${premiumFennecLayer}`), `Missing permanent premium Fennec layer: ${premiumFennecLayer}.`);
}
assert(!trainingScene.includes("assets.fennecRimLight") && !trainingScene.includes("fennecSurfaceScan") && !trainingScene.includes("fennecContourScan"), "Unsafe Fennec scan and rim overlays must stay disabled in the scene.");
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
for (const radarProp of ["active: boolean", "direction: TrainingRadarDirection", "passKey: number"]) {
  assert(trainingParticleField.includes(radarProp), `Radar particle field missing synchronization prop: ${radarProp}.`);
}
assert(trainingParticleField.includes("TRAINING_RADAR_SWEEP") && trainingParticleField.includes("TRAINING_RADAR_TIMING"), "Particle delays must derive from the same sweep geometry and timing as the radar.");
assert(
  trainingParticleField.includes("getParticleScanDelayMs") &&
    trainingParticleField.includes("getRadarCoreOffsetX") &&
    trainingParticleField.includes("Math.round(scanHitMs)"),
  "Particles must start exactly on the slanted radar core without an appearance delay.",
);
assert(trainingParticleField.includes("Math.max(") && trainingParticleField.includes("TRAINING_RADAR_CORE_BOTTOM_X"), "Particle timing must clamp safely and follow the radar perspective from horizon to foreground.");
assert(trainingParticleField.includes('direction === "ltr"') && trainingParticleField.includes("TRAINING_RADAR_SWEEP.endX - logicalX"), "Particle delay must reverse with the radar direction.");
assert(trainingParticleField.includes('const trailDirection = direction === "ltr" ? -1 : 1') && trainingParticleField.includes("directionalDriftX"), "Particles must drift behind the radar in the direction opposite its travel.");
assert(trainingParticleField.includes("displayedPasses") && !trainingParticleField.includes("setTimeout"), "The current particle pass must render in the same commit as the radar instead of one task later.");
assert(trainingParticleField.includes(".slice(-2)"), "The previous radar pass must remain long enough to finish disintegrating.");
assert(trainingParticleField.includes("memo(function TrainingParticleField"), "Unrelated radar target phases must not restart the delayed particle trail.");
assert(trainingParticleField.includes("memo(function TrainingParticleSprite"), "Each launched particle must finish without being restarted by later radar updates.");
assert(trainingParticleField.includes("--particle-rise-end") && trainingParticleField.includes("--particle-glow-soft") && trainingParticleField.includes("--particle-fragment-rise-end"), "Particle trail must expose lift, glow decay and disintegration fragments.");
assert(trainingScene.includes("active={running}") && trainingScene.includes("direction={passDirection}") && trainingScene.includes("passKey={passKey}"), "All particle depths must receive the live radar pass.");
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
].map((marker) => trainingScene.indexOf(marker));
assert(trainingParticleOrder.every((position, index) => index === 0 || position > trainingParticleOrder[index - 1]), "Particle groups must keep their intended actor occlusion order.");
assert(trainingScene.includes('data-launching={launching ? "true" : "false"}'), "Training particle lifecycle must receive launch state.");
assert(trainingGroundedActor.includes("training-grounded-actor-base") && trainingGroundedActor.includes("training-contact-shadow"), "Grounded actors must share one transformed base and contact shadow.");
assert(trainingGroundedActor.includes("training-radar-car-surface") && trainingGroundedActor.includes("training-radar-car-contour") && trainingGroundedActor.includes("training-radar-car-wireframe") && trainingGroundedActor.includes("training-radar-car-glow"), "Cars must layer surface, contour, wireframe and glow inside their grounded container.");
assert(trainingRadarTargets.includes('TRAINING_OBJECT_SCAN_TARGET_ID = "front-right-car"') && trainingGroundedActor.includes("target.id === TRAINING_OBJECT_SCAN_TARGET_ID"), "Object scan V1 must remain limited to the front-right car-03 target.");
assert(trainingGroundedActor.includes('data-object-scan-v1="true"') && trainingGroundedActor.includes('data-radar-active={phase === "hidden" ? "false" : "true"}'), "Object scan V1 must expose one uninterrupted local lifecycle from contact through fade.");
assert(trainingGroundedActor.includes("training-ball-contact-shadow") && trainingGroundedActor.includes("training-radar-ball-energy"), "Ball energy and contact treatment must share the grounded ball container.");
assert(!trainingGroundedActor.includes("training-radar-ball-surface") && !trainingGroundedActor.includes("training-radar-ball-contour"), "Unaligned ball surface and contour scans must remain disabled.");
assert(trainingRadarOverlay.includes('viewBox="0 0 1672 941"') && trainingRadarOverlay.includes("TRAINING_RADAR_FIELD_PATH"), "Training radar must share and clip to the logical field canvas.");
assert(trainingRadarOverlay.includes("data-radar-direction") && trainingScene.includes("direction={passDirection}"), "Training radar direction must drive both reveal layers.");
assert(trainingRadarOverlay.includes('id="training-radar-field-surface-mask"') && trainingRadarOverlay.includes('id="training-radar-field-sweep-mask"'), "Every radar layer must use a field surface mask.");
assert(trainingRadarTargets.includes("TRAINING_OBJECT_SCAN_OCCLUSION") && trainingRadarOverlay.match(/training-radar-object-notch/g)?.length === 2, "Surface and sweep radar masks must share one car-03 occlusion zone.");
assert(trainingRadarTargets.includes("width: 300") && trainingRadarTargets.includes("height: 170") && trainingRadarOverlay.match(/<rect\s+[\s\S]*?className="training-radar-object-notch"/g)?.length === 2, "Surface and sweep radar masks must use one wide, readable car-03 interruption capsule.");
assert(trainingRadarOverlay.includes("training-radar-surface-notch-soften") && trainingRadarOverlay.includes("training-radar-sweep-notch-soften") && trainingRadarOverlay.includes('stdDeviation="2"'), "The global radar interruption must keep crisp, lightly feathered edges.");
assert(trainingScene.includes('objectTransferPhase === "contact"') && trainingScene.includes('objectTransferPhase === "surface"') && trainingScene.includes('objectTransferPhase === "contour"') && trainingScene.match(/objectTransferActive={objectTransferActive}/g)?.length === 2, "Both global radar layers must open their notch only during the car-03 transfer phases.");
assert(!trainingRadarOverlay.includes('clipPath="url(#training-radar-field') && trainingRadarOverlay.includes('M -286 340 L 2 340'), "Training scan must keep the broad legacy reveal zone behind its strict field mask.");
assert(trainingRadarOverlay.includes('stopColor="black"') && trainingRadarOverlay.includes('offset="0.04" stopColor="#707070"') && trainingRadarOverlay.includes('offset="0.6" stopColor="#e8e8e8"'), "Training radar depth must stay weak at the horizon but remain readable through the car zone.");
assert(trainingRadarTargets.includes('"M 0 414 C 360 423') && trainingScene.indexOf('name="training-radar-sweep"') < trainingScene.indexOf('name="training-barrier"'), "The radar must be tightly masked to the visible pitch below the stable barrier.");
assert(trainingRadarOverlay.includes('mix-blend-mode') === false && css.includes("mix-blend-mode: screen"), "Black tactical terrain must be screen blended in CSS.");
assert(trainingRadarSequence.includes("document.visibilityState") && trainingRadarSequence.includes("IntersectionObserver") && trainingRadarSequence.includes("prefers-reduced-motion"), "Radar lifecycle must follow page, illustration, and motion visibility.");
assert(!trainingRadarSequence.includes("requestAnimationFrame"), "Radar must not create a per-frame React loop.");
assert(trainingRadarSequence.includes('targetIndex % 2 === 0 ? "ltr" : "rtl"') && trainingRadarSequence.includes("getTrainingRadarHitDelayMs(target, passDirection)"), "Radar passes must alternate direction and keep target hits synchronized.");
for (const target of ["left-car", "back-right-car", "front-right-car", "ball"]) {
  assert(trainingRadarTargets.includes(`id: "${target}"`), `Missing training radar target: ${target}`);
}
for (const timing of ["passDurationMs: 2400", "travelDurationMs: 2000", "contactDurationMs: 180", "surfaceDelayMs: 180", "contourDelayMs: 520", "wireframeDelayMs: 820", "fadeDelayMs: 1500", "targetLifetimeMs: 2300", "fadeDurationMs: 800"]) {
  assert(trainingRadarTargets.includes(timing), `Missing centralized radar timing: ${timing}`);
}
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
assert(trainingRadarSequence.includes("targetPhases") && trainingRadarSequence.includes("activeTargetId") && trainingRadarSequence.includes("...HIDDEN_TARGET_PHASES"), "Radar must clear the previous object before activating exactly one layered target.");
assert(trainingRadarSequence.includes("schedule(beginPass, TRAINING_RADAR_TIMING.passDurationMs)"), "Radar must reverse immediately when each traverse ends.");
for (const phase of ['"contact"', '"surface"', '"contour"', '"wireframe"', '"fade"']) {
  assert(trainingRadarSequence.includes(phase), `Layered radar target phase missing: ${phase}.`);
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
for (const layeredScanMarker of ["training-object-contact", "training-object-surface-scan-ltr", "training-object-surface-scan-rtl", "training-object-contour-scan-ltr", "training-object-contour-scan-rtl", "training-object-tactical-wireframe", "training-object-tactical-glow"]) {
  assert(css.includes(layeredScanMarker), `Layered Training object scan CSS missing: ${layeredScanMarker}.`);
}
assert(css.includes("clip-path: inset(0 45% 0 45%)") && css.includes("opacity: 0.52") && css.includes("opacity: 0.38"), "Surface and contour scans must use readable narrow local bands at transfer-safe opacity.");
assert(css.includes(".training-radar-object-notch") && css.includes(".is-object-transfer-active") && css.includes("transition: opacity 24ms linear"), "The global line, glow and band must be interrupted decisively in the targeted car zone.");
assert(css.includes("clip-path: inset(0 70% 0 20%)") && css.includes("clip-path: inset(0 20% 0 70%)"), "The local surface scan must begin immediately at contact in either radar direction.");
assert(css.includes("opacity: 0.3") && css.includes("opacity: 0.09") && css.includes("--training-target-lifetime"), "Tactical wireframe and glow must activate only after the local surface scan and fade within the target lifetime.");
for (const premiumClass of ["training-fennec-reflection", "training-fennec-rim-light", "training-fennec-headlight-glow", "training-fennec-rear-accent"]) {
  assert(css.includes(premiumClass), `Premium Fennec treatment missing: ${premiumClass}.`);
}
for (const safeOpacity of ["opacity: 0.32", "opacity: 0.24", "opacity: 0.3", "opacity: 0.09"]) {
  assert(css.includes(safeOpacity), `Safe Training overlay opacity missing: ${safeOpacity}.`);
}
assert(/\.training-fennec-reflection\s*\{[\s\S]*?opacity:\s*0\.08;[\s\S]*?ellipse\(15% 8\.5% at 79% 79%\)[\s\S]*?scale\(0\.72\);/s.test(css), "Fennec reflection must stay tightly cropped, compact and discreet under the car.");
assert(/\.training-fennec-headlight-glow\s*\{[\s\S]*?opacity:\s*0\.22;/s.test(css), "Fennec headlights must retain a subtle premium glow.");
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
