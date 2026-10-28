import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { Badge } from "../../components/ui/Badge";
import { CopyButton } from "../../components/ui/CopyButton";
import { QrDialogButton } from "../../components/ui/QrCode";
import { roomJoinUrl } from "../../utils/deepLink";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormDialog } from "../../components/ui/FormDialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { fieldCls, labelCls } from "../../components/ui/fieldStyles";
import { DoorIcon, PlusIcon, UsersIcon, BookOpenIcon } from "../../components/ui/DashIcons";
import { useAdminRooms, useCreateRoom, useDeleteRoom, useUpdateRoom } from "../../features/admin/queries";
import { clsx } from "../../lib/clsx";
import type { RoomAdminSummary } from "../../types/room";
import { ApiError, errorMessage } from "../../services/api";

function CreateRoomDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const create = useCreateRoom();
  const navigate = useNavigate();
  const fieldError = create.error instanceof ApiError ? create.error.fieldErrors?.name : undefined;

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate(name, {
      onSuccess: (room) => {
        setName("");
        onClose();
        navigate(`/admin/rooms/${room.id}`);
      },
    });
  }

  return (
    <FormDialog open={open} onClose={onClose} title="Buat room baru">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div>
          <label htmlFor="nama-room" className={labelCls}>Nama room</label>
          <input
            id="nama-room"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: TPA Al-Hikmah · Kelas C"
            maxLength={80}
            autoFocus
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? "nama-room-error" : undefined}
            className={fieldCls}
          />
          {fieldError && <p id="nama-room-error" className="mt-1.5 text-sm font-semibold text-red-500">{fieldError}</p>}
        </div>
        {create.isError && !fieldError && <p role="alert" className="text-sm font-bold text-red-600">{errorMessage(create.error)}</p>}
        <p className="text-sm text-brand-ink/60">Kode gabung dibuat otomatis setelah room dibuat.</p>
        <Button type="submit" fullWidth isLoading={create.isPending}>Buat room</Button>
      </form>
    </FormDialog>
  );
}

function RoomCard({ r }: { r: RoomAdminSummary }) {
  const update = useUpdateRoom(r.id);
  const del = useDeleteRoom();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <li>
      <Card className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-extrabold leading-snug text-brand-ink">
            <Link to={`/admin/rooms/${r.id}`} className="hover:text-brand-purple-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
              {r.name}
            </Link>
          </h2>
          {r.archived && <Badge tone="cream" className="px-3 py-1 text-xs">Diarsipkan</Badge>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-brand-cream p-3">
          <div>
            <p className="text-xs font-semibold text-brand-ink/55">Kode gabung</p>
            <p className="font-display text-2xl font-extrabold tracking-widest text-brand-purple-fg">{r.joinCode}</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <QrDialogButton
              value={roomJoinUrl(r.joinCode)}
              code={r.joinCode}
              title={`QR room ${r.name}`}
              description="Santri memindai QR ini dengan kamera HP, lalu kode gabung terisi otomatis."
              filename={`qr-room-${r.joinCode}.png`}
              label="QR"
            />
            <CopyButton text={r.joinCode} label="Salin kode" />
          </div>
        </div>

        <dl className="mt-4 flex gap-6 text-sm text-brand-ink/70">
          <div className="flex items-center gap-1.5"><UsersIcon className="h-4 w-4" /><dt className="sr-only">Anggota</dt><dd><strong className="text-brand-ink">{r.memberCount}</strong> anggota</dd></div>
          <div className="flex items-center gap-1.5"><BookOpenIcon className="h-4 w-4" /><dt className="sr-only">Course</dt><dd><strong className="text-brand-ink">{r.courseCount}</strong> course</dd></div>
        </dl>

        {r.archived && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t-2 border-brand-ink/10 pt-4">
            <Button size="sm" variant="outline" isLoading={update.isPending} onClick={() => update.mutate({ archived: false })}>Aktifkan lagi</Button>
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { del.reset(); setConfirmDelete(true); }}>Hapus</Button>
            {update.isError && <p role="alert" className="w-full text-sm font-bold text-red-600">{errorMessage(update.error)}</p>}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Hapus room ini?"
        message={del.isError ? errorMessage(del.error) : `“${r.name}” beserta ${r.courseCount} course di dalamnya akan dihapus dari arsip dan tidak bisa dikembalikan.`}
        confirmLabel="Hapus"
        isLoading={del.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => del.mutate(r.id, { onSuccess: () => setConfirmDelete(false) })}
      />
    </li>
  );
}

export default function AdminRooms() {
  const q = useAdminRooms();
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"ACTIVE" | "ARCHIVED">("ACTIVE");

  const all = q.data ?? [];
  const archivedCount = all.filter((r) => r.archived).length;
  const list = all.filter((r) => (tab === "ARCHIVED" ? r.archived : !r.archived));

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Satu room untuk satu kelas. Bagikan kode gabung supaya santri bisa masuk."
        actions={<Button size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setCreating(true)}>Buat room</Button>}
      />

      <div role="group" aria-label="Filter status room" className="mb-4 flex flex-wrap gap-2">
        {([["ACTIVE", "Aktif"], ["ARCHIVED", "Diarsipkan"]] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={clsx(
              "rounded-full border-2 px-4 py-2 font-display text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
              tab === value ? "border-brand-purple bg-brand-purple text-white" : "border-brand-ink/10 bg-surface text-brand-ink/70 hover:border-brand-purple/40"
            )}
          >
            {label}
            {value === "ARCHIVED" && archivedCount > 0 && <span className="ml-1.5 opacity-70">({archivedCount})</span>}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <div aria-busy="true" className="grid gap-4 md:grid-cols-2"><Skeleton className="h-44 rounded-3xl" /><Skeleton className="h-44 rounded-3xl" /></div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : list.length === 0 ? (
        tab === "ARCHIVED" ? (
          <EmptyState icon={<DoorIcon />} title="Arsip masih kosong" description="Room yang kamu arsipkan akan muncul di sini." />
        ) : (
          <EmptyState
            icon={<DoorIcon />}
            title="Belum ada room aktif"
            description="Buat room pertamamu, lalu bagikan kode gabung ke santri."
            action={<Button size="sm" onClick={() => setCreating(true)}>Buat room</Button>}
          />
        )
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((r) => <RoomCard key={r.id} r={r} />)}
        </ul>
      )}

      <CreateRoomDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
