/* "Describe it, watch it build": the visitor types what they want automated and a workflow sketch is drawn
   from their words, step by step, with the real app logos. It runs in the browser, no AI call: the words are
   matched to apps and actions, so the sketch is honest about being a first draft. */
(() => {
const root = document.getElementById('build'); if (!root) return;
const $ = (s, el = root) => el.querySelector(s), $$ = (s, el = root) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const logo = (k, n) => (window.logo ? window.logo(k, n) : '');
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
];

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
chips.innerHTML = EXAMPLES.map((e, i) => `<button type="button" data-ex="${i}">${esc(e.split(',')[0])}…</button>`).join('');
chips.onclick = e => { const b = e.target.closest('[data-ex]'); if (!b) return; input.value = EXAMPLES[+b.dataset.ex]; input.focus(); form.requestSubmit(); };
input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) { e.preventDefault(); form.requestSubmit(); } });
let job = 0;
form.onsubmit = async e => {
  e.preventDefault();
  const text = input.value.trim();
  if (text.length < 12) { $('.bl-err').textContent = 'Tell me a little more: what happens first, and what should happen next?'; input.focus(); return; }
  $('.bl-err').textContent = '';
  const id = ++job, { steps, known, hours } = plan(text), sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  root.classList.add('has-out'); out.hidden = false;
  const btn = $('.bl-go'); btn.disabled = true; btn.classList.add('busy');
  out.innerHTML = `<div class="bl-canvas" aria-live="polite">
      <div class="bl-bar"><span>${logo('n8n', 16)}<b>New workflow</b></span><span class="bl-state"><i></i><em>Reading your request…</em></span></div>
      <div class="bl-flow"></div>
    </div>
    <aside class="bl-plan"><p class="k">The plan</p><ol></ol><div class="bl-sum" hidden></div></aside>`;
  const flow = $('.bl-flow', out), list = $('.bl-plan ol', out), state = $('.bl-state em', out);
  out.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  await sleep(700); if (id !== job) return;
  state.textContent = 'Building…';
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    flow.insertAdjacentHTML('beforeend', `${i ? '<i class="bl-wire"></i>' : ''}<div class="bl-node${s.trig ? ' trig' : ''}${s.extra ? ' extra' : ''}" data-i="${i}"><span class="bl-face">${icon(s.k, 34)}${s.trig ? '<i class="bolt">⚡</i>' : ''}<i class="ck">✓</i></span><b>${esc(s.n)}</b><small>${esc(s.t)}</small></div>`);
    list.insertAdjacentHTML('beforeend', `<li data-i="${i}"><span class="bl-li-ic">${icon(s.k, 20)}</span><div><b>${esc(s.n)}</b><p>${esc(s.d)}</p></div></li>`);
    await sleep(520); if (id !== job) return;
  }
  state.textContent = 'Test run…';
  for (let i = 0; i < steps.length; i++) {
    $$('.bl-node', flow).forEach(n => n.classList.toggle('bl-run', +n.dataset.i === i));
    await sleep(380); if (id !== job) return;
    $(`.bl-node[data-i="${i}"]`, flow).classList.add('bl-ok'); $(`.bl-plan li[data-i="${i}"]`, out).classList.add('bl-ok');
    if (i) $$('.bl-wire', flow)[i - 1].classList.add('bl-ok');
  }
  $$('.bl-node', flow).forEach(n => n.classList.remove('bl-run'));
  $('.bl-state', out).classList.add('done'); state.textContent = 'Sketch ready';
  const brief = `Hi Simeon, I'd like this automated:\n\n"${text}"\n\nThe sketch on your site came out as:\n${steps.map((s, i) => `${i + 1}. ${s.n} (${s.t})`).join('\n')}`;
  const sum = $('.bl-sum', out); sum.hidden = false;
  sum.innerHTML = `<p><b>${steps.length} steps</b>${known ? `, ${known} app${known > 1 ? 's' : ''}` : ''}. A build like this usually takes <b>${hours <= 4 ? '2 to 4' : hours <= 7 ? '3 to 7' : '5 to 10'} days</b>.</p>
    <p class="bl-fine">This is a first sketch from your words. On a short call I confirm the details and give you a fixed price.</p>
    <div class="bl-cta"><a class="btn signal" target="_blank" rel="noopener" href="https://wa.me/${(window.SITE && window.SITE.whatsapp) || '2348110117004'}?text=${encodeURIComponent(brief)}">Send this to me <span class="arr">→</span></a>
    <a class="btn ghost" href="mailto:${(window.SITE && window.SITE.email) || 'simeono.automation@gmail.com'}?subject=${encodeURIComponent('Workflow sketch from your site')}&body=${encodeURIComponent(brief)}">By email</a></div>`;
  btn.disabled = false; btn.classList.remove('busy'); btn.querySelector('span').textContent = 'Build again';
};
})();
