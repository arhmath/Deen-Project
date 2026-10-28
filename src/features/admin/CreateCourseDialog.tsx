import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { FormDialog } from "../../components/ui/FormDialog";
import { fieldCls, labelCls } from "../../components/ui/fieldStyles";
import { ApiError, errorMessage } from "../../services/api";
import { useAdminRooms, useCreateCourse } from "./queries";
import { adminService } from "../../services/adminService";
import { COURSE_CATEGORIES, COURSE_TEMPLATES, instantiateCourseTemplate, templatesByCategory } from "./courseTemplates";

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
  const [categoryId, setCategoryId] = useState("");
  const [templateId, setTemplateId] = useState("");

  const activeRooms = (rooms.data ?? []).filter((r) => !r.archived);
  const selectedRoom = roomId ?? (pickedRoom || activeRooms[0]?.id || "");
  const categoryTemplates = categoryId ? templatesByCategory(categoryId) : [];
  const titleError = create.error instanceof ApiError ? create.error.fieldErrors?.title : undefined;

  /** Pilih template; judul/deskripsi yang tadinya terisi otomatis dari template lain ikut dibersihkan. */
  function selectTemplate(nextId: string) {
    const previous = COURSE_TEMPLATES.find((item) => item.id === templateId);
    const next = COURSE_TEMPLATES.find((item) => item.id === nextId);
    setTemplateId(nextId);
    if (next) {
      setTitle(next.title);
      setDescription(next.description);
    } else if (previous) {
      if (title === previous.title) setTitle("");
      if (description === previous.description) setDescription("");
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate(
      { roomId: selectedRoom, title, description },
      {
        onSuccess: async (course) => {
          const template = COURSE_TEMPLATES.find((item) => item.id === templateId);
          try {
            if (template) {
              const seededCourse = instantiateCourseTemplate(template, {
                ...course,
                roomName: activeRooms.find((room) => room.id === selectedRoom)?.name ?? "",
                title,
                description,
                status: "DRAFT",
                modules: [],
                updatedAt: new Date().toISOString(),
              });
              await adminService.saveCourse(course.id, seededCourse);
            }
          } catch {
            // Course tetap dibuat; pengajar bisa membuka editor dan menyimpan ulang.
          }
          setTitle("");
          setDescription("");
          setCategoryId("");
          setTemplateId("");
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
          <label htmlFor="course-kategori" className={labelCls}>Kategori</label>
          <select
            id="course-kategori"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              selectTemplate("");
            }}
            className={fieldCls}
          >
            <option value="">Tanpa kategori — course kosong</option>
            {COURSE_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
          <p className="mt-1.5 text-sm text-brand-ink/60">Pilih kategori untuk melihat materi default yang bisa langsung dipakai.</p>
        </div>
        {categoryId && (
          <div>
            <label htmlFor="course-template" className={labelCls}>Isi materi default (opsional)</label>
            <select
              id="course-template"
              value={templateId}
              onChange={(e) => selectTemplate(e.target.value)}
              className={fieldCls}
            >
              <option value="">Course kosong — buat sendiri</option>
              {categoryTemplates.map((template) => (
                <option key={template.id} value={template.id}>{template.title}</option>
              ))}
            </select>
            <p className="mt-1.5 text-sm text-brand-ink/60">Materi default berisi modul, materi, kartu hafalan, dan kuis yang bisa diedit sebelum dipublikasikan.</p>
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
