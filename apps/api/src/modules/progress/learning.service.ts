import { FieldValue, db, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { countOf } from "@/shared/firestore-utils";
import { docId, newId, sha256 } from "@/shared/ids";
import { dayKey } from "@/shared/time";
import { auditInTx } from "../audit/audit";
import { assertStudentCourseAccess, loadContent } from "../courses/course.access";
import { loadQuestions } from "../courses/course.service";
import type { ContentDoc } from "../courses/course.types";
import {
  QUIZ_COMPLETION_MIN_PERCENT, applyDelta, initialGamification, levelUpOf, planSubmissionRewards, toGamificationSummary,
} from "../gamification/gamification.logic";
import { gamRef, ledgerRef, touchActivityInTx, writeLedgerInTx } from "../gamification/gamification.repository";
import type { UserGamificationDoc } from "../gamification/gamification.types";
import { notifyInTx } from "../notifications/notification.service";
import { scoreQuiz, type QuizScore } from "../quiz/quiz.logic";
import type { AuthUser, UserDoc } from "../users/user.types";
import type { SubmitInput } from "./learning.schema";
import { progressService } from "./progress.service";

interface ProgressDoc {
  studentId: string; contentId: string; courseId: string;
  status: "IN_PROGRESS" | "COMPLETED"; score: number | null; attempts: number;
  xpEarned: number; pointEarned: number;
  startedAt: FirebaseFirestore.Timestamp; completedAt: FirebaseFirestore.Timestamp | null; updatedAt: FirebaseFirestore.Timestamp;
}
interface EnrollmentDoc {
  studentId: string; courseId: string; status: "ACTIVE" | "COMPLETED"; completedContents: number;
  enrolledAt: FirebaseFirestore.Timestamp; completedAt: FirebaseFirestore.Timestamp | null;
}

export async function submitContent(user: AuthUser, contentId: string, input: SubmitInput, headerKey?: string | null) {
  const content = await loadContent(contentId);
  const course = await assertStudentCourseAccess(user, content.courseId);
  if (!content.isPublished) throw Errors.notFound("Konten");

  // ---- penilaian di server (BR-009) ----
  let score: QuizScore | null = null;
  if (content.type === "QUIZ") {
    if (!input.answers) throw Errors.validation({ answers: "Jawaban kuis wajib dikirim." });
    const questions = await loadQuestions(contentId);
    if (!questions.length) throw Errors.conflict("Kuis ini belum memiliki pertanyaan.");
    score = scoreQuiz(questions, input.answers);
  }
  const maxAttempts = typeof content.body.maxAttempts === "number" ? (content.body.maxAttempts as number) : null;

  const totalContents = await countOf(db().collection(C.contents).where("courseId", "==", course.id).where("isPublished", "==", true));

  const idem = input.idempotencyKey ?? headerKey ?? null;
  const idemRef = idem ? db().collection(C.idempotencyKeys).doc(docId(user.id, sha256(`submit:${contentId}:${idem}`).slice(0, 40))) : null;
  const progRef = db().collection(C.contentProgress).doc(docId(user.id, contentId));
  const enrRef = db().collection(C.enrollments).doc(docId(user.id, course.id));
  const userRef = db().collection(C.users).doc(user.id);

  const now = new Date();
  const stamp = ts(now);
  const today = dayKey(now);

  const result = await db().runTransaction(async (tx) => {
    const refs = [progRef, enrRef, gamRef(user.id), userRef, ...(idemRef ? [idemRef] : [])];
    const snaps = await tx.getAll(...refs);
    const [pSnap, eSnap, gSnap, uSnap] = snaps;
    if (idemRef && snaps[4]!.exists) return { ...(snaps[4]!.data()!.response as object), replayed: true };

    const prog = pSnap!.exists ? (pSnap!.data() as ProgressDoc) : null;
    const enr = eSnap!.exists ? (eSnap!.data() as EnrollmentDoc) : null;
    let g = gSnap!.exists ? (gSnap!.data() as UserGamificationDoc) : null;
    if (!g) {
      const u = uSnap!.data() as UserDoc;
      g = initialGamification(user.id, u.name, u.username, stamp);
    }

    if (maxAttempts !== null && (prog?.attempts ?? 0) >= maxAttempts) {
      throw Errors.conflict("Kesempatan mengerjakan kuis ini sudah habis.");
    }

    const qualifies = score ? score.percent >= QUIZ_COMPLETION_MIN_PERCENT : true;
    const alreadyCompleted = prog?.status === "COMPLETED";
    const plan = planSubmissionRewards({
      content: { id: contentId, type: content.type, title: content.title, xpReward: content.xpReward, pointReward: content.pointReward, courseId: course.id },
      courseTitle: course.title,
      perfect: score?.perfect ?? false,
      alreadyCompleted: alreadyCompleted || !qualifies,
      completedBefore: enr?.completedContents ?? 0,
      totalContents,
      courseAlreadyCompleted: enr?.status === "COMPLETED",
    });

    // guard tambahan: ledger yang sudah ada (key sama) tidak ditulis ulang → tidak pernah dobel (BR-010)
    const ledgerSnaps = plan.rewards.length ? await tx.getAll(...plan.rewards.map((r) => ledgerRef(user.id, r.idempotencyKey))) : [];
    const rewards = plan.rewards.filter((_, i) => !ledgerSnaps[i]!.exists);
    const completesCourse = plan.completesCourse && rewards.some((r) => r.source === "COURSE");
    const xp = rewards.reduce((a, r) => a + r.xp, 0);
    const point = rewards.reduce((a, r) => a + r.point, 0);

    // ---- tulis (semua atau tidak sama sekali) ----
    const newlyCompleted = qualifies && !alreadyCompleted;
    const attemptNumber = (prog?.attempts ?? 0) + 1;
    let attemptId: string | null = null;
    if (score) {
      attemptId = newId();
      tx.create(db().collection(C.quizAttempts).doc(attemptId), {
        studentId: user.id, contentId, courseId: course.id, attemptNumber,
        score: score.earned, maxScore: score.max, percent: score.percent, perfect: score.perfect,
        xpEarned: xp, pointEarned: point, startedAt: stamp, submittedAt: stamp,
        answers: score.results.map((r) => ({ questionId: r.questionId, selectedOptionIds: r.selectedOptionIds, isCorrect: r.correct })),
      });
    }

    const bestScore = score ? Math.max(prog?.score ?? 0, score.percent) : prog?.score ?? null;
    tx.set(progRef, {
      studentId: user.id, contentId, courseId: course.id,
      status: newlyCompleted || alreadyCompleted ? "COMPLETED" : "IN_PROGRESS",
      score: bestScore, attempts: attemptNumber,
      xpEarned: (prog?.xpEarned ?? 0) + xp, pointEarned: (prog?.pointEarned ?? 0) + point,
      startedAt: prog?.startedAt ?? stamp,
      completedAt: prog?.completedAt ?? (newlyCompleted ? stamp : null),
      updatedAt: stamp,
    } satisfies ProgressDoc);

    const completedContents = (enr?.completedContents ?? 0) + (newlyCompleted ? 1 : 0);
    tx.set(enrRef, {
      studentId: user.id, courseId: course.id,
      status: completesCourse || enr?.status === "COMPLETED" ? "COMPLETED" : "ACTIVE",
      completedContents, enrolledAt: enr?.enrolledAt ?? stamp,
      completedAt: enr?.completedAt ?? (completesCourse ? stamp : null),
    } satisfies EnrollmentDoc);

    let next: UserGamificationDoc = rewards.length ? applyDelta(g, { xp, point }, stamp) : { ...g, lastActiveAt: stamp };
    if (score) {
      if (!prog || prog.score === null) {
        next = { ...next, quizzesDone: next.quizzesDone + 1, quizScoreSum: next.quizScoreSum + score.percent };
      } else if (score.percent > prog.score) {
        next = { ...next, quizScoreSum: next.quizScoreSum + (score.percent - prog.score) };
      }
    }
    if (completesCourse) next = { ...next, coursesCompleted: next.coursesCompleted + 1 };
    tx.set(gamRef(user.id), next);

    rewards.forEach((r) => writeLedgerInTx(tx, user.id, r, stamp));
    touchActivityInTx(tx, user.id, today, g.roomIds);

    const levelUp = levelUpOf(g.totalXp, next.totalXp);
    if (levelUp) {
      notifyInTx(tx, { userId: user.id, type: "ACHIEVEMENT", title: `Naik ke Level ${levelUp.to}!`, message: `Selamat, kamu sekarang "${levelUp.name}".`, data: { levelUp } });
    }
    if (completesCourse) {
      notifyInTx(tx, { userId: user.id, type: "ACHIEVEMENT", title: "Course selesai!", message: `Kamu menyelesaikan "${course.title}".`, data: { courseId: course.id } });
      auditInTx(tx, { actorId: user.id, action: "COURSE_COMPLETED", entityType: "course", entityId: course.id });
    }

    const response = {
      contentId, courseId: course.id, type: content.type,
      completed: newlyCompleted || alreadyCompleted, alreadyCompleted,
      quiz: score && attemptId ? {
        attemptId, attemptNumber, score: score.earned, maxScore: score.max, percent: score.percent,
        perfect: score.perfect, correctCount: score.correctCount, results: score.results,
      } : null,
      rewards: rewards.map((r) => ({ source: r.source, label: r.label, xp: r.xp, point: r.point })),
      reward: { xp, point },
      gamification: toGamificationSummary(next, today),
      levelUp,
      courseCompleted: completesCourse,
      course: {
        completedContents, totalContents,
        progressPercent: totalContents ? Math.min(100, Math.round((completedContents / totalContents) * 100)) : 0,
      },
      replayed: false,
    };
    if (idemRef) tx.create(idemRef, { userId: user.id, contentId, response, createdAt: stamp, expiresAt: ts(new Date(now.getTime() + 7 * 86_400_000)) });
    return response;
  });

  await progressService.refreshCourseProgress(user.id).catch(() => undefined);
  return result;
}

