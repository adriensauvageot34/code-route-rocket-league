"use client";

import { useEffect, useMemo, useState } from "react";
import { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";

const TRAINING_RENDERER_DEBUG_PARAM = "debugRenderer";

function hasTrainingRendererDebugFlag() {
  return (
    new URLSearchParams(window.location.search).get(
      TRAINING_RENDERER_DEBUG_PARAM,
    ) === "1"
  );
}

export function useTrainingRendererDebug() {
  const [debugEnabled, setDebugEnabled] = useState(false);

  useEffect(() => {
    const syncDebugFlag = () => {
      const enabled = hasTrainingRendererDebugFlag();
      setDebugEnabled(enabled);
      if (!enabled) {
        window.removeEventListener("popstate", syncDebugFlag);
      }
    };
    const enabledAtMount = hasTrainingRendererDebugFlag();
    setDebugEnabled(enabledAtMount);

    if (!enabledAtMount) return;
    window.addEventListener("popstate", syncDebugFlag);
    return () => {
      window.removeEventListener("popstate", syncDebugFlag);
    };
  }, []);

  const debugCollector = useMemo(
    () => (debugEnabled ? new TrainingGpuDebugCollector() : null),
    [debugEnabled],
  );

  useEffect(
    () => () => {
      debugCollector?.destroy();
    },
    [debugCollector],
  );

  return { debugEnabled, debugCollector };
}
