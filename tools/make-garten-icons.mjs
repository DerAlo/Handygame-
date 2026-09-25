// Erzeugt die Blockgarten-Icons. Aufruf: npx http-server -p 8080 &  dann  node tools/make-garten-icons.mjs
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }
const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:8080/blockgarten/index.html');
const out = await page.evaluate(async () => {
  const { drawIcon } = await import('./js/tiles.js');
  const make = (px, m) => { const c = document.createElement('canvas'); c.width = c.height = px; drawIcon(c.getContext('2d'), px, m); return c.toDataURL('image/png'); };
  return { 'icon-192.png': make(192), 'icon-512.png': make(512), 'apple-touch-icon.png': make(180, true), 'icon-maskable-512.png': make(512, true) };
});
for (const [n, u] of Object.entries(out)) {
  writeFileSync(new URL(`../blockgarten/icons/${n}`, import.meta.url), Buffer.from(u.split(',')[1], 'base64'));
  console.log('blockgarten/icons/' + n);
}
await browser.close();
