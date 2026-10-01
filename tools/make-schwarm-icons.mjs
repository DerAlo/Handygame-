// Erzeugt die SCHWARMSTURM-Icons. Aufruf: npx http-server -p 8080 &  dann  node tools/make-schwarm-icons.mjs
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:8080/schwarm/index.html');
const out = await page.evaluate(() => {
  const make = (px, mask) => {
    const c = document.createElement('canvas'); c.width = c.height = px;
    const x = c.getContext('2d');
    if (!mask) { x.beginPath(); x.roundRect(0, 0, px, px, px * 0.22); x.clip(); }
    const s = px / 512;
    const bg = x.createLinearGradient(0, 0, 0, px); bg.addColorStop(0, '#6ac0ff'); bg.addColorStop(1, '#1a6ad0');
    x.fillStyle = bg; x.fillRect(0, 0, px, px);
    x.save(); x.scale(s, s);
    if (mask) { x.translate(256, 256); x.scale(0.8, 0.8); x.translate(-256, -256); }
    // Straße
    x.fillStyle = '#d8dce4'; x.beginPath(); x.moveTo(200, 0); x.lineTo(312, 0); x.lineTo(470, 512); x.lineTo(42, 512); x.fill();
    const guy = (cx, cy, r, col, dark) => { x.fillStyle = dark; x.fillRect(cx - r * 0.5, cy + r * 0.6, r * 0.35, r * 0.9); x.fillRect(cx + r * 0.15, cy + r * 0.6, r * 0.35, r * 0.9); x.fillStyle = col; x.beginPath(); x.roundRect(cx - r * 0.6, cy - r * 0.3, r * 1.2, r * 1.1, r * 0.3); x.fill(); x.beginPath(); x.arc(cx, cy - r * 0.7, r * 0.5, 0, Math.PI * 2); x.fill(); };
    for (let i = 0; i < 9; i++) guy(190 + (i % 3) * 60 + (Math.floor(i / 3) % 2) * 20, 70 + Math.floor(i / 3) * 40, 22, '#e8323a', '#9a1a20');
    for (let i = 0; i < 16; i++) guy(130 + (i % 4) * 80 + (Math.floor(i / 4) % 2) * 30, 300 + Math.floor(i / 4) * 52, 34, '#2f7fff', '#1a4ab0');
    x.fillStyle = '#ffd23a'; for (let i = 0; i < 6; i++) x.fillRect(180 + i * 30, 200 - (i % 2) * 20, 8, 30);
    x.restore();
    return c.toDataURL('image/png');
  };
  return { 'icon-192.png': make(192), 'icon-512.png': make(512), 'apple-touch-icon.png': make(180, true), 'icon-maskable-512.png': make(512, true) };
});
for (const [n, u] of Object.entries(out)) { writeFileSync(new URL(`../schwarm/icons/${n}`, import.meta.url), Buffer.from(u.split(',')[1], 'base64')); console.log('schwarm/icons/' + n); }
await browser.close();
