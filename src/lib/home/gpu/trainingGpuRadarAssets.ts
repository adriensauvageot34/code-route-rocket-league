import {
  TRAINING_GPU_LOGICAL_HEIGHT,
  TRAINING_GPU_LOGICAL_WIDTH,
} from "@/lib/home/gpu/trainingGpuConstants";
import {
  TRAINING_GPU_RADAR_DEPTH_STOPS,
  TRAINING_GPU_RADAR_FIELD_HORIZON_Y,
} from "@/lib/home/gpu/trainingGpuRadarConstants";
import { TRAINING_RADAR_FIELD_PATH } from "@/lib/home/trainingRadarTargets";

export function createTrainingGpuRadarFieldMask() {
  const canvas = document.createElement("canvas");
  canvas.width = TRAINING_GPU_LOGICAL_WIDTH;
  canvas.height = TRAINING_GPU_LOGICAL_HEIGHT;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Unable to create the Training radar field mask.");
  }

  const depthGradient = context.createLinearGradient(
    0,
    TRAINING_GPU_RADAR_FIELD_HORIZON_Y,
    0,
    TRAINING_GPU_LOGICAL_HEIGHT,
  );

  for (const stop of TRAINING_GPU_RADAR_DEPTH_STOPS) {
    depthGradient.addColorStop(stop.offset, stop.color);
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = depthGradient;
  context.fill(new Path2D(TRAINING_RADAR_FIELD_PATH));

  const rgba = context.getImageData(
    0,
    0,
    TRAINING_GPU_LOGICAL_WIDTH,
    TRAINING_GPU_LOGICAL_HEIGHT,
  ).data;
  const mask = new Uint8Array(
    TRAINING_GPU_LOGICAL_WIDTH * TRAINING_GPU_LOGICAL_HEIGHT,
  );

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    mask[pixelIndex] = rgba[pixelIndex * 4];
  }

  return mask;
}

export async function loadTrainingGpuRadarTerrain(path: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = path;

  if (typeof image.decode === "function") {
    await image.decode();
  } else {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener(
        "error",
        () => reject(new Error("Unable to load the Training tactical terrain.")),
        { once: true },
      );
    });
  }

  if (image.naturalWidth === 0 || image.naturalHeight === 0) {
    throw new Error("The Training tactical terrain decoded without pixels.");
  }

  return image;
}
