import type { AnswerFormat, ContentQuestion } from "@/types/content";

export type GlobalAnswerState = "correct" | "partial" | "wrong" | "timeout";

export type AnswerVisualState = "neutral" | "selected" | "correct" | "incorrect" | "missed";

export function evaluateSingleAnswer(question: ContentQuestion, selectedAnswerIds: string[]): GlobalAnswerState {
  return selectedAnswerIds[0] === question.correct_answer_ids[0] ? "correct" : "wrong";
}

export function evaluateMultipleAnswer(question: ContentQuestion, selectedAnswerIds: string[]): GlobalAnswerState {
  const correctIds = new Set(question.correct_answer_ids);
  const selectedIds = new Set(selectedAnswerIds);
  const hasSelectedCorrect = selectedAnswerIds.some((answerId) => correctIds.has(answerId));
  const hasSelectedIncorrect = selectedAnswerIds.some((answerId) => !correctIds.has(answerId));
  const hasAllCorrect = question.correct_answer_ids.every((answerId) => selectedIds.has(answerId));

  if (hasAllCorrect && !hasSelectedIncorrect && selectedAnswerIds.length === question.correct_answer_ids.length) {
    return "correct";
  }

  if (hasSelectedCorrect) {
    return "partial";
  }

  return "wrong";
}

export function evaluateRankingAnswer(question: ContentQuestion, selectedAnswerIds: string[]): GlobalAnswerState {
  const correctRanks = selectedAnswerIds.filter(
    (answerId, index) => question.correct_ranking[index] === answerId
  ).length;

  if (correctRanks === question.correct_ranking.length && selectedAnswerIds.length === question.correct_ranking.length) {
    return "correct";
  }

  if (correctRanks > 0) {
    return "partial";
  }

  return "wrong";
}

export function getGlobalAnswerState(question: ContentQuestion, selectedAnswerIds: string[]): GlobalAnswerState {
  const evaluators: Record<AnswerFormat, (question: ContentQuestion, selectedAnswerIds: string[]) => GlobalAnswerState> = {
    multiple: evaluateMultipleAnswer,
    ranking: evaluateRankingAnswer,
    single: evaluateSingleAnswer
  };

  return evaluators[question.answer_format](question, selectedAnswerIds);
}

export function getAnswerVisualState(
  question: ContentQuestion,
  selectedAnswerIds: string[],
  answerId: string,
  isSubmitted: boolean,
  isTimeout = false
): AnswerVisualState {
  const isSelected = selectedAnswerIds.includes(answerId);

  if (!isSubmitted) {
    return isSelected ? "selected" : "neutral";
  }

  if (isTimeout) {
    const correctIds =
      question.answer_format === "ranking" ? question.correct_ranking : question.correct_answer_ids;

    return correctIds.includes(answerId) ? "missed" : "neutral";
  }

  if (question.answer_format === "ranking") {
    const selectedIndex = selectedAnswerIds.indexOf(answerId);

    if (selectedIndex === -1) {
      return "neutral";
    }

    return question.correct_ranking[selectedIndex] === answerId ? "correct" : "incorrect";
  }

  const isCorrectAnswer = question.correct_answer_ids.includes(answerId);

  if (isSelected && isCorrectAnswer) {
    return "correct";
  }

  if (isSelected && !isCorrectAnswer) {
    return "incorrect";
  }

  if (isCorrectAnswer) {
    return "missed";
  }

  return "neutral";
}
