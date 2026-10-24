import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "../../components/ui/Button";
import { ArrowUpIcon } from "../../components/ui/DashIcons";
import { fieldCls } from "../../components/ui/fieldStyles";
import { MAX_MESSAGE_LENGTH } from "./suggestions";

/**
 * Enter = kirim, Shift+Enter = baris baru. Dikunci saat menunggu jawaban (mencegah kirim ganda & membantu
 * menghormati rate limit 5 req/10 dtk). Batas 4000 karakter sesuai AIChatRequest.
 */
export function ChatComposer({ disabled, onSend, autoFocusKey }: { disabled: boolean; onSend: (text: string) => void; autoFocusKey?: string | null }) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();
  const tooLong = text.length > MAX_MESSAGE_LENGTH;

  useEffect(() => { ref.current?.focus(); }, [autoFocusKey]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (disabled || !trimmed || tooLong) return;
    onSend(trimmed);
    setText("");
  }
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="border-t-2 border-brand-ink/10 bg-surface/80 p-3 sm:p-4">
      <label htmlFor="chat-input" className="sr-only">Tulis pertanyaanmu</label>
      <div className="flex items-end gap-2">
        <textarea
          id="chat-input"
          ref={ref}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Tanya seputar materi, quiz, XP, atau fitur Deen…"
          aria-invalid={tooLong}
          aria-describedby="chat-hint"
          className={`${fieldCls} max-h-40 min-h-11 resize-none py-3`}
        />
        <Button type="submit" size="md" className="h-11 shrink-0 !px-4" disabled={disabled || !trimmed || tooLong} aria-label="Kirim pesan">
          <ArrowUpIcon className="h-5 w-5" />
        </Button>
      </div>
      <p id="chat-hint" className={`mt-1.5 px-1 text-xs ${tooLong ? "font-bold text-red-600" : "text-brand-ink/45"}`}>
        {tooLong ? `Pesan terlalu panjang (${text.length}/${MAX_MESSAGE_LENGTH}).` : "Enter untuk kirim · Shift+Enter untuk baris baru · Asisten hanya menjawab hal yang berkaitan dengan Deen."}
      </p>
    </form>
  );
}
