import { Game, N } from './game.js';
import { audio } from './audio.js';
import { ads } from '../../js/ads.js';

const $ = (id) => document.getElementById(id);
const cv = $('cv');
const ctx = cv.getContext('2d');

const store = {
  get(k, d) { try { const v = localStorage.getItem('blockgarten.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('blockgarten.' + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem('blockgarten.' + k); } catch {} },
};

const settings = Object.assign({ sfx: true, music: true, vibe: true }, store.get('settings', {}));
let best = store.get('best', 0);
let games = store.get('games', 0);
audio.sfxOn = settings.sfx;
audio.musicOn = settings.music;
ads.init();

const game = new Game({
  onScore(s) {
    const el = $('score');
    if (el.textContent !== String(s)) { el.textContent = s; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    if (s > best) $('best').textContent = s;
    $('streak').textContent = game.streak >= 1 ? 'x' + game.streak : '–';
  },
  onHaptic(p) { if (settings.vibe && navigator.vibrate) navigator.vibrate(p); },
  onOver(score) { handleOver(score); },
});

// Deko-Muster fürs Startbild: ein Herz aus Blumenbeeten
function titleBoard() {
  game.reset();
  game.state = 'title';
  const heart = ['........', '.##..##.', '########', '########', '.######.', '..####..', '...##...', '........'];
  heart.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') game.grid[r][c] = (r + c) % 7; }));
}

// ---------- Layout ----------
let view = {};
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const cw = window.innerWidth, ch = window.innerHeight;
  cv.width = Math.round(cw * dpr);
  cv.height = Math.round(ch * dpr);
  const top = $('hud').getBoundingClientRect().bottom + 8;
  const safeBottom = $('sb').getBoundingClientRect().height;
  view = { cw, ch, dpr, top, bottom: ch - 10 - safeBottom };
  game.layout(view);
}
window.addEventListener('resize', resize);

// ---------- Eingabe ----------
let pid = null;
cv.addEventListener('pointerdown', (e) => {
  audio.unlock();
  if (pid !== null) return;
  pid = e.pointerId;
  cv.setPointerCapture?.(e.pointerId);
  game.pointerDown(e.clientX, e.clientY);
});
cv.addEventListener('pointermove', (e) => { if (e.pointerId === pid) game.pointerMove(e.clientX, e.clientY); });
const up = (e) => { if (e.pointerId !== pid) return; pid = null; game.pointerUp(); afterMove(); };
cv.addEventListener('pointerup', up);
cv.addEventListener('pointercancel', up);
document.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
document.addEventListener('contextmenu', (e) => e.preventDefault());

function afterMove() {
  if (game.state === 'play') saveGame();
  $('streak').textContent = game.streak >= 1 ? 'x' + game.streak : '–';
}

// ---------- Bildschirme ----------
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === id);
  $('hud').classList.toggle('off', id === 'scrTitle');
}
function refreshTitle() {
  const has = !!store.get('save', null);
  $('bestTitle').textContent = best;
  $('btnResume').classList.toggle('hidden', !has);
  $('btnPlay').textContent = has ? 'Neues Spiel' : 'Spielen';
  $('btnPlay').classList.toggle('big', !has);
}
function startGame() {
  store.del('save');
  game.newGame();
  $('best').textContent = best;
  show(null);
}
function resume() {
  const s = store.get('save', null);
  if (!s) return startGame();
  try { game.load(s); } catch { return startGame(); }
  $('best').textContent = best;
  show(null);
}
function pause() {
  if (game.state !== 'play') return;
  game.pointerUp();
  game.state = 'pause';
  saveGame();
  show('scrPause');
}
function toTitle() {
  saveGame();
  titleBoard();
  refreshTitle();
  show('scrTitle');
}
function saveGame() {
  if (game.state === 'play' || game.state === 'pause') store.set('save', game.serialize());
}

function handleOver(score) {
  store.del('save');
  games++;
  store.set('games', games);
  const record = score > best;
  if (record) { best = score; store.set('best', best); }
  $('finalScore').textContent = score;
  $('statLines').textContent = game.linesTotal;
  $('statBest').textContent = best;
  $('newRecord').classList.toggle('hidden', !record);
  $('btnRescue').classList.toggle('hidden', game.rescueUsed);
  $('rescueHint').textContent = ads.enabled ? 'kurzes Video · 1× pro Runde' : 'passen garantiert · 1× pro Runde';
  show('scrOver');
  if (record) audio.record();
}

async function rescue() {
  $('btnRescue').disabled = true;
  const ok = await ads.rewarded('rescue', { beforeAd: () => audio.suspend(), afterAd: () => audio.resume() });
  $('btnRescue').disabled = false;
  if (!ok) return;
  show(null);
  game.rescue();
  saveGame();
}
async function again() {
  if (games % 3 === 0) await ads.interstitial('again', { beforeAd: () => audio.suspend(), afterAd: () => audio.resume() });
  startGame();
}

const click = (id, fn) => $(id).addEventListener('click', () => { audio.unlock(); audio.click(); fn(); });
click('btnPlay', startGame);
click('btnResume', resume);
click('btnPause', pause);
click('btnContinue', () => { game.state = 'play'; show(null); });
click('btnRestart', startGame);
click('btnMenu', toTitle);
click('btnMenu2', toTitle);
click('btnAgain', again);
click('btnRescue', rescue);

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

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { saveGame(); pause(); audio.suspend(); } else audio.resume();
});
window.addEventListener('pagehide', saveGame);

// ---------- Schleife ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.update(dt);
  game.render(ctx);
  requestAnimationFrame(frame);
}

resize();
titleBoard();
refreshTitle();
$('best').textContent = best;
show('scrTitle');
requestAnimationFrame(frame);
setTimeout(resize, 100);

window.__garten = { game, N };

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
