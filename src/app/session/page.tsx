import Link from "next/link";
import { AppFrame } from "@/components/AppFrame";

export default function SessionPlaceholderPage() {
  return (
    <AppFrame>
      <main className="placeholder-page" aria-labelledby="session-title">
        <span className="eyebrow">Session</span>
        <h1 id="session-title">Ecran de session pret a brancher</h1>
        <p>
          Le moteur de quiz, le score et les statistiques ne sont pas encore codes.
          Cette page sert de point de depart pour la prochaine etape.
        </p>
        <Link className="secondary-action" href="/">
          Retour aux modes
        </Link>
      </main>
    </AppFrame>
  );
}
