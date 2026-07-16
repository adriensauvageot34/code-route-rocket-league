export type TrainingParticleKind =
  | "micro-dot"
  | "tactical-spark"
  | "glint"
  | "mesh-fragment"
  | "data-pixel";

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
  far: 14,
  mid: 12,
  near: 8,
} as const;

export const TRAINING_PARTICLE_TYPE_COUNTS = {
  "micro-dot": 14,
  "data-pixel": 6,
  "mesh-fragment": 6,
  "tactical-spark": 5,
  glint: 3,
} as const;

export const TRAINING_PARTICLE_KIND_PATTERNS = {
  far: [
    "micro-dot",
    "data-pixel",
    "micro-dot",
    "mesh-fragment",
    "micro-dot",
    "tactical-spark",
    "micro-dot",
    "glint",
    "micro-dot",
    "data-pixel",
    "micro-dot",
    "mesh-fragment",
    "micro-dot",
    "tactical-spark",
  ],
  mid: [
    "micro-dot",
    "mesh-fragment",
    "data-pixel",
    "micro-dot",
    "tactical-spark",
    "micro-dot",
    "glint",
    "micro-dot",
    "mesh-fragment",
    "data-pixel",
    "micro-dot",
    "tactical-spark",
  ],
  near: [
    "micro-dot",
    "data-pixel",
    "mesh-fragment",
    "tactical-spark",
    "micro-dot",
    "data-pixel",
    "mesh-fragment",
    "glint",
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
    size: [0.8, 1.2],
    opacity: [0.16, 0.26],
    duration: [6.8, 10.4],
    driftX: 3,
    driftY: 2,
    blur: [0, 0.03],
    glow: [2.5, 4.5],
    minSpacing: [5.5, 2.2],
  },
  mid: {
    seed: TRAINING_PARTICLE_SEEDS.mid,
    horizontalBands: TRAINING_PARTICLE_HORIZONTAL_BANDS.mid,
    kindPattern: TRAINING_PARTICLE_KIND_PATTERNS.mid,
    y: TRAINING_PARTICLE_VERTICAL_ZONES.mid,
    size: [0.95, 1.45],
    opacity: [0.22, 0.36],
    duration: [6.1, 9.5],
    driftX: 5,
    driftY: 3.5,
    blur: [0, 0.02],
    glow: [3.5, 6],
    minSpacing: [6.5, 3],
  },
  near: {
    seed: TRAINING_PARTICLE_SEEDS.near,
    horizontalBands: TRAINING_PARTICLE_HORIZONTAL_BANDS.near,
    kindPattern: TRAINING_PARTICLE_KIND_PATTERNS.near,
    y: TRAINING_PARTICLE_VERTICAL_ZONES.near,
    size: [1.1, 1.7],
    opacity: [0.26, 0.44],
    duration: [5.6, 8.8],
    driftX: 8,
    driftY: 5.5,
    blur: [0, 0.02],
    glow: [4.5, 7.5],
    minSpacing: [7, 4],
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

function isGlintTooClose(
  particles: readonly TrainingParticle[],
  kind: TrainingParticleKind,
  x: number,
  y: number,
) {
  if (kind !== "glint") return false;

  return particles.some(
    (particle) =>
      particle.kind === "glint" &&
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
      isGlintTooClose(particles, kind, x, y)
    ) {
      continue;
    }

    const direction = random() < 0.5 ? -1 : 1;
    const duration =
      interpolate(configuration.duration, random()) + index * 0.025;

    particles.push({
      id: `${preset}-${String(index + 1).padStart(2, "0")}`,
      kind,
      x,
      y,
      size: round(interpolate(configuration.size, random())),
      opacity: round(interpolate(configuration.opacity, random()), 3),
      duration: round(duration),
      delay: round(
        -duration * ((index + random() * 0.35) / expectedCount),
      ),
      driftX1: round(
        direction * configuration.driftX * interpolate([0.12, 0.3], random()),
      ),
      driftY1: round(
        -configuration.driftY * interpolate([0.08, 0.2], random()),
      ),
      driftX2: round(
        direction * configuration.driftX * interpolate([0.3, 0.58], random()),
      ),
      driftY2: round(
        -configuration.driftY * interpolate([0.18, 0.4], random()),
      ),
      driftX3: round(
        direction * configuration.driftX * interpolate([0.55, 0.92], random()),
      ),
      driftY3: round(
        -configuration.driftY * interpolate([0.35, 0.8], random()),
      ),
      rotation:
        kind === "mesh-fragment"
          ? round(interpolate([-35, 35], random()))
          : kind === "tactical-spark"
            ? round(interpolate([-24, 24], random()))
            : kind === "data-pixel"
              ? round(interpolate([-20, 20], random()))
              : round(interpolate([-8, 8], random())),
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
