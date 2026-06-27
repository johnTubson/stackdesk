import { Link } from "@tanstack/react-router";
import {
  ClipboardList,
  LayoutDashboard,
  Scale,
  ScrollText,
  Store,
  UserPlus,
} from "lucide-react";

import type { AppSessionData } from "#/lib/session";
import { cn } from "#/lib/cn";

type AdminNavItem = {
  label: string;
  to:
    | "/dashboard"
    | "/merchants"
    | "/onboarding"
    | "/reconciliation"
    | "/audit";
  search?: {
    status?:
      | "all"
      | "pending"
      | "approved"
      | "rejected"
      | "draft"
      | "open"
      | "matched"
      | "discrepancy"
      | "resolved";
    page: number;
  };
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const adminNavItems: AdminNavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  {
    label: "Merchants",
    to: "/merchants",
    search: { status: "all", page: 1 },
    icon: Store,
  },
  { label: "Onboarding", to: "/onboarding", icon: UserPlus },
  {
    label: "Reconciliation",
    to: "/reconciliation",
    search: { status: "all", page: 1 },
    icon: Scale,
  },
  {
    label: "Audit log",
    to: "/audit",
    search: { page: 1 },
    icon: ScrollText,
    adminOnly: true,
  },
];

export type AdminSidebarProps = {
  session?: AppSessionData | null;
  className?: string;
};

export function AdminSidebar({ session, className }: AdminSidebarProps) {
  const visibleItems = adminNavItems.filter(
    (item) => !item.adminOnly || session?.role === "admin"
  );

  return (
    <aside
      className={cn(
        "flex w-60 shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-sidebar)]",
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-[var(--admin-border)] px-4">
        <img
          src="/icon.svg"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-lg"
          aria-hidden
        />
        <div>
          <p className="text-sm font-bold text-[var(--admin-foreground)]">
            StackDesk
          </p>
          <p className="text-[0.65rem] font-medium tracking-wide text-[var(--admin-foreground-muted)] uppercase">
            Admin
          </p>
        </div>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            search={item.search}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--admin-foreground-muted)] no-underline transition-colors hover:bg-[var(--admin-muted-bg)] hover:text-[var(--admin-foreground)]"
            activeProps={{
              className:
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium no-underline bg-[var(--admin-primary-soft)] text-[var(--admin-primary)]",
            }}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {session ? (
        <div className="border-t border-[var(--admin-border)] p-3">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--admin-muted-bg)] px-3 py-2">
            <ClipboardList className="h-4 w-4 text-[var(--admin-foreground-muted)]" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[var(--admin-foreground)]">
                {session.name}
              </p>
              <p className="truncate text-[0.65rem] text-[var(--admin-foreground-muted)] capitalize">
                {session.role}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
