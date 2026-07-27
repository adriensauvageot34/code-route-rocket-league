"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  calculateTrainingParallaxSafety,
  homeSceneDepths,
  trainingParallaxSafetyDepths,
  type HomeSceneDepth,
} from "@/lib/home/homeSceneParallax";
import { setTrainingGpuParallaxSnapshot } from "@/lib/home/gpu/trainingGpuParallaxState";
import {
  getCenteredTrainingCameraSnapshot,
  type TrainingCameraApplyMetrics,
  type TrainingCameraFrameApplier,
} from "@/lib/home/trainingCamera";

type UseParallaxControllerOptions = {
  active: boolean;
  launching: boolean;
};

type CssWriteMetrics = {
  avoided: number;
  writes: number;
};

const HOME_SCENE_DEPTH_ENTRIES = Object.entries(
  homeSceneDepths,
) as [HomeSceneDepth, (typeof homeSceneDepths)[HomeSceneDepth]][];
const NEUTRAL_TRAINING_CAMERA_SNAPSHOT =
  getCenteredTrainingCameraSnapshot();

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

export function useParallaxController({
  active,
  launching,
}: UseParallaxControllerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const cssValueCacheRef = useRef(new Map<string, string>());
  const effectiveTranslationXRef = useRef<Record<string, number>>({});
  const effectiveScaleXRef = useRef<Record<string, number>>({});

  activeRef.current = active;

  const writeNeutralCameraVariables = useCallback(
    (): TrainingCameraApplyMetrics => {
      const container = containerRef.current;
      const cssMetrics: CssWriteMetrics = { avoided: 0, writes: 0 };
      let gpuUpdates = 0;
      let gpuUpdatesAvoided = 0;

      if (container) {
        for (const [name] of HOME_SCENE_DEPTH_ENTRIES) {
          writeCssValue(
            container,
            cssValueCacheRef.current,
            `--parallax-${name}-x`,
            "0px",
            cssMetrics,
          );
          writeCssValue(
            container,
            cssValueCacheRef.current,
            `--parallax-${name}-y`,
            "0px",
            cssMetrics,
          );
          writeCssValue(
            container,
            cssValueCacheRef.current,
            `--parallax-${name}-rotation`,
            "0deg",
            cssMetrics,
          );
        }
        writeCssValue(
          container,
          cssValueCacheRef.current,
          "--training-camera-scale",
          "1",
          cssMetrics,
        );
      }

      if (
        setTrainingGpuParallaxSnapshot(
          NEUTRAL_TRAINING_CAMERA_SNAPSHOT,
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
        cameraSnapshot: NEUTRAL_TRAINING_CAMERA_SNAPSHOT,
        cssWrites: cssMetrics.writes,
        cssWritesAvoided: cssMetrics.avoided,
        gpuUpdates,
        gpuUpdatesAvoided,
        missedFrames: 0,
      };
    },
    [],
  );

  const applyTrainingCameraSnapshot =
    useCallback<TrainingCameraFrameApplier>(
      (_temporalSnapshot) => writeNeutralCameraVariables(),
      [writeNeutralCameraVariables],
    );

  const resetToCenter = useCallback(
    (_durationMs = 200) => {
      writeNeutralCameraVariables();
      return Promise.resolve();
    },
    [writeNeutralCameraVariables],
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
        effectiveTranslationXRef.current[name] = 0;
        effectiveScaleXRef.current[name] = safety.scaleX;
        writeCssValue(
          container,
          cssValueCacheRef.current,
          `--parallax-${name}-scale-x`,
          safety.scaleX.toFixed(6),
          cssMetrics,
        );
      }
      writeNeutralCameraVariables();
    };

    updateSafety(container.clientWidth);
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) updateSafety(entry.contentRect.width);
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [writeNeutralCameraVariables]);

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
      const motionAvailable =
        activeRef.current &&
        documentVisible &&
        illustrationVisible &&
        !reducedMotionQuery.matches;
      container.dataset.motionActive = motionAvailable ? "true" : "false";
      if (!motionAvailable) writeNeutralCameraVariables();
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
      delete container.dataset.motionActive;
    };
  }, [active, writeNeutralCameraVariables]);

  useEffect(() => {
    writeNeutralCameraVariables();
  }, [active, launching, writeNeutralCameraVariables]);

  return {
    applyTrainingCameraSnapshot,
    containerRef,
    resetToCenter,
  };
}
