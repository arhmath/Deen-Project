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
          className="font-body text-sm font-bold text-brand-purple hover:underline"
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
