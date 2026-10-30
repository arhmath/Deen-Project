import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon } from "../../components/ui/FormIcons";
import { loginSchema, type LoginFormValues } from "../../lib/validation/authSchemas";

interface LoginFormProps {
  /**
   * Wire this up to the real auth service (e.g. a TanStack `useMutation`
   * from `features/auth`) once the service layer is ready. Throw an Error
   * with a user-facing message on failure — it will be shown above the form.
   */
  onSubmit: (values: LoginFormValues) => Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const submit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await onSubmit(values);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Gagal masuk. Coba lagi ya."
      );
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <section
        aria-labelledby="judge-demo-title"
        className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p
              id="judge-demo-title"
              className="text-sm font-extrabold text-brand-purple-fg"
            >
              Akses Demo Juri UINIC 8.0
            </p>
            <p className="mt-1 text-xs leading-5 text-brand-ink/65">
              Gunakan akun Superadmin untuk menjelajahi fitur Deen selama penilaian.
            </p>
          </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            setValue("identifier", "superadmin", {
              shouldDirty: true,
              shouldValidate: true,
            });
            setValue("password", "superadmin", {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          className="inline-flex w-fit shrink-0 items-center rounded-full bg-brand-purple/10 px-3 py-1 text-[11px] font-bold text-brand-purple-fg"
        >
          Isi Otomatis
        </button>

          {/* <span className="inline-flex w-fit shrink-0 items-center rounded-full bg-brand-purple/10 px-3 py-1 text-[11px] font-bold text-brand-purple-fg">
            SUPERADMIN
          </span> */}
        </div>

        {/* <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-surface px-3 py-2">
            <span className="block text-brand-ink/50">Username</span>
            <strong className="mt-0.5 block select-all text-brand-ink">superadmin</strong>
          </div>
          <div className="rounded-xl bg-surface px-3 py-2">
            <span className="block text-brand-ink/50">Password</span>
            <strong className="mt-0.5 block select-all text-brand-ink">superadmin</strong>
          </div>
        </div> */}

        {/* <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            setValue("identifier", "superadmin", {
              shouldDirty: true,
              shouldValidate: true,
            });
            setValue("password", "superadmin", {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-brand-purple px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-purple/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple disabled:cursor-not-allowed disabled:opacity-60"
        >
          Isi akun demo otomatis
        </button> */}
      </section>

      {serverError && (
        <div
          role="alert"
          className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
        >
          {serverError}
        </div>
      )}

      <Input
        label="Username atau Email"
        icon={<UserIcon className="h-5 w-5" />}
        placeholder="cth. ahmad_santri"
        autoComplete="username"
        error={errors.identifier?.message}
        disabled={isSubmitting}
        {...register("identifier")}
      />

      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        icon={<LockIcon className="h-5 w-5" />}
        placeholder="Masukkan password"
        autoComplete="current-password"
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

      <div className="flex justify-end">
        <Link
          to="/forgot-password"
          className="font-body text-sm font-bold text-brand-purple-fg hover:underline"
        >
          Lupa password?
        </Link>
      </div>

      <Button type="submit" size="lg" isLoading={isSubmitting} fullWidth>
        Masuk
      </Button>
    </form>
  );
}
