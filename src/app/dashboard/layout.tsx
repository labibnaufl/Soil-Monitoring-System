import { ReactNode } from "react";
import { cookies } from "next/headers";
import { DashboardLayout } from "./_components/dashboard-layout";

export default async function Layout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  return <DashboardLayout defaultOpen={defaultOpen}>{children}</DashboardLayout>;
}
