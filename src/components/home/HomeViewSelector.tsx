import { useRef, type KeyboardEvent } from "react";
import { ModePreviewPanel } from "@/components/home/ModePreviewPanel";
import type {
  HomeAction,
  HomeModeId,
  HomeModePreview,
  HomeViewAvailability,
  HomeViewId,
} from "@/types/home";

type HomeViewSelectorProps = {
  isLaunching: boolean;
  modePreviews: Record<HomeModeId, HomeModePreview>;
  onLaunch: (action: HomeAction) => void;
  onSelectView: (view: HomeViewId) => void;
  selectedView: HomeViewId;
  views: HomeViewAvailability[];
};

export function HomeViewSelector({
  isLaunching,
  modePreviews,
  onLaunch,
  onSelectView,
  selectedView,
  views,
}: HomeViewSelectorProps) {
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
          ? views.length - 1
          : (index + direction + views.length) % views.length;
    const nextView = views[nextIndex];
    onSelectView(nextView.id);
    choiceRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      aria-label="Choix de la vue"
      aria-orientation="vertical"
      className={`mode-selector${isLaunching ? " is-launching" : ""}`}
      role="radiogroup"
    >
      {views.map((view, index) => {
        const isSelected = view.id === selectedView;

        return (
          <article
            className={`mode-selector-card${isSelected ? " is-selected" : ""}${view.state === "locked" ? " is-locked" : ""}`}
            key={view.id}
          >
            <button
              aria-checked={isSelected}
              aria-expanded={isSelected}
              aria-label={`${view.title}. ${view.description}${view.lockReason ? `. ${view.lockReason}` : ""}`}
              className="mode-selector-choice"
              disabled={isLaunching}
              onClick={() => onSelectView(view.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              ref={(element) => {
                choiceRefs.current[index] = element;
              }}
              role="radio"
              tabIndex={isSelected ? 0 : -1}
              type="button"
            >
              <span className="mode-selector-title">{view.title}</span>
              <span className="mode-selector-description">{view.description}</span>
              {view.lockReason ? <span className="mode-lock-note">{view.lockReason}</span> : null}
            </button>

            {isSelected && view.id !== "statistics" ? (
              <ModePreviewPanel
                isLaunching={isLaunching}
                key={view.id}
                onLaunch={onLaunch}
                preview={modePreviews[view.id]}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
