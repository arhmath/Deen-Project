import type { ContentDetail } from "../../types/content";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useCompleteContent } from "../dashboard/queries";
import { RewardPanel } from "./RewardPanel";

export function LessonView({ content }: { content: ContentDetail }) {
  const complete = useCompleteContent(content.id);
  const sections = content.lesson?.sections ?? [];

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-6 sm:p-8">
        <article className="flex flex-col gap-5">
          {sections.map((s, i) => (
            <section key={i}>
              {s.heading && <h2 className="mb-1.5 font-display text-xl font-extrabold text-brand-purple-fg">{s.heading}</h2>}
              <p className="text-lg leading-relaxed text-brand-ink/85">{s.text}</p>
            </section>
          ))}
        </article>
      </Card>

      {complete.data ? (
        <RewardPanel outcome={complete.data} />
      ) : content.completed ? (
        <p role="status" className="rounded-2xl bg-surface px-4 py-3 text-sm font-semibold text-brand-ink/70">
          Kamu sudah menyelesaikan materi ini.
        </p>
      ) : (
        <div>
          <Button fullWidth isLoading={complete.isPending} onClick={() => complete.mutate()}>
            Saya sudah paham
          </Button>
          {complete.isError && (
            <p role="alert" className="mt-2 text-center text-sm font-bold text-red-600">
              Belum berhasil menyimpan progresmu. Coba lagi ya.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
