export {
  getTrainingRadarVolumeScanState as getTrainingGpuVolumeScanState,
  getTrainingRadarTemporalSnapshot,
} from "@/lib/home/trainingRadarSnapshots";
export type {
  TrainingRadarVolumeScanPhase as TrainingGpuVolumeScanPhase,
  TrainingRadarVolumeScanState as TrainingGpuVolumeScanState,
  TrainingRadarVolumeScanSnapshot as TrainingGpuVolumeScanSnapshot,
} from "@/lib/home/trainingRadarSnapshots";

import {
  getTrainingRadarTemporalSnapshot,
  type TrainingRadarFrameState,
} from "@/lib/home/trainingRadarSnapshots";

export function getTrainingGpuVolumeScanSnapshot(
  frameState: TrainingRadarFrameState,
) {
  return getTrainingRadarTemporalSnapshot(frameState).volume;
}
