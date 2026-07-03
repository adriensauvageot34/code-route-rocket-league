export type AnswerFormat = "single" | "multiple" | "ranking";

export type PedagogicalMode =
  | "correction"
  | "hint"
  | "review"
  | "scenario_breakdown";

export type CognitiveCategory =
  | "observation"
  | "prise_decision"
  | "role"
  | "anticipation"
  | "gestion_risque";

export type RocketLeagueCategory =
  | "rotation"
  | "positionnement"
  | "defense"
  | "attaque"
  | "boost"
  | "challenge"
  | "transition";

export type AnswerOption = {
  id: string;
  label: string;
  is_correct?: boolean;
  expected_rank?: number;
  explanation?: string;
};

export type Question = {
  id: string;
  capture_id: string;
  image_path: string;
  context_to_display: string;
  question_text: string;
  answer_format: AnswerFormat;
  answers: AnswerOption[];
  correction: string;
  pedagogical_mode: PedagogicalMode;
  cognitive_category: CognitiveCategory;
  rl_category: RocketLeagueCategory;
  error_tags: string[];
};

export type QuestionSummary = {
  id: string;
  captureId: string;
  answerFormat: AnswerFormat;
  rlCategory: RocketLeagueCategory;
};
