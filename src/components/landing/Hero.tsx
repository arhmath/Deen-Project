import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText"; // ✨
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { ScrollAnimation } from "../ui/ScrollAnimation"; // ✨
import { StarIcon, SparkleIcon, FlameIcon } from "./DecorativeIcons";
import foto2 from "../../assets/foto2.png";

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
    <section className="relative overflow-hidden px-5 pb-20 pt-14 md:pb-28 md:pt-20">
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

      <div className="mx-auto grid max-w-6xl items-center gap-14 md:grid-cols-2">
        <div>
          <Badge tone="cream" icon={<StarIcon className="h-4 w-4 text-brand-amber" />}>
            Dibuat untuk santri TPA
          </Badge>

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
            className="mt-5 max-w-md font-body text-lg text-brand-ink/70"
          >
            Deen mengubah jam belajar ngaji jadi permainan: kumpulkan XP,
            naik peringkat di papan skor bareng
            teman-teman satu kelas.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
            className="mt-8 flex flex-wrap gap-4"
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.3, ease: "easeOut" }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Badge tone="purple" icon={<FlameIcon className="h-4 w-4" />}>
              Daily Check-in
            </Badge>
            <Badge tone="amber">Materi sesuai kurikulum TPA</Badge>
            <Badge tone="blue">Dipantau Wali Santri</Badge>
          </motion.div>
        </div>

        {/* ✨ gambar masuk dari kanan, pakai komponen ScrollAnimation kamu sendiri */}
        <ScrollAnimation direction="left" delay={0.3} className="relative mx-auto w-full max-w-sm">
          <div className="relative aspect-square rounded-[3rem] bg-brand-purple p-4 shadow-[0_10px_0_0_#5B1FB0]">
            <img
              src={foto2}
              alt="Ilustrasi belajar di Deen"
              className="h-full w-full rounded-4xl object-cover"
            />
          </div>

          <div className="absolute -left-8 top-6 motion-safe:animate-float rounded-2xl bg-white px-4 py-2.5 shadow-[0_4px_0_0_#E4D6FB]">
            <p className="font-display text-sm font-extrabold text-brand-purple">
              +50 XP
            </p>
          </div>
          <div className="absolute -right-6 top-1/2 motion-safe:animate-float [animation-delay:1.2s] rounded-2xl bg-white px-4 py-2.5 shadow-[0_4px_0_0_#FCE7A8] flex items-center gap-1.5">
            <FlameIcon className="h-4 w-4 text-brand-amber" />
            <p className="font-display text-sm font-extrabold text-brand-ink">
              7 Hari
            </p>
          </div>
          <div className="absolute -bottom-6 left-10 motion-safe:animate-float [animation-delay:0.6s] rounded-2xl bg-white px-4 py-2.5 shadow-[0_4px_0_0_#BFE7FF]">
            <p className="font-display text-sm font-extrabold text-brand-blue">
              Level Up!
            </p>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}