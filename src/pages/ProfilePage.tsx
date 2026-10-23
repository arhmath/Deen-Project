import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { XPProgress } from "../components/domain/XPProgress";
import { Skeleton } from "../components/ui/Skeleton";
import { useSessionUser } from "../hooks/useSessionUser";
import { authService } from "../services/authService";
import { ME_KEY } from "../features/auth/useAuth";
import { ApiError } from "../services/api";
import { useLinkCode, useSantriDashboard } from "../features/dashboard/queries";
import { CopyButton } from "../components/ui/CopyButton";
import { USE_MOCK } from "../services/api";
import { resetMockState } from "../services/mock/server";
import { ROLE_LABEL } from "../types/user";
import { initials } from "../utils/format";

export default function ProfilePage() {
  const user = useSessionUser();
  const qc = useQueryClient();
  const dash = useSantriDashboard(user.role === "SANTRI");
  const link = useLinkCode(user.role === "SANTRI");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl ?? "");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { setName(user.name); setAvatarUrl(user.avatarUrl ?? ""); setAvatarPreview(user.avatarUrl ?? ""); }, [user.name, user.avatarUrl]);

  async function selectAvatar(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setProfileError("Format foto tidak didukung. Pilih JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Ukuran foto terlalu besar. Maksimal 2 MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(previewUrl);
      if (image.naturalWidth > 4096 || image.naturalHeight > 4096) {
        setProfileError("Resolusi foto terlalu tinggi. Pilih foto maksimal 4096 × 4096 piksel.");
        return;
      }
      setProfileError("");
      setEditing(true);
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    };
    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      setProfileError("Foto tidak dapat dibaca. Silakan pilih file gambar lain.");
    };
    image.src = previewUrl;
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setProfileError("Nama harus terdiri dari 2–100 karakter.");
      return;
    }
    const trimmedAvatarUrl = avatarUrl.trim();
    if (trimmedAvatarUrl && !(USE_MOCK && /^data:image\/(jpeg|png|webp);base64,/i.test(trimmedAvatarUrl))) {
      try {
        const parsedUrl = new URL(trimmedAvatarUrl);
        if (parsedUrl.protocol !== "https:") throw new Error("URL harus HTTPS");
      } catch {
        setProfileError("Foto profil tidak valid. Pilih foto dari perangkat lalu coba lagi.");
        return;
      }
    }
    setSaving(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      let finalAvatarUrl = trimmedAvatarUrl || null;
      if (avatarFile) {
        const uploaded = await authService.uploadAvatar(avatarFile);
        finalAvatarUrl = uploaded.avatarUrl;
      }
      const updated = await authService.updateMe({ name: trimmedName, avatarUrl: finalAvatarUrl });
      qc.setQueryData(ME_KEY, updated);
      setName(updated.name);
      setAvatarUrl(updated.avatarUrl ?? "");
      setAvatarPreview(updated.avatarUrl ?? "");
      setAvatarFile(null);
      setEditing(false);
      setProfileSuccess("Profil berhasil diperbarui.");
      await qc.invalidateQueries();
    } catch (error) {
      setProfileError(error instanceof ApiError ? error.message : "Profil gagal diperbarui. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  function resetDemo() {
    resetMockState();
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader title="Profil" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0">
              <input
                ref={avatarInputRef}
                id="profile-avatar-file"
                name="avatarFile"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Pilih foto profil"
                disabled={saving}
                onChange={(event) => {
                  void selectAvatar(event.target.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  setProfileError("");
                  setProfileSuccess("");
                  avatarInputRef.current?.click();
                }}
                disabled={saving}
                aria-label="Ganti foto profil"
                title="Ganti foto profil"
                className="relative grid h-16 w-16 place-items-center overflow-visible rounded-full bg-brand-amber font-display text-2xl font-extrabold text-brand-ink ring-1 ring-brand-ink/10 focus-visible:outline-2 focus-visible:outline-brand-blue disabled:opacity-60"
              >
                <span className="absolute inset-0 grid place-items-center overflow-hidden rounded-full">
                  {avatarPreview ? <img src={avatarPreview} alt={`Foto profil ${user.name}`} className="h-full w-full object-cover" /> : initials(user.name)}
                </span>
                <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-brand-purple text-white shadow-sm" aria-hidden="true">
                  <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 4.5 15.5 8.5M3.5 16.5l3.6-.7L16 6.9a2.1 2.1 0 0 0-3-3l-8.9 8.9-.6 3.7Z" /></svg>
                </span>
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-xl font-extrabold">{user.name}</p>
              <p className="text-sm text-brand-ink/60">{ROLE_LABEL[user.role]}</p>
            </div>
            {!editing && <button type="button" onClick={() => { setName(user.name); setAvatarUrl(user.avatarUrl ?? ""); setEditing(true); setProfileError(""); setProfileSuccess(""); }} className="rounded-xl border-2 border-brand-ink/10 px-3 py-2 text-sm font-bold hover:bg-brand-purple/5">Edit profil</button>}
          </div>
          {editing ? (
            <form className="mt-5 space-y-4" onSubmit={saveProfile}>
              <div>
                <label className="mb-1 block text-sm font-bold" htmlFor="profile-name">Nama lengkap</label>
                <input id="profile-name" name="name" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required className="w-full rounded-xl border-2 border-brand-ink/15 bg-white px-4 py-3 outline-none focus:border-brand-purple" />
              </div>
              <p className="text-xs text-brand-ink/55">Foto dipilih melalui ikon pensil pada avatar di bagian atas. Format JPG, PNG, atau WebP · Maks. 2 MB.</p>
              <p className="text-xs text-brand-ink/55">Username dan email tidak dapat diubah dari halaman ini.</p>
              {profileError && <p role="alert" className="text-sm font-semibold text-red-600">{profileError}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={saving} className="rounded-xl bg-brand-purple px-4 py-2 font-bold text-white disabled:opacity-60">{saving ? "Menyimpan…" : "Simpan perubahan"}</button>
                <button type="button" disabled={saving} onClick={() => { setEditing(false); setName(user.name); setAvatarUrl(user.avatarUrl ?? ""); setAvatarPreview(user.avatarUrl ?? ""); setAvatarFile(null); setProfileError(""); }} className="rounded-xl border-2 border-brand-ink/10 px-4 py-2 font-bold">Batal</button>
              </div>
            </form>
          ) : (
            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              <dt className="font-bold text-brand-ink/55">Username</dt><dd>{user.username}</dd>
              {user.email && (<><dt className="font-bold text-brand-ink/55">Email</dt><dd className="break-all">{user.email}</dd></>)}
            </dl>
          )}
          {profileSuccess && <p role="status" className="mt-3 text-sm font-semibold text-green-700">{profileSuccess}</p>}
        </Card>

        {user.role === "SANTRI" && (
          <Card>
            <CardTitle className="mb-4">Level kamu</CardTitle>
            {dash.data ? (
              <>
                <p className="mb-3 font-display text-2xl font-extrabold text-brand-purple">Level {dash.data.gamification.level.level} · {dash.data.gamification.level.name}</p>
                <XPProgress level={dash.data.gamification.level} xp={dash.data.gamification.xp} />
              </>
            ) : <Skeleton className="h-20" />}
          </Card>
        )}

        {user.role === "SANTRI" && (
          <Card className="lg:col-span-2">
            <CardTitle>Kode untuk orang tua</CardTitle>
            <p className="mb-3 mt-1 text-sm text-brand-ink/60">
              Berikan kode ini ke orang tuamu. Mereka memasukkannya di akun Deen mereka untuk memantau belajarmu.
            </p>
            {link.data ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="rounded-2xl bg-brand-cream px-4 py-2 font-display text-2xl font-extrabold tracking-widest text-brand-purple">{link.data.code}</p>
                <CopyButton text={link.data.code} label="Salin kode" />
              </div>
            ) : link.isError ? (
              <p role="alert" className="text-sm font-bold text-red-600">Kode belum bisa dimuat. Muat ulang halaman ya.</p>
            ) : (
              <Skeleton className="h-12 w-60" />
            )}
          </Card>
        )}

        {USE_MOCK && (
          <Card className="lg:col-span-2">
            <CardTitle>Mode demo</CardTitle>
            <p className="mb-4 mt-1 text-sm text-brand-ink/60">Data saat ini berasal dari mock lokal di browser ini. Reset mengembalikan progres, room, course, dan keterhubungan orang tua ke data awal. Akun yang sudah kamu daftarkan tetap ada.</p>
            <Button size="sm" variant="outline" onClick={resetDemo}>Reset data demo</Button>
          </Card>
        )}
      </div>
    </>
  );
}
