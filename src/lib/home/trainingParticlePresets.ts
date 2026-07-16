export type TrainingParticleKind =
  | "violet-dust"
  | "gold-dot"
  | "tactical-spark";

export type TrainingParticlePresetName = "far" | "mid" | "near";

export type TrainingParticle = {
  blur: number;
  delay: number;
  driftX1: number;
  driftX2: number;
  driftX3: number;
  driftY1: number;
  driftY2: number;
  driftY3: number;
  duration: number;
  glow: number;
  id: string;
  kind: TrainingParticleKind;
  opacity: number;
  rotation: number;
  size: number;
  x: number;
  y: number;
};

type TrainingParticlePresetConfiguration = {
  blur: readonly [number, number];
  driftX: number;
  driftY: number;
  duration: readonly [number, number];
  glow: readonly [number, number];
  kinds: readonly TrainingParticleKind[];
  minSpacing: readonly [number, number];
  opacity: readonly [number, number];
  seed: number;
  size: readonly [number, number];
  y: readonly [number, number];
};

type ExclusionZone = {
  presets?: readonly TrainingParticlePresetName[];
  radiusX: number;
  radiusY: number;
  x: number;
  y: number;
};

export const TRAINING_PARTICLE_COUNTS = {
  far: 12,
  mid: 10,
  near: 6,
} as const;

export const TRAINING_PARTICLE_TYPE_COUNTS = {
  "violet-dust": 19,
  "gold-dot": 6,
  "tactical-spark": 3,
} as const;

export const TRAINING_PARTICLE_SEEDS = {
  far: 1107,
  mid: 2284,
  near: 3916,
} as const;

export const TRAINING_PARTICLE_VERTICAL_ZONES = {
  far: [43, 55],
  mid: [54, 76],
  near: [70, 97],
} as const;

const presetConfigurations = {
  far: {
    seed: TRAINING_PARTICLE_SEEDS.far,
    kinds: [
      "violet-dust",
      "gold-dot",
      "violet-dust",
      "violet-dust",
      "gold-dot",
      "violet-dust",
      "tactical-spark",
      "violet-dust",
      "gold-dot",
      "violet-dust",
      "violet-dust",
      "violet-dust",
    ],
    y: TRAINING_PARTICLE_VERTICAL_ZONES.far,
    size: [2, 3.4],
    opacity: [0.18, 0.34],
    duration: [15.2, 22.4],
    driftX: 4.5,
    driftY: 8.5,
    blur: [0.18, 0.5],
    glow: [4.2, 7],
    minSpacing: [5.5, 2.3],
  },
  mid: {
    seed: TRAINING_PARTICLE_SEEDS.mid,
    kinds: [
      "violet-dust",
      "gold-dot",
      "violet-dust",
      "violet-dust",
      "tactical-spark",
      "violet-dust",
      "gold-dot",
      "violet-dust",
      "violet-dust",
      "violet-dust",
    ],
    y: TRAINING_PARTICLE_VERTICAL_ZONES.mid,
    size: [2.8, 4.8],
    opacity: [0.26, 0.48],
    duration: [12.4, 18.8],
    driftX: 7.5,
    driftY: 13.5,
    blur: [0.05, 0.25],
    glow: [6, 10],
    minSpacing: [6.5, 3.4],
  },
  near: {
    seed: TRAINING_PARTICLE_SEEDS.near,
    kinds: [
      "violet-dust",
      "gold-dot",
      "violet-dust",
      "tactical-spark",
      "violet-dust",
      "violet-dust",
    ],
    y: TRAINING_PARTICLE_VERTICAL_ZONES.near,
    size: [4, 7],
    opacity: [0.34, 0.62],
    duration: [10.1, 15.9],
    driftX: 11.5,
    driftY: 19,
    blur: [0, 0.1],
    glow: [8, 13],
    minSpacing: [8, 5],
  },
} as const satisfies Record<
  TrainingParticlePresetName,
  TrainingParticlePresetConfiguration
>;

const exclusionZones: readonly ExclusionZone[] = [
  { x: 37.5, y: 46.5, radiusX: 7.5, radiusY: 5.2 },
  { x: 72, y: 45, radiusX: 6.5, radiusY: 5.4 },
  { x: 80, y: 49, radiusX: 9.5, radiusY: 7 },
  { x: 50.6, y: 56.2, radiusX: 9.5, radiusY: 9.5 },
  {
    x: 78,
    y: 80,
    radiusX: 24,
    radiusY: 20,
    presets: ["near"],
  },
];

function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function interpolate(range: readonly [number, number], progress: number) {
  return range[0] + (range[1] - range[0]) * progress;
}

function round(value: number, precision = 2) {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

function isInsideExclusionZone(
  preset: TrainingParticlePresetName,
  x: number,
  y: number,
) {
  return exclusionZones.some((zone) => {
    if (zone.presets && !zone.presets.includes(preset)) return false;

    return (
      Math.abs(x - zone.x) < zone.radiusX &&
      Math.abs(y - zone.y) < zone.radiusY
    );
  });
}

function isTooClose(
  particles: readonly TrainingParticle[],
  x: number,
  y: number,
  spacing: readonly [number, number],
) {
  return particles.some(
    (particle) =>
      Math.abs(particle.x - x) < spacing[0] &&
      Math.abs(particle.y - y) < spacing[1],
  );
}

function isGoldTooClose(
  particles: readonly TrainingParticle[],
  kind: TrainingParticleKind,
  x: number,
  y: number,
) {
  if (kind !== "gold-dot") return false;

  return particles.some(
    (particle) =>
      particle.kind === "gold-dot" &&
      Math.abs(particle.x - x) < 15 &&
      Math.abs(particle.y - y) < 6,
  );
}

function buildTrainingParticlePreset(
  preset: TrainingParticlePresetName,
  configuration: TrainingParticlePresetConfiguration,
) {
  const random = createSeededRandom(configuration.seed);
  const particles: TrainingParticle[] = [];
  let attempts = 0;

  while (
    particles.length < configuration.kinds.length &&
    attempts < configuration.kinds.length * 80
  ) {
    attempts += 1;
    const x = round(4 + random() * 92);
    const y = round(interpolate(configuration.y, random()));
    const kind = configuration.kinds[particles.length];

    if (
      isInsideExclusionZone(preset, x, y) ||
      isTooClose(particles, x, y, configuration.minSpacing) ||
      isGoldTooClose(particles, kind, x, y)
    ) {
      continue;
    }

    const index = particles.length;
    const direction = random() < 0.5 ? -1 : 1;
    const sparkSpeed = kind === "tactical-spark" ? 0.88 : 1;
    const duration =
      interpolate(configuration.duration, random()) * sparkSpeed + index * 0.07;

    particles.push({
      id: `${preset}-${String(index + 1).padStart(2, "0")}`,
      kind,
      x,
      y,
      size: round(interpolate(configuration.size, random())),
      opacity: round(interpolate(configuration.opacity, random()), 3),
      duration: round(duration),
      delay: round(-interpolate([0.9, duration * 0.94], random())),
      driftX1: round(
        direction * configuration.driftX * interpolate([0.24, 0.52], random()),
      ),
      driftY1: round(
        -configuration.driftY * interpolate([0.22, 0.42], random()),
      ),
      driftX2: round(
        -direction * configuration.driftX * interpolate([0.12, 0.44], random()),
      ),
      driftY2: round(
        -configuration.driftY * interpolate([0.5, 0.72], random()),
      ),
      driftX3: round(
        direction * configuration.driftX * interpolate([0.34, 0.96], random()),
      ),
      driftY3: round(
        -configuration.driftY * interpolate([0.82, 1], random()),
      ),
      rotation:
        kind === "tactical-spark"
          ? round(interpolate([-56, 56], random()))
          : round(interpolate([-8, 8], random())),
      blur: round(interpolate(configuration.blur, random())),
      glow: round(interpolate(configuration.glow, random())),
    });
  }

  if (particles.length !== configuration.kinds.length) {
    throw new Error(`Unable to build Training particle preset: ${preset}`);
  }

  return particles;
}

export const trainingParticlePresets = {
  far: buildTrainingParticlePreset("far", presetConfigurations.far),
  mid: buildTrainingParticlePreset("mid", presetConfigurations.mid),
  near: buildTrainingParticlePreset("near", presetConfigurations.near),
} as const satisfies Record<
  TrainingParticlePresetName,
  readonly TrainingParticle[]
>;
