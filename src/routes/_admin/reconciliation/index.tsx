import { Link, createFileRoute } from "@tanstack/react-router";
import { ZodError } from "zod";

import { AdminLayout } from "#/components/layout/admin-layout";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardToolbar,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui";
import { formatMoney } from "#/lib/format";
import { batchListSearchSchema } from "#/lib/validators";
import { listBatches } from "#/server/reconciliation";

export const Route = createFileRoute("/_admin/reconciliation/")({
  validateSearch: (search) => batchListSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listBatches({ data: deps }),
  errorComponent: ReconciliationError,
  component: ReconciliationPage,
});

function ReconciliationError({ error }: { error: Error }) {
  const { session } = Route.useRouteContext();
  const message =
    error instanceof ZodError
      ? "Invalid batch filters. Check the status and page search params."
      : error.message;

  return (
    <AdminLayout
      title="Reconciliation"
      breadcrumbs={[{ label: "Reconciliation" }]}
      session={session}
    >
      <Card>
        <CardHeader>
          <CardTitle>Unable to load batches</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </AdminLayout>
  );
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function ReconciliationPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const { session } = Route.useRouteContext();
  const navigate = Route.useNavigate();

  return (
    <AdminLayout
      title="Reconciliation"
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Reconciliation" },
      ]}
      session={session}
    >
      <Card>
        <CardHeader>
          <CardTitle>Payout batches</CardTitle>
          <CardDescription>
            Compare batch totals against settled transaction sums.
          </CardDescription>
        </CardHeader>

        <CardToolbar>
          <div className="min-w-[12rem]">
            <label
              htmlFor="batch-status-filter"
              className="mb-1.5 block text-xs font-medium text-[var(--admin-foreground-muted)]"
            >
              Status
            </label>
            <Select
              id="batch-status-filter"
              value={search.status}
              onChange={(event) =>
                navigate({
                  search: {
                    status: event.target.value as typeof search.status,
                    page: 1,
                  },
                })
              }
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="matched">Matched</option>
              <option value="discrepancy">Discrepancy</option>
              <option value="resolved">Resolved</option>
            </Select>
          </div>
          <p className="text-sm text-[var(--admin-foreground-muted)]">
            {data.total} total
          </p>
        </CardToolbar>

        <CardContent flush>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Batch total</TableHead>
                <TableHead>Txn sum</TableHead>
                <TableHead>Delta</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-[var(--admin-foreground-muted)]"
                  >
                    No batches match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      {batch.reference}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={batch.status} />
                    </TableCell>
                    <TableCell>{formatMoney(batch.totalAmount)}</TableCell>
                    <TableCell>{formatMoney(batch.transactionSum)}</TableCell>
                    <TableCell>
                      {batch.hasDiscrepancy ? (
                        <span className="font-medium text-[var(--admin-warning)]">
                          {formatMoney(batch.difference)}
                        </span>
                      ) : (
                        <span className="text-[var(--admin-success)]">—</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(batch.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        to="/reconciliation/$batchId"
                        params={{ batchId: batch.id }}
                        className="text-sm font-semibold text-[var(--admin-primary)] no-underline hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
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
              onClick={() =>
                navigate({ search: { ...search, page: search.page - 1 } })
              }
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={search.page >= data.totalPages}
              onClick={() =>
                navigate({ search: { ...search, page: search.page + 1 } })
              }
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    </AdminLayout>
  );
}
