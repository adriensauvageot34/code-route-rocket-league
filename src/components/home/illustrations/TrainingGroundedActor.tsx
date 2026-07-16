import Image from "next/image";
import type { CSSProperties } from "react";
import type { TrainingRadarPhase } from "@/components/home/illustrations/TrainingRadarSequence";
import {
  TRAINING_RADAR_TIMING,
  type TrainingBallRadarTarget,
  type TrainingCarRadarTarget,
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
  "--training-target-glow-duration": string;
  "--training-target-rise-duration": string;
};

type TrainingGroundedCarProps = {
  phase: TrainingRadarPhase;
  target: TrainingCarRadarTarget;
};

type TrainingGroundedBallProps = {
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
    "--training-target-rise-duration": `${TRAINING_RADAR_TIMING.targetRiseDurationMs}ms`,
    "--training-target-glow-duration": `${TRAINING_RADAR_TIMING.glowDurationMs}ms`,
    "--training-target-fade-duration": `${TRAINING_RADAR_TIMING.fadeDurationMs}ms`,
  };
}

export function TrainingGroundedCar({
  phase,
  target,
}: TrainingGroundedCarProps) {
  const placementStyle: CSSProperties = {
    aspectRatio: target.placement.aspectRatio,
    left: target.placement.left,
    top: target.placement.top,
    transformOrigin: target.placement.transformOrigin,
    width: target.placement.width,
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
        className="training-radar-car-target"
        data-radar-phase={phase}
        style={placementStyle}
      >
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
      <Image
        alt=""
        aria-hidden="true"
        className="training-radar-ball-energy"
        data-radar-phase={phase}
        draggable={false}
        fill
        sizes={sizes}
        src={target.energyAsset.path}
        unoptimized
      />
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
