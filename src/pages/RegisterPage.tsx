import { Link, Navigate, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { RegisterForm } from "../features/auth/RegisterForm";
import { homePathFor, useMe, useRegister } from "../features/auth/useAuth";
import type { RegisterFormValues } from "../lib/validation/authSchemas";
import type { RegisterRequest } from "../types/auth";
import heroRegister from "../assets/heroregister1.jpg";

export function RegisterPage() {
  const navigate = useNavigate();
  const me = useMe();
  const register = useRegister();

  // Sudah punya sesi valid → tidak perlu daftar lagi
  if (me.data) return <Navigate to={homePathFor(me.data.role)} replace />;

  async function handleRegister(values: RegisterFormValues) {
    const payload: RegisterRequest = {
      name: values.name,
      username: values.username,
      email: values.email || undefined,
      password: values.password,
      role: values.role,
    };
    // Error 409/422 dilempar sebagai ApiError; RegisterForm memetakannya ke field yang bersangkutan.
    const res = await register.mutateAsync(payload);
    navigate(homePathFor(res.user.role), { replace: true });
  }

  return (
    <AuthLayout
      title="Buat akun Deen"
      subtitle="Gratis, dan cuma butuh semenit."
      imageSrc={heroRegister}
      imageAlt="Santri Belajar Mengaji dengan Gembira"
      imageHeadline="Setiap Ayat yang dipelajari adalah satu langkah naik level dan lebih baik"
      imageCaption="Gabung bareng ribuan santri lain yang udah mulai perjalanan belajarnya di Deen."
      imagePosition="left"
      footer={
        <>
          Sudah punya akun?{" "}
          <Link to="/login" className="font-bold text-brand-purple-fg hover:underline">
            Masuk di sini
          </Link>
        </>
      }
    >
      <RegisterForm onSubmit={handleRegister} />
    </AuthLayout>
  );
}

export default RegisterPage;
