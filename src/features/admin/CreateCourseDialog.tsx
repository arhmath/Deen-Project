import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { FormDialog } from "../../components/ui/FormDialog";
import { fieldCls, labelCls } from "../../components/ui/fieldStyles";
import { ApiError, errorMessage } from "../../services/api";
import { useAdminRooms, useCreateCourse } from "./queries";

/** Buat course baru (selalu DRAFT). `roomId` diisi jika dibuka dari halaman room. */
export function CreateCourseDialog({
  open,
  onClose,
  roomId,
}: {
  open: boolean;
  onClose: () => void;
  roomId?: string;
}) {
  const rooms = useAdminRooms();
  const create = useCreateCourse();
  const navigate = useNavigate();
  const [pickedRoom, setPickedRoom] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const activeRooms = (rooms.data ?? []).filter((r) => !r.archived);
  const selectedRoom = roomId ?? (pickedRoom || activeRooms[0]?.id || "");
  const titleError = create.error instanceof ApiError ? create.error.fieldErrors?.title : undefined;

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate(
      { roomId: selectedRoom, title, description },
      {
        onSuccess: (course) => {
          setTitle("");
          setDescription("");
          onClose();
          navigate(`/admin/courses/${course.id}`);
        },
      }
    );
  }

  return (
    <FormDialog open={open} onClose={onClose} title="Buat course baru">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {!roomId && (
          <div>
            <label htmlFor="course-room" className={labelCls}>Room</label>
            <select id="course-room" value={selectedRoom} onChange={(e) => setPickedRoom(e.target.value)} className={fieldCls}>
              {activeRooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            {activeRooms.length === 0 && <p className="mt-1.5 text-sm text-brand-ink/60">Buat room dulu sebelum membuat course.</p>}
          </div>
        )}
        <div>
          <label htmlFor="course-judul" className={labelCls}>Judul course</label>
          <input
            id="course-judul"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Fikih Dasar untuk Anak"
            maxLength={120}
            autoFocus
            aria-invalid={!!titleError}
            aria-describedby={titleError ? "course-judul-error" : undefined}
            className={fieldCls}
          />
          {titleError && <p id="course-judul-error" className="mt-1.5 text-sm font-semibold text-red-500">{titleError}</p>}
        </div>
        <div>
          <label htmlFor="course-deskripsi" className={labelCls}>Deskripsi singkat (opsional)</label>
          <textarea id="course-deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={500} className={fieldCls} />
        </div>
        {create.isError && !titleError && <p role="alert" className="text-sm font-bold text-red-600">{errorMessage(create.error)}</p>}
        <p className="text-sm text-brand-ink/60">Course baru berstatus Draft dan belum terlihat oleh santri sampai kamu mempublikasikannya.</p>
        <Button type="submit" fullWidth isLoading={create.isPending} disabled={!selectedRoom}>Buat course</Button>
      </form>
    </FormDialog>
  );
}
