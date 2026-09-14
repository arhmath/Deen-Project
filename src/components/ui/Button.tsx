import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import { clsx } from "../../lib/clsx";

type Variant = "primary" | "secondary" | "sky" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * "Chunky" game-button: a solid offset shadow that compresses on press,
 * instead of the generic soft/blurred SaaS shadow. Colors map 1:1 to the
 * Deen brand palette rather than a neutral gray scale.
 */
const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-purple text-white shadow-[0_5px_0_0_#5B1FB0] hover:brightness-105 active:shadow-[0_1px_0_0_#5B1FB0]",
  secondary:
    "bg-brand-amber text-brand-ink shadow-[0_5px_0_0_#CC8A00] hover:brightness-105 active:shadow-[0_1px_0_0_#CC8A00]",
  sky:
    "bg-brand-blue text-white shadow-[0_5px_0_0_#0072B8] hover:brightness-105 active:shadow-[0_1px_0_0_#0072B8]",
  outline:
    "bg-white text-brand-purple border-2 border-brand-purple shadow-[0_5px_0_0_#E4D6FB] active:shadow-[0_1px_0_0_#E4D6FB]",
  ghost:
    "bg-transparent text-brand-ink hover:bg-brand-purple/5 shadow-none active:translate-y-0",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-sm px-4 py-2 rounded-xl gap-1.5",
  md: "text-base px-6 py-3 rounded-2xl gap-2",
  lg: "text-lg px-8 py-4 rounded-2xl gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          "inline-flex items-center justify-center font-display font-semibold tracking-wide",
          "transition-all duration-150 ease-out",
          "active:translate-y-[4px]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && "w-full",
          className
        )}
        aria-busy={isLoading}
        {...rest}
      >
        {isLoading ? (
          <span
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
