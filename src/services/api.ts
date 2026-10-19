import { tokenStore } from "./tokenStore";
import { mockRequest } from "./mock/server";

/**
 * Satu-satunya pintu HTTP di frontend (lihat 06-FRONTEND-ARCHITECTURE.md §6).
 * - VITE_USE_MOCK != "false" → pakai mock server lokal (default, untuk demo/lomba)
 * - VITE_USE_MOCK = "false"  → fetch ke VITE_API_URL
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export interface RequestOptions {
  params?: Record<string, string | number | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function cleanParams(params?: RequestOptions["params"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== null && v !== "") out[k] = String(v);
  }
  return out;
}

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  opts: RequestOptions = {}
): Promise<T> {
  const token = tokenStore.get();
  const params = cleanParams(opts.params);

  if (USE_MOCK) {
    return mockRequest<T>({ method, path, params, body, token, headers: opts.headers });
  }

  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE_URL}${path}${qs ? `?${qs}` : ""}`, {
    method,
    signal: opts.signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      data?.message ?? data?.error?.message ?? "Terjadi kesalahan. Coba lagi ya.",
      res.status,
      data?.fieldErrors
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, body, opts),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>("DELETE", path, undefined, opts),
};

/** Pesan error yang aman ditampilkan ke pengguna. */
export const errorMessage = (e: unknown, fallback = "Terjadi kesalahan. Coba lagi ya.") =>
  e instanceof ApiError ? e.message : fallback;
