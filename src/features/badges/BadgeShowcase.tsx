import { useState } from "react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Dialog } from "../../components/ui/Dialog";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Skeleton } from "../../components/ui/Skeleton";
import { clsx } from "../../lib/clsx";
import {
  BADGE_CATEGORY_HINT,
  BADGE_CATEGORY_ICON,
  BADGE_CATEGORY_LABEL,
  type BadgeAccent,
  type BadgeCategory,
  type BadgeState,
} from "../../types/badge";
import { BADGE_CATEGORY_ORDER } from "./catalog";
import { BadgeIcon } from "./BadgeIcon";
import { useBadges } from "./useBadges";

const CHIP: Record<BadgeAccent, string> = {
  orange: "bg-orange-200 text-orange-900",
  slate: "bg-indigo-100 text-indigo-800",
  green: "bg-emerald-100 text-emerald-800",
  blue: "bg-sky-100 text-sky-800",
  purple: "bg-violet-100 text-violet-800",
  gold: "bg-amber-200 text-amber-900",
  pink: "bg-fuchsia-200 text-fuchsia-900",
};

/** Lebar kartu & jumlah kolom per kategori (susunan mengikuti desain koleksi badge). */
const LAYOUT: Record<BadgeCategory, { card: string; grid: string }> = {
  LEVEL: { card: "lg:col-span-7", grid: "grid-cols-3 sm:grid-cols-5" },
  STREAK: { card: "lg:col-span-5", grid: "grid-cols-2 sm:grid-cols-4" },
  LEARNING: { card: "lg:col-span-4", grid: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4" },
  CHECKIN: { card: "lg:col-span-4", grid: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4" },
  EXPLORATION: { card: "lg:col-span-4", grid: "grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4" },
  SPECIAL: { card: "lg:col-span-9", grid: "grid-cols-2 sm:grid-cols-4" },
};

function statusOf(b: BadgeState) {
  if (b.comingSoon) return "Segera hadir";
  if (b.earned) return "Sudah didapat";
  return `${b.current} dari ${b.goal}`;
}

function BadgeTile({ badge, onOpen }: { badge: BadgeState; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${badge.title}. ${statusOf(badge)}. Lihat detail`}
        className="group flex h-full w-full flex-col items-center gap-1.5 rounded-2xl p-2 text-center transition-colors hover:bg-brand-purple/5 focus-visible:outline-2 focus-visible:outline-brand-blue"
      >
        <span className="motion-safe:transition-transform motion-safe:group-hover:-translate-y-0.5">
          <BadgeIcon badge={badge} />
        </span>
        <span className={clsx("rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold leading-tight", CHIP[badge.accent], !badge.earned && "opacity-60")}>
          {badge.chip}
        </span>
        <span className={clsx("font-display text-sm font-extrabold leading-tight", !badge.earned && "text-brand-ink/60")}>{badge.title}</span>
        <span className="text-[11px] leading-snug text-brand-ink/55">{badge.description}</span>
        {!badge.earned && !badge.comingSoon && (
          <ProgressBar value={badge.progress * 100} label={`Progres ${badge.title}`} tone="purple" className="mt-auto !h-1.5 max-w-16" />
        )}
        {badge.comingSoon && <span className="mt-auto text-[11px] font-bold text-brand-ink/45">Segera hadir</span>}
      </button>
    </li>
  );
}

function BadgeDetail({ badge, onClose }: { badge: BadgeState | null; onClose: () => void }) {
  return (
    <Dialog open={!!badge} onClose={onClose} labelledBy="badge-detail-title">
      {badge && (
        <div className="rounded-3xl border-2 border-brand-ink/10 bg-surface p-7 text-center shadow-[0_8px_0_0_rgba(35,19,52,0.08)]">
          <div className="flex justify-center">
            <BadgeIcon badge={badge} size="lg" />
          </div>
          <span className={clsx("mt-3 inline-block rounded-full px-3 py-0.5 font-display text-xs font-bold", CHIP[badge.accent])}>{badge.chip}</span>
          <h2 id="badge-detail-title" className="mt-1 font-display text-2xl font-extrabold">{badge.title}</h2>
          <p className="mt-1 text-sm text-brand-ink/70">{badge.description}</p>
          <p className="mt-0.5 text-xs text-brand-ink/50">{BADGE_CATEGORY_LABEL[badge.category]}</p>
          <div className="mt-4">
            {badge.comingSoon ? (
              <p className="rounded-2xl bg-brand-ink/5 px-4 py-2 text-sm font-bold text-brand-ink/60">Badge ini segera hadir.</p>
            ) : badge.earned ? (
              <p className="rounded-2xl bg-green-100 px-4 py-2 text-sm font-bold text-green-800">Selamat, badge ini sudah kamu dapatkan! 🎉</p>
            ) : (
              <>
                <ProgressBar value={badge.progress * 100} label={`Progres ${badge.title}`} tone="purple" />
                <p className="mt-2 text-sm font-bold text-brand-ink/60">{badge.current} dari {badge.goal}</p>
              </>
            )}
          </div>
          <Button className="mt-5" fullWidth onClick={onClose}>Tutup</Button>
        </div>
      )}
    </Dialog>
  );
}

/** Di mobile hanya kategori awal yang tampil; sisanya muncul lewat "Baca selengkapnya". */
const PREVIEW_CATEGORIES = 2;

export function BadgeShowcase({ className }: { className?: string }) {
  const { badges, isLoading, isError } = useBadges();
  const [selected, setSelected] = useState<BadgeState | null>(null);
  const [expanded, setExpanded] = useState(false);

  const countable = badges.filter((b) => !b.comingSoon);
  const earned = countable.filter((b) => b.earned).length;

  return (
    <section className={className} aria-labelledby="badge-collection-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="badge-collection-title" className="font-display text-2xl font-extrabold text-brand-purple-fg">Koleksi Badge Achievements</h2>
          <p className="text-sm text-brand-ink/60">Setiap langkah kecil ilmu adalah pencapaian besar. Kumpulkan semua badge dan tunjukkan perjalanan terbaikmu di Deen!</p>
        </div>
        {badges.length > 0 && (
          <div className="w-44 shrink-0">
            <p className="mb-1 text-right text-sm font-bold text-brand-ink/60">{earned} dari {countable.length} badge</p>
            <ProgressBar value={countable.length ? (earned / countable.length) * 100 : 0} label="Total badge didapat" tone="amber" />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div>
      ) : isError ? (
        <p role="alert" className="text-sm font-bold text-red-600">Badge belum bisa dimuat. Muat ulang halaman ya.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          {BADGE_CATEGORY_ORDER.map((cat, catIndex) => {
            const list = badges.filter((b) => b.category === cat);
            if (!list.length) return null;
            // mobile: kategori di luar preview disembunyikan sampai diperluas; desktop selalu tampil
            const hiddenOnMobile = !expanded && catIndex >= PREVIEW_CATEGORIES;
            return (
              <Card key={cat} className={clsx("p-4 sm:p-5", LAYOUT[cat].card, hiddenOnMobile && "hidden lg:block")} aria-labelledby={`badge-cat-${cat}`}>
                <div className="mb-3 flex items-center gap-3">
                  <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand-purple/10 text-xl">{BADGE_CATEGORY_ICON[cat]}</span>
                  <div className="min-w-0">
                    <CardTitle id={`badge-cat-${cat}`} className="leading-tight">{BADGE_CATEGORY_LABEL[cat]}</CardTitle>
                    <p className="text-xs text-brand-ink/55">{BADGE_CATEGORY_HINT[cat]}</p>
                  </div>
                </div>
                <ul className={clsx("grid gap-1", LAYOUT[cat].grid)}>
                  {list.map((b) => <BadgeTile key={b.id} badge={b} onOpen={() => setSelected(b)} />)}
                </ul>
              </Card>
            );
          })}

          <Card className={clsx("items-center gap-4 bg-brand-purple/5 p-4 sm:p-5 lg:col-span-3 lg:flex lg:flex-col lg:justify-center lg:text-center", expanded ? "flex" : "hidden")}>
            <img src="/ziya-idle.png" alt="" className="h-20 w-20 shrink-0 object-contain motion-safe:animate-float" />
            <p className="text-sm font-bold text-brand-ink/70">Kumpulkan semua badge, dan jadilah versi terbaik dari dirimu!</p>
          </Card>

          <div className="flex justify-center lg:hidden">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Tampilkan lebih sedikit" : "Baca selengkapnya"}
            </Button>
          </div>
        </div>
      )}

      <BadgeDetail badge={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
