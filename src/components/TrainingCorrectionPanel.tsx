import { GlossaryText } from "@/components/GlossaryText";
import type { ContentQuestion, GlossaryTerm } from "@/types/content";

type TrainingCorrectionPanelProps = {
  actionLabel: string;
  glossaryTerms: GlossaryTerm[];
  isActionDisabled?: boolean;
  onAction: () => void;
  question: ContentQuestion;
  statusLabel?: string;
  statusVariant?: "partial" | "wrong" | "timeout";
};

export function TrainingCorrectionPanel({
  actionLabel,
  glossaryTerms,
  isActionDisabled = false,
  onAction,
  question,
  statusLabel,
  statusVariant = "wrong"
}: TrainingCorrectionPanelProps) {
  const title = getCorrectionTitle(question.cognitive_category_primary);
  const iconVariant = getCorrectionIconVariant(question.cognitive_category_primary);
  const reflexPhrase = question.correction.reflex_phrase?.trim();

  return (
    <section className="integrated-correction" aria-label="Correction pedagogique">
      <div className="integrated-correction-head">
        <span className={`correction-title-icon icon-${iconVariant}`} aria-hidden="true" />
        <h2>{title}</h2>
      </div>

      <div className="integrated-correction-scroll">
        {statusLabel ? <strong className={`correction-status status-${statusVariant}`}>{statusLabel}</strong> : null}

        {reflexPhrase ? (
          <section className="reflex-sticky-card">
            <h3>Phrase reflexe</h3>
            <p>
              <GlossaryText terms={glossaryTerms} text={reflexPhrase} />
            </p>
          </section>
        ) : null}

        <section className="expected-answer-card">
          <span className="expected-answer-icon" aria-hidden="true" />
          <div>
            <h3>Bonne reponse attendue</h3>
            <p>
              <GlossaryText terms={glossaryTerms} text={question.correction.expected_answer} />
            </p>
          </div>
        </section>

        <CorrectionSection
          label="A observer"
          terms={glossaryTerms}
          text={question.correction.what_to_observe}
        />
        <CorrectionSection label="Principe" terms={glossaryTerms} text={question.correction.principle} />
        <CorrectionSection
          label="Erreur tentante"
          terms={glossaryTerms}
          text={question.correction.why_tempting}
        />
        <CorrectionSection
          label="Risque evite"
          terms={glossaryTerms}
          text={question.correction.risk_avoided}
        />
      </div>

      <div className="integrated-correction-footer">
        <button
          className="primary-action understood-action"
          disabled={isActionDisabled}
          onClick={onAction}
          type="button"
        >
          <span className="understood-icon" aria-hidden="true" />
          <span>{actionLabel}</span>
        </button>
      </div>
    </section>
  );
}

function CorrectionSection({
  label,
  terms,
  text
}: {
  label: string;
  terms: GlossaryTerm[];
  text?: string;
}) {
  if (!text?.trim()) {
    return null;
  }

  return (
    <section className="correction-section">
      <h3>{label}</h3>
      <p>
        <GlossaryText terms={terms} text={text} />
      </p>
    </section>
  );
}

function getCorrectionTitle(categoryId: string) {
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

function getCorrectionIconVariant(categoryId: string) {
  if (categoryId === "prioritization") {
    return "priority";
  }

  if (categoryId === "inhibition") {
    return "inhibition";
  }

  if (categoryId === "risk_evaluation") {
    return "risk";
  }

  if (categoryId === "anticipation") {
    return "anticipation";
  }

  if (categoryId === "decision_choice" || categoryId === "decision_making") {
    return "decision";
  }

  if (categoryId === "role_identification") {
    return "role";
  }

  return "observation";
}
