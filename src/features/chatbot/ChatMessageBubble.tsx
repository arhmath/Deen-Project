import { useState } from "react";
import { clsx } from "../../lib/clsx";
import { ApiError, errorMessage } from "../../services/api";
import type { ChatMessage, FeedbackRating } from "../../types/chat";
import { useSendFeedback } from "./queries";

const iconCls = "h-4 w-4";
const ThumbUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={iconCls} aria-hidden="true">
    <path d="M7 11v9H4v-9zM7 11l4-7a2 2 0 0 1 2 2v4h5.5a2 2 0 0 1 2 2.3l-1.2 6a2 2 0 0 1-2 1.7H7" />
  </svg>
);
const ThumbDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={iconCls} aria-hidden="true">
    <path d="M17 13V4h3v9zM17 13l-4 7a2 2 0 0 1-2-2v-4H5.5a2 2 0 0 1-2-2.3l1.2-6a2 2 0 0 1 2-1.7H17" />
  </svg>
);

const FEEDBACK_BTN =
  "grid h-8 w-8 place-items-center rounded-lg border-2 border-brand-ink/10 bg-surface text-brand-ink/60 transition-colors hover:border-brand-purple/40 hover:text-brand-purple-fg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";

/** Umpan balik hanya untuk jawaban yang sudah tersimpan di server (punya id server). */
function Feedback({ messageId }: { messageId: string }) {
  const send = useSendFeedback();
  const [given, setGiven] = useState<FeedbackRating | "already" | null>(null);

  function rate(rating: FeedbackRating) {
    send.mutate(
      { messageId, rating },
      {
        onSuccess: () => setGiven(rating),
        // 409 = sudah pernah memberi umpan balik untuk pesan ini (05B §25)
        onError: (e) => e instanceof ApiError && e.status === 409 && setGiven("already"),
      }
    );
  }

  if (given) {
    return (
      <p className="text-xs font-bold text-brand-purple-fg" role="status">
        {given === "already" ? "Kamu sudah menilai jawaban ini." : "Terima kasih atas penilaianmu!"}
      </p>
    );
  }
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Nilai jawaban ini">
      <button type="button" className={FEEDBACK_BTN} aria-label="Jawaban membantu" title="Membantu" disabled={send.isPending} onClick={() => rate("positive")}><ThumbUp /></button>
      <button type="button" className={FEEDBACK_BTN} aria-label="Jawaban kurang membantu" title="Kurang membantu" disabled={send.isPending} onClick={() => rate("negative")}><ThumbDown /></button>
      {send.isError && !(send.error instanceof ApiError && send.error.status === 409) && (
        <span role="alert" className="text-xs text-red-600">{errorMessage(send.error, "Gagal mengirim penilaian.")}</span>
      )}
    </div>
  );
}

export function ChatMessageBubble({ message, onRetry }: { message: ChatMessage; onRetry?: (m: ChatMessage) => void }) {
  const mine = message.role === "user";
  const ai = !mine ? message.meta?.ai : undefined;
  /** Jawaban LLM dari pengetahuan umum (di luar materi Deen) — bukan penolakan, walau grounded=false. */
  const general = ai?.engine === "llm" && ai.mode === "general";
  const refusal = !mine && message.meta?.grounded === false && !general;
  const sources = !mine && (message.meta?.grounded !== false || general) ? message.sources ?? [] : [];
  const time = new Date(message.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <li className={clsx("flex", mine ? "justify-end" : "justify-start")}>
      <div className={clsx("flex max-w-[88%] flex-col gap-1.5 sm:max-w-[78%]", mine ? "items-end" : "items-start")}>
        <div
          className={clsx(
            "whitespace-pre-wrap break-words rounded-3xl px-4 py-3 text-[0.95rem] leading-relaxed",
            mine
              ? "rounded-br-lg bg-brand-purple text-white"
              : refusal
                ? "rounded-bl-lg border-2 border-brand-amber/50 bg-brand-amber/10 text-brand-ink"
                : general
                  ? "rounded-bl-lg border-2 border-brand-blue/30 bg-brand-blue/5 text-brand-ink"
                  : "rounded-bl-lg border-2 border-brand-ink/10 bg-surface text-brand-ink",
            message.status === "sending" && "opacity-70",
            message.status === "failed" && "border-2 border-red-300 bg-red-50 text-brand-ink"
          )}
        >
          {/* React meng-escape teks → aman dari XSS; JANGAN diganti dengan dangerouslySetInnerHTML. */}
          {message.content}
        </div>

        {sources.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Sumber jawaban">
            {sources.map((s) => (
              <li key={s.id} className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-bold text-brand-blue-dark">{s.title}</li>
            ))}
          </ul>
        )}

        {ai?.engine === "llm" && (
          <p className="px-1 text-xs text-brand-ink/55">
            <span className="font-bold text-brand-blue-dark">{ai.label}</span> · {ai.mode === "general" ? "pengetahuan umum" : "data Deen"}
            {ai.tokens ? ` · ${ai.tokens.total.toLocaleString("id-ID")} token${ai.tokens.estimated ? " (perkiraan)" : ""}` : ""}
          </p>
        )}
        {general && (
          <p className="px-1 text-xs text-brand-ink/55">Jawaban ini dari pengetahuan umum {ai?.label}, di luar materi Deen. Untuk hal penting, tanyakan ke ustadz/ustadzah.</p>
        )}

        <div className="flex items-center gap-3 px-1 text-xs text-brand-ink/45">
          {message.status === "failed" ? (
            <>
              <span role="alert" className="font-bold text-red-600">Pesan belum terkirim.</span>
              {onRetry && <button type="button" onClick={() => onRetry(message)} className="font-bold text-brand-purple-fg underline focus-visible:outline-2 focus-visible:outline-brand-blue">Kirim ulang</button>}
            </>
          ) : message.status === "sending" ? (
            <span>Mengirim…</span>
          ) : (
            <time dateTime={message.created_at}>{time}</time>
          )}
          {!mine && !message.status && <Feedback messageId={message.id} />}
        </div>
      </div>
    </li>
  );
}

/** Indikator "asisten sedang mengetik". */
export function TypingBubble() {
  return (
    <li className="flex justify-start" aria-live="polite">
      <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-lg border-2 border-brand-ink/10 bg-surface px-4 py-3.5">
        <span className="sr-only">Asisten Deen sedang menjawab…</span>
        {[0, 1, 2].map((i) => (
          <span key={i} aria-hidden="true" className="h-2 w-2 rounded-full bg-brand-purple/60 motion-safe:animate-bounce" style={{ animationDelay: `${i * 140}ms` }} />
        ))}
      </div>
    </li>
  );
}
