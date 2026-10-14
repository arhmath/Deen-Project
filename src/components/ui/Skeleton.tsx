import { clsx } from "../../lib/clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx("rounded-2xl bg-brand-ink/8 motion-safe:animate-pulse", className)}
    />
  );
}
