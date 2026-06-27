import { cn } from "#/lib/cn";

export type MerchantStatus = "draft" | "pending" | "approved" | "rejected";
export type BatchStatus = "open" | "matched" | "discrepancy" | "resolved";

type StatusBadgeProps = {
  status: MerchantStatus | BatchStatus;
  className?: string;
};

const merchantStyles: Record<MerchantStatus, string> = {
  draft:
    "bg-[var(--admin-muted-bg)] text-[var(--admin-foreground-muted)] border-[var(--admin-border)]",
  pending:
    "border-[color-mix(in_srgb,var(--admin-warning)_30%,var(--admin-border))] bg-[color-mix(in_srgb,var(--admin-warning)_12%,var(--admin-surface))] text-[var(--admin-warning)]",
  approved:
    "border-[color-mix(in_srgb,var(--admin-success)_30%,var(--admin-border))] bg-[color-mix(in_srgb,var(--admin-success)_12%,var(--admin-surface))] text-[var(--admin-success)]",
  rejected:
    "bg-[var(--admin-danger-bg)] text-[var(--admin-danger)] border-[var(--admin-danger-border)]",
};

const batchStyles: Record<BatchStatus, string> = {
  open: "bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] border-[var(--admin-primary-border)]",
  matched:
    "border-[color-mix(in_srgb,var(--admin-success)_30%,var(--admin-border))] bg-[color-mix(in_srgb,var(--admin-success)_12%,var(--admin-surface))] text-[var(--admin-success)]",
  discrepancy:
    "border-[color-mix(in_srgb,var(--admin-warning)_30%,var(--admin-border))] bg-[color-mix(in_srgb,var(--admin-warning)_12%,var(--admin-surface))] text-[var(--admin-warning)]",
  resolved:
    "bg-[var(--admin-muted-bg)] text-[var(--admin-foreground-muted)] border-[var(--admin-border)]",
};

const labels: Record<MerchantStatus | BatchStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  open: "Open",
  matched: "Matched",
  discrepancy: "Discrepancy",
  resolved: "Resolved",
};

function isMerchantStatus(
  status: MerchantStatus | BatchStatus
): status is MerchantStatus {
  return (
    status === "draft" ||
    status === "pending" ||
    status === "approved" ||
    status === "rejected"
  );
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = isMerchantStatus(status)
    ? merchantStyles[status]
    : batchStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
