import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { UserIcon } from "../components/ui/FormIcons";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../lib/validation/authSchemas";
import { authService } from "../services/authService";
import { errorMessage } from "../services/api";
import heroLogin from "../assets/herologin.jpg";

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [demoLink, setDemoLink] = useState<string | null>(null);
  const forgot = useMutation({ mutationFn: authService.forgotPassword });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { identifier: "" } });

  async function onSubmit(values: ForgotPasswordFormValues) {
    const res = await forgot.mutateAsync({ identifier: values.identifier.trim() });
    setSentTo(values.identifier.trim());
    // Mode demo (tanpa backend/email): tampilkan tautan agar alurnya bisa dicoba.
    if (res.demoResetLink) setDemoLink(res.demoResetLink);
  }

  return (
    <AuthLayout
      title="Lupa password?"
      subtitle="Tenang, masukkan username atau email-mu. Kami kirim tautan untuk membuat password baru."
      imageSrc={heroLogin}
      imageAlt="Santri Bermain dan Belajar Bersama"
      imageHeadline="Password lupa? Gampang diatasi."
      imageCaption="Buat password baru dalam beberapa langkah, lalu lanjut belajar lagi."
      imagePosition="right"
      footer={
        <p>
          Sudah ingat?{" "}
          <Link to="/login" className="font-bold text-brand-purple-fg hover:underline">
            Kembali masuk
          </Link>
        </p>
      }
    >
      {sentTo ? (
        <div role="status" className="flex flex-col gap-4">
          <div className="rounded-2xl border-2 border-brand-purple/20 bg-brand-purple/5 p-4 text-sm text-brand-ink/80">
            <p className="font-display font-extrabold text-brand-ink">Permintaan diterima</p>
            <p className="mt-1">
              Jika akun <strong>{sentTo}</strong> punya email terdaftar, tautan reset password sudah dikirim. Cek kotak masuk dan folder spam.
              Tautan berlaku 30 menit dan hanya bisa dipakai sekali.
            </p>
            <p className="mt-2 text-brand-ink/60">
              Akun tanpa email tidak bisa dikirimi tautan. Minta bantuan gurumu atau admin Deen.
            </p>
          </div>
          {demoLink && (
            <p className="rounded-2xl border-2 border-dashed border-brand-purple/30 p-3 text-xs text-brand-ink/70">
              <strong>Mode demo:</strong> email tidak dikirim.{" "}
              <Link to={demoLink} className="font-bold text-brand-purple-fg hover:underline">Buka tautan reset</Link>
            </p>
          )}
          <Button variant="outline" fullWidth onClick={() => { setSentTo(null); setDemoLink(null); }}>
            Kirim ulang ke username/email lain
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <Input
            label="Username atau email"
            placeholder="Masukkan username atau email"
            autoComplete="username"
            icon={<UserIcon className="h-5 w-5" />}
            error={errors.identifier?.message}
            {...register("identifier")}
          />
          {forgot.isError && (
            <p role="alert" className="text-sm font-bold text-red-600">{errorMessage(forgot.error)}</p>
          )}
          <Button type="submit" size="lg" isLoading={forgot.isPending} fullWidth>
            Kirim tautan reset
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPasswordPage;
