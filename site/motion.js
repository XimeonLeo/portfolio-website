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
  ghl: { t: 'GoHighLevel', c: '#188BF6', svg: '<path d="M2 21V10.5H0L4 5l4 5.5H6V21z" fill="#FFBC00"/><path d="M10 21V7.5H8L12 2l4 5.5h-2V21z" fill="#188BF6"/><path d="M18 21V10.5h-2L20 5l4 5.5h-2V21z" fill="#37CA37"/>' },
  monday: { t: 'monday.com', c: '#6161FF', svg: '<path d="M3.1 18a2.4 2.4 0 0 1-2-3.7l4.2-6.7a2.4 2.4 0 1 1 4 2.5l-4.2 6.8A2.4 2.4 0 0 1 3.1 18z" fill="#FF3D57"/><path d="M11.2 18a2.4 2.4 0 0 1-2-3.7l4.2-6.7a2.4 2.4 0 1 1 4 2.5l-4.2 6.8a2.4 2.4 0 0 1-2 1.1z" fill="#FFCB00"/><circle cx="20.8" cy="15.5" r="2.5" fill="#00D647"/>' }, openai: { t: 'OpenAI', c: '#111111', txt: 'AI' },
  twilio: { t: 'Twilio', c: '#F22F46', txt: '⁘' }, code: { t: 'Code', c: '#FF6D5A', txt: '{ }' },
  if: { t: 'If', c: '#3E9C5B', txt: '⇄' }, router: { t: 'Router', c: '#6D00CC', txt: '⑂' },
  schedule: { t: 'Schedule', c: '#7A5AF8', txt: '⏱' }, formatter: { t: 'Formatter', c: '#FF4F00', txt: 'Aa' },
  filter: { t: 'Filter', c: '#FF4F00', txt: '⧩' }, search: { t: 'Search', c: '#555', txt: '⌕' },
  web: { t: 'HTTP', c: '#2D7FF9', txt: '⇅' }, pdf: { t: 'PDF', c: '#D93025', txt: 'PDF' }, word: { t: 'Word', c: '#2B579A', txt: 'W' },
};
const meta = s => ICONS[s] || CUSTOM[s] || { t: s, c: '#666', txt: s.slice(0, 2).toUpperCase() };
const DARK = new Set(['notion', 'anthropic', 'typeform', 'slack', 'openai']);
// mode: 'brand' = brand-coloured mark, 'white' = white mark (for coloured tiles)
function logo(s, size = 24, mode = 'brand') {
  const m = meta(s);
  if (m.svg) return `<svg class="lg" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true">${m.svg}</svg>`;
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
/* ---------- more example flows: online store, CRM & sales, bookings ---------- */
const EX_NOTE = 'Example build. The app previews show what each step produces, using made-up data.';
ED.n8n.examples.push(
  { id: 'shopOrder', name: 'Shopify order → packing board → alerts', run: '4.6 s', note: EX_NOTE, nodes: [
    { ic: 'shopify', n: 'New paid order', t: 'Shopify Trigger', trig: 1, x: 40, y: 170, d: 'A customer pays for an order in the store.', ui: { k: 'order', where: 'Orders', no: 'Order #1092', status: 'Paid', items: [['Linen shirt × 2', '$96.00'], ['Canvas tote × 1', '$28.00']], total: '$124.00' } },
    { ic: 'code', n: 'Check stock', t: 'Code', x: 200, y: 170, d: 'Works out what is left in stock once this order ships.', ui: { k: 'kv', rows: [['Linen shirt left', '3'], ['Reorder point', '5'], ['Order value', '$124.00']] } },
    { ic: 'notion', n: 'Add to packing board', t: 'Notion · Create page', x: 360, y: 170, d: 'The order lands on the team\'s packing board, ready to pick.', ui: { k: 'table', where: 'Packing board', cols: ['Order', 'Items', 'Status'], row: ['#1092', '3', ['To pack', '#E9A23B']] } },
    { ic: 'whatsapp', n: 'Confirm to customer', t: 'WhatsApp · Send', x: 520, y: 170, d: 'The customer gets a confirmation on WhatsApp straight away.', ui: { k: 'chat', side: 'out', where: 'Ada O.', text: 'Thanks Ada! Order #1092 is confirmed. We will message you the tracking link when it ships.' } },
    { ic: 'slack', n: 'Tell the team', t: 'Slack · Send message', x: 680, y: 170, d: 'The team channel hears about every new order.', ui: { k: 'chat', where: '#orders', from: 'Store bot', text: 'New order #1092 · $124.00 · 3 items. It is on the packing board.' } },
    { ic: 'if', n: 'Stock running low?', t: 'If', x: 840, y: 170, d: 'Only warns the owner when a product drops below its reorder point.', ui: { k: 'kv', rows: [['3 left, reorder at 5', 'Yes']] } },
    { ic: 'telegram', n: 'Warn the owner', t: 'Telegram · Send message', x: 1000, y: 170, d: 'A short Telegram message, so the owner can reorder before it sells out.', ui: { k: 'chat', where: 'Owner', text: 'Low stock: Linen shirt, 3 left after order #1092. Time to reorder.' } },
  ], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6, 'true']], order: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'ghlLead', name: 'GoHighLevel lead → AI qualify → pipeline', run: '5.2 s', note: EX_NOTE, nodes: [
    { ic: 'ghl', n: 'New contact', t: 'GoHighLevel Trigger', trig: 1, x: 40, y: 170, d: 'Someone fills in the form on the website and lands in the CRM.', ui: { k: 'kv', where: 'Contacts', rows: [['Name', 'Daniel Reyes'], ['Source', 'Website form'], ['Asked about', 'Kitchen remodel']] } },
    { ic: 'claude', n: 'Qualify the lead', t: 'Claude · structured JSON', x: 200, y: 170, d: 'Claude reads the enquiry and pulls out budget, timeline and fit.', ui: { k: 'kv', rows: [['Budget', '$25k – 40k'], ['Timeline', 'Within 2 months'], ['Fit', 'Strong']] } },
    { ic: 'code', n: 'Score by rules', t: 'Code', x: 360, y: 170, d: 'The score comes from rules in code, so it is the same every time.', ui: { k: 'kv', rows: [['Score', '88 / 100'], ['Why', 'Budget, timeline, in area']] } },
    { ic: 'ghl', n: 'Create opportunity', t: 'GoHighLevel', x: 520, y: 170, d: 'A deal is created in the right pipeline stage, with the value filled in.', ui: { k: 'deal', where: 'Sales pipeline', stages: ['New', 'Qualified', 'Booked'], stage: 'Qualified', name: 'Daniel Reyes', value: '$32,000' } },
    { ic: 'if', n: 'Hot lead?', t: 'If', x: 680, y: 170, d: 'Hot leads go to a person now. The rest go into nurture.', ui: { k: 'kv', rows: [['88 is 70 or more', 'Yes']] } },
    { ic: 'slack', n: 'Alert sales', t: 'Slack · Send message', x: 840, y: 90, d: 'Sales sees the lead, the score and the reason in one message.', ui: { k: 'chat', where: '#sales', from: 'Lead bot', text: 'Hot lead (88): Daniel Reyes, kitchen remodel, $25k – 40k, wants to start within 2 months.' } },
    { ic: 'whatsapp', n: 'Reply to the lead', t: 'WhatsApp · Send', x: 1000, y: 90, d: 'The lead hears back in seconds, while they are still thinking about it.', ui: { k: 'chat', side: 'out', where: 'Daniel Reyes', text: 'Hi Daniel, thanks for reaching out about your kitchen. Are you free for a 15-minute call tomorrow?' } },
    { ic: 'ghl', n: 'Add to nurture', t: 'GoHighLevel · Add to workflow', x: 840, y: 260, d: 'Cooler leads get a gentle follow-up sequence instead.', ui: { k: 'kv', rows: [['Workflow', '90-day nurture'], ['This run', 'Not taken']] } },
  ], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5, 'true'], [5, 6], [4, 7, 'false']], order: [0, 1, 2, 3, 4, 5, 6] });
ED.make.examples.push(
  { id: 'cart', name: 'Abandoned cart → WhatsApp → email', run: '6 operations', note: EX_NOTE, nodes: [
    { ic: 'shopify', n: 'Shopify', t: 'Watch abandoned checkouts', trig: 1, x: 60, y: 170, d: 'A shopper adds to the basket, then leaves without paying.', ui: { k: 'order', where: 'Checkouts', no: 'Checkout · Ada O.', status: 'Abandoned 1 h ago', tone: 'warn', items: [['Ceramic mug set × 1', '$42.00']], total: '$42.00' } },
    { ic: 'claude', n: 'Claude', t: 'Write a friendly nudge', x: 250, y: 170, d: 'Writes a short, personal message about what was left behind.', ui: { k: 'kv', rows: [['Tone', 'Friendly, no pressure'], ['Mentions', 'Mug set, free returns']] } },
    { ic: 'whatsapp', n: 'WhatsApp', t: 'Send a message', x: 440, y: 170, d: 'The nudge goes out on WhatsApp first, where it is most likely to be read.', ui: { k: 'chat', side: 'out', where: 'Ada O.', text: 'Hi Ada, you left the ceramic mug set in your basket. It is still there if you want it: shop.example/cart' } },
    { ic: 'router', n: 'Router', t: 'Bought within 24 hours?', x: 630, y: 170, d: 'If they bought, stop. If not, try one email.', ui: { k: 'kv', rows: [['Order placed', 'No'], ['Next', 'Email follow-up']] } },
    { ic: 'gmail', n: 'Gmail', t: 'Send a reminder', x: 820, y: 80, d: 'One polite email, then the flow stops. No pestering.', ui: { k: 'mail', to: 'ada@example.com', subject: 'Still thinking it over?', text: 'Your basket is saved. Here is what other customers say about the mug set.' } },
    { ic: 'googlesheets', n: 'Google Sheets', t: 'Log the result', x: 820, y: 260, d: 'Every cart is logged, so you can see what the flow wins back.', ui: { k: 'table', where: 'Cart recovery', cols: ['Customer', 'Cart', 'Step'], row: ['Ada O.', '$42.00', ['Email sent', '#2D7FF9']] } },
  ], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]], order: [0, 1, 2, 3, 4, 5] },
  { id: 'mondayWon', name: 'monday.com deal won → onboarding', run: '6 operations', note: EX_NOTE, nodes: [
    { ic: 'monday', n: 'monday.com', t: 'Watch status change', trig: 1, x: 60, y: 170, d: 'Someone on the team marks a deal as Won on the board.', ui: { k: 'table', where: 'Deals board', cols: ['Deal', 'Value', 'Status'], row: ['Parkside Physio', '$7,200', ['Won', '#00C875']] } },
    { ic: 'googledrive', n: 'Google Drive', t: 'Create client folder', x: 250, y: 170, d: 'A client folder is created from your template.', ui: { k: 'kv', where: 'Clients', rows: [['Folder', 'Parkside Physio'], ['Inside', 'Contract · Brief · Assets']] } },
    { ic: 'notion', n: 'Notion', t: 'Create client hub', x: 440, y: 170, d: 'The client gets a row in the hub, with an owner and a kickoff to book.', ui: { k: 'table', where: 'Client hub', cols: ['Client', 'Kickoff', 'Owner'], row: ['Parkside Physio', 'To book', ['Maya', '#8A5CF6']] } },
    { ic: 'gmail', n: 'Gmail', t: 'Send the welcome pack', x: 630, y: 170, d: 'The welcome email goes out with the onboarding form and a booking link.', ui: { k: 'mail', to: 'helen@parksidephysio.example', subject: 'Welcome aboard: next steps', text: 'Hi Helen, here is your onboarding form and a link to book the kickoff call.' } },
    { ic: 'slack', n: 'Slack', t: 'Post in #wins', x: 820, y: 80, d: 'The whole team sees the win, and that onboarding is already moving.', ui: { k: 'chat', where: '#wins', from: 'Deals bot', text: 'Parkside Physio just signed · $7,200. Folder, hub and welcome email are done.' } },
    { ic: 'telegram', n: 'Telegram', t: 'Tell the owner', x: 820, y: 260, d: 'The owner gets it on their phone, wherever they are.', ui: { k: 'chat', where: 'Owner', text: 'New client: Parkside Physio ($7,200). Onboarding has started.' } },
  ], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]], order: [0, 1, 2, 3, 4, 5] });
ED.zap.examples.push(
  { id: 'reorder', name: 'Low stock → reorder task → supplier', run: '5 steps', note: EX_NOTE, nodes: [
    { ic: 'shopify', n: 'Inventory Level Updated', t: 'Shopify', trig: 1, d: 'Stock changes after a sale.', ui: { k: 'kv', where: 'Inventory', rows: [['Linen shirt', '3 in stock'], ['Reorder point', '5']] } },
    { ic: 'filter', n: 'Only continue if…', t: 'Filter by Zapier', d: 'Carries on only when stock is below the reorder point.', ui: { k: 'kv', rows: [['3 is below 5', 'Continue']] } },
    { ic: 'monday', n: 'Create item', t: 'monday.com', d: 'A reorder task appears on the purchasing board.', ui: { k: 'table', where: 'Purchasing board', cols: ['Item', 'Qty', 'Status'], row: ['Linen shirt', '40', ['Order now', '#E2445C']] } },
    { ic: 'gmail', n: 'Send email', t: 'Gmail', d: 'The supplier gets the reorder request.', ui: { k: 'mail', to: 'orders@supplier.example', subject: 'Reorder: Linen shirt × 40', text: 'Hi, please confirm the price and delivery date for 40 units.' } },
    { ic: 'telegram', n: 'Send message', t: 'Telegram', d: 'The owner is told it has been handled.', ui: { k: 'chat', where: 'Owner', text: 'Reorder sent to the supplier: Linen shirt × 40. The task is on the purchasing board.' } },
  ]},
  { id: 'ghlAppt', name: 'GoHighLevel booking → reminders → team', run: '5 steps', note: EX_NOTE, nodes: [
    { ic: 'ghl', n: 'Appointment Booked', t: 'GoHighLevel', trig: 1, d: 'A client books through your GoHighLevel calendar.', ui: { k: 'kv', where: 'Calendar', rows: [['Client', 'Grace Lin'], ['When', 'Thu 2:00 pm'], ['Type', 'Consultation']] } },
    { ic: 'googlecalendar', n: 'Create detailed event', t: 'Google Calendar', d: 'The booking goes onto the team calendar.', ui: { k: 'kv', where: 'Thursday', rows: [['Event', 'Consultation: Grace Lin'], ['Time', '2:00 – 2:30 pm']] } },
    { ic: 'whatsapp', n: 'Send confirmation', t: 'WhatsApp', d: 'The client gets a confirmation and an easy way to reschedule.', ui: { k: 'chat', side: 'out', where: 'Grace Lin', text: 'Hi Grace, you are booked for Thursday at 2:00 pm. Reply R if you need to reschedule.' } },
    { ic: 'slack', n: 'Send channel message', t: 'Slack', d: 'The team channel is told.', ui: { k: 'chat', where: '#bookings', from: 'Booking bot', text: 'New consultation: Grace Lin, Thu 2:00 pm.' } },
    { ic: 'notion', n: 'Create database item', t: 'Notion', d: 'A prep card is added so nobody walks into the call cold.', ui: { k: 'table', where: 'Client prep', cols: ['Client', 'Call', 'Prep'], row: ['Grace Lin', 'Thu 2:00 pm', ['To do', '#E9A23B']] } },
  ]});
const CAT = { shopOrder: 'Online store', cart: 'Online store', reorder: 'Online store', shop: 'Online store', invoice: 'Online store',
  ghlLead: 'CRM & sales', mondayWon: 'CRM & sales', leads: 'CRM & sales',
  ghlAppt: 'Bookings & chat', booking: 'Bookings & chat', reception: 'Bookings & chat',
  closing: 'Documents', tracker: 'Documents' };
const CAT_ORDER = ['Online store', 'CRM & sales', 'Bookings & chat', 'Documents'];
const FLOWS = CAT_ORDER.flatMap(c => Object.entries(ED).flatMap(([tool, v]) => v.examples.filter(x => CAT[x.id] === c).map(ex => ({ tool, ex, cat: c }))));
const appsOf = x => [...new Set(x.nodes.map(n => n.ic).filter(i => ICONS[i] || (CUSTOM[i] && CUSTOM[i].svg)))];

/* a small preview of what the step produced, styled like the app it happened in */
function snip(n) {
  const u = n.ui; if (!u) return '';
  const m = meta(n.ic), pill = c => `<i class="pill" style="--p:${c[1]}">${esc(c[0])}</i>`;
  let b = '';
  if (u.k === 'order') b = `<div class="sn-order"><div class="so-h"><b>${esc(u.no)}</b><i class="pill" style="--p:${u.tone === 'warn' ? '#C77700' : '#0F7A55'}">${esc(u.status)}</i></div>${u.items.map(([a, v]) => `<div class="so-l"><span>${esc(a)}</span><span>${esc(v)}</span></div>`).join('')}<div class="so-t"><span>Total</span><b>${esc(u.total)}</b></div></div>`;
  else if (u.k === 'chat') b = `<div class="sn-chat ${u.side || 'in'}">${u.from ? `<small><i>${esc(u.from[0])}</i>${esc(u.from)} <em>APP</em></small>` : ''}<p>${esc(u.text)}</p><time>now${u.side === 'out' ? ' ✓✓' : ''}</time></div>`;
  else if (u.k === 'mail') b = `<div class="sn-mail"><small>To: ${esc(u.to)}</small><b>${esc(u.subject)}</b><p>${esc(u.text)}</p></div>`;
  else if (u.k === 'table') b = `<table class="sn-table"><tr>${u.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr><tr class="new">${u.row.map(c => `<td>${Array.isArray(c) ? pill(c) : esc(c)}</td>`).join('')}</tr><tr class="ghost"><td colspan="${u.cols.length}"></td></tr></table>`;
  else if (u.k === 'deal') b = `<div class="sn-deal">${u.stages.map(s => `<div class="${s === u.stage ? 'on' : ''}"><small>${esc(s)}</small>${s === u.stage ? `<span><b>${esc(u.name)}</b>${esc(u.value)}</span>` : '<span class="e"></span>'}</div>`).join('')}</div>`;
  else if (u.k === 'kv') b = `<div class="sn-kv">${u.rows.map(([a, v]) => `<div><span>${esc(a)}</span><b>${esc(v)}</b></div>`).join('')}</div>`;
  return `<div class="snip a-${n.ic}" style="--c:${m.c}"><div class="sn-top">${logo(n.ic, 15)}<b>${esc(m.t)}</b>${u.where ? `<span>${esc(u.where)}</span>` : ''}</div>${b}</div>`;
}
(() => {
  const sec = $('#replay'); if (!sec) return;
  const toolsEl = $('#edTools'), exEl = $('#edExamples'), win = $('#edWindow'), chrome = $('#edChrome'), canvas = $('#edCanvas'), world = $('#edWorld'), panel = $('#edPanel'), foot = $('#edFoot'), prog = $('#edProg');
  let tool = 'n8n', ex = ED.n8n.examples[0], W = 1100, H = 360, lastR = null, picked = null;
  toolsEl.innerHTML = Object.entries(ED).map(([k, v]) => `<button role="tab" data-k="${k}">${logo(v.logo, 18)}<span>${v.name}</span></button>`).join('');
  toolsEl.onclick = e => { const b = e.target.closest('button'); if (b) { tool = b.dataset.k; ex = ED[tool].examples[0]; build(); } };
  exEl.className = 'ed-pick';
  const cur = () => FLOWS.findIndex(f => f.ex === ex);
  const go = f => { tool = f.tool; ex = f.ex; try { sessionStorage.setItem('ed-flow', ex.id); } catch (e) {} build(); };
  exEl.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const menu = $('.pk-menu', exEl);
    if (b.dataset.go) go(FLOWS[(cur() + +b.dataset.go + FLOWS.length) % FLOWS.length]);
    else if (b.dataset.id) go(FLOWS.find(f => f.ex.id === b.dataset.id));
    else if (b.classList.contains('pk-shuffle')) { let f; do { f = FLOWS[Math.floor(Math.random() * FLOWS.length)]; } while (f.ex === ex); go(f); }
    else if (b.classList.contains('pk-cur')) { menu.hidden = !menu.hidden; b.setAttribute('aria-expanded', !menu.hidden); }
  };
  addEventListener('click', e => { const menu = $('.pk-menu', exEl); if (menu && !menu.hidden && !e.target.closest('.ed-pick')) { menu.hidden = true; $('.pk-cur', exEl).setAttribute('aria-expanded', 'false'); } });
  addEventListener('keydown', e => { const menu = $('.pk-menu', exEl); if (e.key === 'Escape' && menu && !menu.hidden) { menu.hidden = true; $('.pk-cur', exEl).focus(); } });
  world.onclick = e => { const n = e.target.closest('.en'); if (n) { picked = +n.dataset.i; showPanel(picked); } };

  function build() {
    picked = null; lastR = null;
    $$('button', toolsEl).forEach(b => b.classList.toggle('on', b.dataset.k === tool));
    const f = FLOWS[cur()];
    exEl.innerHTML = `<button class="pk-nav" data-go="-1" aria-label="Previous workflow">‹</button>
      <button class="pk-cur" aria-haspopup="true" aria-expanded="false"><small>${esc(f.cat)} · ${cur() + 1} of ${FLOWS.length}</small><b>${esc(ex.name)}</b><i aria-hidden="true">▾</i></button>
      <button class="pk-nav" data-go="1" aria-label="Next workflow">›</button>
      <button class="pk-shuffle" title="Show a different workflow">⤮<span> Surprise me</span></button>
      <span class="pk-apps" aria-label="Apps in this workflow">${appsOf(ex).map(a => `<i title="${esc(meta(a).t)}">${logo(a, 18)}</i>`).join('')}</span>
      <div class="pk-menu" hidden>${CAT_ORDER.map(c => `<div class="pk-grp"><h5>${esc(c)}</h5>${FLOWS.filter(x => x.cat === c).map(x => `<button data-id="${x.ex.id}" class="${x.ex === ex ? 'on' : ''}"><span class="pk-lg">${appsOf(x.ex).slice(0, 5).map(a => logo(a, 15)).join('')}</span><b>${esc(x.ex.name)}</b><small>${ED[x.tool].name}</small></button>`).join('')}</div>`).join('')}</div>`;
    win.className = 'ed-window t-' + tool;
    $('#edNote').textContent = ex.note || ED[tool].note;
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
      if (tool === 'n8n') return `<button class="en n8 ${n.trig ? 'trig' : ''}" data-i="${i}" style="${pos}"><span class="n8-face${DARK.has(n.ic) ? ' lt' : ''}">${logo(n.ic, 40)}${n.trig ? '<i class="bolt">⚡</i>' : ''}<i class="ck">✓</i></span><span class="n8-cnt">1 item</span><span class="n8-lbl"><b>${esc(n.n)}</b><small>${esc(n.t)}</small></span></button>`;
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
    const n = ex.nodes[i], el = world.querySelector(`.en[data-i="${i}"]`), ran = !!el && (el.classList.contains('done') || el.classList.contains('running'));
    panel.innerHTML = `<div class="k">${ED[tool].name} · step ${ex._order.indexOf(i) + 1 || '–'} of ${ex._order.length}</div>
      <h4>${logo(n.ic, 20)} ${esc(n.n)}</h4><p>${esc(n.d)}</p>
      <div class="k">${ran ? (n.ui ? 'What happened in the app' : 'Output') : 'Waiting to run'}</div>${ran && n.ui ? snip(n) : `<pre>${ran ? esc(JSON.stringify(n.o, null, 2)) : '// keep scrolling to run this step'}</pre>`}`;
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
  let last = null; try { last = sessionStorage.getItem('ed-flow'); } catch (e) {}
  const pool = FLOWS.filter(f => f.ex.id !== last);
  go(pool[Math.floor(Math.random() * pool.length)]);
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
