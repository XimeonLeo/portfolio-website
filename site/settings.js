/* Site settings: defaults live here; the owner's saved changes come from /api/settings.
   Loaded in <head> so saved colours apply before the page paints. */
(function () {
  var DEFAULTS = {
    name: 'Simeon Onabowale',
    initials: 'SO',
    role: 'AI automation engineer',
    accent: '#FF4F1A',
    paper: '#F3EFE6',
    ink: '#15140F',
    night: '#11110E',
    showAvail: true,
    avail: 'Taking on 2 new builds this month',
    heroTitle: 'The future is\na handshake.',
    heroSub: 'Where human vision meets AI power.',
    heroLede: "I'm Simeon. I build AI agents, chatbots, n8n workflows and GoHighLevel systems that take the repetitive work off your team and make sure no lead slips through. You bring the vision. The machines do the busywork.",
    heroFor: 'For coaches, consultants, medical centres, law offices & real estate teams',
    whatsapp: '2348110117004',
    email: 'simeono.automation@gmail.com',
    upwork: 'https://www.upwork.com/freelancers/~012e9a6098279f78fc',
    booking: 'https://calendly.com/ximeonleo/meet-with-d-xlntinnovator-simeon',
    hidden: []
  };
  /* sections the owner can switch off (id → label) */
  var SECTIONS = { story: 'Before and after', leaks: 'Where the hours leak', replay: 'Live builds', demo: 'Try a demo', work: 'Work', about: 'About me', reviews: 'Reviews', services: 'Services', process: 'How I work', integrations: 'Integrations', faq: 'FAQ' };
  var KEY = 'site-settings-v1';
  var root = document.documentElement;
  var isAdmin = root.hasAttribute('data-admin');
  var orig = {}; // default hrefs, so link rewrites can be repeated

  function merge(o) { var s = {}, k; for (k in DEFAULTS) s[k] = DEFAULTS[k]; if (o) for (k in o) if (k in DEFAULTS && o[k] != null) s[k] = o[k]; return s; }
  function rgb(h) { h = String(h).replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mix(a, b, t) { a = rgb(a); b = rgb(b); return '#' + a.map(function (v, i) { return ('0' + Math.round(v + (b[i] - v) * t).toString(16)).slice(-2); }).join(''); }
  function lum(h) { var c = rgb(h); return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255; }
  function same(a, b) { return String(a).toLowerCase() === String(b).toLowerCase(); }
  function setVars(vars) { for (var k in vars) vars[k] == null ? root.style.removeProperty(k) : root.style.setProperty(k, vars[k]); }

  function applyColours(s) {
    setVars(same(s.accent, DEFAULTS.accent) ? { '--signal': null, '--signal-ink': null } : { '--signal': s.accent, '--signal-ink': mix(s.accent, '#000000', .22) });
    if (same(s.paper, DEFAULTS.paper) && same(s.ink, DEFAULTS.ink)) setVars({ '--paper': null, '--paper-2': null, '--card': null, '--line': null, '--line-2': null, '--ink': null, '--ink-2': null, '--mute': null });
    else {
      var dark = lum(s.paper) < .4;
      setVars({ '--paper': s.paper, '--paper-2': mix(s.paper, s.ink, .06), '--card': dark ? mix(s.paper, '#ffffff', .06) : mix(s.paper, '#ffffff', .55),
        '--line': mix(s.paper, s.ink, .14), '--line-2': mix(s.paper, s.ink, .22), '--ink': s.ink, '--ink-2': mix(s.ink, s.paper, .2), '--mute': mix(s.ink, s.paper, .42) });
    }
    setVars(same(s.night, DEFAULTS.night) ? { '--night': null, '--night-2': null, '--night-line': null } : { '--night': s.night, '--night-2': mix(s.night, '#ffffff', .05), '--night-line': mix(s.night, '#ffffff', .13) });
  }

  function text(el, v) {
    var lines = String(v).split('\n'); el.textContent = '';
    lines.forEach(function (l, i) { if (i) el.appendChild(document.createElement('br')); el.appendChild(document.createTextNode(l)); });
  }
  function prettyPhone(d) { return '+' + d.replace(/^(\d{3})(\d{3})(\d{3})(\d+)$/, '$1 $2 $3 $4'); }
  function link(sel, key, href) {
    [].forEach.call(document.querySelectorAll(sel), function (a) { a.setAttribute('data-l', key); });
    [].forEach.call(document.querySelectorAll('[data-l="' + key + '"]'), function (a) { a.setAttribute('href', href); });
  }

  function applyContent(s) {
    if (isAdmin || !document.body) return;
    var vals = { name: s.name, initials: s.initials, role: s.role, avail: s.avail, heroTitle: s.heroTitle, heroSub: s.heroSub, heroLede: s.heroLede, heroFor: s.heroFor,
      email: s.email, waText: 'Fastest reply · ' + prettyPhone(s.whatsapp) };
    [].forEach.call(document.querySelectorAll('[data-s]'), function (el) { var v = vals[el.getAttribute('data-s')]; if (v != null) text(el, v); });
    var badge = document.getElementById('availBadge'); if (badge) badge.style.display = s.showAvail && s.avail ? '' : 'none';
    link('a[href^="https://wa.me/"]', 'wa', 'https://wa.me/' + s.whatsapp);
    link('a[href^="mailto:"]', 'mail', 'mailto:' + s.email);
    link('a[href*="upwork.com/"]', 'up', s.upwork);
    var book = document.getElementById('bookChan'); if (book) { book.hidden = !s.booking; if (s.booking) book.href = s.booking; }
    for (var id in SECTIONS) {
      var off = s.hidden.indexOf(id) > -1, sec = document.getElementById(id);
      if (sec) sec.style.display = off ? 'none' : '';
      [].forEach.call(document.querySelectorAll('a[href="#' + id + '"]'), function (a) { a.style.display = off ? 'none' : ''; });
    }
    if (!orig.title) orig.title = document.title;
    document.title = orig.title.split(DEFAULTS.name).join(s.name);
    var tc = document.querySelector('meta[name="theme-color"]'); if (tc) tc.content = s.paper;
  }

  function apply(o) {
    var s = merge(o); window.SITE = s;
    if (!isAdmin) applyColours(s);
    applyContent(s);
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  }

  window.SITE_DEFAULTS = DEFAULTS; window.SITE_SECTIONS = SECTIONS; window.SITE = merge(null);
  var cached = null; try { cached = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  var preview = /[?&]preview=1/.test(location.search) && window.parent !== window;
  if (cached && !preview) apply(cached);

  function ready(fn) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn(); }
  ready(function () {
    applyContent(window.SITE);
    /* the secret door: tap the logo mark five times quickly */
    var mark = document.querySelector('.brand .mark'), taps = [];
    if (mark) mark.addEventListener('click', function () {
      var t = Date.now(); taps = taps.filter(function (x) { return t - x < 3000; }); taps.push(t);
      if (taps.length >= 5) location.href = '/door/';
    });
  });

  if (isAdmin) return;
  if (preview) {
    /* live preview inside the door page: only our own parent window may send settings */
    window.addEventListener('message', function (e) {
      if (e.origin !== location.origin || e.source !== window.parent || !e.data || e.data.type !== 'site-preview') return;
      ready(function () { apply(e.data.settings); });
    });
    try { window.parent.postMessage({ type: 'site-preview-ready' }, location.origin); } catch (e) {}
    return;
  }
  if (location.protocol === 'file:') return;
  fetch('/api/settings', { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : null; })
    .then(function (o) {
      if (!o || typeof o !== 'object') return;
      try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
      ready(function () { apply(o); });
    }).catch(function () {});
})();
