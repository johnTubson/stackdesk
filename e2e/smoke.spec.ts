import { expect, test, type Locator } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

/** Retry until React hydration finishes and the value sticks in the DOM. */
async function fillHydratedInput(locator: Locator, value: string) {
  await expect(locator).toBeEditable();

  await expect(async () => {
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  }).toPass({ timeout: 10_000 });
}

async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
  password = "demo1234"
) {
  const isAdmin = email === "admin@stackdesk.demo";

  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Sign in to StackDesk" })
  ).toBeVisible();

  await fillHydratedInput(page.getByLabel("Email"), email);
  await fillHydratedInput(page.getByLabel("Password"), password);

  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const auditLink = page
    .getByRole("navigation", { name: "Admin" })
    .getByRole("link", { name: "Audit log" });

  if (isAdmin) {
    await expect(auditLink).toBeVisible({ timeout: 10_000 });
  } else {
    await expect(auditLink).toHaveCount(0);
  }
}

async function openDialog(
  page: import("@playwright/test").Page,
  buttonName: string,
  fieldLabel: string
) {
  const button = page.getByRole("button", { name: buttonName });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await button.scrollIntoViewIfNeeded();
    await button.click();

    try {
      await expect(page.getByLabel(fieldLabel)).toBeVisible({ timeout: 5_000 });
      return;
    } catch {
      // Retry click if hydration or overlay blocked the first attempt.
    }
  }

  await expect(page.getByLabel(fieldLabel)).toBeVisible({ timeout: 15_000 });
}

test.describe("StackDesk", () => {
  test("home redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Sign in to StackDesk" })
    ).toBeVisible();
  });

  test("unauthenticated dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "Sign in to StackDesk" })
    ).toBeVisible();
  });

  test("reviewer can login and view merchants", async ({ page }) => {
    await loginAs(page, "reviewer@stackdesk.demo");
    await page
      .getByRole("navigation", { name: "Admin" })
      .getByRole("link", { name: "Merchants" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Merchant applications" })
    ).toBeVisible();
  });

  test("reviewer cannot access audit log", async ({ page }) => {
    await loginAs(page, "reviewer@stackdesk.demo");
    await page.goto("/audit");
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Admin" }).getByRole("link", {
        name: "Audit log",
      })
    ).toHaveCount(0);
  });
});

test.describe("Reconciliation workflow", () => {
  test("reviewer can resolve discrepancy batch", async ({ page }) => {
    await loginAs(page, "reviewer@stackdesk.demo");

    await page.goto("/reconciliation?status=discrepancy&page=1");

    await expect(
      page.getByRole("heading", { name: "Payout batches" })
    ).toBeVisible();

    await page
      .locator("tr", { hasText: "BATCH-2026-003" })
      .getByRole("link", { name: "View" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Discrepancy detected" })
    ).toBeVisible();

    await openDialog(page, "Resolve discrepancy", "Resolution note");
    await page
      .getByLabel("Resolution note")
      .fill("Variance accepted after manual adjustment.");
    await page.getByRole("button", { name: "Confirm resolution" }).click();

    await expect(
      page.locator("main").getByText("Resolved", { exact: true })
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("Merchant review workflow", () => {
  test("admin can approve merchant and view audit entry", async ({ page }) => {
    await loginAs(page, "admin@stackdesk.demo");

    await page.goto("/merchants?status=pending&page=1");

    await page
      .locator("tr", { has: page.getByText("Pending", { exact: true }) })
      .first()
      .getByRole("link", { name: "View" })
      .click();

    await expect(
      page.getByRole("button", { name: "Approve merchant" })
    ).toBeVisible({ timeout: 15_000 });

    await openDialog(page, "Approve merchant", "Reviewer note");
    await page.getByLabel("Reviewer note").fill("Approved during e2e test.");
    await page.getByRole("button", { name: "Confirm" }).click();
    await expect(
      page.locator("main").getByText("Approved", { exact: true })
    ).toBeVisible({ timeout: 15_000 });

    await page
      .getByRole("navigation", { name: "Admin" })
      .getByRole("link", { name: "Audit log" })
      .click();

    await expect(
      page.getByRole("heading", { name: "System audit trail" })
    ).toBeVisible();
    await expect(page.getByText("merchant.approved").first()).toBeVisible();
  });
});
