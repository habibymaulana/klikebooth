import { test, expect } from "@playwright/test";
for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
]) {
  test(`little happy studio home and direct camera ${viewport.width}`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".splash")).toBeHidden();
    await expect(page.locator(".mascot-scene")).toBeVisible();
    await expect(page.locator(".mascot-booth")).toHaveCount(0);
    await expect(page.locator(".hero-frame")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `tests/hero-refined-${viewport.width}.png`,
      fullPage: true,
    });
    await page
      .locator(".hero")
      .getByRole("button", { name: "Enter the Booth", exact: true })
      .click();
    await expect(page.locator("video")).toBeVisible();
    await expect(page.locator(".flash")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Start Photos", exact: true }),
    ).toBeEnabled();
    await expect(page.locator(".shot-slot")).toHaveCount(4);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: `tests/redesign-camera-${viewport.width}.png`,
      fullPage: true,
    });
    await expect(page.locator("input[type=file]")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Change frame", exact: false })
      .click();
    await expect(page.locator(".studio-card")).toHaveCount(16);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    expect(errors).toEqual([]);
  });
}
