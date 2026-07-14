import Link from "next/link";
import type { RecentSession } from "@/types/home";

type HistoryCardProps = {
  history: RecentSession;
};

export function HistoryCard({ history }: HistoryCardProps) {
  return (
    <article className="dashboard-card">
      <span className="dashboard-card-eyebrow">Historique</span>
      <h2>{history.title}</h2>
      <p>{history.description}</p>
      {history.href ? <Link className="dashboard-inline-action" href={history.href}>Ouvrir</Link> : null}
    </article>
  );
}
