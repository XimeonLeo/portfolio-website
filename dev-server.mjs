// Local preview: serves site/ and runs the same backend as Netlify, saving to .local/store.json.
// Run: node portfolio/dev-server.mjs   →  http://localhost:5176   (door: /door/, test password in dev-config.json)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from './server/core.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, 'site');
const PORT = Number(process.env.PORT || process.argv[2]) || 5176;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'dev-config.json'), 'utf8'));
const FILE = path.join(HERE, '.local', 'store.json');
const read = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return {}; } };
const store = {
  get: async k => read()[k] ?? null,
  set: async (k, v) => { const all = read(); all[k] = v; fs.mkdirSync(path.dirname(FILE), { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(all, null, 2)); },
  // uploaded files go to .local/media/ (same idea as Netlify Blobs)
  getBin: async k => { const f = path.join(HERE, '.local', k); if (!fs.existsSync(f)) return null; const ext = path.extname(f); return { data: fs.readFileSync(f), type: { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4' }[ext] || 'application/octet-stream' }; },
  setBin: async (k, buf) => { const f = path.join(HERE, '.local', k); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, buf); },
};
const api = createApi({ store, password: cfg.ADMIN_PASSWORD });

http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname.startsWith('/api/')) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const request = new Request('http://localhost:' + PORT + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) || !body.length ? undefined : body });
    const r = await api.handle(request, req.socket.remoteAddress);
    res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(Buffer.from(await r.arrayBuffer()));
  }
  let file = path.join(ROOT, pathname);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const type = TYPES[path.extname(file)] || 'application/octet-stream';
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    if (range) { // video needs range requests
      const start = +range[1], end = range[2] ? +range[2] : data.length - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${data.length}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      return res.end(data.subarray(start, end + 1));
    }
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' });
    res.end(data);
  });
}).listen(PORT, () => console.log('Portfolio at http://localhost:' + PORT + '  ·  door at /door/'));
