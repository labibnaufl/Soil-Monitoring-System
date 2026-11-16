"use client";

import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { Warning, CheckCircle, Shield } from "@phosphor-icons/react/ssr";

import { cn } from "@/lib/utils";
import { badgeVariants, type BadgeIntent } from "@/lib/badge-helpers";

const defaultIconByIntent: Record<BadgeIntent, React.ComponentType<{ className?: string }>> = {
  destructive: Warning,
  amber: Warning,
  emerald: CheckCircle,
  indigo: Shield,
  slate: Shield,
};

export interface StatusBadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  icon?: React.ComponentType<{ className?: string }> | null;
}

export function StatusBadge({
  className,
  intent = "slate",
  icon,
  children,
  ...props
}: StatusBadgeProps) {
  const Icon = icon === undefined ? defaultIconByIntent[intent ?? "slate"] : icon;

  return (
    <span className={cn(badgeVariants({ intent }), className)} {...props}>
      {Icon && <Icon className="size-3 shrink-0" aria-hidden="true" />}
      <span className="truncate min-w-0">{children}</span>
    </span>
  );
}

export {
  getPriorityBadge,
  getPriorityLabel,
  getPriorityDotClass,
  getStatusBadge,
  getStatusLabel,
  getRoleBadge,
  getRoleLabel,
} from "@/lib/badge-helpers";

export type { BadgeIntent } from "@/lib/badge-helpers";
