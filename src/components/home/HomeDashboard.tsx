"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeLaunchOverlay } from "@/components/home/HomeLaunchOverlay";
import { HomeStatisticsPanel } from "@/components/home/HomeStatisticsPanel";
import { HomeViewSelector } from "@/components/home/HomeViewSelector";
import {
  ModeIllustration,
  type ModeIllustrationHandle,
} from "@/components/home/illustrations/ModeIllustration";
import {
  HOME_LAUNCH_DURATION_MS,
  type HomeLaunchGeometry,
} from "@/lib/home/homeLaunch";
import type {
  HomeAction,
  HomeDashboardViewModel,
  HomeModeId,
  HomeViewId,
} from "@/types/home";

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
  const [selectedView, setSelectedView] = useState<HomeViewId>(viewModel.selectedView);
  const [launchingMode, setLaunchingMode] = useState<HomeModeId | null>(null);
  const [launchGeometry, setLaunchGeometry] = useState<HomeLaunchGeometry | null>(null);
  const illustrationRef = useRef<ModeIllustrationHandle>(null);
  const launchTimerRef = useRef<number | null>(null);

  function handleSelectView(view: HomeViewId) {
    if (!launchingMode) setSelectedView(view);
  }

  function handleLaunch(action: HomeAction) {
    if (
      selectedView !== "training" ||
      !action.href ||
      launchingMode ||
      launchTimerRef.current !== null
    ) {
      return;
    }

    const destination = action.href;
    setLaunchGeometry(illustrationRef.current?.getLaunchGeometry() ?? null);
    setLaunchingMode("training");
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
      <HomeHeader permitProgress={viewModel.permitProgress} playerStage={viewModel.playerStage} />

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

          <HomeViewSelector
            isLaunching={launchingMode !== null}
            modePreviews={viewModel.modePreviews}
            onLaunch={handleLaunch}
            onSelectView={handleSelectView}
            selectedView={selectedView}
            views={viewModel.viewAvailability}
          />
        </div>

        <div className={`home-context-stage is-${selectedView}`}>
          {selectedView === "statistics" ? (
            <HomeStatisticsPanel statistics={viewModel.statistics} />
          ) : (
            <ModeIllustration
              key={selectedView}
              launching={launchingMode === selectedView}
              mode={selectedView}
              ref={illustrationRef}
            />
          )}
        </div>
      </section>

      <HomeLaunchOverlay geometry={launchGeometry} mode={launchingMode} />
    </main>
  );
}
