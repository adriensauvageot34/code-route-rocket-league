"use client";

import Image from "next/image";
import {
  type CSSProperties,
} from "react";
import type {
  HomeIllustrationAsset,
  HomeIllustrationScenePlacement,
} from "@/lib/home/homeIllustrationAssets";

type TrainingEnvironmentAsset = HomeIllustrationAsset & {
  scenePlacement: HomeIllustrationScenePlacement;
};

export type TrainingEnvironmentAssetLoadResult = {
  assetId: string;
  fallback: boolean;
};

type TrainingEnvironmentLayerProps = {
  asset: TrainingEnvironmentAsset;
  assetId: string;
  className?: string;
  onError?: (result: TrainingEnvironmentAssetLoadResult) => void;
  onLoad?: (result: TrainingEnvironmentAssetLoadResult) => void;
  preload?: boolean;
};

type TrainingEnvironmentLayerStyle = CSSProperties & {
  "--training-environment-crop-height": string;
  "--training-environment-crop-left": string;
  "--training-environment-crop-top": string;
  "--training-environment-crop-width": string;
};

function toPercentage(value: number, total: number) {
  return `${((value / total) * 100).toFixed(6)}%`;
}

export function TrainingEnvironmentLayer({
  asset,
  assetId,
  className,
  onError,
  onLoad,
  preload = false,
}: TrainingEnvironmentLayerProps) {
  const { crop, sourceDimensions } = asset.scenePlacement;
  const style: TrainingEnvironmentLayerStyle = {
    "--training-environment-crop-height": toPercentage(
      crop.height,
      sourceDimensions.height,
    ),
    "--training-environment-crop-left": toPercentage(
      crop.x,
      sourceDimensions.width,
    ),
    "--training-environment-crop-top": toPercentage(
      crop.y,
      sourceDimensions.height,
    ),
    "--training-environment-crop-width": toPercentage(
      crop.width,
      sourceDimensions.width,
    ),
  };

  return (
    <div
      aria-hidden="true"
      className={`training-environment-layer${className ? ` ${className}` : ""}`}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="training-environment-crop"
        draggable={false}
        height={asset.dimensions.height}
        onError={() => onError?.({ assetId, fallback: true })}
        onLoad={() => {
          onLoad?.({ assetId, fallback: false });
        }}
        priority={preload}
        sizes="(max-width: 820px) 100vw, (max-width: 1180px) 66vw, 34vw"
        src={asset.path}
        style={style}
        unoptimized
        width={asset.dimensions.width}
      />
    </div>
  );
}
