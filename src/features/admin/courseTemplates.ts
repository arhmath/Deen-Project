import type { ContentDoc, CourseDoc, EditableContentType, ModuleDoc } from "../../types/courseAdmin";
import { newId } from "../../utils/id";

type TemplateContent = Omit<ContentDoc, "id" | "sections" | "cards" | "questions"> & {
  sections?: { heading?: string; text: string }[];
  cards?: { front: string; back: string }[];
  questions?: { text: string; options: { id: string; text: string }[]; correctOptionId: string; explanation: string }[];
};
type TemplateModule = { title: string; contents: TemplateContent[] };
/** Kategori materi yang ditetapkan. Ustadz/admin hanya bisa memilih dari daftar ini. */
export const COURSE_CATEGORIES = [
  { id: "fikih", label: "Fikih" },
  { id: "tauhid", label: "Tauhid" },
  { id: "quran-tajwid", label: "Al Qur'an dan Tajwid" },
  { id: "hafalan-doa", label: "Hafalan Doa" },
  { id: "sejarah-nabi", label: "Sejarah Nabi" },
  { id: "akidah-akhlak", label: "Akidah Akhlak" },
] as const;
export type CourseCategoryId = (typeof COURSE_CATEGORIES)[number]["id"];

export interface CourseTemplate {
  id: string;
  category: CourseCategoryId;
  title: string;
  description: string;
  modules: TemplateModule[];
}

const lesson = (title: string, sections: { heading: string; text: string }[]): TemplateContent =>
  ({ title, type: "LESSON", sections, cards: [], questions: [] });
const cards = (title: string, entries: { front: string; back: string }[]): TemplateContent =>
  ({ title, type: "FLASHCARD", sections: [], cards: entries, questions: [] });
const quiz = (title: string, entries: { text: string; options: { id: string; text: string }[]; correctOptionId: string; explanation: string }[]): TemplateContent =>
  ({ title, type: "QUIZ", sections: [], cards: [], questions: entries });

export const COURSE_TEMPLATES: CourseTemplate[] = [
  {
    id: "tajwid-nun", category: "quran-tajwid", title: "Tajwid Dasar: Hukum Nun Mati dan Tanwin",
    description: "Mengenal empat hukum nun sukun dan tanwin beserta contoh bacaannya.",
    modules: [
      { title: "Mengenal Nun Mati dan Tanwin", contents: [
        lesson("Pengertian Nun Mati dan Tanwin", [
          { heading: "Nun mati", text: "Nun sukun (نْ) adalah huruf nun yang tidak berharakat. Tanwin adalah bunyi nun di akhir kata yang ditandai fathatain (ً), kasratain (ٍ), atau dammatain (ٌ)." },
          { heading: "Empat hukum bacaan", text: "Nun mati atau tanwin memiliki empat hukum utama: izhar halqi, idgham, iqlab, dan ikhfa haqiqi. Hukum yang berlaku ditentukan oleh huruf setelahnya." },
        ]),
        cards("Kartu Huruf Hukum Nun Mati", [
          { front: "Izhar Halqi", back: "ء ه ع ح غ خ — dibaca jelas." },
          { front: "Idgham", back: "ي ر م ل و ن — bunyi nun/tanwin melebur ke huruf berikutnya. Idgham terbagi bighunnah dan bilaghunnah." },
          { front: "Iqlab", back: "ب — bunyi nun/tanwin berubah menjadi mim samar disertai dengung." },
          { front: "Ikhfa Haqiqi", back: "15 huruf selain huruf izhar, idgham, dan iqlab; dibaca samar disertai dengung." },
        ]),
        quiz("Kuis Nun Mati dan Tanwin", [
          { text: "Ada berapa hukum utama nun mati dan tanwin?", options: [{ id: "a", text: "Dua" }, { id: "b", text: "Empat" }, { id: "c", text: "Enam" }], correctOptionId: "b", explanation: "Empat hukum utamanya adalah izhar, idgham, iqlab, dan ikhfa." },
          { text: "Nun mati atau tanwin bertemu huruf ب dibaca dengan hukum ...", options: [{ id: "a", text: "Iqlab" }, { id: "b", text: "Izhar" }, { id: "c", text: "Ikhfa" }], correctOptionId: "a", explanation: "Iqlab terjadi ketika nun mati atau tanwin bertemu huruf ba (ب)." },
        ]),
      ] },
      { title: "Latihan Penerapan", contents: [
        lesson("Cara Mengenali Hukum Bacaan", [
          { heading: "Langkah latihan", text: "Cari nun sukun atau tanwin, periksa huruf tepat sesudahnya, lalu tentukan hukum berdasarkan kelompok huruf. Dengarkan contoh dari ustadz/ustadzah dan tirukan bacaannya." },
          { heading: "Catatan", text: "Contoh dan praktik pelafalan sebaiknya dikoreksi langsung oleh pengajar agar makhraj dan panjang dengung tepat." },
        ]),
      ] },
    ],
  },
  {
    id: "tajwid-mim", category: "quran-tajwid", title: "Tajwid Dasar: Hukum Mim Mati",
    description: "Belajar izhar syafawi, ikhfa syafawi, dan idgham mimi.",
    modules: [
      { title: "Tiga Hukum Mim Mati", contents: [
        lesson("Pengertian dan Hukum Mim Mati", [
          { heading: "Pengertian", text: "Mim mati (مْ) adalah huruf mim yang berharakat sukun. Hukum bacaannya dilihat dari huruf yang datang sesudah mim mati." },
          { heading: "Izhar Syafawi", text: "Jika mim mati bertemu huruf selain mim (م) dan ba (ب), mim dibaca jelas. Bibir tetap menutup sewajarnya tanpa berlebihan." },
          { heading: "Ikhfa Syafawi", text: "Jika mim mati bertemu ba (ب), mim dibaca samar dengan dengung." },
          { heading: "Idgham Mimi", text: "Jika mim mati bertemu mim (م), kedua mim melebur menjadi satu bunyi mim bertasydid dengan dengung." },
        ]),
        cards("Kartu Hukum Mim Mati", [
          { front: "مْ + ب", back: "Ikhfa Syafawi — samar dan berdengung." },
          { front: "مْ + م", back: "Idgham Mimi — melebur dan berdengung." },
          { front: "مْ + huruf selain ب dan م", back: "Izhar Syafawi — mim dibaca jelas." },
        ]),
        quiz("Kuis Hukum Mim Mati", [
          { text: "Mim mati bertemu huruf ba (ب) disebut ...", options: [{ id: "a", text: "Ikhfa Syafawi" }, { id: "b", text: "Idgham Mimi" }, { id: "c", text: "Izhar Halqi" }], correctOptionId: "a", explanation: "Pertemuan mim mati dan ba dibaca ikhfa syafawi." },
          { text: "Mim mati bertemu mim (م) disebut ...", options: [{ id: "a", text: "Izhar Syafawi" }, { id: "b", text: "Idgham Mimi" }, { id: "c", text: "Iqlab" }], correctOptionId: "b", explanation: "Dua mim bertemu dan melebur dengan dengung." },
        ]),
      ] },
    ],
  },
  {
    id: "kisah-nabi", category: "sejarah-nabi", title: "Kisah Para Nabi untuk Anak",
    description: "Mengenal kisah pilihan para nabi dan mengambil pelajaran akhlak dari kisahnya.",
    modules: [
      { title: "Nabi Adam dan Nabi Nuh", contents: [
        lesson("Kisah Nabi Adam a.s.", [
          { heading: "Manusia pertama", text: "Nabi Adam a.s. adalah manusia pertama yang Allah ciptakan. Allah mengajarkan kepadanya pengetahuan dan memerintahkan para malaikat untuk bersujud sebagai penghormatan atas perintah-Nya." },
          { heading: "Pelajaran", text: "Kisah Nabi Adam mengajarkan pentingnya taat kepada Allah, mengakui kesalahan, bertobat, dan tidak berputus asa dari rahmat-Nya." },
        ]),
        lesson("Kisah Nabi Nuh a.s.", [
          { heading: "Mengajak kepada kebaikan", text: "Nabi Nuh a.s. mengajak kaumnya menyembah Allah. Beliau terus berdakwah dengan sabar meskipun menghadapi penolakan." },
          { heading: "Pelajaran", text: "Kita belajar untuk sabar, teguh dalam kebaikan, dan tetap berusaha melakukan hal yang benar." },
        ]),
        quiz("Kuis Kisah Para Nabi", [
          { text: "Siapakah manusia pertama yang Allah ciptakan?", options: [{ id: "a", text: "Nabi Adam a.s." }, { id: "b", text: "Nabi Nuh a.s." }, { id: "c", text: "Nabi Musa a.s." }], correctOptionId: "a", explanation: "Nabi Adam a.s. adalah manusia pertama." },
          { text: "Sikap yang dapat diteladani dari Nabi Nuh a.s. adalah ...", options: [{ id: "a", text: "Mudah menyerah" }, { id: "b", text: "Sabar dalam berdakwah" }, { id: "c", text: "Membalas keburukan" }], correctOptionId: "b", explanation: "Nabi Nuh a.s. mengajarkan kesabaran dan keteguhan." },
        ]),
      ] },
      { title: "Nabi Ibrahim dan Nabi Muhammad", contents: [
        lesson("Kisah Nabi Ibrahim a.s.", [
          { heading: "Keteguhan iman", text: "Nabi Ibrahim a.s. mengajak kaumnya menyembah Allah dan meninggalkan penyembahan berhala. Beliau dikenal sebagai teladan keteguhan iman dan ketaatan." },
          { heading: "Pelajaran", text: "Berani mempertahankan kebenaran harus disertai kebijaksanaan, kesabaran, dan akhlak yang baik." },
        ]),
        lesson("Mengenal Nabi Muhammad ﷺ", [
          { heading: "Rasul terakhir", text: "Nabi Muhammad ﷺ adalah rasul terakhir. Beliau dikenal sebagai pribadi yang jujur, amanah, penyayang, dan santun." },
          { heading: "Pelajaran", text: "Santri dapat meneladani kejujuran, menepati janji, menyayangi sesama, dan berbicara dengan baik." },
        ]),
      ] },
    ],
  },
  {
    id: "doa-harian", category: "hafalan-doa", title: "Hafalan Doa Sehari-hari",
    description: "Materi dan kartu hafalan doa pendek untuk kegiatan harian anak.",
    modules: [
      { title: "Doa Sebelum dan Sesudah Beraktivitas", contents: [
        lesson("Adab dan Doa Sebelum Makan", [
          { heading: "Sebelum makan", text: "Bacaan yang umum diajarkan: بِسْمِ اللَّهِ (Bismillah), artinya “Dengan nama Allah”." },
          { heading: "Sesudah makan", text: "الْحَمْدُ لِلَّهِ (Alhamdulillah), artinya “Segala puji bagi Allah”. Biasakan makan dengan tangan kanan, tidak berlebihan, dan bersyukur." },
        ]),
        cards("Kartu Hafalan Doa Harian", [
          { front: "Sebelum makan", back: "بِسْمِ اللَّهِ — Bismillah (Dengan nama Allah)." },
          { front: "Sesudah makan", back: "الْحَمْدُ لِلَّهِ — Alhamdulillah (Segala puji bagi Allah)." },
          { front: "Sebelum tidur", back: "بِاسْمِكَ اللَّهُمَّ أَحْيَا وَأَمُوتُ — Bismika Allahumma ahya wa amut." },
          { front: "Masuk kamar mandi", back: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ — Allahumma inni a'udzu bika minal khubutsi wal khaba'its." },
        ]),
        quiz("Kuis Doa Harian", [
          { text: "Apa yang dibaca sebelum makan?", options: [{ id: "a", text: "Bismillah" }, { id: "b", text: "Alhamdulillah" }, { id: "c", text: "Astaghfirullah" }], correctOptionId: "a", explanation: "Bismillah berarti dengan nama Allah." },
          { text: "Ucapan syukur setelah makan adalah ...", options: [{ id: "a", text: "Bismillah" }, { id: "b", text: "Alhamdulillah" }, { id: "c", text: "Subhanallah" }], correctOptionId: "b", explanation: "Alhamdulillah berarti segala puji bagi Allah." },
        ]),
      ] },
      { title: "Latihan Hafalan", contents: [
        lesson("Tips Menghafal Doa", [
          { heading: "Dengar dan ulangi", text: "Dengarkan pelafalan dari ustadz/ustadzah, ulangi per potongan pendek, pahami artinya, lalu praktikkan dalam kegiatan sehari-hari." },
          { heading: "Konsistensi", text: "Ulangi hafalan setiap hari bersama guru atau orang tua. Pengajar perlu memeriksa pelafalan Arab sebelum materi dipublikasikan." },
        ]),
      ] },
    ],
  },
  {
    id: "hijaiyah", category: "quran-tajwid", title: "Kartu Hafalan Huruf Hijaiyah",
    description: "Kartu belajar mengenali huruf hijaiyah dan nama hurufnya.",
    modules: [
      { title: "Mengenal Huruf Hijaiyah", contents: [
        cards("Kartu Huruf Hijaiyah", [
          { front: "ا", back: "Alif" }, { front: "ب", back: "Ba" }, { front: "ت", back: "Ta" },
          { front: "ث", back: "Tsa" }, { front: "ج", back: "Jim" }, { front: "ح", back: "Ha" },
          { front: "خ", back: "Kha" }, { front: "د", back: "Dal" }, { front: "ذ", back: "Dzal" },
          { front: "ر", back: "Ra" }, { front: "ز", back: "Zai" }, { front: "س", back: "Sin" },
          { front: "ش", back: "Syin" }, { front: "ص", back: "Shad" }, { front: "ض", back: "Dhad" },
          { front: "ط", back: "Tha" }, { front: "ظ", back: "Zha" }, { front: "ع", back: "Ain" },
          { front: "غ", back: "Ghain" }, { front: "ف", back: "Fa" }, { front: "ق", back: "Qaf" },
          { front: "ك", back: "Kaf" }, { front: "ل", back: "Lam" }, { front: "م", back: "Mim" },
          { front: "ن", back: "Nun" }, { front: "و", back: "Wau" }, { front: "ه", back: "Ha" },
          { front: "ء", back: "Hamzah" }, { front: "ي", back: "Ya" },
        ]),
        quiz("Kuis Huruf Hijaiyah", [
          { text: "Huruf ب dibaca ...", options: [{ id: "a", text: "Ba" }, { id: "b", text: "Ta" }, { id: "c", text: "Jim" }], correctOptionId: "a", explanation: "Huruf ب adalah ba." },
          { text: "Huruf pertama dalam urutan hijaiyah yang umum diajarkan adalah ...", options: [{ id: "a", text: "Ya" }, { id: "b", text: "Alif" }, { id: "c", text: "Nun" }], correctOptionId: "b", explanation: "Urutan hijaiyah umumnya dimulai dengan alif." },
        ]),
      ] },
    ],
  },
  // ───────────── Fikih ─────────────
  {
    id: "fikih-wudhu", category: "fikih", title: "Fikih Dasar: Tata Cara Wudhu",
    description: "Mengenal rukun, urutan, dan hal yang membatalkan wudhu.",
    modules: [
      { title: "Belajar Berwudhu", contents: [
        lesson("Urutan Wudhu", [
          { heading: "Pengertian", text: "Wudhu adalah bersuci dengan air pada anggota tubuh tertentu agar sah melaksanakan shalat dan ibadah lain yang mensyaratkan bersuci." },
          { heading: "Urutan wudhu", text: "Berniat, membasuh wajah, membasuh kedua tangan sampai siku, mengusap sebagian kepala, membasuh kedua kaki sampai mata kaki, lalu dilakukan berurutan. Sebelumnya dianjurkan membaca bismillah dan berkumur serta membersihkan hidung." },
          { heading: "Catatan", text: "Rincian rukun wudhu mengikuti mazhab yang diajarkan di TPA/pesantren masing-masing. Pengajar dapat menyesuaikan materi ini." },
        ]),
        lesson("Hal yang Membatalkan Wudhu", [
          { heading: "Pembatal wudhu", text: "Di antara yang membatalkan wudhu: keluar sesuatu dari qubul atau dubur (buang air kecil, buang air besar, kentut), tidur nyenyak, dan hilang akal (pingsan)." },
          { heading: "Jika batal", text: "Jika wudhu batal dan akan shalat, santri perlu berwudhu kembali." },
        ]),
        cards("Kartu Anggota Wudhu", [
          { front: "Anggota wudhu pertama yang dibasuh", back: "Wajah." },
          { front: "Tangan dibasuh sampai ...", back: "Siku." },
          { front: "Kaki dibasuh sampai ...", back: "Mata kaki." },
          { front: "Yang membatalkan wudhu", back: "Buang air, kentut, tidur nyenyak, dan hilang akal." },
        ]),
        quiz("Kuis Wudhu", [
          { text: "Anggota wudhu yang pertama dibasuh setelah niat adalah ...", options: [{ id: "a", text: "Wajah" }, { id: "b", text: "Kaki" }, { id: "c", text: "Tangan" }], correctOptionId: "a", explanation: "Setelah niat, yang dibasuh pertama adalah wajah." },
          { text: "Manakah yang membatalkan wudhu?", options: [{ id: "a", text: "Makan nasi" }, { id: "b", text: "Buang air kecil" }, { id: "c", text: "Membaca doa" }], correctOptionId: "b", explanation: "Keluarnya sesuatu dari qubul atau dubur membatalkan wudhu." },
        ]),
      ] },
    ],
  },
  {
    id: "fikih-shalat", category: "fikih", title: "Fikih Dasar: Shalat Lima Waktu",
    description: "Mengenal nama waktu shalat fardhu dan jumlah rakaatnya.",
    modules: [
      { title: "Shalat Fardhu", contents: [
        lesson("Lima Waktu Shalat", [
          { heading: "Shalat fardhu", text: "Muslim yang sudah baligh wajib melaksanakan shalat lima waktu sehari semalam. Anak-anak dilatih sejak dini agar terbiasa dengan penuh kasih sayang." },
          { heading: "Nama dan jumlah rakaat", text: "Subuh 2 rakaat, Zuhur 4 rakaat, Asar 4 rakaat, Magrib 3 rakaat, dan Isya 4 rakaat." },
        ]),
        cards("Kartu Rakaat Shalat", [
          { front: "Subuh", back: "2 rakaat" },
          { front: "Zuhur", back: "4 rakaat" },
          { front: "Asar", back: "4 rakaat" },
          { front: "Magrib", back: "3 rakaat" },
          { front: "Isya", back: "4 rakaat" },
        ]),
        quiz("Kuis Shalat Lima Waktu", [
          { text: "Shalat Magrib terdiri dari ... rakaat.", options: [{ id: "a", text: "2" }, { id: "b", text: "3" }, { id: "c", text: "4" }], correctOptionId: "b", explanation: "Magrib 3 rakaat." },
          { text: "Shalat yang jumlahnya 2 rakaat adalah ...", options: [{ id: "a", text: "Subuh" }, { id: "b", text: "Asar" }, { id: "c", text: "Isya" }], correctOptionId: "a", explanation: "Subuh 2 rakaat." },
        ]),
      ] },
    ],
  },
  {
    id: "fikih-thaharah", category: "fikih", title: "Fikih Dasar: Thaharah (Bersuci)",
    description: "Mengenal makna bersuci serta cara bersuci: wudhu, mandi, dan tayamum.",
    modules: [
      { title: "Mengenal Thaharah", contents: [
        lesson("Makna dan Macam Bersuci", [
          { heading: "Thaharah", text: "Thaharah berarti bersuci dari hadats dan najis. Kebersihan adalah bagian penting dari ajaran Islam dan syarat sahnya shalat." },
          { heading: "Cara bersuci", text: "Bersuci dari hadats kecil dengan wudhu, dari hadats besar dengan mandi, dan jika tidak ada air atau tidak dapat memakainya, dengan tayamum." },
        ]),
        cards("Kartu Bersuci", [
          { front: "Bersuci dari hadats kecil", back: "Wudhu" },
          { front: "Bersuci dari hadats besar", back: "Mandi" },
          { front: "Pengganti wudhu/mandi saat tidak ada air", back: "Tayamum" },
        ]),
        quiz("Kuis Thaharah", [
          { text: "Pengganti wudhu ketika tidak ada air adalah ...", options: [{ id: "a", text: "Tayamum" }, { id: "b", text: "Istirahat" }, { id: "c", text: "Berkumur" }], correctOptionId: "a", explanation: "Tayamum menggantikan wudhu atau mandi saat air tidak ada atau tidak dapat digunakan." },
          { text: "Thaharah artinya ...", options: [{ id: "a", text: "Bersuci" }, { id: "b", text: "Berpuasa" }, { id: "c", text: "Bersedekah" }], correctOptionId: "a", explanation: "Thaharah berarti bersuci." },
        ]),
      ] },
    ],
  },

  // ───────────── Tauhid ─────────────
  {
    id: "tauhid-allah-esa", category: "tauhid", title: "Tauhid Dasar: Mengenal Allah Yang Maha Esa",
    description: "Mengenal Allah sebagai satu-satunya Tuhan dan beberapa Asmaul Husna.",
    modules: [
      { title: "Allah Yang Maha Esa", contents: [
        lesson("Allah Itu Esa", [
          { heading: "Makna tauhid", text: "Tauhid berarti meyakini bahwa Allah itu Esa, pencipta dan pengatur seluruh alam, dan hanya Dia yang berhak disembah." },
          { heading: "Surat Al-Ikhlas", text: "Surat Al-Ikhlas mengajarkan tentang keesaan Allah dan menjadi dasar keyakinan seorang muslim." },
        ]),
        cards("Kartu Asmaul Husna", [
          { front: "Ar-Rahman", back: "Maha Pengasih" },
          { front: "Ar-Rahim", back: "Maha Penyayang" },
          { front: "Al-Khaliq", back: "Maha Pencipta" },
          { front: "As-Sami'", back: "Maha Mendengar" },
          { front: "Al-Bashir", back: "Maha Melihat" },
        ]),
        quiz("Kuis Tauhid Dasar", [
          { text: "Allah bersifat ...", options: [{ id: "a", text: "Esa" }, { id: "b", text: "Banyak" }, { id: "c", text: "Dua" }], correctOptionId: "a", explanation: "Allah itu Esa." },
          { text: "Arti Al-Khaliq adalah ...", options: [{ id: "a", text: "Maha Pencipta" }, { id: "b", text: "Maha Mendengar" }, { id: "c", text: "Maha Melihat" }], correctOptionId: "a", explanation: "Al-Khaliq berarti Maha Pencipta." },
        ]),
      ] },
    ],
  },
  {
    id: "tauhid-hanya-allah", category: "tauhid", title: "Tauhid Dasar: Hanya Allah yang Disembah",
    description: "Belajar beribadah, berdoa, dan bertawakal hanya kepada Allah.",
    modules: [
      { title: "Beribadah Hanya kepada Allah", contents: [
        lesson("Menyembah dan Memohon kepada Allah", [
          { heading: "Hanya kepada Allah", text: "Seorang muslim menyembah, berdoa, dan memohon pertolongan hanya kepada Allah. Tidak menyekutukan Allah dengan apa pun." },
          { heading: "Bertawakal", text: "Setelah berusaha sebaik-baiknya, kita bertawakal, yaitu menyerahkan hasilnya kepada Allah dan percaya bahwa keputusan-Nya terbaik." },
        ]),
        cards("Kartu Tauhid", [
          { front: "Kepada siapa kita menyembah?", back: "Hanya kepada Allah." },
          { front: "Tawakal", back: "Berusaha lalu menyerahkan hasilnya kepada Allah." },
        ]),
        quiz("Kuis Hanya Allah yang Disembah", [
          { text: "Kepada siapa kita berdoa dan memohon pertolongan?", options: [{ id: "a", text: "Allah" }, { id: "b", text: "Benda keramat" }, { id: "c", text: "Siapa saja" }], correctOptionId: "a", explanation: "Kita berdoa dan memohon pertolongan hanya kepada Allah." },
          { text: "Menyerahkan hasil usaha kepada Allah disebut ...", options: [{ id: "a", text: "Tawakal" }, { id: "b", text: "Malas" }, { id: "c", text: "Sombong" }], correctOptionId: "a", explanation: "Itulah makna tawakal." },
        ]),
      ] },
    ],
  },

  // ───────────── Hafalan Doa ─────────────
  {
    id: "doa-belajar-orangtua", category: "hafalan-doa", title: "Doa Belajar dan Doa untuk Orang Tua",
    description: "Hafalan doa menuntut ilmu, doa untuk kedua orang tua, dan doa kebaikan dunia akhirat.",
    modules: [
      { title: "Doa-doa Pilihan", contents: [
        lesson("Doa Menuntut Ilmu dan untuk Orang Tua", [
          { heading: "Doa menuntut ilmu", text: "رَبِّ زِدْنِي عِلْمًا (Rabbi zidni 'ilma) — “Ya Tuhanku, tambahkanlah ilmu kepadaku.”" },
          { heading: "Doa untuk orang tua", text: "رَبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا — mohon ampunan bagi diri sendiri dan kedua orang tua, serta kasih sayang untuk mereka. Pengajar perlu memeriksa pelafalan sebelum materi dipublikasikan." },
        ]),
        cards("Kartu Hafalan Doa Pilihan", [
          { front: "Doa menuntut ilmu", back: "رَبِّ زِدْنِي عِلْمًا — Rabbi zidni 'ilma." },
          { front: "Doa kebaikan dunia dan akhirat", back: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ — Rabbana atina fid-dunya hasanah wa fil-akhirati hasanah wa qina 'adzaban-nar." },
        ]),
        quiz("Kuis Doa Pilihan", [
          { text: "Doa “Rabbi zidni 'ilma” dibaca ketika ...", options: [{ id: "a", text: "Ingin bertambah ilmu" }, { id: "b", text: "Mau makan" }, { id: "c", text: "Mau tidur" }], correctOptionId: "a", explanation: "Artinya: Ya Tuhanku, tambahkanlah ilmu kepadaku." },
        ]),
      ] },
    ],
  },

  // ───────────── Sejarah Nabi ─────────────
  {
    id: "kisah-yusuf-musa", category: "sejarah-nabi", title: "Kisah Nabi Yusuf a.s. dan Nabi Musa a.s.",
    description: "Pelajaran sabar, jujur, memaafkan, dan keberanian dari kisah dua nabi.",
    modules: [
      { title: "Nabi Yusuf dan Nabi Musa", contents: [
        lesson("Kisah Nabi Yusuf a.s.", [
          { heading: "Sabar dan jujur", text: "Nabi Yusuf a.s. diuji dengan berbagai cobaan sejak kecil, tetapi tetap sabar, jujur, dan menjaga diri dari perbuatan buruk." },
          { heading: "Pelajaran", text: "Kita belajar bersabar, jujur, dan memaafkan kesalahan orang lain." },
        ]),
        lesson("Kisah Nabi Musa a.s.", [
          { heading: "Berani menyampaikan kebenaran", text: "Nabi Musa a.s. diutus kepada Fir'aun untuk mengajak beribadah kepada Allah. Beliau berani menyampaikan kebenaran dan Allah menolongnya." },
          { heading: "Pelajaran", text: "Percayalah pada pertolongan Allah dan beranilah dalam kebenaran dengan tetap berakhlak baik." },
        ]),
        quiz("Kuis Yusuf dan Musa", [
          { text: "Sifat yang dapat diteladani dari Nabi Yusuf a.s. adalah ...", options: [{ id: "a", text: "Sabar dan jujur" }, { id: "b", text: "Pemarah" }, { id: "c", text: "Pendendam" }], correctOptionId: "a", explanation: "Nabi Yusuf a.s. teladan dalam kesabaran dan kejujuran." },
          { text: "Nabi Musa a.s. diutus untuk berdakwah kepada ...", options: [{ id: "a", text: "Fir'aun" }, { id: "b", text: "Kaum Nuh" }, { id: "c", text: "Raja Sulaiman" }], correctOptionId: "a", explanation: "Nabi Musa a.s. berdakwah kepada Fir'aun dan kaumnya." },
        ]),
      ] },
    ],
  },

  // ───────────── Akidah Akhlak ─────────────
  {
    id: "akidah-rukun-iman", category: "akidah-akhlak", title: "Akidah Dasar: Rukun Iman",
    description: "Mengenal enam rukun iman secara sederhana.",
    modules: [
      { title: "Enam Rukun Iman", contents: [
        lesson("Mengenal Rukun Iman", [
          { heading: "Rukun iman", text: "Rukun iman ada enam: iman kepada Allah, malaikat-malaikat-Nya, kitab-kitab-Nya, rasul-rasul-Nya, hari akhir, serta qada dan qadar." },
          { heading: "Makna iman", text: "Iman berarti meyakini dengan hati, mengucapkan dengan lisan, dan mengamalkan dengan perbuatan." },
        ]),
        cards("Kartu Rukun Iman", [
          { front: "Iman ke-1", back: "Iman kepada Allah" },
          { front: "Iman ke-2", back: "Iman kepada malaikat" },
          { front: "Iman ke-3", back: "Iman kepada kitab-kitab Allah" },
          { front: "Iman ke-4", back: "Iman kepada rasul" },
          { front: "Iman ke-5", back: "Iman kepada hari akhir" },
          { front: "Iman ke-6", back: "Iman kepada qada dan qadar" },
        ]),
        quiz("Kuis Rukun Iman", [
          { text: "Jumlah rukun iman adalah ...", options: [{ id: "a", text: "Lima" }, { id: "b", text: "Enam" }, { id: "c", text: "Tujuh" }], correctOptionId: "b", explanation: "Rukun iman ada enam." },
          { text: "Rukun iman yang pertama adalah ...", options: [{ id: "a", text: "Iman kepada Allah" }, { id: "b", text: "Iman kepada hari akhir" }, { id: "c", text: "Iman kepada rasul" }], correctOptionId: "a", explanation: "Rukun iman pertama adalah iman kepada Allah." },
        ]),
      ] },
    ],
  },
  {
    id: "akhlak-terpuji", category: "akidah-akhlak", title: "Akhlak Terpuji Sehari-hari",
    description: "Membiasakan jujur, sopan, hormat kepada orang tua dan guru, serta berbagi.",
    modules: [
      { title: "Akhlak Baik", contents: [
        lesson("Contoh Akhlak Terpuji", [
          { heading: "Jujur dan amanah", text: "Berkata benar, menepati janji, dan menjaga amanah adalah akhlak terpuji yang dicintai Allah." },
          { heading: "Hormat dan santun", text: "Menghormati orang tua dan guru, berbicara dengan santun, serta menyayangi teman dan sesama makhluk." },
          { heading: "Berbagi", text: "Senang berbagi dengan teman dan membantu orang yang membutuhkan." },
        ]),
        cards("Kartu Akhlak Terpuji", [
          { front: "Jujur", back: "Berkata dan bertindak sesuai kenyataan." },
          { front: "Sopan santun", back: "Berbicara baik dan menghormati orang lain." },
          { front: "Berbagi", back: "Membantu dan memberi kepada yang membutuhkan." },
        ]),
        quiz("Kuis Akhlak Terpuji", [
          { text: "Sikap yang baik kepada orang tua dan guru adalah ...", options: [{ id: "a", text: "Menghormati" }, { id: "b", text: "Membantah kasar" }, { id: "c", text: "Mengabaikan" }], correctOptionId: "a", explanation: "Kita wajib menghormati orang tua dan guru." },
          { text: "Menepati janji termasuk akhlak ...", options: [{ id: "a", text: "Terpuji" }, { id: "b", text: "Tercela" }, { id: "c", text: "Biasa saja" }], correctOptionId: "a", explanation: "Menepati janji adalah akhlak terpuji." },
        ]),
      ] },
    ],
  },
];

export const templatesByCategory = (category: string): CourseTemplate[] =>
  COURSE_TEMPLATES.filter((template) => template.category === category);

export function instantiateCourseTemplate(template: CourseTemplate, course: CourseDoc): CourseDoc {
  const modules: ModuleDoc[] = template.modules.map((mod) => ({
    id: newId("mod"),
    title: mod.title,
    contents: mod.contents.map((item) => ({
      id: newId("ct"),
      title: item.title,
      type: item.type as EditableContentType,
      sections: (item.sections ?? []).map((section) => ({ ...section })),
      cards: (item.cards ?? []).map((card) => ({ id: newId("card"), ...card })),
      questions: (item.questions ?? []).map((question) => ({
        id: newId("q"),
        text: question.text,
        options: question.options.map((option) => ({ ...option })),
        correctOptionId: question.correctOptionId,
        explanation: question.explanation,
      })),
    })),
  }));
  return { ...course, modules };
}
