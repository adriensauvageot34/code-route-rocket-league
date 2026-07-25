import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
import {
  TRAINING_GPU_TACTICAL_FRAGMENT_SHADER,
  TRAINING_GPU_TACTICAL_VERTEX_SHADER,
} from "@/lib/home/gpu/trainingGpuTacticalShaders";
import type { TrainingGpuObjectRenderRect } from "@/lib/home/gpu/trainingGpuObjectTypes";
import type { TrainingGpuViewport } from "@/lib/home/gpu/trainingGpuTypes";
import type {
  TrainingGpuDecodedObjectAsset,
  TrainingGpuDecodedObjectAssetSet,
} from "@/lib/home/gpu/TrainingGpuObjectAssetLoader";

type TrainingGpuBaseUniforms = {
  texture: WebGLUniformLocation;
  viewportCss: WebGLUniformLocation;
  quadCss: WebGLUniformLocation;
  opacity: WebGLUniformLocation;
  brightness: WebGLUniformLocation;
  saturation: WebGLUniformLocation;
};

export type TrainingGpuBaseResources = {
  program: WebGLProgram;
  texture: WebGLTexture;
  uniforms: TrainingGpuBaseUniforms;
};

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Training base shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message =
      gl.getShaderInfoLog(shader) ?? "Unknown Training base shader error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    TRAINING_GPU_TACTICAL_VERTEX_SHADER,
  );
  let fragmentShader: WebGLShader | null = null;
  let program: WebGLProgram | null = null;

  try {
    fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      TRAINING_GPU_TACTICAL_FRAGMENT_SHADER,
    );
    program = gl.createProgram();
    if (!program) throw new Error("Unable to create Training base program.");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        gl.getProgramInfoLog(program) ?? "Unknown Training base program error.",
      );
    }
    return program;
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  } finally {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }
}

function getUniform(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  name: string,
) {
  const location = gl.getUniformLocation(program, name);
  if (location === null) {
    throw new Error(`Missing Training base uniform: ${name}.`);
  }
  return location;
}

function createTexture(
  gl: WebGL2RenderingContext,
  asset: TrainingGpuDecodedObjectAsset,
  debugCollector: TrainingGpuDebugCollector | null,
) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Unable to create Training base texture.");

  try {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const uploadStartedAtMs = debugCollector ? performance.now() : 0;
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      asset.image,
    );
    debugCollector?.recordTextureUpload(
      performance.now() - uploadStartedAtMs,
    );
    return texture;
  } catch (error) {
    gl.deleteTexture(texture);
    throw error;
  } finally {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

export function createTrainingGpuBaseResources(
  gl: WebGL2RenderingContext,
  assets: TrainingGpuDecodedObjectAssetSet,
  debugCollector: TrainingGpuDebugCollector | null,
): TrainingGpuBaseResources {
  const baseAsset = assets.assets.base;
  if (!baseAsset) {
    throw new Error(`Missing decoded base asset for ${assets.objectId}.`);
  }

  let program: WebGLProgram | null = null;
  let texture: WebGLTexture | null = null;

  try {
    program = createProgram(gl);
    texture = createTexture(gl, baseAsset, debugCollector);
    gl.useProgram(program);
    const uniforms: TrainingGpuBaseUniforms = {
      texture: getUniform(gl, program, "u_texture"),
      viewportCss: getUniform(gl, program, "u_viewport_css"),
      quadCss: getUniform(gl, program, "u_quad_css"),
      opacity: getUniform(gl, program, "u_opacity"),
      brightness: getUniform(gl, program, "u_brightness"),
      saturation: getUniform(gl, program, "u_saturation"),
    };
    gl.uniform1i(uniforms.texture, 0);
    gl.useProgram(null);
    return { program, texture, uniforms };
  } catch (error) {
    gl.deleteTexture(texture);
    gl.deleteProgram(program);
    throw error;
  }
}

export function destroyTrainingGpuBaseResources(
  gl: WebGL2RenderingContext,
  resources: TrainingGpuBaseResources | null,
) {
  if (!resources) return;
  gl.deleteTexture(resources.texture);
  gl.deleteProgram(resources.program);
}

export function renderTrainingGpuBaseTarget(
  gl: WebGL2RenderingContext,
  viewport: TrainingGpuViewport,
  vertexArray: WebGLVertexArrayObject,
  resources: TrainingGpuBaseResources,
  quad: TrainingGpuObjectRenderRect,
) {
  gl.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA,
  );
  gl.useProgram(resources.program);
  gl.bindVertexArray(vertexArray);
  gl.uniform2f(
    resources.uniforms.viewportCss,
    viewport.cssWidth,
    viewport.cssHeight,
  );
  gl.uniform4f(
    resources.uniforms.quadCss,
    quad.x,
    quad.y,
    quad.width,
    quad.height,
  );
  gl.uniform1f(resources.uniforms.opacity, 1);
  gl.uniform1f(resources.uniforms.brightness, 1);
  gl.uniform1f(resources.uniforms.saturation, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, resources.texture);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindVertexArray(null);
  gl.useProgram(null);
}

export function getTrainingGpuBaseTextureBytes(
  assets: TrainingGpuDecodedObjectAssetSet | undefined,
) {
  const entry = assets?.assets.base?.entry;
  return entry ? entry.outputSize.width * entry.outputSize.height * 4 : 0;
}
