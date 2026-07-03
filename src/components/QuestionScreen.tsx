"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnswerOption } from "@/components/AnswerOption";
import type { Capture, ContentQuestion } from "@/types/content";

type QuestionScreenProps = {
  capture: Capture;
  imageExists: boolean;
  question: ContentQuestion;
  questionIndex: number;
  totalQuestions: number;
};

export function QuestionScreen({
  capture,
  imageExists,
  question,
  questionIndex,
  totalQuestions
}: QuestionScreenProps) {
  const [selectedAnswerIds, setSelectedAnswerIds] = useState<string[]>([]);
  const [imageAvailable, setImageAvailable] = useState(imageExists);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedRankByAnswerId = useMemo(() => {
    return new Map(selectedAnswerIds.map((answerId, index) => [answerId, index + 1]));
  }, [selectedAnswerIds]);

  function selectAnswer(answerId: string) {
    if (isSubmitted) {
      setIsSubmitted(false);
    }

    if (question.answer_format === "single") {
      setSelectedAnswerIds((current) => (current[0] === answerId ? [] : [answerId]));
      return;
    }

    if (question.answer_format === "multiple") {
      setSelectedAnswerIds((current) =>
        current.includes(answerId)
          ? current.filter((selectedAnswerId) => selectedAnswerId !== answerId)
          : [...current, answerId]
      );
      return;
    }

    setSelectedAnswerIds((current) =>
      current.includes(answerId)
        ? current.filter((selectedAnswerId) => selectedAnswerId !== answerId)
        : [...current, answerId]
    );
  }

  return (
    <main className="question-page" aria-labelledby="question-title">
      <div className="question-header">
        <div>
          <span className="eyebrow">
            Question {questionIndex + 1} / {totalQuestions}
          </span>
          <h1 id="question-title">{capture.short_label}</h1>
        </div>
        <Link className="secondary-action compact-action" href="/">
          Accueil
        </Link>
      </div>

      <section className="question-layout">
        <div className="capture-card" aria-label="Capture de situation">
          <div className="capture-media">
            {imageAvailable ? (
              <Image
                alt={capture.title ?? capture.short_label}
                className="capture-image"
                fill
                onError={() => setImageAvailable(false)}
                sizes="(max-width: 900px) 100vw, 700px"
                src={capture.image_path}
              />
            ) : (
              <CaptureFallback label={capture.capture_id} />
            )}
          </div>

          {capture.context_to_display ? (
            <p className="capture-context">{capture.context_to_display}</p>
          ) : null}
        </div>

        <div className="question-card">
          <div className="question-copy">
            <span className="eyebrow">Situation</span>
            <h2>{question.question_text}</h2>
          </div>

          <div className="answers-list" aria-label="Reponses possibles">
            {question.answers.map((answer) => (
              <AnswerOption
                answer={answer}
                isSelected={selectedAnswerIds.includes(answer.answer_id)}
                key={answer.answer_id}
                onSelect={selectAnswer}
                rank={selectedRankByAnswerId.get(answer.answer_id)}
              />
            ))}
          </div>

          <div className="question-actions">
            <button
              className="primary-action validate-action"
              disabled={selectedAnswerIds.length === 0}
              onClick={() => setIsSubmitted(true)}
              type="button"
            >
              Valider
            </button>
            {isSubmitted ? <span className="saved-state">Reponse enregistree</span> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function CaptureFallback({ label }: { label: string }) {
  return (
    <div className="capture-fallback">
      <div className="field-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="fallback-copy">
        <strong>{label}</strong>
        <span>Capture a ajouter dans public/captures</span>
      </div>
    </div>
  );
}
