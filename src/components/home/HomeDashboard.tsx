"use client";

import { useMemo, useState } from "react";
import { HomeDashboardModules } from "@/components/home/HomeDashboardModules";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ModePreviewPanel } from "@/components/home/ModePreviewPanel";
import { ModeSelector } from "@/components/home/ModeSelector";
import type { HomeDashboardViewModel, HomeModeId } from "@/types/home";

type HomeDashboardProps = {
  viewModel: HomeDashboardViewModel;
};

export function HomeDashboard({ viewModel }: HomeDashboardProps) {
  const [selectedMode, setSelectedMode] = useState<HomeModeId>(viewModel.selectedMode);
  const selectedPreview = viewModel.previews[selectedMode];

  const permitLabel = useMemo(
    () => viewModel.modules.permit.label,
    [viewModel.modules.permit.label]
  );

  return (
    <main className="home-dashboard" aria-labelledby="home-title">
      <HomeHeader permitLabel={permitLabel} />

      <section className="home-main-stage" aria-label="Accueil entrainement">
        <div className="home-copy">
          <span className="home-stage-kicker">Decision training</span>
          <h1 id="home-title">
            {viewModel.hero.title}
            <span>{viewModel.hero.accentTitle}</span>
          </h1>
          <p>{viewModel.hero.description}</p>
        </div>

        <ModeSelector
          modes={viewModel.modeAvailability}
          onSelectMode={setSelectedMode}
          selectedMode={selectedMode}
        />

        <ModePreviewPanel key={selectedMode} preview={selectedPreview} />
      </section>

      <HomeDashboardModules modules={viewModel.modules} />
    </main>
  );
}
