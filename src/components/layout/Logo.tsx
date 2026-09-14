import { clsx } from "../../lib/clsx";

/**
 * Wraps the user-provided `public/logo1.svg`.
 * `withWordmark` also renders the "Deen" text next to the mark, for places
 * where the SVG is icon-only.
 */
export function Logo({
  withWordmark = true,
  size = 50,
  wordmarkClassName,
  className,
}: {
  withWordmark?: boolean;
  size?: number;
  wordmarkClassName?: string;
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center gap-2", className)}>
      <img
        src="/logoo.svg"
        alt="Deen"
        width={size}
        height={size}
        className="shrink-0"
      />
      {withWordmark && (
        <span
          className={clsx(
            "font-display text-xl font-extrabold text-brand-ink",
            wordmarkClassName
          )}
        >
        </span>
      )}
    </span>
  );
}
