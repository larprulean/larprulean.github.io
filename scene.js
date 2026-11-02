// Live 3D layer: glossy / chrome objects pinned to the .obj anchors in the page.
(() => {
  const canvas = document.getElementById('scene');
  if (!canvas || !window.THREE) return;
  const T = window.THREE;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, 0.1, 200);
  camera.position.z = 20;
  let f = 0.01; // world units per CSS pixel at z = 0

  // ---------- materials: hand-painted "matcaps" (fake studio lighting, no assets) ----------
  function matcap({ base, chrome = false, dark, light }) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    if (chrome) {
      const st = chrome === 'gold'
        ? ['#fff6d0', '#e2b54a', '#5a3a08', '#ffe9a3', '#a8741c', '#2a1a02']
        : ['#ffffff', '#a9adb3', '#27292d', '#f1eee4', '#777a80', '#141517'];
      const lg = g.createLinearGradient(0, 0, 0, 256);
      lg.addColorStop(0, st[0]); lg.addColorStop(0.3, st[1]); lg.addColorStop(0.47, st[2]);
      lg.addColorStop(0.53, st[3]); lg.addColorStop(0.78, st[4]); lg.addColorStop(1, st[5]);
      g.fillStyle = lg;
    } else {
      g.fillStyle = base;
    }
    g.fillRect(0, 0, 256, 256);
    let rg = g.createRadialGradient(128, 128, 50, 128, 128, 132);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, dark);
    g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
    rg = g.createRadialGradient(190, 196, 0, 190, 196, 90);
    rg.addColorStop(0, light); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
    rg = g.createRadialGradient(86, 74, 0, 86, 74, 64);
    rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(0.22, 'rgba(255,255,255,.7)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    return new T.MeshMatcapMaterial({ matcap: tex });
  }
  const MATS = {
    blue:   matcap({ base: '#0a84c6', dark: 'rgba(0,18,48,.9)',  light: 'rgba(150,230,255,.85)' }),
    red:    matcap({ base: '#e4322b', dark: 'rgba(60,0,0,.85)',  light: 'rgba(255,190,120,.85)' }),
    yellow: matcap({ base: '#f2cf1d', dark: 'rgba(90,55,0,.8)',  light: 'rgba(255,255,220,.95)' }),
    chrome: matcap({ chrome: true,    dark: 'rgba(0,0,0,.55)',   light: 'rgba(140,215,255,.75)' }),
    gold:   matcap({ chrome: 'gold',  dark: 'rgba(40,20,0,.6)',  light: 'rgba(255,240,180,.8)' }),
  };

  // ---------- geometries (all roughly fit a radius-1 sphere) ----------
  const bevel = { bevelEnabled: true, bevelSegments: 10, curveSegments: 72 };

  function geoC() {
    const s = new T.Shape();
    const R = 1, r = 0.5, a0 = 0.62, a1 = Math.PI * 2 - 0.62; // opening faces right
    s.absarc(0, 0, R, a0, a1, false);
    s.absarc(0, 0, r, a1, a0, true);
    s.closePath();
    const g = new T.ExtrudeGeometry(s, { ...bevel, depth: 0.32, bevelThickness: 0.24, bevelSize: 0.2 });
    g.center();
    return g;
  }
  function geoFlower() {
    const s = new T.Shape();
    const N = 240;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rad = 0.78 + 0.2 * Math.cos(6 * a);
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      i ? s.lineTo(x, y) : s.moveTo(x, y);
    }
    const g = new T.ExtrudeGeometry(s, { ...bevel, depth: 0.25, bevelThickness: 0.28, bevelSize: 0.16 });
    g.center();
    return g;
  }
  function geoArrow() {
    const s = new T.Shape();
    s.moveTo(-1, -0.22); s.lineTo(0.15, -0.22); s.lineTo(0.15, -0.52); s.lineTo(1, 0);
    s.lineTo(0.15, 0.52); s.lineTo(0.15, 0.22); s.lineTo(-1, 0.22); s.closePath();
    const g = new T.ExtrudeGeometry(s, { bevelEnabled: true, bevelSegments: 6, depth: 0.22, bevelThickness: 0.08, bevelSize: 0.07 });
    g.center();
    return g;
  }
  const geoKnot = () => new T.TorusKnotGeometry(0.62, 0.22, 220, 28);
  function geoBlob() {
    const g = new T.SphereGeometry(0.9, 110, 80);
    g.userData.base = g.attributes.position.array.slice();
    return g;
  }
  function makeGlobe(mat) {
    const grp = new T.Group();
    grp.add(new T.Mesh(new T.SphereGeometry(0.82, 72, 54), mat));
    // latitude / longitude lines
    const pts = [];
    const rr = 0.83;
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = rr * Math.sin(lat * Math.PI / 180), rc = rr * Math.cos(lat * Math.PI / 180);
      for (let i = 0; i < 96; i++) {
        const a = (i / 96) * Math.PI * 2, b = ((i + 1) / 96) * Math.PI * 2;
        pts.push(Math.cos(a) * rc, y, Math.sin(a) * rc, Math.cos(b) * rc, y, Math.sin(b) * rc);
      }
    }
    for (let lon = 0; lon < 180; lon += 30) {
      const o = lon * Math.PI / 180;
      for (let i = 0; i < 96; i++) {
        const a = (i / 96) * Math.PI * 2, b = ((i + 1) / 96) * Math.PI * 2;
        pts.push(rr * Math.cos(a) * Math.cos(o), rr * Math.sin(a), rr * Math.cos(a) * Math.sin(o),
                 rr * Math.cos(b) * Math.cos(o), rr * Math.sin(b), rr * Math.sin(o) * Math.cos(b));
      }
    }
    const lg = new T.BufferGeometry();
    lg.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    grp.add(new T.LineSegments(lg, new T.LineBasicMaterial({ color: 0x121212, transparent: true, opacity: 0.55 })));
    // planet ring
    const ring = new T.Mesh(new T.TorusGeometry(1.12, 0.045, 18, 140), MATS.red);
    ring.rotation.x = Math.PI / 2.3;
    ring.rotation.y = 0.35;
    grp.add(ring);
    return grp;
  }

  // ---------- build one object per anchor ----------
  const items = [];
  document.querySelectorAll('.obj[data-obj]').forEach((el, i) => {
    const kind = el.dataset.obj;
    const mat = MATS[el.dataset.mat] || MATS.chrome;
    let obj;
    if (kind === 'c') obj = new T.Mesh(geoC(), mat);
    else if (kind === 'flower') obj = new T.Mesh(geoFlower(), mat);
    else if (kind === 'arrow') obj = new T.Mesh(geoArrow(), mat);
    else if (kind === 'knot') obj = new T.Mesh(geoKnot(), mat);
    else if (kind === 'blob') obj = new T.Mesh(geoBlob(), mat);
    else if (kind === 'globe') obj = makeGlobe(mat);
    else return;
    const spin = (i % 2 ? -1 : 1) * (0.35 + (i % 3) * 0.12);
    obj.rotation.set(0.3 + i * 0.7, i * 1.3, 0.1 * i);
    scene.add(obj);
    items.push({ el, obj, kind, spin, hero: el.hasAttribute('data-hero'), seed: i * 1.7, cx: 0, cy: 0, size: 0 });
  });
  if (!items.length) return;

  // ---------- pin objects to their anchors ----------
  function layout() {
    const sy = scrollY;
    for (const it of items) {
      const r = it.el.getBoundingClientRect();
      it.cx = r.left + r.width / 2;
      it.cy = r.top + sy + r.height / 2;
      it.size = Math.min(r.width, r.height || r.width);
      it.obj.position.x = (it.cx - innerWidth / 2) * f;
      it.obj.position.y = -it.cy * f;
      it.obj.scale.setScalar((it.size * f) / 2.5);
    }
  }
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    f = (2 * Math.tan(T.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / h;
    layout();
  }
  addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  addEventListener('load', layout);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(document.body);

  // mouse tilt for the hero "c"
  let mx = 0, my = 0;
  addEventListener('pointermove', e => {
    mx = (e.clientX / innerWidth) * 2 - 1;
    my = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  // ---------- loop ----------
  const clock = new T.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    const sy = scrollY;
    camera.position.y = -(sy + innerHeight / 2) * f;

    for (const it of items) {
      const onScreen = Math.abs(it.cy - (sy + innerHeight / 2)) < innerHeight + it.size;
      it.obj.visible = onScreen;
      if (!onScreen) continue;
      const o = it.obj;
      if (it.hero) {
        o.rotation.y = t * 0.9;
        o.rotation.x += ((my * 0.5) - o.rotation.x) * 0.06;
        o.rotation.z += ((-mx * 0.35) - o.rotation.z) * 0.06;
        o.position.y = -it.cy * f + Math.sin(t * 1.6) * it.size * f * 0.04;
      } else {
        o.rotation.y = it.seed + t * it.spin + sy * 0.0012;
        o.rotation.x = it.seed * 0.5 + t * it.spin * 0.45;
        o.position.y = -it.cy * f + Math.sin(t * 0.9 + it.seed) * it.size * f * 0.05;
      }
      if (it.kind === 'blob') {
        const pos = o.geometry.attributes.position, base = o.geometry.userData.base;
        const arr = pos.array;
        for (let k = 0; k < arr.length; k += 3) {
          const x = base[k], y = base[k + 1], z = base[k + 2];
          const d = 1 + 0.16 * Math.sin(x * 3.1 + t * 1.3) * Math.sin(y * 2.7 + t * 1.1) * Math.sin(z * 3.3 + t * 0.9 + it.seed);
          arr[k] = x * d; arr[k + 1] = y * d; arr[k + 2] = z * d;
        }
        pos.needsUpdate = true;
        o.geometry.computeVertexNormals();
      }
    }
    renderer.render(scene, camera);
  }

  resize();
  if (reduce) {
    const still = () => { clock.elapsedTime = 0; frame(); };
    addEventListener('scroll', () => requestAnimationFrame(still), { passive: true });
    addEventListener('resize', () => requestAnimationFrame(still));
    still();
  } else {
    renderer.setAnimationLoop(frame);
  }
})();
