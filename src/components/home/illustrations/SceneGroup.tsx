import Image from "next/image";
import type { ReactNode } from "react";
import type { HomeIllustrationAsset, HomeIllustrationBlendMode } from "@/lib/home/homeIllustrationAssets";
import type { HomeSceneDepth } from "@/lib/home/homeSceneParallax";

type SceneGroupProps = {
  blendMode?: HomeIllustrationBlendMode;
  children?: ReactNode;
  depth: HomeSceneDepth;
  future?: boolean;
  layer: number;
  name: string;
};

type SceneLayerProps = {
  asset: HomeIllustrationAsset;
  className?: string;
  preload?: boolean;
};

export function SceneGroup({ blendMode = "normal", children, depth, future = false, layer, name }: SceneGroupProps) {
  return (
    <div
      className={`scene-group${future ? " is-future" : ""}`}
      data-scene-group={name}
      data-scene-slot={future ? name : undefined}
      style={{ mixBlendMode: blendMode, zIndex: layer }}
    >
      <div className="scene-transform scene-parallax" data-depth={depth}>
        <div className="scene-transform scene-idle" data-idle={depth}>
          <div className="scene-transform scene-launch">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function SceneLayer({ asset, className, preload = false }: SceneLayerProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={`scene-layer${className ? ` ${className}` : ""}`}
      draggable={false}
      fill
      priority={preload}
      sizes="(max-width: 820px) 100vw, (max-width: 1180px) 66vw, 34vw"
      src={asset.path}
      unoptimized
    />
  );
}
