"use client";

import { useEffect, useState } from "react";
import { TRAINING_STATIC_FALLBACK_ASSETS } from "@/lib/home/trainingStaticFallbackAssets";

type TrainingStaticAssetResult = "ready" | "error";

type TrainingStaticAssetState = {
  hasError: boolean;
  status: "idle" | "loading" | "ready";
};

const TRAINING_STATIC_ASSET_URLS = TRAINING_STATIC_FALLBACK_ASSETS.map(
  (asset) => asset.path,
);
const trainingStaticAssetRegistry = new Map<
  string,
  Promise<TrainingStaticAssetResult>
>();

function prepareTrainingStaticAsset(url: string) {
  const cached = trainingStaticAssetRegistry.get(url);
  if (cached) return cached;

  const pending = new Promise<TrainingStaticAssetResult>((resolve) => {
    const image = new window.Image();
    let settled = false;

    function finish(result: TrainingStaticAssetResult) {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      resolve(result);
    }

    image.decoding = "async";
    image.onload = () => {
      if (typeof image.decode !== "function") {
        finish("ready");
        return;
      }

      void image.decode().then(
        () => finish("ready"),
        () => finish("error"),
      );
    };
    image.onerror = () => finish("error");
    image.src = url;
  });

  trainingStaticAssetRegistry.set(url, pending);
  return pending;
}

export function useTrainingStaticFallbackAssets(enabled: boolean) {
  const [state, setState] = useState<TrainingStaticAssetState>({
    hasError: false,
    status: "idle",
  });

  useEffect(() => {
    if (!enabled) {
      setState({ hasError: false, status: "idle" });
      return;
    }

    let current = true;
    setState({ hasError: false, status: "loading" });

    void Promise.all(
      TRAINING_STATIC_ASSET_URLS.map(prepareTrainingStaticAsset),
    ).then((results) => {
      if (!current) return;
      setState({
        hasError: results.includes("error"),
        status: "ready",
      });
    });

    return () => {
      current = false;
    };
  }, [enabled]);

  return state;
}
