import type { CSSProperties } from "react";
import {
  trainingParticlePresets,
  type TrainingParticlePresetName,
} from "@/lib/home/trainingParticlePresets";

type TrainingParticleFieldProps = {
  preset: TrainingParticlePresetName;
};

type TrainingParticleStyle = CSSProperties & {
  "--particle-blur": string;
  "--particle-delay": string;
  "--particle-drift-x-1": string;
  "--particle-drift-x-2": string;
  "--particle-drift-x-3": string;
  "--particle-drift-x-end": string;
  "--particle-drift-y-1": string;
  "--particle-drift-y-2": string;
  "--particle-drift-y-3": string;
  "--particle-duration": string;
  "--particle-glow": string;
  "--particle-opacity": string;
  "--particle-opacity-intro": string;
  "--particle-opacity-soft": string;
  "--particle-opacity-spark": string;
  "--particle-opacity-spark-low": string;
  "--particle-rotation": string;
  "--particle-rotation-end": string;
  "--particle-rotation-intro": string;
  "--particle-rotation-soft": string;
  "--particle-size": string;
  "--particle-spark-height": string;
  "--particle-spark-width": string;
  "--particle-x": string;
  "--particle-y": string;
};

export function TrainingParticleField({
  preset,
}: TrainingParticleFieldProps) {
  return (
    <div
      aria-hidden="true"
      className="training-particle-field"
      data-particle-preset={preset}
    >
      <div className="training-particle-band">
        {trainingParticlePresets[preset].map((particle, index) => {
          const style: TrainingParticleStyle = {
            "--particle-x": `${particle.x}%`,
            "--particle-y": `${particle.y}%`,
            "--particle-size": `${particle.size}px`,
            "--particle-opacity": String(particle.opacity),
            "--particle-duration": `${particle.duration}s`,
            "--particle-delay": `${particle.delay}s`,
            "--particle-drift-x-1": `${particle.driftX1}px`,
            "--particle-drift-y-1": `${particle.driftY1}px`,
            "--particle-drift-x-2": `${particle.driftX2}px`,
            "--particle-drift-y-2": `${particle.driftY2}px`,
            "--particle-drift-x-3": `${particle.driftX3}px`,
            "--particle-drift-x-end": `${(particle.driftX3 * 0.78).toFixed(2)}px`,
            "--particle-drift-y-3": `${particle.driftY3}px`,
            "--particle-rotation": `${particle.rotation}deg`,
            "--particle-rotation-intro": `${(particle.rotation * 0.28).toFixed(2)}deg`,
            "--particle-rotation-soft": `${(particle.rotation * -0.18).toFixed(2)}deg`,
            "--particle-rotation-end": `${(particle.rotation * 1.24).toFixed(2)}deg`,
            "--particle-blur": `${particle.blur}px`,
            "--particle-glow": `${particle.glow}px`,
            "--particle-opacity-intro": String((particle.opacity * 0.68).toFixed(3)),
            "--particle-opacity-soft": String((particle.opacity * 0.72).toFixed(3)),
            "--particle-opacity-spark": String((particle.opacity * 0.82).toFixed(3)),
            "--particle-opacity-spark-low": String((particle.opacity * 0.3).toFixed(3)),
            "--particle-spark-width": `${(particle.size * 3.2).toFixed(2)}px`,
            "--particle-spark-height": `${Math.max(1, particle.size * 0.42).toFixed(2)}px`,
          };

          return (
            <span
              className="training-particle"
              data-particle-index={index + 1}
              data-particle-kind={particle.kind}
              key={particle.id}
              style={style}
            >
              <span className="training-particle-core" />
            </span>
          );
        })}
      </div>
    </div>
  );
}
