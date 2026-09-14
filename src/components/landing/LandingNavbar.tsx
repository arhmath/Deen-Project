import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../layout/Logo";
import { Button } from "../ui/Button";

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Belajar", href: "#cara-belajar" },
  { label: "Kata Orang Tua", href: "#testimoni" },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b-2 border-brand-ink/5 bg-brand-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" aria-label="Ke beranda Deen">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
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
          <Link to="/register">
            <Button size="sm">Mulai Belajar</Button>
          </Link>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-ink/10 md:hidden"
          aria-expanded={open}
          aria-label="Buka menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1">
            <span className="h-0.5 w-5 bg-brand-ink" />
            <span className="h-0.5 w-5 bg-brand-ink" />
            <span className="h-0.5 w-5 bg-brand-ink" />
          </div>
        </button>
      </nav>

      {open && (
        <div className="border-t-2 border-brand-ink/5 bg-brand-cream px-5 pb-5 md:hidden">
          <ul className="flex flex-col gap-4 pt-4">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-display text-sm font-bold text-brand-ink/70"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3">
            <Link to="/login" onClick={() => setOpen(false)}>
              <Button variant="outline" fullWidth>
                Masuk
              </Button>
            </Link>
            <Link to="/register" onClick={() => setOpen(false)}>
              <Button fullWidth>Mulai Belajar</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
