/** Error aplikasi yang aman dikirim ke client (tanpa stack trace). */
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly fields?: Record<string, string>,
    public readonly headers?: Record<string, string>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  badRequest: (message = "Permintaan tidak valid.") => new AppError("BAD_REQUEST", 400, message),
  validation: (fields: Record<string, string>, message = "Data yang kamu kirim belum valid.") =>
    new AppError("VALIDATION_ERROR", 422, message, fields),
  unauthorized: (message = "Sesi berakhir. Silakan masuk lagi.") => new AppError("UNAUTHORIZED", 401, message),
  forbidden: (message = "Kamu tidak punya akses ke sumber daya ini.") => new AppError("FORBIDDEN", 403, message),
  notFound: (what = "Data") => new AppError("NOT_FOUND", 404, `${what} tidak ditemukan.`),
  conflict: (message: string, fields?: Record<string, string>) => new AppError("CONFLICT", 409, message, fields),
  tooLarge: () => new AppError("PAYLOAD_TOO_LARGE", 413, "Ukuran data terlalu besar."),
  tooMany: (retryAfterSec: number, message = "Terlalu banyak permintaan. Coba lagi sebentar lagi.") =>
    new AppError("RATE_LIMITED", 429, message, undefined, { "Retry-After": String(Math.max(1, Math.ceil(retryAfterSec))) }),
  unavailable: (message = "Layanan sedang tidak tersedia. Silakan coba kembali.") =>
    new AppError("SERVICE_UNAVAILABLE", 503, message),
};
