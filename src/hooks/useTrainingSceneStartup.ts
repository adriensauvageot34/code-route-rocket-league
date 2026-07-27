"use client";

import {
  useCallback,
  useEffect,
  useState,
  type TransitionEvent as ReactTransitionEvent,
} from "react";

export type TrainingSceneStartupStage =
  | "poster"
  | "preparing"
  | "entering"
  | "running";

type UseTrainingSceneStartupOptions = {
  active: boolean;
  criticalAssetsReady: boolean;
  launching: boolean;
};

export function useTrainingSceneStartup({
  active,
  criticalAssetsReady,
  launching,
}: UseTrainingSceneStartupOptions) {
  const [documentVisible, setDocumentVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [stage, setStage] =
    useState<TrainingSceneStartupStage>("poster");

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    function syncEnvironment() {
      setDocumentVisible(document.visibilityState === "visible");
      setReducedMotion(reducedMotionQuery.matches);
    }

    reducedMotionQuery.addEventListener("change", syncEnvironment);
    document.addEventListener("visibilitychange", syncEnvironment);
    syncEnvironment();

    return () => {
      reducedMotionQuery.removeEventListener("change", syncEnvironment);
      document.removeEventListener("visibilitychange", syncEnvironment);
    };
  }, []);

  useEffect(() => {
    if (!active || launching) {
      setStage("poster");
      return;
    }

    if (stage === "poster") {
      setStage("preparing");
      return;
    }

    if (
      stage === "entering" &&
      (!criticalAssetsReady || !documentVisible)
    ) {
      setStage("preparing");
      return;
    }

    if (
      stage === "preparing" &&
      criticalAssetsReady &&
      documentVisible
    ) {
      setStage(reducedMotion ? "running" : "entering");
    }
  }, [
    active,
    criticalAssetsReady,
    documentVisible,
    launching,
    reducedMotion,
    stage,
  ]);

  const handleTransitionEnd = useCallback(
    (event: ReactTransitionEvent<HTMLDivElement>) => {
      if (
        stage !== "entering" ||
        event.currentTarget !== event.target ||
        (event.propertyName !== "opacity" &&
          event.propertyName !== "transform")
      ) {
        return;
      }

      setStage("running");
    },
    [stage],
  );

  return {
    handleTransitionEnd,
    stage,
  };
}
