import Link from "next/link";
import type { HomeSessionSummary, HomeStatisticsSummary, SkillInsight } from "@/types/home";

type HomeStatisticsPanelProps = {
  statistics: HomeStatisticsSummary;
};

export function HomeStatisticsPanel({ statistics }: HomeStatisticsPanelProps) {
  return (
    <section className="home-statistics-panel" aria-labelledby="statistics-panel-title">
      <header className="statistics-panel-heading">
        <span className="statistics-eyebrow">Tableau de bord</span>
        <h2 id="statistics-panel-title">Statistiques</h2>
        <p>Ta progression se construira uniquement a partir de tes sessions reelles.</p>
      </header>

      <section className="statistics-weekly-focus" aria-labelledby="weekly-focus-title">
        <div>
          <span className="statistics-section-label">Cette semaine</span>
          <h3 id="weekly-focus-title">{statistics.weeklyFocus.title}</h3>
        </div>
        <div className="weekly-focus-copy">
          <strong>{statistics.weeklyFocus.statusLabel}</strong>
          {statistics.weeklyFocus.skill ? <span>{statistics.weeklyFocus.skill}</span> : null}
          <p>{statistics.weeklyFocus.description}</p>
        </div>
      </section>

      <div className="statistics-insight-grid">
        <InsightList emptyLabel="Pas encore assez de donnees." insights={statistics.strengths} title="Forces" />
        <InsightList emptyLabel="Pas encore assez de donnees." insights={statistics.weaknesses} title="Faiblesses" />
      </div>

      <div className="statistics-lower-grid">
        <section className="statistics-targeted" aria-labelledby="targeted-sessions-title">
          <span className="statistics-section-label">Travail guide</span>
          <h3 id="targeted-sessions-title">{statistics.targetedSessions.title}</h3>
          <p>{statistics.targetedSessions.description}</p>
          {statistics.targetedSessions.state === "available" && statistics.targetedSessions.href ? (
            <Link className="statistics-inline-link" href={statistics.targetedSessions.href}>
              Ouvrir les sessions ciblees
            </Link>
          ) : (
            <span className="statistics-lock-label">Acces verrouille</span>
          )}
        </section>

        <section className="statistics-sessions" aria-labelledby="recent-sessions-title">
          <div className="statistics-sessions-heading">
            <div>
              <span className="statistics-section-label">Historique</span>
              <h3 id="recent-sessions-title">Mes sessions</h3>
            </div>
            {statistics.recentSessions.length > 1 && statistics.allSessionsHref ? (
              <Link className="statistics-inline-link" href={statistics.allSessionsHref}>
                Voir toutes mes sessions
              </Link>
            ) : null}
          </div>

          {statistics.recentSessions.length ? (
            <ul className="statistics-session-list">
              {statistics.recentSessions.map((session) => (
                <li key={session.id}>{renderSession(session)}</li>
              ))}
            </ul>
          ) : (
            <div className="statistics-empty-state">
              <strong>Aucune session pour le moment.</strong>
              <p>Lance un entrainement pour commencer ton historique.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

type InsightListProps = {
  emptyLabel: string;
  insights: SkillInsight[];
  title: string;
};

function InsightList({ emptyLabel, insights, title }: InsightListProps) {
  return (
    <section className="statistics-insight" aria-label={title}>
      <h3>{title}</h3>
      {insights.length ? (
        <ul>
          {insights.map((insight) => (
            <li key={`${insight.skill}-${insight.status ?? "insight"}`}>
              <strong>{insight.skill}</strong>
              {insight.status ? <span>{insight.status}</span> : null}
              {insight.cognitiveCause ? <small>{insight.cognitiveCause}</small> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="statistics-empty-copy">{emptyLabel}</p>
      )}
    </section>
  );
}

function renderSession(session: HomeSessionSummary) {
  const content = (
    <>
      <strong>{session.title}</strong>
      <span>{[session.dateLabel, session.scoreLabel].filter(Boolean).join(" - ")}</span>
    </>
  );

  return session.href ? (
    <Link className="statistics-session-row" href={session.href}>
      {content}
    </Link>
  ) : (
    <div className="statistics-session-row">{content}</div>
  );
}
