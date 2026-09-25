// Erzeugt die App-Icons aus den Spiel-Sprites.
// Aufruf: npx http-server -p 8080 &  dann  node tools/make-icons.mjs
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:8080/index.html');
const out = await page.evaluate(async () => {
  const { drawBody, drawFace, LEVELS } = await import('./js/sprites.js');
  function icon(px, { maskable = false, round = 0.22 } = {}) {
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, px);
    g.addColorStop(0, '#ffd9ec'); g.addColorStop(1, '#c9ecff');
    x.fillStyle = g;
    if (maskable) x.fillRect(0, 0, px, px);
    else { x.beginPath(); x.roundRect(0, 0, px, px, px * round); x.fill(); }
    const scale = maskable ? 0.62 : 0.8;
    // zwei kleine Blubbs + ein großer
    const draw = (lv, cx, cy, size, mood) => {
      const r = LEVELS[lv].r;
      x.save(); x.translate(cx * px, cy * px); const k = (size * px * scale) / (2 * r); x.scale(k, k);
      drawBody(x, lv, r); drawFace(x, r, mood, 0, 0, 0.2); x.restore();
    };
    const o = maskable ? 0.19 : 0.1;
    draw(0, 0.5 - 0.28 * (1 - o), 0.72, 0.26, 'normal');
    draw(1, 0.5 + 0.27 * (1 - o), 0.7, 0.3, 'happy');
    draw(6, 0.5, 0.5, 0.62, 'happy');
    return c.toDataURL('image/png');
  }
  return {
    'icon-192.png': icon(192),
    'icon-512.png': icon(512),
    'apple-touch-icon.png': icon(180, { maskable: true }),
    'icon-maskable-512.png': icon(512, { maskable: true }),
  };
});
for (const [name, url] of Object.entries(out)) {
  writeFileSync(new URL(`../icons/${name}`, import.meta.url), Buffer.from(url.split(',')[1], 'base64'));
  console.log('icons/' + name);
}
await browser.close();
