import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { Logo } from "../layout/Logo";
import { ButtonLink } from "../ui/ButtonLink";

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

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-40 border-b-2 border-brand-ink/5 bg-brand-cream/90 backdrop-blur"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4" aria-label="Navigasi utama">
        <Link to="/" aria-label="Ke beranda Deen" onClick={handleLogoClick}>
          <Logo />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="font-display text-sm font-bold text-brand-ink/70 hover:text-brand-purple"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            className="font-display text-sm font-bold text-brand-ink/70 hover:text-brand-purple"
          >
            Masuk
          </Link>
          <ButtonLink to="/register" className="px-5 py-2 text-sm">
            Mulai Belajar
          </ButtonLink>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-ink/10 md:hidden"
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1" aria-hidden="true">
            <span className="h-0.5 w-5 bg-brand-ink" />
            <span className="h-0.5 w-5 bg-brand-ink" />
            <span className="h-0.5 w-5 bg-brand-ink" />
          </div>
        </button>
      </nav>

      {open && (
        <div id="landing-mobile-menu" className="border-t-2 border-brand-ink/5 bg-brand-cream px-5 pb-5 md:hidden">
          <ul className="flex flex-col gap-4 pt-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-display text-sm font-bold text-brand-ink/70"
                  onClick={(e) => handleAnchorClick(e, link.href)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3">
            <ButtonLink to="/login" variant="outline" className="w-full" onClick={() => setOpen(false)}>
              Masuk
            </ButtonLink>
            <ButtonLink to="/register" className="w-full" onClick={() => setOpen(false)}>
              Mulai Belajar
            </ButtonLink>
          </div>
        </div>
      )}
    </header>
  );
}
