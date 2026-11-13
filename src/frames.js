export const categories = [
  "All frames",
  "Originals",
  "Kawaii & Cute",
  "Pastel Pop",
  "Playful Scrapbook",
  "Sticker Party",
  "Dreamy Mood",
  "Color Pop",
  "Fun Doodle",
];
const names = [
  "Ribbon Garden",
  "Candy Pop",
  "Bubble Bear",
  "Sticker Parade",
  "Sweet Diary",
  "Pastel Camera",
  "Kawaii Polaroid",
  "Confetti Bloom",
  "Toybox Mood",
  "Cloudy Cutie",
  "Cherry Spark",
  "Happy Doodle",
  "Soft Arcade",
  "Mood Parade",
  "Tiny Party",
  "Pop Memo",
];
const colors = [
  "#ffe4ed",
  "#fbd6a7",
  "#dfd2f4",
  "#d9edca",
  "#f5e9ce",
  "#cfe6e7",
  "#ffe1d8",
  "#efcbe2",
  "#f5d578",
  "#dce5f8",
  "#fac9ce",
  "#e4edb7",
  "#d8d0f6",
  "#f6d9c1",
  "#ccebdd",
  "#f4cedd",
];
const marks = [
  "🎀",
  "✿",
  "ʕ•ᴥ•ʔ",
  "★",
  "♡",
  "✦",
  "♥",
  "❀",
  "✹",
  "☁",
  "🍒",
  "☺",
  "✧",
  "✿",
  "★",
  "♡",
];
export const frames = names
  .map((name, i) => ({
    id: i,
    name,
    color: colors[i],
    mark: marks[i],
    category: categories[1 + (i % 8)],
    layout: i % 4 === 1 || i % 4 === 3 ? "grid" : "strip",
    rounded: i % 3 !== 0,
    created: i,
  }))
  .sort((a, b) => b.created - a.created);
export const effects = {
  Original: "none",
  "Pencil Sketch": "none",
  "Flat Art": "none",
  "Comic Pop": "none",
  "Pixel Pop": "none",
  "Warm tone": "sepia(.3) saturate(1.2)",
  "Cool tone": "hue-rotate(20deg) saturate(.8)",
  Grain: "contrast(1.15) saturate(.7)",
  Monochrome: "grayscale(1)",
  "Playful pop": "saturate(1.8) contrast(1.15)",
};
export function slots(frame) {
  if (frame.id === 0)
    return [0, 1, 2, 3].map((i) => ({
      x: 234,
      y: [181, 507, 846, 1183][i],
      w: 463,
      h: [278, 289, 287, 288][i],
      shape: "rounded",
    }));
  const result =
    frame.layout === "grid"
      ? [
          { x: 44, y: 100, w: 342, h: 400 },
          { x: 414, y: 100, w: 342, h: 400 },
          { x: 44, y: 526, w: 342, h: 400 },
          { x: 414, y: 526, w: 342, h: 400 },
        ]
      : [0, 1, 2, 3].map((i) => ({ x: 50, y: 95 + i * 300, w: 700, h: 275 }));
  return result.map((s) => ({
    ...s,
    shape: frame.id === 2 ? "oval" : frame.id === 11 ? "irregular" : "rounded",
  }));
}
export const size = (f) =>
  f.id === 0 ? [941, 1672] : f.layout === "grid" ? [800, 1100] : [800, 1450];
