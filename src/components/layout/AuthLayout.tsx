import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { StarIcon, SparkleIcon, FlameIcon } from "../landing/DecorativeIcons";
import { clsx } from "../../lib/clsx";
import { ThemeToggle } from "../ui/ThemeToggle";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  /** Path ke ilustrasi/foto untuk panel brand (asset milikmu sendiri). */
  imageSrc: string;
  imageAlt: string;
  imageHeadline: string;
  imageCaption: string;
  /**
   * Sisi panel gambar pada breakpoint `md` ke atas.
   * Login pakai "right", Register pakai "left".
   */
  imagePosition?: "left" | "right";
  /**
   * Varian padat untuk form panjang (Register): kartu lebih lebar & spasi lebih rapat
   * supaya muat satu layar tanpa scroll. Login tetap memakai tampilan default.
   */
  compact?: boolean;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  imageSrc,
  imageAlt,
  imageHeadline,
  imageCaption,
  imagePosition = "left",
  compact = false,
}: AuthLayoutProps) {
  const isImageRight = imagePosition === "right";

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Image panel */}
      <div
        className={clsx(
          "relative hidden overflow-hidden bg-brand-purple md:flex md:flex-col md:justify-between md:p-10",
          isImageRight ? "md:order-2" : "md:order-1"
        )}
      >
        <img
          key={imageSrc}
          src={imageSrc}
          alt={imageAlt}
          className="absolute inset-0 h-full w-full object-cover motion-safe:animate-fade-in-zoom"
        />
        {/* Scrim supaya teks/badge tetap kebaca di atas foto apa pun */}
        <div className="absolute inset-0 bg-linear-to-t from-brand-purple via-brand-purple/10 to-brand-purple/3" />

        <SparkleIcon
          className="absolute left-16 top-20 z-10 h-6 w-6 text-brand-gold motion-safe:animate-twinkle"
          aria-hidden="true"
        />
        <StarIcon
          className="absolute right-20 top-40 z-10 h-5 w-5 text-brand-yellow motion-safe:animate-twinkle [animation-delay:1s]"
          aria-hidden="true"
        />

        <Link to="/" className="relative z-10 motion-safe:animate-fade-up">
          <Logo wordmarkClassName="text-white" />
        </Link>

        <div
          key={imageHeadline}
          className="relative z-10 max-w-sm motion-safe:animate-fade-up [animation-delay:150ms]"
        >
          <h2 className="font-display text-3xl font-extrabold leading-tight text-white">
            {imageHeadline}
          </h2>
          <p className="mt-4 font-body text-white/75">{imageCaption}</p>
        </div>

        <div className="relative z-10 flex gap-3 motion-safe:animate-fade-up [animation-delay:300ms]">
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
            <FlameIcon className="h-4 w-4 text-brand-amber" />
            Daily Check-in Harian
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
            <StarIcon className="h-4 w-4 text-brand-gold" />
            Leaderboard
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div
        className={clsx(
          "relative flex flex-col justify-center bg-brand-cream overflow-hidden",
          compact ? "p-3 sm:p-4" : "p-6 sm:p-12",
          isImageRight ? "md:order-1" : "md:order-2"
        )}
      >
        {/* Background Pattern Tipis (Opsional untuk estetika tambahan) */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#7c3aed_0.75px,transparent_0.75px)] [bg-size:16px_16px]" />

        <div className="absolute right-4 top-4 z-20 hidden sm:right-6 sm:top-6 md:block">
          <ThemeToggle />
        </div>

        {/* --- CONTAINER KOTAK / CARD FORM --- */}
        <div
          className={clsx(
            "relative z-10 mx-auto w-full rounded-3xl bg-surface border-2 border-brand-purple/15 shadow-[0_20px_50px_rgba(124,58,237,0.12)]",
            compact ? "max-w-md lg:max-w-xl p-6" : "max-w-md p-6 sm:p-10"
          )}
        >
          {/* Mobile: toggle tema di pojok kanan atas kartu (login & register sama posisinya) */}
          <div className="absolute right-3 top-3 z-20 md:hidden">
            <ThemeToggle />
          </div>

          <Link to="/" className={clsx("flex justify-center md:hidden", compact ? "mb-4" : "mb-6")}>
            <Logo />
          </Link>

          <div className="motion-safe:animate-fade-up">
            <h1 className="font-display text-2xl font-extrabold text-brand-ink">
              {title}
            </h1>
            <p className="mt-1.5 font-body text-brand-ink/60">{subtitle}</p>
          </div>

          <div className={clsx("motion-safe:animate-fade-up [animation-delay:120ms]", compact ? "mt-5" : "mt-8")}>
            {children}
          </div>

          <div className={clsx("text-center font-body text-sm text-brand-ink/60 motion-safe:animate-fade-up [animation-delay:220ms]", compact ? "mt-4" : "mt-6")}>
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}