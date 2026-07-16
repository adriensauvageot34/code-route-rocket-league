import type { CSSProperties } from "react";
import {
  trainingParticlePresets,
  type TrainingParticleKind,
  type TrainingParticlePresetName,
} from "@/lib/home/trainingParticlePresets";

type TrainingParticleFieldProps = {
  preset: TrainingParticlePresetName;
};

type TrainingParticleStyle = CSSProperties & {
  "--particle-blur": string;
  "--particle-cross-size": string;
  "--particle-delay": string;
  "--particle-drift-x-1": string;
  "--particle-drift-x-2": string;
  "--particle-drift-x-3": string;
  "--particle-drift-y-1": string;
  "--particle-drift-y-2": string;
  "--particle-drift-y-3": string;
  "--particle-duration": string;
  "--particle-glow": string;
  "--particle-length": string;
  "--particle-opacity": string;
  "--particle-rotation": string;
  "--particle-thickness": string;
  "--particle-x": string;
  "--particle-y": string;
};

const particleGeometry = {
  "micro-dot": { cross: 1, length: 1, thickness: 1 },
  "tactical-spark": { cross: 1.3, length: 5.2, thickness: 0.42 },
  glint: { cross: 4.2, length: 2.4, thickness: 0.38 },
  "mesh-fragment": { cross: 2.8, length: 3.5, thickness: 0.45 },
  "data-pixel": { cross: 1.4, length: 1.8, thickness: 0.75 },
} as const satisfies Record<
  TrainingParticleKind,
  { cross: number; length: number; thickness: number }
>;

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
          const geometry = particleGeometry[particle.kind];
          const style: TrainingParticleStyle = {
            "--particle-x": `${particle.x}%`,
            "--particle-y": `${particle.y}%`,
            "--particle-length": `${(particle.size * geometry.length).toFixed(2)}px`,
            "--particle-thickness": `${Math.max(1, particle.size * geometry.thickness).toFixed(2)}px`,
            "--particle-cross-size": `${(particle.size * geometry.cross).toFixed(2)}px`,
            "--particle-opacity": String(particle.opacity),
            "--particle-duration": `${particle.duration}s`,
            "--particle-delay": `${particle.delay}s`,
            "--particle-drift-x-1": `${particle.driftX1}px`,
            "--particle-drift-y-1": `${particle.driftY1}px`,
            "--particle-drift-x-2": `${particle.driftX2}px`,
            "--particle-drift-y-2": `${particle.driftY2}px`,
            "--particle-drift-x-3": `${particle.driftX3}px`,
            "--particle-drift-y-3": `${particle.driftY3}px`,
            "--particle-rotation": `${particle.rotation}deg`,
            "--particle-blur": `${particle.blur}px`,
            "--particle-glow": `${particle.glow}px`,
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
