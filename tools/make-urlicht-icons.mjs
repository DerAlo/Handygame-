// Erzeugt die URLICHT-Icons. Aufruf: npx http-server -p 8080 &  dann  node tools/make-urlicht-icons.mjs
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:8080/urlicht/index.html');
const out = await page.evaluate(() => {
  const make = (px, mask) => {
    const c = document.createElement('canvas'); c.width = c.height = px;
    const x = c.getContext('2d');
    if (!mask) { x.beginPath(); x.roundRect(0, 0, px, px, px * 0.22); x.clip(); }
    const s = px / 512;
    const bg = x.createRadialGradient(256 * s, 200 * s, 10 * s, 256 * s, 256 * s, 380 * s);
    bg.addColorStop(0, '#ffe8a0'); bg.addColorStop(0.18, '#ff8a3a'); bg.addColorStop(0.45, '#5a1a40'); bg.addColorStop(1, '#05060f');
    x.fillStyle = bg; x.fillRect(0, 0, px, px);
    for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`; x.fillRect(Math.random() * px, Math.random() * px, 2 * s, 2 * s); }
    x.save(); x.translate(256 * s, 330 * s); x.scale(s * (mask ? 0.8 : 1), s * (mask ? 0.8 : 1));
    // Schiff von hinten
    x.fillStyle = '#c8d0de'; x.beginPath(); x.moveTo(-180, 40); x.lineTo(0, -10); x.lineTo(180, 40); x.lineTo(0, 20); x.closePath(); x.fill();
    x.fillStyle = '#2fc4c8'; x.beginPath(); x.moveTo(-170, 38); x.lineTo(-60, 14); x.lineTo(-70, 26); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(170, 38); x.lineTo(60, 14); x.lineTo(70, 26); x.closePath(); x.fill();
    x.fillStyle = '#ffb347'; x.beginPath(); x.moveTo(-180, 40); x.lineTo(-170, -40); x.lineTo(-160, 36); x.fill(); x.beginPath(); x.moveTo(180, 40); x.lineTo(170, -40); x.lineTo(160, 36); x.fill();
    x.fillStyle = '#e8ecf4'; x.beginPath(); x.moveTo(-40, 20); x.lineTo(0, -60); x.lineTo(40, 20); x.closePath(); x.fill();
    x.fillStyle = '#6fe0ff'; x.beginPath(); x.moveTo(-14, -8); x.lineTo(0, -44); x.lineTo(14, -8); x.closePath(); x.fill();
    const g = x.createRadialGradient(0, 24, 2, 0, 24, 50); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#7fd8ff'); g.addColorStop(1, 'rgba(127,216,255,0)');
    x.fillStyle = g; x.fillRect(-50, -26, 100, 100);
    x.restore();
    return c.toDataURL('image/png');
  };
  return { 'icon-192.png': make(192), 'icon-512.png': make(512), 'apple-touch-icon.png': make(180, true), 'icon-maskable-512.png': make(512, true) };
});
for (const [n, u] of Object.entries(out)) { writeFileSync(new URL(`../urlicht/icons/${n}`, import.meta.url), Buffer.from(u.split(',')[1], 'base64')); console.log('urlicht/icons/' + n); }
await browser.close();
