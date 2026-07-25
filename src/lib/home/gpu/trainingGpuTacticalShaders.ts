import { TRAINING_GPU_VOLUME_VERTEX_SHADER } from "@/lib/home/gpu/trainingGpuVolumeShaders";

export const TRAINING_GPU_TACTICAL_VERTEX_SHADER =
  TRAINING_GPU_VOLUME_VERTEX_SHADER;

export const TRAINING_GPU_TACTICAL_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;

uniform sampler2D u_texture;
uniform float u_opacity;
uniform float u_brightness;
uniform float u_saturation;

out vec4 outColor;

void main() {
  vec4 source = texture(u_texture, v_uv);
  float outputAlpha = source.a * u_opacity;
  if (outputAlpha <= 0.0001) {
    outColor = vec4(0.0);
    return;
  }

  float luminance = dot(source.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec3 adjustedRgb =
    mix(vec3(luminance), source.rgb, u_saturation) * u_brightness;

  outColor = vec4(adjustedRgb * u_opacity, outputAlpha);
}
`;
