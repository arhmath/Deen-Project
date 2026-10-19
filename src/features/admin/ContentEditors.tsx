import { useId } from "react";
import type { ContentDoc } from "../../types/courseAdmin";
import { Button } from "../../components/ui/Button";
import { PlusIcon, TrashIcon } from "../../components/ui/DashIcons";
import { fieldCls, iconBtnCls, labelCls } from "../../components/ui/fieldStyles";
import { newId } from "../../utils/id";

export type UpdateContent = (fn: (c: ContentDoc) => void) => void;

const addBtn = <PlusIcon className="h-4 w-4" />;

/* ------------------------------ Pelajaran ------------------------------ */

export function LessonEditor({ content, update }: { content: ContentDoc; update: UpdateContent }) {
  const uid = useId();
  return (
    <div className="flex flex-col gap-4">
      {content.sections.map((s, i) => (
        <fieldset key={i} className="rounded-2xl border-2 border-brand-ink/10 bg-white p-4">
          <legend className="px-2 font-display text-sm font-extrabold text-brand-purple">Bagian {i + 1}</legend>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor={`${uid}-h-${i}`} className={labelCls}>Judul bagian (opsional)</label>
              <input id={`${uid}-h-${i}`} value={s.heading ?? ""} onChange={(e) => update((c) => { c.sections[i]!.heading = e.target.value; })} className={fieldCls} />
            </div>
            <div>
              <label htmlFor={`${uid}-t-${i}`} className={labelCls}>Isi</label>
              <textarea id={`${uid}-t-${i}`} rows={4} value={s.text} onChange={(e) => update((c) => { c.sections[i]!.text = e.target.value; })} className={fieldCls} />
            </div>
            <div>
              <Button type="button" size="sm" variant="ghost" onClick={() => update((c) => { c.sections.splice(i, 1); })} leftIcon={<TrashIcon className="h-4 w-4" />}>
                Hapus bagian {i + 1}
              </Button>
            </div>
          </div>
        </fieldset>
      ))}
      <div>
        <Button type="button" size="sm" variant="outline" leftIcon={addBtn} onClick={() => update((c) => { c.sections.push({ heading: "", text: "" }); })}>
          Tambah bagian
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------ Flashcard ------------------------------ */

export function FlashcardEditor({ content, update }: { content: ContentDoc; update: UpdateContent }) {
  const uid = useId();
  return (
    <div className="flex flex-col gap-3">
      {content.cards.map((k, i) => (
        <fieldset key={k.id} className="rounded-2xl border-2 border-brand-ink/10 bg-white p-4">
          <legend className="px-2 font-display text-sm font-extrabold text-brand-purple">Kartu {i + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-f-${i}`} className={labelCls}>Sisi depan</label>
              <input id={`${uid}-f-${i}`} value={k.front} onChange={(e) => update((c) => { c.cards[i]!.front = e.target.value; })} className={fieldCls} />
            </div>
            <div>
              <label htmlFor={`${uid}-b-${i}`} className={labelCls}>Sisi belakang (jawaban)</label>
              <input id={`${uid}-b-${i}`} value={k.back} onChange={(e) => update((c) => { c.cards[i]!.back = e.target.value; })} className={fieldCls} />
            </div>
          </div>
          <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => update((c) => { c.cards.splice(i, 1); })} leftIcon={<TrashIcon className="h-4 w-4" />}>
            Hapus kartu {i + 1}
          </Button>
        </fieldset>
      ))}
      <div>
        <Button type="button" size="sm" variant="outline" leftIcon={addBtn} onClick={() => update((c) => { c.cards.push({ id: newId("k"), front: "", back: "" }); })}>
          Tambah kartu
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------ Kuis ------------------------------ */

const OPTION_IDS = ["a", "b", "c", "d"];

export function QuizEditor({ content, update }: { content: ContentDoc; update: UpdateContent }) {
  const uid = useId();
  return (
    <div className="flex flex-col gap-4">
      {content.questions.map((q, qi) => (
        <fieldset key={q.id} className="rounded-2xl border-2 border-brand-ink/10 bg-white p-4">
          <legend className="px-2 font-display text-sm font-extrabold text-brand-purple">Soal {qi + 1}</legend>
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor={`${uid}-q-${qi}`} className={labelCls}>Pertanyaan</label>
              <textarea id={`${uid}-q-${qi}`} rows={2} value={q.text} onChange={(e) => update((c) => { c.questions[qi]!.text = e.target.value; })} className={fieldCls} />
            </div>

            <div role="radiogroup" aria-label={`Pilihan jawaban soal ${qi + 1}`} className="flex flex-col gap-2">
              <p className="text-sm font-bold text-brand-ink/70">Pilihan jawaban (pilih satu yang benar)</p>
              {q.options.map((o, oi) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`${uid}-correct-${qi}`}
                    checked={q.correctOptionId === o.id}
                    onChange={() => update((c) => { c.questions[qi]!.correctOptionId = o.id; })}
                    aria-label={`Tandai pilihan ${oi + 1} sebagai jawaban benar`}
                    className="h-5 w-5 shrink-0 accent-[var(--color-brand-purple)]"
                  />
                  <input
                    value={o.text}
                    onChange={(e) => update((c) => { c.questions[qi]!.options[oi]!.text = e.target.value; })}
                    aria-label={`Pilihan ${oi + 1} soal ${qi + 1}`}
                    placeholder={`Pilihan ${oi + 1}`}
                    className={fieldCls}
                  />
                  <button
                    type="button"
                    aria-label={`Hapus pilihan ${oi + 1} soal ${qi + 1}`}
                    disabled={q.options.length <= 2}
                    onClick={() => update((c) => {
                      const qq = c.questions[qi]!;
                      qq.options.splice(oi, 1);
                      if (qq.correctOptionId === o.id) qq.correctOptionId = "";
                    })}
                    className={iconBtnCls}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {q.options.length < 4 && (
                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    leftIcon={addBtn}
                    onClick={() => update((c) => {
                      const qq = c.questions[qi]!;
                      const free = OPTION_IDS.find((id) => !qq.options.some((x) => x.id === id)) ?? newId("o");
                      qq.options.push({ id: free, text: "" });
                    })}
                  >
                    Tambah pilihan
                  </Button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor={`${uid}-e-${qi}`} className={labelCls}>Penjelasan (tampil setelah jawaban dikirim)</label>
              <input id={`${uid}-e-${qi}`} value={q.explanation} onChange={(e) => update((c) => { c.questions[qi]!.explanation = e.target.value; })} className={fieldCls} />
            </div>

            <div>
              <Button type="button" size="sm" variant="ghost" onClick={() => update((c) => { c.questions.splice(qi, 1); })} leftIcon={<TrashIcon className="h-4 w-4" />}>
                Hapus soal {qi + 1}
              </Button>
            </div>
          </div>
        </fieldset>
      ))}
      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          leftIcon={addBtn}
          onClick={() => update((c) => {
            c.questions.push({ id: newId("q"), text: "", options: [{ id: "a", text: "" }, { id: "b", text: "" }], correctOptionId: "", explanation: "" });
          })}
        >
          Tambah soal
        </Button>
      </div>
    </div>
  );
}
