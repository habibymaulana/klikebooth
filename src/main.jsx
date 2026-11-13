import { transformPixels } from "./pixels.js";
import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  Camera,
  Sparkles,
  Download,
  Share2,
  ChevronLeft,
  Check,
  Heart,
  RotateCcw,
} from "lucide-react";
import { frames, categories, effects } from "./frames";
import { renderPhoto } from "./render";
import "./style.css";
import "./studio.css";
import "./hero.css";
const demoPhotos = [1, 2, 3, 4].map((i) => `/assets/demo/pose-${i}.svg`);
const diagnostics =
  import.meta.env.DEV &&
  new URLSearchParams(location.search).get("diagnostics") === "1";
const asset = (n) => `/assets/branding/klikebooth-${n}.png`;
function EffectPreview({ photo, effect }) {
  const ref = useRef();
  useEffect(() => {
    let active = true;
    const im = new Image();
    im.onload = () => {
      if (!active) return;
      const canvas = ref.current;
      canvas.width = 160;
      canvas.height = 130;
      const c = canvas.getContext("2d");
      const scale = Math.max(160 / im.width, 130 / im.height);
      c.filter = effects[effect] || "none";
      c.drawImage(
        im,
        (160 - im.width * scale) / 2,
        (130 - im.height * scale) / 2,
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
        const pixels = c.getImageData(0, 0, 160, 130);
        transformPixels(pixels.data, 160, 130, effect, 1);
        c.putImageData(pixels, 0, 0);
      }
    };
    im.src = photo;
    return () => {
      active = false;
    };
  }, [photo, effect]);
  return <canvas ref={ref} aria-hidden="true" className="effect-preview" />;
}
function Frame({
  frame,
  photos = [],
  effect = "Original",
  caption = "",
  sticker = "",
  large = false,
  intensity = 1,
}) {
  const ref = useRef();
  useEffect(() => {
    let active = true;
    const buffer = document.createElement("canvas");
    renderPhoto(
      buffer,
      frame,
      photos,
      effect,
      caption,
      sticker,
      intensity,
    ).then(() => {
      if (active && ref.current) {
        ref.current.width = buffer.width;
        ref.current.height = buffer.height;
        ref.current.getContext("2d").drawImage(buffer, 0, 0);
      }
    });
    return () => {
      active = false;
    };
  }, [frame, photos, effect, caption, sticker, intensity]);
  return (
    <canvas
      ref={ref}
      className={large ? "frame large" : "frame"}
      aria-label={`Preview ${frame.name}`}
    />
  );
}
function App() {
  const [page, setPage] = useState("home"),
    [splash, setSplash] = useState(!sessionStorage.getItem("klike-intro")),
    [category, setCategory] = useState("All frames"),
    [selected, setSelected] = useState(frames[0]),
    [photos, setPhotos] = useState([]),
    [effect, setEffect] = useState("Original"),
    [tab, setTab] = useState("Effects"),
    [caption, setCaption] = useState(""),
    [sticker, setSticker] = useState([]),
    [intensity, setIntensity] = useState(1),
    [retake, setRetake] = useState(null),
    [activeSticker, setActiveSticker] = useState(null),
    [count, setCount] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [flash, setFlash] = useState(false),
    [ready, setReady] = useState(false),
    [review, setReview] = useState(false),
    [cameraAttempt, setCameraAttempt] = useState(0),
    [result, setResult] = useState("");
  const video = useRef(),
    stream = useRef(),
    cancel = useRef(false),
    resultUrl = useRef("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSplash(false);
      sessionStorage.setItem("klike-intro", "1");
    }, 2100);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (page !== "camera" || review) return;
    let alive = true;
    cancel.current = false;
    setReady(false);
    setError("");
    navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 960 },
        audio: false,
      })
      .then((s) => {
        if (!alive) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = s;
        video.current.srcObject = s;
        video.current.onloadeddata = () => {
          if (alive) setReady(true);
        };
      })
      .catch(
        () =>
          alive &&
          setError(
            "Camera access is needed. Allow camera permission in your browser, then try again.",
          ),
      );
    if (!navigator.mediaDevices)
      setError(
        "Your camera needs HTTPS or localhost. Open a secure connection and try again.",
      );
    return () => {
      alive = false;
      cancel.current = true;
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, [page, cameraAttempt, review]);
  useEffect(
    () => () => {
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    },
    [],
  );
  function go(p) {
    if (p === "camera") setReview(false);
    setPage(p);
    setError("");
    window.scrollTo(0, 0);
  }
  function startSession() {
    setPhotos([]);
    setCaption("");
    setSticker([]);
    setActiveSticker(null);
    setEffect("Original");
    setIntensity(1);
    setRetake(null);
    setBusy(false);
    setTab("Effects");
    shutter();
    go("camera");
  }
  function shutter() {
    setFlash(true);
    setTimeout(() => setFlash(false), 350);
    try {
      const A = window.AudioContext || window.webkitAudioContext;
      const a = new A(),
        o = a.createOscillator(),
        g = a.createGain();
      o.connect(g);
      g.connect(a.destination);
      o.frequency.setValueAtTime(480, a.currentTime);
      g.gain.setValueAtTime(0.025, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.08);
      o.start();
      o.stop(a.currentTime + 0.08);
      o.onended = () => a.close();
    } catch {
      /* Audio optional */
    }
  }
  async function capture() {
    if (busy || !ready) return;
    setBusy(true);
    shutter();
    const shots = retake === null ? [] : [...photos];
    for (let i = retake ?? 0; i < (retake === null ? 4 : retake + 1); i++) {
      for (let n = 3; n > 0; n--) {
        if (cancel.current) return;
        setCount(n);
        await new Promise((r) => setTimeout(r, 1000));
      }
      if (cancel.current) return;
      const v = video.current;
      if (!v?.videoWidth) {
        setError("Kamera belum siap. Coba lagi.");
        setBusy(false);
        setCount(null);
        return;
      }
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      const ctx = c.getContext("2d");
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0);
      shots[i] = c.toDataURL("image/jpeg", 0.94);
      setPhotos([...shots]);
      shutter();
      setCount("✓");
      await new Promise((r) => setTimeout(r, 350));
    }
    setBusy(false);
    setCount(null);
    setRetake(null);
    setReview(true);
  }
  async function upload(e) {
    const files = [...e.target.files];
    if (files.length !== 4 || files.some((f) => !f.type.startsWith("image/"))) {
      setError("Pilih tepat 4 file gambar.");
      return;
    }
    try {
      const imgs = await Promise.all(
        files.map(
          (f) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(f);
            }),
        ),
      );
      setPhotos(imgs);
      go("edit");
    } catch {
      setError("Foto gagal dibaca. Coba file lain.");
    }
  }
  async function finish() {
    setBusy(true);
    try {
      const c = await renderPhoto(
        document.createElement("canvas"),
        selected,
        photos,
        effect,
        caption,
        sticker,
        intensity,
      );
      const blob = await new Promise((r) => c.toBlob(r, "image/png"));
      if (!blob) throw Error();
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
      resultUrl.current = URL.createObjectURL(blob);
      setResult(resultUrl.current);
      go("result");
    } catch {
      setError("Hasil belum tersimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    try {
      const blob = await (await fetch(result)).blob();
      const file = new File([blob], "klikebooth.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] }))
        await navigator.share({ files: [file], title: "My klikebooth moment" });
      else
        setError(
          "Browser ini belum mendukung share foto. Download PNG lalu bagikan dari galeri.",
        );
    } catch (e) {
      if (e.name !== "AbortError")
        setError("Share belum berhasil. Kamu tetap bisa download PNG.");
    }
  }
  return (
    <>
      {splash && (
        <div
          className="splash"
          onClick={() => {
            setSplash(false);
            sessionStorage.setItem("klike-intro", "1");
          }}
        >
          <img className="splash-poster" src={asset("splash")} alt="" />
          <img src={asset("logo")} alt="klikebooth" />
          <img
            className="bounce"
            src={asset("mascot")}
            alt="Maskot kamera klikebooth"
          />
          <p>The little happy studio ✦</p>
          <button onClick={() => setSplash(false)}>Let’s play →</button>
        </div>
      )}
      {flash && <div className="flash" />}
      <header>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (!busy) go("home");
          }}
          className="brand"
        >
          <img src={asset("logo")} alt="klikebooth" />
        </a>
        <nav>
          <button
            className={page === "home" ? "active" : ""}
            onClick={() => !busy && go("home")}
          >
            Home
          </button>
          <button
            className={page === "studio" ? "active" : ""}
            onClick={() => !busy && go("studio")}
          >
            Frames
          </button>
          <span className="nav-note">THE LITTLE HAPPY STUDIO</span>
        </nav>
        <button className="small-button" disabled={busy} onClick={startSession}>
          Enter the Booth <ArrowUpRight size={17} />
        </button>
      </header>
      {page === "home" ? (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">
                <span /> A little space to be yourself
              </div>
              <h1>
                your little
                <br />
                <em>happy place.</em>
              </h1>
              <p>Four clicks, endless little memories.</p>
              <div className="hero-actions">
                <button className="primary" onClick={startSession}>
                  Enter the Booth <ArrowUpRight size={20} />
                </button>
                <button
                  className="text-button browse-frames"
                  onClick={() => go("studio")}
                >
                  Browse frames <ArrowRight size={16} />
                </button>
              </div>
              <span className="tiny">
                Your camera. Your moment. Always private.
              </span>
            </div>
            <div className="hero-art">
              <div className="mascot-scene">
                <span className="hero-spark spark-one" aria-hidden="true">
                  ✧
                </span>
                <span className="hero-spark spark-two" aria-hidden="true">
                  ✦
                </span>
                <span className="hero-heart" aria-hidden="true">
                  ♡
                </span>
                <img
                  className="mascot"
                  src={asset("mascot")}
                  alt="Our happy little camera mascot waving a photo strip"
                />
              </div>
              <span className="hero-greeting">ready to smile?</span>
            </div>
          </section>
          <div className="studio-values">
            <span>
              <Camera size={16} /> A real photobooth, right here
            </span>
            <span>
              <Heart size={16} /> No account. No awkwardness.
            </span>
            <span>
              <Sparkles size={16} /> Made on your device, kept by you
            </span>
          </div>
          <section className="featured">
            <div className="section-heading">
              <div>
                <div className="eyebrow">PICK YOUR PERSONALITY</div>
                <h2>
                  Pick your kind <em>of cute.</em>
                </h2>
              </div>
              <button className="text-button" onClick={() => go("studio")}>
                Explore all frames <ArrowRight size={18} />
              </button>
            </div>
            <div className="feature-grid">
              {[frames[15], frames[14], frames[13]].map((f, i) => (
                <button
                  className="feature-card"
                  key={f.id}
                  onClick={() => {
                    setSelected(f);
                    go("studio");
                  }}
                >
                  <div className={"frame-stage stage-" + i}>
                    <Frame frame={f} photos={demoPhotos} />
                    <span className="frame-badge">
                      {i === 0
                        ? "THE ORIGINAL"
                        : i === 1
                          ? "SWEET PICK"
                          : i === 2
                            ? "SO CUDDLY"
                            : "PARTY TIME"}
                    </span>
                  </div>
                  <div className="card-caption">
                    <span>{f.name}</span>
                    <ArrowUpRight size={18} />
                  </div>
                  <small>{f.category}</small>
                </button>
              ))}
            </div>
          </section>
          <section className="how">
            <div className="eyebrow">LESS SETUP, MORE SMILES</div>
            <h2>
              How the <em>magic works.</em>
            </h2>
            <div className="steps">
              {[
                [
                  "01",
                  "Pick a frame",
                  "Find your own little kind of cute.",
                  "✿",
                ],
                [
                  "02",
                  "Take four photos",
                  "Four poses. Three seconds. All you.",
                  "☺",
                ],
                [
                  "03",
                  "Customize and save",
                  "Add a little magic. Download. Share.",
                  "♡",
                ],
              ].map(([n, t, d, m]) => (
                <article key={n}>
                  <span className="step-mark">{m}</span>
                  <small>{n}</small>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              ))}
            </div>
            <img
              className="sticker-sheet"
              src="/assets/stickers/klikebooth-sticker-sheet.png"
              alt="Koleksi sticker klikebooth"
            />
          </section>
          <section className="moments-banner">
            <img src={asset("mascot")} alt="" />
            <div>
              <div className="eyebrow">A LITTLE MOMENT, JUST FOR YOU</div>
              <h2>
                Made for your <em>little moments.</em>
              </h2>
              <p>
                The ordinary afternoons. The best-friend dates. The just-because
                smiles.
              </p>
            </div>
            <button className="primary" onClick={startSession}>
              Enter the Booth <ArrowUpRight size={18} />
            </button>
          </section>
        </main>
      ) : (
        <main className="workspace">
          <div className="workflow">
            {["camera", "edit", "result"].map((p, i) => (
              <span
                className={
                  page === p || (page === "studio" && p === "camera")
                    ? "current"
                    : ""
                }
                key={p}
              >
                {i + 1} {["Your studio", "Make it yours", "Yours to keep"][i]}
              </span>
            ))}
          </div>
          {page === "studio" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">THE FRAME STUDIO</div>
                <h1>
                  The frame <em>wardrobe.</em>
                </h1>
                <p>
                  A little ribbon? A pop of pink? Pick the one that feels like
                  you.
                </p>
              </div>
              <div className="categories">
                {categories.map((c) => (
                  <button
                    className={category === c ? "selected" : ""}
                    key={c}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="studio-grid">
                {frames
                  .filter(
                    (f) => category === "All frames" || f.category === category,
                  )
                  .map((f) => (
                    <button
                      className={
                        "studio-card " + (selected.id === f.id ? "chosen" : "")
                      }
                      key={f.id}
                      onClick={() => setSelected(f)}
                    >
                      <div
                        className="studio-preview"
                        style={{ background: f.color + "70" }}
                      >
                        <Frame frame={f} photos={demoPhotos} />
                        {f.id === 15 && <span className="new">NEW</span>}
                        {selected.id === f.id && (
                          <span className="check">
                            <Check size={18} />
                          </span>
                        )}
                      </div>
                      <strong>{f.name}</strong>
                      <small>
                        {f.category} ·{" "}
                        {f.layout === "grid" ? "2 × 2 grid" : "4 photo strip"}
                      </small>
                    </button>
                  ))}
              </div>
              <div className="selection-bar">
                <span>
                  <strong>{selected.name}</strong>
                  <small>4 photos · a little bit of you</small>
                </span>
                <button
                  className="primary"
                  onClick={() => {
                    setPhotos([]);
                    setBusy(false);
                    shutter();
                    go("camera");
                  }}
                >
                  Continue to camera <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}
          {page === "camera" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">
                  THE LITTLE HAPPY STUDIO · BOOTH 01
                </div>
                <h1>
                  Let’s make <em>happy happen.</em>
                </h1>
                <p>
                  {retake !== null
                    ? `One more for photo ${retake + 1}. The other moments are safe.`
                    : "Settle in. Four little poses, three seconds to make each one yours."}
                </p>
              </div>
              <div className="session-topbar">
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => go("studio")}
                >
                  <ChevronLeft size={15} /> Back to Frames
                </button>
                <span>{selected.name}</span>
                <span>
                  {review
                    ? "4 / 4 · READY TO KEEP"
                    : `${photos.length} / 4 MOMENTS`}
                </span>
              </div>
              <div className="camera-layout">
                <div className="capture-console">
                  <div className="console-header">
                    <span>
                      <span
                        className={ready ? "status-dot ready" : "status-dot"}
                      />{" "}
                      {busy
                        ? "A LITTLE MAGIC IN PROGRESS"
                        : ready
                          ? "ALL SET FOR YOUR CLOSE-UP"
                          : "LET’S GET YOU SETTLED"}
                    </span>
                    <span>4 CUTS / ♡</span>
                  </div>
                  <div className="viewfinder">
                    <video
                      ref={video}
                      autoPlay
                      playsInline
                      muted
                      hidden={review}
                    />
                    {review && (
                      <div className="review-grid">
                        {photos.map((photo, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setRetake(i);
                              setReview(false);
                            }}
                          >
                            <img src={photo} alt={`Review photo ${i + 1}`} />
                            <span>
                              Retake photo {i + 1} <RotateCcw size={12} />
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!ready && !review && (
                      <div className="camera-placeholder">
                        <Camera size={48} />
                        <img src={asset("mascot")} alt="" />
                        <p>
                          {error
                            ? "A little camera hiccup"
                            : "Your studio is warming up…"}
                        </p>
                        <small>
                          {error
                            ? "Allow camera access in your browser settings, then try again."
                            : "Allow camera access to see your lovely face here."}
                        </small>
                      </div>
                    )}
                    {count !== null && (
                      <div
                        key={count}
                        className="countdown"
                        aria-live="assertive"
                      >
                        {count}
                      </div>
                    )}
                    {!review && (
                      <span className="live">
                        ●{" "}
                        {ready
                          ? "JUST YOU, LOOKING CUTE"
                          : "YOUR PRIVATE LITTLE SPACE"}
                      </span>
                    )}
                    <span className="photo-count">
                      {retake !== null
                        ? `RETAKE ${retake + 1}`
                        : `${photos.length} OF 4`}
                    </span>
                    {ready && !review && count === null && (
                      <span className="pose-whisper">
                        {
                          [
                            "A little smile to start? ♡",
                            "Now give us your silly side ✦",
                            "Something a little dreamy ☁",
                            "One last happy face ✿",
                          ][Math.min(photos.length, 3)]
                        }
                      </span>
                    )}
                  </div>
                  <div className="shot-rail" aria-label="Your four moments">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        className={
                          "shot-slot " +
                          (photos[i] ? "filled" : "") +
                          " " +
                          (busy && (retake ?? photos.length) === i
                            ? "taking"
                            : "")
                        }
                        key={i}
                      >
                        {photos[i] ? (
                          <img
                            src={photos[i]}
                            alt={`Captured photo ${i + 1}`}
                          />
                        ) : (
                          <>
                            <span>0{i + 1}</span>
                            <Heart size={16} />
                          </>
                        )}
                        <small>
                          {photos[i]
                            ? "a little keeper"
                            : [
                                "the smile",
                                "the silly one",
                                "the soft side",
                                "the happy one",
                              ][i]}
                        </small>
                      </div>
                    ))}
                  </div>
                  <div className="camera-actions">
                    {review ? (
                      <button className="primary" onClick={() => go("edit")}>
                        Continue to Art Lab <ArrowRight size={18} />
                      </button>
                    ) : error ? (
                      <button
                        className="primary"
                        onClick={() => setCameraAttempt((v) => v + 1)}
                      >
                        Retry Camera <RotateCcw size={18} />
                      </button>
                    ) : (
                      <button
                        className="primary"
                        disabled={!ready || busy}
                        aria-label={busy ? "Making memories…" : "Start Photos"}
                        onClick={capture}
                      >
                        <span className="capture-lens">
                          <Camera size={22} />
                        </span>
                        <span>
                          {busy ? "Making memories…" : "Start Photos"}
                          <small>
                            {busy
                              ? "Stay right here, cutie"
                              : "4 photos · 3 seconds per pose"}
                          </small>
                        </span>
                      </button>
                    )}
                    {diagnostics && (
                      <label className="upload">
                        Bring 4 photos instead
                        <input
                          aria-label="Upload 4 photos"
                          disabled={busy}
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={upload}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <aside className="print-preview">
                  <div className="print-heading">
                    <span>YOUR LITTLE KEEPSAKE</span>
                    <Sparkles size={15} />
                  </div>
                  <div className="print-paper">
                    <Frame frame={selected} photos={photos} />
                  </div>
                  <p>{selected.name}</p>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => go("studio")}
                  >
                    Change frame <ArrowRight size={14} />
                  </button>
                  <div className="privacy-note">
                    <Heart size={15} />
                    <span>
                      Just between you & your browser.
                      <br />
                      Your photos never leave this device.
                    </span>
                  </div>
                </aside>
              </div>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => go("studio")}
              >
                <ChevronLeft size={16} /> Back to frames
              </button>
            </>
          )}
          {page === "edit" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">WELCOME TO THE ART LAB</div>
                <h1>
                  A little extra <em>you.</em>
                </h1>
                <p>Play with a look. Add your finishing touches.</p>
              </div>
              <div className="editor">
                <div className="editor-preview">
                  <div className="editable-frame">
                    <Frame
                      large
                      frame={selected}
                      photos={photos}
                      effect={effect}
                      caption={caption}
                      sticker={sticker}
                      intensity={intensity}
                    />
                    <div className="sticker-layer">
                      {sticker.map((item) => (
                        <button
                          key={item.id}
                          aria-label={`Move sticker ${item.symbol}`}
                          className={
                            "sticker-handle " +
                            (activeSticker === item.id ? "picked" : "")
                          }
                          style={{
                            left: `${item.x * 100}%`,
                            top: `${item.y * 100}%`,
                            width: `${item.size * 100}%`,
                            height: `${item.size * 70}%`,
                          }}
                          onPointerDown={(e) => {
                            setActiveSticker(item.id);
                            e.currentTarget.setPointerCapture(e.pointerId);
                          }}
                          onPointerMove={(e) => {
                            if (!e.currentTarget.hasPointerCapture(e.pointerId))
                              return;
                            const r =
                              e.currentTarget.parentElement.getBoundingClientRect();
                            setSticker((items) =>
                              items.map((v) =>
                                v.id === item.id
                                  ? {
                                      ...v,
                                      x: Math.max(
                                        0.03,
                                        Math.min(
                                          0.97,
                                          (e.clientX - r.left) / r.width,
                                        ),
                                      ),
                                      y: Math.max(
                                        0.03,
                                        Math.min(
                                          0.97,
                                          (e.clientY - r.top) / r.height,
                                        ),
                                      ),
                                    }
                                  : v,
                              ),
                            );
                          }}
                          onPointerUp={(e) =>
                            e.currentTarget.releasePointerCapture(e.pointerId)
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="editor-controls">
                  <div className="tabs">
                    {["Effects", "Stickers", "Customize"].map((t) => (
                      <button
                        key={t}
                        className={tab === t ? "selected" : ""}
                        onClick={() => setTab(t)}
                      >
                        {t === "Effects" ? (
                          <Sparkles size={17} />
                        ) : (
                          <Heart size={17} />
                        )}{" "}
                        {t}
                      </button>
                    ))}
                  </div>
                  {tab === "Effects" ? (
                    <>
                      <h3>Find your kind of magic</h3>
                      <div className="effects">
                        {Object.keys(effects).map((e) => (
                          <button
                            className={effect === e ? "selected" : ""}
                            key={e}
                            onClick={() => setEffect(e)}
                          >
                            <EffectPreview photo={photos[0]} effect={e} />
                            {e}
                          </button>
                        ))}
                      </div>
                      <label className="intensity">
                        Effect intensity{" "}
                        <input
                          aria-label="Effect intensity"
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={intensity}
                          onChange={(e) => setIntensity(Number(e.target.value))}
                        />
                      </label>
                      <p className="tiny">
                        Pixel effects are processed locally on your device.
                      </p>
                    </>
                  ) : tab === "Stickers" ? (
                    <>
                      <h3>A little sticker magic</h3>
                      <p className="tiny">
                        Add, then drag a sticker on your photo. Works with touch
                        too.
                      </p>
                      <div className="sticker-options">
                        {["♡", "✿", "★", "🎀", "🍒", "☺"].map((symbol) => (
                          <button
                            key={symbol}
                            aria-label={symbol}
                            onClick={() => {
                              const id = crypto.randomUUID();
                              setSticker((items) => [
                                ...items,
                                { id, symbol, x: 0.5, y: 0.5, size: 0.12 },
                              ]);
                              setActiveSticker(id);
                            }}
                          >
                            {symbol}
                          </button>
                        ))}
                      </div>
                      {activeSticker &&
                        sticker.some((v) => v.id === activeSticker) && (
                          <>
                            <label className="intensity">
                              Sticker size
                              <input
                                aria-label="Sticker size"
                                type="range"
                                min=".05"
                                max=".3"
                                step=".01"
                                value={
                                  sticker.find((v) => v.id === activeSticker)
                                    .size
                                }
                                onChange={(e) =>
                                  setSticker((items) =>
                                    items.map((v) =>
                                      v.id === activeSticker
                                        ? { ...v, size: Number(e.target.value) }
                                        : v,
                                    ),
                                  )
                                }
                              />
                            </label>
                            <button
                              className="text-button"
                              onClick={() => {
                                setSticker((items) =>
                                  items.filter((v) => v.id !== activeSticker),
                                );
                                setActiveSticker(null);
                              }}
                            >
                              Remove selected sticker
                            </button>
                          </>
                        )}
                    </>
                  ) : (
                    <>
                      <h3>Small details, big personality</h3>
                      <label className="caption-label">
                        Caption <span>(optional)</span>
                        <input
                          maxLength={38}
                          placeholder="Your own little message…"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                        />
                      </label>
                      <img
                        className="custom-mascot"
                        src={asset("mascot")}
                        alt="klikebooth mascot"
                      />
                    </>
                  )}
                  <div className="retake-grid">
                    {photos.map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setRetake(i);
                          go("camera");
                        }}
                      >
                        <img src={photo} alt="" />
                        Retake photo {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    className="primary finish"
                    disabled={busy}
                    onClick={finish}
                  >
                    {busy ? "Finishing…" : "Keep this moment"}{" "}
                    <ArrowRight size={18} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      setPhotos([]);
                      setRetake(null);
                      setBusy(false);
                      go("camera");
                    }}
                  >
                    <RotateCcw size={15} /> Retake photos
                  </button>
                </div>
              </div>
            </>
          )}
          {page === "result" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">A MEMORY, MADE BY YOU</div>
                <h1>
                  That’s a <em>keeper.</em> ♡
                </h1>
                <p>A little moment of happy. Take it with you.</p>
              </div>
              <div className="result">
                <img src={result} alt="Hasil final 4 foto klikebooth" />
                <div>
                  <img
                    className="result-mascot"
                    src={asset("mascot")}
                    alt="Your happy studio friend"
                  />
                  <h2>
                    Good times.
                    <br />
                    Cute little keepsakes.
                  </h2>
                  <p>Your {selected.name} moment is ready.</p>
                  <a
                    className="primary"
                    href={result}
                    download="klikebooth.png"
                  >
                    <Download size={18} /> Download PNG
                  </a>
                  <button className="secondary" onClick={share}>
                    <Share2 size={18} /> Share photo
                  </button>
                  <button className="text-button" onClick={() => go("edit")}>
                    Back to Art Lab
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      setPhotos([]);
                      setCaption("");
                      setSticker([]);
                      setEffect("Original");
                      go("studio");
                    }}
                  >
                    Make another memory →
                  </button>
                  <button className="text-button" onClick={() => go("home")}>
                    Back home
                  </button>
                  <small>Made locally, kept by you. No photos uploaded.</small>
                </div>
              </div>
            </>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </main>
      )}
      <footer>
        <img src={asset("logo")} alt="klikebooth" />
        <span>The little happy studio.</span>
        <span>
          Made with ♡ for Killo <span className="footer-star">✦</span>
        </span>
      </footer>
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
