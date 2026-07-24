import type { TrainingParticle } from "@/lib/home/trainingParticlePresets";
import {
  getTrainingRadarDelayForProgress,
  TRAINING_RADAR_SWEEP,
} from "@/lib/home/trainingRadarTargets";

const TRAINING_PARTICLE_SCENE_WIDTH = 1672;
const TRAINING_PARTICLE_SCENE_HEIGHT = 941;
const TRAINING_PARTICLE_RADAR_HORIZON_Y = 340;
const TRAINING_PARTICLE_RADAR_CORE_TOP_X = 2;
const TRAINING_PARTICLE_RADAR_CORE_BOTTOM_X = 238;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getTrainingParticleBirthDelayMs(
  particle: Pick<TrainingParticle, "x" | "y">,
) {
  const logicalX = (particle.x / 100) * TRAINING_PARTICLE_SCENE_WIDTH;
  const logicalY = (particle.y / 100) * TRAINING_PARTICLE_SCENE_HEIGHT;
  const verticalProgress = clamp(
    (logicalY - TRAINING_PARTICLE_RADAR_HORIZON_Y) /
      (TRAINING_PARTICLE_SCENE_HEIGHT - TRAINING_PARTICLE_RADAR_HORIZON_Y),
    0,
    1,
  );
  const coreOffsetX =
    TRAINING_PARTICLE_RADAR_CORE_TOP_X +
    (TRAINING_PARTICLE_RADAR_CORE_BOTTOM_X -
      TRAINING_PARTICLE_RADAR_CORE_TOP_X) *
      verticalProgress;
  const sceneProgress =
    (logicalX - TRAINING_RADAR_SWEEP.startX - coreOffsetX) /
    (TRAINING_RADAR_SWEEP.endX - TRAINING_RADAR_SWEEP.startX);

  return Math.max(
    0,
    getTrainingRadarDelayForProgress(clamp(sceneProgress, 0, 1)),
  );
}
