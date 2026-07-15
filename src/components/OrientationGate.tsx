"use client";

import { useState } from "react";

type FullscreenTarget = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type OrientationController = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

export function OrientationGate() {
  const [hint, setHint] = useState("Si l'ecran ne tourne pas, desactive le verrouillage de rotation.");

  async function requestLandscapeMode() {
    setHint("Demande du mode paysage...");

    const target = document.documentElement as FullscreenTarget;
    const requestFullscreen =
      target.requestFullscreen?.bind(target) ?? target.webkitRequestFullscreen?.bind(target);

    try {
      if (!document.fullscreenElement && requestFullscreen) {
        await Promise.resolve(requestFullscreen());
      }
    } catch {
      // Some mobile webviews block fullscreen. The portrait gate still guides the player.
    }

    try {
      const orientation = screen.orientation as OrientationController | undefined;

      if (orientation?.lock) {
        await orientation.lock("landscape");
        setHint("Mode paysage demande. Tourne le telephone si besoin.");
        return;
      }
    } catch {
      // Orientation locking is not available in every browser or embedded app.
    }

    setHint("Si l'ecran ne tourne pas, desactive le verrouillage de rotation.");
  }

  return (
    <aside className="orientation-gate" aria-label="Mode paysage requis">
      <div className="orientation-card">
        <div className="orientation-phone" aria-hidden="true">
          <span />
        </div>
        <div className="orientation-copy">
          <span className="eyebrow">Mode paysage requis</span>
          <h2>Tourne ton telephone pour lancer l&apos;entrainement.</h2>
          <p>
            Si l&apos;ecran ne tourne pas, desactive le verrouillage de rotation.
          </p>
        </div>
        <button className="primary-action orientation-action" onClick={requestLandscapeMode} type="button">
          Passer en paysage
        </button>
        <p className="orientation-hint">{hint}</p>
      </div>
    </aside>
  );
}
