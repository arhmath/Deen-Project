/**
 * KONTEN CONTOH (dummy) untuk course, materi, flashcard, dan bank soal.
 * Struktur ini meniru Course → Module → Content di SRS. Ganti isinya dengan
 * materi final; tipe konten dibuat extensible (tambah tipe baru di ContentType).
 */
import type { ContentType } from "../../types/learning";

export interface ContentDef {
  id: string;
  title: string;
  type: ContentType;
}
export interface ModuleDef {
  id: string;
  title: string;
  contents: ContentDef[];
}
export interface CourseDef {
  id: string;
  title: string;
  description: string;
  modules: ModuleDef[];
}

const L = (id: string, title: string): ContentDef => ({ id, title, type: "LESSON" });
const F = (id: string, title: string): ContentDef => ({ id, title, type: "FLASHCARD" });
const Q = (id: string, title: string): ContentDef => ({ id, title, type: "QUIZ" });

export const COURSE_DEFS: CourseDef[] = [
  {
    id: "c1",
    title: "Mengenal Huruf Hijaiyah",
    description: "Kenali bentuk dan bunyi huruf satu per satu.",
    modules: [
      { id: "c1-m1", title: "Huruf-huruf awal", contents: [L("c1-1", "Mengenal Alif dan Ba"), L("c1-2", "Ta dan Tsa"), F("c1-3", "Kartu Huruf 1"), Q("c1-4", "Kuis Huruf Hijaiyah 1"), L("c1-5", "Jim, Ha, dan Kha")] },
      { id: "c1-m2", title: "Huruf-huruf lanjutan", contents: [L("c1-6", "Dal dan Dzal"), F("c1-7", "Kartu Huruf 2"), Q("c1-8", "Kuis Huruf Hijaiyah 2"), L("c1-9", "Ra dan Zay"), Q("c1-10", "Kuis Huruf Hijaiyah 3")] },
    ],
  },
  {
    id: "c2",
    title: "Kisah Para Nabi",
    description: "Cerita teladan para nabi yang bisa kamu pelajari langkah demi langkah.",
    modules: [
      { id: "c2-m1", title: "Nabi-nabi awal", contents: [L("c2-1", "Kisah Nabi Adam"), Q("c2-2", "Kuis: Kisah Nabi Adam"), L("c2-3", "Kisah Nabi Idris"), L("c2-4", "Kisah Nabi Nuh"), L("c2-5", "Kisah Nabi Hud")] },
      { id: "c2-m2", title: "Teladan para nabi", contents: [F("c2-6", "Kartu Nama Nabi"), L("c2-7", "Kisah Nabi Ibrahim: Ujian Keimanan"), Q("c2-8", "Kuis: Kisah Para Nabi 1"), L("c2-9", "Nabi Muhammad SAW, Nabi Terakhir"), Q("c2-10", "Kuis: Kisah Para Nabi 2")] },
    ],
  },
  {
    id: "c3",
    title: "Asmaul Husna",
    description: "Kumpulkan kartu nama-nama Allah dan pahami maknanya.",
    modules: [
      { id: "c3-m1", title: "Mengenal nama-nama Allah", contents: [L("c3-1", "Mengenal Asmaul Husna"), L("c3-2", "Ar-Rahman dan Ar-Rahim"), F("c3-3", "Kartu Asmaul Husna 1"), Q("c3-4", "Kuis Asmaul Husna 1"), L("c3-5", "Al-Malik dan Al-Quddus")] },
      { id: "c3-m2", title: "Makna dalam kehidupan", contents: [F("c3-6", "Kartu Asmaul Husna 2"), L("c3-7", "Al-Khaliq dan Ar-Razzaq"), Q("c3-8", "Kuis Asmaul Husna 2"), L("c3-9", "Al-Ghaffar, Maha Pengampun"), Q("c3-10", "Kuis Asmaul Husna 3")] },
    ],
  },
  {
    id: "c4",
    title: "Akhlak Sehari-hari",
    description: "Latihan memilih sikap yang baik di berbagai situasi.",
    modules: [
      { id: "c4-m1", title: "Adab harian", contents: [L("c4-1", "Adab Pagi Hari"), Q("c4-2", "Kuis Adab Pagi"), L("c4-3", "Adab Makan"), F("c4-4", "Kartu Doa Harian"), Q("c4-5", "Kuis Adab Makan")] },
      { id: "c4-m2", title: "Sikap terhadap sesama", contents: [L("c4-6", "Berkata Jujur"), L("c4-7", "Hormat pada Orang Tua"), F("c4-8", "Kartu Akhlak Baik"), L("c4-9", "Berbagi dengan Teman"), Q("c4-10", "Kuis Akhlak")] },
    ],
  },
];

export function courseContents(courseId: string): ContentDef[] {
  const c = COURSE_DEFS.find((x) => x.id === courseId);
  return c ? c.modules.flatMap((m) => m.contents) : [];
}

export function findContent(contentId: string) {
  for (const course of COURSE_DEFS) {
    const list = courseContents(course.id);
    const index = list.findIndex((c) => c.id === contentId);
    if (index >= 0) return { course, content: list[index]!, index, list };
  }
  return null;
}

/** Content yang sudah selesai pada data awal santri demo (c1 selesai, c2: 6, c3: 2). */
export const SEED_COMPLETED: string[] = [
  ...Array.from({ length: 10 }, (_, i) => `c1-${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `c2-${i + 1}`),
  "c3-1",
  "c3-2",
];

export const SEED_QUIZ_SCORES: { contentId: string; score: number; daysAgo: number }[] = [
  { contentId: "c1-4", score: 90, daysAgo: 6 },
  { contentId: "c1-8", score: 80, daysAgo: 5 },
  { contentId: "c1-10", score: 100, daysAgo: 2 },
  { contentId: "c2-2", score: 85, daysAgo: 1 },
];

/* ---------------- Pelajaran ---------------- */

export interface LessonSection {
  heading?: string;
  text: string;
}

export const LESSONS: Record<string, LessonSection[]> = {
  "c1-1": [
    { heading: "Huruf pertama", text: "Huruf hijaiyah berjumlah 28. Huruf pertamanya adalah Alif (ا). Bentuknya seperti garis lurus yang berdiri, dan Alif tidak memiliki titik." },
    { heading: "Huruf kedua", text: "Huruf kedua adalah Ba (ب). Bentuknya seperti perahu kecil dengan satu titik di bawahnya." },
    { heading: "Ayo ingat", text: "Alif: berdiri tegak, tanpa titik. Ba: satu titik di bawah." },
  ],
  "c1-2": [
    { heading: "Ta (ت)", text: "Ta bentuknya mirip Ba, tetapi titiknya dua dan berada di atas." },
    { heading: "Tsa (ث)", text: "Tsa juga mirip Ba, tetapi titiknya tiga dan berada di atas." },
    { heading: "Cara mengingat", text: "Ba: satu titik di bawah. Ta: dua titik di atas. Tsa: tiga titik di atas." },
  ],
  "c2-1": [
    { heading: "Manusia dan nabi pertama", text: "Nabi Adam 'alaihissalam adalah manusia pertama sekaligus nabi pertama. Allah mengajarkan kepadanya nama-nama benda." },
    { heading: "Belajar dari kisahnya", text: "Nabi Adam dan istrinya, Hawa, pernah melakukan kesalahan. Keduanya segera bertobat, dan Allah menerima tobat mereka. Dari sini kita belajar: jika berbuat salah, segera minta maaf dan perbaiki." },
  ],
  "c2-4": [
    { heading: "Sabar mengajak kebaikan", text: "Nabi Nuh 'alaihissalam mengajak kaumnya menyembah Allah dengan sabar dalam waktu yang sangat lama. Sebagian besar kaumnya menolak." },
    { heading: "Kapal besar", text: "Allah memerintahkan Nabi Nuh membuat kapal besar. Ketika banjir besar datang, orang-orang beriman dan pasangan hewan diselamatkan di dalam kapal itu." },
    { heading: "Pelajaran untuk kita", text: "Kita belajar untuk sabar, tidak mudah menyerah, dan percaya pada pertolongan Allah." },
  ],
  "c2-7": [
    { heading: "Teguh pada tauhid", text: "Nabi Ibrahim 'alaihissalam sejak muda mengajak kaumnya menyembah Allah saja dan meninggalkan berhala." },
    { heading: "Ujian keimanan", text: "Allah menguji Nabi Ibrahim dengan perintah untuk menyembelih putranya, Ismail. Keduanya taat dan sabar. Lalu Allah menggantikan Ismail dengan seekor hewan sembelihan." },
    { heading: "Pelajaran untuk kita", text: "Kita belajar untuk taat kepada Allah dan bersabar. Peristiwa ini diperingati dengan ibadah qurban pada hari raya Idul Adha. Nabi Ibrahim dan Ismail juga membangun Ka'bah di Makkah." },
  ],
  "c2-9": [
    { heading: "Nabi terakhir", text: "Nabi Muhammad SAW lahir di Makkah. Beliau adalah nabi dan rasul terakhir yang diutus Allah." },
    { heading: "Al-Amin", text: "Sejak muda beliau dikenal jujur dan dapat dipercaya, sehingga dijuluki Al-Amin, artinya yang terpercaya." },
    { heading: "Meneladani beliau", text: "Kita bisa meneladani kejujuran, kesabaran, dan kasih sayang beliau dalam kehidupan sehari-hari." },
  ],
  "c3-1": [
    { heading: "Nama-nama yang indah", text: "Asmaul Husna berarti nama-nama Allah yang paling indah. Jumlahnya 99." },
    { heading: "Kenapa penting?", text: "Dengan mengenal nama-nama Allah, kita mengenal sifat-sifat-Nya dan makin dekat kepada-Nya." },
    { heading: "Contoh", text: "Ar-Rahman (Maha Pengasih), Ar-Rahim (Maha Penyayang), Al-Khaliq (Maha Pencipta)." },
  ],
  "c3-2": [
    { heading: "Ar-Rahman dan Ar-Rahim", text: "Ar-Rahman berarti Maha Pengasih dan Ar-Rahim berarti Maha Penyayang. Keduanya berasal dari kata rahmah, yaitu kasih sayang." },
    { heading: "Sering kita ucapkan", text: "Kedua nama ini ada dalam bacaan Bismillahirrahmanirrahim yang kita ucapkan sebelum memulai banyak kegiatan." },
  ],
  "c4-1": [
    { heading: "Bangun tidur", text: "Begitu bangun, kita membaca doa. Bacaannya: Alhamdu lillahilladzi ahyana ba'da ma amatana wa ilaihin nusyur. Artinya: segala puji bagi Allah yang menghidupkan kami setelah mematikan kami, dan kepada-Nya kami kembali." },
    { heading: "Bersiap dengan rapi", text: "Rapikan tempat tidur, mandi, dan bersiap sekolah dengan rapi. Hal kecil ini melatih kita bertanggung jawab." },
    { heading: "Sapa keluarga", text: "Ucapkan salam dan sapa orang tua dengan sopan sebelum berangkat." },
  ],
  "c4-3": [
    { heading: "Sebelum makan", text: "Cuci tangan, lalu ucapkan Bismillah." },
    { heading: "Saat makan", text: "Makan dengan tangan kanan, ambil makanan yang dekat, dan jangan berlebihan atau menyisakan makanan sia-sia." },
    { heading: "Setelah makan", text: "Ucapkan Alhamdulillah sebagai tanda syukur." },
  ],
};

export function lessonFor(contentId: string, title: string): LessonSection[] {
  return (
    LESSONS[contentId] ?? [
      { text: `Selamat datang di pelajaran "${title}".` },
      { text: "Isi lengkap pelajaran ini akan ditambahkan oleh guru. Bagian ini masih contoh agar alur belajar bisa dicoba dari awal sampai akhir." },
    ]
  );
}

/* ---------------- Flashcard ---------------- */

export interface CardDef {
  front: string;
  back: string;
}

export const DECKS: Record<string, CardDef[]> = {
  "c1-3": [
    { front: "Alif (ا)", back: "Huruf pertama, tanpa titik." },
    { front: "Ba (ب)", back: "Satu titik di bawah." },
    { front: "Ta (ت)", back: "Dua titik di atas." },
    { front: "Tsa (ث)", back: "Tiga titik di atas." },
    { front: "Jim (ج)", back: "Satu titik di bawah." },
  ],
  "c1-7": [
    { front: "Ha (ح)", back: "Tanpa titik." },
    { front: "Kha (خ)", back: "Satu titik di atas." },
    { front: "Dal (د)", back: "Tanpa titik." },
    { front: "Dzal (ذ)", back: "Satu titik di atas." },
    { front: "Ra (ر)", back: "Tanpa titik." },
    { front: "Zay (ز)", back: "Satu titik di atas." },
  ],
  "c2-6": [
    { front: "Nabi Adam", back: "Manusia dan nabi pertama." },
    { front: "Nabi Nuh", back: "Membuat kapal besar saat banjir besar." },
    { front: "Nabi Ibrahim", back: "Dijuluki Khalilullah; bersama Ismail membangun Ka'bah." },
    { front: "Nabi Yunus", back: "Pernah berada di dalam perut ikan besar." },
    { front: "Nabi Muhammad SAW", back: "Nabi dan rasul terakhir." },
  ],
  "c3-3": [
    { front: "Ar-Rahman", back: "Maha Pengasih" },
    { front: "Ar-Rahim", back: "Maha Penyayang" },
    { front: "Al-Malik", back: "Maha Merajai" },
    { front: "Al-Quddus", back: "Maha Suci" },
    { front: "As-Salam", back: "Maha Pemberi Keselamatan" },
  ],
  "c3-6": [
    { front: "Al-Khaliq", back: "Maha Pencipta" },
    { front: "Ar-Razzaq", back: "Maha Pemberi Rezeki" },
    { front: "As-Sami'", back: "Maha Mendengar" },
    { front: "Al-Bashir", back: "Maha Melihat" },
    { front: "Al-Ghaffar", back: "Maha Pengampun" },
  ],
  "c4-4": [
    { front: "Sebelum makan", back: "Bismillah" },
    { front: "Setelah makan", back: "Alhamdulillah" },
    { front: "Bertemu teman", back: "Assalamu'alaikum" },
    { front: "Menjawab salam", back: "Wa'alaikumussalam" },
    { front: "Setelah bersin", back: "Alhamdulillah" },
    { front: "Diberi kebaikan", back: "Jazakumullahu khairan (semoga Allah membalas dengan kebaikan)" },
  ],
  "c4-8": [
    { front: "Jujur", back: "Berkata dan bertindak sesuai kenyataan." },
    { front: "Sabar", back: "Tetap tenang saat menunggu atau diuji." },
    { front: "Sopan", back: "Berbicara dan bersikap baik pada orang lain." },
    { front: "Berbagi", back: "Memberikan sebagian milik kita kepada teman." },
    { front: "Bersyukur", back: "Berterima kasih atas nikmat dari Allah." },
  ],
};

/* ---------------- Bank soal ---------------- */

export interface QuestionDef {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

const opt = (...texts: string[]) => texts.map((text, i) => ({ id: "abcd"[i]!, text }));

export const QUIZ_BANKS: Record<string, QuestionDef[]> = {
  c1: [
    { id: "h1", text: "Ada berapa jumlah huruf hijaiyah?", options: opt("26", "28", "30"), correctOptionId: "b", explanation: "Huruf hijaiyah berjumlah 28, dimulai dari Alif sampai Ya." },
    { id: "h2", text: "Huruf hijaiyah yang pertama adalah ...", options: opt("Ba", "Alif", "Ta"), correctOptionId: "b", explanation: "Alif (ا) adalah huruf hijaiyah yang pertama." },
    { id: "h3", text: "Huruf Ba (ب) memiliki titik ...", options: opt("satu di atas", "dua di atas", "satu di bawah"), correctOptionId: "c", explanation: "Ba punya satu titik di bawah." },
    { id: "h4", text: "Huruf Ta (ت) memiliki ...", options: opt("satu titik di bawah", "dua titik di atas", "tiga titik di atas"), correctOptionId: "b", explanation: "Ta punya dua titik di atas." },
    { id: "h5", text: "Huruf Tsa (ث) memiliki ...", options: opt("dua titik di atas", "tiga titik di atas", "tidak bertitik"), correctOptionId: "b", explanation: "Tsa punya tiga titik di atas." },
    { id: "h6", text: "Huruf yang tidak memiliki titik adalah ...", options: opt("Ba", "Ta", "Alif"), correctOptionId: "c", explanation: "Alif berdiri tegak tanpa titik." },
  ],
  c2: [
    { id: "n1", text: "Siapa nabi yang pertama?", options: opt("Nabi Adam", "Nabi Nuh", "Nabi Ibrahim"), correctOptionId: "a", explanation: "Nabi Adam adalah manusia pertama sekaligus nabi pertama." },
    { id: "n2", text: "Nabi yang membuat kapal besar saat banjir besar adalah ...", options: opt("Nabi Musa", "Nabi Nuh", "Nabi Yusuf"), correctOptionId: "b", explanation: "Nabi Nuh membuat kapal atas perintah Allah." },
    { id: "n3", text: "Nabi yang dijuluki Khalilullah adalah ...", options: opt("Nabi Musa", "Nabi Yusuf", "Nabi Ibrahim"), correctOptionId: "c", explanation: "Nabi Ibrahim dijuluki Khalilullah, artinya kekasih Allah." },
    { id: "n4", text: "Nabi dan rasul yang terakhir adalah ...", options: opt("Nabi Isa", "Nabi Muhammad SAW", "Nabi Musa"), correctOptionId: "b", explanation: "Nabi Muhammad SAW adalah nabi dan rasul terakhir." },
    { id: "n5", text: "Ibadah qurban mengingatkan kita pada kisah Nabi ...", options: opt("Ibrahim dan Ismail", "Yusuf dan saudaranya", "Musa dan Harun"), correctOptionId: "a", explanation: "Qurban mengingatkan kita pada ketaatan Nabi Ibrahim dan putranya, Ismail." },
    { id: "n6", text: "Nabi yang pernah berada di dalam perut ikan besar adalah ...", options: opt("Nabi Yunus", "Nabi Ayyub", "Nabi Sulaiman"), correctOptionId: "a", explanation: "Nabi Yunus pernah berada di dalam perut ikan besar, lalu bertobat dan diselamatkan." },
  ],
  c3: [
    { id: "a1", text: "Berapa jumlah Asmaul Husna?", options: opt("33", "99", "100"), correctOptionId: "b", explanation: "Asmaul Husna berjumlah 99." },
    { id: "a2", text: "Ar-Rahman artinya ...", options: opt("Maha Kuasa", "Maha Pengasih", "Maha Melihat"), correctOptionId: "b", explanation: "Ar-Rahman berarti Maha Pengasih." },
    { id: "a3", text: "Ar-Razzaq artinya ...", options: opt("Maha Pemberi Rezeki", "Maha Pengampun", "Maha Mendengar"), correctOptionId: "a", explanation: "Ar-Razzaq berarti Maha Pemberi Rezeki." },
    { id: "a4", text: "Al-Khaliq artinya ...", options: opt("Maha Mengetahui", "Maha Suci", "Maha Pencipta"), correctOptionId: "c", explanation: "Al-Khaliq berarti Maha Pencipta." },
    { id: "a5", text: "As-Sami' artinya ...", options: opt("Maha Melihat", "Maha Mendengar", "Maha Penyayang"), correctOptionId: "b", explanation: "As-Sami' berarti Maha Mendengar." },
    { id: "a6", text: "Al-Ghaffar artinya ...", options: opt("Maha Kaya", "Maha Adil", "Maha Pengampun"), correctOptionId: "c", explanation: "Al-Ghaffar berarti Maha Pengampun." },
  ],
  c4: [
    { id: "k1", text: "Apa yang diucapkan sebelum makan?", options: opt("Alhamdulillah", "Bismillah", "Subhanallah"), correctOptionId: "b", explanation: "Sebelum makan kita mengucapkan Bismillah." },
    { id: "k2", text: "Setelah selesai makan, kita mengucapkan ...", options: opt("Alhamdulillah", "Bismillah", "Astaghfirullah"), correctOptionId: "a", explanation: "Alhamdulillah adalah tanda syukur setelah makan." },
    { id: "k3", text: "Sebaiknya kita makan dengan tangan ...", options: opt("kiri", "kanan", "mana saja sambil berlari"), correctOptionId: "b", explanation: "Adab makan: gunakan tangan kanan." },
    { id: "k4", text: "Ketika orang tua memanggil, sebaiknya kita ...", options: opt("pura-pura tidak dengar", "menjawab sambil marah", "segera menjawab dengan sopan"), correctOptionId: "c", explanation: "Menjawab dengan sopan adalah bentuk hormat kepada orang tua." },
    { id: "k5", text: "Kamu menemukan uang teman yang terjatuh. Apa yang kamu lakukan?", options: opt("Mengembalikannya", "Menyimpannya diam-diam", "Membuangnya"), correctOptionId: "a", explanation: "Jujur berarti mengembalikan milik orang lain." },
    { id: "k6", text: "Ucapan Assalamu'alaikum berarti kita mendoakan ...", options: opt("makanan enak", "keselamatan", "hadiah"), correctOptionId: "b", explanation: "Assalamu'alaikum artinya semoga keselamatan tercurah kepadamu." },
  ],
};

export const QUIZ_SIZE = 4;

/** Setiap kuis mengambil 4 soal dari bank course, dengan titik mulai berbeda per kuis. */
export function questionsForQuiz(contentId: string): QuestionDef[] {
  const found = findContent(contentId);
  if (!found) return [];
  const bank = QUIZ_BANKS[found.course.id] ?? [];
  const quizIndex = courseContents(found.course.id)
    .filter((c) => c.type === "QUIZ")
    .findIndex((c) => c.id === contentId);
  const start = (Math.max(0, quizIndex) * 2) % Math.max(1, bank.length);
  return Array.from({ length: Math.min(QUIZ_SIZE, bank.length) }, (_, i) => bank[(start + i) % bank.length]!);
}
