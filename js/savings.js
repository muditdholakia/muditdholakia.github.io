// Savings: "Decommission → value".
// Each step rebuilds the retired platform's real logo out of particles, then the particles
// turn gold and pour into a vault whose segments are proportional to the money saved.
// Positions are a pure function of scroll progress, so scrubbing backwards rewinds it exactly.

const GOLD = [216, 180, 90];

function loadImage(url) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = url;
  });
}

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

export async function initSavings(canvas, steps, logoUrl, { reduced = false } = {}) {
  const ctx = canvas.getContext("2d");
  const imgs = {};
  await Promise.all(
    [...new Set(steps.flatMap((s) => s.from))].map(async (k) => (imgs[k] = await loadImage(logoUrl(k))))
  );

  let W = 0, H = 0, dpr = 1, pools = [], vault = null;
  const total = steps.reduce((a, s) => a + s.value, 0);

  function sampleLogos(keys, box, max) {
    const off = document.createElement("canvas");
    off.width = Math.round(box.w); off.height = Math.round(box.h);
    const o = off.getContext("2d", { willReadFrequently: true });
    const n = keys.length, gap = box.w * 0.08;
    const cell = (box.w - gap * (n - 1)) / n;
    keys.forEach((k, i) => {
      const img = imgs[k];
      if (!img) return;
      const s = Math.min(cell, box.h) * 0.92;
      const ar = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      const w = ar >= 1 ? s : s * ar, h = ar >= 1 ? s / ar : s;
      o.drawImage(img, i * (cell + gap) + (cell - w) / 2, (box.h - h) / 2, w, h);
    });
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const pts = [];
    const step = Math.max(2, Math.round(Math.sqrt((off.width * off.height) / (max * 2.2))));
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        const i = (y * off.width + x) * 4;
        // lift brand colours towards white so dark logos stay legible on the navy background
        if (data[i + 3] > 140) pts.push({ x: box.x + x, y: box.y + y, c: [data[i] + (255 - data[i]) * 0.38, data[i + 1] + (255 - data[i + 1]) * 0.38, data[i + 2] + (255 - data[i + 2]) * 0.38] });
      }
    }
    // shuffle and cap
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    return pts.slice(0, max);
  }

  function build() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const narrow = W < 560;
    // vault: a tall column on the right of the canvas, filled bottom-up in proportion to each saving
    vault = { x: W * (narrow ? 0.78 : 0.8), w: W * (narrow ? 0.14 : 0.1), top: H * 0.14, bottom: H * 0.9 };
    const vh = vault.bottom - vault.top;
    let acc = 0;
    const box = { x: W * 0.05, y: H * 0.2, w: W * (narrow ? 0.66 : 0.62), h: H * 0.6 };
    pools = steps.map((s, si) => {
      const seg = { y0: vault.bottom - ((acc + s.value) / total) * vh, y1: vault.bottom - (acc / total) * vh };
      acc += s.value;
      const pts = sampleLogos(s.from, box, narrow ? 900 : 1500);
      return pts.map((p, i) => ({
        lx: p.x, ly: p.y, c: p.c,
        sx: p.x + (Math.random() - 0.5) * W * 0.5, sy: p.y + (Math.random() - 0.5) * H * 0.9,
        vx: vault.x + Math.random() * vault.w, vy: seg.y0 + Math.random() * Math.max(2, seg.y1 - seg.y0 - 1),
        d: (p.x - box.x) / box.w * 0.35 + Math.random() * 0.1, // left side leaves first
        r: Math.random(),
        seg,
      }));
    });
  }

  let P = 0, target = 0, raf = 0, running = true, time = 0, last = performance.now();

  function draw() {
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    time += dt;
    // time-based smoothing: same feel at any frame rate
    P += (target - P) * (reduced ? 1 : 1 - Math.exp(-dt * 7));
    ctx.clearRect(0, 0, W, H);

    // vault outline + filled segments for completed steps
    ctx.strokeStyle = "rgba(230,234,239,0.28)";
    ctx.lineWidth = 1;
    ctx.strokeRect(vault.x - 6.5, vault.top - 6.5, vault.w + 13, vault.bottom - vault.top + 13);
    pools.forEach((pool, si) => {
      if (!pool.length) return;
      const seg = pool[0].seg;
      const filled = clamp01((P - si - 0.86) / 0.14);
      if (filled > 0) {
        ctx.fillStyle = `rgba(216,180,90,${0.16 * filled})`;
        ctx.fillRect(vault.x, seg.y0, vault.w, seg.y1 - seg.y0);
      }
      ctx.strokeStyle = "rgba(230,234,239,0.14)";
      ctx.beginPath(); ctx.moveTo(vault.x - 6, seg.y0); ctx.lineTo(vault.x + vault.w + 6, seg.y0); ctx.stroke();
    });

    for (let si = 0; si < pools.length; si++) {
      const t = P - si;
      if (t < 0) continue;
      const pool = pools[si];
      for (let k = 0; k < pool.length; k++) {
        const p = pool[k];
        let x, y, col = p.c, a = 1, size = 2.3;
        if (t < 0.32) {
          const q = ease(clamp01(t / 0.32 - p.r * 0.25));
          x = p.sx + (p.lx - p.sx) * q; y = p.sy + (p.ly - p.sy) * q; a = q;
        } else if (t < 0.5) {
          x = p.lx + Math.sin(time * 2 + p.r * 9) * 0.6; y = p.ly + Math.cos(time * 2 + p.r * 7) * 0.6;
        } else {
          const q = ease(clamp01((t - 0.5 - p.d * 0.4) / 0.42));
          // arc up and over into the vault
          const cx = (p.lx + p.vx) / 2, cy = Math.min(p.ly, p.vy) - H * (0.18 + p.r * 0.12);
          const u = 1 - q;
          x = u * u * p.lx + 2 * u * q * cx + q * q * p.vx;
          y = u * u * p.ly + 2 * u * q * cy + q * q * p.vy;
          const g = clamp01(q * 1.4);
          col = [p.c[0] + (GOLD[0] - p.c[0]) * g, p.c[1] + (GOLD[1] - p.c[1]) * g, p.c[2] + (GOLD[2] - p.c[2]) * g];
          size = 2.3 - q * 0.6;
        }
        ctx.fillStyle = `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${a})`;
        ctx.fillRect(x, y, size, size);
      }
    }
    if (running && !reduced) raf = requestAnimationFrame(draw);
  }

  build();
  addEventListener("resize", () => { build(); if (reduced) draw(); });
  if (reduced) { target = P = steps.length; draw(); } else raf = requestAnimationFrame(draw);

  return {
    setProgress(p) { target = Math.max(0, Math.min(steps.length, p)); if (reduced) draw(); },
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (running || reduced) return; running = true; last = performance.now(); raf = requestAnimationFrame(draw); },
  };
}
