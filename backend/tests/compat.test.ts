import { describe, expect, it } from "vitest";
import { normalizeLegacyContentType, normalizeLegacyQuizAnswers } from "@/modules/progress/compat";

describe("legacy compatibility adapter", () => {
  it("unwraps frontend quiz answers from nested answers payloads", () => {
    expect(normalizeLegacyQuizAnswers({ answers: { q1: "opt-1", q2: "opt-2" } })).toEqual({
      q1: ["opt-1"],
      q2: ["opt-2"],
    });

    expect(normalizeLegacyQuizAnswers({ q1: "opt-1", q2: "opt-2" })).toEqual({
      q1: ["opt-1"],
      q2: ["opt-2"],
    });
  });

  it("maps backend article content to frontend lesson content type", () => {
    expect(normalizeLegacyContentType("ARTICLE")).toBe("LESSON");
    expect(normalizeLegacyContentType("LESSON")).toBe("LESSON");
    expect(normalizeLegacyContentType("QUIZ")).toBe("QUIZ");
  });
});
