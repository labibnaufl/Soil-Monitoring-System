"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  SquaresFour,
  Drop,
  Heartbeat,
  Users,
  Scroll,
  MapPin,
  Cpu,
  Bell,
  CloudRain,
} from "@phosphor-icons/react";

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
  SidebarRail,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { getAlertCounts } from "../alerts/_components/actions/alert";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: SquaresFour },
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
  { title: "Tingkat Air", url: "/dashboard/monitoring/water-level", icon: Drop },
  { title: "Curah Hujan", url: "/dashboard/monitoring/curah-hujan", icon: CloudRain },
  { title: "Monitoring Tanah", url: "/dashboard/monitoring/soil-monitoring", icon: Heartbeat },
];

const systemNav = [
  { title: "Log Aktivitas", url: "/dashboard/logs", icon: Scroll },
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
    <Sidebar variant="inset" collapsible="icon" {...props}>
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
      <SidebarRail />
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
  const matches = (url: string) =>
    url === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === url || pathname.startsWith(`${url}/`);
  const activeUrl = items
    .filter((item) => matches(item.url))
    .sort((a, b) => b.url.length - a.url.length)[0]?.url;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.url === activeUrl;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className={
                    isActive
                      ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 data-[active=true]:bg-emerald-100 data-[active=true]:text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 dark:hover:bg-emerald-800"
                      : undefined
                  }
                >
                  <Link href={item.url} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <item.icon
                        weight={isActive ? "fill" : "regular"}
                        className="size-4"
                        aria-hidden="true"
                      />
                      <span>{item.title}</span>
                    </span>
                    {item.showBadge && alertCounts && alertCounts.open > 0 && (
                      <span role="status" aria-label={`${alertCounts.open} notifikasi belum selesai`} className={`ml-auto text-xs px-2 py-0.5 rounded-full group-data-[collapsible=icon]:hidden ${alertCounts.high ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
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
