"use client";

import Image from "next/image";
import {
  useEffect,
  useState,
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
  const [usingFallback, setUsingFallback] = useState(false);
  const { crop, legacyPath, sourceDimensions } = asset.scenePlacement;
  const dimensions = usingFallback ? sourceDimensions : asset.dimensions;
  const style: TrainingEnvironmentLayerStyle = usingFallback
    ? {
        "--training-environment-crop-height": "100%",
        "--training-environment-crop-left": "0%",
        "--training-environment-crop-top": "0%",
        "--training-environment-crop-width": "100%",
      }
    : {
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

  useEffect(() => {
    setUsingFallback(false);
  }, [asset.path]);

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
        height={dimensions.height}
        onError={() => {
          if (!usingFallback) {
            setUsingFallback(true);
            return;
          }

          onError?.({ assetId, fallback: true });
        }}
        onLoad={() => {
          onLoad?.({ assetId, fallback: usingFallback });
        }}
        priority={preload}
        sizes="(max-width: 820px) 100vw, (max-width: 1180px) 66vw, 34vw"
        src={usingFallback ? legacyPath : asset.path}
        style={style}
        unoptimized
        width={dimensions.width}
      />
    </div>
  );
}
