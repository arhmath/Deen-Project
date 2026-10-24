import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Logo } from "../layout/Logo";
import { ButtonLink } from "../ui/ButtonLink";
import { ThemeToggle } from "../ui/ThemeToggle";
import { clsx } from "../../lib/clsx";

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Belajar", href: "#cara-belajar" },
  { label: "Kata Orang Tua", href: "#testimoni" },
];

/** Scroll halus ke atas halaman — lewat ScrollSmoother bila aktif, jika tidak lewat window. */
function scrollToTop() {
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(0, true);
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Navbar `fixed` berada DI LUAR #smooth-content (sticky/fixed tidak berfungsi di dalam
  // elemen yang di-transform ScrollSmoother). Tingginya dipublikasikan sebagai CSS variable
  // supaya halaman bisa memberi ruang di atas konten dan offset saat scroll ke section.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty("--landing-nav-h", `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.removeProperty("--landing-nav-h");
    };
  }, []);

  // Dua kondisi: di paling atas navbar menempel & solid; setelah di-scroll berubah jadi "gelembung" melayang.
  useEffect(() => {
    // window.scrollY tetap akurat walau ScrollSmoother aktif (native scroll dipertahankan).
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /** Link anchor memakai ScrollSmoother.scrollTo — `#hash` bawaan browser tidak akurat di konten ber-transform. */
  function handleAnchorClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    const target = document.querySelector<HTMLElement>(href);
    setOpen(false);
    if (!target) return;
    e.preventDefault();
    const offset = (headerRef.current?.offsetHeight ?? 72) + 8;
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo(target, true, `top ${offset}px`);
    } else {
      const y = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    window.history.replaceState(null, "", href);
  }

  function handleLogoClick(e: MouseEvent<HTMLAnchorElement>) {
    setOpen(false);
    if (pathname === "/") {
      e.preventDefault();
      scrollToTop();
      window.history.replaceState(null, "", "/");
    }
  }

  const linkCls =
    "rounded-full px-3.5 py-1.5 font-display text-sm font-bold text-brand-ink/70 transition-colors hover:bg-brand-purple/10 hover:text-brand-purple-fg";

  return (
    // Tinggi <header> dibuat konstan (tidak ada padding/margin yang berubah) supaya spacer
    // `--landing-nav-h` stabil. Efek "turun jadi gelembung" memakai translate (tidak memengaruhi layout).
    <header ref={headerRef} className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <nav
        className={clsx(
          "pointer-events-auto mx-auto w-full border-2 backdrop-blur-md",
          "transition-[max-width,border-radius,transform,background-color,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? "max-w-5xl translate-y-3 rounded-[2rem] border-brand-purple/15 bg-brand-cream/80 shadow-[0_10px_30px_rgba(124,58,237,0.16)]"
            : "max-w-full translate-y-0 rounded-none border-transparent border-b-brand-ink/10 bg-brand-cream shadow-none"
        )}
        aria-label="Navigasi utama"
      >
        <div
          className={clsx(
            "mx-auto flex max-w-6xl items-center gap-2 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            scrolled ? "py-2.5 pl-5 pr-2.5" : "px-5 py-2.5"
          )}
        >
          <Link to="/" aria-label="Ke beranda Deen" onClick={handleLogoClick} className="mr-2 shrink-0">
            <Logo />
          </Link>

          {/* Menu dirapatkan di sebelah logo (bukan di tengah) */}
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={(e) => handleAnchorClick(e, link.href)} className={linkCls}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <ThemeToggle className="h-9 w-9" />
            <Link to="/login" className={linkCls}>
              Masuk
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-brand-purple px-5 py-2 font-display text-sm font-semibold tracking-wide text-white shadow-[0_3px_0_0_#5B1FB0] transition hover:brightness-110 active:translate-y-0.5 active:shadow-[0_1px_0_0_#5B1FB0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              Daftar Gratis
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-brand-ink/10"
              aria-expanded={open}
              aria-controls="landing-mobile-menu"
              aria-label={open ? "Tutup menu" : "Buka menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">Menu</span>
              <div className="relative h-4 w-5" aria-hidden="true">
                <span className={clsx("absolute left-0 h-0.5 w-5 rounded bg-brand-ink transition-all duration-200", open ? "top-1.5 rotate-45" : "top-0")} />
                <span className={clsx("absolute left-0 top-1.5 h-0.5 w-5 rounded bg-brand-ink transition-opacity duration-200", open && "opacity-0")} />
                <span className={clsx("absolute left-0 h-0.5 w-5 rounded bg-brand-ink transition-all duration-200", open ? "top-1.5 -rotate-45" : "top-3")} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div
          id="landing-mobile-menu"
          className={clsx(
            "pointer-events-auto mx-auto bg-brand-cream/95 p-4 backdrop-blur-md motion-safe:animate-fade-up md:hidden",
            scrolled
              ? "mt-5 max-w-5xl rounded-3xl border-2 border-brand-purple/15 shadow-[0_16px_40px_rgba(124,58,237,0.16)]"
              : "max-w-full border-b-2 border-brand-ink/10"
          )}
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-2xl px-4 py-2.5 font-display text-sm font-bold text-brand-ink/80 hover:bg-brand-purple/10"
                  onClick={(e) => handleAnchorClick(e, link.href)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-3 border-t-2 border-brand-ink/5 pt-4">
            <ButtonLink to="/login" variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Masuk
            </ButtonLink>
            <ButtonLink to="/register" className="w-full" onClick={() => setOpen(false)}>
              Daftar Gratis
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
