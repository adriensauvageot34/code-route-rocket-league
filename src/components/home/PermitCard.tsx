import type { PermitStatus } from "@/types/home";

type PermitCardProps = {
  permitStatus: PermitStatus;
};

export function PermitCard({ permitStatus }: PermitCardProps) {
  return (
    <article className="dashboard-card">
      <span className="dashboard-card-eyebrow">Permis</span>
      <h2>{permitStatus.label}</h2>
      <p>{permitStatus.description}</p>
      <span className="dashboard-pill">{formatPermitState(permitStatus.state)}</span>
    </article>
  );
}

function formatPermitState(state: PermitStatus["state"]): string {
  if (state === "in_progress") return "En progression";
  if (state === "obtained") return "Obtenu";
  if (state === "obtained_with_alerts") return "Obtenu - a renforcer";
  return "Verrouille";
}
