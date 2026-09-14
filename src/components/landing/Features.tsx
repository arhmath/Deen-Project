import { clsx } from "../../lib/clsx";

const FEATURES = [
  {
    title: "XP & Level",
    desc: "Setiap aktivitas belajar menghasilkan XP. Jaga Daily Check-in biar makin semangat tiap hari.",
    border: "border-brand-purple",
    shadow: "shadow-[0_6px_0_0_#8231F2]",
    rotate: "md:-rotate-2",
  },
  {
    title: "Leaderboard Kelas",
    desc: "Lihat peringkat santri se-room maupun se-Deen, jadi motivasi untuk terus belajar.",
    border: "border-brand-blue",
    shadow: "shadow-[0_6px_0_0_#009DFE]",
    rotate: "md:rotate-1",
  },
  {
    title: "Kuis & Flashcard",
    desc: "Materi bacaan, hafalan, dan tantangan dikemas jadi kuis interaktif dan flashcard.",
    border: "border-brand-amber",
    shadow: "shadow-[0_6px_0_0_#FFAD00]",
    rotate: "md:-rotate-1",
  },
  {
    title: "Daily Check-in",
    desc: "Absen belajar tiap hari untuk kumpulkan reward tambahan dan jaga konsistensi.",
    border: "border-brand-gold",
    shadow: "shadow-[0_6px_0_0_#FFCC00]",
    rotate: "md:rotate-2",
  },
  {
    title: "Dipantau Wali Santri",
    desc: "Orang tua bisa memantau progres belajar anak lewat dashboard khusus.",
    border: "border-brand-purple",
    shadow: "shadow-[0_6px_0_0_#8231F2]",
    rotate: "md:rotate-1",
  },
  {
    title: "Chatbot Pendamping",
    desc: "Ada teman tanya-jawab kalau santri bingung dengan materi yang sedang dipelajari.",
    border: "border-brand-blue",
    shadow: "shadow-[0_6px_0_0_#009DFE]",
    rotate: "md:-rotate-1",
  },
];

export function Features() {
  return (
    <section id="fitur" className="bg-white px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-brand-ink md:text-4xl">
            Semua yang bikin belajar ngaji ditunggu-tunggu
          </h2>
          <p className="mt-3 font-body text-brand-ink/70">
            Dirancang supaya santri tetap semangat, dan orang tua tetap tenang.
          </p>
        </div>

        <div className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={clsx(
                "rounded-2xl border-2 bg-brand-cream p-6 transition-transform hover:-translate-y-1",
                f.border,
                f.shadow,
                f.rotate
              )}
            >
              <h3 className="font-display text-lg font-bold text-brand-ink">
                {f.title}
              </h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-brand-ink/65">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
