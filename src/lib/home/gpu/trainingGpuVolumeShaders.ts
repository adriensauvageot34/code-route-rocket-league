export const TRAINING_GPU_VOLUME_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_uv;

uniform vec2 u_viewport_css;
uniform vec4 u_quad_css;

out vec2 v_uv;
out vec2 v_canvas_uv;

void main() {
  vec2 cssPosition = u_quad_css.xy + a_position * u_quad_css.zw;
  vec2 clipPosition = vec2(
    cssPosition.x / u_viewport_css.x * 2.0 - 1.0,
    1.0 - cssPosition.y / u_viewport_css.y * 2.0
  );

  v_uv = a_uv;
  v_canvas_uv = cssPosition / u_viewport_css;
  gl_Position = vec4(clipPosition, 0.0, 1.0);
}
`;

export const TRAINING_GPU_VOLUME_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
in vec2 v_canvas_uv;

uniform sampler2D u_texture;
uniform int u_mask_kind;
uniform float u_mask_center;
uniform vec2 u_mask_scale;
uniform float u_mask_angle;
uniform float u_opacity;
uniform float u_brightness;
uniform float u_saturation;
uniform vec2 u_glow_offset;
uniform float u_glow_strength;

out vec4 outColor;

const int LOCAL_CAR_SURFACE_MASK_KIND = 4;

float ramp(float startValue, float endValue, float value) {
  return clamp((value - startValue) / max(0.0001, endValue - startValue), 0.0, 1.0);
}

float carSurfaceMask(float value) {
  if (value <= 0.44) return 1.0;
  if (value <= 0.52) return mix(1.0, 0.9, ramp(0.44, 0.52, value));
  if (value <= 0.62) return mix(0.9, 0.0, ramp(0.52, 0.62, value));
  return 0.0;
}

float carContourMask(float value) {
  if (value <= 0.35) return 0.0;
  if (value <= 0.46) return ramp(0.35, 0.46, value);
  if (value <= 0.56) return 1.0;
  if (value <= 0.67) return 1.0 - ramp(0.56, 0.67, value);
  return 0.0;
}

float ballSurfaceMask(float value) {
  if (value <= 0.395) return 0.0;
  if (value <= 0.43) return mix(0.0, 0.12, ramp(0.395, 0.43, value));
  if (value <= 0.46) return mix(0.12, 0.5, ramp(0.43, 0.46, value));
  if (value <= 0.47) return mix(0.5, 1.0, ramp(0.46, 0.47, value));
  if (value <= 0.53) return 1.0;
  if (value <= 0.545) return mix(1.0, 0.55, ramp(0.53, 0.545, value));
  if (value <= 0.57) return mix(0.55, 0.12, ramp(0.545, 0.57, value));
  if (value <= 0.605) return mix(0.12, 0.0, ramp(0.57, 0.605, value));
  return 0.0;
}

float ballContourMask(float value) {
  if (value <= 0.415) return 0.0;
  if (value <= 0.45) return mix(0.0, 0.2, ramp(0.415, 0.45, value));
  if (value <= 0.475) return mix(0.2, 1.0, ramp(0.45, 0.475, value));
  if (value <= 0.525) return 1.0;
  if (value <= 0.545) return mix(1.0, 0.45, ramp(0.525, 0.545, value));
  if (value <= 0.585) return mix(0.45, 0.0, ramp(0.545, 0.585, value));
  return 0.0;
}

float getMaskAlpha() {
  vec2 direction = vec2(cos(u_mask_angle), sin(u_mask_angle));
  vec2 maskUv =
    u_mask_kind == LOCAL_CAR_SURFACE_MASK_KIND ? v_uv : v_canvas_uv;
  vec2 local = (maskUv - vec2(u_mask_center, 0.5)) / u_mask_scale;
  float value = dot(local, direction) + 0.5;

  if (
    u_mask_kind == 0 ||
    u_mask_kind == LOCAL_CAR_SURFACE_MASK_KIND
  ) {
    return carSurfaceMask(value);
  }
  if (u_mask_kind == 1) return carContourMask(value);
  if (u_mask_kind == 2) return ballSurfaceMask(value);
  return ballContourMask(value);
}

float getNeighborAlpha() {
  float alpha = 0.0;
  alpha = max(alpha, texture(u_texture, v_uv + vec2(u_glow_offset.x, 0.0)).a);
  alpha = max(alpha, texture(u_texture, v_uv - vec2(u_glow_offset.x, 0.0)).a);
  alpha = max(alpha, texture(u_texture, v_uv + vec2(0.0, u_glow_offset.y)).a);
  alpha = max(alpha, texture(u_texture, v_uv - vec2(0.0, u_glow_offset.y)).a);
  alpha = max(alpha, texture(u_texture, v_uv + u_glow_offset).a);
  alpha = max(alpha, texture(u_texture, v_uv - u_glow_offset).a);
  alpha = max(alpha, texture(u_texture, v_uv + vec2(u_glow_offset.x, -u_glow_offset.y)).a);
  alpha = max(alpha, texture(u_texture, v_uv + vec2(-u_glow_offset.x, u_glow_offset.y)).a);
  return alpha;
}

void main() {
  vec4 source = texture(u_texture, v_uv);
  float maskAlpha = getMaskAlpha();
  float factor = u_opacity * maskAlpha;

  if (factor <= 0.0001 || source.a <= 0.0001 && u_glow_strength <= 0.0) {
    outColor = vec4(0.0);
    return;
  }

  float luminance = dot(source.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 adjustedRgb =
    mix(vec3(luminance), source.rgb, u_saturation) * u_brightness;

  float neighborAlpha = u_glow_strength > 0.0 ? getNeighborAlpha() : 0.0;
  float glowAlpha = max(0.0, neighborAlpha - source.a) * u_glow_strength;
  vec3 glowColor = vec3(0.9569, 0.7216, 0.2941) * glowAlpha;
  float outputAlpha =
    (source.a + glowAlpha * (1.0 - source.a)) * factor;

  outColor = vec4((adjustedRgb + glowColor) * factor, outputAlpha);
}
`;
