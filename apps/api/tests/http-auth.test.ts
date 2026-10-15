import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.mock("@/modules/auth/session", () => ({
  authenticate: vi.fn(async (token: string) => {
    if (token === "santri") return { id: "s1", role: "SANTRI" };
    if (token === "admin") return { id: "a1", role: "ADMIN" };
    throw new (await import("@/shared/errors")).AppError("UNAUTHORIZED", 401, "Sesi berakhir. Silakan masuk lagi.");
  }),
}));

import { protectedRoute, publicRoute, created } from "@/shared/http";
import { resetRateLimits } from "@/shared/rate-limit";
import { registerSchema } from "@/modules/auth/auth.schema";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "@/modules/auth/tokens";
import { hashPassword, verifyPassword } from "@/shared/security";

const req = (path: string, init: { method?: string; body?: string; token?: string; headers?: Record<string, string> } = {}) =>
  new NextRequest(`http://localhost/api/v1${path}`, {
    method: init.method,
    body: init.body,
    headers: { "content-type": "application/json", ...(init.token ? { authorization: `Bearer ${init.token}` } : {}), ...(init.headers ?? {}) },
  });

beforeEach(() => resetRateLimits());

describe("route wrapper", () => {
  const route = protectedRoute({ roles: ["ADMIN"], body: z.object({ name: z.string().min(3) }).strict() }, ({ body, user }) => created({ name: body.name, by: user.id }));

  it("401 tanpa token, bentuk error kompatibel frontend", async () => {
    const res = await route(req("/x", { method: "POST", body: "{}" }));
    expect(res.status).toBe(401);
    const j = await res.json();
    expect(j).toMatchObject({ success: false, message: "Sesi berakhir. Silakan masuk lagi.", error: { code: "UNAUTHORIZED" } });
    expect(res.headers.get("x-request-id")).toBeTruthy();
    expect(JSON.stringify(j)).not.toMatch(/stack|at /);
  });
  it("403 jika role tidak diizinkan (RBAC di server)", async () => {
    const res = await route(req("/x", { method: "POST", token: "santri", body: JSON.stringify({ name: "abc" }) }));
    expect(res.status).toBe(403);
  });
  it("422 + fieldErrors untuk body tidak valid / field asing", async () => {
    const bad = await route(req("/x", { method: "POST", token: "admin", body: JSON.stringify({ name: "a" }) }));
    expect(bad.status).toBe(422);
    expect((await bad.json()).fieldErrors.name).toBeTruthy();
    const extra = await route(req("/x", { method: "POST", token: "admin", body: JSON.stringify({ name: "abcd", role: "ADMIN" }) }));
    expect(extra.status).toBe(422);
  });
  it("400 untuk JSON rusak, 201 untuk sukses", async () => {
    expect((await route(req("/x", { method: "POST", token: "admin", body: "{oops" }))).status).toBe(400);
    const ok = await route(req("/x", { method: "POST", token: "admin", body: JSON.stringify({ name: "abcd" }) }));
    expect(ok.status).toBe(201);
    expect(await ok.json()).toEqual({ name: "abcd", by: "a1" });
  });
  it("path param tidak aman → 404 (anti path injection)", async () => {
    const r = protectedRoute({}, ({ params }) => ({ id: params.id }));
    const res = await r(req("/x"), { params: Promise.resolve({ id: "a/b" }) });
    expect(res.status).toBe(404);
    const ok = await r(req("/x", { token: "santri" }), { params: Promise.resolve({ id: "room-1" }) });
    expect(await ok.json()).toEqual({ id: "room-1" });
  });
  it("rate limit → 429 + Retry-After", async () => {
    const r = publicRoute({ rateLimit: [{ name: "t", limit: 2, windowMs: 60_000 }] }, () => ({ ok: true }));
    expect((await r(req("/x"))).status).toBe(200);
    expect((await r(req("/x"))).status).toBe(200);
    const res = await r(req("/x"));
    expect(res.status).toBe(429);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
  });
  it("gaya error AI: { error: string }, validasi = 400", async () => {
    const r = protectedRoute({ errorStyle: "ai", body: z.object({ message: z.string().min(1) }) }, () => ({}));
    const res = await r(req("/ai/chat", { method: "POST", token: "santri", body: JSON.stringify({ message: "" }) }));
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(typeof j.error).toBe("string");
  });
  it("error tak terduga → 500 generik tanpa detail", async () => {
    const r = protectedRoute({}, () => {
      throw new Error("Firestore secret detail");
    });
    const res = await r(req("/x", { token: "santri" }));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret detail");
  });
});

describe("registrasi publik", () => {
  const base = { name: "Budi", username: "budi_1", password: "rahasia123" };
  it("menerima SANTRI & PARENT, MENOLAK ADMIN (privilege escalation)", () => {
    expect(registerSchema.safeParse({ ...base, role: "SANTRI" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, role: "PARENT", email: "a@b.id" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, role: "ADMIN" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, role: "SANTRI", isActive: true }).success).toBe(false);
  });
  it("validasi username/password/email", () => {
    expect(registerSchema.safeParse({ ...base, role: "SANTRI", username: "a b" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, role: "SANTRI", password: "pendek" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, role: "SANTRI", email: "bukan-email" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, role: "SANTRI", email: "" }).success).toBe(true);
  });
});

describe("token & password", () => {
  it("access token round-trip; token refresh tidak bisa dipakai sebagai access (dan sebaliknya)", async () => {
    const at = await signAccessToken("u1", "PARENT");
    expect(await verifyAccessToken(at)).toEqual({ sub: "u1", role: "PARENT" });
    const rt = await signRefreshToken("u1");
    await expect(verifyAccessToken(rt.token)).rejects.toMatchObject({ status: 401 });
    await expect(verifyRefreshToken(at)).rejects.toMatchObject({ status: 401 });
    expect(await verifyRefreshToken(rt.token)).toMatchObject({ sub: "u1", jti: rt.jti, fam: rt.family });
  });
  it("menolak token yang dipalsukan", async () => {
    const at = await signAccessToken("u1", "SANTRI");
    await expect(verifyAccessToken(at.slice(0, -3) + "abc")).rejects.toMatchObject({ status: 401 });
    await expect(verifyAccessToken("bukan.token.jwt")).rejects.toMatchObject({ status: 401 });
  });
  it("hash bcrypt, bukan plaintext", async () => {
    const h = await hashPassword("rahasia123");
    expect(h).toMatch(/^\$2[aby]\$/);
    expect(await verifyPassword("rahasia123", h)).toBe(true);
    expect(await verifyPassword("salah", h)).toBe(false);
  });
});
