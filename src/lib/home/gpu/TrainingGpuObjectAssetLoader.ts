import {
  isTrainingGpuPreparedObjectId,
  type TrainingGpuPreparedObjectId,
} from "@/lib/home/gpu/trainingGpuObjectAssetCatalog";
import {
  validateTrainingGpuObjectManifest,
  type TrainingGpuObjectAssetEntry,
  type TrainingGpuObjectAssetManifest,
} from "@/lib/home/gpu/trainingGpuObjectManifest";
import type { TrainingGpuObjectAssetRole } from "@/lib/home/gpu/trainingGpuObjectTypes";
import type { TrainingGpuDebugCollector } from "@/lib/home/gpu/debug/TrainingGpuDebugCollector";

export type TrainingGpuDecodedObjectAsset = {
  role: TrainingGpuObjectAssetRole;
  entry: TrainingGpuObjectAssetEntry;
  url: string;
  image: HTMLImageElement;
};

export type TrainingGpuDecodedObjectAssetSet = {
  objectId: TrainingGpuPreparedObjectId;
  manifestUrl: string;
  manifest: TrainingGpuObjectAssetManifest;
  assets: Partial<
    Record<TrainingGpuObjectAssetRole, TrainingGpuDecodedObjectAsset>
  >;
};

function createAbortError() {
  return new DOMException("Training GPU object asset loading aborted.", "AbortError");
}

function isManifestCandidate(
  value: unknown,
): value is TrainingGpuObjectAssetManifest {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "version" in value &&
    "objectId" in value &&
    "assets" in value &&
    typeof value.assets === "object" &&
    value.assets !== null &&
    !Array.isArray(value.assets)
  );
}

export function resolveTrainingGpuObjectAssetUrl(
  manifestUrl: string,
  file: string,
) {
  const resolvedManifestUrl = new URL(manifestUrl, window.location.href);
  return new URL(file, resolvedManifestUrl).href;
}

function decodeTrainingGpuObjectImage(
  url: string,
  signal: AbortSignal,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(createAbortError());
      return;
    }

    const image = new Image();
    let settled = false;

    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", handleAbort);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const handleAbort = () => {
      image.src = "";
      fail(createAbortError());
    };

    image.decoding = "async";
    image.onload = async () => {
      try {
        await image.decode();
        if (signal.aborted) {
          handleAbort();
          return;
        }
        if (settled) return;
        settled = true;
        cleanup();
        resolve(image);
      } catch (error) {
        fail(
          error instanceof Error
            ? error
            : new Error(`Unable to decode Training GPU object asset: ${url}`),
        );
      }
    };
    image.onerror = () => {
      fail(new Error(`Unable to load Training GPU object asset: ${url}`));
    };
    signal.addEventListener("abort", handleAbort, { once: true });
    image.src = url;
  });
}

async function loadTrainingGpuObjectAssetSet(
  manifestUrl: string,
  signal: AbortSignal,
  debugCollector: TrainingGpuDebugCollector | null,
): Promise<TrainingGpuDecodedObjectAssetSet> {
  const manifestStartedAtMs = debugCollector ? performance.now() : 0;
  const response = await fetch(manifestUrl, { signal });
  if (!response.ok) {
    throw new Error(
      `Unable to load Training GPU object manifest ${manifestUrl}: ${response.status} ${response.statusText}`,
    );
  }

  const parsedManifest: unknown = await response.json();
  if (!isManifestCandidate(parsedManifest)) {
    throw new Error(`Invalid Training GPU object manifest shape: ${manifestUrl}`);
  }

  const validation = validateTrainingGpuObjectManifest(parsedManifest);
  if (!validation.valid) {
    throw new Error(
      `Invalid Training GPU object manifest ${manifestUrl}: ${validation.errors.join(" ")}`,
    );
  }
  if (!isTrainingGpuPreparedObjectId(parsedManifest.objectId)) {
    throw new Error(
      `Training GPU object is not prepared for runtime loading: ${parsedManifest.objectId}`,
    );
  }

  const assets: Partial<
    Record<TrainingGpuObjectAssetRole, TrainingGpuDecodedObjectAsset>
  > = {};
  const entries = Object.entries(parsedManifest.assets) as [
    TrainingGpuObjectAssetRole,
    TrainingGpuObjectAssetEntry | undefined,
  ][];
  debugCollector?.recordManifestLoaded(
    manifestUrl,
    performance.now() - manifestStartedAtMs,
    entries.filter(([, entry]) => Boolean(entry)).length,
  );

  await Promise.all(
    entries.map(async ([role, entry]) => {
      if (!entry) return;
      const url = resolveTrainingGpuObjectAssetUrl(manifestUrl, entry.file);
      const decodeStartedAtMs = debugCollector ? performance.now() : 0;
      let image: HTMLImageElement;
      try {
        image = await decodeTrainingGpuObjectImage(url, signal);
        if (
          image.naturalWidth !== entry.outputSize.width ||
          image.naturalHeight !== entry.outputSize.height
        ) {
          image.src = "";
          throw new Error(
            `Training GPU object asset dimensions do not match manifest for ${url}: expected ${entry.outputSize.width}x${entry.outputSize.height}, received ${image.naturalWidth}x${image.naturalHeight}.`,
          );
        }
        debugCollector?.recordImageDecoded(
          performance.now() - decodeStartedAtMs,
        );
      } catch (error) {
        debugCollector?.recordAssetError("image", error);
        throw error;
      }

      assets[role] = { role, entry, url, image };
    }),
  );

  return {
    objectId: parsedManifest.objectId,
    manifestUrl,
    manifest: parsedManifest,
    assets,
  };
}

export class TrainingGpuObjectAssetLoader {
  constructor(
    private debugCollector: TrainingGpuDebugCollector | null = null,
  ) {}

  setDebugCollector(debugCollector: TrainingGpuDebugCollector | null) {
    this.debugCollector = debugCollector;
  }

  private readonly completed = new Map<
    string,
    TrainingGpuDecodedObjectAssetSet
  >();

  private readonly pending = new Map<
    string,
    Promise<TrainingGpuDecodedObjectAssetSet>
  >();

  load(manifestUrl: string, signal: AbortSignal) {
    if (signal.aborted) {
      return Promise.reject<TrainingGpuDecodedObjectAssetSet>(
        createAbortError(),
      );
    }

    const completed = this.completed.get(manifestUrl);
    if (completed) return Promise.resolve(completed);

    const pending = this.pending.get(manifestUrl);
    if (pending) return pending;

    const request = loadTrainingGpuObjectAssetSet(
      manifestUrl,
      signal,
      this.debugCollector,
    )
      .then((assetSet) => {
        this.completed.set(manifestUrl, assetSet);
        return assetSet;
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("Training GPU object asset")) {
          this.debugCollector?.recordAssetError("manifest", error);
        }
        throw error;
      })
      .finally(() => {
        this.pending.delete(manifestUrl);
      });

    this.pending.set(manifestUrl, request);
    return request;
  }

  clear() {
    for (const assetSet of this.completed.values()) {
      for (const asset of Object.values(assetSet.assets)) {
        if (asset) asset.image.src = "";
      }
    }
    this.completed.clear();
    this.pending.clear();
  }
}
