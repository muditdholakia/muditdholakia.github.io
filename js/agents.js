// Agents: a living system. 3 team agents (rings) and 40 personal agents (points) that orbit,
// drift between teams and exchange messages (brief gold links). Drawn on canvas 2D.

export function initAgents(canvas, { personal = 40, team = 3, hubIcon, reduced = false } = {}) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, raf = 0, running = true, t = 0, born = 0;
  const icon = new Image();
  if (hubIcon) icon.src = hubIcon;

  const hubs = Array.from({ length: team }, (_, i) => ({ i, x: 0, y: 0, pulse: Math.random() }));
  const dots = Array.from({ length: personal }, (_, i) => ({
    hub: i % team,
    a: Math.random() * Math.PI * 2,
    r: 0.55 + Math.random() * 0.6,
    w: (0.25 + Math.random() * 0.45) * (Math.random() < 0.5 ? -1 : 1),
    phase: Math.random() * 10,
    x: 0, y: 0,
  }));
  const links = [];

  function layout() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const R = Math.min(W, H) * 0.26;
    hubs.forEach((h, i) => {
      const a = -Math.PI / 2 + (i / team) * Math.PI * 2;
      h.x = W / 2 + Math.cos(a) * R * 1.05;
      h.y = H / 2 + Math.sin(a) * R * 0.95 + R * 0.1;
    });
  }

  let last = performance.now();
  function frame() {
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    t += dt;
    born = Math.min(1, born + dt * 0.8);
    ctx.clearRect(0, 0, W, H);
    const base = Math.min(W, H) * 0.17;

    // hub-to-hub lattice
    ctx.strokeStyle = "rgba(216,180,90,0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    hubs.forEach((h, i) => { const n = hubs[(i + 1) % hubs.length]; ctx.moveTo(h.x, h.y); ctx.lineTo(n.x, n.y); });
    ctx.stroke();

    // personal agents
    dots.forEach((d, i) => {
      const h = hubs[d.hub];
      d.a += d.w * dt * 0.75;
      const wob = Math.sin(t * 1.3 + d.phase) * 0.08;
      const rr = base * (d.r + wob) * (0.4 + 0.6 * born);
      d.x = h.x + Math.cos(d.a) * rr;
      d.y = h.y + Math.sin(d.a) * rr * 0.8;
      // occasionally hand work to another team
      if (!reduced && Math.random() < 0.0009) d.hub = (d.hub + 1 + (Math.random() < 0.5 ? 1 : 0)) % team;
      // messages: brief links to the team agent
      if (!reduced && Math.random() < 0.006) links.push({ d: i, life: 1 });
    });

    for (let k = links.length - 1; k >= 0; k--) {
      const L = links[k];
      const d = dots[L.d], h = hubs[d.hub];
      ctx.strokeStyle = `rgba(216,180,90,${0.55 * L.life})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(h.x, h.y); ctx.stroke();
      // the message travelling along the link
      const p = 1 - L.life;
      ctx.fillStyle = `rgba(255,236,190,${L.life})`;
      ctx.beginPath(); ctx.arc(d.x + (h.x - d.x) * p, d.y + (h.y - d.y) * p, 2, 0, 6.283); ctx.fill();
      L.life -= dt * 1.2;
      if (L.life <= 0) links.splice(k, 1);
    }

    dots.forEach((d) => {
      ctx.fillStyle = "rgba(216,180,90,0.95)";
      ctx.beginPath(); ctx.arc(d.x, d.y, 3.2, 0, 6.283); ctx.fill();
    });

    // team agents
    hubs.forEach((h) => {
      h.pulse = (h.pulse + dt * 0.36) % 1;
      const r = Math.min(W, H) * 0.06;
      ctx.strokeStyle = `rgba(216,180,90,${0.45 * (1 - h.pulse)})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(h.x, h.y, r + h.pulse * r * 1.4, 0, 6.283); ctx.stroke();
      ctx.fillStyle = "#16233A";
      ctx.strokeStyle = "rgba(216,180,90,0.95)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, 6.283); ctx.fill(); ctx.stroke();
      if (icon.complete && icon.naturalWidth) {
        const s = r * 1.05;
        ctx.drawImage(icon, h.x - s / 2, h.y - s / 2, s, s);
      }
    });

    if (running && !reduced) raf = requestAnimationFrame(frame);
  }

  layout();
  addEventListener("resize", () => { layout(); if (reduced) frame(); });
  if (reduced) { born = 1; frame(); } else raf = requestAnimationFrame(frame);
  icon.onload = () => reduced && frame();

  return {
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (running || reduced) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
  };
}
