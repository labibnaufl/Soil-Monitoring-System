"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  EnvelopeSimple,
  LockKey,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react";

export default function LoginCredentialsForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const nextErrors: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Masukkan alamat email yang valid.";
    }
    if (password.length < 8) {
      nextErrors.password = "Password minimal 8 karakter.";
    }
    setFieldErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: rememberMe ? "1" : "0",
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah. Pastikan akun Anda aktif.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="relative flex min-h-svh flex-col px-6 py-6 md:px-[48px] lg:h-svh lg:overflow-y-auto lg:px-[70px] lg:pt-[142px] lg:pb-6 xl:px-[118px] xl:pt-[175px]">
      <div className="relative z-10 mx-auto flex w-full max-w-[525px] flex-1 flex-col justify-center py-2 lg:mx-0 lg:justify-start lg:py-0">
        <div className="flex items-center gap-[12px]">
          <Image
            src="/Images/Logo_HD.png"
            alt="NYAWIT Logo"
            width={108}
            height={80}
            className="h-[60px] w-[80px] object-contain"
            priority
          />
          <div>
            <p className="text-[28px] leading-none font-semibold tracking-tight text-[#02CC01]">
              NYAWIT
            </p>
            <p className="mt-[4px] text-[14px] font-medium text-[#666666]">
              Powered by PT. Lestari Prima AgriTech
            </p>
          </div>
        </div>

        <h1 className="mt-[28px] text-[30px] leading-[1.3] font-medium text-[#02CC01]">
          Masuk ke Akun Anda
        </h1>
        <p className="text-[14px] font-medium text-[#666666]">Masukkan kredensial akun</p>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-snug text-red-600"
          >
            <WarningCircle className="mt-0.5 h-[18px] w-[18px] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-[28px]" noValidate>
          <div className="space-y-[18px]">
            <div>
              <label htmlFor="login-email" className="block text-[14px] font-medium text-[#666666]">
                Email
              </label>
              <div className="relative mt-[6px]">
                <div className="pointer-events-none absolute top-1/2 left-[14px] -translate-y-1/2 text-[#666666]">
                  <EnvelopeSimple className="h-[24px] w-[24px]" />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nyawit.id"
                  required
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
                  className="h-[48px] w-full rounded-[9px] border border-[#E5E5E5] bg-white pr-4 pl-[52px] text-[15px] font-medium text-[#333333] placeholder:text-[#9F9F9F] focus:border-[#02CC01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02CC01]/40"
                />
              </div>
              {fieldErrors.email && (
                <p id="login-email-error" role="alert" className="mt-1 text-sm text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-[14px] font-medium text-[#666666]"
              >
                Password
              </label>
              <div className="relative mt-[6px]">
                <div className="pointer-events-none absolute top-1/2 left-[14px] -translate-y-1/2 text-[#666666]">
                  <LockKey className="h-[24px] w-[22px]" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="current-password"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                  className="h-[48px] w-full rounded-[9px] border border-[#E5E5E5] bg-white pr-4 pl-[52px] text-[15px] font-medium text-[#333333] placeholder:text-[#9F9F9F] focus:border-[#02CC01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#02CC01]/40"
                />
              </div>
              {fieldErrors.password && (
                <p id="login-password-error" role="alert" className="mt-1 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>
          </div>

          <label className="mt-[18px] flex cursor-pointer items-center gap-[10px]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="peer sr-only"
              aria-label="Ingat saya selama 30 hari"
            />
            <span
              aria-hidden="true"
              className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-[5px] border border-[#666666] bg-white transition-colors peer-checked:border-[#02CC01] peer-checked:bg-[#02CC01] peer-focus-visible:ring-2 peer-focus-visible:ring-[#02CC01]/40"
            >
              <svg
                viewBox="0 0 12 12"
                fill="none"
                className={`h-3 w-3 text-white transition-opacity ${rememberMe ? "opacity-100" : "opacity-0"}`}
              >
                <path
                  d="M2.5 6L5 8.5L9.5 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[14px] font-medium text-[#666666] select-none">
              Ingat saya selama 30 hari
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="relative mt-[16px] flex h-[52px] w-full items-center justify-center gap-2 rounded-[9px] bg-[#02CC01] text-[15px] font-semibold text-white transition-colors hover:bg-[#00B400] focus-visible:ring-2 focus-visible:ring-[#02CC01]/40 focus-visible:ring-offset-2 focus-visible:outline-none active:bg-[#009E00] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className={isLoading ? "invisible" : undefined}>Masuk</span>
            {isLoading && (
              <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <CircleNotch className="h-5 w-5 animate-spin" />
              </span>
            )}
          </button>
          <span className="sr-only" role="status">
            {isLoading ? "Memeriksa kredensial…" : ""}
          </span>

          <div className="mt-[8px] flex justify-end">
            <button
              type="button"
              onClick={() => toast.info("Reset password segera hadir — hubungi admin NYAWIT.")}
              className="min-h-[44px] px-1 text-[14px] font-medium text-[#02CC01] transition-colors hover:text-[#00B400] focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#02CC01]/40 focus-visible:outline-none"
            >
              Lupa Password?
            </button>
          </div>
        </form>
      </div>

      <p className="relative z-10 pb-2 text-center text-[14px] font-medium text-[#666666]">
          Dengan masuk, anda sudah menyetujui{" "}
          <button
            type="button"
            onClick={() => toast.info("Ketentuan penggunaan segera hadir — hubungi admin NYAWIT.")}
            className="font-medium text-[#02CC01] transition-colors hover:text-[#00B400] focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#02CC01]/40 focus-visible:outline-none"
          >
            ketentuan penggunaan
          </button>
        </p>
    </section>
  );
}
