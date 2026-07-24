import {
  TRAINING_GPU_RADAR_CORE_FILTER,
  TRAINING_GPU_RADAR_CORE_REVEAL_QUAD,
  TRAINING_GPU_RADAR_CORE_SEGMENT,
  TRAINING_GPU_RADAR_FIELD_HORIZON_Y,
  TRAINING_GPU_RADAR_LINE_STYLE,
  TRAINING_GPU_RADAR_REVEAL_QUAD,
  TRAINING_GPU_RADAR_REVEAL_STOPS,
  TRAINING_GPU_RADAR_SURFACE_FILTER,
  TRAINING_GPU_RADAR_TRAIL_QUAD,
  TRAINING_GPU_RADAR_TRAIL_STOPS,
  TRAINING_GPU_RADAR_TRAIL_STYLE,
} from "@/lib/home/gpu/trainingGpuRadarConstants";

function glslFloat(value: number) {
  return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

function glslColor(color: readonly number[]) {
  return `vec3(${color
    .map((channel) => glslFloat(channel / 255))
    .join(", ")})`;
}

const reveal = TRAINING_GPU_RADAR_REVEAL_QUAD;
const coreReveal = TRAINING_GPU_RADAR_CORE_REVEAL_QUAD;
const coreSegment = TRAINING_GPU_RADAR_CORE_SEGMENT;
const trail = TRAINING_GPU_RADAR_TRAIL_QUAD;
const revealStops = TRAINING_GPU_RADAR_REVEAL_STOPS;
const trailStops = TRAINING_GPU_RADAR_TRAIL_STOPS;
const surfaceFilter = TRAINING_GPU_RADAR_SURFACE_FILTER;
const coreFilter = TRAINING_GPU_RADAR_CORE_FILTER;
const lineStyle = TRAINING_GPU_RADAR_LINE_STYLE;
const trailStyle = TRAINING_GPU_RADAR_TRAIL_STYLE;

export const TRAINING_GPU_RADAR_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const LOGICAL_MAPPING_GLSL = `
vec2 getLogicalPosition(out float coverScale) {
  vec2 cssPosition = vec2(
    gl_FragCoord.x / u_effective_dpr,
    (u_viewport_css.y * u_effective_dpr - gl_FragCoord.y) /
      u_effective_dpr
  );
  coverScale = max(
    u_viewport_css.x / u_logical_size.x,
    u_viewport_css.y / u_logical_size.y
  );
  vec2 coverOffset =
    (u_viewport_css - u_logical_size * coverScale) * 0.5;
  return (cssPosition - coverOffset) / coverScale;
}

float logicalCanvasCoverage(vec2 logicalPosition) {
  return
    step(0.0, logicalPosition.x) *
    step(0.0, logicalPosition.y) *
    step(logicalPosition.x, u_logical_size.x) *
    step(logicalPosition.y, u_logical_size.y);
}

vec3 applyCssFilter(
  vec3 color,
  float brightness,
  float contrast,
  float saturation
) {
  vec3 filtered = color * brightness;
  filtered = (filtered - 0.5) * contrast + 0.5;
  float luminance = dot(filtered, vec3(0.2126, 0.7152, 0.0722));
  return clamp(mix(vec3(luminance), filtered, saturation), 0.0, 1.0);
}

void compositeLayer(
  inout vec3 premultiplied,
  inout float alpha,
  vec3 color,
  float layerAlpha
) {
  float remainingAlpha = layerAlpha * (1.0 - alpha);
  premultiplied += color * remainingAlpha;
  alpha += remainingAlpha;
}
`;

export const TRAINING_GPU_RADAR_SURFACE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_viewport_css;
uniform vec2 u_logical_size;
uniform float u_effective_dpr;
uniform float u_radar_x;
uniform float u_visibility;
uniform sampler2D u_field_mask;
uniform sampler2D u_terrain;

out vec4 outColor;

${LOGICAL_MAPPING_GLSL}

float linearRamp(float edgeStart, float edgeEnd, float value) {
  return clamp((value - edgeStart) / (edgeEnd - edgeStart), 0.0, 1.0);
}

float revealGradient(float progress) {
  if (progress <= ${glslFloat(revealStops[1].offset)}) {
    return mix(
      ${glslFloat(revealStops[0].value)},
      ${glslFloat(revealStops[1].value)},
      linearRamp(
        ${glslFloat(revealStops[0].offset)},
        ${glslFloat(revealStops[1].offset)},
        progress
      )
    );
  }
  if (progress <= ${glslFloat(revealStops[2].offset)}) {
    return mix(
      ${glslFloat(revealStops[1].value)},
      ${glslFloat(revealStops[2].value)},
      linearRamp(
        ${glslFloat(revealStops[1].offset)},
        ${glslFloat(revealStops[2].offset)},
        progress
      )
    );
  }
  if (progress <= ${glslFloat(revealStops[3].offset)}) {
    return mix(
      ${glslFloat(revealStops[2].value)},
      ${glslFloat(revealStops[3].value)},
      linearRamp(
        ${glslFloat(revealStops[2].offset)},
        ${glslFloat(revealStops[3].offset)},
        progress
      )
    );
  }
  if (progress <= ${glslFloat(revealStops[4].offset)}) {
    return mix(
      ${glslFloat(revealStops[3].value)},
      ${glslFloat(revealStops[4].value)},
      linearRamp(
        ${glslFloat(revealStops[3].offset)},
        ${glslFloat(revealStops[4].offset)},
        progress
      )
    );
  }
  return mix(
    ${glslFloat(revealStops[4].value)},
    ${glslFloat(revealStops[5].value)},
    linearRamp(
      ${glslFloat(revealStops[4].offset)},
      ${glslFloat(revealStops[5].offset)},
      progress
    )
  );
}

void main() {
  float coverScale;
  vec2 logicalPosition = getLogicalPosition(coverScale);
  float canvasCoverage = logicalCanvasCoverage(logicalPosition);
  vec2 logicalUv = clamp(
    logicalPosition / u_logical_size,
    vec2(0.0),
    vec2(1.0)
  );
  float fieldMask = texture(u_field_mask, logicalUv).r * canvasCoverage;
  float verticalProgress = clamp(
    (logicalPosition.y - ${glslFloat(TRAINING_GPU_RADAR_FIELD_HORIZON_Y)}) /
      (u_logical_size.y - ${glslFloat(TRAINING_GPU_RADAR_FIELD_HORIZON_Y)}),
    0.0,
    1.0
  );

  float revealLeft =
    mix(${glslFloat(reveal.topLeftX)}, ${glslFloat(reveal.bottomLeftX)}, verticalProgress) +
    u_radar_x;
  float revealRight =
    mix(${glslFloat(reveal.topRightX)}, ${glslFloat(reveal.bottomRightX)}, verticalProgress) +
    u_radar_x;
  float revealCoverage =
    step(revealLeft, logicalPosition.x) *
    step(logicalPosition.x, revealRight);
  float revealProgress = clamp(
    (logicalPosition.x - revealLeft) / max(revealRight - revealLeft, 0.0001),
    0.0,
    1.0
  );

  vec4 terrainSample = texture(u_terrain, logicalUv);
  vec3 baseColor = applyCssFilter(
    terrainSample.rgb,
    ${glslFloat(surfaceFilter.brightness)},
    ${glslFloat(surfaceFilter.contrast)},
    ${glslFloat(surfaceFilter.saturate)}
  );
  float baseAlpha =
    terrainSample.a *
    revealGradient(revealProgress) *
    revealCoverage *
    fieldMask *
    u_visibility *
    ${glslFloat(surfaceFilter.opacity)};

  float coreLeft =
    mix(${glslFloat(coreReveal.topLeftX)}, ${glslFloat(coreReveal.bottomLeftX)}, verticalProgress) +
    u_radar_x;
  float coreRight =
    mix(${glslFloat(coreReveal.topRightX)}, ${glslFloat(coreReveal.bottomRightX)}, verticalProgress) +
    u_radar_x;
  float coreCoverage =
    step(coreLeft, logicalPosition.x) *
    step(logicalPosition.x, coreRight);
  vec3 coreColor = applyCssFilter(
    terrainSample.rgb,
    ${glslFloat(coreFilter.brightness)},
    ${glslFloat(coreFilter.contrast)},
    ${glslFloat(coreFilter.saturate)}
  );
  float coreAlpha =
    terrainSample.a *
    coreCoverage *
    fieldMask *
    u_visibility *
    ${glslFloat(coreFilter.opacity)};

  float distanceOutsideCore =
    max(max(coreLeft - logicalPosition.x, logicalPosition.x - coreRight), 0.0) *
    coverScale;
  float coreGlow =
    exp(
      -0.5 *
      pow(
        distanceOutsideCore / ${glslFloat(coreFilter.glowRadiusCssPx)},
        2.0
      )
    ) *
    fieldMask *
    u_visibility *
    ${glslFloat(coreFilter.glowOpacity)};

  vec3 premultiplied = baseColor * baseAlpha;
  float alpha = baseAlpha;
  compositeLayer(premultiplied, alpha, coreColor, coreAlpha);
  compositeLayer(
    premultiplied,
    alpha,
    ${glslColor(coreFilter.glowColor)},
    coreGlow
  );

  outColor = vec4(premultiplied, alpha);
}
`;

export const TRAINING_GPU_RADAR_SWEEP_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 u_viewport_css;
uniform vec2 u_logical_size;
uniform float u_effective_dpr;
uniform float u_radar_x;
uniform float u_visibility;
uniform sampler2D u_field_mask;

out vec4 outColor;

${LOGICAL_MAPPING_GLSL}

float linearRamp(float edgeStart, float edgeEnd, float value) {
  return clamp((value - edgeStart) / (edgeEnd - edgeStart), 0.0, 1.0);
}

vec4 trailGradient(float progress) {
  vec3 color;
  float alpha;

  if (progress <= ${glslFloat(trailStops[1].offset)}) {
    float localProgress = linearRamp(
      ${glslFloat(trailStops[0].offset)},
      ${glslFloat(trailStops[1].offset)},
      progress
    );
    color = mix(
      ${glslColor(trailStops[0].color)},
      ${glslColor(trailStops[1].color)},
      localProgress
    );
    alpha = mix(
      ${glslFloat(trailStops[0].opacity)},
      ${glslFloat(trailStops[1].opacity)},
      localProgress
    );
  } else if (progress <= ${glslFloat(trailStops[2].offset)}) {
    float localProgress = linearRamp(
      ${glslFloat(trailStops[1].offset)},
      ${glslFloat(trailStops[2].offset)},
      progress
    );
    color = mix(
      ${glslColor(trailStops[1].color)},
      ${glslColor(trailStops[2].color)},
      localProgress
    );
    alpha = mix(
      ${glslFloat(trailStops[1].opacity)},
      ${glslFloat(trailStops[2].opacity)},
      localProgress
    );
  } else {
    float localProgress = linearRamp(
      ${glslFloat(trailStops[2].offset)},
      ${glslFloat(trailStops[3].offset)},
      progress
    );
    color = mix(
      ${glslColor(trailStops[2].color)},
      ${glslColor(trailStops[3].color)},
      localProgress
    );
    alpha = mix(
      ${glslFloat(trailStops[2].opacity)},
      ${glslFloat(trailStops[3].opacity)},
      localProgress
    );
  }

  return vec4(color, alpha);
}

float distanceToSegment(vec2 point, vec2 start, vec2 end) {
  vec2 segment = end - start;
  float projection = clamp(
    dot(point - start, segment) / dot(segment, segment),
    0.0,
    1.0
  );
  return length(point - (start + segment * projection));
}

void main() {
  float coverScale;
  vec2 logicalPosition = getLogicalPosition(coverScale);
  float canvasCoverage = logicalCanvasCoverage(logicalPosition);
  vec2 logicalUv = clamp(
    logicalPosition / u_logical_size,
    vec2(0.0),
    vec2(1.0)
  );
  float fieldMask = texture(u_field_mask, logicalUv).r * canvasCoverage;
  float verticalProgress = clamp(
    (logicalPosition.y - ${glslFloat(TRAINING_GPU_RADAR_FIELD_HORIZON_Y)}) /
      (u_logical_size.y - ${glslFloat(TRAINING_GPU_RADAR_FIELD_HORIZON_Y)}),
    0.0,
    1.0
  );

  float trailLeft =
    mix(${glslFloat(trail.topLeftX)}, ${glslFloat(trail.bottomLeftX)}, verticalProgress) +
    u_radar_x;
  float trailRight =
    mix(${glslFloat(trail.topRightX)}, ${glslFloat(trail.bottomRightX)}, verticalProgress) +
    u_radar_x;
  float trailDistance =
    max(max(trailLeft - logicalPosition.x, logicalPosition.x - trailRight), 0.0) *
    coverScale;
  float trailCoverage =
    1.0 -
    smoothstep(
      ${glslFloat(trailStyle.blurCssPx)},
      ${glslFloat(trailStyle.blurCssPx + 1)},
      trailDistance
    );
  float trailProgress = clamp(
    (logicalPosition.x - trailLeft) / max(trailRight - trailLeft, 0.0001),
    0.0,
    1.0
  );
  vec4 trailLayer = trailGradient(trailProgress);
  float trailAlpha =
    trailLayer.a *
    trailCoverage *
    fieldMask *
    u_visibility;
  float trailShadow =
    exp(
      -0.5 *
      pow(
        trailDistance / ${glslFloat(trailStyle.shadowRadiusCssPx)},
        2.0
      )
    ) *
    step(0.001, trailDistance) *
    fieldMask *
    u_visibility *
    ${glslFloat(trailStyle.shadowOpacity)};

  vec2 lineStart = vec2(
    u_radar_x + ${glslFloat(coreSegment.topX)},
    ${glslFloat(coreSegment.topY)}
  );
  vec2 lineEnd = vec2(
    u_radar_x + ${glslFloat(coreSegment.bottomX)},
    ${glslFloat(coreSegment.bottomY)}
  );
  float lineDistanceCss =
    distanceToSegment(logicalPosition, lineStart, lineEnd) * coverScale;
  float antialiasWidth = max(fwidth(lineDistanceCss), 0.65);

  float purpleGlow =
    exp(
      -0.5 *
      pow(
        lineDistanceCss / ${glslFloat(lineStyle.purpleGlowRadiusCssPx)},
        2.0
      )
    ) *
    ${glslFloat(lineStyle.purpleGlowOpacity)};
  float purpleShadow =
    exp(
      -0.5 *
      pow(
        lineDistanceCss / ${glslFloat(lineStyle.purpleShadowRadiusCssPx)},
        2.0
      )
    ) *
    ${glslFloat(lineStyle.purpleShadowOpacity)};
  float goldGlow =
    (
      1.0 -
      smoothstep(
        ${glslFloat(lineStyle.goldGlowWidthCssPx * 0.5)},
        ${glslFloat(
          lineStyle.goldGlowWidthCssPx * 0.5 + lineStyle.goldGlowBlurCssPx,
        )},
        lineDistanceCss
      )
    ) *
    ${glslFloat(lineStyle.goldGlowOpacity)};
  float goldShadow =
    exp(
      -0.5 *
      pow(
        lineDistanceCss / ${glslFloat(lineStyle.goldShadowRadiusCssPx)},
        2.0
      )
    ) *
    ${glslFloat(lineStyle.goldShadowOpacity)};
  float coreLine =
    (
      1.0 -
      smoothstep(
        ${glslFloat(lineStyle.coreWidthCssPx * 0.5)} - antialiasWidth,
        ${glslFloat(lineStyle.coreWidthCssPx * 0.5)} + antialiasWidth,
        lineDistanceCss
      )
    ) *
    ${glslFloat(lineStyle.coreOpacity)};

  float radarMask = fieldMask * u_visibility;
  vec3 premultiplied = trailLayer.rgb * trailAlpha;
  float alpha = trailAlpha;
  compositeLayer(
    premultiplied,
    alpha,
    ${glslColor(trailStyle.shadowColor)},
    trailShadow
  );
  compositeLayer(
    premultiplied,
    alpha,
    ${glslColor(lineStyle.purpleGlowColor)},
    purpleGlow * radarMask
  );
  compositeLayer(
    premultiplied,
    alpha,
    ${glslColor(lineStyle.purpleShadowColor)},
    purpleShadow * radarMask
  );
  compositeLayer(
    premultiplied,
    alpha,
    ${glslColor(lineStyle.goldGlowColor)},
    goldGlow * radarMask
  );
  compositeLayer(
    premultiplied,
    alpha,
    ${glslColor(lineStyle.goldShadowColor)},
    goldShadow * radarMask
  );
  compositeLayer(
    premultiplied,
    alpha,
    ${glslColor(lineStyle.coreColor)},
    coreLine * radarMask
  );

  outColor = vec4(premultiplied, alpha);
}
`;
