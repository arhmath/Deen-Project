import { useState } from "react";
import { CheckIcon, CopyIcon } from "./DashIcons";
import { clsx } from "../../lib/clsx";

export function CopyButton({ text, label = "Salin", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback untuk konteks tanpa Clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-xl border-2 border-brand-ink/10 bg-surface px-3 py-1.5 font-display text-sm font-bold text-brand-ink/75 transition-colors hover:border-brand-purple/40 hover:text-brand-purple-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
        className
      )}
    >
      {copied ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : <CopyIcon className="h-4 w-4" />}
      <span aria-live="polite">{copied ? "Tersalin!" : label}</span>
    </button>
  );
}
