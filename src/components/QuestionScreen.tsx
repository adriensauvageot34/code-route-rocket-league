"use client";

/* eslint-disable @next/next/no-img-element -- Local gameplay captures must render without Next image optimization cache. */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent, KeyboardEvent, PointerEvent } from "react";
import { AnswerOption } from "@/components/AnswerOption";
import { GlossaryText } from "@/components/GlossaryText";
import { TrainingCorrectionPanel } from "@/components/TrainingCorrectionPanel";
import {
  getAnswerVisualState,
  getGlobalAnswerState,
  type GlobalAnswerState
} from "@/lib/session/answer-evaluation";
import type { AnswerFormat, Capture, ContentQuestion, GlossaryTerm, VisualFocus } from "@/types/content";
import type { TrainingQuestionResult } from "@/types/session";

type QuestionScreenProps = {
  capture: Capture;
  glossaryTerms: GlossaryTerm[];
  imageExists: boolean;
  question: ContentQuestion;
  questionIndex: number;
  totalQuestions: number;
  hasNextQuestion: boolean;
  onQuestionResult: (result: TrainingQuestionResult) => void;
  onNextQuestion: () => void;
};

type PrimaryActionState = "validate" | "result" | "actions";
type ExitDirection = "left" | "right";

const DEFAULT_TIME_LIMIT_SECONDS = 30;
const EXIT_TRANSITION_MS = 1000;
const VISUAL_FOCUS_VALUES = new Set(["image", "balanced", "text"]);

export function QuestionScreen({
  capture,
  glossaryTerms,
  imageExists,
  question,
  questionIndex,
  totalQuestions,
  hasNextQuestion,
  onQuestionResult,
  onNextQuestion
}: QuestionScreenProps) {
  const activeStartMsRef = useRef<number | null>(null);
  const elapsedBeforePauseMsRef = useRef(0);
  const recordedResultRef = useRef<TrainingQuestionResult | null>(null);
  const isExitingRef = useRef(false);
  const exitTimeoutRef = useRef<number | null>(null);
  const [selectedAnswerIds, setSelectedAnswerIds] = useState<string[]>([]);
  const [failedImagePaths, setFailedImagePaths] = useState<string[]>(
    imageExists ? [] : [capture.image_path]
  );
  const [failedScoreHudImagePath, setFailedScoreHudImagePath] = useState<string | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [isAbandonConfirming, setIsAbandonConfirming] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [draggedAnswerId, setDraggedAnswerId] = useState<string | null>(null);
  const questionTimeLimitSeconds = getQuestionTimeLimitSeconds(question);
  const [remainingSeconds, setRemainingSeconds] = useState(questionTimeLimitSeconds);
  const [responseTimeSeconds, setResponseTimeSeconds] = useState<number | null>(null);
  const [primaryActionState, setPrimaryActionState] = useState<PrimaryActionState>("validate");
  const [exitDirection, setExitDirection] = useState<ExitDirection | null>(null);

  const selectedRankByAnswerId = useMemo(() => {
    return new Map(selectedAnswerIds.map((answerId, index) => [answerId, index + 1]));
  }, [selectedAnswerIds]);
  const expectedRankByAnswerId = useMemo(() => {
    return new Map(question.correct_ranking.map((answerId, index) => [answerId, index + 1]));
  }, [question.correct_ranking]);

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
  const isRankingQuestion = question.answer_format === "ranking";
  const requiredSelectionCount =
    question.answer_format === "ranking" ? question.answers.length : question.correct_answer_ids.length;
  const hasRequiredSelection =
    question.answer_format === "single"
      ? selectedAnswerIds.length === 1
      : selectedAnswerIds.length === requiredSelectionCount;
  const visualFocus = getVisualFocus(question);
  const questionTypeMeta = getQuestionTypeMeta(question.answer_format);
  const isExiting = exitDirection !== null;
  const isValidateDisabled =
    isExiting ||
    primaryActionState === "result" ||
    (primaryActionState === "validate" && !hasRequiredSelection);
  const resultLabel = getResultLabel(globalAnswerState);
  const correctionImagePath = question.correction.correction_image_path?.trim();
  const preferredCorrectionImagePath = isCorrectionOpen && correctionImagePath ? correctionImagePath : null;
  const activeImagePath =
    preferredCorrectionImagePath && !failedImagePaths.includes(preferredCorrectionImagePath)
      ? preferredCorrectionImagePath
      : capture.image_path;
  const activeImageAvailable =
    activeImagePath === capture.image_path
      ? imageExists && !failedImagePaths.includes(activeImagePath)
      : !failedImagePaths.includes(activeImagePath);
  const activeImageAlt =
    preferredCorrectionImagePath && activeImagePath === preferredCorrectionImagePath
      ? `${capture.description} correction`
      : capture.description;
  const validateActionClassName = [
    "primary-action",
    "validate-action",
    `phase-${primaryActionState}`,
    isSubmitted ? "submitted" : "",
    isSubmitted ? globalAnswerState : ""
  ]
    .filter(Boolean)
    .join(" ");
  const questionLayoutClassName = [
    "question-layout",
    `focus-${visualFocus}`,
    isCorrectionOpen ? "layout-correction" : "",
    questionIndex > 0 ? "enter-from-under" : "",
    isExiting ? "is-transitioning" : "",
    exitDirection ? `exit-${exitDirection}` : ""
  ]
    .filter(Boolean)
    .join(" ");

  const recordQuestionResult = useCallback(
    (answerIds: string[], state: GlobalAnswerState, responseSeconds: number) => {
      if (recordedResultRef.current) {
        return;
      }

      const triggeredErrorTags = Array.from(
        new Set(
          answerIds.flatMap((answerId) => {
            const answer = question.answers.find((currentAnswer) => currentAnswer.answer_id === answerId);

            return answer?.error_tags ?? [];
          })
        )
      );
      const result: TrainingQuestionResult = {
        answer_format: question.answer_format,
        capture,
        capture_id: question.capture_id,
        cognitive_category_primary: question.cognitive_category_primary,
        cognitive_category_secondary: question.cognitive_category_secondary,
        correction: question.correction,
        correction_image_path: question.correction.correction_image_path,
        error_tags: triggeredErrorTags,
        global_state: state,
        glossary_terms: glossaryTerms,
        image_exists: imageExists,
        image_path: capture.image_path,
        pedagogical_mode: question.pedagogical_mode,
        question,
        question_id: question.question_id,
        question_type_label: getQuestionTypeMeta(question.answer_format).label,
        response_time_seconds: responseSeconds,
        rl_category_primary: question.rl_category_primary,
        rl_category_secondary: question.rl_category_secondary,
        selected_answer_ids: [...answerIds],
        selected_ranking: question.answer_format === "ranking" ? [...answerIds] : [],
        time_limit_seconds: questionTimeLimitSeconds
      };

      recordedResultRef.current = result;
      onQuestionResult(result);
    },
    [capture, glossaryTerms, imageExists, onQuestionResult, question, questionTimeLimitSeconds]
  );

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current !== null) {
        window.clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    elapsedBeforePauseMsRef.current = 0;
    activeStartMsRef.current = Date.now();
    recordedResultRef.current = null;
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
    if (isPaused || isSubmitted || isExiting || remainingSeconds > 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSelectedAnswerIds([]);
      setResponseTimeSeconds(questionTimeLimitSeconds);
      setIsTimedOut(true);
      setIsSubmitted(true);
      setPrimaryActionState("result");
      recordQuestionResult([], "timeout", questionTimeLimitSeconds);
      vibrateTraining([20, 40, 20]);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isExiting, isPaused, isSubmitted, questionTimeLimitSeconds, recordQuestionResult, remainingSeconds]);

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
    if (isExiting || isPaused) {
      return;
    }

    if (!isSubmitted) {
      elapsedBeforePauseMsRef.current += Date.now() - (activeStartMsRef.current ?? Date.now());
    }

    setIsAbandonConfirming(false);
    setIsPaused(true);
  }

  function resumeSession() {
    activeStartMsRef.current = Date.now();
    setIsAbandonConfirming(false);
    setIsPaused(false);
  }

  function markImageFailed(imagePath: string) {
    setFailedImagePaths((current) => (current.includes(imagePath) ? current : [...current, imagePath]));
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
    if (isExiting || isSubmitted) {
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

  function startRankingDrag(answerId: string, event: DragEvent<HTMLButtonElement>) {
    if (!isRankingQuestion || isSubmitted || !selectedAnswerIds.includes(answerId)) {
      return;
    }

    setDraggedAnswerId(answerId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", answerId);
  }

  function dragRankingOver(event: DragEvent<HTMLButtonElement>) {
    if (!isRankingQuestion || isSubmitted || !draggedAnswerId) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function dropRankingAnswer(targetAnswerId: string, event: DragEvent<HTMLButtonElement>) {
    if (!isRankingQuestion || isSubmitted) {
      return;
    }

    event.preventDefault();
    const sourceAnswerId = draggedAnswerId ?? event.dataTransfer.getData("text/plain");

    if (!sourceAnswerId || sourceAnswerId === targetAnswerId) {
      setDraggedAnswerId(null);
      return;
    }

    setSelectedAnswerIds((current) => moveAnswerBefore(current, sourceAnswerId, targetAnswerId));
    setDraggedAnswerId(null);
  }

  function submitAnswer() {
    if (isExiting || isSubmitted) {
      return;
    }

    if (!hasRequiredSelection) {
      return;
    }

    if (remainingSeconds <= 0) {
      return;
    }

    const activeMs = isPaused ? 0 : Date.now() - (activeStartMsRef.current ?? Date.now());
    const elapsedMs = elapsedBeforePauseMsRef.current + activeMs;
    const submittedAnswerState = getGlobalAnswerState(question, selectedAnswerIds);
    const submittedResponseTimeSeconds = Math.max(0, Math.round(elapsedMs / 100) / 10);

    setResponseTimeSeconds(submittedResponseTimeSeconds);
    setIsSubmitted(true);
    setPrimaryActionState("result");
    recordQuestionResult(selectedAnswerIds, submittedAnswerState, submittedResponseTimeSeconds);

    if (submittedAnswerState === "correct") {
      vibrateTraining(20);
    }
  }

  function openCorrection() {
    setIsCorrectionOpen(true);
  }

  function goToNextStep() {
    if (isExitingRef.current || isExiting) {
      return;
    }

    isExitingRef.current = true;
    setIsImageExpanded(false);
    setExitDirection(globalAnswerState === "correct" ? "right" : "left");

    exitTimeoutRef.current = window.setTimeout(() => {
      if (hasNextQuestion) {
        onNextQuestion();
        return;
      }

      onNextQuestion();
    }, EXIT_TRANSITION_MS);
  }

  return (
    <main className="question-page session-game" aria-labelledby="question-title">
      <h1 className="sr-only" id="question-title">
        {question.question_id}
      </h1>

      <section className={questionLayoutClassName}>
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
                disabled={isExiting}
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

            {activeImageAvailable ? (
              <img
                alt={activeImageAlt}
                className="capture-image"
                draggable={false}
                onError={() => markImageFailed(activeImagePath)}
                src={activeImagePath}
              />
            ) : (
              <CaptureFallback label={capture.capture_id} />
            )}

            {question.context_to_display && !isExiting ? (
              <p className="context-overlay">{question.context_to_display}</p>
            ) : null}

            <span className="image-hold-hint">Maintenir</span>
          </div>
        </div>

        <div className={`question-card ${isCorrectionOpen ? "is-correction-mode" : ""}`}>
          {isCorrectionOpen ? (
            <TrainingCorrectionPanel
              actionLabel="J'ai compris"
              isActionDisabled={isExiting}
              glossaryTerms={glossaryTerms}
              onAction={goToNextStep}
              question={question}
            />
          ) : (
            <>
              <div className="question-copy">
                <div className={`question-type-indicator type-${questionTypeMeta.variant}`}>
                  <span className="question-type-icon" aria-hidden="true" />
                  <span>{questionTypeMeta.label}</span>
                </div>
                <h2>
                  <GlossaryText terms={glossaryTerms} text={question.question_text} />
                </h2>
              </div>

              <div className="answers-list" aria-label="Reponses possibles">
                {question.answers.map((answer) => {
                  const visualState = getAnswerVisualState(
                    question,
                    selectedAnswerIds,
                    answer.answer_id,
                    isSubmitted,
                    isTimedOut
                  );

                  return (
                    <AnswerOption
                      answer={answer}
                      dragHint={isRankingQuestion && selectedAnswerIds.includes(answer.answer_id) ? "Glisser" : undefined}
                      expectedRank={
                        isSubmitted && isRankingQuestion
                          ? expectedRankByAnswerId.get(answer.answer_id)
                          : undefined
                      }
                      isDragging={draggedAnswerId === answer.answer_id}
                      glossaryTerms={glossaryTerms}
                      isDisabled={isSubmitted}
                      isDraggable={isRankingQuestion && selectedAnswerIds.includes(answer.answer_id) && !isSubmitted}
                      isRanking={isRankingQuestion}
                      isSelected={selectedAnswerIds.includes(answer.answer_id)}
                      key={answer.answer_id}
                      onDragEnd={() => setDraggedAnswerId(null)}
                      onDragOver={dragRankingOver}
                      onDragStart={startRankingDrag}
                      onDrop={dropRankingAnswer}
                      onSelect={selectAnswer}
                      rank={isRankingQuestion ? selectedRankByAnswerId.get(answer.answer_id) : undefined}
                      visualState={visualState}
                    />
                  );
                })}
              </div>

              <div className="question-actions">
                {primaryActionState === "actions" ? (
                  <div className="post-result-actions" aria-label="Actions apres validation">
                    <button className="secondary-action result-action" onClick={openCorrection} type="button">
                      Correction
                    </button>
                    <button
                      className="primary-action result-action"
                      disabled={isExiting}
                      onClick={goToNextStep}
                      type="button"
                    >
                      {hasNextQuestion ? "Suivant" : "Bilan"}
                    </button>
                  </div>
                ) : (
                  <button
                    aria-live="polite"
                    className={validateActionClassName}
                    disabled={isValidateDisabled}
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
            </>
          )}
        </div>
      </section>

      {isPaused ? (
        <div className="pause-overlay" role="dialog" aria-modal="true" aria-label="Session en pause">
          <div className="pause-card">
            <span className="eyebrow">Pause</span>
            <h2>Session en pause</h2>
            {isAbandonConfirming ? (
              <>
                <p>Tu perdras ta progression de session.</p>
                <div className="pause-actions">
                  <button
                    className="secondary-action"
                    onClick={() => setIsAbandonConfirming(false)}
                    type="button"
                  >
                    Continuer la session
                  </button>
                  <Link className="danger-action" href="/">
                    Abandonner
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p>Le chrono est arrete. Reprends quand tu es pret.</p>
                <div className="pause-audio-slot" aria-label="Musique">
                  <span>Musique</span>
                  <button
                    aria-pressed={isMusicMuted}
                    className="mute-toggle"
                    onClick={() => setIsMusicMuted((current) => !current)}
                    type="button"
                  >
                    {isMusicMuted ? "Muet" : "Active"}
                  </button>
                </div>
                <div className="pause-actions">
                  <button className="primary-action" onClick={resumeSession} type="button">
                    Reprendre
                  </button>
                  <button
                    className="secondary-action"
                    onClick={() => setIsAbandonConfirming(true)}
                    type="button"
                  >
                    Abandonner la session
                  </button>
                </div>
              </>
            )}
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
            {activeImageAvailable ? (
              <img
                alt={activeImageAlt}
                className="capture-image"
                draggable={false}
                onError={() => markImageFailed(activeImagePath)}
                src={activeImagePath}
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

function getVisualFocus(question: ContentQuestion): VisualFocus {
  if (question.visual_focus && VISUAL_FOCUS_VALUES.has(question.visual_focus)) {
    return question.visual_focus;
  }

  return "image";
}

function getQuestionTypeMeta(answerFormat: AnswerFormat) {
  const meta: Record<AnswerFormat, { label: string; variant: string }> = {
    multiple: { label: "Multiple", variant: "multiple" },
    ranking: { label: "Classement", variant: "ranking" },
    single: { label: "Option", variant: "single" }
  };

  return meta[answerFormat];
}

function moveAnswerBefore(answerIds: string[], sourceAnswerId: string, targetAnswerId: string) {
  const sourceIndex = answerIds.indexOf(sourceAnswerId);
  const targetIndex = answerIds.indexOf(targetAnswerId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return answerIds;
  }

  const reordered = [...answerIds];
  const [movedAnswerId] = reordered.splice(sourceIndex, 1);
  const nextTargetIndex = reordered.indexOf(targetAnswerId);

  reordered.splice(nextTargetIndex, 0, movedAnswerId);

  return reordered;
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

function vibrateTraining(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate(pattern);
}
