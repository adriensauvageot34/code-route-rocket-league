import Image from "next/image";
import type { CSSProperties } from "react";
import type { TrainingRadarPhase } from "@/components/home/illustrations/TrainingRadarSequence";
import {
  TRAINING_RADAR_TIMING,
  type TrainingBallRadarTarget,
  type TrainingCarRadarTarget,
  type TrainingRadarDirection,
} from "@/lib/home/trainingRadarTargets";

type GroundedActorStyle = CSSProperties & {
  "--training-actor-scale": number;
  "--training-actor-source-ground-y": string;
  "--training-actor-source-x": string;
  "--training-actor-translate-x": string;
  "--training-actor-translate-y": string;
  "--training-contact-shadow-height": string;
  "--training-contact-shadow-width": string;
  "--training-target-fade-duration": string;
  "--training-target-lifetime": string;
};

type TrainingCarScanStyle = CSSProperties & {
  "--training-object-contour-delay": string;
  "--training-object-scan-angle": string;
  "--training-object-scan-duration": string;
  "--training-object-scan-end-x": string;
  "--training-object-scan-end-y": string;
  "--training-object-scan-start-x": string;
  "--training-object-scan-start-y": string;
  "--training-object-scan-width": string;
};

type TrainingGroundedCarProps = {
  direction: TrainingRadarDirection;
  phase: TrainingRadarPhase;
  target: TrainingCarRadarTarget;
};

type TrainingGroundedBallProps = {
  direction: TrainingRadarDirection;
  phase: TrainingRadarPhase;
  target: TrainingBallRadarTarget;
};

function getGroundedActorStyle(
  target: TrainingCarRadarTarget | TrainingBallRadarTarget,
): GroundedActorStyle {
  const { sourceAnchor, target: destination, shadow } = target.grounding;

  return {
    "--training-actor-scale": destination.scale,
    "--training-actor-source-ground-y": `${sourceAnchor.groundY * 100}%`,
    "--training-actor-source-x": `${sourceAnchor.x * 100}%`,
    "--training-actor-translate-x": `${(destination.x - sourceAnchor.x) * 100}%`,
    "--training-actor-translate-y": `${(destination.groundY - sourceAnchor.groundY) * 100}%`,
    "--training-contact-shadow-height": `${shadow.height * 100}%`,
    "--training-contact-shadow-width": `${shadow.width * 100}%`,
    "--training-target-fade-duration": `${TRAINING_RADAR_TIMING.fadeDurationMs}ms`,
    "--training-target-lifetime": `${TRAINING_RADAR_TIMING.targetLifetimeMs}ms`,
  };
}

export function TrainingGroundedCar({
  direction,
  phase,
  target,
}: TrainingGroundedCarProps) {
  const scan = target.objectScan;
  const movesLeftToRight = direction === "ltr";
  const placementStyle: TrainingCarScanStyle = {
    aspectRatio: target.placement.aspectRatio,
    left: target.placement.left,
    top: target.placement.top,
    transformOrigin: target.placement.transformOrigin,
    width: target.placement.width,
    "--training-object-contour-delay": `${scan.contourDelayMs}ms`,
    "--training-object-scan-angle": movesLeftToRight
      ? scan.angle
      : `${Number.parseFloat(scan.angle) * -1}deg`,
    "--training-object-scan-duration": `${scan.durationMs}ms`,
    "--training-object-scan-end-x": movesLeftToRight ? scan.endX : scan.startX,
    "--training-object-scan-end-y": movesLeftToRight ? scan.endY : scan.startY,
    "--training-object-scan-start-x": movesLeftToRight ? scan.startX : scan.endX,
    "--training-object-scan-start-y": movesLeftToRight ? scan.startY : scan.endY,
    "--training-object-scan-width": `${scan.widthPx}px`,
  };

  return (
    <div
      aria-hidden="true"
      className="training-grounded-actor training-grounded-car"
      data-radar-target={target.id}
      style={getGroundedActorStyle(target)}
    >
      <div className="training-contact-shadow training-car-contact-shadow" />
      <Image
        alt=""
        aria-hidden="true"
        className="training-grounded-actor-base"
        draggable={false}
        fill
        sizes="(max-width: 820px) 100vw, (max-width: 1180px) 66vw, 34vw"
        src={target.baseAsset.path}
        unoptimized
      />
      <div
        className="training-radar-object-target training-radar-car-target"
        data-object-scan="aligned"
        data-radar-active={phase === "hidden" ? "false" : "true"}
        data-radar-direction={direction}
        data-radar-phase={phase}
        style={placementStyle}
      >
        <span className="training-object-local-scan-line" />
        <Image
          alt=""
          aria-hidden="true"
          className="training-radar-object-surface training-radar-car-surface"
          draggable={false}
          fill
          sizes="12vw"
          src={target.surfaceAsset.path}
          unoptimized
        />
        <Image
          alt=""
          aria-hidden="true"
          className="training-radar-object-contour training-radar-car-contour"
          draggable={false}
          fill
          sizes="12vw"
          src={target.contourAsset.path}
          unoptimized
        />
        <Image
          alt=""
          aria-hidden="true"
          className="training-radar-car-wireframe"
          draggable={false}
          fill
          sizes="12vw"
          src={target.wireframeAsset.path}
          unoptimized
        />
        <Image
          alt=""
          aria-hidden="true"
          className="training-radar-car-glow"
          draggable={false}
          fill
          sizes="12vw"
          src={target.glowAsset.path}
          unoptimized
        />
      </div>
    </div>
  );
}

export function TrainingGroundedBall({
  direction,
  phase,
  target,
}: TrainingGroundedBallProps) {
  const sizes = "(max-width: 820px) 100vw, (max-width: 1180px) 66vw, 34vw";

  return (
    <div
      aria-hidden="true"
      className="training-grounded-actor training-grounded-ball"
      data-radar-target={target.id}
      style={getGroundedActorStyle(target)}
    >
      <div className="training-contact-shadow training-ball-contact-shadow" />
      <Image
        alt=""
        aria-hidden="true"
        className="training-grounded-actor-base"
        draggable={false}
        fill
        sizes={sizes}
        src={target.baseAsset.path}
        unoptimized
      />
      <div
        className="training-radar-object-target training-radar-ball-target"
        data-radar-direction={direction}
        data-radar-phase={phase}
      >
        <Image
          alt=""
          aria-hidden="true"
          className="training-radar-ball-energy"
          draggable={false}
          fill
          sizes={sizes}
          src={target.energyAsset.path}
          unoptimized
        />
      </div>
      <Image
        alt=""
        aria-hidden="true"
        className="training-ball-launch-energy"
        draggable={false}
        fill
        sizes={sizes}
        src={target.energyAsset.path}
        unoptimized
      />
    </div>
  );
}
