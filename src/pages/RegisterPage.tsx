import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { RegisterForm } from "../features/auth/RegisterForm";
import type { RegisterFormValues } from "../lib/validation/authSchemas";
import type { RegisterRequest } from "../types/auth";
import heroRegister from "../assets/heroregister1.jpg";

export default function RegisterPage() {
  const navigate = useNavigate();

  // TODO: replace with the real auth mutation from `features/auth`
  // (POST /auth/register via the shared `api` client). Map a 409 response
  // to a user-facing "username/email sudah dipakai" message.
  async function handleRegister(values: RegisterFormValues) {
    const payload: RegisterRequest = {
      name: values.name,
      username: values.username,
      email: values.email || undefined,
      password: values.password,
      role: values.role,
    };
    await new Promise((resolve) => setTimeout(resolve, 900));
    console.log("register payload", payload);
    navigate("/login");
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
          <Link to="/login" className="font-bold text-brand-purple hover:underline">
            Masuk di sini
          </Link>
        </>
      }
    >
      <RegisterForm onSubmit={handleRegister} />
    </AuthLayout>
  );
}
