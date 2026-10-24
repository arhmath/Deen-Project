import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { NAV_BY_ROLE } from "./navConfig";
import { clsx } from "../../lib/clsx";
import { useSessionUser } from "../../hooks/useSessionUser";
import { useLogout } from "../../features/auth/useAuth";
import { useSantriDashboard } from "../../features/dashboard/queries";
import { CloseIcon, LogoutIcon, MenuIcon } from "../ui/DashIcons";
import { FlameIcon, StarIcon } from "../landing/DecorativeIcons";
import { CoinIcon } from "../ui/DashIcons";
import { ROLE_LABEL } from "../../types/user";
import { initials, formatNumber } from "../../utils/format";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { ThemeToggle } from "../ui/ThemeToggle";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const user = useSessionUser();
  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-1.5">
      {NAV_BY_ROLE[user.role].map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              "flex items-center gap-3 rounded-2xl px-4 py-3 font-display text-base font-bold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
              isActive
                ? "bg-brand-purple text-white shadow-[0_4px_0_0_#5B1FB0]"
                : "text-brand-ink/70 hover:bg-brand-purple/8 hover:text-brand-purple-fg"
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserCard() {
  const user = useSessionUser();
  const navigate = useNavigate();
  const logout = useLogout();
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-brand-ink/10 bg-surface p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-amber font-display font-extrabold text-night" aria-hidden="true">
        {initials(user.name)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-extrabold text-brand-ink">{user.name}</p>
        <p className="truncate text-xs text-brand-ink/55">{ROLE_LABEL[user.role]}</p>
      </div>
      <button
        type="button"
        aria-label="Keluar"
        title="Keluar"
        onClick={() => logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) })}
        className="grid h-9 w-9 place-items-center rounded-xl text-brand-ink/55 hover:bg-red-50 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-brand-blue"
      >
        <LogoutIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

/** Chip XP/streak/point di topbar — memakai cache query yang sama dengan dashboard. */
function GameChips() {
  const { data } = useSantriDashboard();
  if (!data) return null;
  const g = data.gamification;
  const chip = "inline-flex items-center gap-1.5 rounded-full border-2 border-brand-ink/10 bg-surface px-3 py-1 font-display text-sm font-extrabold";
  return (
    <ul className="flex items-center gap-2" aria-label="Ringkasan reward">
      <li className={clsx(chip, "text-brand-ink")}>
        <FlameIcon className={clsx("h-4 w-4", g.checkedInToday ? "text-brand-amber" : "text-brand-ink/25")} />
        <span>{g.streak}<span className="sr-only"> hari beruntun</span></span>
      </li>
      <li className={clsx(chip, "text-brand-ink")}>
        <StarIcon className="h-4 w-4 text-brand-gold" />
        <span>{formatNumber(g.xp)}<span className="sr-only"> XP</span></span>
      </li>
      <li className={clsx(chip, "hidden text-brand-ink sm:inline-flex")}>
        <CoinIcon className="h-4 w-4 text-brand-blue" />
        <span>{formatNumber(g.point)}<span className="sr-only"> point</span></span>
      </li>
    </ul>
  );
}

export function DashboardLayout() {
  const user = useSessionUser();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  return (
    <div className="min-h-screen bg-brand-cream lg:grid lg:grid-cols-[17rem_1fr]">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-brand-purple focus:px-4 focus:py-2 focus:font-bold focus:text-white"
      >
        Lewati ke konten
      </a>

      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-6 border-r-2 border-brand-ink/10 bg-surface/70 p-5 lg:flex">
        <Link to={user.role === "ADMIN" ? "/admin" : "/dashboard"} className="px-1" aria-label="Deen — beranda">
          <Logo />
        </Link>
        <div className="flex-1 overflow-y-auto"><NavList /></div>
        <UserCard />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b-2 border-brand-ink/10 bg-brand-cream/90 px-4 py-3 backdrop-blur sm:px-8">
          <button
            type="button"
            aria-label="Buka menu"
            aria-expanded={drawer}
            onClick={() => setDrawer(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border-2 border-brand-ink/10 bg-surface text-brand-ink lg:hidden focus-visible:outline-2 focus-visible:outline-brand-blue"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <p className="hidden font-display text-sm font-bold text-brand-ink/55 lg:block">
            {ROLE_LABEL[user.role]}
          </p>
          <div className="flex items-center gap-3">
            {user.role === "SANTRI" ? <GameChips /> : <span className="font-display text-sm font-bold text-brand-ink/70 lg:hidden">{user.name}</span>}
            <ThemeToggle />
          </div>
        </header>

        <main id="konten" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-8 sm:py-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-night/50" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col gap-6 bg-brand-cream p-5 shadow-xl motion-safe:animate-fade-up">
            <div className="flex items-center justify-between">
              <Logo />
              <button type="button" aria-label="Tutup menu" onClick={() => setDrawer(false)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-brand-ink/5">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto"><NavList onNavigate={() => setDrawer(false)} /></div>
            <UserCard />
          </div>
        </div>
      )}
    </div>
  );
}
