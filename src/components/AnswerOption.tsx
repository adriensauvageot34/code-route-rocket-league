import { GlossaryText } from "@/components/GlossaryText";
import type { AnswerVisualState } from "@/lib/session/answer-evaluation";
import type { Answer, GlossaryTerm } from "@/types/content";

type AnswerOptionProps = {
  answer: Answer;
  expectedRank?: number;
  glossaryTerms?: GlossaryTerm[];
  isDisabled?: boolean;
  isRanking?: boolean;
  isSelected: boolean;
  rank?: number;
  visualState?: AnswerVisualState;
  onSelect: (answerId: string) => void;
};

export function AnswerOption({
  answer,
  expectedRank,
  glossaryTerms = [],
  isDisabled = false,
  isRanking = false,
  isSelected,
  rank,
  visualState = isSelected ? "selected" : "neutral",
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
        `state-${visualState}`
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isDisabled}
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
      </span>
    </button>
  );
}
