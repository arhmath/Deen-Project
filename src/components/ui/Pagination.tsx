import { Button } from "./Button";
import { ChevronLeftIcon, ChevronRightIcon } from "./DashIcons";
import { clsx } from "../../lib/clsx";

/**
 * Navigasi halaman yang simetris di semua lebar layar.
 * Layout 3 kolom (tombol | info | tombol): kolom tengah yang fleksibel sehingga tombol kiri-kanan
 * selalu rata di tepi. Di layar kecil tombol jadi ikon saja agar tidak saling menabrak.
 */
export function Pagination({
  page,
  totalPages,
  total,
  unit,
  onPageChange,
  label,
  className,
}: {
  page: number;
  totalPages: number;
  /** Jumlah seluruh data (opsional), ditampilkan di bawah nomor halaman. */
  total?: number;
  /** Satuan untuk `total`, mis. "santri". */
  unit?: string;
  onPageChange: (page: number) => void;
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={clsx("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3", className)}>
      <Button
        size="sm"
        variant="outline"
        className="!px-3 sm:!px-4"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Halaman sebelumnya"
        leftIcon={<ChevronLeftIcon className="h-4 w-4" />}
      >
        <span className="hidden sm:inline">Sebelumnya</span>
      </Button>

      <p className="min-w-0 text-center text-sm font-bold leading-tight text-brand-ink/60" aria-live="polite">
        <span className="block">
          Halaman {page} dari {totalPages}
        </span>
        {total !== undefined && (
          <span className="block text-xs font-semibold text-brand-ink/50">
            {total} {unit}
          </span>
        )}
      </p>

      <Button
        size="sm"
        variant="outline"
        className="!px-3 sm:!px-4"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Halaman berikutnya"
        rightIcon={<ChevronRightIcon className="h-4 w-4" />}
      >
        <span className="hidden sm:inline">Berikutnya</span>
      </Button>
    </nav>
  );
}
