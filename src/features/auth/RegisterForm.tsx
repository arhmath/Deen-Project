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
import { ApiError } from "../../services/api";
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
    setError,
    setFocus,
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
      // Error per-field dari server (mis. 409 username/email sudah dipakai) tampil di bawah inputnya
      if (err instanceof ApiError && err.fieldErrors) {
        const fields = ["name", "username", "email", "password"] as const;
        const mapped = fields.filter((f) => err.fieldErrors?.[f]);
        mapped.forEach((f) => setError(f, { type: "server", message: err.fieldErrors![f] }));
        if (mapped.length > 0) {
          setFocus(mapped[0]!);
          return;
        }
      }
      setServerError(
        err instanceof Error ? err.message : "Pendaftaran gagal. Coba lagi ya."
      );
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      {serverError && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
        >
          {serverError}
        </div>
      )}

      <fieldset>
        <legend className="mb-1.5 text-sm font-bold font-display text-brand-ink">
          Daftar sebagai
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={clsx(
                "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 px-3 py-3 text-center transition-colors sm:flex-row sm:justify-start sm:gap-3 sm:px-3.5 sm:py-2.5 sm:text-left",
                selectedRole === opt.value
                  ? "border-brand-purple bg-brand-purple/5"
                  : "border-brand-ink/10 bg-surface hover:border-brand-purple/40"
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
                  "h-6 w-6 shrink-0",
                  selectedRole === opt.value ? "text-brand-purple-fg" : "text-brand-ink/40"
                )}
              />
              <span className="min-w-0">
                <span className="block font-display text-sm font-bold leading-tight text-brand-ink">
                  {opt.title}
                </span>
                <span className="block text-xs leading-tight text-brand-ink/50">{opt.desc}</span>
              </span>
            </label>
          ))}
        </div>
        {errors.role?.message && (
          <p className="mt-2 text-sm font-semibold text-red-500">
            {errors.role.message}
          </p>
        )}
      </fieldset>

      {/* Baris 1: Username (kiri) · Nama Lengkap (kanan) */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Input
          compact
          label="Username"
          icon={<StarIcon className="h-5 w-5" />}
          placeholder="cth. ahmad_santri"
          autoComplete="username"
          error={errors.username?.message}
          disabled={isSubmitting}
          {...register("username")}
        />

        <Input
          compact
          label="Nama Lengkap"
          icon={<UserIcon className="h-5 w-5" />}
          placeholder="cth. Ahmad Fauzan"
          autoComplete="name"
          error={errors.name?.message}
          disabled={isSubmitting}
          {...register("name")}
        />
      </div>

      {/* Baris 2: Email */}
      <Input
        compact
        label="Email (opsional)"
        type="email"
        icon={<MailIcon className="h-5 w-5" />}
        placeholder="cth. ahmad@email.com"
        autoComplete="email"
        error={errors.email?.message}
        disabled={isSubmitting}
        {...register("email")}
      />

      {/* Baris 3: Password (kiri) · Ulangi Password (kanan) */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Input
          compact
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

        <div className="relative">
          <Input
            compact
            label="Ulangi Password"
            type={showPassword ? "text" : "password"}
            icon={<LockIcon className="h-5 w-5" />}
            placeholder="Ulangi password kamu"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            disabled={isSubmitting}
            {...register("confirmPassword")}
          />

          {/* Indikator lampu hijau: diposisikan di baris label (absolute) supaya tidak mendorong layout ke bawah */}
          {isMatch && !errors.confirmPassword && (
            <div className="pointer-events-none absolute right-0 top-0 flex items-center gap-1.5 text-xs font-bold text-emerald-600 motion-safe:animate-fade-up">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
              <span>Password cocok!</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2.5 font-body text-sm leading-snug text-brand-ink/70">
          <input
            type="checkbox"
            className="h-4 w-4 shrink-0 rounded border-2 border-brand-ink/20 text-brand-purple-fg focus:ring-brand-purple"
            {...register("agreeToTerms")}
          />
          <span className="min-w-0">
            Saya setuju dengan{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-brand-purple-fg hover:underline">
              Syarat & Ketentuan
            </a>{" "}
            Deen.
          </span>
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