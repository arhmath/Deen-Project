import { clsx } from "../../lib/clsx";
import type { BadgeState } from "../../types/badge";

const SIZE = {
  md: "h-[72px] w-[72px]",
  lg: "h-36 w-36",
};

/** Gambar badge. Badge yang belum didapat tampil abu-abu dengan gembok kecil. */
export function BadgeIcon({ badge, size = "md" }: { badge: BadgeState; size?: keyof typeof SIZE }) {
  const locked = !badge.earned;
  return (
    <span className={clsx("relative inline-block shrink-0", SIZE[size])} aria-hidden="true">
      <img
        src={badge.image}
        alt=""
        loading="lazy"
        draggable={false}
        className={clsx("h-full w-full object-contain", locked && "opacity-50 grayscale")}
      />
      {locked && (
        <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full border-2 border-surface bg-brand-ink/70 text-white">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <rect x="4.5" y="9" width="11" height="7.5" rx="2" />
            <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
          </svg>
        </span>
      )}
    </span>
  );
}
