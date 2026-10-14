import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-extrabold leading-tight text-brand-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-prose text-brand-ink/60">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
