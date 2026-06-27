import type { ReactNode } from "react";

import { AdminSidebar } from "#/components/layout/admin-sidebar";
import {
  Breadcrumbs,
  type BreadcrumbItem,
} from "#/components/layout/breadcrumbs";
import { UserMenu } from "#/components/layout/user-menu";
import type { AppSessionData } from "#/lib/session";
import { cn } from "#/lib/cn";

export type AdminLayoutProps = {
  children: ReactNode;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  session?: AppSessionData | null;
  className?: string;
};

export function AdminLayout({
  children,
  title,
  description,
  breadcrumbs = [{ label: "Dashboard", to: "/dashboard" }],
  session,
  className,
}: AdminLayoutProps) {
  return (
    <div
      className={cn(
        "admin-shell flex min-h-screen bg-[var(--admin-bg)]",
        className
      )}
    >
      <AdminSidebar session={session} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 items-center justify-between gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-3 lg:px-8">
          <div className="min-w-0 space-y-0.5">
            <Breadcrumbs items={breadcrumbs} />
            <h1 className="truncate text-lg font-semibold text-[var(--admin-foreground)]">
              {title}
            </h1>
            {description ? (
              <p className="truncate text-sm text-[var(--admin-foreground-muted)]">
                {description}
              </p>
            ) : null}
          </div>

          {session ? (
            <UserMenu
              name={session.name}
              email={session.email}
              role={session.role}
            />
          ) : null}
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 overflow-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
