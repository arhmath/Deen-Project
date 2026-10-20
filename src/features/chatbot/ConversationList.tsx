import { useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PlusIcon, TrashIcon } from "../../components/ui/DashIcons";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { clsx } from "../../lib/clsx";
import { timeAgo } from "../../utils/format";
import type { AIConversation } from "../../types/chat";

export function ConversationList({
  items, isLoading, isError, activeId, onSelect, onNew, onDelete, deleting,
}: {
  items: AIConversation[];
  isLoading: boolean;
  isError: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const [toDelete, setToDelete] = useState<AIConversation | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Button size="sm" variant="outline" onClick={onNew} leftIcon={<PlusIcon className="h-4 w-4" />} fullWidth>Percakapan baru</Button>

      <nav aria-label="Riwayat percakapan" className="min-h-0 flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex flex-col gap-2" aria-busy="true">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : isError ? (
          <p role="alert" className="text-sm text-red-600">Riwayat belum bisa dimuat.</p>
        ) : items.length === 0 ? (
          <p className="px-1 text-sm text-brand-ink/55">Belum ada percakapan. Mulai dengan bertanya sesuatu!</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {items.map((c) => (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={c.id === activeId ? "true" : undefined}
                  className={clsx(
                    "w-full rounded-2xl border-2 px-3 py-2.5 pr-10 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand-blue",
                    c.id === activeId ? "border-brand-purple bg-brand-purple/8" : "border-transparent hover:bg-brand-ink/5"
                  )}
                >
                  <span className="line-clamp-2 break-words font-display text-sm font-bold text-brand-ink">{c.title}</span>
                  <span className="text-xs text-brand-ink/50">{timeAgo(c.updated_at)}</span>
                </button>
                <button
                  type="button"
                  aria-label={`Hapus percakapan: ${c.title}`}
                  onClick={() => setToDelete(c)}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg text-brand-ink/40 hover:bg-red-50 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-brand-blue sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus percakapan?"
        message={toDelete ? `“${toDelete.title}” akan dihapus permanen.` : ""}
        confirmLabel="Hapus"
        isLoading={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) { onDelete(toDelete.id); setToDelete(null); } }}
      />
    </div>
  );
}
