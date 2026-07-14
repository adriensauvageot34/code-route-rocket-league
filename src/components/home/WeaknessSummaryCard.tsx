import type { WeaknessSummary } from "@/types/home";

type WeaknessSummaryCardProps = {
  primaryWeakness?: WeaknessSummary;
  secondaryWeaknesses: WeaknessSummary[];
};

export function WeaknessSummaryCard({ primaryWeakness, secondaryWeaknesses }: WeaknessSummaryCardProps) {
  const visibleSecondaryWeaknesses = secondaryWeaknesses.slice(0, 2);

  return (
    <article className="dashboard-card">
      <span className="dashboard-card-eyebrow">Tendances</span>
      <h2>Axes de travail</h2>
      {primaryWeakness ? (
        <div className="weakness-list">
          <WeaknessItem weakness={primaryWeakness} label="Priorite principale" />
          {visibleSecondaryWeaknesses.map((weakness) => (
            <WeaknessItem weakness={weakness} key={weakness.skill} label="Secondaire" />
          ))}
        </div>
      ) : (
        <p className="dashboard-empty">Profil en construction. Les tendances attendent plusieurs occurrences pour etre confirmees.</p>
      )}
    </article>
  );
}

function WeaknessItem({ label, weakness }: { label: string; weakness: WeaknessSummary }) {
  return (
    <div className="weakness-item">
      <span className="dashboard-pill">{label}</span>
      <strong>{weakness.skill}</strong>
      <span>{weakness.status}</span>
      {weakness.cognitiveCause ? <small>{weakness.cognitiveCause}</small> : null}
    </div>
  );
}
