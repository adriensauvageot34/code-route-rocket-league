type HomeHeaderProps = {
  permitLabel: string;
};

export function HomeHeader({ permitLabel }: HomeHeaderProps) {
  return (
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
          <strong>Profil</strong>
          <span>en construction</span>
        </div>
        <div className="home-profile-stat">
          <strong>{permitLabel}</strong>
          <span>statut permis</span>
        </div>
        <span className="home-profile-arrow" aria-hidden="true">&gt;</span>
      </div>
    </header>
  );
}
