KLIKEBOOTH — STARTER ASSETS

Unzip this archive INSIDE the root of a new React/Vite project named klikebooth.
The archive already contains the public/assets/... folder tree.

Assets:
public/assets/branding/klikebooth-logo.png — transparent brand wordmark
public/assets/branding/klikebooth-mascot.png — transparent smiling camera character
public/assets/branding/klikebooth-splash.png — illustrative splash poster (opaque background)
public/assets/stickers/klikebooth-sticker-sheet.png — composite sheet, not separate transparent per-sticker files
public/assets/frames/klikebooth-ribbon-garden.png — illustrated 4-window frame overlay

IMPORTANT:
- Test transparency and photo-window alpha in the actual file; do not assume photo slots are clean transparent holes.
- For live photo composition, define accurate clipping masks; preserve stickers in the foreground.
- Sticker-sheet items must be individually isolated/traced or used as a full sheet, not cropped with residual backgrounds.
- Splash is a static illustration; implement working splash animations in React/CSS.
- Do not commit or deploy without testing with 4 real/distinct photos and inspecting exported PNG.
