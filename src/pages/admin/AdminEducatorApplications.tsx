import { useEffect, useState } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ApiError } from "../../services/api";
import { decideEducatorApplication, listEducatorApplications, type EducatorApplicationItem } from "../../services/educatorApplicationService";

export default function AdminEducatorApplications() {
  const [items, setItems] = useState<EducatorApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  async function reload() { setLoading(true); setError(""); try { const r = await listEducatorApplications(); setItems(r.items); } catch (e) { setError(e instanceof ApiError ? e.message : "Gagal memuat pendaftaran."); } finally { setLoading(false); } }
  useEffect(() => { void reload(); }, []);
  async function decide(item: EducatorApplicationItem, decision: "APPROVE" | "REJECT") {
    setBusy(item.id); setError(""); setCredentials(null);
    try { const r = await decideEducatorApplication(item.id, decision); if (r.credentials) setCredentials(r.credentials); await reload(); }
    catch (e) { setError(e instanceof ApiError ? e.message : "Gagal memproses pendaftaran."); }
    finally { setBusy(null); }
  }
  return <>
    <PageHeader title="Pendaftaran tenaga pendidik" subtitle="Periksa kelengkapan data dan putuskan apakah calon Ustaz/Ustazah layak mendapatkan akun." actions={<Button variant="outline" size="sm" onClick={() => void reload()}>Muat ulang</Button>} />
    {error && <p role="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
    {credentials && <Card className="mb-5 border-brand-purple/30"><CardTitle>Akun pendidik berhasil dibuat</CardTitle><p className="mt-2 text-sm">Salin kredensial berikut sekarang. Password hanya ditampilkan sekali.</p><div className="mt-3 rounded-xl bg-brand-cream p-4 font-mono text-sm"><p>Username: <strong>{credentials.username}</strong></p><p>Password: <strong>{credentials.password}</strong></p></div><Button className="mt-3" onClick={() => void navigator.clipboard.writeText(`Username: ${credentials.username}
Password: ${credentials.password}`)}>Salin kredensial</Button></Card>}
    {loading ? <Card>Memuat data pendaftaran…</Card> : items.length === 0 ? <Card><CardTitle>Belum ada pendaftaran</CardTitle><p className="mt-2 text-sm text-brand-ink/60">Pendaftaran dari halaman publik akan muncul di sini.</p></Card> : <div className="grid gap-4">{items.map((item) => <Card key={item.id}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{item.fullName}</CardTitle><p className="mt-1 text-sm text-brand-ink/60">{item.email} · {item.phone}</p><p className="text-sm text-brand-ink/60">{item.institution}, {item.city}</p></div><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${item.status === "PENDING" ? "bg-amber-100 text-amber-800" : item.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{item.status === "PENDING" ? "Menunggu verifikasi" : item.status === "APPROVED" ? "Disetujui" : "Ditolak"}</span></div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p><strong>Pendidikan:</strong> {item.education}</p><p><strong>Pengalaman:</strong> {item.experience}</p><p className="sm:col-span-2"><strong>Bidang ajar:</strong> {item.subjects.join(", ")}</p><p className="sm:col-span-2 whitespace-pre-wrap"><strong>Motivasi:</strong> {item.motivation}</p>{item.evidenceUrl && <p className="sm:col-span-2"><strong>Bukti kompetensi:</strong> <a className="break-all text-brand-purple-fg underline" href={item.evidenceUrl} target="_blank" rel="noreferrer">Buka tautan bukti</a></p>}</div>
      {item.username && <p className="mt-3 text-sm"><strong>Username:</strong> {item.username}</p>}
      {item.reviewNote && <p className="mt-2 text-sm text-brand-ink/60">Catatan: {item.reviewNote}</p>}
      {item.status === "PENDING" && <div className="mt-5 flex flex-wrap gap-2"><Button disabled={busy === item.id} onClick={() => void decide(item, "APPROVE")}>{busy === item.id ? "Memproses…" : "Verifikasi & buat akun"}</Button><Button variant="outline" disabled={busy === item.id} onClick={() => void decide(item, "REJECT")}>Tolak pendaftaran</Button></div>}
    </Card>)}</div>}
  </>;
}
