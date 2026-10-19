import { useState, type FormEvent } from "react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { fieldCls, labelCls } from "../../components/ui/fieldStyles";
import { errorMessage } from "../../services/api";
import { useLinkChild } from "../dashboard/queries";

/** Orang tua menghubungkan anak lewat kode dari halaman Profil santri (BR-003). */
export function LinkChildCard({ title = "Hubungkan anak" }: { title?: string }) {
  const [code, setCode] = useState("");
  const link = useLinkChild();

  function submit(e: FormEvent) {
    e.preventDefault();
    link.mutate(code, { onSuccess: () => setCode("") });
  }

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <p className="mb-4 mt-1 text-sm text-brand-ink/60">
        Minta anakmu membuka halaman <strong>Profil</strong> dan menyalin “Kode untuk orang tua”, lalu masukkan di sini.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="kode-anak" className={labelCls}>Kode anak</label>
          <input
            id="kode-anak"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Contoh: ORT-AB12CD"
            autoComplete="off"
            spellCheck={false}
            maxLength={16}
            className={`${fieldCls} font-display text-lg font-extrabold tracking-wider`}
          />
        </div>
        <Button type="submit" isLoading={link.isPending} disabled={!code.trim()}>Hubungkan</Button>
      </form>
      <div aria-live="polite" className="mt-3 min-h-5 text-sm font-bold">
        {link.isError && <p role="alert" className="text-red-600">{errorMessage(link.error)}</p>}
        {link.isSuccess && <p className="text-brand-purple">{link.data.name} sudah terhubung.</p>}
      </div>
    </Card>
  );
}
