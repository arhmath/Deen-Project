/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "false" → pakai backend asli (VITE_API_URL). Default: mock lokal. */
  readonly VITE_USE_MOCK?: string;
  /** Base URL REST API, mis. https://api.deen.id/api/v1 */
  readonly VITE_API_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
