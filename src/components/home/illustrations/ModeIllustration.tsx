"use client";

import { forwardRef, useImperativeHandle } from "react";
import { CompetitiveScene } from "@/components/home/illustrations/CompetitiveScene";
import { TrainingScene } from "@/components/home/illustrations/TrainingScene";
import { useParallaxController } from "@/hooks/useParallaxController";
import type { HomeModeId } from "@/types/home";

type ModeIllustrationProps = {
  active?: boolean;
  mode: HomeModeId;
};

export type ModeIllustrationHandle = {
  resetParallax: (durationMs?: number) => Promise<void>;
};

export const ModeIllustration = forwardRef<ModeIllustrationHandle, ModeIllustrationProps>(
  function ModeIllustration({ active = true, mode }, ref) {
    const { containerRef, resetToCenter } = useParallaxController({ active });

    useImperativeHandle(ref, () => ({ resetParallax: resetToCenter }), [resetToCenter]);

    return (
      <div
        aria-hidden="true"
        className={`mode-illustration is-${mode}`}
        data-active={active ? "true" : "false"}
        data-mode={mode}
        ref={containerRef}
      >
        <div className="scene-canvas">
          {mode === "training" ? <TrainingScene /> : <CompetitiveScene />}
        </div>
      </div>
    );
  }
);
