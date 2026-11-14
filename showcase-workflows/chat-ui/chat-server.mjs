// Local chat screens for recording the chatbot demos. They look like a chat app, and every message goes to the real n8n workflow.
// Run: node chat-server.mjs   →  http://localhost:5180/wa.html  and  http://localhost:5180/web.html
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'config.local.json'), 'utf8'));
const BASE = cfg.n8nBase || 'https://your-n8n-address';
const HOOK = { '/api/web': cfg.chatPaths.web, '/api/wa': cfg.chatPaths.wa };
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

http.createServer(async (req, res) => {
  const p = req.url.split('?')[0];
  if (HOOK[p] && req.method === 'POST') {
    const chunks = []; for await (const c of req) chunks.push(c);
    try {
      const r = await fetch(`${BASE}/webhook/${HOOK[p]}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: Buffer.concat(chunks) });
      const t = await r.text();
      res.writeHead(r.status, { 'Content-Type': 'application/json' }); return res.end(t || '{}');
    } catch (e) { res.writeHead(502, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ reply: 'The assistant is offline right now.', error: String(e) })); }
  }
  const file = path.join(HERE, path.basename(p === '/' ? '/wa.html' : p));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data);
  });
}).listen(5180, '127.0.0.1', () => console.log('chat screens on http://localhost:5180'));
