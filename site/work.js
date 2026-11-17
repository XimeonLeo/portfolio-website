/* Work section: applies the order, hidden items and new items saved in the door (/api/work).
   The built-in cards stay in index.html (good for Google); this script only reorders, hides and adds. */
(() => {
  const demoGrid = document.querySelector('#work .demo-grid'), clientGrid = document.querySelector('#work .work-grid:not(.demo-grid)');
  if (!demoGrid || !clientGrid) return;
  const GRIDS = { demo: demoGrid, client: clientGrid };
  const KEY = 'site-work-v1';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CASES = window.CASES || {}, SHOTS = window.SHOTS || {};

  // the cards that ship with the page, in their original order
  const builtIn = {}, defaultOrder = { demo: [], client: [] };
  for (const g of ['demo', 'client']) [...GRIDS[g].children].forEach(el => { if (el.matches('.case[data-case]')) { builtIn[el.dataset.case] = el; defaultOrder[g].push(el.dataset.case); } });
  window.WORK_BUILTIN = Object.keys(builtIn);
  const added = {};

  function cardFor(it) {
    const isVid = !!it.video, pill = it.badge === 'demo' ? '<span class="demo-pill">Demo build</span>' : it.badge === 'live' ? '<span class="live-pill">Live</span>' : '';
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'case added in' + (it.badge === 'demo' ? ' demo' : '') + (isVid ? ' has-video' : '');
    el.dataset.case = it.id;
    if (isVid) el.dataset.video = it.video;
    el.innerHTML = `<div class="case-img">${it.cover ? `<img src="${esc(it.cover)}" data-shot="${esc(it.cover)}" alt="${esc(it.alt || it.title)}" loading="lazy" decoding="async" width="1600" height="1000">` : `<span class="ph-cover">${esc(it.category || 'New build')}</span>`}${isVid ? '<span class="play" aria-hidden="true">▶</span>' : ''}</div>
      <div class="case-top"><span class="case-cat">${esc(it.category)}</span>${pill}</div>
      <h3>${esc(it.title)}</h3><p>${esc(it.desc)}</p>
      <div class="case-foot">${it.statBig ? `<div class="stat"><b>${esc(it.statBig)}</b>${esc(it.statLabel)}</div>` : '<div></div>'}<span class="open">${isVid ? 'Watch the run' : 'Case study'}</span></div>`;
    return el;
  }
  function register(it) {
    const tags = [...(it.badge === 'live' ? ['● Live'] : it.badge === 'demo' ? ['Demo build'] : []), ...(it.tags || [])];
    CASES[it.id] = {
      tags, title: it.title, sub: it.sub || '', demo: it.badge === 'demo', problem: it.problem || '', built: it.built || [],
      changed: it.changed || '', results: it.results || [], stack: it.stack || '',
      link: it.linkUrl ? [it.linkLabel || 'See it live', it.linkUrl] : null,
    };
    SHOTS[it.id] = (it.shots || []).map(s => [s[0], s[1] || '']);
  }
  const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];
  const word = (n, cap) => { const w = n <= 20 ? WORDS[n] : String(n); return cap ? w : w.toLowerCase(); };

  function apply(w) {
    w = w && typeof w === 'object' ? w : {};
    const items = w.items || {}, order = w.order || {}, hidden = new Set(w.hidden || []);
    // drop cards that were removed in the door
    for (const id of Object.keys(added)) if (!items[id]) { added[id].remove(); delete added[id]; delete CASES[id]; delete SHOTS[id]; }
    // build / rebuild added cards
    for (const it of Object.values(items)) {
      if (builtIn[it.id]) continue; // never let an added item replace a built-in one
      const el = cardFor(it);
      if (added[it.id]) added[it.id].replaceWith(el);
      added[it.id] = el; register(it);
    }
    const all = { ...builtIn, ...added }, placed = new Set();
    for (const g of ['demo', 'client']) {
      const ids = [...(order[g] || []).filter(id => all[id] && !placed.has(id))];
      ids.forEach(id => placed.add(id));
      // anything not in the saved order keeps its default place at the end of its own group
      defaultOrder[g].forEach(id => { if (!placed.has(id) && !(order.demo || []).includes(id) && !(order.client || []).includes(id)) { ids.push(id); placed.add(id); } });
      Object.values(items).forEach(it => { if (added[it.id] && !placed.has(it.id) && it.group === g) { ids.push(it.id); placed.add(it.id); } });
      ids.forEach(id => GRIDS[g].appendChild(all[id]));
    }
    for (const [id, el] of Object.entries(all)) { el.style.display = hidden.has(id) ? 'none' : ''; if (!el.classList.contains('in')) el.classList.add('in'); }
    // keep the "Eight builds … seven systems" wording true
    const vis = g => [...GRIDS[g].children].filter(el => el.matches('.case') && el.style.display !== 'none').length;
    document.querySelectorAll('[data-wc]').forEach(s => { s.textContent = word(vis(s.dataset.wc), s.hasAttribute('data-cap')); });
    // keep every row full whatever the order: the wide featured card takes a row of its own,
    // and the cards between features fill rows of 3 (ending in 2+2 or 2 wide cards when the count doesn't divide)
    for (const g of ['demo', 'client']) {
      const vis = [...GRIDS[g].children].filter(el => el.matches('.case') && el.style.display !== 'none');
      let seg = [];
      const flush = () => {
        const n = seg.length, r = n % 3;
        seg.forEach(el => { el.classList.remove('w2', 'w3', 'w4c'); el.classList.add('w2'); });
        const set = (els, c) => els.forEach(el => { el.classList.remove('w2'); el.classList.add(c); });
        if (r === 2) set(seg.slice(-2), 'w3');
        else if (r === 1 && n >= 4) set(seg.slice(-4), 'w3');
        else if (r === 1) set(seg.slice(-1), 'w4c');
        seg = [];
      };
      vis.forEach(el => { if (el.classList.contains('feature')) flush(); else seg.push(el); });
      flush();
    }
    // hide a whole group block when it has nothing to show
    const demoNote = document.querySelector('#work .demo-note');
    if (demoNote) demoNote.style.display = vis('demo') ? '' : 'none';
    demoGrid.style.display = vis('demo') ? '' : 'none';
    const head = document.querySelector('#work .demo-head'); if (head) head.style.display = vis('client') ? '' : 'none';
    clientGrid.style.display = vis('client') ? '' : 'none';
    clip();
  }
  window.applyWork = apply;

  /* Phones and tablets: show the first few cards of each group and a "See all" button for the rest.
     CSS only hides the extra cards below 1061px wide, so the desktop layout is unchanged. */
  const SHOW = { demo: 3, client: 3 };
  const LABEL = { demo: ['See all', 'demo builds'], client: ['See all', 'client systems'] };
  const more = {};
  for (const g of ['demo', 'client']) {
    const wrap = document.createElement('div');
    wrap.className = 'work-more';
    wrap.innerHTML = '<button type="button" class="btn ghost"></button>';
    GRIDS[g].after(wrap);
    GRIDS[g].classList.add('clip');
    wrap.firstChild.addEventListener('click', () => {
      const open = GRIDS[g].classList.toggle('clip') === false;
      clip();
      if (!open) GRIDS[g].scrollIntoView({ block: 'start', behavior: 'smooth' });
      else { const first = GRIDS[g].querySelector('.case.was-over'); if (first) first.focus({ preventScroll: true }); }
    });
    more[g] = wrap;
  }
  function clip() {
    for (const g of ['demo', 'client']) {
      if (!more[g]) continue;
      const vis = [...GRIDS[g].children].filter(el => el.matches('.case') && el.style.display !== 'none');
      vis.forEach((el, i) => { const over = i >= SHOW[g]; el.classList.toggle('over', over); el.classList.toggle('was-over', over); });
      const extra = vis.length - SHOW[g], btn = more[g].firstChild, collapsed = GRIDS[g].classList.contains('clip');
      more[g].hidden = extra <= 0 || GRIDS[g].style.display === 'none';
      btn.setAttribute('aria-expanded', String(!collapsed));
      btn.innerHTML = collapsed
        ? `${LABEL[g][0]} ${vis.length} ${LABEL[g][1]} <small>+${extra} more</small>`
        : 'Show fewer <span class="arr">↑</span>';
    }
  }
  clip();

  const preview = /[?&]preview=1/.test(location.search) && window.parent !== window;
  if (preview) {
    addEventListener('message', e => { if (e.origin === location.origin && e.source === window.parent && e.data && e.data.type === 'work-preview') apply(e.data.work); });
    return;
  }
  let cached = null; try { cached = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (cached) apply(cached);
  if (location.protocol === 'file:') return;
  fetch('/api/work', { headers: { Accept: 'application/json' } })
    .then(r => (r.ok && /json/.test(r.headers.get('content-type') || '') ? r.json() : null))
    .then(o => { if (!o || typeof o !== 'object') return; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} apply(o); })
    .catch(() => {});
})();
