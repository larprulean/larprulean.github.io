// Fill the data column on the right edge: tiny icons and bars.
// The list is rendered twice so the slow upward feed loops seamlessly.
(() => {
  const track = document.getElementById('datacol');
  if (!track) return;

  const ICONS = {
    doc:    '<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12"/><path d="M5 6h6M5 9h6M5 12h3"/></svg>',
    tower:  '<svg viewBox="0 0 16 16"><path d="M3 14V6h2V3h2v3h2V3h2v3h2v8z"/></svg>',
    ring:   '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M11 5.2A4 4 0 1 0 11 10.8"/></svg>',
    cross:  '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/><path d="M1 8h14M8 1v14"/></svg>',
    screen: '<svg viewBox="0 0 16 16"><rect x="1.5" y="3" width="13" height="9"/><path d="M5 14h6"/></svg>',
  };
  const fill = () => (45 + Math.floor(Math.random() * 45)) + '%';

  const rows = [
    () => `<div class="drow">${ICONS.doc}<span class="bar" style="--fill:${fill()}"></span></div>`,
    () => `<div class="drow blink">${ICONS.tower}<span class="bar" style="--fill:${fill()}"></span></div>`,
    () => `<div class="drow">${ICONS.ring}<span class="bar" style="--fill:${fill()}"></span></div>`,
    () => `<div class="drow">${ICONS.screen}<span class="bar tall" style="--fill:${fill()}"></span></div>`,
    () => `<div class="drow blink">${ICONS.cross}<span class="bar" style="--fill:${fill()}"></span></div>`,
  ];

  const block = Array.from({ length: 7 }, () => rows.map(r => r()).join('')).join('');
  track.innerHTML = block + block;
})();
