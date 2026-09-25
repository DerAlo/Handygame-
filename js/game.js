import { LEVELS, MAX_LEVEL, SpriteCache, drawFace, rgba } from './sprites.js';
import { audio } from './audio.js';

// Spielwelt in "Einheiten": Glas ist W breit und H hoch, y wächst nach unten
export const W = 360;
export const H = 580;
export const DANGER_Y = 58;
export const SPAWN_Y = -52;
export const WORLD_TOP = SPAWN_Y - 44;
export const WALL = 12;

const GRAVITY = 1700;
const STEP = 1 / 120;
const ITER = 8;
const FRICTION = 0.12;
const DROP_COOLDOWN = 0.42;
const OVER_LIMIT = 3.0; // Sekunden über der Linie bis "Glas voll"
const DROP_WEIGHTS = [0.3, 0.26, 0.2, 0.15, 0.09];

let nextId = 1;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const easeOutBack = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const tri = (n) => (n * (n + 1)) / 2;

function pickLevel() {
  let x = Math.random();
  for (let i = 0; i < DROP_WEIGHTS.length; i++) { if ((x -= DROP_WEIGHTS[i]) <= 0) return i; }
  return 0;
}

class Blob {
  constructor(lv, x, y) {
    this.id = nextId++;
    this.lv = lv;
    this.x = this.px = x;
    this.y = this.py = y;
    this.vx = 0; this.vy = 0;
    this.r = this.r0 = LEVELS[lv].r;
    this.grow = 1;
    this.angle = rand(-0.4, 0.4);
    this.av = 0;
    this.age = 0;
    this.over = 0;
    this.dead = false;
    this.sqA = 0; this.sqT = 0; this.sqAng = 0;
    this.blinkT = rand(1, 5); this.blink = 0;
    this.happy = 0;
    this.calm = 0;
  }
}

export class Game {
  constructor(hooks = {}) {
    this.hooks = hooks; // onScore, onNext, onOver, onDiscover, onHaptic, onDanger
    this.sprites = new SpriteCache();
    this.blobs = [];
    this.particles = [];
    this.rings = [];
    this.texts = [];
    this.bgBubbles = Array.from({ length: 16 }, () => ({ x: Math.random(), y: Math.random(), r: rand(4, 18), s: rand(0.01, 0.04), w: rand(0, 6) }));
    this.discovered = new Set([0, 1, 2, 3, 4]);
    this.state = 'demo';
    this.time = 0;
    this.acc = 0;
    this.shake = 0;
    this.reset();
  }

  reset() {
    this.blobs = [];
    this.particles = [];
    this.rings = [];
    this.texts = [];
    this.score = 0;
    this.cur = pickLevel();
    this.next = pickLevel();
    this.cooldown = 0;
    this.aimX = W / 2;
    this.aiming = false;
    this.pendingDrop = false;
    this.combo = 0;
    this.comboT = 0;
    this.rescueUsed = false;
    this.danger = 0;
    this.demoT = 1;
    this.maxLevel = 0;
    this.drops = 0;
  }

  get silent() { return this.state === 'demo'; }

  // ---------- Spielablauf ----------
  startDemo() { this.reset(); this.state = 'demo'; }
  newGame() { this.reset(); this.state = 'play'; this.emitScore(); this.hooks.onNext?.(this.cur, this.next); }

  serialize() {
    return {
      v: 1,
      score: this.score, cur: this.cur, next: this.next, rescueUsed: this.rescueUsed, drops: this.drops,
      blobs: this.blobs.filter((b) => !b.dead).map((b) => [b.lv, Math.round(b.x * 10) / 10, Math.round(b.y * 10) / 10]),
    };
  }
  load(s) {
    this.reset();
    this.score = s.score | 0;
    this.cur = s.cur | 0;
    this.next = s.next | 0;
    this.rescueUsed = !!s.rescueUsed;
    this.drops = s.drops | 0;
    for (const [lv, x, y] of s.blobs) {
      const b = new Blob(lv, x, y);
      b.age = 5;
      this.blobs.push(b);
      this.maxLevel = Math.max(this.maxLevel, lv);
    }
    this.state = 'play';
    this.emitScore();
    this.hooks.onNext?.(this.cur, this.next);
  }

  emitScore() { this.hooks.onScore?.(this.score); }

  heldRadius() { return LEVELS[this.cur].r; }
  clampAim(x) { const r = this.heldRadius(); return clamp(x, r + 1, W - r - 1); }

  pointerDown(wx) {
    if (this.state !== 'play') return;
    this.aiming = true;
    this.aimX = this.clampAim(wx);
  }
  pointerMove(wx) {
    if (this.state !== 'play' || !this.aiming) return;
    this.aimX = this.clampAim(wx);
  }
  pointerUp() {
    if (this.state !== 'play' || !this.aiming) return;
    this.aiming = false;
    if (this.cooldown > 0) this.pendingDrop = true;
    else this.drop();
  }

  drop(x = this.aimX) {
    const lv = this.cur;
    const b = new Blob(lv, clamp(x, LEVELS[lv].r + 1, W - LEVELS[lv].r - 1), SPAWN_Y);
    b.vy = 60;
    this.blobs.push(b);
    this.cur = this.next;
    this.next = pickLevel();
    this.cooldown = DROP_COOLDOWN;
    this.pendingDrop = false;
    this.drops++;
    this.aimX = this.clampAim(this.aimX);
    if (!this.silent) {
      audio.drop(lv);
      this.hooks.onNext?.(this.cur, this.next);
    }
  }

  // "Glas retten": obere Blubbs platzen lassen, dann geht's weiter
  rescue() {
    const victims = this.blobs.filter((b) => b.y - b.r < 230).sort((a, b) => a.y - b.y);
    victims.forEach((b, i) => {
      b.dead = true;
      setTimeout(() => {
        this.burst(b.x, b.y, b.lv, 10 + b.lv * 2, 1);
        audio.pop();
      }, i * 70);
    });
    this.blobs = this.blobs.filter((b) => !b.dead);
    for (const b of this.blobs) b.over = 0;
    this.rescueUsed = true;
    this.cooldown = 0.6;
    this.state = 'play';
  }

  // ---------- Update ----------
  update(dt) {
    this.time += dt;
    const running = this.state === 'play' || this.state === 'demo';
    if (running) {
      this.acc += Math.min(dt, 0.1);
      let n = 0;
      while (this.acc >= STEP && n < 8) { this.physics(STEP); this.acc -= STEP; n++; }
      if (n === 8) this.acc = 0;

      if (this.cooldown > 0) {
        this.cooldown -= dt;
        if (this.cooldown <= 0 && this.pendingDrop) this.drop();
      }
      if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
      this.checkDanger(dt);
      if (this.state === 'demo') this.demoTick(dt);
    }
    this.updateBlobsCosmetic(dt);
    this.updateFx(dt);
  }

  demoTick(dt) {
    this.demoT -= dt;
    if (this.demoT <= 0) {
      this.demoT = rand(0.7, 1.4);
      this.aimX = this.clampAim(rand(40, W - 40));
      this.drop(this.aimX);
    }
    // Wird das Demo-Glas zu voll, alles zerplatzen lassen
    if (this.blobs.some((b) => b.over > 0.5)) {
      for (const b of this.blobs) this.burst(b.x, b.y, b.lv, 6, 1);
      this.blobs = [];
    }
  }

  checkDanger(dt) {
    let maxOver = 0;
    for (const b of this.blobs) {
      b.age += dt;
      if (b.age > 1.1 && b.y - b.r < DANGER_Y) b.over += dt;
      else b.over = Math.max(0, b.over - dt * 2);
      if (b.over > maxOver) maxOver = b.over;
    }
    const prev = this.danger;
    this.danger = maxOver;
    if (this.state === 'play') {
      if (maxOver > 0 && Math.floor(maxOver * 2) !== Math.floor(prev * 2)) audio.warn();
      if (maxOver >= OVER_LIMIT) this.gameOver();
    }
  }

  gameOver() {
    this.state = 'over';
    this.aiming = false;
    this.pendingDrop = false;
    audio.gameOver();
    this.hooks.onHaptic?.([60, 60, 120]);
    this.hooks.onOver?.(this.score);
  }

  physics(dt) {
    const B = this.blobs;
    for (const b of B) {
      if (b.grow < 1) {
        b.grow = Math.min(1, b.grow + dt / 0.2);
        b.r = b.r0 + (LEVELS[b.lv].r - b.r0) * easeOutBack(b.grow);
      }
      b.ovx = b.vx; b.ovy = b.vy;
      b.vy += GRAVITY * dt;
      b.px = b.x; b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.touch = false;
      b.floor = false;
    }

    const merges = [];
    const contacts = [];
    const n = B.length;
    for (let it = 0; it < ITER; it++) {
      const last = it === ITER - 1;
      for (let i = 0; i < n; i++) {
        const a = B[i];
        if (a.dead) continue;
        for (let j = i + 1; j < n; j++) {
          const c = B[j];
          if (c.dead) continue;
          const dx = c.x - a.x, rr = a.r + c.r;
          if (dx > rr || dx < -rr) continue;
          const dy = c.y - a.y;
          if (dy > rr || dy < -rr) continue;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          if (a.lv === c.lv) { a.dead = c.dead = true; merges.push([a, c]); continue; }
          const d = Math.sqrt(d2) || 1e-4;
          const nx = dx / d, ny = dy / d;
          const wa = 1 / (a.r * a.r), wc = 1 / (c.r * c.r);
          const k = (rr - d) / (wa + wc);
          a.x -= nx * k * wa; a.y -= ny * k * wa;
          c.x += nx * k * wc; c.y += ny * k * wc;
          a.touch = c.touch = true;
          if (last) contacts.push(a, c, nx, ny);
        }
      }
      for (const b of B) {
        if (b.x < b.r) { b.x = b.r; b.touch = true; }
        else if (b.x > W - b.r) { b.x = W - b.r; b.touch = true; }
        if (b.y > H - b.r) { b.y = H - b.r; b.touch = b.floor = true; }
      }
    }

    const MAXV = 1400;
    for (const b of B) {
      b.vx = (b.x - b.px) / dt;
      b.vy = (b.y - b.py) / dt;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > MAXV) { b.vx *= MAXV / sp; b.vy *= MAXV / sp; }
      if (b.floor) b.vx *= 0.985;
    }

    // Reibung zwischen Blubbs, damit Stapel nicht zerfließen
    for (let i = 0; i < contacts.length; i += 4) {
      const a = contacts[i], c = contacts[i + 1], nx = contacts[i + 2], ny = contacts[i + 3];
      const tx = -ny, ty = nx;
      const vt = (c.vx - a.vx) * tx + (c.vy - a.vy) * ty;
      const wa = 1 / (a.r * a.r), wc = 1 / (c.r * c.r);
      const jt = (vt * FRICTION) / (wa + wc);
      a.vx += tx * jt * wa; a.vy += ty * jt * wa;
      c.vx -= tx * jt * wc; c.vy -= ty * jt * wc;
    }

    for (const b of B) {
      // Rollen
      if (b.touch) b.av += (b.vx / b.r - b.av) * 0.2;
      else b.av *= 0.998;
      b.angle += b.av * dt;
      // Aufprall -> Quetschen
      const ix = b.vx - b.ovx, iy = b.vy - b.ovy - GRAVITY * dt;
      const imp = Math.hypot(ix, iy);
      if (imp > 200 && !b.dead) {
        const amp = Math.min(0.2, imp / 3000);
        if (amp > b.sqA * Math.exp(-b.sqT * 5)) {
          b.sqA = amp; b.sqT = 0; b.sqAng = Math.atan2(iy, ix);
          b.calm = 0;
          if (imp > 500 && !this.silent) audio.thud(b.lv);
        }
      }
    }

    if (merges.length) this.doMerges(merges);
    if (B.some((b) => b.dead)) this.blobs = B.filter((b) => !b.dead);
  }

  doMerges(merges) {
    for (const [a, c] of merges) {
      const x = (a.x + c.x) / 2, y = (a.y + c.y) / 2;
      const lv = a.lv;
      this.combo = this.comboT > 0 ? this.combo + 1 : 1;
      this.comboT = 0.9;
      const combo = this.combo;
      let pts;
      if (lv === MAX_LEVEL) {
        // Zwei Könige: Beide verschwinden mit Riesenbonus
        pts = 200 * combo;
        this.burst(x, y, lv, 80, 2.2);
        this.confetti(x, y);
        this.shake = 14;
        if (!this.silent) { audio.king(); this.hooks.onHaptic?.([80, 40, 80, 40, 160]); }
      } else {
        const nb = new Blob(lv + 1, x, y);
        nb.r0 = a.r;
        nb.r = a.r;
        nb.grow = 0;
        nb.vx = (a.vx + c.vx) / 2;
        nb.vy = Math.min(a.vy, c.vy) * 0.5;
        nb.angle = (a.angle + c.angle) / 2;
        nb.age = Math.max(a.age, c.age);
        nb.happy = 1.2;
        this.blobs.push(nb);
        pts = tri(lv + 1) * combo;
        this.burst(x, y, lv + 1, 10 + lv * 3, 1 + lv * 0.08);
        this.rings.push({ x, y, r: a.r, max: LEVELS[lv + 1].r * 1.9, t: 0, c: LEVELS[lv + 1].c });
        if (lv + 1 >= 6) this.shake = Math.max(this.shake, (lv - 4) * 1.6);
        this.maxLevel = Math.max(this.maxLevel, lv + 1);
        if (!this.silent) {
          audio.merge(lv + 1, combo);
          this.hooks.onHaptic?.(lv + 1 >= 6 ? 30 : 12);
          if (!this.discovered.has(lv + 1)) {
            this.discovered.add(lv + 1);
            audio.discover();
            this.hooks.onDiscover?.(lv + 1);
          }
        }
      }
      if (this.silent) continue;
      this.score += pts;
      this.texts.push({ x, y: y - 10, text: `+${pts}`, t: 0, life: 0.9, size: 16 + Math.min(lv, 8) * 1.5, c: '#fff' });
      if (combo >= 2) {
        this.texts.push({ x, y: y - 36, text: `Kombo x${combo}!`, t: 0, life: 1.2, size: 18 + combo * 2, c: '#ffe066' });
        audio.combo(combo);
      }
      this.emitScore();
    }
  }

  // ---------- Effekte ----------
  burst(x, y, lv, count, power) {
    const col = LEVELS[lv].c;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(80, 320) * power;
      this.particles.push({
        x: x + Math.cos(a) * LEVELS[lv].r * 0.5, y: y + Math.sin(a) * LEVELS[lv].r * 0.5,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120,
        r: rand(2, 4.5) + lv * 0.35, t: 0, life: rand(0.45, 0.9),
        c: Math.random() < 0.25 ? '#ffffff' : col, g: 900,
      });
    }
  }
  confetti(x, y) {
    const cols = ['#ff7b7b', '#ffe066', '#5ee0c0', '#7fd3ff', '#c79bff', '#ff8fc8'];
    for (let i = 0; i < 90; i++) {
      const a = rand(-Math.PI, 0);
      const sp = rand(200, 700);
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rand(3, 6), t: 0, life: rand(1.2, 2.2), c: cols[i % cols.length], g: 600, rect: true, rot: rand(0, 6) });
    }
  }

  updateBlobsCosmetic(dt) {
    for (const b of this.blobs) {
      b.sqT += dt;
      if (b.happy > 0) b.happy -= dt;
      b.blinkT -= dt;
      if (b.blinkT <= 0) { b.blink = 0.15; b.blinkT = rand(2, 6); }
      if (b.blink > 0) b.blink -= dt;
      if (Math.abs(b.vx) + Math.abs(b.vy) < 12) b.calm += dt; else b.calm = 0;
    }
  }

  updateFx(dt) {
    for (const p of this.particles) {
      p.t += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.99;
      if (p.rot !== undefined) p.rot += dt * 8;
    }
    this.particles = this.particles.filter((p) => p.t < p.life);
    for (const r of this.rings) r.t += dt;
    this.rings = this.rings.filter((r) => r.t < 0.4);
    for (const t of this.texts) { t.t += dt; t.y -= 40 * dt; }
    this.texts = this.texts.filter((t) => t.t < t.life);
    this.shake *= Math.pow(0.02, dt);
    if (this.shake < 0.1) this.shake = 0;
  }

  // Wo würde der gehaltene Blubb landen? (für die Ziellinie)
  landingY(x, r) {
    let y = H - r;
    for (const b of this.blobs) {
      const dx = Math.abs(b.x - x), rr = b.r + r;
      if (dx < rr) {
        const yy = b.y - Math.sqrt(rr * rr - dx * dx);
        if (yy < y) y = yy;
      }
    }
    return Math.max(y, SPAWN_Y);
  }

  // ---------- Zeichnen ----------
  render(ctx, view) {
    const { cw, ch, dpr, s, ox, oy } = view;
    this.sprites.ensure(s * dpr);

    // Hintergrund (Bildschirmkoordinaten)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = ctx.createLinearGradient(0, 0, 0, ch);
    bg.addColorStop(0, '#ffd9ec');
    bg.addColorStop(0.55, '#e4dcff');
    bg.addColorStop(1, '#c9ecff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (const bb of this.bgBubbles) {
      bb.y -= bb.s * 0.016;
      if (bb.y < -0.05) { bb.y = 1.05; bb.x = Math.random(); }
      const x = (bb.x + Math.sin(this.time * 0.5 + bb.w) * 0.02) * cw;
      ctx.beginPath();
      ctx.arc(x, bb.y * ch, bb.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Welt
    let sx = 0, sy = 0;
    if (this.shake > 0) { sx = rand(-1, 1) * this.shake; sy = rand(-1, 1) * this.shake; }
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (ox + sx * s), dpr * (oy + sy * s));

    this.drawJarBack(ctx);
    this.drawDangerLine(ctx);

    const look = this.lookTarget();
    // Accessoires (Antennen, Krone …) nicht durch die Glaswand ragen lassen
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, -1000, W, H + 1000);
    ctx.clip();
    for (const b of this.blobs) this.drawBlob(ctx, b, look);
    ctx.restore();

    if (this.state === 'play') this.drawHeld(ctx);
    else if (this.state === 'demo' && this.cooldown < 0.3) this.drawHeld(ctx, true);

    this.drawJarFront(ctx);
    this.drawFx(ctx);
  }

  lookTarget() {
    if (this.state === 'play') return { x: this.aimX, y: SPAWN_Y };
    return null;
  }

  jarPath(ctx, grow = 0) {
    const x0 = -grow, x1 = W + grow, y0 = -6, y1 = H + grow, rad = 16 + grow;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1 - rad);
    ctx.quadraticCurveTo(x0, y1, x0 + rad, y1);
    ctx.lineTo(x1 - rad, y1);
    ctx.quadraticCurveTo(x1, y1, x1, y1 - rad);
    ctx.lineTo(x1, y0);
  }

  drawJarBack(ctx) {
    this.jarPath(ctx, 2);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0.55)');
    ctx.fillStyle = g;
    ctx.fill();
  }

  drawJarFront(ctx) {
    // Glaswand
    ctx.lineJoin = ctx.lineCap = 'round';
    this.jarPath(ctx, WALL / 2 + 2);
    ctx.strokeStyle = 'rgba(120,90,170,0.35)';
    ctx.lineWidth = WALL + 4;
    ctx.stroke();
    this.jarPath(ctx, WALL / 2 + 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = WALL - 2;
    ctx.stroke();
    // Glasrand oben
    for (const x of [-WALL / 2 - 2, W + WALL / 2 + 2]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(x, -8, WALL * 0.75, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,170,0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // Spiegelungen
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.roundRect(10, 30, 14, H - 80, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(30, 50, 5, H - 160, 3);
    ctx.fill();
  }

  drawDangerLine(ctx) {
    const d = this.danger;
    const pulse = d > 0 ? 0.5 + 0.5 * Math.sin(this.time * (8 + d * 6)) : 0;
    ctx.save();
    ctx.setLineDash([10, 9]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = d > 0 ? `rgba(255,70,110,${0.5 + pulse * 0.5})` : 'rgba(170,120,200,0.35)';
    ctx.beginPath();
    ctx.moveTo(4, DANGER_Y);
    ctx.lineTo(W - 4, DANGER_Y);
    ctx.stroke();
    ctx.restore();
    if (d > 0) {
      ctx.fillStyle = `rgba(255,70,110,${0.08 + pulse * 0.1})`;
      ctx.fillRect(0, 0, W, DANGER_Y);
      // Countdown-Balken
      const f = Math.min(1, d / OVER_LIMIT);
      ctx.fillStyle = 'rgba(255,70,110,0.85)';
      ctx.beginPath();
      ctx.roundRect(W / 2 - 60, DANGER_Y + 8, 120 * (1 - f), 6, 3);
      ctx.fill();
    }
  }

  drawBlob(ctx, b, look, alpha = 1, forceMood) {
    const L = LEVELS[b.lv];
    const sp = this.sprites.list[b.lv];
    ctx.save();
    ctx.translate(b.x, b.y);
    if (alpha < 1) ctx.globalAlpha = alpha;
    const sq = b.sqA * Math.exp(-b.sqT * 5) * Math.cos(b.sqT * 26);
    if (Math.abs(sq) > 0.003) {
      ctx.rotate(b.sqAng);
      ctx.scale(1 - sq, 1 + sq * 0.8);
      ctx.rotate(-b.sqAng);
    }
    ctx.rotate(b.angle);
    const k = b.r / L.r;
    ctx.scale(k, k);
    ctx.drawImage(sp.canvas, -sp.half, -sp.half, sp.half * 2, sp.half * 2);

    let mood = forceMood || 'normal';
    if (!forceMood) {
      if (b.happy > 0) mood = 'happy';
      else if (b.over > 0) mood = 'worried';
      else if (sq > 0.08) mood = 'squish';
      else if (b.calm > 14) mood = 'sleep';
    }
    let lx = 0, ly = 0.3;
    if (look) {
      const dx = look.x - b.x, dy = look.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      const c = Math.cos(-b.angle), s = Math.sin(-b.angle);
      lx = (dx * c - dy * s) / d;
      ly = (dx * s + dy * c) / d;
    }
    drawFace(ctx, L.r, mood, b.blink > 0 ? 1 : 0, lx, ly);
    if (mood === 'sleep') {
      ctx.rotate(-b.angle);
      ctx.fillStyle = 'rgba(80,60,120,0.6)';
      ctx.font = `bold ${Math.max(8, L.r * 0.35)}px system-ui`;
      const zz = (this.time * 0.6 + b.id * 0.37) % 1;
      ctx.globalAlpha *= 1 - zz;
      ctx.fillText('z', L.r * 0.5 + zz * L.r * 0.3, -L.r * 0.6 - zz * L.r * 0.5);
    }
    ctx.restore();
  }

  drawHeld(ctx, demo = false) {
    const lv = this.cur;
    const r = LEVELS[lv].r;
    const x = this.aimX;
    const appear = this.cooldown > 0 ? 1 - this.cooldown / DROP_COOLDOWN : 1;
    if (appear <= 0) return;
    if (!demo) {
      // Ziellinie
      const ly = this.landingY(x, r);
      ctx.save();
      ctx.setLineDash([2, 10]);
      ctx.lineCap = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.moveTo(x, SPAWN_Y + r);
      ctx.lineTo(x, ly);
      ctx.stroke();
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = rgba(LEVELS[lv].c, 0.9);
      ctx.beginPath();
      ctx.arc(x, ly, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    const fake = { x, y: SPAWN_Y + Math.sin(this.time * 3) * 2, lv, r: r * easeOutBack(Math.min(1, appear)), angle: Math.sin(this.time * 2) * 0.12, sqA: 0, sqT: 0, blink: 0, id: 0 };
    this.drawBlob(ctx, fake, null, 1, this.aiming ? 'happy' : 'normal');
  }

  drawFx(ctx) {
    for (const r of this.rings) {
      const f = r.t / 0.4;
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - f)})`;
      ctx.lineWidth = 6 * (1 - f) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r + (r.max - r.r) * f, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const p of this.particles) {
      const f = 1 - p.t / p.life;
      ctx.globalAlpha = Math.min(1, f * 1.5);
      ctx.fillStyle = p.c;
      if (p.rect) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.4 + 0.6 * f), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      const f = t.t / t.life;
      const pop = f < 0.15 ? easeOutBack(f / 0.15) : 1;
      const half = t.text.length * t.size * 0.3;
      const tx = clamp(t.x, half + 4, W - half - 4);
      ctx.globalAlpha = f > 0.7 ? (1 - f) / 0.3 : 1;
      ctx.font = `900 ${t.size * pop}px ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif`;
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(70,40,110,0.85)';
      ctx.strokeText(t.text, tx, t.y);
      ctx.fillStyle = t.c;
      ctx.fillText(t.text, tx, t.y);
    }
    ctx.globalAlpha = 1;
  }
}

