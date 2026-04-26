"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Droplets,
  Activity,
  Users,
  ScrollText,
  MapPin,
  Cpu,
  Bell,
  Brain,
  CloudRain,
} from "lucide-react";

import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { getAlertCounts } from "../alerts/_components/actions/alert";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
];

const managementNavSuperAdmin = [
  { title: "Stasiun", url: "/dashboard/management/stations", icon: MapPin },
  { title: "Alat", url: "/dashboard/management/devices", icon: Cpu },
  { title: "Notifikasi", url: "/dashboard/alerts", icon: Bell, showBadge: true },
];

const managementNavAdminLokasi = [
  { title: "Notifikasi", url: "/dashboard/alerts", icon: Bell, showBadge: true },
];

const monitoringNav = [
  { title: "Tingkat Air", url: "/dashboard/monitoring/water-level", icon: Droplets },
  { title: "Curah Hujan", url: "/dashboard/monitoring/curah-hujan", icon: CloudRain },
  { title: "Monitoring Tanah", url: "/dashboard/monitoring/soil-monitoring", icon: Activity },
  { title: "Prediksi AI", url: "/dashboard/monitoring/prediksi-ai", icon: Brain },
];

const systemNav = [
  { title: "Log Aktivitas", url: "/dashboard/logs", icon: ScrollText },
];

export function AdminSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string;
    email: string;
    avatar: string;
    role?: string;
  };
}) {
  const pathname = usePathname();
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const [alertCounts, setAlertCounts] = useState({ open: 0, high: 0, total: 0 });

  useEffect(() => {
    // Fetch alert counts on mount
    getAlertCounts().then(setAlertCounts).catch(console.error);
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      getAlertCounts().then(setAlertCounts).catch(console.error);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const managementNav = isSuperAdmin
    ? [
        ...managementNavSuperAdmin,
        { title: "Kelola Pengguna", url: "/dashboard/management/users", icon: Users },
      ]
    : managementNavAdminLokasi;

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <Image
                    src="/Images/Logo_HD.png"
                    alt="NYAWIT Logo"
                    width={32}
                    height={32}
                    className="size-8 object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">NYAWIT</span>
                  <span className="truncate text-xs">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Utama" items={mainNav} pathname={pathname} />
        <NavGroup label="Management" items={managementNav} pathname={pathname} alertCounts={alertCounts} />
        <NavGroup label="Monitoring" items={monitoringNav} pathname={pathname} />
        <NavGroup label="Sistem" items={systemNav} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  alertCounts,
}: {
  label: string;
  items: { title: string; url: string; icon: React.ElementType; showBadge?: boolean }[];
  pathname: string;
  alertCounts?: { open: number; high: number; total: number };
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.url === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.url} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <item.icon />
                      <span>{item.title}</span>
                    </span>
                    {item.showBadge && alertCounts && alertCounts.open > 0 && (
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${alertCounts.high > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                        {alertCounts.open}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
