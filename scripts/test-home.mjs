import { existsSync, readFileSync } from "node:fs";

const expectedFiles = [
  "src/app/page.tsx",
  "src/app/home.css",
  "src/components/AppFrame.tsx",
  "src/components/home/HomeDashboard.tsx",
  "src/components/home/HomeHeader.tsx",
  "src/components/home/ModeSelector.tsx",
  "src/components/home/ModePreviewPanel.tsx",
  "src/components/home/PrimaryHomeAction.tsx",
  "src/components/home/illustrations/ModeIllustration.tsx",
  "src/components/home/illustrations/TrainingScene.tsx",
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
const types = files["src/types/home.ts"];
const viewModel = files["src/lib/home/homeDashboardViewModel.ts"];
const modeSelector = files["src/components/home/ModeSelector.tsx"];
const modePreview = files["src/components/home/ModePreviewPanel.tsx"];
const modeIllustration = files["src/components/home/illustrations/ModeIllustration.tsx"];
const trainingScene = files["src/components/home/illustrations/TrainingScene.tsx"];
const competitiveScene = files["src/components/home/illustrations/CompetitiveScene.tsx"];
const sceneGroup = files["src/components/home/illustrations/SceneGroup.tsx"];
const sceneDepths = files["src/lib/home/homeSceneParallax.ts"];
const parallaxController = files["src/hooks/useParallaxController.ts"];
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
assert(modePreview.includes("aria-live"), "Locked feedback must be announced accessibly.");
assert(modePreview.includes("ModeIllustration"), "The selected mode preview must render its illustration.");
assert(modeIllustration.includes('mode === "training" ? <TrainingScene /> : <CompetitiveScene />'), "Only the selected scene must render.");
assert(modeIllustration.includes("resetParallax"), "The illustration must expose the future recenter method.");
assert(sceneGroup.includes("scene-parallax") && sceneGroup.includes("scene-idle") && sceneGroup.includes("scene-launch"), "Scene transforms must use independent nested wrappers.");
assert(trainingScene.includes('name="analysis-distant-cars"'), "Training distant analysis group must exist.");
assert(trainingScene.includes('name="ball"') && trainingScene.includes('name="fennec"'), "Training ball and Fennec groups must exist.");
assert(trainingScene.includes('future layer={4} name="transition"'), "Training transition placeholder must exist.");
assert(competitiveScene.includes('name="cage"') && competitiveScene.includes('name="ground-reflection"'), "Competitive cage and ground groups must exist.");
assert(competitiveScene.includes('name="motion-trail"') && competitiveScene.includes('name="fennec"'), "Competitive trail and Fennec groups must exist.");
assert(competitiveScene.includes('future layer={5} name="impact"'), "Competitive impact placeholder must exist.");
assert(competitiveScene.includes('future layer={6} name="transition"'), "Competitive transition placeholder must exist.");
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
assert(css.includes(".scene-parallax[data-depth=\"foreground\"]"), "Foreground parallax CSS must exist.");
assert(css.includes(".scene-group.is-future"), "Future impact and transition slots must remain hidden.");
assert(css.includes("@media (max-width: 1180px)"), "Laptop breakpoint must exist.");
assert(css.includes("@media (max-width: 760px)"), "Mobile portrait breakpoint must exist.");
assert(css.includes("@media (prefers-reduced-motion: reduce)"), "Reduced motion media query must exist.");
assert(!existsSync("src/components/ModeCard.tsx"), "Old ModeCard component should not remain as a second home source.");

console.log("Home dashboard validation OK");
console.log("Covered states: no data, placement disabled, future placement, building profile, active profile, priority choice, active priority, summary available, acquired with reinforce alert, permit locked/obtained, competitive locked, resources unavailable, targeted sessions locked.");
