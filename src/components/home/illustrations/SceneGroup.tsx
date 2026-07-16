import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { HomeIllustrationAsset, HomeIllustrationBlendMode } from "@/lib/home/homeIllustrationAssets";
import { homeSceneDepths, type HomeSceneDepth } from "@/lib/home/homeSceneParallax";

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

type SceneGroupStyle = CSSProperties & {
  "--scene-parallax-rotation": string;
  "--scene-parallax-scale-x": string;
  "--scene-parallax-scale-y": number;
  "--scene-parallax-x": string;
  "--scene-parallax-y": string;
};

export function SceneGroup({ blendMode = "normal", children, depth, future = false, layer, name }: SceneGroupProps) {
  const depthConfiguration = homeSceneDepths[depth];
  const style: SceneGroupStyle = {
    mixBlendMode: blendMode,
    zIndex: layer,
    "--scene-parallax-x": `var(--parallax-${depth}-x, 0px)`,
    "--scene-parallax-y": `var(--parallax-${depth}-y, 0px)`,
    "--scene-parallax-rotation": `var(--parallax-${depth}-rotation, 0deg)`,
    "--scene-parallax-scale-x": `var(--parallax-${depth}-scale-x, ${depthConfiguration.scale})`,
    "--scene-parallax-scale-y":
      "scaleY" in depthConfiguration ? depthConfiguration.scaleY : depthConfiguration.scale,
  };

  return (
    <div
      className={`scene-group${future ? " is-future" : ""}`}
      data-scene-group={name}
      data-scene-slot={future ? name : undefined}
      style={style}
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
