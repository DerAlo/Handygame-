// Endgegner von URLICHT – die Legion des Grafen Nihil
import * as THREE from './three.module.min.js';
import * as M from './models.js';
import { audio } from './audio.js';
import { segDist2 } from './game.js';

const V = () => new THREE.Vector3();
const tmp = V();
const rand = (a, b) => a + Math.random() * (b - a);

class Boss {
  constructor(name, g, o = {}) {
    this.name = name;
    this.root = new THREE.Group();
    this.baseY = o.y ?? 0;
    this.root.position.set(0, this.baseY, -300);
    this.S = o.scale ?? 1.4;
    this.root.scale.setScalar(this.S);
    this.parts = [];
    this.t = 0;
    this.targetZ = o.z ?? -80;
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
      g.explode(p.obj.getWorldPosition(V()), '#ffb060', p.vital ? 3 : 1.8);
      g.score += p.vital ? 300 : 50;
      g.hits += 1;
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
    this.dt = dt;
    const r = this.root;
    this.entering = r.position.z < this.targetZ - 5;
    r.position.z += (this.targetZ - r.position.z) * Math.min(1, dt * 1.2);
    for (const p of this.parts) {
      if (p.hitT > 0) { p.hitT -= dt; p.obj.scale.setScalar(p.baseScale * 1.12); } else p.obj.scale.setScalar(p.baseScale);
    }
    if (this.dying) {
      this.dying += dt;
      if (Math.random() < dt * 10) g.explode(tmp.copy(r.position).add(V().set(rand(-12, 12), rand(-4, 10), rand(-4, 4))), '#ffb060', rand(1, 2.5));
      r.rotation.z += dt * 0.4;
      r.position.y -= dt * 3;
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

// ---------- Material & Bauteile ----------
const steel = () => M.std('#8d939d', { metalness: 0.8, roughness: 0.3 });
const plateD = () => M.std('#41464f', { metalness: 0.75, roughness: 0.35, flatShading: true });
const red = () => M.MAT.paint('#d0283a');
const eye = (c = '#ffcf3a') => M.std(c, { emissive: c, emissiveIntensity: 1.3, roughness: 0.2 });
const _up = new THREE.Vector3(0, 1, 0);
function spike(a, b, r, mat, segs = 6) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, A.distanceTo(B), segs), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, B.clone().sub(A).normalize());
  return m;
}
const ball = (r, mat, x = 0, y = 0, z = 0, seg = 16) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.ceil(seg * 0.7)), mat); m.position.set(x, y, z); return m; };
const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; };
const glowAt = (c, size, x, y, z, o = 0.8) => { const s = M.glowSprite(c, size, o); s.position.set(x, y, z); return s; };
function shadows(g) { g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; }

// ---------- 1: Krabbenläufer (Hafen von Aurelia) ----------
function krabbe(g) {
  const B = new Boss('KRABBENLÄUFER', g, { y: 0, z: -85 });
  const body = new THREE.Group(); body.position.y = 7; B.root.add(body);
  const shell = new THREE.SphereGeometry(8, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2); shell.scale(1.4, 0.55, 1);
  body.add(new THREE.Mesh(shell, steel()));
  const under = new THREE.CylinderGeometry(11, 9.5, 2.4, 24); under.scale(1, 1, 0.72);
  const um = new THREE.Mesh(under, plateD()); um.position.y = -1; body.add(um);
  for (let i = -2; i <= 2; i++) body.add(box(1.2, 0.4, 9, red(), i * 3.2, 4.2 - Math.abs(i) * 0.6, -1));
  // Beine
  for (const s of [-1, 1]) for (const k of [-1, 0, 1]) {
    const hip = [s * 9, 0, k * 4], knee = [s * 15, 5, k * 6.5], foot = [s * 16.5, -7.5, k * 7.5];
    body.add(M.bar(hip, knee, 0.8, plateD(), 8)); body.add(M.bar(knee, foot, 0.6, steel(), 8));
    body.add(ball(1.1, red(), ...knee, 10));
  }
  // Augen auf Stielen
  for (const s of [-1, 1]) { body.add(M.bar([s * 2, 3, 5], [s * 2.6, 7, 6], 0.3, steel(), 6)); body.add(ball(0.9, eye(), s * 2.6, 7.3, 6.2, 12)); }
  // Scheren
  const claws = [];
  for (const s of [-1, 1]) {
    const c = new THREE.Group();
    c.add(M.bar([0, 0, -4], [0, 0, 0], 1.2, plateD(), 8));
    const upper = new THREE.Group(); upper.add(spike([0, 0, 0], [0, 0.5, 6], 1.6, steel(), 7)); upper.position.y = 0.8; c.add(upper);
    const lower = new THREE.Group(); lower.add(spike([0, 0, 0], [0, -0.3, 4.5], 1.1, red(), 7)); lower.position.y = -0.8; c.add(lower);
    c.add(glowAt('#ff7a3a', 3, 0, 0, 2, 0.8));
    c.position.set(s * 11, 6, 8);
    c.userData = { upper, lower };
    claws.push(B.part(shadows(c), 16, 3.4, { parent: body, side: s }));
  }
  // Reaktor im Maul
  const core = new THREE.Group();
  core.add(ball(2.2, eye('#ff5a2a'), 0, 0, 0, 20));
  core.add(glowAt('#ff7a3a', 9, 0, 0, 1.5, 0.8));
  const lid = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), plateD()); lid.rotation.x = Math.PI / 2; core.add(lid);
  core.position.set(0, 1, 9.5);
  const cp = B.part(core, 45, 3, { parent: body, vital: true, shielded: true });
  shadows(body);
  B.onPartDestroyed = () => {
    if (claws.every((c) => !c.alive) && cp.shielded) { cp.shielded = false; lid.visible = false; g.ui.say?.('hilde', 'Die Scheren sind ab! Jetzt ins Maul, Kira – auf den Reaktor!'); }
  };
  B.behave = (dt, g) => {
    B.root.position.x = Math.sin(B.t * 0.45) * 9;
    body.position.y = 7 + Math.sin(B.t * 2.2) * 0.4;
    body.rotation.z = Math.sin(B.t * 0.45 + 1) * 0.06;
    for (const c of claws) if (c.alive) {
      const snap = Math.max(0, Math.sin(B.t * 3 + c.side)) * 0.5;
      c.obj.userData.upper.rotation.x = -snap; c.obj.userData.lower.rotation.x = snap;
      c.fireT = (c.fireT ?? rand(0.5, 2)) - dt;
      if (c.fireT <= 0) { c.fireT = 2.6; for (let i = 0; i < 3; i++) setTimeout(() => c.alive && g.fireAimed(c.obj.getWorldPosition(V()), 36, 0.4), i * 160); }
    }
    B.every('fan', cp.shielded ? 4 : 2.6, () => g.fireFan(core.getWorldPosition(V()), 5, 0.15, 30));
    if (!cp.shielded) B.every('ring', 3, () => g.fireRing(core.getWorldPosition(V()), 10, 24, '#ff7a3a', B.t));
  };
  return B;
}

// ---------- 2: Felsbrecher (Trümmergürtel) ----------
function felsbrecher(g) {
  const B = new Boss('FELSBRECHER', g, { z: -95 });
  const hull = new THREE.Group(); B.root.add(hull);
  hull.add(new THREE.Mesh(M.lathe([[0, -12], [6, -11], [8, -4], [8, 5], [6.5, 9], [3, 11], [0, 11.5]], 8, 1.3, 0.8), plateD()));
  hull.add(box(8, 5, 10, steel(), 0, 6, -4));
  hull.add(box(4, 3, 4, steel(), 0, 9.5, -6));
  for (let i = 0; i < 4; i++) hull.add(box(3.6, 0.3, 0.4, eye(), 0, 10.1, -7.2 + i * 0.9));
  for (const s of [-1, 1]) { hull.add(box(2, 1.4, 20, red(), s * 10.3, 0, -1)); for (let k = 0; k < 2; k++) { const e = glowAt('#ff9a3a', 7, s * (3 + k * 4), 0, -12.5, 0.9); hull.add(e); } }
  const drills = [];
  for (const s of [-1, 1]) {
    const d = new THREE.Group();
    d.add(M.bar([0, 0, -6], [0, 0, 0], 1.4, steel(), 8));
    const bit = new THREE.Group();
    bit.add(new THREE.Mesh(new THREE.ConeGeometry(2.6, 7, 10).rotateX(Math.PI / 2).translate(0, 0, 3.5), M.std('#c8a040', { metalness: 0.9, roughness: 0.3, flatShading: true })));
    for (let k = 0; k < 4; k++) { const f = spike([0, 0, 0.5], [Math.cos(k * 1.57) * 3.2, Math.sin(k * 1.57) * 3.2, 2], 0.4, red()); bit.add(f); }
    d.add(bit);
    d.position.set(s * 13, -1, 6);
    d.userData.bit = bit;
    drills.push(B.part(shadows(d), 18, 3.6, { side: s, parent: hull }));
  }
  const core = new THREE.Group();
  core.add(ball(2.4, eye('#ffcf3a'), 0, 0, 0, 20));
  core.add(glowAt('#ffcf3a', 10, 0, 0, 1.5, 0.8));
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1, 12).rotateX(Math.PI / 2), steel()); lid.position.z = 1.8; core.add(lid);
  core.position.set(0, 1, 11);
  const cp = B.part(core, 50, 3, { parent: hull, vital: true, shielded: true });
  B.onPartDestroyed = () => {
    if (drills.every((d) => !d.alive) && cp.shielded) { cp.shielded = false; lid.visible = false; g.ui.say?.('rasko', 'Bohrer weg, Klappe auf. Mach ihn fertig, Chefin!'); }
  };
  B.behave = (dt, g) => {
    B.root.position.x = Math.sin(B.t * 0.35) * 7;
    B.root.position.y = Math.sin(B.t * 0.5) * 3;
    hull.rotation.z = Math.sin(B.t * 0.35) * -0.08;
    for (const d of drills) if (d.alive) d.obj.userData.bit.rotation.z += dt * 8;
    // wirft Felsbrocken
    B.every('rocks', cp.shielded ? 2.2 : 3, () => {
      const alive = drills.filter((d) => d.alive);
      const from = (alive.length ? alive[Math.floor(Math.random() * alive.length)].obj : core).getWorldPosition(V());
      const r = rand(1.5, 2.8);
      const obj = M.makeAsteroid(r); obj.position.copy(from);
      g.addEnt({ kind: 'asteroid', obj, enemy: true, obstacle: true, hp: 2, r, score: 5, vz: 30, spin: V().set(1, 1, 0), path: null, bx: from.x, by: from.y });
      const tgt = g.p.pos; const e = g.ents[g.ents.length - 1];
      const k = 1 / Math.max(1, -from.z / 90);
      e.path = (a) => [(tgt.x - from.x) * Math.min(1, a * k), (tgt.y - from.y) * Math.min(1, a * k)];
    });
    B.every('fan', 3, () => g.fireFan(core.getWorldPosition(V()), 5, 0.14, 32));
    if (!cp.shielded) B.every('ring', 2.8, () => g.fireRing(core.getWorldPosition(V()), 10, 24, '#ffcf3a', B.t));
  };
  return B;
}

// ---------- 3: Magmaschlange (Pyra) ----------
function magma(g) {
  const B = new Boss('MAGMASCHLANGE', g, { y: 0, z: -70, scale: 1.3 });
  const skin = M.std('#3a2a26', { metalness: 0.7, roughness: 0.35, flatShading: true });
  const glowC = '#ff7a2a';
  const head = new THREE.Group();
  head.add(new THREE.Mesh(M.lathe([[0, -3.2], [2.4, -2.6], [3, -0.4], [2.6, 1.8], [1.4, 3.6], [0, 4.2]], 10, 1.1, 0.8), skin));
  for (const s of [-1, 1]) {
    head.add(ball(0.5, eye(), s * 1.6, 1.1, 2.4, 10));
    head.add(spike([s * 1.2, -0.8, 2.6], [s * 0.4, -1.3, 6], 0.5, M.std('#c8a040', { metalness: 0.9, roughness: 0.3 })));
    head.add(spike([s * 1.5, 1.4, -1], [s * 3, 4.4, -4], 0.6, red()));
  }
  head.add(glowAt(glowC, 8, 0, -0.6, 4.4, 0.7));
  const hp = B.part(shadows(head), 60, 3.6, { vital: true });
  const segs = [];
  for (let i = 0; i < 8; i++) {
    const k = 1 - i * 0.06;
    const s = new THREE.Group();
    s.add(new THREE.Mesh(M.lathe([[0, -1.8], [2, -1.4], [2.3, 0], [2, 1.4], [0, 1.8]], 10, k, k * 0.85), skin));
    s.add(new THREE.Mesh(new THREE.TorusGeometry(2.2 * k, 0.2, 6, 20), eye(glowC)));
    s.add(spike([0, 1.6 * k, 0], [0, 3.6 * k, -1.2], 0.5 * k, red()));
    segs.push(B.part(shadows(s), 6, 2.4));
  }
  const trail = [];
  B.behave = (dt, g) => {
    const fast = hp.hp < hp.max * 0.5 ? 1.4 : 1;
    const t = B.t * fast;
    // taucht in die Lava ab und wieder auf
    const dive = Math.sin(t * 0.55);
    head.position.set(Math.sin(t * 0.8) * 11, 5 + dive * 9, Math.sin(t * 0.5) * 10 - 4);
    hp.hittable = head.position.y > 0.5;
    trail.unshift(head.position.clone());
    if (trail.length > 200) trail.pop();
    let prev = head.position;
    segs.forEach((s, i) => {
      const q = trail[Math.min(trail.length - 1, (i + 1) * 6)];
      if (q) s.obj.position.copy(q);
      s.hittable = s.obj.position.y > 0;
      s.obj.lookAt(B.root.localToWorld(tmp.copy(prev)));
      prev = s.obj.position;
    });
    head.lookAt(g.p.pos);
    if (head.position.y < 1 && Math.random() < dt * 20) g.spray.spawn(head.getWorldPosition(V()).setY(0.4), V().set(rand(-6, 6), rand(8, 16), rand(-4, 4)), 0.8, '#ff8a3a', { drag: 1, g: 18 });
    for (const s of segs) if (s.alive && s.hittable) { s.fireT = (s.fireT ?? rand(2, 8)) - dt; if (s.fireT <= 0) { s.fireT = rand(6, 9); g.fireAimed(s.obj.getWorldPosition(V()), 30, 1, '#ff7a2a'); } }
    if (hp.hittable) B.every('fan', 2.8 / fast, () => g.fireFan(head.getWorldPosition(V()), 4, 0.18, 32, '#ff7a2a'));
    if (fast > 1 && hp.hittable) B.every('ring', 3.4, () => g.fireRing(head.getWorldPosition(V()), 10, 24, '#ffb040', B.t));
  };
  return B;
}

// ---------- 4: Schakal-Staffel (Glacia) ----------
function schakale(g) {
  const B = new Boss('SCHAKAL-STAFFEL', g, { y: 0, z: -60, scale: 1 });
  const pilots = [];
  const cols = ['#7a3aff', '#3a3a44', '#ff3a8a'];
  for (let i = 0; i < 3; i++) {
    const s = M.makeDart();
    s.scale.setScalar(2.4);
    s.traverse((o) => { if (o.isMesh && o.material.color && o.material.color.getHexString() === 'd0283a') o.material = M.MAT.paint(cols[i]); });
    s.add(glowAt(cols[i], 4, 0, 0, -2.6, 0.9));
    s.userData.phase = i * 2.1;
    pilots.push(B.part(s, 22, 4, { vital: true, idx: i }));
  }
  let taunt = 0;
  B.onPartDestroyed = (p) => {
    const left = pilots.filter((q) => q.alive).length;
    if (left === 2) g.ui.say?.('vex', 'Einer runter? Pah. Die Schakal-Staffel hat noch nie verloren!');
    if (left === 1) g.ui.say?.('vex', 'Na schön, Luchs. Ich erledige das selbst!');
  };
  B.behave = (dt, g) => {
    const Y = (g.bounds.yMin + g.bounds.yMax) / 2 + 3;
    for (const p of pilots) {
      if (!p.alive) continue;
      const ph = B.t * 0.9 + p.obj.userData.phase;
      const solo = pilots.filter((q) => q.alive).length === 1;
      const swoop = Math.max(0, Math.sin(B.t * 0.35 + p.idx * 2)) ** 6;
      const x = Math.sin(ph) * (solo ? 14 : 12), y = Y + Math.sin(ph * 1.7) * 6, z = Math.cos(ph * 0.6) * 12 + swoop * 45;
      const o = p.obj.position;
      const nx = o.x + (x - o.x) * Math.min(1, dt * 2), ny = o.y + (y - o.y) * Math.min(1, dt * 2);
      p.obj.rotation.set(0, 0, -(nx - o.x) / dt * 0.05);
      o.set(nx, ny, o.z + (z - o.z) * Math.min(1, dt * 2));
      p.fireT = (p.fireT ?? rand(0.5, 2)) - dt;
      if (p.fireT <= 0) { p.fireT = solo ? 1.2 : 2.4; for (let i = 0; i < 3; i++) setTimeout(() => p.alive && g.fireAimed(p.obj.getWorldPosition(V()), 42, 0.3, '#c07aff'), i * 120); }
    }
    taunt += dt;
    if (taunt > 14) { taunt = 0; g.ui.say?.('vex', ['Nett geflogen, Kätzchen. Für eine Hauskatze.', 'Graf Nihil zahlt gut. Und du? Du zahlst gleich drauf!', 'Hier im Eis frierst du mir fest, Luchs!'][Math.floor(Math.random() * 3)]); }
  };
  return B;
}

// ---------- 5: Graf Nihil – der Chamäleon-Thron ----------
function nihil(g) {
  const B = new Boss('GRAF NIHIL', g, { z: -120, scale: 2.3 });
  const skinMat = M.std('#3aa060', { metalness: 0.55, roughness: 0.25, transparent: true, opacity: 1, flatShading: true });
  const head = new THREE.Group(); B.root.add(head);
  head.add(new THREE.Mesh(M.lathe([[0, -8], [4.5, -6.5], [6.5, -2], [6, 2.5], [4.2, 6], [2, 8.5], [0, 9]], 20, 1.1, 0.95), skinMat));
  // Helmkamm (Casque)
  const crest = new THREE.Mesh(M.fin([[-7, 3], [2, 3], [-1, 9], [-6, 8]], 0.8), skinMat); head.add(crest);
  // Kehlsack und Schuppenkämme
  head.add(ball(3.6, skinMat, 0, -4.2, 3, 16));
  for (let i = 0; i < 6; i++) head.add(spike([0, 5.6 - i * 0.3, 2 - i * 1.8], [0, 7.4 - i * 0.3, 1.4 - i * 1.8], 0.5, M.std('#e0c040', { metalness: 0.6, roughness: 0.3 })));
  // Thron-Ring (Maschine hinter dem Kopf)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(13, 0.8, 8, 48), M.std('#2a2a34', { metalness: 0.9, roughness: 0.25 }));
  ring.position.z = -6; B.root.add(ring);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ring.add(glowAt('#c07aff', 3, Math.cos(a) * 13, Math.sin(a) * 13, 0.5, 0.9)); }
  // Drehbare Augen (Chamäleon!) – Geschütze
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Group();
    e.add(ball(2.4, skinMat, 0, 0, 0, 18));
    e.add(ball(1.2, eye('#ff4a2a'), 0, 0, 1.9, 14));
    e.add(glowAt('#ff4a2a', 4, 0, 0, 2.6, 0.8));
    e.add(ball(0.55, M.basic('#1a0a1a'), 0, 0, 2.9, 10));
    e.position.set(s * 5.2, 2.6, 3);
    eyes.push(B.part(e, 20, 2.8, { parent: head, side: s }));
  }
  // Maul-Kern
  const core = new THREE.Group();
  core.add(ball(2.2, eye('#c07aff'), 0, 0, 0, 20));
  core.add(glowAt('#c07aff', 9, 0, 0, 1.5, 0.9));
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(6, 1.4, 3), skinMat); jaw.position.set(0, -1.6, 0); core.add(jaw);
  core.position.set(0, -1.8, 8.6);
  const cp = B.part(core, 70, 3, { parent: head, vital: true, shielded: true });
  let hidden = 0, cloakT = 7;
  B.onPartDestroyed = () => {
    if (eyes.every((e) => !e.alive) && cp.shielded) { cp.shielded = false; g.ui.say?.('nihil', 'MEINE AUGEN! … Gleichgültig. Ich brauche keine Augen, um das Licht zu trinken!'); }
  };
  B.behave = (dt, g) => {
    B.root.position.x = Math.sin(B.t * 0.3) * 5;
    B.root.position.y = Math.sin(B.t * 0.45) * 3;
    ring.rotation.z += dt * 0.3;
    // Farbwechsel wie ein Chamäleon
    const hue = (B.t * 0.05) % 1;
    skinMat.color.setHSL(0.25 + Math.sin(B.t * 0.3) * 0.25 + hue * 0, 0.55, 0.32);
    // Augen drehen sich unabhängig voneinander
    eyes.forEach((e, i) => {
      if (!e.alive) return;
      if (i === 0) e.obj.lookAt(g.p.pos); else e.obj.rotation.set(Math.sin(B.t * 1.3) * 0.8, Math.cos(B.t * 0.9) * 1.2, 0);
      e.fireT = (e.fireT ?? rand(1, 2)) - dt;
      if (e.fireT <= 0 && hidden <= 0) { e.fireT = 2.4; g.fireFan(e.obj.getWorldPosition(V()), 3, 0.12, 36, '#ffcf3a'); }
    });
    head.lookAt(tmp.copy(g.p.pos).multiplyScalar(0.3));
    // Tarnung: wird fast unsichtbar und unverwundbar
    cloakT -= dt;
    if (cloakT <= 0 && hidden <= 0) { hidden = 3; cloakT = 9; g.ui.tip?.('Nihil tarnt sich! Weich aus, bis er wieder sichtbar wird.'); }
    if (hidden > 0) {
      hidden -= dt;
      skinMat.opacity = Math.max(0.08, skinMat.opacity - dt * 2);
      for (const p of B.parts) p.hittable = false;
      B.every('cloakShot', 0.6, () => g.fireAimed(V().set(rand(-12, 12), rand(-6, 8), B.root.position.z), 34, 0.5, '#c07aff'));
    } else {
      skinMat.opacity = Math.min(1, skinMat.opacity + dt * 2);
      for (const p of B.parts) p.hittable = true;
      B.every('fan', cp.shielded ? 3.5 : 2.4, () => g.fireFan(core.getWorldPosition(V()), 5, 0.15, 32, '#c07aff'));
      if (!cp.shielded) B.every('ring', 2.8, () => g.fireRing(core.getWorldPosition(V()), 12, 24, '#c07aff', B.t));
    }
  };
  return B;
}

export function makeBoss(id, g) {
  return { krabbe, felsbrecher, magma, schakale, nihil }[id](g);
}
