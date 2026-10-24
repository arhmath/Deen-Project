import { useState } from "react";
import type { ContentDetail } from "../../types/content";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { EmptyState } from "../../components/ui/EmptyState";
import { ChevronLeftIcon, ChevronRightIcon } from "../../components/ui/DashIcons";
import { clsx } from "../../lib/clsx";
import { useCompleteContent } from "../dashboard/queries";
import { RewardPanel } from "./RewardPanel";

export function FlashcardView({ content }: { content: ContentDetail }) {
  const cards = content.flashcards ?? [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(new Set());
  const complete = useCompleteContent(content.id);

  if (cards.length === 0) {
    return <EmptyState title="Belum ada kartu" description="Guru belum menambahkan kartu untuk materi ini." />;
  }

  const card = cards[index]!;
  const isLast = index === cards.length - 1;
  const allSeen = seen.size === cards.length;

  function flip() {
    setFlipped((f) => !f);
    setSeen((s) => new Set(s).add(index));
  }
  function go(next: number) {
    setIndex(next);
    setFlipped(false);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-1.5 flex justify-between text-sm font-bold text-brand-ink/60">
          <span>Kartu {index + 1} dari {cards.length}</span>
          <span>{seen.size} sudah dibuka</span>
        </div>
        <ProgressBar value={((index + 1) / cards.length) * 100} label="Posisi kartu" tone="amber" />
      </div>

      <button
        type="button"
        onClick={flip}
        aria-pressed={flipped}
        className={clsx(
          "grid min-h-64 w-full place-items-center rounded-3xl border-2 p-8 text-center shadow-[0_6px_0_0_rgba(35,19,52,0.1)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue",
          flipped ? "border-brand-purple-dark bg-brand-purple text-white" : "border-brand-ink/10 bg-surface text-brand-ink"
        )}
      >
        <span className="flex flex-col items-center gap-3">
          <span className={clsx("text-xs font-bold uppercase tracking-wide", flipped ? "text-white/70" : "text-brand-ink/45")}>
            {flipped ? "Jawaban" : "Ketuk untuk melihat jawaban"}
          </span>
          <span className="font-display text-3xl font-extrabold leading-snug sm:text-4xl">
            {flipped ? card.back : card.front}
          </span>
          {flipped && <span className="text-sm text-white/70">{card.front}</span>}
        </span>
      </button>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" disabled={index === 0} onClick={() => go(index - 1)} leftIcon={<ChevronLeftIcon className="h-4 w-4" />}>
          Sebelumnya
        </Button>
        {!isLast && (
          <Button variant="outline" size="sm" onClick={() => go(index + 1)} rightIcon={<ChevronRightIcon className="h-4 w-4" />}>
            Berikutnya
          </Button>
        )}
      </div>

      {isLast && (
        complete.data ? (
          <RewardPanel outcome={complete.data} />
        ) : content.completed ? (
          <p role="status" className="rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-brand-ink/70">Kamu sudah menyelesaikan kartu ini.</p>
        ) : (
          <div>
            <Button fullWidth disabled={!allSeen} isLoading={complete.isPending} onClick={() => complete.mutate()}>
              Selesai belajar kartu
            </Button>
            {!allSeen && <p className="mt-2 text-center text-sm text-brand-ink/60">Buka semua kartu dulu ya, baru bisa menyelesaikan.</p>}
            {complete.isError && <p role="alert" className="mt-2 text-center text-sm font-bold text-red-600">Belum berhasil menyimpan progresmu. Coba lagi ya.</p>}
          </div>
        )
      )}
    </div>
  );
}
