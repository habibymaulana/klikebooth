// Deterministic, local pixel transforms shared by previews and PNG export.
export function transformPixels(data, width, height, effect, intensity = 1) {
  const source = new Uint8ClampedArray(data);
  const gray = (x, y) => {
    const p =
      (Math.max(0, Math.min(height - 1, y)) * width +
        Math.max(0, Math.min(width - 1, x))) *
      4;
    return source[p] * 0.299 + source[p + 1] * 0.587 + source[p + 2] * 0.114;
  };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      let rgb = Array.from(source.slice(i, i + 3));
      const edge =
        Math.abs(gray(x + 1, y) - gray(x - 1, y)) +
        Math.abs(gray(x, y + 1) - gray(x, y - 1));
      if (effect === "Pencil Sketch")
        rgb = [0, 0, 0].map(() =>
          Math.max(0, 255 - edge * 3.5 - (255 - gray(x, y)) * 0.12),
        );
      if (effect === "Flat Art") rgb = rgb.map((v) => Math.round(v / 64) * 64);
      if (effect === "Comic Pop")
        rgb =
          edge > 65 ? [25, 20, 35] : rgb.map((v) => Math.round(v / 85) * 85);
      if (effect === "Pixel Pop") {
        const p =
          (Math.floor(y / 12) * 12 * width + Math.floor(x / 12) * 12) * 4;
        rgb = Array.from(source.slice(p, p + 3));
      }
      if (effect === "Grain") {
        const noise = ((x * 73 + y * 151) % 47) - 23;
        rgb = rgb.map((v) => v + noise);
      }
      for (let k = 0; k < 3; k++)
        data[i + k] = source[i + k] + (rgb[k] - source[i + k]) * intensity;
    }
  return data;
}
