"use client";

import { useLayoutEffect, useRef } from "react";
import {
  TrainingRadarClock,
  type TrainingRadarPassMode,
} from "@/lib/home/trainingRadarClock";

type UseTrainingRadarClockInput = {
  passKey: number;
  passMode: TrainingRadarPassMode;
  passStartedAtMs: number;
  running: boolean;
};

export function useTrainingRadarClock({
  passKey,
  passMode,
  passStartedAtMs,
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
      passStartedAtMs,
      running: true,
    });
  }, [passKey, passMode, passStartedAtMs, radarClock, running]);

  return radarClock;
}
