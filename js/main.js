import { Game, W, H, WORLD_TOP, WALL } from './game.js';
import { LEVELS, iconURL } from './sprites.js';
import { audio } from './audio.js';
import { ads } from './ads.js';

const $ = (id) => document.getElementById(id);
const cv = $('cv');
const ctx = cv.getContext('2d');

// ---------- Speicher (robust, falls localStorage blockiert ist) ----------
const store = {
  get(k, def) { try { const v = localStorage.getItem('blubberei.' + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem('blubberei.' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('blubberei.' + k); } catch {} },
};

const settings = Object.assign({ sfx: true, music: true, vibe: true }, store.get('settings', {}));
let best = store.get('best', 0);
let gamesPlayed = store.get('games', 0);

audio.sfxOn = settings.sfx;
audio.musicOn = settings.music;
ads.init();

// ---------- Icons vorberechnen ----------
const icons = LEVELS.map((_, lv) => iconURL(lv, 96));
const happyIcons = LEVELS.map((_, lv) => iconURL(lv, 96, 'happy'));

// ---------- Spiel ----------
const game = new Game({
  onScore(s) {
    const el = $('score');
    el.textContent = s;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    if (s > best) $('best').textContent = s;
  },
  onNext(cur, next) {
    const img = $('nextImg');
    img.src = icons[next];
    img.classList.remove('pop'); void img.offsetWidth; img.classList.add('pop');
  },
  onDiscover(lv) {
    store.set('discovered', [...game.discovered]);
    renderChain();
    toast(lv);
  },
  onHaptic(p) { if (settings.vibe && navigator.vibrate) navigator.vibrate(p); },
  onOver(score) { handleGameOver(score); },
});
game.discovered = new Set(store.get('discovered', [0, 1, 2, 3, 4]));

// ---------- Layout ----------
let view = { cw: 0, ch: 0, dpr: 1, s: 1, ox: 0, oy: 0 };
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const cw = window.innerWidth, ch = window.innerHeight;
  cv.width = Math.round(cw * dpr);
  cv.height = Math.round(ch * dpr);
  const top = $('hud').getBoundingClientRect().bottom + 4;
  const bottom = ch - $('chain').getBoundingClientRect().top + 6;
  const availW = cw - 16, availH = ch - top - bottom;
  const worldW = W + WALL * 2 + 8, worldH = H - WORLD_TOP + WALL + 4;
  const s = Math.min(availW / worldW, availH / worldH);
  const ox = (cw - W * s) / 2;
  const oy = top + (availH - worldH * s) / 2 - WORLD_TOP * s;
  view = { cw, ch, dpr, s, ox, oy };
}
window.addEventListener('resize', resize);

// ---------- Eingabe ----------
const toWorldX = (clientX) => (clientX - view.ox) / view.s;
let activePointer = null;
cv.addEventListener('pointerdown', (e) => {
  audio.unlock();
  if (activePointer !== null) return;
  activePointer = e.pointerId;
  cv.setPointerCapture?.(e.pointerId);
  game.pointerDown(toWorldX(e.clientX));
});
cv.addEventListener('pointermove', (e) => { if (e.pointerId === activePointer) game.pointerMove(toWorldX(e.clientX)); });
const release = (e) => {
  if (e.pointerId !== activePointer) return;
  activePointer = null;
  game.pointerUp();
};
cv.addEventListener('pointerup', release);
cv.addEventListener('pointercancel', (e) => { if (e.pointerId === activePointer) { activePointer = null; game.aiming = false; } });
document.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------- Bildschirme ----------
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === id);
  $('hud').classList.toggle('off', id === 'scrTitle');
}

function refreshTitle() {
  $('bestTitle').textContent = best;
  $('btnResume').classList.toggle('hidden', !store.get('save', null));
  $('btnPlay').textContent = store.get('save', null) ? 'Neues Spiel' : 'Spielen';
  $('btnPlay').classList.toggle('big', !store.get('save', null));
}

function startGame() {
  store.del('save');
  game.newGame();
  $('best').textContent = best;
  renderChain();
  show(null);
}

function resumeSaved() {
  const s = store.get('save', null);
  if (!s) return startGame();
  game.load(s);
  $('best').textContent = best;
  renderChain();
  show(null);
}

function pause() {
  if (game.state !== 'play') return;
  game.state = 'pause';
  saveGame();
  show('scrPause');
}

function toTitle() {
  saveGame();
  game.startDemo();
  refreshTitle();
  show('scrTitle');
}

function saveGame() {
  if (game.state === 'play' || game.state === 'pause') store.set('save', game.serialize());
}

let overTimer = null;
function handleGameOver(score) {
  store.del('save');
  gamesPlayed++;
  store.set('games', gamesPlayed);
  const record = score > best;
  if (record) { best = score; store.set('best', best); }
  $('finalScore').textContent = score;
  $('newRecord').classList.toggle('hidden', !record);
  $('biggestImg').src = happyIcons[game.maxLevel];
  $('biggestName').textContent = LEVELS[game.maxLevel].name;
  $('btnRescue').classList.toggle('hidden', game.rescueUsed || game.blobs.length < 4);
  $('rescueHint').textContent = ads.enabled ? 'kurzes Video · 1× pro Runde' : 'obere Blubbs platzen · 1× pro Runde';
  clearTimeout(overTimer);
  overTimer = setTimeout(() => {
    show('scrOver');
    if (record) audio.record();
  }, 900);
}

async function rescue() {
  $('btnRescue').disabled = true;
  const ok = await ads.rewarded('rescue', { beforeAd: () => audio.suspend(), afterAd: () => audio.resume() });
  $('btnRescue').disabled = false;
  if (!ok) return;
  show(null);
  game.rescue();
}

async function again() {
  // Werbung (falls aktiviert) nur jede 3. Runde – nie mitten im Spiel
  if (gamesPlayed % 3 === 0) await ads.interstitial('again', { beforeAd: () => audio.suspend(), afterAd: () => audio.resume() });
  startGame();
}

const click = (id, fn) => $(id).addEventListener('click', () => { audio.unlock(); audio.click(); fn(); });
click('btnPlay', startGame);
click('btnResume', resumeSaved);
click('btnPause', pause);
click('btnContinue', () => { game.state = 'play'; show(null); });
click('btnRestart', startGame);
click('btnMenu', toTitle);
click('btnMenu2', toTitle);
click('btnAgain', again);
click('btnRescue', rescue);

// Einstellungen
function syncToggles() {
  for (const b of document.querySelectorAll('.toggle')) b.setAttribute('aria-pressed', String(!!settings[b.dataset.set]));
}
for (const b of document.querySelectorAll('.toggle')) {
  b.addEventListener('click', () => {
    audio.unlock();
    const k = b.dataset.set;
    settings[k] = !settings[k];
    store.set('settings', settings);
    if (k === 'sfx') audio.setSfx(settings.sfx);
    if (k === 'music') audio.setMusic(settings.music);
    if (k === 'vibe' && settings.vibe && navigator.vibrate) navigator.vibrate(20);
    syncToggles();
    audio.click();
  });
}
syncToggles();

// ---------- Evolutionskette & Toast ----------
function renderChain() {
  const el = $('chain');
  if (!el.children.length) {
    LEVELS.forEach((L, lv) => { const img = new Image(); img.src = icons[lv]; img.alt = L.name; el.appendChild(img); });
  }
  [...el.children].forEach((img, lv) => {
    img.classList.toggle('locked', !game.discovered.has(lv));
    img.title = game.discovered.has(lv) ? LEVELS[lv].name : '???';
  });
}

let toastTimer = null;
function toast(lv) {
  const t = $('toast');
  t.innerHTML = `<img src="${happyIcons[lv]}" alt=""><div><small>Neu entdeckt</small>${LEVELS[lv].name}</div>`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ---------- Lebenszyklus ----------
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveGame();
    pause();
    audio.suspend();
  } else {
    audio.resume();
  }
});
window.addEventListener('pagehide', saveGame);
setInterval(() => { if (game.state === 'play') saveGame(); }, 3000);

// ---------- Hauptschleife ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.render(ctx, view);
  requestAnimationFrame(frame);
}

resize();
renderChain();
refreshTitle();
$('best').textContent = best;
game.startDemo();
show('scrTitle');
requestAnimationFrame(frame);
// Nach dem Laden der Schriften/Layout einmal neu messen
setTimeout(resize, 100);

// Test-/Debug-Zugriff
window.__blubb = { game, view: () => view };

// ---------- Offline (PWA) ----------
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
