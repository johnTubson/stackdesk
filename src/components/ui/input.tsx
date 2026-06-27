import { type InputHTMLAttributes, forwardRef } from "react";

import { cn } from "#/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-lg border bg-[var(--admin-surface)] px-3 py-1 text-sm text-[var(--admin-foreground)] shadow-sm transition-colors placeholder:text-[var(--admin-foreground-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        hasError
          ? "border-[var(--admin-danger)] focus-visible:ring-[var(--admin-danger)]"
          : "border-[var(--admin-border)]",
        className
      )}
      {...props}
    />
  );
});
