import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import {
  UserIcon,
  LockIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
} from "../../components/ui/FormIcons";
import { StarIcon } from "../../components/landing/DecorativeIcons";
import { UsersRoleIcon } from "./RoleIcons";
import {
  registerSchema,
  type RegisterFormValues,
} from "../../lib/validation/authSchemas";
import { clsx } from "../../lib/clsx";
import type { UserRole } from "../../types/auth";

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => Promise<void>;
}

const ROLE_OPTIONS: { value: UserRole; title: string; desc: string }[] = [
  { value: "SANTRI", title: "Santri", desc: "Untuk Belajar" },
  { value: "PARENT", title: "Orang Tua", desc: "Untuk Memantau Anak" },
];

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const selectedRole = watch("role");
  
  // 1. Pantau value password & confirmPassword secara real-time
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // 2. Cek apakah password cocok (minimal ada isinya dan tidak ada error dari Zod)
  const isConfirmFilled = confirmPassword && confirmPassword.length > 0;
  const isMatch = isConfirmFilled && password === confirmPassword;

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Pendaftaran gagal. Coba lagi ya."
      );
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {serverError && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
        >
          {serverError}
        </div>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-bold font-display text-brand-ink">
          Daftar sebagai
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={clsx(
                "cursor-pointer rounded-2xl border-2 p-4 transition-colors",
                selectedRole === opt.value
                  ? "border-brand-purple bg-brand-purple/5"
                  : "border-brand-ink/10 bg-white hover:border-brand-purple/40"
              )}
            >
              <input
                type="radio"
                value={opt.value}
                className="sr-only"
                {...register("role")}
              />
              <UsersRoleIcon
                role={opt.value}
                className={clsx(
                  "h-6 w-6",
                  selectedRole === opt.value ? "text-brand-purple" : "text-brand-ink/40"
                )}
              />
              <p className="mt-2 font-display text-sm font-bold text-brand-ink">
                {opt.title}
              </p>
              <p className="text-xs text-brand-ink/50">{opt.desc}</p>
            </label>
          ))}
        </div>
        {errors.role?.message && (
          <p className="mt-2 text-sm font-semibold text-red-500">
            {errors.role.message}
          </p>
        )}
      </fieldset>

      <Input
        label="Nama Lengkap"
        icon={<UserIcon className="h-5 w-5" />}
        placeholder="cth. Ahmad Fauzan"
        autoComplete="name"
        error={errors.name?.message}
        disabled={isSubmitting}
        {...register("name")}
      />

      <Input
        label="Username"
        icon={<StarIcon className="h-5 w-5" />}
        placeholder="cth. ahmad_santri"
        autoComplete="username"
        error={errors.username?.message}
        disabled={isSubmitting}
        {...register("username")}
      />

      <Input
        label="Email (opsional)"
        type="email"
        icon={<MailIcon className="h-5 w-5" />}
        placeholder="cth. ahmad@email.com"
        autoComplete="email"
        error={errors.email?.message}
        disabled={isSubmitting}
        {...register("email")}
      />

      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        icon={<LockIcon className="h-5 w-5" />}
        placeholder="Minimal 8 karakter"
        autoComplete="new-password"
        error={errors.password?.message}
        disabled={isSubmitting}
        trailingAction={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-brand-ink/40 hover:text-brand-ink/70"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? (
              <EyeOffIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        }
        {...register("password")}
      />

      <div>
        <Input
          label="Ulangi Password"
          type={showPassword ? "text" : "password"}
          icon={<LockIcon className="h-5 w-5" />}
          placeholder="Ulangi password kamu"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          disabled={isSubmitting}
          {...register("confirmPassword")}
        />

        {/* 3. Indikator Lampu Hijau & Teks Match */}
        {isMatch && !errors.confirmPassword && (
          <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-600 motion-safe:animate-fade-up">
            {/* Lampu ijo berkedip / pulse dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span>Password cocok!</span>
          </div>
        )}
      </div>

      <div>
        <label className="flex items-start gap-2.5 font-body text-sm text-brand-ink/70">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-2 border-brand-ink/20 text-brand-purple focus:ring-brand-purple"
            {...register("agreeToTerms")}
          />
          Saya setuju dengan{" "}
          <a href="/terms" className="font-bold text-brand-purple hover:underline">
            Syarat & Ketentuan
          </a>{" "}
          Deen.
        </label>
        {errors.agreeToTerms?.message && (
          <p className="mt-1.5 text-sm font-semibold text-red-500">
            {errors.agreeToTerms.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" isLoading={isSubmitting} fullWidth>
        Buat Akun
      </Button>
    </form>
  );
}