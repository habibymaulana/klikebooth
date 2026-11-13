import { test } from "node:test";
import assert from "node:assert/strict";
import { transformPixels } from "../../src/pixels.js";
import { frames, slots, size, categories } from "../../src/frames.js";
test("16 frames sorted newest first, categories and bounded slots", () => {
  assert.equal(frames.length, 16);
  assert.equal(new Set(frames.map((f) => f.id)).size, 16);
  frames.forEach((f, i) => {
    if (i) assert.ok(frames[i - 1].created > f.created);
    assert.ok(categories.includes(f.category));
    const [w, h] = size(f);
    assert.equal(slots(f).length, 4);
    slots(f).forEach((s) =>
      assert.ok(s.x >= 0 && s.y >= 0 && s.x + s.w <= w && s.y + s.h <= h),
    );
  });
});
test("pixel transforms preserve alpha and zero intensity, produce distinct outputs", () => {
  const input = new Uint8ClampedArray(24 * 24 * 4);
  for (let i = 0; i < input.length; i += 4) {
    input[i] = i % 251;
    input[i + 1] = (i * 3) % 255;
    input[i + 2] = (i * 7) % 255;
    input[i + 3] = 255;
  }
  const outputs = [];
  for (const effect of [
    "Pencil Sketch",
    "Flat Art",
    "Comic Pop",
    "Pixel Pop",
    "Grain",
  ]) {
    assert.deepEqual(
      transformPixels(new Uint8ClampedArray(input), 24, 24, effect, 0),
      input,
    );
    const output = transformPixels(
      new Uint8ClampedArray(input),
      24,
      24,
      effect,
      1,
    );
    assert.notDeepEqual(output, input);
    for (let i = 3; i < output.length; i += 4) assert.equal(output[i], 255);
    outputs.push(Buffer.from(output).toString("base64"));
  }
  assert.equal(new Set(outputs).size, 5);
});
