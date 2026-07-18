import type { CSSProperties } from "react";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
import {
  TRAINING_RADAR_FIELD_PATH,
  TRAINING_RADAR_SWEEP,
  TRAINING_RADAR_TIMING,
  type TrainingRadarDirection,
} from "@/lib/home/trainingRadarTargets";

type TrainingRadarOverlayProps = {
  active: boolean;
  direction: TrainingRadarDirection;
  variant: "surface" | "sweep";
};

type TrainingRadarStyle = CSSProperties & {
  "--radar-entry-duration": string;
  "--radar-end-x": string;
  "--radar-start-x": string;
  "--radar-travel-duration": string;
};

const terrainAsset = homeIllustrationAssets.training.tacticalTerrain;

const REVEAL_PATHS: Record<TrainingRadarDirection, string> = {
  ltr: "M -790 340 L 30 340 L 270 941 L -550 941 Z",
  rtl: "M 790 340 L -30 340 L -270 941 L 550 941 Z",
};

const CORE_REVEAL_PATHS: Record<TrainingRadarDirection, string> = {
  ltr: "M -24 340 L 18 340 L 256 941 L 214 941 Z",
  rtl: "M 24 340 L -18 340 L -256 941 L -214 941 Z",
};

const SWEEP_PATHS: Record<TrainingRadarDirection, string> = {
  ltr: "M -286 340 L 2 340 L 238 941 L -50 941 Z",
  rtl: "M 286 340 L -2 340 L -238 941 L 50 941 Z",
};

const CORE_PATHS: Record<TrainingRadarDirection, string> = {
  ltr: "M 2 340 L 238 941",
  rtl: "M -2 340 L -238 941",
};

export function TrainingRadarOverlay({
  active,
  direction,
  variant,
}: TrainingRadarOverlayProps) {
  const movesLeftToRight = direction === "ltr";
  const style: TrainingRadarStyle = {
    "--radar-entry-duration": `${TRAINING_RADAR_TIMING.entryDurationMs}ms`,
    "--radar-travel-duration": `${TRAINING_RADAR_TIMING.travelDurationMs}ms`,
    "--radar-start-x": `${movesLeftToRight ? TRAINING_RADAR_SWEEP.startX : TRAINING_RADAR_SWEEP.endX}px`,
    "--radar-end-x": `${movesLeftToRight ? TRAINING_RADAR_SWEEP.endX : TRAINING_RADAR_SWEEP.startX}px`,
  };

  if (variant === "surface") {
    return (
      <svg
        aria-hidden="true"
        className={`training-radar-overlay training-radar-surface${active ? " is-active" : ""}`}
        data-radar-direction={direction}
        preserveAspectRatio="xMidYMid slice"
        style={style}
        viewBox="0 0 1672 941"
      >
        <defs>
          <linearGradient
            id="training-radar-surface-depth-gradient"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop offset="0" stopColor="black" />
            <stop offset="0.16" stopColor="#060606" />
            <stop offset="0.42" stopColor="#3a3a3a" />
            <stop offset="0.66" stopColor="#8c8c8c" />
            <stop offset="0.84" stopColor="#d5d5d5" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <mask id="training-radar-field-surface-mask" maskUnits="userSpaceOnUse">
            <rect width="1672" height="941" fill="black" />
            <path
              d={TRAINING_RADAR_FIELD_PATH}
              fill="url(#training-radar-surface-depth-gradient)"
            />
          </mask>
          <linearGradient
            id="training-radar-terrain-mask-gradient"
            x1={movesLeftToRight ? "0" : "1"}
            x2={movesLeftToRight ? "1" : "0"}
            y1="0"
            y2="0"
          >
            <stop offset="0" stopColor="black" />
            <stop offset="0.35" stopColor="#0c0c0c" />
            <stop offset="0.62" stopColor="#282828" />
            <stop offset="0.82" stopColor="#707070" />
            <stop offset="0.94" stopColor="#d0d0d0" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
          <mask id="training-radar-terrain-reveal-mask" maskUnits="userSpaceOnUse">
            <rect width="1672" height="941" fill="black" />
            <g className="training-radar-motion">
              <path
                d={REVEAL_PATHS[direction]}
                fill="url(#training-radar-terrain-mask-gradient)"
              />
            </g>
          </mask>
          <mask id="training-radar-terrain-core-mask" maskUnits="userSpaceOnUse">
            <rect width="1672" height="941" fill="black" />
            <g className="training-radar-motion">
              <path d={CORE_REVEAL_PATHS[direction]} fill="white" />
            </g>
          </mask>
        </defs>
        <g mask="url(#training-radar-field-surface-mask)">
          <image
            className="training-tactical-terrain"
            height="941"
            href={terrainAsset.path}
            mask="url(#training-radar-terrain-reveal-mask)"
            preserveAspectRatio="xMidYMid slice"
            width="1672"
          />
          <image
            className="training-tactical-terrain-core"
            height="941"
            href={terrainAsset.path}
            mask="url(#training-radar-terrain-core-mask)"
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
      data-radar-direction={direction}
      preserveAspectRatio="xMidYMid slice"
      style={style}
      viewBox="0 0 1672 941"
    >
      <defs>
        <linearGradient
          id="training-radar-trail-gradient"
          x1={movesLeftToRight ? "0" : "1"}
          x2={movesLeftToRight ? "1" : "0"}
          y1="0"
          y2="0"
        >
          <stop offset="0" stopColor="#6654b9" stopOpacity="0" />
          <stop offset="0.5" stopColor="#785fd0" stopOpacity="0.06" />
          <stop offset="0.84" stopColor="#bb8541" stopOpacity="0.16" />
          <stop offset="1" stopColor="#f3c46b" stopOpacity="0.29" />
        </linearGradient>
        <linearGradient
          id="training-radar-depth-gradient"
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop offset="0" stopColor="black" />
          <stop offset="0.16" stopColor="#060606" />
          <stop offset="0.42" stopColor="#3a3a3a" />
          <stop offset="0.66" stopColor="#8c8c8c" />
          <stop offset="0.84" stopColor="#d5d5d5" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
        <mask id="training-radar-field-sweep-mask" maskUnits="userSpaceOnUse">
          <rect width="1672" height="941" fill="black" />
          <path
            d={TRAINING_RADAR_FIELD_PATH}
            fill="url(#training-radar-depth-gradient)"
          />
        </mask>
      </defs>
      <g mask="url(#training-radar-field-sweep-mask)">
        <g className="training-radar-motion">
          <path
            className="training-radar-trail"
            d={SWEEP_PATHS[direction]}
            fill="url(#training-radar-trail-gradient)"
          />
          <path
            className="training-radar-core-glow"
            d={CORE_PATHS[direction]}
          />
          <path
            className="training-radar-core-line"
            d={CORE_PATHS[direction]}
          />
        </g>
      </g>
    </svg>
  );
}
