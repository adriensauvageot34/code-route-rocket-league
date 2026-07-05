export type AnswerFormat = "single" | "multiple" | "ranking";

export type CategoryType = "cognitive" | "rl";

export type PlayerTeam = "orange" | "blue";

export type Capture = {
  capture_id: string;
  image_path: string;
  player_team: PlayerTeam;
  description: string;
};

export type Answer = {
  answer_id: string;
  text: string;
  error_tags: string[];
};

export type Correction = {
  expected_answer: string;
  what_to_observe: string;
  principle: string;
  why_tempting: string;
  risk_avoided: string;
  reflex_phrase: string;
};

export type ContentQuestion = {
  question_id: string;
  capture_id: string;
  context_to_display?: string;
  question_text: string;
  answer_format: AnswerFormat;
  pedagogical_mode: string;
  cognitive_category_primary: string;
  cognitive_category_secondary: string | null;
  cognitive_subcategories: string[];
  rl_category_primary: string;
  rl_category_secondary: string | null;
  rl_subcategories: string[];
  answers: Answer[];
  correct_answer_ids: string[];
  correct_ranking: string[];
  correction: Correction;
  glossary_terms: string[];
};

export type GlossaryTerm = {
  term_id: string;
  term: string;
  definition: string;
  illustration_path?: string;
  image_path?: string;
};

export type Mode = {
  mode_id: string;
  label: string;
};

export type Category = {
  category_id: string;
  label: string;
  type: CategoryType;
};

export type Subcategory = {
  subcategory_id: string;
  category_id: string;
  label: string;
};

export type ErrorTag = {
  tag_id: string;
  label: string;
};

export type TrainingContent = {
  captures: Capture[];
  questions: ContentQuestion[];
  glossary: GlossaryTerm[];
  modes: Mode[];
  categories: Category[];
  subcategories: Subcategory[];
  error_tags: ErrorTag[];
};

export type ContentValidationIssue = {
  path: string;
  message: string;
};

export type ContentQuestionSummary = {
  id: string;
  captureId: string;
  answerFormat: AnswerFormat;
  rlCategory: string;
};

export type QuestionCategoryLabels = {
  cognitivePrimary?: string;
  cognitiveSecondary?: string;
  cognitiveSubcategories: string[];
  rlPrimary?: string;
  rlSecondary?: string;
  rlSubcategories: string[];
};
