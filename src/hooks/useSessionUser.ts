import { useMe } from "../features/auth/useAuth";

/** Dipakai di dalam route yang sudah dilindungi RequireAuth. */
export function useSessionUser() {
  const { data } = useMe();
  if (!data) throw new Error("useSessionUser dipanggil di luar RequireAuth");
  return data;
}
