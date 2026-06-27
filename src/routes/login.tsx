import { useState } from "react";
import {
  Link,
  createFileRoute,
  isRedirect,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
} from "#/components/ui";
import { login } from "#/server/auth";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: (search) => loginSearchSchema.parse(search),
  beforeLoad: async ({ context, search }) => {
    if (context.session) {
      throw redirect({ to: search.redirect ?? "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const { redirect: redirectTo } = Route.useSearch();
  const loginFn = useServerFn(login);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      await loginFn({ data: { email, password } });
      await router.invalidate();
      await router.navigate({ to: redirectTo ?? "/dashboard" });
    } catch (submitError) {
      if (isRedirect(submitError)) {
        await router.invalidate();
        throw submitError;
      }
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to sign in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-shell flex min-h-screen items-center justify-center bg-[var(--admin-bg)] p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to StackDesk</CardTitle>
          <CardDescription>
            Demo accounts are pre-seeded. Use{" "}
            <code>reviewer@stackdesk.demo</code> or{" "}
            <code>admin@stackdesk.demo</code> with password{" "}
            <code>demo1234</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" method="post" onSubmit={handleSubmit}>
            <FormField label="Email" htmlFor="email" required>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </FormField>

            <FormField label="Password" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </FormField>

            {error ? (
              <p className="text-sm text-[var(--admin-danger)]" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-[var(--admin-foreground-muted)]">
            <Link
              to="/"
              className="text-[var(--admin-primary)] no-underline hover:underline"
            >
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
