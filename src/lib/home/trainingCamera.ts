import {
  homeSceneDepths,
  type HomeSceneDepth,
} from "@/lib/home/homeSceneParallax";
import {
  trainingVolumeScanTargets,
} from "@/lib/home/trainingRadarTargets";
import type {
  TrainingRadarFrameState,
  TrainingRadarTemporalSnapshot,
} from "@/lib/home/trainingRadarSnapshots";

export type TrainingCameraPhase =
  | "neutral"
  | "volume"
  | "contact"
  | "tactical"
  | "launch"
  | "recentering";

export type TrainingCameraPoint = {
  x: number;
  y: number;
};

export type TrainingCameraVector = TrainingCameraPoint & {
  scale: number;
};

export type TrainingCameraProfile =
  | "sky"
  | "skyline"
  | "architecture-mid"
  | "architecture-near"
  | "ground"
  | "particles-far"
  | "particles-mid"
  | "particles-near"
  | "objects"
  | "ball"
  | "fennec";

export type TrainingCameraSnapshot = TrainingCameraVector & {
  contactCount: number;
  depthPoints: Readonly<Record<HomeSceneDepth, TrainingCameraPoint>>;
  phase: TrainingCameraPhase;
  profilePoints: Readonly<
    Record<TrainingCameraProfile, TrainingCameraPoint>
  >;
  progress: number;
  sourceEvent: string;
  stabilized: boolean;
  startedAtMs: number;
  targetScale: number;
  targetX: number;
  targetY: number;
};

export type TrainingCameraApplyMetrics = {
  absoluteResumeCorrect: boolean;
  cameraSnapshot: TrainingCameraSnapshot;
  cssWrites: number;
  cssWritesAvoided: number;
  gpuUpdates: number;
  gpuUpdatesAvoided: number;
  missedFrames: number;
};

export type TrainingCameraFrameApplier = (
  snapshot: TrainingRadarTemporalSnapshot,
) => TrainingCameraApplyMetrics;

type TrainingCameraContactId =
  (typeof trainingVolumeScanTargets)[number]["id"];

type TrainingCameraSpringSample = {
  position: number;
  progress: number;
  stabilized: boolean;
  velocity: number;
};

const TRAINING_CAMERA_NEUTRAL: TrainingCameraVector = {
  x: 0,
  y: 0,
  scale: 1,
};

const TRAINING_CAMERA_TARGETS = {
  volume: {
    x: -0.12,
    y: 0.015,
    scale: 1.004,
  },
  tactical: {
    x: 0.1,
    y: -0.01,
    scale: 1.01,
  },
} as const satisfies Record<
  TrainingRadarFrameState["passMode"],
  TrainingCameraVector
>;

export const TRAINING_CAMERA_MAX_SCALE = 1.012;
export const TRAINING_CAMERA_CONTACT_DURATION_MS = 200;

export const TRAINING_CAMERA_PROFILE_SETTLE_MS = {
  sky: 900,
  skyline: 700,
  "architecture-mid": 520,
  "architecture-near": 420,
  ground: 650,
  "particles-far": 650,
  "particles-mid": 480,
  "particles-near": 320,
  objects: 460,
  ball: 420,
  fennec: 600,
} as const satisfies Record<TrainingCameraProfile, number>;

export const TRAINING_CAMERA_PROFILES = [
  "sky",
  "skyline",
  "architecture-mid",
  "architecture-near",
  "ground",
  "particles-far",
  "particles-mid",
  "particles-near",
  "objects",
  "ball",
  "fennec",
] as const satisfies readonly TrainingCameraProfile[];

export const TRAINING_CAMERA_DEPTHS = Object.keys(
  homeSceneDepths,
) as HomeSceneDepth[];

export const TRAINING_CAMERA_DEPTH_PROFILES = {
  background: "sky",
  distant: "skyline",
  focal: "objects",
  fennec: "fennec",
  foreground: "particles-near",
  trainingSky: "sky",
  trainingSkyline: "skyline",
  trainingMid: "architecture-mid",
  trainingNear: "architecture-near",
  trainingGround: "ground",
  trainingParticlesFar: "particles-far",
  trainingParticlesMid: "particles-mid",
  trainingParticlesNear: "particles-near",
  trainingCarFar: "objects",
  trainingCarMid: "objects",
  trainingCarNear: "objects",
  trainingBall: "ball",
  trainingFennec: "fennec",
} as const satisfies Record<HomeSceneDepth, TrainingCameraProfile>;

const TRAINING_CAMERA_PROFILE_CONTACT_RESPONSE = {
  sky: 0.12,
  skyline: 0.24,
  "architecture-mid": 0.48,
  "architecture-near": 0.64,
  ground: 0.36,
  "particles-far": 0.32,
  "particles-mid": 0.62,
  "particles-near": 1,
  objects: 0.72,
  ball: 0.78,
  fennec: 0.58,
} as const satisfies Record<TrainingCameraProfile, number>;

const TRAINING_CAMERA_CONTACT_IMPULSES = {
  "left-car": { x: 0.012, y: -0.002 },
  ball: { x: -0.01, y: -0.003 },
  fennec: { x: 0.008, y: 0.002 },
  "back-right-car": { x: -0.014, y: -0.001 },
  "front-right-car": { x: 0.011, y: 0.001 },
} as const satisfies Record<TrainingCameraContactId, TrainingCameraPoint>;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function cameraSpringOmega(settleMs: number) {
  return 6 / Math.max(0.001, settleMs / 1000);
}

export function sampleTrainingCameraSpring(
  from: number,
  initialVelocity: number,
  target: number,
  elapsedMs: number,
  settleMs: number,
): TrainingCameraSpringSample {
  if (elapsedMs <= 0) {
    return {
      position: from,
      progress: 0,
      stabilized: false,
      velocity: initialVelocity,
    };
  }
  if (elapsedMs >= settleMs) {
    return {
      position: target,
      progress: 1,
      stabilized: true,
      velocity: 0,
    };
  }

  const elapsedSeconds = elapsedMs / 1000;
  const omega = cameraSpringOmega(settleMs);
  const displacement = from - target;
  const coefficient = initialVelocity + omega * displacement;
  const decay = Math.exp(-omega * elapsedSeconds);
  const position =
    target +
    (displacement + coefficient * elapsedSeconds) * decay;
  const velocity =
    (initialVelocity -
      omega * coefficient * elapsedSeconds) *
    decay;

  return {
    position,
    progress: clamp01(1 - Math.abs(position - target) / Math.max(0.0001, Math.abs(displacement))),
    stabilized: false,
    velocity,
  };
}

function sampleVector(
  from: TrainingCameraVector,
  target: TrainingCameraVector,
  elapsedMs: number,
  settleMs: number,
): TrainingCameraVector & {
  progress: number;
  stabilized: boolean;
} {
  const x = sampleTrainingCameraSpring(
    from.x,
    0,
    target.x,
    elapsedMs,
    settleMs,
  );
  const y = sampleTrainingCameraSpring(
    from.y,
    0,
    target.y,
    elapsedMs,
    settleMs,
  );
  const scale = sampleTrainingCameraSpring(
    from.scale,
    0,
    target.scale,
    elapsedMs,
    settleMs,
  );

  return {
    x: x.position,
    y: y.position,
    scale: scale.position,
    progress: Math.min(x.progress, y.progress, scale.progress),
    stabilized: x.stabilized && y.stabilized && scale.stabilized,
  };
}

function getPreviousPassTarget(
  frameState: TrainingRadarFrameState,
): TrainingCameraVector {
  if (frameState.passKey <= 1) return TRAINING_CAMERA_NEUTRAL;
  return frameState.passMode === "volume"
    ? TRAINING_CAMERA_TARGETS.tactical
    : TRAINING_CAMERA_TARGETS.volume;
}

function contactDelayMs(
  frameState: TrainingRadarFrameState,
  target: (typeof trainingVolumeScanTargets)[number],
) {
  return frameState.passMode === "volume"
    ? target.scanDelayMs
    : target.tacticalDelayMs;
}

function getContactState(frameState: TrainingRadarFrameState) {
  let activeContact:
    | {
        id: TrainingCameraContactId;
        progress: number;
        startedAtMs: number;
      }
    | undefined;
  let contactCount = 0;

  for (const target of trainingVolumeScanTargets) {
    const delayMs = contactDelayMs(frameState, target);
    if (frameState.elapsedMs >= delayMs) contactCount += 1;
    const contactElapsedMs = frameState.elapsedMs - delayMs;
    if (
      contactElapsedMs >= 0 &&
      contactElapsedMs <= TRAINING_CAMERA_CONTACT_DURATION_MS
    ) {
      activeContact = {
        id: target.id,
        progress: clamp01(
          contactElapsedMs / TRAINING_CAMERA_CONTACT_DURATION_MS,
        ),
        startedAtMs: frameState.passStartedAtMs + delayMs,
      };
    }
  }

  return { activeContact, contactCount };
}

function contactEnvelope(progress: number) {
  const clamped = clamp01(progress);
  return 4 * clamped * (1 - clamped);
}

function centeredDepthPoints() {
  const points = {} as Record<HomeSceneDepth, TrainingCameraPoint>;
  for (const depth of TRAINING_CAMERA_DEPTHS) {
    points[depth] = { x: 0, y: 0 };
  }
  return points;
}

function centeredProfilePoints() {
  const points = {} as Record<
    TrainingCameraProfile,
    TrainingCameraPoint
  >;
  for (const profile of TRAINING_CAMERA_PROFILES) {
    points[profile] = { x: 0, y: 0 };
  }
  return points;
}

export function getCenteredTrainingCameraSnapshot(
  phase: "neutral" | "launch" | "recentering" = "neutral",
): TrainingCameraSnapshot {
  const scale = phase === "launch" ? TRAINING_CAMERA_MAX_SCALE : 1;
  return {
    x: 0,
    y: 0,
    scale,
    contactCount: 0,
    depthPoints: centeredDepthPoints(),
    phase,
    profilePoints: centeredProfilePoints(),
    progress: 1,
    sourceEvent:
      phase === "launch"
        ? "session-launch"
        : phase === "recentering"
          ? "reset-to-center"
          : "neutral",
    stabilized: true,
    startedAtMs: 0,
    targetScale: scale,
    targetX: 0,
    targetY: 0,
  };
}

export function getTrainingCameraSnapshot(
  frameState: TrainingRadarFrameState,
  options: {
    active: boolean;
    launching: boolean;
    reducedMotion: boolean;
  },
): TrainingCameraSnapshot {
  if (options.reducedMotion || !options.active) {
    return getCenteredTrainingCameraSnapshot();
  }
  if (options.launching) {
    return getCenteredTrainingCameraSnapshot("launch");
  }
  if (!frameState.running) {
    return getCenteredTrainingCameraSnapshot();
  }

  const target = TRAINING_CAMERA_TARGETS[frameState.passMode];
  const from = getPreviousPassTarget(frameState);
  const { activeContact, contactCount } =
    getContactState(frameState);
  const envelope = activeContact
    ? contactEnvelope(activeContact.progress)
    : 0;
  const impulse = activeContact
    ? TRAINING_CAMERA_CONTACT_IMPULSES[activeContact.id]
    : TRAINING_CAMERA_NEUTRAL;
  const profilePoints = {} as Record<
    TrainingCameraProfile,
    TrainingCameraPoint
  >;
  let allProfilesStabilized = true;

  for (const profile of TRAINING_CAMERA_PROFILES) {
    const sample = sampleVector(
      from,
      target,
      frameState.elapsedMs,
      TRAINING_CAMERA_PROFILE_SETTLE_MS[profile],
    );
    const contactResponse =
      TRAINING_CAMERA_PROFILE_CONTACT_RESPONSE[profile];
    profilePoints[profile] = {
      x: sample.x + impulse.x * envelope * contactResponse,
      y: sample.y + impulse.y * envelope * contactResponse,
    };
    allProfilesStabilized =
      allProfilesStabilized && sample.stabilized;
  }

  const depthPoints = {} as Record<
    HomeSceneDepth,
    TrainingCameraPoint
  >;
  for (const depth of TRAINING_CAMERA_DEPTHS) {
    depthPoints[depth] =
      profilePoints[TRAINING_CAMERA_DEPTH_PROFILES[depth]];
  }

  const globalSample = sampleVector(
    from,
    target,
    frameState.elapsedMs,
    TRAINING_CAMERA_PROFILE_SETTLE_MS["architecture-mid"],
  );
  const contactScale = activeContact ? 0.0012 * envelope : 0;
  const sourceEvent = activeContact
    ? `${frameState.passMode}-contact:${activeContact.id}`
    : `${frameState.passMode}-pass`;

  return {
    x: globalSample.x + impulse.x * envelope * 0.5,
    y: globalSample.y + impulse.y * envelope * 0.5,
    scale: Math.min(
      TRAINING_CAMERA_MAX_SCALE,
      globalSample.scale + contactScale,
    ),
    contactCount,
    depthPoints,
    phase: activeContact ? "contact" : frameState.passMode,
    profilePoints,
    progress: activeContact
      ? activeContact.progress
      : globalSample.progress,
    sourceEvent,
    stabilized:
      allProfilesStabilized && activeContact === undefined,
    startedAtMs:
      activeContact?.startedAtMs ?? frameState.passStartedAtMs,
    targetScale: Math.min(
      TRAINING_CAMERA_MAX_SCALE,
      target.scale + (activeContact ? 0.0012 : 0),
    ),
    targetX: target.x + impulse.x * envelope * 0.5,
    targetY: target.y + impulse.y * envelope * 0.5,
  };
}
