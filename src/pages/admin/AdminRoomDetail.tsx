import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { CopyButton } from "../../components/ui/CopyButton";
import { QrCode, QrDialogButton } from "../../components/ui/QrCode";
import { roomJoinUrl } from "../../utils/deepLink";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState, PermissionDenied } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { StatusBadge } from "../../components/domain/StatusBadge";
import { fieldCls } from "../../components/ui/fieldStyles";
import { ChevronLeftIcon, PlusIcon, UsersIcon } from "../../components/ui/DashIcons";
import { CreateCourseDialog } from "../../features/admin/CreateCourseDialog";
import { useAdminRoom, useRemoveMember, useUpdateRoom } from "../../features/admin/queries";
import { ApiError, errorMessage } from "../../services/api";
import { formatNumber, timeAgo } from "../../utils/format";
import type { RoomMember } from "../../types/room";

export default function AdminRoomDetail() {
  const { roomId = "" } = useParams();
  const q = useAdminRoom(roomId);
  const update = useUpdateRoom(roomId);
  const remove = useRemoveMember(roomId);
  const [name, setName] = useState<string | null>(null);
  const [kick, setKick] = useState<RoomMember | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);

  if (q.isPending) return <div aria-busy="true" className="grid gap-4"><Skeleton className="h-24" /><Skeleton className="h-72 rounded-3xl" /></div>;
  if (q.isError) {
    if (q.error instanceof ApiError && q.error.status === 403) return <PermissionDenied message={q.error.message} />;
    const notFound = q.error instanceof ApiError && q.error.status === 404;
    return <ErrorState title={notFound ? "Room tidak ditemukan" : undefined} message={notFound ? "Room ini tidak ada." : undefined} onRetry={notFound ? undefined : () => q.refetch()} />;
  }

  const { room, members, courses } = q.data;
  const editing = name !== null;
  const nameError = update.error instanceof ApiError ? update.error.fieldErrors?.name : undefined;

  function saveName(e: FormEvent) {
    e.preventDefault();
    update.mutate({ name: name ?? "" }, { onSuccess: () => setName(null) });
  }

  return (
    <>
      <Link to="/admin/rooms" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-brand-purple-fg hover:underline">
        <ChevronLeftIcon className="h-4 w-4" /> Semua room
      </Link>
      <PageHeader
        title={room.name}
        subtitle={room.archived ? "Room ini diarsipkan: santri tidak bisa membuka course-nya dan kode gabung tidak berlaku." : undefined}
        actions={
          room.archived ? (
            <Button size="sm" variant="outline" isLoading={update.isPending} onClick={() => update.mutate({ archived: false })}>Aktifkan lagi</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setArchiving(true)}>Arsipkan room</Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="p-0">
            <div className="flex items-center justify-between gap-3 p-5 pb-3">
              <CardTitle>Anggota ({members.length})</CardTitle>
            </div>
            {members.length === 0 ? (
              <div className="p-5 pt-0">
                <EmptyState icon={<UsersIcon />} title="Belum ada anggota" description={`Bagikan kode ${room.joinCode} ke santri supaya mereka bisa bergabung.`} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <caption className="sr-only">Anggota room {room.name}</caption>
                  <thead className="border-y-2 border-brand-ink/10 bg-brand-cream/60 font-display text-xs text-brand-ink/60">
                    <tr>{["Santri", "Level", "XP", "Terakhir aktif", ""].map((h, i) => <th key={i} scope="col" className="px-4 py-3 font-bold">{h || <span className="sr-only">Aksi</span>}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-brand-ink/8">
                    {members.map((m) => (
                      <tr key={m.studentId}>
                        <th scope="row" className="px-4 py-3 font-normal">
                          <p className="font-display font-extrabold text-brand-ink">{m.name}</p>
                          <p className="text-xs text-brand-ink/50">@{m.username}</p>
                        </th>
                        <td className="px-4 py-3 font-bold">{m.level}</td>
                        <td className="px-4 py-3 font-bold">{formatNumber(m.xp)}</td>
                        <td className="px-4 py-3 text-brand-ink/65">{timeAgo(m.lastActiveAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => setKick(m)} aria-label={`Keluarkan ${m.name} dari room`} className="rounded-lg px-2 py-1 font-display text-sm font-bold text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-brand-blue">
                            Keluarkan
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between gap-3">
              <CardTitle>Course di room ini ({courses.length})</CardTitle>
              <Button size="sm" variant="outline" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setCreatingCourse(true)} disabled={room.archived}>Buat course</Button>
            </div>
            {courses.length === 0 ? (
              <p className="text-sm text-brand-ink/60">Belum ada course. Buat course pertama untuk room ini.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {courses.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-brand-cream/70 px-3 py-2.5">
                    <Link to={`/admin/courses/${c.id}`} className="min-w-0 flex-1 truncate font-display font-extrabold text-brand-ink hover:text-brand-purple-fg">{c.title}</Link>
                    <span className="text-xs text-brand-ink/55">{c.contentCount} materi</span>
                    <StatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <p className="text-sm font-semibold text-brand-ink/60">Kode gabung</p>
            <p className="mt-1 font-display text-4xl font-extrabold tracking-widest text-brand-purple-fg">{room.joinCode}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <CopyButton text={room.joinCode} label="Salin kode" />
              <QrDialogButton
                value={roomJoinUrl(room.joinCode)}
                code={room.joinCode}
                title={`QR room ${room.name}`}
                description="Santri memindai QR ini dengan kamera HP, lalu kode gabung terisi otomatis."
                filename={`qr-room-${room.joinCode}.png`}
                label="QR besar"
              />
            </div>
            <div className="mt-4 flex justify-center">
              <QrCode value={roomJoinUrl(room.joinCode)} size={168} label={`QR code gabung room ${room.name}`} />
            </div>
            <p className="mt-3 text-sm text-brand-ink/60">Santri memasukkan kode ini di dashboard atau halaman Pembelajaran mereka, atau memindai QR di atas.</p>
          </Card>

          <Card>
            <CardTitle className="mb-3">Nama room</CardTitle>
            {editing ? (
              <form onSubmit={saveName} noValidate className="flex flex-col gap-3">
                <label htmlFor="edit-nama" className="sr-only">Nama room</label>
                <input id="edit-nama" value={name ?? ""} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus aria-invalid={!!nameError} className={fieldCls} />
                {nameError && <p className="text-sm font-semibold text-red-500">{nameError}</p>}
                {update.isError && !nameError && <p role="alert" className="text-sm font-bold text-red-600">{errorMessage(update.error)}</p>}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" isLoading={update.isPending}>Simpan</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setName(null)}>Batal</Button>
                </div>
              </form>
            ) : (
              <>
                <p className="font-bold text-brand-ink">{room.name}</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setName(room.name)}>Ubah nama</Button>
              </>
            )}
            {room.archived && <Badge tone="cream" className="mt-3 px-3 py-1 text-xs">Diarsipkan</Badge>}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={!!kick}
        title="Keluarkan anggota?"
        message={`${kick?.name ?? "Santri ini"} tidak akan bisa membuka course room ini lagi. Progres belajarnya tetap tersimpan, dan ia bisa bergabung kembali dengan kode.`}
        confirmLabel="Keluarkan"
        isLoading={remove.isPending}
        onCancel={() => setKick(null)}
        onConfirm={() => kick && remove.mutate(kick.studentId, { onSettled: () => setKick(null) })}
      />
      <ConfirmDialog
        open={archiving}
        title="Arsipkan room?"
        message="Santri tidak akan bisa membuka course di room ini, dan kode gabung tidak berlaku. Kamu bisa mengaktifkannya lagi kapan saja."
        confirmLabel="Arsipkan"
        isLoading={update.isPending}
        onCancel={() => setArchiving(false)}
        onConfirm={() => update.mutate({ archived: true }, { onSettled: () => setArchiving(false) })}
      />
      <CreateCourseDialog open={creatingCourse} onClose={() => setCreatingCourse(false)} roomId={room.id} />
    </>
  );
}
