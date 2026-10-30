import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Logo } from "../layout/Logo";

const FOOTER_LINKS = {
  jelajahi: [
    { label: "Fitur Deen", href: "#fitur", section: true },
    { label: "Cara Belajar", href: "#cara-belajar", section: true },
    { label: "Cerita Pengguna", href: "#testimoni", section: true },
  ],
  akun: [
    { label: "Masuk", href: "/login" },
    { label: "Daftar sebagai Santri", href: "/register" },
    { label: "Daftar sebagai Pendidik", href: "/daftar-pendidik" },
  ],
} as const;

function handleSectionClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
  const target = document.querySelector<HTMLElement>(href);
  if (!target) return;

  event.preventDefault();
  const offset = 88;
  const smoother = ScrollSmoother.get();

  if (smoother) {
    smoother.scrollTo(target, true, `top ${offset}px`);
  } else {
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  window.history.replaceState(null, "", href);
}

const linkClass =
  "inline-flex w-fit items-center rounded-lg py-1 text-sm font-semibold text-brand-ink/65 transition-colors hover:text-brand-purple-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-purple-fg";

export function LandingFooter() {
  return (
    <footer className="relative overflow-hidden bg-surface px-5 pb-6 pt-14 text-brand-ink sm:pt-16">
      <div className="relative mx-auto max-w-6xl">
        <div className="grid gap-10 border-b border-brand-ink/10 pb-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:gap-12 lg:pb-12">
          <div className="max-w-sm">
            <Link to="/" aria-label="Deen — kembali ke beranda" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-purple-fg">
              <Logo size={44} withWordmark={false} />
              <span className="font-display text-3xl font-extrabold tracking-tight text-brand-ink">Deen<span className="text-brand-gold">.</span></span>
            </Link>
            <p className="mt-4 max-w-xs font-body text-sm leading-7 text-brand-ink/65">
              Teman belajar ngaji yang bikin proses belajar terasa lebih seru,
              terarah, dan menyenangkan setiap hari.
            </p>
          </div>

          <nav aria-label="Jelajahi Deen">
            <h2 className="font-display text-base font-extrabold text-brand-ink">Jelajahi</h2>
            <ul className="mt-4 flex flex-col items-start gap-2">
              {FOOTER_LINKS.jelajahi.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(event) => handleSectionClick(event, item.href)}
                    className={linkClass}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Akun Deen">
            <h2 className="font-display text-base font-extrabold text-brand-ink">Mulai Bersama Deen</h2>
            <ul className="mt-4 flex flex-col items-start gap-2">
              {FOOTER_LINKS.akun.map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="font-display text-base font-extrabold text-brand-ink">Bantuan & Informasi</h2>
            <p className="mt-4 max-w-xs text-sm leading-6 text-brand-ink/65">
              Punya pertanyaan seputar Deen, akun, atau penggunaan layanan?
              Hubungi tim kami melalui email.
            </p>
            <a
              href="mailto:halo@deen.app"
              className="mt-3 inline-flex items-center gap-2 rounded-lg text-sm font-extrabold text-brand-purple-fg transition-colors hover:text-brand-purple focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-purple-fg"
            >
              halo@deen.app
              <span aria-hidden="true">↗</span>
            </a>
            <div className="mt-5">
              <Link to="/terms" className={linkClass}>
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 text-xs text-brand-ink/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Deen. Seluruh hak cipta dilindungi.</p>
          <p className="font-semibold tracking-wide">Belajar ngaji jadi seru, setiap hari.</p>
        </div>
      </div>
    </footer>
  );
}
