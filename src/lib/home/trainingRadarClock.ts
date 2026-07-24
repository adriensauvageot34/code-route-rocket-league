import { TRAINING_RADAR_TIMING } from "@/lib/home/trainingRadarTargets";

export type TrainingRadarPassMode = "volume" | "tactical";

export type TrainingRadarClockSnapshot = {
  passMode: TrainingRadarPassMode;
  passKey: number;
  passStartedAtMs: number;
  nowMs: number;
  elapsedMs: number;
  radarProgress: number;
  running: boolean;
  passDurationMs: number;
};

export type BeginTrainingRadarPassInput = {
  passMode: TrainingRadarPassMode;
  passKey: number;
  passStartedAtMs: number;
  running: boolean;
};

const INITIAL_PASS_MODE: TrainingRadarPassMode = "volume";

function getTrainingRadarPassDurationMs(passMode: TrainingRadarPassMode) {
  return (
    TRAINING_RADAR_TIMING.passDurationMs +
    (passMode === "tactical"
      ? TRAINING_RADAR_TIMING.tacticalHoldDurationMs
      : 0)
  );
}

export class TrainingRadarClock {
  private passKey = 0;
  private passMode: TrainingRadarPassMode = INITIAL_PASS_MODE;
  private passStartedAtMs = 0;
  private running = false;

  beginPass({
    passKey,
    passMode,
    passStartedAtMs,
    running,
  }: BeginTrainingRadarPassInput) {
    if (!running) {
      this.reset();
      return;
    }

    this.passKey = passKey;
    this.passMode = passMode;
    this.passStartedAtMs = passStartedAtMs;
    this.running = true;
  }

  sample(nowMs: number): TrainingRadarClockSnapshot {
    if (!this.running) {
      return {
        passMode: INITIAL_PASS_MODE,
        passKey: 0,
        passStartedAtMs: 0,
        nowMs: 0,
        elapsedMs: 0,
        radarProgress: 0,
        running: false,
        passDurationMs: TRAINING_RADAR_TIMING.passDurationMs,
      };
    }

    const safeNowMs = Number.isFinite(nowMs)
      ? nowMs
      : this.passStartedAtMs;
    const elapsedMs = Math.max(0, safeNowMs - this.passStartedAtMs);
    const radarProgress = Math.max(
      0,
      Math.min(
        1,
        (elapsedMs - TRAINING_RADAR_TIMING.entryDurationMs) /
          TRAINING_RADAR_TIMING.travelDurationMs,
      ),
    );

    return {
      passMode: this.passMode,
      passKey: this.passKey,
      passStartedAtMs: this.passStartedAtMs,
      nowMs: safeNowMs,
      elapsedMs,
      radarProgress,
      running: true,
      passDurationMs: getTrainingRadarPassDurationMs(this.passMode),
    };
  }

  reset() {
    this.passKey = 0;
    this.passMode = INITIAL_PASS_MODE;
    this.passStartedAtMs = 0;
    this.running = false;
  }
}
