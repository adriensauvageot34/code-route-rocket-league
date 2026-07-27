import type {
  TrainingRadarFrameState,
} from "@/lib/home/trainingRadarSnapshots";
import type { TrainingRadarPassMode } from "@/lib/home/trainingRadarClock";

export type TrainingRendererMode = "dom" | "gpu";

export type TrainingRendererFallbackReason =
  | "none"
  | "explicit-dom"
  | "webgl2-unavailable"
  | "initialization-failed"
  | "critical-asset-failed"
  | "context-lost"
  | "restore-failed";

export type TrainingRendererRequest = {
  requested: TrainingRendererMode;
  resolved: boolean;
};

export type { TrainingRadarPassMode };

export type TrainingGpuContextState =
  | "available"
  | "partially-lost"
  | "lost"
  | "restoring"
  | "restored"
  | "restore-failed"
  | "unavailable";

export type TrainingGpuRuntimeState =
  | "preparing"
  | "gpu-active"
  | "suspended-hidden"
  | "dom-fallback"
  | "restoring"
  | "launching"
  | "destroyed";

export type TrainingGpuLifecycleSnapshot = {
  activeDriver: "gpu" | "dom" | "none";
  contextState: TrainingGpuContextState;
  runtimeState: TrainingGpuRuntimeState;
};

export type TrainingGpuViewport = {
  cssWidth: number;
  cssHeight: number;
  pixelWidth: number;
  pixelHeight: number;
  effectiveDpr: number;
  logicalWidth: number;
  logicalHeight: number;
  renderScale: number;
};

export type TrainingGpuFrameState = TrainingRadarFrameState;
