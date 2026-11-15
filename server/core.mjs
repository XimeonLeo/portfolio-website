// The whole backend for the secret door: login + saved site settings.
// Used by the Netlify function (netlify/functions/api.mjs) and by the local preview server (dev-server.mjs).
import crypto from 'node:crypto';

const HOURS_12 = 12 * 60 * 60 * 1000;
const MAX_FAILS = 5, LOCK_MS = 15 * 60 * 1000;
const SECTION_IDS = ['story', 'leaks', 'replay', 'demo', 'work', 'about', 'reviews', 'services', 'process', 'integrations', 'faq'];

const str = max => v => (typeof v === 'string' && v.trim().length <= max ? v.trim() : undefined);
const hex = v => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : undefined);
const url = v => {
  if (v === '') return '';
  if (typeof v !== 'string' || v.length > 300) return undefined;
  try { const u = new URL(v); return u.protocol === 'https:' ? u.href : undefined; } catch { return undefined; }
};
// Only these fields can ever be saved, each one checked. Anything else is dropped.
const FIELDS = {
  name: str(60), initials: str(3), role: str(60),
  accent: hex, paper: hex, ink: hex, night: hex,
  showAvail: v => (typeof v === 'boolean' ? v : undefined),
  avail: str(80), heroTitle: str(120), heroSub: str(140), heroLede: str(600), heroFor: str(160),
  whatsapp: v => (typeof v === 'string' && /^\d{8,15}$/.test(v) ? v : undefined),
  email: v => (typeof v === 'string' && v.length <= 120 && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(v) ? v : undefined),
  upwork: url, booking: url,
  hidden: v => (Array.isArray(v) ? [...new Set(v.filter(x => SECTION_IDS.includes(x)))] : undefined),
};

export function clean(input) {
  const out = {}, bad = [];
  if (!input || typeof input !== 'object') return { out, bad: ['settings'] };
  for (const [k, check] of Object.entries(FIELDS)) {
    if (!(k in input)) continue;
    const v = check(input[k]);
    if (v === undefined || (v === '' && !['booking', 'avail', 'heroSub', 'heroFor'].includes(k))) bad.push(k); else out[k] = v;
  }
  return { out, bad };
}

/* ---------- portfolio (Work section): order, hidden items, items added from the door ---------- */
const ID = v => (typeof v === 'string' && /^[a-z0-9][a-z0-9-]{1,39}$/.test(v) ? v : undefined);
// links: https, or files we host ourselves (/api/media/…, assets/…)
const link = v => {
  if (v === '' || v == null) return '';
  if (typeof v !== 'string' || v.length > 400) return undefined;
  if (/^\/api\/media\/[a-z0-9]{16,40}\.(jpg|png|webp|mp4)$/.test(v) || /^assets\/[a-z0-9/_.-]{3,120}$/i.test(v)) return v;
  try { const u = new URL(v); return u.protocol === 'https:' ? u.href : undefined; } catch { return undefined; }
};
const txt = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v, n, max) => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.trim()).slice(0, n).map(x => x.trim().slice(0, max)) : []);
function cleanItem(it) {
  const id = ID(it && it.id); if (!id) return null;
  const title = txt(it.title, 140); if (!title) return null;
  const pairs = (v, n) => (Array.isArray(v) ? v.filter(p => Array.isArray(p) && p[0]).slice(0, n).map(p => [txt(String(p[0]), 30), txt(String(p[1] || ''), 80)]) : []);
  const shots = Array.isArray(it.shots) ? it.shots.map(s => Array.isArray(s) ? [link(s[0]), txt(String(s[1] || ''), 140)] : null).filter(s => s && s[0]).slice(0, 12) : [];
  return {
    id, title, group: it.group === 'demo' ? 'demo' : 'client',
    badge: ['demo', 'live', 'none'].includes(it.badge) ? it.badge : 'none',
    category: txt(it.category, 70), desc: txt(it.desc, 260),
    statBig: txt(it.statBig, 14), statLabel: txt(it.statLabel, 50),
    cover: link(it.cover) || '', video: link(it.video) || '', alt: txt(it.alt, 160),
    tags: list(it.tags, 8, 30), sub: txt(it.sub, 260), problem: txt(it.problem, 900),
    built: list(it.built, 10, 300), changed: txt(it.changed, 900),
    results: pairs(it.results, 6), stack: txt(it.stack, 200), shots,
    linkLabel: txt(it.linkLabel, 40), linkUrl: link(it.linkUrl) || '',
  };
}
export function cleanWork(input) {
  const out = { order: { demo: [], client: [] }, hidden: [], items: {} };
  if (!input || typeof input !== 'object') return out;
  const items = input.items && typeof input.items === 'object' ? Object.values(input.items) : [];
  for (const it of items.slice(0, 60)) { const c = cleanItem(it); if (c) out.items[c.id] = c; }
  const seen = new Set();
  for (const g of ['demo', 'client']) {
    const arr = input.order && Array.isArray(input.order[g]) ? input.order[g] : [];
    for (const id of arr) if (ID(id) && !seen.has(id) && seen.size < 120) { seen.add(id); out.order[g].push(id); }
  }
  out.hidden = Array.isArray(input.hidden) ? [...new Set(input.hidden.filter(ID))].slice(0, 120) : [];
  return out;
}
const MEDIA_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4' };
const MEDIA_MAX = 4.5 * 1024 * 1024;

const json = (status, body, extra = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...extra } });
const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const sign = (secret, exp) => crypto.createHmac('sha256', secret).update('door.' + exp).digest('hex');

/** store: { get(key) → object|null, set(key, object) }.  password: the owner's password (from an environment variable). */
export function createApi({ store, password, secret }) {
  const key = secret || (password ? sha('door-session:' + password).toString('hex') : '');

  function tokenOk(req) {
    const m = /^Bearer (\d{13})\.([0-9a-f]{64})$/.exec(req.headers.get('authorization') || '');
    if (!m || !key || Number(m[1]) < Date.now()) return false;
    return crypto.timingSafeEqual(Buffer.from(m[2]), Buffer.from(sign(key, m[1])));
  }

  async function login(req, ip) {
    if (!password) return json(503, { error: 'The door is not set up yet. Add ADMIN_PASSWORD in the site settings on Netlify.' });
    const who = sha('ip:' + (ip || 'unknown')).toString('hex').slice(0, 16), now = Date.now();
    const fails = (await store.get('login-fails')) || {};
    for (const k of Object.keys(fails)) if (fails[k].until < now && now - fails[k].at > LOCK_MS) delete fails[k];
    const f = fails[who];
    if (f && f.until > now) return json(429, { error: 'Too many wrong tries. Wait ' + Math.ceil((f.until - now) / 60000) + ' minutes and try again.' });
    let body = {}; try { body = await req.json(); } catch {}
    const ok = typeof body.password === 'string' && crypto.timingSafeEqual(sha(body.password), sha(password));
    if (!ok) {
      const n = (f ? f.n : 0) + 1;
      fails[who] = { n, at: now, until: n >= MAX_FAILS ? now + LOCK_MS : 0 };
      if (n >= MAX_FAILS) fails[who].n = 0;
      await store.set('login-fails', fails);
      return json(401, { error: 'Wrong password.' });
    }
    if (f) { delete fails[who]; await store.set('login-fails', fails); }
    const exp = String(now + HOURS_12);
    return json(200, { token: exp + '.' + sign(key, exp), expires: Number(exp) });
  }

  async function handle(req, ip) {
    const path = new URL(req.url).pathname.replace(/\/+$/, '');
    try {
      if (path === '/api/login' && req.method === 'POST') return await login(req, ip);
      if (path === '/api/work') {
        if (req.method === 'GET') return json(200, (await store.get('work')) || {});
        if (req.method === 'PUT' || req.method === 'POST') {
          if (!tokenOk(req)) return json(401, { error: 'Please log in again.' });
          let body; try { body = await req.json(); } catch { return json(400, { error: 'That did not look like portfolio data.' }); }
          const out = cleanWork(body);
          await store.set('work', out);
          return json(200, { ok: true, work: out });
        }
      }
      if (path === '/api/media' && req.method === 'POST') {
        if (!tokenOk(req)) return json(401, { error: 'Please log in again.' });
        const type = (req.headers.get('content-type') || '').split(';')[0].trim().toLowerCase(), ext = MEDIA_TYPES[type];
        if (!ext) return json(400, { error: 'Only JPG, PNG, WEBP images or MP4 videos can be uploaded.' });
        const buf = Buffer.from(await req.arrayBuffer());
        if (!buf.length) return json(400, { error: 'The file was empty.' });
        if (buf.length > MEDIA_MAX) return json(413, { error: 'That file is over 4.5 MB. Make it smaller, or paste a link to it instead.' });
        const name = crypto.randomBytes(12).toString('hex') + '.' + ext;
        await store.setBin('media/' + name, buf, type);
        return json(200, { ok: true, url: '/api/media/' + name });
      }
      const mm = /^\/api\/media\/([a-z0-9]{16,40}\.(?:jpg|png|webp|mp4))$/.exec(path);
      if (mm && req.method === 'GET') {
        const f = await store.getBin('media/' + mm[1]);
        if (!f) return json(404, { error: 'Not found' });
        return new Response(f.data, { status: 200, headers: { 'Content-Type': f.type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' } });
      }
      if (path === '/api/settings') {
        if (req.method === 'GET') return json(200, (await store.get('settings')) || {});
        if (req.method === 'PUT' || req.method === 'POST') {
          if (!tokenOk(req)) return json(401, { error: 'Please log in again.' });
          let body; try { body = await req.json(); } catch { return json(400, { error: 'That did not look like settings.' }); }
          const { out, bad } = clean(body);
          if (bad.length) return json(400, { error: 'Check these fields: ' + bad.join(', '), fields: bad });
          await store.set('settings', out);
          return json(200, { ok: true, settings: out });
        }
        if (req.method === 'DELETE') {
          if (!tokenOk(req)) return json(401, { error: 'Please log in again.' });
          await store.set('settings', {});
          return json(200, { ok: true, settings: {} });
        }
      }
      return json(404, { error: 'Not found' });
    } catch (e) {
      console.error(e);
      return json(500, { error: 'Something went wrong on the server.' });
    }
  }
  return { handle };
}
