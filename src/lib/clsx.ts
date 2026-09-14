type ClassValue = string | number | false | null | undefined;

/** Minimal `clsx`-style class joiner so we don't need an extra dependency. */
export function clsx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
