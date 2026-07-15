import { AccessibleTooltip } from "@/components/home/AccessibleTooltip";
import type { HomePlayerStage } from "@/types/home";

type HomeHeaderProps = {
  permitProgress: number;
  playerStage: HomePlayerStage;
};

export function HomeHeader({ permitProgress, playerStage }: HomeHeaderProps) {
  return (
    <header className="home-top">
      <div className="home-brand">
        <div className="home-crest" aria-hidden="true">
          <span>RL</span>
        </div>
        <div>
          <p className="home-brand-title">Code de la route Rocket League</p>
          <p className="home-brand-subtitle">Cockpit d'entrainement</p>
        </div>
      </div>

      <div className="home-profile" aria-label="Profil joueur">
        <div className="home-avatar" aria-hidden="true">
          RL
        </div>
        <div className="home-profile-stat">
          <strong>{formatStage(playerStage)}</strong>
          <span>profil</span>
        </div>
        <AccessibleTooltip
          buttonClassName="home-permit-trigger"
          className="home-permit-tooltip"
          content={"Lance une session d'entrainement pour commencer \u00e0 valider tes bases."}
          label={`Permis, ${permitProgress} %`}
        >
          <span className="home-permit-heading">
            <strong>Permis</strong>
            <span>{permitProgress} %</span>
          </span>
          <span
            aria-label={`Progression du permis : ${permitProgress} %`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={permitProgress}
            className="home-permit-progress"
            role="progressbar"
          >
            <span style={{ width: `${permitProgress}%` }} />
          </span>
        </AccessibleTooltip>
      </div>
    </header>
  );
}

function formatStage(stage: HomePlayerStage): string {
  if (stage === "needs_placement") return "Placement prepare";
  if (stage === "active") return "Profil actif";
  return "Profil en construction";
}
