const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

// ---------- themes ----------
const THEMES = [
  { id: 'roots',  name: 'Roots',  dark: false },
  { id: 'signal', name: 'Signal', dark: true },
  { id: 'lime',   name: 'Acid',   dark: false },
  { id: 'red',    name: 'Alert',  dark: false },
  { id: 'black',  name: 'Chrome', dark: true },
  { id: 'synth',  name: 'Sunset', dark: true },
  { id: 'nv',     name: 'Night',  dark: true },
  { id: 'code',   name: 'Pink',   dark: true },
];
const KEY = 'cerulean-theme';
const osd = document.getElementById('osd');
const chLabel = document.getElementById('ch-label');
const stat = document.querySelector('.static');
const radios = [...document.querySelectorAll('.rm-list [data-theme]')];
let current = 0, osdTimer;

function flashStatic() {
  if (!stat || reduceMotion) return;
  stat.classList.remove('on'); void stat.offsetWidth; stat.classList.add('on');
}

function setTheme(i, { animate = true, save = true } = {}) {
  current = (i + THEMES.length) % THEMES.length;
  const t = THEMES[current];
  const num = String(current).padStart(2, '0');
  root.dataset.theme = t.id;
  root.classList.toggle('is-dark', t.dark);
  radios.forEach((r, k) => {
    r.setAttribute('aria-checked', String(k === current));
    r.tabIndex = k === current ? 0 : -1;
  });
  if (chLabel) chLabel.textContent = `CH ${num} ${t.name.toUpperCase()}`;
  if (osd) {
    osd.textContent = `CH ${num}`;
    if (animate) {
      osd.classList.add('show');
      clearTimeout(osdTimer);
      osdTimer = setTimeout(() => osd.classList.remove('show'), 1400);
    }
  }
  if (animate) flashStatic();
  document.dispatchEvent(new CustomEvent('themechange', { detail: t.id }));
  if (save) { try { localStorage.setItem(KEY, t.id); } catch (e) {} }
}

radios.forEach((r, k) => r.addEventListener('click', () => setTheme(k)));
document.querySelectorAll('.rm-step').forEach(b =>
  b.addEventListener('click', () => setTheme(current + Number(b.dataset.step))));

// keyboard: ←/→ or 0–7 flip channels
addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  const onRemote = radios.includes(document.activeElement);
  if (e.key === 'ArrowRight') { setTheme(current + 1); if (onRemote) radios[current].focus(); }
  else if (e.key === 'ArrowLeft') { setTheme(current - 1); if (onRemote) radios[current].focus(); }
  else if (/^[0-7]$/.test(e.key)) setTheme(Number(e.key));
});

// start on the remembered theme (or Roots)
let saved = null;
try { saved = localStorage.getItem(KEY); } catch (e) {}
setTheme(Math.max(0, THEMES.findIndex(t => t.id === saved)), { animate: false, save: false });

// ---------- HUD (Signal theme) ----------
const hudFill = document.getElementById('hud-fill');
if (hudFill) {
  const CIRC = 2 * Math.PI * 78;
  hudFill.style.strokeDasharray = CIRC;
  hudFill.style.strokeDashoffset = CIRC * 0.3;
}
const hud = document.querySelector('.hud');
if (hud && reduceMotion && hud.pauseAnimations) hud.pauseAnimations();

// ---------- channel art fillers ----------
const arrowSvg = document.querySelector('.ch-black svg');
const fitArrows = () => arrowSvg && arrowSvg.setAttribute('preserveAspectRatio', innerWidth < 700 ? 'xMidYMid meet' : 'xMidYMid slice');
fitArrows(); addEventListener('resize', fitArrows);

const rnd = (s, n) => Array.from({ length: n }, () => s[Math.floor(Math.random() * s.length)]).join('');
const gib = document.getElementById('gib');
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
