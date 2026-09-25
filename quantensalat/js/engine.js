// Point-&-Click-Engine: Szenen, Figuren, Laufen, Hotspots, Inventar, Dialoge, Speichern.
import { W, H, BG, FX, FG } from './art.js';
import { drawPerson, drawQBox, CHARS, ITEMS, itemIcon } from './sprites.js';
import { audio } from './audio.js';

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SAVE_KEY = 'quantensalat.save';

export class Engine {
  constructor(story) {
    this.story = story;
    this.cv = $('cv');
    this.ctx = this.cv.getContext('2d');
    this.cv.width = W; this.cv.height = H;
    this.ctx.imageSmoothingEnabled = false;
    this.bgCache = {};
    this.S = null;
    this.actors = {};
    this.busy = 0;
    this.selected = null;
    this.speech = null;
    this.reveal = 0;
    this.t = 0;
    this.icons = {};
    this.fadeA = 0;
    this.started = false;
    this.cam = 0;
    this.bindInput();
  }

  // ---------- Zustand ----------
  newState(ch = 1) { return this.story.newState(ch); }
  save() {
    if (!this.S || this.S.flags.ended) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.S)); } catch {}
  }
  static hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }
  static clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }
  load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; } }

  get F() { return this.S.flags; }
  has(id) { return this.S.inv.includes(id); }
  addItem(id) {
    if (!this.has(id)) this.S.inv.push(id);
    audio.pickup();
    this.renderInv(id);
  }
  removeItem(id) {
    this.S.inv = this.S.inv.filter((i) => i !== id);
    if (this.selected === id) this.selected = null;
    this.renderInv();
  }
  learn(k) { if (!this.S.learned.includes(k)) this.S.learned.push(k); }

  async start(state, fresh = false) {
    this.S = state;
    this.started = true;
    this.enterScene(this.S.scene, null);
    this.renderInv();
    await this.runEnter(!fresh);
  }

  // ---------- Szenen ----------
  scene() { return this.story.scenes[this.S.scene]; }

  enterScene(id, entry) {
    const sc = this.story.scenes[id];
    this.S.scene = id;
    if (entry && sc.entries?.[entry]) {
      const e = sc.entries[entry];
      Object.assign(this.S.kai, { x: e[0], y: e[1], dir: e[2] || 1 });
    }
    this.kai = { id: 'kai', who: this.story.kaiSprite(this.S), x: this.S.kai.x, y: this.S.kai.y, dir: this.S.kai.dir, color: '#ffffff', phase: 0 };
    this.actors = { kai: this.kai };
    for (const a of sc.actors?.(this.S) || []) this.actors[a.id] = Object.assign({ dir: -1, phase: 0 }, a);
    audio.play(sc.music);
    this.snapCam = true;
    $('place').textContent = sc.title;
    this.renderInv();
  }

  async runEnter(restoring = false) {
    const sc = this.scene();
    if (sc.enter && (!restoring || sc.enterOnRestore)) await this.run(() => sc.enter(this));
  }

  async goto(id, entry) {
    audio.door();
    await this.fade(1);
    this.enterScene(id, entry);
    await this.fade(0);
    await this.runEnter();
  }

  shake(s) { this.shakeT = s; }
  setScore(txt) { const el = $('duelscore'); el.textContent = txt; el.classList.toggle('show', !!txt); }

  async fade(to) {
    const from = this.fadeA;
    const steps = 12;
    for (let i = 1; i <= steps; i++) { this.fadeA = from + (to - from) * (i / steps); await sleep(20); }
  }

  bg(id) {
    if (!this.bgCache[id]) {
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      BG[id](x);
      this.bgCache[id] = c;
    }
    return this.bgCache[id];
  }

  // ---------- Figuren ----------
  actor(id) { return this.actors[id]; }

  walkTo(x, y, id = 'kai') {
    const a = this.actors[id];
    const sc = this.scene();
    const wa = sc.walk;
    if (id === 'kai' && wa) {
      x = Math.max(wa[0], Math.min(wa[2], x));
      y = Math.max(wa[1], Math.min(wa[3], y));
    }
    return new Promise((res) => {
      if (Math.hypot(x - a.x, y - a.y) < 2) { a.walking = false; return res(); }
      a.target = { x, y, res };
      a.walking = true;
      a.dir = x >= a.x ? 1 : -1;
    });
  }

  face(dir, id = 'kai') { this.actors[id].dir = dir; }

  async say(id, text, opts = {}) {
    const a = this.actors[id] || { x: W / 2, y: 60, color: '#fff' };
    const col = opts.color || (id === '__narr' ? '#ffe89a' : a.color) || '#fff';
    return new Promise((res) => {
      const dur = opts.dur || Math.max(1500, 900 + text.length * 55);
      this.speech = { id, text, col, res, until: performance.now() + dur, start: performance.now() };
      a.talking = true;
      this.showSpeech();
    }).then(() => { a.talking = false; this.hideSpeech(); });
  }

  // Erzähltext (z.B. Zeitsprung)
  async narrate(text, dur) {
    return this.say('__narr', text, { color: '#ffe89a', dur: dur || Math.max(2200, 1200 + text.length * 50) });
  }

  showSpeech() {
    const el = $('speech');
    const sp = this.speech;
    el.textContent = sp.text;
    el.style.color = sp.col;
    el.classList.add('show');
    el.classList.toggle('narr', sp.id === '__narr');
    this.placeSpeech();
  }
  placeSpeech() {
    const sp = this.speech;
    if (!sp) return;
    const el = $('speech');
    const a = this.actors[sp.id];
    const { stageW, worldW } = this.view();
    const half = el.offsetWidth / 2;
    const clampX = (x) => Math.max(this.cam + half + 6, Math.min(this.cam + stageW - half - 6, x));
    if (!a || sp.id === '__narr') { el.style.left = clampX(this.cam + stageW / 2) + 'px'; el.style.top = '10%'; el.style.bottom = 'auto'; return; }
    const h = (CHARS[a.who]?.h || 40) + (a.h || 0);
    const top = Math.max(2, ((a.y - h - 4) / H) * 100);
    el.style.left = clampX((a.x / W) * worldW) + 'px';
    el.style.top = 'auto';
    el.style.bottom = (100 - top) + '%';
  }
  hideSpeech() { $('speech').classList.remove('show'); this.speech = null; }
  skipSpeech() { if (this.speech && performance.now() - this.speech.start > 250) { const r = this.speech.res; this.speech.until = 0; r(); } }

  wait(ms) { return sleep(ms); }

  // Dialogoptionen im Panel
  choose(options) {
    if (window.__autoChoose) return new Promise((r) => setTimeout(() => r(window.__autoChoose(options, this)), 30));
    return new Promise((res) => {
      const box = $('choices');
      box.innerHTML = '';
      options.forEach((o) => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.textContent = o.text;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          audio.blip();
          box.innerHTML = '';
          document.body.classList.remove('dialog');
          res(o.id);
        });
        box.appendChild(b);
      });
      document.body.classList.add('dialog');
    });
  }

  // Wrapper für Skripte: sperrt Eingabe
  async run(fn) {
    this.busy++;
    document.body.classList.add('busy');
    try { await fn(); } catch (e) { console.error(e); }
    this.busy--;
    if (!this.busy) { document.body.classList.remove('busy'); this.save(); }
  }

  // ---------- Interaktion ----------
  hotspots() {
    const sc = this.scene();
    return (sc.hotspots || []).filter((h) => !h.visible || h.visible(this.S)).map((h) => {
      if (h.actor) {
        const a = this.actors[h.actor];
        if (!a) return null;
        const hh = (CHARS[a.who]?.h || 40) + 2;
        return { ...h, rect: [a.x - 9, a.y - hh, 18, hh + 2] };
      }
      return h;
    }).filter(Boolean);
  }
  hit(x, y) {
    const hs = this.hotspots();
    for (let i = hs.length - 1; i >= 0; i--) {
      const [rx, ry, rw, rh] = hs[i].rect;
      if (x >= rx && x < rx + rw && y >= ry && y < ry + rh) return hs[i];
    }
    return null;
  }

  async interact(h, verb, item) {
    await this.run(async () => {
      if (h.at) {
        await this.walkTo(h.at[0], h.at[1]);
      } else if (!h.actor) {
        const cx = h.rect[0] + h.rect[2] / 2;
        await this.walkTo(cx, this.kai.y);
      }
      if (h.face) this.face(h.face);
      else { const cx = h.actor ? this.actors[h.actor].x : h.rect[0] + h.rect[2] / 2; if (Math.abs(cx - this.kai.x) > 3) this.face(cx > this.kai.x ? 1 : -1); }
      if (h.actor && this.actors[h.actor]) { const a = this.actors[h.actor]; if (!a.fixedDir) a.dir = this.kai.x > a.x ? 1 : -1; }

      let handler;
      if (verb === 'look') handler = h.look;
      else if (verb === 'use') handler = h.use;
      else if (verb === 'talk') handler = h.talk;
      else if (verb === 'item') handler = (h.items && h.items[item]) || h.anyItem;

      if (typeof handler === 'function') handler = handler(this, item);
      if (typeof handler === 'string') await this.say('kai', handler);
      else if (handler && typeof handler.then === 'function') await handler;
      else if (Array.isArray(handler)) for (const line of handler) await this.say(line[0], line[1]);
      else {
        const def = verb === 'look' ? `${h.name}. Sieht aus wie ${h.name}.` :
          verb === 'talk' ? `Ich rede nicht mit ${h.name}. So einsam bin ich noch nicht.` :
          verb === 'item' ? this.pick([`Ich wüsste nicht, wie ${ITEMS[item].name} und ${h.name} zusammenpassen sollen.`, 'Das bringt nichts.', 'Nein. Einfach nein.', `${ITEMS[item].name} mit ${h.name}? Das ergibt keinen Sinn. Nicht mal in der Quantenphysik.`]) :
          this.pick(['Das funktioniert so nicht.', 'Da tut sich nichts.', 'Lieber nicht.', 'Ich wüsste nicht, wie.']);
        await this.say('kai', def);
      }
      if (verb === 'item') this.select(null);
    });
  }

  pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  async combine(a, b) {
    await this.run(async () => {
      const r = this.story.combine(this, a, b);
      if (r && typeof r.then === 'function') await r;
      else if (typeof r === 'string') await this.say('kai', r);
      else await this.say('kai', this.pick(['Die beiden lassen sich nicht kombinieren.', 'Das passt nicht zusammen.', `${ITEMS[a].name} und ${ITEMS[b].name}? Nee.`]));
      this.select(null);
    });
  }

  // ---------- UI ----------
  select(id) {
    this.selected = id;
    this.renderInv();
    const st = $('status');
    if (id) st.innerHTML = `Benutze <b>${ITEMS[id].name}</b> mit …`;
    else st.textContent = '';
    const bu = $('btnUse');
    bu.classList.toggle('hidden', !(id && ITEMS[id].self));
    if (id && ITEMS[id].self) bu.textContent = '▶ ' + ITEMS[id].self;
    document.body.classList.toggle('itemsel', !!id);
  }

  icon(id) { return this.icons[id] || (this.icons[id] = itemIcon(id)); }

  renderInv(newId) {
    const box = $('inv');
    if (!this.S) return;
    box.innerHTML = '';
    for (const id of this.S.inv) {
      const b = document.createElement('button');
      b.className = 'item' + (this.selected === id ? ' sel' : '') + (newId === id ? ' new' : '');
      b.title = ITEMS[id].name;
      b.innerHTML = `<img src="${this.icon(id)}" alt=""><span>${ITEMS[id].name}</span>`;
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.unlock();
        if (this.busy) return;
        this.closeMenu();
        if (this.selected && this.selected !== id) { const a = this.selected; this.combine(a, id); return; }
        if (this.selected === id) { this.select(null); return; }
        this.select(id);
        audio.blip();
      });
      box.appendChild(b);
    }
    for (let i = this.S.inv.length; i < 8; i++) {
      const d = document.createElement('div');
      d.className = 'item empty';
      box.appendChild(d);
    }
  }

  openMenu(h, sx, sy) {
    const m = $('verbs');
    m.innerHTML = `<div class="vname">${h.name}</div>`;
    const add = (label, verb) => {
      const b = document.createElement('button');
      b.innerHTML = label;
      b.addEventListener('click', (e) => { e.stopPropagation(); audio.blip(); this.closeMenu(); this.interact(h, verb); });
      m.appendChild(b);
    };
    add('👁 Ansehen', 'look');
    if (h.use !== null && !h.actor) add('✋ ' + (h.useLabel || 'Benutzen'), 'use');
    if (h.talk) add('💬 Reden', 'talk');
    m.classList.add('show');
    const { stageW, worldW } = this.view();
    const half = m.offsetWidth / 2;
    m.style.left = Math.max(this.cam + half + 4, Math.min(this.cam + stageW - half - 4, (sx / W) * worldW)) + 'px';
    m.style.top = Math.max(6, Math.min(62, (sy / H) * 100)) + '%';
  }
  closeMenu() { $('verbs').classList.remove('show'); }

  bindInput() {
    const toScene = (e) => {
      const r = this.cv.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
    };
    $('stage').addEventListener('click', (e) => {
      audio.unlock();
      if (!this.started) return;
      if (this.speech) { this.skipSpeech(); return; }
      if (this.busy) return;
      if ($('verbs').classList.contains('show')) { this.closeMenu(); return; }
      const [x, y] = toScene(e);
      const h = this.hit(x, y);
      if (this.selected) {
        if (h && !h.exit) this.interact(h, 'item', this.selected);
        else this.select(null);
        return;
      }
      if (h && h.exit) {
        this.run(async () => {
          await this.walkTo(h.at ? h.at[0] : x, h.at ? h.at[1] : this.kai.y);
          const ok = h.canExit ? await h.canExit(this) : true;
          if (ok !== false) await this.goto(h.exit[0], h.exit[1]);
        });
        return;
      }
      if (h) { this.openMenu(h, x, y); return; }
      this.walkTo(x, y);
    });
    $('btnReveal').addEventListener('click', (e) => { e.stopPropagation(); audio.blip(); this.reveal = 2.5; });
    $('btnHint').addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.busy || !this.started) return;
      audio.blip();
      this.run(async () => { await this.say('__narr', '💡 ' + this.story.hint(this), { color: '#bff7a8' }); });
    });
    $('btnLook').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.selected || this.busy) return;
      const id = this.selected;
      this.select(null);
      this.run(async () => {
        const d = this.story.itemLook?.(this, id);
        if (d && typeof d.then === 'function') await d;
        else await this.say('kai', d || ITEMS[id].desc);
      });
    });
    $('btnCancel').addEventListener('click', (e) => { e.stopPropagation(); this.select(null); });
    $('btnUse').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this.selected || this.busy) return;
      const id = this.selected;
      this.select(null);
      audio.blip();
      this.run(async () => {
        const r = this.story.itemUse?.(this, id);
        if (r && typeof r.then === 'function') await r;
        else await this.say('kai', r || 'Damit kann ich allein nichts anfangen.');
      });
    });
  }

  view() {
    return { stageW: $('stage').clientWidth, worldW: $('world').clientWidth };
  }

  // Kamera folgt Kai (bzw. wer gerade spricht), wenn die Szene breiter als der Bildschirm ist
  updateCamera(dt, snap = false) {
    const { stageW, worldW } = this.view();
    document.documentElement.style.setProperty('--speechw', Math.round(stageW * 0.88) + 'px');
    if (worldW <= stageW + 1) { this.cam = 0; }
    else {
      let fx = this.kai ? this.kai.x : W / 2;
      const sp = this.speech && this.actors[this.speech.id];
      if (sp && sp.visible !== false) fx = (fx + sp.x) / 2;
      else if (sp) fx = (fx + sp.x) / 2;
      const target = Math.max(0, Math.min(worldW - stageW, (fx / W) * worldW - stageW / 2));
      this.cam = snap ? target : this.cam + (target - this.cam) * Math.min(1, dt * 4);
    }
    $('world').style.transform = `translateX(${-Math.round(this.cam)}px)`;
  }

  // ---------- Hauptschleife ----------
  update(dt) {
    this.updateCamera(dt, this.snapCam);
    this.snapCam = false;
    this.t += dt;
    if (this.reveal > 0) this.reveal -= dt;
    if (this.shakeT > 0) this.shakeT = Math.max(0, this.shakeT - dt);
    for (const a of Object.values(this.actors)) {
      if (a.target) {
        const dx = a.target.x - a.x, dy = a.target.y - a.y;
        const d = Math.hypot(dx, dy);
        const sp = (a.speed || 62) * dt;
        if (d <= sp) {
          a.x = a.target.x; a.y = a.target.y;
          const r = a.target.res; a.target = null; a.walking = false; r();
        } else {
          a.x += (dx / d) * sp; a.y += (dy / d) * sp * 0.8;
          a.dir = dx >= 0 ? 1 : -1;
          a.phase = (a.phase + dt * 2.2) % 1;
          if (a.id === 'kai' && Math.floor(a.phase * 2) !== Math.floor((a.phase - dt * 2.2) * 2) && Math.random() < 0.5) {}
        }
      }
      if (a.blinkT === undefined) a.blinkT = 2 + Math.random() * 3;
      a.blinkT -= dt;
      if (a.blinkT < -0.12) a.blinkT = 2 + Math.random() * 4;
    }
    if (this.kai) { this.S.kai.x = this.kai.x; this.S.kai.y = this.kai.y; this.S.kai.dir = this.kai.dir; }
    if (this.speech) {
      if (performance.now() > this.speech.until) { const r = this.speech.res; this.speech.until = Infinity; r(); }
      else if (Math.random() < dt * 14) {
        const a = this.actors[this.speech.id];
        if (a) audio.talk(a.pitch || 1);
      }
      this.placeSpeech();
    }
  }

  render() {
    const ctx = this.ctx;
    if (!this.S) return;
    const id = this.scene().art || this.S.scene;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (this.shakeT > 0) ctx.translate(Math.round((Math.random() - 0.5) * 6 * this.shakeT), Math.round((Math.random() - 0.5) * 4 * this.shakeT));
    ctx.drawImage(this.bg(id), 0, 0);
    FX[id]?.(ctx, this.t, this.S);
    const list = Object.values(this.actors).filter((a) => a.visible !== false).sort((a, b) => a.y - b.y);
    for (const a of list) {
      if (a.draw) { a.draw(ctx, this.t, a); continue; }
      ctx.save();
      if (a.alpha !== undefined) ctx.globalAlpha = typeof a.alpha === 'function' ? a.alpha(this.t) : a.alpha;
      const jx = a.glitch ? (Math.random() < 0.15 ? Math.round((Math.random() - 0.5) * 6) : 0) : 0;
      drawPerson(ctx, a.x + jx, a.y, { who: a.who, dir: a.dir, walking: a.walking, phase: a.phase, talking: a.talking, t: this.t, blink: a.blinkT < 0, pose: a.pose, noLegs: a.noLegs });
      if (a.carry) drawQBox(ctx, a.x + a.dir * 9, a.y - 16, this.t, false);
      if (a.after) a.after(ctx, this.t);
      ctx.restore();
    }
    FG[id]?.(ctx, this.t);
    ctx.restore();
    if (this.reveal > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, this.reveal);
      for (const h of this.hotspots()) {
        const [x, y, w, hh] = h.rect;
        const cx = x + w / 2, cy = y + hh / 2;
        ctx.fillStyle = h.exit ? '#7aff9a' : '#ffe070';
        ctx.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 3, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = 'bold 6px sans-serif';
        const tw = ctx.measureText(h.name).width;
        ctx.fillRect(cx - tw / 2 - 2, cy + 3, tw + 4, 8);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(h.name, cx, cy + 4);
      }
      ctx.restore();
    }
    if (this.fadeA > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fadeA})`; ctx.fillRect(0, 0, W, H); }
  }
}
