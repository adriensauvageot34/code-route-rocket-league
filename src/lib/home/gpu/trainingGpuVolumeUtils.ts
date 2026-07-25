import { TRAINING_GPU_CONTEXT_ATTRIBUTES, TRAINING_GPU_MAX_DPR } from "@/lib/home/gpu/trainingGpuConstants";
import {
  TRAINING_GPU_VOLUME_BALL_MASK,
  TRAINING_GPU_VOLUME_BALL_TRANSFORMS,
  TRAINING_GPU_VOLUME_CAR_MASK,
  TRAINING_GPU_VOLUME_STYLE_KEYFRAMES,
  type TrainingGpuVolumeLayer,
  type TrainingGpuVolumeStyleKeyframe,
} from "@/lib/home/gpu/trainingGpuVolumeConstants";
import {
  TRAINING_GPU_VOLUME_FRAGMENT_SHADER,
  TRAINING_GPU_VOLUME_VERTEX_SHADER,
} from "@/lib/home/gpu/trainingGpuVolumeShaders";
import {
  getTrainingGpuObjectLocalQuad,
  transformTrainingGpuObjectLocalQuad,
} from "@/lib/home/gpu/trainingGpuObjectPlacement";
import { getTrainingGpuObjectRegistration } from "@/lib/home/gpu/trainingGpuObjectRegistry";
import type {
  TrainingGpuDecodedObjectAsset,
  TrainingGpuDecodedObjectAssetSet,
} from "@/lib/home/gpu/TrainingGpuObjectAssetLoader";
import type {
  TrainingGpuPreparedObjectId,
} from "@/lib/home/gpu/trainingGpuObjectAssetCatalog";
import type { TrainingGpuViewport } from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
import type { TrainingGpuVolumeScanState } from "@/lib/home/gpu/trainingGpuVolumeScanTiming";
import type { TrainingGpuTacticalSnapshot } from "@/lib/home/gpu/trainingGpuTacticalTiming";
import {
  createTrainingGpuTacticalResources,
  destroyTrainingGpuTacticalResources,
  getTrainingGpuTacticalTextureBytes,
  getTrainingGpuTacticalTextureCount,
  renderTrainingGpuTacticalTarget,
  type TrainingGpuTacticalResources,
} from "@/lib/home/gpu/trainingGpuTacticalUtils";

export type TrainingGpuVolumeCanvases = Record<
  TrainingGpuPreparedObjectId,
  HTMLCanvasElement
>;

type TrainingGpuVolumeUniforms = {
  texture: WebGLUniformLocation;
  viewportCss: WebGLUniformLocation;
  quadCss: WebGLUniformLocation;
  maskKind: WebGLUniformLocation;
  maskCenter: WebGLUniformLocation;
  maskScale: WebGLUniformLocation;
  maskAngle: WebGLUniformLocation;
  opacity: WebGLUniformLocation;
  brightness: WebGLUniformLocation;
  saturation: WebGLUniformLocation;
  glowOffset: WebGLUniformLocation;
  glowStrength: WebGLUniformLocation;
};

export type TrainingGpuVolumeResources = {
  program: WebGLProgram;
  vertexArray: WebGLVertexArrayObject;
  vertexBuffer: WebGLBuffer;
  surfaceTexture: WebGLTexture;
  contourTexture: WebGLTexture;
  uniforms: TrainingGpuVolumeUniforms;
};

export type TrainingGpuVolumeTarget = {
  objectId: TrainingGpuPreparedObjectId;
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext | null;
  contextLost: boolean;
  viewport: TrainingGpuViewport | null;
  resources: TrainingGpuVolumeResources | null;
  tacticalResources: TrainingGpuTacticalResources | null;
  onContextLost: (event: Event) => void;
  onContextRestored: () => void;
};

type TrainingGpuVolumeSubsystemOptions = {
  debugCollector: TrainingGpuDebugCollector | null;
  onVolumeReadyChange: (ready: boolean) => void;
  onTacticalReadyChange: (ready: boolean) => void;
  onContextRestored: () => void;
};

type TrainingGpuVolumeSnapshot = Record<
  TrainingGpuPreparedObjectId,
  TrainingGpuVolumeScanState
>;

type TrainingGpuVolumeLayerStyle = {
  opacity: number;
  brightness: number;
  saturation: number;
  glowPx: number;
  glowStrength: number;
};

const VOLUME_OBJECT_IDS = [
  "left-car",
  "back-right-car",
  "front-right-car",
  "ball",
] as const satisfies readonly TrainingGpuPreparedObjectId[];

const reportedVolumeFailures = new Set<string>();

function reportVolumeFailureOnce(scope: string, error: unknown) {
  if (
    process.env.NODE_ENV === "production" ||
    reportedVolumeFailures.has(scope)
  ) {
    return;
  }

  reportedVolumeFailures.add(scope);
  console.warn(`[Training GPU volume] ${scope}`, error);
}

function getWebGl2Context(canvas: HTMLCanvasElement) {
  return canvas.getContext(
    "webgl2",
    TRAINING_GPU_CONTEXT_ATTRIBUTES,
  ) as WebGL2RenderingContext | null;
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create Training volume shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown volume shader error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    TRAINING_GPU_VOLUME_VERTEX_SHADER,
  );
  let fragmentShader: WebGLShader | null = null;
  let program: WebGLProgram | null = null;

  try {
    fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      TRAINING_GPU_VOLUME_FRAGMENT_SHADER,
    );
    program = gl.createProgram();
    if (!program) {
      throw new Error("Unable to create Training volume program.");
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message =
        gl.getProgramInfoLog(program) ??
        "Unknown volume program link error.";
      throw new Error(message);
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
    throw new Error(`Missing Training volume uniform: ${name}.`);
  }
  return location;
}

function createTexture(
  gl: WebGL2RenderingContext,
  asset: TrainingGpuDecodedObjectAsset,
  debugCollector: TrainingGpuDebugCollector | null,
) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("Unable to create Training volume texture.");

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

function createVolumeResources(
  gl: WebGL2RenderingContext,
  assets: TrainingGpuDecodedObjectAssetSet,
  debugCollector: TrainingGpuDebugCollector | null,
): TrainingGpuVolumeResources {
  const surfaceAsset = assets.assets.volumeSurface;
  const contourAsset = assets.assets.volumeContour;
  if (!surfaceAsset || !contourAsset) {
    throw new Error(`Missing decoded volume assets for ${assets.objectId}.`);
  }

  let program: WebGLProgram | null = null;
  let vertexArray: WebGLVertexArrayObject | null = null;
  let vertexBuffer: WebGLBuffer | null = null;
  let surfaceTexture: WebGLTexture | null = null;
  let contourTexture: WebGLTexture | null = null;

  try {
    program = createProgram(gl);
    vertexArray = gl.createVertexArray();
    vertexBuffer = gl.createBuffer();
    if (!vertexArray || !vertexBuffer) {
      throw new Error("Unable to create Training volume quad.");
    }

    const vertices = new Float32Array([
      0, 0, 0, 0,
      1, 0, 1, 0,
      0, 1, 0, 1,
      0, 1, 0, 1,
      1, 0, 1, 0,
      1, 1, 1, 1,
    ]);

    gl.bindVertexArray(vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    surfaceTexture = createTexture(gl, surfaceAsset, debugCollector);
    contourTexture = createTexture(gl, contourAsset, debugCollector);

    gl.useProgram(program);
    const uniforms: TrainingGpuVolumeUniforms = {
      texture: getUniform(gl, program, "u_texture"),
      viewportCss: getUniform(gl, program, "u_viewport_css"),
      quadCss: getUniform(gl, program, "u_quad_css"),
      maskKind: getUniform(gl, program, "u_mask_kind"),
      maskCenter: getUniform(gl, program, "u_mask_center"),
      maskScale: getUniform(gl, program, "u_mask_scale"),
      maskAngle: getUniform(gl, program, "u_mask_angle"),
      opacity: getUniform(gl, program, "u_opacity"),
      brightness: getUniform(gl, program, "u_brightness"),
      saturation: getUniform(gl, program, "u_saturation"),
      glowOffset: getUniform(gl, program, "u_glow_offset"),
      glowStrength: getUniform(gl, program, "u_glow_strength"),
    };
    gl.uniform1i(uniforms.texture, 0);
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(null);

    return {
      program,
      vertexArray,
      vertexBuffer,
      surfaceTexture,
      contourTexture,
      uniforms,
    };
  } catch (error) {
    gl.deleteTexture(contourTexture);
    gl.deleteTexture(surfaceTexture);
    gl.deleteBuffer(vertexBuffer);
    gl.deleteVertexArray(vertexArray);
    gl.deleteProgram(program);
    throw error;
  }
}

function destroyVolumeResources(
  gl: WebGL2RenderingContext,
  resources: TrainingGpuVolumeResources | null,
) {
  if (!resources) return;
  gl.deleteTexture(resources.contourTexture);
  gl.deleteTexture(resources.surfaceTexture);
  gl.deleteBuffer(resources.vertexBuffer);
  gl.deleteVertexArray(resources.vertexArray);
  gl.deleteProgram(resources.program);
}

function interpolate(left: number, right: number, progress: number) {
  return left + (right - left) * progress;
}

function interpolateStyle(
  keyframes: readonly TrainingGpuVolumeStyleKeyframe[],
  progress: number,
) {
  const clamped = Math.min(1, Math.max(0, progress));
  let left = keyframes[0];
  let right = keyframes[keyframes.length - 1];

  for (let index = 1; index < keyframes.length; index += 1) {
    if (clamped <= keyframes[index].progress) {
      left = keyframes[index - 1];
      right = keyframes[index];
      break;
    }
  }

  const range = Math.max(0.0001, right.progress - left.progress);
  const local = Math.min(1, Math.max(0, (clamped - left.progress) / range));
  return {
    opacity: interpolate(left.opacity, right.opacity, local),
    brightness: interpolate(left.brightness, right.brightness, local),
    saturation: interpolate(left.saturation, right.saturation, local),
  };
}

function getLayerStyle(
  kind: "car" | "ball",
  layer: TrainingGpuVolumeLayer,
  state: TrainingGpuVolumeScanState,
): TrainingGpuVolumeLayerStyle {
  const keyframes = TRAINING_GPU_VOLUME_STYLE_KEYFRAMES[kind][layer];
  const terminal = keyframes[keyframes.length - 1];
  const progress =
    layer === "surface" ? state.surfaceProgress : state.contourProgress;
  const activeStyle = interpolateStyle(keyframes, progress);
  const glowPx = layer === "contour" ? (kind === "car" ? 4 : 3) : 0;
  const glowStrength =
    layer === "contour" ? (kind === "car" ? 0.44 : 0.34) : 0;

  if (state.phase === "hidden") {
    return { ...activeStyle, opacity: 0, glowPx, glowStrength };
  }
  if (state.phase === "active") {
    return { ...activeStyle, glowPx, glowStrength };
  }

  const opacity =
    state.phase === "fade"
      ? terminal.opacity *
        (layer === "surface"
          ? state.surfaceOpacityFactor
          : state.contourOpacityFactor)
      : terminal.opacity;

  return {
    opacity,
    brightness: terminal.brightness,
    saturation: terminal.saturation,
    glowPx,
    glowStrength,
  };
}

export class TrainingGpuVolumeSubsystem {
  private assets: Partial<
    Record<TrainingGpuPreparedObjectId, TrainingGpuDecodedObjectAssetSet>
  > | null = null;

  private volumeInitialized = false;
  private volumeReady = false;
  private tacticalInitialized = false;
  private tacticalReady = false;
  private readonly targets: Record<
    TrainingGpuPreparedObjectId,
    TrainingGpuVolumeTarget
  >;

  constructor(
    canvases: TrainingGpuVolumeCanvases,
    private readonly options: TrainingGpuVolumeSubsystemOptions,
  ) {
    this.targets = Object.fromEntries(
      VOLUME_OBJECT_IDS.map((objectId) => [
        objectId,
        this.createTarget(objectId, canvases[objectId]),
      ]),
    ) as Record<TrainingGpuPreparedObjectId, TrainingGpuVolumeTarget>;

    for (const target of Object.values(this.targets)) {
      target.canvas.addEventListener("webglcontextlost", target.onContextLost);
      target.canvas.addEventListener(
        "webglcontextrestored",
        target.onContextRestored,
      );
    }
    this.updateDebugState();
  }

  isVolumeInitialized() {
    return this.volumeInitialized;
  }

  isVolumeReady() {
    return this.volumeReady;
  }

  isTacticalInitialized() {
    return this.tacticalInitialized;
  }

  isTacticalReady() {
    return this.tacticalReady;
  }

  setAssets(
    assets: Partial<
      Record<TrainingGpuPreparedObjectId, TrainingGpuDecodedObjectAssetSet>
    > | null,
  ) {
    if (assets === this.assets) return;
    this.releaseVolumeResources();
    this.releaseTacticalResources();
    this.assets = assets;
    this.volumeInitialized = false;
    this.tacticalInitialized = false;
    this.setVolumeReady(false);
    this.setTacticalReady(false);
    this.clear();
    if (assets) this.initialize();
    this.updateDebugState();
  }

  initialize() {
    if (!this.assets) return false;
    this.initializeVolumeSubsystem();
    this.initializeTacticalSubsystem();
    this.resize();
    return this.volumeInitialized || this.tacticalInitialized;
  }

  private initializeVolumeSubsystem() {
    if (this.volumeInitialized && this.hasVolumeResources()) return true;

    try {
      for (const objectId of VOLUME_OBJECT_IDS) {
        this.initializeVolumeTarget(this.targets[objectId]);
      }
      this.volumeInitialized = this.hasVolumeResources();
    } catch (error) {
      reportVolumeFailureOnce("initialization failed", error);
      this.options.debugCollector?.recordSubsystemError("volume", error);
      this.volumeInitialized = false;
      this.releaseVolumeResources();
      this.setVolumeReady(false);
    }
    this.updateDebugState();
    return this.volumeInitialized;
  }

  private initializeTacticalSubsystem() {
    if (this.tacticalInitialized && this.hasTacticalResources()) return true;

    try {
      for (const objectId of VOLUME_OBJECT_IDS) {
        this.initializeTacticalTarget(this.targets[objectId]);
      }
      this.tacticalInitialized = this.hasTacticalResources();
    } catch (error) {
      reportVolumeFailureOnce("tactical initialization failed", error);
      this.options.debugCollector?.recordSubsystemError("tactical", error);
      this.tacticalInitialized = false;
      this.releaseTacticalResources();
      this.setTacticalReady(false);
    }
    this.updateDebugState();
    return this.tacticalInitialized;
  }

  resize() {
    for (const target of Object.values(this.targets)) {
      this.resizeTarget(target);
    }
    if (!this.hasViewports()) {
      this.setVolumeReady(false);
      this.setTacticalReady(false);
    }
    this.updateDebugState();
  }

  beginFrame() {
    this.clear();
  }

  renderVolume(snapshot: TrainingGpuVolumeSnapshot, running: boolean) {
    if (
      !this.volumeInitialized ||
      !this.hasVolumeResources() ||
      !this.hasViewports()
    ) {
      this.setVolumeReady(false);
      return false;
    }

    try {
      for (const objectId of VOLUME_OBJECT_IDS) {
        this.renderVolumeTarget(
          this.targets[objectId],
          snapshot[objectId],
          running,
        );
      }
      this.setVolumeReady(true);
      return true;
    } catch (error) {
      reportVolumeFailureOnce("render failed", error);
      this.options.debugCollector?.recordSubsystemError("volume", error);
      this.setVolumeReady(false);
      return false;
    }
  }

  renderTactical(snapshot: TrainingGpuTacticalSnapshot, running: boolean) {
    if (
      !this.tacticalInitialized ||
      !this.hasTacticalResources() ||
      !this.hasViewports()
    ) {
      this.setTacticalReady(false);
      return false;
    }

    try {
      for (const objectId of VOLUME_OBJECT_IDS) {
        this.renderTacticalTarget(
          this.targets[objectId],
          snapshot[objectId],
          running,
        );
      }
      this.setTacticalReady(true);
      return true;
    } catch (error) {
      reportVolumeFailureOnce("tactical render failed", error);
      this.options.debugCollector?.recordSubsystemError("tactical", error);
      this.setTacticalReady(false);
      return false;
    }
  }

  clear() {
    for (const target of Object.values(this.targets)) {
      if (target.gl && !target.contextLost) {
        target.gl.clear(target.gl.COLOR_BUFFER_BIT);
      }
    }
  }

  destroy() {
    this.setVolumeReady(false);
    this.setTacticalReady(false);
    this.releaseTacticalResources();
    this.releaseVolumeResources();
    for (const target of Object.values(this.targets)) {
      target.canvas.removeEventListener(
        "webglcontextlost",
        target.onContextLost,
      );
      target.canvas.removeEventListener(
        "webglcontextrestored",
        target.onContextRestored,
      );
      target.gl = null;
      target.viewport = null;
    }
    this.assets = null;
    this.volumeInitialized = false;
    this.tacticalInitialized = false;
    this.updateDebugState();
  }

  private createTarget(
    objectId: TrainingGpuPreparedObjectId,
    canvas: HTMLCanvasElement,
  ): TrainingGpuVolumeTarget {
    const target: TrainingGpuVolumeTarget = {
      objectId,
      canvas,
      gl: getWebGl2Context(canvas),
      contextLost: false,
      viewport: null,
      resources: null,
      tacticalResources: null,
      onContextLost: (_event: Event) => undefined,
      onContextRestored: () => undefined,
    };
    target.contextLost = target.gl === null;
    target.onContextLost = (event) => this.loseTarget(target, event);
    target.onContextRestored = () => this.restoreTarget(target);
    return target;
  }

  private initializeVolumeTarget(target: TrainingGpuVolumeTarget) {
    const assets = this.assets?.[target.objectId];
    if (!target.gl || target.contextLost || !assets) {
      throw new Error(`Training volume target unavailable: ${target.objectId}.`);
    }
    if (assets.objectId !== target.objectId) {
      throw new Error(`Training volume asset mismatch: ${target.objectId}.`);
    }

    destroyVolumeResources(target.gl, target.resources);
    target.resources = createVolumeResources(
      target.gl,
      assets,
      this.options.debugCollector,
    );
    this.resizeTarget(target);
  }

  private initializeTacticalTarget(target: TrainingGpuVolumeTarget) {
    const assets = this.assets?.[target.objectId];
    if (!target.gl || target.contextLost || !assets || !target.resources) {
      throw new Error(
        `Training tactical target unavailable: ${target.objectId}.`,
      );
    }
    if (assets.objectId !== target.objectId) {
      throw new Error(`Training tactical asset mismatch: ${target.objectId}.`);
    }

    destroyTrainingGpuTacticalResources(
      target.gl,
      target.tacticalResources,
    );
    target.tacticalResources = createTrainingGpuTacticalResources(
      target.gl,
      assets,
      this.options.debugCollector,
    );
    this.resizeTarget(target);
  }

  private resizeTarget(target: TrainingGpuVolumeTarget) {
    const rect = target.canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const cssHeight = rect.height;
    if (
      !Number.isFinite(cssWidth) ||
      !Number.isFinite(cssHeight) ||
      cssWidth <= 0 ||
      cssHeight <= 0
    ) {
      target.viewport = null;
      return;
    }

    const effectiveDpr = Math.min(
      window.devicePixelRatio || 1,
      TRAINING_GPU_MAX_DPR,
    );
    const pixelWidth = Math.max(1, Math.round(cssWidth * effectiveDpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * effectiveDpr));
    if (
      target.canvas.width !== pixelWidth ||
      target.canvas.height !== pixelHeight
    ) {
      target.canvas.width = pixelWidth;
      target.canvas.height = pixelHeight;
    }

    target.viewport = {
      cssWidth,
      cssHeight,
      pixelWidth,
      pixelHeight,
      effectiveDpr,
      logicalWidth: cssWidth,
      logicalHeight: cssHeight,
      renderScale: 1,
    };
    target.gl?.viewport(0, 0, pixelWidth, pixelHeight);
  }

  private renderVolumeTarget(
    target: TrainingGpuVolumeTarget,
    state: TrainingGpuVolumeScanState,
    running: boolean,
  ) {
    const { gl, resources, viewport } = target;
    const assetSet = this.assets?.[target.objectId];
    if (!gl || !resources || !viewport || !assetSet || target.contextLost) {
      throw new Error(`Training volume target is not renderable: ${target.objectId}.`);
    }

    gl.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
    if (!running) return;

    gl.useProgram(resources.program);
    gl.bindVertexArray(resources.vertexArray);
    this.renderLayer(target, assetSet, state, "surface");
    this.renderLayer(target, assetSet, state, "contour");
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  private renderTacticalTarget(
    target: TrainingGpuVolumeTarget,
    state: TrainingGpuTacticalSnapshot[TrainingGpuPreparedObjectId],
    running: boolean,
  ) {
    const { gl, resources, tacticalResources, viewport } = target;
    const assetSet = this.assets?.[target.objectId];
    if (
      !gl ||
      !resources ||
      !tacticalResources ||
      !viewport ||
      !assetSet ||
      target.contextLost
    ) {
      throw new Error(
        `Training tactical target is not renderable: ${target.objectId}.`,
      );
    }

    gl.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
    if (!running) return;
    renderTrainingGpuTacticalTarget(
      gl,
      viewport,
      resources.vertexArray,
      tacticalResources,
      assetSet,
      state,
    );
  }

  private renderLayer(
    target: TrainingGpuVolumeTarget,
    assetSet: TrainingGpuDecodedObjectAssetSet,
    state: TrainingGpuVolumeScanState,
    layer: TrainingGpuVolumeLayer,
  ) {
    const { gl, resources, viewport } = target;
    if (!gl || !resources || !viewport) return;

    const registration = getTrainingGpuObjectRegistration(target.objectId);
    const kind = registration.target.type === "ball" ? "ball" : "car";
    const asset =
      layer === "surface"
        ? assetSet.assets.volumeSurface
        : assetSet.assets.volumeContour;
    if (!asset) throw new Error(`Missing ${layer} asset for ${target.objectId}.`);

    const style = getLayerStyle(kind, layer, state);
    if (style.opacity <= 0) return;

    const frame = {
      width: viewport.cssWidth,
      height: viewport.cssHeight,
    };
    let quad = getTrainingGpuObjectLocalQuad(asset.entry, frame, "contain");
    if (kind === "ball") {
      quad = transformTrainingGpuObjectLocalQuad(
        quad,
        frame,
        TRAINING_GPU_VOLUME_BALL_TRANSFORMS[layer],
      );
    }

    const progress =
      layer === "surface" ? state.surfaceProgress : state.contourProgress;
    const mask =
      kind === "ball"
        ? TRAINING_GPU_VOLUME_BALL_MASK
        : TRAINING_GPU_VOLUME_CAR_MASK;
    const maskCenter = interpolate(
      mask.startCenterX,
      mask.endCenterX,
      progress,
    );
    const angleDegrees =
      registration.target.type === "car"
        ? Number.parseFloat(registration.target.objectScan.angle)
        : 0;
    const maskKind =
      kind === "car"
        ? layer === "surface"
          ? 0
          : 1
        : layer === "surface"
          ? 2
          : 3;
    const texture =
      layer === "surface"
        ? resources.surfaceTexture
        : resources.contourTexture;

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
    gl.uniform1i(resources.uniforms.maskKind, maskKind);
    gl.uniform1f(resources.uniforms.maskCenter, maskCenter);
    gl.uniform2f(resources.uniforms.maskScale, mask.scaleX, mask.scaleY);
    gl.uniform1f(
      resources.uniforms.maskAngle,
      (angleDegrees * Math.PI) / 180,
    );
    gl.uniform1f(resources.uniforms.opacity, style.opacity);
    gl.uniform1f(resources.uniforms.brightness, style.brightness);
    gl.uniform1f(resources.uniforms.saturation, style.saturation);
    gl.uniform2f(
      resources.uniforms.glowOffset,
      style.glowPx / Math.max(1, quad.width),
      style.glowPx / Math.max(1, quad.height),
    );
    gl.uniform1f(resources.uniforms.glowStrength, style.glowStrength);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private hasVolumeResources() {
    return Object.values(this.targets).every(
      (target) =>
        target.gl !== null && !target.contextLost && target.resources !== null,
    );
  }

  private hasTacticalResources() {
    return Object.values(this.targets).every(
      (target) =>
        target.gl !== null &&
        !target.contextLost &&
        target.resources !== null &&
        target.tacticalResources !== null,
    );
  }

  private hasViewports() {
    return Object.values(this.targets).every(
      (target) => target.viewport !== null,
    );
  }

  private setVolumeReady(ready: boolean) {
    if (this.volumeReady === ready) return;
    this.volumeReady = ready;
    this.options.onVolumeReadyChange(ready);
    this.updateDebugState();
  }

  private setTacticalReady(ready: boolean) {
    if (this.tacticalReady === ready) return;
    this.tacticalReady = ready;
    this.options.onTacticalReadyChange(ready);
    this.updateDebugState();
  }

  private releaseVolumeResources() {
    for (const target of Object.values(this.targets)) {
      if (target.gl && !target.contextLost) {
        destroyVolumeResources(target.gl, target.resources);
      }
      target.resources = null;
    }
    this.updateDebugState();
  }

  private releaseTacticalResources() {
    for (const target of Object.values(this.targets)) {
      if (target.gl && !target.contextLost) {
        destroyTrainingGpuTacticalResources(
          target.gl,
          target.tacticalResources,
        );
      }
      target.tacticalResources = null;
    }
    this.updateDebugState();
  }

  private loseTarget(target: TrainingGpuVolumeTarget, event: Event) {
    event.preventDefault();
    target.contextLost = true;
    target.resources = null;
    target.tacticalResources = null;
    this.volumeInitialized = false;
    this.tacticalInitialized = false;
    this.options.debugCollector?.recordContextLost("volume");
    this.options.debugCollector?.recordContextLost("tactical");
    this.setVolumeReady(false);
    this.setTacticalReady(false);
    this.clear();
    this.updateDebugState();
  }

  private restoreTarget(target: TrainingGpuVolumeTarget) {
    target.gl = getWebGl2Context(target.canvas);
    target.contextLost = target.gl === null;
    if (!target.gl) {
      this.setVolumeReady(false);
      this.setTacticalReady(false);
      return;
    }

    try {
      this.initializeVolumeTarget(target);
      this.volumeInitialized = this.hasVolumeResources();
      this.options.debugCollector?.recordContextRestored("volume");
    } catch (error) {
      reportVolumeFailureOnce(
        `volume context restoration failed for ${target.objectId}`,
        error,
      );
      this.options.debugCollector?.recordSubsystemError("volume", error);
      target.resources = null;
      this.volumeInitialized = false;
      this.setVolumeReady(false);
    }

    try {
      this.initializeTacticalTarget(target);
      this.tacticalInitialized = this.hasTacticalResources();
      this.options.debugCollector?.recordContextRestored("tactical");
    } catch (error) {
      reportVolumeFailureOnce(
        `tactical context restoration failed for ${target.objectId}`,
        error,
      );
      this.options.debugCollector?.recordSubsystemError("tactical", error);
      target.tacticalResources = null;
      this.tacticalInitialized = false;
      this.setTacticalReady(false);
    }

    this.updateDebugState();
    this.options.onContextRestored();
  }

  private updateDebugState() {
    const debugCollector = this.options.debugCollector;
    if (!debugCollector) return;

    const targets = Object.values(this.targets);
    const activeContexts = targets.filter(
      (target) => target.gl !== null && !target.contextLost,
    );
    const volumeResourceTargets = targets.filter(
      (target) => target.resources !== null,
    );
    const tacticalResourceTargets = targets.filter(
      (target) => target.tacticalResources !== null,
    );
    const contextState = targets.some(
      (target) => target.contextLost && target.gl !== null,
    )
      ? "lost"
      : activeContexts.length > 0
        ? "available"
        : "unavailable";
    let volumeTextureBytes = 0;
    for (const target of volumeResourceTargets) {
      const assetSet = this.assets?.[target.objectId];
      for (const role of ["volumeSurface", "volumeContour"] as const) {
        const asset = assetSet?.assets[role];
        if (asset) {
          volumeTextureBytes +=
            asset.entry.outputSize.width * asset.entry.outputSize.height * 4;
        }
      }
    }
    const tacticalTextureBytes = tacticalResourceTargets.reduce(
      (total, target) =>
        total +
        getTrainingGpuTacticalTextureBytes(
          this.assets?.[target.objectId],
        ),
      0,
    );

    debugCollector.setSubsystemState("volume", {
      initialized: this.volumeInitialized,
      ready: this.volumeReady,
      contextState,
    });
    debugCollector.setSubsystemResources(
      "volume",
      {
        contexts: activeContexts.length,
        programs: volumeResourceTargets.length,
        buffers: volumeResourceTargets.length,
        vertexArrays: volumeResourceTargets.length,
        textures: volumeResourceTargets.length * 2,
        estimatedTextureBytes: volumeTextureBytes,
      },
      targets.flatMap((target) =>
        target.viewport
          ? [
              {
                id: `volume-${target.objectId}`,
                subsystem: "volume" as const,
                cssWidth: target.viewport.cssWidth,
                cssHeight: target.viewport.cssHeight,
                pixelWidth: target.viewport.pixelWidth,
                pixelHeight: target.viewport.pixelHeight,
              },
            ]
          : [],
      ),
    );

    debugCollector.setSubsystemState("tactical", {
      initialized: this.tacticalInitialized,
      ready: this.tacticalReady,
      contextState,
    });
    debugCollector.setSubsystemResources(
      "tactical",
      {
        contexts: activeContexts.length,
        programs: tacticalResourceTargets.length,
        buffers: 0,
        vertexArrays: 0,
        textures: tacticalResourceTargets.reduce(
          (total, target) =>
            total +
            getTrainingGpuTacticalTextureCount(target.tacticalResources),
          0,
        ),
        estimatedTextureBytes: tacticalTextureBytes,
      },
      targets.flatMap((target) =>
        target.viewport
          ? [
              {
                id: `tactical-${target.objectId}`,
                subsystem: "tactical" as const,
                cssWidth: target.viewport.cssWidth,
                cssHeight: target.viewport.cssHeight,
                pixelWidth: target.viewport.pixelWidth,
                pixelHeight: target.viewport.pixelHeight,
              },
            ]
          : [],
      ),
    );
  }
}
