/* Scroll-driven sections: chaos → workflow story, n8n/Make/Zapier editors, 3D integrations globe. */
(() => {
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const lerp = (a, b, t) => a + (b - a) * t;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- logos ---------- */
const ICONS = window.ICONS || {};
const CUSTOM = {
  ghl: { t: 'GoHighLevel', c: '#188BF6', txt: 'HL' }, openai: { t: 'OpenAI', c: '#111111', txt: 'AI' },
  twilio: { t: 'Twilio', c: '#F22F46', txt: '⁘' }, code: { t: 'Code', c: '#FF6D5A', txt: '{ }' },
  if: { t: 'If', c: '#3E9C5B', txt: '⇄' }, router: { t: 'Router', c: '#6D00CC', txt: '⑂' },
  schedule: { t: 'Schedule', c: '#7A5AF8', txt: '⏱' }, formatter: { t: 'Formatter', c: '#FF4F00', txt: 'Aa' },
  filter: { t: 'Filter', c: '#FF4F00', txt: '⧩' }, search: { t: 'Search', c: '#555', txt: '⌕' },
  web: { t: 'HTTP', c: '#2D7FF9', txt: '⇅' }, pdf: { t: 'PDF', c: '#D93025', txt: 'PDF' }, word: { t: 'Word', c: '#2B579A', txt: 'W' },
};
const meta = s => ICONS[s] || CUSTOM[s] || { t: s, c: '#666', txt: s.slice(0, 2).toUpperCase() };
const DARK = new Set(['notion', 'anthropic', 'typeform']);
// mode: 'brand' = brand-coloured mark, 'white' = white mark (for coloured tiles)
function logo(s, size = 24, mode = 'brand') {
  const m = meta(s);
  if (m.p) {
    const fill = mode === 'white' ? '#fff' : m.c;
    return `<svg class="lg" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><path fill="${fill}" d="${m.p}"/></svg>`;
  }
  const fs = Math.round(size * (m.txt.length > 2 ? .36 : .5));
  return `<span class="lg lg-txt" style="width:${size}px;height:${size}px;font-size:${fs}px;background:${mode === 'white' ? 'transparent' : m.c};color:#fff">${m.txt}</span>`;
}
window.logo = logo;

/* ---------- scroll engine ---------- */
const scrubbers = [];
const progressOf = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
let ticking = false;
const tick = () => { ticking = false; scrubbers.forEach(f => f()); };
const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } };
addEventListener('scroll', req, { passive: true });
addEventListener('resize', () => { scrubbers.forEach(f => f(true)); }, { passive: true });

/* top progress bar */
const bar = document.createElement('div'); bar.className = 'scroll-bar'; document.body.appendChild(bar);
scrubbers.push(() => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; });

/* hero parallax */
const heroImg = $('.hero-img'), heroCopy = $('.hero-copy');
scrubbers.push(() => {
  if (!heroImg || scrollY > innerHeight * 1.2) return;
  const y = scrollY;
  heroImg.style.transform = `translateY(${y * .25}px) scale(${1 + y * .00015})`;
  heroCopy.style.transform = `translateY(${y * .12}px)`; heroCopy.style.opacity = 1 - clamp(y / (innerHeight * .9)) * .8;
});

/* ======================================================================
   1. STORY — scattered work flies into an organised n8n workflow
   ====================================================================== */
(() => {
  const sec = $('#story'); if (!sec) return;
  const stage = $('#storyStage'), nodesEl = $('#storyNodes'), chaosEl = $('#chaos'), wires = $('#storyWires');
  const NODES = [
    { ic: 'gmail', n: 'New message or file', t: 'Trigger', trig: 1 },
    { ic: 'claude', n: 'Read and sort', t: 'AI agent' },
    { ic: 'if', n: 'Needs a person?', t: 'If' },
    { ic: 'ghl', n: 'Update the CRM', t: 'GoHighLevel' },
    { ic: 'googlesheets', n: 'Log it', t: 'Append row' },
    { ic: 'whatsapp', n: 'Reply & notify', t: 'Send message' },
  ];
  const CARDS = [
    { ic: 'gmail', b: 'Re: can we sign Friday?', s: 'unread · 2 days', to: 0, x: 2, y: 4, r: -7 },
    { ic: 'whatsapp', b: 'Is Thursday 2pm free?', s: 'WhatsApp · 9 new', to: 0, x: 26, y: 0, r: 5 },
    { ic: 'googledrive', b: 'Binder_345916.pdf', s: '213 pages to retype', to: 1, x: 52, y: 6, r: -4, dk: 1 },
    { ic: 'facebook', b: 'New lead from your ad', s: '2 days, no reply', to: 0, x: 77, y: 1, r: 6 },
    { note: 1, b: 'Chase the smoke cert!!', s: 'sticky note', to: 2, x: 84, y: 36, r: -9 },
    { note: 1, b: 'Who replies to this one?', s: 'sticky note', to: 2, x: 0, y: 40, r: 8, dk: 1 },
    { ic: 'twilio', b: '3 missed calls', s: 'voicemail full', to: 5, x: 12, y: 74, r: -5 },
    { ic: 'googlesheets', b: 'leads_v7_FINAL.xlsx', s: 'out of date again', to: 4, x: 35, y: 84, r: 7, dk: 1 },
    { ic: 'ghl', b: 'Contact stuck in "New"', s: 'for 14 days', to: 3, x: 59, y: 78, r: -6 },
    { ic: 'googledocs', b: 'Agreement unsigned', s: 'sent? not sure', to: 3, x: 80, y: 68, r: 4 },
    { ic: 'gmail', b: 'Invoice overdue (again)', s: 'unread · 5 days', to: 4, x: 30, y: 42, r: 3 },
    { ic: 'googlecalendar', b: 'Two calls at 2pm', s: 'calendar clash', to: 5, x: 58, y: 44, r: -3, dk: 1 },
  ];
  const counts = NODES.map((_, i) => CARDS.filter(c => c.to <= i).length);
  nodesEl.innerHTML = NODES.map((n, i) => `<div class="snode ${n.trig ? 'trigger' : ''}" data-i="${i}">
      <div class="sn-face">${logo(n.ic, 34)}<span class="sn-cnt">${counts[i]} items</span><span class="sn-ck">✓</span></div>
      <div class="sn-lbl"><b>${esc(n.n)}</b><small>${esc(n.t)}</small></div></div>`).join('');
  chaosEl.innerHTML = CARDS.map((c, i) => `<div class="cc ${c.note ? 'cc-note' : ''} ${c.dk ? 'dk' : ''}" style="left:${c.x}%;top:${c.y}%;--r:${c.r}deg;--i:${i}">
      <div class="cc-in">${c.note ? '<span class="pin"></span>' : logo(c.ic, 22)}<span><b>${esc(c.b)}</b><small>${esc(c.s)}</small></span><i class="cc-dot"></i></div></div>`).join('');
  const nodeEls = $$('.snode', nodesEl), cardEls = $$('.cc', chaosEl), caps = $('#storyCap'), steps = $$('#storySteps li');
  let geo = null;
  const measure = () => {
    const sr = stage.getBoundingClientRect();
    const faces = nodeEls.map(n => { const r = $('.sn-face', n).getBoundingClientRect(); return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2, w: r.width, h: r.height }; });
    cardEls.forEach((c, i) => {
      c.style.left = CARDS[i].x + '%'; c.style.top = CARDS[i].y + '%';
      const maxL = stage.clientWidth - c.offsetWidth - 4, maxT = stage.clientHeight - c.offsetHeight - 4;
      if (c.offsetLeft > maxL) c.style.left = Math.max(0, maxL) + 'px';
      if (c.offsetTop > maxT) c.style.top = Math.max(0, maxT) + 'px';
    });
    const homes = cardEls.map(c => ({ x: c.offsetLeft + c.offsetWidth / 2, y: c.offsetTop + c.offsetHeight / 2 }));
    wires.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
    wires.innerHTML = faces.slice(1).map((b, i) => {
      const a = faces[i], vert = Math.abs(b.y - a.y) > Math.abs(b.x - a.x);
      const d = vert ? `M${a.x} ${a.y}L${b.x} ${b.y}` : `M${a.x} ${a.y}C${(a.x + b.x) / 2} ${a.y} ${(a.x + b.x) / 2} ${b.y} ${b.x} ${b.y}`;
      return `<path class="w-base" d="${d}"/><path class="w-flow" d="${d}"/>`;
    }).join('');
    $$('path', wires).forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = p.classList.contains('w-base') ? `${L}` : ''; p.dataset.len = L; });
    geo = { faces, homes };
  };
  const CAPS = ['Binders to retype, WhatsApps to answer, missed calls, sticky notes. All of it by hand, all week.',
    'I map every step of the job and turn each one into a node.',
    'Now it runs on its own: read, sorted, logged and answered, while you get on with your day.'];
  let lastPhase = -1;
  const draw = force => {
    if (force || !geo) measure();
    const p = reduce ? 1 : progressOf(sec);
    const { faces, homes } = geo;
    cardEls.forEach((c, i) => {
      const m = ease(clamp((p - .16 - i * .012) / .3)), t = faces[CARDS[i].to], h = homes[i];
      c.style.transform = `translate(${(t.x - h.x) * m}px,${(t.y - h.y) * m}px) rotate(${CARDS[i].r * (1 - m)}deg) scale(${1 - .75 * m})`;
      c.style.opacity = m > .8 ? 1 - (m - .8) / .2 : 1;
      c.classList.toggle('moving', m > 0 && m < 1);
    });
    nodeEls.forEach((n, i) => {
      const a = ease(clamp((p - .3 - i * .03) / .14));
      n.style.opacity = a; n.style.transform = `scale(${.6 + .4 * a})`;
      n.classList.toggle('done', p > .68 + i * .035);
    });
    const basePaths = $$('.w-base', wires), flowPaths = $$('.w-flow', wires);
    basePaths.forEach((pa, i) => { const L = +pa.dataset.len, d = clamp((p - .44 - i * .03) / .1); pa.style.strokeDashoffset = L * (1 - d); });
    flowPaths.forEach((pa, i) => pa.classList.toggle('on', p > .68 + i * .035));
    const phase = p < .3 ? 0 : p < .66 ? 1 : 2;
    sec.classList.toggle('run', phase === 2);
    sec.classList.toggle('done-all', p > .9);
    if (phase !== lastPhase) { lastPhase = phase; caps.style.opacity = 0; setTimeout(() => { caps.textContent = CAPS[phase]; caps.style.opacity = 1; }, 180); steps.forEach((s, i) => s.classList.toggle('on', i === phase)); }
  };
  scrubbers.push(draw);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => draw(true));
})();

/* ======================================================================
   2. EDITORS — n8n, Make.com and Zapier, executing as you scroll
   ====================================================================== */
const ED = {
  n8n: { name: 'n8n', logo: 'n8n', note: 'n8n replays are from live client builds. Names and personal details are replaced; everything else is as it ran.', examples: [
    { id: 'closing', name: 'Closing packet from a title binder', run: '41.8 s', nodes: [
      { ic: 'googledrive', n: 'New binder in Inbox', t: 'Google Drive Trigger', trig: 1, x: 40, y: 170, d: 'Fires when a title binder PDF lands in the office\'s Inbox folder.', o: { file: 'Binder - 345916.pdf', pages: 213, scanned_pages: 24 } },
      { ic: 'claude', n: 'Read the binder', t: 'Claude · structured JSON', x: 200, y: 170, d: 'Claude reads Schedule A, the B-I requirements and the judgment search and returns one JSON record.', o: { title_no: '345916', sellers: ['Seller One', 'Seller Two'], property: '206 Charing Way, Westfield' } },
      { ic: 'code', n: 'Validate fields', t: 'Code', x: 360, y: 170, d: 'Checks every field\'s shape and cross-checks sellers against the deed requirement.', o: { fields: 41, errors: 0, zip5: '07090' } },
      { ic: 'googlesheets', n: 'Review row', t: 'Google Sheets · Append', x: 520, y: 170, d: 'One row for staff to review. Nothing is drafted until a person approves.', o: { row: 14, status: 'Needs review' } },
      { ic: 'if', n: 'Approved?', t: 'If', x: 680, y: 170, d: 'Only approved rows continue. Re-approving re-runs into a fresh folder.', o: { approved: true } },
      { ic: 'googledocs', n: 'Fill templates', t: 'Docs + state PDFs', x: 840, y: 90, d: 'Deed, Affidavit, FIRPTA, POA, 1099-S plus the official GIT/REP-3 and RTF-1 forms, left editable.', o: { documents: 7, state_form_fields: 82 } },
      { ic: 'gmail', n: 'Flag for attorney', t: 'Gmail · Send', x: 840, y: 260, d: 'Rows that need a legal decision go to the attorney instead.', o: { sent: false, reason: 'approved path taken' } },
      { ic: 'googledrive', n: 'Save the packet', t: 'Google Drive · Upload', x: 1000, y: 90, d: 'One 14-page packet in a new, time-stamped matter folder.', o: { pages: 14, status: 'Generated' } },
    ], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5, 'true'], [4, 6, 'false'], [5, 7]], order: [0, 1, 2, 3, 4, 5, 7] },
    { id: 'tracker', name: 'Matter tracker that files itself', run: '12.3 s', nodes: [
      { ic: 'googledrive', n: 'File dropped', t: 'Google Drive Trigger', trig: 1, x: 40, y: 170, d: 'Staff drop any document into one folder.', o: { file: 'scan_0381.pdf' } },
      { ic: 'claude', n: 'What is this?', t: 'Claude · enum output', x: 210, y: 170, d: 'Picks the document type and matter from fixed lists, so it can\'t invent a value.', o: { type: 'Smoke/CO certificate', matter: '2 Windham Ct' } },
      { ic: 'code', n: 'Match matter', t: 'Code', x: 380, y: 170, d: 'House number + street key. Early files wait and file themselves later.', o: { matched: true } },
      { ic: 'googledrive', n: 'File + rename', t: 'Google Drive · Move', x: 550, y: 170, d: 'Moves the file into the matter folder with a clear name.', o: { name: '2 Windham Court - Smoke CO.pdf' } },
      { ic: 'googlesheets', n: 'Tick checklist', t: 'Google Sheets · Update', x: 720, y: 170, d: 'Marks the item Received with a link.', o: { still_missing: ['Survey', 'Mortgage commitment'] } },
      { ic: 'gmail', n: '08:00 digest', t: 'Gmail · Send', x: 890, y: 170, d: 'Every weekday the office gets one email listing what\'s missing on each file.', o: { open_matters: 3, missing_docs: 5 } },
    ], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]], order: [0, 1, 2, 3, 4, 5] },
    { id: 'reception', name: 'WhatsApp AI receptionist', run: '3.4 s', nodes: [
      { ic: 'whatsapp', n: 'New WhatsApp', t: 'WhatsApp Trigger', trig: 1, x: 40, y: 170, d: 'A patient messages the clinic\'s WhatsApp number.', o: { from: '+44 7•• ••• 214', text: 'Is Thursday 2pm free for a check-up?' } },
      { ic: 'claude', n: 'AI receptionist', t: 'AI Agent', x: 220, y: 170, d: 'Answers from the clinic\'s own services and rules, and decides the next action.', o: { intent: 'book', service: 'Check-up', day: 'Thursday' } },
      { ic: 'googlecalendar', n: 'Check slots', t: 'Google Calendar', x: 400, y: 90, d: 'Finds free slots that match the request.', o: { free: ['14:15', '15:30'] } },
      { ic: 'ghl', n: 'Create contact', t: 'GoHighLevel', x: 400, y: 260, d: 'Adds or updates the contact with tags and source.', o: { tags: ['whatsapp', 'check-up'] } },
      { ic: 'whatsapp', n: 'Reply', t: 'WhatsApp · Send', x: 600, y: 170, d: 'Replies with the options and books the chosen one.', o: { text: 'Yes! 14:15 or 15:30, which suits you?' } },
    ], edges: [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4]], order: [0, 1, 2, 3, 4] },
  ]},
  make: { name: 'Make.com', logo: 'make', note: 'Make.com scenarios shown as example builds of the kind I deliver.', examples: [
    { id: 'leads', name: 'Ad lead → AI score → CRM', run: '6 operations', nodes: [
      { ic: 'facebook', n: 'Facebook Lead Ads', t: 'Watch new leads', trig: 1, x: 60, y: 170, d: 'A new lead fills in the form on a Facebook ad.', o: { name: 'Jane D.', service: 'Teeth whitening', budget: '£300-500' } },
      { ic: 'openai', n: 'OpenAI', t: 'Score the lead', x: 250, y: 170, d: 'Scores intent and budget, and drafts a first reply.', o: { score: 86, tier: 'hot' } },
      { ic: 'router', n: 'Router', t: 'Hot or nurture', x: 440, y: 170, d: 'Hot leads go to sales right away; the rest go into nurture.', o: { route: 'hot' } },
      { ic: 'hubspot', n: 'HubSpot', t: 'Create a contact', x: 640, y: 80, d: 'Creates the contact with score and source.', o: { contact_id: 4180 } },
      { ic: 'gmail', n: 'Gmail', t: 'Alert the team', x: 840, y: 80, d: 'Emails the sales lead with the AI summary.', o: { to: 'sales@', subject: 'Hot lead: Jane D. (86)' } },
      { ic: 'googlesheets', n: 'Google Sheets', t: 'Add a row', x: 640, y: 260, d: 'Every lead is logged for reporting.', o: { row: 211 } },
    ], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5]], order: [0, 1, 2, 3, 4, 5] },
    { id: 'invoice', name: 'Stripe payment → books → receipt', run: '4 operations', nodes: [
      { ic: 'stripe', n: 'Stripe', t: 'Watch events', trig: 1, x: 60, y: 170, d: 'A payment succeeds in Stripe.', o: { amount: 499, currency: 'USD' } },
      { ic: 'quickbooks', n: 'QuickBooks', t: 'Create a sales receipt', x: 290, y: 170, d: 'Books the sale so the accounts are always current.', o: { receipt: 'SR-1043' } },
      { ic: 'airtable', n: 'Airtable', t: 'Update a record', x: 520, y: 170, d: 'Marks the client as paid and unlocks onboarding.', o: { status: 'Paid' } },
      { ic: 'gmail', n: 'Gmail', t: 'Send a receipt', x: 750, y: 170, d: 'Sends a branded receipt and next steps.', o: { sent: true } },
    ], edges: [[0, 1], [1, 2], [2, 3]], order: [0, 1, 2, 3] },
  ]},
  zap: { name: 'Zapier', logo: 'zapier', note: 'Zapier Zaps shown as example builds of the kind I deliver.', examples: [
    { id: 'booking', name: 'New booking → CRM → reminders', run: '5 steps', nodes: [
      { ic: 'calendly', n: 'Invitee Created', t: 'Calendly', trig: 1, d: 'Someone books a discovery call.', o: { name: 'Mark R.', when: 'Tue 10:00' } },
      { ic: 'formatter', n: 'Format the date', t: 'Formatter by Zapier', d: 'Converts the time into the client\'s time zone.', o: { local: 'Tue 11:00 WAT' } },
      { ic: 'hubspot', n: 'Create or update contact', t: 'HubSpot', d: 'Contact and deal created at the "Call booked" stage.', o: { deal_stage: 'Call booked' } },
      { ic: 'gmail', n: 'Send prep email', t: 'Gmail', d: 'Sends a short questionnaire before the call.', o: { sent: true } },
      { ic: 'googlesheets', n: 'Create spreadsheet row', t: 'Google Sheets', d: 'Logs the booking for the weekly report.', o: { row: 87 } },
    ]},
    { id: 'shop', name: 'Shopify order → team + customer', run: '4 steps', nodes: [
      { ic: 'shopify', n: 'New Paid Order', t: 'Shopify', trig: 1, d: 'An order is paid.', o: { order: '#1092', total: '£64.00' } },
      { ic: 'filter', n: 'Only continue if…', t: 'Filter by Zapier', d: 'Only orders over £50 or with a gift note.', o: { passed: true } },
      { ic: 'whatsapp', n: 'Send message', t: 'WhatsApp', d: 'Sends the customer a thank-you and tracking info.', o: { delivered: true } },
      { ic: 'notion', n: 'Create database item', t: 'Notion', d: 'Adds the order to the packing board.', o: { status: 'To pack' } },
    ]},
  ]},
};
(() => {
  const sec = $('#replay'); if (!sec) return;
  const toolsEl = $('#edTools'), exEl = $('#edExamples'), win = $('#edWindow'), chrome = $('#edChrome'), canvas = $('#edCanvas'), world = $('#edWorld'), panel = $('#edPanel'), foot = $('#edFoot'), prog = $('#edProg');
  let tool = 'n8n', ex = ED.n8n.examples[0], W = 1100, H = 360, lastR = null, picked = null;
  toolsEl.innerHTML = Object.entries(ED).map(([k, v]) => `<button role="tab" data-k="${k}">${logo(v.logo, 18)}<span>${v.name}</span></button>`).join('');
  toolsEl.onclick = e => { const b = e.target.closest('button'); if (b) { tool = b.dataset.k; ex = ED[tool].examples[0]; build(); } };
  exEl.onclick = e => { const b = e.target.closest('button'); if (b) { ex = ED[tool].examples.find(x => x.id === b.dataset.id); build(); } };
  world.onclick = e => { const n = e.target.closest('.en'); if (n) { picked = +n.dataset.i; showPanel(picked); } };

  function build() {
    picked = null; lastR = null;
    $$('button', toolsEl).forEach(b => b.classList.toggle('on', b.dataset.k === tool));
    exEl.innerHTML = ED[tool].examples.map(x => `<button data-id="${x.id}" class="${x === ex ? 'on' : ''}">${esc(x.name)}</button>`).join('');
    win.className = 'ed-window t-' + tool;
    $('#edNote').textContent = ED[tool].note;
    const nodes = ex.nodes;
    if (tool === 'zap') { nodes.forEach((n, i) => { n.x = 0; n.y = i * 104; }); W = 440; H = nodes.length * 104 - 28; }
    else { W = Math.max(...nodes.map(n => n.x)) + (tool === 'make' ? 150 : 170); H = 360; }
    const order = ex.order || nodes.map((_, i) => i);
    const edges = ex.edges || nodes.slice(1).map((_, i) => [i, i + 1]);
    ex._order = order; ex._edges = edges;
    if (tool === 'n8n') chrome.innerHTML = `<span class="c-crumb">${logo('n8n', 18)}<span>Personal /</span><b>${esc(ex.name)}</b></span><span class="c-mid"><b>Editor</b><span>Executions</span></span><span class="c-act">Active <i class="sw on"></i></span>`;
    else if (tool === 'make') chrome.innerHTML = `<span class="c-crumb">${logo('make', 18)}<b>${esc(ex.name)}</b></span><span class="c-mid"><span>Scenario</span><span>History</span></span><span class="c-act">ON <i class="sw on"></i></span>`;
    else chrome.innerHTML = `<span class="c-crumb">${logo('zapier', 18)}<b>${esc(ex.name)}</b></span><span class="c-mid"><span class="zp-pub">Published</span></span><span class="c-act"><span class="zp-btn">Publish</span></span>`;
    const np = i => { const n = nodes[i]; return tool === 'zap' ? { x: n.x + 220, y: n.y + 38 } : tool === 'make' ? { x: n.x + 42, y: n.y + 42 } : { x: n.x + 45, y: n.y + 45 }; };
    let svg = `<svg class="ed-wires" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><marker id="arr-${tool}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs>`;
    edges.forEach(([a, b, lab], k) => {
      const A = np(a), B = np(b); let d;
      if (tool === 'n8n') { const x1 = A.x + 45, x2 = B.x - 47, dx = Math.max(40, (x2 - x1) / 2); d = `M${x1} ${A.y}C${x1 + dx} ${A.y} ${x2 - dx} ${B.y} ${x2} ${B.y}`; }
      else if (tool === 'make') { const x1 = A.x + 48, x2 = B.x - 48; d = `M${x1} ${A.y}C${(x1 + x2) / 2} ${A.y} ${(x1 + x2) / 2} ${B.y} ${x2} ${B.y}`; }
      else { d = `M${A.x} ${A.y + 38}L${B.x} ${B.y - 38}`; }
      svg += `<path class="ew" data-k="${k}" d="${d}" ${tool === 'n8n' ? `marker-end="url(#arr-${tool})"` : ''}/><path class="ew-flow" data-k="${k}" d="${d}"/>`;
      if (lab) { const mx = (A.x + B.x) / 2 + 10, my = (A.y + B.y) / 2 - 8; svg += `<text class="ew-lab" x="${mx}" y="${my}">${lab}</text>`; }
      if (tool === 'zap') svg += `<g class="zp-plus" transform="translate(${A.x} ${(A.y + B.y) / 2})"><circle r="11"/><text y="4.5">+</text></g>`;
    });
    svg += '</svg>';
    world.style.width = W + 'px'; world.style.height = H + 'px';
    world.innerHTML = svg + nodes.map((n, i) => {
      const pos = `left:${n.x}px;top:${n.y}px`;
      if (tool === 'n8n') return `<button class="en n8 ${n.trig ? 'trig' : ''}" data-i="${i}" style="${pos}"><span class="n8-face">${logo(n.ic, 40)}${n.trig ? '<i class="bolt">⚡</i>' : ''}<i class="ck">✓</i></span><span class="n8-cnt">1 item</span><span class="n8-lbl"><b>${esc(n.n)}</b><small>${esc(n.t)}</small></span></button>`;
      if (tool === 'make') { const m = meta(n.ic); return `<button class="en mk" data-i="${i}" style="${pos};--c:${m.c}"><span class="mk-face">${logo(n.ic, 40, 'white')}${n.trig ? '<i class="clock">⏱</i>' : ''}<i class="ops">1</i></span><span class="mk-lbl"><b>${esc(n.n)}</b><small>${esc(n.t)}</small><em>${i + 1}</em></span></button>`; }
      return `<button class="en zp" data-i="${i}" style="${pos}"><span class="zp-ic">${logo(n.ic, 26)}</span><span class="zp-txt"><small>${i + 1}. ${n.trig ? 'Trigger' : 'Action'} · ${esc(n.t)}</small><b>${esc(n.n)}</b></span><i class="ck">✓</i></button>`;
    }).join('');
    fit(); scrub(true);
  }
  function fit() {
    const overlay = getComputedStyle(panel).position === 'absolute', ph = overlay ? panel.offsetHeight + 16 : 0;
    const cw = canvas.clientWidth - 28, ch = Math.max(60, canvas.clientHeight - ph - (tool === 'n8n' ? 70 : tool === 'make' ? 60 : 24));
    let s = Math.min(1, cw / W, ch / H);
    // small screens: keep it readable and let the "camera" follow the running step
    cam.follow = s < .55 && tool !== 'zap';
    if (cam.follow) s = Math.min(.8, ch / H);
    if (tool === 'zap' && s < .6) { cam.follow = true; s = Math.min(.85, cw / W); }
    cam.s = s;
    world.style.top = `calc(50% - ${ph / 2}px)`;
    applyCam();
  }
  const cam = { follow: false, s: 1, node: 0 };
  function applyCam() {
    let dx = 0, dy = 0;
    if (cam.follow) {
      const n = ex.nodes[cam.node] || ex.nodes[0];
      if (tool === 'zap') dy = -(n.y + 38 - H / 2) * cam.s;
      else dx = -(n.x + 45 - W / 2) * cam.s;
    }
    world.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${cam.s})`;
  }
  function showPanel(i) {
    const n = ex.nodes[i], ran = world.querySelector(`.en[data-i="${i}"]`)?.classList.contains('done');
    panel.innerHTML = `<div class="k">${ED[tool].name} · step ${ex._order.indexOf(i) + 1 || '–'} of ${ex._order.length}</div>
      <h4>${logo(n.ic, 20)} ${esc(n.n)}</h4><p>${esc(n.d)}</p>
      <div class="k">${ran ? 'Output' : 'Waiting to run'}</div><pre>${ran ? esc(JSON.stringify(n.o, null, 2)) : '// keep scrolling to run this step'}</pre>`;
    fit();
  }
  function scrub(force) {
    if (force === true) fit();
    const p = reduce ? 1 : progressOf(sec);
    prog.style.transform = `scaleX(${p})`;
    const N = ex._order.length, r = p < .08 ? -1 : p >= .88 ? N : Math.min(N - 1, Math.floor((p - .08) / .8 * N));
    if (r === lastR && force !== true) return; lastR = r;
    const doneSet = new Set(ex._order.slice(0, Math.max(0, r)));
    $$('.en', world).forEach(el => { const i = +el.dataset.i; el.classList.toggle('done', doneSet.has(i)); el.classList.toggle('running', ex._order[r] === i); });
    ex._edges.forEach(([a, b], k) => { const on = doneSet.has(a) && (doneSet.has(b) || ex._order[r] === b); $$(`[data-k="${k}"]`, world).forEach(p => p.classList.toggle('lit', on)); });
    const cur = r >= 0 && r < N ? ex._order[r] : r >= N ? ex._order[N - 1] : 0;
    cam.node = cur;
    if (picked === null || force === true) showPanel(cur); else { picked = null; applyCam(); }
    const status = r < 0 ? 'Waiting for trigger' : r >= N ? `✓ Succeeded · ${ex.run}` : `Running step ${r + 1} of ${N}: ${ex.nodes[cur].n}`;
    const btn = tool === 'n8n' ? '<span class="f-btn f-n8">▶ Execute workflow</span>' : tool === 'make' ? '<span class="f-btn f-mk">▶</span><span class="f-sub">Run once</span>' : '<span class="f-btn f-zp">Test run</span>';
    foot.innerHTML = `${btn}<span class="f-stat ${r >= N ? 'ok' : r >= 0 ? 'run' : ''}">${esc(status)}</span>`;
  }
  scrubbers.push(f => scrub(f));
  build();
})();

/* ======================================================================
   3. GLOBE — 3D world, client tools connected to Claude + n8n + Make
   ====================================================================== */
(() => {
  const stage = $('#globeStage'); if (!stage) return;
  const g3 = $('#globe3d'), cv = $('#globeCanvas'), chipsEl = $('#globeChips'), core = $('#globeCore'), ctx = cv.getContext('2d');
  const TOOLS = ['ghl', 'googlesheets', 'gmail', 'whatsapp', 'hubspot', 'googledrive', 'stripe', 'calendly', 'airtable', 'openai', 'shopify', 'zapier', 'googlecalendar', 'notion', 'twilio', 'zoho', 'quickbooks', 'typeform', 'facebook', 'mailchimp', 'instagram', 'googledocs'];
  const GA = Math.PI * (3 - Math.sqrt(5));
  const chips = TOOLS.map((s, i) => {
    const y = 1 - (i + .5) / TOOLS.length * 2, lat = Math.asin(y * .82), lon = i * GA;
    const el = document.createElement('div'); el.className = 'gchip';
    el.innerHTML = `<span class="gc-ic">${logo(s, 22)}</span><span class="gc-nm">${esc(meta(s).t)}</span>`;
    chipsEl.appendChild(el); return { s, lat, lon, el };
  });
  core.innerHTML = `<div class="core-ring"></div><div class="core-ring r2"></div><div class="core-disc">
    <span class="core-lg a">${logo('claude', 30)}</span><span class="core-lg b">${logo('n8n', 30)}</span><span class="core-lg c">${logo('make', 30)}</span></div>
    <div class="core-lbl">Claude · n8n · Make</div>`;
  let pts = [], size = 0, dpr = 1, R = 0, rot = 0, tilt = .32, mx = 0, my = 0, tmx = 0, tmy = 0, vis = false, t0 = performance.now();
  // land dots from world-atlas (falls back to an even dot sphere)
  const fib = n => Array.from({ length: n }, (_, i) => { const y = 1 - (i + .5) / n * 2; return [Math.asin(y), i * GA, .5]; });
  pts = fib(1400);
  const loadLand = async () => {
    try {
      for (let k = 0; k < 40 && !window.topojson; k++) await new Promise(r => setTimeout(r, 100));
      const topo = await (await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json')).json();
      const land = window.topojson.feature(topo, topo.objects.land);
      const W = 720, Hh = 360, oc = document.createElement('canvas'); oc.width = W; oc.height = Hh;
      const o = oc.getContext('2d'); o.fillStyle = '#000';
      const polys = land.features.flatMap(f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates);
      polys.forEach(poly => { o.beginPath(); poly.forEach(ring => ring.forEach(([lo, la], j) => { const x = (lo + 180) / 360 * W, y = (90 - la) / 180 * Hh; j ? o.lineTo(x, y) : o.moveTo(x, y); })); o.fill('evenodd'); });
      const data = o.getImageData(0, 0, W, Hh).data, out = [];
      for (let la = -56; la <= 78; la += 2.1) {
        const step = 2.1 / Math.max(.2, Math.cos(la * Math.PI / 180));
        for (let lo = -180; lo < 180; lo += step) {
          const x = Math.floor((lo + 180) / 360 * W), y = Math.floor((90 - la) / 180 * Hh);
          if (data[(y * W + x) * 4 + 3] > 100) out.push([la * Math.PI / 180, lo * Math.PI / 180, 1]);
        }
      }
      if (out.length > 500) pts = out;
    } catch (e) { /* keep fallback sphere */ }
  };
  loadLand();
  const resize = () => {
    const w = Math.min(stage.clientWidth - 32, 820, innerHeight * .88); size = Math.max(280, w); dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = size * dpr; cv.height = size * dpr; cv.style.width = cv.style.height = size + 'px';
    g3.style.width = g3.style.height = size + 'px'; R = size * .34;
    stage.classList.toggle('small', size < 520);
  };
  resize(); addEventListener('resize', resize);
  stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); tmx = (e.clientX - r.left) / r.width - .5; tmy = (e.clientY - r.top) / r.height - .5; });
  stage.addEventListener('pointerleave', () => { tmx = tmy = 0; });
  new IntersectionObserver(es => { vis = es[0].isIntersecting; if (vis) loop(); }, { rootMargin: '100px' }).observe(stage);
  const F = 3.0;
  const project = (lat, lon, lift = 1) => {
    let x = Math.cos(lat) * Math.sin(lon + rot), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon + rot);
    const t = tilt + my * .35, y2 = y * Math.cos(t) - z * Math.sin(t), z2 = y * Math.sin(t) + z * Math.cos(t);
    x *= lift; const yy = y2 * lift, zz = z2 * lift, k = F / (F - zz);
    return { x: size / 2 + x * R * k, y: size / 2 - yy * R * k, z: zz, k };
  };
  // scroll: globe rises and tilts toward the viewer ("coming out of the screen")
  let pop = 0;
  scrubbers.push(() => { const r = stage.getBoundingClientRect(); pop = ease(clamp((innerHeight - r.top) / (innerHeight * .9))); });
  function loop() {
    if (!vis) return;
    const now = performance.now(), dt = Math.min(50, now - t0); t0 = now;
    mx += (tmx - mx) * .06; my += (tmy - my) * .06;
    rot += (reduce ? 0 : .00022 * dt) + mx * .004;
    g3.style.transform = `perspective(1100px) translateZ(${lerp(-260, 60, pop)}px) rotateX(${lerp(38, 0, pop) - my * 10}deg) rotateY(${mx * 14}deg) scale(${lerp(.7, 1, pop)})`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, size, size);
    const c = size / 2, Rs = R * F / Math.sqrt(F * F - 1);
    // glow + body
    let g = ctx.createRadialGradient(c, c, Rs * .6, c, c, Rs * 1.45); g.addColorStop(0, 'rgba(255,79,26,.28)'); g.addColorStop(1, 'rgba(255,79,26,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, Rs * 1.45, 0, 7); ctx.fill();
    g = ctx.createRadialGradient(c - Rs * .35, c - Rs * .4, Rs * .1, c, c, Rs); g.addColorStop(0, '#2a2620'); g.addColorStop(.7, '#15130f'); g.addColorStop(1, '#0b0a08');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, Rs, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,140,90,.35)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(c, c, Rs, 0, 7); ctx.stroke();
    // dots
    for (let i = 0; i < pts.length; i++) {
      const [la, lo, w] = pts[i], p = project(la, lo);
      if (p.z < -.05) { ctx.fillStyle = 'rgba(236,232,221,.07)'; ctx.fillRect(p.x, p.y, 1.1, 1.1); continue; }
      const a = (.25 + .7 * p.z) * (w || .6); ctx.fillStyle = `rgba(236,232,221,${a})`;
      const s = 1.15 * p.k * (w ? 1.3 : 1); ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, 7); ctx.fill();
    }
    // connections to the core + chips
    const time = now / 1000;
    chips.forEach((ch, i) => {
      const p = project(ch.lat, ch.lon, 1.16), front = p.z > -.15;
      const cx = c, cy = c, mxp = (p.x + cx) / 2 + (p.x - cx) * .25, myp = (p.y + cy) / 2 + (p.y - cy) * .25 - 20;
      ctx.strokeStyle = front ? `rgba(255,120,70,${.2 + .45 * Math.max(0, p.z)})` : 'rgba(255,120,70,.06)'; ctx.lineWidth = front ? 1.2 : .8;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(mxp, myp, cx, cy); ctx.stroke();
      if (front && !reduce) { const u = (time * .45 + i * .137) % 1, bx = (1 - u) * (1 - u) * p.x + 2 * (1 - u) * u * mxp + u * u * cx, by = (1 - u) * (1 - u) * p.y + 2 * (1 - u) * u * myp + u * u * cy;
        ctx.fillStyle = '#FFB089'; ctx.beginPath(); ctx.arc(bx, by, 2.2, 0, 7); ctx.fill(); }
      const sc = .55 + .5 * (p.k - .75) / .5;
      ch.el.style.transform = `translate(${p.x}px,${p.y}px) translate(-50%,-50%) scale(${clamp(sc, .45, 1.25)})`;
      ch.el.style.opacity = front ? clamp(.35 + p.z * 1.2, .35, 1) : .14;
      ch.el.style.zIndex = Math.round(100 + p.z * 100);
      ch.el.classList.toggle('near', p.z > .55);
      ch.el.style.filter = front ? '' : 'blur(1.2px)';
    });
    core.style.transform = `translate(-50%,-50%) scale(${.9 + .06 * Math.sin(time * 1.6)})`;
    requestAnimationFrame(loop);
  }
})();
})();
