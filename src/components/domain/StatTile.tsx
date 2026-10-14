import type { ReactNode } from "react";
import { clsx } from "../../lib/clsx";

export function StatTile({
  icon,
  label,
  value,
  hint,
  iconClassName,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: string;
  iconClassName?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border-2 border-brand-ink/10 bg-white p-4">
      <span className={clsx("grid h-12 w-12 shrink-0 place-items-center rounded-2xl [&>svg]:h-6 [&>svg]:w-6", iconClassName)}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-ink/60">{label}</p>
        <p className="font-display text-2xl font-extrabold leading-tight text-brand-ink">{value}</p>
        {hint && <p className="text-xs text-brand-ink/50">{hint}</p>}
      </div>
    </div>
  );
}
