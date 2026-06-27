import { useState } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { AdminLayout } from "#/components/layout/admin-layout";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Select,
  Stepper,
  type StepperStep,
} from "#/components/ui";
import { saveOnboardingStep, submitOnboarding } from "#/server/onboarding";

export const Route = createFileRoute("/_admin/onboarding")({
  component: OnboardingPage,
});

const STEPS: StepperStep[] = [
  { id: "business", label: "Business", description: "Company details" },
  { id: "contact", label: "Contact", description: "Primary email" },
  { id: "documents", label: "Documents", description: "KYC uploads" },
  { id: "review", label: "Review", description: "Confirm & submit" },
];

const DOCUMENT_TYPES = [
  { value: "identity", label: "Government ID" },
  { value: "bank_statement", label: "Bank statement" },
  { value: "tax_form", label: "Tax form (optional)" },
] as const;

function OnboardingPage() {
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const saveStepFn = useServerFn(saveOnboardingStep);
  const submitFn = useServerFn(submitOnboarding);

  const [currentStep, setCurrentStep] = useState(0);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [identityFile, setIdentityFile] = useState("");
  const [bankFile, setBankFile] = useState("");
  const [taxFile, setTaxFile] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: saveStepFn,
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to save step."
      );
    },
  });

  const submitMutation = useMutation({
    mutationFn: submitFn,
    onSuccess: async (result) => {
      await router.navigate({
        to: "/merchants/$merchantId",
        params: { merchantId: result.merchantId },
      });
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to submit application."
      );
    },
  });

  async function handleNext() {
    setError(null);

    if (currentStep === 0) {
      const result = await saveMutation.mutateAsync({
        data: {
          step: 1,
          merchantId: merchantId ?? undefined,
          businessName,
          category,
        },
      });
      setMerchantId(result.merchantId);
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1) {
      if (!merchantId) return;
      await saveMutation.mutateAsync({
        data: { step: 2, merchantId, contactEmail },
      });
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!merchantId) return;
      const documents = [
        ...(identityFile
          ? [{ type: "identity" as const, fileName: identityFile }]
          : []),
        ...(bankFile
          ? [{ type: "bank_statement" as const, fileName: bankFile }]
          : []),
        ...(taxFile ? [{ type: "tax_form" as const, fileName: taxFile }] : []),
      ];

      if (!identityFile || !bankFile) {
        setError("Government ID and bank statement are required.");
        return;
      }

      await saveMutation.mutateAsync({
        data: { step: 3, merchantId, documents },
      });
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3 && merchantId) {
      await saveMutation.mutateAsync({
        data: { step: 4, merchantId },
      });
    }
  }

  function handleBack() {
    setError(null);
    setCurrentStep((step) => Math.max(0, step - 1));
  }

  const isBusy = saveMutation.isPending || submitMutation.isPending;

  return (
    <AdminLayout
      title="Merchant onboarding"
      description="Submit a new merchant application for review."
      breadcrumbs={[
        { label: "Dashboard", to: "/dashboard" },
        { label: "Onboarding" },
      ]}
      session={session}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>New merchant application</CardTitle>
            <CardDescription>
              Complete all four steps. Documents are stored as file names only
              (demo mock — no cloud upload).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <Stepper steps={STEPS} currentStep={currentStep} />

            {currentStep === 0 ? (
              <div className="space-y-4">
                <FormField
                  label="Business name"
                  htmlFor="business-name"
                  required
                >
                  <Input
                    id="business-name"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    placeholder="Acme Payments LLC"
                  />
                </FormField>
                <FormField label="Category" htmlFor="category" required>
                  <Select
                    id="category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    <option value="">Select category</option>
                    <option value="Retail">Retail</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Marketplace">Marketplace</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Logistics">Logistics</option>
                  </Select>
                </FormField>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <FormField label="Contact email" htmlFor="contact-email" required>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="finance@example.com"
                />
              </FormField>
            ) : null}

            {currentStep === 2 ? (
              <div className="space-y-4">
                {DOCUMENT_TYPES.map((docType) => {
                  const isRequired =
                    docType.value === "identity" ||
                    docType.value === "bank_statement";
                  const value =
                    docType.value === "identity"
                      ? identityFile
                      : docType.value === "bank_statement"
                      ? bankFile
                      : taxFile;
                  const setValue =
                    docType.value === "identity"
                      ? setIdentityFile
                      : docType.value === "bank_statement"
                      ? setBankFile
                      : setTaxFile;

                  return (
                    <FormField
                      key={docType.value}
                      label={docType.label}
                      htmlFor={docType.value}
                      required={isRequired}
                      hint="File name only — no upload in demo mode"
                    >
                      <Input
                        id={docType.value}
                        type="file"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          setValue(file?.name ?? "");
                        }}
                      />
                      {value ? (
                        <p className="mt-1 text-xs text-[var(--admin-foreground-muted)]">
                          Selected: {value}
                        </p>
                      ) : null}
                    </FormField>
                  );
                })}
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-muted-bg)] p-4 text-sm">
                <p className="font-semibold text-[var(--admin-foreground)]">
                  Review your application
                </p>
                <dl className="mt-3 space-y-2 text-[var(--admin-foreground-muted)]">
                  <div className="flex justify-between gap-4">
                    <dt>Business</dt>
                    <dd className="text-[var(--admin-foreground)]">
                      {businessName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Category</dt>
                    <dd className="text-[var(--admin-foreground)]">
                      {category}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Contact email</dt>
                    <dd className="text-[var(--admin-foreground)]">
                      {contactEmail}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Documents</dt>
                    <dd className="text-right text-[var(--admin-foreground)]">
                      {[identityFile, bankFile, taxFile]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-[var(--admin-foreground-subtle)]">
                  Submitting moves this application to pending review.
                </p>
              </div>
            ) : null}

            {error ? (
              <p className="text-sm text-[var(--admin-danger)]" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-between gap-3">
              <div className="flex gap-2">
                {currentStep > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isBusy}
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex h-9 items-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-sm font-semibold text-[var(--admin-foreground)] no-underline hover:bg-[var(--admin-muted-bg)]"
                  >
                    Cancel
                  </Link>
                )}
              </div>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleNext()}
                >
                  {isBusy ? "Saving…" : "Continue"}
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isBusy || !merchantId}
                  onClick={() => {
                    if (!merchantId) return;
                    setError(null);
                    submitMutation.mutate({ data: { merchantId } });
                  }}
                >
                  {submitMutation.isPending
                    ? "Submitting…"
                    : "Submit application"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
