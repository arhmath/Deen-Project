import { Link, type LinkProps } from "react-router-dom";
import { clsx } from "../../lib/clsx";

const VARIANT = {
  primary: "bg-brand-purple text-white shadow-[0_5px_0_0_#5B1FB0] hover:brightness-110",
  secondary: "bg-brand-amber text-night shadow-[0_5px_0_0_#CC8A00] hover:brightness-105",
  outline: "border-2 border-brand-ink/15 bg-surface text-brand-ink hover:border-brand-purple/50",
};

/** Link bergaya tombol — menghindari <a><button> bersarang. */
export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: LinkProps & { variant?: keyof typeof VARIANT }) {
  return (
    <Link
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-display font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue active:translate-y-0.5",
        VARIANT[variant],
        className
      )}
      {...props}
    />
  );
}
