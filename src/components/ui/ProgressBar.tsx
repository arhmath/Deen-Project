import { clsx } from "../../lib/clsx";

interface Props {
  value: number;
  label: string;
  tone?: "amber" | "purple" | "blue" | "gold";
  size?: "sm" | "lg";
  onDark?: boolean;
  className?: string;
}

const FILL = {
  amber: "bg-brand-amber",
  purple: "bg-brand-purple",
  blue: "bg-brand-blue",
  gold: "bg-brand-gold",
};

export function ProgressBar({ value, label, tone = "purple", size = "sm", onDark, className }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={clsx(
        "w-full overflow-hidden rounded-full",
        size === "lg" ? "h-5" : "h-3",
        onDark ? "bg-black/25" : "bg-brand-ink/10",
        className
      )}
    >
      <div
        className={clsx("h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700", FILL[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
