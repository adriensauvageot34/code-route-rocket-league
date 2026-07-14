import type { WeaknessSummary } from "@/types/home";

type WeaknessSummaryCardProps = {
  weaknesses: WeaknessSummary[];
};

export function WeaknessSummaryCard({ weaknesses }: WeaknessSummaryCardProps) {
  return (
    <article className="dashboard-card">
      <span className="dashboard-card-eyebrow">Tendances</span>
      <h2>Axes de travail</h2>
      {weaknesses.length ? (
        <div className="weakness-list">
          {weaknesses.slice(0, 3).map((weakness) => (
            <div className="weakness-item" key={weakness.title}>
              <strong>{weakness.title}</strong>
              <span>{weakness.status}</span>
              {weakness.cognitiveCause ? <small>{weakness.cognitiveCause}</small> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="dashboard-empty">Profil en construction. Les tendances attendent plusieurs occurrences pour être confirmées.</p>
      )}
    </article>
  );
}
