"use client";

/* eslint-disable @next/next/no-img-element -- Local gameplay captures must render without Next image optimization cache. */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { AnswerOption } from "@/components/AnswerOption";
import { GlossaryText } from "@/components/GlossaryText";
import {
  getAnswerVisualState,
  getGlobalAnswerState,
  type GlobalAnswerState
} from "@/lib/session/answer-evaluation";
import type { Capture, ContentQuestion, GlossaryTerm } from "@/types/content";

type QuestionScreenProps = {
  capture: Capture;
  glossaryTerms: GlossaryTerm[];
  imageExists: boolean;
  question: ContentQuestion;
  questionIndex: number;
  totalQuestions: number;
  hasNextQuestion: boolean;
  onNextQuestion: () => void;
};

type PrimaryActionState = "validate" | "result" | "actions";

const DEFAULT_TIME_LIMIT_SECONDS = 30;

export function QuestionScreen({
  capture,
  glossaryTerms,
  imageExists,
  question,
  questionIndex,
  totalQuestions,
  hasNextQuestion,
  onNextQuestion
}: QuestionScreenProps) {
  const router = useRouter();
  const activeStartMsRef = useRef<number | null>(null);
  const elapsedBeforePauseMsRef = useRef(0);
  const [selectedAnswerIds, setSelectedAnswerIds] = useState<string[]>([]);
  const [imageAvailable, setImageAvailable] = useState(imageExists);
  const [failedScoreHudImagePath, setFailedScoreHudImagePath] = useState<string | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const questionTimeLimitSeconds = getQuestionTimeLimitSeconds(question);
  const [remainingSeconds, setRemainingSeconds] = useState(questionTimeLimitSeconds);
  const [responseTimeSeconds, setResponseTimeSeconds] = useState<number | null>(null);
  const [primaryActionState, setPrimaryActionState] = useState<PrimaryActionState>("validate");

  const selectedRankByAnswerId = useMemo(() => {
    return new Map(selectedAnswerIds.map((answerId, index) => [answerId, index + 1]));
  }, [selectedAnswerIds]);

  const globalAnswerState = useMemo<GlobalAnswerState>(() => {
    if (isTimedOut) {
      return "timeout";
    }

    if (selectedAnswerIds.length === 0) {
      return "wrong";
    }

    return getGlobalAnswerState(question, selectedAnswerIds);
  }, [isTimedOut, question, selectedAnswerIds]);

  const responseTimeLabel =
    responseTimeSeconds === null ? "" : `${formatResponseTime(responseTimeSeconds)} s`;
  const scoreHudImagePath = `/ui/score-hud-${capture.player_team}.png`;
  const scoreHudImageAvailable = failedScoreHudImagePath !== scoreHudImagePath;
  const clockState = getClockState(remainingSeconds);
  const isClockUrgent = remainingSeconds > 0 && remainingSeconds <= 4;
  const resultLabel = getResultLabel(globalAnswerState);
  const validateActionClassName = [
    "primary-action",
    "validate-action",
    `phase-${primaryActionState}`,
    isSubmitted ? "submitted" : "",
    isSubmitted ? globalAnswerState : ""
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    elapsedBeforePauseMsRef.current = 0;
    activeStartMsRef.current = Date.now();
  }, [question.question_id]);

  useEffect(() => {
    if (isPaused || isSubmitted || remainingSeconds <= 0) {
      return;
    }

    const timerId = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isPaused, isSubmitted, remainingSeconds]);

  useEffect(() => {
    if (isPaused || isSubmitted || remainingSeconds > 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSelectedAnswerIds([]);
      setResponseTimeSeconds(questionTimeLimitSeconds);
      setIsTimedOut(true);
      setIsSubmitted(true);
      setPrimaryActionState("result");
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isPaused, isSubmitted, questionTimeLimitSeconds, remainingSeconds]);

  useEffect(() => {
    if (primaryActionState !== "result") {
      return;
    }

    const revealActionId = window.setTimeout(() => {
      setPrimaryActionState("actions");
    }, 2000);

    return () => window.clearTimeout(revealActionId);
  }, [primaryActionState]);

  function pauseSession() {
    if (isPaused || isSubmitted) {
      return;
    }

    elapsedBeforePauseMsRef.current += Date.now() - (activeStartMsRef.current ?? Date.now());
    setIsPaused(true);
  }

  function resumeSession() {
    activeStartMsRef.current = Date.now();
    setIsPaused(false);
  }

  function expandImage(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
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
      return;
    }

    if (question.answer_format === "single") {
      setSelectedAnswerIds((current) => (current[0] === answerId ? [] : [answerId]));
      return;
    }

    setSelectedAnswerIds((current) =>
      current.includes(answerId)
        ? current.filter((selectedAnswerId) => selectedAnswerId !== answerId)
        : [...current, answerId]
    );
  }

  function submitAnswer() {
    if (selectedAnswerIds.length === 0 || isSubmitted) {
      return;
    }

    if (remainingSeconds <= 0) {
      return;
    }

    const activeMs = isPaused ? 0 : Date.now() - (activeStartMsRef.current ?? Date.now());
    const elapsedMs = elapsedBeforePauseMsRef.current + activeMs;

    setResponseTimeSeconds(Math.max(0, Math.round(elapsedMs / 100) / 10));
    setIsSubmitted(true);
    setPrimaryActionState("result");
  }

  function openCorrection() {
    setIsCorrectionOpen(true);
  }

  function goToNextStep() {
    if (hasNextQuestion) {
      onNextQuestion();
      return;
    }

    router.push("/");
  }

  return (
    <main className="question-page session-game" aria-labelledby="question-title">
      <h1 className="sr-only" id="question-title">
        {question.question_id}
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
              <div
                className={`score-hud team-${capture.player_team} ${
                  scoreHudImageAvailable ? "has-hud-image" : "fallback-hud"
                }`}
                aria-label="Question, temps restant et total"
              >
                {scoreHudImageAvailable ? (
                  <img
                    alt=""
                    aria-hidden="true"
                    className="score-hud-image"
                    draggable={false}
                    onError={() => setFailedScoreHudImagePath(scoreHudImagePath)}
                    src={scoreHudImagePath}
                  />
                ) : null}
                <div className="score-hud-values">
                  <span className="score-hud-cell score-hud-left">{questionIndex + 1}</span>
                  <span
                    className={[
                      "score-hud-timer",
                      "score-hud-clock",
                      `clock-${clockState}`,
                      isClockUrgent ? "is-urgent" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {formatClock(remainingSeconds)}
                  </span>
                  <span className="score-hud-cell score-hud-right">{totalQuestions}</span>
                </div>
              </div>
              <button
                className="pause-button"
                onClick={(event) => {
                  event.stopPropagation();
                  pauseSession();
                }}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                type="button"
              >
                Pause
              </button>
            </div>

            {imageAvailable ? (
              <img
                alt={capture.description}
                className="capture-image"
                draggable={false}
                onError={() => setImageAvailable(false)}
                src={capture.image_path}
              />
            ) : (
              <CaptureFallback label={capture.capture_id} />
            )}

            {question.context_to_display ? (
              <p className="context-overlay">{question.context_to_display}</p>
            ) : null}

            <span className="image-hold-hint">Maintenir</span>
          </div>
        </div>

        <div className="question-card">
          <div className="question-copy">
            <h2>
              <GlossaryText terms={glossaryTerms} text={question.question_text} />
            </h2>
          </div>

          <div className="answers-list" aria-label="Reponses possibles">
            {question.answers.map((answer, answerIndex) => (
              <AnswerOption
                answer={answer}
                glossaryTerms={glossaryTerms}
                isDisabled={isSubmitted}
                isSelected={selectedAnswerIds.includes(answer.answer_id)}
                key={answer.answer_id}
                onSelect={selectAnswer}
                order={answerIndex + 1}
                rank={
                  question.answer_format === "ranking"
                    ? selectedRankByAnswerId.get(answer.answer_id)
                    : undefined
                }
                visualState={getAnswerVisualState(
                  question,
                  selectedAnswerIds,
                  answer.answer_id,
                  isSubmitted,
                  isTimedOut
                )}
              />
            ))}
          </div>

          <div className="question-actions">
            {primaryActionState === "actions" ? (
              <div className="post-result-actions" aria-label="Actions apres validation">
                <button className="secondary-action result-action" onClick={openCorrection} type="button">
                  Correction
                </button>
                <button className="primary-action result-action" onClick={goToNextStep} type="button">
                  {hasNextQuestion ? "Suivant" : "Menu"}
                </button>
              </div>
            ) : (
              <button
                aria-live="polite"
                className={validateActionClassName}
                disabled={
                  (primaryActionState === "validate" && selectedAnswerIds.length === 0) ||
                  primaryActionState === "result"
                }
                onClick={submitAnswer}
                type="button"
              >
                <span className="validate-label">
                  {isSubmitted ? resultLabel : "Valider"}
                  {isSubmitted && !isTimedOut && responseTimeLabel ? <small>{responseTimeLabel}</small> : null}
                </span>
              </button>
            )}
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
              <h2>Correction</h2>
              <button
                className="secondary-action correction-close"
                onClick={() => setIsCorrectionOpen(false)}
                type="button"
              >
                Fermer
              </button>
            </div>

            <div className="correction-content">
              <CorrectionSection
                label="Bonne reponse attendue"
                terms={glossaryTerms}
                text={question.correction.expected_answer}
              />
              <CorrectionSection
                label="Ce qu'il fallait observer"
                terms={glossaryTerms}
                text={question.correction.what_to_observe}
              />
              <CorrectionSection
                label="Principe a retenir"
                terms={glossaryTerms}
                text={question.correction.principle}
              />
              <CorrectionSection
                label="Pourquoi l'erreur etait tentante"
                terms={glossaryTerms}
                text={question.correction.why_tempting}
              />
              <CorrectionSection
                label="Risque evite"
                terms={glossaryTerms}
                text={question.correction.risk_avoided}
              />

              <section className="reflex-section">
                <h3>Phrase reflexe</h3>
                <p>
                  <GlossaryText terms={glossaryTerms} text={question.correction.reflex_phrase} />
                </p>
              </section>
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
              <button className="primary-action" onClick={resumeSession} type="button">
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
              <img
                alt={capture.description}
                className="capture-image"
                draggable={false}
                onError={() => setImageAvailable(false)}
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

function getResultLabel(state: GlobalAnswerState) {
  if (state === "timeout") {
    return "Temps ecoule";
  }

  if (state === "correct") {
    return "Bonne reponse";
  }

  if (state === "partial") {
    return "Reponse partielle";
  }

  return "Mauvaise reponse";
}

function getQuestionTimeLimitSeconds(question: ContentQuestion) {
  if (typeof question.time_limit_seconds === "number" && question.time_limit_seconds > 0) {
    return Math.floor(question.time_limit_seconds);
  }

  return DEFAULT_TIME_LIMIT_SECONDS;
}

function formatResponseTime(value: number) {
  return value.toFixed(1).replace(".", ",");
}

function formatClock(seconds: number) {
  const normalizedSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(normalizedSeconds / 60);
  const remaining = normalizedSeconds % 60;

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function getClockState(seconds: number) {
  if (seconds <= 0) {
    return "expired";
  }

  if (seconds <= 3) {
    return "danger";
  }

  if (seconds <= 6) {
    return "warning";
  }

  return "normal";
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
  terms,
  text
}: {
  label: string;
  terms: GlossaryTerm[];
  text: string;
}) {
  return (
    <section>
      <h3>{label}</h3>
      <p>
        <GlossaryText terms={terms} text={text} />
      </p>
    </section>
  );
}
