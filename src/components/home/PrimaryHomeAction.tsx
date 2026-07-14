import Link from "next/link";
import type { HomeAction } from "@/types/home";

type PrimaryHomeActionProps = {
  action: HomeAction;
  onLockedAction?: () => void;
};

export function PrimaryHomeAction({ action, onLockedAction }: PrimaryHomeActionProps) {
  if (action.href && !action.disabled) {
    return <Link className="home-primary-action" href={action.href}>{action.label}<span aria-hidden="true">&gt;</span></Link>;
  }

  return (
    <button
      className="home-primary-action is-locked"
      type="button"
      aria-disabled="true"
      onClick={onLockedAction}
    >
      {action.label}
    </button>
  );
}
