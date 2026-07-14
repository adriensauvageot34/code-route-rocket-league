import type { HomePlayerStage, PermitStatus } from "@/types/home";

type HomeHeaderProps = {
  playerStage: HomePlayerStage;
  permitStatus: PermitStatus;
};

export function HomeHeader({ playerStage, permitStatus }: HomeHeaderProps) {
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
        <div className="home-avatar" aria-hidden="true">RL</div>
        <div className="home-profile-stat">
          <strong>{formatStage(playerStage)}</strong>
          <span>profil</span>
        </div>
        <div className="home-profile-stat">
          <strong>{permitStatus.label}</strong>
          <span>permis</span>
        </div>
      </div>
    </header>
  );
}

function formatStage(stage: HomePlayerStage): string {
  if (stage === "needs_placement") return "Placement prepare";
  if (stage === "active") return "Profil actif";
  return "Profil en construction";
}
