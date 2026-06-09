"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
} from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
    <main className="min-h-screen flex bg-white">
      {/* ─── Left Panel: Login Form ─── */}
      <div className="w-full lg:w-[52%] flex flex-col items-center justify-center px-6 sm:px-12 lg:px-20 xl:px-28 py-10 bg-white relative">
        {/* Subtle grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Centered content wrapper */}
        <div className="relative z-10 w-full max-w-95">
          {/* Logo */}
          <div className="mb-10">
          <div className="flex items-center gap-3">
            <Image
              src="/Images/Logo_HD.png"
              alt="NYAWIT Logo"
              width={56}
              height={56}
              className="w-14 h-14 object-contain"
              priority
            />
            <div>
              <span className="text-xl font-bold text-emerald-500 tracking-tight block">
                NYAWIT
              </span>
              <span className="text-xs text-slate-700 tracking-wide">
                by PT. Lestari Prima AgriTech
              </span>
            </div>
          </div>
          </div>

          {/* Form */}
          <div>
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[26px] font-bold text-emerald-500 tracking-tight leading-tight">
              Masuk ke akun Anda
            </h1>
            <p className="text-slate-500 text-[15px] mt-2">
              Masukkan kredensial admin Anda
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-600 px-4 py-3.5 rounded-xl mb-6 text-sm leading-snug animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-slate-700"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4.5 h-4.5" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nyawit.id"
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-[15px] placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400
                           transition-all duration-200 hover:border-slate-300"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-[15px] placeholder-slate-400
                           focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400
                           transition-all duration-200 hover:border-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4.5 h-4.5 rounded-[5px] border-2 transition-all duration-200 flex items-center justify-center ${
                      rememberMe
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-300 bg-white group-hover:border-slate-400"
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
                <span className="text-sm text-slate-600 select-none">
                  Ingat selama 30 hari
                </span>
              </label>

              <button
                type="button"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Lupa password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 mt-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700
                       text-white font-semibold text-[15px] rounded-xl shadow-lg shadow-emerald-500/20
                       disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-emerald-500
                       transition-all duration-200 transform hover:shadow-emerald-500/30
                       flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memeriksa...</span>
                </>
              ) : (
                <span>Masuk</span>
              )}
            </button>
          </form>
          </div>

          {/* Terms */}
          <div className="mt-12">
            <p className="text-sm text-slate-400">
              Dengan masuk, Anda menyetujui{" "}
              <button
                type="button"
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors underline underline-offset-2"
              >
                Ketentuan Penggunaan
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Hero Visual ─── */}
      <div className="hidden lg:flex lg:w-[48%] p-4">
      <div className="w-full bg-emerald-500 flex flex-col justify-center relative overflow-hidden rounded-3xl">
        {/* Background texture & glow effects */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-400/30 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] bg-emerald-600/40 rounded-full blur-[100px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 px-12 xl:px-16 2xl:px-20">
          {/* Heading */}
          <div className="mb-10">
            <h2 className="text-[32px] xl:text-[38px] 2xl:text-[42px] font-extrabold text-white leading-[1.15] tracking-tight">
              Menghubungkan Teknologi dan Alam dalam Satu Sistem.
            </h2>
            <p className="text-emerald-100/80 text-base xl:text-lg mt-4 leading-relaxed max-w-md">
              Masuk untuk mengakses dashboard Anda dan mulai lakukan pemantauan.
            </p>
          </div>

          {/* Dashboard Preview Cards */}
          <div className="relative h-[380px] xl:h-[420px]">
            {/* Main dashboard card - back */}
            <div
              className="absolute top-0 left-0 w-[90%] xl:w-[85%] rounded-2xl shadow-2xl shadow-black/20 overflow-hidden border border-white/10"
              style={{
                transform: "perspective(1200px) rotateY(4deg) rotateX(2deg)",
              }}
            >
              <Image
                src="/Images/dashboard-preview-main.png"
                alt="Dashboard monitoring data preview"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                priority
              />
            </div>

            {/* Rainfall chart card - front, overlapping */}
            <div
              className="absolute top-[30%] right-[-8%] xl:right-[-5%] w-[65%] xl:w-[60%] rounded-2xl shadow-2xl shadow-black/25 overflow-hidden border border-white/10"
              style={{
                transform: "perspective(1200px) rotateY(-3deg) rotateX(1deg)",
              }}
            >
              <Image
                src="/Images/dashboard-preview-chart.png"
                alt="Dashboard rainfall chart preview"
                width={450}
                height={350}
                className="w-full h-auto object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
