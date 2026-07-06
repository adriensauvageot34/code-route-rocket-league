import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";
import { ModeCard } from "@/components/ModeCard";
import { getQuestionSummaries } from "@/lib/questions";

const modeCards = [
  {
    title: "ENTRAINEMENT",
    description: "Progresse a ton rythme.",
    features: [
      "Situations realistes et variees",
      "Corrections immediates",
      "Ideal pour corriger tes reflexes"
    ],
    href: "/session",
    imagePath: "/captures/CAP-0001.webp",
    actionLabel: "Lancer une session",
    variant: "training" as const
  },
  {
    title: "COMPETITIF",
    description: "Affronte-toi. Gagne. Grimpe.",
    features: [
      "Matchs scenarises sous pression",
      "Classement mondial",
      "Pour les joueurs qui veulent exceller"
    ],
    imagePath: "/captures/CAP-0002.webp",
    actionLabel: "Bientot",
    variant: "competitive" as const,
    disabled: true
  }
];

const recurringErrors = [
  { title: "Mauvais positionnement", detail: "Frequence elevee", value: "47%" },
  { title: "Decisions en defense", detail: "A travailler", value: "35%" },
  { title: "Gestion du boost", detail: "A ameliorer", value: "28%" }
];

const targetedTraining = [
  { title: "Positionnement", detail: "12 situations", value: "66%" },
  { title: "Sorties de mur", detail: "10 situations", value: "72%" },
  { title: "Jeu aerien", detail: "14 situations", value: "58%" }
];

const resources = [
  { kind: "Video", title: "Comprendre la rotation", detail: "Les bases d'une rotation efficace" },
  { kind: "PDF", title: "Les 10 erreurs qui te freinent", detail: "Identifier les reflexes a corriger" },
  { kind: "Video", title: "Lire le jeu comme un pro", detail: "Developpe ta vision et anticipe" }
];

export default function Home() {
  const questionSummaries = getQuestionSummaries();
  const questionCount = questionSummaries.length;

  return (
    <AppFrame variant="home">
      <main className="home-dashboard" aria-labelledby="home-title">
        <header className="home-top">
          <div className="home-brand">
            <div className="home-crest" aria-hidden="true">
              <span>RL</span>
            </div>
            <div>
              <p className="home-brand-title">Code de la route Rocket League</p>
              <p className="home-brand-subtitle">Decision training</p>
            </div>
          </div>

          <div className="home-profile" aria-label="Profil joueur">
            <div className="home-avatar" aria-hidden="true">RL</div>
            <div className="home-profile-stat">
              <strong>1 245</strong>
              <span>points</span>
            </div>
            <div className="home-profile-stat">
              <strong>Top 6%</strong>
              <span>classement mondial</span>
            </div>
            <span className="home-profile-arrow" aria-hidden="true">&gt;</span>
          </div>
        </header>

        <section className="home-hero" aria-label="Accueil entrainement">
          <div className="home-copy">
            <h1 id="home-title">
              Lis le jeu. Decide plus vite.
              <span>Corrige tes mauvaises habitudes.</span>
            </h1>
            <p>
              Entraine ton intelligence de jeu avec des situations realistes, des
              corrections immediates et des exercices cibles. Progresse. Gagne.
              Passe au niveau superieur.
            </p>
            <Link className="home-launch" href="/session">
              <span className="home-launch-mark" aria-hidden="true">GO</span>
              <span>Lancer une session</span>
            </Link>
          </div>

          <div className="home-modes" aria-label="Modes disponibles">
            {modeCards.map((mode) => (
              <ModeCard key={mode.title} {...mode} />
            ))}
          </div>

          <div className="home-showcase" aria-hidden="true">
            <div className="home-showcase-ball" />
            <div className="home-showcase-car" />
            <div className="home-showcase-speed speed-one" />
            <div className="home-showcase-speed speed-two" />
          </div>
        </section>

        <section className="home-panels" aria-label="Tableau de bord">
          <article className="home-panel progress-panel">
            <div className="home-panel-title">
              <span className="panel-icon">T</span>
              <h2>Historique d&apos;entrainement</h2>
            </div>
            <div className="progress-content">
              <div className="progress-ring" aria-label="Taux de reussite moyen 68%">
                <span>68%</span>
              </div>
              <div>
                <strong>Taux de reussite moyen</strong>
                <p>+12% cette semaine</p>
              </div>
            </div>
            <div className="stat-row">
              <span><strong>218</strong> sessions</span>
              <span><strong>45h 30m</strong> temps total</span>
              <span><strong>78%</strong> reussite moyenne</span>
            </div>
            <button className="ghost-action" type="button">Voir mon historique &gt;</button>
          </article>

          <article className="home-panel">
            <div className="home-panel-title">
              <span className="panel-icon">!</span>
              <h2>Mes erreurs recurrentes</h2>
            </div>
            <div className="panel-list">
              {recurringErrors.map((item) => (
                <div className="panel-list-item" key={item.title}>
                  <span className="panel-thumb" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <b>{item.value}</b>
                </div>
              ))}
            </div>
            <button className="ghost-action" type="button">Voir toutes mes erreurs &gt;</button>
          </article>

          <article className="home-panel">
            <div className="home-panel-title">
              <span className="panel-icon">C</span>
              <h2>Entrainement cible</h2>
            </div>
            <div className="panel-list">
              {targetedTraining.map((item) => (
                <div className="panel-list-item training-item" key={item.title}>
                  <span className="panel-thumb" />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <b>{item.value}</b>
                </div>
              ))}
            </div>
            <button className="ghost-action" type="button">Voir tous les exercices &gt;</button>
          </article>

          <article className="home-panel">
            <div className="home-panel-title">
              <span className="panel-icon">R</span>
              <h2>Ressources & apprentissage</h2>
            </div>
            <div className="resource-list">
              {resources.map((item) => (
                <div className="resource-item" key={item.title}>
                  <span className="resource-kind">{item.kind}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                </div>
              ))}
            </div>
            <button className="ghost-action" type="button">Voir toutes les ressources &gt;</button>
          </article>
        </section>

        <section className="home-season" aria-label="Objectifs de progression">
          <div>
            <span className="season-icon">S</span>
            <strong>Serie en cours</strong>
            <b>7 jours</b>
            <small>Continue comme ca !</small>
          </div>
          <div>
            <span className="season-icon">O</span>
            <strong>Objectif hebdo</strong>
            <b>8 / 10</b>
            <small>Sessions completees</small>
          </div>
          <div>
            <span className="season-icon">XP</span>
            <strong>XP gagnee</strong>
            <b>+340</b>
            <small>Cette semaine</small>
          </div>
          <div>
            <span className="season-icon">Q</span>
            <strong>Questions locales</strong>
            <b>{questionCount}</b>
            <small>Disponibles dans le JSON</small>
          </div>
        </section>
      </main>
    </AppFrame>
  );
}
