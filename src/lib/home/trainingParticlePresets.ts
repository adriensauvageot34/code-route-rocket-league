export type TrainingParticleKind =
  | "violet-dust"
  | "gold-dot"
  | "tactical-spark";

export type TrainingParticlePresetName = "far" | "mid" | "near";

export type TrainingParticle = {
  blur: number;
  driftX: number;
  durationMs: number;
  emissionLeadMs: number;
  glow: number;
  id: string;
  kind: TrainingParticleKind;
  opacity: number;
  rise: number;
  rotation: number;
  size: number;
  x: number;
  y: number;
};

type TrainingParticlePresetConfiguration = {
  blur: readonly [number, number];
  driftX: readonly [number, number];
  durationMs: readonly [number, number];
  glow: readonly [number, number];
  kinds: readonly TrainingParticleKind[];
  minSpacing: readonly [number, number];
  opacity: readonly [number, number];
  rise: readonly [number, number];
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
  far: 9,
  mid: 7,
  near: 4,
} as const;

export const TRAINING_PARTICLE_TYPE_COUNTS = {
  "violet-dust": 7,
  "gold-dot": 4,
  "tactical-spark": 9,
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
      "tactical-spark",
      "violet-dust",
      "gold-dot",
      "tactical-spark",
      "violet-dust",
      "tactical-spark",
      "gold-dot",
      "violet-dust",
      "tactical-spark",
    ],
    y: TRAINING_PARTICLE_VERTICAL_ZONES.far,
    size: [1.2, 2.2],
    opacity: [0.25, 0.42],
    durationMs: [650, 820],
    rise: [4, 7],
    driftX: [0.8, 2.2],
    blur: [0, 0.18],
    glow: [5, 8],
    minSpacing: [5.5, 2.3],
  },
  mid: {
    seed: TRAINING_PARTICLE_SEEDS.mid,
    kinds: [
      "violet-dust",
      "tactical-spark",
      "gold-dot",
      "tactical-spark",
      "violet-dust",
      "tactical-spark",
      "gold-dot",
    ],
    y: TRAINING_PARTICLE_VERTICAL_ZONES.mid,
    size: [1.7, 3],
    opacity: [0.34, 0.54],
    durationMs: [720, 900],
    rise: [7, 11],
    driftX: [1.2, 3.2],
    blur: [0, 0.12],
    glow: [7, 11],
    minSpacing: [6.5, 3.4],
  },
  near: {
    seed: TRAINING_PARTICLE_SEEDS.near,
    kinds: [
      "tactical-spark",
      "violet-dust",
      "tactical-spark",
      "violet-dust",
    ],
    y: TRAINING_PARTICLE_VERTICAL_ZONES.near,
    size: [2.2, 4.2],
    opacity: [0.42, 0.64],
    durationMs: [800, 980],
    rise: [10, 15],
    driftX: [1.8, 4.2],
    blur: [0, 0.08],
    glow: [9, 14],
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
    y: 78,
    radiusX: 20,
    radiusY: 15,
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
  const expectedCount = TRAINING_PARTICLE_COUNTS[preset];
  let attempts = 0;
  let attemptsForParticle = 0;

  while (
    particles.length < expectedCount &&
    attempts < expectedCount * 100
  ) {
    attempts += 1;
    attemptsForParticle += 1;
    const index = particles.length;
    const slotProgress =
      (index + 0.5 + (random() - 0.5) * 0.44) / expectedCount;
    const recoveryShift =
      ((attemptsForParticle - 1) * 0.38196601125) % 1;
    const x = round(4 + ((slotProgress + recoveryShift) % 1) * 92);
    const y = round(interpolate(configuration.y, random()));
    const kind = configuration.kinds[index];

    if (
      isInsideExclusionZone(preset, x, y) ||
      isTooClose(particles, x, y, configuration.minSpacing) ||
      isGoldTooClose(particles, kind, x, y)
    ) {
      continue;
    }

    const direction = random() < 0.5 ? -1 : 1;

    const durationMs = Math.round(
      interpolate(configuration.durationMs, random()) + index * 3,
    );

    particles.push({
      id: `${preset}-${String(index + 1).padStart(2, "0")}`,
      kind,
      x,
      y,
      size: round(interpolate(configuration.size, random())),
      opacity: round(interpolate(configuration.opacity, random()), 3),
      durationMs,
      emissionLeadMs: Math.round(durationMs * 0.07),
      rise: round(interpolate(configuration.rise, random())),
      driftX: round(
        direction * interpolate(configuration.driftX, random()),
      ),
      rotation:
        kind === "tactical-spark"
          ? round(interpolate([-32, 32], random()))
          : round(interpolate([-8, 8], random())),
      blur: round(interpolate(configuration.blur, random())),
      glow: round(interpolate(configuration.glow, random())),
    });
    attemptsForParticle = 0;
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
