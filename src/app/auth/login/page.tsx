import Image from "next/image";
import LoginBrandingPanel from "./_components/login-branding-panel";
import LoginCredentialsForm from "./_components/login-credentials-form";

export default function LoginPage() {
  return (
    <main className="relative grid min-h-svh overflow-hidden bg-white lg:grid-cols-2">
      {/* Shared bog wetland backdrop across both halves at 15%, softened
          by a white veil so text keeps full contrast. */}
      <Image
        src="/Images/bog.jpg"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="object-cover opacity-[0.15]"
        priority
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-white/50"
      />
      <LoginBrandingPanel />
      <LoginCredentialsForm />
    </main>
  );
}
