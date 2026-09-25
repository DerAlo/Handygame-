import { COLORS, TileCache, flower, shade } from './tiles.js';
import { audio } from './audio.js';

export const N = 8;

// ---------- Teile ----------
const BASE = [
  // [Zellen, Gewicht]
  [[[0, 0]], 3],
  [[[0, 0], [0, 1]], 5],
  [[[0, 0], [0, 1], [0, 2]], 5],
  [[[0, 0], [0, 1], [0, 2], [0, 3]], 3],
  [[[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], 1.5],
  [[[0, 0], [0, 1], [1, 0], [1, 1]], 5],
  [[[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], 1.2],
  [[[0, 0], [1, 0], [1, 1]], 5],                        // kleines L
  [[[0, 0], [1, 0], [2, 0], [2, 1]], 3],                // L
  [[[0, 1], [1, 1], [2, 1], [2, 0]], 3],                // J
  [[[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], 1.5],      // großes L
  [[[0, 0], [0, 1], [0, 2], [1, 1]], 3],                // T
  [[[0, 1], [0, 2], [1, 0], [1, 1]], 2],                // S
  [[[0, 0], [0, 1], [1, 1], [1, 2]], 2],                // Z
  [[[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], 1.5], // 2x3
  [[[0, 0], [1, 1]], 1.2],                              // Diagonale
];

function normalize(cells) {
  const minR = Math.min(...cells.map((c) => c[0])), minC = Math.min(...cells.map((c) => c[1]));
  const out = cells.map(([r, c]) => [r - minR, c - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return out;
}
const rot = (cells) => normalize(cells.map(([r, c]) => [c, -r]));

export const SHAPES = [];
for (const [cells, w] of BASE) {
  const seen = new Set();
  let cur = normalize(cells);
  const variants = [];
  for (let i = 0; i < 4; i++) {
    const key = JSON.stringify(cur);
    if (!seen.has(key)) { seen.add(key); variants.push(cur); }
    cur = rot(cur);
  }
  for (const v of variants) {
    SHAPES.push({ cells: v, w: w / variants.length, h: Math.max(...v.map((c) => c[0])) + 1, wd: Math.max(...v.map((c) => c[1])) + 1 });
  }
}

const rand = (a, b) => a + Math.random() * (b - a);
const easeOutBack = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

export class Game {
  constructor(hooks = {}) {
    this.hooks = hooks;
    this.tiles = new TileCache();
    this.fx = [];      // Partikel
    this.dying = [];   // verschwindende Kacheln
    this.texts = [];
    this.time = 0;
    this.shake = 0;
    this.state = 'title';
    this.reset();
  }

  reset() {
    this.grid = Array.from({ length: N }, () => Array(N).fill(-1));
    this.pop = Array.from({ length: N }, () => Array(N).fill(0));
    this.score = 0;
    this.streak = 0;
    this.miss = 0;
    this.rescueUsed = false;
    this.tray = [null, null, null];
    this.trayAnim = [0, 0, 0];
    this.drag = null;
    this.returning = [];
    this.fx = []; this.dying = []; this.texts = [];
    this.linesTotal = 0;
    this.bloom = 0;
  }

  newGame() { this.reset(); this.state = 'play'; this.fillTray(); this.hooks.onScore?.(0); }

  serialize() {
    return { v: 1, grid: this.grid, score: this.score, streak: this.streak, miss: this.miss, rescueUsed: this.rescueUsed, tray: this.tray.map((p) => p && { s: SHAPES.indexOf(p.shape), c: p.color }), lines: this.linesTotal };
  }
  load(s) {
    this.reset();
    this.grid = s.grid;
    this.score = s.score | 0;
    this.streak = s.streak | 0;
    this.miss = s.miss | 0;
    this.rescueUsed = !!s.rescueUsed;
    this.linesTotal = s.lines | 0;
    this.tray = s.tray.map((p) => (p && SHAPES[p.s] ? { shape: SHAPES[p.s], color: p.c } : null));
    this.state = 'play';
    if (this.tray.every((p) => !p)) this.fillTray();
    this.hooks.onScore?.(this.score);
    this.checkOver();
  }

  // ---------- Regeln ----------
  fits(shape, r0, c0, grid = this.grid) {
    for (const [r, c] of shape.cells) {
      const rr = r0 + r, cc = c0 + c;
      if (rr < 0 || cc < 0 || rr >= N || cc >= N || grid[rr][cc] !== -1) return false;
    }
    return true;
  }
  fitsAnywhere(shape, grid = this.grid) {
    for (let r = 0; r <= N - shape.h; r++) for (let c = 0; c <= N - shape.wd; c++) if (this.fits(shape, r, c, grid)) return true;
    return false;
  }
  filled() { let n = 0; for (const row of this.grid) for (const v of row) if (v !== -1) n++; return n; }

  pickShape(fill) {
    // Je voller das Beet, desto eher kleine Teile – nie gemein, immer entspannt
    const small = fill > 0.45 ? 1 + (fill - 0.45) * 4 : 1;
    const ws = SHAPES.map((s) => s.w * (s.cells.length <= 3 ? small : 1));
    let x = Math.random() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < SHAPES.length; i++) if ((x -= ws[i]) <= 0) return SHAPES[i];
    return SHAPES[0];
  }

  fillTray(easy = false) {
    const fill = this.filled() / (N * N);
    let best = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      const set = [0, 1, 2].map(() => {
        let s = this.pickShape(easy ? 1 : fill);
        if (easy) while (s.cells.length > 4) s = this.pickShape(1);
        return s;
      });
      const nfit = set.filter((s) => this.fitsAnywhere(s)).length;
      if (!best || nfit > best.nfit) best = { set, nfit };
      if (nfit >= (easy ? 3 : 1)) break;
    }
    const used = new Set();
    this.tray = best.set.map((shape) => {
      let color;
      do { color = Math.floor(Math.random() * COLORS.length); } while (used.has(color) && used.size < COLORS.length);
      used.add(color);
      return { shape, color };
    });
    this.trayAnim = [0, 0.08, 0.16].map((d) => -d);
    audio.newTray();
  }

  // Welche Reihen/Spalten würden durch das Platzieren voll?
  wouldClear(shape, r0, c0) {
    const g = this.grid.map((row) => row.slice());
    for (const [r, c] of shape.cells) g[r0 + r][c0 + c] = 0;
    return this.fullLines(g);
  }
  fullLines(g = this.grid) {
    const rows = [], cols = [];
    for (let i = 0; i < N; i++) {
      if (g[i].every((v) => v !== -1)) rows.push(i);
      if (g.every((row) => row[i] !== -1)) cols.push(i);
    }
    return { rows, cols };
  }

  place(slot, r0, c0) {
    const p = this.tray[slot];
    for (const [r, c] of p.shape.cells) {
      this.grid[r0 + r][c0 + c] = p.color;
      this.pop[r0 + r][c0 + c] = 1;
    }
    this.tray[slot] = null;
    let pts = p.shape.cells.length;
    audio.place(p.shape.cells.length);
    this.hooks.onHaptic?.(8);

    const { rows, cols } = this.fullLines();
    const lines = rows.length + cols.length;
    if (lines) {
      this.streak++;
      this.miss = 0;
      this.linesTotal += lines;
      const cx = c0 + p.shape.wd / 2, cy = r0 + p.shape.h / 2;
      const cleared = new Map();
      for (const r of rows) for (let c = 0; c < N; c++) cleared.set(r * N + c, [r, c]);
      for (const c of cols) for (let r = 0; r < N; r++) cleared.set(r * N + c, [r, c]);
      for (const [r, c] of cleared.values()) {
        const d = Math.hypot(c + 0.5 - cx, r + 0.5 - cy);
        this.dying.push({ r, c, color: this.grid[r][c], t: -d * 0.035 });
        this.grid[r][c] = -1;
        this.pop[r][c] = 0;
      }
      const gain = 10 * ((lines * (lines + 1)) / 2) * this.streak;
      pts += gain;
      const allClear = this.filled() === 0;
      if (allClear) pts += 300;
      audio.clear(lines, this.streak);
      if (lines >= 3 || allClear) { audio.big(); this.shake = 8; }
      this.hooks.onHaptic?.(lines >= 2 ? [20, 30, 40] : 20);
      const tx = cx, ty = cy;
      this.texts.push({ x: tx, y: ty, text: `+${gain}`, t: 0, life: 1, size: 0.75 + lines * 0.12, c: '#fff' });
      const words = ['', '', 'Doppelt!', 'Dreifach!', 'Wahnsinn!', 'Unglaublich!', 'Gartenkönig!'];
      if (lines >= 2) this.texts.push({ x: tx, y: ty - 0.9, text: words[Math.min(lines, 6)], t: -0.1, life: 1.3, size: 0.8, c: '#ffe066' });
      this.texts = this.texts.filter((t) => !t.fixed);
      if (this.streak >= 2) this.texts.push({ x: N / 2, y: -0.2, text: `Serie x${this.streak}`, t: -0.15, life: 1.2, size: 0.62, c: '#b6ff8a', fixed: true });
      if (allClear) this.texts.push({ x: N / 2, y: N / 2, text: 'Beet leer! +300', t: -0.3, life: 1.8, size: 0.9, c: '#ff9ed0' });
    } else {
      this.miss++;
      if (this.miss >= 3) this.streak = 0;
    }
    this.score += pts;
    this.hooks.onScore?.(this.score);

    if (this.tray.every((t) => !t)) this.fillTray();
    this.checkOver();
  }

  checkOver() {
    const left = this.tray.filter(Boolean);
    if (left.length && !left.some((p) => this.fitsAnywhere(p.shape))) {
      this.state = 'overwait';
      setTimeout(() => {
        if (this.state !== 'overwait') return;
        this.state = 'over';
        audio.over();
        this.hooks.onOver?.(this.score);
      }, 900);
    }
  }

  // Belohnung: drei neue, garantiert passende Teile
  rescue() {
    this.rescueUsed = true;
    this.state = 'play';
    this.fillTray(true);
  }

  // ---------- Layout ----------
  layout(v) {
    const { cw, top, bottom } = v;
    const availH = bottom - top;
    const cell = Math.min((cw - 24) / (N + 0.7), availH / (N + 4.4), 62);
    const bs = cell * N;
    const bx = (cw - bs) / 2;
    const total = bs + cell * 3.9;
    const by = top + Math.max(4, (availH - total) / 2);
    const trayY = by + bs + cell * 2.1;
    const slotW = Math.min(cw / 3, cell * 3.2);
    const traySc = Math.min(0.56, (slotW - 12) / (5 * cell));
    const slots = [0, 1, 2].map((i) => ({ x: cw / 2 + (i - 1) * slotW, y: trayY }));
    this.L = { cell, bs, bx, by, slots, slotW, traySc, cw, ch: v.ch, dpr: v.dpr };
  }

  // ---------- Eingabe ----------
  pointerDown(x, y) {
    if (this.state !== 'play' || this.drag) return;
    const L = this.L;
    let slot = -1, bestD = Infinity;
    L.slots.forEach((s, i) => {
      if (!this.tray[i]) return;
      const d = Math.hypot(x - s.x, (y - s.y) * 1.2);
      if (Math.abs(x - s.x) < L.slotW / 2 + 4 && Math.abs(y - s.y) < L.cell * 2.2 && d < bestD) { bestD = d; slot = i; }
    });
    if (slot < 0) return;
    this.drag = { slot, x, y, sx: x, sy: y, lift: 0, touch: true };
    this.returning = this.returning.filter((r) => r.slot !== slot);
    audio.pick();
  }
  pointerMove(x, y) {
    if (!this.drag) return;
    this.drag.x = x; this.drag.y = y;
  }
  pointerUp() {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    const p = this.tray[d.slot];
    const tgt = this.dragTarget(d, p);
    if (tgt && this.state === 'play') {
      this.place(d.slot, tgt.r, tgt.c);
    } else {
      const pos = this.dragPos(d, p);
      this.returning.push({ slot: d.slot, x: pos.x, y: pos.y, t: 0, sc: 1 });
      if (Math.hypot(d.x - d.sx, d.y - d.sy) > 20) audio.bad();
    }
  }

  // Mittelpunkt des gezogenen Teils (über dem Finger, damit man es sieht)
  dragPos(d, p) {
    const L = this.L;
    const lift = Math.min(1, d.lift) * (p.shape.h * L.cell / 2 + L.cell * 1.1);
    return { x: d.x, y: d.y - lift };
  }
  dragTarget(d, p) {
    if (!p) return null;
    const L = this.L;
    const pos = this.dragPos(d, p);
    const c = Math.round((pos.x - L.bx) / L.cell - p.shape.wd / 2);
    const r = Math.round((pos.y - L.by) / L.cell - p.shape.h / 2);
    return this.fits(p.shape, r, c) ? { r, c } : null;
  }

  // ---------- Update ----------
  update(dt) {
    this.time += dt;
    for (let i = 0; i < 3; i++) if (this.trayAnim[i] < 1) this.trayAnim[i] = Math.min(1, this.trayAnim[i] + dt * 3.5);
    if (this.drag) this.drag.lift += dt * 8;
    for (const r of this.returning) r.t += dt * 5;
    this.returning = this.returning.filter((r) => r.t < 1);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (this.pop[r][c] > 0) this.pop[r][c] = Math.max(0, this.pop[r][c] - dt * 5);
    for (const d of this.dying) {
      const before = d.t;
      d.t += dt;
      if (before < 0 && d.t >= 0) this.burst(d.c + 0.5, d.r + 0.5, d.color);
    }
    this.dying = this.dying.filter((d) => d.t < 0.35);
    for (const p of this.fx) { p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; }
    this.fx = this.fx.filter((p) => p.t < p.life);
    for (const t of this.texts) { t.t += dt; if (t.t > 0) t.y -= dt * 0.8; }
    this.texts = this.texts.filter((t) => t.t < t.life);
    this.shake *= Math.pow(0.01, dt);
    const targetBloom = Math.min(12, Math.floor(this.score / 250));
    if (this.bloom < targetBloom) this.bloom = Math.min(targetBloom, this.bloom + dt * 1.5);
    else if (this.bloom > targetBloom) this.bloom = targetBloom;
  }

  burst(x, y, color) {
    const col = COLORS[color] || '#fff';
    for (let i = 0; i < 5; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(1.5, 4.5);
      this.fx.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, g: 9, t: 0, life: rand(0.6, 1.1), s: rand(0.12, 0.22), c: Math.random() < 0.3 ? '#fff' : col, rot: rand(0, 6), vr: rand(-8, 8), petal: true });
    }
  }

  // ---------- Zeichnen ----------
  render(ctx) {
    const L = this.L;
    const { cw, ch, dpr, cell, bx, by, bs } = L;
    this.tiles.ensure(cell * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawBackground(ctx, cw, ch);

    let sx = 0, sy = 0;
    if (this.shake > 0.2) { sx = rand(-1, 1) * this.shake; sy = rand(-1, 1) * this.shake; }
    ctx.save();
    ctx.translate(sx, sy);

    // Holzrahmen
    const pad = cell * 0.28;
    ctx.fillStyle = '#6d4430';
    ctx.beginPath(); ctx.roundRect(bx - pad, by - pad + 5, bs + pad * 2, bs + pad * 2, cell * 0.5); ctx.fill();
    const wg = ctx.createLinearGradient(0, by - pad, 0, by + bs + pad);
    wg.addColorStop(0, '#c38a5e'); wg.addColorStop(1, '#a86f47');
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.roundRect(bx - pad, by - pad, bs + pad * 2, bs + pad * 2, cell * 0.5); ctx.fill();
    ctx.fillStyle = '#5a3a28';
    ctx.beginPath(); ctx.roundRect(bx - 3, by - 3, bs + 6, bs + 6, cell * 0.3); ctx.fill();

    // Vorschau berechnen
    let ghost = null, clearSet = null;
    if (this.drag) {
      const p = this.tray[this.drag.slot];
      const tgt = this.dragTarget(this.drag, p);
      if (tgt) {
        ghost = { p, ...tgt };
        const { rows, cols } = this.wouldClear(p.shape, tgt.r, tgt.c);
        if (rows.length || cols.length) {
          clearSet = new Set();
          for (const r of rows) for (let c = 0; c < N; c++) clearSet.add(r * N + c);
          for (const c of cols) for (let r = 0; r < N; r++) clearSet.add(r * N + c);
        }
      }
    }

    // Felder
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const x = bx + c * cell, y = by + r * cell;
      ctx.drawImage(this.tiles.soil, x, y, cell, cell);
      const v = this.grid[r][c];
      if (v !== -1) {
        const pp = this.pop[r][c];
        const k = pp > 0 ? 1 + Math.sin(pp * Math.PI) * 0.15 : 1;
        this.drawTileAt(ctx, v, x + cell / 2, y + cell / 2, cell * k);
        if (clearSet?.has(r * N + c)) {
          ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.2 * Math.sin(this.time * 10)})`;
          ctx.beginPath(); ctx.roundRect(x + cell * 0.04, y + cell * 0.02, cell * 0.92, cell * 0.92, cell * 0.2); ctx.fill();
        }
      }
    }
    if (ghost) {
      ctx.globalAlpha = 0.45;
      for (const [r, c] of ghost.p.shape.cells) this.drawTileAt(ctx, ghost.p.color, bx + (ghost.c + c + 0.5) * cell, by + (ghost.r + r + 0.5) * cell, cell);
      ctx.globalAlpha = 1;
      if (clearSet) {
        ctx.fillStyle = `rgba(255,255,220,${0.22 + 0.12 * Math.sin(this.time * 10)})`;
        for (const key of clearSet) {
          const r = Math.floor(key / N), c = key % N;
          if (this.grid[r][c] === -1 && !ghost.p.shape.cells.some(([rr, cc]) => rr + ghost.r === r && cc + ghost.c === c)) {
            ctx.beginPath(); ctx.roundRect(bx + c * cell + cell * 0.05, by + r * cell + cell * 0.05, cell * 0.9, cell * 0.9, cell * 0.18); ctx.fill();
          }
        }
      }
    }

    // Verschwindende Kacheln
    for (const d of this.dying) {
      const f = Math.max(0, d.t) / 0.35;
      const x = bx + (d.c + 0.5) * cell, y = by + (d.r + 0.5) * cell;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(f * 1.2);
      ctx.globalAlpha = 1 - f;
      const k = d.t < 0 ? 1 : 1 + f * 0.3 - f * f * 1.2;
      ctx.drawImage(this.tiles.tiles[d.color], -cell * k / 2, -cell * k / 2, cell * k, cell * k);
      ctx.restore();
    }

    // Ablage
    const ty = L.slots[0].y, th = cell * 3.1, tw = Math.min(cw - 16, L.slotW * 3 + 8);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.roundRect(cw / 2 - tw / 2, ty - th / 2, tw, th, cell * 0.6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    L.slots.forEach((s, i) => {
      const p = this.tray[i];
      if (!p || this.drag?.slot === i) return;
      const ret = this.returning.find((r) => r.slot === i);
      let x = s.x, y = s.y, sc = L.traySc;
      if (ret) {
        const e = 1 - Math.pow(1 - ret.t, 3);
        x = ret.x + (s.x - ret.x) * e; y = ret.y + (s.y - ret.y) * e; sc = 1 + (L.traySc - 1) * e;
      } else {
        const a = this.trayAnim[i];
        if (a <= 0) return;
        sc *= easeOutBack(a);
      }
      const dim = this.state === 'play' || this.state === 'title' ? !this.fitsAnywhere(p.shape) : false;
      ctx.globalAlpha = dim ? 0.35 : 1;
      this.drawPiece(ctx, p, x, y, cell * sc);
      ctx.globalAlpha = 1;
    });

    // Gezogenes Teil
    if (this.drag) {
      const p = this.tray[this.drag.slot];
      const pos = this.dragPos(this.drag, p);
      const k = Math.min(1, this.drag.lift);
      const sc = L.traySc + (1 - L.traySc) * easeOutBack(k);
      ctx.save();
      ctx.shadowColor = 'rgba(40,20,10,0.35)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;
      this.drawPiece(ctx, p, pos.x, pos.y, cell * sc);
      ctx.restore();
    }

    // Partikel (Blütenblätter), in Feldkoordinaten
    for (const p of this.fx) {
      const f = 1 - p.t / p.life;
      ctx.globalAlpha = Math.min(1, f * 2);
      ctx.save();
      ctx.translate(bx + p.x * cell, by + p.y * cell);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.s * cell, p.s * cell * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // Texte
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      if (t.t < 0) continue;
      const f = t.t / t.life;
      const pop = f < 0.15 ? easeOutBack(f / 0.15) : 1;
      ctx.globalAlpha = f > 0.7 ? (1 - f) / 0.3 : 1;
      const size = t.size * cell * pop;
      ctx.font = `900 ${size}px ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif`;
      const w = ctx.measureText(t.text).width;
      let x = bx + t.x * cell;
      x = Math.max(w / 2 + 6, Math.min(cw - w / 2 - 6, x));
      const y = by + t.y * cell;
      ctx.lineWidth = Math.max(4, size * 0.18);
      ctx.strokeStyle = 'rgba(70,40,25,0.9)';
      ctx.lineJoin = 'round';
      ctx.strokeText(t.text, x, y);
      ctx.fillStyle = t.c;
      ctx.fillText(t.text, x, y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  drawTileAt(ctx, color, cx, cy, size) {
    ctx.drawImage(this.tiles.tiles[color], cx - size / 2, cy - size / 2, size, size);
  }

  drawPiece(ctx, p, cx, cy, size) {
    const { cells, wd, h } = p.shape;
    for (const [r, c] of cells) {
      this.drawTileAt(ctx, p.color, cx + (c - wd / 2 + 0.5) * size, cy + (r - h / 2 + 0.5) * size, size);
    }
  }

  drawBackground(ctx, cw, ch) {
    const g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, '#9fd8ff');
    g.addColorStop(0.6, '#d6f1ff');
    g.addColorStop(1, '#e9f8d9');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, cw, ch);
    // Wolken
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 4; i++) {
      const x = ((this.time * (6 + i * 3) + i * 260) % (cw + 200)) - 100;
      const y = 40 + i * 70 + (i % 2) * 30;
      for (const [dx, dy, r] of [[0, 0, 22], [22, -8, 26], [46, 0, 20], [24, 8, 20]]) {
        ctx.beginPath(); ctx.arc(x + dx, y + dy, r * 0.8, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Hügel
    ctx.fillStyle = '#b9e59a';
    ctx.beginPath();
    ctx.moveTo(0, ch);
    ctx.lineTo(0, ch * 0.78);
    ctx.quadraticCurveTo(cw * 0.3, ch * 0.7, cw * 0.6, ch * 0.8);
    ctx.quadraticCurveTo(cw * 0.85, ch * 0.86, cw, ch * 0.76);
    ctx.lineTo(cw, ch);
    ctx.fill();
    ctx.fillStyle = '#9fd67f';
    ctx.beginPath();
    ctx.moveTo(0, ch);
    ctx.lineTo(0, ch * 0.88);
    ctx.quadraticCurveTo(cw * 0.5, ch * 0.8, cw, ch * 0.9);
    ctx.lineTo(cw, ch);
    ctx.fill();
    // Blumen, die mit den Punkten der Runde erblühen
    const n = 12;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (cw / n) + Math.sin(i * 7.3) * 8;
      const base = ch - 6 - (i % 3) * 7;
      const grow = Math.max(0, Math.min(1, this.bloom - i));
      const stem = 14 + (i % 3) * 5;
      ctx.strokeStyle = '#5fae4a';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      const sway = Math.sin(this.time * 1.5 + i) * 2;
      ctx.beginPath(); ctx.moveTo(x, base); ctx.lineTo(x + sway, base - stem * (0.4 + 0.6 * grow)); ctx.stroke();
      if (grow > 0) {
        const col = COLORS[(i * 3) % COLORS.length];
        flower(ctx, x + sway, base - stem, 9 * easeOutBack(grow), col, '#fff3b0', 5, this.time * 0.3 + i);
      } else {
        ctx.fillStyle = '#7cc462';
        ctx.beginPath(); ctx.ellipse(x + sway, base - stem * 0.4, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

