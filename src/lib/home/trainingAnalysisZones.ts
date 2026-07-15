export const TRAINING_ANALYSIS_CYCLE_MS = 8000;

export type TrainingAnalysisZone = {
  cx: number;
  cy: number;
  delayMs: number;
  id: "left-car" | "far-right-car" | "near-right-car" | "ball";
  rx: number;
  ry: number;
};

export const trainingAnalysisZones = [
  { id: "left-car", cx: 635, cy: 270, rx: 52, ry: 34, delayMs: 0 },
  { id: "far-right-car", cx: 1199, cy: 252, rx: 43, ry: 28, delayMs: 1400 },
  { id: "near-right-car", cx: 1319, cy: 348, rx: 88, ry: 47, delayMs: 2800 },
  { id: "ball", cx: 846, cy: 432, rx: 106, ry: 108, delayMs: 4200 },
] as const satisfies readonly TrainingAnalysisZone[];
