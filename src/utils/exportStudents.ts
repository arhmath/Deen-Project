import { dashboardService } from "../services/dashboardService";
import type { StudentProgress } from "../types/monitoring";

export interface ExportFilters {
  q?: string;
  room?: string;
  sort?: string;
}

/** Backend membatasi pageSize maksimal 50, jadi ambil halaman demi halaman sampai habis. */
async function fetchAllStudents(filters: ExportFilters): Promise<StudentProgress[]> {
  const pageSize = 50;
  const all: StudentProgress[] = [];
  for (let page = 1; ; page++) {
    const res = await dashboardService.adminStudents({ ...filters, page, pageSize });
    all.push(...res.items);
    if (all.length >= res.total || res.items.length === 0) break;
  }
  return all;
}

const HEADERS = [
  "No", "Nama", "Username", "Room", "Level", "Nama level", "XP", "Point", "Streak (hari)",
  "Progres course (%)", "Skor rata-rata", "Terakhir aktif", "Check-in hari ini",
];
const WIDTHS = [5, 26, 18, 24, 8, 18, 10, 10, 13, 18, 14, 20, 17];

/**
 * Unduh data monitoring santri sebagai file .xlsx.
 * Mengikuti filter yang sedang aktif (pencarian, room, urutan) dan mengambil SEMUA halaman,
 * bukan hanya halaman yang sedang tampil. Library dimuat saat dibutuhkan agar bundle awal tetap ringan.
 */
export async function exportStudentsXlsx(filters: ExportFilters): Promise<number> {
  const [students, { default: writeExcelFile }] = await Promise.all([
    fetchAllStudents(filters),
    import("write-excel-file/browser"),
  ]);

  const head = HEADERS.map((value) => ({ value, fontWeight: "bold" as const, backgroundColor: "#EDE4FF" }));
  const rows = students.map((s, i) => [
    { value: i + 1 },
    { value: s.name },
    { value: s.username },
    { value: s.roomName },
    { value: s.level },
    { value: s.levelName },
    { value: s.xp },
    { value: s.point },
    { value: s.streak },
    { value: s.courseProgress },
    { value: s.avgScore },
    { value: new Date(s.lastActiveAt), format: "dd/mm/yyyy hh:mm" },
    { value: s.checkedInToday ? "Sudah" : "Belum" },
  ]);

  const date = new Date().toISOString().slice(0, 10);
  await writeExcelFile([head, ...rows], { columns: WIDTHS.map((width) => ({ width })) }).toFile(`monitoring-santri-${date}.xlsx`);
  return students.length;
}
