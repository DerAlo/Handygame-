// Erzeugt die Quantensalat-Icons. Aufruf: npx http-server -p 8080 &  dann  node tools/make-qs-icons.mjs
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:8080/quantensalat/index.html');
const out = await page.evaluate(async () => {
  const { drawQBox, drawCat } = await import('./js/sprites.js');
  const small = (mask) => {
    const c = document.createElement('canvas'); c.width = c.height = 48;
    const x = c.getContext('2d');
    x.fillStyle = '#0b1128'; x.fillRect(0, 0, 48, 48);
    x.fillStyle = '#1a1e4a'; x.fillRect(0, 30, 48, 18);
    for (const [a, b] of [[5, 6], [40, 4], [30, 10], [12, 16], [44, 20]]) { x.fillStyle = '#fff'; x.fillRect(a, b, 1, 1); }
    x.save(); x.translate(24, 36); x.scale(1.6, 1.6); drawQBox(x, 0, 0, 1.2, true); x.restore();
    drawCat(x, 37, 43, 0, true);
    return c;
  };
  const make = (px, mask) => {
    const s = small(mask);
    const c = document.createElement('canvas'); c.width = c.height = px;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    if (mask) { x.fillStyle = '#0b1128'; x.fillRect(0, 0, px, px); const m = px * 0.14; x.drawImage(s, m, m, px - 2 * m, px - 2 * m); }
    else { x.beginPath(); x.roundRect(0, 0, px, px, px * 0.2); x.clip(); x.drawImage(s, 0, 0, px, px); }
    return c.toDataURL('image/png');
  };
  return { 'icon-192.png': make(192), 'icon-512.png': make(512), 'apple-touch-icon.png': make(180, true), 'icon-maskable-512.png': make(512, true) };
});
for (const [n, u] of Object.entries(out)) { writeFileSync(new URL(`../quantensalat/icons/${n}`, import.meta.url), Buffer.from(u.split(',')[1], 'base64')); console.log('quantensalat/icons/' + n); }
await browser.close();
