import { describe, expect, it } from "vitest";

import { generateStudentLinkCode } from "../src/shared/ids";

describe("student link code", () => {
  it("menghasilkan kode unik berformat ORT-xxxxx", () => {
    const code = generateStudentLinkCode();

    expect(code).toMatch(/^ORT-[A-Z0-9]{6}$/);
    expect(code).toBe(code.toUpperCase());
  });
});
