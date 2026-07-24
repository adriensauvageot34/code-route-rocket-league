"use client";

import { useLayoutEffect, useRef } from "react";
import {
  TrainingRadarClock,
  type TrainingRadarPassMode,
} from "@/lib/home/trainingRadarClock";

type UseTrainingRadarClockInput = {
  passKey: number;
  passMode: TrainingRadarPassMode;
  running: boolean;
};

export function useTrainingRadarClock({
  passKey,
  passMode,
  running,
}: UseTrainingRadarClockInput) {
  const radarClockRef = useRef<TrainingRadarClock | null>(null);

  if (radarClockRef.current === null) {
    radarClockRef.current = new TrainingRadarClock();
  }

  const radarClock = radarClockRef.current;

  useLayoutEffect(() => {
    if (!running) {
      radarClock.reset();
      return;
    }

    radarClock.beginPass({
      passKey,
      passMode,
      passStartedAtMs: performance.now(),
      running: true,
    });
  }, [passKey, passMode, radarClock, running]);

  return radarClock;
}
