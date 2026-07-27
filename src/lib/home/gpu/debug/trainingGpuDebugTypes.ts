import type {
  TrainingGpuContextState,
  TrainingGpuRuntimeState,
  TrainingRendererFallbackReason,
  TrainingRendererMode,
} from "@/lib/home/gpu/trainingGpuTypes";
import type { TrainingCameraPhase } from "@/lib/home/trainingCamera";
import type { TrainingRadarPassMode } from "@/lib/home/trainingRadarClock";

export type TrainingGpuDebugSubsystemName =
  | "bases"
  | "radar"
  | "particles"
  | "volume"
  | "fennec-base"
  | "fennec-volume"
  | "fennec-effects"
  | "tactical";

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
  staticRenders: number;
  resources: TrainingGpuDebugResourceCounts;
  canvases: TrainingGpuDebugCanvasMetrics[];
};

export type TrainingGpuDebugGlobalSnapshot = {
  absolutePassIndex: number;
  activeDriver: "gpu" | "dom" | "none";
  additionalParallaxRafCount: number;
  callbackLatenessMs: number;
  cameraAbsoluteResumeCorrect: boolean;
  cameraContactsObserved: number;
  cameraCssWrites: number;
  cameraCssWritesAvoided: number;
  cameraDepthProfile: string;
  cameraGpuUpdates: number;
  cameraGpuUpdatesAvoided: number;
  cameraMissedFrames: number;
  cameraPhase: TrainingCameraPhase;
  cameraScale: number;
  cameraSegmentStartedAtMs: number;
  cameraSource: "master-clock";
  cameraSourceEvent: string;
  cameraStabilized: boolean;
  cameraTargetScale: number;
  cameraTargetX: number;
  cameraTargetY: number;
  cameraX: number;
  cameraY: number;
  cumulativeTheoreticalDriftMs: number;
  cycleStartedAtMs: number;
  documentVisible: boolean;
  domChangedValuesPerFrame: number;
  domUpdatesPerFrame: number;
  globalTimersActive: number;
  mode: TrainingRendererMode;
  rendererRequested: TrainingRendererMode;
  rendererEffective: TrainingRendererMode;
  rendererResolved: boolean;
  rendererFallback: boolean;
  rendererFallbackReason: TrainingRendererFallbackReason;
  contextState: TrainingGpuContextState;
  nextPassBoundaryMs: number;
  objectTimersActive: number;
  rendererActive: boolean;
  rendererSuspended: boolean;
  resizePending: boolean;
  rafActive: boolean;
  illustrationActive: boolean;
  radarRunning: boolean;
  tabVisibility: string;
  passMode: TrainingRadarPassMode;
  passProgress: number;
  passKey: number;
  passStartedAtMs: number;
  pointerListenersActive: number;
  skippedPasses: number;
  trainingRafCount: number;
  masterClockNowMs: number;
  dpr: number;
  renderScale: number;
  resizeGeneration: number;
  reducedMotion: boolean;
  runtimeState: TrainingGpuRuntimeState;
  viewportCssWidth: number;
  viewportCssHeight: number;
  viewportPixelWidth: number;
  viewportPixelHeight: number;
  canvasCount: number;
  contextCount: number;
  drawCallsPerFrame: number;
  clearCallsPerFrame: number;
  programChangesPerFrame: number;
  textureBindsPerFrame: number;
  blendChangesPerFrame: number;
  framebufferChangesPerFrame: number;
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
