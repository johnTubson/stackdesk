import { type ReactNode, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "#/components/ui/button";
import { cn } from "#/lib/cn";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add("app-dialog-open");
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("app-dialog-open");
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onOpenChange]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className="app-dialog-overlay" onClick={() => onOpenChange(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        data-testid="app-dialog"
        className={cn("app-dialog-panel", className)}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--admin-border)] px-6 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-[var(--admin-foreground-muted)]"
              >
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            aria-label="Close dialog"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {children ? <div className="px-6 py-4">{children}</div> : null}

        {footer ? (
          <div className="flex justify-end gap-2 border-t border-[var(--admin-border)] px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
