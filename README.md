# Deen — Platform Pembelajaran Islami Interaktif

Deen adalah aplikasi web pembelajaran Islami yang dirancang untuk membantu santri belajar secara terstruktur, membangun kebiasaan belajar, berinteraksi dalam ruang belajar, serta memantau perkembangan pembelajaran. Proyek ini menggabungkan frontend React dengan backend API berbasis Next.js, penyimpanan data Firestore, dan asisten AI yang dapat menggunakan knowledge base serta materi kursus yang diizinkan.

> **Status proyek:** repository pengembangan. Sebelum digunakan untuk produksi, lakukan audit keamanan, uji alur pengguna secara menyeluruh, dan siapkan konfigurasi Firebase, autentikasi, AI, serta deployment sesuai lingkungan Anda.

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Arsitektur](#arsitektur)
- [Struktur Direktori](#struktur-direktori)
- [Persyaratan](#persyaratan)
- [Menjalankan di Lokal](#menjalankan-di-lokal)
- [Mode Mock dan Backend](#mode-mock-dan-backend)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Data Demo](#data-demo)
- [API](#api)
- [AI Assistant](#ai-assistant)
- [Pengujian dan Pemeriksaan](#pengujian-dan-pemeriksaan)
- [Keamanan](#keamanan)
- [Troubleshooting](#troubleshooting)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

## Fitur Utama

### Untuk santri
- Dashboard untuk melihat ringkasan aktivitas dan progres belajar.
- Katalog kursus, modul, materi, dan aktivitas pembelajaran.
- Pengumpulan/penyelesaian konten dan pengerjaan kuis.
- Check-in belajar serta sistem gamifikasi berbasis XP/poin, level, streak, dan riwayat reward.
- Leaderboard global maupun berdasarkan ruang belajar.
- Ruang belajar yang dapat diikuti menggunakan kode gabung.
- Chat dan asisten AI.
- Profil pengguna dan halaman peta/fitur petualangan yang tersedia pada aplikasi.

### Untuk guru/admin
- Dashboard ringkasan dan pemantauan santri.
- Pengelolaan ruang belajar dan anggota ruang.
- Pengelolaan kursus serta konten pembelajaran.
- Monitoring data santri dan pengelolaan permintaan tautan orang tua–santri.

### Untuk orang tua
- Melihat daftar santri yang terhubung.
- Membuka detail santri dan memantau progres pembelajaran.
- Mengajukan tautan orang tua–santri untuk persetujuan guru yang berwenang.

### Asisten AI
- Endpoint percakapan dan riwayat percakapan.
- Umpan balik terhadap pesan AI.
- Domain guard dan prompt-injection guard.
- Retrieval-Augmented Generation (RAG) untuk knowledge base Deen dan materi kursus yang dapat diakses pengguna.
- Provider `local` untuk jawaban berbasis knowledge base tanpa layanan LLM eksternal; provider `openai` (termasuk endpoint OpenAI-compatible) dan `anthropic` tersedia melalui konfigurasi.

> Ketersediaan setiap fitur bergantung pada konfigurasi, data, role pengguna, dan integrasi backend yang aktif. Mode mock ditujukan untuk demo/pengembangan, bukan penyimpanan produksi.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | React, TypeScript, Vite |
| Routing | React Router |
| Styling | Tailwind CSS v4 |
| Animasi | GSAP, Framer Motion |
| Form & validasi | React Hook Form, Zod |
| Data fetching | TanStack Query |
| Backend API | Next.js Route Handlers, TypeScript |
| Database | Firebase Admin SDK + Cloud Firestore |
| Autentikasi API | JWT (HS256), bcrypt |
| AI | Provider lokal berbasis knowledge, OpenAI-compatible, atau Anthropic |
| Testing backend | Vitest |

## Arsitektur

```text
Browser
  |
  v
Frontend React + Vite (default: http://localhost:5173)
  |
  | VITE_USE_MOCK=true (default)
  +--------------------------> Mock API lokal untuk demo
  |
  | VITE_USE_MOCK=false
  v
Backend Next.js Route Handlers (default: http://localhost:3001)
  |
  +--> autentikasi JWT + bcrypt
  +--> service/domain logic
  +--> Firebase Admin SDK
  |      +--> Cloud Firestore
  |
  +--> AI orchestrator
         +--> domain & injection guards
         +--> intent routing
         +--> retrieval / knowledge base
         +--> provider AI yang dipilih
```

Frontend memakai satu pintu request di `src/services/api.ts`. Secara default, request diarahkan ke mock server lokal. Untuk memakai API sungguhan, ubah `VITE_USE_MOCK=false` dan atur `VITE_API_URL`.

Backend menggunakan Firestore melalui Firebase Admin SDK; browser tidak seharusnya mengakses koleksi database secara langsung. File `backend/apps/api/firestore.rules` dan `firestore.indexes.json` disediakan untuk konfigurasi aturan dan indeks Firestore.

## Struktur Direktori

```text
.
├── public/                         # Aset publik frontend
├── src/
│   ├── app/                        # Provider aplikasi
│   ├── components/                 # UI, layout, landing page, komponen domain
│   ├── features/                   # Fitur auth, learning, chatbot, gamification, rooms, dll.
│   ├── pages/                      # Halaman user, admin, parent, dan pembelajaran
│   ├── services/                   # API client, service fitur, mock server/data
│   └── lib/                        # Utilitas dan validasi
├── backend/
│   ├── package.json                # Script backend
│   ├── scripts/                    # Seed, smoke test, dan utilitas
│   └── apps/api/
│       ├── src/app/api/            # Next.js Route Handlers
│       ├── src/ai/                 # Guard, prompt, retrieval, tools, orchestrator
│       ├── src/shared/              # Shared constants/types/data helpers
│       ├── tests/                  # Unit/integration tests backend
│       ├── data/                   # Knowledge data
│       ├── .env.example             # Template environment backend
│       ├── firestore.rules
│       └── firestore.indexes.json
├── package.json                    # Script dan dependensi frontend
└── README.md
```

## Persyaratan

- Node.js versi yang kompatibel dengan Vite 8 dan Next.js 16 (disarankan **Node.js 22 LTS** yang masih didukung).
- npm.
- Firebase project dengan Cloud Firestore untuk menjalankan backend menggunakan database cloud, **atau** Firestore Emulator untuk pengembangan lokal.
- API key provider AI hanya jika ingin memakai provider LLM eksternal. Provider `local` dapat digunakan tanpa API key.

Periksa instalasi:

```bash
node --version
npm --version
```

## Menjalankan di Lokal

Buka terminal di direktori repository.

### 1. Jalankan frontend

```bash
npm install
cp .env.example .env
npm run dev
```

Jika file `.env.example` belum tersedia di root, buat `.env` sendiri dengan isi:

```dotenv
VITE_USE_MOCK=true
VITE_API_URL=http://localhost:3001/api/v1
```

Buka URL yang ditampilkan Vite, umumnya `http://localhost:5173`.

Pada Windows PowerShell, jika perintah `cp` tidak tersedia, gunakan:

```powershell
Copy-Item .env.example .env
```

### 2. Jalankan backend API

Buka terminal kedua:

```bash
cd backend
npm install
```

Salin template konfigurasi backend:

```bash
cp apps/api/.env.example apps/api/.env
```

Windows PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Isi setidaknya secret JWT dan konfigurasi Firebase/Firestore Emulator sebelum menjalankan seed atau endpoint yang membutuhkan database.

Buat secret acak yang kuat:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Gunakan nilai acak yang berbeda untuk `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET`, masing-masing minimal 32 karakter.

Jalankan backend:

```bash
npm run dev
```

Backend berjalan pada `http://localhost:3001`. Endpoint pemeriksaan tersedia di:

- `GET http://localhost:3001/api/health`
- `GET http://localhost:3001/api/ready`

`/api/health` digunakan untuk pemeriksaan kesehatan proses; `/api/ready` dapat memeriksa kesiapan dependensi. Hasil akhirnya bergantung pada konfigurasi layanan.

### 3. Hubungkan frontend ke backend

Pada file `.env` di root frontend, atur:

```dotenv
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3001/api/v1
```

Pada `backend/apps/api/.env`, pastikan origin frontend diizinkan:

```dotenv
CORS_ORIGIN=http://localhost:5173
```

Restart frontend setelah mengubah environment variable Vite. Jika ingin kembali ke mode demo, ubah `VITE_USE_MOCK=true`.

## Mode Mock dan Backend

| Mode | Konfigurasi | Perilaku |
|---|---|---|
| Mock (default) | `VITE_USE_MOCK=true` atau tidak disetel | Menggunakan mock server/data frontend; berguna untuk melihat UI dan demo tanpa backend aktif. |
| Backend | `VITE_USE_MOCK=false` | Mengirim request HTTP ke `VITE_API_URL`; backend, database, dan konfigurasi terkait harus siap. |

Mode mock bukan pengganti backend produksi. Data mock dapat bersifat lokal/demo dan tidak merepresentasikan keamanan, konsistensi transaksi, atau persistensi Firestore.

## Konfigurasi Environment

### Frontend — `.env` di root

```dotenv
# true = mock server; false = backend API sungguhan
VITE_USE_MOCK=true
VITE_API_URL=http://localhost:3001/api/v1
```

`VITE_API_URL` boleh dihilangkan jika nilai default pada client sudah sesuai, tetapi sebaiknya disetel eksplisit saat berpindah lingkungan. Semua variabel berawalan `VITE_` dapat masuk ke bundle frontend; **jangan pernah menaruh secret di variabel frontend**.

### Backend — `backend/apps/api/.env`

Salin dari `backend/apps/api/.env.example`.

| Variabel | Keterangan |
|---|---|
| `NODE_ENV` | Lingkungan aplikasi, misalnya `development` atau `production`. |
| `APP_TIMEZONE` | Zona waktu bisnis; default `Asia/Jakarta`. |
| `CORS_ORIGIN` | Daftar origin frontend yang diizinkan, dipisahkan koma. |
| `JWT_ACCESS_SECRET` | Secret penandatanganan access token; wajib kuat dan rahasia. |
| `JWT_REFRESH_SECRET` | Secret refresh token; gunakan nilai berbeda dari access secret. |
| `ACCESS_TOKEN_TTL_MIN` | Masa berlaku access token dalam menit. |
| `REFRESH_TOKEN_TTL_DAYS` | Masa berlaku refresh token dalam hari. |
| `BCRYPT_COST` | Cost factor bcrypt. |
| `FIREBASE_PROJECT_ID` | ID Firebase project. |
| `FIREBASE_CLIENT_EMAIL` | Email service account Firebase. |
| `FIREBASE_PRIVATE_KEY` | Private key service account; format newline harus sesuai petunjuk template. |
| `FIRESTORE_EMULATOR_HOST` | Alternatif untuk menggunakan Firestore Emulator lokal. |
| `AI_PROVIDER` | `local`, `openai`, atau `anthropic`. |
| `AI_API_KEY` | API key provider eksternal, jika diperlukan. |
| `AI_MODEL` | Nama model untuk provider yang dipilih. |
| `AI_BASE_URL` | Base URL untuk provider OpenAI-compatible, jika digunakan. |
| `AI_TIMEOUT_MS` | Batas waktu request AI. |
| `AI_RAG_TOP_K` | Jumlah kandidat dokumen retrieval. |
| `AI_RAG_MIN_SCORE` | Ambang skor retrieval RAG. |
| `AI_MAX_RECENT_MESSAGES` | Batas pesan terbaru yang dimasukkan ke konteks. |
| `AI_MAX_SUMMARY_TOKENS` | Batas token ringkasan percakapan. |

Jangan commit file `.env` atau `backend/apps/api/.env`. Gunakan secret manager pada deployment produksi.

## Data Demo

Backend menyediakan script seed. Setelah environment dan Firestore/Firestore Emulator siap:

```bash
cd backend
npm run seed
```

Terdapat juga script khusus knowledge base dan smoke test:

```bash
npm run seed:knowledge
npm run smoke
```

Periksa isi `backend/scripts/` dan konfigurasi lingkungan sebelum menjalankan script pada database yang berisi data penting. Seed dapat membuat atau mengubah data; gunakan database pengembangan.

Akun demo yang disebut pada dokumentasi backend adalah `ahmad`, `rahma`, dan `hakim` dengan password awal `deen1234`. Gunakan hanya untuk lingkungan demo lokal. Ubah atau hapus kredensial tersebut sebelum deployment publik dan jangan gunakan password demo untuk akun nyata.

## API

Base URL lokal:

```text
http://localhost:3001/api/v1
```

Endpoint utama dikelompokkan sebagai berikut. Parameter dinamis ditulis sebagai `:id`.

| Area | Endpoint |
|---|---|
| Auth & pengguna | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `GET /users/me`, `PATCH /users/me` |
| Dashboard & progres | `GET /me/dashboard`, `GET /progress/me`, `GET /progress/courses/:courseId`, `GET /me/courses`, `GET /me/courses/:courseId` |
| Check-in & gamifikasi | `POST /me/check-ins`, `GET /gamification/me`, `GET /gamification/me/history`, `POST /checkins`, `GET /checkins` |
| Kursus & modul | `GET/POST /courses`, `GET/PATCH/DELETE /courses/:courseId`, `GET/POST /courses/:courseId/modules`, `PATCH/DELETE /modules/:moduleId` |
| Konten & kuis | `GET/POST /modules/:moduleId/contents`, `GET/PATCH/DELETE /contents/:contentId`, `POST /contents/:contentId/submit`, endpoint attempt kuis di `/me/quizzes/...` dan `/me/quiz-attempts/...` |
| Ruang belajar | `GET/POST /rooms`, `POST /rooms/join`, `GET/PATCH/DELETE /rooms/:roomId`, `GET /rooms/:roomId/members`, endpoint pengelolaan anggota di `/rooms/:roomId/members/:userId` |
| Leaderboard | `GET /leaderboard`, `GET /leaderboards/global`, `GET /leaderboards/global/me`, `GET /leaderboards/rooms/:roomId` |
| Admin | `GET /admin/overview`, `GET /admin/students`, endpoint `/admin/rooms`, `/admin/courses`, dan `/admin/parent-links` |
| Orang tua | `GET /parent/students`, `GET /parent/students/:studentId`, `GET /parent/students/:studentId/progress`, `POST /parent/links` |
| Notifikasi | `GET /notifications`, `POST /notifications/:notificationId/read` |
| AI | `POST /ai/chat`, `GET /ai/conversations`, `GET/DELETE /ai/conversations/:id`, `POST /ai/messages/:id/feedback` |

Daftar di atas merupakan ringkasan endpoint inti, bukan pengganti kontrak API lengkap. Periksa route handlers di `backend/apps/api/src/app/api/` dan spesifikasi yang disimpan di repository untuk detail request/response, validasi, status code, dan izin role.

Respons error umum menggunakan status HTTP yang sesuai dan payload berisi pesan/kode error; validasi input umumnya mengembalikan `422`. Endpoint AI memiliki format error tersendiri. Selalu ikuti respons aktual dari backend saat mengembangkan client.

## AI Assistant

Implementasi AI berada di `backend/apps/api/src/ai/`. Bagian penting meliputi:

- `guards.ts` — pemeriksaan domain dan prompt injection.
- `intent.ts` — klasifikasi/routing niat pengguna.
- `knowledge.ts`, `retriever.ts`, `course-knowledge.ts` — sumber pengetahuan dan retrieval.
- `prompt.ts` — penyusunan instruksi sistem.
- `providers.ts` — adapter provider model.
- `tools.ts` — tool yang dapat digunakan orkestrator.
- `orchestrator.ts` — mengatur alur jawaban AI.
- `conversation.ts` dan `chat.schema.ts` — dukungan percakapan serta validasi skema.

Provider `local` membantu menjalankan alur knowledge-based tanpa API LLM eksternal, tetapi kemampuannya tidak setara model generatif. Untuk provider eksternal, isi `AI_PROVIDER`, `AI_API_KEY`, dan `AI_MODEL` sesuai provider yang digunakan. `AI_BASE_URL` dipakai bila menggunakan endpoint OpenAI-compatible.

Guard berbasis kode membantu membatasi input dan alur, tetapi tidak menjamin seluruh serangan prompt injection atau keluaran yang keliru dapat dicegah. Lakukan pengujian adversarial, batasi tool dan data berdasarkan otorisasi server, serta jangan gunakan jawaban AI sebagai satu-satunya dasar keputusan berisiko tinggi.

## Pengujian dan Pemeriksaan

Frontend:

```bash
npm run build
npm run lint
```

Backend:

```bash
cd backend
npm test
npm run typecheck
npm run smoke
```

- `build` memeriksa TypeScript dan membangun aset frontend.
- `lint` menjalankan ESLint.
- `test` menjalankan suite Vitest backend.
- `typecheck` memeriksa tipe TypeScript backend.
- `smoke` menjalankan pemeriksaan alur backend yang disediakan project dan membutuhkan environment yang sesuai.

Pastikan layanan dan emulator yang diperlukan aktif sebelum menjalankan tes integrasi/smoke. Jangan menganggap seluruh fitur siap produksi hanya karena build atau unit test berhasil.

## Keamanan

Sebelum repository dipublikasikan atau aplikasi di-deploy:

1. **Pastikan `.env` tidak ikut Git.** Arsip pengembangan dapat berisi file `.env`; periksa `git status` dan `.gitignore` sebelum melakukan commit. Jika secret pernah terunggah, cabut/rotasi secret tersebut—menghapus file dari commit terbaru saja tidak menghapus riwayat Git.
2. Rotasi semua kredensial yang pernah masuk ke ZIP, screenshot, log, atau commit, termasuk Firebase service-account key, JWT secrets, dan API key AI.
3. Jangan gunakan akun demo atau password bawaan di lingkungan publik.
4. Terapkan Firestore Security Rules yang sesuai dan deploy indeks yang dibutuhkan. Akses database dari backend dengan service account; jangan pernah mengirim private key ke browser.
5. Verifikasi otorisasi berdasarkan role dan kepemilikan data pada setiap endpoint, bukan hanya dengan menyembunyikan halaman di frontend.
6. Pastikan CORS hanya mengizinkan origin tepercaya. CORS bukan mekanisme autentikasi.
7. Tambahkan rate limiting, logging yang tidak menyimpan token/rahasia, monitoring, backup, dan kebijakan retensi data.
8. Tinjau privasi percakapan AI, data anak/santri, notifikasi, serta hubungan orang tua–santri sebelum penggunaan nyata.
9. Uji rotasi refresh token, logout, token kedaluwarsa, akses lintas role, validasi input, dan prompt injection.
10. Atur TTL untuk koleksi yang memang memiliki field kedaluwarsa, sesuai kebutuhan operasional dan konfigurasi Firestore.

## Troubleshooting

### Frontend tidak terhubung ke API
- Pastikan backend aktif pada port `3001`.
- Periksa `VITE_USE_MOCK=false` dan `VITE_API_URL=http://localhost:3001/api/v1`.
- Pastikan `CORS_ORIGIN` memuat origin frontend, biasanya `http://localhost:5173`.
- Restart Vite setelah mengubah `.env`.

### API gagal berjalan
- Pastikan `backend/apps/api/.env` tersedia dan format nilainya benar.
- Pastikan `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET` terisi.
- Pastikan Firebase service-account lengkap atau Firestore Emulator aktif dan `FIRESTORE_EMULATOR_HOST` benar.
- Periksa terminal untuk detail error dan pastikan port `3001` tidak digunakan proses lain.

### AI tidak memberi jawaban dari model eksternal
- Periksa `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, dan `AI_BASE_URL`.
- Pastikan model dan base URL sesuai provider.
- Jika `AI_PROVIDER=local`, respons berasal dari mekanisme knowledge lokal dan tidak memerlukan API key model eksternal.

### Seed atau test gagal
- Pastikan command dijalankan dari direktori `backend`.
- Periksa konfigurasi environment dan koneksi Firestore/Emulator.
- Jalankan seed hanya pada database pengembangan dan baca output error lengkap.

## Kontribusi

Kontribusi, perbaikan bug, dan saran fitur sangat terbuka.

1. Fork repository.
2. Buat branch fitur: `git checkout -b feat/nama-fitur`.
3. Lakukan perubahan dengan mengikuti struktur dan pola yang sudah ada.
4. Jalankan pemeriksaan yang relevan (`npm run build`, `npm run lint`, `npm test`, dan `npm run typecheck`).
5. Buat commit yang jelas lalu ajukan Pull Request dengan ringkasan perubahan, alasan, dan langkah pengujian.

Jangan sertakan file `.env`, private key, token, data pribadi, atau dump database dalam Pull Request.

## Lisensi

Lisensi belum dapat dipastikan dari struktur proyek yang dianalisis. Sebelum repository dipublikasikan, tentukan lisensi proyek dan tambahkan file `LICENSE`. Tanpa lisensi eksplisit, hak penggunaan ulang oleh pihak lain tidak otomatis diberikan.
