// Shared motion: preloader, cursor, magnetic buttons, odometers, kinetic headings, logo river.
const gsap = window.gsap;

// ── Preloader: real loading progress of the assets the hero needs ──
export function preload(urls, onProgress) {
  let done = 0;
  const tick = () => onProgress(++done / urls.length);
  return Promise.all(
    urls.map((u) => new Promise((res) => {
      const img = new Image();
      img.onload = img.onerror = () => { tick(); res(); };
      img.src = u;
    }))
  );
}

// ── Cursor: a dot and a ring; the ring grows over interactive things and can carry a label ──
export function initCursor() {
  if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const dot = Object.assign(document.createElement("div"), { className: "cursor-dot" });
  const ring = Object.assign(document.createElement("div"), { className: "cursor-ring" });
  const label = Object.assign(document.createElement("span"), { className: "cursor-label" });
  ring.appendChild(label);
  document.body.append(ring, dot);
  document.documentElement.classList.add("has-cursor");
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
  addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  const loop = () => {
    rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest("a, button, [data-cursor], .orbit__item, .node");
    ring.classList.toggle("is-hover", !!t);
    const text = t?.closest("[data-cursor]")?.dataset.cursor || "";
    label.textContent = text;
    ring.classList.toggle("has-label", !!text);
  });
  document.addEventListener("pointerdown", () => ring.classList.add("is-down"));
  document.addEventListener("pointerup", () => ring.classList.remove("is-down"));
  document.addEventListener("pointerleave", () => ring.classList.add("is-out"));
  document.addEventListener("pointerenter", () => ring.classList.remove("is-out"));
}

export function initMagnetic(root = document) {
  if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.querySelectorAll(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

// ── Odometer: digits roll into place like a mechanical counter ──
export function odometer(el, text, { duration = 1.6, delay = 0 } = {}) {
  el.setAttribute("aria-label", text);
  el.classList.add("odo");
  el.innerHTML = "";
  const cols = [];
  [...text].forEach((ch, i) => {
    if (/\d/.test(ch)) {
      const col = document.createElement("span");
      col.className = "odo__col";
      col.setAttribute("aria-hidden", "true");
      const strip = document.createElement("span");
      strip.className = "odo__strip";
      strip.innerHTML = Array.from({ length: 20 }, (_, k) => `<span>${k % 10}</span>`).join("");
      col.appendChild(strip);
      el.appendChild(col);
      cols.push({ strip, digit: +ch, i });
    } else {
      const s = document.createElement("span");
      s.className = "odo__ch";
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch;
      el.appendChild(s);
    }
  });
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || !gsap;
  cols.forEach(({ strip, digit, i }) => {
    const final = -(10 + digit) * 5; // 5% per digit of the 20-digit strip
    if (reduce) { strip.style.transform = `translateY(${final}%)`; return; }
    gsap.fromTo(strip, { yPercent: 0 }, { yPercent: final, duration: duration + i * 0.06, delay, ease: "expo.out" });
  });
}

// ── Kinetic headings: characters rise and widen into place (variable-font width axis) ──
export function kineticHeadings(root = document) {
  if (!gsap || !window.SplitText || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.querySelectorAll("[data-kinetic]").forEach((h) => {
    const split = new window.SplitText(h, { type: "lines,chars", mask: "lines", linesClass: "k-line", charsClass: "k-char" });
    gsap.from(split.chars, {
      yPercent: 110,
      "--k-w": 62,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.018,
      scrollTrigger: { trigger: h, start: "top 85%", once: true },
    });
  });
}

// ── Logo river: two rows that drift in opposite directions and speed up/skew with scroll velocity ──
export function logoRiver(el) {
  const rows = [...el.querySelectorAll(".river__row")];
  rows.forEach((r) => (r.innerHTML += r.innerHTML)); // seamless loop
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;
  let x = 0, v = 0, last = scrollY, lastT = performance.now(), on = false;
  // measure once (and on resize) instead of forcing layout every frame
  let widths = rows.map((r) => r.scrollWidth / 2);
  addEventListener("resize", () => (widths = rows.map((r) => r.scrollWidth / 2)));
  let running = false;
  new IntersectionObserver(([e]) => {
    on = e.isIntersecting;
    if (on && !running) { running = true; lastT = performance.now(); requestAnimationFrame(loop); }
  }).observe(el);
  const loop = () => {
    if (!on) { running = false; return; }
    const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000) * 60;
    lastT = now;
    const dy = scrollY - last; last = scrollY;
    v += (Math.max(-40, Math.min(40, dy)) - v) * 0.1;
    x += (0.45 + Math.abs(v) * 0.25) * dt;
    rows.forEach((r, i) => {
      const w = widths[i];
      const off = (x % w) * (i % 2 ? 1 : -1) - (i % 2 ? w : 0);
      r.style.transform = `translate3d(${off}px,0,0) skewX(${(-v * 0.25).toFixed(2)}deg)`;
    });
    requestAnimationFrame(loop);
  };
}

// ── Scrubbed word-by-word reveal for the kinetic statement ──
export function scrubWords(el) {
  if (!gsap || !window.SplitText || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const split = new window.SplitText(el, { type: "words", wordsClass: "scrub-word" });
  gsap.fromTo(split.words, { opacity: 0.14 }, {
    opacity: 1, ease: "none", stagger: 0.1,
    scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
  });
}
