"use client";

import { useState } from "react";
import { PrimaryHomeAction } from "@/components/home/PrimaryHomeAction";
import type { HomeModePreview } from "@/types/home";

type ModePreviewPanelProps = {
  preview: HomeModePreview;
};

export function ModePreviewPanel({ preview }: ModePreviewPanelProps) {
  const [showFeedback, setShowFeedback] = useState(false);

  function handleLockedAction() {
    setShowFeedback(true);
    window.setTimeout(() => setShowFeedback(false), 2200);
  }

  return (
    <section className="mode-preview-panel" aria-live="polite">
      <div className="mode-preview-copy">
        <span className="mode-preview-eyebrow">{preview.mode === "training" ? "Mode actif" : "Apercu verrouille"}</span>
        <h2>{preview.title}</h2>
        <p>{preview.description}</p>
      </div>

      <ul className="mode-preview-list">
        {preview.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
      </ul>

      <div className="mode-preview-action">
        <PrimaryHomeAction action={preview.action} onLockedAction={handleLockedAction} />
        <p className={`mode-lock-feedback${showFeedback ? " is-visible" : ""}`} aria-live="polite">
          {showFeedback ? preview.action.feedback : ""}
        </p>
      </div>
    </section>
  );
}
