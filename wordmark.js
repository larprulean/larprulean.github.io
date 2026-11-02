// Hand-built "CERULEAN" in 3D tube lettering: every letter drawn differently
// (concentric rings, inflated tubes, wire, scribble), faked into 3D with stacked
// extrusion strokes, an outline, a light face and a highlight — then roughened
// with a photocopy filter whose noise "boils" like hand-drawn animation.
(() => {
  const svg = document.getElementById('wordmark');
  if (!svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COL = {
    face: '#ecebe8',      // off-white, like the album's label strip
    outline: '#14121c',
    sideNear: '#14121c',
    sideFar: '#8b78ff',
    hi: '#ffffff',
    line: '#14121c',
  };

  const el = (tag, attrs = {}, parent = svg) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };
  const mix = (a, b, t) => {
    const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };

  // ---- photocopy filter: wobbly edges + speckle; seeds swapped to make it boil ----
  const defs = el('defs');
  const f = el('filter', { id: 'xerox', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
  const turb = el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.022', numOctaves: '2', seed: '1', result: 'warp' }, f);
  el('feDisplacementMap', { in: 'SourceGraphic', in2: 'warp', scale: '7', xChannelSelector: 'R', yChannelSelector: 'G', result: 'wob' }, f);
  const speck = el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: '1', seed: '4', result: 'n' }, f);
  el('feColorMatrix', { in: 'n', type: 'matrix', values: '0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0 0.16  0 0 0 -3.4 1.3', result: 'dots' }, f);
  el('feComposite', { in: 'dots', in2: 'wob', operator: 'in', result: 'dotsIn' }, f);
  el('feMerge', {}, f).append(
    Object.assign(document.createElementNS(NS, 'feMergeNode'), {}),
    Object.assign(document.createElementNS(NS, 'feMergeNode'), {})
  );
  const merge = f.lastChild;
  merge.children[0].setAttribute('in', 'wob');
  merge.children[1].setAttribute('in', 'dotsIn');

  const root = el('g', { filter: 'url(#xerox)' });

  // ---- tube letter: extrusion stack -> outline -> face -> shade -> highlight ----
  function tube(d, { w, depth = 14, dx = 1.25, dy = 1.15, rot = 0, cx = 0, cy = 0 }) {
    const g = el('g', { transform: rot ? `rotate(${rot} ${cx} ${cy})` : '' }, root);
    const common = { d, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    for (let k = depth; k >= 1; k--) {
      el('path', { ...common, stroke: mix(COL.sideNear, COL.sideFar, (k - 1) / depth), 'stroke-width': w + 3, transform: `translate(${k * dx} ${k * dy})` }, g);
    }
    el('path', { ...common, stroke: COL.outline, 'stroke-width': w + 4 }, g);
    el('path', { ...common, stroke: COL.face, 'stroke-width': w - 1.5 }, g);
    el('path', { ...common, stroke: COL.sideFar, 'stroke-opacity': .32, 'stroke-width': w * .42, transform: `translate(${w * .16} ${w * .16})` }, g);
    el('path', { ...common, stroke: COL.hi, 'stroke-opacity': .75, 'stroke-width': Math.max(2, w * .2), transform: `translate(${-w * .18} ${-w * .2})` }, g);
    return g;
  }

  // ---- concentric-ring letter (the C) ----
  function rings({ cx, cy, rMax, rMin, step, a0, a1, depth = 4 }) {
    const g = el('g', {}, root);
    const P = (r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)];
    for (let r = rMax; r >= rMin; r -= step) {
      const [x0, y0] = P(r, a0), [x1, y1] = P(r, a1);
      const d = `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 1 0 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      for (let k = depth; k >= 1; k--) el('path', { d, fill: 'none', stroke: mix(COL.sideNear, COL.sideFar, k / depth), 'stroke-width': 4, 'stroke-linecap': 'round', transform: `translate(${k * 1.2} ${k * 1.1})` }, g);
      el('path', { d, fill: 'none', stroke: COL.face, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, g);
      el('path', { d, fill: 'none', stroke: COL.line, 'stroke-width': 1.3, 'stroke-linecap': 'round', transform: 'translate(-1.4 -1.4)' }, g);
    }
    return g;
  }

  // C — nested rings, open on the right
  tube('M176 96 C144 62 66 64 46 132 C30 190 46 262 106 284 C140 296 168 284 184 264', { w: 36, depth: 16, rot: 3, cx: 110, cy: 180 });
  // E — chunky inflated
  tube('M296 78 C262 70 232 70 214 76 C210 120 208 150 210 178 M212 178 C236 176 258 176 282 172 M210 180 C206 220 204 252 206 284 C236 290 268 290 300 286', { w: 34, depth: 15, rot: -3, cx: 255, cy: 180 });
  // R — thin wire
  tube('M338 292 C336 220 336 150 342 82 C392 66 430 92 420 132 C412 168 372 176 348 176 C374 214 398 252 418 292', { w: 13, depth: 9 });
  // U — big inflated
  tube('M444 72 C436 160 438 236 470 280 C496 312 540 300 552 268 C566 228 566 150 558 66', { w: 38, depth: 17 });
  // L — tall, leaning
  tube('M612 38 C606 120 600 210 598 288 C622 290 646 288 672 284', { w: 30, depth: 15, rot: 4, cx: 630, cy: 170 });
  // E — tangled scribble
  tube('M792 84 C754 70 722 74 714 94 C708 130 716 156 712 180 C738 172 764 174 784 180 C796 166 778 152 768 168 C760 182 782 194 792 182 M712 182 C708 220 716 254 712 284 C742 296 772 292 800 282 C808 272 792 264 786 278', { w: 13, depth: 9 });
  // A — wire triangle
  tube('M808 292 L862 58 L920 292 M834 208 C856 204 876 204 896 206', { w: 10, depth: 12 });
  // N — wide inflated
  tube('M948 294 C946 220 948 150 952 76 C984 146 1024 214 1058 284 C1062 210 1064 140 1068 64', { w: 34, depth: 16, rot: -2, cx: 1008, cy: 180 });

  // ---- emblem: rotating 3D spiral inside the CERULEAN text ring ----
  const spiralHost = document.getElementById('em-spiral');
  if (spiralHost) {
    const pts = [];
    const turns = 4.2, steps = 700, r0 = 4, r1 = 58;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, a = t * turns * Math.PI * 2, r = r0 + (r1 - r0) * t;
      pts.push((i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(2) + ' ' + (Math.sin(a) * r).toFixed(2));
    }
    const d = pts.join('');
    const fs = el('filter', { id: 'xerox-sm', x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
    el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.05', numOctaves: '2', seed: '3', result: 'w' }, fs);
    el('feDisplacementMap', { in: 'SourceGraphic', in2: 'w', scale: '2.2', xChannelSelector: 'R', yChannelSelector: 'G' }, fs);
    const wrap = el('g', { filter: 'url(#xerox-sm)' }, spiralHost);
    const spinning = (parent, attrs) => {
      const g = el('g', {}, parent);
      if (!reduce) el('animateTransform', { attributeName: 'transform', type: 'rotate', from: '0', to: '-360', dur: '9s', repeatCount: 'indefinite' }, g);
      el('path', { d, fill: 'none', 'stroke-linecap': 'round', ...attrs }, g);
    };
    const depth = 5;
    for (let k = depth; k >= 1; k--) {
      const off = el('g', { transform: `translate(${k * 1.1} ${k * 1.05})` }, wrap);
      spinning(off, { stroke: mix(COL.sideNear, COL.sideFar, (k - 1) / depth), 'stroke-width': 9 });
    }
    spinning(wrap, { stroke: COL.outline, 'stroke-width': 9.5 });
    spinning(wrap, { stroke: COL.face, 'stroke-width': 6.4 });
    const hiG = el('g', { transform: 'translate(-1.3 -1.3)' }, wrap);
    spinning(hiG, { stroke: COL.hi, 'stroke-opacity': .75, 'stroke-width': 1.8 });
  }

  // line boil: swap noise seeds a few times a second
  if (!reduce) {
    let s = 0;
    setInterval(() => {
      s = (s + 1) % 3;
      turb.setAttribute('seed', String(1 + s));
      speck.setAttribute('seed', String(4 + s));
    }, 160);
  }
})();
