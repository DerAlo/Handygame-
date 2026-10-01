// SCHWARMSTURM – Menü, Shop, Steuerung und Spielablauf
import { Game } from './game.js';
import { buildLevel, WEAPONS, UPGRADES, upgradeCost } from './levels.js';
import { audio } from './audio.js';
import { ads } from '../../js/ads.js';

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('schwarm.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('schwarm.' + k, JSON.stringify(v)); } catch {} },
};
const save = Object.assign({ level: 0, coins: 0, up: { start: 0, power: 0, rate: 0, coins: 0 }, music: true, sfx: true }, store.get('save', {}));
save.up = Object.assign({ start: 0, power: 0, rate: 0, coins: 0 }, save.up);
const persist = () => store.set('save', save);
audio.musicOn = save.music; audio.sfxOn = save.sfx;
ads.init();

let revived = false, lastWin = 0, doubled = false;

const game = new Game($('cv'), {
  hud: (g) => updateHud(g),
  float: (txt, good) => { const el = document.createElement('div'); el.className = 'float ' + (good ? 'good' : 'bad'); el.textContent = txt; $('floats').appendChild(el); setTimeout(() => el.remove(), 1000); },
  weapon: (w) => { toast(`${WEAPONS[w].icon} ${WEAPONS[w].name}!`); $('weaponChip').textContent = `${WEAPONS[w].icon} ${WEAPONS[w].name}`; },
  bossBar: (v, name) => {
    if (v === null) return $('bossBox').classList.add('hidden');
    $('bossBox').classList.remove('hidden');
    if (name) $('bossName').textContent = name;
    $('bossFill').style.width = v * 100 + '%';
  },
  win: () => onWin(),
  lose: () => onLose(),
  contextLost: () => { $('lost').classList.add('show'); setTimeout(() => location.reload(), 1200); },
});
addEventListener('resize', () => game.resize());

let lastN = -1;
function updateHud(g) {
  const n = Math.round(g.n);
  if (n !== lastN) { const c = $('count'); c.textContent = n; c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); lastN = n; }
  $('coins').textContent = `🪙 ${save.coins + g.coinsRun}`;
}
let toastT;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1600); }

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === id);
  $('hud').classList.toggle('off', !!id);
}

// ---------- Ablauf ----------
function startLevel() {
  revived = false; doubled = false;
  const L = buildLevel(save.level);
  game.load(L, save.up);
  $('lvl').textContent = `Level ${save.level + 1}`;
  $('weaponChip').textContent = `${WEAPONS.pistol.icon} ${WEAPONS.pistol.name}`;
  $('bossBox').classList.add('hidden');
  $('hint').classList.remove('hidden');
  lastN = -1; updateHud(game);
  show(null);
  audio.play('run');
}
function begin() {
  if (game.state !== 'ready') return;
  game.state = 'run';
  $('hint').classList.add('hidden');
}

function onWin() {
  const g = game;
  const base = 20 + save.level * 6 + g.coinsRun + Math.floor(g.n / 2);
  lastWin = Math.round(base * (1 + save.up.coins * 0.2));
  save.coins += lastWin;
  save.level++;
  persist();
  $('winCoins').textContent = `+${lastWin} 🪙`;
  $('winInfo').textContent = `${Math.round(g.n)} Kämpfer übrig · ${g.kills} Gegner besiegt`;
  $('btnDouble').disabled = false;
  $('btnDouble').classList.toggle('hidden', !ads.enabled && false);
  audio.win();
  audio.play('menu');
  show('scrWin');
}
function onLose() {
  $('loseInfo').textContent = `Level ${save.level + 1} · ${game.kills} Gegner besiegt`;
  $('btnRevive').classList.toggle('hidden', revived);
  audio.play('menu');
  show('scrLose');
}

async function revive() {
  const ok = await ads.rewarded('revive', { beforeAd: () => audio.suspend(), afterAd: () => audio.resume() });
  if (!ok) return;
  revived = true;
  game.n = 15 + save.up.start * 3;
  game.clash = null;
  game.syncUnits();
  game.state = game.cz <= game.end + 30 ? 'boss' : 'run';
  for (const s of game.shells) s.done = true;
  lastN = -1; updateHud(game);
  show(null);
  audio.play(game.state === 'boss' ? 'boss' : 'run');
}
async function double() {
  if (doubled) return;
  const ok = await ads.rewarded('double', { beforeAd: () => audio.suspend(), afterAd: () => audio.resume() });
  if (!ok) return;
  doubled = true;
  save.coins += lastWin; persist();
  $('winCoins').textContent = `+${lastWin * 2} 🪙`;
  $('btnDouble').disabled = true;
  audio.coin();
}

// ---------- Menü & Shop ----------
function renderMenu() {
  $('menuLevel').textContent = `Level ${save.level + 1}`;
  $('menuCoins').textContent = `🪙 ${save.coins}`;
  const shop = $('shop');
  shop.innerHTML = '';
  for (const [k, U] of Object.entries(UPGRADES)) {
    const lv = save.up[k], cost = upgradeCost(k, lv);
    const b = document.createElement('button');
    b.className = 'up' + (save.coins < cost ? ' poor' : '');
    b.innerHTML = `<b>${U.name}</b><span class="lv">Stufe ${lv} · ${U.desc}</span><br><span class="cost">🪙 ${cost}</span>`;
    b.addEventListener('click', (e) => {
      e.stopPropagation(); audio.unlock();
      if (save.coins < cost) { b.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], 200); return; }
      save.coins -= cost; save.up[k]++; persist(); audio.coin(); renderMenu();
    });
    shop.appendChild(b);
  }
  show('scrMenu');
  // Vorschau des nächsten Levels im Hintergrund
  game.load(buildLevel(save.level), save.up);
  game.state = 'ready';
}

const click = (id, fn) => $(id).addEventListener('click', (e) => { e.stopPropagation(); audio.unlock(); fn(); });
click('btnPlay', startLevel);
click('btnNext', () => { renderMenu(); });
click('btnDouble', double);
click('btnRevive', revive);
click('btnRetry', startLevel);
click('btnMenu', renderMenu);

function syncToggles() { for (const b of document.querySelectorAll('.toggle')) b.setAttribute('aria-pressed', String(!!save[b.dataset.set])); }
for (const b of document.querySelectorAll('.toggle')) b.addEventListener('click', (e) => {
  e.stopPropagation(); audio.unlock();
  const k = b.dataset.set; save[k] = !save[k]; persist();
  if (k === 'music') audio.setMusic(save.music); else audio.setSfx(save.sfx);
  syncToggles();
});
syncToggles();

// ---------- Steuerung: ziehen ----------
let drag = null;
const canvas = $('cv');
const onDown = (e) => {
  audio.unlock();
  if (document.querySelector('.screen.show')) return;
  begin();
  drag = { id: e.pointerId, sx: e.clientX, cx: game.cx };
};
const onMove = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.sx;
  game.input.x = drag.cx + (dx / Math.min(innerWidth, 520)) * 14;
};
const onUp = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
addEventListener('pointerdown', onDown);
addEventListener('pointermove', onMove);
addEventListener('pointerup', onUp);
addEventListener('pointercancel', onUp);
const keys = new Set();
addEventListener('keydown', (e) => { keys.add(e.code); audio.unlock(); if (!document.querySelector('.screen.show')) begin(); });
addEventListener('keyup', (e) => keys.delete(e.code));
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('visibilitychange', () => (document.hidden ? audio.suspend() : audio.resume()));

// ---------- Schleife ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  const k = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
  if (k) game.input.x = (game.input.x ?? game.cx) + k * dt * 12;
  game.update(dt);
  game.render();
  // Zahl über der Truppe, Fortschritt
  if (game.L) {
    const [x, y, vis] = game.screenPos(game.cx, 2.3 + game.R * 0.25, game.cz);
    const c = $('count');
    c.style.left = x + 'px'; c.style.top = y + 'px';
    c.style.display = vis && game.n > 0 && !document.querySelector('.screen.show') ? '' : 'none';
    $('progFill').style.width = Math.min(100, (-game.cz / game.L.length) * 100) + '%';
  }
  requestAnimationFrame(frame);
}
renderMenu();
audio.play('menu');
requestAnimationFrame(frame);

window.__schwarm = { game, save, startLevel, buildLevel };
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
