import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { Logo } from "./Logo";
import { StarIcon, SparkleIcon, FlameIcon } from "../landing/DecorativeIcons";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-purple p-10 text-white md:flex">
        <SparkleIcon
          className="absolute left-16 top-20 h-6 w-6 text-brand-gold motion-safe:animate-twinkle"
          aria-hidden="true"
        />
        <StarIcon
          className="absolute right-20 top-40 h-5 w-5 text-brand-yellow motion-safe:animate-twinkle [animation-delay:1s]"
          aria-hidden="true"
        />

        <Link to="/">
          <Logo wordmarkClassName="text-white" />
        </Link>

        <div className="relative z-10 max-w-sm">
          <h2 className="font-display text-3xl font-extrabold leading-tight">
            Setiap ayat yang dipelajari adalah satu langkah naik level.
          </h2>
          <p className="mt-4 font-body text-white/75">
            Gabung bareng ribuan santri lain yang belajar ngaji sambil main.
          </p>
        </div>

        <div className="relative z-10 flex gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-bold">
            <FlameIcon className="h-4 w-4 text-brand-amber" />
            Daily Check-in Harian
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-bold">
            <StarIcon className="h-4 w-4 text-brand-gold" />
            Leaderboard
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center bg-brand-cream px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-8 flex justify-center md:hidden">
            <Logo />
          </Link>

          <h1 className="font-display text-2xl font-extrabold text-brand-ink">
            {title}
          </h1>
          <p className="mt-1.5 font-body text-brand-ink/60">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-6 text-center font-body text-sm text-brand-ink/60">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
