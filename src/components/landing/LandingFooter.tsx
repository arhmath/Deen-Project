import { Link } from "react-router-dom";
import { Logo } from "../layout/Logo";

export function LandingFooter() {
  return (
    <footer className="border-t-2 border-brand-ink/5 px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
        <Logo size={32} />
        <Link to="/terms" className="font-body text-sm font-semibold text-brand-ink/60 hover:text-brand-purple-fg hover:underline">
          Syarat & Ketentuan
        </Link>
        <p className="font-body text-sm text-brand-ink/50">
          © {new Date().getFullYear()} Deen. Belajar ngaji jadi seru, setiap hari.
        </p>
      </div>
    </footer>
  );
}
