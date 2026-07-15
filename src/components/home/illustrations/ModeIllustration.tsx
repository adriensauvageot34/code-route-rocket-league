"use client";

import { forwardRef, useImperativeHandle } from "react";
import { CompetitiveScene } from "@/components/home/illustrations/CompetitiveScene";
import { TrainingScene } from "@/components/home/illustrations/TrainingScene";
import { useParallaxController } from "@/hooks/useParallaxController";
import type { HomeModeId } from "@/types/home";

type ModeIllustrationProps = {
  active?: boolean;
  launching?: boolean;
  mode: HomeModeId;
};

export type ModeIllustrationHandle = {
  resetParallax: (durationMs?: number) => Promise<void>;
};

export const ModeIllustration = forwardRef<ModeIllustrationHandle, ModeIllustrationProps>(
  function ModeIllustration({ active = true, launching = false, mode }, ref) {
    const { containerRef, resetToCenter } = useParallaxController({ active });

    useImperativeHandle(ref, () => ({ resetParallax: resetToCenter }), [resetToCenter]);

    return (
      <div
        aria-hidden="true"
        className={`mode-illustration is-${mode}${launching ? " is-launching" : ""}`}
        data-active={active ? "true" : "false"}
        data-mode={mode}
        data-launching={launching ? "true" : "false"}
        ref={containerRef}
      >
        <div className="scene-canvas">
          {mode === "training" ? <TrainingScene /> : <CompetitiveScene />}
        </div>
      </div>
    );
  }
);
