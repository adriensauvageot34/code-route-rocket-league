import Image from "next/image";
import { Fragment, type CSSProperties } from "react";
import { SceneGroup } from "@/components/home/illustrations/SceneGroup";
import {
  TRAINING_STATIC_FALLBACK_ASSETS,
  type TrainingStaticFallbackAsset,
} from "@/lib/home/trainingStaticFallbackAssets";

type TrainingStaticActorStyle = CSSProperties & {
  "--training-static-height": string;
  "--training-static-left": string;
  "--training-static-top": string;
  "--training-static-width": string;
};

function percentage(value: number, total: number) {
  return `${((value / total) * 100).toFixed(6)}%`;
}

function getActorStyle(
  asset: TrainingStaticFallbackAsset,
): TrainingStaticActorStyle {
  return {
    "--training-static-height": percentage(
      asset.crop.height,
      asset.sourceSize.height,
    ),
    "--training-static-left": percentage(
      asset.crop.x,
      asset.sourceSize.width,
    ),
    "--training-static-top": percentage(
      asset.crop.y,
      asset.sourceSize.height,
    ),
    "--training-static-width": percentage(
      asset.crop.width,
      asset.sourceSize.width,
    ),
  };
}

export function TrainingStaticFallback() {
  return (
    <>
      {TRAINING_STATIC_FALLBACK_ASSETS.map((asset) => (
        <Fragment key={asset.id}>
          <SceneGroup
            depth={asset.depth}
            layer={asset.layer}
            name={`training-static-${asset.id}`}
          >
            <div
              className="training-static-actor"
              data-training-static-actor={asset.id}
              style={getActorStyle(asset)}
            >
              <div className="training-static-contact-shadow" />
              <Image
                alt=""
                aria-hidden="true"
                className="training-static-actor-image"
                draggable={false}
                height={asset.outputSize.height}
                sizes="(max-width: 820px) 18vw, 10vw"
                src={asset.path}
                unoptimized
                width={asset.outputSize.width}
              />
            </div>
          </SceneGroup>
        </Fragment>
      ))}
    </>
  );
}
