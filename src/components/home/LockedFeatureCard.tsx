import type { LockedHomeFeature } from "@/types/home";

type LockedFeatureCardProps = {
  feature: LockedHomeFeature;
};

export function LockedFeatureCard({ feature }: LockedFeatureCardProps) {
  return (
    <article className="dashboard-card dashboard-card-muted" aria-label={`${feature.title} verrouille`}>
      <span className="dashboard-card-eyebrow">Bientot</span>
      <h2>{feature.title}</h2>
      <p>{feature.description}</p>
      <span className="dashboard-pill" aria-label="Fonction verrouillee">Verrouille</span>
    </article>
  );
}
