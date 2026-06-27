import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { cn } from "#/lib/cn";

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-1"
            >
              {index > 0 ? (
                <ChevronRight
                  aria-hidden
                  className="h-4 w-4 text-[var(--admin-foreground-subtle)]"
                />
              ) : null}

              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="font-medium text-[var(--admin-foreground-muted)] no-underline transition-colors hover:text-[var(--admin-primary)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "font-medium",
                    isLast
                      ? "text-[var(--admin-foreground)]"
                      : "text-[var(--admin-foreground-muted)]"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
