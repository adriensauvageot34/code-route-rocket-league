"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { AnswerOption } from "@/components/AnswerOption";
import type { Capture, ContentQuestion, GlossaryTerm } from "@/types/content";

type QuestionScreenProps = {
  capture: Capture;
  imageExists: boolean;
  question: ContentQuestion;
  questionIndex: number;
  totalQuestions: number;
  hasNextQuestion: boolean;
  onNextQuestion: () => void;
};

export function QuestionScreen({
  capture,
  imageExists,
  question,
  questionIndex,
  totalQuestions,
  hasNextQuestion,
  onNextQuestion
}: QuestionScreenProps) {
  const [selectedAnswerIds, setSelectedAnswerIds] = useState<string[]>([]);
  const [imageAvailable, setImageAvailable] = useState(imageExists);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<GlossaryTerm | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(question.time_limit_seconds ?? 15);

  const correctAnswerIds = useMemo(() => {
    return question.answers
      .filter((answer) => answer.is_correct)
      .map((answer) => answer.answer_id);
  }, [question.answers]);

  const selectedRankByAnswerId = useMemo(() => {
    return new Map(selectedAnswerIds.map((answerId, index) => [answerId, index + 1]));
  }, [selectedAnswerIds]);
  const displayedTotalQuestions = Math.max(totalQuestions, 40);
  const isAnswerCorrect = useMemo(() => {
    if (question.answer_format === "ranking") {
      if (selectedAnswerIds.length !== question.answers.length) {
        return false;
      }

      return selectedAnswerIds.every((answerId, index) => {
        const answer = question.answers.find((candidate) => candidate.answer_id === answerId);

        return answer?.ranking_position === index + 1;
      });
    }

    if (selectedAnswerIds.length !== correctAnswerIds.length) {
      return false;
    }

    return correctAnswerIds.every((answerId) => selectedAnswerIds.includes(answerId));
  }, [correctAnswerIds, question.answer_format, question.answers, selectedAnswerIds]);
  const expectedAnswerText =
    question.correction.expected_answer ??
    question.answers
      .filter((answer) => answer.is_correct)
      .map((answer) => answer.text)
      .join(" / ");

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
      setIsCorrectionOpen(false);
      setActiveGlossaryTerm(null);
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

            {isSubmitted ? (
              <div className="session-feedback" aria-live="polite">
                <span className={isAnswerCorrect ? "result-pill correct" : "result-pill wrong"}>
                  {isAnswerCorrect ? "Bonne reponse" : "Mauvaise reponse"}
                </span>
                <div className="post-answer-actions">
                  <button
                    className="secondary-action correction-action"
                    onClick={() => {
                      setIsCorrectionOpen(true);
                      setActiveGlossaryTerm(null);
                    }}
                    type="button"
                  >
                    Voir la correction
                  </button>
                  {hasNextQuestion ? (
                    <button
                      className="secondary-action next-action"
                      onClick={onNextQuestion}
                      type="button"
                    >
                      Question suivante
                    </button>
                  ) : (
                    <Link className="secondary-action next-action" href="/">
                      Menu principal
                    </Link>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {isCorrectionOpen ? (
        <div
          className="correction-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Correction pedagogique"
        >
          <div className="correction-card">
            <div className="correction-head">
              <div>
                <span className={isAnswerCorrect ? "result-pill correct" : "result-pill wrong"}>
                  {isAnswerCorrect ? "Bonne reponse" : "Mauvaise reponse"}
                </span>
                <h2>Correction</h2>
              </div>
              <button
                className="secondary-action correction-close"
                onClick={() => setIsCorrectionOpen(false)}
                type="button"
              >
                Fermer
              </button>
            </div>

            <div className="correction-content">
              <section>
                <h3>Bonne reponse attendue</h3>
                <p>{expectedAnswerText}</p>
              </section>

              <section>
                <h3>Ce qu&apos;il fallait observer</h3>
                {question.correction.what_to_observe_items ? (
                  <ul>
                    {question.correction.what_to_observe_items.map((item) => (
                      <li key={item}>
                        <GlossaryText
                          text={item}
                          terms={question.correction.glossary_terms}
                          onTermSelect={setActiveGlossaryTerm}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    <GlossaryText
                      text={question.correction.what_to_observe}
                      terms={question.correction.glossary_terms}
                      onTermSelect={setActiveGlossaryTerm}
                    />
                  </p>
                )}
              </section>

              <CorrectionSection
                label="Principe a retenir"
                text={question.correction.principle}
                terms={question.correction.glossary_terms}
                onTermSelect={setActiveGlossaryTerm}
              />
              <CorrectionSection
                label="Pourquoi l'erreur etait tentante"
                text={question.correction.why_tempting}
                terms={question.correction.glossary_terms}
                onTermSelect={setActiveGlossaryTerm}
              />
              <CorrectionSection
                label="Risque evite"
                text={question.correction.risk_avoided}
                terms={question.correction.glossary_terms}
                onTermSelect={setActiveGlossaryTerm}
              />

              <section className="reflex-section">
                <h3>Phrase reflexe</h3>
                <p>{question.correction.reflex_phrase}</p>
              </section>

              {question.correction.glossary_terms ? (
                <section>
                  <h3>Mots techniques</h3>
                  <div className="glossary-term-list">
                    {question.correction.glossary_terms.map((term) => (
                      <button
                        className="glossary-link glossary-chip"
                        key={term.term}
                        onClick={() => setActiveGlossaryTerm(term)}
                        type="button"
                      >
                        {term.term}
                      </button>
                    ))}
                  </div>
                </section>
              ) : null}

              {activeGlossaryTerm ? (
                <aside className="glossary-definition" aria-live="polite">
                  <strong>{activeGlossaryTerm.term}</strong>
                  <span>{activeGlossaryTerm.definition}</span>
                </aside>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

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

function CorrectionSection({
  label,
  onTermSelect,
  terms,
  text
}: {
  label: string;
  onTermSelect: (term: GlossaryTerm) => void;
  terms?: GlossaryTerm[];
  text: string;
}) {
  return (
    <section>
      <h3>{label}</h3>
      <p>
        <GlossaryText text={text} terms={terms} onTermSelect={onTermSelect} />
      </p>
    </section>
  );
}

function GlossaryText({
  onTermSelect,
  terms,
  text
}: {
  onTermSelect: (term: GlossaryTerm) => void;
  terms?: GlossaryTerm[];
  text: string;
}) {
  if (!terms || terms.length === 0) {
    return text;
  }

  const orderedTerms = [...terms].sort((first, second) => second.term.length - first.term.length);
  const matcher = new RegExp(`(${orderedTerms.map((term) => escapeRegExp(term.term)).join("|")})`, "gi");
  const parts = text.split(matcher);

  return (
    <>
      {parts.map((part, index) => {
        const matchingTerm = orderedTerms.find(
          (term) => term.term.toLowerCase() === part.toLowerCase()
        );

        if (!matchingTerm) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        return (
          <button
            className="glossary-link"
            key={`${matchingTerm.term}-${index}`}
            onClick={() => onTermSelect(matchingTerm)}
            type="button"
          >
            {part}
          </button>
        );
      })}
    </>
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
