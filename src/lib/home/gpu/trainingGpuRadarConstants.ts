export const TRAINING_GPU_RADAR_FIELD_HORIZON_Y = 340;

export const TRAINING_GPU_RADAR_REVEAL_QUAD = {
  topLeftX: -790,
  topRightX: 30,
  bottomLeftX: -550,
  bottomRightX: 270,
} as const;

export const TRAINING_GPU_RADAR_CORE_REVEAL_QUAD = {
  topLeftX: -24,
  topRightX: 18,
  bottomLeftX: 214,
  bottomRightX: 256,
} as const;

export const TRAINING_GPU_RADAR_TRAIL_QUAD = {
  topLeftX: -286,
  topRightX: 2,
  bottomLeftX: -50,
  bottomRightX: 238,
} as const;

export const TRAINING_GPU_RADAR_CORE_SEGMENT = {
  topX: 2,
  topY: 340,
  bottomX: 238,
  bottomY: 941,
} as const;

export const TRAINING_GPU_RADAR_DEPTH_STOPS = [
  { offset: 0, color: "#000000" },
  { offset: 0.015, color: "#080808" },
  { offset: 0.04, color: "#707070" },
  { offset: 0.09, color: "#b0b0b0" },
  { offset: 0.28, color: "#d0d0d0" },
  { offset: 0.6, color: "#e8e8e8" },
  { offset: 1, color: "#ffffff" },
] as const;

export const TRAINING_GPU_RADAR_REVEAL_STOPS = [
  { offset: 0, value: 0 },
  { offset: 0.35, value: 12 / 255 },
  { offset: 0.62, value: 40 / 255 },
  { offset: 0.82, value: 112 / 255 },
  { offset: 0.94, value: 208 / 255 },
  { offset: 1, value: 1 },
] as const;

export const TRAINING_GPU_RADAR_TRAIL_STOPS = [
  { offset: 0, color: [0x66, 0x54, 0xb9], opacity: 0 },
  { offset: 0.5, color: [0x78, 0x5f, 0xd0], opacity: 0.06 },
  { offset: 0.84, color: [0xbb, 0x85, 0x41], opacity: 0.16 },
  { offset: 1, color: [0xf3, 0xc4, 0x6b], opacity: 0.29 },
] as const;

export const TRAINING_GPU_RADAR_SURFACE_FILTER = {
  opacity: 0.56,
  brightness: 1.12,
  contrast: 1.08,
  saturate: 1.35,
} as const;

export const TRAINING_GPU_RADAR_CORE_FILTER = {
  opacity: 0.92,
  brightness: 1.65,
  contrast: 1.18,
  saturate: 1.85,
  glowColor: [237, 185, 73],
  glowOpacity: 0.35,
  glowRadiusCssPx: 5,
} as const;

export const TRAINING_GPU_RADAR_LINE_STYLE = {
  purpleGlowColor: [154, 93, 238],
  purpleGlowOpacity: 0.38,
  purpleGlowRadiusCssPx: 8,
  goldGlowColor: [222, 164, 65],
  goldGlowOpacity: 0.52,
  goldGlowWidthCssPx: 8,
  goldGlowBlurCssPx: 3,
  coreColor: [255, 207, 112],
  coreOpacity: 0.96,
  coreWidthCssPx: 2.5,
  goldShadowColor: [255, 200, 91],
  goldShadowOpacity: 0.82,
  goldShadowRadiusCssPx: 3,
  purpleShadowColor: [135, 83, 218],
  purpleShadowOpacity: 0.46,
  purpleShadowRadiusCssPx: 7,
} as const;

export const TRAINING_GPU_RADAR_TRAIL_STYLE = {
  blurCssPx: 0.7,
  shadowColor: [111, 80, 184],
  shadowOpacity: 0.2,
  shadowRadiusCssPx: 6,
} as const;
