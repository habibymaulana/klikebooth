import { test, expect } from "@playwright/test";
test("permission failure offers retry without public upload or demo capture", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    let attempt = 0;
    navigator.mediaDevices.getUserMedia = (constraints) =>
      ++attempt === 1
        ? Promise.reject(new DOMException("Denied", "NotAllowedError"))
        : original(constraints);
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".splash")).toBeHidden();
  await page
    .getByRole("button", { name: "Enter the Booth", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Retry Camera", exact: true }),
  ).toBeVisible();
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(page.locator(".shot-slot img")).toHaveCount(0);
  await expect(page.locator(".flash")).toBeHidden();
  await expect(page.locator(".workspace")).toHaveCSS("opacity", "1");
  await page.screenshot({
    path: "tests/redesign-camera-error.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Retry Camera", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Start Photos", exact: true }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
});
test("four captured photos can be reviewed and individually retaken before editor", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".splash")).toBeHidden();
  await page
    .getByRole("button", { name: "Enter the Booth", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Start Photos", exact: true }).click();
  await expect(page.locator(".review-grid img")).toHaveCount(4, {
    timeout: 20000,
  });
  const before = await page
    .locator(".review-grid img")
    .evaluateAll((imgs) => imgs.map((im) => im.src));
  expect(before.every((src) => src.startsWith("data:image/jpeg"))).toBeTruthy();
  await page.screenshot({ path: "tests/redesign-review.png", fullPage: true });
  await page
    .getByRole("button", { name: "Retake photo 3", exact: false })
    .click();
  await page.getByRole("button", { name: "Start Photos", exact: true }).click();
  await expect(page.locator(".review-grid img")).toHaveCount(4, {
    timeout: 10000,
  });
  const after = await page
    .locator(".review-grid img")
    .evaluateAll((imgs) => imgs.map((im) => im.src));
  expect(after[0]).toBe(before[0]);
  expect(after[1]).toBe(before[1]);
  expect(after[3]).toBe(before[3]);
  expect(after[2]).not.toBe(before[2]);
  await page.getByRole("button", { name: "Continue to Art Lab" }).click();
  await expect(page.locator(".editor")).toBeVisible();
  expect(errors).toEqual([]);
});
