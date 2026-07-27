"use client";

import { useEffect, useState } from "react";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
import {
  trainingBallRadarTarget,
  trainingCarRadarTargets,
  trainingFennecVolumeScanTarget,
} from "@/lib/home/trainingRadarTargets";

type TrainingDomAssetResult = "ready" | "error";

type TrainingDomCriticalAssetState = {
  hasError: boolean;
  status: "idle" | "loading" | "ready";
};

const assets = homeIllustrationAssets.training;
const TRAINING_DOM_CRITICAL_ASSET_URLS = Array.from(
  new Set([
    assets.tacticalTerrain.path,
    assets.fennecBase.path,
    trainingFennecVolumeScanTarget.surfaceAsset.path,
    trainingFennecVolumeScanTarget.contourAsset.path,
    trainingBallRadarTarget.baseAsset.path,
    trainingBallRadarTarget.surfaceAsset.path,
    trainingBallRadarTarget.contourAsset.path,
    ...trainingCarRadarTargets.flatMap((target) => [
      target.baseAsset.path,
      target.surfaceAsset.path,
      target.contourAsset.path,
    ]),
  ]),
);

const trainingDomAssetRegistry = new Map<
  string,
  Promise<TrainingDomAssetResult>
>();

function prepareTrainingDomAsset(url: string) {
  const cached = trainingDomAssetRegistry.get(url);
  if (cached) return cached;

  const pending = new Promise<TrainingDomAssetResult>((resolve) => {
    const image = new window.Image();
    let settled = false;

    function finish(result: TrainingDomAssetResult) {
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

  trainingDomAssetRegistry.set(url, pending);
  return pending;
}

export function useTrainingDomCriticalAssets(enabled: boolean) {
  const [state, setState] = useState<TrainingDomCriticalAssetState>({
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
      TRAINING_DOM_CRITICAL_ASSET_URLS.map(prepareTrainingDomAsset),
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
