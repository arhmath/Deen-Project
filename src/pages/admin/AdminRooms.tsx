import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { CopyButton } from "../../components/ui/CopyButton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { FormDialog } from "../../components/ui/FormDialog";
import { Skeleton } from "../../components/ui/Skeleton";
import { fieldCls, labelCls } from "../../components/ui/fieldStyles";
import { DoorIcon, PlusIcon, UsersIcon, BookOpenIcon } from "../../components/ui/DashIcons";
import { useAdminRooms, useCreateRoom } from "../../features/admin/queries";
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

export default function AdminRooms() {
  const q = useAdminRooms();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Rooms"
        subtitle="Satu room untuk satu kelas. Bagikan kode gabung supaya santri bisa masuk."
        actions={<Button size="sm" leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setCreating(true)}>Buat room</Button>}
      />

      {q.isPending ? (
        <div aria-busy="true" className="grid gap-4 md:grid-cols-2"><Skeleton className="h-44 rounded-3xl" /><Skeleton className="h-44 rounded-3xl" /></div>
      ) : q.isError ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState
          icon={<DoorIcon />}
          title="Belum ada room"
          description="Buat room pertamamu, lalu bagikan kode gabung ke santri."
          action={<Button size="sm" onClick={() => setCreating(true)}>Buat room</Button>}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {q.data.map((r) => (
            <li key={r.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-lg font-extrabold leading-snug text-brand-ink">
                    <Link to={`/admin/rooms/${r.id}`} className="hover:text-brand-purple focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue">
                      {r.name}
                    </Link>
                  </h2>
                  {r.archived && <Badge tone="cream" className="px-3 py-1 text-xs">Diarsipkan</Badge>}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-brand-cream p-3">
                  <div>
                    <p className="text-xs font-semibold text-brand-ink/55">Kode gabung</p>
                    <p className="font-display text-2xl font-extrabold tracking-widest text-brand-purple">{r.joinCode}</p>
                  </div>
                  <CopyButton text={r.joinCode} label="Salin kode" className="ml-auto" />
                </div>

                <dl className="mt-4 flex gap-6 text-sm text-brand-ink/70">
                  <div className="flex items-center gap-1.5"><UsersIcon className="h-4 w-4" /><dt className="sr-only">Anggota</dt><dd><strong className="text-brand-ink">{r.memberCount}</strong> anggota</dd></div>
                  <div className="flex items-center gap-1.5"><BookOpenIcon className="h-4 w-4" /><dt className="sr-only">Course</dt><dd><strong className="text-brand-ink">{r.courseCount}</strong> course</dd></div>
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <CreateRoomDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
