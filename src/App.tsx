import { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { SmoothScroll } from "./components/ui/SmoothScroll";
import LandingPage from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Skeleton } from "./components/ui/Skeleton";

// Halaman dashboard di-lazy-load supaya bundle landing page tetap ringan.
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const LearningPage = lazy(() => import("./pages/LearningPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoonPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminMonitoring = lazy(() => import("./pages/admin/AdminMonitoring"));
const ParentStudentsPage = lazy(() => import("./pages/parent/ParentStudentsPage"));
const ParentStudentDetail = lazy(() => import("./pages/parent/ParentStudentDetail"));

const soon = (title: string, description: string) => <ComingSoonPage title={title} description={description} />;

function PageFallback() {
  return <div aria-busy="true" aria-label="Memuat halaman"><Skeleton className="mb-4 h-10 w-64" /><Skeleton className="h-64 rounded-3xl" /></div>;
}

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-brand-cream p-6 text-center">
      <div>
        <h1 className="font-display text-4xl font-extrabold text-brand-ink">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-brand-ink/60">Alamatnya mungkin salah atau halamannya sudah dipindah.</p>
        <Link to="/" className="mt-6 inline-flex rounded-2xl bg-brand-purple px-6 py-3 font-display font-semibold text-white shadow-[0_5px_0_0_#5B1FB0]">Ke beranda</Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-cream p-6"><PageFallback /></div>}>
      <Routes>
        <Route path="/" element={<SmoothScroll><LandingPage /></SmoothScroll>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Area terautentikasi */}
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/chat" element={soon("Chatbot", "Tanya jawab seputar materi bersama asisten Deen akan hadir di sini.")} />

            <Route element={<RequireAuth roles={["SANTRI", "ADMIN"]} />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route element={<RequireAuth roles={["SANTRI"]} />}>
              <Route path="/maps" element={soon("Maps", "Peta TPA, masjid, dan tempat belajar di sekitarmu akan hadir di sini.")} />
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/learning/:courseId" element={soon("Detail course", "Daftar modul dan materi course akan tampil di sini.")} />
              <Route path="/learning/:courseId/content/:contentId" element={soon("Materi", "Pelajaran, kuis, dan kartu belajar akan dibuka di sini.")} />
            </Route>

            <Route element={<RequireAuth roles={["PARENT"]} />}>
              <Route path="/parent" element={<ParentStudentsPage />} />
              <Route path="/parent/students/:studentId" element={<ParentStudentDetail />} />
            </Route>

            <Route element={<RequireAuth roles={["ADMIN"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/rooms" element={soon("Rooms", "Buat room, bagikan kode gabung, dan kelola anggota di sini.")} />
              <Route path="/admin/rooms/:roomId" element={soon("Detail room", "Anggota dan course room akan tampil di sini.")} />
              <Route path="/admin/courses" element={soon("Pembelajaran", "Buat course, atur modul, dan publikasikan di sini.")} />
              <Route path="/admin/courses/:courseId" element={soon("Detail course", "Editor modul dan materi akan hadir di sini.")} />
              <Route path="/admin/monitoring" element={<AdminMonitoring />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
