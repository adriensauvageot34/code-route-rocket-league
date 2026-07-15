import { useRef, type KeyboardEvent } from "react";
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
  const choiceRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const handledKeys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!handledKeys.includes(event.key)) return;

    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? modes.length - 1
          : (index + direction + modes.length) % modes.length;
    const nextMode = modes[nextIndex];
    onSelectMode(nextMode.id);
    choiceRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      className={`mode-selector${isLaunching ? " is-launching" : ""}`}
      role="radiogroup"
      aria-label="Choix du mode"
      aria-orientation="vertical"
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
              ref={(element) => {
                choiceRefs.current[index] = element;
              }}
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
