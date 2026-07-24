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
import { getTrainingParticleBirthDelayMs } from "@/lib/home/trainingParticleTiming";

type TrainingParticleFieldProps = {
  active: boolean;
  passKey: number;
  preset: TrainingParticlePresetName;
};

type TrainingParticlePass = {
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

function createParticleStyle(
  particle: TrainingParticle,
): TrainingParticleStyle {
  const directionalDriftX = particle.driftX * -1;

  return {
    "--particle-x": `${particle.x}%`,
    "--particle-y": `${particle.y}%`,
    "--particle-size": `${particle.size}px`,
    "--particle-opacity": String(particle.opacity),
    "--particle-duration": `${particle.durationMs}ms`,
    "--particle-delay": `${getTrainingParticleBirthDelayMs(particle)}ms`,
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
  index: number;
  particle: TrainingParticle;
};

const TrainingParticleSprite = memo(function TrainingParticleSprite({
  index,
  particle,
}: TrainingParticleSpriteProps) {
  return (
    <span
      className="training-particle"
      data-particle-index={index + 1}
      data-particle-kind={particle.kind}
      style={createParticleStyle(particle)}
    >
      <span className="training-particle-birth-flash" />
      <span className="training-particle-core" />
    </span>
  );
});

export const TrainingParticleField = memo(function TrainingParticleField({
  active,
  passKey,
  preset,
}: TrainingParticleFieldProps) {
  const [passes, setPasses] = useState<TrainingParticlePass[]>([]);
  const displayedPasses =
    !active || passKey === 0
      ? []
      : passes.some((pass) => pass.key === passKey)
        ? passes
        : [...passes, { key: passKey }].slice(-2);

  useEffect(() => {
    setPasses((current) => {
      if (!active || passKey === 0) return current.length === 0 ? current : [];
      if (current.some((pass) => pass.key === passKey)) return current;

      return [...current, { key: passKey }].slice(-2);
    });
  }, [active, passKey]);

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
          data-radar-direction="ltr"
          key={pass.key}
        >
          {trainingParticlePresets[preset].map((particle, index) => (
            <TrainingParticleSprite
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
