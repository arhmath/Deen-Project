import { describe, expect, it } from "vitest";
import { scoreQuiz, validateQuestionShape, type QuestionDoc } from "@/modules/quiz/quiz.logic";

const q = (id: string, order: number, type: QuestionDoc["type"], correct: string[], all: string[], points = 1) => ({
  id, contentId: "c", text: id, type, explanation: `pembahasan ${id}`, points, orderIndex: order,
  options: all.map((o, i) => ({ id: o, text: o, isCorrect: correct.includes(o), orderIndex: i })),
});
const qs = [
  q("q1", 0, "SINGLE_CHOICE", ["a"], ["a", "b", "c"]),
  q("q2", 1, "MULTIPLE_CHOICE", ["x", "y"], ["x", "y", "z"], 2),
  q("q3", 2, "TRUE_FALSE", ["t"], ["t", "f"]),
];

describe("scoreQuiz (server-side, BR-009)", () => {
  it("sempurna", () => {
    const s = scoreQuiz(qs, [
      { questionId: "q1", selectedOptionIds: ["a"] },
      { questionId: "q2", selectedOptionIds: ["y", "x"] },
      { questionId: "q3", selectedOptionIds: ["t"] },
    ]);
    expect(s).toMatchObject({ earned: 4, max: 4, percent: 100, perfect: true, correctCount: 3 });
  });
  it("pilihan ganda harus cocok persis; sebagian benar = salah", () => {
    const s = scoreQuiz(qs, [{ questionId: "q1", selectedOptionIds: ["b"] }, { questionId: "q2", selectedOptionIds: ["x"] }, { questionId: "q3", selectedOptionIds: ["t"] }]);
    expect(s.earned).toBe(1);
    expect(s.percent).toBe(25);
    expect(s.perfect).toBe(false);
    expect(s.results.map((r) => r.correct)).toEqual([false, false, true]);
  });
  it("tidak dijawab = nol; hasil memuat kunci & pembahasan", () => {
    const s = scoreQuiz(qs, []);
    expect(s.percent).toBe(0);
    expect(s.results[0]).toMatchObject({ correctOptionIds: ["a"], explanation: "pembahasan q1", selectedOptionIds: [] });
  });
  it("menolak jawaban tidak valid", () => {
    expect(() => scoreQuiz(qs, [{ questionId: "nope", selectedOptionIds: [] }])).toThrow();
    expect(() => scoreQuiz(qs, [{ questionId: "q1", selectedOptionIds: ["zzz"] }])).toThrow();
    expect(() => scoreQuiz(qs, [{ questionId: "q1", selectedOptionIds: ["a", "b"] }])).toThrow(); // single choice
    expect(() => scoreQuiz(qs, [{ questionId: "q1", selectedOptionIds: ["a"] }, { questionId: "q1", selectedOptionIds: ["a"] }])).toThrow();
  });
});

describe("validateQuestionShape", () => {
  it("aturan jumlah jawaban benar", () => {
    expect(validateQuestionShape({ type: "SINGLE_CHOICE", options: [{ isCorrect: true }, { isCorrect: false }] })).toBeNull();
    expect(validateQuestionShape({ type: "SINGLE_CHOICE", options: [{ isCorrect: true }, { isCorrect: true }] })).toMatch(/tepat 1/);
    expect(validateQuestionShape({ type: "MULTIPLE_CHOICE", options: [{ isCorrect: false }, { isCorrect: false }] })).toMatch(/Minimal 1/);
    expect(validateQuestionShape({ type: "TRUE_FALSE", options: [{ isCorrect: true }, { isCorrect: false }, { isCorrect: false }] })).toMatch(/2 opsi/);
  });
});
