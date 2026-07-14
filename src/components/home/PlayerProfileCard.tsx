import type { HomePlayerStage, PermitStatus } from "@/types/home";

type PlayerProfileCardProps = {
  playerStage: HomePlayerStage;
  permitStatus: PermitStatus;
};

export function PlayerProfileCard({ playerStage, permitStatus }: PlayerProfileCardProps) {
  return (
    <article className="dashboard-card">
      <span className="dashboard-card-eyebrow">Profil</span>
      <h2>{formatStage(playerStage)}</h2>
      <p>{formatStageDescription(playerStage)}</p>
      <span className="dashboard-pill">{permitStatus.label}</span>
    </article>
  );
}

function formatStage(stage: HomePlayerStage): string {
  if (stage === "needs_placement") return "Placement prepare";
  if (stage === "active") return "Profil actif";
  return "Profil en construction";
}

function formatStageDescription(stage: HomePlayerStage): string {
  if (stage === "needs_placement") return "Le futur placement est prevu, mais il reste desactive dans cette version.";
  if (stage === "active") return "Les prochaines donnees pourront alimenter tes priorites sans recalcul dans la home.";
  return "Les tendances attendent plusieurs sessions fiables avant d'etre confirmees.";
}
