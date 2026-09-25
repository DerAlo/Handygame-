import { Engine } from './engine.js';
import * as story from './story.js';
import { audio } from './audio.js';
import { drawCounter } from './art.js';

const $ = (id) => document.getElementById(id);

const store = {
  get(k, d) { try { const v = localStorage.getItem('quantensalat.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('quantensalat.' + k, JSON.stringify(v)); } catch {} },
};
const settings = Object.assign({ sfx: true, music: true }, store.get('settings', {}));
audio.sfxOn = settings.sfx;
audio.musicOn = settings.music;

const E = new Engine(story);
const END = {
  1: 'Kai Wimmer ist jetzt Doktorand.<br>Der Kaffeeautomat ist immer noch kaputt.<br>Schrödinger ist in der Box. Vielleicht.',
  2: 'Der Inn fließt wieder in die richtige Richtung.<br>Sven Glanz liefert jetzt Döner aus – mit KARL.<br>Schrödinger sitzt auf zwei Boxen gleichzeitig.<br><br><b>Fortsetzung folgt …?</b>',
};
E.onEnd = () => {
  const ch = E.S.ch || 1;
  Engine.clearSave();
  $('endText').innerHTML = END[ch];
  $('btnNextCh').classList.toggle('hidden', ch !== 1);
  setTimeout(() => { show('scrEnd'); audio.play('ende'); }, 800);
};

function show(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === id);
}

function refreshTitle() {
  const s = Engine.hasSave() && E.load();
  $('btnResume').classList.toggle('hidden', !s);
  if (s) $('btnResume').textContent = `Weiterspielen (Kapitel ${s.ch || 1})`;
}

async function newGame(ch = 1) {
  if (Engine.hasSave() && !confirm(`Kapitel ${ch} starten? Der bisherige Spielstand wird überschrieben.`)) return;
  Engine.clearSave();
  show(null);
  E.select(null);
  await E.start(E.newState(ch), true);
}
async function resume() {
  const s = E.load();
  if (!s) return newGame();
  show(null);
  await E.start(s);
}

const click = (id, fn) => $(id).addEventListener('click', (e) => { e.stopPropagation(); audio.unlock(); audio.blip(); fn(); });
click('btnNew', () => newGame(1));
click('btnNew2', () => newGame(2));
click('btnNextCh', () => { Engine.clearSave(); show(null); E.select(null); E.start(E.newState(2), true); });
click('btnResume', resume);
click('btnMenu', () => { if (!E.busy) show('scrMenu'); });
click('btnBack', () => show(null));
click('btnTitle', () => { E.save(); refreshTitle(); show('scrTitle'); audio.play('title'); });
click('btnAgainEnd', () => { const ch = E.S?.ch || 1; Engine.clearSave(); show(null); E.select(null); E.start(E.newState(ch), true); });

function syncToggles() { for (const b of document.querySelectorAll('.toggle')) b.setAttribute('aria-pressed', String(!!settings[b.dataset.set])); }
for (const b of document.querySelectorAll('.toggle')) {
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.unlock();
    const k = b.dataset.set;
    settings[k] = !settings[k];
    store.set('settings', settings);
    if (k === 'sfx') audio.setSfx(settings.sfx);
    if (k === 'music') audio.setMusic(settings.music);
    syncToggles();
  });
}
syncToggles();

document.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (E.S && !E.busy) E.save(); audio.suspend(); } else audio.resume(); });

// Schleife
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (E.started) { E.update(dt); E.render(); }
  else drawTitleBackdrop(now / 1000);
  requestAnimationFrame(frame);
}

// Hinter dem Titelbild: die Innbrücke bei Nacht
function drawTitleBackdrop(t) {
  if (!E.S) E.S = E.newState();
  E.S.scene = 'bruecke';
  E.t = t;
  E.actors = { mehmet: { id: 'mehmet', who: 'mehmet', x: 80, y: 146, dir: 1, phase: 0, after: drawCounter } };
  E.render();
}

refreshTitle();
audio.play('title');
requestAnimationFrame(frame);

window.__qs = E;

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
