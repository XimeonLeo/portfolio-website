/* "Describe it, watch it build": the visitor types what they want automated and a workflow sketch is drawn
   from their words, step by step, with the real app logos. It runs in the browser, no AI call: the words are
   matched to apps and actions, so the sketch is honest about being a first draft. */
(() => {
const root = document.getElementById('build'); if (!root) return;
const $ = (s, el = root) => el.querySelector(s), $$ = (s, el = root) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const logo = (k, n, mode) => (window.logo ? window.logo(k, n, mode) : '');
$$('.bl-apps [data-app]').forEach(i => { i.innerHTML = logo(i.dataset.app, 16); i.title = (window.pfMeta ? window.pfMeta(i.dataset.app).t : ''); });
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* apps people name, the words they use for them, and what the step does there */
const APPS = [
  ['shopify', /shopify/, 'Shopify', 'order', { trig: 'New order in Shopify', act: 'Update the order in Shopify' }],
  ['woocommerce', /woo ?commerce/, 'WooCommerce', 'order', { trig: 'New order in WooCommerce', act: 'Update the WooCommerce order' }],
  ['stripe', /stripe|payment|paid|invoice paid/, 'Stripe', 'pay', { trig: 'A payment succeeds in Stripe', act: 'Create the charge in Stripe' }],
  ['ghl', /go ?high ?level|\bghl\b|highlevel/, 'GoHighLevel', 'crm', { trig: 'New contact in GoHighLevel', act: 'Create or update the GoHighLevel contact' }],
  ['hubspot', /hub ?spot/, 'HubSpot', 'crm', { trig: 'New contact in HubSpot', act: 'Create or update the HubSpot contact' }],
  ['zoho', /zoho/, 'Zoho CRM', 'crm', { trig: 'New lead in Zoho CRM', act: 'Add the lead to Zoho CRM' }],
  ['pipedrive', /pipedrive/, 'Pipedrive', 'crm', { trig: 'New deal in Pipedrive', act: 'Create the deal in Pipedrive' }],
  ['salesforce', /salesforce/, 'Salesforce', 'crm', { trig: 'New lead in Salesforce', act: 'Create the lead in Salesforce' }],
  ['monday', /monday/, 'monday.com', 'board', { trig: 'Status changes on a monday.com board', act: 'Create an item on the monday.com board' }],
  ['notion', /notion/, 'Notion', 'board', { trig: 'New page in a Notion database', act: 'Add a page to the Notion database' }],
  ['airtable', /airtable/, 'Airtable', 'board', { trig: 'New record in Airtable', act: 'Add a record in Airtable' }],
  ['trello', /trello/, 'Trello', 'board', { trig: 'New card in Trello', act: 'Create a Trello card' }],
  ['googlesheets', /google ?sheets?|spreadsheet|\bsheets?\b|excel/, 'Google Sheets', 'sheet', { trig: 'New row in Google Sheets', act: 'Add a row in Google Sheets' }],
  ['googledrive', /google ?drive|\bdrive\b|folder/, 'Google Drive', 'file', { trig: 'New file in a Drive folder', act: 'Save the file to Google Drive' }],
  ['googledocs', /google ?docs?|\bdocument\b|contract|proposal/, 'Google Docs', 'doc', { trig: 'New Google Doc', act: 'Fill a Google Docs template' }],
  ['googleforms', /google ?forms?/, 'Google Forms', 'form', { trig: 'New Google Forms response', act: 'Send the Google Form' }],
  ['typeform', /typeform/, 'Typeform', 'form', { trig: 'New Typeform submission', act: 'Send the Typeform' }],
  ['calendly', /calendly/, 'Calendly', 'book', { trig: 'New Calendly booking', act: 'Send the Calendly booking link' }],
  ['googlecalendar', /google ?calendar|calendar|appointment|booking|book a/, 'Google Calendar', 'book', { trig: 'New Google Calendar event', act: 'Create the Google Calendar event' }],
  ['zoom', /zoom/, 'Zoom', 'book', { trig: 'A Zoom meeting ends', act: 'Create the Zoom meeting' }],
  ['facebook', /facebook|meta ad|lead ads?/, 'Facebook Lead Ads', 'lead', { trig: 'New lead from a Facebook ad', act: 'Send to Facebook' }],
  ['instagram', /instagram|\big\b/, 'Instagram', 'msg', { trig: 'New Instagram message', act: 'Reply on Instagram' }],
  ['wordpress', /wordpress|website form|contact form|web ?form/, 'Website form', 'form', { trig: 'New website form submission', act: 'Post to the website' }],
  ['quickbooks', /quick ?books|accounting|bookkeeping/, 'QuickBooks', 'pay', { trig: 'New invoice in QuickBooks', act: 'Create the QuickBooks invoice' }],
  ['mailchimp', /mailchimp|newsletter/, 'Mailchimp', 'mail', { trig: 'New Mailchimp subscriber', act: 'Add the contact to Mailchimp' }],
  ['gmail', /gmail|e-?mail|inbox/, 'Gmail', 'mail', { trig: 'New email in Gmail', act: 'Send an email with Gmail' }],
  ['whatsapp', /whats ?app/, 'WhatsApp', 'msg', { trig: 'New WhatsApp message', act: 'Send a WhatsApp message' }],
  ['telegram', /telegram/, 'Telegram', 'msg', { trig: 'New Telegram message', act: 'Send a Telegram message' }],
  ['slack', /slack/, 'Slack', 'msg', { trig: 'New message in a Slack channel', act: 'Post in a Slack channel' }],
  ['discord', /discord/, 'Discord', 'msg', { trig: 'New Discord message', act: 'Post in Discord' }],
  ['twilio', /\bsms\b|text message|\btext (them|the|me|him|her)\b|twilio/, 'SMS (Twilio)', 'msg', { trig: 'New SMS received', act: 'Send an SMS' }],
  ['messenger', /messenger/, 'Messenger', 'msg', { trig: 'New Messenger message', act: 'Reply on Messenger' }],
];
const NAME = Object.fromEntries(APPS.map(a => [a[0], a[2]]));
/* words that mean "AI should do something here", with what it does */
const AI = [
  [/summar/, 'Summarise it'], [/score|qualif|rank|priorit/, 'Score and qualify it'], [/classif|categor|sort|tag|label/, 'Classify it'],
  [/reply|respond|answer|chatbot|assistant|agent/, 'Write the reply'], [/read|extract|pull out|scan|receipt|pdf|ocr/, 'Read and extract the details'],
  [/translat/, 'Translate it'], [/draft|write|personali/, 'Draft the message'], [/\bai\b|gpt|claude|smart/, 'Let AI decide the next step'],
];
const WAIT = /(remind|follow ?up|chase|after \d+|next day|days? later|hours? later|tomorrow)/;
const COND = /(\bif\b|only when|only if|over \$?\d+|more than|less than|unless|whenever .* (is|are) )/;
const SCHED = /(every (day|morning|week|monday|hour|night)|daily|weekly|each morning|at \d+ ?(am|pm))/;
const EXAMPLES = [
  'When a new Shopify order comes in, add it to Google Sheets and tell the team on Slack',
  'When someone fills my website form, score the lead with AI, add them to GoHighLevel and text them on WhatsApp',
  'Every morning, check unpaid invoices in QuickBooks and chase them by email',
  'When an email with a receipt arrives in Gmail, read it with AI and log it in Airtable',
  'When a patient books on Calendly, add them to HubSpot and send a WhatsApp reminder the day before',
  'When a deal is marked Won in monday.com, create a Google Drive folder and post in Slack',
  'When a Facebook lead comes in, reply on WhatsApp in seconds and add them to GoHighLevel',
  'When a Stripe payment succeeds, send a receipt by email and add the client to Notion',
  'Every Monday, summarise last week\'s new leads from HubSpot and send it to me on Telegram',
  'When a Typeform is submitted, classify the request with AI and create a Trello card',
  'When a contract PDF lands in Google Drive, read it with AI and add the key dates to Google Calendar',
  'When an Instagram message asks about prices, reply with AI and log the lead in Airtable',
  'When a WooCommerce order is over $200, thank the customer on WhatsApp and alert the team on Discord',
  'When a Zoom call ends, summarise it with AI and save the notes in Notion',
  'If a lead in GoHighLevel has not replied after 2 days, follow up by SMS',
  'When stock in Shopify drops below 5, create a reorder task in monday.com and email the supplier',
];
const SHORT = e => e.split(',')[0] + '…';
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function plan(text) {
  const t = ' ' + text.toLowerCase().replace(/[’']/g, "'") + ' ';
  // apps in the order they are mentioned
  const hits = [];
  for (const [k, re] of APPS) { const m = re.exec(t); if (m && !hits.some(h => h.k === k)) hits.push({ k, at: m.index }); }
  // "calendar" and "Calendly", "email" and "Gmail" etc: keep the more specific one
  const drop = new Set(); const has = k => hits.some(h => h.k === k);
  if (has('calendly')) drop.add('googlecalendar');
  if (has('mailchimp') && !/gmail/.test(t)) drop.add('gmail');
  if (has('googleforms') || has('typeform')) drop.add('wordpress');
  if ((has('whatsapp') || has('telegram')) && !/sms|twilio/.test(t)) drop.add('twilio');
  const apps = hits.filter(h => !drop.has(h.k)).sort((a, b) => a.at - b.at).map(h => h.k);
  const steps = [];
  // trigger: a schedule, or the first app named after "when/whenever/new", or the first app
  if (SCHED.test(t)) steps.push({ k: 'schedule', n: 'On a schedule', t: 'Schedule trigger', d: 'Runs on its own at the time you set, ' + (t.match(SCHED)[0]) + '.', trig: 1 });
  else if (apps.length) { const k = apps.shift(); steps.push({ k, n: APPS.find(a => a[0] === k)[4].trig, t: NAME[k] + ' trigger', d: 'The workflow starts the moment this happens. Nobody has to check for it.', trig: 1 }); }
  else steps.push({ k: 'webhook', n: 'Something happens', t: 'Webhook trigger', d: 'Your tool calls the workflow the moment the event happens.', trig: 1 });
  const ai = AI.find(([re]) => re.test(t));
  if (ai) steps.push({ k: 'claude', n: ai[1], t: 'AI step', d: 'AI handles the reading or writing. Anything that must be exact (amounts, dates, names) is checked in code before it is used.' });
  if (COND.test(t)) steps.push({ k: 'if', n: 'Check the condition', t: 'If', d: 'Only the cases you care about carry on. The rest stop here, or go down a different path.' });
  if (WAIT.test(t)) steps.push({ k: 'wait', n: 'Wait, then follow up', t: 'Wait', d: 'Pauses for the time you choose, checks if anything changed, and only then follows up.' });
  apps.forEach(k => steps.push({ k, n: APPS.find(a => a[0] === k)[4].act, t: NAME[k], d: 'Done for you in ' + NAME[k] + ', with the details from the steps before.' }));
  if (steps.length === 1) steps.push({ k: 'code', n: 'Do the work', t: 'Your steps', d: 'I map the exact steps with you on a short call.' });
  steps.push({ k: 'alert', n: 'Alert if anything fails', t: 'Error workflow', d: 'If a step ever fails, you are told straight away, with what went wrong. Every build I ship has this.', extra: 1 });
  const named = new Set(steps.map(s => s.k)), known = [...named].filter(k => NAME[k]).length;
  return { steps, known, hours: Math.max(2, Math.min(10, steps.length + (ai ? 2 : 0))) };
}

/* little tiles for steps that are not an app */
const TILE = { schedule: ['⏱', '#7A5AF8'], webhook: ['⇅', '#2D7FF9'], if: ['⇄', '#3E9C5B'], wait: ['⏸', '#D99A06'], code: ['{ }', '#FF6D5A'], alert: ['!', '#E5484D'] };
const icon = (k, n) => TILE[k] ? `<span class="bl-tile" style="background:${TILE[k][1]};width:${n}px;height:${n}px;font-size:${Math.round(n * .45)}px">${TILE[k][0]}</span>` : logo(k, n);

/* ---------- interface ---------- */
const form = $('.bl-form'), input = $('#blText'), out = $('.bl-out'), chips = $('.bl-chips');
let deck = shuffle(EXAMPLES.map((_, i) => i));
function dealChips() {
  if (deck.length < 4) deck = deck.concat(shuffle(EXAMPLES.map((_, i) => i).filter(i => !deck.includes(i))));
  const hand = deck.splice(0, 4);
  chips.innerHTML = hand.map((i, k) => `<button type="button" data-ex="${i}" style="--d:${k * 60}ms">${esc(SHORT(EXAMPLES[i]))}</button>`).join('') + '<button type="button" class="bl-more" aria-label="Show other ideas">↻ More ideas</button>';
}
dealChips();
chips.onclick = e => {
  if (e.target.closest('.bl-more')) { dealChips(); return; }
  const b = e.target.closest('[data-ex]'); if (!b) return; input.value = EXAMPLES[+b.dataset.ex]; input.focus(); form.requestSubmit();
};
/* the placeholder types out a different idea every few seconds while the box is empty */
(() => {
  const base = 'e.g. ', order = shuffle(EXAMPLES); let n = 0, timer;
  const typeOne = () => {
    if (input.value || document.activeElement === input && input.value) return later(2500);
    const full = order[n++ % order.length];
    if (reduce) { input.placeholder = base + full; return later(4500); }
    let i = 0;
    const step = () => { if (input.value) return later(2500); input.placeholder = base + full.slice(0, i) + (i < full.length ? '▍' : ''); if (i++ < full.length) timer = setTimeout(step, 22 + Math.random() * 30); else later(2600); };
    step();
  };
  const later = ms => { clearTimeout(timer); timer = setTimeout(typeOne, ms); };
  new IntersectionObserver(es => es.forEach(x => x.isIntersecting ? later(400) : clearTimeout(timer))).observe(input);
})();
input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) { e.preventDefault(); form.requestSubmit(); } });
/* ================= the editor view (n8n / Make) ================= */
let sketch = null;
const CAT = Object.fromEntries(APPS.map(a => [a[0], a[3]]));
Object.assign(TILE, { errtrig: ['⚠', '#E5484D'], noop: ['→', '#8E95A6'] });
const P = { name: 'Ada Bello', email: 'ada@example.com', phone: '+44 7700 900123' };
/* believable sample data for each step (made up, never a real person) */
function sample(s) {
  const k = s.k, c = CAT[k], T = !!s.trig, m = String(s.n).toLowerCase();
  if (k === 'schedule') return { timestamp: '2026-11-17T08:00:00', timezone: 'Africa/Lagos' };
  if (k === 'webhook') return { body: { event: 'created', name: P.name, email: P.email } };
  if (k === 'claude') {
    if (/score|qualif/.test(m)) return { score: 82, tier: 'hot', reason: 'Asked for a price and a start date' };
    if (/classif/.test(m)) return { category: 'New enquiry', confidence: 0.94 };
    if (/reply/.test(m)) return { reply: 'Hi Ada, thanks for reaching out! Yes, we have time on Thursday. Shall I book you in?' };
    if (/read|extract/.test(m)) return { vendor: 'Acme Supplies Ltd', invoice_no: 'INV-2291', total: 657.64, date: '2026-11-12' };
    if (/summar/.test(m)) return { summary: 'Ada wants a quote for 40 units by Friday.' };
    if (/translat/.test(m)) return { text: 'Hello, is the order ready?', language: 'en' };
    if (/draft/.test(m)) return { draft: 'Hi Ada, just following up on your enquiry from Monday…' };
    return { next_step: 'book_call', reason: 'Ready to buy this month' };
  }
  if (k === 'if') return { passed: true, branch: 'true', rule: 'matches your condition' };
  if (k === 'wait') return { waited: '2 days', resumed_at: '2026-11-19T09:00:00', replied: false };
  if (k === 'code') return { ok: true };
  if (k === 'alert') return { sent_to: 'you', channel: 'email', message: 'A step failed: the request timed out. Nothing was sent twice.' };
  if (k === 'errtrig') return { workflow: 'New workflow', failed_step: 'the step that failed', error: 'Request timed out', time: '2026-11-17T08:00:04' };
  if (k === 'noop') return {};
  switch (c) {
    case 'order': return { order_id: '#1092', customer: P.name, email: P.email, total: 64, currency: 'GBP', items: 2 };
    case 'pay': return { payment_id: 'pi_3QxR8', amount: 499, currency: 'USD', customer_email: P.email, status: 'succeeded' };
    case 'crm': return T ? { contact_id: '48213', ...P, source: 'Website' } : { contact_id: '48213', stage: 'New lead', updated: true };
    case 'board': return T ? { item_id: '1734', name: P.name, status: 'Won' } : { item_id: '1735', name: 'Follow up: ' + P.name, status: 'To do' };
    case 'sheet': return T ? { row_number: 58, ...P } : { row_number: 59, appended: true };
    case 'file': return T ? { file_name: 'receipt_0423.pdf', folder: 'Inbox', size_kb: 182 } : { file_name: 'Ada Bello - receipt.pdf', folder: 'Processed' };
    case 'doc': return { document_id: '1aBcD7', title: 'Proposal for ' + P.name, link: 'https://docs.google.com/document/d/1aBcD7' };
    case 'form': return { ...P, message: 'Do you have time this week?', submitted_at: '2026-11-16T21:48:00' };
    case 'book': return T ? { invitee: P.name, email: P.email, start_time: '2026-11-18T10:00:00', event: 'Discovery call' } : { event_id: 'evt_88', start_time: '2026-11-18T10:00:00', status: 'confirmed' };
    case 'lead': return { lead_id: 'lead_5521', full_name: P.name, phone: P.phone, form: 'Spring offer' };
    case 'mail': return T ? { from: P.email, subject: 'Quote for 40 units?', snippet: 'Hi, could you send me a price…' } : { to: P.email, subject: 'Thanks, Ada', status: 'sent' };
    case 'msg': return T ? { from: P.phone, text: 'Is Thursday 2pm free?' } : { to: P.phone, text: 'Hi Ada, thanks! You are booked for Thursday at 2pm.', status: 'delivered' };
  }
  return { ok: true };
}
const APPNAME = s => NAME[s.k] || { schedule: 'Schedule', webhook: 'Webhooks', claude: 'Anthropic Claude', if: 'Flow control', wait: 'Tools', code: 'Tools', alert: 'Email', errtrig: 'Error Trigger', noop: 'No Operation' }[s.k] || 'Step';
function typeOf(tool, s) {
  if (tool === 'make') return s.n;
  if (s.k === 'errtrig') return 'Error Trigger';
  if (s.k === 'noop') return 'No Operation, do nothing';
  if (s.trig) return s.k === 'schedule' ? 'Schedule Trigger' : s.k === 'webhook' ? 'Webhook' : (NAME[s.k] || 'App') + ' Trigger';
  return { claude: 'AI Agent · Claude', if: 'If', wait: 'Wait', code: 'Code', alert: 'Send email' }[s.k] || NAME[s.k] || 'Action';
}
/* lay the steps out the way each tool really shows them */
function layout(tool, steps) {
  const GAP = tool === "n8n" ? 178 : 172, Y = 96, Y2 = 300, nodes = [], edges = [], notes = [];
  const add = (s, x, y, extra = {}) => nodes.push({ ...s, x, y, si: steps.indexOf(s), ...extra }) - 1;
  let x = 40, prev = null, filter = null, noopX = 0;
  steps.filter(s => !s.extra).forEach(s => {
    if (tool === 'make' && s.k === 'if') { filter = s; return; }          // Make: a filter on the link, not a module
    const i = add(s, x, Y);
    if (prev !== null) edges.push({ a: prev, b: i, lab: nodes[prev].k === 'if' ? 'true' : '', filter });
    filter = null;
    if (tool === 'n8n' && s.k === 'if') { const f = add({ k: 'noop', n: 'Stop here', d: 'Cases that do not match your condition stop here. Nothing else happens to them.' }, x + GAP, Y2, { si: -1 }); edges.push({ a: i, b: f, lab: 'false' }); noopX = x + GAP; }
    prev = i; x += GAP;
  });
  const alert = steps.find(s => s.extra), lastMain = prev;
  if (alert) {
    if (tool === 'n8n') {
      const ex = noopX ? noopX + GAP + 20 : 40;
      const t = add({ k: 'errtrig', n: 'When any step fails', trig: 1, d: 'n8n starts this small workflow by itself the moment any step above fails, with the details of what went wrong.' }, ex, Y2, { si: -1 });
      const a = add(alert, ex + GAP, Y2);
      edges.push({ a: t, b: a });
      notes.push({ x: ex - 22, y: Y2 - 40, w: GAP + 140, h: 172, text: 'Safety net · runs only if a step fails' });
    } else {
      const lx = nodes[lastMain].x, a = add(alert, lx, Y2);
      edges.push({ a: lastMain, b: a, err: 1, lab: 'Error handler' });
    }
  }
  const W = Math.max(...nodes.map(n => n.x)) + (tool === 'n8n' ? 150 : 140), H = (nodes.some(n => n.y === Y2) ? Y2 + 110 : Y + 130);
  return { nodes, edges, notes, W, H };
}
const C = (tool, n) => tool === 'make' ? { x: n.x + 42, y: n.y + 42 } : { x: n.x + 45, y: n.y + 45 };
function face(tool, n, i) {
  const aria = `aria-label="${esc(n.n)}: see what this step does"`, pos = `left:${n.x}px;top:${n.y}px`;
  if (tool === 'n8n') {
    const ic = TILE[n.k] ? icon(n.k, 40) : logo(n.k, 40);
    return `<button type="button" class="en n8 ${n.trig ? 'trig' : ''}" data-i="${i}" style="${pos}" ${aria}><span class="n8-face">${ic}${n.trig ? '<i class="bolt">⚡</i>' : ''}<i class="spin"></i><i class="ck">✓</i></span><span class="n8-lbl"><b>${esc(n.n)}</b><small>${esc(typeOf('n8n', n))}</small></span></button>`;
  }
  const m = window.pfMeta ? window.pfMeta(n.k) : {}, col = TILE[n.k] ? TILE[n.k][1] : (m.svg ? '#F2F1F6' : (m.c || '#6D00CC'));
  const ic = TILE[n.k] ? `<span class="lg lg-txt" style="width:40px;height:40px;font-size:20px;background:transparent;color:#fff">${TILE[n.k][0]}</span>` : logo(n.k, 40, 'white');
  return `<button type="button" class="en mk" data-i="${i}" style="${pos};--c:${col}" ${aria}><span class="mk-face">${ic}${n.trig ? '<i class="clock">⏱</i>' : ''}<i class="ring"></i><i class="ops">1</i></span><span class="mk-lbl"><b>${esc(APPNAME(n))}</b><small>${esc(n.n)}</small><em>${i + 1}</em></span></button>`;
}
function drawEditor(fresh) {
  const S = sketch, tool = S.tool, L = S.L = layout(tool, S.steps), win = $('.bl-win', out);
  $$('.bl-tool [data-tool]', out).forEach(b => { b.classList.toggle('on', b.dataset.tool === tool); b.setAttribute('aria-selected', b.dataset.tool === tool); });
  win.className = 'ed-window bl-win t-' + tool;
  const chrome = tool === 'n8n'
    ? `<span class="c-crumb">${logo('n8n', 18)}<span>Personal</span><i>/</i><b>My workflow</b><em class="c-tag">+ Add tag</em></span><span class="c-mid"><b>Editor</b><span>Executions</span></span><span class="c-act"><span class="c-state">Inactive</span><i class="sw"></i><span class="c-btn solid">Save</span></span>`
    : `<span class="c-crumb"><span class="c-back">‹</span>${logo('make', 18)}<b>My scenario</b></span><span class="c-mid"><b>Diagram</b><span>History</span></span><span class="c-act"><span class="c-state">Scheduling</span><i class="sw"></i></span>`;
  let svg = `<svg class="ed-wires" viewBox="0 0 ${L.W} ${L.H}" width="${L.W}" height="${L.H}"><defs><marker id="bl-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z"/></marker></defs>`;
  const badges = [];
  L.edges.forEach((e, k) => {
    const A = C(tool, L.nodes[e.a]), B = C(tool, L.nodes[e.b]); let d;
    if (tool === 'n8n') {
      const down = B.y > A.y + 20, x1 = A.x + 45, y1 = A.y, x2 = B.x - 47, y2 = B.y;
      d = down && Math.abs(B.x - A.x) < 10 ? `M${A.x} ${A.y + 46}L${B.x} ${B.y - 48}` : `M${x1} ${y1}C${x1 + Math.max(40, (x2 - x1) / 2)} ${y1} ${x2 - Math.max(40, (x2 - x1) / 2)} ${y2} ${x2} ${y2}`;
    } else {
      const vert = Math.abs(B.x - A.x) < 10;
      d = vert ? `M${A.x} ${A.y + 46}L${B.x} ${B.y - 46}` : `M${A.x + 48} ${A.y}C${(A.x + B.x) / 2} ${A.y} ${(A.x + B.x) / 2} ${B.y} ${B.x - 48} ${B.y}`;
    }
    svg += `<path class="ew${e.err ? ' err' : ''}" data-k="${k}" d="${d}" ${tool === 'n8n' ? 'marker-end="url(#bl-arr)"' : ''}/><path class="ew-flow" data-k="${k}" d="${d}"/>`;
    if (tool === 'n8n' && !e.err) svg += `<text class="ew-items" data-k="${k}" x="${(A.x + B.x) / 2}" y="${(A.y + B.y) / 2 - 10}" text-anchor="middle">1 item</text>`;
    if (e.lab) svg += `<text class="ew-lab" x="${(A.x + B.x) / 2 + (e.err ? 10 : 0)}" y="${(A.y + B.y) / 2 + (tool === 'n8n' ? 18 : 4)}" text-anchor="${e.err ? 'start' : 'middle'}">${esc(e.lab)}</text>`;
    if (e.filter) badges.push(`<button type="button" class="mk-filter" data-si="${S.steps.indexOf(e.filter)}" style="left:${(A.x + B.x) / 2}px;top:${(A.y + B.y) / 2}px" aria-label="Filter: ${esc(e.filter.n)}"><i>⧩</i><span>${esc(e.filter.n)}</span></button>`);
  });
  svg += '</svg>';
  const notes = L.notes.map(n => `<div class="bl-sticky" style="left:${n.x}px;top:${n.y}px;width:${n.w}px;height:${n.h}px"><b>${esc(n.text)}</b></div>`).join('');
  win.innerHTML = `<div class="ed-chrome">${chrome}</div>
    <div class="ed-body"><div class="ed-canvas"><div class="ed-deco">${tool === 'n8n' ? '<div class="dz"><i>⤢</i><i>＋</i><i>－</i></div>' : '<div class="dm"><i>⚙</i><i>✎</i><i>⤢</i></div>'}</div>
      <div class="bl-scroll"><div class="bl-size"><div class="ed-world bl-world" style="width:${L.W}px;height:${L.H}px">${notes}${svg}${L.nodes.map((n, i) => face(tool, n, i)).join('')}${badges.join('')}</div></div></div>
      <div class="ed-toast"></div></div>
      <aside class="ed-panel"></aside></div>
    <div class="ed-foot"></div>`;
  fitEditor(); if (!fresh) setRun(L.nodes.length, true); else setRun(-1, true);
  showPanel();
}
function fitEditor() {
  const L = sketch.L, sc = $('.bl-scroll', out); if (!sc) return;
  if (!fitEditor.ro && window.ResizeObserver) { fitEditor.ro = new ResizeObserver(() => fitEditor()); }
  if (fitEditor.ro && fitEditor.el !== sc) { fitEditor.ro.disconnect(); fitEditor.ro.observe(sc); fitEditor.el = sc; }
  if (sc.clientWidth < 80 || sc.clientHeight < 80) return;                 // not laid out yet: the observer calls back
  let s = Math.min(1, (sc.clientWidth - 32) / L.W, (sc.clientHeight - 24) / L.H);
  if (s < .62) s = Math.min(.62, (sc.clientHeight - 24) / L.H);             // small screens: keep it readable, scroll sideways
  sketch.scale = s;
  $('.bl-size', out).style.cssText = `width:${L.W * s}px;height:${L.H * s}px`;
  $('.bl-world', out).style.transform = `scale(${s})`;
}
addEventListener('resize', () => { if (sketch && sketch.L && $('.bl-scroll', out)) fitEditor(); });
/* the run state: r = -1 nothing yet, 0..N-1 that step running, N finished */
function setRun(r, quiet) {
  const tool = sketch.tool, L = sketch.L, order = L.nodes.map((n, i) => i).filter(i => L.nodes[i].k !== 'noop' && L.nodes[i].k !== 'errtrig' && !L.nodes[i].extra);
  const done = new Set(order.slice(0, Math.max(0, r)));
  $$('.bl-world .en', out).forEach(el => { const i = +el.dataset.i; el.classList.toggle('done', done.has(i)); el.classList.toggle('running', order[r] === i); });
  L.edges.forEach((e, k) => { const on = !e.err && done.has(e.a) && (done.has(e.b) || order[r] === e.b); $$(`.bl-world [data-k="${k}"]`, out).forEach(p => p.classList.toggle('lit', on)); });
  const N = order.length, busy = r >= 0 && r < N, win = $('.bl-win', out);
  win.classList.toggle('busy', busy); win.classList.toggle('finished', r >= N);
  const label = tool === 'n8n' ? (busy ? 'Executing workflow' : 'Execute workflow') : (busy ? 'Stop' : 'Run once');
  const status = r < 0 ? 'Building the sketch…' : r >= N ? (tool === 'n8n' ? 'Test run succeeded' : 'The scenario run was completed') : `Step ${r + 1} of ${N}: ${L.nodes[order[r]].n}`;
  $('.ed-foot', out).innerHTML = tool === 'n8n'
    ? `<span class="f-logs">Logs</span><button type="button" class="f-btn f-n8" data-run><i class="f-ic">${busy ? '' : '⚗'}</i>${label}</button><span class="f-stat ${r >= N ? 'is-ok' : busy ? 'is-run' : ''}">${busy ? '<i class="dot"></i>' : r >= N ? '✓ ' : ''}${esc(status)}</span>`
    : `<button type="button" class="f-btn f-mk" data-run aria-label="${label}"><i class="f-ic">${busy ? '' : '▶'}</i></button><span class="f-sub"><b>${label}</b><small>Immediately as data arrives</small></span><span class="f-stat ${r >= N ? 'is-ok' : busy ? 'is-run' : ''}">${busy ? '<i class="dot"></i>' : r >= N ? '✓ ' : ''}${esc(status)}</span>`;
  // follow the running step when the canvas scrolls sideways
  if (busy) { const el = $(`.bl-world .en[data-i="${order[r]}"]`, out), sc = $('.bl-scroll', out); if (el && sc && sc.scrollWidth > sc.clientWidth) sc.scrollTo({ left: Math.max(0, (L.nodes[order[r]].x + 45) * sketch.scale - sc.clientWidth / 2), behavior: reduce ? 'auto' : 'smooth' }); }
  if (r >= N && !quiet) { const t = $('.ed-toast', out); t.textContent = tool === 'n8n' ? '✓ Workflow executed successfully' : '✓ The scenario run was completed'; t.classList.add('on'); setTimeout(() => t.classList.remove('on'), 2600); }
  sketch.r = r;
}
async function playRun(id, build) {
  const L = sketch.L, sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  if (build && !reduce) {
    const els = $$('.bl-world .en, .bl-world .mk-filter, .bl-world .bl-sticky', out), wires = $$('.bl-world .ed-wires path, .bl-world .ed-wires text', out);
    els.forEach(e => e.classList.add('bl-hide')); wires.forEach(e => e.classList.add('bl-hide'));
    for (let i = 0; i < L.nodes.length; i++) {
      const el = $(`.bl-world .en[data-i="${i}"]`, out); el.classList.remove('bl-hide'); el.classList.add('bl-pop');
      L.edges.forEach((e, k) => { if (e.b === i) $$(`.bl-world [data-k="${k}"]`, out).forEach(p => p.classList.remove('bl-hide')); });
      $$('.bl-world .ew-lab, .bl-world .mk-filter, .bl-world .bl-sticky', out).forEach(x => x.classList.remove('bl-hide'));
      await sleep(260); if (id !== job) return;
    }
  }
  const N = L.nodes.filter(n => n.k !== 'noop' && n.k !== 'errtrig' && !n.extra).length;
  for (let r = 0; r <= N; r++) { setRun(r, false); if (sketch.picked === null) showPanel(); await sleep(r === N ? 0 : 520); if (id !== job) return; }
}
/* the side panel: every step at a glance, or one step's details like n8n's step view */
function showPanel() {
  const S = sketch, L = S.L, pane = $('.ed-panel', out); if (!pane) return;
  $$('.bl-world .en', out).forEach(x => x.classList.toggle('sel', S.picked !== null && +x.dataset.i === S.picked));
  if (S.picked === null) {
    pane.innerHTML = `<div class="k">${S.tool === 'n8n' ? 'n8n' : 'Make'} · ${L.nodes.length} steps</div><h4><span>What this workflow does<small>Click a step to see its details</small></span></h4>
      <ol class="bl-steps">${L.nodes.map((n, i) => `<li><button type="button" data-pick="${i}">${TILE[n.k] ? icon(n.k, 22) : logo(n.k, 22)}<span><b>${esc(n.n)}</b><small>${esc(S.tool === 'make' ? APPNAME(n) : typeOf('n8n', n))}</small></span></button></li>`).join('')}</ol>`;
    return;
  }
  const n = L.nodes[S.picked], inEdge = L.edges.find(e => e.b === S.picked), prev = inEdge ? L.nodes[inEdge.a] : null, next = L.edges.filter(e => e.a === S.picked).map(e => L.nodes[e.b].n);
  const ran = S.r >= 0, o = sample(n), inp = prev ? sample(prev) : null;
  const tab = S.tab, json = v => `<pre>${esc(JSON.stringify(v, null, 2))}</pre>`;
  let body;
  if (tab === 'input') body = n.trig ? '<p class="p-hint">This step starts the workflow, so it has no input. Its output is what arrived.</p>' : `<p class="p-hint">What ${esc(prev ? prev.n : 'the step before')} handed to this step${ran ? '' : ' (after a test run)'}.</p>${json(inp || {})}`;
  else if (tab === 'output') body = n.k === 'noop' ? '<p class="p-hint">Nothing comes out: the item simply stops here.</p>' : `<p class="p-hint">Sample data from the test run. Made up, so nobody real is in it.</p>${json(o)}`;
  else body = `<p>${esc(n.d || '')}</p><dl class="p-flow"><div><dt>Gets</dt><dd>${n.trig ? 'Nothing: this step starts it' : esc(prev ? prev.n : 'The step before it')}</dd></div><div><dt>Hands on to</dt><dd>${esc(next.join(', ') || 'Nothing: this is the last step')}</dd></div></dl>`;
  pane.innerHTML = `<div class="k"><button type="button" class="p-follow" data-pick="">← All steps</button></div>
    <h4>${TILE[n.k] ? icon(n.k, 22) : logo(n.k, 22)}<span>${esc(n.n)}<small>${esc(S.tool === 'make' ? APPNAME(n) : typeOf('n8n', n))}</small></span></h4>
    ${ran ? '<span class="p-st is-ok">✓ Ran in the test</span>' : '<span class="p-st">Not run yet</span>'}
    <div class="p-tabs" role="tablist">${[['explain', 'Explain'], ['input', 'Input'], ['output', 'Output']].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" class="${tab === k ? 'on' : ''}" aria-selected="${tab === k}">${l}</button>`).join('')}</div>
    <div class="p-body">${body}</div>`;
}
out.addEventListener('click', e => {
  if (!sketch || !sketch.L) return;
  const tb = e.target.closest('.bl-tool [data-tool]'); if (tb) { if (tb.dataset.tool !== sketch.tool) { sketch.tool = tb.dataset.tool; sketch.picked = null; drawEditor(false); } return; }
  const node = e.target.closest('.bl-world .en'); if (node) { sketch.picked = +node.dataset.i; showPanel(); return; }
  const fl = e.target.closest('.mk-filter'); if (fl) { const s = sketch.steps[+fl.dataset.si]; const pane = $('.ed-panel', out); sketch.picked = null; pane.innerHTML = `<div class="k"><button type="button" class="p-follow" data-pick="">← All steps</button></div><h4>${icon('if', 22)}<span>${esc(s.n)}<small>Filter on the link</small></span></h4><div class="p-body"><p>${esc(s.d)}</p><p class="p-hint">In Make, a condition sits on the link between two modules. Only bundles that pass it carry on.</p></div>`; return; }
  const pk = e.target.closest('[data-pick]'); if (pk) { sketch.picked = pk.dataset.pick === '' ? null : +pk.dataset.pick; showPanel(); return; }
  const t = e.target.closest('.ed-panel [data-tab]'); if (t) { sketch.tab = t.dataset.tab; showPanel(); return; }
  if (e.target.closest('[data-run]') && !$('.bl-win', out).classList.contains('busy')) { const id = ++job; playRun(id, false); }
});

let job = 0;
form.onsubmit = async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (text.length < 12) { $('.bl-err').textContent = 'Tell me a little more: what happens first, and what should happen next?'; input.focus(); return; }
  $('.bl-err').textContent = '';
  const id = ++job, { steps, known, hours } = plan(text), sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  root.classList.add('has-out'); out.hidden = false;
  const btn = $('.bl-go'); btn.disabled = true; btn.classList.add('busy');
  const apps = [...new Set(steps.map(x => x.k))];
  if (!reduce) {
    const box = $('.bl-box');
    out.innerHTML = `<div class="bl-forge" aria-live="polite"><div class="bf-grid"></div><div class="bf-beam"></div>
      <div class="bf-core"><span class="bf-orb"></span>${apps.map((k, i) => `<span class="bf-app" style="--a:${(360 / apps.length) * i}deg;--i:${i}">${icon(k, 30)}</span>`).join('')}</div>
      <p class="bf-msg">Reading your request…</p><div class="bf-bar"><i></i></div></div>`;
    out.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const msg = $('.bf-msg', out), forge = $('.bl-forge', out);
    const lines = ['Reading your request…', `Found ${apps.filter(k => NAME[k]).length || 'your'} app${apps.filter(k => NAME[k]).length === 1 ? '' : 's'}…`, 'Wiring the steps together…', 'Adding the safety net…'];
    for (let i = 0; i < lines.length; i++) { msg.textContent = lines[i]; msg.classList.remove('in'); void msg.offsetWidth; msg.classList.add('in'); forge.style.setProperty('--p', (i + 1) / lines.length); await sleep(620); if (id !== job) return; }
    forge.classList.add('charge'); await sleep(520); if (id !== job) return;
    forge.classList.add('boom'); box.classList.add('shake');
    const burst = document.createElement('div'); burst.className = 'bf-burst';
    burst.innerHTML = Array.from({ length: 28 }, (_, i) => `<i style="--r:${Math.random() * 360}deg;--d:${120 + Math.random() * 220}px;--s:${.5 + Math.random()}"></i>`).join('');
    forge.appendChild(burst);
    await sleep(650); box.classList.remove('shake'); if (id !== job) return;
  }
  /* ---------- the sketch, drawn like the real n8n and Make editors ---------- */
  sketch = { steps, known, hours, text, tool: sketch && sketch.tool || 'n8n', picked: null, tab: 'explain' };
  out.innerHTML = `<div class="bl-ed reveal" aria-live="polite">
      <div class="bl-tool" role="tablist" aria-label="Show the workflow in">
        <span>See it in</span>
        <button type="button" role="tab" data-tool="n8n">${logo('n8n', 16)}n8n</button>
        <button type="button" role="tab" data-tool="make">${logo('make', 16)}Make</button>
        <em class="bl-tip">Click any step to see what it does</em>
      </div>
      <div class="ed-window bl-win"></div>
      <div class="bl-sum" hidden></div>
    </div>`;
  out.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  drawEditor(true);
  await playRun(id, true); if (id !== job) return;
  const brief = `Hi Simeon, I'd like this automated:\n\n"${text}"\n\nThe sketch on your site came out as:\n${steps.map((s, i) => `${i + 1}. ${s.n} (${s.t})`).join('\n')}`;
  const sum = $('.bl-sum', out); sum.hidden = false;
  sum.innerHTML = `<div><p><b>${steps.length} steps</b>${known ? `, ${known} app${known > 1 ? 's' : ''}` : ''}. A build like this usually takes <b>${hours <= 4 ? '2 to 4' : hours <= 7 ? '3 to 7' : '5 to 10'} days</b>.</p>
    <p class="bl-fine">This is a first sketch from your words, in the editor I would build it in. On a short call I confirm the details and give you a fixed price.</p></div>
    <div class="bl-cta"><a class="btn signal" target="_blank" rel="noopener" href="https://wa.me/${(window.SITE && window.SITE.whatsapp) || '2348110117004'}?text=${encodeURIComponent(brief)}">Send this to me <span class="arr">→</span></a>
    <a class="btn ghost" href="mailto:${(window.SITE && window.SITE.email) || 'simeono.automation@gmail.com'}?subject=${encodeURIComponent('Workflow sketch from your site')}&body=${encodeURIComponent(brief)}">By email</a></div>`;
  btn.disabled = false; btn.classList.remove('busy'); btn.querySelector('span').textContent = 'Build again';
};
})();
