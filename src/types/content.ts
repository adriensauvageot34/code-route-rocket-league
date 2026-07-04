export type AnswerFormat = "single" | "multiple" | "ranking";

export type ValidationStatus = "draft" | "needs_review" | "validated" | "archived";

export type PedagogicalMode =
  | "obvious_anchor"
  | "pure_observation"
  | "attention_trap"
  | "anti_reflex"
  | "best_option"
  | "multiple_answers"
  | "prediction"
  | "justification";

export type CognitiveCategory =
  | "observation"
  | "role_identification"
  | "situation_understanding"
  | "anticipation"
  | "prioritization"
  | "decision_choice"
  | "inhibition"
  | "risk_evaluation"
  | "adaptation"
  | "deep_justification"
  | "comparison"
  | "metacognition";

export type RocketLeagueCategory =
  | "kickoff"
  | "possession"
  | "offensive_creation"
  | "finishing"
  | "off_ball_offense"
  | "attack_defense_transition"
  | "defense"
  | "challenges_duels"
  | "defensive_exit"
  | "team_rotation"
  | "boost_resources"
  | "player_reading"
  | "score_time_context";

export type ErrorTag =
  | "double_commit"
  | "boost_over_ball"
  | "vision_tunnel"
  | "bad_last_man_commit"
  | "forced_shot"
  | "overcommit"
  | "bad_spacing"
  | "excessive_passivity"
  | "possession_given"
  | "wrong_role"
  | "poor_risk_assessment"
  | "too_passive"
  | "excessive_aggression"
  | "bad_timing"
  | "missed_threat";

export type MatchMode =
  | "ranked_1v1"
  | "ranked_2v2"
  | "ranked_3v3"
  | "casual"
  | "scrim"
  | "replay_review";

export type Capture = {
  capture_id: string;
  image_path: string;
  title?: string;
  short_label: string;
  match_mode: MatchMode;
  team_player?: string | null;
  score_blue: number;
  score_orange: number;
  time_remaining: string;
  player_boost: number | null;
  visible_context: string;
  hidden_context: string;
  context_to_display: string;
  capture_notes: string;
  validation_status: ValidationStatus;
};

export type Answer = {
  answer_id: string;
  text: string;
  display_order: number;
  is_correct: boolean;
  ranking_position?: number | null;
  feedback: string;
  error_tags: ErrorTag[];
};

export type GlossaryTerm = {
  term: string;
  definition: string;
};

export type Correction = {
  expected_answer?: string;
  correct_answer_summary: string;
  what_to_observe: string;
  what_to_observe_items?: string[];
  principle: string;
  why_tempting: string;
  risk_avoided: string;
  reflex_phrase: string;
  guide_reference: string;
  glossary_terms?: GlossaryTerm[];
};

export type ContentQuestion = {
  question_id: string;
  capture_id: string;
  question_text: string;
  answer_format: AnswerFormat;
  time_limit_seconds: number | null;
  pedagogical_mode: PedagogicalMode;
  cognitive_category_primary: CognitiveCategory;
  cognitive_category_secondary: CognitiveCategory | null;
  cognitive_subcategory: string;
  rl_category_primary: RocketLeagueCategory;
  rl_category_secondary: RocketLeagueCategory | null;
  rl_subcategory: string;
  frequency_weight: number;
  validation_status: ValidationStatus;
  is_active: boolean;
  answers: Answer[];
  correction: Correction;
};

export type TrainingContent = {
  schema_version: string;
  captures: Capture[];
  questions: ContentQuestion[];
};

export type ContentValidationIssue = {
  path: string;
  message: string;
};

export type ContentQuestionSummary = {
  id: string;
  captureId: string;
  answerFormat: AnswerFormat;
  rlCategory: RocketLeagueCategory;
};
