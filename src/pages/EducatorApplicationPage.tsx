import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/layout/Logo";
import { Button } from "../components/ui/Button";
import { ApiError } from "../services/api";
import { submitEducatorApplication, type EducatorApplicationPayload, type EducatorSubmissionResult } from "../services/educatorApplicationService";

const subjects = ["Al-Qur'an dan Tahsin", "Akidah dan Akhlak", "Fikih dan Ibadah", "Sejarah Islam", "Bahasa Arab", "Lainnya"];
const field = "mt-1 w-full rounded-2xl border-2 border-brand-ink/10 bg-white px-4 py-3 text-brand-ink outline-none transition placeholder:text-brand-ink/35 focus:border-brand-purple dark:border-white/15 dark:bg-[#2b1e3b] dark:text-white dark:placeholder:text-white/40 dark:focus:border-brand-purple";
const label = "block text-sm font-bold text-brand-ink dark:text-white";

export default function EducatorApplicationPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EducatorSubmissionResult | null>(null);
  const [error, setError] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setResult(null);
    const form = new FormData(event.currentTarget);
    if (!form.get("consent")) { setError("Persetujuan verifikasi wajib dicentang."); return; }
    if (!selectedSubjects.length) { setError("Pilih minimal satu bidang ajar."); return; }
    const payload: EducatorApplicationPayload = {
      fullName: String(form.get("fullName") ?? ""), email: String(form.get("email") ?? "").trim().toLowerCase(),
      phone: String(form.get("phone") ?? ""), institution: String(form.get("institution") ?? ""), city: String(form.get("city") ?? ""),
      education: String(form.get("education") ?? "S1") as EducatorApplicationPayload["education"], subjects: selectedSubjects,
      experience: String(form.get("experience") ?? "Belum berpengalaman") as EducatorApplicationPayload["experience"],
      motivation: String(form.get("motivation") ?? ""), evidenceUrl: String(form.get("evidenceUrl") ?? "").trim(), verificationConsent: true,
    };
    setLoading(true);
    try {
      const response = await submitEducatorApplication(payload);
      // Simulasi visual proses pemeriksaan. Keputusan akun tetap ditentukan backend.
      await new Promise((resolve) => window.setTimeout(resolve, 2600));
      setResult(response);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Pendaftaran belum berhasil dikirim. Coba lagi.");
    } finally { setLoading(false); }
  }

  async function copyCredentials() {
    if (!result?.credentials) return;
    await navigator.clipboard.writeText(`Username: ${result.credentials.username}
Password: ${result.credentials.password}`);
    setCopied(true);
  }

  return <main className="min-h-screen bg-brand-cream px-4 py-8 text-brand-ink transition-colors dark:bg-[#150d22] dark:text-white sm:px-6">
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-2"><Logo /><span className="text-sm font-bold text-brand-ink/60 transition-colors hover:text-brand-purple dark:text-white/65 dark:hover:text-white">Kembali ke beranda</span></Link>
      <section className="mt-8 rounded-[2rem] border-2 border-brand-ink/10 bg-white p-5 shadow-[0_8px_0_0_rgba(35,19,52,0.06)] transition-colors dark:border-white/10 dark:bg-[#21152f] dark:shadow-[0_8px_0_0_rgba(0,0,0,0.18)] sm:p-9">
        <span className="inline-flex rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-extrabold text-brand-purple-fg">KOLABORASI PENDIDIK</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold text-brand-ink dark:text-white sm:text-4xl">Jadilah bagian dari pengajar Deen</h1>
        <p className="mt-3 leading-7 text-brand-ink/65 dark:text-white/70">Daftarkan diri sebagai tenaga pendidik. Isi informasi dengan benar agar tim Deen dapat memeriksa identitas dan pengalaman mengajarmu.</p>

        {loading ? <div className="py-16 text-center" role="status" aria-live="polite">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-brand-purple/20 border-t-brand-purple" />
          <h2 className="mt-6 font-display text-xl font-extrabold text-brand-ink dark:text-white">Menunggu verifikasi/keaslian</h2>
          <p className="mt-2 text-sm text-brand-ink/60 dark:text-white/65">Kami sedang memproses data pendaftaranmu. Mohon tunggu sebentar…</p>
        </div> : result ? <div className="mt-7 rounded-3xl border-2 border-brand-purple/20 bg-brand-purple/5 p-5 dark:border-brand-purple/35 dark:bg-brand-purple/10 sm:p-7">
          {result.credentials ? <>
            <div className="text-3xl" aria-hidden="true">🎉</div><h2 className="mt-3 font-display text-2xl font-extrabold text-brand-ink dark:text-white">Selamat, kamu telah menjadi Ustaz/Ustazah!</h2>
            <p className="mt-2 text-sm leading-6 text-brand-ink/70 dark:text-white/75">Akun tenaga pendidik berhasil dibuat untuk simulasi. Salin kredensial ini sekarang dan simpan di tempat aman; password tidak akan ditampilkan lagi.</p>
            <div className="mt-5 space-y-3 rounded-2xl bg-white p-4 font-mono text-sm dark:bg-[#30213f]"><p><span className="font-sans text-xs font-bold text-brand-ink/50 dark:text-white/55">USERNAME</span><br/><span className="break-all font-bold">{result.credentials.username}</span></p><p><span className="font-sans text-xs font-bold text-brand-ink/50 dark:text-white/55">PASSWORD SEMENTARA</span><br/><span className="break-all font-bold">{result.credentials.password}</span></p></div>
            <Button className="mt-4 w-full" onClick={copyCredentials}>{copied ? "Kredensial tersalin" : "Salin username & password"}</Button>
            <p className="mt-3 text-xs leading-5 text-brand-ink/55 dark:text-white/60">Setelah masuk, gunakan fitur lupa password melalui Gmail yang kamu daftarkan dan ganti password sementara.</p>
          </> : <>
            <div className="text-3xl" aria-hidden="true">🕊️</div><h2 className="mt-3 font-display text-2xl font-extrabold text-brand-ink dark:text-white">Pendaftaran berhasil dikirim</h2>
            <p className="mt-2 leading-6 text-brand-ink/70 dark:text-white/75">Status: <strong>Menunggu verifikasi</strong>. Superadmin akan memeriksa data keaslianmu. Username dan password diberikan setelah pendaftaran disetujui.</p>
            <p className="mt-3 text-sm text-brand-ink/60 dark:text-white/65">Simpan ID pendaftaran ini: <code className="break-all">{result.applicationId}</code></p>
          </>}
          <Link to="/login" className="mt-5 inline-flex font-bold text-brand-purple-fg hover:underline">Ke halaman masuk →</Link>
        </div> : <form className="mt-8 space-y-5" onSubmit={submit}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={label}>Nama lengkap<input className={field} name="fullName" autoComplete="name" minLength={3} maxLength={100} required placeholder="Nama sesuai identitas" /></label>
            <label className={label}>Gmail aktif<input className={field} name="email" type="email" autoComplete="email" required placeholder="nama@gmail.com" pattern=".+@gmail\.com" title="Gunakan alamat Gmail aktif" /></label>
            <label className={label}>Nomor WhatsApp<input className={field} name="phone" type="tel" autoComplete="tel" required minLength={8} maxLength={20} placeholder="08xx atau +62xx" /></label>
            <label className={label}>Lembaga / pesantren<input className={field} name="institution" required minLength={2} maxLength={150} placeholder="Nama lembaga (atau mandiri)" /></label>
            <label className={label}>Kota / kabupaten<input className={field} name="city" required minLength={2} maxLength={100} placeholder="Contoh: Yogyakarta" /></label>
            <label className={label}>Pendidikan terakhir<select className={field} name="education" defaultValue="S1" required><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">SMA/SMK</option><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">D3</option><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">S1</option><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">S2</option><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">S3</option><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">Pesantren/Nonformal</option><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">Lainnya</option></select></label>
          </div>
          <fieldset><legend className={label}>Bidang ajar <span className="font-normal text-brand-ink/50 dark:text-white/55">(pilih minimal satu)</span></legend><div className="mt-3 grid gap-2 sm:grid-cols-2">{subjects.map((subject) => <label key={subject} className="flex items-center gap-3 rounded-2xl border-2 border-brand-ink/10 px-4 py-3 text-sm font-semibold transition-colors dark:border-white/15 dark:bg-white/[0.03] dark:text-white"><input type="checkbox" checked={selectedSubjects.includes(subject)} onChange={(e) => setSelectedSubjects((old) => e.target.checked ? [...old, subject] : old.filter((x) => x !== subject))} />{subject}</label>)}</div></fieldset>
          <label className={label}>Pengalaman mengajar<select className={field} name="experience" required><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">Belum berpengalaman</option><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">Kurang dari 1 tahun</option><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">1–3 tahun</option><option className="bg-white text-brand-ink dark:bg-[#2b1e3b] dark:text-white">Lebih dari 3 tahun</option></select></label>
          <label className={label}>Motivasi dan pengalaman relevan<textarea className={field} name="motivation" rows={4} minLength={30} maxLength={1000} required placeholder="Ceritakan alasan ingin mengajar di Deen, pengalaman, dan pendekatan mengajar yang kamu gunakan…" /></label>
          <label className={label}>Tautan bukti kompetensi / sertifikat <span className="font-normal text-brand-ink/50 dark:text-white/55">(opsional)</span><input className={field} name="evidenceUrl" type="url" maxLength={500} placeholder="https://drive.google.com/..." /><span className="mt-1 block text-xs font-normal text-brand-ink/50 dark:text-white/55">Gunakan tautan yang dapat ditinjau Superadmin. Jangan unggah data pribadi yang tidak diperlukan.</span></label>
          <label className="flex items-start gap-3 rounded-2xl bg-brand-cream p-4 text-sm leading-6 text-brand-ink/75 dark:bg-white/[0.06] dark:text-white/80"><input className="mt-1" type="checkbox" name="consent" required /><span>Saya menyatakan informasi di atas benar, bersedia dihubungi untuk verifikasi, dan memahami bahwa akun pendidik hanya dapat digunakan setelah disetujui atau selama simulasi demo.</span></label>
          {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          <Button type="submit" size="lg" className="w-full">Kirim pendaftaran tenaga pendidik</Button>
          <p className="text-center text-xs leading-5 text-brand-ink/50 dark:text-white/55">Data digunakan untuk keperluan seleksi dan verifikasi tenaga pendidik Deen.</p>
        </form>}
      </section>
    </div>
  </main>;
}
