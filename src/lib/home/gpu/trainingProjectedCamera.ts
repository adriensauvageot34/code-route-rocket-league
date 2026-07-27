import {
  TRAINING_GPU_LOGICAL_HEIGHT,
  TRAINING_GPU_LOGICAL_WIDTH,
} from "@/lib/home/gpu/trainingGpuConstants";
import type { TrainingGpuObjectRenderRect } from "@/lib/home/gpu/trainingGpuObjectTypes";

export type TrainingProjectedPoint = {
  x: number;
  y: number;
};

export type TrainingProjectedCameraState = {
  truckX: number;
  height: number;
  pitch: number;
  yaw: number;
  dolly: number;
  roll: number;
};

export type TrainingProjectionFrame = {
  width: number;
  height: number;
};

export type TrainingHomographyCoefficients = {
  xx: number;
  xy: number;
  x0: number;
  yx: number;
  yy: number;
  y0: number;
  wx: number;
  wy: number;
};

export type TrainingGroundProjection = {
  coefficients: TrainingHomographyCoefficients;
  cssMatrix: string;
  frame: TrainingProjectionFrame;
  identity: boolean;
  projectedCorners: readonly TrainingProjectedPoint[];
  projectPoint: (point: TrainingProjectedPoint) => TrainingProjectedPoint;
  getLocalScale: (point: TrainingProjectedPoint) => number;
};

export type TrainingProjectedCameraApi = {
  destroy: () => void;
  get: () => TrainingProjectedCameraState;
  projection: () => TrainingGroundProjection;
  reset: () => TrainingProjectedCameraState;
  set: (
    partial: Partial<TrainingProjectedCameraState>,
  ) => TrainingProjectedCameraState;
};

declare global {
  interface Window {
    RLGSProjectedCamera?: TrainingProjectedCameraApi;
  }
}

export const TRAINING_PROJECTED_CAMERA_NEUTRAL: TrainingProjectedCameraState = {
  truckX: 0,
  height: 1,
  pitch: 0,
  yaw: 0,
  dolly: 0,
  roll: 0,
};

export const TRAINING_PROJECTED_CAMERA_LIMITS = {
  truckX: { min: -1, max: 1 },
  height: { min: 0.45, max: 1.4 },
  pitch: { min: -1, max: 1 },
  yaw: { min: -1, max: 1 },
  dolly: { min: -0.35, max: 0.35 },
  roll: { min: -0.25, max: 0.25 },
} as const;

export const TRAINING_PROJECTED_CAMERA_IDENTITY_MATRIX =
  "matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)";

type TrainingProjectedCameraListener = (
  state: TrainingProjectedCameraState,
) => void;

const IDENTITY_COEFFICIENTS: TrainingHomographyCoefficients = {
  xx: 1,
  xy: 0,
  x0: 0,
  yx: 0,
  yy: 1,
  y0: 0,
  wx: 0,
  wy: 0,
};

let currentState: TrainingProjectedCameraState = {
  ...TRAINING_PROJECTED_CAMERA_NEUTRAL,
};
const listeners = new Set<TrainingProjectedCameraListener>();

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function safeCameraValue(
  value: number | undefined,
  fallback: number,
  limits: { min: number; max: number },
) {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, limits.min, limits.max)
    : fallback;
}

function normalizeCameraState(
  partial: Partial<TrainingProjectedCameraState>,
  fallback: TrainingProjectedCameraState,
): TrainingProjectedCameraState {
  return {
    truckX: safeCameraValue(
      partial.truckX,
      fallback.truckX,
      TRAINING_PROJECTED_CAMERA_LIMITS.truckX,
    ),
    height: safeCameraValue(
      partial.height,
      fallback.height,
      TRAINING_PROJECTED_CAMERA_LIMITS.height,
    ),
    pitch: safeCameraValue(
      partial.pitch,
      fallback.pitch,
      TRAINING_PROJECTED_CAMERA_LIMITS.pitch,
    ),
    yaw: safeCameraValue(
      partial.yaw,
      fallback.yaw,
      TRAINING_PROJECTED_CAMERA_LIMITS.yaw,
    ),
    dolly: safeCameraValue(
      partial.dolly,
      fallback.dolly,
      TRAINING_PROJECTED_CAMERA_LIMITS.dolly,
    ),
    roll: safeCameraValue(
      partial.roll,
      fallback.roll,
      TRAINING_PROJECTED_CAMERA_LIMITS.roll,
    ),
  };
}

function isNeutralState(state: TrainingProjectedCameraState) {
  return (
    state.truckX === TRAINING_PROJECTED_CAMERA_NEUTRAL.truckX &&
    state.height === TRAINING_PROJECTED_CAMERA_NEUTRAL.height &&
    state.pitch === TRAINING_PROJECTED_CAMERA_NEUTRAL.pitch &&
    state.yaw === TRAINING_PROJECTED_CAMERA_NEUTRAL.yaw &&
    state.dolly === TRAINING_PROJECTED_CAMERA_NEUTRAL.dolly &&
    state.roll === TRAINING_PROJECTED_CAMERA_NEUTRAL.roll
  );
}

function safeFrame(
  frame: TrainingProjectionFrame | undefined,
): TrainingProjectionFrame {
  return {
    width:
      frame && Number.isFinite(frame.width) && frame.width > 0
        ? frame.width
        : TRAINING_GPU_LOGICAL_WIDTH,
    height:
      frame && Number.isFinite(frame.height) && frame.height > 0
        ? frame.height
        : TRAINING_GPU_LOGICAL_HEIGHT,
  };
}

function rotatePoint(
  point: TrainingProjectedPoint,
  radians: number,
): TrainingProjectedPoint {
  if (radians === 0) return point;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const x = point.x - 0.5;
  const y = point.y - 0.5;
  return {
    x: 0.5 + x * cosine - y * sine,
    y: 0.5 + x * sine + y * cosine,
  };
}

function projectedUnitCorners(
  state: TrainingProjectedCameraState,
): readonly TrainingProjectedPoint[] {
  const loweredCamera = 1 - state.height;
  const farInset =
    loweredCamera * 0.08 + state.pitch * 0.065 + state.dolly * 0.035;
  const nearOutset =
    loweredCamera * 0.12 + state.pitch * 0.08 + state.dolly * 0.06;
  const horizonLift =
    loweredCamera * 0.05 + state.pitch * 0.06 + state.dolly * 0.025;
  const nearDrop =
    loweredCamera * 0.035 + state.pitch * 0.025 + state.dolly * 0.04;
  const truckShift = -state.truckX * 0.08;
  const yawShift = state.yaw * 0.06;
  const topCenterX = 0.5 + truckShift + yawShift;
  const bottomCenterX = 0.5 + truckShift + yawShift * 0.35;
  const topHalfWidth = 0.5 - farInset;
  const bottomHalfWidth = 0.5 + nearOutset;
  const rollRadians = state.roll * 0.08;

  return [
    rotatePoint(
      { x: topCenterX - topHalfWidth, y: -horizonLift },
      rollRadians,
    ),
    rotatePoint(
      { x: topCenterX + topHalfWidth, y: -horizonLift },
      rollRadians,
    ),
    rotatePoint(
      {
        x: bottomCenterX + bottomHalfWidth,
        y: 1 + nearDrop,
      },
      rollRadians,
    ),
    rotatePoint(
      {
        x: bottomCenterX - bottomHalfWidth,
        y: 1 + nearDrop,
      },
      rollRadians,
    ),
  ];
}

function solveLinearSystem(matrix: number[][], values: number[]) {
  const size = values.length;
  const augmented = matrix.map((row, index) => [
    ...row,
    values[index] ?? 0,
  ]);

  for (let column = 0; column < size; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < size; row += 1) {
      if (
        Math.abs(augmented[row]?.[column] ?? 0) >
        Math.abs(augmented[pivotRow]?.[column] ?? 0)
      ) {
        pivotRow = row;
      }
    }
    const pivot = augmented[pivotRow]?.[column] ?? 0;
    if (Math.abs(pivot) < 0.000000001) return null;
    [augmented[column], augmented[pivotRow]] = [
      augmented[pivotRow] ?? [],
      augmented[column] ?? [],
    ];

    for (let entry = column; entry <= size; entry += 1) {
      const value = augmented[column]?.[entry] ?? 0;
      if (augmented[column]) {
        augmented[column][entry] = value / pivot;
      }
    }

    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row]?.[column] ?? 0;
      for (let entry = column; entry <= size; entry += 1) {
        const rowValue = augmented[row]?.[entry] ?? 0;
        const pivotValue = augmented[column]?.[entry] ?? 0;
        if (augmented[row]) {
          augmented[row][entry] = rowValue - factor * pivotValue;
        }
      }
    }
  }

  return augmented.map((row) => row[size] ?? 0);
}

function solveUnitHomography(
  destination: readonly TrainingProjectedPoint[],
): TrainingHomographyCoefficients {
  const source = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ] as const;
  const matrix: number[][] = [];
  const values: number[] = [];

  for (let index = 0; index < source.length; index += 1) {
    const from = source[index];
    const to = destination[index];
    if (!from || !to) return { ...IDENTITY_COEFFICIENTS };
    matrix.push([
      from.x,
      from.y,
      1,
      0,
      0,
      0,
      -to.x * from.x,
      -to.x * from.y,
    ]);
    values.push(to.x);
    matrix.push([
      0,
      0,
      0,
      from.x,
      from.y,
      1,
      -to.y * from.x,
      -to.y * from.y,
    ]);
    values.push(to.y);
  }

  const solution = solveLinearSystem(matrix, values);
  if (!solution) return { ...IDENTITY_COEFFICIENTS };
  return {
    xx: solution[0] ?? 1,
    xy: solution[1] ?? 0,
    x0: solution[2] ?? 0,
    yx: solution[3] ?? 0,
    yy: solution[4] ?? 1,
    y0: solution[5] ?? 0,
    wx: solution[6] ?? 0,
    wy: solution[7] ?? 0,
  };
}

function coefficientsForFrame(
  normalized: TrainingHomographyCoefficients,
  frame: TrainingProjectionFrame,
): TrainingHomographyCoefficients {
  return {
    xx: normalized.xx,
    xy: normalized.xy * (frame.width / frame.height),
    x0: normalized.x0 * frame.width,
    yx: normalized.yx * (frame.height / frame.width),
    yy: normalized.yy,
    y0: normalized.y0 * frame.height,
    wx: normalized.wx / frame.width,
    wy: normalized.wy / frame.height,
  };
}

function formatMatrixValue(value: number) {
  if (Math.abs(value) < 0.000000000001) return "0";
  return String(Number(value.toFixed(12)));
}

function cssMatrixFromCoefficients(
  coefficients: TrainingHomographyCoefficients,
) {
  const values = [
    coefficients.xx,
    coefficients.yx,
    0,
    coefficients.wx,
    coefficients.xy,
    coefficients.yy,
    0,
    coefficients.wy,
    0,
    0,
    1,
    0,
    coefficients.x0,
    coefficients.y0,
    0,
    1,
  ];
  return "matrix3d(" + values.map(formatMatrixValue).join(", ") + ")";
}

function projectWithCoefficients(
  point: TrainingProjectedPoint,
  coefficients: TrainingHomographyCoefficients,
): TrainingProjectedPoint {
  const denominator =
    coefficients.wx * point.x + coefficients.wy * point.y + 1;
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 0.000001) {
    return { ...point };
  }
  return {
    x:
      (coefficients.xx * point.x +
        coefficients.xy * point.y +
        coefficients.x0) /
      denominator,
    y:
      (coefficients.yx * point.x +
        coefficients.yy * point.y +
        coefficients.y0) /
      denominator,
  };
}

function localScaleFromCoefficients(
  point: TrainingProjectedPoint,
  coefficients: TrainingHomographyCoefficients,
) {
  const denominator =
    coefficients.wx * point.x + coefficients.wy * point.y + 1;
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 0.000001) {
    return 1;
  }
  const projected = projectWithCoefficients(point, coefficients);
  const inverseDenominator = 1 / denominator;
  const dxX =
    (coefficients.xx - projected.x * coefficients.wx) *
    inverseDenominator;
  const dyX =
    (coefficients.xy - projected.x * coefficients.wy) *
    inverseDenominator;
  const dxY =
    (coefficients.yx - projected.y * coefficients.wx) *
    inverseDenominator;
  const dyY =
    (coefficients.yy - projected.y * coefficients.wy) *
    inverseDenominator;
  const determinant = dxX * dyY - dyX * dxY;
  if (!Number.isFinite(determinant)) return 1;
  return clamp(Math.sqrt(Math.abs(determinant)), 0.55, 1.6);
}

export function createTrainingGroundProjection(
  inputState: TrainingProjectedCameraState,
  requestedFrame?: TrainingProjectionFrame,
): TrainingGroundProjection {
  const state = normalizeCameraState(
    inputState,
    TRAINING_PROJECTED_CAMERA_NEUTRAL,
  );
  const frame = safeFrame(requestedFrame);

  if (isNeutralState(state)) {
    const projectedCorners = [
      { x: 0, y: 0 },
      { x: frame.width, y: 0 },
      { x: frame.width, y: frame.height },
      { x: 0, y: frame.height },
    ] as const;
    return {
      coefficients: { ...IDENTITY_COEFFICIENTS },
      cssMatrix: TRAINING_PROJECTED_CAMERA_IDENTITY_MATRIX,
      frame,
      identity: true,
      projectedCorners,
      projectPoint: (point) => ({ ...point }),
      getLocalScale: () => 1,
    };
  }

  const normalized = solveUnitHomography(projectedUnitCorners(state));
  const coefficients = coefficientsForFrame(normalized, frame);
  const sourceCorners = [
    { x: 0, y: 0 },
    { x: frame.width, y: 0 },
    { x: frame.width, y: frame.height },
    { x: 0, y: frame.height },
  ] as const;
  const projectPoint = (point: TrainingProjectedPoint) =>
    projectWithCoefficients(point, coefficients);

  return {
    coefficients,
    cssMatrix: cssMatrixFromCoefficients(coefficients),
    frame,
    identity: false,
    projectedCorners: sourceCorners.map(projectPoint),
    projectPoint,
    getLocalScale: (point) =>
      localScaleFromCoefficients(point, coefficients),
  };
}

export function projectTrainingGpuBillboardRect({
  rect,
  groundAnchor,
  pivot,
  projection,
}: {
  rect: TrainingGpuObjectRenderRect;
  groundAnchor: TrainingProjectedPoint;
  pivot: TrainingProjectedPoint;
  projection: TrainingGroundProjection;
}): TrainingGpuObjectRenderRect {
  if (projection.identity) return rect;

  const projectedAnchor = projection.projectPoint(groundAnchor);
  const localScale = projection.getLocalScale(groundAnchor);
  const currentPivot = {
    x: rect.x + rect.width * pivot.x,
    y: rect.y + rect.height * pivot.y,
  };
  const calibratedOffset = {
    x: currentPivot.x - groundAnchor.x,
    y: currentPivot.y - groundAnchor.y,
  };
  const projectedPivot = {
    x: projectedAnchor.x + calibratedOffset.x * localScale,
    y: projectedAnchor.y + calibratedOffset.y * localScale,
  };
  const width = rect.width * localScale;
  const height = rect.height * localScale;

  return {
    x: projectedPivot.x - width * pivot.x,
    y: projectedPivot.y - height * pivot.y,
    width,
    height,
  };
}

export function getTrainingProjectedCameraState() {
  return { ...currentState };
}

export function setTrainingProjectedCameraState(
  partial: Partial<TrainingProjectedCameraState>,
) {
  currentState = normalizeCameraState(partial, currentState);
  const snapshot = getTrainingProjectedCameraState();
  for (const listener of listeners) listener(snapshot);
  return snapshot;
}

export function resetTrainingProjectedCameraState() {
  currentState = { ...TRAINING_PROJECTED_CAMERA_NEUTRAL };
  const snapshot = getTrainingProjectedCameraState();
  for (const listener of listeners) listener(snapshot);
  return snapshot;
}

export function subscribeTrainingProjectedCamera(
  listener: TrainingProjectedCameraListener,
) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTrainingProjectedCameraProjection(
  frame?: TrainingProjectionFrame,
) {
  return createTrainingGroundProjection(currentState, frame);
}
