import type { KeyboardEvent } from "react";
import { ModePreviewPanel } from "@/components/home/ModePreviewPanel";
import type { HomeAction, HomeModeAvailability, HomeModeId, HomeModePreview } from "@/types/home";

type ModeSelectorProps = {
  isLaunching: boolean;
  modes: HomeModeAvailability[];
  onLaunch: (action: HomeAction) => void;
  previews: Record<HomeModeId, HomeModePreview>;
  selectedMode: HomeModeId;
  onSelectMode: (mode: HomeModeId) => void;
};

export function ModeSelector({
  isLaunching,
  modes,
  onLaunch,
  onSelectMode,
  previews,
  selectedMode
}: ModeSelectorProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextMode = modes[(index + direction + modes.length) % modes.length];
    onSelectMode(nextMode.id);
  }

  return (
    <div
      className={`mode-selector${isLaunching ? " is-launching" : ""}`}
      role="radiogroup"
      aria-label="Choix du mode"
    >
      {modes.map((mode, index) => {
        const isSelected = mode.id === selectedMode;

        return (
          <article
            className={`mode-selector-card${isSelected ? " is-selected" : ""}${mode.state === "locked" ? " is-locked" : ""}`}
            key={mode.id}
          >
            <button
              className="mode-selector-choice"
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-expanded={isSelected}
              aria-label={`${mode.title}. ${mode.description}${mode.lockReason ? `. ${mode.lockReason}` : ""}`}
              tabIndex={isSelected ? 0 : -1}
              disabled={isLaunching}
              onClick={() => onSelectMode(mode.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span className="mode-selector-title">{mode.title}</span>
              <span className="mode-selector-description">{mode.description}</span>
              {mode.lockReason ? <span className="mode-lock-note">{mode.lockReason}</span> : null}
            </button>

            {isSelected ? (
              <ModePreviewPanel
                isLaunching={isLaunching}
                key={mode.id}
                onLaunch={onLaunch}
                preview={previews[mode.id]}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
