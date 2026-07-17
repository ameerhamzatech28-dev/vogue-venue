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

  /* ---------- 3D TILT (attached to each card as it's created) ---------- */
  function attachCardTilt(card) {
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
  }

  /* =========================================================
     REAL MENU DATA + CLICK-TO-SELECT ORDER BUILDER
     -----------------------------------------------------------
     Every item below is [label, price]. Single-price items use
     one pair with an empty label. Sized items (pizzas, pasta)
     list one pair per size — each size is selected independently.
     Prices are transcribed directly from the restaurant's own
     printed/photographed menu.
  ========================================================= */
  const MENU_DATA = [
    { title: "Pizza Deals", items: [
      { id: "d3", img: "https://images.unsplash.com/photo-1618213837799-25d5552820d3?w=600&q=75&fit=crop&auto=format", name: "Special Deal", desc: "1 Large Ten 11 Special Pizza, 1 Half Special Pasta, 1 Drink 1.5 Ltr", prices: [["", 1950]] },
      { id: "d4", img: "https://images.unsplash.com/photo-1767065603116-8cee3bf11372?w=600&q=75&fit=crop&auto=format", name: "Value Deal", desc: "2 Medium Pizzas (Ten 11 Special + Reg), 1 Drink 1.5 Ltr", prices: [["", 2050]] },
      { id: "d5", img: "https://images.unsplash.com/photo-1773620497483-aafa93392160?w=600&q=75&fit=crop&auto=format", name: "Super Deal", desc: "1 Large Ten 11 Special Pizza, 1 Medium Reg. Pizza, 1 Drink 1.5 Ltr", prices: [["", 2400]] },
      { id: "d6", img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=75&fit=crop&auto=format", name: "Friends Deal", desc: "4 Burgers (Chicken, BBQ), 6 Pcs Wings Oven Baked, 1 Drink 1.5 Ltr", prices: [["", 1600]] },
      { id: "d7", img: "https://images.unsplash.com/photo-1592977731761-2d58aafef572?w=600&q=75&fit=crop&auto=format", name: "Chaska Deal", desc: "1 Small Ten 11 Sp. Pizza, 1 Half Pasta, 6 Pcs Wings Oven Baked, 1 Drink 1 Ltr", prices: [["", 1200]] },
      { id: "d8", img: "https://images.unsplash.com/photo-1767065603441-61923212f80c?w=600&q=75&fit=crop&auto=format", name: "Royal Deal", desc: "1 Large Behari Kabab Pizza, 1 Half Pasta, 2 Patty Burger, 1 Drink 1.5 Ltr", prices: [["", 2400]] },
      { id: "d9", img: "https://images.unsplash.com/photo-1602658014714-26b99d5a45cf?w=600&q=75&fit=crop&auto=format", name: "Mega Deal", desc: "3 Large Pizzas (2 Ten 11 Special + 1 Reg), 1 Full Pasta, 2 Drinks 1.5 Ltr", prices: [["", 4850]] },
      { id: "d10", img: "https://images.unsplash.com/photo-1542282811-943ef1a977c3?w=600&q=75&fit=crop&auto=format", name: "Family Deal", desc: "2 XL Ten 11 Special Pizzas, 1 Full Pasta, 4 Pcs Spin Rolls, 10 Pcs Wings Oven Baked, 2 Drinks 1.5 Ltr", prices: [["", 5550]] },
    ]},
    { title: "Fried Deals", items: [
      { id: "d11", img: "https://images.unsplash.com/photo-1637710847214-f91d99669e18?w=600&q=75&fit=crop&auto=format", name: "Deal 11", desc: "1 Zinger Burger, 1 Reg. Fries, 1 Reg. Drink", prices: [["", 620]] },
      { id: "d12", img: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=75&fit=crop&auto=format", name: "Deal 12", desc: "3 Chicken Pcs, 1 Reg. Fries, Half Ltr Drink", prices: [["", 950]] },
      { id: "d13", img: "https://images.unsplash.com/photo-1734987942068-a1a459d65d3d?w=600&q=75&fit=crop&auto=format", name: "Deal 13", desc: "2 Zinger Burger, 10 Pcs Hot Wings, 1.5 Ltr Drink", prices: [["", 1430]] },
      { id: "d14", img: "https://images.unsplash.com/photo-1637710847214-f91d99669e18?w=600&q=75&fit=crop&auto=format", name: "Deal 14", desc: "4 Zinger Burger, 1.5 Ltr Drink", prices: [["", 1500]] },
      { id: "d15", img: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=75&fit=crop&auto=format", name: "Deal 15", desc: "2 Chicken Pcs, 2 Zinger Burger, 1.5 Ltr Drink", prices: [["", 1260]] },
      { id: "d16", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=75&fit=crop&auto=format", name: "Deal 16", desc: "2 Zinger Burger, 2 Patty Burger, 1 Ltr Drink", prices: [["", 1280]] },
      { id: "d17", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Deal 17", desc: "3 Chicken Shawarma, 3 Zinger Burger, 10 Hot Wings, 5 Nuggets, 2.25 Ltr Drink", prices: [["", 2700]] },
      { id: "d18", img: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=75&fit=crop&auto=format", name: "Deal 18", desc: "9 Chicken Pcs, 1 Reg. Fries, 1 Ltr Drink", prices: [["", 2200]] },
    ]},
    { title: "Ten 11 Special Flavours (Pizza)", items: [
      { id: "sp1", img: "https://images.unsplash.com/photo-1618213837799-25d5552820d3?w=600&q=75&fit=crop&auto=format", name: "Ten 11 Special Pizza", prices: [["Small", 510], ["Medium", 1050], ["Large", 1350], ["Extra Large", 1850]] },
      { id: "sp2", img: "https://images.unsplash.com/photo-1767065603116-8cee3bf11372?w=600&q=75&fit=crop&auto=format", name: "Bonfire Pizza", prices: [["Small", 510], ["Medium", 1050], ["Large", 1350], ["Extra Large", 1850]] },
      { id: "sp3", img: "https://images.unsplash.com/photo-1773620497483-aafa93392160?w=600&q=75&fit=crop&auto=format", name: "Behari Kabab Pizza", prices: [["Medium", 1100], ["Large", 1400], ["Extra Large", 2050]] },
      { id: "sp4", img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=75&fit=crop&auto=format", name: "Kabab Stuffed Pizza", prices: [["Medium", 1150], ["Large", 1500], ["Extra Large", 2100]] },
      { id: "sp5", img: "https://images.unsplash.com/photo-1592977731761-2d58aafef572?w=600&q=75&fit=crop&auto=format", name: "Cheese Stuffed Pizza", prices: [["Medium", 1150], ["Large", 1500], ["Extra Large", 2100]] },
      { id: "sp6", img: "https://images.unsplash.com/photo-1767065603441-61923212f80c?w=600&q=75&fit=crop&auto=format", name: "Ch. Cheese Stuffed Pizza", prices: [["Medium", 1150], ["Large", 1500], ["Extra Large", 2100]] },
      { id: "sp7", img: "https://images.unsplash.com/photo-1602658014714-26b99d5a45cf?w=600&q=75&fit=crop&auto=format", name: "Royal Crust Pizza", prices: [["Medium", 1150], ["Large", 1500], ["Extra Large", 2100]] },
      { id: "sp8", img: "https://images.unsplash.com/photo-1542282811-943ef1a977c3?w=600&q=75&fit=crop&auto=format", name: "Malai Boti Pizza", prices: [["Medium", 1150], ["Large", 1500], ["Extra Large", 2100]] },
    ]},
    { title: "Regular Flavours (Pizza)", items: [
      { id: "rg1", img: "https://images.unsplash.com/photo-1773620497483-aafa93392160?w=600&q=75&fit=crop&auto=format", name: "Chicken Tikka", prices: [["Small", 450], ["Medium", 950], ["Large", 1250], ["Extra Large", 1650]] },
      { id: "rg2", img: "https://images.unsplash.com/photo-1767065603441-61923212f80c?w=600&q=75&fit=crop&auto=format", name: "Chicken Fajita", prices: [["Small", 450], ["Medium", 950], ["Large", 1250], ["Extra Large", 1650]] },
      { id: "rg3", img: "https://images.unsplash.com/photo-1592977731761-2d58aafef572?w=600&q=75&fit=crop&auto=format", name: "Cheese Loaded", prices: [["Small", 450], ["Medium", 950], ["Large", 1250], ["Extra Large", 1650]] },
      { id: "rg4", img: "https://images.unsplash.com/photo-1767065603116-8cee3bf11372?w=600&q=75&fit=crop&auto=format", name: "Chicken Supreme", prices: [["Small", 470], ["Medium", 1000], ["Large", 1300], ["Extra Large", 1700]] },
      { id: "rg5", img: "https://images.unsplash.com/photo-1618213837799-25d5552820d3?w=600&q=75&fit=crop&auto=format", name: "Super Supreme", prices: [["Small", 490], ["Medium", 1050], ["Large", 1350], ["Extra Large", 1750]] },
    ]},
    { title: "Burgers", items: [
      { id: "b1", img: "https://images.unsplash.com/photo-1637710847214-f91d99669e18?w=600&q=75&fit=crop&auto=format", name: "Zinger Burger", prices: [["", 350]] },
      { id: "b2", img: "https://images.unsplash.com/photo-1700835880412-b995b6a28006?w=600&q=75&fit=crop&auto=format", name: "Mighty Burger", prices: [["", 550]] },
      { id: "b3", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=75&fit=crop&auto=format", name: "Chicken Burger", prices: [["", 300]] },
      { id: "b4", img: "https://images.unsplash.com/photo-1700835880412-b995b6a28006?w=600&q=75&fit=crop&auto=format", name: "BBQ Burger", prices: [["", 300]] },
      { id: "b5", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=75&fit=crop&auto=format", name: "Jalapeno Burger", prices: [["", 300]] },
      { id: "b6", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=75&fit=crop&auto=format", name: "Patty Burger", prices: [["", 250]] },
      { id: "b7", img: "https://images.unsplash.com/photo-1637710847214-f91d99669e18?w=600&q=75&fit=crop&auto=format", name: "Grill Burger", prices: [["", 350]] },
    ]},
    { title: "Appetizers", items: [
      { id: "ap1", img: "https://images.unsplash.com/photo-1734987942068-a1a459d65d3d?w=600&q=75&fit=crop&auto=format", name: "Hot Wings (10 Pcs)", prices: [["", 600]] },
      { id: "ap2", img: "https://images.unsplash.com/photo-1734987942068-a1a459d65d3d?w=600&q=75&fit=crop&auto=format", name: "Oven Baked Wings (10 Pcs)", prices: [["", 500]] },
      { id: "ap3", img: "https://images.unsplash.com/photo-1734987942068-a1a459d65d3d?w=600&q=75&fit=crop&auto=format", name: "BBQ Wings (10 Pcs)", prices: [["", 550]] },
      { id: "ap4", img: "https://images.unsplash.com/photo-1734987942068-a1a459d65d3d?w=600&q=75&fit=crop&auto=format", name: "Honey Wings (10 Pcs)", prices: [["", 550]] },
      { id: "ap5", img: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=75&fit=crop&auto=format", name: "Hot Shots (10 Pcs)", prices: [["", 400]] },
      { id: "ap6", img: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&q=75&fit=crop&auto=format", name: "Nuggets (10 Pcs)", prices: [["", 400]] },
    ]},
    { title: "Chicken Pieces", items: [
      { id: "cp1", img: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=75&fit=crop&auto=format", name: "3 Chicken Pcs", prices: [["", 650]] },
      { id: "cp2", img: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=75&fit=crop&auto=format", name: "5 Chicken Pcs", prices: [["", 1000]] },
      { id: "cp3", img: "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=600&q=75&fit=crop&auto=format", name: "9 Chicken Pcs", prices: [["", 1900]] },
    ]},
    { title: "Fries", items: [
      { id: "fr1", img: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=75&fit=crop&auto=format", name: "Regular Fries", prices: [["", 250]] },
      { id: "fr2", img: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=75&fit=crop&auto=format", name: "Large Fries", prices: [["", 320]] },
      { id: "fr3", img: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=75&fit=crop&auto=format", name: "Mayo Fries", prices: [["", 450]] },
      { id: "fr4", img: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=600&q=75&fit=crop&auto=format", name: "Pizza Fries", prices: [["", 600]] },
    ]},
    { title: "Shawarma (Rolls)", items: [
      { id: "sh1", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Chicken Shawarma", prices: [["", 250]] },
      { id: "sh2", img: "https://images.unsplash.com/photo-1598806243937-2072d39bc11d?w=600&q=75&fit=crop&auto=format", name: "Ch. Cheese Shawarma", prices: [["", 300]] },
      { id: "sh3", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Ch. Pizza Shawarma", prices: [["", 350]] },
      { id: "sh4", img: "https://images.unsplash.com/photo-1598806243937-2072d39bc11d?w=600&q=75&fit=crop&auto=format", name: "Zinger Shawarma", prices: [["", 300]] },
      { id: "sh5", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Tikka Shawarma", prices: [["", 300]] },
      { id: "sh6", img: "https://images.unsplash.com/photo-1598806243937-2072d39bc11d?w=600&q=75&fit=crop&auto=format", name: "Kabab Shawarma", prices: [["", 300]] },
      { id: "sh7", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Malai Boti Shawarma", prices: [["", 300]] },
    ]},
    { title: "Paratha Rolls", items: [
      { id: "pr1", img: "https://images.unsplash.com/photo-1598806243937-2072d39bc11d?w=600&q=75&fit=crop&auto=format", name: "Chicken Paratha", prices: [["", 250]] },
      { id: "pr2", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Ch. Cheese Paratha", prices: [["", 320]] },
      { id: "pr3", img: "https://images.unsplash.com/photo-1598806243937-2072d39bc11d?w=600&q=75&fit=crop&auto=format", name: "Zinger Paratha", prices: [["", 300]] },
      { id: "pr4", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Malai Boti Paratha", prices: [["", 300]] },
      { id: "pr5", img: "https://images.unsplash.com/photo-1598806243937-2072d39bc11d?w=600&q=75&fit=crop&auto=format", name: "Kabab Paratha", prices: [["", 300]] },
      { id: "pr6", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Special Paratha", prices: [["", 300]] },
    ]},
    { title: "Rolls", items: [
      { id: "rl1", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Spin Roll", prices: [["", 500]] },
      { id: "rl2", img: "https://images.unsplash.com/photo-1598806243937-2072d39bc11d?w=600&q=75&fit=crop&auto=format", name: "Behari Roll", prices: [["", 500]] },
      { id: "rl3", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Tampeli Roll", prices: [["", 550]] },
      { id: "rl4", img: "https://images.unsplash.com/photo-1598806243937-2072d39bc11d?w=600&q=75&fit=crop&auto=format", name: "Malai Boti Roll", prices: [["", 550]] },
      { id: "rl5", img: "https://images.unsplash.com/photo-1719282431987-2382e77e5a1b?w=600&q=75&fit=crop&auto=format", name: "Ten 11 Special Roll", prices: [["", 550]] },
    ]},
    { title: "Pasta (Half / Full)", items: [
      { id: "ps1", img: "https://images.unsplash.com/photo-1749384156571-93b5c1b9ff92?w=600&q=75&fit=crop&auto=format", name: "Creamy Pasta", prices: [["Half", 380], ["Full", 700]] },
      { id: "ps2", img: "https://images.unsplash.com/photo-1749384156571-93b5c1b9ff92?w=600&q=75&fit=crop&auto=format", name: "Flaming Pasta", prices: [["Half", 380], ["Full", 700]] },
      { id: "ps3", img: "https://images.unsplash.com/photo-1749384156571-93b5c1b9ff92?w=600&q=75&fit=crop&auto=format", name: "Crunchy Pasta", prices: [["Half", 400], ["Full", 750]] },
      { id: "ps4", img: "https://images.unsplash.com/photo-1749384156571-93b5c1b9ff92?w=600&q=75&fit=crop&auto=format", name: "Ten 11 Special Pasta", prices: [["Half", 450], ["Full", 850]] },
    ]},
    { title: "Extra Toppings", items: [
      { id: "et1", img: "https://images.unsplash.com/photo-1618213837799-25d5552820d3?w=600&q=75&fit=crop&auto=format", name: "Extra Topping — Chicken", prices: [["Small", 100], ["Medium", 120], ["Large", 140], ["Extra Large", 170]] },
      { id: "et2", img: "https://images.unsplash.com/photo-1767065603116-8cee3bf11372?w=600&q=75&fit=crop&auto=format", name: "Extra Topping — Cheese", prices: [["Small", 100], ["Medium", 120], ["Large", 140], ["Extra Large", 170]] },
    ]},
    { title: "Add-Ons", items: [
      { id: "ad1", img: "https://images.unsplash.com/photo-1734989435134-7e4885259231?w=600&q=75&fit=crop&auto=format", name: "Dip Sauce", prices: [["", 100]] },
      { id: "ad2", img: "https://images.unsplash.com/photo-1734989435134-7e4885259231?w=600&q=75&fit=crop&auto=format", name: "Special Sauce", prices: [["", 120]] },
    ]},
  ];

  // cart key -> { name, label, price }
  const cart = new Map();

  function cartKey(itemId, label) { return itemId + "::" + label; }

  function updateCartUI() {
    const listEl = document.getElementById("cartList");
    const totalEl = document.getElementById("cartTotal");
    const emptyEl = document.getElementById("cartEmpty");
    const summaryInput = document.getElementById("cartSummaryField");
    const totalInput = document.getElementById("cartTotalField");
    if (!listEl || !totalEl) return;

    listEl.innerHTML = "";
    let total = 0;
    const lines = [];
    cart.forEach((entry, key) => {
      total += entry.price;
      const label = entry.label ? ` (${entry.label})` : "";
      lines.push(`${entry.name}${label} — Rs. ${entry.price.toLocaleString()}`);

      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `<span>${entry.name}${label}</span><b>Rs. ${entry.price.toLocaleString()}</b>
        <button type="button" class="cart-remove" aria-label="Remove">&times;</button>`;
      row.querySelector(".cart-remove").addEventListener("click", () => {
        cart.delete(key);
        const btn = document.querySelector(`[data-cart-key="${CSS.escape(key)}"]`);
        if (btn) btn.classList.remove("selected");
        updateCartUI();
      });
      listEl.appendChild(row);
    });

    totalEl.textContent = "Rs. " + total.toLocaleString();
    if (emptyEl) emptyEl.style.display = cart.size ? "none" : "block";
    if (summaryInput) summaryInput.value = lines.join("\n");
    if (totalInput) totalInput.value = String(total);
  }

  function toggleCartItem(item, label, price, btn) {
    const key = cartKey(item.id, label);
    if (cart.has(key)) {
      cart.delete(key);
      btn.classList.remove("selected");
    } else {
      cart.set(key, { name: item.name, label, price });
      btn.classList.add("selected");
    }
    updateCartUI();
  }

  function renderMenu() {
    const mount = document.getElementById("menuMount");
    if (!mount) return;
    mount.innerHTML = "";

    MENU_DATA.forEach((category) => {
      const section = document.createElement("div");
      section.className = "menu-category reveal";

      const heading = document.createElement("h3");
      heading.className = "menu-category-title";
      heading.textContent = category.title;
      section.appendChild(heading);

      const grid = document.createElement("div");
      grid.className = "menu-grid";

      category.items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "menu-card";
        card.innerHTML = `<div class="glare"></div>${item.img ? `<div class="card-photo"><img src="${item.img}" alt="${item.name}" loading="lazy" width="600" height="420"></div>` : ""}<h3>${item.name}</h3>${item.desc ? `<p>${item.desc}</p>` : ""}`;

        const priceRow = document.createElement("div");
        priceRow.className = item.prices.length > 1 ? "price-pills" : "price-single";

        item.prices.forEach(([label, price]) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = item.prices.length > 1 ? "price-pill" : "price-btn";
          btn.dataset.cartKey = cartKey(item.id, label);
          btn.innerHTML = label
            ? `<span class="pill-label">${label}</span><span class="pill-price">Rs. ${price.toLocaleString()}</span>`
            : `Add — Rs. ${price.toLocaleString()}`;
          btn.addEventListener("click", () => toggleCartItem(item, label, price, btn));
          priceRow.appendChild(btn);
        });

        card.appendChild(priceRow);
        attachCardTilt(card);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      mount.appendChild(section);
    });

    // newly created .reveal elements need the same scroll-in observer as the rest of the page
    document.querySelectorAll(".menu-category.reveal").forEach((el) => io.observe(el));
  }
  renderMenu();

  /* ---------- CONTACT / ORDER FORM ---------- */
  const form = document.getElementById("orderForm");
  const formMsg = document.getElementById("formMsg");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!cart.size && !form.querySelector("#order").value.trim()) {
        formMsg.className = "form-msg show err";
        formMsg.textContent = "Please select at least one item from the menu, or add a note below.";
        return;
      }

      formMsg.className = "form-msg show";
      formMsg.textContent = "Sending your order details…";
      const endpoint = form.getAttribute("action");
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
        if (data.ok !== false) {
          form.reset();
          cart.clear();
          document.querySelectorAll(".price-pill.selected, .price-btn.selected").forEach((b) => b.classList.remove("selected"));
          updateCartUI();
        }
      } catch (err) {
        formMsg.classList.add("err");
        formMsg.textContent = "Could not reach the server — please call us at +92 300 1691011 to place your order.";
      }
    });
  }

  /* ---------- CLIENTS ORDERS (staff-only live view) ---------- */
  (function initClientsOrders() {
    const toggle = document.getElementById("ordersToggle");
    const panel = document.getElementById("ordersPanel");
    const gate = document.getElementById("ordersGate");
    const gateMsg = document.getElementById("ordersGateMsg");
    const passInput = document.getElementById("ordersPasscode");
    const unlockBtn = document.getElementById("ordersUnlock");
    const view = document.getElementById("ordersView");
    const tbody = document.getElementById("ordersTableBody");
    const emptyMsg = document.getElementById("ordersEmptyMsg");
    const refreshBtn = document.getElementById("ordersRefresh");
    if (!toggle || !panel) return;

    let passcode = "";
    let pollTimer = null;

    toggle.addEventListener("click", () => {
      const opening = panel.hasAttribute("hidden");
      panel.toggleAttribute("hidden");
      if (opening && passcode) loadOrders();
      if (!opening && pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    });

    unlockBtn.addEventListener("click", async () => {
      const val = passInput.value.trim();
      if (!val) return;
      gateMsg.textContent = "Checking…";
      const res = await fetchOrders(val);
      if (res.ok) {
        passcode = val;
        gate.hidden = true;
        view.hidden = false;
        renderOrders(res.orders);
        pollTimer = setInterval(() => loadOrders(), 15000);
      } else {
        gateMsg.textContent = res.message || "Wrong passcode.";
      }
    });
    passInput.addEventListener("keydown", (e) => { if (e.key === "Enter") unlockBtn.click(); });

    refreshBtn.addEventListener("click", () => loadOrders());

    async function loadOrders() {
      const res = await fetchOrders(passcode);
      if (res.ok) renderOrders(res.orders);
    }

    async function fetchOrders(pass) {
      try {
        const r = await fetch(`/.netlify/functions/get-orders?passcode=${encodeURIComponent(pass)}`);
        const data = await r.json().catch(() => ({ ok: false, message: "Bad response." }));
        return data;
      } catch (e) {
        return { ok: false, message: "Could not reach the server." };
      }
    }

    function renderOrders(orders) {
      tbody.innerHTML = "";
      if (!orders || !orders.length) {
        emptyMsg.hidden = false;
        return;
      }
      emptyMsg.hidden = true;
      orders.forEach((o) => {
        const tr = document.createElement("tr");
        const when = o.receivedAt ? new Date(o.receivedAt).toLocaleString() : "";
        const items = (o.cart_summary || "").split("\n").filter(Boolean).join("; ") || "—";
        const total = o.cart_total ? "Rs. " + Number(o.cart_total).toLocaleString() : "—";
        tr.innerHTML = `
          <td>${when}</td>
          <td>${escapeHtml(o.name || "")}</td>
          <td>${escapeHtml(o.phone || "")}</td>
          <td>${escapeHtml(o.address || "")}</td>
          <td>${escapeHtml(items)}</td>
          <td>${total}</td>
          <td>${escapeHtml(o.order || "—")}</td>`;
        tbody.appendChild(tr);
      });
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }
  })();

  /* footer year */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
