import Image from "next/image";
import type { CSSProperties } from "react";
import type {
  TrainingTacticalPhase,
  TrainingVolumeScanPhase,
} from "@/components/home/illustrations/TrainingRadarSequence";
import {
  TRAINING_RADAR_TIMING,
  TRAINING_VOLUME_SCAN_TIMING,
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
  "--training-volume-contour-delay": string;
  "--training-volume-fade-duration": string;
  "--training-volume-scan-duration": string;
};

type TrainingCarScanStyle = CSSProperties & {
  "--training-object-scan-angle": string;
  "--training-volume-contour-delay": string;
  "--training-volume-scan-duration": string;
};

type TrainingGroundedCarProps = {
  direction: TrainingRadarDirection;
  target: TrainingCarRadarTarget;
  tacticalPhase: TrainingTacticalPhase;
  volumeScanPhase: TrainingVolumeScanPhase;
};

type TrainingGroundedBallProps = {
  direction: TrainingRadarDirection;
  target: TrainingBallRadarTarget;
  tacticalPhase: TrainingTacticalPhase;
  volumeScanPhase: TrainingVolumeScanPhase;
};

function getGroundedActorStyle(
  target: TrainingCarRadarTarget | TrainingBallRadarTarget,
): GroundedActorStyle {
  const { sourceAnchor, target: destination, shadow } = target.grounding;
  const volumeScanDurationMs =
    target.type === "ball"
      ? TRAINING_VOLUME_SCAN_TIMING.ballActiveDurationMs
      : TRAINING_VOLUME_SCAN_TIMING.activeDurationMs;

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
    "--training-volume-contour-delay": `${TRAINING_VOLUME_SCAN_TIMING.contourDelayMs}ms`,
    "--training-volume-fade-duration": `${TRAINING_VOLUME_SCAN_TIMING.fadeDurationMs}ms`,
    "--training-volume-scan-duration": `${volumeScanDurationMs}ms`,
  };
}

export function TrainingGroundedCar({
  direction,
  target,
  tacticalPhase,
  volumeScanPhase,
}: TrainingGroundedCarProps) {
  const scan = target.objectScan;
  const movesLeftToRight = direction === "ltr";
  const placementStyle: TrainingCarScanStyle = {
    aspectRatio: target.placement.aspectRatio,
    left: target.placement.left,
    top: target.placement.top,
    transformOrigin: target.placement.transformOrigin,
    width: target.placement.width,
    "--training-object-scan-angle": movesLeftToRight
      ? scan.angle
      : `${Number.parseFloat(scan.angle) * -1}deg`,
    "--training-volume-contour-delay": `${scan.contourDelayMs}ms`,
    "--training-volume-scan-duration": `${scan.durationMs}ms`,
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
        data-radar-direction={direction}
        data-tactical-active={tacticalPhase === "hidden" ? "false" : "true"}
        data-tactical-phase={tacticalPhase}
        data-volume-scan-phase={volumeScanPhase}
        style={placementStyle}
      >
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
  target,
  tacticalPhase,
  volumeScanPhase,
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
        data-tactical-phase={tacticalPhase}
        data-volume-scan-phase={volumeScanPhase}
      >
        <Image
          alt=""
          aria-hidden="true"
          className="training-radar-ball-volume-surface"
          draggable={false}
          fill
          sizes={sizes}
          src={target.surfaceAsset.path}
          unoptimized
        />
        <Image
          alt=""
          aria-hidden="true"
          className="training-radar-ball-volume-contour"
          draggable={false}
          fill
          sizes={sizes}
          src={target.contourAsset.path}
          unoptimized
        />
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
