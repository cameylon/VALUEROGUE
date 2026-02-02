import { test, expect } from "@playwright/test";

test("login and draft care note", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("staff@ldsnexus.test");
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/care-notes");
  await page.getByRole("button", { name: "AI Suggest" }).click();
  await expect(page.getByText("AI Draft Output")).toBeVisible();
});
