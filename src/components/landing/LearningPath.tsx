import { BookIcon, StarIcon, CrownIcon, FlameIcon } from "./DecorativeIcons";

const STEPS = [
  {
    title: "Gabung Room Kelas",
    desc: "Masukkan kode dari ustadz/ustadzah untuk gabung ke kelas ngaji.",
    icon: StarIcon,
    tone: "bg-brand-blue",
  },
  {
    title: "Kerjakan Modul",
    desc: "Belajar lewat bacaan, flashcard hafalan, dan video singkat.",
    icon: BookIcon,
    tone: "bg-brand-purple",
  },
  {
    title: "Kuis & Tantangan",
    desc: "Uji pemahaman lewat kuis seru, dapat XP tiap jawaban benar.",
    icon: FlameIcon,
    tone: "bg-brand-amber",
  },
  {
    title: "Naik Level",
    desc: "Kumpulkan poin, jaga daily check-in, dan rebut posisi puncak leaderboard.",
    icon: CrownIcon,
    tone: "bg-brand-gold",
  },
];

export function LearningPath() {
  return (
    <section id="cara-belajar" className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-brand-ink md:text-4xl">
            Jalur belajarnya seperti main game
          </h2>
          <p className="mt-3 font-body text-brand-ink/70">
            Empat langkah sederhana, diulang tiap hari sampai jadi kebiasaan.
          </p>
        </div>

        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          {/* connecting dotted path — visible on desktop only, mirrors an actual step sequence */}
          <div
            className="pointer-events-none absolute left-0 right-0 top-8 hidden h-0.5 border-t-2 border-dashed border-brand-ink/15 md:block"
            aria-hidden="true"
          />

          {STEPS.map((step, i) => (
            <li key={step.title} className="relative flex flex-col items-center text-center">
              <div
                className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl ${step.tone} text-white shadow-[0_4px_0_0_rgba(0,0,0,0.15)]`}
              >
                <step.icon className="h-7 w-7" />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-cream font-display text-xs font-extrabold text-brand-ink shadow">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-brand-ink">
                {step.title}
              </h3>
              <p className="mt-1.5 max-w-[13rem] font-body text-sm text-brand-ink/60">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
