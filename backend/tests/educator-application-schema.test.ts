import { describe, expect, it } from "vitest";
import { educatorApplicationSchema } from "../src/modules/educator-applications/educator-application.schema";

const validApplication = {
  fullName: "Ahmad Pendidik",
  email: "ahmad.pendidik@gmail.com",
  phone: "+6281234567890",
  institution: "TPA Al-Ikhlas",
  city: "Yogyakarta",
  education: "S1",
  subjects: ["Al-Qur'an dan Tahsin"],
  experience: "1–3 tahun",
  motivation: "Saya ingin membantu santri belajar agama dengan cara yang ramah dan menyenangkan.",
  evidenceUrl: "https://example.com/sertifikat",
  verificationConsent: true,
} as const;

describe("educator application schema", () => {
  it("accepts a complete application with Gmail and consent", () => {
    expect(educatorApplicationSchema.safeParse(validApplication).success).toBe(true);
  });

  it("rejects a non-Gmail address", () => {
    expect(educatorApplicationSchema.safeParse({ ...validApplication, email: "pendidik@example.com" }).success).toBe(false);
  });

  it("requires at least one teaching subject", () => {
    expect(educatorApplicationSchema.safeParse({ ...validApplication, subjects: [] }).success).toBe(false);
  });

  it("requires explicit verification consent", () => {
    expect(educatorApplicationSchema.safeParse({ ...validApplication, verificationConsent: false }).success).toBe(false);
  });
});
