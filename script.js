const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Pop "still here?" in whenever the bottom of the page scrolls into view
const end = document.querySelector('.end');
if (end && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    end.classList.toggle('in', entry.isIntersecting);
  }, { threshold: 0.5 }).observe(end);
} else if (end) {
  end.classList.add('in');
}

// Grid spotlight: follows the cursor; wanders on its own when there's no mouse
const spot = document.querySelector('.grid-spot');
let lastMove = 0;
if (spot) {
  const setSpot = (x, y) => {
    spot.style.setProperty('--mx', x + 'px');
    spot.style.setProperty('--my', y + 'px');
  };
  window.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    lastMove = performance.now();
    setSpot(e.clientX, e.clientY);
  });
  if (!reduceMotion) {
    const wander = t => {
      if (t - lastMove > 2500) {
        const w = innerWidth, h = innerHeight;
        setSpot(w / 2 + Math.sin(t / 3100) * w * 0.32, h / 2 + Math.cos(t / 2300) * h * 0.25);
      }
      requestAnimationFrame(wander);
    };
    requestAnimationFrame(wander);
  }
}

// Random cells softly lighting up
const flashes = document.querySelector('.flashes');
if (flashes && !reduceMotion) {
  const cell = 64;
  const pool = Array.from({ length: 8 }, () => {
    const d = document.createElement('div');
    d.className = 'flash';
    flashes.appendChild(d);
    return d;
  });
  let i = 0;
  setInterval(() => {
    const d = pool[i++ % pool.length];
    const cols = Math.ceil(innerWidth / cell) + 2;
    const rows = Math.ceil(innerHeight / cell) + 2;
    d.style.left = (Math.floor(Math.random() * cols) * cell + 1) + 'px';
    d.style.top = (Math.floor(Math.random() * rows) * cell + 1) + 'px';
    d.classList.remove('on');
    void d.offsetWidth; // restart animation
    d.classList.add('on');
  }, 650);
}

const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();
