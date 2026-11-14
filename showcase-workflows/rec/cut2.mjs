// Round 2 cuts (website chatbot, WhatsApp bot, CRM). Same idea as cut.mjs, with the crop for the resized Chrome window.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'site', 'assets', 'work');
const CROP = 'crop=1322:478:22:230,delogo=x=1:y=454:w=112:h=22';
const WEB = 'crop=1318:426:24:250'; // the website-chat retake was recorded in a slightly shorter window
const CUTS = {
  'demo-whatsapp': { poster: ['7-wa', 45], parts: [['7-wa', 3, 46, 1.6], ['7x-sheet', 0.5, 4.5, 1], ['7x-exec', 0.5, 4.5, 1]] },
  'demo-webchat': { poster: ['6-web', 58, WEB], parts: [['6-web', 4, 62, 1.8, WEB]] },
  'demo-crm': { poster: ['8-crm', 28], parts: [['8-crm', 2, 30, 2.5], ['8-crm', 38, 45, 1], ['8-crm', 53, 60, 1], ['8-crm', 66, 74, 1]] },
};
for (const [name, { poster, parts }] of Object.entries(CUTS)) {
  const srcs = [...new Set(parts.map(p => p[0]))];
  const args = ['-v', 'error', '-y']; srcs.forEach(s => args.push('-i', path.join(HERE, s + '.mkv')));
  const f = parts.map(([s, a, b, sp, crop], i) => `[${srcs.indexOf(s)}:v]trim=${a}:${b},setpts=(PTS-STARTPTS)/${sp},${crop || CROP},scale=1100:-2,pad=1100:398:0:(398-ih)/2:0xF6F1E9,fps=15,setsar=1[v${i}]`).join(';') + ';' + parts.map((_, i) => `[v${i}]`).join('') + `concat=n=${parts.length}:v=1:a=0[o]`;
  args.push('-filter_complex', f, '-map', '[o]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', path.join(OUT, name + '.mp4'));
  execFileSync('ffmpeg', args, { stdio: 'inherit' });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(poster[1]), '-i', path.join(HERE, poster[0] + '.mkv'), '-vf', (poster[2] || CROP) + ',scale=1100:-2', '-frames:v', '1', '-q:v', '3', path.join(OUT, name + '.jpg')], { stdio: 'inherit' });
  const dur = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(OUT, name + '.mp4')]).toString().trim();
  console.log(name, dur + 's', Math.round(fs.statSync(path.join(OUT, name + '.mp4')).size / 1024) + ' KB');
}
