import { useState } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AdminLayout } from "#/components/layout/admin-layout";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  FormField,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from "#/components/ui";
import { formatMoney } from "#/lib/format";
import { getBatch, resolveDiscrepancy } from "#/server/reconciliation";

export const Route = createFileRoute("/_admin/reconciliation/$batchId")({
  loader: ({ params }) => getBatch({ data: { batchId: params.batchId } }),
  component: BatchDetailPage,
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

function BatchDetailPage() {
  const data = Route.useLoaderData();
  const { session, queryClient } = Route.useRouteContext();
  const router = useRouter();
  const { batchId } = Route.useParams();
  const resolveFn = useServerFn(resolveDiscrepancy);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const resolveMutation = useMutation({
    mutationFn: (reviewNote: string) =>
      resolveFn({ data: { batchId, note: reviewNote } }),
    onSuccess: async () => {
      setDialogOpen(false);
      setNote("");
      setFormError(null);
      await queryClient.invalidateQueries();
      await router.invalidate();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Unable to resolve batch."
      );
    },
  });

  const { batch, transactions, transactionSum, hasDiscrepancy, difference } =
    data;
  const canResolve = batch.status === "discrepancy";

  function submitResolve() {
    if (!note.trim()) {
      setFormError("A resolution note is required.");
      return;
    }
    resolveMutation.mutate(note.trim());
  }

  return (
    <AdminLayout
      title={batch.reference}
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Reconciliation", to: "/reconciliation" },
        { label: batch.reference },
      ]}
      session={session}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{batch.reference}</CardTitle>
              <CardDescription>
                Created {formatDate(batch.createdAt)}
              </CardDescription>
            </div>
            <StatusBadge status={batch.status} />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[var(--admin-foreground-muted)] uppercase">
                Batch total
              </p>
              <p className="text-lg font-semibold tabular-nums text-[var(--admin-foreground)]">
                {formatMoney(batch.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-[var(--admin-foreground-muted)] uppercase">
                Transaction sum
              </p>
              <p className="text-lg font-semibold tabular-nums text-[var(--admin-foreground)]">
                {formatMoney(transactionSum)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-[var(--admin-foreground-muted)] uppercase">
                Difference
              </p>
              <p
                className={
                  hasDiscrepancy
                    ? "text-lg font-semibold tabular-nums text-[var(--admin-warning)]"
                    : "text-lg font-semibold tabular-nums text-[var(--admin-success)]"
                }
              >
                {hasDiscrepancy ? formatMoney(difference) : "Matched"}
              </p>
            </div>
          </CardContent>
        </Card>

        {hasDiscrepancy ? (
          <Card className="border-[color-mix(in_srgb,var(--admin-warning)_40%,var(--admin-border))] bg-[color-mix(in_srgb,var(--admin-warning)_8%,var(--admin-surface))]">
            <CardHeader>
              <CardTitle>Discrepancy detected</CardTitle>
              <CardDescription>
                Transaction sum does not match the batch total. Review
                transactions below and resolve when corrected.
              </CardDescription>
            </CardHeader>
            {canResolve ? (
              <CardContent>
                <Button onClick={() => setDialogOpen(true)}>
                  Resolve discrepancy
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {transactions.length} transaction
              {transactions.length === 1 ? "" : "s"} in this batch
            </CardDescription>
          </CardHeader>
          <CardContent flush>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-[var(--admin-foreground-muted)]"
                    >
                      No transactions linked to this batch.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-medium">
                        {txn.reference}
                      </TableCell>
                      <TableCell>{formatMoney(txn.amount)}</TableCell>
                      <TableCell className="capitalize">{txn.status}</TableCell>
                      <TableCell>{formatDate(txn.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {data.activity.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Batch activity</CardTitle>
            </CardHeader>
            <CardContent flush>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.activity.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.action}</TableCell>
                      <TableCell>{entry.actorName ?? "System"}</TableCell>
                      <TableCell>{formatDate(entry.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        <Link
          to="/reconciliation"
          search={{ status: "all", page: 1 }}
          className="inline-flex text-sm font-semibold text-[var(--admin-primary)] no-underline hover:underline"
        >
          Back to reconciliation
        </Link>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Resolve discrepancy"
        description="Document how this batch discrepancy was handled. Status moves to resolved."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={resolveMutation.isPending}
              onClick={submitResolve}
            >
              {resolveMutation.isPending ? "Saving…" : "Confirm resolution"}
            </Button>
          </>
        }
      >
        <FormField
          label="Resolution note"
          htmlFor="resolve-note"
          required
          error={formError ?? undefined}
        >
          <Textarea
            id="resolve-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Explain the adjustment or root cause…"
            hasError={Boolean(formError)}
          />
        </FormField>
      </Dialog>
    </AdminLayout>
  );
}
