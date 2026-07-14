import Link from "next/link";
import type { HomeResource } from "@/types/home";

type ResourceCardProps = {
  resources: HomeResource[];
};

export function ResourceCard({ resources }: ResourceCardProps) {
  return (
    <article className="dashboard-card">
      <span className="dashboard-card-eyebrow">Ressources</span>
      <h2>Apprentissage</h2>
      {resources.length ? (
        <div className="resource-list">
          {resources.map((resource) => (
            <div className="resource-item" key={resource.title}>
              <strong>{resource.title}</strong>
              <small>{resource.description}</small>
              {resource.href ? <Link className="dashboard-inline-action" href={resource.href}>Ouvrir</Link> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="dashboard-empty">Aucune ressource disponible pour le moment.</p>
      )}
    </article>
  );
}
