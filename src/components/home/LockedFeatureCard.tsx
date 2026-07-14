export function LockedFeatureCard() {
  return (
    <article className="dashboard-card dashboard-card-muted" aria-label="Fonctionnalites futures">
      <span className="dashboard-card-eyebrow">Bientot</span>
      <h2>Sessions ciblees</h2>
      <p>Cette option arrivera quand le profil disposera de suffisamment de donnees fiables.</p>
      <span className="locked-pill" aria-label="Fonction verrouillee">Verrouille</span>
    </article>
  );
}
