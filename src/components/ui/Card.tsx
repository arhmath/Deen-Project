import type { HTMLAttributes } from "react";
import { clsx } from "../../lib/clsx";

/** Kartu "chunky": border tebal + bayangan offset, senada dengan Button. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-3xl border-2 border-brand-ink/10 bg-surface p-5 shadow-[0_4px_0_0_rgba(35,19,52,0.06)]",
        className
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={clsx("font-display text-lg font-extrabold text-brand-ink", className)} {...rest} />;
}
