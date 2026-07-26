import {
  TRAINING_GPU_CONTEXT_ATTRIBUTES,
  TRAINING_GPU_MAX_DPR,
} from "@/lib/home/gpu/trainingGpuConstants";
import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";
import {
  convertTrainingGpuLogicalSceneRectToLocalCanvasRect,
  getTrainingGpuObjectRenderRect,
} from "@/lib/home/gpu/trainingGpuObjectPlacement";
import { getTrainingGpuObjectRegistration } from "@/lib/home/gpu/trainingGpuObjectRegistry";
import type { TrainingGpuObjectRenderRect } from "@/lib/home/gpu/trainingGpuObjectTypes";
import {
  createTrainingGpuVolumeResources,
  destroyTrainingGpuVolumeResources,
  type TrainingGpuVolumeResources,
} from "@/lib/home/gpu/trainingGpuVolumeUtils";
import type {
  TrainingGpuDecodedObjectAsset,
  TrainingGpuDecodedObjectAssetSet,
} from "@/lib/home/gpu/TrainingGpuObjectAssetLoader";
import type { TrainingGpuViewport } from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingGpuVolumeScanState } from "@/lib/home/gpu/trainingGpuVolumeScanTiming";
import { trainingFennecVolumeScanTarget } from "@/lib/home/trainingRadarTargets";

type TrainingGpuFennecVolumeLayer = "surface" | "contour";

type TrainingGpuFennecVolumeOptions = {
  debugCollector: TrainingGpuDebugCollector | null;
  onContextRestored: () => void;
  onReadyChange: (ready: boolean) => void;
};

type TrainingGpuFennecLayerStyle = {
  brightness: number;
  opacity: number;
  saturation: number;
};

const FENNEC_VOLUME_MASK_SCALE = {
  x: 0.34,
  y: 1,
} as const;

const reportedFennecVolumeFailures = new Set<string>();

function reportFennecVolumeFailureOnce(scope: string, error: unknown) {
  if (
    process.env.NODE_ENV === "production" ||
    reportedFennecVolumeFailures.has(scope)
  ) {
    return;
  }

  reportedFennecVolumeFailures.add(scope);
  console.warn(`[Training GPU Fennec volume] ${scope}`, error);
}

function getFennecWebGl2Context(canvas: HTMLCanvasElement) {
  return canvas.getContext(
    "webgl2",
    TRAINING_GPU_CONTEXT_ATTRIBUTES,
  ) as WebGL2RenderingContext | null;
}

function interpolate(left: number, right: number, progress: number) {
  return left + (right - left) * Math.min(1, Math.max(0, progress));
}

function getLayerStyle(
  layer: TrainingGpuFennecVolumeLayer,
  state: TrainingGpuVolumeScanState,
): TrainingGpuFennecLayerStyle {
  if (state.phase === "hidden") {
    return {
      brightness: layer === "surface" ? 1.18 : 1.06,
      opacity: 0,
      saturation: layer === "surface" ? 1.2 : 1.08,
    };
  }

  if (layer === "surface") {
    return {
      brightness: 1.18,
      opacity:
        state.phase === "fade"
          ? 0.48 * state.surfaceOpacityFactor
          : 0.48,
      saturation: 1.2,
    };
  }

  let opacity = 0.14;
  if (state.phase === "active") {
    opacity =
      state.contourProgress <= 0.28
        ? interpolate(0.06, 0.18, state.contourProgress / 0.28)
        : interpolate(
            0.18,
            0,
            (state.contourProgress - 0.28) / 0.72,
          );
  } else if (state.phase === "fade") {
    opacity *= state.contourOpacityFactor;
  }

  return {
    brightness: 1.06,
    opacity,
    saturation: 1.08,
  };
}

function getTextureBytes(
  assetSet: TrainingGpuDecodedObjectAssetSet | null,
) {
  if (!assetSet) return 0;
  let total = 0;
  for (const role of ["volumeSurface", "volumeContour"] as const) {
    const asset = assetSet.assets[role];
    if (asset) {
      total += asset.entry.outputSize.width * asset.entry.outputSize.height * 4;
    }
  }
  return total;
}

export class TrainingGpuFennecVolumeSubsystem {
  private assetSet: TrainingGpuDecodedObjectAssetSet | null = null;
  private contextLost = false;
  private gl: WebGL2RenderingContext | null;
  private initialized = false;
  private ready = false;
  private resources: TrainingGpuVolumeResources | null = null;
  private surfaceQuad: TrainingGpuObjectRenderRect | null = null;
  private contourQuad: TrainingGpuObjectRenderRect | null = null;
  private viewport: TrainingGpuViewport | null = null;
  private readonly onContextLost: (event: Event) => void;
  private readonly onContextRestored: () => void;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: TrainingGpuFennecVolumeOptions,
  ) {
    this.gl = getFennecWebGl2Context(canvas);
    this.contextLost = this.gl === null;
    this.onContextLost = (event) => this.loseContext(event);
    this.onContextRestored = () => this.restoreContext();
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    this.updateDebugState();
  }

  isInitialized() {
    return this.initialized;
  }

  isReady() {
    return this.ready;
  }

  setAssets(assetSet: TrainingGpuDecodedObjectAssetSet | null) {
    if (assetSet === this.assetSet) return;
    this.releaseResources();
    this.assetSet = assetSet?.objectId === "fennec" ? assetSet : null;
    this.initialized = false;
    this.setReady(false);
    this.clear();
    if (this.assetSet) this.initialize();
    this.updateDebugState();
  }

  initialize() {
    if (!this.assetSet || !this.gl || this.contextLost) {
      this.initialized = false;
      this.setReady(false);
      this.updateDebugState();
      return false;
    }
    if (this.initialized && this.resources) return true;

    try {
      this.resources = createTrainingGpuVolumeResources(
        this.gl,
        this.assetSet,
        this.options.debugCollector,
      );
      this.initialized = true;
      this.resize();
    } catch (error) {
      reportFennecVolumeFailureOnce("initialization failed", error);
      this.options.debugCollector?.recordSubsystemError(
        "fennec-volume",
        error,
      );
      this.releaseResources();
      this.initialized = false;
      this.setReady(false);
    }
    this.updateDebugState();
    return this.initialized;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const cssWidth = rect.width;
    const cssHeight = rect.height;
    if (
      !Number.isFinite(cssWidth) ||
      !Number.isFinite(cssHeight) ||
      cssWidth <= 0 ||
      cssHeight <= 0
    ) {
      this.viewport = null;
      this.surfaceQuad = null;
      this.contourQuad = null;
      this.setReady(false);
      this.updateDebugState();
      return;
    }

    const effectiveDpr = Math.min(
      window.devicePixelRatio || 1,
      TRAINING_GPU_MAX_DPR,
    );
    const pixelWidth = Math.max(1, Math.round(cssWidth * effectiveDpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * effectiveDpr));
    if (
      this.canvas.width !== pixelWidth ||
      this.canvas.height !== pixelHeight
    ) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }

    this.viewport = {
      cssWidth,
      cssHeight,
      pixelWidth,
      pixelHeight,
      effectiveDpr,
      logicalWidth: cssWidth,
      logicalHeight: cssHeight,
      renderScale: 1,
    };
    this.gl?.viewport(0, 0, pixelWidth, pixelHeight);
    this.cacheLayerQuads();
    this.updateDebugState();
  }

  beginFrame() {
    this.clear();
  }

  render(state: TrainingGpuVolumeScanState, running: boolean) {
    const { gl, resources, viewport } = this;
    if (
      !this.initialized ||
      !gl ||
      !resources ||
      !viewport ||
      !this.assetSet ||
      !this.surfaceQuad ||
      !this.contourQuad ||
      this.contextLost
    ) {
      this.setReady(false);
      return false;
    }

    try {
      gl.viewport(0, 0, viewport.pixelWidth, viewport.pixelHeight);
      if (!running || state.phase === "hidden") return this.ready;

      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(
        gl.ONE,
        gl.ONE_MINUS_SRC_COLOR,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA,
      );
      gl.useProgram(resources.program);
      gl.bindVertexArray(resources.vertexArray);
      this.renderLayer("surface", state);
      this.renderLayer("contour", state);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindVertexArray(null);
      gl.useProgram(null);
      gl.blendFuncSeparate(
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA,
      );
      this.setReady(true);
      return true;
    } catch (error) {
      reportFennecVolumeFailureOnce("render failed", error);
      this.options.debugCollector?.recordSubsystemError(
        "fennec-volume",
        error,
      );
      this.setReady(false);
      this.clear();
      return false;
    }
  }

  clear() {
    if (this.gl && !this.contextLost) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
  }

  destroy() {
    this.setReady(false);
    this.releaseResources();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );
    this.assetSet = null;
    this.gl = null;
    this.viewport = null;
    this.surfaceQuad = null;
    this.contourQuad = null;
    this.initialized = false;
    this.updateDebugState();
  }

  private cacheLayerQuads() {
    const assetSet = this.assetSet;
    const viewport = this.viewport;
    if (!assetSet || !viewport) {
      this.surfaceQuad = null;
      this.contourQuad = null;
      return;
    }

    const registration = getTrainingGpuObjectRegistration("fennec");
    const localFrame = {
      width: viewport.cssWidth,
      height: viewport.cssHeight,
    };
    const getQuad = (
      asset: TrainingGpuDecodedObjectAsset | undefined,
    ): TrainingGpuObjectRenderRect | null =>
      asset
        ? convertTrainingGpuLogicalSceneRectToLocalCanvasRect(
            getTrainingGpuObjectRenderRect(registration, asset.entry),
            localFrame,
          )
        : null;

    this.surfaceQuad = getQuad(assetSet.assets.volumeSurface);
    this.contourQuad = getQuad(assetSet.assets.volumeContour);
  }

  private renderLayer(
    layer: TrainingGpuFennecVolumeLayer,
    state: TrainingGpuVolumeScanState,
  ) {
    const { gl, resources, viewport, assetSet } = this;
    const quad = layer === "surface" ? this.surfaceQuad : this.contourQuad;
    if (!gl || !resources || !viewport || !assetSet || !quad) return;

    const asset =
      layer === "surface"
        ? assetSet.assets.volumeSurface
        : assetSet.assets.volumeContour;
    if (!asset) throw new Error(`Missing Fennec ${layer} volume texture.`);

    const style = getLayerStyle(layer, state);
    if (style.opacity <= 0) return;

    const progress =
      layer === "surface" ? state.surfaceProgress : state.contourProgress;
    const maskCenter = interpolate(
      trainingFennecVolumeScanTarget.scanRange.startProgress,
      trainingFennecVolumeScanTarget.scanRange.endProgress,
      progress,
    );
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
    gl.uniform1i(resources.uniforms.maskKind, layer === "surface" ? 0 : 1);
    gl.uniform1f(resources.uniforms.maskCenter, maskCenter);
    gl.uniform2f(
      resources.uniforms.maskScale,
      FENNEC_VOLUME_MASK_SCALE.x,
      FENNEC_VOLUME_MASK_SCALE.y,
    );
    gl.uniform1f(resources.uniforms.maskAngle, 0);
    gl.uniform1f(resources.uniforms.opacity, style.opacity);
    gl.uniform1f(resources.uniforms.brightness, style.brightness);
    gl.uniform1f(resources.uniforms.saturation, style.saturation);
    gl.uniform2f(resources.uniforms.glowOffset, 0, 0);
    gl.uniform1f(resources.uniforms.glowStrength, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private setReady(ready: boolean) {
    if (this.ready === ready) return;
    this.ready = ready;
    this.options.onReadyChange(ready);
    this.updateDebugState();
  }

  private releaseResources() {
    if (this.gl && !this.contextLost) {
      destroyTrainingGpuVolumeResources(this.gl, this.resources);
    }
    this.resources = null;
    this.updateDebugState();
  }

  private loseContext(event: Event) {
    event.preventDefault();
    this.contextLost = true;
    this.resources = null;
    this.initialized = false;
    this.options.debugCollector?.recordContextLost("fennec-volume");
    this.setReady(false);
    this.updateDebugState();
  }

  private restoreContext() {
    this.gl = getFennecWebGl2Context(this.canvas);
    this.contextLost = this.gl === null;
    if (!this.gl) {
      this.setReady(false);
      this.updateDebugState();
      return;
    }

    if (this.initialize()) {
      this.options.debugCollector?.recordContextRestored("fennec-volume");
      this.options.onContextRestored();
    }
    this.updateDebugState();
  }

  private updateDebugState() {
    const debugCollector = this.options.debugCollector;
    if (!debugCollector) return;

    const contextState = !this.gl
      ? "unavailable"
      : this.contextLost
        ? "lost"
        : "available";
    debugCollector.setSubsystemState("fennec-volume", {
      initialized: this.initialized,
      ready: this.ready,
      contextState,
    });
    debugCollector.setSubsystemResources(
      "fennec-volume",
      {
        contexts: this.gl && !this.contextLost ? 1 : 0,
        programs: this.resources ? 1 : 0,
        buffers: this.resources ? 1 : 0,
        vertexArrays: this.resources ? 1 : 0,
        textures: this.resources ? 2 : 0,
        estimatedTextureBytes: this.resources
          ? getTextureBytes(this.assetSet)
          : 0,
      },
      this.viewport
        ? [
            {
              id: "fennec-volume",
              subsystem: "fennec-volume",
              cssWidth: this.viewport.cssWidth,
              cssHeight: this.viewport.cssHeight,
              pixelWidth: this.viewport.pixelWidth,
              pixelHeight: this.viewport.pixelHeight,
            },
          ]
        : [],
    );
  }
}
