import Image from "next/image";
import type { CSSProperties } from "react";
import { homeIllustrationAssets } from "@/lib/home/homeIllustrationAssets";
import type { HomeLaunchGeometry } from "@/lib/home/homeLaunch";
import type { HomeModeId } from "@/types/home";

type HomeLaunchOverlayProps = {
  geometry: HomeLaunchGeometry | null;
  mode: HomeModeId | null;
};

type HomeLaunchOverlayStyle = CSSProperties & {
  "--home-launch-anchor-x": string;
  "--home-launch-anchor-y": string;
  "--home-launch-frame-height": string;
  "--home-launch-frame-left": string;
  "--home-launch-frame-top": string;
  "--home-launch-frame-width": string;
  "--home-launch-origin-x": string;
  "--home-launch-origin-y": string;
  "--home-launch-scale": number;
};

export function HomeLaunchOverlay({ geometry, mode }: HomeLaunchOverlayProps) {
  if (!geometry || !mode) return null;

  const asset =
    mode === "training"
      ? homeIllustrationAssets.training.transitionWaveGold
      : homeIllustrationAssets.competitive.cageProjectorsHaze;
  const style: HomeLaunchOverlayStyle = {
    "--home-launch-anchor-x": `${geometry.anchorX}px`,
    "--home-launch-anchor-y": `${geometry.anchorY}px`,
    "--home-launch-frame-height": `${geometry.frameHeight}px`,
    "--home-launch-frame-left": `${geometry.frameLeft}px`,
    "--home-launch-frame-top": `${geometry.frameTop}px`,
    "--home-launch-frame-width": `${geometry.frameWidth}px`,
    "--home-launch-origin-x": `${geometry.originXPercent}%`,
    "--home-launch-origin-y": `${geometry.originYPercent}%`,
    "--home-launch-scale": geometry.scale,
  };

  return (
    <div
      aria-hidden="true"
      className={`home-launch-overlay is-${mode}`}
      data-launch-overlay={mode}
      style={style}
    >
      <div className="home-launch-asset-frame">
        <Image
          alt=""
          className="home-launch-asset"
          draggable={false}
          fill
          sizes="100vw"
          src={asset.path}
          unoptimized
        />
      </div>
      <div className="home-launch-cover" />
    </div>
  );
}
