// Endgegner von URLICHT
import * as THREE from './three.module.min.js';
import * as M from './models.js';
import { audio } from './audio.js';
import { segDist2 } from './game.js';

const V = () => new THREE.Vector3();
const tmp = V();
const rand = (a, b) => a + Math.random() * (b - a);

class Boss {
  constructor(name, g) {
    this.name = name;
    this.root = new THREE.Group();
    this.root.position.set(0, g.ground ? g.env.groundY : 0, -280);
    this.baseY = this.root.position.y;
    this.parts = [];
    this.t = 0;
    this.targetZ = -78;
    this.dying = 0;
    this.defeated = false;
    this.dmgMul = 1;
  }
  part(obj, hp, r, o = {}) {
    (o.parent || this.root).add(obj);
    const p = { obj, hp, max: hp, r, alive: true, shielded: false, vital: false, hitT: 0, baseScale: obj.scale.x, ...o };
    this.parts.push(p);
    return p;
  }
  hitTest(pos, r) {
    for (const p of this.parts) {
      if (!p.alive || p.hittable === false) continue;
      p.obj.getWorldPosition(tmp);
      if (tmp.distanceToSquared(pos) < (p.r + r) ** 2) return p;
    }
    return null;
  }
  hitTestSeg(a, b, r) {
    for (const p of this.parts) {
      if (!p.alive || p.hittable === false) continue;
      p.obj.getWorldPosition(tmp);
      if (segDist2(a, b, tmp) < (p.r + r) ** 2) return p;
    }
    return null;
  }
  hit(p, n, g) {
    if (!p.alive || this.dying) return;
    if (p.shielded || this.entering) { audio.tink(); return; }
    p.hp -= n * this.dmgMul;
    p.hitT = 0.08;
    if (p.hp <= 0) {
      p.alive = false;
      p.obj.visible = false;
      g.explode(p.obj.getWorldPosition(V()), p.color || '#9fb0ff', p.vital ? 3 : 1.6);
      g.score += p.vital ? 300 : 50;
      g.hits += 1;
      p.onDestroy?.(g);
      this.onPartDestroyed?.(p, g);
      if (this.parts.filter((q) => q.vital).every((q) => !q.alive)) this.startDeath(g);
    } else audio.tink();
  }
  hpFrac() {
    let a = 0, b = 0;
    for (const p of this.parts) { b += p.max; a += Math.max(0, p.hp); }
    return b ? a / b : 0;
  }
  startDeath(g) {
    this.dying = 0.001;
    g.score += 1000;
    g.shakeT = 2.5;
    for (const b of g.bullets) b.life = 0;
  }
  update(dt, g) {
    this.t += dt;
    const r = this.root;
    this.entering = r.position.z < this.targetZ - 5;
    r.position.z += (this.targetZ - r.position.z) * Math.min(1, dt * 1.2);
    for (const p of this.parts) {
      if (p.hitT > 0) { p.hitT -= dt; p.obj.scale.setScalar(p.baseScale * 1.15); } else p.obj.scale.setScalar(p.baseScale);
    }
    if (this.dying) {
      this.dying += dt;
      if (Math.random() < dt * 10) g.explode(tmp.copy(r.position).add(V().set(rand(-10, 10), rand(-6, 8), rand(-4, 4))), Math.random() < 0.5 ? '#ffffff' : '#ffb060', rand(1, 2.5));
      r.rotation.z += dt * 0.5;
      if (this.dying > 3) { this.defeated = true; r.visible = false; g.explode(r.position, '#ffffff', 5); }
      return;
    }
    if (!this.entering && g.p.alive) this.behave(dt, g);
  }
  every(key, sec, fn) {
    this[key] = (this[key] ?? rand(0.5, sec)) - this.dt;
    if (this[key] <= 0) { this[key] = sec; fn(); }
  }
}

// Kristall-Material
const crystal = (c = '#e8f0ff', e = '#3040a0') => M.lambert(c, { emissive: e });

// ---------- 1: Splitterkönigin ----------
function queen(g) {
  const B = new Boss('SPLITTERKÖNIGIN', g);
  const core = new THREE.Group();
  core.add(new THREE.Mesh(new THREE.IcosahedronGeometry(5, 0), crystal()));
  core.add(M.glowSprite('#9fb0ff', 16, 0.7));
  const shield = M.makeWireShape(7.5); core.add(shield);
  const cp = B.part(core, 45, 5.5, { vital: true, shielded: true, color: '#b0c0ff' });
  const orbit = new THREE.Group(); B.root.add(orbit);
  const shards = [];
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Group();
    const geo = new THREE.OctahedronGeometry(2); geo.scale(0.8, 2, 0.8);
    s.add(new THREE.Mesh(geo, crystal('#d0e0ff', '#4050c0')));
    s.add(M.glowSprite('#b0c0ff', 5, 0.6));
    const a = (i / 4) * Math.PI * 2;
    s.position.set(Math.cos(a) * 10, Math.sin(a) * 10, 0);
    shards.push(B.part(s, 10, 2.8, { parent: orbit, color: '#b0c0ff' }));
  }
  B.onPartDestroyed = (p) => {
    if (shards.every((s) => !s.alive) && cp.shielded) { cp.shielded = false; shield.visible = false; g.ui.say?.('mira', 'Der Kern ist ungeschützt! Jetzt, Juno!'); }
  };
  B.behave = (dt, g) => {
    B.dt = dt;
    B.root.position.x = Math.sin(B.t * 0.5) * 7;
    B.root.position.y = B.baseY + Math.cos(B.t * 0.7) * 3;
    orbit.rotation.z += dt * (cp.shielded ? 0.8 : 0);
    core.rotation.y += dt * 0.6; core.rotation.x += dt * 0.3;
    for (const s of shards) if (s.alive) { s.fireT = (s.fireT ?? rand(0.5, 2.5)) - dt; if (s.fireT <= 0) { s.fireT = rand(1.6, 2.6); g.fireAimed(s.obj.getWorldPosition(V()), 34, 0.5); } }
    B.every('fan', cp.shielded ? 3.2 : 2.2, () => g.fireFan(core.getWorldPosition(V()), 5, 0.14, 32));
    if (!cp.shielded) B.every('ring', 2.6, () => g.fireRing(core.getWorldPosition(V()), 10, 26, '#9fb0ff', B.t));
  };
  return B;
}

// ---------- 2: Tiefenwächter ----------
function waechter(g) {
  const B = new Boss('TIEFENWÄCHTER', g);
  B.targetZ = -85;
  const body = new THREE.Mesh(new THREE.SphereGeometry(8, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.lambert('#7a90a8'));
  B.root.add(body);
  const band = new THREE.Mesh(new THREE.TorusGeometry(8.2, 0.6, 5, 16), M.lambert('#ffb347', { emissive: '#5a2a00' }));
  band.rotation.x = Math.PI / 2; band.position.y = 0.6; B.root.add(band);
  for (const [x, z] of [[-7, -5], [7, -5], [-7, 5], [7, 5]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.4, 5, 5), M.lambert('#5a6070')); l.position.set(x, -1, z); B.root.add(l); }
  const cannons = [];
  for (const s of [-1, 1]) {
    const c = new THREE.Group();
    c.add(new THREE.Mesh(new THREE.BoxGeometry(3, 3, 5), M.lambert('#5a6878')));
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 5, 6), M.lambert('#303848')); barrel.rotation.x = Math.PI / 2; barrel.position.z = -4; c.add(barrel);
    c.add(M.glowSprite('#ff9a5a', 3, 0.7));
    c.position.set(s * 9.5, 5, 0);
    cannons.push(B.part(c, 16, 3.2, { color: '#ffb060' }));
  }
  const eye = new THREE.Group();
  eye.add(new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 8), M.lambert('#ffffff', { emissive: '#406080' })));
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), M.basic('#ff3050')); pupil.position.z = -2; eye.add(pupil);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(2.9, 10, 8), M.lambert('#5a6878')); eye.add(lid);
  eye.position.set(0, 9, 0);
  const ep = B.part(eye, 40, 3, { vital: true, shielded: true, color: '#ff6080' });
  B.onPartDestroyed = () => {
    if (cannons.every((c) => !c.alive) && ep.shielded) { ep.shielded = false; lid.visible = false; g.ui.say?.('brakk', 'Das Auge ist offen. Ich hasse Augen. Schieß drauf!'); }
  };
  B.behave = (dt, g) => {
    B.dt = dt;
    B.root.position.x = Math.sin(B.t * 0.4) * 8;
    eye.lookAt(g.p.pos);
    for (const c of cannons) if (c.alive) { c.obj.lookAt(g.p.pos); c.fireT = (c.fireT ?? rand(0.5, 2)) - dt; if (c.fireT <= 0) { c.fireT = 2.2; for (let i = 0; i < 3; i++) setTimeout(() => c.alive && g.fireAimed(c.obj.getWorldPosition(V()), 40, 0.3, '#ffb060'), i * 150); } }
    B.every('mine', 5, () => g.spawnEnemy('mine', rand(-10, 10), g.env.groundY + rand(3, 10), B.root.position.z + 8, { vz: -g.speed + 25 }));
    if (!ep.shielded) B.every('ring', 2.4, () => g.fireRing(eye.getWorldPosition(V()), 12, 28, '#ff6080', B.t));
  };
  return B;
}

// ---------- 3: Nebelwurm ----------
function wurm(g) {
  const B = new Boss('NEBELWURM', g);
  B.targetZ = -70;
  const head = new THREE.Group();
  const hg = new THREE.ConeGeometry(3, 6, 6); hg.rotateX(-Math.PI / 2);
  head.add(new THREE.Mesh(hg, crystal('#ffd0f0', '#6a1a5a')));
  head.add(M.glowSprite('#ff9ad0', 10, 0.7));
  const hp = B.part(head, 55, 3.4, { vital: true, color: '#ff9ad0' });
  const segs = [];
  for (let i = 0; i < 9; i++) {
    const s = new THREE.Group();
    s.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.2 - i * 0.12, 0), crystal('#e0c0ff', '#40206a')));
    segs.push(B.part(s, 5, 2.3, { color: '#c0a0ff' }));
  }
  const trail = [];
  B.behave = (dt, g) => {
    B.dt = dt;
    const fast = hp.hp < hp.max * 0.5 ? 1.5 : 1;
    const t = B.t * fast;
    head.position.set(Math.sin(t * 0.8) * 12, Math.cos(t * 1.1) * 5 + (g.ground ? 8 : 0), Math.sin(t * 0.5) * 18);
    trail.unshift(head.position.clone());
    if (trail.length > 200) trail.pop();
    segs.forEach((s, i) => { const q = trail[Math.min(trail.length - 1, (i + 1) * 6)]; if (q) s.obj.position.copy(q); s.obj.rotation.y += dt * 2; });
    head.lookAt(tmp.copy(g.p.pos).sub(B.root.position));
    for (const s of segs) if (s.alive) { s.fireT = (s.fireT ?? rand(1, 6)) - dt; if (s.fireT <= 0) { s.fireT = rand(4, 7); g.fireAimed(s.obj.getWorldPosition(V()), 30, 1, '#c0a0ff'); } }
    B.every('fan', 2.4 / fast, () => g.fireFan(head.getWorldPosition(V()), 5, 0.16, 34, '#ff9ad0'));
    if (fast > 1) B.every('ring', 3, () => g.fireRing(head.getWorldPosition(V()), 12, 26, '#ff9ad0', B.t));
  };
  return B;
}

// ---------- 4: Der Chor ----------
function chor(g) {
  const B = new Boss('DER CHOR', g);
  const ring = new THREE.Group(); B.root.add(ring);
  const center = new THREE.Group();
  center.add(new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), M.basic('#ffffff')));
  center.add(M.glowSprite('#ffffff', 18, 0.8));
  const shell = M.makeWireShape(6); center.add(shell);
  const cp = B.part(center, 45, 4.5, { vital: true, shielded: true, color: '#ffffff' });
  const singers = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Group();
    const geo = new THREE.OctahedronGeometry(2.2); geo.scale(0.6, 1.8, 0.6);
    s.add(new THREE.Mesh(geo, crystal('#fff0c0', '#6a5010')));
    s.add(M.glowSprite('#ffe080', 5, 0.7));
    const a = (i / 6) * Math.PI * 2;
    s.position.set(Math.cos(a) * 12, Math.sin(a) * 12, 0);
    s.rotation.z = a;
    singers.push(B.part(s, 9, 2.6, { parent: ring, color: '#ffe080' }));
  }
  let sacrificed = false;
  B.onPartDestroyed = () => {
    const dead = singers.filter((s) => !s.alive).length;
    if (dead >= 2 && !sacrificed && g.wing.find((w) => w.id === 'brakk')?.alive) {
      sacrificed = true;
      g.ui.brakkSacrifice?.(() => {
        const target = singers.find((s) => s.alive);
        const w = g.wing.find((w) => w.id === 'brakk');
        if (w) { g.explode(w.obj.position, '#ffb060', 3); w.alive = false; }
        if (target) B.hit(target, 99, g);
      });
    }
    if (dead >= 4 && cp.shielded) { cp.shielded = false; shell.visible = false; g.ui.say?.('pip', 'Der Chor verstummt. Hörst du? Da ist noch eine Stimme. Unsere.'); }
  };
  B.behave = (dt, g) => {
    B.dt = dt;
    B.root.position.x = Math.sin(B.t * 0.35) * 5;
    B.root.position.y = Math.cos(B.t * 0.5) * 2;
    ring.rotation.z += dt * 0.5;
    B.every('song', 0.35, () => {
      const alive = singers.filter((s) => s.alive);
      if (!alive.length) return;
      const s = alive[Math.floor(B.t * 3) % alive.length];
      const from = s.obj.getWorldPosition(V());
      const d = from.clone().sub(B.root.position).normalize().multiplyScalar(0.35); d.z = 1;
      g.fireBullet(from, d.normalize(), 26, '#ffe080');
    });
    B.every('aim', 2.6, () => g.fireAimed(center.getWorldPosition(V()), 38, 0.5, '#ffffff'));
    if (!cp.shielded) B.every('ring', 2.2, () => g.fireRing(center.getWorldPosition(V()), 14, 26, '#ffffff', B.t));
  };
  return B;
}

// ---------- 5: Die Stille ----------
function stille(g) {
  const B = new Boss('DIE STILLE', g);
  B.targetZ = -90;
  const core = new THREE.Group();
  const cm = new THREE.Mesh(new THREE.IcosahedronGeometry(8, 0), M.lambert('#101018', { emissive: '#000000' }));
  core.add(cm);
  const edges = M.makeWireShape(8.2); edges.material = new THREE.LineBasicMaterial({ color: '#ffffff' }); core.add(edges);
  const cp = B.part(core, 80, 8.5, { vital: true, shielded: true, color: '#ffffff' });
  const pods = [];
  for (const [x, y] of [[-14, 6], [-14, -6], [14, 6], [14, -6]]) {
    const p = new THREE.Group();
    p.add(new THREE.Mesh(new THREE.OctahedronGeometry(3), M.lambert('#f4f4ff', { emissive: '#303050' })));
    p.add(M.glowSprite('#ffffff', 7, 0.6));
    p.position.set(x, y, 0);
    pods.push(B.part(p, 14, 3.4, { side: Math.sign(x), color: '#ffffff' }));
  }
  let broken = false, brakkBack = false;
  B.onPartDestroyed = (p) => {
    if (broken) return;
    const left = pods.filter((q) => q.side < 0 && q.alive).length, right = pods.filter((q) => q.side > 0 && q.alive).length;
    if (left === 0 || right === 0) {
      broken = true;
      cp.shielded = false;
      cm.material = M.lambert('#302040', { emissive: '#ff6aa0', emissiveIntensity: 0.4 });
      g.ui.symmetryBroken?.();
    }
  };
  B.behave = (dt, g) => {
    B.dt = dt;
    B.root.position.x = Math.sin(B.t * 0.25) * 4;
    B.root.position.y = Math.sin(B.t * 0.4) * 2;
    core.rotation.y += dt * 0.25; core.rotation.x += dt * 0.12;
    // Symmetrie heilt sich selbst: beschädigte Kapseln regenerieren
    if (!broken) for (const p of pods) if (p.alive) p.hp = Math.min(p.max, p.hp + dt * 1.2);
    // spiegelbildliche Schüsse
    B.every('mirror', 1.4, () => {
      const alive = pods.filter((p) => p.alive);
      for (const p of alive) g.fireAimed(p.obj.getWorldPosition(V()), 34, 0.2, '#ffffff');
    });
    if (broken) {
      B.every('ring', 1.8, () => g.fireRing(core.getWorldPosition(V()), 16, 26, '#ff9ad0', B.t * 2));
      B.every('fan', 2.6, () => g.fireFan(core.getWorldPosition(V()), 7, 0.12, 36, '#ffffff'));
      if (!brakkBack && cp.hp < cp.max * 0.5) { brakkBack = true; g.ui.brakkReturns?.(() => { B.dmgMul = 1.6; }); }
    } else B.every('ring', 3.2, () => g.fireRing(core.getWorldPosition(V()), 8, 22, '#ffffff', 0));
  };
  return B;
}

export function makeBoss(id, g) {
  return { queen, waechter, wurm, chor, stille }[id](g);
}
