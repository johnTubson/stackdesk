import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "#/lib/cn";

const variants = {
  primary:
    "border-[var(--admin-primary-border)] bg-[var(--admin-primary)] text-white hover:bg-[var(--admin-primary-hover)]",
  secondary:
    "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-foreground)] hover:bg-[var(--admin-muted-bg)]",
  ghost:
    "border-transparent bg-transparent text-[var(--admin-foreground-muted)] hover:bg-[var(--admin-muted-bg)] hover:text-[var(--admin-foreground)]",
  danger:
    "border-[var(--admin-danger-border)] bg-[var(--admin-danger-bg)] text-[var(--admin-danger)] hover:bg-[var(--admin-danger-bg-hover)]",
} as const;

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-5 text-sm",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
