"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { HomeDashboardModules } from "@/components/home/HomeDashboardModules";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeLaunchOverlay } from "@/components/home/HomeLaunchOverlay";
import { ModeSelector } from "@/components/home/ModeSelector";
import {
  ModeIllustration,
  type ModeIllustrationHandle
} from "@/components/home/illustrations/ModeIllustration";
import {
  HOME_LAUNCH_DURATION_MS,
  type HomeLaunchGeometry,
} from "@/lib/home/homeLaunch";
import type { HomeAction, HomeDashboardViewModel, HomeModeId } from "@/types/home";

type HomeDashboardProps = {
  viewModel: HomeDashboardViewModel;
};

type HomeDashboardStyle = CSSProperties & {
  "--home-launch-duration": string;
};

const homeDashboardStyle: HomeDashboardStyle = {
  "--home-launch-duration": `${HOME_LAUNCH_DURATION_MS}ms`,
};

export function HomeDashboard({ viewModel }: HomeDashboardProps) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<HomeModeId>(viewModel.selectedMode);
  const [launchingMode, setLaunchingMode] = useState<HomeModeId | null>(null);
  const [launchGeometry, setLaunchGeometry] = useState<HomeLaunchGeometry | null>(null);
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
    setLaunchGeometry(illustrationRef.current?.getLaunchGeometry() ?? null);
    setLaunchingMode(selectedMode);
    void illustrationRef.current?.resetParallax(200);
    launchTimerRef.current = window.setTimeout(() => {
      launchTimerRef.current = null;

      try {
        router.push(destination);
      } finally {
        setLaunchingMode(null);
        setLaunchGeometry(null);
      }
    }, HOME_LAUNCH_DURATION_MS);
  }

  useEffect(() => {
    return () => {
      if (launchTimerRef.current !== null) window.clearTimeout(launchTimerRef.current);
    };
  }, []);

  return (
    <main
      aria-busy={launchingMode !== null}
      aria-labelledby="home-title"
      className="home-dashboard"
      style={homeDashboardStyle}
    >
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
      <HomeLaunchOverlay geometry={launchGeometry} mode={launchingMode} />
    </main>
  );
}
