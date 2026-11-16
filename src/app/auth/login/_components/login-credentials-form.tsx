"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  EnvelopeSimple,
  LockKey,
  Eye,
  EyeSlash,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react";

export default function LoginCredentialsForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <section className="flex flex-col gap-4 p-6 md:p-10 min-h-svh lg:h-svh lg:overflow-hidden bg-white">
      <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-[497px] flex flex-col justify-center py-4">
        <div className="flex items-center gap-[14px]">
          <Image
            src="/Images/Logo_HD.png"
            alt="NYAWIT Logo"
            width={108}
            height={80}
            className="w-[64px] h-[48px] xl:w-[108px] xl:h-[80px] object-contain"
            priority
          />
          <div>
            <span className="text-[24px] xl:text-[28px] font-bold text-[#007A00] tracking-tight block leading-[1.2] font-sans">
              NYAWIT
            </span>
            <span className="text-[13px] xl:text-[15px] text-[#666666] tracking-wide font-sans">
              Powered by PT. Lestari Prima AgriTech
            </span>
          </div>
        </div>

        <div className="mt-[3vh]">
          <h1 className="w-[378px] max-w-full text-[26px] xl:text-[32px] font-bold text-[#007A00] tracking-tight leading-[1.2] font-sans">
            Masuk ke Akun Anda
          </h1>
          <p className="text-[#666666] text-[15px] mt-1 font-sans">
            Masukkan kredensial akun
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3.5 rounded-xl mb-6 text-sm leading-snug animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <WarningCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-[3vh] space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="block text-sm font-semibold text-[#666666]"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9F9F9F]">
                <EnvelopeSimple className="w-4.5 h-4.5" />
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
                className="w-full min-h-[44px] pl-11 pr-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-[#333333] text-[15px] placeholder:text-[#767676]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007A00]/40 focus:border-[#007A00]
                         transition-all duration-200 hover:border-[#CCCCCC]"
              />
            </div>
            {fieldErrors.email && (
              <p id="login-email-error" role="alert" className="text-sm text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="block text-sm font-semibold text-[#666666]"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9F9F9F]">
                <LockKey className="w-4.5 h-4.5" />
              </div>
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="current-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                className="w-full min-h-[44px] pl-11 pr-12 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-[#333333] text-[15px] placeholder:text-[#767676]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007A00]/40 focus:border-[#007A00]
                         transition-all duration-200 hover:border-[#CCCCCC]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#767676] hover:text-[#333333] transition-colors p-2 rounded-md hover:bg-[#F5F5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007A00]/40"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeSlash className="w-4.5 h-4.5" />
                ) : (
                  <Eye className="w-4.5 h-4.5" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="login-password-error" role="alert" className="text-sm text-red-600">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer sr-only"
                  aria-label="Ingat saya selama 30 hari"
                />
                <div
                  className={`w-[22px] h-[22px] rounded-[5px] border-2 transition-all duration-200 flex items-center justify-center peer-focus-visible:ring-2 peer-focus-visible:ring-[#007A00]/40 ${
                    rememberMe
                      ? "bg-[#007A00] border-[#007A00]"
                      : "border-[#CCCCCC] bg-white group-hover:border-[#999999]"
                  }`}
                >
                  <svg
                    className={`w-3 h-3 text-white transition-opacity duration-150 ${
                      rememberMe ? "opacity-100" : "opacity-0"
                    }`}
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <span className="text-sm text-[#666666] select-none">
                Ingat saya selama 30 hari
              </span>
            </label>

            <button
              type="button"
              onClick={() => toast.info("Reset password segera hadir — hubungi admin NYAWIT.")}
              className="min-h-[44px] px-2 text-sm font-semibold text-[#007A00] hover:text-[#006400] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007A00]/40 rounded-md"
            >
              Lupa Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full min-h-[44px] py-2.5 px-4 bg-[#007A00] hover:bg-[#006400] active:bg-[#005A00]
                     text-white font-semibold text-[15px] rounded-xl shadow-lg shadow-[#007A00]/20
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#007A00]
                     transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007A00]/40 focus-visible:ring-offset-2
                     flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <CircleNotch className="w-5 h-5 animate-spin" />
                <span>Memeriksa...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>

        <div className="mt-[3vh]">
          <p className="text-[13px] xl:text-[15px] text-[#666666] font-sans">
            Dengan masuk, anda sudah menyetujui{" "}
            <button
              type="button"
              onClick={() => toast.info("Ketentuan penggunaan segera hadir — hubungi admin NYAWIT.")}
              className="text-[#007A00] hover:text-[#006400] font-medium transition-colors font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007A00]/40 rounded"
            >
              ketentuan penggunaan
            </button>
          </p>
        </div>
      </div>
      </div>
    </section>
  );
}
