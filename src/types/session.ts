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
