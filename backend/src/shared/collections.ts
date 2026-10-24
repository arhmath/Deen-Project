/** Nama koleksi Firestore. Padanan tabel di 03-DATABASE-SCHEMA.sql ada di komentar. */
export const C = {
  users: "users", // users (+ user_roles → field `role`)
  uniqueKeys: "uniqueKeys", // pengganti UNIQUE index (username, email, join_code, slug)
  parentStudents: "parentStudents", // parent_students
  rooms: "rooms",
  roomMembers: "roomMembers", // room_members
  courses: "courses",
  courseModules: "courseModules", // course_modules
  contents: "contents",
  questions: "questions", // questions + question_options (opsi di-embed)
  enrollments: "enrollments",
  contentProgress: "contentProgress", // content_progress
  quizAttempts: "quizAttempts", // quiz_attempts + quiz_answers (jawaban di-embed)
  dailyCheckins: "dailyCheckins", // daily_checkins
  dailyActivity: "dailyActivity", // read-model aktivitas harian (monitoring)
  userGamification: "userGamification", // user_gamification (read model)
  gamificationTransactions: "gamificationTransactions", // ledger append-only
  idempotencyKeys: "idempotencyKeys",
  chatConversations: "chatConversations",
  chatMessages: "chatMessages",
  aiFeedback: "aiFeedback",
  knowledgeBase: "knowledgeBase",
  notifications: "notifications",
  auditLogs: "auditLogs",
  refreshTokens: "refreshTokens",
  passwordResets: "passwordResets", // token reset password (id dokumen = sha256 token; token asli tidak disimpan)
} as const;
