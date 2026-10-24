import { useId } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Ya, lanjutkan",
  isLoading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const id = useId();
  return (
    <Dialog open={open} onClose={onCancel} labelledBy={id}>
      <div className="rounded-3xl border-2 border-brand-ink/10 bg-surface p-6 shadow-xl">
        <h2 id={id} className="font-display text-xl font-extrabold text-brand-ink">{title}</h2>
        <p className="mt-2 text-sm text-brand-ink/70">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onCancel}>Batal</Button>
          <Button size="sm" isLoading={isLoading} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Dialog>
  );
}
