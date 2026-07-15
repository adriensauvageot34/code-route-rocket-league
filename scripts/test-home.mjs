import { existsSync, readFileSync } from "node:fs";

const expectedFiles = [
  "src/app/page.tsx",
  "src/app/home.css",
  "src/components/AppFrame.tsx",
  "src/components/home/HomeDashboard.tsx",
  "src/components/home/HomeHeader.tsx",
  "src/components/home/HomeLaunchOverlay.tsx",
  "src/components/home/ModeSelector.tsx",
  "src/components/home/ModePreviewPanel.tsx",
  "src/components/home/PrimaryHomeAction.tsx",
  "src/components/home/illustrations/ModeIllustration.tsx",
  "src/components/home/illustrations/TrainingScene.tsx",
  "src/components/home/illustrations/TrainingAnalysisOverlay.tsx",
  "src/components/home/illustrations/CompetitiveScene.tsx",
  "src/components/home/illustrations/SceneGroup.tsx",
  "src/components/home/HomeDashboardModules.tsx",
  "src/components/home/PlayerProfileCard.tsx",
  "src/components/home/WeeklyPriorityCard.tsx",
  "src/components/home/RecentSessionCard.tsx",
  "src/components/home/WeaknessSummaryCard.tsx",
  "src/components/home/SkillProgressCard.tsx",
  "src/components/home/PermitCard.tsx",
  "src/components/home/HistoryCard.tsx",
  "src/components/home/ResourceCard.tsx",
  "src/components/home/LockedFeatureCard.tsx",
  "src/lib/home/homeDashboardViewModel.ts",
  "src/lib/home/getHomeDashboardViewModel.ts",
  "src/lib/home/homeSceneParallax.ts",
  "src/lib/home/homeLaunch.ts",
  "src/lib/home/trainingAnalysisZones.ts",
  "src/hooks/useParallaxController.ts",
  "src/types/home.ts"
];

function read(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing expected file: ${path}`);
  }
  return readFileSync(path, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const files = Object.fromEntries(expectedFiles.map((path) => [path, read(path)]));
const page = files["src/app/page.tsx"];
const appFrame = files["src/components/AppFrame.tsx"];
const homeDashboard = files["src/components/home/HomeDashboard.tsx"];
const homeLaunchOverlay = files["src/components/home/HomeLaunchOverlay.tsx"];
const types = files["src/types/home.ts"];
const viewModel = files["src/lib/home/homeDashboardViewModel.ts"];
const modeSelector = files["src/components/home/ModeSelector.tsx"];
const modePreview = files["src/components/home/ModePreviewPanel.tsx"];
const modeIllustration = files["src/components/home/illustrations/ModeIllustration.tsx"];
const trainingScene = files["src/components/home/illustrations/TrainingScene.tsx"];
const trainingAnalysisOverlay = files["src/components/home/illustrations/TrainingAnalysisOverlay.tsx"];
const competitiveScene = files["src/components/home/illustrations/CompetitiveScene.tsx"];
const sceneGroup = files["src/components/home/illustrations/SceneGroup.tsx"];
const sceneDepths = files["src/lib/home/homeSceneParallax.ts"];
const homeLaunch = files["src/lib/home/homeLaunch.ts"];
const parallaxController = files["src/hooks/useParallaxController.ts"];
const trainingAnalysisZones = files["src/lib/home/trainingAnalysisZones.ts"];
const primaryAction = files["src/components/home/PrimaryHomeAction.tsx"];
const modules = files["src/components/home/HomeDashboardModules.tsx"];
const weaknessCard = files["src/components/home/WeaknessSummaryCard.tsx"];
const css = files["src/app/home.css"];

assert(page.includes("HomeDashboard"), "Home page must render HomeDashboard.");
assert(page.includes("getHomeDashboardViewModel"), "Home page must use the home adapter.");
assert(page.includes('variant="home"'), "Home page must use the home frame variant.");
assert(!page.includes("ModeCard"), "Home page must not use the old ModeCard.");
assert(!page.includes("getQuestionSummaries"), "Home page must not read question summaries directly.");
assert(appFrame.includes('variant?: "default" | "game" | "home"'), "AppFrame must expose the home variant.");

const requiredTypeSnippets = [
  'HomePlayerStage = "needs_placement" | "building_profile" | "active"',
  'HomeModeId = "training" | "competitive"',
  'WeeklyPriorityState = "none" | "choice_required" | "active" | "renewal_due"',
  'SkillState = "not_evaluated" | "fragile" | "learning" | "acquired" | "automated" | "reinforce"',
  'PermitState = "locked" | "in_progress" | "obtained" | "obtained_with_alerts"',
  "secondaryWeaknesses: WeaknessSummary[]",
  "skillSummaries: SkillSummary[]",
  "permitStatus: PermitStatus",
  "featureAvailability: HomeFeatureAvailability"
];

for (const snippet of requiredTypeSnippets) {
  assert(types.includes(snippet), `Home contract missing: ${snippet}`);
}

for (const feature of ["placement", "competitive", "targetedSessions", "accounts", "advancedResources"]) {
  assert(viewModel.includes(`${feature}: false`), `Feature flag must default to false: ${feature}`);
}

assert(viewModel.includes('selectedMode = input.selectedMode ?? "training"'), "Training must be selected by default.");
assert(viewModel.includes('href: "/session"'), "Training CTA must keep opening /session.");
assert(viewModel.includes('label: "Commencer mon placement"'), "Future placement action must be prepared.");
assert(viewModel.includes('feedback: "Debloque ce mode en validant tes bases."'), "Competitive lock feedback must be present.");
assert(viewModel.includes('secondaryWeaknesses: (input.secondaryWeaknesses ?? []).slice(0, 2)'), "View model must cap secondary weaknesses at two.");
assert(weaknessCard.includes("secondaryWeaknesses.slice(0, 2)"), "Weakness card must cap secondary weaknesses at two.");

assert(modeSelector.includes('role="radiogroup"'), "Mode selector must be a keyboard-readable radiogroup.");
assert(modeSelector.includes('role="radio"'), "Mode choices must expose radio semantics.");
assert(modeSelector.includes("ArrowRight"), "Mode selector must handle arrow-key navigation.");
assert(modeSelector.includes("ModePreviewPanel") && modeSelector.includes("previews[mode.id]"), "The selected card must contain its detailed preview.");
assert(modePreview.includes("aria-live"), "Locked feedback must be announced accessibly.");
assert(!modePreview.includes("ModeIllustration"), "The card detail must not contain the illustration.");
assert(homeDashboard.includes('className="home-control-column"'), "Hero copy and mode cards must share the left column.");
assert(homeDashboard.includes('className="home-visual-stage"'), "The illustration must have a dedicated right column.");
assert(homeDashboard.includes("key={selectedMode}") && homeDashboard.includes("ref={illustrationRef}"), "Mode changes must remount only the right illustration.");
assert(homeLaunch.includes("HOME_LAUNCH_DURATION_MS = 2000"), "Home launch must have one shared two-second duration.");
assert((homeLaunch.match(/LAUNCH_DURATION_MS\s*=\s*2000/g) ?? []).length === 1, "The two-second launch duration must be declared once.");
assert(homeDashboard.includes("resetParallax(200)"), "Session launch must recenter parallax before navigation.");
assert(homeDashboard.includes("router.push(destination)"), "Session launch must navigate only after its animation.");
assert((homeDashboard.match(/window\.setTimeout/g) ?? []).length === 1, "Home launch must create only one timer.");
assert((homeDashboard.match(/router\.push/g) ?? []).length === 1, "Home launch must navigate only once.");
assert(homeDashboard.includes("launchTimerRef.current !== null"), "Session launch must reject duplicate clicks.");
assert(homeDashboard.includes("clearTimeout(launchTimerRef.current)"), "Session launch timer must be cleaned up on unmount.");
assert(homeDashboard.includes("setLaunchingMode(null)") && homeDashboard.includes("setLaunchGeometry(null)"), "A failed or delayed navigation must not leave the overlay opaque.");
assert(homeDashboard.includes('aria-busy={launchingMode !== null}'), "The home must expose its busy state during launch.");
assert(homeDashboard.includes("<HomeLaunchOverlay"), "The dashboard must mount one global launch overlay.");
assert(modeSelector.includes("disabled={isLaunching}"), "Mode changes must be locked during launch.");
assert(modeIllustration.includes('mode === "training" ? <TrainingScene /> : <CompetitiveScene />'), "Only the selected scene must render.");
assert(modeIllustration.includes("resetParallax"), "The illustration must expose the future recenter method.");
assert(modeIllustration.includes("getLaunchGeometry") && modeIllustration.includes("getBoundingClientRect"), "The overlay anchor must be projected from the rendered scene.");
assert(modeIllustration.includes('launching ? " is-launching" : ""'), "The illustration must expose its launch phase to CSS.");
assert(homeLaunch.includes("training: { x: 846, y: 432 }"), "The training wave must originate at the measured ball center.");
assert(homeLaunch.includes("competitive: { x: 760, y: 337 }"), "The competitive cover must originate at the measured cage center.");
assert(homeLaunch.includes("anchor.x / HOME_SCENE_SIZE.width") && homeLaunch.includes("anchor.y / HOME_SCENE_SIZE.height"), "Logical anchors must be projected through the 1672x941 canvas.");
assert(homeLaunch.includes("viewport.width - anchorX") && homeLaunch.includes("viewport.height - anchorY"), "Launch geometry must cover the farthest viewport edges.");
assert(!homeLaunchOverlay.includes("setTimeout") && !modeIllustration.includes("setTimeout"), "The overlay and illustration must not duplicate the launch timer.");
assert(homeLaunchOverlay.includes('mode === "training"') && homeLaunchOverlay.includes("cageProjectorsHaze"), "The single overlay must implement both launch variants.");
assert(sceneGroup.includes("scene-parallax") && sceneGroup.includes("scene-idle") && sceneGroup.includes("scene-launch"), "Scene transforms must use independent nested wrappers.");
assert(sceneGroup.includes("style={{ mixBlendMode: blendMode, zIndex: layer }}"), "Black-screen assets must blend at group level against the complete scene.");
assert(!sceneGroup.includes("asset.blendMode"), "Black-screen blending must not be trapped on an image inside a transformed group.");
assert(trainingScene.includes('name="analysis-zones"'), "Training vector analysis group must exist.");
assert(trainingScene.includes('name="analysis-distant-cars"'), "Training distant analysis group must exist.");
assert(trainingScene.includes('name="ball"') && trainingScene.includes('name="fennec"'), "Training ball and Fennec groups must exist.");
assert(trainingScene.includes('blendMode="screen"') && trainingScene.includes('name="fennec-lights-glow"'), "Training headlight glow must use a separate screen group.");
assert(trainingScene.includes('className="training-lights-glow"'), "Training headlight glow must have its own idle cycle.");
assert(trainingScene.includes('className="training-ball-energy"'), "Training ball energy must be independently hidden during idle.");
assert(trainingScene.includes('className="training-transition-wave-local"'), "Training wave must use the prepared future slot.");
assert(trainingScene.includes('future layer={6} name="transition"'), "Training transition placeholder must exist.");
assert(trainingScene.indexOf('name="analysis-zones"') < trainingScene.indexOf('name="analysis-distant-cars"'), "Training analysis zones must render below distant vehicles.");
assert(trainingScene.indexOf('name="analysis-distant-cars"') < trainingScene.indexOf('name="ball"'), "Training vehicles and ball must render above their analysis zones.");
assert(trainingAnalysisOverlay.includes('viewBox="0 0 1672 941"'), "Training analysis overlay must share the scene canvas.");
assert(trainingAnalysisOverlay.includes("trainingAnalysisZones.map"), "Training analysis zones must come from centralized coordinates.");
assert(!trainingAnalysisOverlay.includes("requestAnimationFrame"), "Training analysis must not create a second animation engine.");
for (const zone of ["left-car", "far-right-car", "near-right-car", "ball"]) {
  assert(trainingAnalysisZones.includes(`id: "${zone}"`), `Missing training analysis zone: ${zone}`);
}
assert(trainingAnalysisZones.includes("TRAINING_ANALYSIS_CYCLE_MS = 8000"), "Training analysis cycle must stay between seven and nine seconds.");
assert(competitiveScene.includes('name="cage"') && competitiveScene.includes('name="ground-reflection"'), "Competitive cage and ground groups must exist.");
assert(competitiveScene.includes('name="motion-trail"') && competitiveScene.includes('name="fennec"'), "Competitive trail and Fennec groups must exist.");
assert(competitiveScene.includes('name="cage-projectors-glow"') && competitiveScene.includes('name="cage-projectors-haze"'), "Competitive projector black-screens must use separate groups.");
assert(competitiveScene.indexOf('name="motion-trail"') > competitiveScene.indexOf('name="fennec"'), "Competitive trail must render above the Fennec.");
assert(competitiveScene.includes('className="competitive-exhaust-energy"'), "Competitive exhaust alignment correction must be scoped to its asset.");
assert(competitiveScene.includes('className="competitive-cage-neon"'), "Competitive cage neon must have its own idle cycle.");
assert(competitiveScene.includes('className="competitive-projectors-glow"') && competitiveScene.includes('className="competitive-projectors-haze"'), "Competitive projector layers must have independent idle cycles.");
assert(competitiveScene.includes('className="competitive-ground-reflection"'), "Competitive ground reflection must have a discreet idle cycle.");
assert(competitiveScene.includes('className="competitive-motion-trail"'), "Competitive trail must be independently hidden during idle.");
assert(competitiveScene.includes('className="competitive-ground-impact"'), "Competitive impact must be independently activated during launch.");
assert(competitiveScene.includes('future layer={8} name="impact"'), "Competitive impact placeholder must exist.");
assert(competitiveScene.includes('future layer={9} name="transition"'), "Competitive transition placeholder must exist.");
for (const depth of ["3", "5", "7", "11", "14"]) {
  assert(sceneDepths.includes(`translation: ${depth}`), `Missing parallax translation depth: ${depth}px`);
}
assert(sceneDepths.includes("rotation: 0.2"), "Maximum parallax rotation must remain 0.2deg.");
assert(parallaxController.includes("requestAnimationFrame"), "Parallax must use requestAnimationFrame.");
assert(parallaxController.includes("cancelAnimationFrame"), "Parallax must cancel its frame on teardown.");
assert(parallaxController.includes('removeEventListener("pointermove"'), "Parallax must remove its pointer listener on teardown.");
assert(parallaxController.includes('matchMedia("(hover: hover) and (pointer: fine)"'), "Pointer input must be limited to fine pointers.");
assert(parallaxController.includes("if (finePointerQuery.matches)"), "Coarse pointers must use automatic drift without pointer listeners.");
assert(parallaxController.includes("AUTO_DRIFT_X"), "Parallax must include automatic idle drift.");
assert(!parallaxController.includes("useState"), "Parallax must not use React state on animation frames.");
assert(!parallaxController.toLowerCase().includes("gyroscope"), "Home parallax must not request gyroscope access.");
assert(primaryAction.includes('aria-disabled="true"'), "Locked action must explain disabled state.");
assert(primaryAction.includes("event.preventDefault()") && primaryAction.includes("onLaunch(action)"), "Training CTA must start the launch sequence before navigation.");
assert(primaryAction.includes('isLaunching ? "Lancement..."'), "The launching CTA must expose an accessible progress label.");
assert(modules.includes("PlayerProfileCard"), "Placement/profile module must exist.");
assert(modules.includes("WeeklyPriorityCard"), "Weekly priority module must exist.");
assert(modules.includes("LockedFeatureCard"), "Targeted sessions must be locked, not active.");

const forbiddenVisibleWording = [
  "v0",
  "source locale",
  "base locale prete",
  "structure prete",
  "prochaine etape",
  "top mondial",
  "top 6",
  "classement mondial",
  "faux rang",
  "bonus quotidien",
  "coffre",
  "loot",
  "pdf",
  "video",
  "218 sessions",
  "45h",
  "78%",
  "68%"
];

for (const [path, content] of Object.entries(files)) {
  const lower = content.toLowerCase();
  for (const wording of forbiddenVisibleWording) {
    assert(!lower.includes(wording), `Forbidden home wording found in ${path}: ${wording}`);
  }
}

const forbiddenImports = ["content.json", "@/lib/questions", "getQuestionSummaries", "getActiveQuestions", "error_tags"];
for (const [path, content] of Object.entries(files)) {
  for (const forbidden of forbiddenImports) {
    assert(!content.includes(forbidden), `Home layer must not read pedagogical internals in ${path}: ${forbidden}`);
  }
}

for (const line of css.split("\n")) {
  if (line.includes("font-size")) {
    assert(!line.includes("vw") && !line.includes("clamp("), `Font-size must not scale with viewport width: ${line.trim()}`);
  }
}

assert(css.includes("overflow-x: hidden"), "Home CSS must prevent horizontal overflow.");
assert(css.includes("aspect-ratio: 1672 / 941"), "Home scenes must keep the 1672x941 logical canvas ratio.");
assert(css.includes("grid-template-columns: minmax(360px, 0.78fr) minmax(0, 1.42fr)"), "Desktop home must reserve the larger right column for the illustration.");
assert(css.includes(".competitive-exhaust-energy"), "Competitive exhaust alignment CSS must exist.");
assert(css.includes("@keyframes training-analysis-scan"), "Training analysis zones must scan in sequence.");
assert(css.includes("@keyframes training-lights-breathe"), "Training headlights must breathe during idle.");
assert(css.includes("@keyframes competitive-cage-neon-breathe"), "Competitive cage neon must breathe during idle.");
assert(css.includes("@keyframes competitive-projectors-glow-breathe"), "Competitive projector glow must breathe during idle.");
assert(css.includes("@keyframes competitive-projectors-haze-breathe"), "Competitive projector haze must stay independently diffuse.");
assert(css.includes("@keyframes competitive-exhaust-pulse"), "Competitive exhaust must use a compact idle pulse.");
assert(/\.training-ball-energy\s*\{[^}]*opacity:\s*0;/s.test(css), "Training ball energy must be hidden during idle.");
assert(/\.competitive-motion-trail\s*\{[^}]*opacity:\s*0;/s.test(css), "Competitive trail must be hidden during idle.");
assert(css.includes(".scene-group.is-future"), "Training wave and competitive impact must stay hidden during idle.");
assert(css.includes("@keyframes scene-idle-fennec"), "The selected Fennec must move autonomously without pointer input.");
assert(css.includes("@keyframes scene-mode-enter"), "Selecting a mode must trigger a dedicated scene entry.");
assert(css.includes("@keyframes training-launch-ball-energy"), "Training launch must reveal ball energy.");
assert(css.includes("@keyframes training-launch-local-wave"), "Training launch must activate its local wave.");
assert(css.includes("@keyframes home-training-launch-wave"), "Training launch must expand through the global overlay.");
assert(css.includes("@keyframes competitive-launch-fennec"), "Competitive launch animation must be prepared.");
assert(css.includes("translate3d(22%, -5%, 0)"), "The competitive Fennec must move toward the right during launch.");
assert(css.includes("@keyframes competitive-launch-impact") && css.includes("@keyframes competitive-launch-trail"), "Competitive impact and trail must be launch-only effects.");
assert(css.includes("animation-play-state: paused"), "Idle animations must pause during launch.");
assert(css.includes("var(--home-launch-duration)"), "All launch animations must use the shared duration.");
assert(css.includes(".home-launch-overlay") && css.includes("position: fixed") && css.includes("pointer-events: none"), "The global overlay must cover the viewport without intercepting input.");
assert(css.includes(".home-launch-asset-frame") && css.includes("mix-blend-mode: screen"), "Global black-screen launch assets must blend against the home.");
assert(css.includes(".mode-illustration.is-launching .scene-group.is-future"), "Future slots must activate only while launching.");
assert(css.includes("@keyframes home-launch-reduced-fade"), "Reduced motion must use a simple progressive light fade.");
assert(css.includes(".scene-parallax[data-depth=\"foreground\"]"), "Foreground parallax CSS must exist.");
assert(css.includes(".training-analysis-zone") && css.includes("prefers-reduced-motion: reduce"), "Reduced motion must cover the detailed idle cycles.");
assert(css.includes("@media (max-width: 1180px)"), "Laptop breakpoint must exist.");
assert(css.includes("@media (max-width: 760px)"), "Mobile portrait breakpoint must exist.");
assert(css.includes("@media (prefers-reduced-motion: reduce)"), "Reduced motion media query must exist.");
assert(!existsSync("src/components/ModeCard.tsx"), "Old ModeCard component should not remain as a second home source.");

console.log("Home dashboard validation OK");
console.log("Covered states: no data, placement disabled, future placement, building profile, active profile, priority choice, active priority, summary available, acquired with reinforce alert, permit locked/obtained, competitive locked, resources unavailable, targeted sessions locked.");
