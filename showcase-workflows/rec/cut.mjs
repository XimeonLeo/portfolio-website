// Cuts the raw screen recordings into short portfolio videos: keeps the useful moments, crops out the browser bars
// (and with them the account name), and speeds up the waiting. Run: node cut.mjs
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'site', 'assets', 'work');
const CROP = 'crop=1316:476:25:254,delogo=x=1:y=452:w=112:h=22';
// [source, start, end, speed]
const CUTS = {
  'demo-law': { poster: ['1x-law', 2.5], parts: [['1-law', 0, 13, 1.6], ['1-law', 13, 15.5, 1], ['1x-law', 0.5, 4.5, 1], ['1-law', 74, 80, 1], ['1-law', 104.5, 110, 1]] },
  'demo-realestate': { poster: ['2x-realestate', 2.5], parts: [['2-realestate', 0, 15.5, 1.6], ['2-realestate', 16, 18, 1], ['2x-realestate', 0.5, 4.5, 1], ['2-realestate', 54.5, 59.5, 1], ['2-realestate', 66.5, 72, 1]] },
  'demo-clinic': { poster: ['3-clinic', 28.6], parts: [['3-clinic', 1, 29, 2.5], ['3-clinic', 38.5, 44, 1], ['3-clinic', 52, 60, 1]] },
  'demo-coach': { poster: ['4-coach', 29], parts: [['4-coach', 1, 31, 2.5], ['4-coach', 46, 52, 1], ['4-coach', 72.5, 77.5, 1], ['4-coach', 82, 88, 1]] },
  'demo-invoices': { poster: ['5b-invoices', 25], parts: [['5-invoices', 0, 20, 2], ['5-invoices', 36.2, 38.6, 0.5], ['5b-invoices', 0, 29, 2.5], ['5b-invoices', 36, 44, 1]] },
};
for (const [name, { poster, parts }] of Object.entries(CUTS)) {
  const srcs = [...new Set(parts.map(p => p[0]))];
  const args = ['-v', 'error', '-y']; srcs.forEach(s => args.push('-i', path.join(HERE, s + '.mkv')));
  const f = parts.map(([s, a, b, sp], i) => `[${srcs.indexOf(s)}:v]trim=${a}:${b},setpts=(PTS-STARTPTS)/${sp},${CROP},scale=1100:-2,fps=15,setsar=1[v${i}]`).join(';') + ';' + parts.map((_, i) => `[v${i}]`).join('') + `concat=n=${parts.length}:v=1:a=0[o]`;
  args.push('-filter_complex', f, '-map', '[o]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(OUT, name + '.mp4'));
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(poster[1]), '-i', path.join(HERE, poster[0] + '.mkv'), '-vf', CROP + ',scale=1100:-2', '-frames:v', '1', '-q:v', '3', path.join(OUT, name + '.jpg')], { stdio: 'inherit' });
  const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(OUT, name + '.mp4')]).toString().trim();
  console.log(name, dur + 's', Math.round(fs.statSync(path.join(OUT, name + '.mp4')).size / 1024) + ' KB');
}
