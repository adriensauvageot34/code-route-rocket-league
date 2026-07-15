import Link from "next/link";
import type { HomeAction } from "@/types/home";

type PrimaryHomeActionProps = {
  action: HomeAction;
  isLaunching?: boolean;
  onLaunch?: (action: HomeAction) => void;
  onLockedAction?: () => void;
};

export function PrimaryHomeAction({
  action,
  isLaunching = false,
  onLaunch,
  onLockedAction
}: PrimaryHomeActionProps) {
  if (action.href && !action.disabled) {
    return (
      <Link
        className={`home-primary-action${isLaunching ? " is-launching" : ""}`}
        href={action.href}
        aria-disabled={isLaunching}
        aria-label={isLaunching ? "Lancement..." : (action.ariaLabel ?? action.label)}
        onClick={(event) => {
          if (!onLaunch) return;
          event.preventDefault();
          if (!isLaunching) onLaunch(action);
        }}
      >
        <span>{isLaunching ? "Lancement..." : action.label}</span>
        <span aria-hidden="true">&gt;</span>
      </Link>
    );
  }

  return (
    <button
      className="home-primary-action is-locked"
      type="button"
      aria-disabled="true"
      disabled={isLaunching}
      aria-label={action.ariaLabel ?? action.label}
      onClick={isLaunching ? undefined : onLockedAction}
    >
      <span>{action.label}</span>
    </button>
  );
}
