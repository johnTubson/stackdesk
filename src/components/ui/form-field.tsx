import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useId,
} from "react";

import { cn } from "#/lib/cn";

export type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  const errorId = useId();
  const hintId = useId();
  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: htmlFor,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
        hasError: Boolean(error),
      })
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-[var(--admin-foreground)]"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-[var(--admin-danger)]" aria-hidden>
            *
          </span>
        ) : null}
      </label>

      {control}

      {hint ? (
        <p id={hintId} className="text-xs text-[var(--admin-foreground-muted)]">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-[var(--admin-danger)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
