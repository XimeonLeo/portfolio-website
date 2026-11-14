// Swap the site address everywhere it matters for SEO (canonical, schema, sitemap, robots, llms.txt).
// Run once you know the real address:  node set-domain.mjs https://yourdomain.com
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const next = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9.-]+$/i.test(next)) { console.error('Usage: node set-domain.mjs https://yourdomain.com'); process.exit(1); }
const state = path.join(HERE, 'site-url.txt');
const prev = fs.readFileSync(state, 'utf8').trim();
let n = 0;
for (const f of ['index.html', 'robots.txt', 'sitemap.xml', 'llms.txt']) {
  const p = path.join(HERE, 'site', f), t = fs.readFileSync(p, 'utf8'), parts = t.split(prev);
  n += parts.length - 1; fs.writeFileSync(p, parts.join(next));
}
fs.writeFileSync(state, next + '\n');
console.log(`Changed ${n} places from ${prev} to ${next}`);
