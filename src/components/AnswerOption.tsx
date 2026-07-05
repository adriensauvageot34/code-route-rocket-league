import { GlossaryText } from "@/components/GlossaryText";
import type { AnswerVisualState } from "@/lib/session/answer-evaluation";
import type { Answer, GlossaryTerm } from "@/types/content";

type AnswerOptionProps = {
  answer: Answer;
  glossaryTerms?: GlossaryTerm[];
  order: number;
  isDisabled?: boolean;
  isSelected: boolean;
  rank?: number;
  visualState?: AnswerVisualState;
  onSelect: (answerId: string) => void;
};

export function AnswerOption({
  answer,
  glossaryTerms = [],
  order,
  isDisabled = false,
  isSelected,
  rank,
  visualState = isSelected ? "selected" : "neutral",
  onSelect
}: AnswerOptionProps) {
  return (
    <button
      className={["answer-option", isSelected ? "selected" : "", `state-${visualState}`]
        .filter(Boolean)
        .join(" ")}
      disabled={isDisabled}
      onClick={() => onSelect(answer.answer_id)}
      type="button"
    >
      <span className="answer-main">
        <span className="answer-order">{order}</span>
        <span className="answer-text">
          <GlossaryText terms={glossaryTerms} text={answer.text} />
        </span>
      </span>
      {rank ? <span className="answer-rank">{rank}</span> : null}
    </button>
  );
}
