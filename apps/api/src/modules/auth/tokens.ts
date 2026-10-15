import { SignJWT, jwtVerify } from "jose";
import { env } from "@/config/env";
import { Errors } from "@/shared/errors";
import { newId } from "@/shared/ids";
import type { Role } from "../users/user.types";

const ISSUER = "deen-api";
const key = (secret: string) => new TextEncoder().encode(secret);

export interface AccessClaims {
  sub: string;
  role: Role;
}

export async function signAccessToken(userId: string, role: Role): Promise<string> {
  const e = env();
  return new SignJWT({ role, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${e.ACCESS_TOKEN_TTL_MIN}m`)
    .sign(key(e.JWT_ACCESS_SECRET));
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  try {
    const { payload } = await jwtVerify(token, key(env().JWT_ACCESS_SECRET), {
      issuer: ISSUER,
      algorithms: ["HS256"],
    });
    if (payload.typ !== "access" || !payload.sub) throw new Error("bad token");
    return { sub: payload.sub, role: payload.role as Role };
  } catch {
    throw Errors.unauthorized();
  }
}

export interface RefreshClaims {
  sub: string;
  jti: string;
  fam: string;
}

export async function signRefreshToken(userId: string, family: string = newId()) {
  const e = env();
  const jti = newId();
  const token = await new SignJWT({ typ: "refresh", fam: family })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setJti(jti)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${e.REFRESH_TOKEN_TTL_DAYS}d`)
    .sign(key(e.JWT_REFRESH_SECRET));
  return { token, jti, family, expiresAt: new Date(Date.now() + e.REFRESH_TOKEN_TTL_DAYS * 86_400_000) };
}

export async function verifyRefreshToken(token: string): Promise<RefreshClaims> {
  try {
    const { payload } = await jwtVerify(token, key(env().JWT_REFRESH_SECRET), {
      issuer: ISSUER,
      algorithms: ["HS256"],
    });
    if (payload.typ !== "refresh" || !payload.sub || !payload.jti || typeof payload.fam !== "string") {
      throw new Error("bad token");
    }
    return { sub: payload.sub, jti: payload.jti, fam: payload.fam };
  } catch {
    throw Errors.unauthorized("Sesi berakhir. Silakan masuk lagi.");
  }
}
