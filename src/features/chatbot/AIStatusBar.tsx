import { clsx } from "../../lib/clsx";
import { ProgressBar } from "../../components/ui/ProgressBar";
import type { AIMessageMeta, AIStatus } from "../../types/chat";

interface Props {
  status: AIStatus | undefined;
  loading: boolean;
  /** Mesin yang menjawab pesan asisten terakhir di percakapan yang sedang dibuka. */
  last: AIMessageMeta | null;
  waiting: boolean;
}

const nf = new Intl.NumberFormat("id-ID");
const MODE_LABEL = { deen_data: "berdasarkan data Deen", general: "pengetahuan umum", rules: "aturan Deen" } as const;

/** Teks status + warna indikator. Hanya menyatakan "berbicara dengan <LLM>" bila jawaban terakhir memang dari LLM. */
function describe(status: AIStatus | undefined, last: AIMessageMeta | null, waiting: boolean) {
  const label = status?.label ?? "AI";
  if (waiting) return { dot: "bg-brand-amber", text: "Menunggu jawaban…" };
  if (last?.engine === "llm") return { dot: "bg-emerald-500", text: `Sedang berbicara dengan ${last.label}`, chip: MODE_LABEL[last.mode] };
  if (last?.reason === "limit_reached") return { dot: "bg-red-500", text: `Batas token ${label} hari ini habis — dijawab dari materi Deen` };
  if (last?.reason === "unavailable") return { dot: "bg-brand-amber", text: `${label} sedang tidak tersedia — dijawab dari materi Deen` };
  if (last) return { dot: "bg-brand-ink/30", text: "Dijawab oleh aturan Deen (tanpa AI)" };
  if (status && !status.enabled) return { dot: "bg-brand-ink/30", text: "Mode aturan Deen — AI belum diaktifkan" };
  return { dot: "bg-emerald-500", text: `${label} siap membantu` };
}

export function AIStatusBar({ status, loading, last, waiting }: Props) {
  const d = describe(status, last, waiting);
  const usage = status?.enabled ? status.usage : null;
  const pct = usage?.limit ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const nearLimit = !!usage?.limit && pct >= 80;
  const resets = usage ? new Date(usage.resets_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="border-b-2 border-brand-ink/10 bg-surface/70 px-4 py-2.5 sm:px-5" role="status" aria-live="polite" aria-busy={loading || waiting}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-2 text-sm font-bold text-brand-ink">
          <span aria-hidden="true" className={clsx("h-2.5 w-2.5 rounded-full", d.dot, waiting && "motion-safe:animate-pulse")} />
          {d.text}
        </span>
        {d.chip && !waiting && <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-bold text-brand-blue-dark">{d.chip}</span>}
        {last?.tokens && !waiting && (
          <span className="text-xs text-brand-ink/55">
            Pesan terakhir: {nf.format(last.tokens.total)} token{last.tokens.estimated ? " (perkiraan)" : ""}
          </span>
        )}
      </div>

      {status?.enabled && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {usage ? (
            usage.limit ? (
              <>
                <ProgressBar value={pct} label="Pemakaian token hari ini" tone={nearLimit ? "amber" : "blue"} className="!h-2 max-w-[11rem] flex-1" />
                <span className={clsx("text-xs", nearLimit ? "font-bold text-red-600" : "text-brand-ink/60")}>
                  Token hari ini: {nf.format(usage.used)} / {nf.format(usage.limit)}
                  {usage.remaining === 0 ? " — batas tercapai" : nearLimit ? " — hampir habis" : ""} · reset {resets}
                </span>
              </>
            ) : (
              <span className="text-xs text-brand-ink/60">Token hari ini: {nf.format(usage.used)} (tanpa batas)</span>
            )
          ) : (
            <span className="text-xs text-brand-ink/45">{loading ? "Memuat pemakaian token…" : "Pemakaian token belum tersedia."}</span>
          )}
        </div>
      )}
    </div>
  );
}
