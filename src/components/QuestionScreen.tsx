"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
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
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(15);

  const selectedRankByAnswerId = useMemo(() => {
    return new Map(selectedAnswerIds.map((answerId, index) => [answerId, index + 1]));
  }, [selectedAnswerIds]);
  const displayedTotalQuestions = Math.max(totalQuestions, 40);

  useEffect(() => {
    if (isPaused || isSubmitted || remainingSeconds <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isPaused, isSubmitted, remainingSeconds]);

  function expandImage(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();

    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setIsImageExpanded(true);
  }

  function collapseImage(event?: PointerEvent<HTMLDivElement>) {
    if (event?.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsImageExpanded(false);
  }

  function handleImageKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      setIsImageExpanded(true);
    }
  }

  function handleImageKeyUp(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === " " || event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      setIsImageExpanded(false);
    }
  }

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
    <main className="question-page session-game" aria-labelledby="question-title">
      <h1 className="sr-only" id="question-title">
        {capture.short_label}
      </h1>

      <section className="question-layout">
        <div className="capture-card" aria-label="Capture de situation">
          <div
            aria-label="Maintenir la capture en plein ecran"
            className="capture-media hold-expand-target"
            onContextMenu={(event) => event.preventDefault()}
            onKeyDown={handleImageKeyDown}
            onKeyUp={handleImageKeyUp}
            onLostPointerCapture={() => setIsImageExpanded(false)}
            onPointerCancel={collapseImage}
            onPointerDown={expandImage}
            onPointerUp={collapseImage}
            role="button"
            tabIndex={0}
          >
            <div className="game-hud" aria-label="Informations de session">
              <span className="progress-chip">
                {questionIndex + 1}/{displayedTotalQuestions}
              </span>
              <span className="timer-chip" aria-label="Temps restant">
                {remainingSeconds}s
              </span>
              <button
                className="pause-button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsPaused(true);
                }}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                type="button"
              >
                Pause
              </button>
            </div>

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

            {capture.context_to_display ? (
              <p className="context-overlay">{capture.context_to_display}</p>
            ) : null}

            <span className="image-hold-hint">Maintenir</span>
          </div>
        </div>

        <div className="question-card">
          <div className="question-copy">
            <h2>{question.question_text}</h2>
          </div>

          <div className="answers-list" aria-label="Reponses possibles">
            {question.answers.map((answer) => (
              <AnswerOption
                answer={answer}
                isSelected={selectedAnswerIds.includes(answer.answer_id)}
                key={answer.answer_id}
                onSelect={selectAnswer}
                rank={
                  question.answer_format === "ranking"
                    ? selectedRankByAnswerId.get(answer.answer_id)
                    : undefined
                }
              />
            ))}
          </div>

          <div className="question-actions">
            <button
              className={
                isSubmitted
                  ? "primary-action validate-action submitted"
                  : "primary-action validate-action"
              }
              disabled={selectedAnswerIds.length === 0}
              onClick={() => setIsSubmitted(true)}
              type="button"
            >
              <span className="validate-label">Valider</span>
              <span className="validate-check" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {isPaused ? (
        <div className="pause-overlay" role="dialog" aria-modal="true" aria-label="Session en pause">
          <div className="pause-card">
            <span className="eyebrow">Pause</span>
            <h2>Session en pause</h2>
            <p>Le chrono est arrete. Reprends quand tu es pret.</p>
            <div className="pause-actions">
              <button className="primary-action" onClick={() => setIsPaused(false)} type="button">
                Reprendre
              </button>
              <Link className="secondary-action" href="/">
                Menu principal
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {isImageExpanded ? (
        <div
          aria-label="Capture en plein ecran"
          aria-modal="true"
          className="capture-lightbox"
          onContextMenu={(event) => event.preventDefault()}
          onPointerCancel={() => setIsImageExpanded(false)}
          onPointerUp={() => setIsImageExpanded(false)}
          role="dialog"
        >
          <div className="lightbox-media">
            {imageAvailable ? (
              <Image
                alt={capture.title ?? capture.short_label}
                className="capture-image"
                fill
                onError={() => setImageAvailable(false)}
                sizes="100vw"
                src={capture.image_path}
              />
            ) : (
              <CaptureFallback label={capture.capture_id} />
            )}
          </div>
        </div>
      ) : null}
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
