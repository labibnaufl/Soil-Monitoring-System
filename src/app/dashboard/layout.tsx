import { ReactNode } from "react";
import { DashboardLayout } from "./_components/dashboard-layout";

export default function Layout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
