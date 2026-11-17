/* Live chatbot demo, opened in a window on top of the portfolio (no new tab). */
(() => {
  const ov = document.getElementById('demoOv'), frame = document.getElementById('demoFrame');
  let mode = '', lastFocus = null;
  function open(m) {
    lastFocus = document.activeElement;
    if (m !== mode) { mode = m; frame.src = 'chatbot-demo/?embed=1' + (m === 'voice' ? '&mode=voice' : ''); }
    ov.hidden = false;
    requestAnimationFrame(() => ov.classList.add('on'));
    document.documentElement.classList.add('demo-open');
    document.getElementById('demoOvX').focus();
  }
  function close() {
    ov.classList.remove('on');
    document.documentElement.classList.remove('demo-open');
    // unload so a live voice call or animation stops; next open starts fresh
    frame.src = 'about:blank'; mode = '';
    setTimeout(() => { ov.hidden = true; }, 250);
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-demo]');
    if (!t) return;
    e.preventDefault();
    open(t.dataset.demo);
  });
  document.getElementById('demoOvX').addEventListener('click', close);
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !ov.hidden) close(); });
  addEventListener('message', e => { if (e.origin === location.origin && e.data === 'demo:close' && !ov.hidden) close(); });
})();

/* Booking: Calendly opens in a window on the site (no new tab).
   Calendly takes a few seconds to load, so while it does, a calendar "builds itself" in its place:
   the header types in, the day grid pops in, then open days light up as if availability is being checked.
   The real Calendly fades in the moment it says it's ready. It also starts loading early (when the
   visitor nears the contact section or hovers the button), so often there's barely a wait at all. */
(() => {
  const CAL_HOST = /(^|\.)calendly\.com$/i;
  const isCal = href => { try { return CAL_HOST.test(new URL(href, location.href).hostname); } catch (e) { return false; } };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MIN_SHOW = reduce ? 0 : 1300;  // let the build animation finish its first beat even when Calendly is already loaded
  const MAX_WAIT = 15000;              // never leave the visitor on the stand-in: show Calendly after this regardless
  const MSGS = ['Building your calendar…', "Checking Simeon's availability…", 'Finding open slots…', 'Matching your time zone…', 'Almost ready…'];

  let ov, frame, loadedUrl = '', ready = false, heightSeen = false, openedAt = 0, lastFocus = null, timers = [], scheduled = false;

  function embedUrl(href) {
    const u = new URL(href, location.href);
    const p = u.searchParams;
    p.set('embed_domain', location.hostname); p.set('embed_type', 'Inline');
    p.set('hide_gdpr_banner', '1');
    // brand colours (Calendly applies these on paid plans; ignored otherwise)
    p.set('background_color', 'ffffff'); p.set('text_color', '15140f'); p.set('primary_color', 'ff4f1a');
    return u.toString();
  }

  function build() {
    if (ov) return;
    const now = new Date(), y = now.getFullYear(), m = now.getMonth(), today = now.getDate();
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    const month = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    let cells = '', i = 0, k = 0;
    ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].forEach((d, n) => { cells += `<span class="cb-wd" style="--i:${n}">${d}</span>`; });
    for (let b = 0; b < first; b++) cells += `<span class="cb-d blank" style="--i:${i++}"></span>`;
    for (let d = 1; d <= days; d++) {
      const wd = (first + d - 1) % 7, open = d > today && wd > 0 && wd < 6;
      const cls = d < today ? 'past' : d === today ? 'today' : open ? 'open' : '';
      cells += `<span class="cb-d ${cls}" style="--i:${i++}${open ? `;--k:${k++}` : ''}">${d}</span>`;
    }
    const photo = (window.SITE && window.SITE.photo) || 'assets/simeon.jpg';
    const name = (window.SITE && window.SITE.name) || 'Simeon Onabowale';
    ov = document.createElement('div');
    ov.className = 'cal-ov';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Book a call');
    ov.innerHTML = `
      <div class="cal-card">
        <div class="cal-bar"><span class="cal-ic" aria-hidden="true">📅</span><b>Book a call</b><span class="cal-sub">Free 30-minute audit · pick a time that suits you</span>
          <button class="cal-x" type="button" aria-label="Close booking">×</button></div>
        <div class="cal-stage">
          <div class="cb" aria-hidden="true">
            <div class="cb-side">
              <img class="cb-me" src="${photo}" alt="">
              <div class="cb-host">${name.replace(/[<>&"]/g, '')}</div>
              <h4 class="cb-title">Free 30-minute automation audit</h4>
              <div class="cb-meta"><span><i>◷</i>30 min</span><span><i>▣</i>Video call, link sent on booking</span></div>
            </div>
            <div class="cb-main">
              <p class="cb-h">Select a date &amp; time</p>
              <div class="cb-month"><b>${month}</b><span><i>‹</i><i>›</i></span></div>
              <div class="cb-grid">${cells}</div>
              <div class="cb-status"><span class="cb-spin"></span><span class="cb-msg">${MSGS[0]}</span></div>
              <div class="cb-bar"><i></i></div>
            </div>
          </div>
          <p class="sr" role="status" aria-live="polite">Loading the booking calendar…</p>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('.cal-x').addEventListener('click', close);
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
  }

  // load Calendly in the (still invisible) window, so it's warm by the time it's needed
  function warm(href) {
    if (!href || !isCal(href)) return;
    build();
    const url = embedUrl(href);
    if (url === loadedUrl) return;
    loadedUrl = url; ready = false; heightSeen = false;
    if (frame) frame.remove();
    frame = document.createElement('iframe');
    frame.title = 'Book a call with Simeon (Calendly)';
    frame.setAttribute('allow', 'payment');
    // backup in case Calendly's messages never arrive
    frame.addEventListener('load', () => { setTimeout(markReady, 4000); });
    frame.src = url;
    ov.querySelector('.cal-stage').appendChild(frame);
  }

  function markReady() {
    if (ready) return;
    ready = true;
    if (ov && ov.classList.contains('on')) reveal();
  }
  function reveal() {
    const wait = Math.max(0, MIN_SHOW - (performance.now() - openedAt));
    timers.push(setTimeout(() => {
      const bar = ov.querySelector('.cb-bar i'); if (bar) bar.style.transform = 'scaleX(1)';
      const msg = ov.querySelector('.cb-msg'); if (msg) msg.textContent = 'Ready';
      timers.push(setTimeout(() => {
        ov.classList.add('ready');
        const st = ov.querySelector('[role=status]'); if (st) st.textContent = 'Booking calendar loaded.';
      }, reduce ? 0 : 220));
    }, wait));
  }

  function open(href) {
    warm(href);
    lastFocus = document.activeElement;
    openedAt = performance.now();
    // restart the build animation each time it's shown
    ov.classList.remove('ready');
    const cb = ov.querySelector('.cb'); const fresh = cb.cloneNode(true); cb.replaceWith(fresh);
    const msg = fresh.querySelector('.cb-msg'), bar = fresh.querySelector('.cb-bar i');
    let n = 0, p = .08;
    timers.forEach(clearTimeout); timers = [];
    const tick = () => {
      if (ov.classList.contains('ready')) return;
      n = Math.min(n + 1, MSGS.length - 1); p = Math.min(.92, p + (1 - p) * .35);
      msg.style.opacity = 0;
      timers.push(setTimeout(() => { msg.textContent = MSGS[n]; msg.style.opacity = 1; }, 200));
      bar.style.transform = `scaleX(${p})`;
      timers.push(setTimeout(tick, 1800));
    };
    timers.push(setTimeout(() => { bar.style.transform = `scaleX(${p})`; }, 50));
    timers.push(setTimeout(tick, 1100));
    timers.push(setTimeout(markReady, MAX_WAIT));
    ov.classList.add('on');
    document.documentElement.classList.add('demo-open');
    ov.querySelector('.cal-x').focus();
    if (ready) reveal();
  }

  function close() {
    if (!ov || !ov.classList.contains('on')) return;
    ov.classList.remove('on');
    document.documentElement.classList.remove('demo-open');
    timers.forEach(clearTimeout); timers = [];
    // after a booking, start fresh next time; otherwise keep Calendly loaded so reopening is instant
    if (scheduled) { scheduled = false; const url = loadedUrl; loadedUrl = ''; setTimeout(() => warm(url), 400); }
    if (lastFocus) lastFocus.focus();
  }

  // Calendly tells the parent page what's happening inside the iframe
  addEventListener('message', e => {
    if (!/(^|\.)calendly\.com$/i.test((() => { try { return new URL(e.origin).hostname; } catch (x) { return ''; } })())) return;
    const ev = e.data && e.data.event;
    // "viewed" means Calendly has drawn the booking page; page_height arrives a little earlier, so it only counts after a beat
    if (ev === 'calendly.event_type_viewed' || ev === 'calendly.profile_page_viewed') markReady();
    else if (ev === 'calendly.page_height' && !heightSeen) { heightSeen = true; setTimeout(markReady, 2000); }
    if (ev === 'calendly.event_scheduled') scheduled = true;
  });

  const bookLink = e => { const a = e.target.closest && e.target.closest('a[href]'); return a && isCal(a.href) ? a : null; };
  document.addEventListener('click', e => {
    const a = bookLink(e);
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(a.href);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  // start loading on the first sign of intent: hover, touch or keyboard focus on a booking link
  ['pointerover', 'touchstart', 'focusin'].forEach(t => document.addEventListener(t, e => { const a = bookLink(e); if (a) warm(a.href); }, { passive: true }));
  // …or when the visitor gets close to the contact section
  const contact = document.getElementById('contact');
  if (contact && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      if (!es.some(x => x.isIntersecting)) return;
      io.disconnect();
      const a = [...document.querySelectorAll('a[href]')].find(x => isCal(x.href) && !x.hidden);
      if (a) (window.requestIdleCallback || setTimeout)(() => warm(a.href));
    }, { rootMargin: '900px 0px' });
    io.observe(contact);
  }
})();

/* Work: play the recording only while it's on screen */
(() => {
  const v = document.querySelector('.case-video'); if (!v) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: .35 }).observe(v);
})();
