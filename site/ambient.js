/* Ambient layer: day/night theme, a quiet "automation running in the background" canvas with the sky
   (sun and birds by day, moon, stars and the odd meteor at night), and a custom cursor.
   Everything sits behind the content or follows the pointer; nothing here changes how the page works. */
(() => {
  const root = document.documentElement;
  const KEY = 'site-theme';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const meta = document.querySelector('meta[name="theme-color"]');
  const isNight = () => root.dataset.theme === 'night';

  /* ---------------- theme ---------------- */
  const btn = document.getElementById('themeBtn');
  function paintBtn() {
    if (!btn) return;
    const n = isNight();
    btn.setAttribute('aria-pressed', n);
    btn.setAttribute('aria-label', n ? 'Switch to day mode' : 'Switch to night mode');
    btn.title = n ? 'Day mode' : 'Night mode';
  }
  function apply(t) {
    root.dataset.theme = t;
    if (meta) meta.content = t === 'night' ? '#0B0E14' : '#F3EFE6';
    paintBtn(); sky.flip(t);
  }
  /* the new theme opens as a circle from the switch (View Transitions); without that, it simply swaps.
     Nothing is left half-way if the animation can't run. */
  function setTheme(t, save, from) {
    if (save) { try { localStorage.setItem(KEY, t); } catch (e) {} }
    if (reduce || !document.startViewTransition || document.hidden) { apply(t); return; }
    const x = from ? from.x : innerWidth - 60, y = from ? from.y : 40;
    root.style.setProperty('--vt-x', x + 'px'); root.style.setProperty('--vt-y', y + 'px');
    root.style.setProperty('--vt-r', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
    try { document.startViewTransition(() => apply(t)); } catch (e) { apply(t); }
    // if the page can't draw a frame (background tab, busy device), switch anyway
    setTimeout(() => { if (root.dataset.theme !== t) apply(t); }, 250);
  }
  if (btn) btn.addEventListener('click', e => {
    const r = btn.getBoundingClientRect();
    setTheme(isNight() ? 'day' : 'night', true, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  });
  if (meta && isNight()) meta.content = '#0B0E14';
  paintBtn();

  /* ---------------- the canvas ---------------- */
  const cv = document.createElement('canvas');
  cv.className = 'amb-canvas'; cv.setAttribute('aria-hidden', 'true');
  document.body.prepend(cv);
  const cx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1, docH = 0;
  const mouse = { x: -999, y: -999 };
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* workflows scattered down the page, mostly in the side margins */
  const PAR = .55; // parallax: the graph moves a little slower than the page
  let flows = [];
  function buildFlows() {
    flows = [];
    const span = docH * PAR + H, gap = 340;
    let side = Math.random() < .5 ? 0 : 1;
    for (let y = 120; y < span; y += gap * rnd(.8, 1.25)) {
      const n = 3 + Math.floor(Math.random() * 3), size = 30, step = rnd(64, 84);
      const w = (n - 1) * step + size, wide = W > 1320;
      const margin = wide ? (W - 1180) / 2 : W * .22;
      let x0 = side ? W - Math.max(margin, w + 30) + rnd(-10, 20) : rnd(14, Math.max(20, margin - w - 10));
      if (!wide) x0 = side ? W - w - rnd(8, 40) : rnd(8, 40);
      const nodes = [];
      let yy = y;
      for (let i = 0; i < n; i++) { nodes.push({ x: x0 + i * step, y: yy, trig: i === 0, lit: 0, ok: 0 }); yy += rnd(-26, 26); }
      // sometimes a branch drops below the main line
      if (n > 3 && Math.random() < .45) { const b = nodes[1]; nodes.push({ x: b.x + step, y: b.y + rnd(56, 74), branch: 1, from: 1, lit: 0, ok: 0 }); }
      flows.push({ nodes, run: -1, t: 0, next: rnd(1.5, 9) });
      side = 1 - side;
    }
  }

  /* sky */
  const sky = {
    mode: isNight() ? 'night' : 'day', fade: 1, dim: 1, dimTo: 1,
    stars: [], birds: [], nextBirds: rnd(2, 6), meteor: null, nextMeteor: rnd(4, 10), clouds: [],
    flip(t) { if (t !== this.mode) { this.mode = t; this.fade = 0; this.birds = []; this.meteor = null; this.nextBirds = rnd(1, 3); this.nextMeteor = rnd(2, 6); } },
  };
  function buildSky() {
    sky.stars = Array.from({ length: Math.round(Math.min(220, W * H / 7000)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: rnd(.4, 1.5), a: rnd(.25, .9), s: rnd(.6, 2.2), p: Math.random() * 6.3 }));
    sky.clouds = Array.from({ length: 2 }, (_, i) => ({ x: rnd(0, W), y: rnd(110, H * .3), s: rnd(.8, 1.2), v: rnd(4, 8) * (i % 2 ? 1 : .7) }));
  }

  function resize() {
    DPR = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    docH = document.documentElement.scrollHeight;
    buildFlows(); buildSky();
  }

  /* drawing helpers */
  function rr(x, y, w, h, r, left) {
    cx.beginPath();
    const rl = left ? h / 2 : r;
    cx.moveTo(x + rl, y); cx.lineTo(x + w - r, y); cx.quadraticCurveTo(x + w, y, x + w, y + r);
    cx.lineTo(x + w, y + h - r); cx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    cx.lineTo(x + rl, y + h); cx.quadraticCurveTo(x, y + h, x, y + h - rl); cx.lineTo(x, y + rl); cx.quadraticCurveTo(x, y, x + rl, y);
    cx.closePath();
  }
  const wire = (a, b) => { const x1 = a.x + 30, y1 = a.y + 15, x2 = b.x, y2 = b.y + 15, m = Math.max(18, (x2 - x1) / 2); return [x1, y1, x1 + m, y1, x2 - m, y2, x2, y2]; };
  const bez = (p, t) => { const u = 1 - t; return [u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6], u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7]]; };

  function drawFlows(dt, sy) {
    const night = isNight();
    const base = night ? '236,232,221' : '21,20,15', run = '255,79,26', ok = night ? '61,220,151' : '15,122,85';
    // full strength only where the page has empty margins; behind text on smaller screens it stays a whisper
    const roomy = W > 1320, baseA = (night ? .085 : .075) * (roomy ? 1 : .55);
    for (const f of flows) {
      const top = f.nodes[0].y - sy * PAR;
      const visible = top > -200 && top < H + 200;
      // keep each workflow "running" now and then
      f.next -= dt;
      if (f.run < 0 && f.next <= 0 && visible) { f.run = 0; f.t = 0; }
      if (f.run >= 0) {
        f.t += dt * (reduce ? 0 : 1.6);
        if (f.t >= 1) { f.nodes[f.run].ok = 1; f.run++; f.t = 0; if (f.run >= f.nodes.length) { f.run = -1; f.next = rnd(4, 12); } }
      }
      if (!visible) continue;
      const P = n => ({ x: n.x, y: n.y - sy * PAR, n });
      // wires
      f.nodes.forEach((n, i) => {
        if (i === 0) return;
        const a = P(n.branch ? f.nodes[n.from] : f.nodes[i - 1]), b = P(n);
        const p = wire(a, b), d = Math.hypot(mouse.x - (a.x + b.x) / 2, mouse.y - (a.y + b.y) / 2), near = Math.max(0, 1 - d / 220);
        cx.strokeStyle = `rgba(${base},${baseA + near * .12 + (n.ok ? .05 : 0)})`; cx.lineWidth = 1.2;
        cx.beginPath(); cx.moveTo(p[0], p[1]); cx.bezierCurveTo(p[2], p[3], p[4], p[5], p[6], p[7]); cx.stroke();
        // the item travelling along the wire
        if (f.run === i) {
          const [px, py] = bez(p, Math.min(1, f.t * 1.25));
          const g = cx.createRadialGradient(px, py, 0, px, py, 9);
          g.addColorStop(0, `rgba(${run},.55)`); g.addColorStop(1, `rgba(${run},0)`);
          cx.fillStyle = g; cx.beginPath(); cx.arc(px, py, 9, 0, 6.29); cx.fill();
          cx.fillStyle = `rgba(${run},.8)`; cx.beginPath(); cx.arc(px, py, 1.8, 0, 6.29); cx.fill();
        }
      });
      // nodes
      f.nodes.forEach((n, i) => {
        const p = P(n), d = Math.hypot(mouse.x - (p.x + 15), mouse.y - (p.y + 15)), near = Math.max(0, 1 - d / 180);
        const running = f.run === i && f.t > .55;
        n.lit += ((running ? 1 : 0) - n.lit) * Math.min(1, dt * 8);
        if (f.run < 0 && n.ok) n.ok = Math.max(0, n.ok - dt * .35);
        rr(p.x, p.y, 30, 30, 6, n.trig);
        cx.fillStyle = night ? `rgba(20,25,34,${.35 + near * .3})` : `rgba(251,249,244,${.35 + near * .4})`;
        cx.fill();
        const okA = n.ok * .5, litA = n.lit * .55;
        cx.strokeStyle = litA > .02 ? `rgba(${run},${baseA + litA})` : okA > .02 ? `rgba(${ok},${baseA + okA})` : `rgba(${base},${baseA * 1.4 + near * .2})`;
        cx.lineWidth = 1.3; cx.stroke();
        // a tiny glyph inside: lightning on triggers, a dot grid elsewhere
        cx.fillStyle = `rgba(${base},${baseA * 1.3 + near * .25})`;
        if (n.trig) { cx.beginPath(); cx.moveTo(p.x + 17, p.y + 8); cx.lineTo(p.x + 11, p.y + 16); cx.lineTo(p.x + 15, p.y + 16); cx.lineTo(p.x + 13, p.y + 22); cx.lineTo(p.x + 19, p.y + 14); cx.lineTo(p.x + 15, p.y + 14); cx.closePath(); cx.fill(); }
        else { for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) { cx.beginPath(); cx.arc(p.x + 12 + a * 6, p.y + 12 + b * 6, 1.3, 0, 6.29); cx.fill(); } }
        if (okA > .05) { cx.strokeStyle = `rgba(${ok},${okA + .1})`; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(p.x + 22, p.y + 25); cx.lineTo(p.x + 24.5, p.y + 27.5); cx.lineTo(p.x + 29, p.y + 22); cx.stroke(); }
      });
    }
  }

  function drawBird(b, t) {
    const flap = Math.sin(t * b.f + b.p) * 4 * b.s, s = b.s;
    cx.beginPath();
    cx.moveTo(b.x - 9 * s, b.y - flap);
    cx.quadraticCurveTo(b.x - 4 * s, b.y - 3 * s - flap * .3, b.x, b.y);
    cx.quadraticCurveTo(b.x + 4 * s, b.y - 3 * s - flap * .3, b.x + 9 * s, b.y - flap);
    cx.stroke();
  }

  /* the sun or moon steps back when text or a card scrolls over it, so it never fights the content */
  const BUSY = 'p,h1,h2,h3,h4,li,a,button,img,video,input,textarea,label,.case,.rev,.svc,.step,.card,.trust-card,.sol,.chip,.tag,[data-r]';
  // phones have no empty margins: a smaller, softer sun or moon tucked into the corner under the nav
  function sunSpot() { return W < 700 ? { x: W - 44, y: 104, k: .62, soft: .55 } : { x: W - Math.min(130, W * .14), y: 118, k: 1, soft: 1 }; }
  setInterval(() => {
    if (document.hidden) return;
    const c = sunSpot(); let busy = false;
    for (const [dx, dy] of [[0, 0], [-30, 0], [30, 0], [0, -30], [0, 30]]) {
      const el = document.elementFromPoint(c.x + dx, c.y + dy);
      if (el && el.closest && el.closest(BUSY) && !el.closest('.nav')) { busy = true; break; }
    }
    sky.dimTo = busy ? .22 : 1;
  }, 300);
  function drawSky(dt, t) {
    sky.fade = Math.min(1, sky.fade + dt * 1.2);
    sky.dim += (sky.dimTo - sky.dim) * Math.min(1, dt * 3);
    const spot = sunSpot(), night = sky.mode === 'night', a = sky.fade * sky.dim * spot.soft;
    const { x: sx, y: syy } = spot;
    cx.save(); cx.translate(sx, syy); cx.scale(spot.k, spot.k); cx.translate(-sx, -syy);
    if (!night) {
      // sun: a warm glow, slow rays
      const g = cx.createRadialGradient(sx, syy, 0, sx, syy, 260);
      g.addColorStop(0, `rgba(255,196,92,${.42 * a})`); g.addColorStop(.18, `rgba(255,170,70,${.18 * a})`); g.addColorStop(1, 'rgba(255,170,70,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(sx, syy, 260, 0, 6.29); cx.fill();
      cx.save(); cx.translate(sx, syy); cx.rotate(t * .03);
      cx.strokeStyle = `rgba(255,170,60,${.16 * a})`; cx.lineWidth = 2; cx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { cx.rotate(Math.PI / 6); cx.beginPath(); cx.moveTo(0, 38 + Math.sin(t * 1.2 + i) * 3); cx.lineTo(0, 52 + Math.sin(t * 1.2 + i) * 4); cx.stroke(); }
      cx.restore();
      const c = cx.createRadialGradient(sx - 7, syy - 7, 4, sx, syy, 28);
      c.addColorStop(0, `rgba(255,236,170,${.85 * a})`); c.addColorStop(1, `rgba(255,178,64,${.7 * a})`);
      cx.fillStyle = c; cx.beginPath(); cx.arc(sx, syy, 28, 0, 6.29); cx.fill();
      cx.restore();
      // soft clouds drifting
      for (const k of sky.clouds) {
        k.x += k.v * dt * (reduce ? 0 : 1); if (k.x - 140 * k.s > W) k.x = -160 * k.s;
        // one soft shape, not separate blobs
        cx.save(); cx.filter = 'blur(10px)'; cx.fillStyle = `rgba(255,255,255,${.28 * sky.fade})`; cx.beginPath();
        [[0, 0, 24], [26, -10, 28], [54, 0, 22], [28, 8, 24]].forEach(([dx, dy, r]) => { cx.moveTo(k.x + dx * k.s + r * k.s, k.y + dy * k.s); cx.arc(k.x + dx * k.s, k.y + dy * k.s, r * k.s, 0, 6.29); });
        cx.fill(); cx.restore();
      }
      // birds: a small flock now and then
      sky.nextBirds -= dt;
      if (sky.nextBirds <= 0 && !reduce) {
        const n = 2 + Math.floor(Math.random() * 4), y = rnd(70, H * .42), v = rnd(38, 60), dir = Math.random() < .7 ? 1 : -1, s = rnd(.8, 1.2);
        for (let i = 0; i < n; i++) sky.birds.push({ x: dir > 0 ? -30 - i * rnd(18, 30) : W + 30 + i * rnd(18, 30), y: y + rnd(-18, 18) + (i % 2) * 10, v: v * rnd(.92, 1.08) * dir, s: s * rnd(.75, 1), f: rnd(7, 10), p: Math.random() * 6, dy: rnd(-3, 3) });
        sky.nextBirds = rnd(9, 18);
      }
      cx.strokeStyle = `rgba(40,36,28,${.38 * sky.fade})`; cx.lineWidth = 1.4; cx.lineCap = 'round';
      sky.birds = sky.birds.filter(b => { b.x += b.v * dt; b.y += Math.sin(t * .8 + b.p) * .15 + b.dy * dt; drawBird(b, t); return b.x > -80 && b.x < W + 80; });
    } else {
      cx.restore();
      // stars
      for (const s of sky.stars) {
        const tw = reduce ? s.a : s.a * (.55 + .45 * Math.sin(t * s.s + s.p));
        cx.fillStyle = `rgba(236,232,221,${tw * sky.fade})`; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.29); cx.fill();
        if (s.r > 1.3) { cx.strokeStyle = `rgba(236,232,221,${tw * sky.fade * .35})`; cx.lineWidth = .6; cx.beginPath(); cx.moveTo(s.x - 4, s.y); cx.lineTo(s.x + 4, s.y); cx.moveTo(s.x, s.y - 4); cx.lineTo(s.x, s.y + 4); cx.stroke(); }
      }
      // moon: a crescent first, then its glow slipped in behind (so the dark side stays sky)
      cx.save(); cx.translate(sx, syy); cx.scale(spot.k, spot.k); cx.translate(-sx, -syy);
      cx.save();
      cx.beginPath(); cx.arc(sx, syy, 26, 0, 6.29); cx.clip();
      const m = cx.createRadialGradient(sx - 10, syy - 10, 2, sx, syy, 32);
      m.addColorStop(0, `rgba(250,246,232,${.95 * a})`); m.addColorStop(1, `rgba(214,210,196,${.9 * a})`);
      cx.fillStyle = m; cx.fillRect(sx - 32, syy - 32, 64, 64);
      cx.fillStyle = `rgba(160,156,145,${.28 * a})`;
      [[-8, -6, 5], [6, 8, 4], [-2, 12, 3], [9, -10, 2.5]].forEach(([dx, dy, r]) => { cx.beginPath(); cx.arc(sx + dx, syy + dy, r, 0, 6.29); cx.fill(); });
      cx.globalCompositeOperation = 'destination-out';
      cx.fillStyle = '#000'; cx.beginPath(); cx.arc(sx + 14, syy - 8, 24, 0, 6.29); cx.fill();
      cx.restore();
      cx.save(); cx.globalCompositeOperation = 'destination-over';
      const g = cx.createRadialGradient(sx, syy, 8, sx, syy, 170);
      g.addColorStop(0, `rgba(220,226,255,${.14 * a})`); g.addColorStop(1, 'rgba(220,226,255,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(sx, syy, 170, 0, 6.29); cx.fill();
      cx.restore(); cx.restore();
      // the occasional meteor
      sky.nextMeteor -= dt;
      if (!sky.meteor && sky.nextMeteor <= 0 && !reduce) { sky.meteor = { x: rnd(W * .35, W * 1.05), y: rnd(-20, H * .25), vx: -rnd(520, 760), vy: rnd(220, 330), life: 0, max: rnd(.8, 1.3) }; sky.nextMeteor = rnd(7, 18); }
      const me = sky.meteor;
      if (me) {
        me.life += dt; me.x += me.vx * dt; me.y += me.vy * dt;
        const k = me.life / me.max, alpha = Math.sin(Math.min(1, k) * Math.PI) * sky.fade, len = 120;
        const nx = me.vx / Math.hypot(me.vx, me.vy), ny = me.vy / Math.hypot(me.vx, me.vy);
        const tail = cx.createLinearGradient(me.x, me.y, me.x - nx * len, me.y - ny * len);
        tail.addColorStop(0, `rgba(255,248,230,${alpha})`); tail.addColorStop(1, 'rgba(255,248,230,0)');
        cx.strokeStyle = tail; cx.lineWidth = 1.8; cx.lineCap = 'round';
        cx.beginPath(); cx.moveTo(me.x, me.y); cx.lineTo(me.x - nx * len, me.y - ny * len); cx.stroke();
        cx.fillStyle = `rgba(255,252,240,${alpha})`; cx.beginPath(); cx.arc(me.x, me.y, 1.6, 0, 6.29); cx.fill();
        if (me.life >= me.max) sky.meteor = null;
      }
    }
  }

  let last = performance.now(), running = true, raf = 0;
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    cx.clearRect(0, 0, W, H);
    const t = now / 1000;
    drawSky(dt, t);
    drawFlows(dt, scrollY);
    if (running) raf = requestAnimationFrame(frame);
  }
  resize();
  addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
  // the page grows as images and the work grid load: keep the graph covering it
  if (window.ResizeObserver) new ResizeObserver(() => { const h = document.documentElement.scrollHeight; if (Math.abs(h - docH) > 300) { docH = h; buildFlows(); } }).observe(document.body);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf); });
  if (reduce) { running = false; frame(performance.now()); addEventListener('scroll', () => requestAnimationFrame(frame), { passive: true }); }
  else raf = requestAnimationFrame(frame);

  /* ---------------- cursor ---------------- */
  if (!fine) return;
  root.classList.add('has-cursor');
  const dot = document.createElement('div'), ring = document.createElement('div');
  dot.className = 'cur-dot'; ring.className = 'cur-ring'; ring.innerHTML = '<span></span>';
  document.body.append(ring, dot);
  const label = ring.firstChild;
  let rx = -100, ry = -100, tx = -100, ty = -100, shown = false;
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY; mouse.x = tx; mouse.y = ty;
    dot.style.transform = `translate(${tx}px,${ty}px)`;
    if (!shown) { shown = true; rx = tx; ry = ty; root.classList.add('cur-on'); }
  }, { passive: true });
  document.addEventListener('pointerleave', () => { root.classList.remove('cur-on'); shown = false; mouse.x = mouse.y = -999; });
  const HOT = 'a,button,[role="button"],[role="tab"],summary,label,select,.case,[data-ex]';
  document.addEventListener('pointerover', e => {
    const el = e.target.closest && e.target.closest(HOT + ',input,textarea,[contenteditable="true"]');
    const typing = el && el.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]),textarea,[contenteditable="true"]');
    root.classList.toggle('cur-text', !!typing);
    root.classList.toggle('cur-hot', !!el && !typing);
    const card = el && el.closest('.case');
    const txt = card ? (card.dataset.video ? 'Watch' : 'Open') : '';
    label.textContent = txt; root.classList.toggle('cur-label', !!txt);
  });
  addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    root.classList.add('cur-down');
    const p = document.createElement('i'); p.className = 'cur-ping'; p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px';
    document.body.appendChild(p); setTimeout(() => p.remove(), 650);
  });
  addEventListener('pointerup', () => root.classList.remove('cur-down'));
  (function follow() {
    rx += (tx - rx) * .2; ry += (ty - ry) * .2;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(follow);
  })();
})();
