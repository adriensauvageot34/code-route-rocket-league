import {
  getActiveQuestions,
  getQuestionSummaries as getContentQuestionSummaries
} from "@/lib/content";
import type { Question, QuestionSummary } from "@/types/question";

export function getQuestions(): Question[] {
  return getActiveQuestions();
}

export function getQuestionSummaries(): QuestionSummary[] {
  return getContentQuestionSummaries();
}
