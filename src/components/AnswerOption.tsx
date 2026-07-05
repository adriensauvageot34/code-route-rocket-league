import type { Answer } from "@/types/content";

type AnswerOptionProps = {
  answer: Answer;
  order: number;
  isDisabled?: boolean;
  isSelected: boolean;
  rank?: number;
  onSelect: (answerId: string) => void;
};

export function AnswerOption({
  answer,
  order,
  isDisabled = false,
  isSelected,
  rank,
  onSelect
}: AnswerOptionProps) {
  return (
    <button
      className={isSelected ? "answer-option selected" : "answer-option"}
      disabled={isDisabled}
      onClick={() => onSelect(answer.answer_id)}
      type="button"
    >
      <span className="answer-main">
        <span className="answer-order">{order}</span>
        <span className="answer-text">{answer.text}</span>
      </span>
      {rank ? <span className="answer-rank">{rank}</span> : null}
    </button>
  );
}
