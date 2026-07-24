export const TRAINING_GPU_LOGICAL_WIDTH = 1672;
export const TRAINING_GPU_LOGICAL_HEIGHT = 941;
export const TRAINING_GPU_MAX_DPR = 1.5;
export const TRAINING_GPU_RENDER_SCALE = 1;

export const TRAINING_GPU_CONTEXT_ATTRIBUTES = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
  powerPreference: "high-performance",
} satisfies WebGLContextAttributes;
