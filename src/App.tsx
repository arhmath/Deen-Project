import { lazy, Suspense } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import LandingPage from "./pages/LandingPage";
import { RequireAuth } from "./features/auth/RequireAuth";
import { Skeleton } from "./components/ui/Skeleton";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardLayout = lazy(() =>
  import("./components/layout/DashboardLayout").then((m) => ({ default: m.DashboardLayout }))
);

// Halaman dashboard di-lazy-load supaya bundle landing page tetap ringan.
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const LearningPage = lazy(() => import("./pages/LearningPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const MapsPage = lazy(() => import("./pages/MapsPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminMonitoring = lazy(() => import("./pages/admin/AdminMonitoring"));
const ParentStudentsPage = lazy(() => import("./pages/parent/ParentStudentsPage"));
const ParentStudentDetail = lazy(() => import("./pages/parent/ParentStudentDetail"));
const CourseDetailPage = lazy(() => import("./pages/learning/CourseDetailPage"));
const ContentPage = lazy(() => import("./pages/learning/ContentPage"));
const AdminRooms = lazy(() => import("./pages/admin/AdminRooms"));
const AdminRoomDetail = lazy(() => import("./pages/admin/AdminRoomDetail"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));
const AdminCourseEditor = lazy(() => import("./pages/admin/AdminCourseEditor"));
const EducatorApplicationPage = lazy(() => import("./pages/EducatorApplicationPage"));
const AdminEducatorApplications = lazy(() => import("./pages/admin/AdminEducatorApplications"));

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

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Start each route at the top instead of preserving the previous page scroll.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search, hash]);

  return null;
}

function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-cream p-6"><PageFallback /></div>}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/daftar-pendidik" element={<EducatorApplicationPage />} />

        {/* Area terautentikasi */}
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/chat" element={<ChatPage />} />

            <Route element={<RequireAuth roles={["SANTRI", "PARENT", "ADMIN", "SUPERADMIN"]} />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            <Route element={<RequireAuth roles={["SANTRI"]} />}>
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/maps" element={<MapsPage />} />
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/learning/:courseId" element={<CourseDetailPage/>} />
              <Route path="/learning/:courseId/content/:contentId" element={<ContentPage />} />
            </Route>

            <Route element={<RequireAuth roles={["PARENT"]} />}>
              <Route path="/parent" element={<ParentStudentsPage />} />
              <Route path="/parent/students/:studentId" element={<ParentStudentDetail />} />
            </Route>

            <Route element={<RequireAuth roles={["ADMIN", "SUPERADMIN"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/rooms" element={<AdminRooms />} />
              <Route path="/admin/rooms/:roomId" element={<AdminRoomDetail />} />
              <Route path="/admin/courses" element={<AdminCourses />} />
              <Route path="/admin/courses/:courseId" element={<AdminCourseEditor />} />
              <Route path="/admin/monitoring" element={<AdminMonitoring />} />
              <Route element={<RequireAuth roles={["SUPERADMIN"]} />}><Route path="/admin/pendaftar-pendidik" element={<AdminEducatorApplications />} /></Route>
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;