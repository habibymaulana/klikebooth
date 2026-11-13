import { test, expect } from "@playwright/test";
test("four-photo camera, effects, customization and PNG export", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/?diagnostics=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".splash")).toBeHidden({ timeout: 10000 });
  await page.getByRole("button", { name: "Frames", exact: true }).click();
  await expect(page.locator(".studio-card")).toHaveCount(16);
  await expect(page.locator(".studio-card").first()).toContainText("Pop Memo");
  await page
    .getByRole("button", { name: "Kawaii & Cute", exact: true })
    .click();
  await expect(page.locator(".studio-card")).toHaveCount(2);
  await page.getByRole("button", { name: "All frames", exact: true }).click();
  await page.getByRole("button", { name: "Continue to camera" }).click();
  await page.getByRole("button", { name: "Start Photos", exact: true }).click();
  await page
    .getByRole("button", { name: "Continue to Art Lab", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A little extra you." }),
  ).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Monochrome", exact: true }).click();
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await expect(page.getByPlaceholder("Your own little message…")).toHaveValue(
    "",
  );
  await page
    .getByPlaceholder("Your own little message…")
    .fill("Happy with Killo");
  await page.getByRole("button", { name: "Stickers", exact: true }).click();
  await page.getByRole("button", { name: "♡", exact: true }).click();
  await page.screenshot({
    path: "tests/audit-editor-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Keep this moment" }).click();
  await expect(
    page.getByAltText("Hasil final 4 foto klikebooth"),
  ).toBeVisible();
  const dl = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download PNG" }).click();
  expect((await dl).suggestedFilename()).toBe("klikebooth.png");
  await page.screenshot({ path: "tests/result-desktop.png", fullPage: true });
});
test("mobile studio fits viewport and upload fallback works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?diagnostics=1", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".splash")).toBeHidden({ timeout: 10000 });
  await page.getByRole("button", { name: "Frames", exact: true }).click();
  await expect(page.locator(".studio-card")).toHaveCount(16);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({ path: "tests/studio-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Continue to camera" }).click();
  await page.screenshot({
    path: "tests/audit-camera-mobile.png",
    fullPage: true,
  });
  const files = await page.evaluate(() =>
    [0, 1, 2, 3].map((i) => {
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 480;
      const ctx = c.getContext("2d");
      ctx.fillStyle = ["red", "blue", "green", "orange"][i];
      ctx.fillRect(0, 0, 640, 480);
      return c.toDataURL("image/png").split(",")[1];
    }),
  );
  await page.getByLabel("Upload 4 photos").setInputFiles(
    files.map((f, i) => ({
      name: `photo-${i}.png`,
      mimeType: "image/png",
      buffer: Buffer.from(f, "base64"),
    })),
  );
  await expect(
    page.getByRole("heading", { name: "A little extra you." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Stickers", exact: true }).click();
  await page.getByRole("button", { name: "♡", exact: true }).click();
  const touchHandle = page.getByRole("button", { name: "Move sticker ♡" });
  await touchHandle.scrollIntoViewIfNeeded();
  const touchBox = await touchHandle.boundingBox();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      {
        x: touchBox.x + touchBox.width / 2,
        y: touchBox.y + touchBox.height / 2,
      },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      {
        x: touchBox.x + touchBox.width / 2 + 35,
        y: touchBox.y + touchBox.height / 2 + 25,
      },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(() => touchHandle.evaluate((el) => el.style.left))
    .not.toBe("50%");
  await page.getByRole("button", { name: "Remove selected sticker" }).click();
  await page.screenshot({
    path: "tests/audit-editor-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Keep this moment" }).click();
  await expect(
    page.getByAltText("Hasil final 4 foto klikebooth"),
  ).toBeVisible();
  await page.screenshot({
    path: "tests/audit-result-mobile.png",
    fullPage: true,
  });
  const colors = await page
    .getByAltText("Hasil final 4 foto klikebooth")
    .evaluate(async (im) => {
      await im.decode();
      const c = document.createElement("canvas");
      c.width = im.naturalWidth;
      c.height = im.naturalHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(im, 0, 0);
      return [
        [200, 200],
        [600, 200],
        [200, 700],
        [600, 700],
      ].map(([x, y]) => Array.from(ctx.getImageData(x, y, 1, 1).data));
    });
  expect(colors).toEqual([
    [255, 0, 0, 255],
    [0, 0, 255, 255],
    [0, 128, 0, 255],
    [255, 165, 0, 255],
  ]);
});
