import {
  TRAINING_GPU_LOGICAL_HEIGHT,
  TRAINING_GPU_LOGICAL_WIDTH,
} from "@/lib/home/gpu/trainingGpuConstants";
import {
  TRAINING_GPU_RADAR_SURFACE_FRAGMENT_SHADER,
  TRAINING_GPU_RADAR_SWEEP_FRAGMENT_SHADER,
  TRAINING_GPU_RADAR_VERTEX_SHADER,
} from "@/lib/home/gpu/trainingGpuRadarShaders";

export type TrainingGpuRadarPlane = "surface" | "sweep";

type TrainingGpuRadarUniforms = {
  viewportCss: WebGLUniformLocation;
  logicalSize: WebGLUniformLocation;
  effectiveDpr: WebGLUniformLocation;
  radarX: WebGLUniformLocation;
  visibility: WebGLUniformLocation;
  fieldMask: WebGLUniformLocation;
  terrain: WebGLUniformLocation | null;
};

export type TrainingGpuRadarPlaneResources = {
  program: WebGLProgram;
  vertexArray: WebGLVertexArrayObject;
  vertexBuffer: WebGLBuffer;
  fieldMaskTexture: WebGLTexture;
  terrainTexture: WebGLTexture | null;
  uniforms: TrainingGpuRadarUniforms;
};

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Unable to create a Training radar shader.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  fragmentSource: string,
) {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    TRAINING_GPU_RADAR_VERTEX_SHADER,
  );
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentSource,
  );
  const program = gl.createProgram();

  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Unable to create the Training radar program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Unknown program link error.";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
}

function getRequiredUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
) {
  const location = gl.getUniformLocation(program, name);
  if (!location) {
    throw new Error(`Missing Training radar uniform: ${name}.`);
  }
  return location;
}

function createFullscreenTriangle(gl: WebGL2RenderingContext) {
  const vertexArray = gl.createVertexArray();
  const vertexBuffer = gl.createBuffer();

  if (!vertexArray || !vertexBuffer) {
    if (vertexArray) gl.deleteVertexArray(vertexArray);
    if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
    throw new Error("Unable to create the Training radar fullscreen triangle.");
  }

  gl.bindVertexArray(vertexArray);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return { vertexArray, vertexBuffer };
}

function configureTexture(gl: WebGL2RenderingContext) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function createFieldMaskTexture(
  gl: WebGL2RenderingContext,
  maskPixels: Uint8Array,
) {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Unable to create the Training radar field texture.");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  configureTexture(gl);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.R8,
    TRAINING_GPU_LOGICAL_WIDTH,
    TRAINING_GPU_LOGICAL_HEIGHT,
    0,
    gl.RED,
    gl.UNSIGNED_BYTE,
    maskPixels,
  );
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

function createTerrainTexture(
  gl: WebGL2RenderingContext,
  terrainImage: HTMLImageElement,
) {
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error("Unable to create the Training tactical terrain texture.");
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  configureTexture(gl);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    terrainImage,
  );
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

export function createTrainingGpuRadarPlaneResources(
  gl: WebGL2RenderingContext,
  plane: TrainingGpuRadarPlane,
  maskPixels: Uint8Array,
  terrainImage: HTMLImageElement,
): TrainingGpuRadarPlaneResources {
  let program: WebGLProgram | null = null;
  let vertexArray: WebGLVertexArrayObject | null = null;
  let vertexBuffer: WebGLBuffer | null = null;
  let fieldMaskTexture: WebGLTexture | null = null;
  let terrainTexture: WebGLTexture | null = null;

  try {
    const fragmentSource =
      plane === "surface"
        ? TRAINING_GPU_RADAR_SURFACE_FRAGMENT_SHADER
        : TRAINING_GPU_RADAR_SWEEP_FRAGMENT_SHADER;
    program = createProgram(gl, fragmentSource);

    const fullscreenTriangle = createFullscreenTriangle(gl);
    vertexArray = fullscreenTriangle.vertexArray;
    vertexBuffer = fullscreenTriangle.vertexBuffer;
    fieldMaskTexture = createFieldMaskTexture(gl, maskPixels);
    terrainTexture =
      plane === "surface" ? createTerrainTexture(gl, terrainImage) : null;

    gl.useProgram(program);
    const uniforms: TrainingGpuRadarUniforms = {
      viewportCss: getRequiredUniform(gl, program, "u_viewport_css"),
      logicalSize: getRequiredUniform(gl, program, "u_logical_size"),
      effectiveDpr: getRequiredUniform(gl, program, "u_effective_dpr"),
      radarX: getRequiredUniform(gl, program, "u_radar_x"),
      visibility: getRequiredUniform(gl, program, "u_visibility"),
      fieldMask: getRequiredUniform(gl, program, "u_field_mask"),
      terrain:
        plane === "surface"
          ? getRequiredUniform(gl, program, "u_terrain")
          : null,
    };
    gl.uniform1i(uniforms.fieldMask, 0);
    if (uniforms.terrain) gl.uniform1i(uniforms.terrain, 1);

    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(null);

    return {
      program,
      vertexArray,
      vertexBuffer,
      fieldMaskTexture,
      terrainTexture,
      uniforms,
    };
  } catch (error) {
    gl.deleteTexture(terrainTexture);
    gl.deleteTexture(fieldMaskTexture);
    gl.deleteBuffer(vertexBuffer);
    gl.deleteVertexArray(vertexArray);
    gl.deleteProgram(program);
    throw error;
  }
}

export function destroyTrainingGpuRadarPlaneResources(
  gl: WebGL2RenderingContext,
  resources: TrainingGpuRadarPlaneResources | null,
) {
  if (!resources) return;

  gl.deleteTexture(resources.terrainTexture);
  gl.deleteTexture(resources.fieldMaskTexture);
  gl.deleteBuffer(resources.vertexBuffer);
  gl.deleteVertexArray(resources.vertexArray);
  gl.deleteProgram(resources.program);
}
