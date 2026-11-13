# klikebooth

Photobooth local-first untuk Killo. React 19 + Vite, tanpa backend.

## Menjalankan

```sh
npm install
npm run dev
```

Buka http://localhost:5173. Kamera membutuhkan localhost atau HTTPS. Foto hanya berada dalam memori tab dan tidak dikirim ke server. Refresh akan menghapus sesi. Google Fonts memerlukan internet; font sistem menjadi fallback.

## Validasi

```sh
npm run build
npm run lint
npm run test:unit
npm test
```

Tes browser memakai Google Chrome pada macOS (atur executablePath di playwright.config.js untuk OS lain). Tes mencakup kamera simulasi empat foto, filter kategori, efek, caption kosong secara default, ekspor, layout mobile, upload empat gambar berbeda, dan verifikasi warna keempat slot PNG. Izin kamera dan kualitas kamera fisik tetap perlu diperiksa pada perangkat tujuan.

## Struktur

- `src/main.jsx`: splash, homepage, Frame Studio, kamera, Art Lab, hasil.
- `src/frames.js`: 16 frame, kategori, urutan terbaru, geometri slot dan efek.
- `src/render.js`: renderer canvas bersama untuk preview dan PNG.
- `src/style.css`: token dasar, komponen responsif, animasi dan reduced motion.
- `public/assets/`: aset starter asli tetap dipertahankan. Sticker sheet digunakan utuh; overlay Ribbon Garden mempertahankan dekorasi asli. Frame lainnya digambar dengan canvas.

10 efek tersedia termasuk Original, Pencil Sketch, Flat Art, Comic Pop, Pixel Pop, Warm tone, Cool tone, Grain, Monochrome dan Playful pop. Empat efek art memakai transformasi piksel lokal, bukan AI. Intensity tersedia. Tab Stickers mendukung beberapa sticker, pointer drag (mouse/touch), resize slider dan hapus. Retake individu mempertahankan tiga foto lain. Preview kamera dan capture sama-sama mirrored; gambar upload mempertahankan orientasi aslinya. Sharing memakai Web Share files jika tersedia, dengan unduhan sebagai alternatif. Tidak ada analytics, penyimpanan foto persisten, atau backend.

## Deployment berikutnya

Siap sebagai static Vite site: build command `npm run build`, output `dist`, Node 20.19+ atau 22.12+. GitHub dapat menyimpan source; Vercel dapat mengimpor repository dengan preset Vite. Belum ada remote GitHub, konfigurasi akun Vercel, push, atau deploy yang dilakukan. Gunakan HTTPS agar kamera dan Web Share tersedia.

## The Little Happy Studio — full redesign

See `REDESIGN.md` for the updated public flow and before/after screenshots. Public camera flow has no photo upload; `?diagnostics=1` enables test upload only in development. Production builds ignore diagnostics. Four captures now enter review with individual retakes before Continue to Art Lab. Gallery/demo artwork never enters actual camera sessions.
