import Link from "next/link";
import { AccessibleTooltip } from "@/components/home/AccessibleTooltip";
import type { HomeAction } from "@/types/home";

type PrimaryHomeActionProps = {
  action: HomeAction;
  isLaunching?: boolean;
  onLaunch?: (action: HomeAction) => void;
};

export function PrimaryHomeAction({
  action,
  isLaunching = false,
  onLaunch,
}: PrimaryHomeActionProps) {
  if (action.href && !action.disabled) {
    return (
      <Link
        aria-disabled={isLaunching}
        aria-label={isLaunching ? "Lancement..." : (action.ariaLabel ?? action.label)}
        className={`home-primary-action${isLaunching ? " is-launching" : ""}`}
        href={action.href}
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

  if (action.feedback) {
    return (
      <AccessibleTooltip
        buttonClassName="home-primary-action is-locked"
        className="mode-lock-tooltip"
        content={action.feedback}
        label={action.ariaLabel ?? action.label}
      >
        <span>{action.label}</span>
      </AccessibleTooltip>
    );
  }

  return (
    <span className="home-primary-action is-locked" aria-disabled="true">
      {action.label}
    </span>
  );
}
