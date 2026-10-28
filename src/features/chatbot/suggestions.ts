import type { Role } from "../../types/user";

/** Contoh pertanyaan per role — semuanya berada di domain Deen (05B §12). */
export const SUGGESTIONS: Record<Role, string[]> = {
  SANTRI: ["Apa itu XP di Deen?", "Bagaimana cara mengerjakan quiz?", "Berapa XP saya sekarang?", "Bagaimana cara join room?"],
  PARENT: ["Bagaimana orang tua melihat progress anak?", "Bagaimana progress anak saya?", "Apa itu streak?"],
  ADMIN: ["Berikan ringkasan statistik belajar", "Santri mana yang perlu perhatian?", "Bagaimana struktur course dan modul?"],
  SUPERADMIN: ["Berikan ringkasan statistik belajar", "Santri mana yang perlu perhatian?", "Bagaimana struktur course dan modul?"],
};

export const MAX_MESSAGE_LENGTH = 4000;
