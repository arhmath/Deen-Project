import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (Next 16; pengganti middleware.ts): CORS allowlist + security headers untuk seluruh /api/*.
 * Dibaca langsung dari process.env (tanpa import modul berat).
 */
export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowed = (process.env.CORS_ORIGIN ?? "https://web-deen.vercel.app")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const originOk = !!origin && allowed.includes(origin);

  const headers = new Headers();
  headers.set("Vary", "Origin");
  if (originOk) {
    headers.set("Access-Control-Allow-Origin", origin!);
    headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization,Content-Type,Idempotency-Key,X-Request-Id");
    headers.set("Access-Control-Expose-Headers", "X-Request-Id,Retry-After");
    headers.set("Access-Control-Max-Age", "600");
  }
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  }

  if (req.method === "OPTIONS") return new NextResponse(null, { status: 204, headers });

  const res = NextResponse.next();
  headers.forEach((v, k) => res.headers.set(k, v));
  return res;
}

export const config = { matcher: "/api/:path*" };