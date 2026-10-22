import { db, ts } from "@/lib/firebase";
import { C } from "@/shared/collections";
import { Errors } from "@/shared/errors";
import { docId, newId } from "@/shared/ids";
import { assertStudentCourseAccess, loadContent } from "@/modules/courses/course.access";
import { courseService, loadQuestions, questionsDto } from "@/modules/courses/course.service";
import type { AuthUser } from "@/modules/users/user.types";
import { submitContent } from "@/modules/progress/learning.service";

export function normalizeLegacyContentType(type: string) {
  return type === "ARTICLE" ? "LESSON" : type;
}

export function normalizeLegacyQuizAnswers(raw: unknown): Record<string, string[]> {
  if (!raw || typeof raw !== "object") return {};
  const entry = raw as Record<string, unknown>;
  const source = "answers" in entry && entry.answers && typeof entry.answers === "object" ? (entry.answers as Record<string, unknown>) : entry;
  const out: Record<string, string[]> = {};

  for (const [questionId, selected] of Object.entries(source)) {
    if (["_method", "template", "contentId"].includes(questionId)) continue;
    if (typeof selected === "string") {
      out[questionId] = [selected];
      continue;
    }
    if (Array.isArray(selected)) {
      out[questionId] = selected.filter((item): item is string => typeof item === "string");
      continue;
    }
    if (selected && typeof selected === "object") {
      const nested = selected as Record<string, unknown>;
      if (typeof nested.selectedOptionId === "string") {
        out[questionId] = [nested.selectedOptionId];
        continue;
      }
      if (Array.isArray(nested.selectedOptionIds)) {
        out[questionId] = nested.selectedOptionIds.filter((item): item is string => typeof item === "string");
      }
    }
  }

  return out;
}

function normalizeSections(input: unknown): Array<{ heading?: string; text: string }> {
  if (!Array.isArray(input)) return [];
  return input.map((item) => {
    if (typeof item === "string") return { text: item };
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      return {
        heading: typeof obj.heading === "string" ? obj.heading : undefined,
        text: typeof obj.text === "string" ? obj.text : JSON.stringify(obj),
      };
    }
    return { text: String(item) };
  });
}

function normalizeFlashcards(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input.map((item, index) => {
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      return {
        id: typeof obj.id === "string" ? obj.id : `card-${index}`,
        front: typeof obj.front === "string" ? obj.front : "",
        back: typeof obj.back === "string" ? obj.back : "",
      };
    }
    return { id: `card-${index}`, front: String(item), back: "" };
  });
}

function flattenContents(course: Awaited<ReturnType<typeof courseService.get>>) {
  return course.modules.flatMap((module) => module.contents);
}

export async function legacyCourseDetail(user: AuthUser, courseId: string) {
  const course = await courseService.get(user, courseId);
  const items = flattenContents(course);
  const totalContents = items.length;
  const done = items.filter((item) => Boolean((item as { completed?: boolean }).completed)).length;
  const next = items.find((item) => !(item as { completed?: boolean }).completed) ?? null;

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    roomName: "roomName" in course ? course.roomName : "-",
    status: course.status,
    progressPercent: totalContents ? Math.round((done / totalContents) * 100) : 0,
    completedContents: done,
    totalContents,
    modules: course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      contents: module.contents.map((content) => ({
        id: content.id,
        title: content.title,
        type: normalizeLegacyContentType(content.type),
        rewardXp: content.rewardXp,
        completed: Boolean((content as { completed?: boolean }).completed),
        isNext: next ? content.id === next.id : false,
      })),
    })),
  };
}

export async function legacyContentDetail(user: AuthUser, contentId: string) {
  const content = await courseService.getContent(user, contentId);
  const course = await courseService.get(user, content.courseId);
  const items = flattenContents(course);
  const index = items.findIndex((item) => item.id === contentId);
  const completedRef = await db().collection(C.contentProgress).doc(docId(user.id, contentId)).get();
  const completed = completedRef.exists && (completedRef.data() as { status?: string }).status === "COMPLETED";
  const type = normalizeLegacyContentType(content.type);
  const detail: Record<string, unknown> = {
    id: content.id,
    courseId: content.courseId,
    courseTitle: course.title,
    title: content.title,
    type,
    rewardXp: content.rewardXp,
    completed,
    position: { index: index >= 0 ? index + 1 : 1, total: items.length || 1 },
    prevId: index > 0 ? items[index - 1]!.id : null,
    nextId: index >= 0 && index < items.length - 1 ? items[index + 1]!.id : null,
  };

  if (type === "LESSON") {
    const sections = normalizeSections((content.body as { sections?: unknown })?.sections ?? (content.body as { text?: unknown })?.text);
    detail.lesson = { sections };
  }
  if (type === "FLASHCARD") {
    const cards = normalizeFlashcards((content.body as { cards?: unknown })?.cards);
    detail.flashcards = cards;
  }
  if (type === "QUIZ") {
    const questions = await loadQuestions(contentId);
    const qBest = await db().collection(C.contentProgress).doc(docId(user.id, contentId)).get();
    const bestScore = qBest.exists ? (qBest.data() as { score?: number | null }).score ?? null : null;
    detail.quiz = { questionCount: questions.length, bestScore };
  }

  return detail;
}

export async function legacyCompleteContent(user: AuthUser, contentId: string) {
  const result = await submitContent(user, contentId, {} as never);
  const rewards = "rewards" in result ? result.rewards ?? [] : [];
  const reward = "reward" in result ? result.reward ?? { xp: 0, point: 0 } : { xp: 0, point: 0 };
  const gamification = "gamification" in result ? result.gamification : null;

  return {
    alreadyRewarded: Boolean(("alreadyCompleted" in result && result.alreadyCompleted) || ("replayed" in result && result.replayed)),
    grants: rewards.map((grant) => ({ label: grant.label, xp: grant.xp, point: grant.point })),
    totalXp: reward.xp,
    totalPoint: reward.point,
    levelUp: "levelUp" in result ? result.levelUp ?? null : null,
    courseCompleted: Boolean("courseCompleted" in result && result.courseCompleted),
    gamification,
  };
}

export async function legacyStartQuizAttempt(user: AuthUser, contentId: string) {
  const content = await loadContent(contentId);
  await assertStudentCourseAccess(user, content.courseId);
  if (!content.isPublished) throw Errors.notFound("Konten");
  if (normalizeLegacyContentType(content.type) !== "QUIZ") throw Errors.badRequest("Materi ini bukan kuis.");

  const questions = await loadQuestions(contentId);
  const attemptId = newId();
  await db().collection(C.quizAttempts).doc(attemptId).set({
    studentId: user.id,
    contentId,
    courseId: content.courseId,
    attemptNumber: 1,
    score: null,
    maxScore: null,
    percent: null,
    perfect: false,
    xpEarned: 0,
    pointEarned: 0,
    startedAt: ts(),
    submittedAt: null,
    answers: [],
  });

  const payload = questionsDto(questions, false);
  return {
    attemptId,
    contentId,
    questions: payload,
  };
}

export async function legacySubmitQuizAttempt(user: AuthUser, attemptId: string, rawAnswers: Record<string, string[] | string>) {
  const attemptSnap = await db().collection(C.quizAttempts).doc(attemptId).get();
  if (!attemptSnap.exists) throw Errors.notFound("Percobaan kuis tidak ditemukan.");
  const attempt = attemptSnap.data() as { studentId?: string; contentId?: string };
  if (attempt.studentId !== user.id) throw Errors.forbidden();
  if (!attempt.contentId) throw Errors.notFound("Percobaan kuis tidak valid.");

  const answers = normalizeLegacyQuizAnswers(rawAnswers);
  const mapped = Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
    questionId,
    selectedOptionIds,
  }));

  const result = await submitContent(user, attempt.contentId, { answers: mapped }, attemptId);
  const questions = await loadQuestions(attempt.contentId);
  const map = new Map(questions.map((q) => [q.id, q]));
  const quiz = "quiz" in result && result.quiz ? result.quiz : null;
  const rewards = "rewards" in result ? result.rewards ?? [] : [];
  const reward = "reward" in result ? result.reward ?? { xp: 0, point: 0 } : { xp: 0, point: 0 };
  const questionsOut = (quiz?.results ?? []).map((item) => {
    const q = map.get(item.questionId);
    const selected = item.selectedOptionIds[0] ?? null;
    const correct = q?.options.find((o) => o.isCorrect)?.id ?? "";
    return {
      questionId: item.questionId,
      text: q?.text ?? "",
      options: (q?.options ?? []).map((option) => ({ id: option.id, text: option.text })),
      selectedOptionId: selected,
      correctOptionId: correct,
      isCorrect: item.correct,
      explanation: q?.explanation ?? "",
    };
  });

  return {
    attemptId,
    score: quiz?.percent ?? 0,
    correct: quiz?.correctCount ?? 0,
    total: quiz?.results.length ?? 0,
    perfect: quiz?.perfect ?? false,
    bestScore: quiz?.percent ?? 0,
    questions: questionsOut,
    outcome: {
      alreadyRewarded: Boolean(("alreadyCompleted" in result && result.alreadyCompleted) || ("replayed" in result && result.replayed)),
      grants: rewards.map((grant) => ({ label: grant.label, xp: grant.xp, point: grant.point })),
      totalXp: reward.xp,
      totalPoint: reward.point,
      levelUp: "levelUp" in result ? result.levelUp ?? null : null,
      courseCompleted: Boolean("courseCompleted" in result && result.courseCompleted),
      gamification: "gamification" in result ? result.gamification : null,
    },
  };
}
