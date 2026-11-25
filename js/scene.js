// Hero WebGL: "Strata ⇄ Monogram".
// ~55k points carry two positions: a slot in the bronze/silver/gold medallion layers,
// and a point on a 3D "MD" monogram set in the site's typeface.
// uMorph 0 = data platform, 1 = monogram. The monogram's lighting is baked into each point's colour.
import * as THREE from "../vendor/three.module.min.js";

const vert = /* glsl */ `
  uniform float uTime, uMorph, uSpread, uPixelRatio, uSize, uPointerStrength, uScatter, uFormScale;
  uniform vec3 uPointer, uOffset;
  uniform vec2 uFormSize;
  attribute vec3 aStrata;
  attribute vec3 aForm;
  attribute vec3 aColor;
  attribute float aLayer;
  attribute float aRand;
  attribute float aDelay;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSoft;

  const vec3 BRONZE = vec3(0.690, 0.478, 0.310);
  const vec3 SILVER = vec3(0.663, 0.706, 0.761);
  const vec3 GOLD   = vec3(0.847, 0.706, 0.353);

  void main() {
    // each point builds in turn: foot of the letters first, top last
    float m = clamp(uMorph * 1.6 - aDelay, 0.0, 1.0);
    float e = m * m * (3.0 - 2.0 * m);

    vec3 s = aStrata;
    float t = uTime * 0.35;
    s.y = aStrata.y * uSpread
        + sin(s.x * 1.6 + t + aLayer) * 0.06
        + cos(s.z * 1.9 - t * 0.8) * 0.05;

    vec3 pos = mix(s, aForm * uFormScale + uOffset, e);

    // in-flight turbulence: strongest halfway between the two states
    float fly = sin(3.14159 * e);
    vec3 n = vec3(sin(aRand * 91.7 + uTime * 0.9), cos(aRand * 57.3 + uTime * 0.7), sin(aRand * 23.1 + uTime * 1.1));
    pos += n * fly * (0.42 + uScatter);
    pos += n * uScatter * 0.6 * e;

    // subtle breathing once assembled
    pos.z += sin(uTime * 0.9 + aRand * 6.2831) * 0.01 * e;

    // pointer: points part around the cursor like a hand through light
    vec2 d = pos.xy - uPointer.xy;
    float fall = exp(-dot(d, d) * 7.0) * uPointerStrength;
    pos.xy += normalize(d + 1e-5) * fall * 0.16;
    pos.z += fall * 0.22;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.78 + aRand * 0.44) * uPixelRatio * (4.0 / -mv.z) * mix(1.25, 1.0, e);

    vec3 metal = aLayer < 0.5 ? BRONZE : (aLayer < 1.5 ? SILVER : GOLD);
    vec3 col = mix(metal, aColor, smoothstep(0.5, 1.0, m));
    // once built, a glint of light sweeps across the metal, then rests: one pass every 7 s
    vec2 fuv = aForm.xy / uFormSize + 0.5;
    float sweep = fract(uTime / 7.0) * 2.4 - 0.6;
    float glint = exp(-pow(fuv.x * 0.85 + fuv.y * 0.35 - sweep, 2.0) * 110.0) * smoothstep(0.9, 1.0, m);
    col += vec3(1.0, 0.93, 0.76) * glint * 0.5;
    // a gold scan-line rides the build front
    float front = smoothstep(0.02, 0.1, m) * (1.0 - smoothstep(0.1, 0.3, m));
    vColor = mix(col, vec3(1.0, 0.86, 0.55), front * 0.85);

    float edge = 1.0 - smoothstep(1.4, 2.5, length(aStrata.xz * vec2(1.0, 1.3)));
    vAlpha = mix(edge * (0.45 + aRand * 0.55), 1.0, e);
    vSoft = 1.0 - e;
  }
`;

const frag = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vSoft;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float a = mix(1.0, smoothstep(0.5, 0.0, r), vSoft);
    gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
  }
`;

// Rising "agent threads" shown while the layers are visible.
const flowVert = /* glsl */ `
  uniform float uTime, uSpread, uPixelRatio, uFlow;
  attribute vec3 aStart;
  attribute vec2 aTarget;
  attribute float aSeed;
  varying float vAlpha;
  varying float vT;
  void main() {
    float t = fract(uTime * aStart.y + aSeed);
    vT = t;
    float y = mix(-1.15 * uSpread, 1.0 * uSpread + 1.5, t);
    float c = smoothstep(0.45, 0.95, t);
    vec2 xz = mix(aStart.xz, aTarget, c);
    vec4 mv = modelViewMatrix * vec4(xz.x, y, xz.y, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.6 + c * 2.4) * uPixelRatio * (4.0 / -mv.z);
    vAlpha = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.88, 1.0, t)) * uFlow;
  }
`;
const flowFrag = /* glsl */ `
  varying float vAlpha;
  varying float vT;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    vec3 b = vec3(0.690, 0.478, 0.310), s = vec3(0.663, 0.706, 0.761), g = vec3(0.847, 0.706, 0.353);
    vec3 col = vT < 0.5 ? mix(b, s, vT * 2.0) : mix(s, g, (vT - 0.5) * 2.0);
    gl_FragColor = vec4(col, vAlpha * 0.9);
  }
`;

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
}

// ── The form the points assemble into: an "MD" monogram ──
// Set in Archivo (the site's typeface) on an offscreen canvas and lifted into 3D: a distance field
// gives every stroke a bevelled, raised face, and short walls behind the edges give it thickness.
export const MONOGRAM = {
  text: "MD", weight: 800, stretch: "condensed",
  refW: 3.0, // width the geometry is built at (world units); it is rescaled to fit the layout below
  // where it sits on screen, as fractions of the canvas: centre x/y and width (capped by height on wide screens).
  // Wide: right of the name, which never reaches past ~53% of the width. Narrow: above the type.
  wide: { x: 0.74, y: 0.53, w: 0.36, hMax: 0.34 },
  narrow: { x: 0.5, y: 0.27, w: 0.74, hMax: 0.3 },
};
const FAMILY = '"Archivo", "Arial Black", "Segoe UI", sans-serif';
const GOLD_DEEP = [0.6, 0.44, 0.19], GOLD_LIGHT = [0.99, 0.86, 0.53], SPEC = [1, 0.94, 0.8];
const LIGHT = [-0.4767, 0.6674, 0.5721]; // from the upper left, in front
const HALF = [-0.2688, 0.3764, 0.8866]; // halfway between the light and the viewer

async function fontReady() {
  if (!document.fonts?.load) return;
  try {
    await Promise.race([
      document.fonts.load(`${MONOGRAM.weight} ${MONOGRAM.stretch} 200px "Archivo"`),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* the next family in the stack stands in */ }
}

// Draws the text so it spans `cols` cells and returns which cells fall inside a letter.
function glyphMask(cols) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d", { willReadFrequently: true });
  const setFont = (px) => {
    ctx.font = `${MONOGRAM.weight} ${MONOGRAM.stretch} ${px}px ${FAMILY}`;
    if ("fontStretch" in ctx) ctx.fontStretch = MONOGRAM.stretch;
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${(-0.03 * px).toFixed(1)}px`;
  };
  setFont(200);
  let m = ctx.measureText(MONOGRAM.text);
  const pad = Math.max(4, Math.round(cols * 0.03));
  const k = (cols - pad * 2) / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
  const rows = Math.round((m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * k) + pad * 2;
  c.width = cols; c.height = rows; // resizing resets the context, so the font is set again
  setFont(200 * k);
  m = ctx.measureText(MONOGRAM.text);
  ctx.fillStyle = "#fff";
  ctx.fillText(MONOGRAM.text, pad + m.actualBoundingBoxLeft, pad + m.actualBoundingBoxAscent);
  const px = ctx.getImageData(0, 0, cols, rows).data;
  const mask = new Uint8Array(cols * rows);
  for (let i = 0; i < mask.length; i++) mask[i] = px[i * 4 + 3] > 127 ? 1 : 0;
  return { mask, rows };
}

// Distance, in cells, from every inside cell to the nearest outside cell (two-pass chamfer).
function insideDistance(mask, cols, rows) {
  const d = new Float32Array(mask.length);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? 1e6 : 0;
  const D = Math.SQRT2;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x;
    if (!d[i]) continue;
    let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 1);
    if (y > 0) {
      v = Math.min(v, d[i - cols] + 1);
      if (x > 0) v = Math.min(v, d[i - cols - 1] + D);
      if (x < cols - 1) v = Math.min(v, d[i - cols + 1] + D);
    }
    d[i] = v;
  }
  for (let y = rows - 1; y >= 0; y--) for (let x = cols - 1; x >= 0; x--) {
    const i = y * cols + x;
    if (!d[i]) continue;
    let v = d[i];
    if (x < cols - 1) v = Math.min(v, d[i + 1] + 1);
    if (y < rows - 1) {
      v = Math.min(v, d[i + cols] + 1);
      if (x < cols - 1) v = Math.min(v, d[i + cols + 1] + D);
      if (x > 0) v = Math.min(v, d[i + cols - 1] + D);
    }
    d[i] = v;
  }
  return d;
}

async function buildGeometry({ cols }) {
  await fontReady();
  const { mask, rows } = glyphMask(cols);
  const aspect = rows / cols;
  const W = MONOGRAM.refW, H = W * aspect, sp = W / cols;
  const dist = insideDistance(mask, cols, rows);
  const bevel = Math.max(3, cols * 0.025); // cells

  // height field: a chamfered face on every stroke, on a gently curved plate
  const height = new Float32Array(mask.length).fill(NaN);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x;
    if (!mask[i]) continue;
    const t = Math.min(1, dist[i] / bevel), b = t * t * (3 - 2 * t), u = x / cols;
    height[i] = 0.04 + b * 0.12 + 0.14 * (1 - (2 * u - 1) ** 2);
  }
  const hAt = (x, y) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return 0;
    const v = height[y * cols + x];
    return Number.isNaN(v) ? 0 : v;
  };

  const strata = [], form = [], color = [], layer = [], rand = [], delay = [];
  const add = ([x, y, z, r, g, b]) => {
    const u = (x + Math.random() * 0.6) / cols, v = (y + Math.random() * 0.6) / rows;
    form.push((u - 0.5) * W, (0.5 - v) * H, z);
    color.push(r, g, b);
    // the top of the letters rises out of the gold layer, the middle out of silver, the foot out of bronze
    const L = v < 0.34 ? 2 : v < 0.67 ? 1 : 0;
    strata.push((Math.random() - 0.5) * 3.9, L - 1, (Math.random() - 0.5) * 2.9);
    layer.push(L);
    rand.push(Math.random());
    delay.push((1 - v) * 0.6);
  };

  const walls = [], faces = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x;
    if (!mask[i]) continue;
    const z = height[i];
    const zx = (hAt(x + 1, y) - hAt(x - 1, y)) / (2 * sp);
    const zy = (hAt(x, y - 1) - hAt(x, y + 1)) / (2 * sp); // rows run down, world y runs up
    const nl = Math.hypot(zx, zy, 1), nx = -zx / nl, ny = -zy / nl, nz = 1 / nl;
    const diff = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    const spec = Math.pow(Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]), 40);
    const u = x / cols, v = y / rows;
    const sheen = 0.5 + 0.5 * Math.sin((u * 1.3 - v * 0.9) * Math.PI * 1.5 + 0.5);
    const lit = 0.38 + 0.72 * diff;
    const base = GOLD_DEEP.map((c0, k) => c0 + (GOLD_LIGHT[k] - c0) * sheen);
    faces.push([x, y, z, ...base.map((c0, k) => Math.min(1, c0 * lit + spec * 0.55 * SPEC[k]))]);
    if (dist[i] < 1.5) for (let w = 1; w <= 4; w++) walls.push([x, y, z - w * 0.055, ...base.map((c0) => c0 * (0.36 - w * 0.05))]);
  }
  // walls first and faces last: points are not depth-sorted, so later ones draw on top
  walls.forEach(add);
  faces.forEach(add);

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(form, 3));
  g.setAttribute("aForm", new THREE.Float32BufferAttribute(form, 3));
  g.setAttribute("aStrata", new THREE.Float32BufferAttribute(strata, 3));
  g.setAttribute("aColor", new THREE.Float32BufferAttribute(color, 3));
  g.setAttribute("aLayer", new THREE.Float32BufferAttribute(layer, 1));
  g.setAttribute("aRand", new THREE.Float32BufferAttribute(rand, 1));
  g.setAttribute("aDelay", new THREE.Float32BufferAttribute(delay, 1));
  return { geometry: g, count: rand.length, W, H, cols, rows, height, spacing: sp };
}

export async function initScene(canvas, { reduced = false, onFrame } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  const pr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(pr);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const group = new THREE.Group();
  scene.add(group);

  const small = Math.min(innerWidth, innerHeight) < 700;
  const built = await buildGeometry({ cols: small ? 280 : 360 });

  const uniforms = {
    uTime: { value: 0 },
    uMorph: { value: reduced ? 1 : 0 },
    uSpread: { value: 1.0 },
    uPixelRatio: { value: pr },
    uSize: { value: small ? 2.3 : 1.9 },
    uPointer: { value: new THREE.Vector3(9, 9, 0) },
    uOffset: { value: new THREE.Vector3() },
    uFormScale: { value: 1 },
    uFormSize: { value: new THREE.Vector2(built.W, built.H) },
    uPointerStrength: { value: 0 },
    uScatter: { value: 0 },
    uOpacity: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, transparent: true, depthWrite: false });
  const points = new THREE.Points(built.geometry, material);
  points.frustumCulled = false;
  group.add(points);

  // agent threads
  const F = 700;
  const starts = new Float32Array(F * 3), targets = new Float32Array(F * 2), seeds = new Float32Array(F);
  const threads = [[-0.55, -0.2], [0.1, 0.35], [0.7, -0.1]];
  for (let i = 0; i < F; i++) {
    starts[i * 3] = (Math.random() - 0.5) * 3.4;
    starts[i * 3 + 1] = 0.035 + Math.random() * 0.05;
    starts[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
    const th = threads[i % 3];
    targets[i * 2] = th[0] + (Math.random() - 0.5) * 0.06;
    targets[i * 2 + 1] = th[1] + (Math.random() - 0.5) * 0.06;
    seeds[i] = Math.random();
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(F * 3), 3));
  fg.setAttribute("aStart", new THREE.BufferAttribute(starts, 3));
  fg.setAttribute("aTarget", new THREE.BufferAttribute(targets, 2));
  fg.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const flowUniforms = { uTime: uniforms.uTime, uSpread: uniforms.uSpread, uPixelRatio: uniforms.uPixelRatio, uFlow: { value: 0 } };
  const flow = new THREE.Points(fg, new THREE.ShaderMaterial({ vertexShader: flowVert, fragmentShader: flowFrag, uniforms: flowUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  flow.frustumCulled = false;
  group.add(flow);

  // anchors for the HTML call-outs: uv on the monogram, snapped to the nearest point on a letter
  let anchors = [];
  function setAnchors(list) {
    const { cols, rows, height } = built;
    anchors = list.map(([u, v]) => {
      const bx = Math.round(u * (cols - 1)), by = Math.round(v * (rows - 1));
      let best = null, bestD = Infinity;
      for (let r = 0; r < 48 && !best; r++) {
        for (let y = by - r; y <= by + r; y++) for (let x = bx - r; x <= bx + r; x++) {
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          const z = height[y * cols + x], dd = (x - bx) ** 2 + (y - by) ** 2;
          if (!Number.isNaN(z) && dd < bestD) { bestD = dd; best = [x, y, z]; }
        }
      }
      const [x, y, z] = best || [bx, by, 0.1];
      return new THREE.Vector3((x / cols - 0.5) * built.W, (0.5 - y / rows) * built.H, z + 0.05);
    });
  }

  // ── state ──
  let progress = 0, intro = reduced ? 1 : 0, introStarted = reduced, introT0 = 0;
  let wide = true, running = true, raf = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: 0, tinside: 0 };
  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const inv = new THREE.Matrix4();

  // Fit the monogram to its screen slot: scale it to the slot's width and move it to the slot's centre,
  // working from the camera and group at rest (fully formed, not scrolled, cursor centred).
  function placeForm(w, h) {
    const slot = wide ? MONOGRAM.wide : MONOGRAM.narrow;
    const slotW = Math.min(slot.w * w, (slot.hMax * h) * (built.W / built.H));
    camera.position.set(0, wide ? 0.9 : 0.6, wide ? 8.2 : 9.6);
    camera.lookAt(wide ? 0.85 : 0, wide ? 0.05 : 0.1, 0);
    camera.updateMatrixWorld();
    group.position.set(wide ? 2.15 : 0, wide ? -0.05 : 1.32, 0);
    group.rotation.set(0, -0.12, 0);
    group.scale.setScalar(wide ? 1 : 0.66);
    group.updateMatrixWorld();
    const onPlane = (sx, sy) => {
      const v = new THREE.Vector3((sx / w) * 2 - 1, -(sy / h) * 2 + 1, 0.5).unproject(camera);
      const dir = v.sub(camera.position).normalize();
      return camera.position.clone().add(dir.multiplyScalar(-camera.position.z / dir.z));
    };
    const cx = slot.x * w, cy = slot.y * h;
    const worldW = onPlane(cx - slotW / 2, cy).distanceTo(onPlane(cx + slotW / 2, cy));
    uniforms.uFormScale.value = worldW / (built.W * group.scale.x);
    const local = group.worldToLocal(onPlane(cx, cy));
    uniforms.uOffset.value.set(local.x, local.y, 0);
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    wide = w / h > 1.05;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    placeForm(w, h);
    // size points from the real grid spacing so the monogram reads as solid metal at any screen size
    const pxPerUnitAt1 = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    uniforms.uSize.value = (built.spacing * uniforms.uFormScale.value * (wide ? 1 : 0.66) * pxPerUnitAt1 * 1.9) / 4;
  }
  function onPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
    pointer.tinside = 1;
  }
  function onLeave() { pointer.tinside = 0; }

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduced) uniforms.uTime.value += dt;
    // intro runs on wall-clock time, so a throttled tab still finishes in ~3 s
    if (introStarted && intro < 1) intro = Math.min(1, (performance.now() - introT0) / 3200);
    const introE = 1 - Math.pow(1 - intro, 3);

    pointer.x += (pointer.tx - pointer.x) * 0.07;
    pointer.y += (pointer.ty - pointer.y) * 0.07;
    pointer.inside += (pointer.tinside - pointer.inside) * 0.05;

    // scroll: 0–0.12 hold the monogram, 0.12–0.55 dissolve into the layers, then open the layers up
    const dissolve = Math.min(1, Math.max(0, (progress - 0.12) / 0.43));
    const morph = introE * (1 - dissolve);
    uniforms.uMorph.value = morph;
    uniforms.uScatter.value = dissolve * (1 - dissolve) * 0.9;
    const open = Math.max(0, (progress - 0.5) / 0.5);
    uniforms.uSpread.value = 1.0 + open * 0.7;
    flowUniforms.uFlow.value = Math.max(0, 1 - morph * 1.6) * (reduced ? 1 : 1);

    // 3D: the monogram turns towards the cursor; a slow idle sway shows its bevels and depth
    const sway = reduced ? 0 : Math.sin(uniforms.uTime.value * 0.35) * 0.1;
    const formed = morph;
    group.rotation.y = (-0.55 + open * 0.6) * (1 - formed) + (pointer.x * 0.42 + sway - 0.12) * formed;
    group.rotation.x = pointer.y * -0.1 * formed + 0.0;
    group.position.x = wide ? 2.15 : 0;
    group.position.y = wide ? -0.05 : 1.32;
    group.scale.setScalar(wide ? 1 : 0.66);
    camera.position.set(0, (wide ? 0.9 : 0.6) + (1 - formed) * 2.0 - open * 1.1, wide ? 8.2 : 9.6);
    camera.lookAt(wide ? 0.85 : 0, (wide ? 0.05 : 0.1) - open * 0.25, 0);

    // pointer in object space (for the parting effect)
    group.updateMatrixWorld();
    ray.setFromCamera({ x: pointer.x, y: pointer.y }, camera);
    inv.copy(group.matrixWorld).invert();
    const o = ray.ray.origin.clone().applyMatrix4(inv), dir = ray.ray.direction.clone().transformDirection(inv);
    const hit = new THREE.Ray(o, dir).intersectPlane(plane, tmp);
    if (hit) uniforms.uPointer.value.copy(hit);
    uniforms.uPointerStrength.value = pointer.inside * formed * (reduced ? 0 : 1);

    renderer.render(scene, camera);

    if (onFrame) {
      const r = canvas.getBoundingClientRect();
      const out = anchors.map((a) => {
        const p = a.clone().multiplyScalar(uniforms.uFormScale.value).add(uniforms.uOffset.value).applyMatrix4(group.matrixWorld).project(camera);
        return { x: (p.x * 0.5 + 0.5) * r.width, y: (-p.y * 0.5 + 0.5) * r.height };
      });
      onFrame({ anchors: out, morph, intro: introE, progress });
    }
    if (running && !reduced) raf = requestAnimationFrame(frame);
  }

  resize();
  addEventListener("resize", resize);
  addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("pointerleave", onLeave);

  if (reduced) frame(); else raf = requestAnimationFrame(frame);

  return {
    count: built.count,
    start() { if (!introStarted) { introStarted = true; introT0 = performance.now(); } },
    setProgress(p) { progress = Math.max(0, Math.min(1, p)); if (reduced) frame(); },
    setAnchors,
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (running || reduced) return; running = true; clock.getDelta(); raf = requestAnimationFrame(frame); },
    resize,
  };
}
