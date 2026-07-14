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
      {recentSession.href ? <Link className="dashboard-inline-action" href={recentSession.href}>Voir le bilan</Link> : null}
    </article>
  );
}
