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

// Scroll: progress counter in the top bar + rings slowly zoom as you go down
const progress = document.querySelector('.progress');
const rings = document.querySelector('.rings');
let ticking = false;
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
  if (progress) progress.textContent = String(Math.round(p * 100)).padStart(3, '0') + '%';
  if (rings && !reduceMotion) rings.style.setProperty('--s', (1 + p * 1.6).toFixed(3));
  ticking = false;
}
addEventListener('scroll', () => {
  if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
