import Link from "next/link";
import type { RecentSession } from "@/types/home";

type RecentSessionCardProps = {
  recentSession: RecentSession;
};

export function RecentSessionCard({ recentSession }: RecentSessionCardProps) {
  return (
    <article className="dashboard-card">
      <span className="dashboard-card-eyebrow">Derniere session</span>
      <h2>{recentSession.title}</h2>
      <p>{recentSession.description}</p>
      {recentSession.state !== "none" ? (
        <dl className="session-facts" aria-label="Details de session">
          {recentSession.scoreLabel ? <Fact label="Score" value={recentSession.scoreLabel} /> : null}
          {recentSession.dateLabel ? <Fact label="Date" value={recentSession.dateLabel} /> : null}
          {recentSession.trendLabel ? <Fact label="Tendance" value={recentSession.trendLabel} /> : null}
        </dl>
      ) : null}
      {recentSession.href ? <Link className="dashboard-inline-action" href={recentSession.href}>Voir le bilan</Link> : null}
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
