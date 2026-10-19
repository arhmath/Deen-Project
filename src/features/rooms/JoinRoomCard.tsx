import { useState, type FormEvent } from "react";
import { Card, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { fieldCls, labelCls } from "../../components/ui/fieldStyles";
import { errorMessage } from "../../services/api";
import { useJoinRoom } from "../dashboard/queries";

/** Santri memasukkan kode gabung dari guru. */
export function JoinRoomCard({ title = "Gabung ke room gurumu", hint }: { title?: string; hint?: string }) {
  const [code, setCode] = useState("");
  const join = useJoinRoom();

  function submit(e: FormEvent) {
    e.preventDefault();
    join.mutate(code, { onSuccess: () => setCode("") });
  }

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <p className="mb-4 mt-1 text-sm text-brand-ink/60">
        {hint ?? "Minta kode gabung ke gurumu, lalu masukkan di sini. Course dari room itu akan langsung muncul."}
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="kode-gabung" className={labelCls}>Kode gabung</label>
          <input
            id="kode-gabung"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Contoh: HKM7A2"
            autoComplete="off"
            spellCheck={false}
            maxLength={12}
            aria-describedby="kode-gabung-pesan"
            className={`${fieldCls} font-display text-lg font-extrabold tracking-widest`}
          />
        </div>
        <Button type="submit" isLoading={join.isPending} disabled={!code.trim()}>Gabung</Button>
      </form>
      <div id="kode-gabung-pesan" aria-live="polite" className="mt-3 min-h-5 text-sm font-bold">
        {join.isError && <p role="alert" className="text-red-600">{errorMessage(join.error)}</p>}
        {join.isSuccess && <p className="text-brand-purple">Berhasil bergabung ke {join.data.name}!</p>}
      </div>
    </Card>
  );
}
