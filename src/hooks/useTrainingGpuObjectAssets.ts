"use client";

import { useEffect, useRef, useState } from "react";
import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
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

export function useTrainingGpuObjectAssets(
  enabled: boolean,
  debugCollector: TrainingGpuDebugCollector | null = null,
) {
  const loaderRef = useRef<TrainingGpuObjectAssetLoader | null>(null);
  const debugCollectorRef = useRef(debugCollector);
  const [state, setState] =
    useState<TrainingGpuObjectAssetLoadState>(createIdleState);

  if (loaderRef.current === null) {
    loaderRef.current = new TrainingGpuObjectAssetLoader();
  }
  const loader = loaderRef.current;
  debugCollectorRef.current = debugCollector;

  useEffect(() => {
    loader.setDebugCollector(debugCollector);
    return () => {
      loader.setDebugCollector(null);
    };
  }, [debugCollector, loader]);

  useEffect(() => {

    if (!enabled) {
      loader.clear();
      debugCollectorRef.current?.setAssetStatus("idle");
      setState(createIdleState());
      return;
    }

    const abortController = new AbortController();
    let current = true;

    debugCollectorRef.current?.setAssetStatus("loading");
    setState({
      status: "loading",
      objects: {},
      error: null,
    });

    const entries = Object.entries(TRAINING_GPU_OBJECT_MANIFEST_URLS) as [
      TrainingGpuPreparedObjectId,
      string,
    ][];
    debugCollectorRef.current?.setExpectedManifests(entries.length);

    void Promise.allSettled(
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
      .then((results) => {
        if (!current || abortController.signal.aborted) return;
        const loadedEntries = results.flatMap((result) =>
          result.status === "fulfilled" ? [result.value] : [],
        );
        const firstFailure = results.find(
          (result) => result.status === "rejected",
        );
        const error =
          firstFailure?.status === "rejected"
            ? firstFailure.reason instanceof Error
              ? firstFailure.reason
              : new Error("Unable to load a Training GPU object asset set.")
            : null;
        debugCollectorRef.current?.setAssetStatus(
          error ? "error" : "ready",
        );
        setState({
          status: error ? "error" : "ready",
          objects: Object.fromEntries(loadedEntries),
          error,
        });
      })
      .catch((error: unknown) => {
        if (!current || abortController.signal.aborted) return;
        debugCollectorRef.current?.setAssetStatus("error");
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
  }, [enabled, loader]);

  return state;
}
