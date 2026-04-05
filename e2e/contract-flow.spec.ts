import { test, expect } from "@playwright/test";

test.describe("Contract Flow E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Use demo/test credentials seeded in staging environment
    await page.goto("/login");
    await page.fill('[name="email"]', process.env.E2E_USER_EMAIL ?? "demo@contractflow.app");
    await page.fill('[name="password"]', process.env.E2E_USER_PASSWORD ?? "demo-password-123");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");
  });

  test("dashboard loads with key metrics", async ({ page }) => {
    await expect(page.locator("h1", { hasText: /dashboard/i })).toBeVisible();
    await expect(page.locator("text=Active Contracts")).toBeVisible();
    await expect(page.locator("text=Pending Signatures")).toBeVisible();
  });

  test("can create a new contract", async ({ page }) => {
    await page.goto("/contracts/new");
    await expect(page.locator("h1", { hasText: /new contract/i })).toBeVisible();

    await page.fill('[name="title"]', "E2E Test NDA");
    await page.fill('[name="counterparty_name"]', "Acme Corp");
    await page.fill('[name="counterparty_email"]', "legal@acme.com");

    // Select contract type
    await page.click("text=NDA");

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/contracts\/.+/);
    await expect(page.locator("text=E2E Test NDA")).toBeVisible();
  });

  test("can view contract detail page", async ({ page }) => {
    await page.goto("/contracts");
    const firstContract = page.locator("[data-testid='contract-card']").first();
    if (await firstContract.isVisible()) {
      await firstContract.click();
      await expect(page.url()).toMatch(/\/contracts\/.+/);
      await expect(page.locator("text=Status")).toBeVisible();
    }
  });

  test("can navigate to templates page", async ({ page }) => {
    await page.goto("/templates");
    await expect(page.locator("h1", { hasText: /templates/i })).toBeVisible();
    await expect(page.locator("text=Standard NDA")).toBeVisible();
  });

  test("can navigate to billing page", async ({ page }) => {
    await page.goto("/billing");
    await expect(page.locator("h1", { hasText: /billing/i })).toBeVisible();
    await expect(page.locator("text=Current Plan")).toBeVisible();
  });

  test("unauthenticated redirect to login", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/dashboard");
    await expect(page.url()).toContain("/login");
    await context.close();
  });
});