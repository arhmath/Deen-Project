import type { Chunk } from "./types";

/**
 * Knowledge base terkurasi tentang FITUR Deen (bukan materi keagamaan).
 * Isi harus selaras dengan perilaku backend (gamification.logic.ts, aturan bisnis SRS).
 * Materi keagamaan HANYA berasal dari course yang dibuat guru dan dokumen Firestore `knowledgeBase`
 * yang sudah ditandai reviewed=true — AI tidak boleh menjawab hukum/dalil dari pengetahuan umum model.
 */
export const DEEN_KNOWLEDGE: Chunk[] = [
  {
    id: "kb-xp-point", type: "knowledge", title: "Apa itu XP dan point",
    text: "XP (pengalaman) dan point adalah dua nilai terpisah yang didapat santri dari aktivitas belajar. XP dipakai untuk menentukan level, sedangkan point dipakai untuk peringkat leaderboard. Keduanya dihitung dan diberikan oleh server Deen, bukan oleh aplikasi di perangkat, dan tidak bisa diberikan dua kali untuk aktivitas yang sama.",
  },
  {
    id: "kb-reward", type: "knowledge", title: "Cara mendapat XP dan point",
    text: "Daily check-in memberi 10 XP dan 10 point. Menyelesaikan pelajaran memberi 5 XP. Menyelesaikan kuis memberi 20 XP, dan kuis dengan nilai sempurna memberi 30 XP. Challenge memberi 50 XP. Menyelesaikan seluruh konten sebuah course memberi bonus 100 XP. Reward diberikan sekali saat konten pertama kali selesai; mengulang kuis tidak menambah XP lagi. Guru bisa mengatur reward tertentu per konten.",
  },
  {
    id: "kb-level", type: "knowledge", title: "Level",
    text: "Level naik berdasarkan total XP. Level 1 Pemula mulai dari 0 XP, Level 2 Pencari Ilmu dari 100 XP, Level 3 Santri Rajin dari 250 XP, Level 4 Penjaga Ayat dari 500 XP, dan Level 5 Bintang Deen dari 1000 XP.",
  },
  {
    id: "kb-checkin-streak", type: "knowledge", title: "Daily check-in dan streak",
    text: "Santri bisa check-in satu kali per hari dan mendapat reward harian. Streak adalah jumlah hari berturut-turut santri check-in. Jika satu hari terlewat, streak kembali ke 1 saat check-in berikutnya. Streak terpanjang tetap tersimpan. Check-in yang diulang di hari yang sama tidak menambah reward. Tanggal dihitung berdasarkan waktu Indonesia Barat (WIB).",
  },
  {
    id: "kb-leaderboard", type: "knowledge", title: "Leaderboard",
    text: "Leaderboard menampilkan peringkat santri, secara global atau per room. Urutan berdasarkan point tertinggi, lalu XP tertinggi; jika sama, santri yang lebih dulu mencapai nilai itu berada di atas. Santri hanya bisa melihat leaderboard room yang ia ikuti.",
  },
  {
    id: "kb-join-room", type: "knowledge", title: "Cara bergabung ke room",
    text: "Room adalah ruang belajar milik guru. Untuk bergabung, santri meminta kode room dari gurunya lalu memasukkan kode itu di aplikasi Deen. Satu santri tidak bisa bergabung dua kali ke room yang sama. Setelah bergabung, course yang sudah dipublikasikan guru di room itu muncul di halaman Pembelajaran.",
  },
  {
    id: "kb-course", type: "knowledge", title: "Course, modul, dan konten",
    text: "Pembelajaran disusun sebagai course yang terdiri dari modul, dan modul terdiri dari konten seperti pelajaran, kuis, flashcard, atau challenge. Course yang masih draf tidak terlihat oleh santri; hanya course yang sudah dipublikasikan guru yang bisa dipelajari. Santri hanya melihat course dari room yang ia ikuti.",
  },
  {
    id: "kb-quiz", type: "knowledge", title: "Cara mengerjakan kuis",
    text: "Buka konten kuis di course, pilih jawaban untuk setiap pertanyaan, lalu kirim. Nilai dihitung otomatis oleh server, dan pembahasan ditampilkan setelah kuis dikirim. Kuis dianggap selesai saat pertama kali dikirim. Guru dapat membatasi jumlah kesempatan mengerjakan sebuah kuis.",
  },
  {
    id: "kb-progress", type: "knowledge", title: "Progress belajar",
    text: "Progress course dihitung dari jumlah konten yang sudah selesai dibanding total konten yang dipublikasikan. Di dashboard, bagian Lanjutkan Belajar menampilkan course yang sedang berjalan dan konten berikutnya.",
  },
  {
    id: "kb-parent", type: "knowledge", title: "Orang tua memantau anak",
    text: "Orang tua/wali dapat memantau progres, XP, streak, dan nilai kuis anak yang terhubung. Orang tua mengajukan tautan ke akun anak, lalu guru anak menyetujuinya. Orang tua hanya bisa melihat anak yang tautannya sudah disetujui dan tidak bisa mengakses santri lain.",
  },
  {
    id: "kb-roles", type: "knowledge", title: "Peran pengguna",
    text: "Deen punya tiga peran: Santri (belajar dan mengumpulkan XP), Orang Tua/Wali (memantau anak), dan Guru/Ustadz (membuat room dan course, memantau santri di room miliknya). Akun guru dibuat oleh pengelola Deen dan tidak bisa dipilih saat mendaftar.",
  },
  {
    id: "kb-notification", type: "knowledge", title: "Notifikasi",
    text: "Deen mengirim notifikasi di dalam aplikasi, misalnya saat course baru dipublikasikan, saat naik level, saat menyelesaikan course, atau saat permintaan tautan orang tua diproses.",
  },
  {
    id: "kb-chatbot", type: "knowledge", title: "Tentang asisten AI Deen",
    text: "Asisten AI Deen membantu menjelaskan fitur Deen, materi di course, serta progres belajar. Ia tidak mengubah XP, point, nilai, atau progres, dan hanya menjawab hal yang berkaitan dengan Deen. Untuk pertanyaan keagamaan, ia hanya merujuk ke materi yang tersedia di Deen dan menyarankan bertanya ke ustadz/ustadzah.",
  },
  {
    id: "kb-maps", type: "knowledge", title: "Maps",
    text: "Fitur Maps untuk menemukan lokasi belajar seperti TPA atau masjid masih disiapkan dan belum tersedia sepenuhnya.",
  },
  {
    id: "kb-account", type: "knowledge", title: "Akun, masuk, dan daftar",
    text: "Pendaftaran dilakukan sebagai Santri atau Orang Tua dengan username, kata sandi minimal 8 karakter, dan email opsional. Masuk memakai username atau email beserta kata sandi. Jangan membagikan kata sandimu kepada siapa pun, termasuk kepada asisten AI.",
  },
];
