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

// Spiral: draws itself, spins and grows with scroll progress
const spiral = document.querySelector('.spiral');
const spiralPath = document.getElementById('spiral-path');
let spiralLen = 0;
if (spiralPath) {
  const pts = [];
  const turns = 9, steps = 1400, maxR = 96;
  for (let i = 0; i <= steps; i++) {
    const th = (i / steps) * turns * Math.PI * 2;
    const r = (i / steps) * maxR;
    pts.push((i ? 'L' : 'M') + (Math.cos(th) * r).toFixed(2) + ' ' + (Math.sin(th) * r).toFixed(2));
  }
  spiralPath.setAttribute('d', pts.join(''));
  spiralLen = spiralPath.getTotalLength();
  spiralPath.style.strokeDasharray = spiralLen;
  spiralPath.style.strokeDashoffset = spiralLen;
}

// Bands: slide sideways based on where they sit in the viewport
const bands = [...document.querySelectorAll('.band')].map(el => ({ el, span: el.firstElementChild, speed: parseFloat(el.dataset.speed) || 1 }));

function onScrollFx(p) {
  if (spiralPath && !reduceMotion) {
    spiralPath.style.strokeDashoffset = (spiralLen * (1 - p)).toFixed(1);
    spiral.style.setProperty('--rot', (p * 900).toFixed(1) + 'deg');
    spiral.style.setProperty('--sc', (0.5 + p * 0.8).toFixed(3));
  }
  if (reduceMotion) return;
  const vh = innerHeight;
  for (const b of bands) {
    const r = b.el.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) continue;
    const off = (r.top + r.height / 2 - vh / 2); // px from viewport center
    b.span.style.setProperty('--x', (-innerWidth * 0.15 + off * b.speed).toFixed(1) + 'px');
  }
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
