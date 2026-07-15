import Image from "next/image";
import type { ReactNode } from "react";
import type { HomeIllustrationAsset } from "@/lib/home/homeIllustrationAssets";
import type { HomeSceneDepth } from "@/lib/home/homeSceneParallax";

type SceneGroupProps = {
  children?: ReactNode;
  depth: HomeSceneDepth;
  future?: boolean;
  layer: number;
  name: string;
};

type SceneLayerProps = {
  asset: HomeIllustrationAsset;
  preload?: boolean;
};

export function SceneGroup({ children, depth, future = false, layer, name }: SceneGroupProps) {
  return (
    <div
      className={`scene-group${future ? " is-future" : ""}`}
      data-scene-group={name}
      data-scene-slot={future ? name : undefined}
      style={{ zIndex: layer }}
    >
      <div className="scene-transform scene-parallax" data-depth={depth}>
        <div className="scene-transform scene-idle">
          <div className="scene-transform scene-launch">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function SceneLayer({ asset, preload = false }: SceneLayerProps) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className="scene-layer"
      draggable={false}
      fill
      priority={preload}
      sizes="(max-width: 760px) 100vw, (max-width: 1180px) 66vw, 34vw"
      src={asset.path}
      style={{ mixBlendMode: asset.blendMode }}
      unoptimized
    />
  );
}
