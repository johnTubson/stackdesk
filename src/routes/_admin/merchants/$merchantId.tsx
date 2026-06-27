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
import {
  approveMerchant,
  getMerchant,
  rejectMerchant,
} from "#/server/merchants";

export const Route = createFileRoute("/_admin/merchants/$merchantId")({
  loader: ({ params }) =>
    getMerchant({ data: { merchantId: params.merchantId } }),
  component: MerchantDetailPage,
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

function MerchantDetailPage() {
  const data = Route.useLoaderData();
  const { session, queryClient } = Route.useRouteContext();
  const router = useRouter();
  const { merchantId } = Route.useParams();
  const approveFn = useServerFn(approveMerchant);
  const rejectFn = useServerFn(rejectMerchant);

  const [dialogMode, setDialogMode] = useState<"approve" | "reject" | null>(
    null
  );
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const reviewMutation = useMutation({
    mutationFn: async ({
      mode,
      reviewNote,
    }: {
      mode: "approve" | "reject";
      reviewNote: string;
    }) => {
      const payload = { merchantId, note: reviewNote };
      if (mode === "approve") {
        return approveFn({ data: payload });
      }
      return rejectFn({ data: payload });
    },
    onSuccess: async () => {
      setDialogMode(null);
      setNote("");
      setFormError(null);
      await queryClient.invalidateQueries();
      await router.invalidate();
    },
    onError: (error) => {
      setFormError(
        error instanceof Error ? error.message : "Review action failed."
      );
    },
  });

  const { merchant, documents, activity } = data;
  const canReview = merchant.status === "pending";

  function openDialog(mode: "approve" | "reject") {
    setDialogMode(mode);
    setNote("");
    setFormError(null);
  }

  function submitReview() {
    if (!note.trim()) {
      setFormError("A reviewer note is required.");
      return;
    }

    if (!dialogMode) return;

    reviewMutation.mutate({ mode: dialogMode, reviewNote: note.trim() });
  }

  return (
    <AdminLayout
      title={merchant.businessName}
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Merchants", to: "/merchants" },
        { label: merchant.businessName },
      ]}
      session={session}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{merchant.businessName}</CardTitle>
              <CardDescription>
                {merchant.category ?? "Uncategorized"} ·{" "}
                {merchant.contactEmail ?? "No contact email"}
              </CardDescription>
            </div>
            <StatusBadge status={merchant.status} />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[var(--admin-foreground-muted)] uppercase">
                Submitted
              </p>
              <p className="text-sm text-[var(--admin-foreground)]">
                {formatDate(merchant.submittedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-[var(--admin-foreground-muted)] uppercase">
                Created
              </p>
              <p className="text-sm text-[var(--admin-foreground)]">
                {formatDate(merchant.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {canReview ? (
          <Card>
            <CardHeader>
              <CardTitle>Review decision</CardTitle>
              <CardDescription>
                Approve or reject this application. Every decision writes an
                audit log entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => openDialog("approve")}>
                Approve merchant
              </Button>
              <Button variant="danger" onClick={() => openDialog("reject")}>
                Reject merchant
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Uploaded KYC files for this merchant.
            </CardDescription>
          </CardHeader>
          <CardContent flush>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-[var(--admin-foreground-muted)]"
                    >
                      No documents uploaded.
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="capitalize">
                        {document.type.replace("_", " ")}
                      </TableCell>
                      <TableCell>{document.fileName}</TableCell>
                      <TableCell>{formatDate(document.uploadedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit activity</CardTitle>
            <CardDescription>
              Immutable status change history for this merchant.
            </CardDescription>
          </CardHeader>
          <CardContent flush>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-[var(--admin-foreground-muted)]"
                    >
                      No audit entries yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  activity.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.action}</TableCell>
                      <TableCell>{entry.actorName ?? "System"}</TableCell>
                      <TableCell>
                        {typeof entry.metadata?.note === "string"
                          ? entry.metadata.note
                          : "—"}
                      </TableCell>
                      <TableCell>{formatDate(entry.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Link
          to="/merchants"
          search={{ status: "all", page: 1 }}
          className="inline-flex text-sm font-semibold text-[var(--admin-primary)] no-underline hover:underline"
        >
          Back to merchants
        </Link>
      </div>

      <Dialog
        open={dialogMode !== null}
        onOpenChange={(open) => {
          if (!open) setDialogMode(null);
        }}
        title={
          dialogMode === "approve" ? "Approve merchant" : "Reject merchant"
        }
        description="Add a reviewer note. This will be stored in the audit log."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDialogMode(null)}>
              Cancel
            </Button>
            <Button
              variant={dialogMode === "reject" ? "danger" : "primary"}
              disabled={reviewMutation.isPending}
              onClick={submitReview}
            >
              {reviewMutation.isPending ? "Saving…" : "Confirm"}
            </Button>
          </>
        }
      >
        <FormField
          label="Reviewer note"
          htmlFor="review-note"
          required
          error={formError ?? undefined}
        >
          <Textarea
            id="review-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Document the reason for this decision…"
            hasError={Boolean(formError)}
          />
        </FormField>
      </Dialog>
    </AdminLayout>
  );
}
