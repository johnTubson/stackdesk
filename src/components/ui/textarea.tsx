import { type TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "#/lib/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, hasError, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "min-h-[88px] w-full resize-none rounded-lg border bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-foreground)] shadow-sm transition-colors placeholder:text-[var(--admin-foreground-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ring)] disabled:cursor-not-allowed disabled:opacity-50",
          hasError
            ? "border-[var(--admin-danger)] focus-visible:ring-[var(--admin-danger)]"
            : "border-[var(--admin-border)]",
          className
        )}
        {...props}
      />
    );
  }
);
