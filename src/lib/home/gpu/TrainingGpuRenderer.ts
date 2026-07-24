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
import type { TrainingRadarPassMode } from "@/lib/home/trainingRadarClock";
import {
  TRAINING_RADAR_SWEEP,
  TRAINING_RADAR_TIMING,
} from "@/lib/home/trainingRadarTargets";

type TrainingGpuFrameStateFactory = (nowMs: number) => TrainingGpuFrameState;

type TrainingGpuCanvases = {
  particles: Record<TrainingGpuParticleDepth, HTMLCanvasElement>;
  radar: {
    surface: HTMLCanvasElement;
    sweep: HTMLCanvasElement;
  };
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
  fieldMaskPixels: Uint8Array | null;
  onParticlesReadyChange: (ready: boolean) => void;
  onRadarReadyChange: (ready: boolean) => void;
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
  }

  initialize() {
    this.initializeRadarSubsystem();
    this.initializeParticleSubsystem();
    this.completeFirstRender();
    this.syncAnimationLoop();
    return this.radarInitialized || this.particlesInitialized;
  }

  resize(viewport: TrainingGpuViewport) {
    this.viewport = viewport;

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

    if (this.radarInitialized || this.particlesInitialized) {
      this.completeFirstRender();
    } else {
      this.clear();
    }
  }

  setFrameState(state: TrainingGpuFrameState) {
    this.frameState = state;
    if (!state.active || !state.running) this.resetParticlePasses();
    this.syncAnimationLoop();
  }

  start() {
    this.shouldRun = true;
    this.syncAnimationLoop();
  }

  stop() {
    this.shouldRun = false;
    this.cancelAnimationFrame();
    this.resetParticlePasses();
    this.clear();
  }

  render(nowMs: number) {
    if (!this.radarReady && !this.particlesReady) return;

    const frameState = this.options.createFrameState(nowMs);
    this.frameState = frameState;
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
  }

  private createRadarTarget(
    plane: TrainingGpuRadarPlane,
    canvas: HTMLCanvasElement,
  ): TrainingGpuRadarTarget {
    const target: TrainingGpuRadarTarget = {
      canvas,
      contextLost: false,
      gl: canvas.getContext("webgl2", TRAINING_GPU_CONTEXT_ATTRIBUTES),
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
      gl: canvas.getContext("webgl2", TRAINING_GPU_CONTEXT_ATTRIBUTES),
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
    } catch {
      this.radarInitialized = false;
      this.releaseRadarResources();
      this.setRadarReady(false);
    }
  }

  private initializeParticleSubsystem() {
    try {
      for (const depth of TRAINING_GPU_PARTICLE_DEPTHS) {
        this.initializeParticleTarget(this.particleTargets[depth]);
      }
      this.particlesInitialized = this.hasParticleResources();
    } catch {
      this.particlesInitialized = false;
      this.releaseParticleResources();
      this.setParticlesReady(false);
    }
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
    if (!this.viewport) {
      this.setRadarReady(false);
      this.setParticlesReady(false);
      return;
    }

    const firstFrameState = this.options.createFrameState(performance.now());
    this.frameState = firstFrameState;
    this.updateParticlePassHistory(firstFrameState);

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
  }

  private renderFrame(frameState: TrainingGpuFrameState) {
    if (!this.viewport) return;

    this.updateParticlePassHistory(frameState);
    if (this.radarReady) this.renderRadarFrame(frameState);
    if (this.particlesReady) this.renderParticleFrame(frameState);
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
      (this.radarReady || this.particlesReady) &&
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
        this.clear();
      }
      return;
    }

    if (this.animationFrameId === null) {
      this.animationFrameId = window.requestAnimationFrame(
        this.handleAnimationFrame,
      );
    }
  }

  private cancelAnimationFrame() {
    if (this.animationFrameId === null) return;

    window.cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private resetParticlePasses() {
    if (this.particlePasses.length > 0) this.particlePasses.length = 0;
  }

  private clear() {
    this.clearRadarCanvases();
    this.clearParticleCanvases();
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
  }

  private setParticlesReady(ready: boolean) {
    if (this.particlesReady === ready) return;
    this.particlesReady = ready;
    this.options.onParticlesReadyChange(ready);
  }

  private releaseRadarResources() {
    for (const target of Object.values(this.radarTargets)) {
      if (target.gl && !target.contextLost) {
        destroyTrainingGpuRadarPlaneResources(target.gl, target.resources);
      }
      target.resources = null;
    }
  }

  private releaseParticleResources() {
    for (const target of Object.values(this.particleTargets)) {
      if (target.gl && !target.contextLost) {
        destroyTrainingGpuParticleResources(target.gl, target.resources);
      }
      target.resources = null;
    }
  }

  private loseRadarTarget(target: TrainingGpuRadarTarget, event: Event) {
    event.preventDefault();
    target.contextLost = true;
    target.resources = null;
    this.radarInitialized = false;
    this.setRadarReady(false);
    this.clearRadarCanvases();
    this.syncAnimationLoop();
  }

  private loseParticleTarget(target: TrainingGpuParticleTarget, event: Event) {
    event.preventDefault();
    target.contextLost = true;
    target.resources = null;
    this.particlesInitialized = false;
    this.setParticlesReady(false);
    this.clearParticleCanvases();
    this.syncAnimationLoop();
  }

  private restoreRadarTarget(target: TrainingGpuRadarTarget) {
    target.gl = target.canvas.getContext(
      "webgl2",
      TRAINING_GPU_CONTEXT_ATTRIBUTES,
    );
    target.contextLost = target.gl === null;

    if (!target.gl) {
      this.setRadarReady(false);
      return;
    }

    try {
      this.initializeRadarTarget(target);
      this.radarInitialized = this.hasRadarResources();
      this.completeFirstRender();
      this.syncAnimationLoop();
    } catch {
      target.resources = null;
      this.radarInitialized = false;
      this.setRadarReady(false);
    }
  }

  private restoreParticleTarget(target: TrainingGpuParticleTarget) {
    target.gl = target.canvas.getContext(
      "webgl2",
      TRAINING_GPU_CONTEXT_ATTRIBUTES,
    );
    target.contextLost = target.gl === null;

    if (!target.gl) {
      this.setParticlesReady(false);
      return;
    }

    try {
      this.initializeParticleTarget(target);
      this.particlesInitialized = this.hasParticleResources();
      this.completeFirstRender();
      this.syncAnimationLoop();
    } catch {
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
        this.clear();
      }
      return;
    }

    this.render(nowMs);

    if (this.canAnimate()) {
      this.animationFrameId = window.requestAnimationFrame(
        this.handleAnimationFrame,
      );
    }
  };

  private readonly handleVisibilityChange = () => {
    this.syncAnimationLoop();
  };
}
