"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeDashboardModules } from "@/components/home/HomeDashboardModules";
import { HomeHeader } from "@/components/home/HomeHeader";
import { ModeSelector } from "@/components/home/ModeSelector";
import {
  ModeIllustration,
  type ModeIllustrationHandle
} from "@/components/home/illustrations/ModeIllustration";
import type { HomeAction, HomeDashboardViewModel, HomeModeId } from "@/types/home";

type HomeDashboardProps = {
  viewModel: HomeDashboardViewModel;
};

const SESSION_LAUNCH_DURATION_MS = 2000;

export function HomeDashboard({ viewModel }: HomeDashboardProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<HomeModeId>(viewModel.selectedMode);
  const [launchingMode, setLaunchingMode] = useState<HomeModeId | null>(null);
  const illustrationRef = useRef<ModeIllustrationHandle>(null);
  const launchTimerRef = useRef<number | null>(null);
  const headerStatus = useMemo(
    () => ({ playerStage: viewModel.playerStage, permitStatus: viewModel.modules.permitStatus }),
    [viewModel.playerStage, viewModel.modules.permitStatus]
  );

  function handleSelectMode(mode: HomeModeId) {
    if (!launchingMode) setSelectedMode(mode);
  }

  function handleLaunch(action: HomeAction) {
    if (!action.href || launchingMode || launchTimerRef.current !== null) return;

    const destination = action.href;
    setLaunchingMode(selectedMode);
    void illustrationRef.current?.resetParallax(200);
    launchTimerRef.current = window.setTimeout(() => router.push(destination), SESSION_LAUNCH_DURATION_MS);
  }

  useEffect(() => {
    return () => {
      if (launchTimerRef.current !== null) window.clearTimeout(launchTimerRef.current);
    };
  }, []);

  return (
    <main className="home-dashboard" aria-labelledby="home-title">
      <HomeHeader playerStage={headerStatus.playerStage} permitStatus={headerStatus.permitStatus} />

      <section className="home-main-stage" aria-label="Accueil entrainement">
        <div className="home-control-column">
          <div className="home-copy">
            <span className="home-stage-kicker">Decision training</span>
            <h1 id="home-title">
              {viewModel.hero.title}
              <span>{viewModel.hero.accentTitle}</span>
            </h1>
            <p>{viewModel.hero.description}</p>
          </div>

          <ModeSelector
            isLaunching={launchingMode !== null}
            modes={viewModel.modeAvailability}
            onLaunch={handleLaunch}
            onSelectMode={handleSelectMode}
            previews={viewModel.previews}
            selectedMode={selectedMode}
          />
        </div>

        <div className="home-visual-stage">
          <ModeIllustration
            key={selectedMode}
            launching={launchingMode === selectedMode}
            mode={selectedMode}
            ref={illustrationRef}
          />
        </div>
      </section>

      <HomeDashboardModules modules={viewModel.modules} playerStage={viewModel.playerStage} />
    </main>
  );
}
