import { useId, type ReactNode } from "react";
import { Dialog } from "./Dialog";
import { CloseIcon } from "./DashIcons";

export function FormDialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <Dialog open={open} onClose={onClose} labelledBy={id}>
      <div className="rounded-3xl border-2 border-brand-ink/10 bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={id} className="font-display text-xl font-extrabold text-brand-ink">{title}</h2>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-brand-ink/60 hover:bg-brand-ink/5 focus-visible:outline-2 focus-visible:outline-brand-blue"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </Dialog>
  );
}
