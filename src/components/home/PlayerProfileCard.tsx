import type { HomePlayerStage, PermitStatus } from "@/types/home";

type PlayerProfileCardProps = {
  playerStage: HomePlayerStage;
  permit: PermitStatus;
};

export function PlayerProfileCard({ playerStage, permit }: PlayerProfileCardProps) {
  return (
    <article className="dashboard-card">
      <span className="dashboard-card-eyebrow">Profil</span>
      <h2>{formatStage(playerStage)}</h2>
      <p>{permit.description}</p>
      <p className="permit-state">{permit.label}</p>
    </article>
  );
}

function formatStage(stage: HomePlayerStage): string {
  if (stage === "needs_placement") return "Placement a preparer";
  if (stage === "active") return "Profil actif";
  return "Profil en construction";
}
