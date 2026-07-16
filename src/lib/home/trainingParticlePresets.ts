export type TrainingParticleKind =
  | "metal-shard"
  | "micro-spark"
  | "neon-streak"
  | "hard-glint";

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
  horizontalBands: readonly (readonly [number, number])[];
  kindPattern: readonly TrainingParticleKind[];
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
  far: 28,
  mid: 24,
  near: 20,
} as const;

export const TRAINING_PARTICLE_TYPE_COUNTS = {
  "metal-shard": 27,
  "micro-spark": 18,
  "neon-streak": 18,
  "hard-glint": 9,
} as const;

export const TRAINING_PARTICLE_KIND_PATTERNS = {
  far: [
    "metal-shard",
    "micro-spark",
    "neon-streak",
    "metal-shard",
    "hard-glint",
    "micro-spark",
    "metal-shard",
    "neon-streak",
  ],
  mid: [
    "metal-shard",
    "micro-spark",
    "neon-streak",
    "hard-glint",
    "micro-spark",
    "metal-shard",
    "neon-streak",
    "metal-shard",
  ],
  near: [
    "neon-streak",
    "metal-shard",
    "micro-spark",
    "hard-glint",
    "metal-shard",
    "neon-streak",
    "micro-spark",
    "metal-shard",
  ],
} as const satisfies Record<
  TrainingParticlePresetName,
  readonly TrainingParticleKind[]
>;

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

export const TRAINING_PARTICLE_HORIZONTAL_BANDS = {
  far: [
    [6, 30],
    [35, 65],
    [70, 94],
  ],
  mid: [
    [6, 30],
    [35, 65],
    [70, 94],
  ],
  near: [
    [6, 30],
    [34, 54],
    [68, 94],
  ],
} as const;

const presetConfigurations = {
  far: {
    seed: TRAINING_PARTICLE_SEEDS.far,
    horizontalBands: TRAINING_PARTICLE_HORIZONTAL_BANDS.far,
    kindPattern: TRAINING_PARTICLE_KIND_PATTERNS.far,
    y: TRAINING_PARTICLE_VERTICAL_ZONES.far,
    size: [1.6, 2.8],
    opacity: [0.55, 0.8],
    duration: [9, 15],
    driftX: 7,
    driftY: 9,
    blur: [0, 0.18],
    glow: [7, 12],
    minSpacing: [3.4, 1.35],
  },
  mid: {
    seed: TRAINING_PARTICLE_SEEDS.mid,
    horizontalBands: TRAINING_PARTICLE_HORIZONTAL_BANDS.mid,
    kindPattern: TRAINING_PARTICLE_KIND_PATTERNS.mid,
    y: TRAINING_PARTICLE_VERTICAL_ZONES.mid,
    size: [2, 3.4],
    opacity: [0.62, 0.88],
    duration: [7, 12],
    driftX: 12,
    driftY: 16,
    blur: [0, 0.12],
    glow: [9, 15],
    minSpacing: [4.2, 2.2],
  },
  near: {
    seed: TRAINING_PARTICLE_SEEDS.near,
    horizontalBands: TRAINING_PARTICLE_HORIZONTAL_BANDS.near,
    kindPattern: TRAINING_PARTICLE_KIND_PATTERNS.near,
    y: TRAINING_PARTICLE_VERTICAL_ZONES.near,
    size: [2.4, 4.2],
    opacity: [0.68, 0.96],
    duration: [5.5, 9.5],
    driftX: 18,
    driftY: 23,
    blur: [0, 0.08],
    glow: [12, 19],
    minSpacing: [3.8, 2.6],
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
    y: 78,
    radiusX: 17,
    radiusY: 12,
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

    const normalizedX = (x - zone.x) / zone.radiusX;
    const normalizedY = (y - zone.y) / zone.radiusY;

    return normalizedX ** 2 + normalizedY ** 2 < 1;
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

function isHardGlintTooClose(
  particles: readonly TrainingParticle[],
  kind: TrainingParticleKind,
  x: number,
  y: number,
) {
  if (kind !== "hard-glint") return false;

  return particles.some(
    (particle) =>
      particle.kind === "hard-glint" &&
      Math.abs(particle.x - x) < 12 &&
      Math.abs(particle.y - y) < 5,
  );
}

function buildTrainingParticlePreset(
  preset: TrainingParticlePresetName,
  configuration: TrainingParticlePresetConfiguration,
) {
  const random = createSeededRandom(configuration.seed);
  const particles: TrainingParticle[] = [];
  const expectedCount = TRAINING_PARTICLE_COUNTS[preset];
  let attempts = 0;

  while (
    particles.length < expectedCount &&
    attempts < expectedCount * 100
  ) {
    attempts += 1;
    const index = particles.length;
    const horizontalBand =
      configuration.horizontalBands[
        index % configuration.horizontalBands.length
      ];
    const x = round(interpolate(horizontalBand, random()));
    const y = round(interpolate(configuration.y, random()));
    const kind =
      configuration.kindPattern[index % configuration.kindPattern.length];

    if (
      isInsideExclusionZone(preset, x, y) ||
      isTooClose(particles, x, y, configuration.minSpacing) ||
      isHardGlintTooClose(particles, kind, x, y)
    ) {
      continue;
    }

    const direction = random() < 0.5 ? -1 : 1;
    const speedMultiplier =
      kind === "micro-spark"
        ? 0.55
        : kind === "neon-streak"
          ? 0.68
          : kind === "hard-glint"
            ? 0.46
            : 1;
    const duration =
      interpolate(configuration.duration, random()) * speedMultiplier +
      index * 0.035;

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
        kind === "metal-shard"
          ? round(interpolate([-72, 72], random()))
          : kind === "neon-streak"
            ? round(interpolate([-34, 34], random()))
            : round(interpolate([-48, 48], random())),
      blur: round(interpolate(configuration.blur, random())),
      glow: round(interpolate(configuration.glow, random())),
    });
  }

  if (particles.length !== expectedCount) {
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
