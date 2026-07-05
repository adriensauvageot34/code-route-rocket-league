import { existsSync } from "fs";
import { join } from "path";
import { AppFrame } from "@/components/AppFrame";
import { SessionRunner } from "@/components/SessionRunner";
import { getActiveQuestions, getCaptureById, getGlossaryTermsForQuestion } from "@/lib/content";

export default function SessionPage() {
  const questions = getActiveQuestions();
  const firstQuestion = questions[0];
  const capture = firstQuestion ? getCaptureById(firstQuestion.capture_id) : undefined;
  const sessionItems = questions.flatMap((question) => {
    const questionCapture = getCaptureById(question.capture_id);

    if (!questionCapture) {
      return [];
    }

    return [
      {
        capture: questionCapture,
        glossaryTerms: getGlossaryTermsForQuestion(question),
        imageExists: captureImageExists(questionCapture.image_path),
        question
      }
    ];
  });

  if (!firstQuestion || !capture) {
    return (
      <AppFrame>
        <main className="placeholder-page" aria-labelledby="session-title">
          <span className="eyebrow">Session</span>
          <h1 id="session-title">Aucune question active</h1>
          <p>
            Ajoute au moins une capture et une question active dans les donnees locales
            pour lancer une session.
          </p>
        </main>
      </AppFrame>
    );
  }

  return (
    <AppFrame variant="game">
      <SessionRunner items={sessionItems} />
    </AppFrame>
  );
}

function captureImageExists(imagePath: string): boolean {
  const publicRelativePath = imagePath.replace(/^\/+/, "");

  return existsSync(join(process.cwd(), "public", publicRelativePath));
}
