"use client";

import { useEffect, useState } from "react";
import type { TrainingRendererRequest } from "@/lib/home/gpu/trainingGpuTypes";

const INITIAL_REQUEST: TrainingRendererRequest = {
  requested: "gpu",
  resolved: false,
};

export function useTrainingRendererMode(): TrainingRendererRequest {
  const [request, setRequest] =
    useState<TrainingRendererRequest>(INITIAL_REQUEST);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setRequest({
      requested:
        searchParams.get("trainingRenderer") === "dom" ? "dom" : "gpu",
      resolved: true,
    });
  }, []);

  return request;
}
