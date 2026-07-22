# Sunday home dashboard recovery

This branch was created from the current `main` commit `6b9e328d3873856f8cb860890933bfdca4dbf07c`.

The Codex local workspace root is not a valid Git repository, so the recovered Sunday home-dashboard work could not be pushed through normal local Git.

Recovered local files are saved on the machine at:

```text
C:\Users\AdrienSauvageot\Documents\Codex\2026-07-01\github-plugin-github-openai-curated-remote\recovery\sunday-home-dashboard-2026-07-14
```

Important recovered files:

```text
src/app/page.tsx
src/app/home.css
src/components/AppFrame.tsx
src/components/home/HistoryCard.tsx
src/components/home/HomeDashboard.tsx
src/components/home/HomeDashboardModules.tsx
src/components/home/HomeHeader.tsx
src/components/home/LockedFeatureCard.tsx
src/components/home/ModePreviewPanel.tsx
src/components/home/ModeSelector.tsx
src/components/home/PermitCard.tsx
src/components/home/PlayerProfileCard.tsx
src/components/home/PrimaryHomeAction.tsx
src/components/home/RecentSessionCard.tsx
src/components/home/ResourceCard.tsx
src/components/home/SkillProgressCard.tsx
src/components/home/WeaknessSummaryCard.tsx
src/components/home/WeeklyPriorityCard.tsx
src/lib/home/getHomeDashboardViewModel.ts
src/lib/home/homeDashboardViewModel.ts
src/types/home.ts
scripts/test-home.mjs
```

A recovery patch was generated locally:

```text
home-dashboard-recovery.patch
```

Next step: apply the recovered home files onto a fresh GitHub-synced workspace from `main`, then open a normal implementation PR. Do not use the stale local root as the source of truth for future work.
