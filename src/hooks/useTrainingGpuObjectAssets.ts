"use client";

import { useEffect, useRef, useState } from "react";
import {
  TRAINING_GPU_OBJECT_MANIFEST_URLS,
  type TrainingGpuPreparedObjectId,
} from "@/lib/home/gpu/trainingGpuObjectAssetCatalog";
import {
  TrainingGpuObjectAssetLoader,
  type TrainingGpuDecodedObjectAssetSet,
} from "@/lib/home/gpu/TrainingGpuObjectAssetLoader";

export type TrainingGpuObjectAssetLoadState = {
  status: "idle" | "loading" | "ready" | "error";
  objects: Partial<
    Record<TrainingGpuPreparedObjectId, TrainingGpuDecodedObjectAssetSet>
  >;
  error: Error | null;
};

function createIdleState(): TrainingGpuObjectAssetLoadState {
  return {
    status: "idle",
    objects: {},
    error: null,
  };
}

export function useTrainingGpuObjectAssets(enabled: boolean) {
  const loaderRef = useRef<TrainingGpuObjectAssetLoader | null>(null);
  const [state, setState] =
    useState<TrainingGpuObjectAssetLoadState>(createIdleState);

  if (loaderRef.current === null) {
    loaderRef.current = new TrainingGpuObjectAssetLoader();
  }

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    if (!enabled) {
      loader.clear();
      setState(createIdleState());
      return;
    }

    const abortController = new AbortController();
    let current = true;

    setState({
      status: "loading",
      objects: {},
      error: null,
    });

    const entries = Object.entries(TRAINING_GPU_OBJECT_MANIFEST_URLS) as [
      TrainingGpuPreparedObjectId,
      string,
    ][];

    void Promise.all(
      entries.map(async ([expectedObjectId, manifestUrl]) => {
        const assetSet = await loader.load(
          manifestUrl,
          abortController.signal,
        );
        if (assetSet.objectId !== expectedObjectId) {
          throw new Error(
            `Training GPU manifest objectId mismatch for ${manifestUrl}: expected ${expectedObjectId}, received ${assetSet.objectId}.`,
          );
        }
        return [expectedObjectId, assetSet] as const;
      }),
    )
      .then((loadedEntries) => {
        if (!current || abortController.signal.aborted) return;
        setState({
          status: "ready",
          objects: Object.fromEntries(loadedEntries),
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!current || abortController.signal.aborted) return;
        setState({
          status: "error",
          objects: {},
          error:
            error instanceof Error
              ? error
              : new Error("Unable to load Training GPU object assets."),
        });
      });

    return () => {
      current = false;
      abortController.abort();
      loader.clear();
    };
  }, [enabled]);

  return state;
}
