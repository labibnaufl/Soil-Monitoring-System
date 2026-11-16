import { cva, type VariantProps } from "class-variance-authority";

export type BadgeIntent = "destructive" | "amber" | "emerald" | "indigo" | "slate";

export const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      intent: {
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive dark:border-destructive/30",
        amber:
          "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200",
        emerald:
          "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200",
        indigo:
          "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200",
        slate:
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
      },
    },
    defaultVariants: {
      intent: "slate",
    },
  }
);

function priorityIntent(priority: string): BadgeIntent {
  switch (priority) {
    case "HIGH":
      return "destructive";
    case "MEDIUM":
      return "amber";
    case "LOW":
      return "emerald";
    default:
      return "slate";
  }
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case "HIGH":
      return "Tinggi";
    case "MEDIUM":
      return "Medium";
    case "LOW":
      return "Rendah";
    default:
      return priority;
  }
}

export function getPriorityBadge(priority: string) {
  const intent = priorityIntent(priority);
  return {
    intent,
    label: getPriorityLabel(priority),
    className: badgeVariants({ intent }),
  };
}

const priorityDotClasses: Record<BadgeIntent, string> = {
  destructive: "bg-destructive",
  amber: "bg-amber-500",
  emerald: "bg-emerald-500",
  indigo: "bg-indigo-500",
  slate: "bg-slate-400",
};

export function getPriorityDotClass(intent: BadgeIntent): string {
  return priorityDotClasses[intent];
}

function statusIntent(status: string): BadgeIntent {
  switch (status) {
    case "OPEN":
    case "MATI":
    case "NONAKTIF":
      return "destructive";
    case "PENDING":
    case "IN_PROGRESS":
    case "MAINTENANCE":
      return "amber";
    case "RESOLVED":
    case "BEROPERASI":
    case "AKTIF":
      return "emerald";
    default:
      return "slate";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "OPEN":
      return "Baru";
    case "PENDING":
      return "Pending";
    case "IN_PROGRESS":
      return "Sedang Dikerjakan";
    case "RESOLVED":
      return "Selesai";
    case "BEROPERASI":
      return "Beroperasi";
    case "MAINTENANCE":
      return "Maintenance";
    case "MATI":
      return "Mati";
    case "AKTIF":
      return "Aktif";
    case "NONAKTIF":
      return "Nonaktif";
    default:
      return status;
  }
}

export function getStatusBadge(status: string) {
  const intent = statusIntent(status);
  return {
    intent,
    label: getStatusLabel(status),
    className: badgeVariants({ intent }),
  };
}

function roleIntent(role: string): BadgeIntent {
  switch (role) {
    case "SUPER_ADMIN":
      return "indigo";
    case "ADMIN_LOCATION":
      return "slate";
    default:
      return "slate";
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "ADMIN_LOCATION":
      return "Admin Lokasi";
    default:
      return role;
  }
}

export function getRoleBadge(role: string) {
  const intent = roleIntent(role);
  return {
    intent,
    label: getRoleLabel(role),
    className: badgeVariants({ intent }),
  };
}
