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
          {weeklyPriority.reflexPhrase ? <strong>{weeklyPriority.reflexPhrase}</strong> : null}
          {weeklyPriority.instruction ? <p>{weeklyPriority.instruction}</p> : null}
        </div>
      ) : (
        <p className="dashboard-empty">Données en cours de consolidation. Fais une session pour construire une priorité fiable.</p>
      )}
    </article>
  );
}
