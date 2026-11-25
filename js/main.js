import { content as C } from "./content.js?v=45";
import { LOGOS } from "./logos.js?v=45";
import { initScene, webglAvailable } from "./scene.js?v=45";
import { initSavings } from "./savings.js?v=45";
import { initOrbit } from "./orbit.js?v=45";
import { initAgents } from "./agents.js?v=45";
import { preload, initCursor, initMagnetic, odometer, kineticHeadings, logoRiver, scrubWords } from "./motion.js?v=45";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
// On claude.ai the page runs in a locked-down frame: no embedded players or outside images, no plain
// download links, no print dialog. The hosted copy sets data-host="claude" (tools/build-artifact.mjs).
const HOSTED = document.documentElement.dataset.host === "claude";
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
if (gsap) gsap.registerPlugin(...[window.ScrollTrigger, window.SplitText, window.ScrambleTextPlugin].filter(Boolean));

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (item, v = item.value) => `${item.prefix || ""}${item.format === "int" ? Math.round(v).toLocaleString("en-US") : v.toFixed(1)}${item.suffix || ""}`;
const money = (v) => (v < 1 ? `USD ${Math.round(v * 1000)}K` : `USD ${v}M`);

// Logo helpers. Missing files fall back to a typographic monogram, never a broken image.
const MONO = new Set(["ubs", "isro", "mit", "iima", "infosys", "hsbc", "barclays", "deutschebank", "salesforce", "ieee", "tcs", "github", "linkedin", "githubcopilot"]);
function logo(key, label = "", cls = "") {
  if (!key) return "";
  const src = LOGOS[key];
  if (!src) {
    // typographic monogram from the organisation's initials, e.g. "IIMA"
    const initials = label.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("").slice(0, 4) || label.slice(0, 3);
    return `<span class="logo logo--text ${cls}" aria-hidden="true">${esc(initials)}</span>`;
  }
  return `<img class="logo ${MONO.has(key) ? "logo--mono" : ""} ${cls}" src="${src}" alt="${esc(label)}" loading="lazy" decoding="async">`;
}
const tile = (key, label) => `<span class="tile">${logo(key, label)}</span>`;

// A talk's video. Normally a YouTube thumbnail that turns into the player on click; on claude.ai, where
// outside players and images are blocked, a designed card that opens the talk on YouTube instead.
function videoCard({ id, title, label, small = false, thumb = "hqdefault" }) {
  const play = `<span class="video__play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>`;
  const cls = `video${small ? " video--small" : ""}`;
  if (HOSTED) {
    return `<a class="${cls} video--poster" href="https://www.youtube.com/watch?v=${esc(id)}" target="_blank" rel="noopener" data-cursor="Watch" aria-label="Watch ${esc(label)} on YouTube">
      <span class="video__title" aria-hidden="true">${esc(title)}</span><span class="video__where" aria-hidden="true">Watch on YouTube</span>${play}</a>`;
  }
  return `<button type="button" class="${cls}" data-yt="${esc(id)}" data-cursor="Play" aria-label="Play ${esc(label)}">
    <img src="https://i.ytimg.com/vi/${esc(id)}/${esc(thumb)}.jpg" alt="" loading="lazy">${play}</button>`;
}
const bankColor = (s) => (s.where === "UBS" ? "gold" : "silver");

// ───────────────────────── Immersive view ─────────────────────────
function renderImmersive() {
  const p = C.person;
  const sentence = C.scaleSentence.replace(/\{(\d)\}/g, (_, i) => `<span class="num" data-count="${+i}">${esc(fmt(C.scale[+i]))}</span>`);
  const A = C.architecture;
  const node = (n, group) => `
    <button type="button" class="node node--${group}${n.layer ? " node--" + n.layer : ""}" data-node="${n.id}" aria-pressed="false" aria-controls="arch-detail">
      ${n.logo ? tile(n.logo, "") : ""}<span class="node__name">${esc(n.name)}</span>
    </button>`;
  const career = [...C.experience].reverse();
  const allTech = [...new Map(C.skills.flatMap((g) => g.items).map((i) => [i.logo, i])).values()];
  const half = Math.ceil(allTech.length / 2);
  const riverRow = (list) => list.map((i) => `<span class="river__item">${tile(i.logo, "")}<span>${esc(i.name)}</span></span>`).join("");

  $("#immersive").innerHTML = `
  <section class="hero" id="top" aria-labelledby="hero-name">
    <div class="hero__sticky">
      <canvas class="hero__gl" aria-hidden="true"></canvas>
      <p class="hero__fallback" aria-hidden="true">MD</p>
      <div class="callouts" aria-hidden="true">
        ${C.callouts.map((c, i) => `<div class="callout callout--${c.side}${c.far ? " callout--far" : ""}" data-callout="${i}"><i class="callout__dot"></i><i class="callout__line"></i><p><strong>${esc(c.text)}</strong><span>${esc(c.sub)}</span></p></div>`).join("")}
      </div>
      <div class="hero__text">
        <h1 class="hero__name" id="hero-name"><span class="hero__line"><span>${esc(p.firstName)}</span></span><span class="hero__line"><span>${esc(p.lastName)}</span></span></h1>
        <p class="hero__lede">${esc(p.lede)}</p>
        <p class="hero__role">${esc(p.role)}.<br>${esc(p.location)}</p>
        <div class="hero__actions">
          <button type="button" class="btn btn--solid magnetic" data-goto="cv" data-cursor="CV">Read the Executive CV</button>
          <a class="btn magnetic" href="${esc(p.cvDirector)}" download data-cursor="PDF">Download CV (PDF)</a>
        </div>
      </div>
      <p class="hero__hint" aria-hidden="true"><span class="hero__hint-line"></span>Move to turn the monogram · Scroll to dissolve it into the platform</p>
      <ul class="legend" aria-label="What the layers mean">
        <li><i class="sw sw--gold"></i>Gold: business-ready data</li>
        <li><i class="sw sw--silver"></i>Silver: governed and conformed</li>
        <li><i class="sw sw--bronze"></i>Bronze: raw data landing</li>
      </ul>
    </div>
  </section>

  <section class="statement" aria-label="Platform scale">
    <div class="wrap">
      <p class="statement__sentence" id="statement">${sentence}</p>
      <p class="statement__summary">${esc(C.summary)}</p>
    </div>
    <div class="river" aria-label="Technologies I work with">
      <div class="river__row">${riverRow(allTech.slice(0, half))}</div>
      <div class="river__row">${riverRow(allTech.slice(half))}</div>
    </div>
  </section>

  <section class="savings" id="savings" aria-labelledby="savings-h">
    <div class="savings__pin">
      <div class="wrap savings__head">
        <h2 id="savings-h" data-kinetic>Retiring platforms, returning value</h2>
        <p>Scroll to retire each platform. Its logo dissolves into the vault in proportion to what it saved.</p>
      </div>
      <div class="savings__stage">
        <canvas class="savings__canvas" aria-hidden="true"></canvas>
        <div class="savings__panel">
          <p class="savings__count"><span class="savings__idx">1</span> of ${C.savings.length}</p>
          <div class="savings__swap" aria-hidden="true"></div>
          <h3 class="savings__label"></h3>
          <p class="savings__value odo"></p>
          <p class="savings__note"></p>
          <p class="savings__where"></p>
          <ol class="savings__dots" aria-hidden="true">${C.savings.map(() => "<li></li>").join("")}</ol>
        </div>
      </div>
    </div>
    <ol class="sr-only">${C.savings.map((s) => `<li>${esc(s.label)} (${esc(s.where)}): ${money(s.value)} ${esc(s.note)}</li>`).join("")}</ol>
  </section>

  <section class="arch wrap" aria-labelledby="arch-h">
    <div class="sec-head">
      <h2 id="arch-h" data-kinetic>How the platform fits together</h2>
      <p>Select any part to see what I did there. The moving points are data on its way to the people who use it.</p>
    </div>
    <div class="arch__body">
      <div class="diagram" id="diagram">
        <svg class="diagram__links" aria-hidden="true"></svg>
        <div class="col col--retiring">
          <h3>${esc(A.retiring.title)}</h3>
          ${A.retiring.nodes.map((n) => node(n, "retiring")).join("")}
          <div class="migr"><span class="migr__bar"><span style="--p:${A.retiring.progress}"></span></span><span class="migr__text">${esc(A.retiring.caption)}</span></div>
        </div>
        <div class="col col--platform">
          <h3>${logo(A.platform.logo, "", "logo--inline")} ${esc(A.platform.title)}</h3>
          <div class="strata">${[...A.platform.nodes].reverse().map((n) => node(n, "layer")).join("")}</div>
          <p class="col__cap">${esc(A.platform.caption)}</p>
        </div>
        <div class="col col--consume">
          <h3>${esc(A.consume.title)}</h3>
          ${A.consume.nodes.map((n) => node(n, "consume")).join("")}
          <p class="col__cap">${esc(A.consume.caption)}</p>
        </div>
        <div class="gov">
          <h3>${esc(A.governance.title)}</h3>
          <div class="gov__nodes">${A.governance.nodes.map((n) => node(n, "gov")).join("")}</div>
        </div>
      </div>
      <aside class="detail" id="arch-detail" aria-live="polite">
        <p class="detail__group"></p>
        <h3 class="detail__name"></h3>
        <p class="detail__text"></p>
      </aside>
    </div>
  </section>

  <section class="agents" aria-labelledby="agents-h">
    <div class="wrap agents__grid">
      <div class="agents__viz">
        <canvas class="agents__canvas" aria-hidden="true"></canvas>
        <p class="agents__key"><span><i class="k-dot"></i>Personal agent (${C.agents.personal})</span><span><i class="k-ring"></i>Team agent (${C.agents.team})</span></p>
      </div>
      <div class="agents__copy">
        <h2 id="agents-h" data-kinetic>Agents in production</h2>
        <dl class="agents__stats">
          <div><dt>Personal agents</dt><dd class="odo" data-odo="${C.agents.personal}">${C.agents.personal}</dd></div>
          <div><dt>Live team agents</dt><dd class="odo" data-odo="${C.agents.team}">${C.agents.team}</dd></div>
          <div><dt>Copilot users</dt><dd class="odo" data-odo="${C.agents.users.toLocaleString("en-US")}">${C.agents.users.toLocaleString("en-US")}</dd></div>
        </dl>
        <div class="clock">
          <svg viewBox="0 0 120 120" class="clock__svg" aria-hidden="true">
            <circle cx="60" cy="60" r="52" class="clock__track"/>
            <circle cx="60" cy="60" r="52" class="clock__arc" pathLength="40" style="--h:${C.agents.hoursSaved}"/>
          </svg>
          <p class="clock__text"><strong><span class="odo" data-odo="${C.agents.hoursSaved}">${C.agents.hoursSaved}</span> hours</strong> of a 40-hour week returned. ${esc(C.agents.story)}</p>
        </div>
        <ul class="stack" aria-label="Agent stack">${C.agents.stack.map((s) => `<li>${tile(s.logo, "")}${esc(s.name)}</li>`).join("")}</ul>
      </div>
    </div>
  </section>

  <section class="skills wrap" aria-labelledby="skills-h">
    <div class="sec-head">
      <h2 id="skills-h" data-kinetic>The stack I lead with</h2>
      <p>Three rings, like the three data layers. Hover over or focus any logo to see where I used it.</p>
    </div>
    <div class="orbit" id="orbit" data-focus="-1">
      <div class="orbit__filters" role="group" aria-label="Highlight a ring">
        ${C.skills.map((g, gi) => `<button type="button" class="chip chip--${g.ring}" data-ring-filter="${gi}" aria-pressed="false"><i class="sw sw--${g.ring}"></i>${esc(g.title)}</button>`).join("")}
      </div>
      <div class="orbit__stage">
        ${C.skills.map((g) => `<div class="orbit__ring orbit__ring--${g.ring}" aria-hidden="true"></div>`).join("")}
        <span class="orbit__center" aria-hidden="true">MD</span>
        ${C.skills.map((g, gi) => g.items.map((it, i) => `<button type="button" class="orbit__item orbit__item--${g.ring}" data-ring="${gi}" data-i="${i}" aria-label="${esc(it.name)}: ${esc(it.note)}">${logo(it.logo, "")}</button>`).join("")).join("")}
        <div class="orbit__card" aria-hidden="true"><p class="orbit__card-ring"></p><p class="orbit__card-name"></p><p class="orbit__card-note"></p></div>
      </div>
    </div>
  </section>

  <section class="person" aria-labelledby="person-h">
    <div class="person__pin">
      <div class="wrap person__grid">
        <div class="person__copy">
          <h2 id="person-h" class="person__kicker">The person behind the platform</h2>
          <ol class="person__caps">
            ${C.story.map((c, i) => `<li class="pcap" data-i="${i}"><p class="pcap__title">${esc(c.title)}</p><p class="pcap__text">${esc(c.text)}</p></li>`).join("")}
          </ol>
          <ol class="person__ticks" aria-hidden="true">${C.story.map(() => "<li></li>").join("")}</ol>
        </div>
      </div>
    </div>
  </section>

  <section class="career" aria-labelledby="career-h">
    <div class="career__pin">
      <div class="wrap career__head">
        <h2 id="career-h" data-kinetic>From satellite data to bank-wide AI</h2>
        <p>Every role since 2015, in order.</p>
      </div>
      <div class="career__rail" aria-hidden="true"><span class="career__fill"></span></div>
      <ol class="track">
        ${career.map((e) => `
          <li class="stop">
            <div class="stop__logo">${logo(e.logo, e.org)}</div>
            <p class="stop__years">${esc(e.start)}<span>–${esc(e.end === "Present" ? "now" : e.end)}</span></p>
            <h3 class="stop__org">${esc(e.org)}</h3>
            <p class="stop__role">${esc(e.role)}</p>
            <ul>${e.points.slice(0, 3).map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>
          </li>`).join("")}
      </ol>
    </div>
  </section>

  <section class="voice wrap" aria-labelledby="voice-h">
    <div class="sec-head"><h2 id="voice-h" data-kinetic>On stage and on the record</h2></div>
    <div class="voice__grid">
      <article class="talk talk--video">
        ${videoCard({ id: C.talks.tedx.youtubeId, title: C.talks.tedx.title, label: `the TEDx talk: ${C.talks.tedx.title}` })}
        <p class="talk__kind">TEDx talk</p>
        <h3 class="talk__title">${esc(C.talks.tedx.title)}</h3>
        <p class="talk__where">${esc(C.talks.tedx.where)}</p>
        <p class="talk__text">${esc(C.talks.tedx.text)}</p>
        <a class="link" href="${esc(C.talks.tedx.coverage)}" target="_blank" rel="noopener">Read IIMA's coverage</a>
      </article>
      <div class="voice__side">
        <article class="talk talk--guest">
          ${videoCard({ id: C.talks.ieee.youtubeId, title: C.talks.ieee.title, label: `the IEEE Pune Section talk: ${C.talks.ieee.title}`, small: true, thumb: C.talks.ieee.thumb || "hqdefault" })}
          <div>
            <p class="talk__kind">${logo("ieee", "", "logo--inline logo--mono")} Guest talk</p>
            <h3 class="talk__title">${esc(C.talks.ieee.title)}</h3>
            <p class="talk__where">${esc(C.talks.ieee.where)}</p>
            <p class="talk__text">${esc(C.talks.ieee.text)}</p>
          </div>
        </article>
        <article class="talk">
          <p class="talk__kind">${logo("spotify", "", "logo--inline")} Podcast</p>
          <h3 class="talk__title">${esc(C.talks.podcast.title)}</h3>
          <p class="talk__where">${esc(C.talks.podcast.where)}</p>
          <p class="talk__text">${esc(C.talks.podcast.text)}</p>
          <a class="link" href="${esc(C.talks.podcast.url)}" target="_blank" rel="noopener" data-cursor="Listen">Listen on Spotify</a>
        </article>
        <article class="talk">
          <p class="talk__kind">Publications</p>
          <ol class="pubs">${C.talks.publications.items.map((t) => `<li><span class="pubs__title">${esc(t.title)}</span><span class="pubs__meta">${esc(t.year)} · ${esc(t.venue)}</span></li>`).join("")}</ol>
          <p class="talk__text">${esc(C.talks.publications.note)}</p>
          <a class="link" href="${esc(C.talks.publications.profile)}" target="_blank" rel="noopener" data-cursor="Open">View on ResearchGate</a>
        </article>
      </div>
    </div>
  </section>

  <section class="work wrap" aria-labelledby="work-h">
    <div class="sec-head"><h2 id="work-h" data-kinetic>Open work on GitHub</h2><p>Original repositories I maintain.</p></div>
    <ul class="repos">
      ${C.repos.map((r) => `<li><a class="repo" href="${esc(r.url)}" target="_blank" rel="noopener" data-cursor="Open">${tile(r.logo, "")}<span class="repo__name">${esc(r.name)}</span><span class="repo__text">${esc(r.text)}</span></a></li>`).join("")}
    </ul>
  </section>

  <section class="creds wrap" aria-labelledby="creds-h">
    <div class="sec-head"><h2 id="creds-h" data-kinetic>Education and credentials</h2></div>
    <ul class="edu">
      ${C.education.map((e) => `<li class="edu__item"><div class="edu__logo">${e.logo ? logo(e.logo, e.org) : ""}</div><div><strong>${esc(e.title)}</strong><span>${esc(e.org)}, ${esc(e.years)}${e.note ? ". " + esc(e.note) : ""}</span></div></li>`).join("")}
    </ul>
    <ul class="certs">
      ${C.certifications.map((c) => `<li class="cert">${c.badge ? `<span class="cert__badge">${logo(c.badge, "")}</span>` : ""}<span class="cert__name">${esc(c.name)}</span><span class="cert__by">${esc(c.by)}${c.code ? ", " + esc(c.code) : ""}</span></li>`).join("")}
    </ul>
    <div class="creds__grid">
      <div><h3>Recognition</h3><ul class="plain">${C.recognition.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
      <div><h3>Community and volunteering</h3><ul class="plain">${C.community.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
      <div><h3>Languages</h3><p>${esc(C.languages)}</p></div>
    </div>
  </section>

  <section class="contact" aria-labelledby="contact-h">
    <div class="wrap contact__grid">
      <div class="contact__copy">
        <h2 id="contact-h" data-kinetic>Hiring for a data or AI leadership role?</h2>
        <p class="contact__lead">I'm open to Director, VP, Principal Architect and Head of Technology roles in APAC and the UAE.</p>
        <div class="contact__mail">
          <a class="contact__email" href="mailto:${esc(p.email)}" data-cursor="Write">${esc(p.email)}</a>
          <button type="button" class="btn btn--small" data-copy="${esc(p.email)}">Copy email</button>
        </div>
        <ul class="contact__links">
          <li><a class="link" href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a></li>
          <li><a class="link" href="${esc(p.github)}" target="_blank" rel="noopener">GitHub</a></li>
          <li><a class="link" href="${esc(p.cvDirector)}" download>CV for Director roles (PDF)</a></li>
          <li><a class="link" href="${esc(p.cvGeneral)}" download>CV for architect roles (PDF)</a></li>
        </ul>
        <p class="foot">Everything on this site comes from my CV, LinkedIn and public record. Last updated November 2026.</p>
      </div>
    </div>
  </section>`;
}

// ───────────────────────── Executive CV view ─────────────────────────
function renderCV() {
  const p = C.person;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  $("#cv").innerHTML = `
  <article class="doc" aria-labelledby="cv-name">
    <header class="doc__head">
      <div class="doc__id">
        <h1 id="cv-name" tabindex="-1">${esc(p.name)}</h1>
        <p class="doc__headline">${esc(p.headline)}</p>
        <p class="doc__contact">${esc(p.location)}<br>
          <a href="mailto:${esc(p.email)}">${esc(p.email)}</a> &nbsp;|&nbsp;
          <a href="${esc(p.linkedin)}" target="_blank" rel="noopener">linkedin.com/in/muditdholakia</a> &nbsp;|&nbsp;
          <a href="${esc(p.github)}" target="_blank" rel="noopener">github.com/muditdholakia</a></p>
      </div>
      <div class="doc__tools">
        <a class="btn btn--ink" href="${esc(p.cvDirector)}" download>Download PDF</a>
        ${HOSTED ? "" : `<button type="button" class="btn btn--ink-ghost" data-print>Print</button>`}
      </div>
    </header>
    <section><h2>Summary</h2><p>${esc(C.summary)}</p></section>
    <section>
      <h2>Scale and impact</h2>
      <dl class="doc__facts">
        ${C.scale.map((s) => `<div><dt>${esc(cap(s.unit))}</dt><dd>${esc(fmt(s))}</dd></div>`).join("")}
        ${C.savings.map((s) => `<div><dt>${esc(s.label)} (${esc(s.where)})</dt><dd>${money(s.value)}</dd></div>`).join("")}
        <div><dt>Agents in production</dt><dd>${C.agents.personal} personal, ${C.agents.team} team</dd></div>
        <div><dt>Hours saved by outage-claims agent</dt><dd>~${C.agents.hoursSaved} / week</dd></div>
      </dl>
    </section>
    <section>
      <h2>Experience</h2>
      ${C.experience.map((e) => `
        <div class="doc__job">
          <div class="doc__jobhead"><h3>${e.logo && LOGOS[e.logo] ? `<img class="doc__orglogo" src="${LOGOS[e.logo]}" alt="">` : ""}${esc(e.org)}</h3><span>${esc(e.start)} – ${esc(e.end)}</span></div>
          <p class="doc__role">${esc(e.role)}, ${esc(e.place)}</p>
          <ul>${e.points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>
        </div>`).join("")}
    </section>
    <section class="doc__two">
      <div>
        <h2>Education</h2>
        <ul class="doc__list">${C.education.map((e) => `<li><strong>${esc(e.title)}</strong>, ${esc(e.org)}, ${esc(e.years)}${e.note ? ". " + esc(e.note) : ""}</li>`).join("")}</ul>
        <h2>Speaking and publications</h2>
        <ul class="doc__list">
          <li><strong>TEDx talk:</strong> ${esc(C.talks.tedx.title)}, ${esc(C.talks.tedx.where)} (<a href="https://youtu.be/${esc(C.talks.tedx.youtubeId)}" target="_blank" rel="noopener">watch</a>)</li>
          <li><strong>Guest talk:</strong> ${esc(C.talks.ieee.title)}, IEEE Pune Section (<a href="https://youtu.be/${esc(C.talks.ieee.youtubeId)}" target="_blank" rel="noopener">watch</a>)</li>
          <li><strong>Podcast:</strong> ${esc(C.talks.podcast.title)}, ${esc(C.talks.podcast.where)} (<a href="${esc(C.talks.podcast.url)}" target="_blank" rel="noopener">listen</a>)</li>
          ${C.talks.publications.items.map((t) => `<li><strong>Paper (${esc(t.year)}):</strong> ${esc(t.title)}. ${esc(t.venue)}.</li>`).join("")}
          <li><a href="${esc(C.talks.publications.profile)}" target="_blank" rel="noopener">ResearchGate profile</a>: ${esc(C.talks.publications.note)}</li>
        </ul>
      </div>
      <div>
        <h2>Certifications</h2>
        <ul class="doc__list">${C.certifications.map((c) => `<li>${esc(c.name)}${c.code ? " (" + esc(c.code) + ")" : ""}</li>`).join("")}</ul>
        <h2>Recognition and community</h2>
        <ul class="doc__list">${[...C.recognition, ...C.community].map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
        <h2>Languages</h2>
        <p>${esc(C.languages)}</p>
      </div>
    </section>
  </article>`;
}

// ───────────────────────── Behaviour ─────────────────────────
let scene = null, lenis = null, savingsFx = null, agentsFx = null, orbitFx = null;

function initSmoothScroll() {
  if (reduced || !window.Lenis || !gsap) return;
  lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

const visible = (el, on, off) => new IntersectionObserver(([e]) => (e.isIntersecting ? on() : off()), { rootMargin: "100px" }).observe(el);

async function initHero() {
  const hero = $(".hero");
  const canvas = $(".hero__gl");
  const callouts = $$(".callout");
  if (webglAvailable()) {
    try {
      scene = await initScene(canvas, {
        reduced,
        onFrame: ({ anchors, morph }) => {
          const show = morph > 0.93 ? 1 : 0;
          anchors.forEach((a, i) => {
            const el = callouts[i];
            if (!el) return;
            el.style.transform = `translate(${a.x}px, ${a.y}px)`;
            el.classList.toggle("is-on", !!show);
          });
        },
      });
      scene.setAnchors(C.callouts.map((c) => c.anchor));
      hero.classList.add("has-gl");
      visible(hero, () => scene.resume(), () => scene.pause());
    } catch (err) {
      console.warn("Showing the static monogram instead of WebGL.", err);
    }
  }

  const name = $(".hero__name");
  const apply = (p) => {
    scene?.setProgress(p);
    name.style.setProperty("--wdth", String(125 - Math.min(1, p * 1.6) * 50));
    hero.style.setProperty("--p", p.toFixed(3));
  };
  if (gsap && ScrollTrigger) {
    ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", scrub: reduced ? false : 0.6, onUpdate: (st) => apply(st.progress) });
  }
  apply(0);
}

function introAnimation() {
  scene?.start();
  if (reduced || !gsap) return;
  const tl = gsap.timeline({ delay: 0.1 });
  tl.from(".hero__line > span", { yPercent: 110, duration: 1.5, ease: "expo.out", stagger: 0.12 })
    .fromTo(".hero__name", { "--wdth": 62 }, { "--wdth": 125, duration: 1.8, ease: "expo.out" }, 0)
    .from([".hero__lede", ".hero__role", ".hero__actions", ".hero__hint"], { opacity: 0, y: 18, duration: 1, ease: "power3.out", stagger: 0.08 }, 0.7);
}

function initStatement() {
  scrubWords($("#statement"));
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target;
    odometer(el, fmt(C.scale[+el.dataset.count]), { duration: 1.8 });
    io.unobserve(el);
  }), { threshold: 0.6 });
  $$(".statement .num").forEach((n) => io.observe(n));
  logoRiver($(".river"));
}

async function initSavingsSection() {
  const sec = $(".savings");
  const canvas = $(".savings__canvas");
  const panel = $(".savings__panel");
  savingsFx = await initSavings(canvas, C.savings, (k) => LOGOS[k], { reduced });
  let current = -1;
  const show = (i) => {
    if (i === current) return;
    current = i;
    const s = C.savings[i];
    $(".savings__idx", panel).textContent = String(i + 1);
    $(".savings__swap", panel).innerHTML = `${s.from.map((k) => tile(k, "")).join("")}<span class="swap__arrow"><svg viewBox="0 0 40 12"><path d="M0 6h36M31 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>${s.to.map((k) => tile(k, "")).join("")}`;
    $(".savings__label", panel).textContent = s.label;
    $(".savings__note", panel).textContent = s.note;
    // the UBS mark already carries its wordmark; other banks show the symbol plus the name
    $(".savings__where", panel).innerHTML = s.whereLogo === "ubs"
      ? logo("ubs", "UBS", "logo--inline logo--wordmark")
      : `${logo(s.whereLogo, "", "logo--inline")}<span>${esc(s.where)}</span>`;
    $$(".savings__dots li", panel).forEach((d, k) => d.classList.toggle("is-on", k <= i));
    odometer($(".savings__value", panel), money(s.value), { duration: 1.1 });
    panel.dataset.bank = bankColor(s);
    if (gsap && !reduced) gsap.fromTo([".savings__swap", ".savings__label"], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06, ease: "power3.out" });
  };
  show(0);
  if (gsap && ScrollTrigger && !reduced) {
    ScrollTrigger.create({
      trigger: $(".savings__pin"),
      start: "top top",
      end: () => "+=" + innerHeight * 3.6,
      pin: true,
      scrub: true,
      onUpdate: (st) => {
        const P = st.progress * C.savings.length;
        savingsFx.setProgress(P);
        show(Math.min(C.savings.length - 1, Math.floor(P * 0.999)));
      },
    });
  } else {
    savingsFx.setProgress(C.savings.length);
  }
  visible(sec, () => savingsFx.resume(), () => savingsFx.pause());
}

function initArchitecture() {
  const A = C.architecture;
  const all = {}, groupOf = {};
  for (const [key, g] of Object.entries(A)) g.nodes.forEach((n) => { all[n.id] = n; groupOf[n.id] = key; });
  const groupLabel = { retiring: "Retiring onto Fabric", platform: "OneLake medallion layer", consume: "Consumed by", governance: "Governance" };
  const edges = [...A.retiring.nodes.map((n) => [n.id, "bronze"]), ...A.consume.nodes.map((n) => ["gold", n.id])];
  const diagram = $("#diagram"), svg = $(".diagram__links"), panel = $("#arch-detail");
  let paths = [], current = "agents", stacked = false;

  function draw() {
    const box = diagram.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    stacked = getComputedStyle(diagram).getPropertyValue("--stacked").trim() === "1";
    if (stacked) { svg.innerHTML = ""; paths = []; return; }
    svg.innerHTML = edges.map(([a, b]) => {
      const ea = $(`[data-node="${a}"]`, diagram).getBoundingClientRect();
      const eb = $(`[data-node="${b}"]`, diagram).getBoundingClientRect();
      const x1 = ea.right - box.left, y1 = ea.top + ea.height / 2 - box.top;
      const x2 = eb.left - box.left, y2 = eb.top + eb.height / 2 - box.top;
      const mx = (x1 + x2) / 2;
      return `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" data-a="${a}" data-b="${b}" class="lnk"/>`;
    }).join("") + edges.map((_, i) => `<circle r="2.6" class="pkt" data-i="${i}"/><circle r="2" class="pkt pkt--2" data-i="${i}"/>`).join("");
    paths = $$(".lnk", svg).map((p) => ({ el: p, len: p.getTotalLength(), a: p.dataset.a, b: p.dataset.b }));
    highlight(current);
  }

  // data packets travelling along the connectors: bronze on the way in, gold on the way out
  let t = 0;
  function packets() {
    t += 0.004;
    const pk = $$(".pkt", svg);
    paths.forEach((p, i) => {
      [pk[i * 2], pk[i * 2 + 1]].forEach((c, k) => {
        if (!c) return;
        const q = (t * (0.9 + (i % 3) * 0.15) + k * 0.5 + i * 0.13) % 1;
        const pt = p.el.getPointAtLength(q * p.len);
        c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y);
        c.setAttribute("class", `pkt ${groupOf[p.a] === "retiring" ? "pkt--bronze" : "pkt--gold"} ${p.el.classList.contains("is-on") ? "is-on" : ""}`);
      });
    });
    if (!reduced) requestAnimationFrame(packets);
  }

  function highlight(id) {
    paths.forEach((p) => p.el.classList.toggle("is-on", p.a === id || p.b === id || groupOf[id] === "platform" || groupOf[id] === "governance"));
  }
  function select(id, anim = true) {
    current = id;
    const n = all[id];
    $$(".node", diagram).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.node === id)));
    panel.dataset.layer = n.layer || groupOf[id];
    const render = () => {
      $(".detail__group", panel).textContent = groupLabel[groupOf[id]];
      $(".detail__name", panel).textContent = n.name;
      $(".detail__text", panel).textContent = n.detail;
    };
    if (gsap && !reduced && anim) {
      gsap.to(panel.children, { opacity: 0, y: -6, duration: 0.15, stagger: 0.02, onComplete: () => { render(); gsap.fromTo(panel.children, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power2.out" }); } });
    } else render();
    highlight(id);
  }
  diagram.addEventListener("click", (e) => { const b = e.target.closest(".node"); if (b) select(b.dataset.node); });
  diagram.addEventListener("keydown", (e) => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    const nodes = $$(".node", diagram), i = nodes.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    nodes[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + nodes.length) % nodes.length].focus();
  });
  select(current, false);
  draw();
  new ResizeObserver(draw).observe(diagram);
  document.fonts?.ready.then(draw);
  if (!reduced) packets();
  // the diagram draws itself in when it first appears
  if (gsap && !reduced) {
    gsap.from(".diagram .node", { opacity: 0, y: 16, duration: 0.7, stagger: 0.04, ease: "power3.out", scrollTrigger: { trigger: diagram, start: "top 75%", once: true } });
  }
}

function initAgentsSection() {
  const canvas = $(".agents__canvas");
  agentsFx = initAgents(canvas, { personal: C.agents.personal, team: C.agents.team, hubIcon: LOGOS.copilotstudio, reduced });
  visible($(".agents"), () => agentsFx.resume(), () => agentsFx.pause());
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    $$(".agents .odo[data-odo]").forEach((el, i) => odometer(el, el.dataset.odo, { duration: 1.6, delay: i * 0.1 }));
    $(".clock").classList.add("is-in");
    io.disconnect();
  }), { threshold: 0.4 });
  io.observe($(".agents__copy"));
}

// The person: four short statements, pinned, each taking over the screen as you scroll.
function initPerson() {
  const sec = $(".person");
  const caps = $$(".pcap", sec), ticks = $$(".person__ticks li", sec);
  const setCap = (n) => { caps.forEach((c, i) => c.classList.toggle("is-on", i === n)); ticks.forEach((t, i) => t.classList.toggle("is-on", i <= n)); };
  if (reduced || !gsap || !ScrollTrigger) { sec.classList.add("is-static"); return; }
  setCap(0);
  ScrollTrigger.create({
    trigger: $(".person__pin", sec), start: "top top", end: () => "+=" + innerHeight * 2.4, pin: true, scrub: 0.4,
    onUpdate: (st) => setCap(Math.min(caps.length - 1, Math.floor(st.progress * caps.length))),
  });
}

function initCareer() {
  const stops = $$(".stop");
  const fill = $(".career__fill");
  const setActive = (p) => {
    const idx = Math.round(p * (stops.length - 1));
    stops.forEach((s, i) => s.classList.toggle("is-on", i <= idx));
    if (fill) fill.style.transform = `scaleX(${p})`;
  };
  if (!gsap || !ScrollTrigger || reduced) { setActive(1); return; }
  const mm = gsap.matchMedia();
  mm.add("(min-width: 960px)", () => {
    const track = $(".track"), pin = $(".career__pin");
    const dist = () => track.scrollWidth - innerWidth + 80;
    const tw = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: pin, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.5, invalidateOnRefresh: true, onUpdate: (st) => setActive(st.progress) },
    });
    return () => tw.scrollTrigger?.kill();
  });
  mm.add("(max-width: 959px)", () => {
    stops.forEach((s) => ScrollTrigger.create({ trigger: s, start: "top 75%", once: true, onEnter: () => s.classList.add("is-on") }));
  });
}

function initVideo() {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-yt]");
    if (!b) return;
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.yt}?autoplay=1&rel=0`;
    f.title = (b.getAttribute("aria-label") || "Video").replace(/^Play the /, "");
    f.allow = "autoplay; encrypted-media; picture-in-picture";
    f.allowFullscreen = true;
    f.className = "video__frame";
    b.replaceWith(f);
  });
}

// On claude.ai a plain download link does nothing, so the CV links hand the PDF to the viewer's
// save prompt through the `downloads` capability. Where a viewer can't save files, the links hide.
function initDownloads() {
  if (!HOSTED) return;
  const links = () => $$("a[download]");
  const ready = (window.claude?.use ? window.claude.use("downloads") : Promise.resolve(null)).catch(() => null);
  ready.then((dl) => { if (!dl) links().forEach((a) => (a.hidden = true)); });
  const gone = ["unavailable", "not_granted", "capability_disabled", "capability_removed", "host_unavailable"];
  document.addEventListener("click", async (e) => {
    const a = e.target.closest("a[download]");
    if (!a) return;
    e.preventDefault();
    const dl = await ready;
    if (!dl) return;
    const href = a.getAttribute("href");
    try {
      const blob = await (await fetch(href)).blob();
      await dl.save({ filename: href.split("/").pop(), data: blob });
      announce("CV saved");
    } catch (err) {
      if (err?.code === "declined") return;
      if (gone.includes(err?.code)) { links().forEach((x) => (x.hidden = true)); announce("Saving files isn't available here. The CV is in the Executive CV view."); }
      else announce("The CV couldn't be saved. Try again in a moment.");
    }
  });
}

function initProgress() {
  const bar = $(".progress span");
  const update = () => { const max = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`; };
  addEventListener("scroll", update, { passive: true });
  update();
}

function announce(msg) { const a = $("#announcer"); a.textContent = ""; requestAnimationFrame(() => (a.textContent = msg)); }

function initCopy() {
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    const text = b.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {
      const ta = Object.assign(document.createElement("textarea"), { value: text, readOnly: true });
      ta.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    if (ok) { b.textContent = "Copied"; announce("Email address copied"); }
    else {
      const range = document.createRange(); range.selectNodeContents($(".contact__email"));
      getSelection().removeAllRanges(); getSelection().addRange(range);
      b.textContent = "Address selected"; announce("Email address selected. Press Control and C to copy.");
    }
    setTimeout(() => (b.textContent = "Copy email"), 2200);
  });
  document.addEventListener("click", (e) => { if (e.target.closest("[data-print]")) window.print(); });
}

// ── Mode switching with the bronze/silver/gold curtain ──
let mode = "immersive";
function setMode(next, { animate = true, focus = true } = {}) {
  if (next === mode) return;
  const swap = () => {
    mode = next;
    document.body.dataset.mode = next;
    $("#immersive").hidden = next !== "immersive";
    $("#cv").hidden = next !== "cv";
    $$("[data-mode-btn]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modeBtn === next)));
    history.replaceState(null, "", next === "cv" ? "#cv" : location.pathname + location.search);
    scrollTo(0, 0);
    lenis?.scrollTo(0, { immediate: true });
    if (next === "cv") { scene?.pause(); lenis?.stop(); } else { scene?.resume(); lenis?.start(); }
    ScrollTrigger?.refresh();
    if (focus) (next === "cv" ? $("#cv-name") : $("#hero-name"))?.focus({ preventScroll: true });
    announce(next === "cv" ? "Showing the Executive CV" : "Showing the immersive view");
  };
  if (!animate || reduced || !gsap) return swap();
  const bands = $$(".curtain i");
  const label = $(".curtain__label");
  label.textContent = next === "cv" ? "Executive CV" : "Immersive";
  gsap.timeline()
    .set(".curtain", { visibility: "visible" })
    .fromTo(bands, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 0.55, ease: "power3.inOut", stagger: 0.07 })
    .fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0.35)
    .to(label, { duration: 0.5, scrambleText: { text: label.textContent, chars: "01", speed: 0.6 } }, 0.35)
    .add(swap)
    .to(label, { opacity: 0, duration: 0.2 }, "+=0.15")
    .to(bands, { scaleX: 0, transformOrigin: "right center", duration: 0.6, ease: "power3.inOut", stagger: 0.07 }, "<")
    .set(".curtain", { visibility: "hidden" });
}
function initMode() {
  $$("[data-mode-btn]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.modeBtn)));
  document.addEventListener("click", (e) => { const g = e.target.closest("[data-goto]"); if (g) setMode(g.dataset.goto); });
  addEventListener("hashchange", () => setMode(location.hash === "#cv" ? "cv" : "immersive"));
  if (location.hash === "#cv") setMode("cv", { animate: false, focus: false });
}

// ───────────────────────── Boot ─────────────────────────
async function boot() {
  renderImmersive();
  renderCV();
  initMode();
  initSmoothScroll();
  initProgress();
  initCopy();
  initVideo();
  initDownloads();

  // preloader: real progress of the hero assets
  const loader = $(".loader");
  const pct = $(".loader__pct");
  const bars = $$(".loader__bar i");
  const assets = C.savings.flatMap((s) => s.from.map((k) => LOGOS[k])).filter(Boolean);
  await Promise.race([
    preload(assets, (f) => { pct.textContent = String(Math.round(f * 100)).padStart(2, "0"); bars.forEach((b) => (b.style.transform = `scaleX(${f})`)); }),
    new Promise((r) => setTimeout(r, 6000)),
  ]);

  await initHero();
  initStatement();
  await initSavingsSection();
  initArchitecture();
  initAgentsSection();
  orbitFx = initOrbit($("#orbit"), C.skills, { reduced });
  visible($("#orbit"), () => orbitFx.resume(), () => orbitFx.pause());
  initPerson();
  initCareer();
  kineticHeadings($("#immersive"));
  initCursor();
  initMagnetic();
  ScrollTrigger?.refresh();

  // reveal
  document.documentElement.classList.add("is-ready");
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove("preload")));
  if (gsap && !reduced) {
    gsap.timeline()
      .to(".loader__bar i", { scaleY: 0, duration: 0.4, ease: "power2.in", stagger: 0.05 })
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "-=0.1")
      .add(introAnimation, "-=0.55")
      .set(loader, { display: "none" });
  } else {
    loader.style.display = "none";
    introAnimation();
  }
  window.__site = { setMode, get mode() { return mode; }, scene, savingsFx };
}
boot();
