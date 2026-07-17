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
  TRAINING_RADAR_SWEEP,
  TRAINING_RADAR_TIMING,
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
  const rawProgress =
    direction === "ltr"
      ? (logicalX - TRAINING_RADAR_SWEEP.startX - coreOffsetX) /
        sweepDistance
      : (TRAINING_RADAR_SWEEP.endX - logicalX - coreOffsetX) /
        sweepDistance;
  const progress = Math.min(1, Math.max(0, rawProgress));
  const scanHitMs =
    TRAINING_RADAR_TIMING.entryDurationMs +
    TRAINING_RADAR_TIMING.travelDurationMs * progress;

  return Math.max(
    0,
    Math.round(scanHitMs - particle.emissionLeadMs),
  );
}

function createParticleStyle(
  particle: TrainingParticle,
  direction: TrainingRadarDirection,
): TrainingParticleStyle {
  return {
    "--particle-x": `${particle.x}%`,
    "--particle-y": `${particle.y}%`,
    "--particle-size": `${particle.size}px`,
    "--particle-opacity": String(particle.opacity),
    "--particle-duration": `${particle.durationMs}ms`,
    "--particle-delay": `${getParticleScanDelayMs(particle, direction)}ms`,
    "--particle-drift-x": `${particle.driftX}px`,
    "--particle-drift-x-mid": `${(particle.driftX * 0.2).toFixed(2)}px`,
    "--particle-drift-x-soft": `${(particle.driftX * 0.62).toFixed(2)}px`,
    "--particle-rise-mid": `${(particle.rise * -0.22).toFixed(2)}px`,
    "--particle-rise-soft": `${(particle.rise * -0.64).toFixed(2)}px`,
    "--particle-rise-end": `${-particle.rise}px`,
    "--particle-rotation": `${particle.rotation}deg`,
    "--particle-blur": `${particle.blur}px`,
    "--particle-glow": `${particle.glow}px`,
    "--particle-glow-soft": `${(particle.glow * 0.42).toFixed(2)}px`,
    "--particle-fragment-size": `${Math.max(1, particle.size * 0.3).toFixed(2)}px`,
    "--particle-fragment-drift-x": `${(particle.driftX * -0.65).toFixed(2)}px`,
    "--particle-fragment-drift-x-mid": `${(particle.driftX * -0.31).toFixed(2)}px`,
    "--particle-fragment-rise-mid": `${(particle.rise * -0.67).toFixed(2)}px`,
    "--particle-fragment-rise-end": `${(particle.rise * -1.28).toFixed(2)}px`,
    "--particle-spark-width": `${(particle.size * 2.8).toFixed(2)}px`,
    "--particle-spark-height": `${Math.max(1, particle.size * 0.32).toFixed(2)}px`,
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

  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      if (!active || passKey === 0) {
        setPasses([]);
        return;
      }

      setPasses((current) => {
        if (current.some((pass) => pass.key === passKey)) return current;

        return [...current, { direction, key: passKey }].slice(-2);
      });
    }, 0);

    return () => window.clearTimeout(syncTimer);
  }, [active, direction, passKey]);

  return (
    <div
      aria-hidden="true"
      className="training-particle-field"
      data-active={active ? "true" : "false"}
      data-particle-preset={preset}
    >
      {passes.map((pass) => (
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
