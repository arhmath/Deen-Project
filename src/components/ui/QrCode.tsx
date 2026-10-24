import { useId, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { CopyButton } from "./CopyButton";
import { clsx } from "../../lib/clsx";

/** QR selalu hitam-di-atas-putih (kontras scanner), apa pun tema aplikasinya. */
const QR_FG = "#231334";
const QR_BG = "#ffffff";

export function QrIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" />
    </svg>
  );
}

export function QrCode({ value, size = 168, label, className }: { value: string; size?: number; label: string; className?: string }) {
  return (
    <div className={clsx("inline-block rounded-2xl border-2 border-brand-ink/10 bg-white p-2", className)}>
      <QRCodeSVG value={value} size={size} level="M" marginSize={1} fgColor={QR_FG} bgColor={QR_BG} role="img" title={label} aria-label={label} />
    </div>
  );
}

/** Ubah <svg> QR menjadi PNG beresolusi tinggi lalu unduh. */
async function downloadPng(svg: SVGSVGElement, filename: string) {
  const xml = new XMLSerializer().serializeToString(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Gagal membuat gambar QR"));
      img.src = url;
    });
    const px = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = QR_BG;
    ctx.fillRect(0, 0, px, px);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, px, px);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = filename;
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Tombol "QR" + dialog berisi QR besar, kode teks, unduh PNG, dan salin tautan.
 * `value` = tautan yang dikodekan; `code` = kode unik yang ditampilkan di bawah QR.
 */
export function QrDialogButton({
  value,
  code,
  title,
  description,
  filename,
  label = "Tampilkan QR",
  className,
}: {
  value: string;
  code: string;
  title: string;
  description: string;
  filename: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  function handleDownload() {
    const svg = wrapRef.current?.querySelector("svg");
    if (svg) void downloadPng(svg, filename);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-xl border-2 border-brand-ink/10 bg-surface px-3 py-1.5 font-display text-sm font-bold text-brand-ink/75 transition-colors hover:border-brand-purple/40 hover:text-brand-purple-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue",
          className
        )}
      >
        <QrIcon className="h-4 w-4" />
        {label}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
        <div className="rounded-3xl border-2 border-brand-ink/10 bg-surface p-6 text-center shadow-xl">
          <h2 id={titleId} className="font-display text-xl font-extrabold text-brand-ink">{title}</h2>
          <p className="mt-1 text-sm text-brand-ink/65">{description}</p>

          <div ref={wrapRef} className="mt-4 flex justify-center">
            <QrCode value={value} size={240} label={`QR code untuk kode ${code}`} />
          </div>

          <p className="mt-3 font-display text-3xl font-extrabold tracking-widest text-brand-purple-fg">{code}</p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDownload}>Unduh PNG</Button>
            <CopyButton text={value} label="Salin tautan" />
          </div>
          <Button size="sm" className="mt-4 w-full" onClick={() => setOpen(false)}>Tutup</Button>
        </div>
      </Dialog>
    </>
  );
}
