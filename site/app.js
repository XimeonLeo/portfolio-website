/* Simeon Onabowale portfolio — all interactivity, no dependencies. */
(() => {
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- nav ---------- */
const nav = $('#nav');
addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });
$('#menuBtn').onclick = () => { const o = nav.classList.toggle('menu'); $('#menuBtn').setAttribute('aria-expanded', o); };
$$('.nav-links a').forEach(a => a.onclick = () => nav.classList.remove('menu'));
$('#yr').textContent = new Date().getFullYear();

/* ---------- reveal + counters ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); io.unobserve(e.target);
  const n = e.target.querySelector('[data-count]'); if (n) count(n);
}), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
$$('[data-r]').forEach((el, i) => { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
function count(el) {
  const to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), d = reduce ? 1 : 1400;
  const step = t => { const p = Math.min(1, (t - t0) / d), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
    el.textContent = v.toLocaleString('en-US') + suf; if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/* ---------- marquee ---------- */
const tools = ['n8n', 'Claude', 'Claude Code', 'GoHighLevel', 'Google Drive', 'Google Sheets', 'WhatsApp Business API', 'Twilio', 'Vapi', 'Retell AI', 'HubSpot', 'Airtable', 'OpenAI', 'Stripe', 'Shopify', 'Gmail', 'Fillable PDFs', 'Webhooks', 'REST APIs', 'Companies House'];
$('#marquee').innerHTML = [...tools, ...tools].map(t => `<span>${t}</span>`).join('');

/* ---------- hero console ---------- */
const RUNS = [
  { id: 'closing', tab: 'closing-packet', title: 'closing-packet · production', run: 4127, lines: [
    ['s', '<b>Drive trigger</b> <span>new file in 1 - Inbox</span>'],
    ['s', '<b>Binder.pdf</b> <span>213 pages · 24 scanned</span>'],
    ['s', '<b>Claude</b> <span>read Schedule A, B-I, judgments</span>'],
    ['s', '<b>validate.js</b> <span>41 fields · shape OK</span>'],
    ['w', '<b>Review sheet</b> <span>row added · Needs review</span>'],
    ['s', '<b>Approved</b> <span>by office · 2 sellers</span>'],
    ['s', '<b>Fill template</b> <span>Deed, Affidavit, FIRPTA, POA, 1099-S</span>'],
    ['s', '<b>State forms</b> <span>GIT/REP-3 + RTF-1 · 82 fields</span>'],
    ['s', '<b>Merge</b> <span>14-page packet · editable</span>'],
    ['s', '<b>Saved</b> <span>to matter folder · office notified</span>'],
  ]},
  { id: 'tracker', tab: 'matter-tracker', title: 'matter-tracker · production', run: 812, lines: [
    ['s', '<b>Drop folder</b> <span>3 new files</span>'],
    ['s', '<b>Claude</b> <span>classify → Smoke/CO certificate</span>'],
    ['s', '<b>Match</b> <span>matter key "2 Windham Ct"</span>'],
    ['s', '<b>Filed</b> <span>checklist: Smoke/CO ✓</span>'],
    ['w', '<b>Claude</b> <span>classify → Mortgage commitment</span>'],
    ['w', '<b>No matter yet</b> <span>held as Waiting · auto-files later</span>'],
    ['s', '<b>Seller form</b> <span>answers matched by address</span>'],
    ['s', '<b>08:00 digest</b> <span>3 open matters · 5 docs missing</span>'],
    ['s', '<b>Email sent</b> <span>to the office</span>'],
  ]},
  { id: 'leads', tab: 'lead-engine', title: 'lead-engine · run 2026-11-04', run: 26, lines: [
    ['s', '<b>grab</b> <span>plumbers · 9 UK cities · 1,284 listings</span>'],
    ['s', '<b>filter</b> <span>chains + duplicates removed → 811</span>'],
    ['s', '<b>scan</b> <span>websites checked for booking, chat, reviews</span>'],
    ['w', '<b>owners</b> <span>Companies House throttle 1.5 s</span>'],
    ['s', '<b>owners</b> <span>director found for 47%</span>'],
    ['s', '<b>shortlist</b> <span>gap + email + owner → 214</span>'],
    ['s', '<b>Claude</b> <span>writes pitch naming each gap</span>'],
    ['s', '<b>verify</b> <span>email shape + facts checked</span>'],
    ['s', '<b>merge</b> <span>master CSV + files of 100</span>'],
  ]},
  { id: 'onboard', tab: 'ghl-onboarding', title: 'GoHighLevel · preparer onboarding', run: 58, lines: [
    ['s', '<b>Form submitted</b> <span>new preparer</span>'],
    ['s', '<b>Contact</b> <span>created · tag "sst applicant"</span>'],
    ['s', '<b>Agreement</b> <span>sent directly · 4 signature fields</span>'],
    ['w', '<b>Wait</b> <span>for signature…</span>'],
    ['s', '<b>Signed</b> <span>tag "sst agreement signed"</span>'],
    ['s', '<b>Welcome email</b> <span>branded template v4 delivered</span>'],
    ['s', '<b>Owner notified</b> <span>preparer ready to start</span>'],
  ]},
];
let cIdx = 0, cTimer = null;
const cTabs = $('#cTabs'), cBody = $('#cBody');
cTabs.innerHTML = RUNS.map((r, i) => `<button role="tab" data-i="${i}">${r.tab}</button>`).join('');
cTabs.onclick = e => { const b = e.target.closest('button'); if (b) playConsole(+b.dataset.i, true); };
function playConsole(i, manual) {
  clearTimeout(cTimer); cIdx = i; const r = RUNS[i];
  $$('button', cTabs).forEach((b, j) => b.classList.toggle('on', j === i));
  $('#cTitle').textContent = r.title; cBody.innerHTML = '';
  const runNo = r.run + Math.floor(Math.random() * 9);
  $('#cFootL').textContent = `run #${runNo.toLocaleString('en-US')}`;
  $('#cFootR').innerHTML = '<b>running…</b>';
  const start = new Date(); let k = 0, secs = 0;
  const next = () => {
    if (k >= r.lines.length) {
      $('#cFootR').innerHTML = `<b>✓ success · ${secs.toFixed(1)} s · 0 errors</b>`;
      cTimer = setTimeout(() => playConsole((cIdx + 1) % RUNS.length), 3200); return;
    }
    const [st, msg] = r.lines[k++]; secs += .4 + Math.random() * 2.2;
    const t = new Date(start.getTime() + secs * 1000).toTimeString().slice(0, 8);
    const row = document.createElement('div'); row.className = 'log';
    row.innerHTML = `<span class="t">${t}</span><span class="s ${st === 'w' ? 'w' : ''}">${st === 'w' ? '◐' : '✓'}</span><span class="m">${msg}</span>`;
    cBody.appendChild(row);
    while (cBody.scrollHeight > cBody.clientHeight + 30 && cBody.children.length > 1) cBody.firstElementChild.remove();
    cTimer = setTimeout(next, reduce ? 50 : 520 + Math.random() * 380);
  };
  next();
}
playConsole(0);

/* ---------- leak finder ---------- */
const LEAKS = [
  { id: 'law', name: 'Law & title office', sub: 'closings, matters', tasks: [
    ['Reading title binders for sale details', 'Retyped from 200-page PDFs', 'Claude extracts, code validates, staff approve', 6, .5],
    ['Drafting deed, affidavits, state forms', 'Copy-paste into Word templates', 'Signing-ready packet generated in minutes', 5, .3],
    ['Chasing missing documents', 'Inbox searches and phone calls', 'Checklist ticks itself, 8:00 digest lists gaps', 4, .5],
    ['Collecting seller information', 'Back-and-forth emails', 'Personal form link sent when the contract lands', 2, .2],
  ]},
  { id: 're', name: 'Real estate team', sub: 'leads, follow-up', tasks: [
    ['Following up new leads', 'Whenever someone remembers', 'Text + email within 60 seconds, then a 14-day sequence', 6, .5],
    ['Moving deals through stages', 'Updated on Friday, if at all', 'Pipeline moves on replies, bookings and signatures', 3, .3],
    ['Asking for reviews after closing', 'Forgotten most of the time', 'Review request fires on "Closed" with a reminder', 1.5, 0],
    ['Booking showings', 'Phone tag', 'Calendar link + reminders + no-show recovery', 3, .5],
  ]},
  { id: 'clinic', name: 'Clinic or practice', sub: 'patients, bookings', tasks: [
    ['Answering the same patient questions', 'Front desk, all day', 'WhatsApp + website assistant trained on your services', 8, 1],
    ['Booking and rescheduling', 'Phone and DMs', 'Assistant books straight into your calendar', 5, .5],
    ['Appointment reminders', 'Manual texts the day before', 'SMS/WhatsApp at 48 h and 2 h, with confirm buttons', 3, 0],
    ['Missed calls', 'Lost to voicemail', 'Instant text-back, or an AI voice agent picks up', 2, .2],
  ]},
  { id: 'trades', name: 'Trades & home services', sub: 'quotes, jobs', tasks: [
    ['Chasing quotes nobody answered', 'Rarely done', 'Day 2 and day 7 follow-ups, stop on reply', 3, 0],
    ['Answering calls on the job', 'Missed while on a roof', 'AI receptionist takes details and books the visit', 4, .3],
    ['Service reminders', 'Spreadsheet, maybe', 'Yearly reminders sent from the job history', 1.5, 0],
    ['Getting reviews', 'Ask in person, forget', 'Review link sent when the invoice is paid', 1, 0],
  ]},
  { id: 'agency', name: 'Agency or consultancy', sub: 'onboarding, reporting', tasks: [
    ['Onboarding new clients', 'Contract, invoice, folders by hand', 'Signed → paid → workspace + welcome, automatically', 4, .4],
    ['Weekly client reporting', 'Screenshots pasted into decks', 'Data pulled, AI summary written, numbers checked', 5, .5],
    ['Lead research for outreach', 'Interns and spreadsheets', 'Engine finds, qualifies and drafts personalised pitches', 8, 1],
    ['Updating the CRM after calls', 'Never quite done', 'Call notes become CRM updates and next steps', 3, .3],
  ]},
];
let leak = LEAKS[0], mode = 'manual';
const side = $('#leakSide');
side.innerHTML = LEAKS.map((l, i) => `<button role="tab" data-i="${i}"><span class="ix">0${i + 1}</span><span>${l.name}<small>${l.sub}</small></span></button>`).join('');
side.onclick = e => { const b = e.target.closest('button'); if (b) { leak = LEAKS[+b.dataset.i]; renderLeak(); } };
$$('.toggle button').forEach(b => b.onclick = () => { mode = b.dataset.mode; renderLeak(); });
['cPeople', 'cRate', 'cWeeks'].forEach(id => $('#' + id).oninput = calc);
function renderLeak() {
  $$('button', side).forEach(b => b.classList.toggle('on', LEAKS[+b.dataset.i] === leak));
  $$('.toggle button').forEach(b => { b.classList.toggle('on', b.dataset.mode === mode); b.classList.toggle('auto', b.dataset.mode === 'auto'); });
  $('#leakMain').classList.toggle('auto-on', mode === 'auto');
  $('#leakTitle').textContent = leak.name;
  const max = Math.max(...leak.tasks.map(t => t[3]));
  $('#tasks').innerHTML = leak.tasks.map(([n, by, auto, h, a]) => {
    const v = mode === 'auto' ? a : h;
    return `<div class="task"><div><div class="nm">${n}</div><div class="how">${mode === 'auto' ? '↳ ' + auto : by}</div></div><div class="hrs">${fmtH(v)} / wk</div><div class="bar"><i style="width:${Math.max(2, v / max * 100)}%"></i></div></div>`;
  }).join('');
  calc();
}
const fmtH = h => (h % 1 ? h.toFixed(1) : h) + ' h';
function calc() {
  const p = +$('#cPeople').value, r = +$('#cRate').value, w = +$('#cWeeks').value;
  $('#oPeople').textContent = p; $('#oRate').textContent = '$' + r; $('#oWeeks').textContent = w;
  const now = leak.tasks.reduce((s, t) => s + t[3], 0), after = leak.tasks.reduce((s, t) => s + t[4], 0);
  const saved = (now - after) * p * w;
  $('#sumNow').textContent = fmtH(now); $('#sumAfter').textContent = fmtH(after);
  $('#sumYear').textContent = Math.round(saved).toLocaleString('en-US') + ' h';
  $('#sumYearLbl').textContent = `back a year · worth about $${Math.round(saved * r).toLocaleString('en-US')}`;
}
renderLeak();

const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));

/* ---------- case studies ---------- */
/* extra images per case study: [file, caption] */
const SHOTS = {"closing":[["shot-closing-1","The intake workflow in n8n: binder in, review row out"],["shot-closing-2","The generation workflow: template, state forms and the merged packet"]],"assist":[["shot-assist-1","The live demo page for the assistant"]],"dlaw":[["shot-dlaw-1","The enquiry form being filled in"],["shot-dlaw-2","The intake sheet: summary and conflict check"],["shot-dlaw-3","The engagement letter, drafted in Google Docs"]],"drealty":[["shot-drealty-1","The website enquiry form"],["shot-drealty-2","The lead in the CRM sheet, scored Hot"],["shot-drealty-3","The reply text and the agent alert in the outbox"]],"dclinic":[["shot-dclinic-1","Appointments stamped after the run"],["shot-dclinic-2","The four texts and the front-desk list"]],"dcoach":[["shot-dcoach-1","The CRM row, filled in from the call"],["shot-dcoach-2","The proposal, drafted in Google Docs"],["shot-dcoach-3","Outcomes and approach, taken from the call"]],"dbooks":[["shot-dbooks-1","A clean invoice passing every check"],["shot-dbooks-2","Booked: one row in the books"],["shot-dbooks-3","Stopped: the total does not add up"]],"dwhatsapp":[["shot-dwhatsapp-1","The conversation, with the workflow log beside it"],["shot-dwhatsapp-2","The booking in the calendar sheet"],["shot-dwhatsapp-3","The finished run in n8n"]],"dwebchat":[["shot-dwebchat-1","The assistant declines to quote a price"],["shot-dwebchat-2","It asks for a name before booking the call"]],"dcrm":[["shot-dcrm-1","Every deal with a health and a next step"],["shot-dcrm-2","The nine tasks it created"],["shot-dcrm-3","Follow-up emails drafted for the owner"]]};
const CASES = {
  dwhatsapp: {"tags":["Demo build","n8n","Claude","Google Sheets","Healthcare"],"title":"WhatsApp assistant that books appointments","sub":"Demo build with made-up sample data. The chat screen is a WhatsApp-style stand-in; the replies come from the live workflow.","demo":true,"problem":"Most clinic messages are the same few questions (hours, parking, can I book) and they arrive when the front desk is busy or closed. Every unanswered message is a booking that may go elsewhere.","built":["A webhook that receives each message, standing in for the WhatsApp Business connection a live build would use","Answers come only from the clinic's own notes, kept in a sheet the staff can edit","Free slots are worked out in code from the bookings sheet, so the assistant can only offer a time that is really free","A booking is only accepted if the name, the appointment type and the slot all pass a check in code","It never asks why the patient wants to be seen, and points anything urgent to emergency services","If the patient asks for a person, the front desk is alerted with the last message"],"changed":"In the recording, a patient asks about Saturday opening, asks for a check-up, and picks the first slot offered. Three messages in, the booking is in the calendar sheet and the front desk has been told. Replies took 8 to 10 seconds each in this run.","results":[["3","messages to a confirmed booking"],["8-10 s","per reply, measured"],["16","steps"],["0","slots offered that were not free"]],"stack":"n8n · Claude · Google Sheets · Webhooks · JavaScript"},
  dwebchat: {"tags":["Demo build","n8n","Claude","Google Sheets","Coaching"],"title":"Website chatbot that captures leads","sub":"Demo build with made-up sample data. Messages go to a test outbox instead of being sent.","demo":true,"problem":"Visitors to a coach or consultant's site have two or three questions before they will book a call. If nobody answers, they leave, and the owner never knows they were there.","built":["A chat widget on the site that sends each message to an n8n workflow","Answers come only from the firm's own notes, and the conversation so far is loaded each time so it keeps context","A price guard in code: if a reply ever contains a price, it is replaced with an offer of a discovery call","A lead is only saved once the visitor has given both a name and a valid email","The lead goes into a sheet and the owner is told straight away","Every message is logged, so the owner can read what visitors actually ask"],"changed":"In the recording, a visitor asks what the 12-week programme costs. The assistant explains that prices are confirmed on a call, answers a question about employer-paid coaching, then takes a name and email and confirms the details are saved.","results":[["0","prices invented by the bot"],["3","messages to a saved lead"],["13","steps"],["1","guard in code on every reply"]],"stack":"n8n · Claude · Google Sheets · Webhooks · JavaScript"},
  dcrm: {"tags":["Demo build","n8n","Claude","Google Sheets","Sales"],"title":"CRM follow-up that runs every morning","sub":"Demo build with made-up sample data. Messages go to a test outbox instead of being sent.","demo":true,"problem":"Deals go quiet because nobody remembers to follow up. The owner only finds out at the end of the month, when the pipeline is full of proposals that were never chased.","built":["A run every weekday at 8:00 that loads the whole pipeline","Plain rules per stage decide each deal's health and next step, so the same deal always gets the same answer","Tasks are created with an owner, a due date and the reason","Won deals get three onboarding tasks; lost deals get a check-back in 60 days","For deals that have gone quiet, Claude drafts a short follow-up with no prices or discounts, saved as a draft for the owner","A one-paragraph morning summary of what is open, at risk and won"],"changed":"In the recording, one run over 8 sample deals marks two as at risk and two as needing follow-up, creates 9 tasks, drafts 2 follow-up emails and writes the morning summary. A CRM such as HubSpot or GoHighLevel would take the place of the sheet in a live build.","results":[["8","sample deals assessed"],["9","tasks created"],["2","follow-ups drafted"],["14","steps"]],"stack":"n8n · Claude · Google Sheets · JavaScript"},
  dlaw: {"tags":["Demo build","n8n","Claude","Google Docs & Sheets","Legal"],"title":"New-client intake to engagement letter","sub":"Demo build with made-up sample data. Messages go to a test outbox instead of being sent.","demo":true,"problem":"A small law office gets enquiries by form, phone and email. Someone has to read each one, check the client list for a conflict, work out what the job is and draft an engagement letter, usually days later.","built":["An intake form that feeds straight into the workflow","A conflict check done by exact rules in code against the client list, never by AI","Claude writes a two-sentence summary, the practice area, the urgency and a one-line scope","If a conflict is found, the enquiry is put on hold and the attorney is alerted. Nothing goes to the enquirer","If it is clear, an engagement letter is drafted in Google Docs from the firm's wording and filed","A second trigger: the letter is only queued to send after the attorney sets the row to Approved"],"changed":"In the recording, a sample enquiry about a house sale is submitted. The run finishes in about 9 seconds: a row appears in the intake sheet with the summary and a clear conflict check, and the drafted letter opens in Google Docs. A second test with an existing client as the other party was correctly put on hold.","results":[["19","steps on one canvas"],["9 s","measured run, form to drafted letter"],["2","paths tested: clear and conflict"],["0","letters sent without approval"]],"stack":"n8n · Claude · Google Sheets · Google Docs · JavaScript"},
  drealty: {"tags":["Demo build","n8n","Claude","Google Sheets","Real estate"],"title":"Speed-to-lead responder","sub":"Demo build with made-up sample data. Messages go to a test outbox instead of being sent.","demo":true,"problem":"A buyer who fills in a form at 9 pm usually hears back the next morning, after they have already messaged two other agents. Missed calls are worse: most never get a call back at all.","built":["Two ways in: the website form and a missed-call webhook from the phone system","A lead score worked out by rules in code (timeline, budget, intent), so it is the same every time and the agent can see why","Claude writes a short, specific first text that ends with one easy question","A length and format check on the reply, with a safe fallback message","Every lead saved to the CRM sheet with its score, the reason and the reply time","Hot leads alert the agent with viewing slots to offer. The rest get a scheduled follow-up"],"changed":"In the recording, a sample buyer asks about a 2-bed condo. The whole run takes 10 seconds: the lead is scored 85 out of 100, a personal text is written and queued, the CRM row is added, and the agent gets an alert with three viewing slots. A missed-call test got an apology text and a follow-up instead.","results":[["10 s","full run, measured"],["85/100","score for the sample lead"],["2","ways in: form and missed call"],["13","steps"]],"stack":"n8n · Claude · Google Sheets · Webhooks · JavaScript"},
  dclinic: {"tags":["Demo build","n8n","Google Sheets","Healthcare"],"title":"Reminders, no-show recovery and reviews","sub":"Demo build with made-up sample data. Messages go to a test outbox instead of being sent.","demo":true,"problem":"Front-desk staff spend the first hour of the day phoning tomorrow's patients, no-shows leave gaps nobody fills, and review requests only happen when someone remembers.","built":["A check every 15 minutes against the appointment list","Plain rules decide what each appointment needs: a 48-hour reminder, a 2-hour reminder, a rebooking offer or a review request","No AI anywhere in this one, on purpose: every message is a fixed template","Messages never mention the reason for the visit, the clinician or any health detail","The same review request goes to every patient. Nobody is filtered","Each appointment is stamped so nothing is sent twice, and the front desk gets a short list of who to call"],"changed":"In the recording, one run over six sample appointments queues four texts (one of each kind), stamps the four appointments, and writes the front-desk list naming the one patient to call.","results":[["4","message types from one run"],["0","AI steps: plain rules"],["0","health details in any message"],["15 min","check interval"]],"stack":"n8n · Google Sheets · JavaScript"},
  dcoach: {"tags":["Demo build","n8n","Claude","Google Drive & Docs","Coaching"],"title":"Discovery call to proposal","sub":"Demo build with made-up sample data. Messages go to a test outbox instead of being sent.","demo":true,"problem":"After a good discovery call, the notes, the CRM update, the proposal and the follow-up email are an hour of writing. They often slip to the next day, when the prospect has cooled.","built":["A Drive folder watched for new call transcripts","Claude pulls out goals, challenges, likely objections and next steps, using only what was said on the call","It recommends one programme from a fixed list, so it cannot invent an offer","A proposal is drafted in Google Docs with headings, and the fee is left as a blank for the coach to fill","The CRM row is updated with the notes and a link to the proposal","The follow-up email is saved as a draft. Nothing is sent until the coach has read it"],"changed":"In the recording, a sample transcript with an operations director is dropped in. The run produces the notes, recommends the 12-week programme, fills the CRM row and opens a proposal with three measurable outcomes taken from the call.","results":[["10","steps"],["1","proposal drafted per call"],["3","outcomes pulled from the call"],["0","emails sent without review"]],"stack":"n8n · Claude · Google Drive · Google Docs · Google Sheets"},
  dbooks: {"tags":["Demo build","n8n","Claude","Google Drive & Sheets","Back office"],"title":"Invoice inbox to books","sub":"Demo build with made-up sample data. Messages go to a test outbox instead of being sent.","demo":true,"problem":"Supplier invoices arrive as PDFs and get typed into a spreadsheet by hand. Wrong totals and invoices sent twice are only noticed when the money has already gone out.","built":["A Drive folder watched for new invoice PDFs","Claude reads the vendor, number, dates, line items and totals, copying the numbers exactly as printed","Eight checks in code: required fields, each line, the subtotal, the total, and a duplicate check against the books. Money is compared in cents","Invoices that pass go straight into the books sheet","Anything that fails goes to an approval queue with the exact reason, and the owner is told","The file is moved to a processed folder either way"],"changed":"In the recording, a clean invoice for $657.64 is booked. A second one printed with a total $100 higher than its lines is stopped with the message \"Subtotal + tax is 1075.00 but the total says 1175.00\". A third test, the first invoice sent again, was caught as a duplicate.","results":[["3","sample invoices: booked, flagged, duplicate"],["8","checks in code per invoice"],["12","steps"],["0","AI decisions about money"]],"stack":"n8n · Claude (PDF reading) · Google Drive · Google Sheets · JavaScript"},
  closing: { tags: ['● Live', 'n8n', 'Claude', 'Google Drive', 'Legal'], title: 'Closing documents drafted from a 200-page title binder',
    sub: 'For a seller-side real-estate law office in New Jersey. In daily use since October 2026.',
    problem: 'For every sale, staff read a 200-page title binder, partly scanned, and retyped names, vesting, deed references and property details into a Word template and two official state forms. An afternoon per file, and a typo in a deed is expensive.',
    built: ['A Drive-triggered n8n workflow that sends the binder to Claude and gets back one structured JSON record', 'A validation layer in code: field shapes, seller cross-checks against the deed requirement, ZIP codes that keep their leading zero', 'A review sheet that colour-codes what came from the binder and what staff still need to add, with nothing drafted until a person approves', 'Generation that fills the firm\'s own Word template (one- and two-seller versions) plus the official GIT/REP-3 and RTF-1 PDFs, left editable', 'An error-alert workflow and a plain-English handover guide'],
    changed: 'The office drops the binder in a folder, checks one row and approves. A 12 to 14-page signing packet lands in a new matter folder. Follow-up requests from the attorney (optional fields, a wire form page, page breaks, single-seller logic) were each live within a day.',
    results: [['14 pp', 'packet per sale'], ['82', 'state-form fields filled'], ['7', 'documents per packet'], ['< 1 day', 'turnaround on change requests']], stack: 'n8n Cloud · Claude · Google Drive & Sheets · Word templating · fillable PDFs · JavaScript' },
  matters: { tags: ['● Live', 'n8n', 'Claude', 'Google Workspace', 'Legal'], title: 'A matter tracker that files every document by itself',
    sub: 'A follow-on build for the same law office, after the attorney asked for a per-sale checklist.',
    problem: 'Documents for each sale (smoke certificates, surveys, mortgage commitments, contracts) arrived by email, from agents, in scans. Knowing what was still missing meant opening every file.',
    built: ['One drop folder: Claude classifies each document against the firm\'s own checklist and picks the matter it belongs to, from fixed lists so it can\'t invent an answer', 'Matters open automatically when a signed contract goes through the contract checker', 'Documents that arrive before their matter exists wait and file themselves later', 'A seller information form sent at the start of the transaction, matched by property address', 'A Monday-to-Friday 8:00 digest email of every open matter and its gaps'],
    changed: 'Nobody sorts documents by hand. The office starts each day knowing exactly what to chase, and sellers fill in their details before the binder even arrives.',
    results: [['1', 'drop folder for everything'], ['36', 'node workflow, live'], ['8:00', 'weekday digest'], ['0', 'manual filing']], stack: 'n8n Cloud · Claude (structured outputs) · Google Drive, Sheets & Forms · Gmail' },
  leads: { tags: ['Node.js', 'Claude Code', 'Companies House', 'Lead gen'], title: 'A lead engine that researches 1,000 businesses a run',
    sub: 'My own outbound system, built to be handed to a teammate and run daily.',
    problem: 'Cold outreach only works when the email is about the business, not a template. Researching that by hand caps you at a few dozen leads a day.',
    built: ['A config-driven pipeline: grab listings → filter → scan websites for gaps → find the owner on Companies House → shortlist', 'Parallel Claude Code helpers that research 25 leads each and write a pitch naming the specific gap', 'check.js and verify.js gates for email shape and factual accuracy, then one master CSV plus files of 100', 'A shared throttle that pauses on 403s, after learning that parallel lookups silently turned into "not found"'],
    changed: 'One run produced 1,000+ researched UK leads across trades, each with a personal pitch about call answering, booking, quote follow-up or reviews.',
    results: [['1,000+', 'leads in one run'], ['~45%', 'pass email + gap checks'], ['25', 'leads per helper'], ['1', 'combined file']], stack: 'Node.js · Claude Code · Companies House · web scanning · CSV' },
  onboard: { tags: ['● Live', 'GoHighLevel', 'Onboarding'], title: 'Tax-preparer onboarding that signs, tags and welcomes itself',
    sub: 'For a US tax office that onboards independent preparers every season.',
    problem: 'The owner sent agreements, checked who had signed and wrote welcome emails by hand. The existing workflow had a broken check, so some people got nothing.',
    built: ['Fixed the failing condition in the onboarding workflow', 'Agreement sent directly with required signature fields (name, PTIN, signature, date)', 'Two helper workflows that tag contacts when they sign and when they pay', 'A branded welcome email template, rewritten in plain language', 'Before/after reports and a how-to guide for the team'],
    changed: 'New preparers get the agreement, sign it and receive the welcome without the owner touching anything. Milestone approved and all three workflows published.',
    results: [['3', 'workflows published'], ['4', 'required signature fields'], ['0', 'manual follow-ups']], stack: 'GoHighLevel workflows · Documents & Contracts · email templates · tags' },
  assist: { tags: ['n8n', 'WhatsApp', 'Website chat', 'Voice AI'], title: 'AI receptionists for clinics and local businesses',
    sub: 'A reusable kit I use to build assistants for dental clinics, recruiters and service businesses.',
    problem: 'Small businesses miss enquiries after hours and on busy days, and every new assistant used to be built from scratch.',
    built: ['One config per business: services, hours, tone, booking rules, all researched from their own website', 'The same brain on three channels: WhatsApp, a website widget and a live browser voice call', 'An n8n + AI backend for live answers, with a scripted preview mode for fast first demos', 'A public showcase page personalised by URL for each prospect'],
    changed: 'A new business-specific assistant goes from idea to demo in an afternoon instead of days.',
    results: [['3', 'channels, one brain'], ['24/7', 'answers & bookings'], ['1', 'config per business']], stack: 'n8n · OpenAI · Vapi voice · WhatsApp · Netlify', link: ['Try the live demo', 'chatbot-demo/', 'chat'] },
  desk: { tags: ['Product design', 'n8n', 'Web app', 'Legal'], title: 'Closing Desk: an in-house app to replace a $139/user tool',
    sub: 'A proposal and working demo for the law office whose pipelines I built.',
    problem: 'The office\'s case-management tool was forcing a move to a new version with a new API that wasn\'t live yet, so their automation had nothing to plug into. They were switching systems either way.',
    built: ['A full audit of the existing product\'s modules from its public app bundle, without needing an admin login', 'A brand kit measured from the firm\'s website', 'A clickable demo: matters board, seller net sheet with verified New Jersey transfer-fee maths, client portal and review requests', 'A build plan that reuses the live n8n pipelines as the engine'],
    changed: 'The firm has a concrete path off per-seat software, onto an app it owns that its existing automations already feed.',
    results: [['Full', 'module audit'], ['Working', 'clickable demo'], ['0', 'per-seat fees']], stack: 'Audit · product design · web app · n8n integration' },
  realty: { tags: ['GoHighLevel', 'Real estate', 'Roadmap'], title: '"Keys to Close": a GoHighLevel system for a new realtor',
    sub: 'For a newly licensed realtor and loan officer in Arizona, working from a shared team account.',
    problem: 'She had GoHighLevel and leads from expired listings and farm lists, but no structure: no pipelines, no fields, no follow-up, and no idea where to start.',
    built: ['An audit of the account and a seven-phase roadmap, from "Inspection & Repairs" to "Closing Table" and "Expansion"', 'Pipelines, 11 custom fields and a tag system for her lead sources', 'Compliance-first decisions, like no cold texting to expired or farm lists', 'Every change documented as Before / After / Why / Where, with screenshots, so teammates can be onboarded'],
    changed: 'A clear, phased system she understands, built in an order that gets her to more closed deals instead of more settings.',
    results: [['7', 'phases planned'], ['11', 'custom fields'], ['100%', 'changes documented']], stack: 'GoHighLevel pipelines, fields, tags & workflows' },
};
const modal = $('#modal');
// one listener for every card, including cards added later from the door (work.js)
document.addEventListener('click', e => { const c = e.target.closest('.case[data-case]'); if (c && CASES[c.dataset.case]) openCase(c.dataset.case); });
window.CASES = CASES; window.SHOTS = SHOTS; window.openCase = id => openCase(id);
// YouTube / Vimeo / Loom links → an embeddable player address
const embedUrl = u => {
  let m;
  if ((m = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/.exec(u))) return 'https://www.youtube-nocookie.com/embed/' + m[1] + '?rel=0';
  if ((m = /vimeo\.com\/(?:video\/)?(\d+)/.exec(u))) return 'https://player.vimeo.com/video/' + m[1];
  if ((m = /loom\.com\/(?:share|embed)\/([\w]+)/.exec(u))) return 'https://www.loom.com/embed/' + m[1];
  return '';
};
const shotSrc = f => (/^(https?:|\/|assets\/)/.test(f) ? f : `assets/work/${f}.jpg`);
$$('[data-open]').forEach(a => a.onclick = e => { if (CASES[a.dataset.open]) { e.preventDefault(); openCase(a.dataset.open); } });
function openCase(id) {
  const c = CASES[id];
  $('#mTags').innerHTML = c.tags.map(t => `<span class="tag ${t.startsWith('●') ? 'live' : t === 'Demo build' ? 'demo' : ''}">${t}</span>`).join('');
  $('#mTitle').textContent = c.title; $('#mSub').textContent = c.sub;
  const card = document.querySelector(`.case[data-case="${id}"]`), vid = card && card.querySelector('video'), img = card && card.querySelector('.case-img img');
  const dv = card && card.dataset.video, ev = dv && embedUrl(dv);
  const media = ev ? `<figure class="mb-media mb-embed"><iframe src="${esc(ev)}" title="Video: ${esc(c.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe><figcaption>Video walkthrough of this build.</figcaption></figure>`
    : dv ?`<figure class="mb-media"><video src="${dv}" poster="${img ? (img.dataset.shot || img.getAttribute('src')) : ''}" controls autoplay loop muted playsinline preload="metadata"></video><figcaption>Screen recording of a real run of this demo build, sped up where it waits. Sample data only.</figcaption></figure>`
    : vid ? `<figure class="mb-media"><video src="${vid.getAttribute('src')}" poster="${vid.getAttribute('poster')}" controls muted playsinline preload="metadata"></video><figcaption>Real screen recording from the live system. Client details are hidden.</figcaption></figure>`
    : img ? `<figure class="mb-media"><img src="${img.dataset.shot || img.getAttribute('src')}" alt="${esc(img.alt)}"><figcaption>${esc(img.alt)}</figcaption></figure>` : '';
  const shots = SHOTS[id] || [];
  const strip = shots.length ? `<div class="mb-shots"><button type="button" class="on" data-shot="" aria-label="Back to the main view"><span>${dv || vid ? '▶ Recording' : 'Main view'}</span></button>${shots.map(([f, cap]) => `<button type="button" data-shot="${esc(shotSrc(f))}" data-cap="${esc(cap)}"><img src="${esc(shotSrc(f))}" alt="${esc(cap)}" loading="lazy"></button>`).join('')}</div>` : '';
  $('#mBody').innerHTML = media + strip + `
    <div class="mb-sec"><div class="k">The problem</div><p>${esc(c.problem)}</p></div>
    <div class="mb-sec"><div class="k">What I built</div><ul>${c.built.map(b => `<li>${esc(b)}</li>`).join('')}</ul></div>
    <div class="mb-sec"><div class="k">${c.demo ? 'What the run shows' : 'What changed'}</div><p>${esc(c.changed)}</p></div>
    <div class="mb-sec"><div class="k">By the numbers</div><div class="mb-results">${c.results.map(([b, s]) => `<div><b>${b}</b>${s}</div>`).join('')}</div></div>
    <div class="mb-sec"><div class="k">Stack</div><p class="mono" style="font-size:13.5px">${esc(c.stack)}</p></div>
    <div class="mb-sec"><div class="k">Next</div><div class="cta-row">${c.link ? `<a class="btn" href="${c.link[1]}"${c.link[2] ? ` data-demo="${c.link[2]}"` : ' target="_blank" rel="noopener"'}>${c.link[0]} <span class="arr">${c.link[2] ? "→" : "↗"}</span></a>` : ''}<a class="btn ${c.link ? 'ghost' : ''}" href="#contact" data-close>Build something like this <span class="arr">→</span></a></div></div>`;
  const fig = $('#mBody .mb-media'), first = fig ? fig.innerHTML : '';
  $$('#mBody .mb-shots button').forEach(b => b.onclick = () => {
    $$('#mBody .mb-shots button').forEach(x => x.classList.toggle('on', x === b));
    fig.innerHTML = b.dataset.shot ? `<img src="${b.dataset.shot}" alt="${esc(b.dataset.cap)}"><figcaption>${esc(b.dataset.cap)}</figcaption>` : first;
  });
  modal.classList.add('open'); document.body.style.overflow = 'hidden'; $('#mClose').focus();
}
const closeModal = () => { modal.classList.remove('open'); document.body.style.overflow = ''; };
$('#mClose').onclick = closeModal;
modal.onclick = e => { if (e.target === modal || e.target.closest('[data-close]')) closeModal(); };
addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ---------- reviews slider ---------- */
const track = $('#revTrack'), cards = $$('.rev', track), dotsEl = $('#revDots');
dotsEl.innerHTML = cards.map((_, i) => `<button aria-label="Go to review ${i + 1}"></button>`).join('');
const dots = $$('button', dotsEl);
const goRev = i => { i = (i + cards.length) % cards.length; track.scrollTo({ left: cards[i].offsetLeft - track.offsetLeft, behavior: 'smooth' }); };
const curRev = () => { let best = 0, d = 1e9; cards.forEach((c, i) => { const x = Math.abs(c.offsetLeft - track.offsetLeft - track.scrollLeft); if (x < d) { d = x; best = i; } }); return best; };
const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
const syncDots = () => { const c = atEnd() ? cards.length - 1 : curRev(); dots.forEach((b, i) => b.classList.toggle('on', i === c)); };
dots.forEach((b, i) => b.onclick = () => goRev(i));
$('#revPrev').onclick = () => goRev(curRev() - 1);
$('#revNext').onclick = () => goRev(atEnd() ? 0 : curRev() + 1);
track.addEventListener('scroll', () => requestAnimationFrame(syncDots), { passive: true });
syncDots();
let revAuto = setInterval(() => { if (!document.hidden) $('#revNext').click(); }, 6000);
track.addEventListener('pointerenter', () => clearInterval(revAuto));

/* ---------- services ---------- */
const SVC = [
  ['Document & data pipelines', 'PDFs, contracts and forms read by AI, checked in code, and turned into filled templates, sheets or CRM records.', ['OCR', 'Claude extraction', 'Word & PDF filling', 'Review steps']],
  ['n8n workflow builds', 'From a single integration to multi-branch systems with retries, error workflows and alerts. Cloud or self-hosted.', ['n8n Cloud', 'Self-hosted', 'Error workflows', 'Webhooks & APIs']],
  ['AI agents & assistants', 'WhatsApp, website and voice assistants that answer, qualify and book, with structured output and a human hand-off.', ['WhatsApp', 'Website chat', 'Vapi / Retell voice', 'RAG']],
  ['GoHighLevel systems', 'Pipelines, fields, tags, workflows, forms, contracts and email templates, set up properly and documented.', ['Pipelines', 'Workflows', 'Contracts', 'A2P / SMS']],
  ['Lead generation engines', 'Research, qualification and personalised first lines at volume, with checks that keep the data honest.', ['Lead research', 'Enrichment', 'Personalised copy', 'CSV / CRM export']],
  ['Rescues & audits', 'Automations that fail silently or that a previous developer left behind: diagnosed, fixed and documented.', ['Audit report', 'Fix plan', 'Documentation', 'Monitoring']],
];
const svcEl = $('#svcList'); if (svcEl) svcEl.innerHTML = SVC.map(([h, d, li], i) => `<div class="svc" data-r tabindex="0"><span class="no">0${i + 1}</span><h3>${h}</h3><div class="d">${d}<ul>${li.map(x => `<li>${x}</li>`).join('')}</ul></div><span class="pl">+</span></div>`).join('');
$$('.svc').forEach(s => { io.observe(s); s.onclick = () => s.classList.toggle('open'); s.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.classList.toggle('open'); } }; });

/* ---------- brief ---------- */
const TOOLS = ['n8n', 'GoHighLevel', 'HubSpot', 'Google Sheets', 'Gmail / Outlook', 'WhatsApp', 'Airtable', 'Shopify', 'Not sure'];
const picked = new Set();
$('#bTools').innerHTML = TOOLS.map(t => `<button type="button">${t}</button>`).join('');
$('#bTools').onclick = e => { const b = e.target.closest('button'); if (!b) return; const t = b.textContent; picked.has(t) ? picked.delete(t) : picked.add(t); b.classList.toggle('on'); };
let via = 'wa';
$$('[data-via]').forEach(b => b.onclick = () => via = b.dataset.via);
$('#brief').onsubmit = e => {
  e.preventDefault();
  const task = $('#bTask').value.trim(), who = $('#bName').value.trim();
  const S = window.SITE || {}, first = (S.name || 'Simeon').split(' ')[0];
  const msg = `Hi ${first},${who ? ' this is ' + who + '.' : ''}\n\nWhat we do by hand today:\n${task}\n\nTools we use: ${picked.size ? [...picked].join(', ') : 'not listed'}\n\n(Sent from your portfolio)`;
  const url = via === 'wa' ? 'https://wa.me/' + (S.whatsapp || '2348110117004') + '?text=' + encodeURIComponent(msg)
    : 'mailto:' + (S.email || 'simeono.automation@gmail.com') + '?subject=' + encodeURIComponent('Automation brief' + (who ? ' from ' + who : '')) + '&body=' + encodeURIComponent(msg);
  window.open(url, '_blank', 'noopener');
};
})();
