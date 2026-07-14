import type { KeyboardEvent } from "react";
import type { HomeModeAvailability, HomeModeId } from "@/types/home";

type ModeSelectorProps = {
  modes: HomeModeAvailability[];
  selectedMode: HomeModeId;
  onSelectMode: (mode: HomeModeId) => void;
};

export function ModeSelector({ modes, onSelectMode, selectedMode }: ModeSelectorProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextMode = modes[(index + direction + modes.length) % modes.length];
    onSelectMode(nextMode.id);
  }

  return (
    <div className="mode-selector" role="radiogroup" aria-label="Choix du mode">
      {modes.map((mode, index) => {
        const isSelected = mode.id === selectedMode;

        return (
          <button
            className={`mode-selector-card${isSelected ? " is-selected" : ""}${mode.state === "locked" ? " is-locked" : ""}`}
            key={mode.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${mode.title}. ${mode.description}${mode.lockReason ? `. ${mode.lockReason}` : ""}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelectMode(mode.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            <span className="mode-selector-title">{mode.title}</span>
            <span className="mode-selector-description">{mode.description}</span>
            {mode.lockReason ? <span className="mode-lock-note">{mode.lockReason}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
