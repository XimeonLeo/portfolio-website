// Pulls extra still images out of the raw recordings for the case-study galleries.
// Run: node stills.mjs    Output: ../../site/assets/work/shot-<id>-<n>.jpg
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'site', 'assets', 'work');
const A = 'crop=1316:476:25:254,delogo=x=1:y=452:w=112:h=22';   // first recording session
const B = 'crop=1322:478:22:230,delogo=x=1:y=454:w=112:h=22';   // second session
const W = 'crop=1318:426:24:250';                               // website-chat retake
// id: [[source, second, crop], ...]
const SHOTS = {
  dlaw: [['1-law', 9, A], ['1-law', 77, A], ['1-law', 108, A]],
  drealty: [['2-realestate', 12, A], ['2-realestate', 57, A], ['2-realestate', 70, A]],
  dclinic: [['3-clinic', 41, A], ['3-clinic', 57, A]],
  dcoach: [['4-coach', 49, A], ['4-coach', 75, A], ['4-coach', 86, A]],
  dbooks: [['5-invoices', 17, A], ['5-invoices', 37.6, A], ['5b-invoices', 41, A]],
  dwhatsapp: [['7-wa', 24, B], ['7x-sheet', 2, B], ['7x-exec', 2, B]],
  dwebchat: [['6-web', 22, W], ['6-web', 40, W]],
  dcrm: [['8-crm', 42, B], ['8-crm', 57, B], ['8-crm', 71, B]],
};
for (const [id, list] of Object.entries(SHOTS)) list.forEach(([src, t, crop], i) => {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', path.join(HERE, src + '.mkv'), '-vf', crop + ',scale=1100:-2', '-frames:v', '1', '-q:v', '3', path.join(OUT, `shot-${id}-${i + 1}.jpg`)]);
});
console.log('stills written');
