import content from "@/data/content.example.json";
import type {
  Answer,
  Capture,
  ContentQuestion,
  ContentQuestionSummary,
  ContentValidationIssue,
  TrainingContent
} from "@/types/content";

export function loadTrainingContent(): TrainingContent {
  const trainingContent = content as TrainingContent;
  const issues = validateTrainingContent(trainingContent);

  if (issues.length > 0) {
    const details = issues.map((issue) => `${issue.path}: ${issue.message}`).join("; ");
    throw new Error(`Invalid local training content: ${details}`);
  }

  return trainingContent;
}

export function getCaptures(): Capture[] {
  return loadTrainingContent().captures;
}

export function getActiveQuestions(): ContentQuestion[] {
  return loadTrainingContent().questions.filter(
    (question) => question.is_active && question.validation_status !== "archived"
  );
}

export function getQuestionSummaries(): ContentQuestionSummary[] {
  return getActiveQuestions().map((question) => ({
    id: question.question_id,
    captureId: question.capture_id,
    answerFormat: question.answer_format,
    rlCategory: question.rl_category_primary
  }));
}

export function getCaptureById(captureId: string): Capture | undefined {
  return loadTrainingContent().captures.find((capture) => capture.capture_id === captureId);
}

export function validateTrainingContent(
  trainingContent: TrainingContent
): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const captureIds = new Set<string>();

  for (const capture of trainingContent.captures) {
    if (captureIds.has(capture.capture_id)) {
      issues.push({
        path: `captures.${capture.capture_id}`,
        message: "capture_id must be unique"
      });
    }

    captureIds.add(capture.capture_id);

    if (!capture.image_path.startsWith("/captures/")) {
      issues.push({
        path: `captures.${capture.capture_id}.image_path`,
        message: "image_path should point to /captures/"
      });
    }
  }

  for (const question of trainingContent.questions) {
    if (!captureIds.has(question.capture_id)) {
      issues.push({
        path: `questions.${question.question_id}.capture_id`,
        message: "question references an unknown capture_id"
      });
    }

    if (question.frequency_weight < 0) {
      issues.push({
        path: `questions.${question.question_id}.frequency_weight`,
        message: "frequency_weight must be positive or zero"
      });
    }

    issues.push(...validateAnswers(question));
  }

  return issues;
}

function validateAnswers(question: ContentQuestion): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];

  if (question.answers.length === 0) {
    return [
      {
        path: `questions.${question.question_id}.answers`,
        message: "question must include at least one answer"
      }
    ];
  }

  const correctAnswers = question.answers.filter((answer) => answer.is_correct);

  if (question.answer_format === "single" && correctAnswers.length !== 1) {
    issues.push({
      path: `questions.${question.question_id}.answers`,
      message: "single questions must have exactly one correct answer"
    });
  }

  if (question.answer_format === "multiple" && correctAnswers.length < 1) {
    issues.push({
      path: `questions.${question.question_id}.answers`,
      message: "multiple questions must have at least one correct answer"
    });
  }

  if (question.answer_format === "ranking") {
    issues.push(...validateRankingAnswers(question.question_id, question.answers));
  }

  return issues;
}

function validateRankingAnswers(
  questionId: string,
  answers: Answer[]
): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const positions = new Set<number>();

  for (const answer of answers) {
    if (typeof answer.ranking_position !== "number") {
      issues.push({
        path: `questions.${questionId}.answers.${answer.answer_id}.ranking_position`,
        message: "ranking answers must include a ranking_position"
      });
      continue;
    }

    if (positions.has(answer.ranking_position)) {
      issues.push({
        path: `questions.${questionId}.answers.${answer.answer_id}.ranking_position`,
        message: "ranking_position must be unique within the question"
      });
    }

    positions.add(answer.ranking_position);
  }

  return issues;
}
