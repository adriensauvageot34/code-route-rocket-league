import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
import {
  TRAINING_GPU_TACTICAL_FRAGMENT_SHADER,
  TRAINING_GPU_TACTICAL_VERTEX_SHADER,
} from "@/lib/home/gpu/trainingGpuTacticalShaders";
import { getTrainingGpuObjectLocalQuad } from "@/lib/home/gpu/trainingGpuObjectPlacement";
import { getTrainingGpuObjectRegistration } from "@/lib/home/gpu/trainingGpuObjectRegistry";
import type { TrainingGpuPreparedObjectId } from "@/lib/home/gpu/trainingGpuObjectAssetCatalog";
import type { TrainingGpuTacticalState } from "@/lib/home/gpu/trainingGpuTacticalTiming";
import type { TrainingGpuViewport } from "@/lib/home/gpu/trainingGpuTypes";
import type {
  TrainingGpuDecodedObjectAsset,
  TrainingGpuDecodedObjectAssetSet,
} from "@/lib/home/gpu/TrainingGpuObjectAssetLoader";

export type TrainingGpuTacticalTextureRole =
  | "tacticalWireframe"
  | "tacticalGlow"
  | "tacticalEnergy";

type TrainingGpuTacticalUniforms = {
  texture: WebGLUniformLocation;
  viewportCss: WebGLUniformLocation;
  quadCss: WebGLUniformLocation;
  opacity: WebGLUniformLocation;
  brightness: WebGLUniformLocation;
  saturation: WebGLUniformLocation;
};

export type TrainingGpuTacticalResources = {
  ownsProgram: boolean;
  program: WebGLProgram;
  textures: Partial<Record<TrainingGpuTacticalTextureRole, WebGLTexture>>;
  uniforms: TrainingGpuTacticalUniforms;
};

type TrainingGpuTacticalLayerStyle = {
  opacity: number;
  brightness: number;
  saturation: number;
};

const TACTICAL_ROLES_BY_OBJECT_ID = {
  "left-car": ["tacticalWireframe", "tacticalGlow"],
  "back-right-car": ["tacticalWireframe", "tacticalGlow"],
  "front-right-car": ["tacticalWireframe", "tacticalGlow"],
  ball: ["tacticalEnergy"],
} as const satisfies Record<
  TrainingGpuPreparedObjectId,
  readonly TrainingGpuTacticalTextureRole[]
>;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Training tactical shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message =
      gl.getShaderInfoLog(shader) ?? "Unknown tactical shader error.";
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
    if (!program) {
      throw new Error("Unable to create Training tactical program.");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        gl.getProgramInfoLog(program) ??
          "Unknown tactical program link error.",
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
    throw new Error(`Missing Training tactical uniform: ${name}.`);
  }
  return location;
}

function createTexture(
  gl: WebGL2RenderingContext,
  asset: TrainingGpuDecodedObjectAsset,
  debugCollector: TrainingGpuDebugCollector | null,
) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Unable to create Training tactical texture.");

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

export function createTrainingGpuTacticalResources(
  gl: WebGL2RenderingContext,
  assets: TrainingGpuDecodedObjectAssetSet,
  debugCollector: TrainingGpuDebugCollector | null,
  sharedPipeline: Pick<
    TrainingGpuTacticalResources,
    "program" | "uniforms"
  > | null = null,
): TrainingGpuTacticalResources {
  let program: WebGLProgram | null = null;
  const textures: Partial<
    Record<TrainingGpuTacticalTextureRole, WebGLTexture>
  > = {};

  try {
    program = sharedPipeline?.program ?? createProgram(gl);
    for (const role of TACTICAL_ROLES_BY_OBJECT_ID[assets.objectId]) {
      const asset = assets.assets[role];
      if (!asset) {
        throw new Error(`Missing decoded ${role} asset for ${assets.objectId}.`);
      }
      textures[role] = createTexture(gl, asset, debugCollector);
    }

    gl.useProgram(program);
    const uniforms: TrainingGpuTacticalUniforms =
      sharedPipeline?.uniforms ?? {
        texture: getUniform(gl, program, "u_texture"),
        viewportCss: getUniform(gl, program, "u_viewport_css"),
        quadCss: getUniform(gl, program, "u_quad_css"),
        opacity: getUniform(gl, program, "u_opacity"),
        brightness: getUniform(gl, program, "u_brightness"),
        saturation: getUniform(gl, program, "u_saturation"),
      };
    gl.uniform1i(uniforms.texture, 0);
    gl.useProgram(null);

    return {
      ownsProgram: sharedPipeline === null,
      program,
      textures,
      uniforms,
    };
  } catch (error) {
    for (const texture of Object.values(textures)) {
      gl.deleteTexture(texture);
    }
    if (!sharedPipeline) gl.deleteProgram(program);
    throw error;
  }
}

export function destroyTrainingGpuTacticalResources(
  gl: WebGL2RenderingContext,
  resources: TrainingGpuTacticalResources | null,
) {
  if (!resources) return;
  for (const texture of Object.values(resources.textures)) {
    gl.deleteTexture(texture);
  }
  if (resources.ownsProgram) gl.deleteProgram(resources.program);
}

function getLayerStyle(
  objectId: TrainingGpuPreparedObjectId,
  role: TrainingGpuTacticalTextureRole,
  state: TrainingGpuTacticalState,
): TrainingGpuTacticalLayerStyle {
  if (objectId === "ball") {
    return {
      opacity: state.energyOpacity,
      brightness: state.energyBrightness,
      saturation: state.energySaturation,
    };
  }

  return role === "tacticalWireframe"
    ? {
        opacity: state.wireframeOpacity,
        brightness: 1.08,
        saturation: 1.18,
      }
    : {
        opacity: state.glowOpacity,
        brightness: 1.08,
        saturation: 1.16,
      };
}

export function renderTrainingGpuTacticalTarget(
  gl: WebGL2RenderingContext,
  viewport: TrainingGpuViewport,
  vertexArray: WebGLVertexArrayObject,
  resources: TrainingGpuTacticalResources,
  assets: TrainingGpuDecodedObjectAssetSet,
  state: TrainingGpuTacticalState,
) {
  const registration = getTrainingGpuObjectRegistration(assets.objectId);
  const frame = { width: viewport.cssWidth, height: viewport.cssHeight };
  const fitMode = registration.kind === "ball" ? "cover" : "contain";

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(
    gl.ONE,
    gl.ONE_MINUS_SRC_COLOR,
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

  for (const role of TACTICAL_ROLES_BY_OBJECT_ID[assets.objectId]) {
    const asset = assets.assets[role];
    const texture = resources.textures[role];
    if (!asset || !texture) {
      throw new Error(`Training tactical role is not renderable: ${role}.`);
    }

    const style = getLayerStyle(assets.objectId, role, state);
    if (style.opacity <= 0) continue;
    const quad = getTrainingGpuObjectLocalQuad(asset.entry, frame, fitMode);

    gl.uniform4f(
      resources.uniforms.quadCss,
      quad.x,
      quad.y,
      quad.width,
      quad.height,
    );
    gl.uniform1f(resources.uniforms.opacity, style.opacity);
    gl.uniform1f(resources.uniforms.brightness, style.brightness);
    gl.uniform1f(resources.uniforms.saturation, style.saturation);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindVertexArray(null);
  gl.useProgram(null);
  gl.blendFuncSeparate(
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA,
  );
}

export function getTrainingGpuTacticalTextureCount(
  resources: TrainingGpuTacticalResources | null,
) {
  return resources ? Object.keys(resources.textures).length : 0;
}

export function getTrainingGpuTacticalTextureBytes(
  assets: TrainingGpuDecodedObjectAssetSet | undefined,
) {
  if (!assets) return 0;
  return TACTICAL_ROLES_BY_OBJECT_ID[assets.objectId].reduce(
    (total, role) => {
      const entry = assets.assets[role]?.entry;
      return entry
        ? total + entry.outputSize.width * entry.outputSize.height * 4
        : total;
    },
    0,
  );
}
