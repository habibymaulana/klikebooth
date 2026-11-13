import { mkdir, writeFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
test("all frame exports, clipping, effects and representative screenshots", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".splash")).toBeHidden();
  await page.getByRole("button", { name: "Frames", exact: true }).click();
  await page.screenshot({
    path: "tests/audit-studio-desktop.png",
    fullPage: true,
  });
  const report = await page.evaluate(async () => {
    const { frames, slots, size, effects } = await import("/src/frames.js");
    const { renderPhoto } = await import("/src/render.js");
    const photos = ["#ff0000", "#0000ff", "#008000", "#ffa500"].map((color) => {
      const c = document.createElement("canvas");
      c.width = 900;
      c.height = 600;
      const x = c.getContext("2d");
      x.fillStyle = color;
      x.fillRect(0, 0, 900, 600);
      return c.toDataURL();
    });
    const reports = [];
    for (const frame of frames) {
      const a = await renderPhoto(
        document.createElement("canvas"),
        frame,
        photos,
        "Original",
        "",
        [],
      );
      const b = await renderPhoto(
        document.createElement("canvas"),
        frame,
        photos,
        "Original",
        "",
        [],
      );
      const ctx = a.getContext("2d");
      const centers = slots(frame).map((s) =>
        Array.from(ctx.getImageData(s.x + s.w / 2, s.y + s.h / 2, 1, 1).data),
      );
      reports.push({
        name: frame.name,
        centers,
        same: a.toDataURL() === b.toDataURL(),
        png: a.toDataURL(),
        size: size(frame),
      });
    }
    for (const effect of Object.keys(effects)) {
      await renderPhoto(
        document.createElement("canvas"),
        frames[0],
        photos,
        effect,
        "",
        [],
        0.7,
      );
    }
    return reports;
  });
  await mkdir("tests/exports", { recursive: true });
  for (const r of report) {
    await writeFile(
      `tests/exports/${r.name.toLowerCase().replaceAll(" ", "-")}.png`,
      Buffer.from(r.png.split(",")[1], "base64"),
    );
    expect(r.same).toBeTruthy();
    expect(r.centers).toEqual([
      [255, 0, 0, 255],
      [0, 0, 255, 255],
      [0, 128, 0, 255],
      [255, 165, 0, 255],
    ]);
  }
  await page.evaluate((reports) => {
    const box = document.createElement("div");
    box.id = "audit-contact";
    box.style =
      "display:grid;grid-template-columns:repeat(4,1fr);gap:20px;background:#fff;padding:20px";
    for (const r of reports) {
      const item = document.createElement("div");
      item.innerHTML = `<p>${r.name}</p><img style="height:300px;max-width:100%;object-fit:contain" src="${r.png}">`;
      box.append(item);
    }
    document.body.replaceChildren(box);
  }, report);
  await page
    .locator("#audit-contact")
    .screenshot({ path: "tests/audit-all-frames.png" });
});
test("individual retake, sticker drag resize remove, intensity, export and share fallback", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".splash")).toBeHidden();
  await page.getByRole("button", { name: "Frames", exact: true }).click();
  await page.getByRole("button", { name: "Continue to camera" }).click();
  await expect(
    page.getByRole("button", { name: "Start Photos", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: "tests/audit-camera-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Start Photos", exact: true }).click();
  await page
    .getByRole("button", { name: "Continue to Art Lab", exact: true })
    .click();
  await expect(page.locator(".retake-grid button")).toHaveCount(4, {
    timeout: 20000,
  });
  const before = await page
    .locator(".retake-grid img")
    .evaluateAll((imgs) => imgs.map((im) => im.src));
  await page
    .getByRole("button", { name: "Retake photo 2", exact: true })
    .click();
  await page.getByRole("button", { name: "Start Photos", exact: true }).click();
  await page
    .getByRole("button", { name: "Continue to Art Lab", exact: true })
    .click();
  await expect(page.locator(".retake-grid button")).toHaveCount(4, {
    timeout: 10000,
  });
  const after = await page
    .locator(".retake-grid img")
    .evaluateAll((imgs) => imgs.map((im) => im.src));
  expect(after[0]).toBe(before[0]);
  expect(after[2]).toBe(before[2]);
  expect(after[3]).toBe(before[3]);
  expect(after[1]).not.toBe(before[1]);
  await page
    .getByRole("button", { name: "Pencil Sketch", exact: true })
    .click();
  await page.getByLabel("Effect intensity").fill(".5");
  await page.getByRole("button", { name: "Stickers", exact: true }).click();
  await page.getByRole("button", { name: "♡", exact: true }).click();
  const handle = page.getByRole("button", { name: "Move sticker ♡" });
  const box = await handle.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 70, box.y + 50);
  await page.mouse.up();
  await page.getByLabel("Sticker size").fill(".2");
  await page.screenshot({
    path: "tests/audit-editor-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Remove selected sticker" }).click();
  await expect(handle).toHaveCount(0);
  await page.getByRole("button", { name: "★", exact: true }).click();
  await page.getByRole("button", { name: "Keep this moment" }).click();
  await expect(
    page.getByAltText("Hasil final 4 foto klikebooth"),
  ).toBeVisible();
  await page.screenshot({
    path: "tests/audit-result-desktop.png",
    fullPage: true,
  });
  await page.evaluate(() =>
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => false,
    }),
  );
  await page.getByRole("button", { name: "Share photo", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Download PNG");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: () => true,
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data) => {
        window.__sharedFile = {
          name: data.files[0].name,
          type: data.files[0].type,
          size: data.files[0].size,
        };
      },
    });
  });
  await page.getByRole("button", { name: "Share photo", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__sharedFile?.type))
    .toBe("image/png");
});
