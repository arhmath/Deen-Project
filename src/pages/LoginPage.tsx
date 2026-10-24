import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { LoginForm } from "../features/auth/LoginForm";
import { homePathFor, useLogin, useMe } from "../features/auth/useAuth";
import type { LoginFormValues } from "../lib/validation/authSchemas";
import { USE_MOCK } from "../services/api";
import { DEMO_PASSWORD } from "../services/mock/data";
import heroLogin from "../assets/herologin.jpg";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const me = useMe();
  const login = useLogin();
  const from = (location.state as { from?: string } | null)?.from;

  // Sudah punya sesi valid → langsung ke beranda role-nya
  if (me.data) return <Navigate to={homePathFor(me.data.role)} replace />;

  async function handleLogin(values: LoginFormValues) {
    const res = await login.mutateAsync({ identifier: values.identifier, password: values.password });
    navigate(from ?? homePathFor(res.user.role), { replace: true });
  }

  return (
    <AuthLayout
      title="Selamat datang kembali!"
      subtitle="Masuk untuk lanjut ke petualangan belajarmu."
      imageSrc={heroLogin}
      imageAlt="Santri Bermain dan Belajar Bersama"
      imageHeadline="Yuk Lanjutin perjalanan ngajimu hari ini!"
      imageCaption="Daily Check-in, XP, dan posisi leaderboard kamu udah nunggu buat di update."
      imagePosition="right"
      footer={
        <>
          <p>
            Belum punya akun?{" "}
            <Link to="/register" className="font-bold text-brand-purple-fg hover:underline">
              Daftar di sini
            </Link>
          </p>
          {USE_MOCK && (
            <div className="mt-5 rounded-2xl border-2 border-dashed border-brand-purple/30 bg-brand-purple/5 p-3 text-left text-xs">
              <p className="font-display font-extrabold text-brand-purple-fg">Akun demo (password: {DEMO_PASSWORD})</p>
              <ul className="mt-1 space-y-0.5 text-brand-ink/70">
                <li><strong>ahmad_santri</strong> — Santri</li>
                <li><strong>bunda_ahmad</strong> — Orang Tua</li>
                <li><strong>ustadz_hakim</strong> — Guru</li>
              </ul>
            </div>
          )}
        </>
      }
    >
      <LoginForm onSubmit={handleLogin} />
    </AuthLayout>
  );
}

export default LoginPage;
