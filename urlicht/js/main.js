import { Game } from './game.js';
import { LEVELS, CAST, PROLOG, EPILOG } from './levels.js';
import { audio } from './audio.js';
import { ads } from '../../js/ads.js';

const $ = (id) => document.getElementById(id);

// ---------- Speicher ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('urlicht.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('urlicht.' + k, JSON.stringify(v)); } catch {} },
};
const settings = Object.assign({ music: true, sfx: true, autofire: false, invertY: false }, store.get('settings', {}));
// Ab Version 2 ist Dauerfeuer standardmäßig aus
if (!settings.v2) { settings.v2 = true; settings.autofire = false; store.set('settings', settings); }
const progress = Object.assign({ unlocked: 1, best: {}, seenProlog: false }, store.get('progress', {}));
audio.musicOn = settings.music; audio.sfxOn = settings.sfx;
ads.init();

// ---------- Porträts (Pixel-Art per Code) ----------
function drawPortrait(cv, who) {
  const x = cv.getContext('2d');
  const R = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
  x.clearRect(0, 0, 48, 48);
  R(who === 'stille' ? '#f4f4f8' : '#0e1a3a', 0, 0, 48, 48);
  if (who !== 'stille') for (let y = 0; y < 48; y += 3) R('rgba(255,255,255,0.04)', 0, y, 48, 1);
  switch (who) {
    case 'juno':
      R('#ff9a3a', 8, 38, 32, 10); R('#e07a20', 20, 38, 8, 10);
      R('#f2c6a0', 16, 16, 16, 20); R('#f2c6a0', 20, 34, 8, 5);
      R('#2a1a2a', 13, 10, 22, 8); R('#2a1a2a', 13, 16, 4, 16); R('#2a1a2a', 31, 16, 4, 16); R('#3a2a3a', 16, 11, 10, 3);
      R('#1a1a2a', 19, 23, 3, 3); R('#1a1a2a', 26, 23, 3, 3); R('#c8704a', 22, 31, 5, 1);
      R('#555', 32, 22, 3, 8); R('#333', 29, 30, 6, 2);
      break;
    case 'mira':
      R('#ff9ad0', 8, 38, 32, 10);
      R('#1a0e0a', 9, 6, 30, 26); R('#2a1a14', 11, 4, 26, 6);
      R('#8a5a3a', 16, 14, 16, 22); R('#8a5a3a', 20, 34, 8, 5);
      R('#1a0e0a', 12, 12, 5, 16); R('#1a0e0a', 31, 12, 5, 16);
      R('#fff', 17, 21, 6, 5); R('#fff', 25, 21, 6, 5); R('#222', 19, 22, 2, 3); R('#222', 27, 22, 2, 3); R('#ffd35a', 23, 23, 2, 1);
      R('#5a2a1a', 21, 31, 6, 1);
      break;
    case 'brakk':
      R('#5a6070', 8, 40, 32, 8);
      R('#8a94a4', 11, 12, 26, 26); R('#6a7484', 11, 32, 26, 6); R('#aab4c4', 11, 12, 26, 3);
      R('#23060a', 16, 19, 16, 8); R('#ff3040', 21, 21, 6, 4); R('#ff9aa0', 22, 21, 2, 1);
      R('#6a7484', 23, 4, 2, 8); R('#ffd35a', 22, 2, 4, 3);
      for (const [a, b] of [[13, 14], [33, 14], [13, 34], [33, 34]]) R('#4a5464', a, b, 2, 2);
      R('#3a4454', 17, 30, 14, 2); R('#3a4454', 19, 30, 1, 3); R('#3a4454', 24, 30, 1, 3); R('#3a4454', 28, 30, 1, 3);
      break;
    case 'pip': {
      const g = x.createRadialGradient(24, 24, 2, 24, 24, 22); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#fff6a0'); g.addColorStop(1, 'rgba(255,200,80,0)');
      x.fillStyle = g; x.fillRect(0, 0, 48, 48);
      R('#6a4a00', 18, 21, 3, 4); R('#6a4a00', 27, 21, 3, 4); R('#8a5a10', 22, 28, 4, 1);
      R('#fff', 8, 8, 2, 2); R('#fff', 38, 12, 2, 2); R('#fff', 36, 38, 2, 2);
      break;
    }
    case 'tessaro':
      R('#2a4a8a', 8, 38, 32, 10); R('#ffd35a', 13, 41, 4, 3); R('#ffd35a', 31, 41, 4, 3);
      R('#e8c0a0', 16, 15, 16, 21); R('#e8c0a0', 20, 34, 8, 5);
      R('#c8c8d0', 14, 10, 20, 7); R('#c8c8d0', 14, 14, 3, 8); R('#c8c8d0', 31, 14, 3, 8);
      R('#1a1a2a', 19, 23, 3, 2); R('#1a1a2a', 26, 23, 3, 2); R('#a06a50', 21, 31, 7, 1);
      R('#1a2a5a', 14, 8, 20, 4);
      break;
    case 'stille':
      x.fillStyle = '#000'; x.beginPath(); x.arc(24, 24, 14, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#000'; x.lineWidth = 1; x.beginPath(); x.arc(24, 24, 19, 0, Math.PI * 2); x.stroke();
      break;
  }
}

// ---------- Spiel ----------
let current = 0;
let continued = false;
const game = new Game($('cv'), {
  hud: (g) => updateHud(g),
  say: (who, text) => say(who, text),
  warn: (t) => { const w = $('warn'); w.textContent = t; w.classList.remove('show'); void w.offsetWidth; w.classList.add('show'); },
  tip: (t) => tip(t),
  hurt: () => { const h = $('hurt'); h.classList.add('on'); setTimeout(() => h.classList.remove('on'), 60); },
  flash: () => { const w = $('whiteout'); w.classList.add('on'); setTimeout(() => w.classList.remove('on'), 80); },
  bonus: (n, text) => bonus(text || `+${n - 1} TREFFER-BONUS`),
  bossBar: (v, name) => {
    const b = $('bossBox');
    if (v === null) return b.classList.add('hidden');
    b.classList.remove('hidden');
    if (name) $('bossName').textContent = name;
    $('bossFill').style.width = Math.max(0, v * 100) + '%';
  },
  bossDown: () => say(['mira', 'juno', 'brakk'][current % 3], ['Er zerfällt! Gut gemacht, Juno!', 'Getroffen! Er geht in Stücke!', 'Kaputt. So mag ich das.'][current % 3]),
  chaseSaved: (id) => say(id, id === 'brakk' ? 'Danke, Funke. Ich schulde dir ein Ersatzteil.' : 'Danke, Juno! Du hast was gut bei mir!'),
  chaseFailed: (id) => say(id, id === 'brakk' ? 'Hab ihn abgeschüttelt. Mit einer Delle mehr.' : 'Er ist weg … aber mein Schiff hat was abbekommen!'),
  dead: () => onDead(),
  levelClear: () => onClear(),
  brakkSacrifice: (cb) => sayChain([
    ['brakk', 'Juno. Der Chor ist zu stark. Ich hab da eine Idee.'],
    ['juno', 'Brakk, nein! Was auch immer du vorhast –'],
    ['brakk', 'Ich hab mein ganzes Leben Steine zerschlagen. Lass mich einmal etwas Schönes zerschlagen.'],
    ['brakk', 'Schrott geht zum Schrott. Fliegt weiter!'],
  ], cb),
  brakkReturns: (cb) => {
    const w = game.wing.find((w) => w.id === 'brakk');
    if (w) { w.alive = true; w.obj.position.set(30, 10, 20); }
    sayChain([
      ['brakk', 'Hat hier jemand Schrott bestellt?'],
      ['juno', 'BRAKK?!'],
      ['brakk', 'Pip hatte recht. Nichts geht verloren. Ich wurde nur … umgeformt. Mit besseren Lüftern.'],
      ['brakk', 'Ich decke dich, Funke. Deine Schüsse treffen jetzt doppelt so hart!'],
    ], cb);
  },
  symmetryBroken: () => sayChain([
    ['mira', 'Eine Seite ist weg! Die Symmetrie ist gebrochen – der Kern ist offen!'],
    ['stille', 'NEIN. UNGLEICH. ALLES WIRD … UNGLEICH …'],
    ['pip', 'Hörst du, Funke? Das ist der erste Ton. Genau so hat alles angefangen.'],
  ]),
});
game.settings.autofire = settings.autofire;
game.settings.invertY = settings.invertY;
window.addEventListener('resize', () => game.resize());

// ---------- HUD ----------
let lastHud = '';
function updateHud(g) {
  const p = g.p;
  const key = [Math.ceil(p.shield), p.maxShield, g.score, g.hits, p.bombs, p.laser].join('|');
  if (key === lastHud) return;
  lastHud = key;
  $('shieldFill').style.width = (p.shield / 150) * 100 + '%';
  $('shieldBar').style.width = (p.maxShield / 150) * (innerWidth < innerHeight ? 140 : 190) + 'px';
  $('shieldFill').style.width = (p.shield / p.maxShield) * 100 + '%';
  $('shieldFill').classList.toggle('low', p.shield <= 25);
  $('score').textContent = String(g.score).padStart(6, '0');
  $('hits').textContent = g.hits;
  $('bombs').textContent = '💣'.repeat(Math.min(p.bombs, 6)) + (p.bombs > 6 ? ` ×${p.bombs}` : '') + (p.laser ? '  ' + (p.laser === 2 ? '⚡⚡' : '⚡') : '');
}

// Funk
const commsQ = [];
let commsBusy = false;
function say(who, text, cb) { commsQ.push({ who, text, cb }); if (!commsBusy) nextComms(); }
function sayChain(lines, cb) { lines.forEach(([w, t], i) => say(w, t, i === lines.length - 1 ? cb : null)); }
function nextComms() {
  const c = commsQ.shift();
  const box = $('comms');
  if (!c) { commsBusy = false; box.classList.add('hidden'); return; }
  commsBusy = true;
  const cast = CAST[c.who] || CAST.juno;
  drawPortrait($('commsPortrait'), c.who);
  $('commsName').textContent = cast.name;
  $('commsName').style.color = cast.color;
  $('commsText').textContent = c.text;
  box.classList.remove('hidden');
  box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
  audio.radio();
  const dur = Math.max(2400, 1200 + c.text.length * 48);
  let n = 0;
  const talk = setInterval(() => { if (n++ > c.text.length / 3) clearInterval(talk); else audio.voice(cast.pitch, cast.wave); }, 70);
  setTimeout(() => { clearInterval(talk); c.cb?.(); nextComms(); }, dur);
}
function clearComms() { commsQ.length = 0; }
let tipT;
function tip(t) { const el = $('tip'); el.textContent = t; el.classList.add('show'); clearTimeout(tipT); tipT = setTimeout(() => el.classList.remove('show'), 4500); }
function bonus(t) { const el = $('bonus'); el.textContent = t; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }

// ---------- Bildschirme ----------
function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === id);
  const playing = !id || id === 'scrLevel';
  $('hud').classList.toggle('off', !playing);
  $('controls').classList.toggle('off', !playing || !isTouch);
}
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Story-Dialog mit Schreibmaschinen-Effekt
function story(lines) {
  return new Promise((resolve) => {
    let i = 0, typing = null, full = '';
    const sc = $('scrStory');
    show('scrStory');
    const render = () => {
      const [who, text] = lines[i];
      const pv = $('storyPortrait');
      pv.classList.toggle('none', !who);
      if (who) drawPortrait(pv, who);
      $('storyName').textContent = who ? CAST[who].name : '';
      $('storyName').style.color = who ? CAST[who].color : '';
      const p = $('storyLine');
      p.classList.toggle('narr', !who);
      full = text; let k = 0; p.textContent = '';
      clearInterval(typing);
      typing = setInterval(() => {
        k += 2; p.textContent = full.slice(0, k);
        if (who && k % 6 === 0) audio.voice(CAST[who].pitch, CAST[who].wave);
        if (k >= full.length) { clearInterval(typing); typing = null; }
      }, 24);
    };
    const advance = (e) => {
      e?.stopPropagation();
      if (typing) { clearInterval(typing); typing = null; $('storyLine').textContent = full; return; }
      i++;
      if (i >= lines.length) { done(); return; }
      render();
    };
    const done = () => { clearInterval(typing); sc.removeEventListener('click', advance); $('btnSkip').onclick = null; resolve(); };
    sc.addEventListener('click', advance);
    $('btnSkip').onclick = (e) => { e.stopPropagation(); done(); };
    render();
  });
}

function levelCard(i) {
  const L = LEVELS[i];
  $('lvlNum').textContent = `MISSION ${i + 1}`;
  $('lvlName').textContent = L.name.toUpperCase();
  $('lvlSub').textContent = L.sub;
  const card = document.querySelector('.levelCard');
  card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  show('scrLevel');
  setTimeout(() => { if ($('scrLevel').classList.contains('show')) show(null); }, 3200);
}

async function startLevel(i, fromCp = false) {
  current = i;
  continued = false;
  const L = LEVELS[i];
  clearComms();
  if (!fromCp) {
    audio.play('title');
    game.load(L);
    game.state = 'demo';
    if (i === 0 && !progress.seenProlog) { await story(PROLOG); progress.seenProlog = true; saveProgress(); }
    await story(L.briefing);
  }
  game.load(L, fromCp);
  audio.play(L.music);
  lastHud = '';
  updateHud(game);
  levelCard(i);
}

async function onClear() {
  const L = LEVELS[current];
  clearComms();
  await story(L.outro);
  const best = progress.best[L.id] || { score: 0, hits: 0 };
  const medal = game.hits >= L.medal;
  progress.best[L.id] = { score: Math.max(best.score, game.score), hits: Math.max(best.hits, game.hits), medal: best.medal || medal };
  progress.unlocked = Math.max(progress.unlocked, Math.min(LEVELS.length, current + 2));
  saveProgress();
  $('resTitle').textContent = `${L.name}: geschafft!`;
  $('resScore').textContent = game.score;
  $('resHits').textContent = game.hits;
  $('resMedal').textContent = medal ? `🏅 Medaille! (${L.medal}+ Treffer)` : `Für die Medaille: ${L.medal} Treffer`;
  $('btnNext').textContent = current === LEVELS.length - 1 ? 'Epilog ▶' : 'Nächste Mission ▶';
  show('scrResult');
  audio.play('ende');
}

function onDead() {
  clearComms();
  $('btnContinue').classList.toggle('hidden', continued);
  $('contHint').textContent = ads.enabled ? 'kurzes Video · 1× pro Level' : 'volles Schild · 1× pro Level';
  $('btnCheckpoint').classList.toggle('hidden', !game.cp);
  show('scrDead');
}

async function continueHere() {
  const ok = await ads.rewarded('continue', { beforeAd: () => audio.suspend(), afterAd: () => audio.resume() });
  if (!ok) return;
  continued = true;
  const p = game.p;
  p.alive = true; p.shield = p.maxShield; p.inv = 2.5;
  game.ship.visible = true;
  for (const b of game.bullets) b.life = 0;
  game.state = game.boss ? 'boss' : 'play';
  lastHud = ''; updateHud(game);
  show(null);
}

function saveProgress() { store.set('progress', progress); }

function renderMap() {
  const list = $('mapList');
  list.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const b = document.createElement('button');
    const best = progress.best[L.id];
    b.className = 'node' + (i >= progress.unlocked ? ' locked' : '');
    b.innerHTML = `<span class="n">${i + 1}</span><span><b>${L.name}</b><small>${L.sub}${best ? ` · Rekord ${best.score}` : ''}</small></span><span class="medal">${best?.medal ? '🏅' : i >= progress.unlocked ? '🔒' : ''}</span>`;
    b.addEventListener('click', () => { audio.unlock(); startLevel(i); });
    list.appendChild(b);
  });
  show('scrMap');
}

async function ending() {
  audio.play('urlicht');
  await story(EPILOG);
  show('scrEnd');
  audio.play('ende');
}

// ---------- Knöpfe ----------
const click = (id, fn) => $(id).addEventListener('click', (e) => { e.stopPropagation(); audio.unlock(); fn(); });
click('btnStart', () => { const i = LEVELS.findIndex((L) => !progress.best[L.id]); startLevel(i < 0 ? 0 : i); });
click('btnMap', renderMap);
click('btnMapBack', () => show('scrTitle'));
click('btnNext', () => (current === LEVELS.length - 1 ? ending() : startLevel(current + 1)));
click('btnResMap', renderMap);
click('btnContinue', continueHere);
click('btnCheckpoint', () => startLevel(current, true));
click('btnRestart', () => startLevel(current));
click('btnDeadMap', () => { game.state = 'idle'; renderMap(); });
click('btnPause', pause);
click('btnResume', resume);
click('btnPauseRestart', () => startLevel(current));
click('btnPauseMap', () => { game.state = 'idle'; renderMap(); });
click('btnEndMap', renderMap);

let pausedFrom = null;
function pause() {
  if (game.state !== 'play' && game.state !== 'boss') return;
  pausedFrom = game.state; game.state = 'pause';
  show('scrPause');
}
function resume() { if (pausedFrom) { game.state = pausedFrom; pausedFrom = null; } show(null); }

function syncToggles() { for (const b of document.querySelectorAll('.toggle')) b.setAttribute('aria-pressed', String(!!settings[b.dataset.set])); }
for (const b of document.querySelectorAll('.toggle')) {
  b.addEventListener('click', (e) => {
    e.stopPropagation(); audio.unlock();
    const k = b.dataset.set;
    settings[k] = !settings[k];
    store.set('settings', settings);
    if (k === 'music') audio.setMusic(settings.music);
    if (k === 'sfx') audio.setSfx(settings.sfx);
    if (k === 'autofire') game.settings.autofire = settings.autofire;
    if (k === 'invertY') game.settings.invertY = settings.invertY;
    syncToggles();
  });
}
syncToggles();

// ---------- Eingabe ----------
const input = game.input;
const base = $('stickBase'), knob = $('stickKnob');
let stickId = null, sx = 0, sy = 0;
$('stickZone').addEventListener('pointerdown', (e) => {
  audio.unlock();
  if (stickId !== null) return;
  stickId = e.pointerId; sx = e.clientX; sy = e.clientY;
  $('stickZone').setPointerCapture?.(e.pointerId);
  base.style.left = sx + 'px'; base.style.top = sy + 'px';
  base.classList.add('active');
});
$('stickZone').addEventListener('pointermove', (e) => {
  if (e.pointerId !== stickId) return;
  let dx = e.clientX - sx, dy = e.clientY - sy;
  const d = Math.hypot(dx, dy), max = 55;
  if (d > max) { dx *= max / d; dy *= max / d; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  input.x = dx / max; input.y = -dy / max;
});
const stickUp = (e) => {
  if (e.pointerId !== stickId) return;
  stickId = null; input.x = 0; input.y = 0;
  knob.style.transform = '';
  base.classList.remove('active');
};
$('stickZone').addEventListener('pointerup', stickUp);
$('stickZone').addEventListener('pointercancel', stickUp);

const fireBtn = $('btnFire');
fireBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); audio.unlock(); input.fire = true; fireBtn.classList.add('pressed'); fireBtn.setPointerCapture?.(e.pointerId); });
const fireUp = () => { input.fire = false; fireBtn.classList.remove('pressed'); };
fireBtn.addEventListener('pointerup', fireUp);
fireBtn.addEventListener('pointercancel', fireUp);
$('btnRoll').addEventListener('pointerdown', (e) => { e.preventDefault(); input.roll = true; });
$('btnBomb').addEventListener('pointerdown', (e) => { e.preventDefault(); input.bomb = true; });

const keys = new Set();
addEventListener('keydown', (e) => {
  audio.unlock();
  keys.add(e.code);
  if (e.code === 'Space') { input.fire = true; e.preventDefault(); }
  if (e.code === 'KeyQ' || e.code === 'KeyE' || e.code === 'ShiftLeft') input.roll = true;
  if (e.code === 'KeyB') input.bomb = true;
  if (e.code === 'KeyP' || e.code === 'Escape') (game.state === 'pause' ? resume() : pause());
});
addEventListener('keyup', (e) => { keys.delete(e.code); if (e.code === 'Space') input.fire = false; });
function keyAxes() {
  if (stickId !== null) return;
  const k = (a, b) => (keys.has(a) || keys.has(b) ? 1 : 0);
  if (keys.size) {
    input.x = k('ArrowRight', 'KeyD') - k('ArrowLeft', 'KeyA');
    input.y = k('ArrowUp', 'KeyW') - k('ArrowDown', 'KeyS');
  }
}
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); audio.suspend(); } else audio.resume(); });

// ---------- Schleife ----------
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  keyAxes();
  if (game.state === 'demo') { input.x = Math.sin(now / 1400) * 0.6; input.y = Math.sin(now / 1900) * 0.4; }
  game.update(dt);
  // Ladering am Feuerknopf
  if (game.p) $('chargeRing').style.strokeDashoffset = String(289 * (1 - (game.p.charge || 0)));
  if (game.state === 'boss' || game.state === 'play') updateHud(game);
  game.render(dt);
  requestAnimationFrame(frame);
}

// Titelbild: das Schiff fliegt durch die Ceres-Werft
game.load(LEVELS[0]);
game.state = 'demo';
show('scrTitle');
audio.play('title');
requestAnimationFrame(frame);

window.__urlicht = { game, LEVELS, startLevel, progress };

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
