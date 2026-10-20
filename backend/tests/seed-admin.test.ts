import { describe, expect, it } from "vitest";

import { ADMIN_SEED, getAdminSeedConfig } from "../scripts/seed-admin";

describe("seed admin", () => {
  it("menggunakan username dan password default admin yang diminta", () => {
    expect(getAdminSeedConfig()).toMatchObject({
      id: "admin",
      username: "admin",
      password: "1234567890",
      role: "ADMIN",
    });

    expect(ADMIN_SEED).toMatchObject({
      username: "admin",
      password: "1234567890",
      role: "ADMIN",
    });
  });
});
