import { describe, expect, it } from "vitest";
import {
  REWARD_CONFIG, appendCheckinDate, baseRewardOf, buildSortKey, effectiveStreak, levelFor, levelUpOf,
  planSubmissionRewards, streakAfterCheckin, weekStrip,
} from "@/modules/gamification/gamification.logic";

describe("levelFor", () => {
  it("mengikuti tabel SRS §7", () => {
    expect(levelFor(0)).toMatchObject({ level: 1, name: "Pemula", nextLevelXp: 100, xpToNext: 100, percent: 0 });
    expect(levelFor(99).level).toBe(1);
    expect(levelFor(100).level).toBe(2);
    expect(levelFor(240)).toMatchObject({ level: 2, xpIntoLevel: 140, xpToNext: 10, percent: 93 });
    expect(levelFor(250).level).toBe(3);
    expect(levelFor(1000)).toMatchObject({ level: 5, nextLevelXp: null, xpToNext: null, percent: 100 });
  });
  it("deteksi naik level (data demo: 240 + 10 XP → level 3)", () => {
    expect(levelUpOf(240, 250)).toEqual({ from: 2, to: 3, name: "Santri Rajin" });
    expect(levelUpOf(240, 245)).toBeNull();
  });
});

describe("streak", () => {
  const base = { lastCheckinDate: "2026-10-14", currentStreak: 3, longestStreak: 4 };
  it("lanjut jika check-in terakhir kemarin", () => {
    expect(streakAfterCheckin(base, "2026-10-15")).toEqual({ currentStreak: 4, longestStreak: 4 });
    expect(streakAfterCheckin({ ...base, currentStreak: 4 }, "2026-10-15")).toEqual({ currentStreak: 5, longestStreak: 5 });
  });
  it("reset ke 1 jika ada hari terlewat, longest tetap", () => {
    expect(streakAfterCheckin(base, "2026-10-17")).toEqual({ currentStreak: 1, longestStreak: 4 });
  });
  it("check-in pertama", () => {
    expect(streakAfterCheckin({ lastCheckinDate: null, currentStreak: 0, longestStreak: 0 }, "2026-10-15")).toEqual({ currentStreak: 1, longestStreak: 1 });
  });
  it("streak tampil 0 bila terputus", () => {
    expect(effectiveStreak(base, "2026-10-15")).toBe(3); // kemarin → masih hidup
    expect(effectiveStreak(base, "2026-10-14")).toBe(3);
    expect(effectiveStreak(base, "2026-10-16")).toBe(0);
  });
  it("strip mingguan Senin–Minggu", () => {
    const w = weekStrip(["2026-10-12", "2026-10-14"], "2026-10-15");
    expect(w.map((d) => d.label)).toEqual(["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]);
    expect(w.filter((d) => d.checked).map((d) => d.date)).toEqual(["2026-10-12", "2026-10-14"]);
    expect(w[3]).toMatchObject({ isToday: true, isFuture: false });
    expect(w[4]).toMatchObject({ isFuture: true });
  });
  it("menyimpan maksimal 14 tanggal unik", () => {
    let d: string[] = [];
    for (let i = 1; i <= 20; i++) d = appendCheckinDate(d, `2026-09-${String(i).padStart(2, "0")}`);
    d = appendCheckinDate(d, "2026-09-20");
    expect(d).toHaveLength(14);
    expect(d.at(-1)).toBe("2026-09-20");
  });
});

describe("sortKey leaderboard (points ↓, xp ↓, updatedAt ↑, userId ↑)", () => {
  const sorted = (rows: [number, number, number, string][]) =>
    rows.map(([p, x, t, u]) => ({ k: buildSortKey(p, x, t, u), u })).sort((a, b) => (a.k < b.k ? -1 : 1)).map((r) => r.u);
  it("urut sesuai aturan tie-break", () => {
    expect(sorted([[100, 100, 5, "b"], [200, 50, 9, "a"], [100, 120, 9, "c"], [100, 100, 3, "d"], [100, 100, 3, "a2"]])).toEqual(["a", "c", "a2", "d", "b"]);
  });
  it("tetap benar untuk angka berbeda digit", () => {
    expect(sorted([[9, 9, 1, "x"], [10, 10, 1, "y"], [1000, 1, 1, "z"]])).toEqual(["z", "y", "x"]);
  });
});

describe("planSubmissionRewards (BR-007/008/010)", () => {
  const lesson = { id: "c1", type: "LESSON" as const, title: "Nabi Hud", xpReward: 0, pointReward: 0, courseId: "course1" };
  const quiz = { ...lesson, id: "q1", type: "QUIZ" as const, title: "Kuis 1" };
  const common = { courseTitle: "Kisah Nabi", perfect: false, alreadyCompleted: false, completedBefore: 2, totalContents: 10, courseAlreadyCompleted: false };

  it("pelajaran = 5 XP, kuis = 20, kuis sempurna = 30", () => {
    expect(planSubmissionRewards({ ...common, content: lesson }).rewards[0]).toMatchObject({ source: "LESSON", xp: 5, point: 0, label: "Pelajaran: Nabi Hud" });
    expect(planSubmissionRewards({ ...common, content: quiz }).rewards[0]).toMatchObject({ source: "QUIZ", xp: 20, point: 20 });
    expect(planSubmissionRewards({ ...common, content: quiz, perfect: true }).rewards[0]).toMatchObject({ source: "PERFECT_QUIZ", xp: 30, point: 30, label: "Kuis sempurna: Kuis 1" });
  });
  it("point HANYA dari kuis: pelajaran, kartu, dan bonus course = 0 point", () => {
    const flashcard = { ...lesson, id: "f1", type: "FLASHCARD" as const };
    expect(planSubmissionRewards({ ...common, content: flashcard }).rewards[0]).toMatchObject({ xp: 5, point: 0 });
    const last = planSubmissionRewards({ ...common, content: lesson, completedBefore: 9 });
    expect(last.rewards.map((r) => [r.source, r.xp, r.point])).toEqual([["LESSON", 5, 0], ["COURSE", 100, 0]]);
    expect(REWARD_CONFIG.DAILY_CHECKIN.point).toBe(0);
  });
  it("konten yang sudah selesai TIDAK memberi reward lagi (retry/retake)", () => {
    expect(planSubmissionRewards({ ...common, content: quiz, alreadyCompleted: true })).toEqual({ rewards: [], completesCourse: false });
  });
  it("bonus course 100 XP hanya saat konten terakhir selesai, sekali saja", () => {
    const last = planSubmissionRewards({ ...common, content: lesson, completedBefore: 9 });
    expect(last.completesCourse).toBe(true);
    expect(last.rewards.map((r) => [r.source, r.xp])).toEqual([["LESSON", 5], ["COURSE", 100]]);
    expect(planSubmissionRewards({ ...common, content: lesson, completedBefore: 9, courseAlreadyCompleted: true }).completesCourse).toBe(false);
    expect(planSubmissionRewards({ ...common, content: lesson, completedBefore: 5 }).completesCourse).toBe(false);
  });
  it("kunci idempotensi stabil per konten/course", () => {
    const r = planSubmissionRewards({ ...common, content: lesson, completedBefore: 9 }).rewards;
    expect(r.map((x) => x.idempotencyKey)).toEqual(["content:c1", "course:course1"]);
  });
  it("override reward per konten oleh guru", () => {
    expect(baseRewardOf({ type: "QUIZ", xpReward: 12, pointReward: 0 })).toEqual({ xp: 12, point: 12 });
    expect(baseRewardOf({ type: "QUIZ", xpReward: 12, pointReward: 7 })).toEqual({ xp: 12, point: 7 });
    // guru mengisi pointReward di pelajaran → diabaikan, point tetap 0
    expect(baseRewardOf({ type: "LESSON", xpReward: 12, pointReward: 7 })).toEqual({ xp: 12, point: 0 });
  });
});
