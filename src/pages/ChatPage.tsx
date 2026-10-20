import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/ui/Button";
import { ChatIcon, CloseIcon, MenuIcon } from "../components/ui/DashIcons";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { ChatComposer } from "../features/chatbot/ChatComposer";
import { ChatMessageBubble, TypingBubble } from "../features/chatbot/ChatMessageBubble";
import { ConversationList } from "../features/chatbot/ConversationList";
import { chatKeys, useConversation, useConversations, useDeleteConversation } from "../features/chatbot/queries";
import { SUGGESTIONS } from "../features/chatbot/suggestions";
import { useSessionUser } from "../hooks/useSessionUser";
import { ApiError } from "../services/api";
import { chatService } from "../services/chatService";
import type { ChatMessage } from "../types/chat";

/** Pesan error ramah per status (05B §25). Detail teknis provider tidak pernah ada di respons server. */
function friendlyError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 429) return "Pertanyaanmu terlalu cepat. Tunggu beberapa detik, lalu kirim lagi ya.";
    if (e.status === 503) return "Asisten sedang tidak tersedia. Silakan coba lagi sebentar lagi.";
    if (e.status === 400 || e.status === 422) return e.message;
    if (e.status === 403 || e.status === 404) return "Percakapan ini tidak bisa dibuka. Mulai percakapan baru ya.";
    return e.message;
  }
  return "Koneksi bermasalah. Periksa internetmu, lalu coba lagi.";
}

const tmpId = () => `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function ChatPage() {
  const user = useSessionUser();
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  /** Percakapan yang sedang "hidup" (ada pesan baru di sesi ini). Riwayat lama dibaca langsung dari query. */
  const [live, setLive] = useState<{ id: string | null; messages: ChatMessage[] } | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  /** Mencegah jawaban lambat dari percakapan lama menimpa percakapan yang sedang dibuka. */
  const activeRef = useRef<string | null>(null);
  useEffect(() => { activeRef.current = activeId; }, [activeId]);

  const list = useConversations();
  const detail = useConversation(activeId);
  const del = useDeleteConversation();

  const historyMessages = detail.data?.data.messages;
  const messages: ChatMessage[] = useMemo(
    () => (live && live.id === activeId ? live.messages : activeId ? historyMessages ?? [] : []),
    [live, activeId, historyMessages]
  );
  /** Percakapan yang dibuka ternyata bukan milik user / sudah dihapus (403/404) — ditampilkan sebagai keadaan khusus. */
  const unavailable = detail.error instanceof ApiError && [403, 404].includes(detail.error.status);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "end" });
  }, [messages.length, waiting]);

  const send = useCallback(
    async (text: string, retryOf?: string) => {
      if (waiting) return;
      setNotice(null);
      const convAtSend = activeId;
      const optimistic: ChatMessage = { id: retryOf ?? tmpId(), role: "user", content: text, created_at: new Date().toISOString(), status: "sending" };
      setLive({ id: convAtSend, messages: retryOf ? messages.map((x) => (x.id === retryOf ? optimistic : x)) : [...messages, optimistic] });
      setWaiting(true);
      try {
        const res = await chatService.send({ message: text, ...(convAtSend ? { conversation_id: convAtSend } : {}) });
        const { conversation_id, message, sources, meta } = res.data;
        if (activeRef.current !== convAtSend) return; // user sudah pindah percakapan
        setActiveId(conversation_id);
        setLive((prev) => ({
          id: conversation_id,
          messages: [
            ...(prev?.messages ?? []).map((x) => (x.id === optimistic.id ? { ...x, status: undefined } : x)),
            { id: message.id, role: "assistant", content: message.content, created_at: message.created_at, sources, meta },
          ],
        }));
        qc.invalidateQueries({ queryKey: chatKeys.list });
      } catch (e) {
        if (activeRef.current !== convAtSend) return;
        setLive((prev) => (prev ? { ...prev, messages: prev.messages.map((x) => (x.id === optimistic.id ? { ...x, status: "failed" } : x)) } : prev));
        setNotice(friendlyError(e));
      } finally {
        setWaiting(false);
      }
    },
    [waiting, activeId, messages, qc]
  );

  function newChat() {
    setActiveId(null);
    setLive(null);
    setNotice(null);
    setHistoryOpen(false);
  }
  function openConversation(id: string) {
    if (id === activeId) return setHistoryOpen(false);
    setLive(null);
    setNotice(null);
    setActiveId(id);
    setHistoryOpen(false);
  }
  function removeConversation(id: string) {
    del.mutate(id, { onSuccess: () => id === activeId && newChat(), onError: (e) => setNotice(friendlyError(e)) });
  }

  const loadingHistory = !!activeId && live?.id !== activeId && detail.isPending;
  const empty = !activeId && messages.length === 0;

  const history = (
    <ConversationList
      items={list.data?.data ?? []}
      isLoading={list.isPending}
      isError={list.isError}
      activeId={activeId}
      onSelect={openConversation}
      onNew={newChat}
      onDelete={removeConversation}
      deleting={del.isPending}
    />
  );

  return (
    <>
      <PageHeader
        title="Chatbot"
        subtitle="Asisten belajar Deen — tanya seputar materi, quiz, XP, room, dan fitur Deen."
        actions={
          <Button size="sm" variant="outline" className="lg:hidden" onClick={() => setHistoryOpen(true)} leftIcon={<MenuIcon className="h-4 w-4" />}>Riwayat</Button>
        }
      />

      <div className="grid h-[calc(100dvh-13rem)] min-h-[30rem] gap-4 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden min-h-0 rounded-3xl border-2 border-brand-ink/10 bg-white p-3 lg:block" aria-label="Riwayat percakapan">{history}</aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-3xl border-2 border-brand-ink/10 bg-brand-cream shadow-[0_4px_0_0_rgba(35,19,52,0.06)]" aria-label="Percakapan dengan asisten Deen">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            {loadingHistory ? (
              <div aria-busy="true" className="flex flex-col gap-3"><Skeleton className="h-12 w-2/3" /><Skeleton className="ml-auto h-10 w-1/2" /><Skeleton className="h-16 w-3/4" /></div>
            ) : unavailable ? (
              <div className="mx-auto flex h-full max-w-sm flex-col items-center justify-center gap-3 text-center">
                <p className="font-display text-lg font-extrabold text-brand-ink">Percakapan tidak bisa dibuka</p>
                <p className="text-sm text-brand-ink/60">Percakapan ini sudah dihapus atau bukan milikmu.</p>
                <Button size="sm" onClick={newChat}>Mulai percakapan baru</Button>
              </div>
            ) : detail.isError ? (
              <ErrorState message="Riwayat percakapan belum bisa dimuat." onRetry={() => detail.refetch()} />
            ) : empty ? (
              <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-purple/10 text-brand-purple"><ChatIcon className="h-8 w-8" /></span>
                <div>
                  <p className="font-display text-xl font-extrabold text-brand-ink">Halo, {user.name.split(" ")[0]}!</p>
                  <p className="mt-1 text-sm text-brand-ink/60">Aku asisten belajar Deen. Pilih pertanyaan di bawah atau tulis sendiri.</p>
                </div>
                <ul className="flex flex-wrap justify-center gap-2" aria-label="Contoh pertanyaan">
                  {SUGGESTIONS[user.role].map((s) => (
                    <li key={s}>
                      <button type="button" disabled={waiting} onClick={() => send(s)} className="rounded-full border-2 border-brand-purple/30 bg-white px-3.5 py-1.5 text-sm font-bold text-brand-purple transition-colors hover:bg-brand-purple/8 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-brand-blue">{s}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ol role="log" aria-live="polite" aria-label="Pesan" className="flex flex-col gap-4">
                {messages.map((m) => (
                  <ChatMessageBubble key={m.id} message={m} onRetry={(failed) => send(failed.content, failed.id)} />
                ))}
                {waiting && <TypingBubble />}
              </ol>
            )}
            <div ref={bottomRef} />
          </div>

          {notice && (
            <p role="alert" className="border-t-2 border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">{notice}</p>
          )}
          <ChatComposer disabled={waiting || loadingHistory || unavailable} onSend={(t) => send(t)} autoFocusKey={activeId} />
        </section>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Riwayat percakapan">
          <button type="button" aria-label="Tutup riwayat" className="absolute inset-0 bg-brand-ink/50" onClick={() => setHistoryOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[88%] flex-col gap-3 bg-brand-cream p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-extrabold text-brand-ink">Riwayat</p>
              <button type="button" aria-label="Tutup riwayat" onClick={() => setHistoryOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-brand-ink/5"><CloseIcon className="h-5 w-5" /></button>
            </div>
            <div className="min-h-0 flex-1">{history}</div>
          </div>
        </div>
      )}
    </>
  );
}
