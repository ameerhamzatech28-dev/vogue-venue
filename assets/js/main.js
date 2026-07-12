/* =========================================================
   TEN11 PIZZA VALLEY — main.js
   Section 1: Scroll-scrubbed hero sequence
   -----------------------------------------------------------
   How it works (this is the "video reacts to scroll" logic):
   - The hero has a tall wrapper (.hero-pin-wrap, e.g. 340vh)
     and a sticky inner layer (.hero-sticky, 100vh) that stays
     pinned to the viewport while the wrapper scrolls past it.
   - We compute `progress` (0 -> 1) from how far the user has
     scrolled through that wrapper.
   - We NEVER call video.play(). We only ever SET
     video.currentTime = progress * video.duration.
     That single line is what makes it behave exactly like the
     request: scroll down = plays forward, stop scrolling =
     freezes on that exact frame, scroll up = plays in reverse.
   - Because no video file was supplied, this build ships with
     a canvas illustration ("the bake sequence") driven by the
     exact same `progress` value, so you see the effect live.
     Swap in a real video any time — see swapInRealVideo() below.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- utilities ---------- */
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t); // smoothstep, for gentler easing between stages

  /* ---------- NAV ---------- */
  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }, { passive: true });
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const open = navLinks.style.display === "flex";
      navLinks.style.display = open ? "none" : "flex";
      navLinks.style.cssText += "flex-direction:column;position:fixed;top:64px;right:5%;background:#1C1712;padding:1.4em 2em;border-radius:8px;";
    });
  }

  /* ---------- SCROLL REVEALS ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => io.observe(el));

  /* ---------- HERO SCROLL-SCRUB SEQUENCE ---------- */
  const wrap = document.querySelector(".hero-pin-wrap");
  const canvas = document.getElementById("bakeCanvas");
  const burgerCanvas = document.getElementById("burgerCanvas");
  const heroCopy = document.querySelector(".hero-copy");
  const scrollCue = document.querySelector(".scroll-cue");
  const progressBar = document.querySelector(".bake-progress");
  const ctx = canvas ? canvas.getContext("2d") : null;
  const bctx = burgerCanvas ? burgerCanvas.getContext("2d") : null;

  let vw = 0, vh = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let bw = 0, bh = 0; // burgerCanvas's own on-screen size (it's a smaller centered box, not full-viewport)
  function sizeCanvas() {
    vw = window.innerWidth; vh = window.innerHeight;
    if (canvas) {
      canvas.width = vw * dpr; canvas.height = vh * dpr;
      canvas.style.width = vw + "px"; canvas.style.height = vh + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if (burgerCanvas) {
      const r = burgerCanvas.getBoundingClientRect();
      bw = r.width; bh = r.height;
      burgerCanvas.width = bw * dpr; burgerCanvas.height = bh * dpr;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);

  /* ---- the "frames": pure functions of progress, so scrubbing
     forward AND backward always lands on the correct visual ---- */
  function drawStage(p) {
    // p: 0 -> 1 across the whole hero sequence
    const cx = vw / 2, cy = vh / 2 + 10;
    const R = Math.min(vw, vh) * 0.24;

    ctx.clearRect(0, 0, vw, vh);

    // ambient charcoal backdrop with subtle glow that warms as the bake progresses
    const glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.6);
    glow.addColorStop(0, `rgba(217,164,65,${0.10 + p * 0.12})`);
    glow.addColorStop(1, "rgba(28,23,18,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, vw, vh);

    // Stage boundaries (each stage eases in/out using smooth())
    const dough   = smooth(clamp((p - 0.00) / 0.18, 0, 1)); // ball -> flattened disc
    const sauce   = smooth(clamp((p - 0.16) / 0.16, 0, 1)); // sauce spreads
    const cheese  = smooth(clamp((p - 0.32) / 0.16, 0, 1)); // cheese layer
    const toppings= smooth(clamp((p - 0.48) / 0.18, 0, 1)); // pepperoni + basil appear
    const bake    = smooth(clamp((p - 0.64) / 0.24, 0, 1)); // oven glow + gold crust
    const steam   = smooth(clamp((p - 0.88) / 0.12, 0, 1)); // finished, steam wisps

    // Crust / dough disc (radius grows as it's "stretched")
    const discR = lerp(R * 0.55, R, dough);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, discR, discR * 0.94, 0, 0, Math.PI * 2);
    const crustGrad = ctx.createRadialGradient(cx, cy, discR * 0.2, cx, cy, discR);
    crustGrad.addColorStop(0, lerpColor("#F3E3B8", "#E7B35A", bake));
    crustGrad.addColorStop(1, lerpColor("#E8C979", "#8A5423", bake));
    ctx.fillStyle = crustGrad;
    ctx.fill();

    // Sauce
    if (sauce > 0) {
      ctx.globalAlpha = sauce;
      ctx.beginPath();
      ctx.ellipse(cx, cy, discR * 0.86, discR * 0.86 * 0.94, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#C23B24";
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Cheese
    if (cheese > 0) {
      ctx.globalAlpha = cheese;
      ctx.beginPath();
      ctx.ellipse(cx, cy, discR * 0.8, discR * 0.8 * 0.94, 0, 0, Math.PI * 2);
      ctx.fillStyle = lerpColor("#F7E9B7", "#E8C25A", bake);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Toppings: pepperoni ring + basil flecks, fading/scaling in
    if (toppings > 0) {
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.3;
        const rr = discR * 0.52;
        const tx = cx + Math.cos(a) * rr;
        const ty = cy + Math.sin(a) * rr * 0.94;
        const pr = discR * 0.11 * smooth(clamp((toppings - i * 0.06), 0, 1));
        ctx.beginPath();
        ctx.ellipse(tx, ty, pr, pr, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#8B2E20";
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(tx, ty, pr * 0.55, pr * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = "#6E2013";
        ctx.fill();
      }
      // basil flecks
      const nb = 6;
      for (let i = 0; i < nb; i++) {
        const a = (i / nb) * Math.PI * 2 + 1.1;
        const rr = discR * 0.28;
        const tx = cx + Math.cos(a) * rr;
        const ty = cy + Math.sin(a) * rr * 0.94;
        const s = discR * 0.045 * smooth(clamp((toppings - i * 0.05), 0, 1));
        ctx.beginPath();
        ctx.ellipse(tx, ty, s, s * 1.6, a, 0, Math.PI * 2);
        ctx.fillStyle = "#4B6B3A";
        ctx.fill();
      }
    }

    // Oven glow overlay while baking
    if (bake > 0 && steam < 0.4) {
      ctx.globalAlpha = bake * 0.18 * (1 - steam);
      ctx.beginPath();
      ctx.ellipse(cx, cy, discR * 1.5, discR * 1.5 * 0.94, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#FF7A3D";
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Steam wisps once finished
    if (steam > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(247,239,225,${0.5 * steam})`;
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        const baseX = cx + i * discR * 0.4;
        ctx.beginPath();
        for (let t = 0; t <= 1; t += 0.05) {
          const yy = cy - discR * 0.9 - t * 90 * steam;
          const xx = baseX + Math.sin(t * 6 + i) * 10 * steam;
          if (t === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function lerpColor(hexA, hexB, t) {
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
  }
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* ---------------------------------------------------------
     REAL-FOOTAGE SCRUBBING — image-frame-sequence approach
     -----------------------------------------------------------
     Scrubbing an actual <video> element's currentTime looks
     smooth in theory, but in practice it stutters: every seek
     has to decode forward from the nearest keyframe, and most
     exported MP4s only put a keyframe every ~1-2 seconds. Rapid
     scroll = rapid seeks = visible stalls.

     The fix (the same one Apple's product pages use) is to skip
     video seeking entirely: export the clip as a sequence of
     still frames, preload them as images, and on scroll just
     pick the right one and draw it to the canvas. Drawing a
     preloaded raster image is effectively instant, so there is
     nothing left to stutter — forward, frozen, and reverse all
     become a simple array lookup instead of a decode operation.

     On top of that, only the burger itself should spin — not the
     whole video frame — and the footage's black studio backdrop
     should disappear entirely, leaving the site's own original
     hero background showing through. So for each frame we:
       1) crop tight to the centre (where the burger sits), and
       2) chroma-key out near-black pixels (turn them transparent),
     once up front, caching the result. Only that small transparent
     cutout is ever drawn or rotated — the full frame is never
     drawn as a "background" at all, so there's nothing left to
     rotate except the burger, and no black rectangle to remove.
  --------------------------------------------------------- */
  const frameImgs = [];
  const keyedFrames = []; // pre-processed, background-removed cutouts (one per frame)
  let framesReady = false;
  let framesLoaded = 0;

  // Generous crop — safe margin so the burger is never clipped even mid-open.
  // Any extra black margin caught in this box is removed by the keying step,
  // so it's fine to err on the larger side here.
  const CROP = { x: 0.14, y: 0.06, w: 0.72, h: 0.9 };
  const KEY_OUT_MAX = 800; // longest-edge working resolution for the cutout

  function keyOutBlack(img) {
    const sx = img.naturalWidth * CROP.x, sy = img.naturalHeight * CROP.y;
    const sw = img.naturalWidth * CROP.w, sh = img.naturalHeight * CROP.h;

    // Preserve the crop's exact aspect ratio here — this is drawn once at
    // this size with NO cropping (straight scale-to-fit), so nothing from
    // the sides or top/bottom is ever lost.
    let outW, outH;
    if (sw >= sh) { outW = KEY_OUT_MAX; outH = Math.round(KEY_OUT_MAX * sh / sw); }
    else { outH = KEY_OUT_MAX; outW = Math.round(KEY_OUT_MAX * sw / sh); }

    const off = document.createElement("canvas");
    off.width = outW; off.height = outH;
    const octx = off.getContext("2d");
    octx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    try {
      const imgData = octx.getImageData(0, 0, outW, outH);
      const d = imgData.data;
      const lowT = 16, highT = 55; // luminance range treated as "studio black"
      for (let p = 0; p < d.length; p += 4) {
        const lum = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
        const a = clamp((lum - lowT) / (highT - lowT), 0, 1);
        d[p + 3] = d[p + 3] * a;
      }
      octx.putImageData(imgData, 0, 0);
    } catch (e) {
      // If the canvas ever gets tainted (e.g. file:// without a local server),
      // just fall back to the un-keyed crop rather than breaking the page.
    }
    return off;
  }

  window.initHeroFrames = function (pathFn, count) {
    for (let i = 1; i <= count; i++) {
      const idx = i - 1;
      const img = new Image();
      img.onload = () => {
        keyedFrames[idx] = keyOutBlack(img);
        framesLoaded++;
        if (framesLoaded >= count) framesReady = true;
      };
      img.onerror = () => {
        framesLoaded++;
        if (framesLoaded >= count) framesReady = true;
      };
      img.src = pathFn(i);
      frameImgs.push(img);
    }
  };

  // Only the cutout is ever drawn — this is the sole layer that rotates.
  // Uses contain-fit (Math.min, not Math.max) so the full burger always
  // fits inside its box with nothing cropped off the sides — any leftover
  // space is just transparent margin, invisible against the page background.
  function drawBurgerCrop(progress) {
    if (!bctx || !bw || !bh) return false;
    const idx = clamp(Math.round(progress * (keyedFrames.length - 1)), 0, keyedFrames.length - 1);
    const keyed = keyedFrames[idx];
    if (!keyed) return false;

    const scale = Math.min(bw / keyed.width, bh / keyed.height);
    const dw = keyed.width * scale, dh = keyed.height * scale;
    const dx = (bw - dw) / 2, dy = (bh - dh) / 2;

    bctx.clearRect(0, 0, bw, bh);
    bctx.drawImage(keyed, dx, dy, dw, dh);
    return true;
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = wrap.getBoundingClientRect();
      const total = wrap.offsetHeight - vh;
      const scrolled = clamp(-rect.top, 0, total);
      const progress = total > 0 ? scrolled / total : 0;

      const drewCutout = keyedFrames.length ? drawBurgerCrop(progress) : false;
      if (drewCutout) {
        // Real cutout is showing — bakeCanvas stays empty/transparent so the
        // page's own original hero background (the CSS gradient) shows
        // through instead of any video frame, and only the burger spins.
        ctx.clearRect(0, 0, vw, vh);

        // A flat photo has zero thickness, so a full 90°/270° rotation makes
        // it foreshorten down to nothing and briefly vanish edge-on — swing
        // it left-to-right within a safe range instead (never past ~40°),
        // so it's always fully visible while still clearly turning with
        // scroll direction (down = one way, up = back the other way).
        const angle = lerp(-40, 40, progress);
        burgerCanvas.style.transform = `rotateY(${angle}deg)`;
        // no brightness/colour changes — it should just look like the burger, always
      } else {
        // Frames still preloading — show the illustrated placeholder so
        // there's never a blank hero, then hand off the instant frames land.
        drawStage(progress);
      }

      if (progressBar) progressBar.style.width = (progress * 100).toFixed(1) + "%";

      // Fade + lift the headline copy out as the sequence plays,
      // and hide the scroll cue once the user has actually started scrolling.
      if (heroCopy) {
        heroCopy.style.opacity = String(clamp(1 - progress * 2.2, 0, 1));
        heroCopy.style.transform = `translateY(${progress * -40}px)`;
      }
      if (scrollCue) scrollCue.style.opacity = progress > 0.03 ? "0" : "0.85";

      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 3D TILT MENU CARDS ---------- */
  const cards = document.querySelectorAll(".menu-card");
  cards.forEach((card) => {
    card.style.transform = "perspective(900px)";
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rotY = (px - 0.5) * 14;
      const rotX = (0.5 - py) * 14;
      card.style.transform = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(900px) rotateX(0) rotateY(0) translateZ(0)";
    });
  });

  /* ---------- CONTACT / ORDER FORM ---------- */
  const form = document.getElementById("orderForm");
  const formMsg = document.getElementById("formMsg");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      formMsg.className = "form-msg show";
      formMsg.textContent = "Sending your order details…";
      const endpoint = form.getAttribute("action"); // /api/contact-handler
      try {
        const payload = Object.fromEntries(new FormData(form));
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({ ok: res.ok }));
        formMsg.classList.add(data.ok === false ? "err" : "ok");
        formMsg.textContent = data.ok === false
          ? (data.message || "Something went wrong — please call us instead.")
          : (data.message || "Thanks! We've got your order and will call to confirm shortly.");
        if (data.ok !== false) form.reset();
      } catch (err) {
        formMsg.classList.add("err");
        formMsg.textContent = "Could not reach the server — please call us at +92 300 1691011 to place your order.";
      }
    });
  }

  /* footer year */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
