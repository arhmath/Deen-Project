import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMe } from "../../features/auth/useAuth";
import { chatService } from "../../services/chatService";
import { ApiError } from "../../services/api";
import { tokenStore } from "../../services/tokenStore";
import type { ChatMessage } from "../../types/chat";

const QUICK_QUESTIONS = [
  "Apa saja fitur utama Deen?",
  "Bagaimana cara mulai belajar?",
  "Apa itu XP dan streak?",
];
const makeId = () => `ziya-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const welcome: ChatMessage = {
  id: "ziya-welcome",
  role: "assistant",
  content: "Assalamu’alaikum! Aku Ziya, asisten digital Deen ✨ Aku bisa bantu menjelaskan fitur dan cara menggunakan Deen. Mau tahu apa?",
  created_at: new Date().toISOString(),
};

type ZiyaAvatarState = "idle" | "clicked" | "loading" | "typing" | "blink";

function ZiyaAvatar({ small = false, state = "idle" }: { small?: boolean; state?: ZiyaAvatarState }) {
  const sources: Record<ZiyaAvatarState, string> = {
    idle: "/ziya-blink.png",
    clicked: "/ziya-clicked.png",
    loading: "/ziya-loading.png",
    typing: "/ziya-typing.png",
    blink: "/ziya-idle.png",
  };
  return (
    <span className={`ziya-avatar ziya-avatar--${state} ${small ? "ziya-avatar--small" : ""}`} aria-hidden="true">
      <span className="ziya-avatar__aura" />
      <img src={sources[state]} alt="" draggable={false} />
      <span className="ziya-avatar__spark ziya-avatar__spark--one">✦</span>
      <span className="ziya-avatar__spark ziya-avatar__spark--two">✧</span>
    </span>
  );
}

function friendlyError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sesi login kamu sudah berakhir. Silakan masuk lagi untuk melanjutkan.";
    if (error.status === 429) return "Pertanyaannya cepat sekali masuk 😊 Tunggu sebentar lalu coba lagi ya.";
    if (error.status === 503) return "Maaf, asisten sedang beristirahat. Coba lagi sebentar ya.";
    if (error.status === 403) return "Akses chat belum tersedia untuk akun ini. Silakan masuk dengan akun Deen yang sesuai.";
  }
  return "Sepertinya koneksi sedang bermasalah. Coba kirim pesan lagi ya.";
}

/** Widget Ziya hanya ditampilkan pada landing page. Chat memakai endpoint AI resmi dan sesi backend Deen. */
export function ZiyaChatWidget() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isNearCursor, setIsNearCursor] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const hasToken = !!tokenStore.get();
  const me = useMe();
  const signedIn = hasToken && !!me.data;
  const checkingSession = hasToken && me.isPending;
  const visible = open || closing;
  const avatarState = sending ? "loading" : open ? "clicked" : draft.trim() ? "typing" : isNearCursor ? "blink" : "idle";

  const closePanel = useCallback(() => {
    if (!open || closing) return;
    setClosing(true);
  }, [open, closing]);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => { setOpen(false); setClosing(false); }, 240);
    return () => window.clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "end" });
  }, [messages, open, sending]);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, closePanel]);

  useEffect(() => {
    if (open) return;

    const onPointerMove = (event: PointerEvent) => {
      const launcher = launcherRef.current;
      if (!launcher) return;
      const rect = launcher.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
      setIsNearCursor(distance < 140);
    };

    const onPointerLeave = () => setIsNearCursor(false);

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [open]);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || sending || text.length > 4000) return;
    if (!signedIn) {
      setNotice("Masuk ke akun Deen untuk mulai bertanya kepada Ziya.");
      return;
    }
    setNotice(null);
    const tempId = makeId();
    const userMessage: ChatMessage = { id: tempId, role: "user", content: text, created_at: new Date().toISOString(), status: "sending" };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setSending(true);
    try {
      const response = await chatService.send({ message: text, ...(conversationId ? { conversation_id: conversationId } : {}) });
      const data = response.data;
      setConversationId(data.conversation_id);
      setMessages((current) => [
        ...current.map((message) => message.id === tempId ? { ...message, status: undefined } : message),
        { id: data.message.id, role: "assistant", content: data.message.content, created_at: data.message.created_at, sources: data.sources, meta: data.meta },
      ]);
    } catch (error) {
      setMessages((current) => current.map((message) => message.id === tempId ? { ...message, status: "failed" } : message));
      setNotice(friendlyError(error));
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`ziya-launcher ${open ? "ziya-launcher--open" : ""} ${closing ? "ziya-launcher--closing" : ""} ${!open && isNearCursor ? "ziya-launcher--hovering" : ""}`}
        aria-label={open ? "Tutup chat Ziya" : "Buka chat Ziya"}
        aria-expanded={open}
        aria-controls="ziya-chat-panel"
        onMouseEnter={() => setIsNearCursor(true)}
        onMouseLeave={() => setIsNearCursor(false)}
        onClick={() => { if (visible) closePanel(); else { setClosing(false); setOpen(true); } }}
      >
        {!open && <span className="ziya-launcher__label">Tanya Ziya</span>}
        <ZiyaAvatar state={avatarState} />
        {!open && <span className="ziya-launcher__ping" />}
      </button>

      {visible && (
        <>
          <button className={`ziya-backdrop ${closing ? "ziya-backdrop--closing" : ""}`} type="button" aria-label="Tutup jendela chat" onClick={closePanel} />
          <section id="ziya-chat-panel" className={`ziya-panel ${closing ? "ziya-panel--closing" : ""}`} role="dialog" aria-modal="true" aria-labelledby="ziya-title">
            <header className="ziya-panel__header">
              <ZiyaAvatar small state={sending ? "loading" : draft.trim() ? "typing" : "idle"} />
              <div className="ziya-panel__identity">
                <h2 id="ziya-title">Ziya <span>✦</span></h2>
                <p>Asisten digital Deen</p>
                <span className="ziya-panel__status"><i /> {signedIn ? "Siap membantu" : checkingSession ? "Memeriksa sesi…" : "Bantuan seputar Deen"}</span>
              </div>
              <button type="button" className="ziya-panel__close" aria-label="Tutup chat" onClick={closePanel}>×</button>
            </header>

            <div className="ziya-panel__messages" aria-live="polite" aria-relevant="additions text">
              {!signedIn && !checkingSession ? (
                <div className="ziya-guest-card">
                  <ZiyaAvatar />
                  <h3>Hai, aku Ziya! ✨</h3>
                  <p>Aku siap membantu menjelaskan fitur dan cara menggunakan Deen. Masuk dulu agar aku bisa menjawab melalui asisten AI Deen.</p>
                  <Link to="/login" className="ziya-primary-link" onClick={closePanel}>Masuk ke Deen</Link>
                  <Link to="/register" className="ziya-secondary-link" onClick={closePanel}>Belum punya akun? Daftar</Link>
                </div>
              ) : checkingSession ? (
                <div className="ziya-loading-session" role="status"><span className="ziya-dots"><i /><i /><i /></span> Memeriksa sesi Deen…</div>
              ) : (
                <>
                  <p className="ziya-day-label">ASISTEN DEEN · TANYA JAWAB</p>
                  {messages.map((message) => (
                    <div key={message.id} className={`ziya-message-row ${message.role === "user" ? "ziya-message-row--user" : ""}`}>
                      {message.role === "assistant" && <ZiyaAvatar small />}
                      <div className={`ziya-message ${message.role === "user" ? "ziya-message--user" : "ziya-message--assistant"}`}>
                        <p>{message.content}</p>
                        {message.sources && message.sources.length > 0 && (message.meta?.grounded !== false || message.meta?.ai?.mode === "general") && (
                          <div className="ziya-sources"><span>Sumber:</span> {message.sources.map((source) => source.title).join(" · ")}</div>
                        )}
                        {message.meta?.ai?.engine === "llm" && (
                          <div className="ziya-sources"><span>{message.meta.ai.label}</span> · {message.meta.ai.mode === "general" ? "pengetahuan umum" : "data Deen"}{message.meta.ai.tokens ? ` · ${message.meta.ai.tokens.total.toLocaleString("id-ID")} token` : ""}</div>
                        )}
                        {message.status === "sending" && <small>Mengirim…</small>}
                        {message.status === "failed" && <small className="ziya-failed">Belum terkirim. Kamu bisa mencoba mengirim ulang.</small>}
                      </div>
                    </div>
                  ))}
                  {messages.length === 1 && !sending && (
                    <div className="ziya-quick-questions"><span>Coba tanyakan</span>{QUICK_QUESTIONS.map((question) => <button key={question} type="button" onClick={() => void sendMessage(question)}>{question}<b>↗</b></button>)}</div>
                  )}
                  {sending && <div className="ziya-message-row"><ZiyaAvatar small state="typing" /><div className="ziya-message ziya-message--assistant ziya-typing" aria-label="Ziya sedang mengetik"><span /><span /><span /></div></div>}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {notice && <p className="ziya-notice" role="alert">{notice}</p>}
            {signedIn && (
              <form className="ziya-composer" onSubmit={submit}>
                <label className="sr-only" htmlFor="ziya-input">Tulis pertanyaan untuk Ziya</label>
                <textarea id="ziya-input" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void sendMessage(draft); } }} placeholder="Tanya seputar fitur Deen…" rows={1} maxLength={4000} disabled={sending} />
                <button type="submit" aria-label="Kirim pesan" disabled={sending || !draft.trim()}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m21 3-7.2 18-3.7-7.1L3 10.2 21 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M10.1 13.9 15 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></button>
              </form>
            )}
            <footer className="ziya-panel__footer">Dibuat untuk membantu kamu mengenal Deen ✨</footer>
          </section>
        </>
      )}
    </>
  );
}
