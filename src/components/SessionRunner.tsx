"use client";

import { useState } from "react";
import { QuestionScreen } from "@/components/QuestionScreen";
import type { Capture, ContentQuestion } from "@/types/content";

type SessionItem = {
  capture: Capture;
  imageExists: boolean;
  question: ContentQuestion;
};

type SessionRunnerProps = {
  items: SessionItem[];
};

export function SessionRunner({ items }: SessionRunnerProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const currentItem = items[questionIndex];

  if (!currentItem) {
    return null;
  }

  return (
    <QuestionScreen
      capture={currentItem.capture}
      hasNextQuestion={questionIndex < items.length - 1}
      imageExists={currentItem.imageExists}
      key={currentItem.question.question_id}
      onNextQuestion={() => setQuestionIndex((current) => Math.min(current + 1, items.length - 1))}
      question={currentItem.question}
      questionIndex={questionIndex}
      totalQuestions={items.length}
    />
  );
}
