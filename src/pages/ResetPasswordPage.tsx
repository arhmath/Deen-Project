import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { ButtonLink } from "../components/ui/ButtonLink";
import { LockIcon, EyeIcon, EyeOffIcon } from "../components/ui/FormIcons";
import { resetPasswordSchema, type ResetPasswordFormValues } from "../lib/validation/authSchemas";
import { authService } from "../services/authService";
import { errorMessage } from "../services/api";
import heroLogin from "../assets/herologin.jpg";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  // Token dibaca sekali dari URL lalu disimpan di state; URL dibersihkan agar tidak tertinggal di riwayat browser.
  const [token] = useState(() => params.get("token") ?? "");
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!params.has("token")) return;
    const next = new URLSearchParams(params);
    next.delete("token");
    setParams(next, { replace: true });
  }, [params, setParams]);
  const reset = useMutation({ mutationFn: authService.resetPassword });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    await reset.mutateAsync({ token, password: values.password });
    navigate("/login", { replace: true });
  }

  const eyeBtn = (
    <button
      type="button"
      onClick={() => setShow((v) => !v)}
      aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
      className="text-brand-ink/50 hover:text-brand-ink"
    >
      {show ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
    </button>
  );

  return (
    <AuthLayout
      title="Buat password baru"
      subtitle="Pilih password baru yang mudah kamu ingat tapi sulit ditebak orang lain."
      imageSrc={heroLogin}
      imageAlt="Santri Bermain dan Belajar Bersama"
      imageHeadline="Hampir selesai!"
      imageCaption="Setelah password diganti, kamu bisa langsung masuk dan lanjut belajar."
      imagePosition="right"
      footer={
        <p>
          <Link to="/login" className="font-bold text-brand-purple-fg hover:underline">
            Kembali ke halaman masuk
          </Link>
        </p>
      }
    >
      {!token ? (
        <div role="alert" className="flex flex-col gap-4">
          <p className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600">
            Tautan reset tidak lengkap. Minta tautan baru lewat “Lupa password?”.
          </p>
          <ButtonLink to="/forgot-password" className="w-full">Minta tautan baru</ButtonLink>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <Input
            label="Password baru"
            type={show ? "text" : "password"}
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            icon={<LockIcon className="h-5 w-5" />}
            trailingAction={eyeBtn}
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label="Ulangi password baru"
            type={show ? "text" : "password"}
            placeholder="Ketik ulang password baru"
            autoComplete="new-password"
            icon={<LockIcon className="h-5 w-5" />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          {reset.isError && (
            <div role="alert" className="text-sm font-bold text-red-600">
              <p>{errorMessage(reset.error)}</p>
              <Link to="/forgot-password" className="mt-1 inline-block text-brand-purple-fg hover:underline">
                Minta tautan baru
              </Link>
            </div>
          )}
          <Button type="submit" size="lg" isLoading={reset.isPending} fullWidth>
            Simpan password baru
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ResetPasswordPage;
