import { Link, createFileRoute } from "@tanstack/react-router";

import { AdminLayout } from "#/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui";
import { getDashboardStats } from "#/server/dashboard";

export const Route = createFileRoute("/_admin/dashboard")({
  loader: () => getDashboardStats(),
  component: DashboardPage,
});

function DashboardPage() {
  const stats = Route.useLoaderData();
  const { session } = Route.useRouteContext();

  const kpis = [
    {
      label: "Pending merchants",
      value: stats.pendingMerchants,
      hint: "Awaiting reviewer action",
      to: "/merchants" as const,
      search: { status: "pending" as const, page: 1 },
    },
    {
      label: "Approved merchants",
      value: stats.approvedMerchants,
      hint: "Cleared for payouts",
      to: "/merchants" as const,
      search: { status: "approved" as const, page: 1 },
    },
    {
      label: "Open batches",
      value: stats.openBatches,
      hint: "Reconciliation in progress",
      to: "/reconciliation" as const,
      search: { status: "open" as const, page: 1 },
    },
    {
      label: "Discrepancies",
      value: stats.discrepancyBatches,
      hint: "Needs admin resolution",
      to: "/reconciliation" as const,
      search: { status: "discrepancy" as const, page: 1 },
    },
  ] as const;

  return (
    <AdminLayout
      title="Dashboard"
      description={`Welcome back, ${session.name}`}
      breadcrumbs={[{ label: "Dashboard" }]}
      session={session}
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Link
              key={kpi.label}
              to={kpi.to}
              search={kpi.search}
              className="no-underline"
            >
              <Card className="p-5 transition-colors hover:border-[var(--admin-primary-border)] hover:bg-[var(--admin-primary-soft)]/30">
                <p className="text-sm text-[var(--admin-foreground-muted)]">
                  {kpi.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tabular-nums text-[var(--admin-foreground)]">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs text-[var(--admin-foreground-subtle)]">
                  {kpi.hint}
                </p>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>
              Common workflows for merchant onboarding and reconciliation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/onboarding"
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-muted-bg)] px-4 py-3 no-underline transition-colors hover:border-[var(--admin-primary-border)] hover:bg-[var(--admin-primary-soft)]"
            >
              <p className="text-sm font-semibold text-[var(--admin-foreground)]">
                New merchant onboarding
              </p>
              <p className="mt-0.5 text-sm text-[var(--admin-foreground-muted)]">
                4-step wizard with document mock upload
              </p>
            </Link>
            <Link
              to="/merchants"
              search={{ status: "pending", page: 1 }}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-muted-bg)] px-4 py-3 no-underline transition-colors hover:border-[var(--admin-primary-border)] hover:bg-[var(--admin-primary-soft)]"
            >
              <p className="text-sm font-semibold text-[var(--admin-foreground)]">
                Review pending merchants
              </p>
              <p className="mt-0.5 text-sm text-[var(--admin-foreground-muted)]">
                {stats.pendingMerchants} application
                {stats.pendingMerchants === 1 ? "" : "s"} awaiting decision
              </p>
            </Link>
            <Link
              to="/reconciliation"
              search={{ status: "discrepancy", page: 1 }}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-muted-bg)] px-4 py-3 no-underline transition-colors hover:border-[var(--admin-primary-border)] hover:bg-[var(--admin-primary-soft)]"
            >
              <p className="text-sm font-semibold text-[var(--admin-foreground)]">
                Resolve discrepancies
              </p>
              <p className="mt-0.5 text-sm text-[var(--admin-foreground-muted)]">
                {stats.discrepancyBatches} batch
                {stats.discrepancyBatches === 1 ? "" : "es"} need attention
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
