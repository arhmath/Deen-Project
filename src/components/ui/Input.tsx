import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from "react";
import { clsx } from "../../lib/clsx";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  trailingAction?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, trailingAction, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-bold text-brand-ink font-display"
        >
          {label}
        </label>
        <div className="relative">
          {icon && (
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-ink/40"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            className={clsx(
              "w-full rounded-2xl border-2 bg-white px-4 py-3 font-body text-brand-ink placeholder:text-brand-ink/35",
              "transition-colors duration-150 outline-none",
              icon && "pl-11",
              trailingAction && "pr-11",
              error
                ? "border-red-400 focus:border-red-500"
                : "border-brand-ink/10 focus:border-brand-blue",
              className
            )}
            {...rest}
          />
          {trailingAction && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {trailingAction}
            </span>
          )}
        </div>
        {error ? (
          <p id={errorId} className="text-sm font-semibold text-red-500">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="text-sm text-brand-ink/50">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
