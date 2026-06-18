const { test, expect } = require("@playwright/test");

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Flowlog にログイン")).toBeVisible();
});

test("landing page renders service overview", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Flowlog").first()).toBeVisible();
  await expect(page.getByText("個人用ログ管理サービス")).toBeVisible();
});
