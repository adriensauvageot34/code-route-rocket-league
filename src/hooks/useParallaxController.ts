"use client";

import { useCallback, useEffect, useRef } from "react";
import { homeSceneDepths } from "@/lib/home/homeSceneParallax";

type Point = {
  x: number;
  y: number;
};

type CenterReset = {
  durationMs: number;
  from: Point;
  resolve: () => void;
  startedAt: number;
};

type UseParallaxControllerOptions = {
  active: boolean;
};

const POINTER_IDLE_DELAY_MS = 1200;
const AUTO_DRIFT_X = 0.3;
const AUTO_DRIFT_Y = 0.22;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function writeParallaxVariables(element: HTMLElement, point: Point) {
  for (const [name, depth] of Object.entries(homeSceneDepths)) {
    element.style.setProperty(`--parallax-${name}-x`, `${(point.x * depth.translation).toFixed(3)}px`);
    element.style.setProperty(`--parallax-${name}-y`, `${(point.y * depth.translation).toFixed(3)}px`);
    element.style.setProperty(`--parallax-${name}-rotation`, `${(point.x * depth.rotation).toFixed(3)}deg`);
  }
}

export function useParallaxController({ active }: UseParallaxControllerOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<Point>({ x: 0, y: 0 });
  const resetRef = useRef<CenterReset | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationRunningRef = useRef(false);
  const centerLockedRef = useRef(false);

  const resetToCenter = useCallback((durationMs = 200) => {
    const container = containerRef.current;
    const safeDuration = Math.max(0, durationMs);
    centerLockedRef.current = true;

    if (!container || !animationRunningRef.current || safeDuration === 0) {
      currentRef.current = { x: 0, y: 0 };
      if (container) writeParallaxVariables(container, currentRef.current);
      return Promise.resolve();
    }

    resetRef.current?.resolve();

    return new Promise<void>((resolve) => {
      resetRef.current = {
        durationMs: safeDuration,
        from: { ...currentRef.current },
        resolve,
        startedAt: performance.now()
      };
    });
  }, []);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;
    const container: HTMLDivElement = currentContainer;

    writeParallaxVariables(container, { x: 0, y: 0 });
    if (!active) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const pointerTarget: Point = { x: 0, y: 0 };
    let pointerInside = false;
    let lastPointerAt = 0;
    let lastFrameAt = performance.now();

    function handlePointerMove(event: PointerEvent) {
      if (!finePointerQuery.matches || resetRef.current) return;

      const bounds = container.getBoundingClientRect();
      pointerTarget.x = clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
      pointerTarget.y = clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1);
      pointerInside = true;
      lastPointerAt = performance.now();
      centerLockedRef.current = false;
    }

    function handlePointerLeave() {
      pointerInside = false;
      lastPointerAt = 0;
    }

    function animate(timestamp: number) {
      const frameDuration = clamp(timestamp - lastFrameAt, 0, 64);
      const centerReset = resetRef.current;
      lastFrameAt = timestamp;

      if (centerReset) {
        const progress = clamp((timestamp - centerReset.startedAt) / centerReset.durationMs, 0, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        currentRef.current.x = centerReset.from.x * (1 - easedProgress);
        currentRef.current.y = centerReset.from.y * (1 - easedProgress);

        if (progress === 1) {
          currentRef.current = { x: 0, y: 0 };
          resetRef.current = null;
          centerReset.resolve();
        }
      } else if (centerLockedRef.current) {
        currentRef.current = { x: 0, y: 0 };
      } else {
        const pointerIsFresh =
          finePointerQuery.matches && pointerInside && timestamp - lastPointerAt < POINTER_IDLE_DELAY_MS;
        const targetX = pointerIsFresh ? pointerTarget.x : Math.sin(timestamp / 3200) * AUTO_DRIFT_X;
        const targetY = pointerIsFresh ? pointerTarget.y : Math.cos(timestamp / 3700) * AUTO_DRIFT_Y;
        const interpolation = 1 - Math.exp(-frameDuration / 190);

        currentRef.current.x += (targetX - currentRef.current.x) * interpolation;
        currentRef.current.y += (targetY - currentRef.current.y) * interpolation;
      }

      writeParallaxVariables(container, currentRef.current);
      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

    function stopAnimation() {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      animationRunningRef.current = false;
      const centerReset = resetRef.current;
      resetRef.current = null;
      centerReset?.resolve();
      currentRef.current = { x: 0, y: 0 };
      writeParallaxVariables(container, currentRef.current);
    }

    function startAnimation() {
      if (animationFrameRef.current !== null || reducedMotionQuery.matches) return;
      lastFrameAt = performance.now();
      animationRunningRef.current = true;
      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

    function handleMotionPreferenceChange() {
      if (reducedMotionQuery.matches) stopAnimation();
      else startAnimation();
    }

    if (finePointerQuery.matches) {
      container.addEventListener("pointermove", handlePointerMove, { passive: true });
      container.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    }
    reducedMotionQuery.addEventListener("change", handleMotionPreferenceChange);
    startAnimation();

    return () => {
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      reducedMotionQuery.removeEventListener("change", handleMotionPreferenceChange);
      stopAnimation();
      centerLockedRef.current = false;
    };
  }, [active]);

  return { containerRef, resetToCenter };
}
