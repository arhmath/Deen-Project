/**
 * Seed data demo — mereplikasi data mock frontend (src/services/mock/data.ts):
 * 1 guru, 1 orang tua, 1 santri utama (Ahmad) + 17 santri roster, 2 room, 4 course.
 * Jalankan: npm run seed   (butuh .env berisi kredensial Firebase atau FIRESTORE_EMULATOR_HOST)
 * Idempotent: ID dokumen tetap, aman dijalankan ulang (menimpa data demo).
 * Materi course hanya placeholder — isi final ditentukan guru.
 */
import { db, ts } from "../src/lib/firebase";
import { C } from "../src/shared/collections";
import { docId, sha256 } from "../src/shared/ids";
import { hashPassword } from "../src/shared/security";
import { uniqueRef } from "../src/shared/unique";
import { dayKey, addDays } from "../src/shared/time";
import { buildSortKey, levelFor } from "../src/modules/gamification/gamification.logic";
import { progressService } from "../src/modules/progress/progress.service";
import { getAdminSeedConfig, seedAdmin } from "./seed-admin";

const PASSWORD = "deen1234";
const ADMIN_SEED = getAdminSeedConfig();
const today = dayKey();
const now = new Date();
const stamp = ts(now);

const ROOMS = [
  { id: "r1", name: "TPA Al-Hikmah · Kelas A", code: "HIKMAHA1" },
  { id: "r2", name: "TPA Al-Hikmah · Kelas B", code: "HIKMAHB1" },
];
const COURSES = [
  { id: "c1", title: "Belajar Huruf Hijaiyah", room: "r1", n: 10 },
  { id: "c2", title: "Kisah Para Nabi", room: "r1", n: 10 },
  { id: "c3", title: "Asmaul Husna untuk Anak", room: "r1", n: 10 },
  { id: "c4", title: "Akhlak dan Adab Sehari-hari", room: "r2", n: 10 },
];
// [id, nama, username, room, xp, point, streak, progres%, avgScore, hari sejak aktif, checkedInToday]
const ROSTER: [string, string, string, string, number, number, number, number, number, number, boolean][] = [
  ["s-ahmad", "Ahmad Fauzi", "ahmad", "r1", 240, 240, 4, 58, 88, 0, true],
  ["s-aisyah", "Aisyah Putri", "aisyah", "r1", 520, 520, 12, 85, 94, 0, true],
  ["s-bilal", "Bilal Ramadhan", "bilal", "r1", 410, 410, 9, 72, 90, 0, true],
  ["s-salma", "Salma Nur Aini", "salma", "r1", 360, 360, 6, 66, 86, 1, false],
  ["s-hafidz", "Hafidz Alfarizi", "hafidz", "r1", 300, 300, 3, 60, 82, 1, false],
  ["s-zahra", "Zahra Khairunnisa", "zahra", "r1", 275, 275, 5, 55, 85, 0, true],
  ["s-yusuf", "Yusuf Hakim", "yusuf", "r1", 190, 190, 2, 40, 76, 2, false],
  ["s-nadia", "Nadia Safitri", "nadia", "r1", 150, 150, 1, 33, 71, 3, false],
  ["s-rizky", "Rizky Maulana", "rizky", "r1", 90, 90, 0, 20, 64, 5, false],
  ["s-fatimah", "Fatimah Azzahra", "fatimah", "r2", 480, 480, 10, 80, 92, 0, true],
  ["s-umar", "Umar Abdullah", "umar", "r2", 390, 390, 7, 70, 88, 0, true],
  ["s-khadijah", "Khadijah Amira", "khadijah", "r2", 330, 330, 4, 62, 84, 1, false],
  ["s-ibrahim", "Ibrahim Naufal", "ibrahim", "r2", 260, 260, 3, 50, 79, 1, false],
  ["s-maryam", "Maryam Lathifah", "maryam", "r2", 210, 210, 2, 44, 77, 2, false],
  ["s-idris", "Idris Maulidi", "idris", "r2", 120, 120, 0, 25, 68, 4, false],
  ["s-hasan", "Hasan Basri", "hasan", "r2", 70, 70, 0, 15, 60, 6, false],
  ["s-ali", "Ali Mustofa", "ali", "r2", 60, 60, 0, 10, 58, 8, false],
  ["s-ruqayyah", "Ruqayyah Sakinah", "ruqayyah", "r2", 40, 40, 0, 6, 55, 9, false],
];

async function setUser(id: string, name: string, username: string, role: "SANTRI" | "PARENT" | "ADMIN", hash: string, email: string | null) {
  await db().collection(C.users).doc(id).set({
    name, username, usernameLower: username, email, emailLower: email, passwordHash: hash, role, avatarUrl: null,
    isActive: true, createdAt: stamp, updatedAt: stamp, deletedAt: null,
  });
  await uniqueRef("username", username).set({ userId: id, type: "username", createdAt: stamp });
  if (email) await uniqueRef("email", email).set({ userId: id, type: "email", createdAt: stamp });
}

async function main() {
  const hash = await hashPassword(PASSWORD);
  await seedAdmin();
  await setUser("a-hakim", "Ustadz Hakim", "hakim", "ADMIN", hash, "hakim@deen.id");
  await setUser("p-rahma", "Ibu Rahma", "rahma", "PARENT", hash, "rahma@deen.id");

  for (const r of ROOMS) {
    const members = ROSTER.filter((s) => s[3] === r.id).length;
    await db().collection(C.rooms).doc(r.id).set({
      ownerId: "a-hakim", name: r.name, description: null, joinCode: r.code, status: "ACTIVE", memberCount: members,
      createdAt: stamp, updatedAt: stamp, deletedAt: null,
    });
    await uniqueRef("joinCode", r.code).set({ roomId: r.id, type: "joinCode", createdAt: stamp });
  }

  // course → modul → konten (10 konten per course: lesson, kecuali kuis di urutan 3,6,9)
  for (const c of COURSES) {
    await db().collection(C.courses).doc(c.id).set({
      roomId: c.room, creatorId: "a-hakim", title: c.title, slug: c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: `Course contoh: ${c.title}.`, thumbnailUrl: null, status: "PUBLISHED", publishedAt: stamp,
      createdAt: stamp, updatedAt: stamp, deletedAt: null,
    });
    await uniqueRef("courseSlug", `${c.room}:${c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`).set({ courseId: c.id, type: "courseSlug", createdAt: stamp });
    await db().collection(C.courseModules).doc(`${c.id}-m1`).set({ courseId: c.id, title: "Modul 1", description: null, orderIndex: 0, createdAt: stamp, updatedAt: stamp });
    for (let i = 1; i <= c.n; i++) {
      const id = `${c.id}-${i}`;
      const isQuiz = i % 3 === 0;
      await db().collection(C.contents).doc(id).set({
        moduleId: `${c.id}-m1`, courseId: c.id, type: isQuiz ? "QUIZ" : "LESSON", title: isQuiz ? `Kuis ${i}` : `Materi ${i}`,
        description: null, body: isQuiz ? { maxAttempts: 5 } : { text: "(Materi contoh — isi oleh guru.)" },
        xpReward: 0, pointReward: 0, orderIndex: i - 1, isPublished: true, createdAt: stamp, updatedAt: stamp,
      });
      if (isQuiz) {
        await db().collection(C.questions).doc(`${id}-q1`).set({
          contentId: id, text: "Pertanyaan contoh (ganti oleh guru).", type: "SINGLE_CHOICE", explanation: "Pembahasan contoh.", points: 1, orderIndex: 0,
          options: [
            { id: `${id}-q1-a`, text: "Jawaban benar", isCorrect: true, orderIndex: 0 },
            { id: `${id}-q1-b`, text: "Jawaban salah", isCorrect: false, orderIndex: 1 },
          ],
        });
      }
    }
  }

  for (const [id, name, username, room, xp, point, streak, prog, avg, inactive, checked] of ROSTER) {
    await setUser(id, name, username, "SANTRI", hash, null);
    await db().collection(C.roomMembers).doc(docId(room, id)).set({ roomId: room, userId: id, isActive: true, joinedAt: stamp });

    const lastActive = new Date(now.getTime() - inactive * 86_400_000);
    const dates = Array.from({ length: Math.min(streak, 7) }, (_, k) => addDays(checked ? today : addDays(today, -1), -k)).reverse();
    const lastCheckin = streak > 0 ? (checked ? today : addDays(today, -1)) : null;
    await db().collection(C.userGamification).doc(id).set({
      userId: id, name, username, level: levelFor(xp).level, totalXp: xp, totalPoints: point,
      currentStreak: streak, longestStreak: Math.max(streak, 5), lastCheckinDate: lastCheckin, checkinDates: lastCheckin ? dates : [],
      quizzesDone: 3, quizScoreSum: avg * 3, coursesCompleted: 0, courseProgress: prog,
      lastActiveAt: ts(lastActive), roomIds: [room], sortKey: buildSortKey(point, xp, lastActive.getTime(), id),
      createdAt: stamp, updatedAt: ts(lastActive),
    });

    // ledger ringkas supaya riwayat reward tidak kosong (satu baris saldo awal per santri)
    await db().collection(C.gamificationTransactions).doc(docId(id, sha256("seed:opening").slice(0, 40))).set({
      userId: id, eventType: "MANUAL_ADJUSTMENT", xpDelta: xp, pointDelta: point, referenceType: "SEED", referenceId: "opening",
      idempotencyKey: "seed:opening", description: "Saldo awal (data demo)", createdAt: ts(lastActive),
    });

    // progres konten nyata → course progress dihitung dari data (bukan angka tempelan)
    const mine = COURSES.filter((c) => c.room === room);
    const total = mine.reduce((a, c) => a + c.n, 0);
    let remaining = Math.round((prog / 100) * total);
    for (const c of mine) {
      let done = 0;
      for (let i = 1; i <= c.n && remaining > 0; i++, remaining--, done++) {
        await db().collection(C.contentProgress).doc(docId(id, `${c.id}-${i}`)).set({
          studentId: id, contentId: `${c.id}-${i}`, courseId: c.id, status: "COMPLETED", score: i % 3 === 0 ? avg : null, attempts: 1,
          xpEarned: 0, pointEarned: 0, startedAt: stamp, completedAt: ts(lastActive), updatedAt: ts(lastActive),
        });
      }
      await db().collection(C.enrollments).doc(docId(id, c.id)).set({ studentId: id, courseId: c.id, status: done === c.n ? "COMPLETED" : "ACTIVE", completedContents: done, enrolledAt: stamp, completedAt: null });
    }
    await db().collection(C.dailyActivity).doc(docId(id, addDays(today, -inactive))).set({ userId: id, date: addDays(today, -inactive), roomIds: [room], actions: 1, checkedIn: checked, updatedAt: stamp });
    await progressService.refreshCourseProgress(id);
  }

  await db().collection(C.parentStudents).doc(docId("p-rahma", "s-ahmad")).set({ parentId: "p-rahma", studentId: "s-ahmad", relationship: "Ibu", status: "ACTIVE", createdAt: stamp, updatedAt: stamp });
  await db().collection(C.parentStudents).doc(docId("p-rahma", "s-aisyah")).set({ parentId: "p-rahma", studentId: "s-aisyah", relationship: "Ibu", status: "ACTIVE", createdAt: stamp, updatedAt: stamp });

  console.log("Seed selesai. Login admin default: username=%s password=%s | demo user: ahmad / %s | rahma / %s | hakim / %s", ADMIN_SEED.username, ADMIN_SEED.password, PASSWORD, PASSWORD, PASSWORD);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
