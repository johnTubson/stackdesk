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
import { merchantListSearchSchema } from "#/lib/validators";
import { listMerchants } from "#/server/merchants";

export const Route = createFileRoute("/_admin/merchants/")({
  validateSearch: (search) => merchantListSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listMerchants({ data: deps }),
  errorComponent: MerchantsError,
  component: MerchantsPage,
});

function MerchantsError({ error }: { error: Error }) {
  const { session } = Route.useRouteContext();
  const message =
    error instanceof ZodError
      ? "Invalid merchant filters. Check the status and page search params."
      : error.message;

  return (
    <AdminLayout
      title="Merchants"
      breadcrumbs={[{ label: "Merchants" }]}
      session={session}
    >
      <Card>
        <CardHeader>
          <CardTitle>Unable to load merchants</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/merchants"
            search={{ status: "all", page: 1 }}
            className="text-sm font-semibold text-[var(--admin-primary)] no-underline hover:underline"
          >
            Reset filters
          </Link>
        </CardContent>
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

function MerchantsPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const { session } = Route.useRouteContext();
  const navigate = Route.useNavigate();

  return (
    <AdminLayout
      title="Merchants"
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Merchants" },
      ]}
      session={session}
    >
      <Card>
        <CardHeader>
          <CardTitle>Merchant applications</CardTitle>
          <CardDescription>
            Filter by status. Search params are validated with Zod.
          </CardDescription>
        </CardHeader>

        <CardToolbar>
          <div className="min-w-[12rem]">
            <label
              htmlFor="status-filter"
              className="mb-1.5 block text-xs font-medium text-[var(--admin-foreground-muted)]"
            >
              Status
            </label>
            <Select
              id="status-filter"
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
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
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
                <TableHead>Business</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-[var(--admin-foreground-muted)]"
                  >
                    No merchants match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((merchant) => (
                  <TableRow key={merchant.id}>
                    <TableCell className="font-medium">
                      {merchant.businessName}
                    </TableCell>
                    <TableCell>{merchant.category ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={merchant.status} />
                    </TableCell>
                    <TableCell>{formatDate(merchant.submittedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        to="/merchants/$merchantId"
                        params={{ merchantId: merchant.id }}
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
                navigate({
                  search: { ...search, page: search.page - 1 },
                })
              }
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={search.page >= data.totalPages}
              onClick={() =>
                navigate({
                  search: { ...search, page: search.page + 1 },
                })
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
