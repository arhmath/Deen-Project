import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { RegisterForm } from "../features/auth/RegisterForm";
import type { RegisterFormValues } from "../lib/validation/authSchemas";
import type { RegisterRequest } from "../types/auth";

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
