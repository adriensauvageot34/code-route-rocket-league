import type { PermitStatus } from "@/types/home";

type PermitCardProps = {
  permit: PermitStatus;
};

export function PermitCard({ permit }: PermitCardProps) {
  return (
    <article className="dashboard-card">
      <span className="dashboard-card-eyebrow">Permis</span>
      <h2>{permit.label}</h2>
      <p>{permit.description}</p>
      <p className="permit-state">{formatPermitState(permit.state)}</p>
    </article>
  );
}

function formatPermitState(state: PermitStatus["state"]): string {
  if (state === "in_progress") return "En progression";
  if (state === "obtained") return "Obtenu";
  if (state === "obtained_with_alerts") return "Obtenu - a renforcer";
  return "Verrouille";
}
