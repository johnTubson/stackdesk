import type { HTMLAttributes } from "react";

import { cn } from "#/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-b border-[var(--admin-border)] px-5 py-4",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-semibold text-[var(--admin-foreground)]",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-[var(--admin-foreground-muted)]", className)}
      {...props}
    />
  );
}

type CardContentProps = HTMLAttributes<HTMLDivElement> & {
  flush?: boolean;
};

export function CardContent({
  flush = false,
  className,
  ...props
}: CardContentProps) {
  return (
    <div className={cn(flush ? "p-0" : "px-5 py-4", className)} {...props} />
  );
}

export function CardToolbar({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-muted-bg)] px-5 py-3",
        className
      )}
      {...props}
    />
  );
}

export function CardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center border-t border-[var(--admin-border)] bg-[var(--admin-muted-bg)] px-5 py-3",
        className
      )}
      {...props}
    />
  );
}
