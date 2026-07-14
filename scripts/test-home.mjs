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
assert(css.includes("@media (max-width: 1180px)"), "Laptop breakpoint must exist.");
assert(css.includes("@media (max-width: 760px)"), "Mobile portrait breakpoint must exist.");
assert(css.includes("@media (prefers-reduced-motion: reduce)"), "Reduced motion media query must exist.");
assert(!existsSync("src/components/ModeCard.tsx"), "Old ModeCard component should not remain as a second home source.");

console.log("Home dashboard validation OK");
console.log("Covered states: no data, placement disabled, future placement, building profile, active profile, priority choice, active priority, summary available, acquired with reinforce alert, permit locked/obtained, competitive locked, resources unavailable, targeted sessions locked.");
