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
    this.S = 1.4;
    this.root.scale.setScalar(this.S);
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
      if (tmp.distanceToSquared(pos) < (p.r * this.S + r) ** 2) return p;
    }
    return null;
  }
  hitTestSeg(a, b, r) {
    for (const p of this.parts) {
      if (!p.alive || p.hittable === false) continue;
      p.obj.getWorldPosition(tmp);
      if (segDist2(a, b, tmp) < (p.r * this.S + r) ** 2) return p;
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

// ---------- Bauteile ----------
const crystal = (c = '#d8e4ff', e = '#4050c0') => M.std(c, { metalness: 0.25, roughness: 0.06, emissive: e, emissiveIntensity: 0.45, flatShading: true });
const EYE = '#ff3b5c';
const _up = new THREE.Vector3(0, 1, 0);
// Stachel (Kegel) von a nach b
function spike(a, b, r, mat, segs = 6) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, A.distanceTo(B), segs), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, B.clone().sub(A).normalize());
  return m;
}
const ball = (r, mat, x = 0, y = 0, z = 0, seg = 14) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.ceil(seg * 0.7)), mat); m.position.set(x, y, z); return m; };
const glowAt = (c, size, x, y, z, o = 0.8) => { const s = M.glowSprite(c, size, o); s.position.set(x, y, z); return s; };

// ---------- 1: Splitterkönigin – Mutterschiff der Echos ----------
function queen(g) {
  const B = new Boss('SPLITTERKÖNIGIN', g);
  const core = new THREE.Group();
  core.add(new THREE.Mesh(M.lathe([[0, -5.5], [2.2, -5], [3.4, -3], [3.8, 0], [3.2, 2.8], [1.8, 4.6], [0.6, 5.3], [0, 5.4]], 10, 1.4, 0.6), M.MAT.echoPlate()));
  core.add(new THREE.Mesh(M.lathe([[0, -3], [1.6, -2.4], [1.8, 1], [1, 2.6], [0, 3]], 12, 1, 0.7).translate(0, 1.6, -0.5), M.MAT.echo()));
  // Kristallkrone
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    core.add(spike([Math.cos(a) * 4.2, Math.sin(a) * 2.2, -1.5], [Math.cos(a) * 8.5, Math.sin(a) * 4.8, -6.5], 0.7, crystal()));
  }
  for (const s of [-1, 1]) {
    core.add(M.bar([s * 1.5, -0.2, 4.6], [s * 4.9, -0.2, 0.5], 0.09, M.basic('#a58bff'), 4));
    const e = new THREE.Mesh(new THREE.CircleGeometry(0.9, 14), M.basic('#a58bff')); e.position.set(s * 2.4, 0, -5.2); e.rotation.y = Math.PI; core.add(e);
    core.add(glowAt('#a58bff', 4.5, s * 2.4, 0, -5.8));
  }
  core.add(ball(1.3, M.basic(EYE), 0, 0.2, 5.0));
  core.add(glowAt(EYE, 7, 0, 0.2, 5.6, 0.9));
  const shield = M.makeShield(8.8, '#9fb0ff'); core.add(shield);
  const cp = B.part(core, 45, 5.5, { vital: true, shielded: true, color: '#b0c0ff' });
  const orbit = new THREE.Group(); B.root.add(orbit);
  const shards = [];
  for (let i = 0; i < 4; i++) {
    const s = M.makeDrone(); s.scale.setScalar(1.5);
    const a = (i / 4) * Math.PI * 2;
    s.position.set(Math.cos(a) * 9.5, Math.sin(a) * 9.5, 2);
    shards.push(B.part(s, 10, 2.8, { parent: orbit, color: '#b0c0ff' }));
  }
  B.onPartDestroyed = () => {
    if (shards.every((s) => !s.alive) && cp.shielded) { cp.shielded = false; shield.visible = false; g.ui.say?.('mira', 'Der Kern ist ungeschützt! Jetzt, Juno!'); }
  };
  B.behave = (dt, g) => {
    B.dt = dt;
    B.root.position.x = Math.sin(B.t * 0.5) * 7;
    B.root.position.y = B.baseY + Math.cos(B.t * 0.7) * 3;
    orbit.rotation.z += dt * (cp.shielded ? 0.7 : 0);
    core.rotation.z = Math.sin(B.t * 0.5) * 0.25;
    core.rotation.y = Math.sin(B.t * 0.35) * 0.2;
    for (const s of shards) if (s.alive) { s.fireT = (s.fireT ?? rand(0.5, 3)) - dt; if (s.fireT <= 0) { s.fireT = rand(2.4, 3.6); g.fireAimed(s.obj.getWorldPosition(V()), 32, 0.5); } }
    B.every('fan', cp.shielded ? 3.8 : 2.8, () => g.fireFan(core.getWorldPosition(V()), 4, 0.16, 30));
    if (!cp.shielded) B.every('ring', 3.2, () => g.fireRing(core.getWorldPosition(V()), 8, 24, '#9fb0ff', B.t));
  };
  return B;
}

// ---------- 2: Tiefenwächter – Festungs-Läufer ----------
function waechter(g) {
  const B = new Boss('TIEFENWÄCHTER', g);
  B.targetZ = -85;
  const body = new THREE.Group(); body.position.y = 3; B.root.add(body);
  body.add(new THREE.Mesh(new THREE.SphereGeometry(8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.MAT.echoPlate()));
  body.add(new THREE.Mesh(new THREE.CylinderGeometry(8, 7, 2.4, 16).translate(0, -1.2, 0), M.MAT.echo()));
  const band = new THREE.Mesh(new THREE.TorusGeometry(8.1, 0.45, 6, 32), M.MAT.paint('#ffb347'));
  band.rotation.x = Math.PI / 2; band.position.y = 0.2; body.add(band);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; body.add(M.bar([Math.cos(a) * 8.1, 0.4, Math.sin(a) * 8.1], [Math.cos(a) * 1.5, 7.9, Math.sin(a) * 1.5], 0.18, M.MAT.metal(), 5)); }
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; body.add(ball(0.3, M.basic(EYE), Math.cos(a) * 7.2, -1.2, Math.sin(a) * 7.2, 8)); }
  // Beine
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const hip = [x * 6, 1, z * 5], knee = [x * 10.5, 5, z * 8], foot = [x * 11.5, -2.5, z * 9];
    body.add(M.bar(hip, knee, 0.7, M.MAT.dark(), 8));
    body.add(M.bar(knee, foot, 0.55, M.MAT.metal(), 8));
    body.add(ball(1.1, M.MAT.echo(), ...knee));
    const f = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 0.8, 8), M.MAT.dark()); f.position.set(...foot); body.add(f);
  }
  const cannons = [];
  for (const s of [-1, 1]) {
    const c = new THREE.Group();
    c.add(new THREE.Mesh(new THREE.BoxGeometry(3, 2.6, 4), M.MAT.echoPlate()));
    for (const o of [-0.6, 0.6]) {
      const b = new THREE.CylinderGeometry(0.35, 0.5, 5, 10); b.rotateX(Math.PI / 2);
      const m = new THREE.Mesh(b, M.MAT.metal()); m.position.set(o, 0.2, 4); c.add(m);
      c.add(glowAt('#ff9a5a', 2, o, 0.2, 6.6, 0.8));
    }
    c.position.set(s * 9.5, 8, 0);
    cannons.push(B.part(c, 16, 3.2, { color: '#ffb060' }));
  }
  const eye = new THREE.Group();
  eye.add(ball(2.6, M.std('#f4f4f8', { roughness: 0.2, metalness: 0.1 }), 0, 0, 0, 20));
  eye.add(ball(1.3, M.basic(EYE), 0, 0, 1.8, 14));
  eye.add(ball(0.55, M.basic('#200008'), 0, 0, 2.6, 10));
  eye.add(glowAt(EYE, 5, 0, 0, 2.8, 0.6));
  const frame = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.35, 8, 24), M.MAT.metal()); eye.add(frame);
  const lid = ball(3.0, M.MAT.echoPlate(), 0, 0, 0, 16); eye.add(lid);
  eye.position.set(0, 12, 0);
  const ep = B.part(eye, 40, 3, { vital: true, shielded: true, color: '#ff6080' });
  B.onPartDestroyed = () => {
    if (cannons.every((c) => !c.alive) && ep.shielded) { ep.shielded = false; lid.visible = false; g.ui.say?.('brakk', 'Das Auge ist offen. Ich hasse Augen. Schieß drauf!'); }
  };
  B.behave = (dt, g) => {
    B.dt = dt;
    B.root.position.x = Math.sin(B.t * 0.4) * 8;
    body.position.y = 3 + Math.abs(Math.sin(B.t * 1.6)) * 0.6;
    eye.lookAt(g.p.pos);
    for (const c of cannons) if (c.alive) { c.obj.lookAt(g.p.pos); c.fireT = (c.fireT ?? rand(0.5, 2)) - dt; if (c.fireT <= 0) { c.fireT = 2.8; for (let i = 0; i < 2; i++) setTimeout(() => c.alive && g.fireAimed(c.obj.getWorldPosition(V()), 38, 0.3, '#ffb060'), i * 180); } }
    B.every('mine', 6, () => g.spawnEnemy('mine', rand(-10, 10), g.env.groundY + rand(3, 10), B.root.position.z + 8, { vz: -g.speed + 25 }));
    if (!ep.shielded) B.every('ring', 2.8, () => g.fireRing(eye.getWorldPosition(V()), 10, 26, '#ff6080', B.t));
  };
  return B;
}

// ---------- 3: Nebelwurm ----------
function wurm(g) {
  const B = new Boss('NEBELWURM', g);
  B.targetZ = -70;
  const skin = M.std('#3a1f3e', { metalness: 0.8, roughness: 0.25, flatShading: true });
  const head = new THREE.Group();
  head.add(new THREE.Mesh(M.lathe([[0, -3], [2.2, -2.5], [2.8, -0.5], [2.4, 1.8], [1.3, 3.4], [0, 3.9]], 10, 1, 0.78), skin));
  for (const s of [-1, 1]) {
    head.add(ball(0.45, M.basic(EYE), s * 1.4, 0.9, 2.2, 10));
    head.add(spike([s * 1.1, -0.7, 2.4], [s * 0.4, -1.2, 5.6], 0.45, crystal('#ffd0f0', '#6a1a5a')));
    head.add(spike([s * 1.4, 1.2, -1], [s * 2.6, 3.8, -3.5], 0.5, crystal('#ffd0f0', '#6a1a5a')));
  }
  head.add(glowAt('#ff9ad0', 8, 0, -0.5, 3.8, 0.7));
  const hp = B.part(head, 55, 3.4, { vital: true, color: '#ff9ad0' });
  const segs = [];
  for (let i = 0; i < 9; i++) {
    const k = 1 - i * 0.06;
    const s = new THREE.Group();
    s.add(new THREE.Mesh(M.lathe([[0, -1.7], [1.8, -1.3], [2.1, 0], [1.8, 1.3], [0, 1.7]], 10, k, k * 0.85), skin));
    s.add(new THREE.Mesh(new THREE.TorusGeometry(2.0 * k, 0.16, 6, 20), M.basic('#ff9ad0')));
    s.add(spike([0, 1.5 * k, 0], [0, 3.4 * k, -1.2], 0.45 * k, crystal('#e0c0ff', '#40206a')));
    segs.push(B.part(s, 5, 2.3, { color: '#c0a0ff' }));
  }
  const trail = [];
  B.behave = (dt, g) => {
    B.dt = dt;
    const fast = hp.hp < hp.max * 0.5 ? 1.5 : 1;
    const t = B.t * fast;
    head.position.set(Math.sin(t * 0.8) * 12, Math.cos(t * 1.1) * 5 + (g.ground ? 8 : 0), Math.sin(t * 0.5) * 12 - 4);
    trail.unshift(head.position.clone());
    if (trail.length > 200) trail.pop();
    let prev = head.position;
    segs.forEach((s, i) => {
      const q = trail[Math.min(trail.length - 1, (i + 1) * 6)];
      if (q) s.obj.position.copy(q);
      s.obj.lookAt(B.root.localToWorld(tmp.copy(prev)));
      prev = s.obj.position;
    });
    head.lookAt(g.p.pos);
    for (const s of segs) if (s.alive) { s.fireT = (s.fireT ?? rand(2, 8)) - dt; if (s.fireT <= 0) { s.fireT = rand(6, 9); g.fireAimed(s.obj.getWorldPosition(V()), 30, 1, '#c0a0ff'); } }
    B.every('fan', 2.8 / fast, () => g.fireFan(head.getWorldPosition(V()), 4, 0.18, 32, '#ff9ad0'));
    if (fast > 1) B.every('ring', 3.4, () => g.fireRing(head.getWorldPosition(V()), 10, 24, '#ff9ad0', B.t));
  };
  return B;
}

// ---------- 4: Der Chor ----------
function chor(g) {
  const B = new Boss('DER CHOR', g);
  const ring = new THREE.Group(); B.root.add(ring);
  const center = new THREE.Group();
  center.add(ball(3.2, M.basic('#fff6e0'), 0, 0, 0, 24));
  center.add(M.glowSprite('#ffe8b0', 20, 0.8));
  const cage = new THREE.Group(); center.add(cage);
  const gold = M.std('#ffcf60', { metalness: 1, roughness: 0.2 });
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(4.4 + i * 0.5, 0.18, 8, 40), gold); t.rotation.set(i * 1.1, i * 0.7, 0); cage.add(t); }
  const shell = M.makeShield(6.5, '#ffe080'); center.add(shell);
  const cp = B.part(center, 45, 4.5, { vital: true, shielded: true, color: '#ffffff' });
  const singers = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Group();
    // Horn-Schiff: Schalltrichter zeigt zum Spieler
    s.add(new THREE.Mesh(M.lathe([[0, -2.6], [0.55, -2.2], [0.6, -0.2], [0.95, 1.0], [1.7, 2.1], [1.75, 2.3], [1.2, 2.2]], 14), gold));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.3, 16), M.basic('#ffe080')); disc.position.z = 2.0; s.add(disc);
    s.add(glowAt('#ffe080', 5, 0, 0, 2.4, 0.7));
    for (const k of [-1, 1]) s.add(spike([k * 0.5, 0, -1], [k * 2.4, 0, -2.8], 0.3, crystal('#fff0c0', '#6a5010')));
    const a = (i / 6) * Math.PI * 2;
    s.position.set(Math.cos(a) * 10, Math.sin(a) * 10, 0);
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
    cage.rotation.y += dt * 0.7; cage.rotation.x += dt * 0.4;
    B.every('song', 0.5, () => {
      const alive = singers.filter((s) => s.alive);
      if (!alive.length) return;
      const s = alive[Math.floor(B.t * 2) % alive.length];
      const from = s.obj.getWorldPosition(V());
      const d = from.clone().sub(B.root.position).normalize().multiplyScalar(0.35); d.z = 1;
      g.fireBullet(from, d.normalize(), 26, '#ffe080');
    });
    B.every('aim', 3, () => g.fireAimed(center.getWorldPosition(V()), 36, 0.5, '#ffffff'));
    if (!cp.shielded) B.every('ring', 2.8, () => g.fireRing(center.getWorldPosition(V()), 10, 24, '#ffffff', B.t));
  };
  return B;
}

// ---------- 5: Die Stille – vollkommene Symmetrie ----------
function stille(g) {
  const B = new Boss('DIE STILLE', g);
  B.targetZ = -90;
  const mirrorMat = M.std('#f0f2ff', { metalness: 1, roughness: 0.03, flatShading: true, envMapIntensity: 1.4 });
  const edgeMat = new THREE.LineBasicMaterial({ color: '#ffffff', toneMapped: false });
  const core = new THREE.Group();
  const cm = new THREE.Mesh(new THREE.IcosahedronGeometry(8, 0), mirrorMat);
  core.add(cm);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(8.05, 0)), edgeMat); core.add(edges);
  const shield = M.makeShield(10.5, '#ffffff'); core.add(shield);
  const cp = B.part(core, 80, 8.5, { vital: true, shielded: true, color: '#ffffff' });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(15, 0.14, 6, 96), M.basic('#ffffff'));
  halo.position.z = -4; B.root.add(halo);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(17, 0.08, 6, 96), M.basic('#ffffff', { transparent: true, opacity: 0.5 }));
  halo2.position.z = -6; B.root.add(halo2);
  const pods = [];
  for (const [x, y] of [[-9.5, 4.5], [-9.5, -4.5], [9.5, 4.5], [9.5, -4.5]]) {
    const p = new THREE.Group();
    p.add(new THREE.Mesh(new THREE.OctahedronGeometry(3), mirrorMat));
    p.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(3.03)), edgeMat));
    p.add(M.glowSprite('#ffffff', 7, 0.45));
    p.position.set(x, y, 0);
    pods.push(B.part(p, 14, 3.4, { side: Math.sign(x), color: '#ffffff' }));
  }
  let broken = false, brakkBack = false;
  B.onPartDestroyed = () => {
    if (broken) return;
    const left = pods.filter((q) => q.side < 0 && q.alive).length, right = pods.filter((q) => q.side > 0 && q.alive).length;
    if (left === 0 || right === 0) {
      broken = true;
      cp.shielded = false;
      shield.visible = false;
      cm.material = M.std('#2a1030', { metalness: 0.6, roughness: 0.3, flatShading: true, emissive: '#ff6aa0', emissiveIntensity: 0.7 });
      edges.material = new THREE.LineBasicMaterial({ color: '#ff9ad0', toneMapped: false });
      halo.material = M.basic('#ff9ad0');
      g.ui.symmetryBroken?.();
    }
  };
  B.behave = (dt, g) => {
    B.dt = dt;
    B.root.position.x = Math.sin(B.t * 0.25) * 3;
    B.root.position.y = Math.sin(B.t * 0.4) * 2;
    core.rotation.y += dt * 0.25; core.rotation.x += dt * 0.12;
    halo.rotation.z += dt * 0.2; halo2.rotation.z -= dt * 0.12;
    for (const p of pods) p.obj.rotation.y += dt * 0.8;
    // Symmetrie heilt sich selbst: beschädigte Kapseln regenerieren
    if (!broken) for (const p of pods) if (p.alive) p.hp = Math.min(p.max, p.hp + dt * 1.2);
    // spiegelbildliche Schüsse
    B.every('mirror', 1.8, () => {
      const alive = pods.filter((p) => p.alive);
      for (const p of alive) g.fireAimed(p.obj.getWorldPosition(V()), 32, 0.2, '#ffffff');
    });
    if (broken) {
      B.every('ring', 2.3, () => g.fireRing(core.getWorldPosition(V()), 12, 24, '#ff9ad0', B.t * 2));
      B.every('fan', 3.2, () => g.fireFan(core.getWorldPosition(V()), 5, 0.14, 34, '#ffffff'));
      if (!brakkBack && cp.hp < cp.max * 0.5) { brakkBack = true; g.ui.brakkReturns?.(() => { B.dmgMul = 1.6; }); }
    } else B.every('ring', 3.8, () => g.fireRing(core.getWorldPosition(V()), 8, 22, '#ffffff', 0));
  };
  return B;
}

export function makeBoss(id, g) {
  return { queen, waechter, wurm, chor, stille }[id](g);
}
