# Deen API — Next.js (Route Handlers) + Firebase Firestore + AI

Backend untuk frontend Deen (Vite/React di root repo). Mengikuti `src/DEEN-SRS-Engineering-Spec/` dan kontrak
frontend (`src/services/api.ts`, `src/services/mock/server.ts`), dengan **Next.js TypeScript** + **Firestore** (bukan Express/PostgreSQL).

## Menjalankan

```bash
cd apps/api
cp .env.example .env        # isi JWT_*_SECRET (≥32 karakter) + kredensial Firebase ATAU FIRESTORE_EMULATOR_HOST
npm install
npm run seed                # data demo (akun: ahmad / rahma / hakim, password deen1234)
npm run dev                 # http://localhost:3000/api/v1
npm test                    # 83 unit test
```

Firebase: buat project → Firestore (mode production) → service account (Project settings → Service accounts) →
isi `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY`. Deploy `firestore.indexes.json` dan `firestore.rules`
(`firebase deploy --only firestore`; rules = tolak semua akses klien, semua lewat backend). Aktifkan **TTL** pada
`refreshTokens.expiresAt` dan `idempotencyKeys.expiresAt` (sudah ada di indexes file).

Frontend: di root buat `.env` → `VITE_USE_MOCK=false` dan `VITE_API_URL=http://localhost:3000/api/v1`.
`CORS_ORIGIN` harus memuat origin frontend (default `http://localhost:5173`).

## Endpoint (semua di `/api/v1`)

| Area | Endpoint |
|---|---|
| Auth | `POST /auth/register` `/auth/login` `/auth/refresh` `/auth/logout`, `GET /auth/me`, `GET/PATCH /users/me` |
| Santri | `GET /me/dashboard`, `POST /me/check-ins`, `GET /me/courses`, `GET /gamification/me[/history]`, `GET /progress/me`, `GET /progress/courses/:id`, alias `POST/GET /checkins` |
| Room | `GET/POST /rooms`, `POST /rooms/join`, `GET/PATCH/DELETE /rooms/:id`, `GET /rooms/:id/members`, `DELETE /rooms/:id/members/:userId` |
| Course | `GET/POST /courses`, `GET/PATCH/DELETE /courses/:id`, `GET/POST /courses/:id/modules`, `PATCH/DELETE /modules/:id`, `GET/POST /modules/:id/contents`, `GET/PATCH/DELETE /contents/:id`, `POST /contents/:id/submit` |
| Leaderboard | `GET /leaderboard?roomId&page&pageSize` (kontrak frontend), `GET /leaderboards/global[/me]`, `/leaderboards/rooms/:id` |
| Guru | `GET /admin/overview`, `GET /admin/students`, `GET /admin/parent-links`, `PATCH /admin/parent-links/:id` |
| Orang tua | `GET /parent/students[/:id[/progress]]`, `POST /parent/links` |
| Lain | `GET /notifications`, `POST /notifications/:id/read`, `GET /api/health`, `GET /api/ready` |
| AI | `POST /ai/chat`, `GET /ai/conversations`, `GET/DELETE /ai/conversations/:id`, `POST /ai/messages/:id/feedback` |

Respons sukses berupa payload langsung (sesuai frontend, bukan envelope). Error: `{ success:false, message, error:{code,message}, fieldErrors? }`
(kecuali `/ai/*`: `{ error: "…", message, code }` sesuai 05B). Validasi = 422 (AI = 400).

## Pemetaan PostgreSQL → Firestore

`03-DATABASE-SCHEMA.sql` dipetakan ke koleksi di `src/shared/collections.ts`. Pengganti constraint:

| Constraint SQL | Di Firestore |
|---|---|
| UNIQUE username/email/join_code/slug | dokumen `uniqueKeys/{type}_{sha256}` dibuat via `tx.create` di transaksi yang sama |
| UNIQUE(room_id,user_id), (student,content), (user,date) | ID dokumen deterministik `a_b` |
| Ledger idempoten (BR-010) | ID ledger = `{user}_{sha256(key)}` + `tx.create` → reward ganda mustahil |
| FK / ON DELETE | dicek di service; entitas dengan progres tidak bisa dihapus (409) |
| user_gamification (read model) | `userGamification/{uid}` diubah **dalam transaksi yang sama** dengan ledger & progres |
| quiz_answers, question_options | di-embed di `quizAttempts` / `questions` |

## Keputusan & asumsi (silakan koreksi)

1. **Auth kustom** (JWT HS256 + bcrypt di Firestore), bukan Firebase Auth — frontend login dengan *username*; Firebase Auth berbasis email. Refresh token dirotasi; pemakaian ulang token lama mencabut seluruh sesi.
2. **Access token default 60 menit**; frontend saat ini belum memanggil `/auth/refresh` (lihat "Tindak lanjut").
3. **Tanggal bisnis = WIB** (`APP_TIMEZONE`), ditentukan server. Streak, check-in, dan "hari ini" konsisten.
4. **Reward** (server, `gamification.logic.ts`): check-in 10, pelajaran 5, kuis 20, kuis sempurna 30 (*menggantikan* 20, mengikuti ledger mock), challenge 50, course selesai +100. Hanya diberikan saat konten **pertama kali** selesai; ulang kuis tidak menambah XP. Kuis dianggap selesai pada submit pertama (`QUIZ_COMPLETION_MIN_PERCENT=0`). Level mengikuti `data.ts` frontend (Pemula…Bintang Deen), bukan contoh nama di README.
5. **Leaderboard**: urut points ↓, xp ↓, updatedAt ↑, userId ↑ via field `sortKey` terdenormalisasi (satu `orderBy`, rank via `count()`).
6. **Admin hanya melihat room/santri miliknya**; parent hanya anak berstatus ACTIVE. Tautan parent→anak: parent mengajukan (`POST /parent/links`), guru anak menyetujui.
7. **AI**: Domain Guard & Injection Guard deterministik → router niat → RAG (knowledge fitur Deen + materi course yang boleh dibaca user + dokumen `knowledgeBase` ber-`reviewed:true`) / tool terotorisasi → LLM → output guard. LLM hanya dipanggil bila ada konteks tervalidasi; materi keagamaan **tanpa sumber Deen tidak dijawab** (disarankan bertanya ke ustadz). Isi kuis tidak diindeks untuk santri. Provider: `anthropic`, `openai` (OpenAI-compatible via `AI_BASE_URL`), atau `local` (tanpa LLM, default).
8. Spec `04-API-SPEC.yaml` bagian AI masih bekas proyek donasi; implementasi mengikuti `05B`. Chat lama `/chat/*` **tidak** dibuat (05B: satu kontrak).

## Batasan yang perlu kamu tahu

- **Belum diuji terhadap Firestore sungguhan/emulator** (sandbox tanpa akses unduh emulator). Teruji: logika murni (gamifikasi, kuis, guard, retriever, intent), wrapper HTTP/RBAC/validasi, token, alur chat (Firestore di-mock), `tsc`, `next build`, dan smoke test server. Query/transaksi Firestore belum dieksekusi → jalankan `npm run seed` lalu coba alurnya; pesan error indeks Firestore akan memberi tautan pembuatan indeks bila ada yang terlewat.
- Rate limit **in-memory per instance** (ganti store Redis bila multi-instance). Paginasi pakai offset (cukup untuk skala TPA).
- Retrieval RAG leksikal (bukan vektor); `AIProvider` & `search()` bisa diganti embedding kelak. Ringkasan percakapan heuristik, bukan LLM.
- Belum ada: endpoint Maps, upload file (metadata), CRUD `knowledgeBase` (isi lewat konsol Firestore), UI chatbot, forgot-password.

## Tindak lanjut di frontend (tidak saya ubah)

- `RegisterPage` masih TODO (belum memanggil `/auth/register`).
- Tambah interceptor 401 → `/auth/refresh` di `services/api.ts` (atau naikkan `ACCESS_TOKEN_TTL_MIN`).
- Halaman konten/kuis & chatbot belum ada; kontrak submit & `/ai/chat` ada di kode (`learning.service.ts`, `orchestrator.ts`).
