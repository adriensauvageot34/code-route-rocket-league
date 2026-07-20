"use client";

import {
  memo,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import {
  trainingParticlePresets,
  type TrainingParticle,
  type TrainingParticlePresetName,
} from "@/lib/home/trainingParticlePresets";
import {
  getTrainingRadarDelayForProgress,
  TRAINING_RADAR_SWEEP,
  type TrainingRadarDirection,
} from "@/lib/home/trainingRadarTargets";

type TrainingParticleFieldProps = {
  active: boolean;
  direction: TrainingRadarDirection;
  passKey: number;
  preset: TrainingParticlePresetName;
};

type TrainingParticlePass = {
  direction: TrainingRadarDirection;
  key: number;
};

type TrainingParticleStyle = CSSProperties & {
  "--particle-birth-flash-size": string;
  "--particle-blur": string;
  "--particle-delay": string;
  "--particle-drift-x": string;
  "--particle-drift-x-mid": string;
  "--particle-drift-x-soft": string;
  "--particle-duration": string;
  "--particle-fragment-drift-x": string;
  "--particle-fragment-drift-x-mid": string;
  "--particle-fragment-rise-end": string;
  "--particle-fragment-rise-mid": string;
  "--particle-fragment-size": string;
  "--particle-glow": string;
  "--particle-glow-soft": string;
  "--particle-kick-x": string;
  "--particle-kick-y": string;
  "--particle-opacity": string;
  "--particle-rise-end": string;
  "--particle-rise-mid": string;
  "--particle-rise-soft": string;
  "--particle-rotation": string;
  "--particle-size": string;
  "--particle-spark-height": string;
  "--particle-spark-width": string;
  "--particle-x": string;
  "--particle-y": string;
};

const TRAINING_SCENE_WIDTH = 1672;
const TRAINING_SCENE_HEIGHT = 941;
const TRAINING_RADAR_HORIZON_Y = 340;
const TRAINING_RADAR_CORE_TOP_X = 2;
const TRAINING_RADAR_CORE_BOTTOM_X = 238;

function getRadarCoreOffsetX(particle: TrainingParticle) {
  const logicalY = (particle.y / 100) * TRAINING_SCENE_HEIGHT;
  const verticalProgress = Math.min(
    1,
    Math.max(
      0,
      (logicalY - TRAINING_RADAR_HORIZON_Y) /
        (TRAINING_SCENE_HEIGHT - TRAINING_RADAR_HORIZON_Y),
    ),
  );

  return (
    TRAINING_RADAR_CORE_TOP_X +
    (TRAINING_RADAR_CORE_BOTTOM_X - TRAINING_RADAR_CORE_TOP_X) *
      verticalProgress
  );
}

function getParticleScanDelayMs(
  particle: TrainingParticle,
  direction: TrainingRadarDirection,
) {
  const logicalX = (particle.x / 100) * TRAINING_SCENE_WIDTH;
  const sweepDistance =
    TRAINING_RADAR_SWEEP.endX - TRAINING_RADAR_SWEEP.startX;
  const coreOffsetX = getRadarCoreOffsetX(particle);
  const sceneProgress =
    direction === "ltr"
      ? (logicalX - TRAINING_RADAR_SWEEP.startX - coreOffsetX) /
        sweepDistance
      : (logicalX - TRAINING_RADAR_SWEEP.startX + coreOffsetX) /
        sweepDistance;
  const progress = Math.min(1, Math.max(0, sceneProgress));
  const scanHitMs = getTrainingRadarDelayForProgress(progress, direction);

  return Math.max(0, scanHitMs);
}

function createParticleStyle(
  particle: TrainingParticle,
  direction: TrainingRadarDirection,
): TrainingParticleStyle {
  const trailDirection = direction === "ltr" ? -1 : 1;
  const directionalDriftX = particle.driftX * trailDirection;

  return {
    "--particle-x": `${particle.x}%`,
    "--particle-y": `${particle.y}%`,
    "--particle-size": `${particle.size}px`,
    "--particle-opacity": String(particle.opacity),
    "--particle-duration": `${particle.durationMs}ms`,
    "--particle-delay": `${getParticleScanDelayMs(particle, direction)}ms`,
    "--particle-drift-x": `${directionalDriftX.toFixed(2)}px`,
    "--particle-drift-x-mid": `${(directionalDriftX * 0.52).toFixed(2)}px`,
    "--particle-drift-x-soft": `${(directionalDriftX * 0.8).toFixed(2)}px`,
    "--particle-kick-x": `${(directionalDriftX * 0.28).toFixed(2)}px`,
    "--particle-kick-y": `${(particle.rise * -0.18).toFixed(2)}px`,
    "--particle-rise-mid": `${(particle.rise * -0.42).toFixed(2)}px`,
    "--particle-rise-soft": `${(particle.rise * -0.74).toFixed(2)}px`,
    "--particle-rise-end": `${-particle.rise}px`,
    "--particle-rotation": `${particle.rotation}deg`,
    "--particle-blur": `${particle.blur}px`,
    "--particle-glow": `${particle.glow}px`,
    "--particle-glow-soft": `${(particle.glow * 0.42).toFixed(2)}px`,
    "--particle-fragment-size": `${Math.max(1, particle.size * 0.35).toFixed(2)}px`,
    "--particle-fragment-drift-x": `${(directionalDriftX * 1.16).toFixed(2)}px`,
    "--particle-fragment-drift-x-mid": `${(directionalDriftX * 0.62).toFixed(2)}px`,
    "--particle-fragment-rise-mid": `${(particle.rise * -0.67).toFixed(2)}px`,
    "--particle-fragment-rise-end": `${(particle.rise * -1.28).toFixed(2)}px`,
    "--particle-spark-width": `${(particle.size * 1.9).toFixed(2)}px`,
    "--particle-spark-height": `${Math.max(1, particle.size * 0.32).toFixed(2)}px`,
    "--particle-birth-flash-size": `${Math.max(4, particle.size * 2.4).toFixed(2)}px`,
  };
}

type TrainingParticleSpriteProps = {
  direction: TrainingRadarDirection;
  index: number;
  particle: TrainingParticle;
};

const TrainingParticleSprite = memo(function TrainingParticleSprite({
  direction,
  index,
  particle,
}: TrainingParticleSpriteProps) {
  return (
    <span
      className="training-particle"
      data-particle-index={index + 1}
      data-particle-kind={particle.kind}
      style={createParticleStyle(particle, direction)}
    >
      <span className="training-particle-birth-flash" />
      <span className="training-particle-core" />
    </span>
  );
});

export const TrainingParticleField = memo(function TrainingParticleField({
  active,
  direction,
  passKey,
  preset,
}: TrainingParticleFieldProps) {
  const [passes, setPasses] = useState<TrainingParticlePass[]>([]);
  const displayedPasses =
    !active || passKey === 0
      ? []
      : passes.some((pass) => pass.key === passKey)
        ? passes
        : [...passes, { direction, key: passKey }].slice(-2);

  useEffect(() => {
    setPasses((current) => {
      if (!active || passKey === 0) return current.length === 0 ? current : [];
      if (current.some((pass) => pass.key === passKey)) return current;

      return [...current, { direction, key: passKey }].slice(-2);
    });
  }, [active, direction, passKey]);

  return (
    <div
      aria-hidden="true"
      className="training-particle-field"
      data-active={active ? "true" : "false"}
      data-particle-preset={preset}
    >
      {displayedPasses.map((pass) => (
        <div
          className="training-particle-band"
          data-particle-pass={pass.key}
          data-radar-direction={pass.direction}
          key={pass.key}
        >
          {trainingParticlePresets[preset].map((particle, index) => (
            <TrainingParticleSprite
              direction={pass.direction}
              index={index}
              key={`${pass.key}-${particle.id}`}
              particle={particle}
            />
          ))}
        </div>
      ))}
    </div>
  );
});
