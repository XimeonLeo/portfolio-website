// Makes the sample files the demo workflows read: three invoice PDFs and one call transcript. All names are fictional.
// Run: node make-samples.mjs   (uses Microsoft Edge to print the PDFs)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const EDGE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const money = n => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function invoice({ file, vendor, addr, colour, no, date, due, lines, taxRate, totalOverride }) {
  const sub = lines.reduce((s, l) => s + l.qty * l.unit, 0), tax = +(sub * taxRate).toFixed(2), total = totalOverride ?? sub + tax;
  const html = `<!doctype html><meta charset="utf-8"><style>
  @page{size:A4;margin:0} body{font:14px/1.5 "Segoe UI",Arial,sans-serif;color:#1c1c1c;margin:0;padding:56px 60px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid ${colour};padding-bottom:22px}
  h1{margin:0;font-size:30px;letter-spacing:.06em;color:${colour}} .v{font-size:20px;font-weight:700} small{color:#666;display:block}
  .meta{display:flex;justify-content:space-between;margin:30px 0} .meta b{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#777}
  table{width:100%;border-collapse:collapse;margin-top:10px} th{text-align:left;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#777;border-bottom:1px solid #bbb;padding:8px 6px}
  td{padding:10px 6px;border-bottom:1px solid #e5e5e5} .r{text-align:right} .tot{margin:22px 0 0 auto;width:280px} .tot div{display:flex;justify-content:space-between;padding:6px}
  .tot .g{font-weight:700;font-size:17px;border-top:2px solid #1c1c1c;margin-top:6px;padding-top:10px} .foot{margin-top:60px;color:#666;font-size:12.5px}
  </style><div class="top"><div><div class="v">${vendor}</div><small>${addr}</small></div><h1>INVOICE</h1></div>
  <div class="meta"><div><b>Bill to</b>Brightside Family Clinic<small>214 Alder Street, Portland, OR 97205</small></div>
  <div><b>Invoice number</b>${no}</div><div><b>Invoice date</b>${date}</div><div><b>Due date</b>${due}</div></div>
  <table><tr><th>Description</th><th class="r">Qty</th><th class="r">Unit price</th><th class="r">Amount</th></tr>
  ${lines.map(l => `<tr><td>${l.d}</td><td class="r">${l.qty}</td><td class="r">$${money(l.unit)}</td><td class="r">$${money(l.qty * l.unit)}</td></tr>`).join('')}</table>
  <div class="tot"><div><span>Subtotal</span><span>$${money(sub)}</span></div><div><span>Sales tax (${(taxRate * 100).toFixed(1)}%)</span><span>$${money(tax)}</span></div><div class="g"><span>Total due</span><span>$${money(total)}</span></div></div>
  <p class="foot">Payment terms: net 30. Please quote the invoice number with your payment. Thank you for your business.</p>`;
  const h = path.join(HERE, file + '.html'); fs.writeFileSync(h, html);
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--user-data-dir=' + path.join(HERE, '.chrome-tmp'), '--no-pdf-header-footer', '--print-to-pdf=' + path.join(HERE, file + '.pdf'), pathToFileURL(h).href], { stdio: 'ignore', timeout: 60000 });
  fs.unlinkSync(h);
}

const supplies = { vendor: 'Northgate Medical Supply Co.', addr: '88 Harbor Road, Seattle, WA 98101 · billing@northgatemedical.example', colour: '#0E6B8C', no: 'NMS-20418', date: 'November 3, 2026', due: 'December 3, 2026', taxRate: 0.065,
  lines: [{ d: 'Nitrile exam gloves, box of 100 (medium)', qty: 24, unit: 11.5 }, { d: 'Disposable face masks, box of 50', qty: 10, unit: 8.25 }, { d: 'Surface disinfectant wipes, tub of 160', qty: 12, unit: 14 }, { d: 'Digital thermometer probe covers, pack of 500', qty: 4, unit: 22.75 }] };
invoice({ file: 'invoice-1-clean', ...supplies });
// same invoice again: the workflow should catch it as a duplicate
invoice({ file: 'invoice-3-duplicate', ...supplies });
// the printed total is $100 more than the lines add up to: the workflow should flag it
invoice({ file: 'invoice-2-total-wrong', vendor: 'Cascade Office Cleaning LLC', addr: '1450 Burnside Ave, Portland, OR 97214 · accounts@cascadecleaning.example', colour: '#3C7A3B', no: 'COC-1187', date: 'November 5, 2026', due: 'November 20, 2026', taxRate: 0,
  lines: [{ d: 'Weekly office cleaning, October (4 visits)', qty: 4, unit: 185 }, { d: 'Carpet deep clean, reception area', qty: 1, unit: 240 }, { d: 'Window cleaning, ground floor', qty: 1, unit: 95 }], totalOverride: 1175 });

fs.writeFileSync(path.join(HERE, 'discovery-call-transcript.txt'), `Discovery call transcript
Date: November 12, 2026
Coach: Dana Whitfield (Whitfield Leadership Coaching)
Prospect: Marcus Hale, Operations Director, Hale & Bright Logistics

Dana: Thanks for making time, Marcus. Tell me what made you book this call.
Marcus: Honestly, I got promoted to operations director eight months ago and I feel like I'm drowning. I went from running one depot to five, and I'm still doing my old job on top of the new one.
Dana: What does a normal week look like?
Marcus: Sixty hours, easily. I'm in every escalation. My depot managers call me before they decide anything. I haven't had a proper one-to-one with any of them in two months because the day just disappears.
Dana: If we were talking six months from now and things had gone well, what would be different?
Marcus: My managers would be making decisions without me. I'd be working closer to forty-five hours. And I'd have an actual plan for the next year instead of firefighting. My CEO wants a three-year operations plan by the end of March and I haven't started.
Dana: What have you tried so far?
Marcus: I read a couple of books on delegation. I did a two-day leadership course when I got the job. It was fine, but nothing stuck once I was back at my desk.
Dana: What gets in the way of delegating?
Marcus: Two of my five managers are new, and I don't trust them to get it right yet. And if I'm honest, I like being the one who fixes things.
Dana: That's a useful thing to notice. Is there anything that would make you hesitate about coaching?
Marcus: Time, mainly. I can't add another big commitment. And I'd need to get the cost signed off by our CEO, Priya, so I need something I can show her. She'll want to know how we'd measure whether it worked.
Dana: That's fair. I usually work with new directors over twelve weeks: a session every week for the first month, then every two weeks, with short check-ins in between. We'd set two or three measures at the start, things like hours worked, decisions escalated to you, and progress on the plan.
Marcus: That sounds manageable. Could we start in early December? I'd like to have momentum before the March deadline.
Dana: Yes. I'll send you a short proposal you can forward to Priya. Could you send me your current org chart and a rough list of the escalations you handled last week?
Marcus: I can do that by Friday.
Dana: Great. I'll have the proposal with you tomorrow, and let's pencil in a follow-up next Wednesday to go through it with Priya if she wants to join.
Marcus: Perfect. Thanks, Dana.
`);
console.log(fs.readdirSync(HERE).filter(f => /\.(pdf|txt)$/.test(f)).map(f => f + ' ' + fs.statSync(path.join(HERE, f)).size).join('\n'));
