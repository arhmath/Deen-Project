import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookIcon, StarIcon, CrownIcon, FlameIcon } from "./DecorativeIcons";

gsap.registerPlugin(ScrollTrigger);

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
  const sectionRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const list = listRef.current;
    const fill = fillRef.current;
    if (!section || !list || !fill) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("li", list);
      const slides = gsap.utils.toArray<HTMLElement>(".slide", section);
      const icons = gsap.utils.toArray<HTMLElement>(".step-icon", list);

      // 1. Timeline untuk Pinning Utama
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=" + items.length * 100 + "%",
          pin: true,
          pinSpacing: true, // Paksa GSAP memberi jarak untuk elemen di bawahnya
          scrub: 1,
          anticipatePin: 1,
          refreshPriority: 1, // Prioritaskan kalkulasi section ini dibanding section lain
        },
      });

      gsap.set(fill, { scaleY: 1 / items.length, transformOrigin: "top left" });

      items.forEach((item, i) => {
        const prevItem = items[i - 1];
        if (prevItem) {
          tl.to(icons[i], { scale: 1.15, duration: 0.3 }, 0.5 * i)
            .to(item.querySelector("h3"), { color: "#8231F2" }, "<")
            .to(slides[i], { autoAlpha: 1, y: 0, duration: 0.3 }, "<")
            .to(icons[i - 1], { scale: 1, duration: 0.3 }, "<")
            .to(prevItem.querySelector("h3"), { color: "#231334" }, "<")
            .to(slides[i - 1], { autoAlpha: 0, y: -20, duration: 0.3 }, "<");
        } else {
          gsap.set(icons[i], { scale: 1.15 });
          gsap.set(item.querySelector("h3"), { color: "#8231F2" });
          gsap.set(slides[i], { autoAlpha: 1, y: 0 });
        }
      });

      tl.to(
        fill,
        { scaleY: 1, transformOrigin: "top left", ease: "none", duration: tl.duration() },
        0
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cara-belajar"
      className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-5 py-20"
    >
      <div className="mx-auto max-w-6xl w-full">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl font-extrabold text-brand-ink md:text-4xl">
            Jalur belajarnya seperti main game
          </h2>
          <p className="mt-3 font-body text-brand-ink/70">
            Empat langkah sederhana, diulang tiap hari sampai jadi kebiasaan.
          </p>
        </div>

        <div className="mt-14 grid gap-14 md:grid-cols-2 md:items-center">
          {/* Kiri: daftar step + garis progress vertikal */}
          <div className="relative pl-12">
            <div className="absolute left-7 top-0 h-full w-1 rounded-full bg-brand-ink/10" />
            <div
              ref={fillRef}
              className="absolute left-7 top-0 h-full w-1 rounded-full bg-brand-purple"
              style={{ transform: "scaleY(0)" }}
            />

            <ol ref={listRef} className="space-y-8">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative flex items-center gap-4">
                  <div
                    className={`step-icon relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${step.tone} text-white shadow-[0_4px_0_0_rgba(0,0,0,0.15)]`}
                  >
                    <step.icon className="h-6 w-6" />
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-cream font-display text-xs font-extrabold text-brand-ink shadow">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-brand-ink/50 transition-colors md:text-xl">
                    {step.title}
                  </h3>
                </li>
              ))}
            </ol>
          </div>

          {/* Kanan: detail step aktif */}
          <div className="relative min-h-[220px]">
            {STEPS.map((step) => (
              <div key={step.title} className="slide absolute inset-0 invisible opacity-0">
                <div className="rounded-3xl bg-white p-8 shadow-[0_10px_0_0_#E4D6FB]">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.tone} text-white`}
                  >
                    <step.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-extrabold text-brand-ink">
                    {step.title}
                  </h3>
                  <p className="mt-3 font-body text-brand-ink/70">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}