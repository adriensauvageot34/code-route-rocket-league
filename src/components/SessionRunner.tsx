"use client";

import { useState } from "react";
import { QuestionScreen } from "@/components/QuestionScreen";
import { TrainingSummary } from "@/components/TrainingSummary";
import type { Capture, ContentQuestion, GlossaryTerm } from "@/types/content";
import type { TrainingQuestionResult } from "@/types/session";

type SessionItem = {
  capture: Capture;
  glossaryTerms: GlossaryTerm[];
  imageExists: boolean;
  question: ContentQuestion;
};

type SessionRunnerProps = {
  items: SessionItem[];
};

export function SessionRunner({ items }: SessionRunnerProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sessionRunId, setSessionRunId] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<TrainingQuestionResult[]>([]);
  const currentItem = items[questionIndex];

  if (!currentItem) {
    return null;
  }

  function recordQuestionResult(result: TrainingQuestionResult) {
    setResults((currentResults) => {
      if (currentResults.some((currentResult) => currentResult.question_id === result.question_id)) {
        return currentResults;
      }

      return [...currentResults, result];
    });
  }

  function advanceSession() {
    if (questionIndex < items.length - 1) {
      setQuestionIndex((current) => current + 1);
      return;
    }

    setIsComplete(true);
  }

  function restartSession() {
    setResults([]);
    setQuestionIndex(0);
    setIsComplete(false);
    setSessionRunId((current) => current + 1);
  }

  if (isComplete) {
    return <TrainingSummary onRestart={restartSession} results={results} totalQuestions={items.length} />;
  }

  return (
    <QuestionScreen
      capture={currentItem.capture}
      glossaryTerms={currentItem.glossaryTerms}
      hasNextQuestion={questionIndex < items.length - 1}
      imageExists={currentItem.imageExists}
      key={`${sessionRunId}-${currentItem.question.question_id}`}
      onNextQuestion={advanceSession}
      onQuestionResult={recordQuestionResult}
      question={currentItem.question}
      questionIndex={questionIndex}
      totalQuestions={items.length}
    />
  );
}
