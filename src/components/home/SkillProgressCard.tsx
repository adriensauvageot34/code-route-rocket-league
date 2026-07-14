import type { SkillSummary } from "@/types/home";

type SkillProgressCardProps = {
  skills: SkillSummary[];
};

export function SkillProgressCard({ skills }: SkillProgressCardProps) {
  return (
    <article className="dashboard-card">
      <span className="dashboard-card-eyebrow">Competences</span>
      <h2>Progression</h2>
      {skills.length ? (
        <div className="skill-list">
          {skills.map((skill) => (
            <div className="skill-item" key={skill.skill}>
              <strong>{skill.skill}</strong>
              <span>{formatSkillLabel(skill.label)}</span>
              {skill.note ? <small>{skill.note}</small> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="dashboard-empty">Non evalue. Termine une session pour commencer ton profil.</p>
      )}
    </article>
  );
}

function formatSkillLabel(label: string): string {
  if (label === "Acquis - a renforcer") return "Acquis - a renforcer";
  return label;
}
