import { type SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "#/lib/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, hasError, children, ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-9 w-full appearance-none rounded-lg border bg-[var(--admin-surface)] px-3 py-1 pr-9 text-sm text-[var(--admin-foreground)] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ring)] disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-[var(--admin-danger)] focus-visible:ring-[var(--admin-danger)]"
              : "border-[var(--admin-border)]",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[var(--admin-foreground-muted)]"
        />
      </div>
    );
  }
);
