import { NextResponse, type NextRequest } from "next/server";
import { z as zod, ZodError, type ZodType, type z } from "zod";
import { authenticate } from "@/modules/auth/session";
import type { AuthUser, Role } from "@/modules/users/user.types";
import { AppError, Errors } from "./errors";
import { SAFE_ID, newId } from "./ids";
import { logger } from "./logger";
import { consume, type RateRule } from "./rate-limit";

export type { AuthUser, Role };

// Pesan validasi bawaan zod dalam Bahasa Indonesia (pesan kustom di skema tetap diutamakan).
zod.config(zod.locales.id());

/** Hasil handler dengan status/header khusus. */
export class HttpResult {
  constructor(
    public readonly status: number,
    public readonly body?: unknown,
    public readonly headers: Record<string, string> = {}
  ) {}
}
export const created = (body: unknown) => new HttpResult(201, body);
export const noContent = () => new HttpResult(204);

export interface RequestMeta {
  requestId: string;
  ip: string;
  method: string;
  path: string;
}

type Infer<T> = T extends ZodType ? z.output<T> : undefined;

export interface Ctx<B, Q, U> {
  req: NextRequest;
  user: U;
  body: Infer<B>;
  query: Infer<Q>;
  params: Record<string, string>;
  meta: RequestMeta;
}

interface Opts<B, Q> {
  body?: B;
  query?: Q;
  rateLimit?: RateRule[];
  /** "ai" → bentuk error { error: string } sesuai 05B-AI-ARCHITECTURE §25 (validasi = 400). */
  errorStyle?: "default" | "ai";
  maxBodyBytes?: number;
}

type RouteContext = { params?: Promise<Record<string, string | string[]>> };
type Handler<B, Q, U> = (ctx: Ctx<B, Q, U>) => Promise<unknown> | unknown;

const DEFAULT_MAX_BODY = 1_000_000; // 1 MB

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function zodFields(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

async function readBody<B extends ZodType>(req: NextRequest, schema: B, maxBytes: number): Promise<z.output<B>> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw Errors.tooLarge();
  const text = await req.text();
  if (text.length > maxBytes) throw Errors.tooLarge();
  let json: unknown;
  try {
    json = text.length ? JSON.parse(text) : {};
  } catch {
    throw Errors.badRequest("Body harus berupa JSON yang valid.");
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw Errors.validation(zodFields(parsed.error));
  return parsed.data;
}

function errorResponse(err: unknown, style: "default" | "ai", requestId: string) {
  let app: AppError;
  if (err instanceof AppError) app = err;
  else if (err instanceof ZodError) app = Errors.validation(zodFields(err));
  else app = new AppError("INTERNAL_ERROR", 500, "Terjadi kesalahan pada server. Coba lagi ya.");

  let status = app.status;
  if (style === "ai" && status === 422) status = 400;

  const body =
    style === "ai"
      ? { error: app.message, message: app.message, code: app.code, ...(app.fields ? { fieldErrors: app.fields } : {}) }
      : {
          success: false,
          // frontend membaca `message` / `error.message` / `fieldErrors` (services/api.ts)
          message: app.message,
          error: { code: app.code, message: app.message },
          ...(app.fields ? { fieldErrors: app.fields } : {}),
        };
  return { status, body, headers: app.headers ?? {} };
}

async function execute<B extends ZodType | undefined, Q extends ZodType | undefined, U>(
  req: NextRequest,
  routeCtx: RouteContext | undefined,
  opts: Opts<B, Q>,
  auth: { required: boolean; roles?: Role[] },
  handler: Handler<B, Q, U>
): Promise<Response> {
  const started = Date.now();
  const url = new URL(req.url);
  const meta: RequestMeta = {
    requestId: req.headers.get("x-request-id")?.slice(0, 64) || newId(),
    ip: clientIp(req),
    method: req.method,
    path: url.pathname,
  };
  const style = opts.errorStyle ?? "default";
  let status = 500;
  let errorCode: string | undefined;
  let actorId: string | undefined;
  let res: NextResponse;

  try {
    // path params — hanya karakter aman (mencegah path injection ke Firestore)
    const rawParams = (await routeCtx?.params) ?? {};
    const params: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawParams)) {
      const s = Array.isArray(v) ? v[0] ?? "" : v;
      if (!SAFE_ID.test(s)) throw Errors.notFound();
      params[k] = s;
    }

    // rate limit berbasis IP dijalankan sebelum autentikasi
    for (const rule of opts.rateLimit ?? []) {
      if ((rule.by ?? "ip") === "ip") consume(`${rule.name}:ip:${meta.ip}`, rule.limit, rule.windowMs);
    }

    let user: AuthUser | undefined;
    if (auth.required) {
      const header = req.headers.get("authorization") ?? "";
      const m = /^Bearer\s+(.+)$/i.exec(header);
      if (!m) throw Errors.unauthorized();
      user = await authenticate(m[1]!);
      actorId = user.id;
      if (auth.roles && !auth.roles.includes(user.role)) throw Errors.forbidden();
      for (const rule of opts.rateLimit ?? []) {
        if (rule.by === "user") consume(`${rule.name}:user:${user.id}`, rule.limit, rule.windowMs);
      }
    }

    const query = (opts.query
      ? (() => {
          const parsed = opts.query.safeParse(Object.fromEntries(url.searchParams));
          if (!parsed.success) throw Errors.validation(zodFields(parsed.error));
          return parsed.data;
        })()
      : undefined) as Infer<Q>;
    const body = (opts.body ? await readBody(req, opts.body, opts.maxBodyBytes ?? DEFAULT_MAX_BODY) : undefined) as Infer<B>;

    const out = await handler({ req, user: user as U, body, query, params, meta });

    if (out instanceof HttpResult) {
      status = out.status;
      res = out.status === 204 ? new NextResponse(null, { status: 204 }) : NextResponse.json(out.body ?? null, { status: out.status });
      for (const [k, v] of Object.entries(out.headers)) res.headers.set(k, v);
    } else {
      status = 200;
      res = NextResponse.json(out ?? null, { status: 200 });
    }
  } catch (err) {
    const r = errorResponse(err, style, meta.requestId);
    status = r.status;
    errorCode = (r.body as { code?: string; error?: { code?: string } }).code ?? (r.body as { error?: { code?: string } }).error?.code;
    if (status >= 500) {
      logger.error("unhandled_error", { requestId: meta.requestId, path: meta.path, err: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : String(err) });
    }
    res = NextResponse.json(r.body, { status: r.status });
    for (const [k, v] of Object.entries(r.headers)) res.headers.set(k, v);
  }

  res.headers.set("x-request-id", meta.requestId);
  res.headers.set("Cache-Control", "no-store");
  logger.info("request", { requestId: meta.requestId, method: meta.method, path: meta.path, status, durationMs: Date.now() - started, errorCode, actorId });
  return res;
}

/** Route yang butuh login. `roles` membatasi role; pemeriksaan kepemilikan dilakukan di service. */
export function protectedRoute<B extends ZodType | undefined = undefined, Q extends ZodType | undefined = undefined>(
  opts: Opts<B, Q> & { roles?: Role[] },
  handler: Handler<B, Q, AuthUser>
) {
  return (req: NextRequest, routeCtx?: RouteContext) =>
    execute<B, Q, AuthUser>(req, routeCtx, opts, { required: true, roles: opts.roles }, handler);
}

/** Route publik (login, register, health). */
export function publicRoute<B extends ZodType | undefined = undefined, Q extends ZodType | undefined = undefined>(
  opts: Opts<B, Q>,
  handler: Handler<B, Q, undefined>
) {
  return (req: NextRequest, routeCtx?: RouteContext) => execute<B, Q, undefined>(req, routeCtx, opts, { required: false }, handler);
}
