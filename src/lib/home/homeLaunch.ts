import type { HomeModeId } from "@/types/home";

export const HOME_LAUNCH_DURATION_MS = 2000;

export const HOME_SCENE_SIZE = {
  width: 1672,
  height: 941,
} as const;

export const HOME_LAUNCH_ANCHORS = {
  training: { x: 846, y: 432 },
  competitive: { x: 760, y: 337 },
} as const satisfies Record<HomeModeId, { x: number; y: number }>;

export type HomeLaunchGeometry = {
  anchorX: number;
  anchorY: number;
  frameHeight: number;
  frameLeft: number;
  frameTop: number;
  frameWidth: number;
  originXPercent: number;
  originYPercent: number;
  scale: number;
};

type SceneRect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type ViewportSize = {
  height: number;
  width: number;
};

function safeRatio(needed: number, available: number) {
  return available > 0 ? needed / available : 1;
}

export function projectHomeLaunchGeometry(
  mode: HomeModeId,
  sceneRect: SceneRect,
  viewport: ViewportSize,
): HomeLaunchGeometry {
  const anchor = HOME_LAUNCH_ANCHORS[mode];
  const originXPercent = (anchor.x / HOME_SCENE_SIZE.width) * 100;
  const originYPercent = (anchor.y / HOME_SCENE_SIZE.height) * 100;
  const anchorX = sceneRect.left + sceneRect.width * (originXPercent / 100);
  const anchorY = sceneRect.top + sceneRect.height * (originYPercent / 100);
  const right = sceneRect.left + sceneRect.width;
  const bottom = sceneRect.top + sceneRect.height;
  const scale =
    Math.max(
      1,
      safeRatio(anchorX, anchorX - sceneRect.left),
      safeRatio(viewport.width - anchorX, right - anchorX),
      safeRatio(anchorY, anchorY - sceneRect.top),
      safeRatio(viewport.height - anchorY, bottom - anchorY),
    ) * 1.12;

  return {
    anchorX,
    anchorY,
    frameHeight: sceneRect.height,
    frameLeft: sceneRect.left,
    frameTop: sceneRect.top,
    frameWidth: sceneRect.width,
    originXPercent,
    originYPercent,
    scale,
  };
}
