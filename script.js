const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Broadcast graphics driven by scroll progress
const root = document.documentElement;
const hud = document.querySelector('.hud');
const hudFill = document.getElementById('hud-fill');
const hudPct = document.getElementById('hud-pct');
const CIRC = 2 * Math.PI * 78;
if (hudFill) { hudFill.style.strokeDasharray = CIRC; hudFill.style.strokeDashoffset = CIRC; }
if (hud && reduceMotion && hud.pauseAnimations) hud.pauseAnimations();
const clamp01 = v => Math.min(1, Math.max(0, v));
const ramp = (p, a, b) => { const t = clamp01((p - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---- Channels: crossfade by scroll, flash static + update OSD on each switch ----
const chans = [...document.querySelectorAll('.ch')].map(el => ({ el, a: +el.dataset.a, b: +el.dataset.b, hud: el.dataset.hud, num: el.dataset.ch }));
const osd = document.getElementById('osd');
const stat = document.querySelector('.static');
let curCh = null;
function flashStatic() {
  if (!stat || reduceMotion) return;
  stat.classList.remove('on'); void stat.offsetWidth; stat.classList.add('on');
}
function updateChannels(p, dark) {
  let active = null, best = 0;
  for (const c of chans) {
    const w = ramp(p, c.a - 0.008, c.a + 0.008) * (1 - ramp(p, c.b - 0.008, c.b + 0.008));
    c.el.style.opacity = w.toFixed(3);
    c.el.style.visibility = w > 0.002 ? 'visible' : 'hidden';
    if (w > best) { best = w; active = c; }
  }
  const num = active && best > 0.5 ? active.num : (dark > 0.5 ? '00' : '--');
  if (num !== curCh) {
    if (curCh !== null && dark > 0.5) flashStatic();
    curCh = num;
    if (osd) osd.textContent = 'CH ' + num;
  }
  return active && best > 0.5 ? active.hud : null;
}

// on narrow screens fit the arrow artwork instead of cropping it
const arrowSvg = document.querySelector('.ch-black svg');
const fitArrows = () => arrowSvg && arrowSvg.setAttribute('preserveAspectRatio', innerWidth < 700 ? 'xMidYMid meet' : 'xMidYMid slice');
fitArrows(); addEventListener('resize', fitArrows);

// fill the gibberish line + scrolling code columns
const gib = document.getElementById('gib');
const rnd = (s, n) => Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join('');
if (gib) gib.textContent = Array.from({ length: 14 }, () => rnd('ABCDEFGHJKLMNPRSTUVWXYZ', 3 + Math.floor(Math.random() * 5))).join(' ');
const cols = document.getElementById('code-cols');
if (cols) {
  const n = innerWidth < 600 ? 4 : 8;
  for (let i = 0; i < n; i++) {
    const lines = Array.from({ length: 60 }, (_, k) => {
      const r = Math.random();
      if (r < .35) return '0x' + rnd('0123456789ABCDEF', 8) + '  ' + rnd('01', 8);
      if (r < .6) return 'SIG.' + rnd('0123456789', 4) + ' :: ' + ['OK', 'ACK', 'SYNC', 'LOCK', 'NULL'][k % 5];
      if (r < .8) return rnd('ABCDEF0123456789', 4) + ' ' + rnd('ABCDEF0123456789', 4) + ' ' + rnd('ABCDEF0123456789', 4);
      return '> CERULEAN.' + rnd('abcdefghijklmnop', 6) + '()';
    }).join('\n');
    const d = document.createElement('div');
    d.textContent = lines + '\n' + lines;
    cols.appendChild(d);
  }
}

// REC timecode (hh:mm:ss:ff)
const tc = document.getElementById('timecode');
if (tc) {
  const t0 = performance.now();
  const tick = () => {
    const ms = performance.now() - t0, f = Math.floor(ms / (1000 / 30)) % 30, s = Math.floor(ms / 1000);
    const pad = n => String(n).padStart(2, '0');
    tc.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(f)}`;
    if (!reduceMotion) requestAnimationFrame(tick);
  };
  tick();
}

function onScrollFx(p) {
  const dark = 1;                                                  // broadcast look from the first frame
  const hudIn = 1 - ramp(p, 0.9, 0.97);                            // reticle on from the start, fades at the end
  const burst = ramp(p, 0.8, 1);                                   // light burst at the bottom
  root.style.setProperty('--tint', dark.toFixed(3));
  root.style.setProperty('--rings', '0.55');
  root.classList.toggle('is-dark', dark > 0.5);
  if (hud) {
    root.style.setProperty('--ho', hudIn.toFixed(3));
    root.style.setProperty('--hs', (0.45 + p * 0.9).toFixed(3));
  }
  const chHud = updateChannels(p, dark);
  root.style.setProperty('--hud', chHud || (dark > 0.5 ? '#cfe6ff' : '#0a84c6'));
  root.style.setProperty('--tv', dark.toFixed(3));
  if (hudFill) hudFill.style.strokeDashoffset = (CIRC * (1 - p)).toFixed(1);
  if (hudPct) hudPct.textContent = 'SIG ' + String(Math.round(p * 100)).padStart(3, '0');
  root.style.setProperty('--bo', burst.toFixed(3));
  root.style.setProperty('--bs', (0.2 + burst * 0.8).toFixed(3));
}

// Scroll: progress counter in the top bar + rings slowly zoom as you go down
const progress = document.querySelector('.progress');
const rings = document.querySelector('.rings');
let ticking = false;
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  if (progress) progress.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
  if (rings && !reduceMotion) rings.style.setProperty('--s', (1 + p * 1.6).toFixed(3));
  onScrollFx(p);
  ticking = false;
}
addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
