import { Link, createFileRoute, redirect } from "@tanstack/react-router";

import { AdminLayout } from "#/components/layout/admin-layout";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui";
import { auditListSearchSchema } from "#/lib/validators";
import { listAuditLogs } from "#/server/audit";

export const Route = createFileRoute("/_admin/audit/")({
  validateSearch: (search) => auditListSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  beforeLoad: ({ context }) => {
    if (context.session.role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: ({ deps }) => listAuditLogs({ data: deps }),
  component: AuditPage,
});

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function AuditPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const { session } = Route.useRouteContext();
  const navigate = Route.useNavigate();

  return (
    <AdminLayout
      title="Audit log"
      description="Immutable activity across merchants and batches."
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Audit log" },
      ]}
      session={session}
    >
      <Card>
        <CardHeader>
          <CardTitle>System audit trail</CardTitle>
          <CardDescription>
            Admin-only view. {data.total} entries recorded.
          </CardDescription>
        </CardHeader>

        <CardContent flush>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-[var(--admin-foreground-muted)]"
                  >
                    No audit entries yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.action}
                    </TableCell>
                    <TableCell>
                      <span className="text-[var(--admin-foreground-muted)]">
                        {entry.entityType}
                      </span>
                      <span className="mt-0.5 block font-mono text-xs text-[var(--admin-foreground-subtle)]">
                        {entry.entityId.slice(0, 8)}…
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.actorName ?? "System"}
                      {entry.actorEmail ? (
                        <span className="mt-0.5 block text-xs text-[var(--admin-foreground-muted)]">
                          {entry.actorEmail}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {typeof entry.metadata?.note === "string"
                        ? entry.metadata.note
                        : typeof entry.metadata?.nextStatus === "string"
                        ? `→ ${entry.metadata.nextStatus}`
                        : "—"}
                    </TableCell>
                    <TableCell>{formatDate(entry.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        <CardFooter className="justify-between">
          <p className="text-sm text-[var(--admin-foreground-muted)]">
            Page {data.page} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={search.page <= 1}
              onClick={() => navigate({ search: { page: search.page - 1 } })}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={search.page >= data.totalPages}
              onClick={() => navigate({ search: { page: search.page + 1 } })}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      <p className="mt-4 text-sm text-[var(--admin-foreground-muted)]">
        <Link
          to="/merchants"
          search={{ status: "all", page: 1 }}
          className="font-semibold text-[var(--admin-primary)] no-underline hover:underline"
        >
          View merchants
        </Link>{" "}
        for per-merchant activity on detail pages.
      </p>
    </AdminLayout>
  );
}
