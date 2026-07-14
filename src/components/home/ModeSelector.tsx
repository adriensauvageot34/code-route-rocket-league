import type { KeyboardEvent } from "react";
import type { HomeMode, HomeModeId } from "@/types/home";

type ModeSelectorProps = {
  modes: HomeMode[];
  selectedMode: HomeModeId;
  onSelectMode: (mode: HomeModeId) => void;
};

export function ModeSelector({ modes, onSelectMode, selectedMode }: ModeSelectorProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextMode = modes[(index + direction + modes.length) % modes.length];
    onSelectMode(nextMode.id);
  }

  return (
    <div className="mode-selector" role="radiogroup" aria-label="Choix du mode">
      {modes.map((mode, index) => (
        <button
          className={`mode-selector-card${mode.id === selectedMode ? " is-selected" : ""}`}
          key={mode.id}
          type="button"
          role="radio"
          aria-checked={mode.id === selectedMode}
          tabIndex={mode.id === selectedMode ? 0 : -1}
          onClick={() => onSelectMode(mode.id)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        >
          <span className="mode-selector-title">{mode.title}</span>
          <span className="mode-selector-description">{mode.description}</span>
          {mode.lockReason ? <span className="mode-lock-note">{mode.lockReason}</span> : null}
        </button>
      ))}
    </div>
  );
}
