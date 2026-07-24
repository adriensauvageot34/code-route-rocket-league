"use client";

import { useEffect, useState } from "react";
import type { TrainingRendererMode } from "@/lib/home/gpu/trainingGpuTypes";

export function useTrainingRendererMode(): TrainingRendererMode {
  const [mode, setMode] = useState<TrainingRendererMode>("dom");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setMode(searchParams.get("trainingRenderer") === "gpu" ? "gpu" : "dom");
  }, []);

  return mode;
}
