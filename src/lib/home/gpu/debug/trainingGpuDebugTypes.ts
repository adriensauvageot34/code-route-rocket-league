import type { TrainingRendererMode } from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingRadarPassMode } from "@/lib/home/trainingRadarClock";

export type TrainingGpuDebugSubsystemName =
  | "radar"
  | "particles"
  | "volume";

export type TrainingGpuDebugContextState =
  | "available"
  | "lost"
  | "unavailable";

export type TrainingGpuDebugResourceCounts = {
  contexts: number;
  programs: number;
  buffers: number;
  vertexArrays: number;
  textures: number;
  estimatedTextureBytes: number;
};

export type TrainingGpuDebugCanvasMetrics = {
  id: string;
  subsystem: TrainingGpuDebugSubsystemName;
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
};

export type TrainingGpuDebugFrameMetrics = {
  smoothedFps: number;
  averageFps: number;
  averageFrameMs: number;
  p95FrameMs: number;
  maximumFrameMs: number;
  over20Ms: number;
  over33Ms: number;
  over50Ms: number;
  sampleCount: number;
};

export type TrainingGpuDebugSubsystemSnapshot = {
  initialized: boolean;
  ready: boolean;
  contextState: TrainingGpuDebugContextState;
  lastCpuMs: number;
  averageCpuMs: number;
  lastError: string | null;
  contextLosses: number;
  contextRestorations: number;
  resources: TrainingGpuDebugResourceCounts;
  canvases: TrainingGpuDebugCanvasMetrics[];
};

export type TrainingGpuDebugGlobalSnapshot = {
  mode: TrainingRendererMode;
  rendererActive: boolean;
  rendererSuspended: boolean;
  rafActive: boolean;
  illustrationActive: boolean;
  radarRunning: boolean;
  tabVisibility: string;
  passMode: TrainingRadarPassMode;
  passProgress: number;
  passKey: number;
  masterClockNowMs: number;
  dpr: number;
  renderScale: number;
  viewportCssWidth: number;
  viewportCssHeight: number;
  viewportPixelWidth: number;
  viewportPixelHeight: number;
};

export type TrainingGpuDebugAssetSnapshot = {
  status: "idle" | "loading" | "ready" | "error";
  expectedManifests: number;
  loadedManifests: number;
  manifestsInError: number;
  expectedAssets: number;
  loadedAssets: number;
  assetsInError: number;
  manifestLoadMs: number;
  imageDecodeMs: number;
  textureUploadMs: number;
};

export type TrainingGpuDebugLongTaskSnapshot = {
  available: boolean;
  count: number;
  lastDurationMs: number;
  maximumRecentMs: number;
  totalRecentMs: number;
};

export type TrainingGpuDebugSnapshot = {
  generatedAtMs: number;
  frames: TrainingGpuDebugFrameMetrics;
  global: TrainingGpuDebugGlobalSnapshot;
  subsystems: Record<
    TrainingGpuDebugSubsystemName,
    TrainingGpuDebugSubsystemSnapshot
  >;
  resources: TrainingGpuDebugResourceCounts;
  assets: TrainingGpuDebugAssetSnapshot;
  longTasks: TrainingGpuDebugLongTaskSnapshot;
};
