import { OrientationGate } from "@/components/OrientationGate";

type AppFrameProps = {
  children: React.ReactNode;
  variant?: "default" | "game";
};

export function AppFrame({ children, variant = "default" }: AppFrameProps) {
  return (
    <div className={variant === "game" ? "app-frame game-session-frame" : "app-frame"}>
      {variant === "default" ? (
        <header className="top-bar">
          <div className="brand-mark" aria-label="Code de la route Rocket League">
            <span className="brand-icon" aria-hidden="true">
              RL
            </span>
            <div className="brand-text">
              <span className="brand-title">Code de la route Rocket League</span>
              <span className="brand-subtitle">Decision training</span>
            </div>
          </div>
          <span className="top-status">Base locale prete</span>
        </header>
      ) : null}

      <div className="app-content">{children}</div>
      {variant === "game" ? <OrientationGate /> : null}
    </div>
  );
}
