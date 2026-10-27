import { Errors } from "@/shared/errors";

export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";

export interface OptionDoc {
  id: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuestionDoc {
  contentId: string;
  text: string;
  type: QuestionType;
  explanation: string | null;
  points: number;
  orderIndex: number;
  options: OptionDoc[];
}

export interface AnswerInput {
  questionId: string;
  selectedOptionIds?: string[];
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  explanation: string | null;
  earned: number;
  points: number;
}

export interface QuizScore {
  earned: number;
  max: number;
  percent: number;
  perfect: boolean;
  correctCount: number;
  results: QuestionResult[];
}

/**
 * Penilaian kuis di server (BR-009). Jawaban benar tidak pernah dipercaya dari client:
 * skor dihitung dari kunci jawaban di database.
 */
export function scoreQuiz(questions: ({ id: string } & QuestionDoc)[], answers: AnswerInput[]): QuizScore {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const seen = new Set<string>();

  for (const a of answers) {
    const q = byId.get(a.questionId);
    if (!q) throw Errors.validation({ answers: "Ada jawaban untuk pertanyaan yang tidak dikenal." });
    if (seen.has(a.questionId)) throw Errors.validation({ answers: "Satu pertanyaan hanya boleh dijawab sekali." });
    seen.add(a.questionId);

    const ids = a.selectedOptionIds ?? [];
    const valid = new Set(q.options.map((o) => o.id));
    if (new Set(ids).size !== ids.length || ids.some((id) => !valid.has(id))) {
      throw Errors.validation({ answers: "Ada pilihan jawaban yang tidak valid." });
    }
    if (q.type !== "MULTIPLE_CHOICE" && ids.length > 1) {
      throw Errors.validation({ answers: "Pertanyaan ini hanya boleh satu jawaban." });
    }
  }

  const ordered = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);
  const answerOf = new Map(answers.map((a) => [a.questionId, a]));
  let earned = 0;
  let max = 0;
  let correctCount = 0;
  const results: QuestionResult[] = ordered.map((q) => {
    const selected = answerOf.get(q.id)?.selectedOptionIds ?? [];
    const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
    const correct =
      selected.length === correctIds.length && correctIds.every((id) => selected.includes(id));
    max += q.points;
    if (correct) {
      earned += q.points;
      correctCount += 1;
    }
    return {
      questionId: q.id,
      correct,
      selectedOptionIds: selected,
      correctOptionIds: correctIds,
      explanation: q.explanation,
      earned: correct ? q.points : 0,
      points: q.points,
    };
  });

  const percent = max > 0 ? Math.round((earned / max) * 100) : 0;
  return { earned, max, percent, perfect: max > 0 && earned === max, correctCount, results };
}

/** Validasi struktur pertanyaan saat guru membuat/mengubah kuis. */
export function validateQuestionShape(q: {
  type: QuestionType;
  options: { isCorrect: boolean }[];
}): string | null {
  const correct = q.options.filter((o) => o.isCorrect).length;
  if (q.type === "TRUE_FALSE" && q.options.length !== 2) return "Pertanyaan benar/salah harus punya tepat 2 opsi.";
  if (q.options.length < 2) return "Minimal 2 opsi jawaban.";
  if (q.type !== "MULTIPLE_CHOICE" && correct !== 1) return "Harus ada tepat 1 jawaban benar.";
  if (q.type === "MULTIPLE_CHOICE" && correct < 1) return "Minimal 1 jawaban benar.";
  return null;
}
