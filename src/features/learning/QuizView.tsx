import { useState } from "react";
import type { ContentDetail, QuizAttempt, QuizResult } from "../../types/content";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { CheckIcon, CloseIcon } from "../../components/ui/DashIcons";
import { StarIcon } from "../../components/landing/DecorativeIcons";
import { ApiError } from "../../services/api";
import { clsx } from "../../lib/clsx";
import { useStartQuiz, useSubmitQuiz } from "../dashboard/queries";
import { RewardPanel } from "./RewardPanel";

const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : "Terjadi kesalahan. Coba lagi ya.");

/**
 * Alur kuis (Frontend Architecture §10):
 * muat soal → mulai attempt → jawab → kirim → hasil → penjelasan → reward.
 * Skor, kunci jawaban, dan reward datang dari server; klien tidak menghitung.
 */
export function QuizView({ content }: { content: ContentDetail }) {
  const start = useStartQuiz(content.id);
  const submit = useSubmitQuiz();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);

  function begin() {
    start.mutate(undefined, {
      onSuccess: (a) => {
        setAttempt(a);
        setAnswers({});
        setStep(0);
        setResult(null);
      },
    });
  }

  function finish() {
    if (!attempt) return;
    submit.mutate(
      { attemptId: attempt.attemptId, answers },
      { onSuccess: (r) => setResult(r) }
    );
  }

  /* ---------- Hasil ---------- */
  if (result) {
    return (
      <div className="flex flex-col gap-5">
        <Card className="text-center">
          {result.perfect && <StarIcon className="mx-auto h-12 w-12 text-brand-gold motion-safe:animate-float" aria-hidden="true" />}
          <p className="font-display text-sm font-bold text-brand-ink/60">Skormu</p>
          <p className="font-display text-6xl font-extrabold text-brand-purple-fg">{result.score}</p>
          <p className="mt-1 font-bold text-brand-ink">
            {result.correct} dari {result.total} jawaban benar
            {result.perfect && " · Sempurna!"}
          </p>
          <p className="text-sm text-brand-ink/55">Skor terbaikmu: {result.bestScore}</p>
        </Card>

        <RewardPanel outcome={result.outcome} />

        <section aria-labelledby="review-title">
          <h2 id="review-title" className="mb-3 font-display text-lg font-extrabold">Pembahasan</h2>
          <ol className="flex flex-col gap-3">
            {result.questions.map((q, i) => {
              const sel = q.options.find((o) => o.id === q.selectedOptionId)?.text;
              const right = q.options.find((o) => o.id === q.correctOptionId)?.text;
              return (
                <li key={q.questionId} className={clsx("rounded-2xl border-2 bg-surface p-4", q.isCorrect ? "border-brand-purple/30" : "border-red-200")}>
                  <p className="font-bold text-brand-ink">{i + 1}. {q.text}</p>
                  <p className={clsx("mt-2 flex items-start gap-2 text-sm font-semibold", q.isCorrect ? "text-brand-purple-fg" : "text-red-600")}>
                    {q.isCorrect ? <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" /> : <CloseIcon className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{q.isCorrect ? "Benar" : "Kurang tepat"}: {sel ?? "tidak dijawab"}</span>
                  </p>
                  {!q.isCorrect && <p className="mt-1 text-sm font-semibold text-brand-ink/80">Jawaban benar: {right}</p>}
                  {q.explanation && <p className="mt-2 rounded-xl bg-brand-cream px-3 py-2 text-sm text-brand-ink/75">{q.explanation}</p>}
                </li>
              );
            })}
          </ol>
        </section>

        <Button variant="outline" onClick={begin} isLoading={start.isPending}>Coba lagi</Button>
        {start.isError && <p role="alert" className="text-center text-sm font-bold text-red-600">{errMsg(start.error)}</p>}
      </div>
    );
  }

  /* ---------- Mengerjakan ---------- */
  if (attempt) {
    const q = attempt.questions[step]!;
    const isLast = step === attempt.questions.length - 1;
    const chosen = answers[q.id];
    const answeredCount = Object.keys(answers).length;
    return (
      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-1.5 flex justify-between text-sm font-bold text-brand-ink/60">
            <span>Soal {step + 1} dari {attempt.questions.length}</span>
            <span>{answeredCount} terjawab</span>
          </div>
          <ProgressBar value={((step + 1) / attempt.questions.length) * 100} label="Progres kuis" tone="amber" />
        </div>

        <Card className="p-6">
          <fieldset>
            <legend className="mb-4 font-display text-xl font-extrabold leading-snug text-brand-ink">{q.text}</legend>
            <div className="flex flex-col gap-2.5">
              {q.options.map((o) => (
                <div key={o.id}>
                  <input
                    id={`${q.id}-${o.id}`}
                    type="radio"
                    name={q.id}
                    value={o.id}
                    checked={chosen === o.id}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                    className="peer sr-only"
                  />
                  <label
                    htmlFor={`${q.id}-${o.id}`}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-brand-ink/10 bg-surface px-4 py-3.5 font-semibold text-brand-ink transition-colors hover:border-brand-purple/40 peer-checked:border-brand-purple peer-checked:bg-brand-purple/8 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-blue"
                  >
                    <span aria-hidden="true" className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2", chosen === o.id ? "border-brand-purple bg-brand-purple text-white" : "border-brand-ink/25")}>
                      {chosen === o.id && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    {o.text}
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Sebelumnya</Button>
          {isLast ? (
            <Button disabled={answeredCount < attempt.questions.length} isLoading={submit.isPending} onClick={finish}>
              Kirim jawaban
            </Button>
          ) : (
            <Button disabled={!chosen} onClick={() => setStep((s) => s + 1)}>Lanjut</Button>
          )}
        </div>
        {isLast && answeredCount < attempt.questions.length && (
          <p className="text-center text-sm text-brand-ink/60">Jawab semua soal dulu sebelum mengirim.</p>
        )}
        {submit.isError && <p role="alert" className="text-center text-sm font-bold text-red-600">{errMsg(submit.error)}</p>}
      </div>
    );
  }

  /* ---------- Pengantar ---------- */
  return (
    <Card className="p-6 text-center sm:p-8">
      <StarIcon className="mx-auto h-14 w-14 text-brand-gold" aria-hidden="true" />
      <h2 className="mt-3 font-display text-2xl font-extrabold text-brand-ink">Siap mengerjakan kuis?</h2>
      <p className="mx-auto mt-2 max-w-md text-brand-ink/65">
        Ada {content.quiz?.questionCount ?? 0} soal pilihan ganda. Skor dan reward dihitung saat kamu mengirim jawaban.
      </p>
      {content.quiz?.bestScore != null && (
        <p className="mt-3 font-display font-bold text-brand-purple-fg">Skor terbaikmu: {content.quiz.bestScore}</p>
      )}
      <Button className="mt-6" onClick={begin} isLoading={start.isPending}>
        {content.completed ? "Kerjakan lagi" : "Mulai kuis"}
      </Button>
      {start.isError && <p role="alert" className="mt-3 text-sm font-bold text-red-600">{errMsg(start.error)}</p>}
    </Card>
  );
}
