const KEY = "deen.accessToken";

/** Hanya menyimpan token sesi. Role & hak akses SELALU dibaca dari GET /auth/me. */
export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(KEY, token);
    } catch {
      /* storage diblokir — sesi hanya berlaku selama tab terbuka */
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  },
};
