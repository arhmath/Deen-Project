import { Button } from "./Button";
import { AlertIcon, ShieldIcon } from "./DashIcons";

export function ErrorState({
  title = "Yah, datanya belum bisa dimuat",
  message = "Cek koneksimu, lalu coba lagi.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-3xl border-2 border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertIcon className="h-10 w-10 text-red-500" />
      <p className="font-display text-lg font-extrabold text-brand-ink">{title}</p>
      <p className="max-w-sm text-sm text-brand-ink/65">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}

export function PermissionDenied({ message }: { message?: string }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-2 px-6 py-16 text-center">
      <ShieldIcon className="h-12 w-12 text-brand-purple" />
      <h1 className="font-display text-2xl font-extrabold text-brand-ink">Halaman ini bukan untukmu</h1>
      <p className="text-brand-ink/65">{message ?? "Akunmu tidak punya izin untuk membuka halaman ini."}</p>
      <a
        href="/dashboard"
        className="mt-4 inline-flex rounded-2xl bg-brand-purple px-6 py-3 font-display font-semibold text-white shadow-[0_5px_0_0_#5B1FB0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        Kembali ke dashboard
      </a>
    </div>
  );
}
