import { describe, expect, it } from "vitest";
import { getSuperadminSeedConfig } from "../scripts/seed-superadmin";

describe("konfigurasi seed Superadmin", () => {
  const validEnv: Record<string, string | undefined> = {
    NODE_ENV: "test",
    SUPERADMIN_SEED_PASSWORD: "a-strong-password-123",
    SUPERADMIN_SEED_USERNAME: "superadmin",
    SUPERADMIN_SEED_EMAIL: "root@deen.id",
    SUPERADMIN_SEED_NAME: "Superadmin Deen",
  };

  it("menghasilkan role SUPERADMIN tanpa kredensial hardcoded", () => {
    expect(getSuperadminSeedConfig(validEnv)).toMatchObject({
      id: "superadmin",
      username: "superadmin",
      email: "root@deen.id",
      role: "SUPERADMIN",
    });
  });

  it("menolak password kosong atau terlalu pendek", () => {
    expect(() =>
      getSuperadminSeedConfig({
        ...validEnv,
        SUPERADMIN_SEED_PASSWORD: "",
      }),
    ).toThrow();

    expect(() =>
      getSuperadminSeedConfig({
        ...validEnv,
        SUPERADMIN_SEED_PASSWORD: "short",
      }),
    ).toThrow();
  });

  it("tidak mewajibkan email jika tidak disediakan", () => {
    expect(
      getSuperadminSeedConfig({
        NODE_ENV: "test",
        SUPERADMIN_SEED_PASSWORD: validEnv.SUPERADMIN_SEED_PASSWORD,
      }).email,
    ).toBeNull();
  });
});