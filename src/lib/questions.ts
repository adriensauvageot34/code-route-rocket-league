import questions from "@/data/questions.example.json";
import type { Question, QuestionSummary } from "@/types/question";

export function getQuestions(): Question[] {
  return questions as Question[];
}

export function getQuestionSummaries(): QuestionSummary[] {
  return getQuestions().map((question) => ({
    id: question.id,
    captureId: question.capture_id,
    answerFormat: question.answer_format,
    rlCategory: question.rl_category
  }));
}
