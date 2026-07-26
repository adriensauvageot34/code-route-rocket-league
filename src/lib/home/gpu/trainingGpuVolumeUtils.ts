import { TRAINING_GPU_CONTEXT_ATTRIBUTES, TRAINING_GPU_MAX_DPR } from "@/lib/home/gpu/trainingGpuConstants";
import {
  TRAINING_GPU_VOLUME_BALL_MASK,
  TRAINING_GPU_VOLUME_BALL_TRANSFORMS,
  TRAINING_GPU_VOLUME_CAR_MASK,
  type TrainingGpuVolumeLayer,
} from "@/lib/home/gpu/trainingGpuVolumeConstants";
import {
  TRAINING_GPU_VOLUME_FRAGMENT_SHADER,
  TRAINING_GPU_VOLUME_VERTEX_SHADER,
} from "@/lib/home/gpu/trainingGpuVolumeShaders";
import {
  getTrainingGpuObjectBaseQuadInCanvasSpace,
  getTrainingGpuObjectLocalQuad,
  transformTrainingGpuObjectLocalQuad,
} from "@/lib/home/gpu/trainingGpuObjectPlacement";
import {
  createTrainingGpuBaseResources,
  destroyTrainingGpuBaseResources,
  getTrainingGpuBaseTextureBytes,
  renderTrainingGpuBaseTarget,
  type TrainingGpuBaseResources,
} from "@/lib/home/gpu/trainingGpuBaseUtils";
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
  TrainingGpuVolumeObjectId,
  HTMLCanvasElement
>;

export type TrainingGpuVolumeObjectId = Exclude<
  TrainingGpuPreparedObjectId,
  "fennec"
>;

export type TrainingGpuVolumeUniforms = {
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
  objectId: TrainingGpuVolumeObjectId;
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext | null;
  contextLost: boolean;
  viewport: TrainingGpuViewport | null;
  resources: TrainingGpuVolumeResources | null;
  baseResources: TrainingGpuBaseResources | null;
  baseQuad: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  tacticalResources: TrainingGpuTacticalResources | null;
  onContextLost: (event: Event) => void;
  onContextRestored: () => void;
};

type TrainingGpuVolumeSubsystemOptions = {
  debugCollector: TrainingGpuDebugCollector | null;
  onBaseReadyChange: (ready: boolean) => void;
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
] as const satisfies readonly TrainingGpuVolumeObjectId[];

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

export function createTrainingGpuVolumeTexture(
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

export function createTrainingGpuVolumeResources(
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

    surfaceTexture = createTrainingGpuVolumeTexture(
      gl,
      surfaceAsset,
      debugCollector,
    );
    contourTexture = createTrainingGpuVolumeTexture(
      gl,
      contourAsset,
      debugCollector,
    );

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

export function destroyTrainingGpuVolumeResources(
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

function getLayerStyle(
  kind: "car" | "ball",
  layer: TrainingGpuVolumeLayer,
  state: TrainingGpuVolumeScanState,
): TrainingGpuVolumeLayerStyle {
  const layerState = state[layer];
  const glowPx = layer === "contour" ? (kind === "car" ? 4 : 3) : 0;
  const glowStrength =
    layer === "contour" ? (kind === "car" ? 0.44 : 0.34) : 0;

  return {
    opacity: layerState.opacity,
    brightness: layerState.brightness,
    saturation: layerState.saturation,
    glowPx,
    glowStrength,
  };
}

export class TrainingGpuVolumeSubsystem {
  private assets: Partial<
    Record<TrainingGpuPreparedObjectId, TrainingGpuDecodedObjectAssetSet>
  > | null = null;

  private baseInitialized = false;
  private baseReady = false;
  private volumeInitialized = false;
  private volumeReady = false;
  private tacticalInitialized = false;
  private tacticalReady = false;
  private readonly targets: Record<
    TrainingGpuVolumeObjectId,
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
    ) as Record<TrainingGpuVolumeObjectId, TrainingGpuVolumeTarget>;

    for (const target of Object.values(this.targets)) {
      target.canvas.addEventListener("webglcontextlost", target.onContextLost);
      target.canvas.addEventListener(
        "webglcontextrestored",
        target.onContextRestored,
      );
    }
    this.updateDebugState();
  }

  isBaseInitialized() {
    return this.baseInitialized;
  }

  isBaseReady() {
    return this.baseReady;
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
    this.releaseBaseResources();
    this.releaseTacticalResources();
    this.releaseVolumeResources();
    this.assets = assets;
    this.baseInitialized = false;
    this.volumeInitialized = false;
    this.tacticalInitialized = false;
    this.setBaseReady(false);
    this.setVolumeReady(false);
    this.setTacticalReady(false);
    this.clear();
    if (assets) this.initialize();
    this.updateDebugState();
  }

  initialize() {
    if (!this.assets) return false;
    this.initializeVolumeSubsystem();
    this.initializeBaseSubsystem();
    this.initializeTacticalSubsystem();
    this.resize();
    return (
      this.baseInitialized ||
      this.volumeInitialized ||
      this.tacticalInitialized
    );
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

  private initializeBaseSubsystem() {
    if (this.baseInitialized && this.hasBaseResources()) return true;

    try {
      for (const objectId of VOLUME_OBJECT_IDS) {
        this.initializeBaseTarget(this.targets[objectId]);
      }
      this.baseInitialized = this.hasBaseResources();
    } catch (error) {
      reportVolumeFailureOnce("base initialization failed", error);
      this.options.debugCollector?.recordSubsystemError("bases", error);
      this.baseInitialized = false;
      this.releaseBaseResources();
      this.setBaseReady(false);
    }
    this.updateDebugState();
    return this.baseInitialized;
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
      this.setBaseReady(false);
      this.setVolumeReady(false);
      this.setTacticalReady(false);
    }
    this.updateDebugState();
  }

  beginFrame() {
    this.clear();
  }

  renderBases(staticRender = false) {
    if (
      !this.baseInitialized ||
      !this.hasBaseResources() ||
      !this.hasBaseQuads() ||
      !this.hasViewports()
    ) {
      this.setBaseReady(false);
      return false;
    }

    try {
      for (const objectId of VOLUME_OBJECT_IDS) {
        this.renderBaseTarget(this.targets[objectId]);
      }
      this.setBaseReady(true);
      if (staticRender) {
        this.options.debugCollector?.recordStaticRender("bases");
      }
      return true;
    } catch (error) {
      reportVolumeFailureOnce("base render failed", error);
      this.options.debugCollector?.recordSubsystemError("bases", error);
      this.setBaseReady(false);
      this.clear();
      return false;
    }
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
    this.setBaseReady(false);
    this.setVolumeReady(false);
    this.setTacticalReady(false);
    this.releaseBaseResources();
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
    this.baseInitialized = false;
    this.volumeInitialized = false;
    this.tacticalInitialized = false;
    this.updateDebugState();
  }

  private createTarget(
    objectId: TrainingGpuVolumeObjectId,
    canvas: HTMLCanvasElement,
  ): TrainingGpuVolumeTarget {
    const target: TrainingGpuVolumeTarget = {
      objectId,
      canvas,
      gl: getWebGl2Context(canvas),
      contextLost: false,
      viewport: null,
      resources: null,
      baseResources: null,
      baseQuad: null,
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

    destroyTrainingGpuVolumeResources(target.gl, target.resources);
    target.resources = createTrainingGpuVolumeResources(
      target.gl,
      assets,
      this.options.debugCollector,
    );
    this.resizeTarget(target);
  }

  private initializeBaseTarget(target: TrainingGpuVolumeTarget) {
    const assets = this.assets?.[target.objectId];
    if (!target.gl || target.contextLost || !assets || !target.resources) {
      throw new Error(
        `Training base target unavailable: ${target.objectId}.`,
      );
    }
    if (assets.objectId !== target.objectId) {
      throw new Error(`Training base asset mismatch: ${target.objectId}.`);
    }

    destroyTrainingGpuBaseResources(target.gl, target.baseResources);
    target.baseResources = createTrainingGpuBaseResources(
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
      target.baseQuad = null;
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

    const baseAsset = this.assets?.[target.objectId]?.assets.base;
    target.baseQuad = baseAsset
      ? getTrainingGpuObjectBaseQuadInCanvasSpace(
          getTrainingGpuObjectRegistration(target.objectId),
          baseAsset.entry,
          { width: cssWidth, height: cssHeight },
        )
      : null;
  }

  private renderBaseTarget(target: TrainingGpuVolumeTarget) {
    const { gl, resources, baseResources, baseQuad, viewport } = target;
    if (
      !gl ||
      !resources ||
      !baseResources ||
      !baseQuad ||
      !viewport ||
      target.contextLost
    ) {
      throw new Error(
        `Training base target is not renderable: ${target.objectId}.`,
      );
    }

    renderTrainingGpuBaseTarget(
      gl,
      viewport,
      resources.vertexArray,
      baseResources,
      baseQuad,
    );
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

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.ONE,
      gl.ONE_MINUS_SRC_COLOR,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    gl.useProgram(resources.program);
    gl.bindVertexArray(resources.vertexArray);
    this.renderLayer(target, assetSet, state, "surface");
    this.renderLayer(target, assetSet, state, "contour");
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

  private hasBaseResources() {
    return Object.values(this.targets).every(
      (target) =>
        target.gl !== null &&
        !target.contextLost &&
        target.resources !== null &&
        target.baseResources !== null,
    );
  }

  private hasBaseQuads() {
    return Object.values(this.targets).every(
      (target) => target.baseQuad !== null,
    );
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

  private setBaseReady(ready: boolean) {
    if (this.baseReady === ready) return;
    this.baseReady = ready;
    this.options.onBaseReadyChange(ready);
    this.updateDebugState();
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

  private releaseBaseResources() {
    for (const target of Object.values(this.targets)) {
      if (target.gl && !target.contextLost) {
        destroyTrainingGpuBaseResources(target.gl, target.baseResources);
      }
      target.baseResources = null;
      target.baseQuad = null;
    }
    this.updateDebugState();
  }

  private releaseVolumeResources() {
    for (const target of Object.values(this.targets)) {
      if (target.gl && !target.contextLost) {
        destroyTrainingGpuVolumeResources(target.gl, target.resources);
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
    target.baseResources = null;
    target.baseQuad = null;
    target.tacticalResources = null;
    this.baseInitialized = false;
    this.volumeInitialized = false;
    this.tacticalInitialized = false;
    this.options.debugCollector?.recordContextLost("bases");
    this.options.debugCollector?.recordContextLost("volume");
    this.options.debugCollector?.recordContextLost("tactical");
    this.setBaseReady(false);
    this.setVolumeReady(false);
    this.setTacticalReady(false);
    this.clear();
    this.updateDebugState();
  }

  private restoreTarget(target: TrainingGpuVolumeTarget) {
    target.gl = getWebGl2Context(target.canvas);
    target.contextLost = target.gl === null;
    if (!target.gl) {
      this.setBaseReady(false);
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
      this.initializeBaseTarget(target);
      this.baseInitialized = this.hasBaseResources();
      this.options.debugCollector?.recordContextRestored("bases");
    } catch (error) {
      reportVolumeFailureOnce(
        `base context restoration failed for ${target.objectId}`,
        error,
      );
      this.options.debugCollector?.recordSubsystemError("bases", error);
      target.baseResources = null;
      target.baseQuad = null;
      this.baseInitialized = false;
      this.setBaseReady(false);
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
    const baseResourceTargets = targets.filter(
      (target) => target.baseResources !== null,
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
    const baseTextureBytes = baseResourceTargets.reduce(
      (total, target) =>
        total + getTrainingGpuBaseTextureBytes(this.assets?.[target.objectId]),
      0,
    );
    const tacticalTextureBytes = tacticalResourceTargets.reduce(
      (total, target) =>
        total +
        getTrainingGpuTacticalTextureBytes(
          this.assets?.[target.objectId],
        ),
      0,
    );

    debugCollector.setSubsystemState("bases", {
      initialized: this.baseInitialized,
      ready: this.baseReady,
      contextState,
    });
    debugCollector.setSubsystemResources(
      "bases",
      {
        contexts: activeContexts.length,
        programs: baseResourceTargets.length,
        buffers: 0,
        vertexArrays: 0,
        textures: baseResourceTargets.length,
        estimatedTextureBytes: baseTextureBytes,
      },
      targets.flatMap((target) =>
        target.viewport
          ? [
              {
                id: `bases-${target.objectId}`,
                subsystem: "bases" as const,
                cssWidth: target.viewport.cssWidth,
                cssHeight: target.viewport.cssHeight,
                pixelWidth: target.viewport.pixelWidth,
                pixelHeight: target.viewport.pixelHeight,
              },
            ]
          : [],
      ),
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
