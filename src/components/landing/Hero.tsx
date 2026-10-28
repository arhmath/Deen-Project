import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText"; // ✨
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ScrollAnimation } from "../ui/ScrollAnimation"; // ✨
import { StarIcon, SparkleIcon } from "./DecorativeIcons";
import { HeroParticles } from "./HeroParticles";

/**
 * Gambar hero (sisi kanan). Taruh file gambarmu di folder `public/` dengan nama ini,
 * atau ubah path-nya ke nama file yang kamu pakai (mis. "/hero-deen.webp").
 */
const HERO_IMAGE = "/hero-landing.webp";

/** Angka ringkas di bawah tombol — semuanya mengacu ke isi aplikasi saat ini. */
const STATS = [
  { value: "3", label: "Peran dalam satu platform", sub: "Santri, Orang Tua, Guru" },
  { value: "4", label: "Langkah seru", sub: "Dari gabung kelas sampai naik level" },
  { value: "6", label: "Fitur belajar", sub: "XP, kuis, flashcard, dan lainnya" },
];

gsap.registerPlugin(SplitText); // ✨

export function Hero() {
  const headlineRef = useRef<HTMLHeadingElement>(null); // ✨

  // ✨ animasi headline per-huruf saat halaman dibuka
  useEffect(() => {
    const headline = headlineRef.current;
    if (!headline) return;

    let split: SplitText | null = null;

    document.fonts.ready.then(() => {
      split = SplitText.create(headline, {
        type: "chars, words",
        charsClass: "char",
      });

      gsap.from(split.chars, {
        opacity: 0,
        y: 40,
        rotationX: 90,
        transformOrigin: "0% 50% -20",
        stagger: 0.02,
        duration: 0.8,
        ease: "back.out(1.7)",
        delay: 0.2,
      });
    });

    return () => split?.revert();
  }, []);

  return (
    <section className="relative overflow-hidden px-5 pb-20 pt-10 md:pb-24 md:pt-12">
      <HeroParticles />
      <SparkleIcon
        className="absolute left-[8%] top-24 h-6 w-6 text-brand-gold motion-safe:animate-twinkle"
        aria-hidden="true"
      />
      <SparkleIcon
        className="absolute right-[14%] top-16 h-4 w-4 text-brand-blue motion-safe:animate-twinkle [animation-delay:0.8s]"
        aria-hidden="true"
      />
      <StarIcon
        className="absolute right-[6%] bottom-10 h-8 w-8 text-brand-amber motion-safe:animate-twinkle [animation-delay:1.4s]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Badge tone="cream" icon={<StarIcon className="h-4 w-4 text-brand-amber" />}>
              Untuk santri, orang tua, dan guru
            </Badge>
          </motion.div>

          {/* ✨ ref dipasang di sini, animasinya jalan otomatis lewat useEffect */}
          <h1
            ref={headlineRef}
            className="mt-5 font-display text-4xl font-extrabold leading-[1.1] text-brand-ink md:text-5xl"
          >
            Ngaji jadi seru,
            <br />
            naik level tiap hari.
          </h1>

          {/* ✨ fade-in setelah headline selesai */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
            className="mt-4 max-w-lg font-body text-lg text-brand-ink/70"
          >
            Deen mengubah jam belajar ngaji jadi permainan: kumpulkan XP, jaga
            daily check-in, dan naik peringkat bareng teman satu kelas. Dari
            huruf hijaiyah, adab harian, sampai doa sehari-hari, semuanya
            dikemas dalam modul, flashcard, dan kuis.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
            className="mt-2 max-w-lg font-body text-base text-brand-ink/60"
          >
            Orang tua memantau progres lewat dashboard, guru mengelola kelas
            lewat room, dan Ziya siap jadi teman tanya jawab.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
            className="mt-6 flex flex-wrap justify-center gap-4 md:justify-start"
          >
            <Link to="/register">
              <Button size="lg">Mulai Petualangan</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Sudah Punya Akun
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.25, ease: "easeOut" }}
            className="mt-4 text-center font-body text-sm font-semibold text-brand-ink/50 md:text-left"
          >
            Gratis · Daftar cuma semenit · Bisa dibuka dari HP maupun komputer
          </motion.p>

          <motion.dl
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.35, ease: "easeOut" }}
            className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-t-2 border-brand-ink/10 pt-5"
          >
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-3xl font-extrabold text-brand-purple-fg">
                  {stat.value}
                </dt>
                <dd className="mt-0.5 font-display text-sm font-bold leading-tight text-brand-ink">
                  {stat.label}
                </dd>
                <dd className="mt-0.5 font-body text-xs leading-snug text-brand-ink/50">
                  {stat.sub}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* Gambar besar tanpa bingkai/kotak, menyesuaikan lebar kolom */}
        <ScrollAnimation direction="left" delay={0.3} className="relative mx-auto hidden w-full md:block">
          <img
            src={HERO_IMAGE}
            alt="Ilustrasi belajar di Deen"
            className="mx-auto h-auto max-h-[75vh] w-full object-contain"
          />
        </ScrollAnimation>
      </div>
    </section>
  );
}