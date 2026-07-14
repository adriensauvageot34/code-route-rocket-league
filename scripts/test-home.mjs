import { existsSync, readFileSync } from "node:fs";

const textFiles = [
  "src/app/page.tsx",
  "src/app/home.css",
  "src/components/AppFrame.tsx",
  "src/components/home/HomeDashboard.tsx",
  "src/components/home/HomeHeader.tsx",
  "src/components/home/ModeSelector.tsx",
  "src/components/home/ModePreviewPanel.tsx",
  "src/components/home/PrimaryHomeAction.tsx",
  "src/components/home/HomeDashboardModules.tsx",
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

const page = read("src/app/page.tsx");
const appFrame = read("src/components/AppFrame.tsx");
const viewModel = read("src/lib/home/homeDashboardViewModel.ts");
const modePreview = read("src/components/home/ModePreviewPanel.tsx");

assert(page.includes("HomeDashboard"), "Home page must render HomeDashboard.");
assert(page.includes('variant="home"'), "Home page must use the home frame variant.");
assert(appFrame.includes('variant?: "default" | "game" | "home"'), "AppFrame must expose the home variant.");
assert(viewModel.includes('href: "/session"'), "Training CTA must keep opening /session.");
assert(viewModel.includes('status: featureAvailability.competitive ? "available" : "locked"'), "Competitive mode must stay lockable by feature flag.");
assert(modePreview.includes("aria-live"), "Locked feedback must be announced accessibly.");

const forbiddenVisibleWording = [
  "base locale prete",
  "source locale",
  "structure prete",
  "prochaine etape",
  "top mondial",
  "top 6",
  "classement mondial",
  "bonus quotidien",
  "coffre",
  "loot"
];

for (const path of textFiles) {
  const content = read(path).toLowerCase();
  for (const wording of forbiddenVisibleWording) {
    assert(!content.includes(wording), `Forbidden home wording found in ${path}: ${wording}`);
  }
}

assert(!existsSync("src/components/ModeCard.tsx"), "Old ModeCard component should not remain as a second home source.");

console.log("Home dashboard smoke tests OK");
