// Draws one cover graphic per portfolio item (1600x1000) in the site's own style, using headless Chrome.
// Run: node make-covers.mjs     Output: ../site/assets/work/cover-<id>.jpg
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'site', 'assets', 'work');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const w = {}; new Function('window', fs.readFileSync(path.join(HERE, '..', 'site', 'icons.js'), 'utf8'))(w);
const ICONS = w.ICONS;

// accent per kind of team, all tuned to sit on the dark canvas and the paper side
const A = { legal: '#FF4F1A', realty: '#0E8C8A', clinic: '#2F7DE1', coach: '#8A5CF6', office: '#D99A06', leads: '#E0457B', chat: '#12A150' };
// step: [icon key from icons.js | glyph text, label]
const COVERS = [
  { id: 'closing', kind: 'Live build · Law office', accent: A.legal, title: 'Closing documents from a 200-page binder', stat: '14 pp', lbl: 'signing packet per sale', steps: [['googledrive', 'Binder dropped in Drive'], ['claude', 'Claude reads it'], ['{ }', 'Code checks every field'], ['googlesheets', 'Office approves one row'], ['googledocs', 'Packet ready to sign']] },
  { id: 'matters', kind: 'Live build · Law office', accent: A.legal, title: 'A matter tracker that files itself', stat: '0', lbl: 'documents sorted by hand', steps: [['googledrive', 'Any PDF, one folder'], ['claude', 'Claude names the document'], ['{ }', 'Matched to the right sale'], ['googlesheets', 'Checklist ticked'], ['gmail', '8:00 digest of gaps']] },
  { id: 'assist', kind: 'Client build · Clinics & local business', accent: A.chat, title: 'AI receptionists that answer and book', stat: '24/7', lbl: 'answers and bookings', steps: [['whatsapp', 'WhatsApp, web or voice'], ['claude', 'Answers from the site'], ['googlecalendar', 'Books a real slot'], ['googlesheets', 'Lead saved'], ['→', 'Hands over to a person']] },
  { id: 'onboard', kind: 'Live build · Tax preparers', accent: A.office, title: 'Onboarding that signs, tags and welcomes itself', stat: '0', lbl: 'manual follow-ups', steps: [['googleforms', 'New preparer applies'], ['✎', 'Agreement sent to sign'], ['✓', 'Signed and tagged'], ['gmail', 'Branded welcome'], ['▤', 'Every step tracked']] },
  { id: 'leads', kind: 'Own build · Lead generation', accent: A.leads, title: 'A lead engine that researches 1,000 businesses', stat: '1,000+', lbl: 'leads in one run', steps: [['⌕', 'Finds local trades'], ['{ }', 'Removes chains and duplicates'], ['▤', 'Checks the owner'], ['claude', 'Spots the website gap'], ['✎', 'Writes the pitch']] },
  { id: 'desk', kind: 'Product design · Law office', accent: A.legal, title: 'Closing Desk: an in-house case app', stat: '0', lbl: 'per-seat fees', steps: [['▤', 'Every matter on one board'], ['n8n', 'Fed by the n8n pipelines'], ['✓', 'Checklist per sale'], ['googledrive', 'Documents linked'], ['→', 'Replaces a $139/user tool']] },
  { id: 'realty', kind: 'Client build · Real estate', accent: A.realty, title: '"Keys to Close": a system for a new realtor', stat: '7', lbl: 'phases, audit to expansion', steps: [['⌕', 'Audit what exists'], ['▤', 'Pipelines and fields'], ['whatsapp', 'Follow-up that runs'], ['★', 'Review requests'], ['✎', 'Documented for the team']] },
  { id: 'dlaw', kind: 'Demo build · Law offices', accent: A.legal, title: 'New-client intake to engagement letter', stat: '9 s', lbl: 'form to drafted letter', steps: [['googleforms', 'Enquiry form'], ['{ }', 'Conflict check in code'], ['claude', 'Summary and scope'], ['googledocs', 'Letter drafted'], ['✓', 'Attorney approves']] },
  { id: 'drealty', kind: 'Demo build · Real estate', accent: A.realty, title: 'Speed-to-lead responder', stat: '10 s', lbl: 'full run, measured', steps: [['googleforms', 'Form or missed call'], ['{ }', 'Scored by rules'], ['claude', 'First text written'], ['googlesheets', 'Saved to the CRM'], ['★', 'Hot leads alert the agent']] },
  { id: 'dclinic', kind: 'Demo build · Clinics', accent: A.clinic, title: 'Reminders, no-show recovery and reviews', stat: '0', lbl: 'health details in any message', steps: [['googlecalendar', 'Appointment list'], ['{ }', 'Rules decide what is due'], ['✉', 'Reminder texts'], ['↺', 'Rebook after a no-show'], ['★', 'Review request']] },
  { id: 'dcoach', kind: 'Demo build · Coaches & consultants', accent: A.coach, title: 'Discovery call to proposal', stat: '1', lbl: 'proposal drafted per call', steps: [['googledrive', 'Call transcript'], ['claude', 'Notes and next steps'], ['googlesheets', 'CRM updated'], ['googledocs', 'Proposal drafted'], ['gmail', 'Follow-up waits as a draft']] },
  { id: 'dbooks', kind: 'Demo build · Any office', accent: A.office, title: 'Invoice inbox to books', stat: '8', lbl: 'checks in code per invoice', steps: [['googledrive', 'Invoice PDF arrives'], ['claude', 'Claude reads it'], ['{ }', 'Code checks the maths'], ['googlesheets', 'Booked'], ['⚑', 'Or sent for approval']] },
  { id: 'dwebchat', kind: 'Demo build · Coaches & consultants', accent: A.coach, title: 'Website chatbot that captures leads', stat: '0', lbl: 'prices invented by the bot', steps: [['◍', 'Visitor asks a question'], ['googlesheets', "Answers from the firm's notes"], ['claude', 'Reply written'], ['{ }', 'Reply checked in code'], ['★', 'Lead saved, owner told']] },
  { id: 'dwhatsapp', kind: 'Demo build · Clinics', accent: A.chat, title: 'WhatsApp assistant that books appointments', stat: '3', lbl: 'messages to a confirmed booking', steps: [['whatsapp', 'Patient messages'], ['{ }', 'Free slots worked out in code'], ['claude', 'Reply written'], ['googlecalendar', 'Slot booked'], ['→', 'Or handed to a person']] },
  { id: 'dcrm', kind: 'Demo build · Any sales team', accent: A.clinic, title: 'CRM follow-up that runs every morning', stat: '9', lbl: 'tasks created from 8 deals', steps: [['googlesheets', 'Pipeline loaded at 8:00'], ['{ }', 'Rules per stage'], ['✓', 'Tasks created'], ['claude', 'Stale deals get a draft'], ['gmail', 'Morning summary']] },
  { id: 'dvoice', kind: 'Demo build · Local services', accent: A.chat, title: 'AI voice receptionist that books and hands off', stat: '2-4 s', lbl: 'per spoken reply, measured', steps: [['☏', 'Caller speaks'], ['googlesheets', 'Notes, slots and bookings read'], ['claude', 'Reply written'], ['googlecalendar', 'Free slot booked'], ['→', 'Quotes go to a person']] },
  { id: 'dmissed', kind: 'Demo build · Trades', accent: A.clinic, title: 'Missed-call text-back with follow-ups', stat: '1', lbl: 'text per caller, even on a repeat call', steps: [['twilio', 'Call goes unanswered'], ['✉', 'Instant text back'], ['↺', 'Follow-ups until a reply'], ['claude', 'Reply read, urgent flagged'], ['⚑', 'Owner alerted']] },
  { id: 'droute', kind: 'Demo build · Any sales team', accent: A.leads, title: 'AI lead scoring and routing to the right rep', stat: '88/100', lbl: 'Hot lead routed by service and area', steps: [['facebook', 'Form, ad or email lead'], ['{ }', 'Duplicates merged'], ['claude', 'Scored with reasons'], ['→', 'Right rep, or round-robin'], ['✓', 'Reply held for approval']] },
  { id: 'drag', kind: 'Demo build · Logistics', accent: A.coach, title: 'RAG assistant that answers from the handbook', stat: '0', lbl: 'answers without a cited source', steps: [['◍', 'Staff question'], ['⌕', 'Best passages found'], ['claude', 'Answer with citations'], ['{ }', 'Citations checked'], ['→', 'Unknown? Sent to HR']] },
  { id: 'dmail', kind: 'Demo build · HVAC company', accent: A.leads, title: 'AI inbox triage, nothing sent without approval', stat: '5.6 s', lbl: 'to sort, draft and route 5 emails', steps: [['gmail', 'Emails arrive'], ['claude', 'AI sorts and drafts'], ['{ }', 'Draft checked'], ['slack', 'Urgent job to Slack'], ['✓', 'Sent after approval']] },
  { id: 'dtitle', kind: 'Demo build · Law office', accent: A.legal, title: 'Title report PDF to a filled Word complaint', stat: '12.6 s', lbl: 'from title report PDF to filled complaint', steps: [['⇪', 'Title report PDF in'], ['claude', 'AI reads every field'], ['{ }', 'Each value checked'], ['⚑', 'Doubts flagged for review'], ['W', 'Complaint filled in Word']] },
  { id: 'dinvoice', kind: 'Demo build · Construction', accent: A.office, title: 'AI invoice processing, checked before booking', stat: '6', lbl: 'checks in code before anything is booked', steps: [['gmail', 'Invoice email arrives'], ['claude', 'AI reads the PDF'], ['{ }', 'Every number checked'], ['googlesheets', 'Booked to the ledger'], ['⚑', 'Or sent for approval']] },
  { id: 'dshop', kind: 'Demo build · Online shop', accent: A.realty, title: 'AI support agent for an online shop', stat: '1.7-3 s', lbl: 'per reply, measured', steps: [['shopify', 'Customer asks'], ['googlesheets', 'Their orders and policies'], ['claude', 'Reply written'], ['{ }', 'Privacy and promise checks'], ['→', 'Ticket for the team']] },
  { id: 'doutreach', kind: 'Demo build · B2B sales', accent: A.legal, title: 'AI outreach agent, sent only after approval', stat: '15 s', lbl: 'to research and draft 4 prospects', steps: [['⌕', 'New prospects'], ['claude', 'Research and fit score'], ['✎', 'Personal email and follow-up'], ['{ }', 'Every draft checked'], ['✓', 'Sent only after approval']] },
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const icon = k => ICONS[k] ? `<svg viewBox="0 0 24 24" width="40" height="40"><path fill="${ICONS[k].c === '#000000' ? '#ECE8DD' : ICONS[k].c}" d="${ICONS[k].p}"/></svg>` : `<span class="g">${esc(k)}</span>`;
const page = c => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1600px;height:1000px;overflow:hidden;font-family:"Plus Jakarta Sans","Segoe UI",sans-serif;background:#F3EFE6;color:#15140F;display:grid;grid-template-columns:820px 780px}
.l{padding:84px 40px 78px 88px;display:flex;flex-direction:column;position:relative;background-image:linear-gradient(#DDD6C6 1px,transparent 1px),linear-gradient(90deg,#DDD6C6 1px,transparent 1px);background-size:64px 64px;background-position:-1px -1px}
.l::after{content:"";position:absolute;inset:0;background:radial-gradient(900px 700px at 20% 40%,#F3EFE6 45%,rgba(243,239,230,.55) 100%)}
.l>*{position:relative;z-index:1}
.kind{font:600 21px/1 "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:#6E6B60;display:flex;align-items:center;gap:16px}
.kind::before{content:"";width:16px;height:16px;border-radius:50%;background:${c.accent};box-shadow:0 0 0 7px ${c.accent}26}
h1{font-size:${c.title.length > 40 ? 76 : c.title.length > 30 ? 86 : 98}px;line-height:1.02;letter-spacing:-.045em;font-weight:800;margin-top:54px;max-width:680px}
.stat{margin-top:auto;display:flex;align-items:baseline;gap:22px}
.stat b{font-size:132px;line-height:.9;letter-spacing:-.06em;font-weight:800;color:${c.accent};white-space:nowrap}
.stat span{font-size:27px;line-height:1.2;color:#3B3A33;font-weight:600;max-width:300px}
.by{margin-top:34px;font:600 19px/1 "JetBrains Mono",monospace;color:#6E6B60;display:flex;align-items:center;gap:12px}
.by i{width:38px;height:38px;border-radius:11px;background:#15140F;color:#F3EFE6;display:grid;place-items:center;font-style:normal;font-size:14px}
.r{background:#11110E;position:relative;padding:74px 70px 74px 78px;display:flex;flex-direction:column;justify-content:center;gap:0;background-image:radial-gradient(circle at 1px 1px,rgba(255,255,255,.07) 1.5px,transparent 0);background-size:30px 30px}
.r::before{content:"";position:absolute;left:0;top:0;bottom:0;width:10px;background:${c.accent}}
.r::after{content:"";position:absolute;right:-160px;top:-160px;width:520px;height:520px;border-radius:50%;background:${c.accent};opacity:.16;filter:blur(90px)}
.step{display:flex;align-items:center;gap:26px;position:relative;z-index:1;padding:17px 0}
.step:not(:last-child)::after{content:"";position:absolute;left:43px;top:105px;width:3px;height:34px;background:linear-gradient(${c.accent},${c.accent}55);border-radius:2px}
.tile{width:88px;height:88px;border-radius:24px;background:#1E1E19;border:2px solid #34332B;display:grid;place-items:center;flex:none;box-shadow:0 14px 30px -14px #000}
.step:last-child .tile{border-color:${c.accent};box-shadow:0 0 0 7px ${c.accent}22,0 14px 30px -14px #000}
.g{font:600 34px/1 "JetBrains Mono",monospace;color:#ECE8DD}
.lab{font-size:31px;font-weight:600;color:#ECE8DD;letter-spacing:-.02em;line-height:1.15}
.no{font:600 16px/1 "JetBrains Mono",monospace;color:#7C786C;display:block;margin-bottom:8px;letter-spacing:.12em}
.done{margin-left:auto;width:30px;height:30px;border-radius:50%;background:#123A2B;color:#3DDC97;display:grid;place-items:center;font-size:17px;font-weight:700;flex:none}
</style></head><body>
<div class="l"><div class="kind">${esc(c.kind)}</div><h1>${esc(c.title)}</h1>
  <div class="stat"><b>${esc(c.stat)}</b><span>${esc(c.lbl)}</span></div>
  <div class="by"><i>SO</i>Simeon Onabowale · AI automation</div></div>
<div class="r">${c.steps.map(([k, t], i) => `<div class="step"><div class="tile">${icon(k)}</div><div><span class="no">STEP 0${i + 1}</span><div class="lab">${esc(t)}</div></div><span class="done">✓</span></div>`).join('')}</div>
</body></html>`;

fs.mkdirSync(path.join(HERE, 'tmp'), { recursive: true });
const only = process.argv[2];
for (const c of COVERS) {
  if (only && c.id !== only) continue;
  const h = path.join(HERE, 'tmp', c.id + '.html'), png = path.join(HERE, 'tmp', c.id + '.png');
  fs.writeFileSync(h, page(c));
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1600,1000', '--virtual-time-budget=6000', '--user-data-dir=' + path.join(HERE, 'tmp', 'profile'), '--screenshot=' + png, pathToFileURL(h).href], { stdio: 'ignore', timeout: 90000 });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '3', path.join(OUT, 'cover-' + c.id + '.jpg')]);
  console.log('cover-' + c.id + '.jpg');
}
try { fs.rmSync(path.join(HERE, 'tmp', 'profile'), { recursive: true, force: true }); } catch {}
