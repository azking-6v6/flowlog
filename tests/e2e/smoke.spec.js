const { test, expect } = require("@playwright/test");

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Flowlog にログイン")).toBeVisible();
});

test("home page renders app title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Flowlog").first()).toBeVisible();
});
