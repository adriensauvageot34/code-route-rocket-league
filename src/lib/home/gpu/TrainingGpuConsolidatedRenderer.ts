import {
  TRAINING_GPU_CONTEXT_ATTRIBUTES,
  TRAINING_GPU_LOGICAL_HEIGHT,
  TRAINING_GPU_LOGICAL_WIDTH,
} from "@/lib/home/gpu/trainingGpuConstants";
import {
  createTrainingGpuRadarPlaneResources,
  destroyTrainingGpuRadarPlaneResources,
  type TrainingGpuRadarPlane,
  type TrainingGpuRadarPlaneResources,
} from "@/lib/home/gpu/trainingGpuShaderUtils";
import {
  TrainingGpuSceneRenderer,
  type TrainingGpuSceneFrameMetrics,
} from "@/lib/home/gpu/TrainingGpuSceneRenderer";
import type {
  TrainingGpuFrameState,
  TrainingGpuViewport,
} from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingGpuPreparedObjectId } from "@/lib/home/gpu/trainingGpuObjectAssetCatalog";
import type { TrainingGpuDecodedObjectAssetSet } from "@/lib/home/gpu/TrainingGpuObjectAssetLoader";
import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
import type {
  TrainingCameraApplyMetrics,
  TrainingCameraFrameApplier,
} from "@/lib/home/trainingCamera";
import {
  TRAINING_RADAR_SWEEP,
  TRAINING_RADAR_TIMING,
} from "@/lib/home/trainingRadarTargets";
import {
  getTrainingRadarTemporalSnapshot,
  type TrainingRadarTemporalSnapshot,
} from "@/lib/home/trainingRadarSnapshots";

type TrainingGpuFrameStateFactory = (nowMs: number) => TrainingGpuFrameState;

type TrainingGpuConsolidatedCanvases = {
  radar: {
    surface: HTMLCanvasElement;
    sweep: HTMLCanvasElement;
  };
  scene: HTMLCanvasElement;
};

type TrainingGpuRadarTarget = {
  canvas: HTMLCanvasElement;
  contextLost: boolean;
  gl: WebGL2RenderingContext | null;
  onContextLost: (event: Event) => void;
  onContextRestored: () => void;
  plane: TrainingGpuRadarPlane;
  resources: TrainingGpuRadarPlaneResources | null;
};

type TrainingGpuConsolidatedRendererOptions = {
  applyCameraSnapshot: TrainingCameraFrameApplier;
  applyDomSnapshot:
    | ((snapshot: TrainingRadarTemporalSnapshot) => void)
    | null;
  createFrameState: TrainingGpuFrameStateFactory;
  debugCollector: TrainingGpuDebugCollector | null;
  fieldMaskPixels: Uint8Array | null;
  onBasesReadyChange: (ready: boolean) => void;
  onFennecBaseReadyChange: (ready: boolean) => void;
  onFennecEffectsReadyChange: (ready: boolean) => void;
  onFennecVolumeReadyChange: (ready: boolean) => void;
  onParticlesReadyChange: (ready: boolean) => void;
  onRadarReadyChange: (ready: boolean) => void;
  onVolumeScansReadyChange: (ready: boolean) => void;
  onTacticalReadyChange: (ready: boolean) => void;
  terrainImage: HTMLImageElement | null;
};

const INITIAL_FRAME_STATE: TrainingGpuFrameState = {
  active: false,
  running: false,
  passKey: 0,
  passMode: "volume",
  passStartedAtMs: 0,
  nowMs: 0,
  elapsedMs: 0,
  radarProgress: 0,
  passDurationMs: TRAINING_RADAR_TIMING.passDurationMs,
};

function getWebGl2Context(canvas: HTMLCanvasElement) {
  return canvas.getContext(
    "webgl2",
    TRAINING_GPU_CONTEXT_ATTRIBUTES,
  ) as WebGL2RenderingContext | null;
}

export class TrainingGpuConsolidatedRenderer {
  private animationFrameId: number | null = null;
  private frameState = INITIAL_FRAME_STATE;
  private radarInitialized = false;
  private radarReady = false;
  private shouldRun = false;
  private viewport: TrainingGpuViewport | null = null;
  private readonly radarTargets: Record<
    TrainingGpuRadarPlane,
    TrainingGpuRadarTarget
  >;
  private readonly sceneRenderer: TrainingGpuSceneRenderer;

  constructor(
    canvases: TrainingGpuConsolidatedCanvases,
    private readonly options: TrainingGpuConsolidatedRendererOptions,
  ) {
    this.radarTargets = {
      surface: this.createRadarTarget(
        "surface",
        canvases.radar.surface,
      ),
      sweep: this.createRadarTarget("sweep", canvases.radar.sweep),
    };
    this.sceneRenderer = new TrainingGpuSceneRenderer(canvases.scene, {
      debugCollector: options.debugCollector,
      onBaseReadyChange: options.onBasesReadyChange,
      onContextRestored: () => {
        this.completeFirstRender();
        this.syncAnimationLoop();
      },
      onFennecBaseReadyChange: options.onFennecBaseReadyChange,
      onFennecEffectsReadyChange: options.onFennecEffectsReadyChange,
      onFennecVolumeReadyChange: options.onFennecVolumeReadyChange,
      onParticlesReadyChange: options.onParticlesReadyChange,
      onTacticalReadyChange: options.onTacticalReadyChange,
      onVolumeReadyChange: options.onVolumeScansReadyChange,
    });

    for (const target of Object.values(this.radarTargets)) {
      target.canvas.addEventListener(
        "webglcontextlost",
        target.onContextLost,
      );
      target.canvas.addEventListener(
        "webglcontextrestored",
        target.onContextRestored,
      );
    }
    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    this.updateRadarDebugState();
    this.updateGlobalDebugState();
  }

  initialize() {
    this.initializeRadarSubsystem();
    const sceneInitialized = this.sceneRenderer.initialize();
    this.completeFirstRender();
    this.syncAnimationLoop();
    return (
      this.options.applyDomSnapshot !== null ||
      this.radarInitialized ||
      sceneInitialized
    );
  }

  resize(viewport: TrainingGpuViewport) {
    this.viewport = viewport;
    this.options.debugCollector?.setGlobal({
      dpr: viewport.effectiveDpr,
      renderScale: viewport.renderScale,
      viewportCssWidth: viewport.cssWidth,
      viewportCssHeight: viewport.cssHeight,
      viewportPixelWidth: viewport.pixelWidth,
      viewportPixelHeight: viewport.pixelHeight,
    });
    for (const target of Object.values(this.radarTargets)) {
      if (
        target.canvas.width !== viewport.pixelWidth ||
        target.canvas.height !== viewport.pixelHeight
      ) {
        target.canvas.width = viewport.pixelWidth;
        target.canvas.height = viewport.pixelHeight;
      }
      target.gl?.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
    }
    this.sceneRenderer.resize(viewport);
    this.completeFirstRender();
    this.updateRadarDebugState();
  }

  setVolumeAssets(
    assets: Partial<
      Record<TrainingGpuPreparedObjectId, TrainingGpuDecodedObjectAssetSet>
    > | null,
  ) {
    this.sceneRenderer.setAssets(assets);
    this.completeFirstRender();
    this.syncAnimationLoop();
  }

  setFrameState(state: TrainingGpuFrameState) {
    this.frameState = state;
    this.updateGlobalDebugState();
    this.syncAnimationLoop();
  }

  start() {
    this.shouldRun = true;
    this.updateGlobalDebugState();
    this.syncAnimationLoop();
  }

  stop() {
    this.shouldRun = false;
    this.cancelAnimationFrame();
    this.clearRadarCanvases();
    this.renderStaticFrame();
    this.updateGlobalDebugState();
  }

  render(nowMs: number) {
    const frameState = this.options.createFrameState(nowMs);
    const snapshot = getTrainingRadarTemporalSnapshot(frameState);
    this.frameState = frameState;
    this.publishCameraDebug(
      this.options.applyCameraSnapshot(snapshot),
    );
    this.options.applyDomSnapshot?.(snapshot);
    this.options.debugCollector?.recordFrame(nowMs);

    let radarDraws = 0;
    let radarClears = 0;
    let radarTextureBinds = 0;
    if (this.radarReady && frameState.active && frameState.running) {
      const radarStartedAt = this.options.debugCollector
        ? performance.now()
        : 0;
      const radarMetrics = this.renderRadarFrame(snapshot);
      radarDraws = radarMetrics.draws;
      radarClears = radarMetrics.clears;
      radarTextureBinds = radarMetrics.textureBinds;
      this.options.debugCollector?.recordSubsystemCpu(
        "radar",
        performance.now() - radarStartedAt,
      );
    } else {
      this.clearRadarCanvases();
      radarClears = 2;
    }

    const sceneStartedAt = this.options.debugCollector
      ? performance.now()
      : 0;
    this.sceneRenderer.render(
      snapshot,
      frameState.active && frameState.running,
    );
    const sceneMetrics = this.sceneRenderer.getLastMetrics();
    this.options.debugCollector?.recordSubsystemCpu(
      "bases",
      performance.now() - sceneStartedAt,
    );
    this.publishFrameMetrics(
      sceneMetrics,
      radarDraws,
      radarClears,
      radarTextureBinds,
    );
    this.updateGlobalDebugState();
  }

  destroy() {
    this.shouldRun = false;
    this.cancelAnimationFrame();
    this.setRadarReady(false);
    this.clearRadarCanvases();
    this.releaseRadarResources();
    this.sceneRenderer.destroy();
    for (const target of Object.values(this.radarTargets)) {
      target.canvas.removeEventListener(
        "webglcontextlost",
        target.onContextLost,
      );
      target.canvas.removeEventListener(
        "webglcontextrestored",
        target.onContextRestored,
      );
      target.gl = null;
    }
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    this.viewport = null;
    this.radarInitialized = false;
    this.updateRadarDebugState();
    this.updateGlobalDebugState();
  }

  private createRadarTarget(
    plane: TrainingGpuRadarPlane,
    canvas: HTMLCanvasElement,
  ): TrainingGpuRadarTarget {
    const target: TrainingGpuRadarTarget = {
      canvas,
      contextLost: false,
      gl: getWebGl2Context(canvas),
      onContextLost: (_event: Event) => undefined,
      onContextRestored: () => undefined,
      plane,
      resources: null,
    };
    target.contextLost = target.gl === null;
    target.onContextLost = (event) =>
      this.loseRadarTarget(target, event);
    target.onContextRestored = () => this.restoreRadarTarget(target);
    return target;
  }

  private initializeRadarSubsystem() {
    try {
      for (const target of Object.values(this.radarTargets)) {
        this.initializeRadarTarget(target);
      }
      this.radarInitialized = this.hasRadarResources();
    } catch (error) {
      this.options.debugCollector?.recordSubsystemError("radar", error);
      this.radarInitialized = false;
      this.releaseRadarResources();
      this.setRadarReady(false);
    }
    this.updateRadarDebugState();
  }

  private initializeRadarTarget(target: TrainingGpuRadarTarget) {
    if (
      !target.gl ||
      target.contextLost ||
      !this.options.fieldMaskPixels ||
      !this.options.terrainImage
    ) {
      throw new Error("Training radar WebGL2 resources are unavailable.");
    }
    destroyTrainingGpuRadarPlaneResources(
      target.gl,
      target.resources,
    );
    target.resources = createTrainingGpuRadarPlaneResources(
      target.gl,
      target.plane,
      this.options.fieldMaskPixels,
      this.options.terrainImage,
    );
    if (this.viewport) {
      target.gl.viewport(
        0,
        0,
        this.viewport.pixelWidth,
        this.viewport.pixelHeight,
      );
    }
  }

  private completeFirstRender() {
    const snapshot = getTrainingRadarTemporalSnapshot(
      this.options.createFrameState(performance.now()),
    );
    this.frameState = snapshot.frameState;
    this.publishCameraDebug(
      this.options.applyCameraSnapshot(snapshot),
    );
    this.options.applyDomSnapshot?.(snapshot);
    if (
      this.viewport &&
      this.radarInitialized &&
      this.hasRadarResources()
    ) {
      if (snapshot.frameState.active && snapshot.frameState.running) {
        this.renderRadarFrame(snapshot);
      } else {
        this.clearRadarCanvases();
      }
      this.setRadarReady(true);
    } else {
      this.setRadarReady(false);
    }
    this.sceneRenderer.render(
      snapshot,
      snapshot.frameState.active && snapshot.frameState.running,
      !snapshot.frameState.running,
    );
  }

  private renderRadarFrame(snapshot: TrainingRadarTemporalSnapshot) {
    if (!this.viewport) {
      return { clears: 0, draws: 0, textureBinds: 0 };
    }
    const radarX =
      TRAINING_RADAR_SWEEP.startX +
      (TRAINING_RADAR_SWEEP.endX - TRAINING_RADAR_SWEEP.startX) *
        snapshot.frameState.radarProgress;
    let draws = 0;
    let clears = 0;
    let textureBinds = 0;
    for (const target of Object.values(this.radarTargets)) {
      const metrics = this.renderRadarTarget(
        target,
        radarX,
        snapshot.radarVisibility,
      );
      draws += metrics.draws;
      clears += metrics.clears;
      textureBinds += metrics.textureBinds;
    }
    return { clears, draws, textureBinds };
  }

  private renderRadarTarget(
    target: TrainingGpuRadarTarget,
    radarX: number,
    radarVisibility: number,
  ) {
    const gl = target.gl;
    const resources = target.resources;
    const viewport = this.viewport;
    if (!gl || !resources || !viewport || target.contextLost) {
      return { clears: 0, draws: 0, textureBinds: 0 };
    }
    gl.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(resources.program);
    gl.bindVertexArray(resources.vertexArray);
    gl.uniform2f(
      resources.uniforms.viewportCss,
      viewport.cssWidth,
      viewport.cssHeight,
    );
    gl.uniform2f(
      resources.uniforms.logicalSize,
      TRAINING_GPU_LOGICAL_WIDTH,
      TRAINING_GPU_LOGICAL_HEIGHT,
    );
    gl.uniform1f(
      resources.uniforms.effectiveDpr,
      viewport.effectiveDpr,
    );
    gl.uniform1f(resources.uniforms.radarX, radarX);
    gl.uniform1f(resources.uniforms.visibility, radarVisibility);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, resources.fieldMaskTexture);
    let textureBinds = 1;
    if (resources.terrainTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, resources.terrainTexture);
      textureBinds += 1;
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    gl.useProgram(null);
    return { clears: 1, draws: 1, textureBinds };
  }

  private renderStaticFrame() {
    const staticState: TrainingGpuFrameState = {
      ...this.frameState,
      running: false,
    };
    const snapshot = getTrainingRadarTemporalSnapshot(staticState);
    this.publishCameraDebug(
      this.options.applyCameraSnapshot(snapshot),
    );
    this.options.applyDomSnapshot?.(snapshot);
    this.sceneRenderer.render(snapshot, false, true);
    this.publishFrameMetrics(
      this.sceneRenderer.getLastMetrics(),
      0,
      2,
      0,
    );
  }

  private canAnimate() {
    return (
      this.shouldRun &&
      this.frameState.active &&
      this.frameState.running &&
      document.visibilityState === "visible"
    );
  }

  private syncAnimationLoop() {
    if (!this.canAnimate()) {
      this.cancelAnimationFrame();
      if (!this.frameState.active || !this.frameState.running) {
        this.clearRadarCanvases();
        this.renderStaticFrame();
      }
      return;
    }
    if (this.animationFrameId === null) {
      this.animationFrameId = window.requestAnimationFrame(
        this.handleAnimationFrame,
      );
    }
    this.updateGlobalDebugState();
  }

  private cancelAnimationFrame() {
    if (this.animationFrameId === null) return;
    window.cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.updateGlobalDebugState();
  }

  private clearRadarCanvases() {
    for (const target of Object.values(this.radarTargets)) {
      if (target.gl && !target.contextLost) {
        target.gl.clear(target.gl.COLOR_BUFFER_BIT);
      }
    }
  }

  private setRadarReady(ready: boolean) {
    if (this.radarReady === ready) return;
    this.radarReady = ready;
    this.options.onRadarReadyChange(ready);
    this.updateRadarDebugState();
  }

  private hasRadarResources() {
    return Object.values(this.radarTargets).every(
      (target) =>
        target.gl !== null &&
        !target.contextLost &&
        target.resources !== null,
    );
  }

  private releaseRadarResources() {
    for (const target of Object.values(this.radarTargets)) {
      if (target.gl && !target.contextLost) {
        destroyTrainingGpuRadarPlaneResources(
          target.gl,
          target.resources,
        );
      }
      target.resources = null;
    }
    this.updateRadarDebugState();
  }

  private loseRadarTarget(
    target: TrainingGpuRadarTarget,
    event: Event,
  ) {
    event.preventDefault();
    target.contextLost = true;
    target.resources = null;
    this.radarInitialized = false;
    this.options.debugCollector?.recordContextLost("radar");
    this.setRadarReady(false);
    this.updateRadarDebugState();
  }

  private restoreRadarTarget(target: TrainingGpuRadarTarget) {
    target.gl = getWebGl2Context(target.canvas);
    target.contextLost = target.gl === null;
    if (!target.gl) {
      this.setRadarReady(false);
      this.updateRadarDebugState();
      return;
    }
    try {
      this.initializeRadarTarget(target);
      this.radarInitialized = this.hasRadarResources();
      this.options.debugCollector?.recordContextRestored("radar");
      this.completeFirstRender();
      this.syncAnimationLoop();
    } catch (error) {
      this.options.debugCollector?.recordSubsystemError("radar", error);
      this.setRadarReady(false);
    }
    this.updateRadarDebugState();
  }

  private publishFrameMetrics(
    scene: TrainingGpuSceneFrameMetrics,
    radarDraws: number,
    radarClears: number,
    radarTextureBinds: number,
  ) {
    this.options.debugCollector?.setGlobal({
      canvasCount: 3,
      contextCount:
        Object.values(this.radarTargets).filter(
          (target) => target.gl && !target.contextLost,
        ).length +
        (this.sceneRenderer.isContextAvailable() ? 1 : 0),
      drawCallsPerFrame: scene.drawCalls + radarDraws,
      clearCallsPerFrame: scene.clearCalls + radarClears,
      programChangesPerFrame:
        scene.programChanges + radarDraws,
      textureBindsPerFrame:
        scene.textureBinds + radarTextureBinds,
      blendChangesPerFrame: scene.blendChanges,
      framebufferChangesPerFrame:
        scene.framebufferChanges,
    });
  }

  private publishCameraDebug(metrics: TrainingCameraApplyMetrics) {
    const camera = metrics.cameraSnapshot;
    this.options.debugCollector?.setGlobal({
      cameraAbsoluteResumeCorrect: metrics.absoluteResumeCorrect,
      cameraContactsObserved: camera.contactCount,
      cameraCssWrites: metrics.cssWrites,
      cameraCssWritesAvoided: metrics.cssWritesAvoided,
      cameraDepthProfile: "multi-depth",
      cameraGpuUpdates: metrics.gpuUpdates,
      cameraGpuUpdatesAvoided: metrics.gpuUpdatesAvoided,
      cameraMissedFrames: metrics.missedFrames,
      cameraPhase: camera.phase,
      cameraScale: camera.scale,
      cameraSegmentStartedAtMs: camera.startedAtMs,
      cameraSource: "master-clock",
      cameraSourceEvent: camera.sourceEvent,
      cameraStabilized: camera.stabilized,
      cameraTargetScale: camera.targetScale,
      cameraTargetX: camera.targetX,
      cameraTargetY: camera.targetY,
      cameraX: camera.x,
      cameraY: camera.y,
      additionalParallaxRafCount: 0,
      pointerListenersActive: 0,
    });
  }

  private updateRadarDebugState() {
    const debug = this.options.debugCollector;
    if (!debug) return;
    const availableContexts = Object.values(this.radarTargets).filter(
      (target) => target.gl && !target.contextLost,
    ).length;
    const resources = Object.values(this.radarTargets).filter(
      (target) => target.resources,
    );
    const contextState =
      availableContexts === 0
        ? "unavailable"
        : availableContexts < 2
          ? "lost"
          : "available";
    debug.setSubsystemState("radar", {
      initialized: this.radarInitialized,
      ready: this.radarReady,
      contextState,
    });
    debug.setSubsystemResources(
      "radar",
      {
        contexts: availableContexts,
        programs: resources.length,
        buffers: resources.length,
        vertexArrays: resources.length,
        textures: resources.reduce(
          (total, target) =>
            total + (target.resources?.terrainTexture ? 2 : 1),
          0,
        ),
        estimatedTextureBytes:
          resources.length > 0
            ? TRAINING_GPU_LOGICAL_WIDTH *
              TRAINING_GPU_LOGICAL_HEIGHT *
              (resources.length + 4)
            : 0,
      },
      this.viewport
        ? Object.values(this.radarTargets).map((target) => ({
            id: `radar-${target.plane}`,
            subsystem: "radar",
            cssWidth: this.viewport!.cssWidth,
            cssHeight: this.viewport!.cssHeight,
            pixelWidth: this.viewport!.pixelWidth,
            pixelHeight: this.viewport!.pixelHeight,
          }))
        : [],
    );
  }

  private updateGlobalDebugState() {
    this.options.debugCollector?.setGlobal({
      activeDriver:
        this.shouldRun &&
        this.frameState.active &&
        this.frameState.running
          ? "gpu"
          : "none",
      rendererActive: this.canAnimate(),
      rendererSuspended: !this.canAnimate(),
      rafActive: this.animationFrameId !== null,
      trainingRafCount: this.animationFrameId === null ? 0 : 1,
      radarRunning: this.frameState.running,
      tabVisibility: document.visibilityState,
      canvasCount: 3,
      contextCount:
        Object.values(this.radarTargets).filter(
          (target) => target.gl && !target.contextLost,
        ).length +
        (this.sceneRenderer.isContextAvailable() ? 1 : 0),
    });
  }

  private readonly handleVisibilityChange = () => {
    this.syncAnimationLoop();
  };

  private readonly handleAnimationFrame = (nowMs: number) => {
    this.animationFrameId = null;
    this.render(nowMs);
    if (this.canAnimate()) {
      this.animationFrameId = window.requestAnimationFrame(
        this.handleAnimationFrame,
      );
    }
    this.updateGlobalDebugState();
  };
}

export const TRAINING_GPU_CONSOLIDATED_BASELINE = {
  after: {
    canvases: 3,
    contexts: 3,
    clearsPerAnimatedFrame: 3,
  },
  before: {
    canvases: 10,
    contexts: 10,
    clearsPerAnimatedFrame: 10,
    estimatedTextureBytes: 67_711_088,
  },
  visualValidationRequired: true,
} as const;
