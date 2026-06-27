import { Check } from "lucide-react";

import { cn } from "#/lib/cn";

export type StepperStep = {
  id: string;
  label: string;
  description?: string;
};

export type StepperProps = {
  steps: StepperStep[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  className?: string;
};

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  className,
}: StepperProps) {
  return (
    <nav aria-label="Progress" className={cn("w-full", className)}>
      <ol className="flex items-start gap-0">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && index <= currentStep;

          return (
            <li
              key={step.id}
              className={cn(
                "flex min-w-0 flex-1 items-start",
                index < steps.length - 1 && "pr-2"
              )}
            >
              <div className="flex w-full min-w-0 flex-col items-center">
                <div className="flex w-full items-center">
                  {isClickable ? (
                    <button
                      type="button"
                      onClick={() => onStepClick(index)}
                      className="group flex flex-col items-center gap-2 focus-visible:outline-none"
                    >
                      <StepIndicator
                        index={index}
                        isComplete={isComplete}
                        isCurrent={isCurrent}
                      />
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <StepIndicator
                        index={index}
                        isComplete={isComplete}
                        isCurrent={isCurrent}
                      />
                    </div>
                  )}

                  {index < steps.length - 1 ? (
                    <div
                      aria-hidden
                      className={cn(
                        "mx-2 mt-4 h-0.5 flex-1 rounded-full",
                        isComplete
                          ? "bg-[var(--admin-primary)]"
                          : "bg-[var(--admin-border)]"
                      )}
                    />
                  ) : null}
                </div>

                <div className="mt-3 w-full px-1 text-center">
                  <p
                    className={cn(
                      "text-xs font-semibold",
                      isCurrent
                        ? "text-[var(--admin-primary)]"
                        : isComplete
                        ? "text-[var(--admin-foreground)]"
                        : "text-[var(--admin-foreground-muted)]"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description ? (
                    <p className="mt-0.5 hidden text-xs text-[var(--admin-foreground-subtle)] sm:block">
                      {step.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function StepIndicator({
  index,
  isComplete,
  isCurrent,
}: {
  index: number;
  isComplete: boolean;
  isCurrent: boolean;
}) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
        isComplete &&
          "border-[var(--admin-primary)] bg-[var(--admin-primary)] text-white",
        isCurrent &&
          !isComplete &&
          "border-[var(--admin-primary)] bg-[var(--admin-primary-soft)] text-[var(--admin-primary)]",
        !isComplete &&
          !isCurrent &&
          "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-foreground-muted)]"
      )}
    >
      {isComplete ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
    </span>
  );
}
