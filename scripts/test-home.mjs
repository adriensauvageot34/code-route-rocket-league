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
  "src/components/home/illustrations/TrainingRadarOverlay.tsx",
  "src/components/home/illustrations/TrainingRadarSequence.tsx",
  "src/components/home/illustrations/CompetitiveScene.tsx",
  "src/components/home/illustrations/SceneGroup.tsx",
  "src/lib/home/homeDashboardViewModel.ts",
  "src/lib/home/getHomeDashboardViewModel.ts",
  "src/lib/home/homeSceneParallax.ts",
  "src/lib/home/homeLaunch.ts",
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
const trainingRadarOverlay = files["src/components/home/illustrations/TrainingRadarOverlay.tsx"];
const trainingRadarSequence = files["src/components/home/illustrations/TrainingRadarSequence.tsx"];
const competitiveScene = files["src/components/home/illustrations/CompetitiveScene.tsx"];
const sceneGroup = files["src/components/home/illustrations/SceneGroup.tsx"];
const sceneDepths = files["src/lib/home/homeSceneParallax.ts"];
const homeLaunch = files["src/lib/home/homeLaunch.ts"];
const parallaxController = files["src/hooks/useParallaxController.ts"];
const trainingRadarTargets = files["src/lib/home/trainingRadarTargets.ts"];
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
assert(sceneGroup.includes("homeSceneDepths[depth]") && sceneGroup.includes('"--scene-parallax-scale"'), "Scene transforms must use centralized depth configuration.");
for (const asset of ["parallaxSky", "parallaxFarSkyline", "parallaxMidBuildings", "parallaxNearBuildings", "parallaxGroundBarrier"]) {
  assert(trainingScene.includes(`assets.${asset}`), `Training parallax layer missing: ${asset}`);
}
assert(!trainingScene.includes("TrainingAnalysisOverlay") && !trainingScene.includes("assets.background"), "Legacy Training background and analysis circles must not render.");
assert(!trainingScene.includes("distantCarsOcclusion"), "Legacy distant-car occlusion sheet must not render.");
assert(trainingScene.includes('name={`training-${target.id}`}') && trainingScene.includes("<TrainingGroundedCar"), "Training cars must render as individual grounded scene groups.");
for (const target of ["left-car", "back-right-car", "front-right-car"]) {
  assert(trainingRadarTargets.includes(`id: "${target}"`), `Grounded Training car missing: ${target}`);
}
assert(trainingScene.includes('name="training-radar-surface"') && trainingScene.includes('name="training-radar-sweep"') && !trainingScene.includes('name="training-radar-targets"'), "Training radar surfaces must stay behind the grounded actors.");
assert(trainingScene.includes('depth="trainingMid" layer={2} name="training-atmospheric-haze"') && trainingScene.indexOf('name="training-atmospheric-haze"') < trainingScene.indexOf('name="training-mid-buildings"') && !trainingScene.includes("training-horizon-haze"), "Training haze must move with and remain behind the second skyline plane.");
assert(trainingScene.includes('name="ball"') && trainingScene.includes('name="fennec"'), "Training ball and Fennec groups must remain.");
assert(trainingScene.includes('className="training-transition-wave-local"'), "Prepared Training transition layer must remain.");
assert(trainingGroundedActor.includes("training-grounded-actor-base") && trainingGroundedActor.includes("training-contact-shadow"), "Grounded actors must share one transformed base and contact shadow.");
assert(trainingGroundedActor.includes("training-radar-car-wireframe") && trainingGroundedActor.includes("training-radar-car-glow"), "Car base, wireframe and glow must share the grounded actor container.");
assert(trainingGroundedActor.includes("training-ball-contact-shadow") && trainingGroundedActor.includes("training-radar-ball-energy"), "Ball energy and contact treatment must share the grounded ball container.");
assert(trainingRadarOverlay.includes('viewBox="0 0 1672 941"') && trainingRadarOverlay.includes("TRAINING_RADAR_FIELD_PATH"), "Training radar must share and clip to the logical field canvas.");
assert(trainingRadarOverlay.includes("data-radar-direction") && trainingScene.includes("direction={passDirection}"), "Training radar direction must drive both reveal layers.");
assert(!trainingRadarOverlay.includes("training-radar-line-core") && !trainingRadarOverlay.includes("training-radar-line-glow"), "Training scan must remain implicit without a hard HUD line.");
assert(trainingRadarOverlay.includes('mix-blend-mode') === false && css.includes("mix-blend-mode: screen"), "Black tactical terrain must be screen blended in CSS.");
assert(trainingRadarSequence.includes("document.visibilityState") && trainingRadarSequence.includes("IntersectionObserver") && trainingRadarSequence.includes("prefers-reduced-motion"), "Radar lifecycle must follow page, illustration, and motion visibility.");
assert(!trainingRadarSequence.includes("requestAnimationFrame"), "Radar must not create a per-frame React loop.");
assert(trainingRadarSequence.includes('targetIndex % 2 === 0 ? "ltr" : "rtl"') && trainingRadarSequence.includes("getTrainingRadarHitDelayMs(target, passDirection)"), "Radar passes must alternate direction and keep target hits synchronized.");
for (const target of ["left-car", "back-right-car", "front-right-car", "ball"]) {
  assert(trainingRadarTargets.includes(`id: "${target}"`), `Missing training radar target: ${target}`);
}
for (const timing of ["passDurationMs: 1750", "travelDurationMs: 1500", "glowDurationMs: 320", "visibleDurationMs: 3000", "fadeDurationMs: 550"]) {
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
for (const trainingDepth of ["trainingSky", "trainingSkyline", "trainingMid", "trainingNear", "trainingGround", "trainingCarFar", "trainingCarMid", "trainingCarNear", "trainingBall", "trainingFennec"]) {
  assert(sceneDepths.includes(`${trainingDepth}:`), `Missing Training parallax depth: ${trainingDepth}`);
}
for (const amplitude of [3, 7, 18, 27, 22, 23, 25, 28, 34]) {
  assert(sceneDepths.includes(`translationX: ${amplitude}`), `Missing Training horizontal amplitude: ${amplitude}px`);
}
assert(sceneDepths.includes("translationY: 1") && sceneDepths.includes("translationY: 2"), "Training vertical parallax must stay capped between one and two pixels.");
assert(parallaxController.includes("requestAnimationFrame") && parallaxController.includes("cancelAnimationFrame"), "Parallax must create and cancel its frame.");
assert(trainingRadarSequence.includes("targetPhases") && !trainingRadarSequence.includes("activeTargetId"), "Radar targets must keep independent overlapping phases.");
assert(trainingRadarSequence.includes("schedule(beginPass, TRAINING_RADAR_TIMING.passDurationMs)"), "Radar must reverse immediately when each traverse ends.");
assert(css.includes("scale(1.1, 0.94)") && css.includes("scale(1.16, 0.92)") && sceneDepths.includes("translationX: 18") && sceneDepths.includes("translationX: 28"), "The first two skyline planes must stay low, close and parallax distinctly.");
assert(css.includes("inset: 8% -6% 55%") && css.includes("ellipse at 52% 82%"), "The skyline haze must extend upward while concentrating near the terrain horizon.");
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
