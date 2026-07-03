import { existsSync } from "fs";
import { join } from "path";
import { AppFrame } from "@/components/AppFrame";
import { QuestionScreen } from "@/components/QuestionScreen";
import { getActiveQuestions, getCaptureById } from "@/lib/content";

export default function SessionPage() {
  const questions = getActiveQuestions();
  const firstQuestion = questions[0];
  const capture = firstQuestion ? getCaptureById(firstQuestion.capture_id) : undefined;
  const imageExists = capture ? captureImageExists(capture.image_path) : false;

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
    <AppFrame>
      <QuestionScreen
        capture={capture}
        imageExists={imageExists}
        question={firstQuestion}
        questionIndex={0}
        totalQuestions={questions.length}
      />
    </AppFrame>
  );
}

function captureImageExists(imagePath: string): boolean {
  const publicRelativePath = imagePath.replace(/^\/+/, "");

  return existsSync(join(process.cwd(), "public", publicRelativePath));
}
