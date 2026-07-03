import type { TrainingSession } from "@/types/session";

export function createInitialSession(questionIds: string[]): TrainingSession {
  return {
    id: crypto.randomUUID(),
    questionIds,
    currentIndex: 0,
    answers: [],
    startedAt: new Date().toISOString()
  };
}
