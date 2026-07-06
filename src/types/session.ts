import type { AnswerFormat, Capture, ContentQuestion, Correction, GlossaryTerm } from "@/types/content";
import type { GlobalAnswerState } from "@/lib/session/answer-evaluation";

export type SessionAnswer = {
  questionId: string;
  selectedAnswerIds: string[];
  answeredAt: string;
};

export type TrainingSession = {
  id: string;
  questionIds: string[];
  currentIndex: number;
  answers: SessionAnswer[];
  startedAt: string;
  completedAt?: string;
};

export type TrainingQuestionResult = {
  question_id: string;
  capture_id: string;
  answer_format: AnswerFormat;
  selected_answer_ids: string[];
  selected_ranking: string[];
  global_state: GlobalAnswerState;
  response_time_seconds: number;
  time_limit_seconds: number;
  pedagogical_mode: string;
  cognitive_category_primary: string;
  cognitive_category_secondary: string | null;
  rl_category_primary: string;
  rl_category_secondary: string | null;
  question_type_label: string;
  error_tags: string[];
  correction: Correction;
  image_path: string;
  correction_image_path?: string;
  capture: Capture;
  glossary_terms: GlossaryTerm[];
  image_exists: boolean;
  question: ContentQuestion;
};
