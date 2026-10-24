import type { ReactNode } from "react";
import { clsx } from "../../lib/clsx";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-brand-ink/15 bg-surface/60 px-6 py-10 text-center",
        className
      )}
    >
      {icon && <div className="mb-1 text-brand-purple-fg/70 [&>svg]:h-10 [&>svg]:w-10">{icon}</div>}
      <p className="font-display text-lg font-extrabold text-brand-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-brand-ink/60">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
