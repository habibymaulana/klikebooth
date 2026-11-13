import { transformPixels } from "./pixels.js";
import { effects, slots, size } from "./frames.js";
const load = (src) =>
  new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });
export async function renderPhoto(
  canvas,
  frame,
  photos,
  effect,
  caption,
  sticker,
  intensity = 1,
) {
  const [w, h] = size(frame);
  canvas.width = w;
  canvas.height = h;
  const c = canvas.getContext("2d");
  c.fillStyle = frame.color;
  c.fillRect(0, 0, w, h);
  c.fillStyle = "#684859";
  c.textAlign = "center";
  c.font = "bold 32px sans-serif";
  if (frame.id !== 0)
    c.fillText(frame.mark + "  " + frame.name + "  " + frame.mark, w / 2, 58);
  for (const [i, s] of slots(frame).entries()) {
    c.save();
    c.beginPath();
    if (s.shape === "oval")
      c.ellipse(
        s.x + s.w / 2,
        s.y + s.h / 2,
        s.w / 2,
        s.h / 2,
        0,
        0,
        Math.PI * 2,
      );
    else if (s.shape === "irregular") {
      c.moveTo(s.x + 25, s.y);
      c.lineTo(s.x + s.w - 15, s.y + 12);
      c.lineTo(s.x + s.w, s.y + s.h - 25);
      c.lineTo(s.x + 12, s.y + s.h);
      c.closePath();
    } else
      c.roundRect(
        s.x,
        s.y,
        s.w,
        s.h,
        frame.id === 0 ? 50 : frame.rounded ? 30 : 3,
      );
    c.clip();
    if (photos[i]) {
      const im = await load(photos[i]);
      const layer = document.createElement("canvas");
      layer.width = s.w;
      layer.height = s.h;
      const l = layer.getContext("2d");
      const scale = Math.max(s.w / im.width, s.h / im.height);
      l.drawImage(
        im,
        (s.w - im.width * scale) / 2,
        (s.h - im.height * scale) / 2,
        im.width * scale,
        im.height * scale,
      );
      if (
        [
          "Pencil Sketch",
          "Flat Art",
          "Comic Pop",
          "Pixel Pop",
          "Grain",
        ].includes(effect)
      ) {
        const pixels = l.getImageData(0, 0, s.w, s.h);
        transformPixels(pixels.data, s.w, s.h, effect, intensity);
        l.putImageData(pixels, 0, 0);
        c.drawImage(layer, s.x, s.y);
      } else {
        c.drawImage(layer, s.x, s.y);
        c.globalAlpha = intensity;
        c.filter = effects[effect] || "none";
        c.drawImage(layer, s.x, s.y);
        c.filter = "none";
        c.globalAlpha = 1;
      }
    } else {
      c.fillStyle = ["#b6c9bc", "#e0b8b5", "#b8bed9", "#dcc5a7"][i];
      c.fillRect(s.x, s.y, s.w, s.h);
      c.fillStyle = "#ffffffaa";
      c.font = "90px sans-serif";
      c.fillText(["☺", "✿", "♡", "✦"][i], s.x + s.w / 2, s.y + s.h / 2 + 30);
    }
    c.restore();
  }
  if (frame.id !== 0) {
    c.save();
    c.strokeStyle = "#ffffffa0";
    c.lineWidth = 3;
    c.fillStyle = "#ffffffb0";
    for (let n = 0; n < 9; n++) {
      const y = 125 + (n * (h - 220)) / 9;
      for (const x of [22, w - 22]) {
        c.save();
        c.translate(x, y);
        c.rotate((n % 2 ? 1 : -1) * 0.25);
        c.font = (frame.id % 3 === 0 ? "25" : "19") + "px sans-serif";
        c.fillStyle = n % 2 ? "#ffffffd0" : "#8b657b80";
        c.fillText(frame.mark, 0, 0);
        c.restore();
      }
    }
    if ([4, 6, 15].includes(frame.id)) {
      for (const s of slots(frame)) {
        c.fillStyle = "#fff8e6b0";
        c.save();
        c.translate(s.x + 35, s.y);
        c.rotate(-0.13);
        c.fillRect(-25, -9, 86, 25);
        c.restore();
      }
    }
    if ([5, 8, 12].includes(frame.id)) {
      c.setLineDash([8, 8]);
      c.strokeRect(9, 9, w - 18, h - 18);
      c.setLineDash([]);
    }
    if ([1, 7, 10, 14].includes(frame.id)) {
      for (let n = 0; n < 16; n++) {
        c.fillStyle = ["#fff7e7", "#b993c0", "#e8a4ad", "#b8c9a4"][n % 4];
        c.beginPath();
        c.arc(50 + (n * (w - 100)) / 15, h - 112, 4 + (n % 3), 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }
  if (frame.id === 0) {
    const overlay = await load("/assets/frames/klikebooth-ribbon-garden.png");
    // Geometric holes remove the opaque remnants inside the supplied windows.
    // Only window interiors are cleared: ribbon, flowers and border remain intact.
    const mask = document.createElement("canvas");
    mask.width = w;
    mask.height = h;
    const m = mask.getContext("2d");
    m.drawImage(overlay, 0, 0, w, h);
    m.globalCompositeOperation = "destination-out";
    for (const s of slots(frame)) {
      m.beginPath();
      m.roundRect(s.x, s.y, s.w, s.h, 50);
      m.fill();
    }
    c.drawImage(mask, 0, 0);
    // Preserve the bow loop that deliberately overlaps the third photo window.
    c.save();
    c.beginPath();
    c.ellipse(220, 938, 29, 19, 0, 0, Math.PI * 2);
    c.clip();
    c.drawImage(overlay, 0, 0, w, h);
    c.restore();
  }
  c.fillStyle = "#684859";
  c.font = "bold 32px sans-serif";
  if (frame.id !== 0 || caption)
    c.fillText(
      caption || "klikebooth",
      w / 2,
      frame.id === 0 ? h - 12 : h - 65,
    );
  c.font = "18px sans-serif";
  if (frame.id !== 0)
    c.fillText("LITTLE CLICKS, HAPPY MEMORIES", w / 2, h - 30);
  for (const item of Array.isArray(sticker)
    ? sticker
    : sticker
      ? [{ symbol: sticker, x: 0.9, y: 0.9, size: 0.08 }]
      : []) {
    c.save();
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `${item.size * w}px sans-serif`;
    c.fillText(item.symbol, item.x * w, item.y * h);
    c.restore();
  }
  return canvas;
}
