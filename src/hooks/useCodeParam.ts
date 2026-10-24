import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Membaca kode dari query string (hasil scan QR), membersihkannya, lalu menghapus
 * parameter dari URL supaya kode tidak menempel di riwayat/bookmark.
 * Mengembalikan "" bila tidak ada.
 */
export function useCodeParam(param: string, maxLength: number): string {
  const [params, setParams] = useSearchParams();
  const [code] = useState(() =>
    (params.get(param) ?? "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, maxLength)
  );

  useEffect(() => {
    if (!params.has(param)) return;
    const next = new URLSearchParams(params);
    next.delete(param);
    setParams(next, { replace: true });
  }, [params, param, setParams]);

  return code;
}
