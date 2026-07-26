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
  createTrainingGpuRadarPlaneResources,
  destroyTrainingGpuRadarPlaneResources,
  type TrainingGpuRadarPlane,
  type TrainingGpuRadarPlaneResources,
} from "@/lib/home/gpu/trainingGpuShaderUtils";
import type {
  TrainingGpuFrameState,
  TrainingGpuViewport,
} from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingGpuPreparedObjectId } from "@/lib/home/gpu/trainingGpuObjectAssetCatalog";
import type { TrainingGpuDecodedObjectAssetSet } from "@/lib/home/gpu/TrainingGpuObjectAssetLoader";
import {
  TrainingGpuVolumeSubsystem,
  type TrainingGpuVolumeCanvases,
} from "@/lib/home/gpu/trainingGpuVolumeUtils";
import { getTrainingGpuVolumeScanSnapshot } from "@/lib/home/gpu/trainingGpuVolumeScanTiming";
import { getTrainingGpuTacticalSnapshot } from "@/lib/home/gpu/trainingGpuTacticalTiming";
import type { TrainingRadarPassMode } from "@/lib/home/trainingRadarClock";
import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
import { TrainingGpuFennecVolumeSubsystem } from "@/lib/home/gpu/trainingGpuFennecVolumeUtils";
import { getTrainingGpuFennecEffectsState } from "@/lib/home/gpu/trainingGpuFennecTiming";
import {
  TRAINING_RADAR_SWEEP,
  TRAINING_RADAR_TIMING,
} from "@/lib/home/trainingRadarTargets";

type TrainingGpuFrameStateFactory = (nowMs: number) => TrainingGpuFrameState;

type TrainingGpuCanvases = {
  fennec: HTMLCanvasElement;
  particles: Record<TrainingGpuParticleDepth, HTMLCanvasElement>;
  radar: {
    surface: HTMLCanvasElement;
    sweep: HTMLCanvasElement;
  };
  volume: TrainingGpuVolumeCanvases;
};

type TrainingGpuParticlePass = {
  passKey: number;
  passMode: TrainingRadarPassMode;
  passStartedAtMs: number;
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

type TrainingGpuParticleTarget = {
  canvas: HTMLCanvasElement;
  contextLost: boolean;
  depth: TrainingGpuParticleDepth;
  gl: WebGL2RenderingContext | null;
  onContextLost: (event: Event) => void;
  onContextRestored: () => void;
  resources: TrainingGpuParticleResources | null;
};

type TrainingGpuRendererOptions = {
  createFrameState: TrainingGpuFrameStateFactory;
  debugCollector: TrainingGpuDebugCollector | null;
  fieldMaskPixels: Uint8Array | null;
  onBasesReadyChange: (ready: boolean) => void;
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

function getRadarVisibility(progress: number) {
  if (progress <= 0) return 0;
  if (progress < 0.08) return progress / 0.08;
  if (progress <= 0.88) return 1;
  if (progress < 1) return (1 - progress) / 0.12;
  return 0;
}

function getWebGl2Context(canvas: HTMLCanvasElement) {
  return canvas.getContext(
    "webgl2",
    TRAINING_GPU_CONTEXT_ATTRIBUTES,
  ) as WebGL2RenderingContext | null;
}

export class TrainingGpuRenderer {
  private animationFrameId: number | null = null;
  private frameState = INITIAL_FRAME_STATE;
  private particlesInitialized = false;
  private particlesReady = false;
  private readonly particlePasses: TrainingGpuParticlePass[] = [];
  private radarInitialized = false;
  private radarReady = false;
  private shouldRun = false;
  private viewport: TrainingGpuViewport | null = null;
  private readonly radarTargets: Record<
    TrainingGpuRadarPlane,
    TrainingGpuRadarTarget
  >;
  private readonly particleTargets: Record<
    TrainingGpuParticleDepth,
    TrainingGpuParticleTarget
  >;
  private readonly fennecVolumeSubsystem: TrainingGpuFennecVolumeSubsystem;
  private readonly volumeSubsystem: TrainingGpuVolumeSubsystem;

  constructor(
    canvases: TrainingGpuCanvases,
    private readonly options: TrainingGpuRendererOptions,
  ) {
    this.radarTargets = {
      surface: this.createRadarTarget("surface", canvases.radar.surface),
      sweep: this.createRadarTarget("sweep", canvases.radar.sweep),
    };
    this.particleTargets = {
      far: this.createParticleTarget("far", canvases.particles.far),
      mid: this.createParticleTarget("mid", canvases.particles.mid),
      near: this.createParticleTarget("near", canvases.particles.near),
    };
    this.fennecVolumeSubsystem = new TrainingGpuFennecVolumeSubsystem(
      canvases.fennec,
      {
        debugCollector: options.debugCollector,
        onEffectsReadyChange: options.onFennecEffectsReadyChange,
        onReadyChange: options.onFennecVolumeReadyChange,
        onContextRestored: () => {
          this.completeFirstRender();
          this.syncAnimationLoop();
        },
      },
    );
    this.volumeSubsystem = new TrainingGpuVolumeSubsystem(canvases.volume, {
      debugCollector: options.debugCollector,
      onBaseReadyChange: options.onBasesReadyChange,
      onVolumeReadyChange: options.onVolumeScansReadyChange,
      onTacticalReadyChange: options.onTacticalReadyChange,
      onContextRestored: () => {
        this.completeFirstRender();
        this.syncAnimationLoop();
      },
    });

    for (const target of Object.values(this.radarTargets)) {
      target.canvas.addEventListener("webglcontextlost", target.onContextLost);
      target.canvas.addEventListener(
        "webglcontextrestored",
        target.onContextRestored,
      );
    }
    for (const target of Object.values(this.particleTargets)) {
      target.canvas.addEventListener("webglcontextlost", target.onContextLost);
      target.canvas.addEventListener(
        "webglcontextrestored",
        target.onContextRestored,
      );
    }
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.updateRadarDebugState();
    this.updateParticleDebugState();
    this.updateGlobalDebugState();
  }

  initialize() {
    this.initializeRadarSubsystem();
    this.initializeParticleSubsystem();
    this.volumeSubsystem.initialize();
    this.fennecVolumeSubsystem.initialize();
    this.completeFirstRender();
    this.syncAnimationLoop();
    return (
      this.radarInitialized ||
      this.particlesInitialized ||
      this.fennecVolumeSubsystem.isEffectsInitialized() ||
      this.fennecVolumeSubsystem.isInitialized() ||
      this.volumeSubsystem.isBaseInitialized() ||
      this.volumeSubsystem.isVolumeInitialized() ||
      this.volumeSubsystem.isTacticalInitialized()
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

    for (const target of [
      ...Object.values(this.radarTargets),
      ...Object.values(this.particleTargets),
    ]) {
      if (
        target.canvas.width !== viewport.pixelWidth ||
        target.canvas.height !== viewport.pixelHeight
      ) {
        target.canvas.width = viewport.pixelWidth;
        target.canvas.height = viewport.pixelHeight;
      }

      target.gl?.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
    }

    if (
      this.radarInitialized ||
      this.particlesInitialized ||
      this.fennecVolumeSubsystem.isEffectsInitialized() ||
      this.fennecVolumeSubsystem.isInitialized() ||
      this.volumeSubsystem.isBaseInitialized()
    ) {
      this.completeFirstRender();
    } else {
      this.clear();
    }
    this.updateRadarDebugState();
    this.updateParticleDebugState();
  }

  resizeVolumeTargets() {
    this.volumeSubsystem.resize();
    this.fennecVolumeSubsystem.resize();
    this.completeFirstRender();
  }

  setVolumeAssets(
    assets: Partial<
      Record<TrainingGpuPreparedObjectId, TrainingGpuDecodedObjectAssetSet>
    > | null,
  ) {
    this.volumeSubsystem.setAssets(assets);
    this.fennecVolumeSubsystem.setAssets(assets?.fennec ?? null);
    this.completeFirstRender();
    this.syncAnimationLoop();
  }

  setFrameState(state: TrainingGpuFrameState) {
    this.frameState = state;
    if (!state.active || !state.running) this.resetParticlePasses();
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
    this.resetParticlePasses();
    this.clearAnimatedCanvases();
    this.renderStaticObjectFrame();
    this.updateGlobalDebugState();
  }

  render(nowMs: number) {
    if (
      !this.radarReady &&
      !this.particlesReady &&
      !this.fennecVolumeSubsystem.isEffectsReady() &&
      !this.fennecVolumeSubsystem.isReady() &&
      !this.volumeSubsystem.isBaseReady() &&
      !this.volumeSubsystem.isVolumeReady() &&
      !this.volumeSubsystem.isTacticalReady()
    ) return;

    const frameState = this.options.createFrameState(nowMs);
    this.frameState = frameState;
    this.options.debugCollector?.recordFrame(nowMs);
    this.updateGlobalDebugState();
    this.renderFrame(frameState);
  }

  destroy() {
    this.shouldRun = false;
    this.cancelAnimationFrame();
    this.setRadarReady(false);
    this.setParticlesReady(false);
    this.resetParticlePasses();
    this.clear();
    this.releaseRadarResources();
    this.releaseParticleResources();
    this.fennecVolumeSubsystem.destroy();
    this.volumeSubsystem.destroy();

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
    for (const target of Object.values(this.particleTargets)) {
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
    this.particlesInitialized = false;
    this.updateRadarDebugState();
    this.updateParticleDebugState();
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
    target.onContextLost = (event) => this.loseRadarTarget(target, event);
    target.onContextRestored = () => this.restoreRadarTarget(target);
    return target;
  }

  private createParticleTarget(
    depth: TrainingGpuParticleDepth,
    canvas: HTMLCanvasElement,
  ): TrainingGpuParticleTarget {
    const target: TrainingGpuParticleTarget = {
      canvas,
      contextLost: false,
      depth,
      gl: getWebGl2Context(canvas),
      onContextLost: (_event: Event) => undefined,
      onContextRestored: () => undefined,
      resources: null,
    };
    target.onContextLost = (event) => this.loseParticleTarget(target, event);
    target.onContextRestored = () => this.restoreParticleTarget(target);
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

  private initializeParticleSubsystem() {
    try {
      for (const depth of TRAINING_GPU_PARTICLE_DEPTHS) {
        this.initializeParticleTarget(this.particleTargets[depth]);
      }
      this.particlesInitialized = this.hasParticleResources();
    } catch (error) {
      this.options.debugCollector?.recordSubsystemError("particles", error);
      this.particlesInitialized = false;
      this.releaseParticleResources();
      this.setParticlesReady(false);
    }
    this.updateParticleDebugState();
  }

  private initializeRadarTarget(target: TrainingGpuRadarTarget) {
    const fieldMaskPixels = this.options.fieldMaskPixels;
    const terrainImage = this.options.terrainImage;
    if (!target.gl || target.contextLost || !fieldMaskPixels || !terrainImage) {
      throw new Error("Training radar WebGL2 resources are unavailable.");
    }

    destroyTrainingGpuRadarPlaneResources(target.gl, target.resources);
    target.resources = createTrainingGpuRadarPlaneResources(
      target.gl,
      target.plane,
      fieldMaskPixels,
      terrainImage,
    );
    this.applyViewport(target.gl);
  }

  private initializeParticleTarget(target: TrainingGpuParticleTarget) {
    if (!target.gl || target.contextLost) {
      throw new Error("Training particle WebGL2 context is unavailable.");
    }

    destroyTrainingGpuParticleResources(target.gl, target.resources);
    target.resources = createTrainingGpuParticleResources(
      target.gl,
      target.depth,
    );
    this.applyViewport(target.gl);
  }

  private applyViewport(gl: WebGL2RenderingContext) {
    if (!this.viewport) return;
    gl.viewport(0, 0, this.viewport.pixelWidth, this.viewport.pixelHeight);
  }

  private hasRadarResources() {
    return Object.values(this.radarTargets).every(
      (target) =>
        target.gl !== null && !target.contextLost && target.resources !== null,
    );
  }

  private hasParticleResources() {
    return Object.values(this.particleTargets).every(
      (target) =>
        target.gl !== null && !target.contextLost && target.resources !== null,
    );
  }

  private completeFirstRender() {
    const firstFrameState = this.options.createFrameState(performance.now());
    this.frameState = firstFrameState;
    this.updateParticlePassHistory(firstFrameState);

    if (this.viewport) {
      if (this.radarInitialized && this.hasRadarResources()) {
        this.renderRadarFrame(firstFrameState);
        this.setRadarReady(true);
      } else {
        this.setRadarReady(false);
      }

      if (this.particlesInitialized && this.hasParticleResources()) {
        this.renderParticleFrame(firstFrameState);
        this.setParticlesReady(true);
      } else {
        this.setParticlesReady(false);
      }
    } else {
      this.setRadarReady(false);
      this.setParticlesReady(false);
    }

    this.volumeSubsystem.beginFrame();
    const debugCollector = this.options.debugCollector;
    const baseStartedAtMs = debugCollector ? performance.now() : 0;
    this.volumeSubsystem.renderBases(true);
    debugCollector?.recordSubsystemCpu(
      "bases",
      performance.now() - baseStartedAtMs,
    );
    this.volumeSubsystem.renderVolume(
      getTrainingGpuVolumeScanSnapshot(firstFrameState),
      firstFrameState.active && firstFrameState.running,
    );
    this.volumeSubsystem.renderTactical(
      getTrainingGpuTacticalSnapshot(firstFrameState),
      firstFrameState.active && firstFrameState.running,
    );
    this.fennecVolumeSubsystem.beginFrame();
    this.fennecVolumeSubsystem.render(
      getTrainingGpuVolumeScanSnapshot(firstFrameState).fennec,
      firstFrameState.active && firstFrameState.running,
    );
    this.fennecVolumeSubsystem.renderEffects(
      getTrainingGpuFennecEffectsState(firstFrameState),
    );
  }

  private renderFrame(frameState: TrainingGpuFrameState) {
    if (!this.viewport) return;

    const debugCollector = this.options.debugCollector;
    this.updateParticlePassHistory(frameState);
    if (this.radarReady) {
      const startedAtMs = debugCollector ? performance.now() : 0;
      this.renderRadarFrame(frameState);
      debugCollector?.recordSubsystemCpu(
        "radar",
        performance.now() - startedAtMs,
      );
    }
    if (this.particlesReady) {
      const startedAtMs = debugCollector ? performance.now() : 0;
      this.renderParticleFrame(frameState);
      debugCollector?.recordSubsystemCpu(
        "particles",
        performance.now() - startedAtMs,
      );
    }
    this.volumeSubsystem.beginFrame();
    const baseStartedAtMs = debugCollector ? performance.now() : 0;
    this.volumeSubsystem.renderBases();
    debugCollector?.recordSubsystemCpu(
      "bases",
      performance.now() - baseStartedAtMs,
    );
    const volumeStartedAtMs = debugCollector ? performance.now() : 0;
    this.volumeSubsystem.renderVolume(
      getTrainingGpuVolumeScanSnapshot(frameState),
      frameState.active && frameState.running,
    );
    debugCollector?.recordSubsystemCpu(
      "volume",
      performance.now() - volumeStartedAtMs,
    );
    const tacticalStartedAtMs = debugCollector ? performance.now() : 0;
    this.volumeSubsystem.renderTactical(
      getTrainingGpuTacticalSnapshot(frameState),
      frameState.active && frameState.running,
    );
    debugCollector?.recordSubsystemCpu(
      "tactical",
      performance.now() - tacticalStartedAtMs,
    );
    this.fennecVolumeSubsystem.beginFrame();
    const fennecVolumeStartedAtMs = debugCollector ? performance.now() : 0;
    this.fennecVolumeSubsystem.render(
      getTrainingGpuVolumeScanSnapshot(frameState).fennec,
      frameState.active && frameState.running,
    );
    debugCollector?.recordSubsystemCpu(
      "fennec-volume",
      performance.now() - fennecVolumeStartedAtMs,
    );
    const fennecEffectsStartedAtMs = debugCollector ? performance.now() : 0;
    this.fennecVolumeSubsystem.renderEffects(
      getTrainingGpuFennecEffectsState(frameState),
    );
    debugCollector?.recordSubsystemCpu(
      "fennec-effects",
      performance.now() - fennecEffectsStartedAtMs,
    );
  }

  private renderRadarFrame(frameState: TrainingGpuFrameState) {
    if (!this.viewport) return;

    const radarX =
      TRAINING_RADAR_SWEEP.startX +
      (TRAINING_RADAR_SWEEP.endX - TRAINING_RADAR_SWEEP.startX) *
        frameState.radarProgress;
    const radarVisibility =
      frameState.active && frameState.running
        ? getRadarVisibility(frameState.radarProgress)
        : 0;

    this.renderRadarTarget(
      this.radarTargets.surface,
      radarX,
      radarVisibility,
      this.viewport,
    );
    this.renderRadarTarget(
      this.radarTargets.sweep,
      radarX,
      radarVisibility,
      this.viewport,
    );
  }

  private renderRadarTarget(
    target: TrainingGpuRadarTarget,
    radarX: number,
    radarVisibility: number,
    viewport: TrainingGpuViewport,
  ) {
    const { gl, resources } = target;
    if (!gl || !resources || target.contextLost) return;

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
    gl.uniform1f(resources.uniforms.effectiveDpr, viewport.effectiveDpr);
    gl.uniform1f(resources.uniforms.radarX, radarX);
    gl.uniform1f(resources.uniforms.visibility, radarVisibility);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, resources.fieldMaskTexture);

    if (resources.terrainTexture) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, resources.terrainTexture);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
    gl.useProgram(null);
  }

  private updateParticlePassHistory(frameState: TrainingGpuFrameState) {
    if (!frameState.active || !frameState.running || frameState.passKey === 0) {
      this.resetParticlePasses();
      return;
    }

    const lastPass = this.particlePasses[this.particlePasses.length - 1];
    if (lastPass?.passKey === frameState.passKey) return;

    this.particlePasses.push({
      passKey: frameState.passKey,
      passMode: frameState.passMode,
      passStartedAtMs: frameState.passStartedAtMs,
    });
    if (this.particlePasses.length > 2) this.particlePasses.shift();
  }

  private renderParticleFrame(frameState: TrainingGpuFrameState) {
    if (!this.viewport) return;

    const firstPass = this.particlePasses[0];
    const secondPass = this.particlePasses[1];
    const firstElapsed = firstPass
      ? frameState.nowMs - firstPass.passStartedAtMs
      : 0;
    const secondElapsed = secondPass
      ? frameState.nowMs - secondPass.passStartedAtMs
      : 0;

    for (const depth of TRAINING_GPU_PARTICLE_DEPTHS) {
      const target = this.particleTargets[depth];
      const { gl, resources } = target;
      if (!gl || !resources || target.contextLost) continue;

      gl.viewport(
        0,
        0,
        this.viewport.pixelWidth,
        this.viewport.pixelHeight,
      );
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(resources.program);
      gl.bindVertexArray(resources.vertexArray);
      gl.uniform2f(
        resources.uniforms.viewportCss,
        this.viewport.cssWidth,
        this.viewport.cssHeight,
      );
      gl.uniform2f(
        resources.uniforms.passElapsedMs,
        firstElapsed,
        secondElapsed,
      );
      gl.uniform2f(
        resources.uniforms.passValid,
        firstPass ? 1 : 0,
        secondPass ? 1 : 0,
      );
      gl.drawArraysInstanced(
        gl.TRIANGLES,
        0,
        6,
        resources.instanceCount,
      );
      gl.bindVertexArray(null);
      gl.useProgram(null);
    }
  }

  private canAnimate() {
    return (
      this.shouldRun &&
      (this.radarReady ||
        this.particlesReady ||
        this.fennecVolumeSubsystem.isEffectsReady() ||
        this.fennecVolumeSubsystem.isReady() ||
        this.volumeSubsystem.isVolumeReady() ||
        this.volumeSubsystem.isTacticalReady()) &&
      this.frameState.active &&
      this.frameState.running &&
      document.visibilityState === "visible"
    );
  }

  private syncAnimationLoop() {
    if (!this.canAnimate()) {
      this.cancelAnimationFrame();
      if (!this.frameState.active || !this.frameState.running) {
        this.resetParticlePasses();
        this.clearAnimatedCanvases();
        this.renderStaticObjectFrame();
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

  private resetParticlePasses() {
    if (this.particlePasses.length > 0) this.particlePasses.length = 0;
  }

  private renderStaticObjectFrame() {
    const debugCollector = this.options.debugCollector;
    this.volumeSubsystem.beginFrame();
    const startedAtMs = debugCollector ? performance.now() : 0;
    this.volumeSubsystem.renderBases(true);
    debugCollector?.recordSubsystemCpu(
      "bases",
      performance.now() - startedAtMs,
    );
    this.fennecVolumeSubsystem.beginFrame();
    this.fennecVolumeSubsystem.render(
      getTrainingGpuVolumeScanSnapshot(this.frameState).fennec,
      false,
    );
    this.fennecVolumeSubsystem.renderEffects(
      getTrainingGpuFennecEffectsState({
        ...this.frameState,
        running: false,
      }),
    );
  }

  private clearAnimatedCanvases() {
    this.clearRadarCanvases();
    this.clearParticleCanvases();
  }

  private clear() {
    this.clearAnimatedCanvases();
    this.fennecVolumeSubsystem.clear();
    this.volumeSubsystem.clear();
  }

  private clearRadarCanvases() {
    for (const target of Object.values(this.radarTargets)) {
      target.gl?.clear(target.gl.COLOR_BUFFER_BIT);
    }
  }

  private clearParticleCanvases() {
    for (const target of Object.values(this.particleTargets)) {
      target.gl?.clear(target.gl.COLOR_BUFFER_BIT);
    }
  }

  private setRadarReady(ready: boolean) {
    if (this.radarReady === ready) return;
    this.radarReady = ready;
    this.options.onRadarReadyChange(ready);
    this.updateRadarDebugState();
  }

  private setParticlesReady(ready: boolean) {
    if (this.particlesReady === ready) return;
    this.particlesReady = ready;
    this.options.onParticlesReadyChange(ready);
    this.updateParticleDebugState();
  }

  private releaseRadarResources() {
    for (const target of Object.values(this.radarTargets)) {
      if (target.gl && !target.contextLost) {
        destroyTrainingGpuRadarPlaneResources(target.gl, target.resources);
      }
      target.resources = null;
    }
    this.updateRadarDebugState();
  }

  private releaseParticleResources() {
    for (const target of Object.values(this.particleTargets)) {
      if (target.gl && !target.contextLost) {
        destroyTrainingGpuParticleResources(target.gl, target.resources);
      }
      target.resources = null;
    }
    this.updateParticleDebugState();
  }

  private loseRadarTarget(target: TrainingGpuRadarTarget, event: Event) {
    event.preventDefault();
    target.contextLost = true;
    target.resources = null;
    this.radarInitialized = false;
    this.options.debugCollector?.recordContextLost("radar");
    this.setRadarReady(false);
    this.clearRadarCanvases();
    this.syncAnimationLoop();
  }

  private loseParticleTarget(target: TrainingGpuParticleTarget, event: Event) {
    event.preventDefault();
    target.contextLost = true;
    target.resources = null;
    this.particlesInitialized = false;
    this.options.debugCollector?.recordContextLost("particles");
    this.setParticlesReady(false);
    this.clearParticleCanvases();
    this.syncAnimationLoop();
  }

  private restoreRadarTarget(target: TrainingGpuRadarTarget) {
    target.gl = getWebGl2Context(target.canvas);
    target.contextLost = target.gl === null;

    if (!target.gl) {
      this.setRadarReady(false);
      return;
    }

    try {
      this.initializeRadarTarget(target);
      this.radarInitialized = this.hasRadarResources();
      this.options.debugCollector?.recordContextRestored("radar");
      this.updateRadarDebugState();
      this.completeFirstRender();
      this.syncAnimationLoop();
    } catch (error) {
      this.options.debugCollector?.recordSubsystemError("radar", error);
      target.resources = null;
      this.radarInitialized = false;
      this.setRadarReady(false);
    }
  }

  private restoreParticleTarget(target: TrainingGpuParticleTarget) {
    target.gl = getWebGl2Context(target.canvas);
    target.contextLost = target.gl === null;

    if (!target.gl) {
      this.setParticlesReady(false);
      return;
    }

    try {
      this.initializeParticleTarget(target);
      this.particlesInitialized = this.hasParticleResources();
      this.options.debugCollector?.recordContextRestored("particles");
      this.updateParticleDebugState();
      this.completeFirstRender();
      this.syncAnimationLoop();
    } catch (error) {
      this.options.debugCollector?.recordSubsystemError("particles", error);
      target.resources = null;
      this.particlesInitialized = false;
      this.setParticlesReady(false);
    }
  }

  private readonly handleAnimationFrame = (nowMs: number) => {
    this.animationFrameId = null;

    if (!this.canAnimate()) {
      if (!this.frameState.active || !this.frameState.running) {
        this.resetParticlePasses();
        this.clearAnimatedCanvases();
        this.renderStaticObjectFrame();
      }
      return;
    }

    this.render(nowMs);

    if (this.canAnimate()) {
      this.animationFrameId = window.requestAnimationFrame(
        this.handleAnimationFrame,
      );
    }
    this.updateGlobalDebugState();
  };

  private updateGlobalDebugState() {
    const debugCollector = this.options.debugCollector;
    if (!debugCollector) return;
    const active = this.canAnimate();
    debugCollector.setGlobal({
      rendererActive: active,
      rendererSuspended: !active,
      rafActive: this.animationFrameId !== null,
      illustrationActive: this.frameState.active,
      radarRunning: this.frameState.running,
      tabVisibility: document.visibilityState,
      passMode: this.frameState.passMode,
      passProgress: this.frameState.radarProgress,
      passKey: this.frameState.passKey,
      masterClockNowMs: this.frameState.nowMs,
    });
  }

  private updateRadarDebugState() {
    const debugCollector = this.options.debugCollector;
    if (!debugCollector) return;
    const targets = Object.values(this.radarTargets);
    const activeContexts = targets.filter(
      (target) => target.gl !== null && !target.contextLost,
    );
    const resourceTargets = targets.filter(
      (target) => target.resources !== null,
    );
    const contextState = targets.some((target) => target.contextLost)
      ? "lost"
      : activeContexts.length > 0
        ? "available"
        : "unavailable";
    let textureBytes = resourceTargets.length *
      TRAINING_GPU_LOGICAL_WIDTH * TRAINING_GPU_LOGICAL_HEIGHT * 4;
    if (this.radarTargets.surface.resources?.terrainTexture) {
      const terrain = this.options.terrainImage;
      textureBytes +=
        (terrain?.naturalWidth ?? 0) * (terrain?.naturalHeight ?? 0) * 4;
    }
    const viewport = this.viewport;

    debugCollector.setSubsystemState("radar", {
      initialized: this.radarInitialized,
      ready: this.radarReady,
      contextState,
    });
    debugCollector.setSubsystemResources(
      "radar",
      {
        contexts: activeContexts.length,
        programs: resourceTargets.length,
        buffers: resourceTargets.length,
        vertexArrays: resourceTargets.length,
        textures: resourceTargets.reduce(
          (count, target) =>
            count + (target.resources?.terrainTexture ? 2 : 1),
          0,
        ),
        estimatedTextureBytes: textureBytes,
      },
      viewport
        ? targets.map((target) => ({
            id: `radar-${target.plane}`,
            subsystem: "radar" as const,
            cssWidth: viewport.cssWidth,
            cssHeight: viewport.cssHeight,
            pixelWidth: viewport.pixelWidth,
            pixelHeight: viewport.pixelHeight,
          }))
        : [],
    );
  }

  private updateParticleDebugState() {
    const debugCollector = this.options.debugCollector;
    if (!debugCollector) return;
    const targets = Object.values(this.particleTargets);
    const activeContexts = targets.filter(
      (target) => target.gl !== null && !target.contextLost,
    );
    const resourceTargets = targets.filter(
      (target) => target.resources !== null,
    );
    const contextState = targets.some((target) => target.contextLost)
      ? "lost"
      : activeContexts.length > 0
        ? "available"
        : "unavailable";
    const viewport = this.viewport;

    debugCollector.setSubsystemState("particles", {
      initialized: this.particlesInitialized,
      ready: this.particlesReady,
      contextState,
    });
    debugCollector.setSubsystemResources(
      "particles",
      {
        contexts: activeContexts.length,
        programs: resourceTargets.length,
        buffers: resourceTargets.length * 2,
        vertexArrays: resourceTargets.length,
        textures: 0,
        estimatedTextureBytes: 0,
      },
      viewport
        ? targets.map((target) => ({
            id: `particles-${target.depth}`,
            subsystem: "particles" as const,
            cssWidth: viewport.cssWidth,
            cssHeight: viewport.cssHeight,
            pixelWidth: viewport.pixelWidth,
            pixelHeight: viewport.pixelHeight,
          }))
        : [],
    );
  }

  private readonly handleVisibilityChange = () => {
    this.updateGlobalDebugState();
    this.syncAnimationLoop();
  };
}
