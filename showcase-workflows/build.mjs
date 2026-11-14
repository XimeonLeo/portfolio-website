// Builds the importable n8n workflow files for the five portfolio demo workflows (+ a setup and a helper workflow).
// Run: node build.mjs      Output: out/*.json
// Credentials come from credentials.local.json; IDs made by the Setup workflow come from config.local.json (paste its last node's output there, then build again).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, process.env.CLEAN ? 'out-clean' : 'out'); // CLEAN=1 builds copies with no account-specific IDs
const readJson = f => { try { return JSON.parse(fs.readFileSync(path.join(HERE, f), 'utf8')); } catch { return {}; } };
const CRED = process.env.CLEAN ? {} : readJson('credentials.local.json');
const cfg = process.env.CLEAN ? {} : readJson('config.local.json');
const SS = cfg.spreadsheetId || 'RUN-SETUP-FIRST';
const F = k => (cfg.folders || {})[k] || 'RUN-SETUP-FIRST';
const MODEL = 'claude-sonnet-5-5';

const TABS = {
  'Law Intake': ['Received', 'Client', 'Email', 'Phone', 'Matter type', 'Practice area', 'Urgency', 'Other party', 'Summary', 'Conflict check', 'Engagement letter', 'Status'],
  'Law Clients': ['Name', 'Role', 'Matter', 'Opened'],
  'RE Leads': ['Received', 'Name', 'Email', 'Phone', 'Source', 'Interest', 'Area', 'Budget', 'Timeline', 'Score', 'Temperature', 'Why', 'First reply', 'Replied in (seconds)', 'Next step'],
  'Clinic Appointments': ['Appt ID', 'Patient', 'Phone', 'Starts', 'Status', 'Reminder 48h', 'Reminder 2h', 'Rebook offer', 'Review request'],
  'Coach CRM': ['Client', 'Company', 'Role', 'Stage', 'Goals', 'Challenges', 'Objections', 'Next steps', 'Recommended programme', 'Proposal', 'Last updated'],
  Books: ['Logged', 'Vendor', 'Invoice no', 'Invoice date', 'Due date', 'Subtotal', 'Tax', 'Total', 'Currency', 'Checks', 'File'],
  'Approval Queue': ['Logged', 'Vendor', 'Invoice no', 'Total', 'Problem', 'File', 'Decision'],
  Outbox: ['Time', 'Workflow', 'Channel', 'To', 'Message', 'Status', 'Ref'],
  'Bot Knowledge': ['Business', 'Topic', 'Answer'],
  'Chat Log': ['Time', 'Channel', 'Session', 'Who', 'Message'],
  'Chat Leads': ['Time', 'Channel', 'Name', 'Contact', 'Interest', 'Summary', 'Status'],
  Bookings: ['Booked at', 'Name', 'Phone', 'Service', 'Day', 'Time', 'Status'],
  Pipeline: ['Deal ID', 'Contact', 'Company', 'Email', 'Stage', 'Value', 'Owner', 'Last touch', 'Next step', 'Health'],
  Tasks: ['Created', 'Deal ID', 'Owner', 'Task', 'Due', 'Why'],
};

/* ---------- helpers ---------- */
let seq = 0, wfNo = 0;
const uid = () => `5h0wca5e-${String(wfNo).padStart(4, '0')}-4000-8000-${String(++seq).padStart(12, '0')}`;
const cred = t => (CRED[t] ? { credentials: { [t]: CRED[t] } } : {});
const node = (name, type, typeVersion, position, parameters, extra = {}) => ({ id: uid(), name, type, typeVersion, position, parameters, ...extra });
const fn = f => { const s = f.toString(); return s.slice(s.indexOf('{') + 1, s.lastIndexOf('}')).replace(/^\n/, '').replace(/\n {2}/g, '\n').trim(); };
const code = (name, pos, f, sub = {}) => node(name, 'n8n-nodes-base.code', 2, pos, { mode: 'runOnceForAllItems', jsCode: Object.entries(sub).reduce((s, [k, v]) => s.split(k).join(v), fn(f)) });
const codeEach = (name, pos, f) => node(name, 'n8n-nodes-base.code', 2, pos, { mode: 'runOnceForEachItem', jsCode: fn(f).split('__MODEL__').join(MODEL).split('__PARSE__').join(PARSE) });
const retry = { retryOnFail: true, maxTries: 3, waitBetweenTries: 3000 };
function http(name, pos, { method = 'GET', url, auth, body, binary, headers }) {
  const p = { method, url, options: { timeout: 120000 }, authentication: 'predefinedCredentialType', nodeCredentialType: auth };
  if (body) Object.assign(p, { sendBody: true, specifyBody: 'json', jsonBody: body });
  if (binary) Object.assign(p, { sendBody: true, contentType: 'binaryData', inputDataFieldName: binary });
  if (headers) Object.assign(p, { sendHeaders: true, headerParameters: { parameters: Object.entries(headers).map(([name, value]) => ({ name, value })) } });
  return node(name, 'n8n-nodes-base.httpRequest', 4.2, pos, p, { ...retry, ...cred(auth) });
}
const claude = (name, pos) => http(name, pos, { method: 'POST', url: 'https://api.anthropic.com/v1/messages', auth: 'anthropicApi', body: '={{ JSON.stringify($json.body) }}', headers: { 'anthropic-version': '2023-06-01' } });
const doc = { __rl: true, mode: 'id', value: SS };
const tab = name => ({ __rl: true, mode: 'name', value: name });
const gs = (name, pos, parameters) => node(name, 'n8n-nodes-base.googleSheets', 4.5, pos, { documentId: doc, ...parameters }, { ...retry, ...cred('googleSheetsOAuth2Api') });
const sheetRead = (name, pos, t) => gs(name, pos, { sheetName: tab(t), options: {} });
const cols = (value, match = [], t) => ({ mappingMode: 'defineBelow', value, matchingColumns: match, schema: TABS[t].map(h => ({ id: h, displayName: h, required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true, removed: !(h in value) })) });
const sheetAppend = (name, pos, t, value) => gs(name, pos, { operation: 'append', sheetName: tab(t), columns: cols(value, [], t), options: { cellFormat: 'RAW' } });
const sheetUpsert = (name, pos, t, key, value) => gs(name, pos, { operation: 'appendOrUpdate', sheetName: tab(t), columns: cols(value, [key], t), options: { cellFormat: 'RAW' } });
const sheetUpdate = (name, pos, t, key, value) => gs(name, pos, { operation: 'update', sheetName: tab(t), columns: cols(value, [key], t), options: {} });
const sheetUpdateAuto = (name, pos, t, key) => gs(name, pos, { operation: 'update', sheetName: tab(t), columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [key], schema: [] }, options: {} });
const NOW = "={{ $now.toFormat('yyyy-LL-dd HH:mm:ss') }}";
const outbox = (name, pos, wf, v) => sheetAppend(name, pos, 'Outbox', { Time: NOW, Workflow: wf, Ref: '', ...v });
const iff = (name, pos, left) => node(name, 'n8n-nodes-base.if', 2, pos, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, combinator: 'and', conditions: [{ id: uid(), leftValue: left, rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] }, options: {} });
const manual = (name, pos) => node(name, 'n8n-nodes-base.manualTrigger', 1, pos, {});
const form = (name, pos, title, description, fields) => node(name, 'n8n-nodes-base.formTrigger', 2.2, pos, { formTitle: title, formDescription: description, formFields: { values: fields.map(([fieldLabel, fieldType, opt]) => ({ fieldLabel, ...(fieldType ? { fieldType } : {}), ...(opt === true ? { requiredField: true } : {}), ...(Array.isArray(opt) ? { fieldOptions: { values: opt.map(option => ({ option })) }, requiredField: true } : {}) })) }, options: { appendAttribution: false } }, { webhookId: uid() });
const driveTrigger = (name, pos, folder) => node(name, 'n8n-nodes-base.googleDriveTrigger', 1, pos, { pollTimes: { item: [{ mode: 'everyMinute' }] }, triggerOn: 'specificFolder', folderToWatch: { __rl: true, mode: 'id', value: folder }, event: 'fileCreated', options: {} }, cred('googleDriveOAuth2Api'));
const driveDownload = (name, pos) => node(name, 'n8n-nodes-base.googleDrive', 3, pos, { operation: 'download', fileId: { __rl: true, mode: 'id', value: '={{ $json.id }}' }, options: {} }, { ...retry, ...cred('googleDriveOAuth2Api') });
const driveMove = (name, pos, idExpr, folder) => http(name, pos, { method: 'PATCH', url: `={{ 'https://www.googleapis.com/drive/v3/files/' + ${idExpr} + '?addParents=${folder}&removeParents=' + (${idExpr.replace(/\.id$/, '.parents') }|| ['root']).join(',') }}`, auth: 'googleDriveOAuth2Api', body: '={{ JSON.stringify({}) }}' });
const docCreate = (name, pos, titleExpr) => http(name, pos, { method: 'POST', url: 'https://docs.googleapis.com/v1/documents', auth: 'googleDocsOAuth2Api', body: `={{ JSON.stringify({ title: ${titleExpr} }) }}` });
const docWrite = (name, pos, idExpr, reqExpr) => http(name, pos, { method: 'POST', url: `={{ 'https://docs.googleapis.com/v1/documents/' + ${idExpr} + ':batchUpdate' }}`, auth: 'googleDocsOAuth2Api', body: `={{ JSON.stringify({ requests: ${reqExpr} }) }}` });
const docToFolder = (name, pos, idExpr, folder) => http(name, pos, { method: 'PATCH', url: `={{ 'https://www.googleapis.com/drive/v3/files/' + ${idExpr} + '?addParents=${folder}&removeParents=root' }}`, auth: 'googleDriveOAuth2Api', body: '={{ JSON.stringify({}) }}' });
const sticky = (pos, w, h, content, color = 7) => node('Note ' + (seq + 1), 'n8n-nodes-base.stickyNote', 1, pos, { content, width: w, height: h, color });
// connections: wire(conn, 'A', 'B')  or  wire(conn, 'If', ['True branch'], ['False branch'])
function wire(conn, from, ...outs) { conn[from] = { main: outs.map(o => [].concat(o || []).map(n => ({ node: n, type: 'main', index: 0 }))) }; }
const chain = (conn, ...names) => names.slice(0, -1).forEach((n, i) => { (conn[n] = conn[n] || { main: [[]] }).main[0].push({ node: names[i + 1], type: 'main', index: 0 }); });
const settings = { executionOrder: 'v1', saveDataErrorExecution: 'all', saveDataSuccessExecution: 'all', saveManualExecutions: true };
const files = {};
function workflow(file, name, build) { wfNo++; seq = 0; const nodes = [], conn = {}; build(n => (nodes.push(n), n.name), conn); files[file] = { name, nodes, connections: conn, pinData: {}, settings }; }
// shared snippet: pull the JSON object out of Claude's reply
const PARSE = "const raw = ($json.content || []).filter(c => c.type === 'text').map(c => c.text).join('');\nlet ai = null;\nfor (let i = raw.indexOf('{'); i >= 0 && !ai; i = raw.indexOf('{', i + 1)) {\n  let depth = 0, inStr = false, esc = false;\n  for (let k = i; k < raw.length; k++) {\n    const ch = raw[k];\n    if (inStr) { if (esc) esc = false; else if (ch === '\\\\') esc = true; else if (ch === '\"') inStr = false; }\n    else if (ch === '\"') inStr = true;\n    else if (ch === '{') depth++;\n    else if (ch === '}' && --depth === 0) { try { ai = JSON.parse(raw.slice(i, k + 1)); } catch (e) {} break; }\n  }\n}\nif (!ai) throw new Error('Claude did not return JSON: ' + raw.slice(0, 200));";
const X = [0, 220, 440, 660, 880, 1100, 1320, 1540, 1760, 1980, 2200, 2420];

/* =====================================================================
   0. SETUP: folders, the demo spreadsheet, sample files
   ===================================================================== */
const SAMPLES = ['invoice-1-clean.pdf', 'invoice-2-total-wrong.pdf', 'invoice-3-duplicate.pdf', 'discovery-call-transcript.txt'];
const sampleData = Object.fromEntries(SAMPLES.map(f => [f, fs.readFileSync(path.join(HERE, 'samples', f)).toString('base64')]));
workflow('0-setup.json', 'Portfolio demo · 0 Setup (run once)', (add, c) => {
  add(manual('Run setup once', [X[0], 0]));
  add(http('Create demo folder', [X[1], 0], { method: 'POST', url: 'https://www.googleapis.com/drive/v3/files', auth: 'googleDriveOAuth2Api', body: `={{ JSON.stringify({ name: 'Portfolio demos (temporary)', mimeType: 'application/vnd.google-apps.folder' }) }}` }));
  add(code('List subfolders', [X[2], 0], () => {
    const parent = $('Create demo folder').first().json.id;
    return ['Call transcripts (inbox)', 'Proposals', 'Engagement letters', 'Invoices (inbox)', 'Invoices (processed)', 'Sample files'].map(name => ({ json: { name, parent } }));
  }));
  add(http('Create subfolders', [X[3], 0], { method: 'POST', url: 'https://www.googleapis.com/drive/v3/files', auth: 'googleDriveOAuth2Api', body: `={{ JSON.stringify({ name: $json.name, mimeType: 'application/vnd.google-apps.folder', parents: [$json.parent] }) }}` }));
  add(code('Build spreadsheet', [X[4], 0], () => {
    const TABS = __TABS__;
    const d = (h, m = 0) => { const t = new Date(Date.now() + h * 3600e3 + m * 60e3); t.setSeconds(0, 0); return t.toISOString().slice(0, 16).replace('T', ' '); };
    const seed = {
      'Law Clients': [['Ridgeway Property Group LLC', 'Client', 'Commercial lease review', '2026-03-14'], ['Eleanor Vance', 'Client', 'Estate planning', '2026-06-02'], ['Thomas Okafor', 'Client', 'Residential purchase', '2026-08-21'], ['Bellmont Builders Inc.', 'Opposing party', 'Okafor purchase', '2026-08-21'], ['Sandra Whitlock', 'Client', 'Landlord-tenant', '2026-10-05']],
      'Clinic Appointments': [['A-1001', 'Grace Lin', '+1 503 555 0141', d(47, 50), 'Booked', '', '', '', ''], ['A-1002', 'Samuel Ortiz', '+1 503 555 0127', d(1, 50), 'Confirmed', 'Sent', '', '', ''], ['A-1003', 'Priya Nair', '+1 503 555 0163', d(-3), 'No-show', 'Sent', 'Sent', '', ''], ['A-1004', 'Daniel Brooks', '+1 503 555 0118', d(-4), 'Completed', 'Sent', 'Sent', '', ''], ['A-1005', 'Hannah Schmidt', '+1 503 555 0172', d(96), 'Booked', '', '', '', ''], ['A-1006', 'Owen Clarke', '+1 503 555 0109', d(-26), 'Completed', 'Sent', 'Sent', '', 'Sent']],
      'Coach CRM': [['Marcus Hale', 'Hale & Bright Logistics', '', 'Discovery call booked', '', '', '', '', '', '', d(-48)]],
    };
    const cell = (v, bold) => ({ userEnteredValue: { stringValue: String(v) }, ...(bold ? { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: .93, green: .91, blue: .86 } } } : {}) });
    const sheets = Object.entries(TABS).map(([title, head]) => ({ properties: { title, gridProperties: { frozenRowCount: 1 } }, data: [{ startRow: 0, startColumn: 0, rowData: [{ values: head.map(h => cell(h, true)) }, ...(seed[title] || []).map(r => ({ values: r.map(v => cell(v)) }))] }] }));
    return [{ json: { body: { properties: { title: 'Portfolio demos (sample data)' }, sheets } } }];
  }, { __TABS__: JSON.stringify(TABS) }));
  add(http('Create spreadsheet', [X[5], 0], { method: 'POST', url: 'https://sheets.googleapis.com/v4/spreadsheets', auth: 'googleSheetsOAuth2Api', body: '={{ JSON.stringify($json.body) }}' }));
  add(docToFolder('Move spreadsheet to folder', [X[6], 0], "$json.spreadsheetId", "' + $('Create demo folder').first().json.id + '"));
  add(code('Sample files', [X[7], 0], () => {
    const DATA = __DATA__;
    return Object.entries(DATA).map(([name, b64]) => ({ json: { name }, binary: { data: { data: b64, fileName: name, mimeType: name.endsWith('.pdf') ? 'application/pdf' : 'text/plain' } } }));
  }, { __DATA__: JSON.stringify(sampleData) }));
  add(http('Upload sample', [X[8], 0], { method: 'POST', url: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=media', auth: 'googleDriveOAuth2Api', binary: 'data' }));
  add(http('Name and file sample', [X[9], 0], { method: 'PATCH', url: `={{ 'https://www.googleapis.com/drive/v3/files/' + $json.id + '?removeParents=root&addParents=' + $('Create subfolders').all().find(f => f.json.name === 'Sample files').json.id }}`, auth: 'googleDriveOAuth2Api', body: `={{ JSON.stringify({ name: $('Sample files').item.json.name }) }}` }));
  add(code('Config to copy', [X[10], 0], () => {
    const folders = { root: $('Create demo folder').first().json.id };
    const key = { 'Call transcripts (inbox)': 'transcripts', Proposals: 'proposals', 'Engagement letters': 'letters', 'Invoices (inbox)': 'invoices', 'Invoices (processed)': 'processed', 'Sample files': 'samples' };
    for (const f of $('Create subfolders').all()) folders[key[f.json.name]] = f.json.id;
    const samples = {}; for (const f of $('Name and file sample').all()) samples[f.json.name] = f.json.id;
    return [{ json: { config: JSON.stringify({ spreadsheetId: $('Create spreadsheet').first().json.spreadsheetId, folders, samples }) } }];
  }));
  chain(c, 'Run setup once', 'Create demo folder', 'List subfolders', 'Create subfolders', 'Build spreadsheet', 'Create spreadsheet', 'Move spreadsheet to folder', 'Sample files', 'Upload sample', 'Name and file sample', 'Config to copy');
});
// "Build spreadsheet" must run once, not once per subfolder
files['0-setup.json'].nodes.find(n => n.name === 'Build spreadsheet').executeOnce = true;
files['0-setup.json'].nodes.find(n => n.name === 'Sample files').executeOnce = true;
files['0-setup.json'].nodes.find(n => n.name === 'Move spreadsheet to folder').parameters.url = "={{ 'https://www.googleapis.com/drive/v3/files/' + $json.spreadsheetId + '?removeParents=root&addParents=' + $('Create demo folder').first().json.id }}";

/* helper: copies a sample file into an inbox folder, the way a person would drop one in */
workflow('0-drop-sample.json', 'Portfolio demo · 0 Drop a sample file', (add, c) => {
  const S = cfg.samples || {};
  add(manual('Drop a file', [X[0], 0]));
  add(code('Which file?', [X[1], 0], () => {
    // change PICK to: transcript | invoice1 | invoice2 | invoice3
    const PICK = 'transcript';
    const all = __ALL__;
    return [{ json: all[PICK] }];
  }, { __ALL__: JSON.stringify({ transcript: { id: S['discovery-call-transcript.txt'], name: 'Discovery call - Marcus Hale.txt', folder: F('transcripts') }, invoice1: { id: S['invoice-1-clean.pdf'], name: 'Northgate Medical Supply NMS-20418.pdf', folder: F('invoices') }, invoice2: { id: S['invoice-2-total-wrong.pdf'], name: 'Cascade Office Cleaning COC-1187.pdf', folder: F('invoices') }, invoice3: { id: S['invoice-3-duplicate.pdf'], name: 'Northgate invoice (resent).pdf', folder: F('invoices') } }) }));
  add(http('Copy into the inbox', [X[2], 0], { method: 'POST', url: "={{ 'https://www.googleapis.com/drive/v3/files/' + $json.id + '/copy' }}", auth: 'googleDriveOAuth2Api', body: '={{ JSON.stringify({ name: $json.name, parents: [$json.folder] }) }}' }));
  chain(c, 'Drop a file', 'Which file?', 'Copy into the inbox');
});

/* =====================================================================
   1. LAW OFFICE: new-client intake → conflict check → engagement letter → attorney approval
   ===================================================================== */
workflow('1-law-intake.json', 'Law office · New-client intake to engagement letter', (add, c) => {
  const W = 'Law intake';
  add(form('New client intake form', [X[0], 0], 'New client enquiry', 'Tell us about your matter. Hartwell & Reed LLP will review it and reply within one business day.', [['Full name', null, true], ['Email', 'email', true], ['Phone', null], ['Type of matter', 'dropdown', ['Buying a property', 'Selling a property', 'Estate planning', 'Landlord and tenant', 'Something else']], ["Other party's name (if any)", null], ['What do you need help with?', 'textarea', true]]));
  add(code('Tidy the answers', [X[1], 0], () => {
    const j = $input.first().json, t = v => String(v || '').trim().replace(/\s+/g, ' ');
    return [{ json: { name: t(j['Full name']), email: t(j['Email']).toLowerCase(), phone: t(j['Phone']), matter: t(j['Type of matter']), otherParty: t(j["Other party's name (if any)"]), details: String(j['What do you need help with?'] || '').trim(), received: new Date().toISOString() } }];
  }));
  add(sheetRead('Load client list', [X[2], 0], 'Law Clients'));
  add(code('Conflict check', [X[3], 0], () => {
    // Exact rule, done in code (not by AI): does the new client or the other party match anyone we already act for or against?
    const intake = $('Tidy the answers').first().json;
    const norm = s => String(s || '').toLowerCase().replace(/\b(llc|llp|inc|ltd|co|corp|group|the)\b|[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
    const same = (a, b) => { const A = norm(a), B = norm(b); if (!A.length || !B.length) return false; const hit = A.filter(w => B.includes(w)).length; return hit >= Math.min(2, Math.min(A.length, B.length)) && hit / Math.min(A.length, B.length) >= 0.99; };
    const hits = [];
    for (const row of $input.all().map(i => i.json)) {
      if (same(intake.otherParty, row.Name) && row.Role === 'Client') hits.push(`The other party, ${intake.otherParty}, is an existing client (${row.Matter}).`);
      if (same(intake.name, row.Name) && row.Role === 'Opposing party') hits.push(`${intake.name} is the opposing party in an open matter (${row.Matter}).`);
    }
    return [{ json: { ...intake, conflict: hits.length > 0, conflictNote: hits.join(' ') || 'Clear: no match in the client list.' } }];
  }));
  add(code('Build Claude request', [X[4], 0], () => {
    const j = $json;
    const prompt = `You help a small law office triage new-client enquiries. Read the enquiry and reply with ONLY a JSON object:
{"summary": "2 sentences, plain English, no legal advice", "practiceArea": one of ["Real estate", "Estate planning", "Landlord-tenant", "Other"], "urgency": one of ["Low", "Normal", "High"], "scope": "one sentence describing the work the firm would do, starting with a verb"}
Urgency is High only if a deadline within 14 days is mentioned.

Matter type chosen: ${j.matter}
Other party: ${j.otherParty || 'none given'}
Enquiry: ${j.details}`;
    return [{ json: { ...j, body: { model: '__MODEL__', max_tokens: 600, messages: [{ role: 'user', content: prompt }] } } }];
  }, { __MODEL__: MODEL }));
  add(claude('Claude: summarise and classify', [X[5], 0]));
  add(code("Check Claude's answer", [X[6], 0], () => {
    __PARSE__
    const intake = $('Conflict check').first().json;
    const pick = (v, list, d) => (list.includes(v) ? v : d);
    return [{ json: { ...intake, summary: String(ai.summary || '').slice(0, 600), practiceArea: pick(ai.practiceArea, ['Real estate', 'Estate planning', 'Landlord-tenant', 'Other'], 'Other'), urgency: pick(ai.urgency, ['Low', 'Normal', 'High'], 'Normal'), scope: String(ai.scope || 'Advise on the matter described in your enquiry').slice(0, 300) } }];
  }, { __PARSE__: PARSE }));
  add(iff('Conflict found?', [X[7], 0], '={{ $json.conflict }}'));
  const row = (status, letter) => ({ Received: "={{ $('Check Claude\\'s answer').first().json.received.slice(0, 16).replace('T', ' ') }}", Client: "={{ $('Check Claude\\'s answer').first().json.name }}", Email: "={{ $('Check Claude\\'s answer').first().json.email }}", Phone: "={{ $('Check Claude\\'s answer').first().json.phone }}", 'Matter type': "={{ $('Check Claude\\'s answer').first().json.matter }}", 'Practice area': "={{ $('Check Claude\\'s answer').first().json.practiceArea }}", Urgency: "={{ $('Check Claude\\'s answer').first().json.urgency }}", 'Other party': "={{ $('Check Claude\\'s answer').first().json.otherParty }}", Summary: "={{ $('Check Claude\\'s answer').first().json.summary }}", 'Conflict check': "={{ $('Check Claude\\'s answer').first().json.conflictNote }}", 'Engagement letter': letter, Status: status });
  add(sheetAppend('Put on hold for the attorney', [X[8], -180], 'Law Intake', row('On hold: possible conflict', '')));
  add(outbox('Alert the attorney', [X[9], -180], W, { Channel: 'Email', To: 'Managing attorney', Message: "={{ 'Possible conflict on a new enquiry from ' + $('Check Claude\\'s answer').first().json.name + '. ' + $('Check Claude\\'s answer').first().json.conflictNote + ' Nothing has been sent to the enquirer.' }}", Status: 'Queued (demo outbox)' }));
  add(code('Draft the letter', [X[8], 120], () => {
    const j = $json, today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const title = 'ENGAGEMENT LETTER';
    const text = `${title}\n\nHartwell & Reed LLP\n${today}\n\n${j.name}\n${j.email}\n\nDear ${j.name.split(' ')[0]},\n\nThank you for contacting Hartwell & Reed LLP. This letter confirms the terms on which we will act for you.\n\n1. Scope of work\nWe will: ${j.scope.replace(/\.$/, '')}. Matter type: ${j.matter} (${j.practiceArea}).\n\n2. Who will handle your matter\nYour matter will be handled by the attorney named in the signature below, supported by our paralegal team.\n\n3. Fees\nOur fees are set out in the attached fee schedule, which forms part of this letter. We will tell you before doing any work outside the scope above.\n\n4. Conflicts\nWe have checked our records and found no conflict of interest in acting for you${j.otherParty ? ' in a matter involving ' + j.otherParty : ''}.\n\n5. Next step\nPlease sign and return this letter. We will start work once we receive it.\n\nYours sincerely,\n\n______________________\nAttorney, Hartwell & Reed LLP\n\nAccepted by: ______________________   Date: ____________\n`;
    const requests = [{ insertText: { location: { index: 1 }, text } }, { updateParagraphStyle: { range: { startIndex: 1, endIndex: 1 + title.length }, paragraphStyle: { namedStyleType: 'TITLE' }, fields: 'namedStyleType' } }];
    return [{ json: { ...j, docTitle: `Engagement letter - ${j.name}`, requests } }];
  }));
  add(docCreate('Create the letter', [X[9], 120], '$json.docTitle'));
  add(docWrite('Write the letter', [X[10], 120], '$json.documentId', "$('Draft the letter').first().json.requests"));
  add(docToFolder('File it in the letters folder', [X[11], 120], "$('Create the letter').first().json.documentId", F('letters')));
  add(sheetAppend('Add to intake sheet', [X[11] + 220, 120], 'Law Intake', row('Awaiting attorney approval', "={{ 'https://docs.google.com/document/d/' + $('Create the letter').first().json.documentId + '/edit' }}")));
  // second trigger: nothing goes to the client until the attorney approves it in the sheet
  add(node('Attorney changes the status', 'n8n-nodes-base.googleSheetsTrigger', 1, [X[0], 460], { pollTimes: { item: [{ mode: 'everyMinute' }] }, documentId: doc, sheetName: tab('Law Intake'), event: 'rowUpdate', options: { columnsToWatch: ['Status'] } }, cred('googleSheetsTriggerOAuth2Api')));
  add(iff('Approved?', [X[1], 460], "={{ $json.Status === 'Approved' }}"));
  add(outbox('Send letter for signature', [X[2], 440], W, { Channel: 'Email', To: '={{ $json.Email }}', Message: "={{ 'Dear ' + $json.Client.split(' ')[0] + ', thank you for your enquiry. Your engagement letter is ready to review and sign: ' + $json['Engagement letter'] }}", Status: 'Queued (demo outbox)', Ref: '={{ $json.Email }}' }));
  add(sheetUpdate('Mark as sent', [X[3], 440], 'Law Intake', 'Email', { Email: '={{ $json.Ref }}', Status: 'Letter sent for signature' }));
  add(sticky([X[0] - 60, 360], 980, 300, '### Human step\nNothing reaches the client until the attorney sets **Status = Approved** in the intake sheet.', 4));
  chain(c, 'New client intake form', 'Tidy the answers', 'Load client list', 'Conflict check', 'Build Claude request', 'Claude: summarise and classify', "Check Claude's answer", 'Conflict found?');
  wire(c, 'Conflict found?', ['Put on hold for the attorney'], ['Draft the letter']);
  chain(c, 'Put on hold for the attorney', 'Alert the attorney');
  chain(c, 'Draft the letter', 'Create the letter', 'Write the letter', 'File it in the letters folder', 'Add to intake sheet');
  chain(c, 'Attorney changes the status', 'Approved?');
  wire(c, 'Approved?', ['Send letter for signature'], []);
  chain(c, 'Send letter for signature', 'Mark as sent');
});
files['1-law-intake.json'].nodes.find(n => n.name === 'Conflict check').parameters.jsCode; // (kept for clarity)
files['1-law-intake.json'].nodes.find(n => n.name === 'Load client list').alwaysOutputData = true;

/* =====================================================================
   2. REAL ESTATE: speed-to-lead responder
   ===================================================================== */
workflow('2-real-estate-speed-to-lead.json', 'Real estate · Speed-to-lead responder', (add, c) => {
  const W = 'Speed to lead';
  add(form('New enquiry from the website', [X[0], -100], 'Ask about a property', 'Tell us what you are looking for and an agent from Lakeshore Realty will text you back.', [['Name', null, true], ['Email', 'email', true], ['Mobile number', null, true], ['I am interested in', 'dropdown', ['Buying', 'Selling', 'Renting']], ['Area or property', null, true], ['Budget', null], ['When do you want to move?', 'dropdown', ['As soon as possible', 'Within 3 months', '3 to 6 months', 'Just looking']], ['Anything else?', 'textarea']]));
  add(node('Missed call from the phone system', 'n8n-nodes-base.webhook', 2, [X[0], 120], { httpMethod: 'POST', path: 'demo-missed-call', options: {} }, { webhookId: uid() }));
  add(code('Tidy the lead', [X[1], 0], () => {
    const j = $input.first().json, b = j.body || null, t = v => String(v || '').trim();
    const lead = b ? { name: t(b.callerName) || 'Unknown caller', email: '', phone: t(b.from), source: 'Missed call', interest: 'Unknown', area: '', budget: '', timeline: 'Unknown', message: '' }
      : { name: t(j['Name']), email: t(j['Email']).toLowerCase(), phone: t(j['Mobile number']), source: 'Website form', interest: t(j['I am interested in']), area: t(j['Area or property']), budget: t(j['Budget']), timeline: t(j['When do you want to move?']), message: t(j['Anything else?']) };
    return [{ json: { ...lead, receivedAt: Date.now(), received: new Date().toISOString().slice(0, 19).replace('T', ' ') } }];
  }));
  add(code('Score the lead', [X[2], 0], () => {
    // The score is rules in code, so it is the same every time and the agent can see why.
    const j = $json, why = []; let score = 20;
    const add = (n, r) => { score += n; why.push(r); };
    if (j.timeline === 'As soon as possible') add(35, 'wants to move now'); else if (j.timeline === 'Within 3 months') add(25, 'moving within 3 months'); else if (j.timeline === '3 to 6 months') add(10, '3 to 6 months out');
    if (/\d/.test(j.budget)) add(15, 'gave a budget');
    if (j.interest === 'Selling') add(15, 'has a property to sell'); else if (j.interest === 'Buying') add(10, 'buyer');
    if (j.area) add(5, 'named an area');
    if (j.source === 'Missed call') add(30, 'called us directly');
    score = Math.min(100, score);
    return [{ json: { ...j, score, temperature: score >= 70 ? 'Hot' : score >= 45 ? 'Warm' : 'Cold', hot: score >= 70, why: why.join(', ') || 'little information yet' } }];
  }));
  add(code('Build Claude request', [X[3], 0], () => {
    const j = $json;
    const prompt = `You write the first text message a real estate agency sends to a new lead. Agency: Lakeshore Realty. Agent: Maya.
Rules: under 320 characters, friendly and specific to what they asked, no emojis, no promises about price or availability, end with ONE easy question that moves things forward. If we only have a missed call, apologise for missing it and ask what they are looking for.
Reply with ONLY a JSON object: {"sms": "..."}

Lead: ${JSON.stringify({ name: j.name, source: j.source, interest: j.interest, area: j.area, budget: j.budget, timeline: j.timeline, message: j.message })}`;
    return [{ json: { ...j, body: { model: '__MODEL__', max_tokens: 400, messages: [{ role: 'user', content: prompt }] } } }];
  }, { __MODEL__: MODEL }));
  add(claude('Claude: write the first reply', [X[4], 0]));
  add(code('Check the reply', [X[5], 0], () => {
    __PARSE__
    const lead = $('Score the lead').first().json;
    let sms = String(ai.sms || '').trim();
    if (!sms || sms.length > 480) sms = `Hi ${lead.name.split(' ')[0]}, this is Maya at Lakeshore Realty. Thanks for getting in touch. When is a good time for a quick call today?`;
    return [{ json: { ...lead, sms, repliedIn: Math.max(1, Math.round((Date.now() - lead.receivedAt) / 1000)) } }];
  }, { __PARSE__: PARSE }));
  add(outbox('Text the lead back', [X[6], 0], W, { Channel: 'SMS', To: '={{ $json.phone }}', Message: '={{ $json.sms }}', Status: 'Queued (demo outbox)' }));
  const L = "$('Check the reply').first().json";
  add(sheetAppend('Save to the CRM', [X[7], 0], 'RE Leads', { Received: `={{ ${L}.received }}`, Name: `={{ ${L}.name }}`, Email: `={{ ${L}.email }}`, Phone: `={{ ${L}.phone }}`, Source: `={{ ${L}.source }}`, Interest: `={{ ${L}.interest }}`, Area: `={{ ${L}.area }}`, Budget: `={{ ${L}.budget }}`, Timeline: `={{ ${L}.timeline }}`, Score: `={{ ${L}.score }}`, Temperature: `={{ ${L}.temperature }}`, Why: `={{ ${L}.why }}`, 'First reply': `={{ ${L}.sms }}`, 'Replied in (seconds)': `={{ ${L}.repliedIn }}`, 'Next step': `={{ ${L}.hot ? 'Agent to call now' : 'Follow-up in 2 days' }}` }));
  add(iff('Hot lead?', [X[8], 0], `={{ ${L}.hot }}`));
  add(code('Next viewing slots', [X[9], -140], () => {
    const lead = $('Check the reply').first().json, slots = [], d = new Date();
    while (slots.length < 3) { d.setDate(d.getDate() + 1); if (d.getDay() % 6) slots.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + (slots.length % 2 ? ' 4:00 pm' : ' 10:30 am')); }
    return [{ json: { ...lead, alert: `HOT LEAD (${lead.score}/100): ${lead.name}, ${lead.phone}. ${lead.interest}${lead.area ? ' in ' + lead.area : ''}${lead.budget ? ', budget ' + lead.budget : ''}. Why: ${lead.why}. Already texted back in ${lead.repliedIn}s. Open slots to offer: ${slots.join(' / ')}.` } }];
  }));
  add(outbox('Alert the agent now', [X[10], -140], W, { Channel: 'Agent alert', To: 'Maya (agent on duty)', Message: '={{ $json.alert }}', Status: 'Queued (demo outbox)' }));
  add(outbox('Schedule a follow-up', [X[9], 140], W, { Channel: 'SMS (scheduled)', To: `={{ ${L}.phone }}`, Message: `={{ 'Follow-up to ' + ${L}.name + ' in 2 days if there is no reply.' }}`, Status: "={{ 'Scheduled for ' + $now.plus({ days: 2 }).toFormat('ccc d LLL, HH:mm') }}" }));
  chain(c, 'New enquiry from the website', 'Tidy the lead');
  chain(c, 'Missed call from the phone system', 'Tidy the lead');
  chain(c, 'Tidy the lead', 'Score the lead', 'Build Claude request', 'Claude: write the first reply', 'Check the reply', 'Text the lead back', 'Save to the CRM', 'Hot lead?');
  wire(c, 'Hot lead?', ['Next viewing slots'], ['Schedule a follow-up']);
  chain(c, 'Next viewing slots', 'Alert the agent now');
});

/* =====================================================================
   3. CLINIC: reminders, no-show recovery, review requests (rules only, no AI, no health details)
   ===================================================================== */
workflow('3-clinic-reminders.json', 'Clinic · Reminders, no-show recovery and reviews', (add, c) => {
  const W = 'Clinic reminders';
  add(node('Every 15 minutes', 'n8n-nodes-base.scheduleTrigger', 1.2, [X[0], -100], { rule: { interval: [{ field: 'cronExpression', expression: '*/15 * * * *' }] } }));
  add(manual('Run now', [X[0], 120]));
  add(sheetRead('Load appointments', [X[1], 0], 'Clinic Appointments'));
  add(code('What is due?', [X[2], 0], () => {
    // Plain rules. Each appointment can need at most one message per run.
    const now = Date.now(), H = 3600e3, due = [];
    for (const a of $input.all().map(i => i.json)) {
      const start = new Date(String(a.Starts).replace(' ', 'T')).getTime(); if (!a['Appt ID'] || isNaN(start)) continue;
      const until = (start - now) / H, first = String(a.Patient).split(' ')[0];
      const when = new Date(start).toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
      const base = { id: a['Appt ID'], patient: a.Patient, first, phone: a.Phone, when };
      if (a.Status === 'No-show' && !a['Rebook offer']) due.push({ ...base, type: 'No-show', column: 'Rebook offer' });
      else if (a.Status === 'Completed' && !a['Review request'] && until < -2) due.push({ ...base, type: 'Review', column: 'Review request' });
      else if (['Booked', 'Confirmed'].includes(a.Status) && until > 0 && until <= 2 && !a['Reminder 2h']) due.push({ ...base, type: '2 hours', column: 'Reminder 2h' });
      else if (a.Status === 'Booked' && until > 2 && until <= 48 && !a['Reminder 48h']) due.push({ ...base, type: '48 hours', column: 'Reminder 48h' });
    }
    return due.map(json => ({ json }));
  }));
  add(node('Which message?', 'n8n-nodes-base.switch', 3, [X[3], 0], { rules: { values: [['48 hours', '48-hour reminder'], ['2 hours', '2-hour reminder'], ['No-show', 'No-show'], ['Review', 'Review request']].map(([v, k]) => ({ conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, combinator: 'and', conditions: [{ id: uid(), leftValue: '={{ $json.type }}', rightValue: v, operator: { type: 'string', operation: 'equals' } }] }, renameOutput: true, outputKey: k })) }, options: {} }));
  // Messages never mention the reason for the visit, the clinician or any health detail.
  add(codeEach('48-hour reminder', [X[4], -300], () => { return { json: { ...$json, message: `Hi ${$json.first}, a reminder of your appointment at Brightside Family Clinic on ${$json.when}. Reply C to confirm or R to reschedule.` } }; }));
  add(codeEach('2-hour reminder', [X[4], -100], () => { return { json: { ...$json, message: `Hi ${$json.first}, we will see you at Brightside Family Clinic today at ${$json.when.split(', ').pop()}. Running late? Reply and we will let the front desk know.` } }; }));
  add(codeEach('Offer to rebook', [X[4], 100], () => { return { json: { ...$json, message: `Hi ${$json.first}, sorry we missed you today. You can pick a new time here: brightsideclinic.example/rebook or reply and we will call you.` } }; }));
  add(codeEach('Ask for a review', [X[4], 300], () => { return { json: { ...$json, message: `Hi ${$json.first}, thank you for visiting Brightside Family Clinic. If you have a minute, we would be grateful for a review: brightsideclinic.example/review` } }; }));
  add(outbox('Queue the text', [X[5], 0], W, { Channel: 'SMS', To: '={{ $json.phone }}', Message: '={{ $json.message }}', Status: 'Queued (demo outbox)', Ref: "={{ $json.id + '|' + $json.column }}" }));
  add(codeEach('Stamp to write back', [X[6], 0], () => { const [id, column] = String($json.Ref).split('|'); return { json: { 'Appt ID': id, [column]: 'Sent ' + new Date().toISOString().slice(0, 16).replace('T', ' ') } }; }));
  add(sheetUpdateAuto('Mark as sent', [X[7], 0], 'Clinic Appointments', 'Appt ID'));
  add(code('Front-desk list', [X[3], 420], () => {
    const items = $input.all().map(i => i.json); if (!items.length) return [];
    const count = t => items.filter(i => i.type === t).length;
    const noshow = items.filter(i => i.type === 'No-show').map(i => i.patient).join(', ');
    return [{ json: { text: `This run: ${count('48 hours')} reminder(s) for the day after tomorrow, ${count('2 hours')} for today, ${count('No-show')} rebooking offer(s), ${count('Review')} review request(s).${noshow ? ' To call if they do not rebook: ' + noshow + '.' : ''}` } }];
  }));
  add(outbox('Send list to front desk', [X[4], 520], W, { Channel: 'Email', To: 'Front desk', Message: '={{ $json.text }}', Status: 'Queued (demo outbox)' }));
  chain(c, 'Every 15 minutes', 'Load appointments'); chain(c, 'Run now', 'Load appointments');
  chain(c, 'Load appointments', 'What is due?');
  c['What is due?'] = { main: [[{ node: 'Which message?', type: 'main', index: 0 }, { node: 'Front-desk list', type: 'main', index: 0 }]] };
  wire(c, 'Which message?', ['48-hour reminder'], ['2-hour reminder'], ['Offer to rebook'], ['Ask for a review']);
  for (const n of ['48-hour reminder', '2-hour reminder', 'Offer to rebook', 'Ask for a review']) chain(c, n, 'Queue the text');
  chain(c, 'Queue the text', 'Stamp to write back', 'Mark as sent');
  chain(c, 'Front-desk list', 'Send list to front desk');
});

/* =====================================================================
   4. COACH / CONSULTANT: discovery call → notes → CRM → proposal → follow-up draft
   ===================================================================== */
workflow('4-coach-call-to-proposal.json', 'Coaching · Discovery call to proposal', (add, c) => {
  const W = 'Call to proposal';
  add(driveTrigger('New call transcript', [X[0], 0], F('transcripts')));
  add(driveDownload('Download the transcript', [X[1], 0]));
  add(code('Build Claude request', [X[2], 0], async function () {
    const buf = await this.helpers.getBinaryDataBuffer(0, 'data');
    const transcript = buf.toString('utf8').slice(0, 60000);
    const prompt = `You are the assistant to Dana Whitfield, a leadership coach. Read this discovery-call transcript and reply with ONLY a JSON object:
{"client": "full name", "company": "", "role": "",
 "goals": ["3 to 5 short bullets, in the client's own terms"],
 "challenges": ["2 to 4 short bullets"],
 "objections": ["what might stop them buying, 1 to 3 bullets"],
 "nextSteps": ["who does what by when, from the call only"],
 "programme": one of ["Starter sprint (4 weeks)", "Director programme (12 weeks)", "Advisory retainer (monthly)"],
 "situation": "one paragraph for the proposal: where they are now",
 "outcomes": ["3 measurable outcomes to agree, based on what was said"],
 "approach": "one paragraph: how the programme would run for this client",
 "followUpEmail": "a short, warm follow-up email from Dana, plain text, no price"}
Use only what is in the transcript. Do not invent prices, dates or results.

TRANSCRIPT:
${transcript}`;
    return [{ json: { fileName: $input.first().json.name || $('New call transcript').first().json.name, body: { model: '__MODEL__', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] } } }];
  }, { __MODEL__: MODEL }));
  add(claude('Claude: notes and proposal', [X[3], 0]));
  add(code('Check the notes', [X[4], 0], () => {
    __PARSE__
    const list = v => (Array.isArray(v) ? v : [v]).filter(Boolean).map(String).slice(0, 6);
    if (!ai.client) throw new Error('No client name found in the transcript');
    const programmes = ['Starter sprint (4 weeks)', 'Director programme (12 weeks)', 'Advisory retainer (monthly)'];
    const n = { client: String(ai.client), company: String(ai.company || ''), role: String(ai.role || ''), goals: list(ai.goals), challenges: list(ai.challenges), objections: list(ai.objections), nextSteps: list(ai.nextSteps), programme: programmes.includes(ai.programme) ? ai.programme : programmes[1], situation: String(ai.situation || ''), outcomes: list(ai.outcomes), approach: String(ai.approach || ''), followUpEmail: String(ai.followUpEmail || '') };
    // build the proposal document: text first, then heading styles by position
    const parts = [['TITLE', `Coaching proposal for ${n.client}`], ['', `${n.company}\nPrepared by Dana Whitfield, Whitfield Leadership Coaching\n${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      ['HEADING_1', 'Where you are now'], ['', n.situation], ['HEADING_1', 'What we will work towards'], ['', n.outcomes.map(o => '•  ' + o).join('\n')],
      ['HEADING_1', 'How it works'], ['', `Recommended: ${n.programme}\n${n.approach}`], ['HEADING_1', 'Investment'], ['', '[Dana to add the fee before sending]'],
      ['HEADING_1', 'Next steps'], ['', n.nextSteps.map(o => '•  ' + o).join('\n')]];
    let text = '', requests = [];
    for (const [style, t] of parts) { const start = 1 + text.length; text += t + '\n'; if (style) requests.push({ updateParagraphStyle: { range: { startIndex: start, endIndex: start + t.length }, paragraphStyle: { namedStyleType: style }, fields: 'namedStyleType' } }); }
    requests.unshift({ insertText: { location: { index: 1 }, text } });
    return [{ json: { ...n, docTitle: `Proposal - ${n.client}`, requests } }];
  }, { __PARSE__: PARSE }));
  add(docCreate('Create the proposal', [X[5], 0], '$json.docTitle'));
  add(docWrite('Write the proposal', [X[6], 0], '$json.documentId', "$('Check the notes').first().json.requests"));
  add(docToFolder('File it in Proposals', [X[7], 0], "$('Create the proposal').first().json.documentId", F('proposals')));
  const N = "$('Check the notes').first().json";
  add(sheetUpsert('Update the CRM', [X[8], 0], 'Coach CRM', 'Client', { Client: `={{ ${N}.client }}`, Company: `={{ ${N}.company }}`, Role: `={{ ${N}.role }}`, Stage: 'Proposal drafted', Goals: `={{ ${N}.goals.join('\\n') }}`, Challenges: `={{ ${N}.challenges.join('\\n') }}`, Objections: `={{ ${N}.objections.join('\\n') }}`, 'Next steps': `={{ ${N}.nextSteps.join('\\n') }}`, 'Recommended programme': `={{ ${N}.programme }}`, Proposal: "={{ 'https://docs.google.com/document/d/' + $('Create the proposal').first().json.documentId + '/edit' }}", 'Last updated': NOW }));
  add(outbox('Save follow-up as a draft', [X[9], 0], W, { Channel: 'Email draft', To: `={{ ${N}.client }}`, Message: `={{ ${N}.followUpEmail }}`, Status: 'Draft: waiting for Dana to review and add the fee' }));
  chain(c, 'New call transcript', 'Download the transcript', 'Build Claude request', 'Claude: notes and proposal', 'Check the notes', 'Create the proposal', 'Write the proposal', 'File it in Proposals', 'Update the CRM', 'Save follow-up as a draft');
});

/* =====================================================================
   5. ANY OFFICE: invoice inbox → AI reads → code checks → books or approval queue
   ===================================================================== */
workflow('5-invoice-inbox-to-books.json', 'Back office · Invoice inbox to books', (add, c) => {
  const W = 'Invoices';
  add(driveTrigger('New invoice in the inbox', [X[0], 0], F('invoices')));
  add(driveDownload('Download the invoice', [X[1], 0]));
  add(code('Build Claude request', [X[2], 0], async function () {
    const file = $input.first(), buf = await this.helpers.getBinaryDataBuffer(0, 'data');
    const prompt = `Read this invoice and reply with ONLY a JSON object, copying the numbers exactly as printed (do not correct them):
{"vendor": "", "invoiceNumber": "", "invoiceDate": "YYYY-MM-DD", "dueDate": "YYYY-MM-DD or empty", "currency": "USD", "lines": [{"description": "", "quantity": 0, "unitPrice": 0, "amount": 0}], "subtotal": 0, "tax": 0, "total": 0}`;
    return [{ json: { fileId: file.json.id, fileName: file.json.name, body: { model: '__MODEL__', max_tokens: 1500, messages: [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') } }, { type: 'text', text: prompt }] }] } } }];
  }, { __MODEL__: MODEL }));
  add(claude('Claude: read the invoice', [X[3], 0]));
  add(code('Check the maths', [X[4], 0], () => {
    __PARSE__
    // AI reads; code checks. Money is compared in cents so rounding cannot hide a mistake.
    const src = $('Build Claude request').first().json, cents = v => Math.round(Number(v) * 100), problems = [];
    const lines = Array.isArray(ai.lines) ? ai.lines : [];
    if (!ai.vendor) problems.push('No vendor name found');
    if (!ai.invoiceNumber) problems.push('No invoice number found');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ai.invoiceDate || '')) problems.push('Invoice date could not be read');
    if (!(Number(ai.total) > 0)) problems.push('Total is missing or zero');
    const lineSum = lines.reduce((s, l) => s + cents(l.amount), 0);
    for (const l of lines) if (cents(l.quantity * l.unitPrice) !== cents(l.amount)) problems.push(`Line "${String(l.description).slice(0, 40)}": ${l.quantity} x ${l.unitPrice} is not ${l.amount}`);
    if (lines.length && lineSum !== cents(ai.subtotal)) problems.push(`Lines add up to ${(lineSum / 100).toFixed(2)} but the subtotal says ${Number(ai.subtotal).toFixed(2)}`);
    if (cents(ai.subtotal) + cents(ai.tax || 0) !== cents(ai.total)) problems.push(`Subtotal + tax is ${((cents(ai.subtotal) + cents(ai.tax || 0)) / 100).toFixed(2)} but the total says ${Number(ai.total).toFixed(2)}`);
    return [{ json: { ...src, body: undefined, vendor: String(ai.vendor || ''), invoiceNumber: String(ai.invoiceNumber || ''), invoiceDate: ai.invoiceDate || '', dueDate: ai.dueDate || '', currency: ai.currency || 'USD', subtotal: Number(ai.subtotal) || 0, tax: Number(ai.tax) || 0, total: Number(ai.total) || 0, lineCount: lines.length, problems } }];
  }, { __PARSE__: PARSE }));
  add(sheetRead('Load the books', [X[5], 0], 'Books'));
  add(code('Seen before?', [X[6], 0], () => {
    const inv = $('Check the maths').first().json, key = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const dup = $input.all().map(i => i.json).find(r => key(r['Invoice no']) === key(inv.invoiceNumber) && key(r.Vendor) === key(inv.vendor) && inv.invoiceNumber);
    const problems = [...inv.problems, ...(dup ? [`Duplicate: invoice ${inv.invoiceNumber} from ${inv.vendor} was already logged on ${dup.Logged}`] : [])];
    return [{ json: { ...inv, problems, ok: problems.length === 0, link: 'https://drive.google.com/file/d/' + inv.fileId + '/view' } }];
  }));
  add(iff('All checks passed?', [X[7], 0], '={{ $json.ok }}'));
  const I = "$('Seen before?').first().json";
  add(sheetAppend('Add to the books', [X[8], -140], 'Books', { Logged: NOW, Vendor: `={{ ${I}.vendor }}`, 'Invoice no': `={{ ${I}.invoiceNumber }}`, 'Invoice date': `={{ ${I}.invoiceDate }}`, 'Due date': `={{ ${I}.dueDate }}`, Subtotal: `={{ ${I}.subtotal }}`, Tax: `={{ ${I}.tax }}`, Total: `={{ ${I}.total }}`, Currency: `={{ ${I}.currency }}`, Checks: `={{ ${I}.lineCount + ' lines, totals agree' }}`, File: `={{ ${I}.link }}` }));
  add(sheetAppend('Send to approval queue', [X[8], 140], 'Approval Queue', { Logged: NOW, Vendor: `={{ ${I}.vendor }}`, 'Invoice no': `={{ ${I}.invoiceNumber }}`, Total: `={{ ${I}.total }}`, Problem: `={{ ${I}.problems.join(' | ') }}`, File: `={{ ${I}.link }}`, Decision: '' }));
  add(outbox('Tell the owner', [X[9], 140], W, { Channel: 'Email', To: 'Practice manager', Message: `={{ 'An invoice needs your decision: ' + ${I}.vendor + ' ' + ${I}.invoiceNumber + ' for ' + ${I}.total.toFixed(2) + '. ' + ${I}.problems.join(' ') }}`, Status: 'Queued (demo outbox)' }));
  add(http('Move file to Processed', [X[10], 0], { method: 'PATCH', url: `={{ 'https://www.googleapis.com/drive/v3/files/' + ${I}.fileId + '?addParents=${F('processed')}&removeParents=${F('invoices')}' }}`, auth: 'googleDriveOAuth2Api', body: '={{ JSON.stringify({}) }}' }));
  chain(c, 'New invoice in the inbox', 'Download the invoice', 'Build Claude request', 'Claude: read the invoice', 'Check the maths', 'Load the books', 'Seen before?', 'All checks passed?');
  wire(c, 'All checks passed?', ['Add to the books'], ['Send to approval queue']);
  chain(c, 'Add to the books', 'Move file to Processed');
  chain(c, 'Send to approval queue', 'Tell the owner', 'Move file to Processed');
});
files['5-invoice-inbox-to-books.json'].nodes.find(n => n.name === 'Load the books').alwaysOutputData = true;

const WIDE = { Answer: 620, Topic: 170, Task: 300, 'Next step': 330, Interest: 260, Contact: 220, Company: 190, Email: 230, Session: 120, Who: 90, Day: 170, Service: 150, Message: 520, Summary: 380, 'First reply': 400, Why: 230, 'Conflict check': 300, Problem: 440, Goals: 300, Challenges: 280, Objections: 280, 'Next steps': 320, 'Engagement letter': 220, Proposal: 220, File: 200, Status: 210, Workflow: 130, Channel: 110, To: 150, Ref: 150, Time: 150, Received: 140, 'Recommended programme': 200, Checks: 170 };
const FORMAT = Object.entries(TABS).flatMap(([t, head]) => { const sheetId = (cfg.gids || {})[t] || 0; return [...head.map((h, i) => ({ updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 }, properties: { pixelSize: WIDE[h] || 130 }, fields: 'pixelSize' } })), { repeatCell: { range: { sheetId, startRowIndex: 1 }, cell: { userEnteredFormat: { wrapStrategy: 'WRAP', verticalAlignment: 'TOP' } }, fields: 'userEnteredFormat(wrapStrategy,verticalAlignment)' } }]; });
/* helper: wipe test rows and put the sample data back, so each recording starts clean */
workflow('0-reset.json', 'Portfolio demo · 0 Reset sample data', (add, c) => {
  add(manual('Reset', [X[0], 0]));
  add(code('Build reset', [X[1], 0], () => {
    const d = (h, m = 0) => { const t = new Date(Date.now() + h * 3600e3 + m * 60e3); t.setSeconds(0, 0); return t.toISOString().slice(0, 16).replace('T', ' '); };
    const clear = ['Law Intake', 'RE Leads', 'Clinic Appointments', 'Coach CRM', 'Books', 'Approval Queue', 'Outbox', 'Chat Log', 'Chat Leads', 'Bookings', 'Tasks'].map(t => `'${t}'!A2:Z500`).concat(["'Pipeline'!I2:J500"]);
    const data = [
      { range: "'Clinic Appointments'!A2", values: [['A-1001', 'Grace Lin', '+1 503 555 0141', d(47, 50), 'Booked', '', '', '', ''], ['A-1002', 'Samuel Ortiz', '+1 503 555 0127', d(1, 50), 'Confirmed', 'Sent', '', '', ''], ['A-1003', 'Priya Nair', '+1 503 555 0163', d(-3), 'No-show', 'Sent', 'Sent', '', ''], ['A-1004', 'Daniel Brooks', '+1 503 555 0118', d(-4), 'Completed', 'Sent', 'Sent', '', ''], ['A-1005', 'Hannah Schmidt', '+1 503 555 0172', d(96), 'Booked', '', '', '', ''], ['A-1006', 'Owen Clarke', '+1 503 555 0109', d(-26), 'Completed', 'Sent', 'Sent', '', 'Sent']] },
      { range: "'Coach CRM'!A2", values: [['Marcus Hale', 'Hale & Bright Logistics', '', 'Discovery call booked', '', '', '', '', '', '', d(-48)]] },
    ];
    return [{ json: { clear: { ranges: clear }, write: { valueInputOption: 'RAW', data }, format: { requests: __FORMAT__ } } }];
  }, { __FORMAT__: JSON.stringify(FORMAT) }));
  add(http('Clear test rows', [X[2], 0], { method: 'POST', url: `https://sheets.googleapis.com/v4/spreadsheets/${SS}/values:batchClear`, auth: 'googleSheetsOAuth2Api', body: '={{ JSON.stringify($json.clear) }}' }));
  add(http('Put sample rows back', [X[3], 0], { method: 'POST', url: `https://sheets.googleapis.com/v4/spreadsheets/${SS}/values:batchUpdate`, auth: 'googleSheetsOAuth2Api', body: "={{ JSON.stringify($('Build reset').first().json.write) }}" }));
  add(http('Tidy column widths', [X[4], 0], { method: 'POST', url: `https://sheets.googleapis.com/v4/spreadsheets/${SS}:batchUpdate`, auth: 'googleSheetsOAuth2Api', body: "={{ JSON.stringify($('Build reset').first().json.format) }}" }));
  chain(c, 'Reset', 'Build reset', 'Clear test rows', 'Put sample rows back', 'Tidy column widths');
});

/* =====================================================================
   ROUND 2: website chatbot, WhatsApp chatbot, CRM automation
   ===================================================================== */
const CHAT = cfg.chatPaths || { web: 'demo-web-chat', wa: 'demo-wa-chat' };
const webhookIn = (name, pos, p) => node(name, 'n8n-nodes-base.webhook', 2, pos, { httpMethod: 'POST', path: p, responseMode: 'responseNode', options: {} }, { webhookId: uid() });
const respond = (name, pos, expr) => node(name, 'n8n-nodes-base.respondToWebhook', 1.1, pos, { respondWith: 'json', responseBody: `={{ JSON.stringify(${expr}) }}`, options: {} });
const once = n => Object.assign(n, { executeOnce: true, alwaysOutputData: true });
const logLines = (name, pos) => sheetAppend(name, pos, 'Chat Log', { Time: '={{ $json.time }}', Channel: '={{ $json.channel }}', Session: '={{ $json.session }}', Who: '={{ $json.who }}', Message: '={{ $json.message }}' });

/* extra tabs for round 2 (run once) */
workflow('0-setup-round2.json', 'Portfolio demo · 0 Setup round 2 (run once)', (add, c) => {
  add(manual('Add the new tabs', [X[0], 0]));
  add(code('Build tabs', [X[1], 0], () => {
    const NEW = __NEW__;
    const d = days => { const t = new Date(Date.now() - days * 864e5); return t.toISOString().slice(0, 10); };
    const seed = {
      'Bot Knowledge': [
        ['Whitfield Coaching', 'Who we help', 'Whitfield Leadership Coaching works with newly promoted directors and heads of department who have gone from doing the work to leading people who do it.'],
        ['Whitfield Coaching', 'Programmes', 'Three programmes: Starter sprint (4 weeks, one clear goal), Director programme (12 weeks, weekly then fortnightly sessions), Advisory retainer (monthly, for past clients).'],
        ['Whitfield Coaching', 'Prices', 'Prices depend on the programme and are confirmed on a free 30-minute discovery call. The assistant must not quote a price.'],
        ['Whitfield Coaching', 'How sessions work', 'Sessions are 60 minutes on video. Short check-ins by message between sessions. Two or three measures are agreed at the start.'],
        ['Whitfield Coaching', 'Discovery call', 'A free 30-minute call with Dana Whitfield. To book one the assistant needs a name and an email address.'],
        ['Whitfield Coaching', 'Company-paid coaching', 'Many clients have coaching paid for by their employer. Dana provides a short proposal that can be forwarded for sign-off.'],
        ['Brightside Clinic', 'Opening hours', 'Monday to Friday 8:30 am to 5:30 pm. Closed weekends and public holidays.'],
        ['Brightside Clinic', 'Address and parking', '214 Alder Street, Portland. Free parking behind the building. Step-free entrance on Alder Street.'],
        ['Brightside Clinic', 'Appointment types', 'New patient visit (40 minutes), Check-up (20 minutes), Follow-up (15 minutes). The assistant never asks why the patient wants to be seen.'],
        ['Brightside Clinic', 'Insurance', 'Most major plans are accepted. Bring your card to the visit and the front desk will confirm cover.'],
        ['Brightside Clinic', 'Cancelling', 'Please give 24 hours notice. Reply here or call the front desk on 503 555 0100.'],
        ['Brightside Clinic', 'Urgent problems', 'This chat is not for emergencies. For anything urgent call 911 or go to the nearest emergency department.'],
      ],
      Pipeline: [
        ['D-201', 'Amelia Ross', 'Ross & Vane Architects', 'amelia@rossvane.example', 'New lead', '4800', 'Maya', d(2), '', ''],
        ['D-202', 'Tomás Rivera', 'Rivera Dental Group', 'tomas@riveradental.example', 'Proposal sent', '12500', 'Maya', d(6), '', ''],
        ['D-203', 'Helen Park', 'Parkside Physio', 'helen@parksidephysio.example', 'Proposal sent', '7200', 'Jordan', d(1), '', ''],
        ['D-204', 'Marcus Hale', 'Hale & Bright Logistics', 'marcus@halebright.example', 'Negotiation', '18000', 'Jordan', d(9), '', ''],
        ['D-205', 'Ingrid Olsen', 'Olsen Family Law', 'ingrid@olsenlaw.example', 'Won', '9600', 'Maya', d(0), '', ''],
        ['D-206', 'Samir Khan', 'Khan Estates', 'samir@khanestates.example', 'Qualified', '6400', 'Jordan', d(3), '', ''],
        ['D-207', 'Beatrice Lowe', 'Lowe Consulting', 'beatrice@loweconsulting.example', 'Lost', '5000', 'Maya', d(4), '', ''],
        ['D-208', 'Felix Grant', 'Grant & Co Accountants', 'felix@grantco.example', 'New lead', '3900', 'Jordan', d(0), '', ''],
      ],
    };
    const cell = (v, bold) => ({ userEnteredValue: { stringValue: String(v) }, ...(bold ? { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: .93, green: .91, blue: .86 } } } : {}) });
    const requests = Object.entries(NEW).map(([title, head]) => ({ addSheet: { properties: { title, gridProperties: { frozenRowCount: 1 } } } }));
    const data = Object.entries(NEW).map(([title, head]) => ({ range: `'${title}'!A1`, values: [head, ...(seed[title] || [])] }));
    return [{ json: { add: { requests }, write: { valueInputOption: 'RAW', data } } }];
  }, { __NEW__: JSON.stringify(Object.fromEntries(['Bot Knowledge', 'Chat Log', 'Chat Leads', 'Bookings', 'Pipeline', 'Tasks'].map(t => [t, TABS[t]]))) }));
  add(http('Add tabs', [X[2], 0], { method: 'POST', url: `https://sheets.googleapis.com/v4/spreadsheets/${SS}:batchUpdate`, auth: 'googleSheetsOAuth2Api', body: '={{ JSON.stringify($json.add) }}' }));
  add(http('Write headers and samples', [X[3], 0], { method: 'POST', url: `https://sheets.googleapis.com/v4/spreadsheets/${SS}/values:batchUpdate`, auth: 'googleSheetsOAuth2Api', body: "={{ JSON.stringify($('Build tabs').first().json.write) }}" }));
  add(code('Tab IDs to copy', [X[4], 0], () => {
    const out = {}; for (const r of $('Add tabs').first().json.replies) out[r.addSheet.properties.title] = r.addSheet.properties.sheetId;
    return [{ json: { gids: JSON.stringify(out) } }];
  }));
  chain(c, 'Add the new tabs', 'Build tabs', 'Add tabs', 'Write headers and samples', 'Tab IDs to copy');
});

/* ---------- 6. WEBSITE CHATBOT: answers from the business's own notes, captures leads ---------- */
workflow('6-website-chatbot.json', 'Website chatbot · Answers and lead capture', (add, c) => {
  add(webhookIn('Message from the website chat', [X[0], 0], CHAT.web));
  add(code('Tidy the message', [X[1], 0], () => {
    const b = $input.first().json.body || {};
    const text = String(b.text || '').trim().slice(0, 1000), session = String(b.session || 'anon').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40) || 'anon';
    if (!text) throw new Error('Empty message');
    return [{ json: { text, session, channel: 'Website', business: 'Whitfield Coaching', time: new Date().toISOString().slice(0, 19).replace('T', ' ') } }];
  }));
  add(once(sheetRead('Load what the bot knows', [X[2], 0], 'Bot Knowledge')));
  add(once(sheetRead('Load the conversation', [X[3], 0], 'Chat Log')));
  add(code('Build Claude request', [X[4], 0], () => {
    const m = $('Tidy the message').first().json;
    const facts = $('Load what the bot knows').all().map(i => i.json).filter(r => r.Business === m.business).map(r => `- ${r.Topic}: ${r.Answer}`).join('\n');
    const history = $('Load the conversation').all().map(i => i.json).filter(r => r.Session === m.session).slice(-12).map(r => ({ role: r.Who === 'Visitor' ? 'user' : 'assistant', content: String(r.Message) }));
    const system = `You are the website assistant for Whitfield Leadership Coaching. Be warm, brief (under 60 words) and plain. No emojis.
Answer ONLY from these notes. If the notes do not cover it, say you are not sure and offer a discovery call. Never quote a price.
NOTES:
${facts}

Your goal is to help, then offer the free discovery call when it fits. To book it you need the visitor's name and email: ask for whichever is missing, one question at a time.
Reply with ONLY a JSON object: {"reply": "what you say to the visitor", "lead": {"name": "", "email": "", "interest": "one short line"} or null}
Fill "lead" only once you have BOTH a name and an email from the visitor's own messages.`;
    return [{ json: { ...m, body: { model: '__MODEL__', max_tokens: 500, system, messages: [...history, { role: 'user', content: m.text }] } } }];
  }, { __MODEL__: MODEL }));
  add(claude('Claude: write the reply', [X[5], 0]));
  add(code('Check the reply', [X[6], 0], () => {
    __PARSE__
    const m = $('Build Claude request').first().json;
    let reply = String(ai.reply || '').trim().slice(0, 700) || 'Sorry, I did not catch that. Could you say it another way?';
    if (/[$£€]\s?\d/.test(reply)) reply = 'Prices depend on the programme, and Dana confirms them on a free discovery call. Would you like me to set one up?';
    const l = ai.lead || {}, emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(l.email || ''));
    const lead = l.name && emailOk ? { name: String(l.name).slice(0, 80), email: String(l.email).toLowerCase(), interest: String(l.interest || '').slice(0, 160) } : null;
    return [{ json: { session: m.session, channel: m.channel, time: m.time, text: m.text, reply, lead, isLead: !!lead } }];
  }, { __PARSE__: PARSE }));
  add(respond('Send the reply back', [X[7], 0], "{ reply: $json.reply, lead: $json.isLead }"));
  add(code('Two log lines', [X[8], 0], () => {
    const j = $('Check the reply').first().json;
    return [{ json: { time: j.time, channel: j.channel, session: j.session, who: 'Visitor', message: j.text } }, { json: { time: j.time, channel: j.channel, session: j.session, who: 'Assistant', message: j.reply } }];
  }));
  add(logLines('Save to the chat log', [X[9], 0]));
  add(Object.assign(iff('New lead?', [X[10], 0], "={{ $('Check the reply').first().json.isLead }}"), { executeOnce: true }));
  const R = "$('Check the reply').first().json";
  add(sheetUpsert('Save the lead', [X[11], -80], 'Chat Leads', 'Contact', { Time: `={{ ${R}.time }}`, Channel: 'Website chat', Name: `={{ ${R}.lead.name }}`, Contact: `={{ ${R}.lead.email }}`, Interest: `={{ ${R}.lead.interest }}`, Summary: `={{ 'Asked for a discovery call in the website chat.' }}`, Status: 'New: to call' }));
  add(outbox('Tell the coach', [X[11] + 220, -80], 'Website chatbot', { Channel: 'Email', To: 'Dana (owner)', Message: `={{ 'New lead from the website chat: ' + ${R}.lead.name + ', ' + ${R}.lead.email + '. Interested in: ' + ${R}.lead.interest }}`, Status: 'Queued (demo outbox)' }));
  chain(c, 'Message from the website chat', 'Tidy the message', 'Load what the bot knows', 'Load the conversation', 'Build Claude request', 'Claude: write the reply', 'Check the reply', 'Send the reply back', 'Two log lines', 'Save to the chat log', 'New lead?');
  wire(c, 'New lead?', ['Save the lead'], []);
  chain(c, 'Save the lead', 'Tell the coach');
});

/* ---------- 7. WHATSAPP CHATBOT: clinic front desk that books real slots ---------- */
workflow('7-whatsapp-booking-bot.json', 'WhatsApp chatbot · Clinic bookings', (add, c) => {
  add(webhookIn('WhatsApp message in', [X[0], 0], CHAT.wa));
  add(code('Tidy the message', [X[1], 0], () => {
    const b = $input.first().json.body || {};
    const text = String(b.text || '').trim().slice(0, 1000), session = String(b.session || 'anon').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40) || 'anon';
    if (!text) throw new Error('Empty message');
    return [{ json: { text, session, phone: String(b.from || '+1 503 555 0190'), channel: 'WhatsApp', business: 'Brightside Clinic', time: new Date().toISOString().slice(0, 19).replace('T', ' ') } }];
  }));
  add(once(sheetRead('Load what the bot knows', [X[2], 0], 'Bot Knowledge')));
  add(once(sheetRead('Load the conversation', [X[3], 0], 'Chat Log')));
  add(once(sheetRead('Load bookings', [X[4], 0], 'Bookings')));
  add(code('Work out open slots', [X[5], 0], () => {
    // The calendar is worked out in code, so the bot can only ever offer a slot that is really free.
    const taken = new Set($('Load bookings').all().map(i => i.json).filter(b => b.Day).map(b => b.Day + ' ' + b.Time));
    const open = [], d = new Date();
    while (open.length < 8) {
      d.setDate(d.getDate() + 1); if (!(d.getDay() % 6)) continue;
      const day = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      for (const t of ['9:00 am', '10:30 am', '2:00 pm', '3:30 pm']) if (!taken.has(day + ' ' + t) && open.length < 8) open.push(day + ' ' + t);
    }
    return [{ json: { ...$('Tidy the message').first().json, open } }];
  }));
  add(code('Build Claude request', [X[6], 0], () => {
    const m = $json;
    const facts = $('Load what the bot knows').all().map(i => i.json).filter(r => r.Business === m.business).map(r => `- ${r.Topic}: ${r.Answer}`).join('\n');
    const history = $('Load the conversation').all().map(i => i.json).filter(r => r.Session === m.session).slice(-14).map(r => ({ role: r.Who === 'Visitor' ? 'user' : 'assistant', content: String(r.Message) }));
    const system = `You are the WhatsApp assistant for Brightside Family Clinic. Write like a friendly front desk: short messages (under 50 words), plain words, no emojis.
Answer ONLY from these notes:
${facts}

BOOKING. Free slots right now (offer two or three at a time, never any other time):
${m.open.map(s => '- ' + s).join('\n')}
To book you need: the patient's name, the appointment type (New patient visit, Check-up or Follow-up) and one of the free slots above. Ask for what is missing, one question at a time.
NEVER ask why they want to be seen and never give medical advice. If they describe symptoms or anything urgent, give the urgent-problems note. If they ask for a person, hand off.
Reply with ONLY a JSON object:
{"reply": "your WhatsApp message", "action": "none" | "book" | "handoff", "booking": {"name": "", "type": "", "slot": "copied exactly from the list"} or null}
Use "book" only in the message where you confirm the booking.`;
    return [{ json: { ...m, body: { model: '__MODEL__', max_tokens: 500, system, messages: [...history, { role: 'user', content: m.text }] } } }];
  }, { __MODEL__: MODEL }));
  add(claude('Claude: write the reply', [X[7], 0]));
  add(code('Check the booking', [X[8], 0], () => {
    __PARSE__
    const m = $('Build Claude request').first().json;
    let reply = String(ai.reply || '').trim().slice(0, 700) || 'Sorry, I did not catch that. Could you say it another way?';
    let action = ['book', 'handoff'].includes(ai.action) ? ai.action : 'none', booking = null;
    if (action === 'book') {
      const b = ai.booking || {}, types = ['New patient visit', 'Check-up', 'Follow-up'];
      if (b.name && types.includes(b.type) && m.open.includes(b.slot)) {
        const cut = b.slot.lastIndexOf(' ', b.slot.lastIndexOf(' ') - 1);
        booking = { name: String(b.name).slice(0, 80), type: b.type, day: b.slot.slice(0, cut), time: b.slot.slice(cut + 1) };
      } else { action = 'none'; reply = 'Sorry, that time is not available. I can offer ' + m.open.slice(0, 3).join(', ') + '. Which would you like?'; }
    }
    return [{ json: { session: m.session, channel: m.channel, phone: m.phone, time: m.time, text: m.text, reply, action, booking } }];
  }, { __PARSE__: PARSE }));
  add(respond('Send the reply back', [X[9], 0], "{ reply: $json.reply, action: $json.action }"));
  add(code('Two log lines', [X[10], 0], () => {
    const j = $('Check the booking').first().json;
    return [{ json: { time: j.time, channel: j.channel, session: j.session, who: 'Visitor', message: j.text } }, { json: { time: j.time, channel: j.channel, session: j.session, who: 'Assistant', message: j.reply } }];
  }));
  add(logLines('Save to the chat log', [X[11], 0]));
  const R = "$('Check the booking').first().json";
  add(Object.assign(node('What happened?', 'n8n-nodes-base.switch', 3, [X[11] + 220, 0], { rules: { values: [['book', 'Booked'], ['handoff', 'Wants a person']].map(([v, k]) => ({ conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, combinator: 'and', conditions: [{ id: uid(), leftValue: `={{ ${R}.action }}`, rightValue: v, operator: { type: 'string', operation: 'equals' } }] }, renameOutput: true, outputKey: k })) }, options: {} }), { executeOnce: true }));
  add(sheetAppend('Add to the calendar', [X[11] + 440, -100], 'Bookings', { 'Booked at': `={{ ${R}.time }}`, Name: `={{ ${R}.booking.name }}`, Phone: `={{ ${R}.phone }}`, Service: `={{ ${R}.booking.type }}`, Day: `={{ ${R}.booking.day }}`, Time: `={{ ${R}.booking.time }}`, Status: 'Booked by WhatsApp assistant' }));
  add(outbox('Tell the front desk', [X[11] + 660, -100], 'WhatsApp chatbot', { Channel: 'Email', To: 'Front desk', Message: `={{ 'New booking by WhatsApp: ' + ${R}.booking.name + ', ' + ${R}.booking.type + ', ' + ${R}.booking.day + ' at ' + ${R}.booking.time + '.' }}`, Status: 'Queued (demo outbox)' }));
  add(outbox('Hand over to a person', [X[11] + 440, 120], 'WhatsApp chatbot', { Channel: 'Front desk alert', To: 'Front desk', Message: `={{ 'A patient on WhatsApp (' + ${R}.phone + ') asked for a person. Last message: ' + ${R}.text }}`, Status: 'Queued (demo outbox)' }));
  chain(c, 'WhatsApp message in', 'Tidy the message', 'Load what the bot knows', 'Load the conversation', 'Load bookings', 'Work out open slots', 'Build Claude request', 'Claude: write the reply', 'Check the booking', 'Send the reply back', 'Two log lines', 'Save to the chat log', 'What happened?');
  wire(c, 'What happened?', ['Add to the calendar'], ['Hand over to a person']);
  chain(c, 'Add to the calendar', 'Tell the front desk');
});

/* ---------- 8. CRM AUTOMATION: every deal gets a next step, stale ones get a drafted follow-up ---------- */
workflow('8-crm-pipeline-autopilot.json', 'CRM automation · Pipeline follow-up', (add, c) => {
  const W = 'CRM automation';
  add(node('Every weekday at 8:00', 'n8n-nodes-base.scheduleTrigger', 1.2, [X[0], -100], { rule: { interval: [{ field: 'cronExpression', expression: '0 8 * * 1-5' }] } }));
  add(manual('Run now', [X[0], 120]));
  add(sheetRead('Load the pipeline', [X[1], 0], 'Pipeline'));
  add(code('What does each deal need?', [X[2], 0], () => {
    // Plain rules per stage. The same deal always gets the same answer, and the owner can read why.
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = n => { const t = new Date(today); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
    const out = [];
    for (const d of $input.all().map(i => i.json)) {
      if (!d['Deal ID']) continue;
      const idle = Math.round((today - new Date(d['Last touch'])) / 864e5), stage = d.Stage;
      let health = 'On track', next = 'No action needed today', tasks = [], draft = false;
      const T = (task, days, why) => tasks.push({ task, due: due(days), why });
      if (stage === 'New lead' && idle >= 1) { health = 'At risk'; next = 'Call today: new lead untouched for ' + idle + ' day(s)'; T('Call ' + d.Contact + ' today', 0, 'New lead, no contact for ' + idle + ' day(s)'); }
      else if (stage === 'New lead') { next = 'First call today'; T('First call to ' + d.Contact, 0, 'New lead came in today'); }
      else if (stage === 'Proposal sent' && idle >= 3) { health = 'Needs follow-up'; next = 'Follow up on the proposal (' + idle + ' days quiet)'; draft = true; T('Send the follow-up to ' + d.Contact, 0, 'Proposal sent ' + idle + ' days ago, no reply'); }
      else if (stage === 'Negotiation' && idle >= 5) { health = 'At risk'; next = 'Check in: negotiation quiet for ' + idle + ' days'; draft = true; T('Check in with ' + d.Contact, 0, 'Negotiation stalled for ' + idle + ' days'); }
      else if (stage === 'Won') { next = 'Start onboarding'; T('Send the welcome pack to ' + d.Contact, 0, 'Deal won'); T('Book the kickoff call with ' + d.Company, 2, 'Deal won'); T('Set up the shared folder for ' + d.Company, 2, 'Deal won'); }
      else if (stage === 'Lost') { health = 'Closed'; next = 'Nurture: check back in 60 days'; T('Check back in with ' + d.Contact, 60, 'Lost deal, nurture'); }
      else if (stage === 'Qualified' && idle >= 3) { health = 'Needs follow-up'; next = 'Send the proposal'; T('Send the proposal to ' + d.Contact, 1, 'Qualified ' + idle + ' days ago, no proposal yet'); }
      out.push({ json: { id: d['Deal ID'], contact: d.Contact, company: d.Company, stage, value: Number(d.Value) || 0, owner: d.Owner, idle, health, next, tasks, draft } });
    }
    return out;
  }));
  add(sheetUpdate('Update health and next step', [X[3], -260], 'Pipeline', 'Deal ID', { 'Deal ID': '={{ $json.id }}', 'Next step': '={{ $json.next }}', Health: '={{ $json.health }}' }));
  add(code('List the tasks', [X[3], -80], () => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return $input.all().flatMap(i => i.json.tasks.map(t => ({ json: { created: now, id: i.json.id, owner: i.json.owner, task: t.task, due: t.due, why: t.why } })));
  }));
  add(sheetAppend('Create the tasks', [X[4], -80], 'Tasks', { Created: '={{ $json.created }}', 'Deal ID': '={{ $json.id }}', Owner: '={{ $json.owner }}', Task: '={{ $json.task }}', Due: '={{ $json.due }}', Why: '={{ $json.why }}' }));
  add(iff('Needs a written follow-up?', [X[3], 120], '={{ $json.draft }}'));
  add(codeEach('Build Claude request', [X[4], 120], () => {
    const j = $json;
    const prompt = `Write a short follow-up email from ${j.owner} at Northbeam Studio to ${j.contact} at ${j.company}.
Situation: the deal is at the "${j.stage}" stage and there has been no contact for ${j.idle} days.
Rules: under 90 words, friendly, no pressure, no discounts or prices, one clear question at the end. Plain text.
Reply with ONLY a JSON object: {"subject": "", "body": ""}`;
    return { json: { ...j, body: { model: '__MODEL__', max_tokens: 400, messages: [{ role: 'user', content: prompt }] } } };
  }));
  add(claude('Claude: draft the follow-up', [X[5], 120]));
  add(codeEach('Check the draft', [X[6], 120], () => {
    __PARSE__
    const d = $('Build Claude request').item.json;
    let body = String(ai.body || '').trim();
    if (!body || /[$£€]\s?\d|discount/i.test(body)) body = `Hi ${d.contact.split(' ')[0]}, I wanted to check in on where things stand. Is there anything you need from me to move forward?`;
    return { json: { id: d.id, contact: d.contact, text: 'Subject: ' + String(ai.subject || 'Checking in').slice(0, 90) + '\n\n' + body.slice(0, 900) } };
  }));
  add(outbox('Save as a draft for the owner', [X[7], 120], W, { Channel: 'Email draft', To: '={{ $json.contact }}', Message: '={{ $json.text }}', Status: 'Draft: waiting for the owner to send', Ref: '={{ $json.id }}' }));
  add(code('Morning summary', [X[3], 340], () => {
    const d = $input.all().map(i => i.json), open = d.filter(x => !['Won', 'Lost'].includes(x.stage));
    const sum = a => a.reduce((s, x) => s + x.value, 0).toLocaleString('en-US');
    const risk = d.filter(x => x.health === 'At risk'), fu = d.filter(x => x.health === 'Needs follow-up');
    return [{ json: { text: `Pipeline this morning: ${open.length} open deals worth $${sum(open)}. At risk: ${risk.map(x => x.company + ' (' + x.idle + ' days quiet)').join(', ') || 'none'}. Needs follow-up: ${fu.map(x => x.company).join(', ') || 'none'}. Won: ${d.filter(x => x.stage === 'Won').map(x => x.company).join(', ') || 'none'}. ${d.reduce((s, x) => s + x.tasks.length, 0)} tasks created.` } }];
  }, {}));
  add(outbox('Send the summary', [X[4], 340], W, { Channel: 'Email', To: 'Owner', Message: '={{ $json.text }}', Status: 'Queued (demo outbox)' }));
  chain(c, 'Every weekday at 8:00', 'Load the pipeline'); chain(c, 'Run now', 'Load the pipeline');
  chain(c, 'Load the pipeline', 'What does each deal need?');
  c['What does each deal need?'] = { main: [['Update health and next step', 'List the tasks', 'Needs a written follow-up?', 'Morning summary'].map(n => ({ node: n, type: 'main', index: 0 }))] };
  chain(c, 'List the tasks', 'Create the tasks');
  wire(c, 'Needs a written follow-up?', ['Build Claude request'], []);
  chain(c, 'Build Claude request', 'Claude: draft the follow-up', 'Check the draft', 'Save as a draft for the owner');
  chain(c, 'Morning summary', 'Send the summary');
});

/* ---------- write ---------- */
fs.mkdirSync(OUT, { recursive: true });
for (const [f, wf] of Object.entries(files)) { fs.writeFileSync(path.join(OUT, f), JSON.stringify(wf, null, 2)); console.log(f.padEnd(38), wf.nodes.length, 'nodes'); }
console.log(cfg.spreadsheetId ? 'Built with config.local.json' : 'NOTE: no config.local.json yet. Import and run 0-setup first, then build again.');
