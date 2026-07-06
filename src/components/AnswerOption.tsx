import { GlossaryText } from "@/components/GlossaryText";
import type { AnswerVisualState } from "@/lib/session/answer-evaluation";
import type { Answer, GlossaryTerm } from "@/types/content";
import type { DragEvent } from "react";

type AnswerOptionProps = {
  answer: Answer;
  dragHint?: string;
  expectedRank?: number;
  glossaryTerms?: GlossaryTerm[];
  isDisabled?: boolean;
  isDragging?: boolean;
  isDraggable?: boolean;
  isRanking?: boolean;
  isSelected: boolean;
  rank?: number;
  visualState?: AnswerVisualState;
  onDragEnd?: () => void;
  onDragOver?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragStart?: (answerId: string, event: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (answerId: string, event: DragEvent<HTMLButtonElement>) => void;
  onSelect: (answerId: string) => void;
};

export function AnswerOption({
  answer,
  dragHint,
  expectedRank,
  glossaryTerms = [],
  isDisabled = false,
  isDragging = false,
  isDraggable = false,
  isRanking = false,
  isSelected,
  rank,
  visualState = isSelected ? "selected" : "neutral",
  onDragEnd,
  onDragOver,
  onDragStart,
  onDrop,
  onSelect
}: AnswerOptionProps) {
  const shouldShowExpectedRank =
    isRanking &&
    typeof expectedRank === "number" &&
    (visualState === "incorrect" || visualState === "missing" || visualState === "missed");

  return (
    <button
      className={[
        "answer-option",
        isRanking ? "is-ranking" : "",
        isSelected ? "selected" : "",
        isDragging ? "is-dragging" : "",
        `state-${visualState}`
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isDisabled}
      draggable={isDraggable}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={(event) => onDragStart?.(answer.answer_id, event)}
      onDrop={(event) => onDrop?.(answer.answer_id, event)}
      onClick={() => onSelect(answer.answer_id)}
      type="button"
    >
      <span className="answer-main">
        {isRanking && rank ? <span className="answer-order">{rank}</span> : null}
        <span className="answer-text">
          <GlossaryText terms={glossaryTerms} text={answer.text} />
          {shouldShowExpectedRank ? (
            <small className="answer-expected-rank">Attendu : {expectedRank}</small>
          ) : null}
        </span>
        {dragHint ? <span className="answer-drag-hint">{dragHint}</span> : null}
      </span>
    </button>
  );
}
