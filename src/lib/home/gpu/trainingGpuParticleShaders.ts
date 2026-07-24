import {
  TRAINING_GPU_PARTICLE_COLORS,
  TRAINING_GPU_PARTICLE_EASING,
  TRAINING_GPU_PARTICLE_KEYFRAMES,
  TRAINING_GPU_PARTICLE_PROPORTIONS,
} from "@/lib/home/gpu/trainingGpuParticleConstants";

function glsl(value: number) {
  return Number.isInteger(value) ? `${value}.0` : String(value);
}

const coreFrames = TRAINING_GPU_PARTICLE_KEYFRAMES.core.map(glsl);
const flashFrames = TRAINING_GPU_PARTICLE_KEYFRAMES.birthFlash.map(glsl);
const fragmentFrames = TRAINING_GPU_PARTICLE_KEYFRAMES.fragment.map(glsl);
const coreEase = TRAINING_GPU_PARTICLE_EASING.core.map(glsl);
const fragmentEase = TRAINING_GPU_PARTICLE_EASING.fragment.map(glsl);
const proportions = TRAINING_GPU_PARTICLE_PROPORTIONS;

export const TRAINING_GPU_PARTICLE_VERTEX_SHADER = `#version 300 es
precision highp float;

layout(location = 0) in vec2 a_quad;
layout(location = 1) in vec4 a_particle;
layout(location = 2) in vec4 a_motion;
layout(location = 3) in vec4 a_visual;
layout(location = 4) in vec2 a_metadata;

uniform vec2 u_viewport_css;
uniform vec2 u_pass_elapsed_ms;
uniform vec2 u_pass_valid;

out vec2 v_local_px;
out vec2 v_shape_size;
out vec2 v_scene_uv;
out float v_opacity;
out float v_brightness;
out float v_saturation;
out float v_blur;
out float v_glow;
flat out float v_kind;
flat out float v_component;

float cubicCoordinate(float t, float p1, float p2) {
  float inverse = 1.0 - t;
  return 3.0 * inverse * inverse * t * p1 +
    3.0 * inverse * t * t * p2 + t * t * t;
}

float cubicDerivative(float t, float p1, float p2) {
  float inverse = 1.0 - t;
  return 3.0 * inverse * inverse * p1 +
    6.0 * inverse * t * (p2 - p1) +
    3.0 * t * t * (1.0 - p2);
}

float cubicBezierEase(float progress, vec4 curve) {
  float target = clamp(progress, 0.0, 1.0);
  float t = target;
  for (int index = 0; index < 5; index += 1) {
    float slope = cubicDerivative(t, curve.x, curve.z);
    if (abs(slope) < 0.0001) break;
    t = clamp(
      t - (cubicCoordinate(t, curve.x, curve.z) - target) / slope,
      0.0,
      1.0
    );
  }
  return cubicCoordinate(t, curve.y, curve.w);
}

float segmentProgress(float age, float start, float end, vec4 curve) {
  return cubicBezierEase((age - start) / max(end - start, 0.0001), curve);
}

vec2 rotateVector(vec2 value, float angle) {
  float sine = sin(angle);
  float cosine = cos(angle);
  return mat2(cosine, -sine, sine, cosine) * value;
}

void coreState(
  float age,
  float opacityBase,
  float rise,
  float drift,
  float glowBase,
  float blurBase,
  out vec2 offset,
  out float opacity,
  out float scale,
  out float brightness,
  out float saturation,
  out float blur,
  out float glow
) {
  vec4 curve = vec4(${coreEase.join(", ")});
  float progress;

  if (age <= ${coreFrames[1]}) {
    progress = segmentProgress(age, ${coreFrames[0]}, ${coreFrames[1]}, curve);
    offset = mix(vec2(0.0), vec2(-drift * 0.28, -rise * 0.18), progress);
    opacity = opacityBase;
    scale = mix(0.52, 1.22, progress);
    brightness = mix(2.05, 2.2, progress);
    saturation = mix(1.7, 1.76, progress);
    blur = blurBase;
    glow = glowBase;
  } else if (age <= ${coreFrames[2]}) {
    progress = segmentProgress(age, ${coreFrames[1]}, ${coreFrames[2]}, curve);
    offset = mix(
      vec2(-drift * 0.28, -rise * 0.18),
      vec2(-drift * 0.52, -rise * 0.42),
      progress
    );
    opacity = mix(opacityBase, opacityBase * 0.82, progress);
    scale = mix(1.22, 0.9, progress);
    brightness = mix(2.2, 1.2, progress);
    saturation = mix(1.76, 1.16, progress);
    blur = blurBase;
    glow = mix(glowBase, glowBase * 0.42, progress);
  } else if (age <= ${coreFrames[3]}) {
    progress = segmentProgress(age, ${coreFrames[2]}, ${coreFrames[3]}, curve);
    offset = mix(
      vec2(-drift * 0.52, -rise * 0.42),
      vec2(-drift * 0.8, -rise * 0.74),
      progress
    );
    opacity = mix(opacityBase * 0.82, opacityBase * 0.32, progress);
    scale = mix(0.9, 0.5, progress);
    brightness = mix(1.2, 0.96, progress);
    saturation = mix(1.16, 1.02, progress);
    blur = mix(blurBase, 0.55, progress);
    glow = glowBase * 0.42;
  } else {
    progress = segmentProgress(age, ${coreFrames[3]}, ${coreFrames[4]}, curve);
    offset = mix(
      vec2(-drift * 0.8, -rise * 0.74),
      vec2(-drift, -rise),
      progress
    );
    opacity = mix(opacityBase * 0.32, 0.0, progress);
    scale = mix(0.5, 0.08, progress);
    brightness = mix(0.96, 0.72, progress);
    saturation = mix(1.02, 0.82, progress);
    blur = mix(0.55, 1.1, progress);
    glow = mix(glowBase * 0.42, 0.0, progress);
  }
}

void fragmentState(
  float age,
  float opacityBase,
  float rise,
  float drift,
  out vec2 offset,
  out float opacity,
  out float scale
) {
  vec4 curve = vec4(${fragmentEase.join(", ")});
  if (age <= ${fragmentFrames[1]}) {
    offset = vec2(0.0);
    opacity = opacityBase * 0.66;
    scale = 0.9;
  } else if (age <= ${fragmentFrames[2]}) {
    float progress = segmentProgress(
      age,
      ${fragmentFrames[1]},
      ${fragmentFrames[2]},
      curve
    );
    offset = mix(vec2(0.0), vec2(-drift * 0.62, -rise * 0.67), progress);
    opacity = mix(opacityBase * 0.66, opacityBase * 0.28, progress);
    scale = mix(0.9, 0.5, progress);
  } else {
    float progress = segmentProgress(
      age,
      ${fragmentFrames[2]},
      ${fragmentFrames[3]},
      curve
    );
    offset = mix(
      vec2(-drift * 0.62, -rise * 0.67),
      vec2(-drift * 1.16, -rise * 1.28),
      progress
    );
    opacity = mix(opacityBase * 0.28, 0.0, progress);
    scale = mix(0.5, 0.04, progress);
  }
}

void main() {
  float passSlot = a_metadata.y;
  float passElapsed = passSlot < 0.5
    ? u_pass_elapsed_ms.x
    : u_pass_elapsed_ms.y;
  float passValid = passSlot < 0.5 ? u_pass_valid.x : u_pass_valid.y;
  float particleElapsed = passElapsed - a_visual.z;
  float duration = a_motion.x;
  float age = clamp(particleElapsed / max(duration, 1.0), 0.0, 1.0);
  bool visible = passValid > 0.5 && particleElapsed >= 0.0 && particleElapsed <= duration;

  float size = a_particle.z;
  float opacityBase = a_particle.w;
  float rise = a_motion.y;
  float drift = a_motion.z;
  float rotation = a_motion.w;
  float blurBase = a_visual.x;
  float glowBase = a_visual.y;
  float kind = a_visual.w;
  float component = a_metadata.x;

  vec2 offset = vec2(0.0);
  vec2 shapeSize = vec2(size);
  float opacity = 0.0;
  float scale = 1.0;
  float brightness = 1.0;
  float saturation = 1.0;
  float blur = blurBase;
  float glow = glowBase;

  if (component < 0.5) {
    coreState(
      age,
      opacityBase,
      rise,
      drift,
      glowBase,
      blurBase,
      offset,
      opacity,
      scale,
      brightness,
      saturation,
      blur,
      glow
    );
    if (kind > 1.5) {
      shapeSize = vec2(
        size * ${glsl(proportions.tacticalSparkWidth)},
        max(${glsl(proportions.minimumThinDimension)}, size * ${glsl(proportions.tacticalSparkHeight)})
      );
    }
    shapeSize *= scale;
  } else if (component < 1.5) {
    float flashProgress = age <= ${flashFrames[1]}
      ? mix(0.45, 1.25, age / ${flashFrames[1]})
      : mix(
          1.25,
          2.0,
          clamp((age - ${flashFrames[1]}) / (${flashFrames[2]} - ${flashFrames[1]}), 0.0, 1.0)
        );
    opacity = age <= ${flashFrames[1]}
      ? mix(opacityBase * 0.82, opacityBase, age / ${flashFrames[1]})
      : mix(
          opacityBase,
          0.0,
          clamp((age - ${flashFrames[1]}) / (${flashFrames[2]} - ${flashFrames[1]}), 0.0, 1.0)
        );
    if (age >= ${flashFrames[2]}) opacity = 0.0;
    shapeSize = vec2(
      max(${glsl(proportions.birthFlashMinimumWidth)}, size * ${glsl(proportions.birthFlashWidth)}) * flashProgress,
      ${glsl(proportions.minimumThinDimension)}
    );
  } else {
    fragmentState(age, opacityBase, rise, drift, offset, opacity, scale);
    float fragmentSize = max(
      ${glsl(proportions.minimumThinDimension)},
      size * ${glsl(proportions.fragment)}
    );
    shapeSize = vec2(fragmentSize * scale);
    brightness = mix(1.45, 0.86, age);
    saturation = mix(1.34, 0.92, age);
    blur = mix(blurBase, 0.7, age);
    glow = glowBase * (1.0 - age) * 0.72;
  }

  if (!visible) opacity = 0.0;

  float padding = max(2.0, glow * 1.25 + blur * 2.0);
  vec2 quadSize = max(shapeSize, vec2(0.01)) + vec2(padding * 2.0);
  vec2 localPx = a_quad * quadSize;
  vec2 rotatedLocalPx = rotateVector(localPx, rotation);
  vec2 baseCss = a_particle.xy * 0.01 * u_viewport_css;
  vec2 vertexCss = baseCss + offset + rotatedLocalPx;
  vec2 clip = vertexCss / u_viewport_css * 2.0 - 1.0;

  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  v_local_px = localPx;
  v_shape_size = max(shapeSize, vec2(0.01));
  v_scene_uv = vertexCss / u_viewport_css;
  v_opacity = opacity;
  v_brightness = brightness;
  v_saturation = saturation;
  v_blur = blur;
  v_glow = glow;
  v_kind = kind;
  v_component = component;
}`;

const colors = Object.fromEntries(
  Object.entries(TRAINING_GPU_PARTICLE_COLORS).map(([key, value]) => [
    key,
    value.map((channel) => glsl(channel / 255)).join(", "),
  ]),
) as Record<keyof typeof TRAINING_GPU_PARTICLE_COLORS, string>;

export const TRAINING_GPU_PARTICLE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in vec2 v_local_px;
in vec2 v_shape_size;
in vec2 v_scene_uv;
in float v_opacity;
in float v_brightness;
in float v_saturation;
in float v_blur;
in float v_glow;
flat in float v_kind;
flat in float v_component;

out vec4 outputColor;

float segmentDistance(vec2 point, vec2 start, vec2 end) {
  vec2 edge = end - start;
  float progress = clamp(
    dot(point - start, edge) / max(dot(edge, edge), 0.0001),
    0.0,
    1.0
  );
  return length(point - (start + edge * progress));
}

bool rayCrosses(vec2 point, vec2 start, vec2 end) {
  return ((start.y > point.y) != (end.y > point.y)) &&
    point.x < (end.x - start.x) * (point.y - start.y) /
      (end.y - start.y) + start.x;
}

float polygon4Distance(vec2 point, vec2 a, vec2 b, vec2 c, vec2 d) {
  float distanceToEdge = min(
    min(segmentDistance(point, a, b), segmentDistance(point, b, c)),
    min(segmentDistance(point, c, d), segmentDistance(point, d, a))
  );
  bool inside = false;
  if (rayCrosses(point, a, b)) inside = !inside;
  if (rayCrosses(point, b, c)) inside = !inside;
  if (rayCrosses(point, c, d)) inside = !inside;
  if (rayCrosses(point, d, a)) inside = !inside;
  return inside ? -distanceToEdge : distanceToEdge;
}

float polygon5Distance(
  vec2 point,
  vec2 a,
  vec2 b,
  vec2 c,
  vec2 d,
  vec2 e
) {
  float distanceToEdge = min(
    min(segmentDistance(point, a, b), segmentDistance(point, b, c)),
    min(
      segmentDistance(point, c, d),
      min(segmentDistance(point, d, e), segmentDistance(point, e, a))
    )
  );
  bool inside = false;
  if (rayCrosses(point, a, b)) inside = !inside;
  if (rayCrosses(point, b, c)) inside = !inside;
  if (rayCrosses(point, c, d)) inside = !inside;
  if (rayCrosses(point, d, e)) inside = !inside;
  if (rayCrosses(point, e, a)) inside = !inside;
  return inside ? -distanceToEdge : distanceToEdge;
}

float particleShapeDistance(vec2 uv) {
  if (v_component > 1.5) {
    return polygon4Distance(
      uv,
      vec2(0.5, 0.0),
      vec2(1.0, 0.48),
      vec2(0.52, 1.0),
      vec2(0.0, 0.55)
    );
  }
  if (v_kind < 0.5) {
    return polygon5Distance(
      uv,
      vec2(0.0, 0.42),
      vec2(0.67, 0.0),
      vec2(1.0, 0.48),
      vec2(0.64, 1.0),
      vec2(0.08, 0.72)
    );
  }
  if (v_kind < 1.5) {
    return polygon4Distance(
      uv,
      vec2(0.5, 0.0),
      vec2(1.0, 0.5),
      vec2(0.5, 1.0),
      vec2(0.0, 0.5)
    );
  }
  return polygon5Distance(
    uv,
    vec2(0.0, 0.38),
    vec2(0.84, 0.0),
    vec2(1.0, 0.5),
    vec2(0.82, 1.0),
    vec2(0.0, 0.62)
  );
}

float terrainTop(float x) {
  if (x <= 0.03) return 0.442;
  if (x <= 0.22) return mix(0.442, 0.448, (x - 0.03) / 0.19);
  if (x <= 0.4) return mix(0.448, 0.443, (x - 0.22) / 0.18);
  if (x <= 0.5) return mix(0.443, 0.441, (x - 0.4) / 0.1);
  if (x <= 0.65) return mix(0.441, 0.439, (x - 0.5) / 0.15);
  if (x <= 0.82) return mix(0.439, 0.447, (x - 0.65) / 0.17);
  if (x <= 0.97) return mix(0.447, 0.442, (x - 0.82) / 0.15);
  return 0.442;
}

float terrainAlpha(float y) {
  if (y <= 0.44) return 0.0;
  if (y <= 0.47) return mix(0.0, 0.22, (y - 0.44) / 0.03);
  if (y <= 0.6) return mix(0.22, 0.5, (y - 0.47) / 0.13);
  if (y <= 0.73) return mix(0.5, 0.78, (y - 0.6) / 0.13);
  if (y <= 0.86) return mix(0.78, 0.94, (y - 0.73) / 0.13);
  return mix(0.94, 1.0, clamp((y - 0.86) / 0.14, 0.0, 1.0));
}

float cross2d(vec2 a, vec2 b) {
  return a.x * b.y - a.y * b.x;
}

bool insideConvexQuad(vec2 point, vec2 a, vec2 b, vec2 c, vec2 d) {
  float ab = cross2d(b - a, point - a);
  float bc = cross2d(c - b, point - b);
  float cd = cross2d(d - c, point - c);
  float da = cross2d(a - d, point - d);
  bool nonNegative = ab >= 0.0 && bc >= 0.0 && cd >= 0.0 && da >= 0.0;
  bool nonPositive = ab <= 0.0 && bc <= 0.0 && cd <= 0.0 && da <= 0.0;
  return nonNegative || nonPositive;
}

bool insideDepthBand(vec2 point) {
  #if PARTICLE_DEPTH == 0
    return insideConvexQuad(
      point,
      vec2(0.03, 0.445),
      vec2(0.97, 0.445),
      vec2(0.98, 0.57),
      vec2(0.02, 0.57)
    );
  #elif PARTICLE_DEPTH == 1
    return insideConvexQuad(
      point,
      vec2(0.024, 0.52),
      vec2(0.976, 0.52),
      vec2(0.992, 0.775),
      vec2(0.008, 0.775)
    );
  #else
    return insideConvexQuad(
      point,
      vec2(0.01, 0.675),
      vec2(0.99, 0.675),
      vec2(1.0, 1.0),
      vec2(0.0, 1.0)
    );
  #endif
}

vec3 mainParticleColor() {
  if (v_kind < 0.5) return vec3(${colors.violetDust});
  if (v_kind < 1.5) return vec3(${colors.goldDot});
  return vec3(${colors.tacticalSpark});
}

vec3 applyColorFilter(vec3 color, float brightness, float saturation) {
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  return max(vec3(0.0), mix(vec3(luminance), color, saturation) * brightness);
}

void main() {
  if (
    v_opacity <= 0.0001 ||
    v_scene_uv.y < terrainTop(v_scene_uv.x) ||
    !insideDepthBand(v_scene_uv)
  ) {
    discard;
  }

  vec2 uv = v_local_px / v_shape_size + 0.5;
  vec3 primaryColor = mainParticleColor();
  float minimumSize = max(min(v_shape_size.x, v_shape_size.y), 0.25);
  float signedDistance;
  float shapeAlpha;
  vec3 shapeColor = primaryColor;
  float colorCoverage = 1.0;

  if (v_component > 0.5 && v_component < 1.5) {
    vec2 normalized = abs(v_local_px) / max(v_shape_size * 0.5, vec2(0.001));
    signedDistance =
      (max(normalized.x, normalized.y) - 1.0) *
      max(min(v_shape_size.x, v_shape_size.y) * 0.5, 0.25);
    float horizontalAlpha = smoothstep(0.0, 0.48, uv.x) *
      (1.0 - smoothstep(0.52, 1.0, uv.x));
    shapeAlpha = horizontalAlpha * (1.0 - smoothstep(-0.04, 0.08, signedDistance));
    shapeColor = uv.x < 0.5
      ? mix(vec3(0.0), vec3(${colors.warmWhite}), smoothstep(0.0, 0.48, uv.x))
      : mix(primaryColor, vec3(0.0), smoothstep(0.52, 1.0, uv.x));
  } else {
    signedDistance = particleShapeDistance(uv) * minimumSize;
    float antialias = max(fwidth(signedDistance), 0.35);
    shapeAlpha = 1.0 - smoothstep(
      -antialias,
      antialias + max(v_blur, 0.0),
      signedDistance
    );

    if (v_kind > 1.5 && v_component < 0.5) {
      vec3 purple = vec3(${colors.tacticalPurple}) * 0.72;
      vec3 gold = vec3(${colors.goldDot}) * 0.88;
      if (uv.x < 0.24) {
        float progress = clamp(uv.x / 0.24, 0.0, 1.0);
        shapeColor = mix(purple, primaryColor, progress * 0.18);
        colorCoverage = progress * 0.72;
      } else if (uv.x < 0.56) {
        float progress = (uv.x - 0.24) / 0.32;
        shapeColor = mix(purple, primaryColor, progress);
        colorCoverage = mix(0.72, 1.0, progress);
      } else if (uv.x < 0.79) {
        float progress = (uv.x - 0.56) / 0.23;
        shapeColor = mix(primaryColor, gold, progress);
        colorCoverage = mix(1.0, 0.88, progress);
      } else {
        float progress = clamp((uv.x - 0.79) / 0.21, 0.0, 1.0);
        shapeColor = gold;
        colorCoverage = mix(0.88, 0.0, progress);
      }
      shapeAlpha *= colorCoverage;
    }
  }

  float positiveDistance = max(signedDistance, 0.0);
  float glowAlpha = v_glow > 0.001
    ? exp(-2.0 * pow(positiveDistance / v_glow, 2.0)) * 0.48
    : 0.0;
  float maskAlpha = terrainAlpha(v_scene_uv.y);
  float alpha = clamp((shapeAlpha + glowAlpha) * v_opacity * maskAlpha, 0.0, 1.0);
  vec3 filteredColor = applyColorFilter(
    mix(primaryColor, shapeColor, shapeAlpha),
    v_brightness,
    v_saturation
  );

  outputColor = vec4(filteredColor * alpha, alpha);
}`;

export function getTrainingGpuParticleFragmentShader(depthIndex: number) {
  return TRAINING_GPU_PARTICLE_FRAGMENT_SHADER.replace(
    "#version 300 es",
    `#version 300 es\n#define PARTICLE_DEPTH ${depthIndex}`,
  );
}
