import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { LoginForm } from "../features/auth/LoginForm";
import type { LoginFormValues } from "../lib/validation/authSchemas";
import heroLogin from "../assets/herologin.jpg";

export default function LoginPage() {
  const navigate = useNavigate();

  // TODO: replace with the real auth mutation from `features/auth`
  // (POST /auth/login via the shared `api` client + TanStack Query),
  // store the access/refresh token via the auth store, then redirect
  // based on role (SANTRI/PARENT/ADMIN) per 06-FRONTEND-ARCHITECTURE.md.
  async function handleLogin(values: LoginFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    console.log("login payload", values);
    navigate("/dashboard");
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
          Belum punya akun?{" "}
          <Link to="/register" className="font-bold text-brand-purple hover:underline">
            Daftar di sini
          </Link>
        </>
      }
    >
      <LoginForm onSubmit={handleLogin} />
    </AuthLayout>
  );
}
