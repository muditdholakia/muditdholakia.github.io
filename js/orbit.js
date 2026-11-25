// Skills orbit: three tilted rings of real product logos around the monogram.
// Items are real buttons (focusable); hover or focus pauses the system and shows where the skill was used.

export function initOrbit(root, groups, { reduced = false, onSelect } = {}) {
  const stage = root.querySelector(".orbit__stage");
  const items = [...root.querySelectorAll(".orbit__item")];
  const rings = groups.map((g, gi) => ({
    gi,
    els: items.filter((el) => +el.dataset.ring === gi),
    speed: [0.12, -0.075, 0.05][gi] || 0.06,
    radius: [0.24, 0.37, 0.5][gi] || 0.5,
  }));

  let W = 0, H = 0, t = 0, speed = 1, targetSpeed = 1, raf = 0, running = true, focusRing = -1;
  let tilt = 0.36; // vertical squash of the ellipses (≈ rotateX 69°); rounder on narrow screens

  function measure() {
    const r = stage.getBoundingClientRect();
    W = r.width; H = r.height;
    tilt = W < 640 ? 0.82 : 0.36;
    root.querySelectorAll(".orbit__ring").forEach((el, i) => {
      const R = Math.min(W, H / tilt * 0.98) * rings[i].radius;
      el.style.width = `${R * 2}px`;
      el.style.height = `${R * 2 * tilt}px`;
    });
  }

  function place() {
    const cx = W / 2, cy = H / 2;
    for (const ring of rings) {
      const R = Math.min(W, H / tilt * 0.98) * ring.radius;
      const n = ring.els.length;
      ring.els.forEach((el, i) => {
        const a = t * ring.speed + (i / n) * Math.PI * 2 + ring.gi * 0.6;
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R * tilt;
        const depth = Math.sin(a); // -1 back … 1 front
        const s = 0.72 + (depth + 1) * 0.2;
        const dim = focusRing >= 0 && focusRing !== ring.gi ? 0.18 : 1;
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s.toFixed(3)})`;
        el.style.zIndex = String(depth > 0 ? 20 + Math.round(depth * 10) : 1 + Math.round((depth + 1) * 5));
        el.style.opacity = ((0.45 + (depth + 1) * 0.275) * dim).toFixed(3);
      });
    }
  }

  let last = performance.now();
  function tick() {
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    speed += (targetSpeed - speed) * (1 - Math.exp(-dt * 4));
    t += dt * speed;
    place();
    if (running && !reduced) raf = requestAnimationFrame(tick);
  }

  const card = root.querySelector(".orbit__card");
  function show(el) {
    targetSpeed = 0;
    items.forEach((i) => i.classList.toggle("is-on", i === el));
    const g = groups[+el.dataset.ring], it = g.items[+el.dataset.i];
    card.querySelector(".orbit__card-ring").textContent = g.title;
    card.querySelector(".orbit__card-name").textContent = it.name;
    card.querySelector(".orbit__card-note").textContent = it.note;
    card.dataset.ring = g.ring;
    card.classList.add("is-on");
    onSelect?.(it);
  }
  function hide() {
    targetSpeed = 1;
    items.forEach((i) => i.classList.remove("is-on"));
    card.classList.remove("is-on");
  }
  items.forEach((el) => {
    el.addEventListener("pointerenter", () => show(el));
    el.addEventListener("pointerleave", hide);
    el.addEventListener("focus", () => show(el));
    el.addEventListener("blur", hide);
    el.addEventListener("click", () => show(el));
  });

  root.querySelectorAll("[data-ring-filter]").forEach((b) => {
    b.addEventListener("click", () => {
      const r = +b.dataset.ringFilter;
      focusRing = focusRing === r ? -1 : r;
      root.querySelectorAll("[data-ring-filter]").forEach((x) => x.setAttribute("aria-pressed", String(+x.dataset.ringFilter === focusRing)));
      root.dataset.focus = focusRing;
      place();
    });
  });

  measure();
  place();
  new ResizeObserver(() => { measure(); place(); }).observe(stage);
  if (!reduced) raf = requestAnimationFrame(tick);

  return {
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (running || reduced) return; running = true; last = performance.now(); raf = requestAnimationFrame(tick); },
  };
}
