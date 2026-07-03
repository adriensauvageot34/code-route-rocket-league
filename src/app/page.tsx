import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { ModeCard } from "@/components/ModeCard";
import { getQuestionSummaries } from "@/lib/questions";

const modes = [
  {
    title: "Entrainement",
    description: "Travailler une situation, comprendre la correction, recommencer proprement.",
    status: "Mode libre"
  },
  {
    title: "Code blanc",
    description: "Simuler une serie courte pour tester ses automatismes sans pression de classement.",
    status: "Bientot"
  },
  {
    title: "Vrai Code Rocket League",
    description: "Session stricte avec questions variees et validation finale.",
    status: "Verrouille"
  }
];

export default function Home() {
  const questionSummaries = getQuestionSummaries();

  return (
    <AppFrame>
      <section className="home-grid" aria-labelledby="app-title">
        <div className="training-panel">
          <div className="panel-heading">
            <span className="eyebrow">Session locale V0</span>
            <h1 id="app-title">Code de la route Rocket League</h1>
            <p>
              Interface pensee pour le telephone en paysage : observer vite la
              situation, choisir son role, puis valider la bonne decision.
            </p>
          </div>

          <div className="session-strip" aria-label="Etat de la banque de questions">
            <div>
              <span className="metric-value">{questionSummaries.length}</span>
              <span className="metric-label">question exemple</span>
            </div>
            <div>
              <span className="metric-value">JSON</span>
              <span className="metric-label">source locale</span>
            </div>
            <div>
              <span className="metric-value">V0</span>
              <span className="metric-label">structure prete</span>
            </div>
          </div>

          <div className="mode-grid" aria-label="Modes d'entrainement">
            {modes.map((mode) => (
              <ModeCard key={mode.title} {...mode} />
            ))}
          </div>
        </div>

        <aside className="side-panel" aria-label="Demarrage de session">
          <div className="readiness">
            <span className="readiness-dot" aria-hidden="true" />
            <span>Questions alimentees depuis les donnees locales</span>
          </div>

          <div className="capture-placeholder" aria-label="Apercu de capture future">
            <div className="field-lines" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <p>Emplacement des futures captures de jeu</p>
          </div>

          <div className="next-question">
            <span className="eyebrow">Prochaine etape</span>
            <h2>Format entrainement mobile</h2>
            <p>
              Sur ordinateur, utilise l&apos;apercu mobile du navigateur pour tester le
              rendu telephone paysage.
            </p>
          </div>

          <Link className="primary-action" href="/session">
            Lancer une session
          </Link>
        </aside>
      </section>
    </AppFrame>
  );
}
