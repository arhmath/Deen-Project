import { useEffect, useRef, type ReactNode } from "react";

/** Dialog modal memakai <dialog> native: focus-trap, Esc, dan aria bawaan browser. */
export function Dialog({
  open,
  onClose,
  labelledBy,
  wide = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  /** Dialog lebih lebar (untuk form dengan dua kolom). */
  wide?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-[calc(100%-2rem)] ${wide ? "max-w-xl" : "max-w-sm"} overflow-visible rounded-3xl border-0 bg-transparent p-0 backdrop:bg-night/60`}
    >
      {open && children}
    </dialog>
  );
}
