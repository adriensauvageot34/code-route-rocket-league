import type {
  TrainingGpuDebugAssetSnapshot,
  TrainingGpuDebugCanvasMetrics,
  TrainingGpuDebugContextState,
  TrainingGpuDebugFrameMetrics,
  TrainingGpuDebugGlobalSnapshot,
  TrainingGpuDebugResourceCounts,
  TrainingGpuDebugSnapshot,
  TrainingGpuDebugSubsystemName,
  TrainingGpuDebugSubsystemSnapshot,
} from "@/lib/home/gpu/debug/trainingGpuDebugTypes";

const FRAME_SAMPLE_CAPACITY = 240;
const CPU_SAMPLE_CAPACITY = 120;
const LONG_TASK_SAMPLE_CAPACITY = 120;
const SNAPSHOT_NOTIFICATION_INTERVAL_MS = 250;

class TrainingGpuDebugRingBuffer {
  private readonly values: Float64Array;
  private length = 0;
  private writeIndex = 0;

  constructor(capacity: number) {
    this.values = new Float64Array(capacity);
  }

  push(value: number) {
    if (!Number.isFinite(value)) return;
    this.values[this.writeIndex] = value;
    this.writeIndex = (this.writeIndex + 1) % this.values.length;
    this.length = Math.min(this.length + 1, this.values.length);
  }

  toArray() {
    const output = new Array<number>(this.length);
    const start =
      (this.writeIndex - this.length + this.values.length) %
      this.values.length;
    for (let index = 0; index < this.length; index += 1) {
      output[index] = this.values[(start + index) % this.values.length];
    }
    return output;
  }

  clear() {
    this.length = 0;
    this.writeIndex = 0;
  }
}

type MutableSubsystemState = {
  initialized: boolean;
  ready: boolean;
  contextState: TrainingGpuDebugContextState;
  lastCpuMs: number;
  lastError: string | null;
  contextLosses: number;
  contextRestorations: number;
  staticRenders: number;
  resources: TrainingGpuDebugResourceCounts;
  canvases: TrainingGpuDebugCanvasMetrics[];
  cpuSamples: TrainingGpuDebugRingBuffer;
};

const EMPTY_RESOURCES: TrainingGpuDebugResourceCounts = {
  contexts: 0,
  programs: 0,
  buffers: 0,
  vertexArrays: 0,
  textures: 0,
  estimatedTextureBytes: 0,
};

const INITIAL_GLOBAL: TrainingGpuDebugGlobalSnapshot = {
  absolutePassIndex: 0,
  activeDriver: "none",
  additionalParallaxRafCount: 0,
  callbackLatenessMs: 0,
  cameraAbsoluteResumeCorrect: true,
  cameraContactsObserved: 0,
  cameraCssWrites: 0,
  cameraCssWritesAvoided: 0,
  cameraDepthProfile: "multi-depth",
  cameraGpuUpdates: 0,
  cameraGpuUpdatesAvoided: 0,
  cameraMissedFrames: 0,
  cameraPhase: "neutral",
  cameraScale: 1,
  cameraSegmentStartedAtMs: 0,
  cameraSource: "master-clock",
  cameraSourceEvent: "neutral",
  cameraStabilized: true,
  cameraTargetScale: 1,
  cameraTargetX: 0,
  cameraTargetY: 0,
  cameraX: 0,
  cameraY: 0,
  cumulativeTheoreticalDriftMs: 0,
  cycleStartedAtMs: 0,
  documentVisible: true,
  domChangedValuesPerFrame: 0,
  domUpdatesPerFrame: 0,
  globalTimersActive: 0,
  mode: "dom",
  rendererRequested: "gpu",
  rendererEffective: "dom",
  rendererResolved: false,
  rendererFallback: false,
  rendererFallbackReason: "none",
  contextState: "unavailable",
  nextPassBoundaryMs: 0,
  objectTimersActive: 0,
  rendererActive: false,
  rendererSuspended: true,
  resizePending: false,
  rafActive: false,
  illustrationActive: false,
  radarRunning: false,
  tabVisibility: "visible",
  passMode: "volume",
  passProgress: 0,
  passKey: 0,
  passStartedAtMs: 0,
  pointerListenersActive: 0,
  skippedPasses: 0,
  trainingRafCount: 0,
  masterClockNowMs: 0,
  dpr: 1,
  renderScale: 1,
  resizeGeneration: 0,
  reducedMotion: false,
  runtimeState: "preparing",
  viewportCssWidth: 0,
  viewportCssHeight: 0,
  viewportPixelWidth: 0,
  viewportPixelHeight: 0,
  canvasCount: 0,
  contextCount: 0,
  drawCallsPerFrame: 0,
  clearCallsPerFrame: 0,
  programChangesPerFrame: 0,
  textureBindsPerFrame: 0,
  blendChangesPerFrame: 0,
  framebufferChangesPerFrame: 0,
};

const INITIAL_ASSETS: TrainingGpuDebugAssetSnapshot = {
  status: "idle",
  expectedManifests: 0,
  loadedManifests: 0,
  manifestsInError: 0,
  expectedAssets: 0,
  loadedAssets: 0,
  assetsInError: 0,
  manifestLoadMs: 0,
  imageDecodeMs: 0,
  textureUploadMs: 0,
};

function createSubsystemState(): MutableSubsystemState {
  return {
    initialized: false,
    ready: false,
    contextState: "unavailable",
    lastCpuMs: 0,
    lastError: null,
    contextLosses: 0,
    contextRestorations: 0,
    staticRenders: 0,
    resources: { ...EMPTY_RESOURCES },
    canvases: [],
    cpuSamples: new TrainingGpuDebugRingBuffer(CPU_SAMPLE_CAPACITY),
  };
}

function average(values: readonly number[]) {
  if (values.length === 0) return 0;
  let total = 0;
  for (const value of values) total += value;
  return total / values.length;
}

function maximum(values: readonly number[]) {
  let result = 0;
  for (const value of values) result = Math.max(result, value);
  return result;
}

function countOver(values: readonly number[], threshold: number) {
  let count = 0;
  for (const value of values) {
    if (value > threshold) count += 1;
  }
  return count;
}

function p95(values: readonly number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export class TrainingGpuDebugCollector {
  private readonly frameSamples = new TrainingGpuDebugRingBuffer(
    FRAME_SAMPLE_CAPACITY,
  );
  private readonly longTaskSamples = new TrainingGpuDebugRingBuffer(
    LONG_TASK_SAMPLE_CAPACITY,
  );
  private readonly loadedManifestUrls = new Set<string>();
  private readonly snapshotSubscribers = new Set<() => void>();
  private readonly subsystems: Record<
    TrainingGpuDebugSubsystemName,
    MutableSubsystemState
  > = {
    bases: createSubsystemState(),
    radar: createSubsystemState(),
    particles: createSubsystemState(),
    volume: createSubsystemState(),
    "fennec-base": createSubsystemState(),
    "fennec-volume": createSubsystemState(),
    "fennec-effects": createSubsystemState(),
    tactical: createSubsystemState(),
  };
  private global = { ...INITIAL_GLOBAL };
  private assets = { ...INITIAL_ASSETS };
  private destroyed = false;
  private lastFrameAtMs = 0;
  private smoothedFps = 0;
  private longTasksAvailable = false;
  private longTaskCount = 0;
  private lastLongTaskDurationMs = 0;
  private lastSnapshotNotificationAtMs = 0;

  subscribe(listener: () => void) {
    if (this.destroyed) return () => {};
    this.snapshotSubscribers.add(listener);
    return () => {
      this.snapshotSubscribers.delete(listener);
    };
  }

  recordFrame(nowMs: number) {
    if (this.destroyed || !Number.isFinite(nowMs)) return;
    if (this.lastFrameAtMs > 0) {
      const durationMs = nowMs - this.lastFrameAtMs;
      if (durationMs > 0 && durationMs < 1000) {
        this.frameSamples.push(durationMs);
        const instantFps = 1000 / durationMs;
        this.smoothedFps =
          this.smoothedFps === 0
            ? instantFps
            : this.smoothedFps * 0.85 + instantFps * 0.15;
      }
    }
    this.lastFrameAtMs = nowMs;
    this.notifySnapshotSubscribers(nowMs);
  }

  recordSubsystemCpu(
    subsystem: TrainingGpuDebugSubsystemName,
    durationMs: number,
  ) {
    if (this.destroyed || !Number.isFinite(durationMs)) return;
    const state = this.subsystems[subsystem];
    state.lastCpuMs = Math.max(0, durationMs);
    state.cpuSamples.push(state.lastCpuMs);
  }

  recordStaticRender(subsystem: TrainingGpuDebugSubsystemName) {
    if (this.destroyed) return;
    this.subsystems[subsystem].staticRenders += 1;
  }

  setSubsystemState(
    subsystem: TrainingGpuDebugSubsystemName,
    state: Partial<
      Pick<
        TrainingGpuDebugSubsystemSnapshot,
        "initialized" | "ready" | "contextState" | "lastError"
      >
    >,
  ) {
    if (this.destroyed) return;
    Object.assign(this.subsystems[subsystem], state);
  }

  setSubsystemResources(
    subsystem: TrainingGpuDebugSubsystemName,
    resources: TrainingGpuDebugResourceCounts,
    canvases: TrainingGpuDebugCanvasMetrics[],
  ) {
    if (this.destroyed) return;
    this.subsystems[subsystem].resources = { ...resources };
    this.subsystems[subsystem].canvases = canvases.map((canvas) => ({
      ...canvas,
    }));
  }

  recordSubsystemError(
    subsystem: TrainingGpuDebugSubsystemName,
    error: unknown,
  ) {
    if (this.destroyed) return;
    this.subsystems[subsystem].lastError = errorMessage(error);
  }

  recordContextLost(subsystem: TrainingGpuDebugSubsystemName) {
    if (this.destroyed) return;
    const state = this.subsystems[subsystem];
    state.contextLosses += 1;
    state.contextState = "lost";
  }

  recordContextRestored(subsystem: TrainingGpuDebugSubsystemName) {
    if (this.destroyed) return;
    const state = this.subsystems[subsystem];
    state.contextRestorations += 1;
    state.contextState = "available";
  }

  setGlobal(state: Partial<TrainingGpuDebugGlobalSnapshot>) {
    if (this.destroyed) return;
    Object.assign(this.global, state);
    this.notifySnapshotSubscribers(performance.now());
  }

  setAssetStatus(status: TrainingGpuDebugAssetSnapshot["status"]) {
    if (this.destroyed) return;
    this.assets.status = status;
  }

  setExpectedManifests(count: number) {
    if (this.destroyed) return;
    this.assets.expectedManifests = Math.max(0, count);
  }

  recordManifestLoaded(
    manifestUrl: string,
    durationMs: number,
    expectedAssets: number,
  ) {
    if (this.destroyed || this.loadedManifestUrls.has(manifestUrl)) return;
    this.loadedManifestUrls.add(manifestUrl);
    this.assets.loadedManifests += 1;
    this.assets.expectedAssets += Math.max(0, expectedAssets);
    this.assets.manifestLoadMs += Math.max(0, durationMs);
  }

  recordImageDecoded(durationMs: number) {
    if (this.destroyed) return;
    this.assets.loadedAssets += 1;
    this.assets.imageDecodeMs += Math.max(0, durationMs);
  }

  recordTextureUpload(durationMs: number) {
    if (this.destroyed) return;
    this.assets.textureUploadMs += Math.max(0, durationMs);
  }

  recordAssetError(kind: "manifest" | "image", error: unknown) {
    if (this.destroyed) return;
    if (kind === "manifest") this.assets.manifestsInError += 1;
    else this.assets.assetsInError += 1;
    this.subsystems.bases.lastError = errorMessage(error);
    this.subsystems.volume.lastError = errorMessage(error);
    this.subsystems["fennec-base"].lastError = errorMessage(error);
    this.subsystems["fennec-volume"].lastError = errorMessage(error);
    this.subsystems["fennec-effects"].lastError = errorMessage(error);
    this.subsystems.tactical.lastError = errorMessage(error);
  }

  setLongTasksAvailable(available: boolean) {
    if (this.destroyed) return;
    this.longTasksAvailable = available;
  }

  recordLongTask(durationMs: number) {
    if (this.destroyed || !Number.isFinite(durationMs)) return;
    this.longTaskCount += 1;
    this.lastLongTaskDurationMs = Math.max(0, durationMs);
    this.longTaskSamples.push(this.lastLongTaskDurationMs);
  }

  getSnapshot(): TrainingGpuDebugSnapshot {
    const frameValues = this.frameSamples.toArray();
    const averageFrameMs = average(frameValues);
    const frames: TrainingGpuDebugFrameMetrics = {
      smoothedFps: this.smoothedFps,
      averageFps: averageFrameMs > 0 ? 1000 / averageFrameMs : 0,
      averageFrameMs,
      p95FrameMs: p95(frameValues),
      maximumFrameMs: maximum(frameValues),
      over20Ms: countOver(frameValues, 20),
      over33Ms: countOver(frameValues, 33),
      over50Ms: countOver(frameValues, 50),
      sampleCount: frameValues.length,
    };

    const subsystemSnapshots = Object.fromEntries(
      (
        Object.entries(this.subsystems) as [
          TrainingGpuDebugSubsystemName,
          MutableSubsystemState,
        ][]
      ).map(([name, state]) => {
        const cpuValues = state.cpuSamples.toArray();
        return [
          name,
          {
            initialized: state.initialized,
            ready: state.ready,
            contextState: state.contextState,
            lastCpuMs: state.lastCpuMs,
            averageCpuMs: average(cpuValues),
            lastError: state.lastError,
            contextLosses: state.contextLosses,
            contextRestorations: state.contextRestorations,
            staticRenders: state.staticRenders,
            resources: { ...state.resources },
            canvases: state.canvases.map((canvas) => ({ ...canvas })),
          },
        ];
      }),
    ) as TrainingGpuDebugSnapshot["subsystems"];

    const resources = (
      Object.entries(subsystemSnapshots) as [
        TrainingGpuDebugSubsystemName,
        TrainingGpuDebugSubsystemSnapshot,
      ][]
    ).reduce<TrainingGpuDebugResourceCounts>(
      (total, [name, subsystem]) => ({
        contexts:
          total.contexts +
          (name === "bases" ||
          name === "tactical" ||
          name === "fennec-base" ||
          name === "fennec-effects"
            ? 0
            : subsystem.resources.contexts),
        programs: total.programs + subsystem.resources.programs,
        buffers: total.buffers + subsystem.resources.buffers,
        vertexArrays:
          total.vertexArrays + subsystem.resources.vertexArrays,
        textures: total.textures + subsystem.resources.textures,
        estimatedTextureBytes:
          total.estimatedTextureBytes +
          subsystem.resources.estimatedTextureBytes,
      }),
      { ...EMPTY_RESOURCES },
    );

    const longTaskValues = this.longTaskSamples.toArray();

    return {
      generatedAtMs: performance.now(),
      frames,
      global: { ...this.global },
      subsystems: subsystemSnapshots,
      resources,
      assets: { ...this.assets },
      longTasks: {
        available: this.longTasksAvailable,
        count: this.longTaskCount,
        lastDurationMs: this.lastLongTaskDurationMs,
        maximumRecentMs: maximum(longTaskValues),
        totalRecentMs: longTaskValues.reduce(
          (total, durationMs) => total + durationMs,
          0,
        ),
      },
    };
  }

  destroy() {
    this.destroyed = true;
    this.lastFrameAtMs = 0;
    this.frameSamples.clear();
    this.longTaskSamples.clear();
    this.loadedManifestUrls.clear();
    this.snapshotSubscribers.clear();
    for (const subsystem of Object.values(this.subsystems)) {
      subsystem.cpuSamples.clear();
      subsystem.canvases = [];
    }
  }

  private notifySnapshotSubscribers(nowMs: number) {
    if (
      this.destroyed ||
      this.snapshotSubscribers.size === 0 ||
      nowMs - this.lastSnapshotNotificationAtMs <
        SNAPSHOT_NOTIFICATION_INTERVAL_MS
    ) {
      return;
    }
    this.lastSnapshotNotificationAtMs = nowMs;
    for (const listener of this.snapshotSubscribers) listener();
  }
}
