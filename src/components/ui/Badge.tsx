import type { ReactNode } from "react";
import { clsx } from "../../lib/clsx";

type Tone = "purple" | "amber" | "gold" | "blue" | "cream";

const TONE_CLASSES: Record<Tone, string> = {
  purple: "bg-brand-purple text-white",
  amber: "bg-brand-amber text-brand-ink",
  gold: "bg-brand-gold text-brand-ink",
  blue: "bg-brand-blue text-white",
  cream: "bg-white text-brand-ink border-2 border-brand-ink/10",
};

export function Badge({
  tone = "purple",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold font-display shadow-sm",
        TONE_CLASSES[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
