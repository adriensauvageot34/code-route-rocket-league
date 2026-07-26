"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  calculateTrainingParallaxSafety,
  homeSceneDepths,
  trainingParallaxSafetyDepths,
  type HomeSceneDepth,
} from "@/lib/home/homeSceneParallax";
import { setTrainingGpuParallaxSnapshot } from "@/lib/home/gpu/trainingGpuParallaxState";
import {
  getCenteredTrainingCameraSnapshot,
  getTrainingCameraSnapshot,
  sampleTrainingCameraSpring,
  TRAINING_CAMERA_PROFILES,
  TRAINING_CAMERA_DEPTH_PROFILES,
  type TrainingCameraApplyMetrics,
  type TrainingCameraFrameApplier,
  type TrainingCameraPoint,
  type TrainingCameraProfile,
  type TrainingCameraSnapshot,
} from "@/lib/home/trainingCamera";
import type { TrainingRadarTemporalSnapshot } from "@/lib/home/trainingRadarSnapshots";
import type { HomeModeId } from "@/types/home";

type CenterReset = {
  durationMs: number;
  from: TrainingCameraSnapshot;
  resolve: () => void;
  startedAtMs: number;
};

type UseParallaxControllerOptions = {
  active: boolean;
  launching: boolean;
  mode: HomeModeId;
};

type CssWriteMetrics = {
  avoided: number;
  writes: number;
};

const HOME_SCENE_DEPTH_ENTRIES = Object.entries(
  homeSceneDepths,
) as [HomeSceneDepth, (typeof homeSceneDepths)[HomeSceneDepth]][];

function writeCssValue(
  element: HTMLElement,
  cache: Map<string, string>,
  name: string,
  value: string,
  metrics: CssWriteMetrics,
) {
  if (cache.get(name) === value) {
    metrics.avoided += 1;
    return;
  }
  cache.set(name, value);
  element.style.setProperty(name, value);
  metrics.writes += 1;
}

function resetSnapshotAt(
  reset: CenterReset,
  nowMs: number,
): TrainingCameraSnapshot {
  const elapsedMs = Math.max(0, nowMs - reset.startedAtMs);
  const globalX = sampleTrainingCameraSpring(
    reset.from.x,
    0,
    0,
    elapsedMs,
    reset.durationMs,
  );
  const globalY = sampleTrainingCameraSpring(
    reset.from.y,
    0,
    0,
    elapsedMs,
    reset.durationMs,
  );
  const globalScale = sampleTrainingCameraSpring(
    reset.from.scale,
    0,
    1,
    elapsedMs,
    reset.durationMs,
  );
  const profilePoints = {} as Record<
    TrainingCameraProfile,
    TrainingCameraPoint
  >;
  const depthPoints = {} as Record<HomeSceneDepth, TrainingCameraPoint>;

  for (const profile of TRAINING_CAMERA_PROFILES) {
    const from = reset.from.profilePoints[profile];
    profilePoints[profile] = {
      x: sampleTrainingCameraSpring(
        from.x,
        0,
        0,
        elapsedMs,
        reset.durationMs,
      ).position,
      y: sampleTrainingCameraSpring(
        from.y,
        0,
        0,
        elapsedMs,
        reset.durationMs,
      ).position,
    };
  }
  for (const [depth] of HOME_SCENE_DEPTH_ENTRIES) {
    depthPoints[depth] =
      profilePoints[TRAINING_CAMERA_DEPTH_PROFILES[depth]];
  }

  const stabilized =
    globalX.stabilized &&
    globalY.stabilized &&
    globalScale.stabilized;
  return {
    x: globalX.position,
    y: globalY.position,
    scale: globalScale.position,
    contactCount: reset.from.contactCount,
    depthPoints,
    phase: "recentering",
    profilePoints,
    progress: Math.min(
      globalX.progress,
      globalY.progress,
      globalScale.progress,
    ),
    sourceEvent: "reset-to-center",
    stabilized,
    startedAtMs: reset.startedAtMs,
    targetScale: 1,
    targetX: 0,
    targetY: 0,
  };
}

export function useParallaxController({
  active,
  launching,
  mode,
}: UseParallaxControllerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const launchingRef = useRef(launching);
  const modeRef = useRef(mode);
  const reducedMotionRef = useRef(false);
  const cameraAvailableRef = useRef(active);
  const currentSnapshotRef = useRef<TrainingCameraSnapshot>(
    getCenteredTrainingCameraSnapshot(),
  );
  const resetRef = useRef<CenterReset | null>(null);
  const centerLockedRef = useRef(false);
  const lastSampleAtRef = useRef(0);
  const missedFramesRef = useRef(0);
  const cssValueCacheRef = useRef(new Map<string, string>());
  const effectiveTranslationXRef = useRef<Record<string, number>>({});
  const effectiveScaleXRef = useRef<Record<string, number>>({});

  useLayoutEffect(() => {
    activeRef.current = active;
    launchingRef.current = launching;
    modeRef.current = mode;
  }, [active, launching, mode]);

  const writeCameraVariables = useCallback(
    (snapshot: TrainingCameraSnapshot): TrainingCameraApplyMetrics => {
      const container = containerRef.current;
      const cssMetrics: CssWriteMetrics = { avoided: 0, writes: 0 };
      let gpuUpdates = 0;
      let gpuUpdatesAvoided = 0;

      currentSnapshotRef.current = snapshot;
      if (container) {
        for (const [name, depth] of HOME_SCENE_DEPTH_ENTRIES) {
          const point = snapshot.depthPoints[name];
          const translationX =
            effectiveTranslationXRef.current[name] ??
            depth.translationX;
          writeCssValue(
            container,
            cssValueCacheRef.current,
            `--parallax-${name}-x`,
            `${(point.x * translationX).toFixed(3)}px`,
            cssMetrics,
          );
          writeCssValue(
            container,
            cssValueCacheRef.current,
            `--parallax-${name}-y`,
            `${(point.y * depth.translationY).toFixed(3)}px`,
            cssMetrics,
          );
          writeCssValue(
            container,
            cssValueCacheRef.current,
            `--parallax-${name}-rotation`,
            `${(point.x * depth.rotation).toFixed(3)}deg`,
            cssMetrics,
          );
        }
        writeCssValue(
          container,
          cssValueCacheRef.current,
          "--training-camera-scale",
          snapshot.scale.toFixed(6),
          cssMetrics,
        );
      }

      if (
        setTrainingGpuParallaxSnapshot(
          snapshot,
          effectiveTranslationXRef.current,
          effectiveScaleXRef.current,
        )
      ) {
        gpuUpdates = 1;
      } else {
        gpuUpdatesAvoided = 1;
      }

      return {
        absoluteResumeCorrect: true,
        cameraSnapshot: snapshot,
        cssWrites: cssMetrics.writes,
        cssWritesAvoided: cssMetrics.avoided,
        gpuUpdates,
        gpuUpdatesAvoided,
        missedFrames: missedFramesRef.current,
      };
    },
    [],
  );

  const applyTrainingCameraSnapshot =
    useCallback<TrainingCameraFrameApplier>(
      (temporalSnapshot: TrainingRadarTemporalSnapshot) => {
        const nowMs =
          temporalSnapshot.frameState.nowMs > 0
            ? temporalSnapshot.frameState.nowMs
            : performance.now();
        if (
          lastSampleAtRef.current > 0 &&
          nowMs - lastSampleAtRef.current > 50
        ) {
          missedFramesRef.current += Math.max(
            1,
            Math.round((nowMs - lastSampleAtRef.current) / (1000 / 60)) -
              1,
          );
        }
        lastSampleAtRef.current = nowMs;

        let snapshot: TrainingCameraSnapshot;
        const reset = resetRef.current;
        if (
          modeRef.current !== "training" ||
          reducedMotionRef.current ||
          !cameraAvailableRef.current
        ) {
          snapshot = getCenteredTrainingCameraSnapshot();
        } else if (launchingRef.current) {
          snapshot = getCenteredTrainingCameraSnapshot("launch");
        } else if (reset) {
          snapshot = resetSnapshotAt(reset, nowMs);
        } else if (centerLockedRef.current) {
          snapshot = getCenteredTrainingCameraSnapshot("recentering");
        } else {
          snapshot = getTrainingCameraSnapshot(
            temporalSnapshot.frameState,
            {
              active: activeRef.current,
              launching: launchingRef.current,
              reducedMotion: reducedMotionRef.current,
            },
          );
        }

        const metrics = writeCameraVariables(snapshot);
        if (
          reset &&
          (snapshot.stabilized ||
            launchingRef.current ||
            !cameraAvailableRef.current)
        ) {
          resetRef.current = null;
          reset.resolve();
        }
        return metrics;
      },
      [writeCameraVariables],
    );

  const resetToCenter = useCallback(
    (durationMs = 200) => {
      const safeDuration = Math.max(0, durationMs);
      centerLockedRef.current = true;
      resetRef.current?.resolve();
      resetRef.current = null;

      if (
        modeRef.current !== "training" ||
        reducedMotionRef.current ||
        !cameraAvailableRef.current ||
        safeDuration === 0
      ) {
        writeCameraVariables(
          getCenteredTrainingCameraSnapshot("recentering"),
        );
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        resetRef.current = {
          durationMs: safeDuration,
          from: currentSnapshotRef.current,
          resolve,
          startedAtMs: performance.now(),
        };
      });
    },
    [writeCameraVariables],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSafety = (renderedContainerWidth: number) => {
      if (
        !Number.isFinite(renderedContainerWidth) ||
        renderedContainerWidth <= 0
      ) {
        return;
      }
      const cssMetrics: CssWriteMetrics = { avoided: 0, writes: 0 };
      for (const name of trainingParallaxSafetyDepths) {
        const safety = calculateTrainingParallaxSafety(
          renderedContainerWidth,
          homeSceneDepths[name].translationX,
        );
        effectiveTranslationXRef.current[name] =
          safety.translationX;
        effectiveScaleXRef.current[name] = safety.scaleX;
        writeCssValue(
          container,
          cssValueCacheRef.current,
          `--parallax-${name}-scale-x`,
          safety.scaleX.toFixed(6),
          cssMetrics,
        );
      }
      writeCameraVariables(currentSnapshotRef.current);
    };

    updateSafety(container.clientWidth);
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) updateSafety(entry.contentRect.width);
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [writeCameraVariables]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let documentVisible = document.visibilityState === "visible";
    let illustrationVisible = true;
    let intersectionObserver: IntersectionObserver | null = null;

    const syncAvailability = () => {
      reducedMotionRef.current = reducedMotionQuery.matches;
      cameraAvailableRef.current =
        activeRef.current &&
        documentVisible &&
        illustrationVisible &&
        !reducedMotionRef.current;
      container.dataset.motionActive = cameraAvailableRef.current
        ? "true"
        : "false";
      if (!cameraAvailableRef.current) {
        writeCameraVariables(getCenteredTrainingCameraSnapshot());
        resetRef.current?.resolve();
        resetRef.current = null;
      }
    };
    const handleVisibilityChange = () => {
      documentVisible = document.visibilityState === "visible";
      syncAvailability();
    };

    reducedMotionQuery.addEventListener("change", syncAvailability);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );
    if ("IntersectionObserver" in window) {
      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          illustrationVisible = entry?.isIntersecting ?? true;
          syncAvailability();
        },
        { rootMargin: "80px", threshold: 0.01 },
      );
      intersectionObserver.observe(container);
    }
    syncAvailability();

    return () => {
      reducedMotionQuery.removeEventListener(
        "change",
        syncAvailability,
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      intersectionObserver?.disconnect();
      resetRef.current?.resolve();
      resetRef.current = null;
      delete container.dataset.motionActive;
    };
  }, [active, writeCameraVariables]);

  useEffect(() => {
    if (active && !launching) {
      centerLockedRef.current = false;
    }
    if (launching) {
      writeCameraVariables(
        getCenteredTrainingCameraSnapshot(
          reducedMotionRef.current ? "neutral" : "launch",
        ),
      );
      resetRef.current?.resolve();
      resetRef.current = null;
    }
  }, [active, launching, writeCameraVariables]);

  return {
    applyTrainingCameraSnapshot,
    containerRef,
    resetToCenter,
  };
}
