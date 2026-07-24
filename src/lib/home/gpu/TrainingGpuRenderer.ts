import { TRAINING_GPU_CONTEXT_ATTRIBUTES } from "@/lib/home/gpu/trainingGpuConstants";
import { TRAINING_RADAR_TIMING } from "@/lib/home/trainingRadarTargets";
import type {
  TrainingGpuFrameState,
  TrainingGpuViewport,
} from "@/lib/home/gpu/trainingGpuTypes";

type TrainingGpuFrameStateFactory = (nowMs: number) => TrainingGpuFrameState;

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

export class TrainingGpuRenderer {
  private animationFrameId: number | null = null;
  private contextLost = false;
  private frameState = INITIAL_FRAME_STATE;
  private gl: WebGL2RenderingContext | null;
  private shouldRun = false;
  private viewport: TrainingGpuViewport | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly createFrameState: TrainingGpuFrameStateFactory,
  ) {
    this.gl = this.createContext();

    canvas.addEventListener("webglcontextlost", this.handleContextLost);
    canvas.addEventListener("webglcontextrestored", this.handleContextRestored);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    if (this.gl) {
      this.initializeContext();
    }
  }

  get available() {
    return this.gl !== null && !this.contextLost;
  }

  resize(viewport: TrainingGpuViewport) {
    this.viewport = viewport;

    if (
      this.canvas.width !== viewport.pixelWidth ||
      this.canvas.height !== viewport.pixelHeight
    ) {
      this.canvas.width = viewport.pixelWidth;
      this.canvas.height = viewport.pixelHeight;
    }

    if (this.gl) {
      this.gl.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
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
    if (!this.gl || this.contextLost) return;

    this.frameState = this.createFrameState(nowMs);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  destroy() {
    this.shouldRun = false;
    this.cancelAnimationFrame();
    this.clear();

    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    this.gl = null;
    this.viewport = null;
  }

  private createContext() {
    return this.canvas.getContext("webgl2", TRAINING_GPU_CONTEXT_ATTRIBUTES);
  }

  private initializeContext() {
    if (!this.gl) return;

    this.gl.clearColor(0, 0, 0, 0);

    if (this.viewport) {
      this.gl.viewport(
        0,
        0,
        this.viewport.pixelWidth,
        this.viewport.pixelHeight,
      );
    }

    this.clear();
  }

  private clear() {
    this.gl?.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private canAnimate() {
    return (
      this.shouldRun &&
      this.available &&
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
      this.animationFrameId = window.requestAnimationFrame(this.handleAnimationFrame);
    }
  }

  private cancelAnimationFrame() {
    if (this.animationFrameId === null) return;

    window.cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
  }

  private readonly handleAnimationFrame = (nowMs: number) => {
    this.animationFrameId = null;

    if (!this.canAnimate()) {
      this.clear();
      return;
    }

    this.render(nowMs);

    if (this.canAnimate()) {
      this.animationFrameId = window.requestAnimationFrame(this.handleAnimationFrame);
    }
  };

  private readonly handleVisibilityChange = () => {
    this.syncAnimationLoop();
  };

  private readonly handleContextLost = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.cancelAnimationFrame();
    this.gl = null;
  };

  private readonly handleContextRestored = () => {
    this.gl = this.createContext();
    this.contextLost = this.gl === null;

    if (!this.gl) return;

    this.initializeContext();
    this.syncAnimationLoop();
  };
}
