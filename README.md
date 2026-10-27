# Deen Backend

Backend API untuk **Deen**, aplikasi pembelajaran Islam bagi santri TPA dengan pendekatan gamifikasi. Backend ini menangani autentikasi, aktivitas belajar, progres pembelajaran, XP dan level, room belajar, leaderboard, relasi orang tua–santri, notifikasi, serta asisten AI Deen.

Repository ini menggunakan branch `backend` dan dibangun menggunakan Next.js, TypeScript, serta Firebase Cloud Firestore.

## ✨ Fitur Utama

- **Authentication & Authorization** — registrasi, login, logout, refresh token, dan pengelolaan profil pengguna.
- **Learning Management** — pengelolaan kursus, modul, konten pembelajaran, dan pengumpulan jawaban.
- **Gamification** — XP, level, streak, check-in harian, reward, dan leaderboard.
- **Learning Rooms** — pembuatan room belajar, bergabung ke room, dan pengelolaan anggota.
- **Student Dashboard** — ringkasan aktivitas dan progres belajar santri.
- **Parent Monitoring** — pemantauan progres santri oleh orang tua yang telah terhubung.
- **Teacher & Admin** — pengelolaan data santri serta relasi orang tua–santri.
- **Notifications** — pengelolaan notifikasi dan status baca.
- **AI Assistant** — asisten percakapan dengan intent routing, knowledge retrieval, guard keselamatan, dan dukungan provider LLM opsional.
- **Email & Profile Media** — dukungan pengiriman email dan pengelolaan gambar profil melalui layanan eksternal.
- **Testing & Validation** — pengujian otomatis dengan Vitest dan pemeriksaan tipe TypeScript.

## 🛠️ Tech Stack

| Teknologi | Fungsi |
|---|---|
| Next.js | Framework backend dan API Route Handlers |
| TypeScript | Bahasa pemrograman utama |
| Firebase Admin SDK | Integrasi layanan Firebase dari server |
| Cloud Firestore | Database NoSQL |
| JWT (`jose`) | Autentikasi berbasis token |
| `bcryptjs` | Hashing kata sandi |
| Zod | Validasi data |
| Vitest | Pengujian otomatis |
| Nodemailer | Pengiriman email |
| Cloudinary | Pengelolaan media profil |
| AI provider | Integrasi model AI opsional |

## 📁 Struktur Direktori

```text
.
├── apps/
│   └── api/
│       ├── .env.example
│       ├── README.md
│       ├── firebase.json
│       ├── firestore.rules
│       └── firestore.indexes.json
├── data/
│   └── knowledge.json
├── scripts/
│   ├── seed.ts
│   ├── seed-admin.ts
│   ├── seed-knowledge.ts
│   ├── smoke.ts
│   └── verify-mail.ts
├── src/
│   ├── ai/
│   ├── app/
│   │   └── api/
│   ├── config/
│   ├── lib/
│   ├── modules/
│   ├── shared/
│   └── proxy.ts
├── tests/
├── package.json
├── package-lock.json
├── tsconfig.json
└── vitest.config.ts
```

**Penjelasan singkat:**

- `apps/api/` — konfigurasi API, Firebase, Firestore rules, indeks, dan environment.
- `src/ai/` — orkestrasi chatbot, prompt, intent detection, guard, dan knowledge retrieval.
- `src/app/api/` — endpoint API berbasis Next.js Route Handlers.
- `src/modules/` — modul fungsional aplikasi, seperti autentikasi, kursus, gamifikasi, progres, dan notifikasi.
- `src/shared/` — komponen bersama, tipe data, dan definisi koleksi.
- `data/` — data knowledge awal untuk asisten AI.
- `scripts/` — utilitas seed data, smoke test, dan verifikasi email.
- `tests/` — pengujian otomatis.

## 🚀 Instalasi dan Menjalankan Backend

### 1. Persyaratan

Pastikan perangkat telah memiliki:

- Node.js dan npm.
- Git.
- Project Firebase dengan Cloud Firestore, atau Firestore Emulator untuk pengembangan lokal.

### 2. Clone repository

```bash
git clone https://github.com/arhmath/Deen-Project.git
cd Deen-Project
git switch backend
```

### 3. Instal dependensi

```bash
npm install
```

### 4. Konfigurasi environment

Salin template environment:

```bash
cp apps/api/.env.example apps/api/.env
```

Buka `apps/api/.env`, kemudian sesuaikan nilai konfigurasinya.

```env
NODE_ENV=development
APP_TIMEZONE=Asia/Jakarta
CORS_ORIGIN=http://localhost:5173

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

AI_PROVIDER=local
AI_API_KEY=
AI_MODEL=
AI_BASE_URL=
```

Variabel di atas merupakan contoh variabel utama. Gunakan file `.env.example` untuk melihat seluruh konfigurasi yang tersedia, termasuk SMTP, Cloudinary, dan parameter AI.

Buat secret JWT menggunakan:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Gunakan hasil yang berbeda untuk `JWT_ACCESS_SECRET` dan `JWT_REFRESH_SECRET`.

**Penting:** Jangan memasukkan secret, private key Firebase, atau API key ke dalam source code maupun commit Git.

### 5. Siapkan Firebase

1. Buat project di Firebase Console.
2. Aktifkan Cloud Firestore.
3. Siapkan service account untuk backend.
4. Isi `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, dan `FIREBASE_PRIVATE_KEY`.
5. Tinjau `apps/api/firestore.rules` dan `apps/api/firestore.indexes.json` sebelum deployment.

Untuk pengembangan lokal, Firestore Emulator juga dapat digunakan melalui konfigurasi `FIRESTORE_EMULATOR_HOST`.

### 6. Jalankan server

```bash
npm run dev
```

Berdasarkan script root, server development berjalan pada:

`http://localhost:3001`

Prefix API:

`http://localhost:3001/api/v1`

Endpoint health check dan readiness tersedia di `/api/health` dan `/api/ready`.

## ⚙️ Perintah yang Tersedia

Jalankan perintah berikut dari root repository.

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan server development |
| `npm run build` | Membuat build production |
| `npm run start` | Menjalankan server production |
| `npm test` | Menjalankan pengujian Vitest |
| `npm run typecheck` | Memeriksa tipe TypeScript |
| `npm run seed` | Mengisi data awal/demo |
| `npm run smoke` | Menjalankan smoke test |
| `npm run seed:knowledge` | Mengisi knowledge base |
| `npm run mail:verify` | Memverifikasi konfigurasi email |

Sebelum menjalankan seed atau smoke test, periksa environment dan pastikan layanan yang diperlukan tersedia. Jangan menjalankan seed pada database production tanpa memahami data yang akan ditulis.

## 🔌 Ringkasan Endpoint API

Endpoint menggunakan prefix `/api/v1`.

| Modul | Endpoint utama |
|---|---|
| Authentication | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` |
| User Profile | `/users/me` |
| Student Dashboard | `/me/dashboard` |
| Check-in | `/me/check-ins` |
| Courses | `/me/courses`, `/courses` |
| Course Modules | `/courses/:id/modules` |
| Learning Contents | `/modules/:id/contents`, `/contents/:id/submit` |
| Gamification | `/gamification/me`, `/gamification/me/history` |
| Progress | `/progress/me`, `/progress/courses/:id` |
| Rooms | `/rooms`, `/rooms/join`, `/rooms/:id` |
| Room Members | `/rooms/:id/members` |
| Leaderboard | `/leaderboard`, `/leaderboards/global`, `/leaderboards/rooms/:id` |
| Admin | `/admin/overview`, `/admin/students` |
| Parent Monitoring | `/parent/students`, `/parent/links` |
| Notifications | `/notifications`, `/notifications/:id/read` |
| AI Assistant | `/ai/chat`, `/ai/conversations`, `/ai/messages/:id/feedback` |
| Health Check | `/api/health`, `/api/ready` |

Tabel ini merupakan ringkasan endpoint utama, bukan spesifikasi lengkap setiap request dan response. Untuk implementasi detail, periksa Route Handlers di `src/app/api/` serta dokumentasi API pada `apps/api/README.md`.

## 🤖 AI Assistant — Ziya

Asisten percakapan Deen menggunakan nama **Ziya** pada pengalaman pengguna. Backend menyediakan alur pemrosesan pertanyaan yang menggabungkan validasi input, pemeriksaan domain, intent routing, knowledge retrieval, dan provider AI yang dapat dikonfigurasi.

Alur pemrosesan secara umum:

1. **Input validation** — memvalidasi pesan pengguna.
2. **Guard checks** — memeriksa batasan domain dan indikasi prompt injection.
3. **Intent routing** — menentukan kategori atau maksud pertanyaan.
4. **Knowledge retrieval** — mencari informasi yang relevan dari knowledge base Deen dan materi yang diizinkan.
5. **Response generation** — menghasilkan jawaban dari knowledge yang tersedia atau menggunakan provider LLM jika dikonfigurasi dan diperlukan.
6. **Output checks** — memeriksa hasil sebelum mengirimkan jawaban kepada pengguna.

### Provider AI

Konfigurasi provider dilakukan melalui `apps/api/.env`.

| Provider | Keterangan |
|---|---|
| `local` | Mode tanpa LLM eksternal, menggunakan knowledge dan logika lokal |
| `openai` | Provider OpenAI atau endpoint yang kompatibel |
| `anthropic` | Provider Anthropic |

Contoh konfigurasi mode lokal:

```env
AI_PROVIDER=local
```

Mode lokal tidak memerlukan API key LLM, tetapi kualitas jawaban tetap bergantung pada cakupan knowledge dan aturan yang diimplementasikan.

Untuk menggunakan provider eksternal, sesuaikan `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`, dan variabel lain yang relevan. Restart server setelah mengubah environment.

**Catatan:** Asisten hanya dapat memberikan jawaban yang sesuai dengan informasi dan sumber yang tersedia. Knowledge base materi keagamaan harus menggunakan sumber yang telah ditinjau dan diverifikasi.

## 🧪 Pengujian

Jalankan pemeriksaan berikut sebelum mengirim perubahan:

```bash
npm test
npm run typecheck
npm run build
```

Smoke test dapat dijalankan dengan:

```bash
npm run smoke
```

Pengujian otomatis tidak selalu menjamin integrasi dengan Firebase production berjalan benar. Lakukan pengujian tambahan untuk autentikasi, rules, indeks Firestore, hak akses berdasarkan role, dan alur frontend.

## 🔗 Integrasi Frontend

Untuk pengembangan frontend lokal, sesuaikan konfigurasi environment frontend dengan alamat backend.

```env
VITE_USE_MOCK=false
VITE_API_URL=http://localhost:3001/api/v1
```

Pastikan `CORS_ORIGIN` pada backend mengizinkan origin frontend yang digunakan. Jangan menganggap seluruh origin aman untuk diizinkan.

## 🔐 Keamanan

- Simpan kredensial di environment server.
- Gunakan secret JWT acak dan berbeda untuk access token serta refresh token.
- Terapkan kontrol akses berdasarkan role dan kepemilikan data.
- Jangan mengekspos Firebase service account kepada frontend.
- Tinjau Firestore rules dan indexes sebelum deployment.
- Gunakan knowledge base yang telah diverifikasi untuk materi keagamaan.
- Evaluasi rate limiting, logging, dan penanganan error sebelum digunakan secara luas.

## 📚 Dokumentasi

- [Repository Deen-Project](https://github.com/arhmath/Deen-Project)
- [Branch Backend](https://github.com/arhmath/Deen-Project/tree/backend)
- [README API](apps/api/README.md)
- [Environment Template](apps/api/.env.example)
- [Firestore Rules](apps/api/firestore.rules)
- [Firestore Indexes](apps/api/firestore.indexes.json)

---

**Deen** — Ubah rasa bosan jadi semangat belajar, setiap hari.
