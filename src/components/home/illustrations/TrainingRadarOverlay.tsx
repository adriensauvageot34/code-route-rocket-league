import type { CSSProperties } from "react";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
import {
  TRAINING_RADAR_FIELD_PATH,
  TRAINING_RADAR_SWEEP,
  TRAINING_RADAR_TIMING,
} from "@/lib/home/trainingRadarTargets";

type TrainingRadarOverlayProps = {
  active: boolean;
  variant: "surface" | "sweep";
};

type TrainingRadarStyle = CSSProperties & {
  "--radar-entry-duration": string;
  "--radar-end-x": string;
  "--radar-start-x": string;
  "--radar-travel-duration": string;
};

const terrainAsset = homeIllustrationAssets.training.tacticalTerrain;

export function TrainingRadarOverlay({ active, variant }: TrainingRadarOverlayProps) {
  const style: TrainingRadarStyle = {
    "--radar-entry-duration": `${TRAINING_RADAR_TIMING.entryDurationMs}ms`,
    "--radar-travel-duration": `${TRAINING_RADAR_TIMING.travelDurationMs}ms`,
    "--radar-start-x": `${TRAINING_RADAR_SWEEP.startX}px`,
    "--radar-end-x": `${TRAINING_RADAR_SWEEP.endX}px`,
  };

  if (variant === "surface") {
    return (
      <svg
        aria-hidden="true"
        className={`training-radar-overlay training-radar-surface${active ? " is-active" : ""}`}
        preserveAspectRatio="xMidYMid slice"
        style={style}
        viewBox="0 0 1672 941"
      >
        <defs>
          <clipPath id="training-radar-field-surface-clip">
            <path d={TRAINING_RADAR_FIELD_PATH} />
          </clipPath>
          <linearGradient id="training-radar-terrain-mask-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="black" />
            <stop offset="0.12" stopColor="#242424" />
            <stop offset="0.58" stopColor="#b8b8b8" />
            <stop offset="0.82" stopColor="white" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <mask id="training-radar-terrain-reveal-mask" maskUnits="userSpaceOnUse">
            <rect width="1672" height="941" fill="black" />
            <g className="training-radar-motion">
              <path
                d="M -390 340 L 36 340 L 274 941 L -154 941 Z"
                fill="url(#training-radar-terrain-mask-gradient)"
              />
            </g>
          </mask>
        </defs>
        <g clipPath="url(#training-radar-field-surface-clip)">
          <image
            className="training-tactical-terrain"
            height="941"
            href={terrainAsset.path}
            mask="url(#training-radar-terrain-reveal-mask)"
            preserveAspectRatio="xMidYMid slice"
            width="1672"
          />
        </g>
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={`training-radar-overlay training-radar-sweep${active ? " is-active" : ""}`}
      preserveAspectRatio="xMidYMid slice"
      style={style}
      viewBox="0 0 1672 941"
    >
      <defs>
        <clipPath id="training-radar-field-sweep-clip">
          <path d={TRAINING_RADAR_FIELD_PATH} />
        </clipPath>
        <linearGradient id="training-radar-trail-gradient" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#736fff" stopOpacity="0" />
          <stop offset="0.66" stopColor="#706cff" stopOpacity="0.14" />
          <stop offset="1" stopColor="#a7ddff" stopOpacity="0.42" />
        </linearGradient>
      </defs>
      <g clipPath="url(#training-radar-field-sweep-clip)">
        <g className="training-radar-motion">
          <path
            className="training-radar-trail"
            d="M -286 340 L 2 340 L 238 941 L -50 941 Z"
            fill="url(#training-radar-trail-gradient)"
          />
          <path className="training-radar-line-glow" d="M 2 340 L 238 941" />
          <path className="training-radar-line-core" d="M 2 340 L 238 941" />
        </g>
      </g>
    </svg>
  );
}
