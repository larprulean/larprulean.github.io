const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Stamp "still here?" in whenever the bottom of the page scrolls into view
const end = document.querySelector('.end');
if (end && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    end.classList.toggle('in', entry.isIntersecting);
  }, { threshold: 0.5 }).observe(end);
} else if (end) {
  end.classList.add('in');
}

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

function onScrollFx(p) {
  const dark = ramp(p, 0.05, 0.22);                                // paper -> electric blue
  const hudIn = ramp(p, 0.06, 0.2) * (1 - ramp(p, 0.9, 0.97));     // reticle fades in, then out at the end
  const burst = ramp(p, 0.8, 1);                                   // light burst at the bottom
  root.style.setProperty('--tint', dark.toFixed(3));
  root.style.setProperty('--rings', (1 - dark * 0.85).toFixed(3));
  root.classList.toggle('is-dark', dark > 0.5);
  if (hud) {
    root.style.setProperty('--ho', hudIn.toFixed(3));
    root.style.setProperty('--hs', (0.45 + p * 0.9).toFixed(3));
    root.style.setProperty('--hud', dark > 0.5 ? '#cfe6ff' : '#0a84c6');
  }
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
