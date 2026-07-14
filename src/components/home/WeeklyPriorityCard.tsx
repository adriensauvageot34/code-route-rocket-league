import type { WeeklyPriority } from "@/types/home";

type WeeklyPriorityCardProps = {
  weeklyPriority: WeeklyPriority;
};

export function WeeklyPriorityCard({ weeklyPriority }: WeeklyPriorityCardProps) {
  return (
    <article className="dashboard-card dashboard-card-strong">
      <span className="dashboard-card-eyebrow">Priorite hebdomadaire</span>
      <h2>{weeklyPriority.title}</h2>
      {weeklyPriority.state === "active" ? (
        <div className="priority-details">
          {weeklyPriority.skill ? <span className="dashboard-pill">{weeklyPriority.skill}</span> : null}
          {weeklyPriority.reflexPhrase ? <strong>{weeklyPriority.reflexPhrase}</strong> : null}
          <p>{weeklyPriority.instruction ?? weeklyPriority.description}</p>
          {weeklyPriority.examples?.length ? (
            <ul className="compact-list">
              {weeklyPriority.examples.map((example) => <li key={example}>{example}</li>)}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="dashboard-empty">{formatEmptyState(weeklyPriority.state)}</p>
      )}
    </article>
  );
}

function formatEmptyState(state: WeeklyPriority["state"]): string {
  if (state === "choice_required") return "Choix de priorite requis quand plusieurs axes fiables seront disponibles.";
  if (state === "renewal_due") return "La priorite pourra etre renouvelee apres de nouvelles sessions fiables.";
  return "Donnees en cours de consolidation. Fais une session pour construire une priorite fiable.";
}
