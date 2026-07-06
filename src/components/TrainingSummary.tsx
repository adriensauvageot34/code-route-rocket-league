"use client";

/* eslint-disable @next/next/no-img-element -- The summary must display local gameplay and correction captures directly. */

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { TrainingCorrectionPanel } from "@/components/TrainingCorrectionPanel";
import type { GlobalAnswerState } from "@/lib/session/answer-evaluation";
import type { AnswerFormat } from "@/types/content";
import type { TrainingQuestionResult } from "@/types/session";

type TrainingSummaryProps = {
  onRestart: () => void;
  results: TrainingQuestionResult[];
  totalQuestions: number;
};

type CategorySummary = {
  categoryId: string;
  label: string;
  score: number;
  total: number;
};

type ErrorGroup = {
  categoryId: string;
  label: string;
  weight: number;
  results: TrainingQuestionResult[];
};

const PARTIAL_SCORE = 0.5;
const PARTIAL_ERROR_WEIGHT = 0.5;
const QUICK_ERROR_THRESHOLD_SECONDS = 3;
const MIN_STRONG_CATEGORY_QUESTIONS = 2;

export function TrainingSummary({ onRestart, results, totalQuestions }: TrainingSummaryProps) {
  const errorSectionRef = useRef<HTMLElement | null>(null);
  const [selectedResult, setSelectedResult] = useState<TrainingQuestionResult | null>(null);
  const [failedImagePaths, setFailedImagePaths] = useState<string[]>([]);
  const summary = useMemo(() => buildSummary(results), [results]);

  function scrollToErrors() {
    errorSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function markImageFailed(imagePath: string) {
    setFailedImagePaths((current) => (current.includes(imagePath) ? current : [...current, imagePath]));
  }

  if (selectedResult) {
    const preferredCorrectionImagePath = selectedResult.correction_image_path?.trim();
    const activeImagePath =
      preferredCorrectionImagePath && !failedImagePaths.includes(preferredCorrectionImagePath)
        ? preferredCorrectionImagePath
        : selectedResult.image_path;
    const imageAvailable =
      activeImagePath === selectedResult.image_path
        ? selectedResult.image_exists && !failedImagePaths.includes(activeImagePath)
        : !failedImagePaths.includes(activeImagePath);

    return (
      <main className="training-summary-page summary-correction-page" aria-labelledby="summary-correction-title">
        <section className="summary-correction-layout">
          <div className="summary-correction-media-card">
            <div className="summary-correction-kicker">
              <span className={`summary-state-pill state-${selectedResult.global_state}`}>
                {getStateLabel(selectedResult.global_state)}
              </span>
              <span>{formatSeconds(selectedResult.response_time_seconds)}</span>
            </div>
            <h1 id="summary-correction-title">{getCategoryLabel(selectedResult.cognitive_category_primary)}</h1>
            <div className="summary-correction-media">
              {imageAvailable ? (
                <img
                  alt={selectedResult.capture.description}
                  draggable={false}
                  onError={() => markImageFailed(activeImagePath)}
                  src={activeImagePath}
                />
              ) : (
                <SummaryCaptureFallback label={selectedResult.capture_id} />
              )}
            </div>
          </div>

          <div className="summary-correction-card">
            <TrainingCorrectionPanel
              actionLabel="Retour au bilan"
              glossaryTerms={selectedResult.glossary_terms}
              onAction={() => setSelectedResult(null)}
              question={selectedResult.question}
              statusLabel={getCorrectionStatusLabel(selectedResult.global_state)}
              statusVariant={getCorrectionStatusVariant(selectedResult.global_state)}
            />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="training-summary-page" aria-labelledby="training-summary-title">
      <section className="summary-hero">
        <div>
          <span className="eyebrow">Fin de serie</span>
          <h1 id="training-summary-title">Bilan d&apos;entra&icirc;nement</h1>
          <p className="summary-score">Score : {formatScore(summary.score)}/{totalQuestions}</p>
          <p className="summary-percent">{summary.percentage}% de reussite, sans bonus de rapidite.</p>
        </div>

        {summary.errorResults.length === 0 ? (
          <div className="perfect-reward" aria-label="Sans faute">
            <span />
            <strong>Sans faute</strong>
          </div>
        ) : null}
      </section>

      <section className="summary-stats" aria-label="Statistiques de session">
        <SummaryStat label="Bonnes reponses" value={summary.correctCount} />
        <SummaryStat label="Reponses partielles" value={summary.partialCount} />
        <SummaryStat label="Erreurs" value={summary.wrongCount} />
        <SummaryStat label="Temps ecoules" value={summary.timeoutCount} />
        <SummaryStat label="Temps moyen" value={formatSeconds(summary.averageTimeSeconds)} />
      </section>

      {summary.synthesis ? <p className="summary-synthesis">{summary.synthesis}</p> : null}

      {summary.quickErrorCount > 0 ? (
        <p className="summary-warning">
          Precipitation possible : {getQuickErrorMessage(summary.quickErrorCount)}
        </p>
      ) : null}

      <div className="summary-actions" aria-label="Actions de fin de session">
        <button className="primary-action" onClick={onRestart} type="button">
          Recommencer une session
        </button>
        {summary.errorResults.length > 0 ? (
          <button className="secondary-action" onClick={scrollToErrors} type="button">
            Revoir mes erreurs
          </button>
        ) : null}
        <Link className="secondary-action" href="/">
          Retour accueil
        </Link>
      </div>

      <section className="summary-grid">
        <SummaryCategoryList
          emptyLabel="Aucun point faible net sur cette serie."
          items={summary.weaknesses}
          title="A travailler en priorite"
        />
        <SummaryCategoryList
          emptyLabel="Pas encore assez de donnees pour isoler un point fort."
          items={summary.strengths}
          title="Points forts"
        />
      </section>

      {summary.errorResults.length === 0 ? (
        <section className="summary-perfect-card">
          <div className="perfect-pulse" aria-hidden="true" />
          <h2>Aucune erreur a revoir.</h2>
          <p>Session propre : toutes les situations ont ete validees sans correction a reprendre.</p>
        </section>
      ) : (
        <section className="error-review-section" ref={errorSectionRef} aria-labelledby="error-review-title">
          <div className="section-heading">
            <span className="eyebrow">Revue ciblee</span>
            <h2 id="error-review-title">Revue des erreurs</h2>
          </div>

          <div className="error-groups">
            {summary.errorGroups.map((group) => (
              <article className="error-group" key={group.categoryId}>
                <h3>{group.label}</h3>
                <div className="error-chip-list">
                  {group.results.map((result) => (
                    <button
                      className={`error-chip state-${result.global_state}`}
                      key={result.question_id}
                      onClick={() => setSelectedResult(result)}
                      type="button"
                    >
                      <span className="error-chip-icon" aria-hidden="true" />
                      <span className="error-chip-time">
                        {result.global_state === "timeout"
                          ? "Temps ecoule"
                          : formatSeconds(result.response_time_seconds)}
                      </span>
                      <span className="error-chip-label">{getQuestionChipLabel(result)}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function SummaryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="summary-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SummaryCategoryList({
  emptyLabel,
  items,
  title
}: {
  emptyLabel: string;
  items: CategorySummary[];
  title: string;
}) {
  return (
    <section className="summary-panel">
      <h2>{title}</h2>
      {items.length > 0 ? (
        <ol>
          {items.map((item) => (
            <li key={item.categoryId}>
              <span>{item.label}</span>
              <small>{formatCategoryScore(item)}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p>{emptyLabel}</p>
      )}
    </section>
  );
}

function buildSummary(results: TrainingQuestionResult[]) {
  const correctCount = results.filter((result) => result.global_state === "correct").length;
  const partialCount = results.filter((result) => result.global_state === "partial").length;
  const wrongCount = results.filter((result) => result.global_state === "wrong").length;
  const timeoutCount = results.filter((result) => result.global_state === "timeout").length;
  const score = results.reduce((total, result) => total + getResultScore(result.global_state), 0);
  const averageTimeSeconds =
    results.length > 0
      ? results.reduce((total, result) => total + result.response_time_seconds, 0) / results.length
      : 0;
  const percentage = results.length > 0 ? Math.round((score / results.length) * 100) : 0;
  const errorResults = results.filter((result) => result.global_state !== "correct");
  const quickErrorCount = errorResults.filter(
    (result) =>
      result.global_state !== "timeout" && result.response_time_seconds <= QUICK_ERROR_THRESHOLD_SECONDS
  ).length;
  const errorGroups = buildErrorGroups(errorResults);
  const weaknesses = errorGroups.slice(0, 3).map(({ categoryId, label, weight }) => ({
    categoryId,
    label,
    score: weight,
    total: 0
  }));
  const strengths = buildStrengths(results);
  const synthesis = buildSynthesis(errorGroups);

  return {
    averageTimeSeconds,
    correctCount,
    errorGroups,
    errorResults,
    partialCount,
    percentage,
    quickErrorCount,
    score,
    strengths,
    synthesis,
    timeoutCount,
    weaknesses,
    wrongCount
  };
}

function buildErrorGroups(errorResults: TrainingQuestionResult[]): ErrorGroup[] {
  const groups = new Map<string, ErrorGroup>();

  for (const result of errorResults) {
    const categoryId = result.cognitive_category_primary;
    const existing = groups.get(categoryId);
    const weight = getErrorWeight(result.global_state);

    if (existing) {
      existing.weight += weight;
      existing.results.push(result);
      continue;
    }

    groups.set(categoryId, {
      categoryId,
      label: getCategoryLabel(categoryId),
      results: [result],
      weight
    });
  }

  return Array.from(groups.values()).sort((first, second) => second.weight - first.weight);
}

function buildStrengths(results: TrainingQuestionResult[]): CategorySummary[] {
  const stats = new Map<string, CategorySummary>();

  for (const result of results) {
    const categoryId = result.cognitive_category_primary;
    const existing =
      stats.get(categoryId) ??
      ({
        categoryId,
        label: getCategoryLabel(categoryId),
        score: 0,
        total: 0
      } satisfies CategorySummary);

    existing.score += getResultScore(result.global_state);
    existing.total += 1;
    stats.set(categoryId, existing);
  }

  return Array.from(stats.values())
    .filter(
      (item) =>
        item.total >= MIN_STRONG_CATEGORY_QUESTIONS &&
        item.score / item.total >= 0.8
    )
    .sort((first, second) => second.score / second.total - first.score / first.total)
    .slice(0, 3);
}

function buildSynthesis(errorGroups: ErrorGroup[]) {
  const mainGroups = errorGroups.filter((group) => group.weight > 0).slice(0, 2);

  if (mainGroups.length === 0) {
    return "Tu n'as pas perdu de points sur cette serie.";
  }

  if (mainGroups.length === 1) {
    return `Tu as surtout perdu des points sur ${mainGroups[0].label.toLowerCase()}.`;
  }

  return `Tu as surtout perdu des points sur ${mainGroups[0].label.toLowerCase()} et ${mainGroups[1].label.toLowerCase()}.`;
}

function getResultScore(state: GlobalAnswerState) {
  if (state === "correct") {
    return 1;
  }

  if (state === "partial") {
    return PARTIAL_SCORE;
  }

  return 0;
}

function getErrorWeight(state: GlobalAnswerState) {
  if (state === "partial") {
    return PARTIAL_ERROR_WEIGHT;
  }

  if (state === "wrong" || state === "timeout") {
    return 1;
  }

  return 0;
}

function getCategoryLabel(categoryId: string) {
  const labels: Record<string, string> = {
    anticipation: "Anticipation",
    decision_choice: "Choix de decision",
    decision_making: "Choix de decision",
    inhibition: "Inhibition",
    observation_reperage: "Observation",
    prioritization: "Priorisation",
    risk_evaluation: "Evaluation du risque",
    role_identification: "Role",
    situation_understanding: "Lecture de situation",
    visual_scan: "Observation"
  };

  return labels[categoryId] ?? "Lecture de situation";
}

function getStateLabel(state: GlobalAnswerState) {
  if (state === "partial") {
    return "Reponse partielle";
  }

  if (state === "timeout") {
    return "Temps ecoule";
  }

  if (state === "correct") {
    return "Bonne reponse";
  }

  return "Erreur";
}

function getCorrectionStatusLabel(state: GlobalAnswerState) {
  if (state === "timeout") {
    return "Temps ecoule";
  }

  if (state === "partial") {
    return "Reponse partielle";
  }

  if (state === "wrong") {
    return "Erreur a corriger";
  }

  return undefined;
}

function getCorrectionStatusVariant(state: GlobalAnswerState) {
  if (state === "partial" || state === "timeout" || state === "wrong") {
    return state;
  }

  return "wrong";
}

function getAnswerFormatLabel(format: AnswerFormat) {
  const labels: Record<AnswerFormat, string> = {
    multiple: "Multiple",
    ranking: "Classement",
    single: "Option"
  };

  return labels[format];
}

function getQuestionChipLabel(result: TrainingQuestionResult) {
  return result.question_type_label?.trim() || getAnswerFormatLabel(result.answer_format);
}

function getQuickErrorMessage(count: number) {
  if (count === 1) {
    return "une erreur a ete faite tres rapidement.";
  }

  return "plusieurs erreurs ont ete faites tres rapidement.";
}

function formatScore(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(".", ",");
}

function formatSeconds(value: number) {
  return `${value.toFixed(1).replace(".", ",")}s`;
}

function formatCategoryScore(item: CategorySummary) {
  if (item.total <= 0) {
    return `${formatScore(item.score)} erreur`;
  }

  return `${Math.round((item.score / item.total) * 100)}%`;
}

function SummaryCaptureFallback({ label }: { label: string }) {
  return (
    <div className="summary-capture-fallback">
      <strong>{label}</strong>
      <span>Capture indisponible</span>
    </div>
  );
}
