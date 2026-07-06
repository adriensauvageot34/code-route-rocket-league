import type { CSSProperties } from "react";
import Link from "next/link";

type ModeCardProps = {
  title: string;
  description: string;
  features?: string[];
  href?: string;
  imagePath?: string;
  actionLabel?: string;
  variant?: "training" | "competitive";
  disabled?: boolean;
};

export function ModeCard({
  title,
  description,
  features = [],
  href,
  imagePath,
  actionLabel = "Lancer une session",
  variant = "training",
  disabled = false
}: ModeCardProps) {
  const style = imagePath
    ? ({ "--mode-image": `url("${imagePath}")` } as CSSProperties)
    : undefined;

  return (
    <article
      className={`home-mode-card home-mode-card--${variant}${disabled ? " is-disabled" : ""}`}
      style={style}
    >
      <div className="mode-card-shine" aria-hidden="true" />
      <div className="mode-card-content">
        <span className="mode-card-symbol" aria-hidden="true">
          {variant === "training" ? "+" : "K"}
        </span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {features.length > 0 ? (
        <ul className="mode-feature-list">
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      ) : null}

      {href && !disabled ? (
        <Link className="mode-card-action" href={href}>
          <span>{actionLabel}</span>
          <span aria-hidden="true">&gt;</span>
        </Link>
      ) : (
        <span className="mode-card-action mode-card-action-disabled">
          <span>{actionLabel}</span>
          <span aria-hidden="true">&gt;</span>
        </span>
      )}
    </article>
  );
}
