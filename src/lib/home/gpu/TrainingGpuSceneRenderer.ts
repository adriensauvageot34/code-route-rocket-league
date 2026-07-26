import {
  TRAINING_GPU_CONTEXT_ATTRIBUTES,
  TRAINING_GPU_LOGICAL_HEIGHT,
  TRAINING_GPU_LOGICAL_WIDTH,
} from "@/lib/home/gpu/trainingGpuConstants";
import {
  TRAINING_GPU_PARTICLE_DEPTHS,
  type TrainingGpuParticleDepth,
} from "@/lib/home/gpu/trainingGpuParticleConstants";
import {
  createTrainingGpuParticleResources,
  destroyTrainingGpuParticleResources,
  type TrainingGpuParticleResources,
} from "@/lib/home/gpu/trainingGpuParticleUtils";
import {
  createTrainingGpuBaseResources,
  destroyTrainingGpuBaseResources,
  renderTrainingGpuBaseTarget,
  type TrainingGpuBaseResources,
} from "@/lib/home/gpu/trainingGpuBaseUtils";
import {
  createTrainingGpuTacticalResources,
  destroyTrainingGpuTacticalResources,
  type TrainingGpuTacticalResources,
  type TrainingGpuTacticalTextureRole,
} from "@/lib/home/gpu/trainingGpuTacticalUtils";
import {
  createTrainingGpuVolumeResources,
  createTrainingGpuVolumeTexture,
  destroyTrainingGpuVolumeResources,
  type TrainingGpuVolumeResources,
} from "@/lib/home/gpu/trainingGpuVolumeUtils";
import {
  TRAINING_GPU_VOLUME_BALL_MASK,
  TRAINING_GPU_VOLUME_BALL_TRANSFORMS,
  TRAINING_GPU_VOLUME_CAR_MASK,
  type TrainingGpuVolumeLayer,
} from "@/lib/home/gpu/trainingGpuVolumeConstants";
import {
  convertTrainingGpuLogicalSceneRectToLocalCanvasRect,
  getTrainingGpuObjectLocalQuad,
  getTrainingGpuObjectSceneRenderRect,
  transformTrainingGpuObjectLocalQuad,
} from "@/lib/home/gpu/trainingGpuObjectPlacement";
import { getTrainingGpuObjectRegistration } from "@/lib/home/gpu/trainingGpuObjectRegistry";
import type {
  TrainingGpuObjectRenderRect,
  TrainingGpuObjectRegistration,
} from "@/lib/home/gpu/trainingGpuObjectTypes";
import type { TrainingGpuPreparedObjectId } from "@/lib/home/gpu/trainingGpuObjectAssetCatalog";
import type {
  TrainingGpuDecodedObjectAsset,
  TrainingGpuDecodedObjectAssetSet,
} from "@/lib/home/gpu/TrainingGpuObjectAssetLoader";
import type { TrainingGpuViewport } from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
import {
  getTrainingGpuParallaxSnapshot,
  type TrainingGpuParallaxSnapshot,
} from "@/lib/home/gpu/trainingGpuParallaxState";
import { homeSceneDepths, type HomeSceneDepth } from "@/lib/home/homeSceneParallax";
import {
  trainingFennecVolumeScanTarget,
} from "@/lib/home/trainingRadarTargets";
import type {
  TrainingRadarFennecEffectsState,
  TrainingRadarTacticalState,
  TrainingRadarTemporalSnapshot,
  TrainingRadarVolumeScanState,
} from "@/lib/home/trainingRadarSnapshots";

type SceneObjectId = Exclude<TrainingGpuPreparedObjectId, "fennec">;

type SceneObjectResources = {
  assetSet: TrainingGpuDecodedObjectAssetSet;
  base: TrainingGpuBaseResources;
  tactical: TrainingGpuTacticalResources;
  volume: TrainingGpuVolumeResources;
};

type FennecResources = {
  assetSet: TrainingGpuDecodedObjectAssetSet;
  baseTexture: WebGLTexture;
  effects: {
    headlight: WebGLTexture;
    impact: WebGLTexture;
    rear: WebGLTexture;
  };
  volume: TrainingGpuVolumeResources;
};

export type TrainingGpuSceneFrameMetrics = {
  blendChanges: number;
  clearCalls: number;
  drawCalls: number;
  framebufferChanges: number;
  programChanges: number;
  textureBinds: number;
};

type TrainingGpuSceneRendererOptions = {
  debugCollector: TrainingGpuDebugCollector | null;
  onBaseReadyChange: (ready: boolean) => void;
  onContextRestored: () => void;
  onFennecBaseReadyChange: (ready: boolean) => void;
  onFennecEffectsReadyChange: (ready: boolean) => void;
  onFennecVolumeReadyChange: (ready: boolean) => void;
  onParticlesReadyChange: (ready: boolean) => void;
  onTacticalReadyChange: (ready: boolean) => void;
  onVolumeReadyChange: (ready: boolean) => void;
};

const OBJECT_DRAW_ORDER = [
  "left-car",
  "back-right-car",
  "front-right-car",
  "ball",
] as const satisfies readonly SceneObjectId[];

const TACTICAL_ROLES = {
  "left-car": ["tacticalWireframe", "tacticalGlow"],
  "back-right-car": ["tacticalWireframe", "tacticalGlow"],
  "front-right-car": ["tacticalWireframe", "tacticalGlow"],
  ball: ["tacticalEnergy"],
} as const satisfies Record<
  SceneObjectId,
  readonly TrainingGpuTacticalTextureRole[]
>;

const EMPTY_FRAME_METRICS: TrainingGpuSceneFrameMetrics = {
  blendChanges: 0,
  clearCalls: 0,
  drawCalls: 0,
  framebufferChanges: 0,
  programChanges: 0,
  textureBinds: 0,
};

const FENNEC_MASK_SCALE = { x: 0.34, y: 1 } as const;
const LOCAL_CAR_SURFACE_MASK_KIND = 4;

function getWebGl2Context(canvas: HTMLCanvasElement) {
  return canvas.getContext(
    "webgl2",
    TRAINING_GPU_CONTEXT_ATTRIBUTES,
  ) as WebGL2RenderingContext | null;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function interpolate(left: number, right: number, progress: number) {
  return left + (right - left) * clamp01(progress);
}

function roleTextureBytes(
  assetSet: TrainingGpuDecodedObjectAssetSet | null,
  roles: readonly (
    | "base"
    | "volumeSurface"
    | "volumeContour"
    | "tacticalWireframe"
    | "tacticalGlow"
    | "tacticalEnergy"
    | "tacticalImpact"
    | "headlightGlow"
    | "rearAccent"
  )[],
) {
  if (!assetSet) return 0;
  return roles.reduce((total, role) => {
    const asset = assetSet.assets[role];
    return asset
      ? total +
          asset.entry.outputSize.width *
            asset.entry.outputSize.height *
            4
      : total;
  }, 0);
}

function sceneQuad(
  registration: TrainingGpuObjectRegistration,
  asset: TrainingGpuDecodedObjectAsset,
  viewport: TrainingGpuViewport,
  parallax: TrainingGpuParallaxSnapshot,
) {
  const logicalRect = getTrainingGpuObjectSceneRenderRect(
    registration,
    asset.entry,
  );
  const cssRect = convertTrainingGpuLogicalSceneRectToLocalCanvasRect(
    logicalRect,
    {
      width: viewport.cssWidth,
      height: viewport.cssHeight,
    },
  );
  return applyDepthTransform(
    cssRect,
    registration.depth,
    viewport,
    parallax,
  );
}

function applyDepthTransform(
  rect: TrainingGpuObjectRenderRect,
  depth: HomeSceneDepth,
  viewport: TrainingGpuViewport,
  parallax: TrainingGpuParallaxSnapshot,
): TrainingGpuObjectRenderRect {
  const configuration = homeSceneDepths[depth];
  const scaleX =
    parallax.effectiveScaleX[depth] ?? configuration.scale;
  const scaleY =
    "scaleY" in configuration
      ? configuration.scaleY
      : configuration.scale;
  const translationX =
    parallax.effectiveTranslationX[depth] ??
    configuration.translationX;
  const offsetX = parallax.point.x * translationX;
  const offsetY = parallax.point.y * configuration.translationY;
  const centerX = viewport.cssWidth / 2;
  const centerY = viewport.cssHeight / 2;

  return {
    x: centerX + (rect.x - centerX) * scaleX + offsetX,
    y: centerY + (rect.y - centerY) * scaleY + offsetY,
    width: rect.width * scaleX,
    height: rect.height * scaleY,
  };
}

function leftCarSurfaceSceneQuad(
  registration: TrainingGpuObjectRegistration,
  baseAsset: TrainingGpuDecodedObjectAsset,
  surfaceAsset: TrainingGpuDecodedObjectAsset,
  viewport: TrainingGpuViewport,
  parallax: TrainingGpuParallaxSnapshot,
) {
  const baseQuad = sceneQuad(
    registration,
    baseAsset,
    viewport,
    parallax,
  );
  const baseOutputSize = baseAsset.entry.outputSize;
  const surfaceOutputSize = surfaceAsset.entry.outputSize;
  const baseContentWidthPx =
    baseOutputSize.width - 2 * baseAsset.entry.paddingPx;
  const baseContentHeightPx =
    baseOutputSize.height - 2 * baseAsset.entry.paddingPx;
  const surfaceContentWidthPx =
    surfaceOutputSize.width - 2 * surfaceAsset.entry.paddingPx;
  const surfaceContentHeightPx =
    surfaceOutputSize.height - 2 * surfaceAsset.entry.paddingPx;
  const baseContentWidth =
    baseQuad.width * (baseContentWidthPx / baseOutputSize.width);
  const baseContentHeight =
    baseQuad.height * (baseContentHeightPx / baseOutputSize.height);
  const width =
    baseContentWidth /
    (surfaceContentWidthPx / surfaceOutputSize.width);
  const height =
    baseContentHeight /
    (surfaceContentHeightPx / surfaceOutputSize.height);

  return {
    x: baseQuad.x + (baseQuad.width - width) / 2,
    y: baseQuad.y + (baseQuad.height - height) / 2,
    width,
    height,
  };
}

function ballVolumeSceneQuad(
  registration: TrainingGpuObjectRegistration,
  asset: TrainingGpuDecodedObjectAsset,
  layer: TrainingGpuVolumeLayer,
  viewport: TrainingGpuViewport,
  parallax: TrainingGpuParallaxSnapshot,
) {
  const target = registration.target;
  if (target.type !== "ball") {
    throw new Error(registration.id + " is not the Training ball.");
  }

  const { sourceAnchor, target: destination } = target.grounding;
  const originX = sourceAnchor.x * TRAINING_GPU_LOGICAL_WIDTH;
  const originY = sourceAnchor.groundY * TRAINING_GPU_LOGICAL_HEIGHT;
  const canvasSceneRect = {
    x:
      originX -
      originX * destination.scale +
      (destination.x - sourceAnchor.x) * TRAINING_GPU_LOGICAL_WIDTH,
    y:
      originY -
      originY * destination.scale +
      (destination.groundY - sourceAnchor.groundY) *
        TRAINING_GPU_LOGICAL_HEIGHT,
    width: TRAINING_GPU_LOGICAL_WIDTH * destination.scale,
    height: TRAINING_GPU_LOGICAL_HEIGHT * destination.scale,
  };
  const localFrame = {
    width: canvasSceneRect.width,
    height: canvasSceneRect.height,
  };
  const localQuad = transformTrainingGpuObjectLocalQuad(
    getTrainingGpuObjectLocalQuad(asset.entry, localFrame, "contain"),
    localFrame,
    TRAINING_GPU_VOLUME_BALL_TRANSFORMS[layer],
  );
  const cssRect = convertTrainingGpuLogicalSceneRectToLocalCanvasRect(
    {
      x: canvasSceneRect.x + localQuad.x,
      y: canvasSceneRect.y + localQuad.y,
      width: localQuad.width,
      height: localQuad.height,
    },
    {
      width: viewport.cssWidth,
      height: viewport.cssHeight,
    },
  );

  return applyDepthTransform(
    cssRect,
    registration.depth,
    viewport,
    parallax,
  );
}

function tacticalStyle(
  objectId: SceneObjectId,
  role: TrainingGpuTacticalTextureRole,
  state: TrainingRadarTacticalState,
) {
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

export class TrainingGpuSceneRenderer {
  private assets: Partial<
    Record<TrainingGpuPreparedObjectId, TrainingGpuDecodedObjectAssetSet>
  > | null = null;
  private contextLost = false;
  private fennec: FennecResources | null = null;
  private gl: WebGL2RenderingContext | null;
  private lastMetrics = { ...EMPTY_FRAME_METRICS };
  private objectResources: Partial<
    Record<SceneObjectId, SceneObjectResources>
  > = {};
  private particleResources: Partial<
    Record<TrainingGpuParticleDepth, TrainingGpuParticleResources>
  > = {};
  private viewport: TrainingGpuViewport | null = null;
  private readonly handleContextLost: (event: Event) => void;
  private readonly handleContextRestored: () => void;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: TrainingGpuSceneRendererOptions,
  ) {
    this.gl = getWebGl2Context(canvas);
    this.contextLost = this.gl === null;
    this.handleContextLost = (event) => this.loseContext(event);
    this.handleContextRestored = () => this.restoreContext();
    canvas.addEventListener("webglcontextlost", this.handleContextLost);
    canvas.addEventListener(
      "webglcontextrestored",
      this.handleContextRestored,
    );
    this.updateDebugState();
  }

  initialize() {
    if (!this.gl || this.contextLost) {
      this.setAllReady(false);
      return false;
    }
    this.initializeParticles();
    this.initializeObjects();
    this.resize(this.viewport);
    this.updateDebugState();
    return this.hasAnyResources();
  }

  setAssets(
    assets: Partial<
      Record<TrainingGpuPreparedObjectId, TrainingGpuDecodedObjectAssetSet>
    > | null,
  ) {
    if (this.assets === assets) return;
    this.releaseObjectResources();
    this.assets = assets;
    this.initializeObjects();
    this.updateDebugState();
  }

  resize(viewport: TrainingGpuViewport | null) {
    this.viewport = viewport;
    if (!viewport || !this.gl || this.contextLost) {
      this.setAllReady(false);
      return;
    }
    if (
      this.canvas.width !== viewport.pixelWidth ||
      this.canvas.height !== viewport.pixelHeight
    ) {
      this.canvas.width = viewport.pixelWidth;
      this.canvas.height = viewport.pixelHeight;
    }
    this.gl.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
    this.updateDebugState();
  }

  render(
    snapshot: TrainingRadarTemporalSnapshot,
    running: boolean,
    staticRender = false,
  ) {
    const gl = this.gl;
    const viewport = this.viewport;
    if (!gl || !viewport || this.contextLost) return false;

    this.lastMetrics = { ...EMPTY_FRAME_METRICS };
    gl.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.lastMetrics.clearCalls = 1;
    const parallax = getTrainingGpuParallaxSnapshot();
    const objectSetReady =
      Object.keys(this.objectResources).length ===
        OBJECT_DRAW_ORDER.length && this.fennec !== null;

    if (running) this.renderParticles("far", snapshot, parallax);
    if (objectSetReady) {
      this.renderObject("left-car", snapshot, running, parallax);
    }
    if (running) this.renderParticles("mid", snapshot, parallax);
    if (objectSetReady) {
      this.renderObject("back-right-car", snapshot, running, parallax);
      this.renderObject("front-right-car", snapshot, running, parallax);
      this.renderObject("ball", snapshot, running, parallax);
    }
    if (running) this.renderParticles("near", snapshot, parallax);
    if (objectSetReady) {
      this.renderFennec(snapshot, running, parallax);
    }

    if (staticRender) {
      this.options.debugCollector?.recordStaticRender("bases");
      this.options.debugCollector?.recordStaticRender("fennec-base");
    }
    this.updateDebugState();
    return true;
  }

  clear() {
    if (!this.gl || this.contextLost) return;
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  getLastMetrics() {
    return { ...this.lastMetrics };
  }

  isContextAvailable() {
    return this.gl !== null && !this.contextLost;
  }

  destroy() {
    this.setAllReady(false);
    this.releaseParticleResources();
    this.releaseObjectResources();
    this.canvas.removeEventListener(
      "webglcontextlost",
      this.handleContextLost,
    );
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this.handleContextRestored,
    );
    this.gl = null;
    this.viewport = null;
    this.assets = null;
    this.updateDebugState();
  }

  private initializeParticles() {
    const gl = this.gl;
    if (!gl || this.contextLost) return;
    this.releaseParticleResources();
    try {
      for (const depth of TRAINING_GPU_PARTICLE_DEPTHS) {
        this.particleResources[depth] =
          createTrainingGpuParticleResources(
            gl,
            depth,
            Object.values(this.particleResources)[0]?.quadBuffer ??
              null,
          );
      }
      this.options.onParticlesReadyChange(true);
    } catch (error) {
      this.options.debugCollector?.recordSubsystemError(
        "particles",
        error,
      );
      this.releaseParticleResources();
      this.options.onParticlesReadyChange(false);
    }
  }

  private initializeObjects() {
    const gl = this.gl;
    if (!gl || this.contextLost || !this.assets) {
      this.setObjectReady(false);
      return;
    }
    this.releaseObjectResources();

    for (const objectId of OBJECT_DRAW_ORDER) {
      const assetSet = this.assets[objectId];
      if (!assetSet) continue;
      let volume: TrainingGpuVolumeResources | null = null;
      let base: TrainingGpuBaseResources | null = null;
      let tactical: TrainingGpuTacticalResources | null = null;
      try {
        const sharedResources = Object.values(
          this.objectResources,
        )[0];
        volume = createTrainingGpuVolumeResources(
          gl,
          assetSet,
          this.options.debugCollector,
          sharedResources?.volume ?? null,
        );
        base = createTrainingGpuBaseResources(
          gl,
          assetSet,
          this.options.debugCollector,
          sharedResources?.base ?? null,
        );
        tactical = createTrainingGpuTacticalResources(
          gl,
          assetSet,
          this.options.debugCollector,
          sharedResources?.tactical ?? null,
        );
        this.objectResources[objectId] = {
          assetSet,
          base,
          tactical,
          volume,
        };
      } catch (error) {
        destroyTrainingGpuTacticalResources(gl, tactical);
        destroyTrainingGpuBaseResources(gl, base);
        destroyTrainingGpuVolumeResources(gl, volume);
        this.options.debugCollector?.recordSubsystemError(
          "volume",
          error,
        );
      }
    }

    const fennecAssets = this.assets.fennec;
    if (fennecAssets) {
      this.fennec = this.createFennecResources(fennecAssets);
    }
    this.setObjectReady(true);
  }

  private createFennecResources(
    assetSet: TrainingGpuDecodedObjectAssetSet,
  ) {
    const gl = this.gl;
    const base = assetSet.assets.base;
    const impact = assetSet.assets.tacticalImpact;
    const headlight = assetSet.assets.headlightGlow;
    const rear = assetSet.assets.rearAccent;
    if (!gl || !base || !impact || !headlight || !rear) return null;

    let volume: TrainingGpuVolumeResources | null = null;
    let baseTexture: WebGLTexture | null = null;
    let impactTexture: WebGLTexture | null = null;
    let headlightTexture: WebGLTexture | null = null;
    let rearTexture: WebGLTexture | null = null;
    try {
      volume = createTrainingGpuVolumeResources(
        gl,
        assetSet,
        this.options.debugCollector,
        Object.values(this.objectResources)[0]?.volume ?? null,
      );
      baseTexture = createTrainingGpuVolumeTexture(
        gl,
        base,
        this.options.debugCollector,
      );
      impactTexture = createTrainingGpuVolumeTexture(
        gl,
        impact,
        this.options.debugCollector,
      );
      headlightTexture = createTrainingGpuVolumeTexture(
        gl,
        headlight,
        this.options.debugCollector,
      );
      rearTexture = createTrainingGpuVolumeTexture(
        gl,
        rear,
        this.options.debugCollector,
      );
      return {
        assetSet,
        baseTexture,
        effects: {
          headlight: headlightTexture,
          impact: impactTexture,
          rear: rearTexture,
        },
        volume,
      };
    } catch (error) {
      gl.deleteTexture(rearTexture);
      gl.deleteTexture(headlightTexture);
      gl.deleteTexture(impactTexture);
      gl.deleteTexture(baseTexture);
      destroyTrainingGpuVolumeResources(gl, volume);
      this.options.debugCollector?.recordSubsystemError(
        "fennec-volume",
        error,
      );
      return null;
    }
  }

  private renderParticles(
    depth: TrainingGpuParticleDepth,
    snapshot: TrainingRadarTemporalSnapshot,
    parallax: TrainingGpuParallaxSnapshot,
  ) {
    const gl = this.gl;
    const viewport = this.viewport;
    const resources = this.particleResources[depth];
    if (!gl || !viewport || !resources) return;

    const firstPass = snapshot.particlePasses[0];
    const secondPass = snapshot.particlePasses[1];
    const configuration = homeSceneDepths[
      `trainingParticles${depth[0].toUpperCase()}${depth.slice(1)}` as HomeSceneDepth
    ];
    const depthName =
      `trainingParticles${depth[0].toUpperCase()}${depth.slice(1)}` as HomeSceneDepth;
    const translationX =
      parallax.effectiveTranslationX[depthName] ??
      configuration.translationX;
    const scale =
      parallax.effectiveScaleX[depthName] ?? configuration.scale;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    this.lastMetrics.blendChanges += 1;
    gl.useProgram(resources.program);
    this.lastMetrics.programChanges += 1;
    gl.bindVertexArray(resources.vertexArray);
    gl.uniform2f(
      resources.uniforms.viewportCss,
      viewport.cssWidth,
      viewport.cssHeight,
    );
    gl.uniform2f(
      resources.uniforms.passElapsedMs,
      firstPass
        ? snapshot.frameState.nowMs - firstPass.passStartedAtMs
        : 0,
      secondPass
        ? snapshot.frameState.nowMs - secondPass.passStartedAtMs
        : 0,
    );
    gl.uniform2f(
      resources.uniforms.passValid,
      firstPass ? 1 : 0,
      secondPass ? 1 : 0,
    );
    if (resources.uniforms.parallaxOffset) {
      gl.uniform2f(
        resources.uniforms.parallaxOffset,
        parallax.point.x * translationX,
        parallax.point.y * configuration.translationY,
      );
    }
    if (resources.uniforms.parallaxScale) {
      gl.uniform1f(resources.uniforms.parallaxScale, scale);
    }
    gl.drawArraysInstanced(
      gl.TRIANGLES,
      0,
      6,
      resources.instanceCount,
    );
    this.lastMetrics.drawCalls += 1;
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  private renderObject(
    objectId: SceneObjectId,
    snapshot: TrainingRadarTemporalSnapshot,
    running: boolean,
    parallax: TrainingGpuParallaxSnapshot,
  ) {
    const resources = this.objectResources[objectId];
    const gl = this.gl;
    const viewport = this.viewport;
    if (!resources || !gl || !viewport) return;
    const registration = getTrainingGpuObjectRegistration(objectId);
    const baseAsset = resources.assetSet.assets.base;
    if (baseAsset) {
      renderTrainingGpuBaseTarget(
        gl,
        viewport,
        resources.volume.vertexArray,
        resources.base,
        sceneQuad(registration, baseAsset, viewport, parallax),
      );
      this.lastMetrics.blendChanges += 1;
      this.lastMetrics.programChanges += 1;
      this.lastMetrics.textureBinds += 1;
      this.lastMetrics.drawCalls += 1;
    }
    if (!running) return;
    this.renderVolume(
      resources,
      registration,
      snapshot.volume[objectId],
      parallax,
    );
    this.renderTactical(
      resources,
      registration,
      snapshot.tactical[objectId],
      parallax,
    );
  }

  private renderVolume(
    resources: SceneObjectResources,
    registration: TrainingGpuObjectRegistration,
    state: TrainingRadarVolumeScanState,
    parallax: TrainingGpuParallaxSnapshot,
  ) {
    const gl = this.gl;
    const viewport = this.viewport;
    if (!gl || !viewport || state.phase === "hidden") return;
    const kind = registration.kind === "ball" ? "ball" : "car";

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.ONE,
      gl.ONE_MINUS_SRC_COLOR,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    this.lastMetrics.blendChanges += 1;
    gl.useProgram(resources.volume.program);
    this.lastMetrics.programChanges += 1;
    gl.bindVertexArray(resources.volume.vertexArray);
    this.renderVolumeLayer(
      resources,
      registration,
      state,
      "surface",
      kind,
      parallax,
    );
    this.renderVolumeLayer(
      resources,
      registration,
      state,
      "contour",
      kind,
      parallax,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  private renderVolumeLayer(
    resources: SceneObjectResources,
    registration: TrainingGpuObjectRegistration,
    state: TrainingRadarVolumeScanState,
    layer: TrainingGpuVolumeLayer,
    kind: "car" | "ball",
    parallax: TrainingGpuParallaxSnapshot,
  ) {
    const gl = this.gl;
    const viewport = this.viewport;
    const asset =
      layer === "surface"
        ? resources.assetSet.assets.volumeSurface
        : resources.assetSet.assets.volumeContour;
    if (!gl || !viewport || !asset) return;
    const layerState = state[layer];
    if (layerState.opacity <= 0) return;
    const isLocalLeftCarSurface =
      registration.id === "left-car" && layer === "surface";
    const baseAsset = resources.assetSet.assets.base;
    const quad =
      kind === "ball"
        ? ballVolumeSceneQuad(
            registration,
            asset,
            layer,
            viewport,
            parallax,
          )
        : isLocalLeftCarSurface && baseAsset
          ? leftCarSurfaceSceneQuad(
              registration,
              baseAsset,
              asset,
              viewport,
              parallax,
            )
          : sceneQuad(registration, asset, viewport, parallax);
    const mask =
      kind === "ball"
        ? TRAINING_GPU_VOLUME_BALL_MASK
        : TRAINING_GPU_VOLUME_CAR_MASK;
    const progress =
      layer === "surface"
        ? state.surfaceProgress
        : state.contourProgress;
    const reverseMaskDirection =
      kind === "ball" || isLocalLeftCarSurface;
    const maskCenter = interpolate(
      reverseMaskDirection ? mask.endCenterX : mask.startCenterX,
      reverseMaskDirection ? mask.startCenterX : mask.endCenterX,
      progress,
    );
    const angleDegrees =
      registration.target.type === "car"
        ? Number.parseFloat(registration.target.objectScan.angle)
        : 0;
    const maskKind =
      isLocalLeftCarSurface
        ? LOCAL_CAR_SURFACE_MASK_KIND
        : kind === "car"
          ? layer === "surface"
            ? 0
            : 1
          : layer === "surface"
            ? 2
            : 3;
    const texture =
      layer === "surface"
        ? resources.volume.surfaceTexture
        : resources.volume.contourTexture;
    const glowPx =
      layer === "contour" ? (kind === "car" ? 4 : 3) : 0;
    const glowStrength =
      layer === "contour" ? (kind === "car" ? 0.44 : 0.34) : 0;

    this.setVolumeUniforms(
      resources.volume,
      quad,
      texture,
      {
        brightness: layerState.brightness,
        glowPx,
        glowStrength,
        maskAngle: (angleDegrees * Math.PI) / 180,
        maskCenter,
        maskKind,
        maskScaleX: mask.scaleX,
        maskScaleY: mask.scaleY,
        opacity: layerState.opacity,
        saturation: layerState.saturation,
      },
    );
  }

  private renderTactical(
    resources: SceneObjectResources,
    registration: TrainingGpuObjectRegistration,
    state: TrainingRadarTacticalState,
    parallax: TrainingGpuParallaxSnapshot,
  ) {
    const gl = this.gl;
    const viewport = this.viewport;
    if (!gl || !viewport || state.phase === "hidden") return;

    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.ONE,
      gl.ONE_MINUS_SRC_COLOR,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    this.lastMetrics.blendChanges += 1;
    gl.useProgram(resources.tactical.program);
    this.lastMetrics.programChanges += 1;
    gl.bindVertexArray(resources.volume.vertexArray);
    gl.uniform2f(
      resources.tactical.uniforms.viewportCss,
      viewport.cssWidth,
      viewport.cssHeight,
    );
    for (const role of TACTICAL_ROLES[registration.id as SceneObjectId]) {
      const asset = resources.assetSet.assets[role];
      const texture = resources.tactical.textures[role];
      if (!asset || !texture) continue;
      const style = tacticalStyle(
        registration.id as SceneObjectId,
        role,
        state,
      );
      if (style.opacity <= 0) continue;
      const quad = sceneQuad(registration, asset, viewport, parallax);
      gl.uniform4f(
        resources.tactical.uniforms.quadCss,
        quad.x,
        quad.y,
        quad.width,
        quad.height,
      );
      gl.uniform1f(
        resources.tactical.uniforms.opacity,
        style.opacity,
      );
      gl.uniform1f(
        resources.tactical.uniforms.brightness,
        style.brightness,
      );
      gl.uniform1f(
        resources.tactical.uniforms.saturation,
        style.saturation,
      );
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      this.lastMetrics.textureBinds += 1;
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      this.lastMetrics.drawCalls += 1;
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  private renderFennec(
    snapshot: TrainingRadarTemporalSnapshot,
    running: boolean,
    parallax: TrainingGpuParallaxSnapshot,
  ) {
    const fennec = this.fennec;
    const gl = this.gl;
    const viewport = this.viewport;
    if (!fennec || !gl || !viewport) return;
    const registration = getTrainingGpuObjectRegistration("fennec");
    const base = fennec.assetSet.assets.base;
    if (base) {
      this.beginFennecProgram(fennec.volume, false);
      this.renderUnmaskedFennecLayer(
        fennec.volume,
        fennec.baseTexture,
        sceneQuad(registration, base, viewport, parallax),
        snapshot.fennecEffects.baseOpacity,
        1,
        1,
      );
      this.endFennecProgram();
    }
    if (running && snapshot.volume.fennec.phase !== "hidden") {
      this.renderFennecVolume(
        fennec,
        registration,
        snapshot.volume.fennec,
        parallax,
      );
    }
    this.renderFennecEffects(
      fennec,
      registration,
      snapshot.fennecEffects,
      parallax,
    );
  }

  private renderFennecVolume(
    fennec: FennecResources,
    registration: TrainingGpuObjectRegistration,
    state: TrainingRadarVolumeScanState,
    parallax: TrainingGpuParallaxSnapshot,
  ) {
    const viewport = this.viewport;
    if (!viewport) return;
    this.beginFennecProgram(fennec.volume, true);
    for (const layer of ["surface", "contour"] as const) {
      const asset =
        layer === "surface"
          ? fennec.assetSet.assets.volumeSurface
          : fennec.assetSet.assets.volumeContour;
      const layerState = state[layer];
      if (!asset || layerState.opacity <= 0) continue;
      const progress =
        layer === "surface"
          ? state.surfaceProgress
          : state.contourProgress;
      const maskCenter = interpolate(
        trainingFennecVolumeScanTarget.scanRange.startProgress,
        trainingFennecVolumeScanTarget.scanRange.endProgress,
        progress,
      );
      this.setVolumeUniforms(
        fennec.volume,
        sceneQuad(registration, asset, viewport, parallax),
        layer === "surface"
          ? fennec.volume.surfaceTexture
          : fennec.volume.contourTexture,
        {
          brightness: layerState.brightness,
          glowPx: 0,
          glowStrength: 0,
          maskAngle: 0,
          maskCenter,
          maskKind: layer === "surface" ? 0 : 1,
          maskScaleX: FENNEC_MASK_SCALE.x,
          maskScaleY: FENNEC_MASK_SCALE.y,
          opacity: layerState.opacity,
          saturation: layerState.saturation,
        },
      );
    }
    this.endFennecProgram();
  }

  private renderFennecEffects(
    fennec: FennecResources,
    registration: TrainingGpuObjectRegistration,
    state: TrainingRadarFennecEffectsState,
    parallax: TrainingGpuParallaxSnapshot,
  ) {
    const viewport = this.viewport;
    if (!viewport) return;
    const layers = [
      {
        asset: fennec.assetSet.assets.tacticalImpact,
        texture: fennec.effects.impact,
        opacity: state.impactOpacity,
        brightness: 1,
        saturation: 1,
      },
      {
        asset: fennec.assetSet.assets.rearAccent,
        texture: fennec.effects.rear,
        opacity: state.rearAccentOpacity,
        brightness: 0.98,
        saturation: 1.1,
      },
      {
        asset: fennec.assetSet.assets.headlightGlow,
        texture: fennec.effects.headlight,
        opacity: state.headlightOpacity,
        brightness: 0.92,
        saturation: 1.04,
      },
    ] as const;
    this.beginFennecProgram(fennec.volume, true);
    for (const layer of layers) {
      if (!layer.asset || layer.opacity <= 0) continue;
      this.renderUnmaskedFennecLayer(
        fennec.volume,
        layer.texture,
        sceneQuad(registration, layer.asset, viewport, parallax),
        layer.opacity,
        layer.brightness,
        layer.saturation,
      );
    }
    this.endFennecProgram();
  }

  private beginFennecProgram(
    resources: TrainingGpuVolumeResources,
    screenBlend: boolean,
  ) {
    const gl = this.gl;
    if (!gl) return;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.ONE,
      screenBlend ? gl.ONE_MINUS_SRC_COLOR : gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    this.lastMetrics.blendChanges += 1;
    gl.useProgram(resources.program);
    this.lastMetrics.programChanges += 1;
    gl.bindVertexArray(resources.vertexArray);
  }

  private endFennecProgram() {
    const gl = this.gl;
    if (!gl) return;
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  private renderUnmaskedFennecLayer(
    resources: TrainingGpuVolumeResources,
    texture: WebGLTexture,
    quad: TrainingGpuObjectRenderRect,
    opacity: number,
    brightness: number,
    saturation: number,
  ) {
    this.setVolumeUniforms(resources, quad, texture, {
      brightness,
      glowPx: 0,
      glowStrength: 0,
      maskAngle: 0,
      maskCenter: 10,
      maskKind: 0,
      maskScaleX: 1,
      maskScaleY: 1,
      opacity,
      saturation,
    });
  }

  private setVolumeUniforms(
    resources: TrainingGpuVolumeResources,
    quad: TrainingGpuObjectRenderRect,
    texture: WebGLTexture,
    style: {
      brightness: number;
      glowPx: number;
      glowStrength: number;
      maskAngle: number;
      maskCenter: number;
      maskKind: number;
      maskScaleX: number;
      maskScaleY: number;
      opacity: number;
      saturation: number;
    },
  ) {
    const gl = this.gl;
    const viewport = this.viewport;
    if (!gl || !viewport || style.opacity <= 0) return;
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
    gl.uniform1i(resources.uniforms.maskKind, style.maskKind);
    gl.uniform1f(resources.uniforms.maskCenter, style.maskCenter);
    gl.uniform2f(
      resources.uniforms.maskScale,
      style.maskScaleX,
      style.maskScaleY,
    );
    gl.uniform1f(resources.uniforms.maskAngle, style.maskAngle);
    gl.uniform1f(resources.uniforms.opacity, style.opacity);
    gl.uniform1f(resources.uniforms.brightness, style.brightness);
    gl.uniform1f(resources.uniforms.saturation, style.saturation);
    gl.uniform2f(
      resources.uniforms.glowOffset,
      style.glowPx / Math.max(1, quad.width),
      style.glowPx / Math.max(1, quad.height),
    );
    gl.uniform1f(
      resources.uniforms.glowStrength,
      style.glowStrength,
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    this.lastMetrics.textureBinds += 1;
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    this.lastMetrics.drawCalls += 1;
  }

  private setObjectReady(initialized: boolean) {
    const objectCount = Object.keys(this.objectResources).length;
    const objectsReady = initialized && objectCount === OBJECT_DRAW_ORDER.length;
    this.options.onBaseReadyChange(objectsReady);
    this.options.onVolumeReadyChange(objectsReady);
    this.options.onTacticalReadyChange(objectsReady);
    this.options.onFennecBaseReadyChange(Boolean(this.fennec));
    this.options.onFennecVolumeReadyChange(Boolean(this.fennec));
    this.options.onFennecEffectsReadyChange(Boolean(this.fennec));
  }

  private setAllReady(ready: boolean) {
    this.options.onParticlesReadyChange(ready);
    this.options.onBaseReadyChange(ready);
    this.options.onVolumeReadyChange(ready);
    this.options.onTacticalReadyChange(ready);
    this.options.onFennecBaseReadyChange(ready);
    this.options.onFennecVolumeReadyChange(ready);
    this.options.onFennecEffectsReadyChange(ready);
  }

  private releaseParticleResources() {
    const gl = this.gl;
    if (gl && !this.contextLost) {
      for (const resources of Object.values(this.particleResources)) {
        destroyTrainingGpuParticleResources(gl, resources ?? null);
      }
    }
    this.particleResources = {};
    this.options.onParticlesReadyChange(false);
  }

  private releaseObjectResources() {
    const gl = this.gl;
    if (gl && !this.contextLost) {
      for (const resources of Object.values(this.objectResources)) {
        if (!resources) continue;
        destroyTrainingGpuTacticalResources(gl, resources.tactical);
        destroyTrainingGpuBaseResources(gl, resources.base);
        destroyTrainingGpuVolumeResources(gl, resources.volume);
      }
      if (this.fennec) {
        gl.deleteTexture(this.fennec.baseTexture);
        gl.deleteTexture(this.fennec.effects.impact);
        gl.deleteTexture(this.fennec.effects.rear);
        gl.deleteTexture(this.fennec.effects.headlight);
        destroyTrainingGpuVolumeResources(gl, this.fennec.volume);
      }
    }
    this.objectResources = {};
    this.fennec = null;
    this.setObjectReady(false);
  }

  private hasAnyResources() {
    return (
      Object.keys(this.particleResources).length > 0 ||
      Object.keys(this.objectResources).length > 0 ||
      this.fennec !== null
    );
  }

  private loseContext(event: Event) {
    event.preventDefault();
    this.contextLost = true;
    this.particleResources = {};
    this.objectResources = {};
    this.fennec = null;
    this.setAllReady(false);
    for (const subsystem of [
      "particles",
      "bases",
      "volume",
      "tactical",
      "fennec-base",
      "fennec-volume",
      "fennec-effects",
    ] as const) {
      this.options.debugCollector?.recordContextLost(subsystem);
    }
    this.updateDebugState();
  }

  private restoreContext() {
    this.gl = getWebGl2Context(this.canvas);
    this.contextLost = this.gl === null;
    if (!this.gl) {
      this.setAllReady(false);
      this.updateDebugState();
      return;
    }
    this.initializeParticles();
    this.initializeObjects();
    this.resize(this.viewport);
    for (const subsystem of [
      "particles",
      "bases",
      "volume",
      "tactical",
      "fennec-base",
      "fennec-volume",
      "fennec-effects",
    ] as const) {
      this.options.debugCollector?.recordContextRestored(subsystem);
    }
    this.options.onContextRestored();
    this.updateDebugState();
  }

  private updateDebugState() {
    const debug = this.options.debugCollector;
    if (!debug) return;
    const contextState = !this.gl
      ? "unavailable"
      : this.contextLost
        ? "lost"
        : "available";
    const canvasMetrics = this.viewport
      ? [
          {
            id: "training-scene-consolidated",
            subsystem: "particles" as const,
            cssWidth: this.viewport.cssWidth,
            cssHeight: this.viewport.cssHeight,
            pixelWidth: this.viewport.pixelWidth,
            pixelHeight: this.viewport.pixelHeight,
          },
        ]
      : [];
    const objectCount = Object.keys(this.objectResources).length;
    const fennecCount = this.fennec ? 1 : 0;
    const objectTextureCount = Object.values(this.objectResources).reduce(
      (total, resources) =>
        total +
        (resources
          ? 3 + Object.keys(resources.tactical.textures).length
          : 0),
      0,
    );
    const objectVolumeTextureBytes = Object.values(
      this.objectResources,
    ).reduce(
      (total, resources) =>
        total +
        roleTextureBytes(resources?.assetSet ?? null, [
          "volumeSurface",
          "volumeContour",
        ]),
      0,
    );
    const objectTacticalTextureBytes = Object.values(
      this.objectResources,
    ).reduce(
      (total, resources) =>
        total +
        roleTextureBytes(
          resources?.assetSet ?? null,
          resources
            ? TACTICAL_ROLES[resources.assetSet.objectId as SceneObjectId]
            : [],
        ),
      0,
    );
    const fennecBaseTextureBytes = roleTextureBytes(
      this.fennec?.assetSet ?? null,
      ["base"],
    );
    const fennecVolumeTextureBytes = roleTextureBytes(
      this.fennec?.assetSet ?? null,
      ["volumeSurface", "volumeContour"],
    );
    const fennecEffectsTextureBytes = roleTextureBytes(
      this.fennec?.assetSet ?? null,
      ["tacticalImpact", "headlightGlow", "rearAccent"],
    );

    debug.setSubsystemState("particles", {
      initialized: Object.keys(this.particleResources).length === 3,
      ready: Object.keys(this.particleResources).length === 3,
      contextState,
    });
    debug.setSubsystemResources(
      "particles",
      {
        contexts: this.gl && !this.contextLost ? 1 : 0,
        programs: Object.keys(this.particleResources).length,
        buffers:
          Object.keys(this.particleResources).length +
          (Object.keys(this.particleResources).length > 0 ? 1 : 0),
        vertexArrays: Object.keys(this.particleResources).length,
        textures: 0,
        estimatedTextureBytes: 0,
      },
      canvasMetrics,
    );
    debug.setSubsystemState("bases", {
      initialized: objectCount === 4,
      ready: objectCount === 4,
      contextState,
    });
    debug.setSubsystemResources(
      "bases",
      {
        contexts: 0,
        programs: objectCount > 0 ? 1 : 0,
        buffers: 0,
        vertexArrays: 0,
        textures: objectCount,
        estimatedTextureBytes: Object.values(
          this.objectResources,
        ).reduce(
          (total, resources) =>
            total +
            (resources?.assetSet.assets.base
              ? resources.assetSet.assets.base.entry.outputSize.width *
                resources.assetSet.assets.base.entry.outputSize.height *
                4
              : 0),
          0,
        ),
      },
      [],
    );
    debug.setSubsystemState("volume", {
      initialized: objectCount === 4,
      ready: objectCount === 4,
      contextState,
    });
    debug.setSubsystemResources(
      "volume",
      {
        contexts: 0,
        programs: objectCount > 0 ? 1 : 0,
        buffers: objectCount > 0 ? 1 : 0,
        vertexArrays: objectCount > 0 ? 1 : 0,
        textures: objectCount * 2,
        estimatedTextureBytes: objectVolumeTextureBytes,
      },
      [],
    );
    debug.setSubsystemState("tactical", {
      initialized: objectCount === 4,
      ready: objectCount === 4,
      contextState,
    });
    debug.setSubsystemResources(
      "tactical",
      {
        contexts: 0,
        programs: objectCount > 0 ? 1 : 0,
        buffers: 0,
        vertexArrays: 0,
        textures: Math.max(0, objectTextureCount - objectCount * 3),
        estimatedTextureBytes: objectTacticalTextureBytes,
      },
      [],
    );
    for (const subsystem of [
      "fennec-base",
      "fennec-volume",
      "fennec-effects",
    ] as const) {
      debug.setSubsystemState(subsystem, {
        initialized: fennecCount === 1,
        ready: fennecCount === 1,
        contextState,
      });
    }
    debug.setSubsystemResources(
      "fennec-base",
      {
        contexts: 0,
        programs: 0,
        buffers: 0,
        vertexArrays: 0,
        textures: fennecCount,
        estimatedTextureBytes: fennecBaseTextureBytes,
      },
      [],
    );
    debug.setSubsystemResources(
      "fennec-volume",
      {
        contexts: 0,
        programs: 0,
        buffers: 0,
        vertexArrays: 0,
        textures: fennecCount * 2,
        estimatedTextureBytes: fennecVolumeTextureBytes,
      },
      [],
    );
    debug.setSubsystemResources(
      "fennec-effects",
      {
        contexts: 0,
        programs: 0,
        buffers: 0,
        vertexArrays: 0,
        textures: fennecCount * 3,
        estimatedTextureBytes: fennecEffectsTextureBytes,
      },
      [],
    );
  }
}
