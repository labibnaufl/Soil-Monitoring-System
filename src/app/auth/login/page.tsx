import LoginBrandingPanel from "./_components/login-branding-panel";
import LoginCredentialsForm from "./_components/login-credentials-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2 bg-white">
      <LoginBrandingPanel />
      <LoginCredentialsForm />
    </main>
  );
}
