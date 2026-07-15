"use client";

import { PrimaryHomeAction } from "@/components/home/PrimaryHomeAction";
import type { HomeAction, HomeModePreview } from "@/types/home";

type ModePreviewPanelProps = {
  isLaunching: boolean;
  onLaunch: (action: HomeAction) => void;
  preview: HomeModePreview;
};

export function ModePreviewPanel({ isLaunching, onLaunch, preview }: ModePreviewPanelProps) {
  return (
    <div className="mode-preview-panel">
      <div className="mode-preview-copy">
        <span className="mode-preview-eyebrow">
          {preview.mode === "training" ? "Mode actif" : "Apercu du mode"}
        </span>
        <h2>{preview.title}</h2>
        <p>{preview.description}</p>
      </div>

      <ul className="mode-preview-list">
        {preview.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>

      <div className="mode-preview-action">
        <PrimaryHomeAction action={preview.action} isLaunching={isLaunching} onLaunch={onLaunch} />
      </div>
    </div>
  );
}
