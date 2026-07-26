export {
  getTrainingRadarTacticalState as getTrainingGpuTacticalState,
  getTrainingRadarTemporalSnapshot,
} from "@/lib/home/trainingRadarSnapshots";
export type {
  TrainingRadarTacticalPhase as TrainingGpuTacticalPhase,
  TrainingRadarTacticalState as TrainingGpuTacticalState,
  TrainingRadarTacticalSnapshot as TrainingGpuTacticalSnapshot,
} from "@/lib/home/trainingRadarSnapshots";

import {
  getTrainingRadarTemporalSnapshot,
  type TrainingRadarFrameState,
} from "@/lib/home/trainingRadarSnapshots";

export function getTrainingGpuTacticalSnapshot(
  frameState: TrainingRadarFrameState,
) {
  return getTrainingRadarTemporalSnapshot(frameState).tactical;
}
