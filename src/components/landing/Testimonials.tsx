const TESTIMONIALS = [
  {
    quote:
      "Anak saya yang tadinya susah diajak ngaji, sekarang malah nagih buka aplikasinya tiap sore.",
    name: "Bunda Aisyah",
    role: "Orang tua santri",
  },
  {
    quote:
      "Saya bisa lihat progres belajar anak tanpa harus terus-menerus bertanya ke ustadznya.",
    name: "Pak Rahman",
    role: "Wali santri",
  },
  {
    quote:
      "Fitur leaderboard bikin santri di kelas saya jadi kompak saling menyemangati, bukan malah bosan.",
    name: "Ustadzah Fitri",
    role: "Pengajar TPA",
  },
];

export function Testimonials() {
  return (
    <section id="testimoni" className="px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-brand-ink md:text-4xl">
            Kata orang tua dan pengajar
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-ink/5"
            >
              <blockquote className="font-body text-brand-ink/80">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-4 border-t border-brand-ink/10 pt-4">
                <p className="font-display text-sm font-bold text-brand-ink">
                  {t.name}
                </p>
                <p className="text-sm text-brand-ink/50">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
