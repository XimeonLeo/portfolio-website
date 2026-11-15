/* Footer "runs itself." — a glowing pen tip writes each letter's outline, the phrase lights up
   with a sweep of light, then it fades back to black and starts again. Pure SVG + one rAF loop. */
(() => {
  const host = document.querySelector('.giant'); if (!host) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const words = [{ t: 'runs', it: false }, { t: ' ', it: false }, { t: 'itself.', it: true }];
  const mk = (tag, attrs = {}, parent) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); if (parent) parent.appendChild(el); return el; };

  function build() {
    const svg = mk('svg', { class: 'gs', role: 'presentation', 'aria-hidden': 'true' });
    svg.innerHTML = `<defs>
      <filter id="gsGlow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="5" result="b1"/><feGaussianBlur stdDeviation="14" in="SourceGraphic" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="gsHot" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="a"/><feGaussianBlur stdDeviation="10" in="SourceGraphic" result="c"/><feMerge><feMergeNode in="c"/><feMergeNode in="a"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <linearGradient id="gsFillA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6EA"/><stop offset="1" stop-color="#CFC6B4"/></linearGradient>
      <linearGradient id="gsFillB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB27A"/><stop offset=".55" stop-color="#FF5A1F"/><stop offset="1" stop-color="#C2340A"/></linearGradient>
      <linearGradient id="gsSweep" gradientUnits="userSpaceOnUse" x1="-400" y1="0" x2="-100" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>`;
    host.textContent = ''; host.appendChild(svg);
    const FS = 200, base = mk('text', { class: 'gs-base', x: 0, y: FS, 'font-size': FS }, svg);
    // measure each character using one full text line
    words.forEach(w => { const s = mk('tspan', w.it ? { class: 'it' } : {}, base); s.textContent = w.t; });
    const full = base.textContent, chars = [];
    for (let i = 0; i < full.length; i++) if (full[i] !== ' ') chars.push({ ch: full[i], x: base.getStartPositionOfChar(i).x, it: i >= full.indexOf('itself') });
    const bb = base.getBBox(), pad = 30;
    svg.setAttribute('viewBox', `${bb.x - pad} ${bb.y - pad} ${bb.width + pad * 2} ${bb.height + pad * 2}`);
    const gFill = mk('g', { class: 'gs-fill' }, svg), gSweep = mk('g', { class: 'gs-sweep' }, svg), gStroke = mk('g', { class: 'gs-stroke', filter: 'url(#gsGlow)' }, svg), gHead = mk('g', { class: 'gs-head', filter: 'url(#gsHot)' }, svg);
    const L = 1800; // about the longest glyph outline at this size
    const letters = chars.map(c => {
      const at = { x: c.x, y: FS, 'font-size': FS, class: c.it ? 'it' : '' };
      const fill = mk('text', { ...at, fill: c.it ? 'url(#gsFillB)' : 'url(#gsFillA)' }, gFill);
      const sweep = mk('text', { ...at, fill: 'url(#gsSweep)' }, gSweep);
      const stroke = mk('text', { ...at, class: (c.it ? 'it ' : '') + 'st ' + (c.it ? 'b' : 'a'), 'stroke-dasharray': `${L} ${L * 2}`, 'stroke-dashoffset': L }, gStroke);
      const head = mk('text', { ...at, class: (c.it ? 'it ' : '') + 'hd', 'stroke-dasharray': `90 ${L * 2}`, 'stroke-dashoffset': 90 }, gHead);
      [fill, sweep, stroke, head].forEach(t => { t.textContent = c.ch; });
      return { fill, stroke, head };
    });
    return { svg, letters, gFill, gSweep, gStroke, gHead, L, sweepGrad: svg.querySelector('#gsSweep'), x0: bb.x, w: bb.width };
  }

  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  function start() {
    const S = build(), n = S.letters.length;
    const STEP = .42, DRAW = .85, T0 = .3;
    const writeEnd = T0 + (n - 1) * STEP + DRAW;            // ≈ 4.6 s
    const LIT = writeEnd + .15, SWEEP0 = LIT + .2, SWEEP1 = SWEEP0 + 1.6, OUT0 = SWEEP1 + .6, OUT1 = OUT0 + 1.1, T = OUT1 + .9;
    if (reduce) { S.gFill.style.opacity = .55; S.gStroke.style.opacity = 0; S.gHead.style.opacity = 0; return; }
    let visible = false, t0 = performance.now(), raf = 0;
    function frame(now) {
      const t = ((now - t0) / 1000) % T;
      S.letters.forEach((l, i) => {
        const p = clamp((t - (T0 + i * STEP)) / DRAW), e = ease(p);
        l.stroke.setAttribute('stroke-dashoffset', S.L * (1 - e));
        l.head.setAttribute('stroke-dashoffset', 90 - e * S.L);
        l.head.style.opacity = p > 0 && p < 1 ? Math.min(1, p * 8, (1 - p) * 6) : 0;
      });
      const lit = clamp((t - LIT) / .7), out = clamp((t - OUT0) / (OUT1 - OUT0));
      S.gFill.style.opacity = ease(lit) * (1 - out);
      S.gStroke.style.opacity = (t < LIT ? 1 : 1 - .55 * ease(lit)) * (1 - out);
      S.svg.style.setProperty('--bloom', (lit * (1 - out)).toFixed(3));
      const sw = clamp((t - SWEEP0) / (SWEEP1 - SWEEP0)), x = S.x0 - 400 + sw * (S.w + 800);
      S.sweepGrad.setAttribute('x1', x); S.sweepGrad.setAttribute('x2', x + 300);
      S.gSweep.style.opacity = sw > 0 && sw < 1 ? .9 * (1 - out) : 0;
      raf = visible ? requestAnimationFrame(frame) : 0;
    }
    new IntersectionObserver(es => {
      visible = es[0].isIntersecting;
      if (visible && !raf) { t0 = performance.now(); raf = requestAnimationFrame(frame); }
    }, { threshold: .15 }).observe(host);
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
})();
