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
import type {
  TrainingGpuFrameState,
  TrainingGpuViewport,
} from "@/lib/home/gpu/trainingGpuTypes";
import {
  TRAINING_RADAR_SWEEP,
  TRAINING_RADAR_TIMING,
} from "@/lib/home/trainingRadarTargets";

type TrainingGpuFrameStateFactory = (nowMs: number) => TrainingGpuFrameState;

type TrainingGpuRadarCanvases = {
  surface: HTMLCanvasElement;
  sweep: HTMLCanvasElement;
};

type TrainingGpuRadarTarget = {
  canvas: HTMLCanvasElement;
  contextLost: boolean;
  gl: WebGL2RenderingContext | null;
  plane: TrainingGpuRadarPlane;
  resources: TrainingGpuRadarPlaneResources | null;
};

type TrainingGpuRendererOptions = {
  createFrameState: TrainingGpuFrameStateFactory;
  fieldMaskPixels: Uint8Array;
  onReadyChange: (ready: boolean) => void;
  terrainImage: HTMLImageElement;
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
  private initialized = false;
  private ready = false;
  private shouldRun = false;
  private viewport: TrainingGpuViewport | null = null;
  private readonly targets: Record<
    TrainingGpuRadarPlane,
    TrainingGpuRadarTarget
  >;

  constructor(
    canvases: TrainingGpuRadarCanvases,
    private readonly options: TrainingGpuRendererOptions,
  ) {
    this.targets = {
      surface: this.createTarget("surface", canvases.surface),
      sweep: this.createTarget("sweep", canvases.sweep),
    };

    canvases.surface.addEventListener(
      "webglcontextlost",
      this.handleSurfaceContextLost,
    );
    canvases.surface.addEventListener(
      "webglcontextrestored",
      this.handleSurfaceContextRestored,
    );
    canvases.sweep.addEventListener(
      "webglcontextlost",
      this.handleSweepContextLost,
    );
    canvases.sweep.addEventListener(
      "webglcontextrestored",
      this.handleSweepContextRestored,
    );
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  get available() {
    return (Object.values(this.targets) as TrainingGpuRadarTarget[]).every(
      (target) => target.gl !== null && !target.contextLost,
    );
  }

  initialize() {
    try {
      this.initializeTarget(this.targets.surface);
      this.initializeTarget(this.targets.sweep);
      this.initialized = true;
      this.completeFirstRender();
      this.syncAnimationLoop();
      return true;
    } catch {
      this.initialized = false;
      this.releaseAllResources();
      this.setReady(false);
      return false;
    }
  }

  resize(viewport: TrainingGpuViewport) {
    this.viewport = viewport;

    for (const target of Object.values(
      this.targets,
    ) as TrainingGpuRadarTarget[]) {
      if (
        target.canvas.width !== viewport.pixelWidth ||
        target.canvas.height !== viewport.pixelHeight
      ) {
        target.canvas.width = viewport.pixelWidth;
        target.canvas.height = viewport.pixelHeight;
      }

      target.gl?.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
    }

    if (this.initialized && !this.ready) {
      this.completeFirstRender();
    } else {
      this.clear();
    }
  }

  setFrameState(state: TrainingGpuFrameState) {
    this.frameState = state;
    this.syncAnimationLoop();
  }

  start() {
    this.shouldRun = true;
    this.syncAnimationLoop();
  }

  stop() {
    this.shouldRun = false;
    this.cancelAnimationFrame();
    this.clear();
  }

  render(nowMs: number) {
    if (!this.ready) return;

    const frameState = this.options.createFrameState(nowMs);
    this.frameState = frameState;
    this.renderFrame(frameState);
  }

  destroy() {
    this.shouldRun = false;
    this.cancelAnimationFrame();
    this.setReady(false);
    this.clear();
    this.releaseAllResources();

    const { surface, sweep } = this.targets;
    surface.canvas.removeEventListener(
      "webglcontextlost",
      this.handleSurfaceContextLost,
    );
    surface.canvas.removeEventListener(
      "webglcontextrestored",
      this.handleSurfaceContextRestored,
    );
    sweep.canvas.removeEventListener(
      "webglcontextlost",
      this.handleSweepContextLost,
    );
    sweep.canvas.removeEventListener(
      "webglcontextrestored",
      this.handleSweepContextRestored,
    );
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );

    surface.gl = null;
    sweep.gl = null;
    this.viewport = null;
    this.initialized = false;
  }

  private createTarget(
    plane: TrainingGpuRadarPlane,
    canvas: HTMLCanvasElement,
  ): TrainingGpuRadarTarget {
    return {
      canvas,
      contextLost: false,
      gl: canvas.getContext("webgl2", TRAINING_GPU_CONTEXT_ATTRIBUTES),
      plane,
      resources: null,
    };
  }

  private initializeTarget(target: TrainingGpuRadarTarget) {
    if (!target.gl || target.contextLost) {
      throw new Error("Training radar WebGL2 context is unavailable.");
    }

    destroyTrainingGpuRadarPlaneResources(target.gl, target.resources);
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
    if (
      !this.initialized ||
      !this.viewport ||
      !this.available ||
      !this.targets.surface.resources ||
      !this.targets.sweep.resources
    ) {
      this.setReady(false);
      return;
    }

    const firstFrameState = this.options.createFrameState(performance.now());
    this.frameState = firstFrameState;
    this.renderFrame(firstFrameState);
    this.setReady(true);
  }

  private renderFrame(frameState: TrainingGpuFrameState) {
    if (!this.viewport) return;

    const radarX =
      TRAINING_RADAR_SWEEP.startX +
      (TRAINING_RADAR_SWEEP.endX - TRAINING_RADAR_SWEEP.startX) *
        frameState.radarProgress;
    const radarVisibility =
      frameState.active && frameState.running
        ? getRadarVisibility(frameState.radarProgress)
        : 0;

    this.renderTarget(
      this.targets.surface,
      radarX,
      radarVisibility,
      this.viewport,
    );
    this.renderTarget(
      this.targets.sweep,
      radarX,
      radarVisibility,
      this.viewport,
    );
  }

  private renderTarget(
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

  private canAnimate() {
    return (
      this.shouldRun &&
      this.ready &&
      this.frameState.active &&
      this.frameState.running &&
      document.visibilityState === "visible"
    );
  }

  private syncAnimationLoop() {
    if (!this.canAnimate()) {
      this.cancelAnimationFrame();
      this.clear();
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

  private clear() {
    for (const target of Object.values(
      this.targets,
    ) as TrainingGpuRadarTarget[]) {
      const gl = target.gl;
      if (gl) gl.clear(gl.COLOR_BUFFER_BIT);
    }
  }

  private setReady(ready: boolean) {
    if (this.ready === ready) return;
    this.ready = ready;
    this.options.onReadyChange(ready);
  }

  private releaseAllResources() {
    for (const target of Object.values(
      this.targets,
    ) as TrainingGpuRadarTarget[]) {
      if (target.gl && !target.contextLost) {
        destroyTrainingGpuRadarPlaneResources(target.gl, target.resources);
      }
      target.resources = null;
    }
  }

  private loseTarget(
    target: TrainingGpuRadarTarget,
    event: Event,
  ) {
    event.preventDefault();
    target.contextLost = true;
    target.resources = null;
    this.initialized = false;
    this.cancelAnimationFrame();
    this.setReady(false);
  }

  private restoreTarget(target: TrainingGpuRadarTarget) {
    target.gl = target.canvas.getContext(
      "webgl2",
      TRAINING_GPU_CONTEXT_ATTRIBUTES,
    );
    target.contextLost = target.gl === null;

    if (!target.gl) {
      this.setReady(false);
      return;
    }

    try {
      this.initializeTarget(target);
      this.initialized = Boolean(
        this.targets.surface.resources && this.targets.sweep.resources,
      );
      this.completeFirstRender();
      this.syncAnimationLoop();
    } catch {
      target.resources = null;
      this.initialized = false;
      this.setReady(false);
    }
  }

  private readonly handleAnimationFrame = (nowMs: number) => {
    this.animationFrameId = null;

    if (!this.canAnimate()) {
      this.clear();
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

  private readonly handleSurfaceContextLost = (event: Event) => {
    this.loseTarget(this.targets.surface, event);
  };

  private readonly handleSweepContextLost = (event: Event) => {
    this.loseTarget(this.targets.sweep, event);
  };

  private readonly handleSurfaceContextRestored = () => {
    this.restoreTarget(this.targets.surface);
  };

  private readonly handleSweepContextRestored = () => {
    this.restoreTarget(this.targets.sweep);
  };
}
