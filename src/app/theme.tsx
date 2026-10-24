import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** "system" = ikuti pengaturan OS; "light"/"dark" = pilihan eksplisit pengguna. */
export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "deen-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const META_COLOR: Record<ResolvedTheme, string> = { light: "#fffcf3", dark: "#150d22" };

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* localStorage bisa diblokir (mode privat) — abaikan */
  }
  return "system";
}

function resolve(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  return pref;
}

/** Terapkan ke <html>. Skrip inline di index.html melakukan hal yang sama sebelum React tampil (anti-flash). */
function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOR[theme]);
}

interface ThemeContextValue {
  /** Pilihan pengguna (bisa "system"). */
  preference: ThemePreference;
  /** Tema yang benar-benar aktif saat ini. */
  theme: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
  /** Balik light ↔ dark dan simpan sebagai pilihan eksplisit. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolve(readPreference()));

  // Sinkronkan class <html> setiap pilihan berubah, dan ikuti OS bila preference === "system".
  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const sync = () => {
      const next = resolve(preference);
      setTheme(next);
      applyTheme(next);
    };
    sync();
    if (preference !== "system") return;
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [preference]);

  // Sinkron antar-tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPreferenceState(readPreference());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* abaikan */
    }
    setPreferenceState(p);
  }, []);

  const toggle = useCallback(() => setPreference(theme === "dark" ? "light" : "dark"), [theme, setPreference]);

  const value = useMemo(
    () => ({ preference, theme, setPreference, toggle }),
    [preference, theme, setPreference, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme harus dipakai di dalam <ThemeProvider>");
  return ctx;
}
