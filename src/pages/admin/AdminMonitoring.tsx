import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Badge } from "../../components/ui/Badge";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, UsersIcon } from "../../components/ui/DashIcons";
import { FlameIcon } from "../../components/landing/DecorativeIcons";
import { useAdminStudents } from "../../features/dashboard/queries";
import { clsx } from "../../lib/clsx";
import { formatNumber, timeAgo } from "../../utils/format";
import { exportStudentsXlsx } from "../../utils/exportStudents";
import { errorMessage } from "../../services/api";

const PAGE_SIZE = 8;
const SORTS = [
  { value: "xp", label: "XP tertinggi" },
  { value: "progress", label: "Progres tertinggi" },
  { value: "streak", label: "Streak terpanjang" },
  { value: "lastActive", label: "Paling lama tidak aktif" },
  { value: "name", label: "Nama (A–Z)" },
];

const field = "rounded-2xl border-2 border-brand-ink/10 bg-surface px-4 py-2.5 font-body text-sm text-brand-ink outline-none focus:border-brand-blue";

export default function AdminMonitoring() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [room, setRoom] = useState("");
  const [sort, setSort] = useState("xp");
  const [page, setPage] = useState(1);

  // debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => { setQ(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const query = useAdminStudents({ page, pageSize: PAGE_SIZE, q, room, sort });
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportMsg(null);
    try {
      const n = await exportStudentsXlsx({ q, room, sort });
      setExportMsg(n === 0 ? { ok: false, text: "Tidak ada data santri untuk diunduh." } : { ok: true, text: `${n} santri berhasil diunduh.` });
    } catch (e) {
      setExportMsg({ ok: false, text: errorMessage(e, "Gagal membuat spreadsheet. Coba lagi ya.") });
    } finally {
      setExporting(false);
    }
  }
  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <PageHeader
        title="Monitoring santri"
        subtitle="Pantau XP, streak, progres, dan skor setiap santri."
        actions={<Button size="sm" variant="outline" isLoading={exporting} onClick={handleExport}>Unduh spreadsheet</Button>}
      />
      <div aria-live="polite">
        {exportMsg && <p role={exportMsg.ok ? "status" : "alert"} className={clsx("mb-3 text-sm font-bold", exportMsg.ok ? "text-green-700" : "text-red-600")}>{exportMsg.text}</p>}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <label htmlFor="cari" className="sr-only">Cari santri</label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-ink/40" />
          <input id="cari" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau username" className={clsx(field, "w-full pl-11")} />
        </div>
        <div>
          <label htmlFor="room" className="sr-only">Filter room</label>
          <select id="room" value={room} onChange={(e) => { setRoom(e.target.value); setPage(1); }} className={field}>
            <option value="">Semua room</option>
            {(query.data?.rooms ?? []).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="sr-only">Urutkan</label>
          <select id="sort" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className={field}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <Card className="p-0">
        {query.isPending ? (
          <div className="flex flex-col gap-2 p-4" aria-busy="true">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : query.isError ? (
          <div className="p-4"><ErrorState onRetry={() => query.refetch()} /></div>
        ) : query.data.items.length === 0 ? (
          <div className="p-4"><EmptyState icon={<UsersIcon />} title="Santri tidak ditemukan" description="Coba kata kunci lain atau ubah filter room." /></div>
        ) : (
          <>
            <div className={clsx("overflow-x-auto", query.isPlaceholderData && "opacity-60")}>
              <table className="w-full min-w-[56rem] text-left text-sm">
                <caption className="sr-only">Daftar progres santri</caption>
                <thead className="border-b-2 border-brand-ink/10 bg-brand-cream/60 font-display text-xs text-brand-ink/60">
                  <tr>
                    {["Santri", "Level", "XP", "Point", "Streak", "Progres course", "Skor", "Terakhir aktif", "Check-in"].map((h) => (
                      <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-ink/8">
                  {query.data.items.map((s) => (
                    <tr key={s.id} className="hover:bg-brand-purple/4">
                      <th scope="row" className="px-4 py-3 font-normal">
                        <p className="font-display font-extrabold text-brand-ink">{s.name}</p>
                        <p className="text-xs text-brand-ink/50">{s.roomName}</p>
                      </th>
                      <td className="px-4 py-3 font-bold">{s.level}</td>
                      <td className="px-4 py-3 font-bold">{formatNumber(s.xp)}</td>
                      <td className="px-4 py-3">{formatNumber(s.point)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 font-bold"><FlameIcon className={clsx("h-4 w-4", s.streak ? "text-brand-amber" : "text-brand-ink/20")} aria-hidden="true" />{s.streak}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={s.courseProgress} label={`Progres ${s.name}`} tone="blue" className="w-24" />
                          <span className="w-9 text-xs font-bold text-brand-ink/60">{s.courseProgress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold">{s.avgScore}</td>
                      <td className="px-4 py-3 text-brand-ink/65">{timeAgo(s.lastActiveAt)}</td>
                      <td className="px-4 py-3"><Badge tone={s.checkedInToday ? "amber" : "cream"} className="px-2.5 py-1 text-xs">{s.checkedInToday ? "Sudah" : "Belum"}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav aria-label="Halaman monitoring" className="flex items-center justify-between gap-3 border-t-2 border-brand-ink/10 p-3">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} leftIcon={<ChevronLeftIcon className="h-4 w-4" />}>Sebelumnya</Button>
              <p className="text-sm font-bold text-brand-ink/60">Halaman {page} dari {totalPages} · {query.data.total} santri</p>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} rightIcon={<ChevronRightIcon className="h-4 w-4" />}>Berikutnya</Button>
            </nav>
          </>
        )}
      </Card>
    </>
  );
}
