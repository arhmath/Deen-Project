import type { ContentDoc, CourseDoc, EditableContentType, ModuleDoc } from "../../types/courseAdmin";
import { newId } from "../../utils/id";

type TemplateContent = Omit<ContentDoc, "id" | "sections" | "cards" | "questions"> & {
  sections?: { heading?: string; text: string }[];
  cards?: { front: string; back: string }[];
  questions?: { text: string; options: { id: string; text: string }[]; correctOptionId: string; explanation: string }[];
};
type TemplateModule = { title: string; contents: TemplateContent[] };
export interface CourseTemplate {
  id: string;
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
    id: "tajwid-nun", title: "Tajwid Dasar: Hukum Nun Mati dan Tanwin",
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
    id: "tajwid-mim", title: "Tajwid Dasar: Hukum Mim Mati",
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
    id: "kisah-nabi", title: "Kisah Para Nabi untuk Anak",
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
    id: "doa-harian", title: "Hafalan Doa Sehari-hari",
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
    id: "hijaiyah", title: "Kartu Hafalan Huruf Hijaiyah",
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
];

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
