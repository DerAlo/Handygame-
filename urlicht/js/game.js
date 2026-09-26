// URLICHT – Spielkern: Welt, Schiff, Gegner, Schüsse, Kollisionen, Level-Ablauf.
import * as THREE from './three.module.min.js';
import * as M from './models.js';
import { audio } from './audio.js';
import { makeBoss } from './bosses.js';

export const SPAWN_Z = -300;
const KILL_Z = 30;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const V = () => new THREE.Vector3();
const tmp = V(), tmp2 = V();

// Quadrierter Abstand eines Punkts c zur Strecke a–b
const _ab = new THREE.Vector3(), _ac = new THREE.Vector3();
export function segDist2(a, b, c) {
  _ab.subVectors(b, a); _ac.subVectors(c, a);
  const l2 = _ab.lengthSq();
  const t = l2 > 0 ? Math.max(0, Math.min(1, _ac.dot(_ab) / l2)) : 0;
  const dx = a.x + _ab.x * t - c.x, dy = a.y + _ab.y * t - c.y, dz = a.z + _ab.z * t - c.z;
  return dx * dx + dy * dy + dz * dz;
}

// ---------- Punkt-Partikel (ein Draw-Call für viele Punkte) ----------
class PointPool {
  constructor(scene, n, size, opacity = 1) {
    this.n = n;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.items = [];
    for (let i = 0; i < n; i++) { this.items.push({ alive: false, p: V(), v: V(), life: 0, max: 1, c: new THREE.Color(), drag: 0, g: 0 }); this.pos[i * 3 + 1] = -9999; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ size, map: M.glowTexture(), vertexColors: true, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.next = 0;
  }
  spawn(p, v, life, color, opts = {}) {
    for (let k = 0; k < this.n; k++) {
      const it = this.items[this.next]; this.next = (this.next + 1) % this.n;
      if (!it.alive || k === this.n - 1) {
        it.alive = true; it.p.copy(p); it.v.copy(v); it.life = life; it.max = life; it.c.set(color);
        it.drag = opts.drag ?? 1.5; it.g = opts.g ?? 0; it.scroll = opts.scroll ?? true;
        return it;
      }
    }
  }
  update(dt, scroll) {
    for (let i = 0; i < this.n; i++) {
      const it = this.items[i];
      if (it.alive) {
        it.life -= dt;
        if (it.life <= 0) { it.alive = false; this.pos[i * 3 + 1] = -9999; continue; }
        it.v.multiplyScalar(Math.max(0, 1 - it.drag * dt));
        it.v.y -= it.g * dt;
        it.p.addScaledVector(it.v, dt);
        if (it.scroll) it.p.z += scroll * dt * 0.6;
        const f = it.life / it.max;
        this.pos[i * 3] = it.p.x; this.pos[i * 3 + 1] = it.p.y; this.pos[i * 3 + 2] = it.p.z;
        this.col[i * 3] = it.c.r * f; this.col[i * 3 + 1] = it.c.g * f; this.col[i * 3 + 2] = it.c.b * f;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
  clear() { for (let i = 0; i < this.n; i++) { this.items[i].alive = false; this.pos[i * 3 + 1] = -9999; } }
}

export class Game {
  constructor(canvas, ui) {
    this.ui = ui;
    this.settings = { autofire: true, invertY: false };
    const touch = 'ontouchstart' in window;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2));
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.5, 900);
    this.camera.position.set(0, 2.6, 11);
    this.hemi = new THREE.HemisphereLight('#bcd8ff', '#302030', 1.1);
    this.sun = new THREE.DirectionalLight('#ffffff', 1.6);
    this.sun.position.set(-4, 8, 6);
    this.scene.add(this.hemi, this.sun);
    this.scene.fog = new THREE.Fog('#000000', 120, 320);

    // Sternenfeld
    const N = 1400, sp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { sp[i * 3] = rand(-260, 260); sp[i * 3 + 1] = rand(-160, 160); sp[i * 3 + 2] = rand(-700, 20); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.starMat = new THREE.PointsMaterial({ color: '#ffffff', size: 1.3, sizeAttenuation: true, transparent: true, opacity: 1, fog: false, depthWrite: false });
    this.stars = new THREE.Points(sg, this.starMat);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    this.sparks = new PointPool(this.scene, 900, 1.3);
    this.flashes = new PointPool(this.scene, 60, 9);
    this.bulletPool = new PointPool(this.scene, 160, 2.8);
    this.bullets = [];

    // Spielerschiff
    this.ship = M.makePlayerShip();
    this.scene.add(this.ship);
    this.wing = [
      { id: 'mira', obj: M.makeWingman('#ffb0d8'), off: V().set(-9, 3.5, -8), alive: true },
      { id: 'brakk', obj: M.makeWingman('#a8b0b8'), off: V().set(9, 2.5, -14), alive: true },
    ];
    for (const w of this.wing) this.scene.add(w.obj);

    // Fadenkreuz (zwei Rahmen vor dem Schiff)
    this.reticle = [];
    for (const [d, s] of [[26, 1.3], [52, 1.9]]) {
      const geo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(s * 2, s * 2));
      const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#7fffb0', transparent: true, opacity: 0.75, fog: false, depthTest: false }));
      l.userData.d = d;
      this.reticle.push(l); this.scene.add(l);
    }
    this.lockMark = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(3)), new THREE.LineBasicMaterial({ color: '#ff5a7a', depthTest: false, fog: false }));
    this.lockMark.visible = false;
    this.scene.add(this.lockMark);

    // Laser-Pool
    this.laserGeo = new THREE.BoxGeometry(0.18, 0.18, 4);
    this.lasers = [];
    this.homers = [];
    this.rings = [];
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.ents = [];
    this.state = 'idle';
    this.input = { x: 0, y: 0, fire: false, charge: false, roll: false, bomb: false };
    this.t = 0;
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Hochformat: weiter herauszoomen, damit genug zu sehen ist
    this.camera.fov = w < h ? 88 : 68;
    this.camera.updateProjectionMatrix();
  }

  // ================= Level =================
  load(level, fromCheckpoint = false) {
    this.level = level;
    level.events.sort((a, b) => a[0] - b[0]);
    this.clearWorld();
    const E = level.env;
    this.env = { ...E };
    this.scene.background = new THREE.Color(E.sky);
    this.scene.fog.color.set(E.fog);
    this.scene.fog.near = E.fogNear ?? 120; this.scene.fog.far = E.fogFar ?? 320;
    this.starMat.opacity = E.stars ?? 1;
    this.starMat.color.set(E.starColor || '#ffffff');
    this.hemi.color.set(E.light || '#bcd8ff');
    this.speed = E.speed || 60;
    this.bounds = { x: 13, yMin: -7, yMax: 7 };
    // Boden (Eismond)
    if (this.ground) { this.scene.remove(this.ground); this.ground = null; }
    if (E.ground) {
      this.groundTex = M.iceTexture();
      const g = new THREE.Mesh(new THREE.PlaneGeometry(500, 1400), new THREE.MeshLambertMaterial({ map: this.groundTex, color: E.ground }));
      g.rotation.x = -Math.PI / 2; g.position.set(0, E.groundY, -500);
      this.ground = g; this.scene.add(g);
      this.bounds.yMin = E.groundY + 2.2; this.bounds.yMax = E.groundY + 17;
    }
    // Hintergrundbild
    if (this.backdrop) { this.scene.remove(this.backdrop); this.backdrop = null; }
    if (E.backdrop) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.backdropTexture(E.backdrop), fog: false, transparent: true, depthWrite: false, opacity: E.backdropOpacity ?? 1 }));
      s.scale.set(E.backdropSize || 260, E.backdropSize || 260, 1);
      s.position.set(E.backdropPos?.[0] ?? 120, E.backdropPos?.[1] ?? 60, -760);
      this.backdrop = s; this.scene.add(s);
    }
    this.renderer.setClearColor(E.sky);
    // Spielerzustand
    if (!fromCheckpoint) this.cp = null;
    const cp = fromCheckpoint ? this.cp : null;
    const keep = { laser: cp ? cp.laser : 0 };
    this.p = {
      pos: V().set(0, this.ground ? E.groundY + 6 : 0, 0), vel: new THREE.Vector2(), shield: 100, maxShield: 100,
      laser: keep.laser, bombs: 3, roll: 0, rollDir: 1, rollCd: 0, inv: 1.5, fireCd: 0, charge: 0, lock: null, alive: true,
    };
    this.score = cp ? cp.score : 0;
    this.hits = cp ? cp.hits : 0;
    this.goldRings = 0;
    this.t = cp ? cp.t : 0;
    this.clearDone = false;
    this.evIdx = level.events.findIndex((e) => e[0] >= this.t);
    if (this.evIdx < 0) this.evIdx = level.events.length;
    this.boss = null;
    this.wing.forEach((w) => { w.alive = w.id !== 'brakk' || !level.noBrakk; w.obj.visible = w.alive; w.obj.position.set(w.off.x, w.off.y, w.off.z); w.chaser = null; });
    this.state = 'play';
    this.clearTimer = 0;
    this.ship.visible = true;
    this.shakeT = 0;
    this.envAnim = null;
    this.ui.hud?.(this);
  }

  clearWorld() {
    for (const e of this.ents) this.world.remove(e.obj);
    this.ents = [];
    for (const l of this.lasers) this.scene.remove(l.mesh);
    this.lasers = [];
    for (const h of this.homers) this.scene.remove(h.obj);
    this.homers = [];
    for (const r of this.rings) this.scene.remove(r.mesh);
    this.rings = [];
    this.bullets = [];
    this.bulletPool.clear(); this.sparks.clear(); this.flashes.clear();
    if (this.boss) { this.scene.remove(this.boss.root); this.boss = null; }
  }

  // ================= Spawnen =================
  addEnt(e) {
    e.age = 0; e.dead = false;
    e.pos = e.obj.position;
    this.world.add(e.obj);
    this.ents.push(e);
    return e;
  }

  spawnEnemy(kind, x, y, z, opts = {}) {
    const mk = { drone: M.makeDrone, dart: M.makeDart, mine: M.makeMine, splitter: M.makeSplitter, turret: M.makeTurret }[kind];
    const obj = mk();
    obj.position.set(x, y, z);
    const base = {
      drone: { hp: 1, r: 1.4, score: 10, fire: [2.5, 5] },
      dart: { hp: 1, r: 1.3, score: 15, fire: null, vz: 40 },
      mine: { hp: 2, r: 1.8, score: 5, fire: null, mine: true },
      splitter: { hp: 6, r: 2.4, score: 30, fire: [1.8, 3], split: true },
      turret: { hp: 3, r: 1.8, score: 20, fire: [1.4, 2.6] },
    }[kind];
    const e = this.addEnt({ kind, obj, enemy: true, ...base, bx: x, by: y, vz: base.vz || 0, ...opts });
    if (e.fire) e.fireT = rand(e.fire[0] * 0.4, e.fire[1]);
    return e;
  }

  // Formationen
  wave(kind, form, n, o = {}) {
    const y = o.y ?? rand(this.bounds.yMin + 2, this.bounds.yMax - 2);
    const x = o.x ?? 0;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2;
      let e;
      switch (form) {
        case 'line': e = this.spawnEnemy(kind, x + k * 4.5, y, SPAWN_Z, o); break;
        case 'vee': e = this.spawnEnemy(kind, x + k * 4, y + Math.abs(k) * 2, SPAWN_Z - Math.abs(k) * 10, o); break;
        case 'column': e = this.spawnEnemy(kind, x, y, SPAWN_Z - i * 14, o); break;
        case 'sine': e = this.spawnEnemy(kind, x, y, SPAWN_Z - i * 12, { ...o, path: (a) => [Math.sin(a * 1.6 + i * 0.5) * 9, Math.cos(a * 1.1 + i) * 2] }); break;
        case 'swoopL': case 'swoopR': {
          const s = form === 'swoopL' ? -1 : 1;
          e = this.spawnEnemy(kind, 0, y, SPAWN_Z * 0.55 - i * 9, { ...o, path: (a) => [s * 26 * Math.cos(Math.min(a * 0.9, Math.PI)), Math.sin(a * 1.7) * 3] });
          break;
        }
        case 'spiral': e = this.spawnEnemy(kind, x, y, SPAWN_Z - i * 6, { ...o, path: (a) => { const r = Math.max(2, 10 - a * 1.5); return [Math.cos(a * 2.4 + i * 0.9) * r, Math.sin(a * 2.4 + i * 0.9) * r * 0.6]; } }); break;
        case 'hover': e = this.spawnEnemy(kind, x + k * 6, y + (i % 2) * 3, SPAWN_Z, { ...o, hoverZ: -55 - (i % 2) * 10, hoverT: o.hoverT ?? 5 }); break;
        default: e = this.spawnEnemy(kind, x + k * 4, y, SPAWN_Z, o);
      }
    }
  }

  spawnAsteroids(n, o = {}) {
    for (let i = 0; i < n; i++) {
      const r = rand(o.min || 1.5, o.max || 4);
      const obj = M.makeAsteroid(r);
      obj.position.set(rand(-this.bounds.x * 1.6, this.bounds.x * 1.6), rand(this.bounds.yMin * 1.5, this.bounds.yMax * 1.5), SPAWN_Z - rand(0, o.depth ?? 220));
      this.addEnt({ kind: 'asteroid', obj, enemy: true, obstacle: true, hp: Math.ceil(r), r: r * 0.95, score: 5, spin: V().set(rand(-1, 1), rand(-1, 1), rand(-1, 1)), vz: o.vz ?? 0 });
    }
  }

  spawnDecor(kind, o = {}) {
    let obj, ent = { kind, decor: true };
    if (kind === 'girder') {
      obj = M.makeGirder(o.len || 40);
      obj.position.set(o.x ?? rand(-10, 10), o.y ?? rand(-5, 5), SPAWN_Z);
      if (o.vertical) obj.rotation.x = Math.PI / 2;
      if (o.side) obj.rotation.y = Math.PI / 2;
      ent = { kind, obstacle: true, boxes: this.boxOf(obj) };
    } else if (kind === 'pillar') {
      const h = o.h || rand(8, 22);
      obj = M.makeIcePillar(h);
      obj.position.set(o.x ?? rand(-18, 18), this.env.groundY, SPAWN_Z - rand(0, 40));
      ent = { kind, obstacle: true, boxes: [{ min: V().set(-1.8, 0, -1.8), max: V().set(1.8, h, 1.8) }] };
    } else if (kind === 'arch') {
      obj = M.makeArch();
      obj.position.set(o.x ?? 0, this.env.groundY, SPAWN_Z);
      ent = { kind, obstacle: true, arch: true, boxes: [{ min: V().set(-9, 0, -1), max: V().set(-7, 16, 1) }, { min: V().set(7, 0, -1), max: V().set(9, 16, 1) }, { min: V().set(-9, 15, -1), max: V().set(9, 17, 1) }] };
    } else if (kind === 'protostar') {
      obj = M.makeProtostar(o.color || '#ffb0e0', o.r || 6);
      obj.position.set(o.x ?? (Math.random() < 0.5 ? -1 : 1) * rand(35, 70), o.y ?? rand(-20, 25), SPAWN_Z - 150);
    } else if (kind === 'cloud') {
      obj = new THREE.Sprite(new THREE.SpriteMaterial({ map: this._cloudTex || (this._cloudTex = M.backdropTexture('cloud')), color: o.color || '#ff9ad0', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
      const s = rand(40, 90); obj.scale.set(s, s, 1);
      ent.spin = null; ent.drift = rand(-0.2, 0.2);
      obj.position.set(rand(-60, 60), rand(-30, 30), SPAWN_Z - rand(0, 100));
    } else if (kind === 'wire') {
      obj = M.makeWireShape(o.r || rand(6, 16));
      obj.position.set(o.x ?? (Math.random() < 0.5 ? -1 : 1) * rand(20, 45), rand(-15, 20), SPAWN_Z - 100);
      ent.spin = V().set(rand(-0.5, 0.5), rand(-0.5, 0.5), 0);
    } else if (kind === 'structure') {
      obj = new THREE.Mesh(new THREE.BoxGeometry(rand(6, 14), rand(10, 30), rand(10, 30)), M.lambert('#6a7080'));
      obj.position.set((Math.random() < 0.5 ? -1 : 1) * rand(30, 50), rand(-10, 10), SPAWN_Z - 60);
    } else if (kind === 'turret') {
      return this.spawnEnemy('turret', o.x ?? rand(-12, 12), this.ground ? this.env.groundY + 0.5 : (o.y ?? -6), SPAWN_Z, o);
    }
    obj.position.z = obj.position.z || SPAWN_Z;
    return this.addEnt({ obj, ...ent });
  }

  boxOf(obj) {
    obj.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(obj);
    const p = obj.position;
    return [{ min: b.min.clone().sub(p), max: b.max.clone().sub(p) }];
  }

  spawnRing(x, y, gold = false) {
    const m = M.makeRing(gold);
    m.position.set(x, y, SPAWN_Z);
    this.addEnt({ kind: 'ring', obj: m, pickup: gold ? 'gold' : 'silver', r: 2.4 });
  }
  spawnItem(kind, x, y) {
    const m = M.makeItem(kind);
    m.position.set(x, y, SPAWN_Z);
    this.addEnt({ kind: 'item', obj: m, pickup: kind, r: 2.4 });
  }

  // Flügelmann wird verfolgt – Spieler muss helfen
  chase(id) {
    const w = this.wing.find((w) => w.id === id && w.alive);
    if (!w || w.chaser) return;
    w.chaseT = 12;
    const e = this.spawnEnemy('dart', 0, 0, -60, { vz: 0, chaser: w, hp: 2, score: 40, fire: null });
    w.chaser = e;
  }

  // ================= Gegnerschüsse =================
  fireBullet(from, dir, speed = 42, color = '#ff7ad0') {
    const b = this.bulletPool.spawn(from, dir.clone().multiplyScalar(speed), 6, color, { drag: 0, scroll: false });
    if (b) { b.bullet = true; b.dead = false; this.bullets.push(b); }
  }
  fireAimed(from, speed = 42, spread = 0, color) {
    tmp2.copy(this.p.pos).sub(from);
    tmp2.x += rand(-spread, spread); tmp2.y += rand(-spread, spread);
    this.fireBullet(from, tmp2.normalize(), speed, color);
  }
  fireFan(from, n, width, speed = 40, color) {
    const base = tmp2.copy(this.p.pos).sub(from).normalize().clone();
    for (let i = 0; i < n; i++) {
      const a = (i - (n - 1) / 2) * width;
      const d = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
      this.fireBullet(from, d, speed, color);
    }
  }
  fireRing(from, n, speed = 30, color, twist = 0) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + twist;
      const d = new THREE.Vector3(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 1).normalize();
      this.fireBullet(from, d, speed, color);
    }
  }

  // ================= Effekte =================
  explode(p, color = '#ffb060', size = 1) {
    const n = Math.floor(22 * size + 8);
    for (let i = 0; i < n; i++) {
      tmp.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(6, 22) * Math.sqrt(size));
      this.sparks.spawn(p, tmp, rand(0.4, 0.9) * Math.min(2, size), Math.random() < 0.4 ? '#ffffff' : color, { drag: 2.2 });
    }
    for (let i = 0; i < Math.min(4, 1 + size); i++) this.flashes.spawn(p, tmp.set(rand(-2, 2), rand(-2, 2), rand(-2, 2)), 0.25 + 0.1 * size, i ? color : '#ffffff', { drag: 3 });
    audio.boom(size);
  }

  // ================= Spieleraktionen =================
  shoot() {
    const p = this.p;
    const lvl = p.laser;
    const origins = lvl >= 1 ? [[-1.5, -0.1], [1.5, -0.1]] : [[0, 0]];
    const dir = this.aimDir();
    for (const [ox, oy] of origins) {
      const mesh = new THREE.Mesh(this.laserGeo, M.basic(lvl >= 2 ? '#6affff' : '#7fff9a', { transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
      mesh.position.set(p.pos.x + ox, p.pos.y + oy, p.pos.z - 2.5);
      mesh.lookAt(tmp.copy(mesh.position).add(dir));
      this.scene.add(mesh);
      this.lasers.push({ mesh, v: dir.clone().multiplyScalar(190), life: 1.2, dmg: lvl >= 2 ? 2 : 1 });
    }
    audio.laser(lvl);
  }

  // Zielrichtung: Richtung Fadenkreuz, mit sanfter Zielhilfe
  aimDir() {
    const p = this.p;
    const aim = tmp.set(p.pos.x + p.vel.x * 0.9, p.pos.y + p.vel.y * 0.9, -60);
    let best = null, bestA = 0.12;
    const d0 = tmp2.copy(aim).sub(p.pos).normalize();
    const cand = this.targets();
    for (const t of cand) {
      if (t.z > -8 || t.z < -200) continue;
      const d = t.clone().sub(p.pos).normalize();
      const a = d.angleTo(d0);
      if (a < bestA) { bestA = a; best = d; }
    }
    const dir = d0.clone();
    if (best) dir.lerp(best, 0.7).normalize();
    return dir;
  }

  // Alle anvisierbaren Positionen (Gegner + Boss-Teile)
  targets() {
    const out = [];
    for (const e of this.ents) if (e.enemy && !e.dead && e.hp > 0) { const v = e.pos.clone(); v.ent = e; out.push(v); }
    if (this.boss) for (const part of this.boss.parts) if (part.alive && part.hittable !== false) { const v = part.obj.getWorldPosition(V()); v.part = part; out.push(v); }
    return out;
  }

  findLock() {
    const p = this.p;
    const d0 = tmp2.set(p.vel.x * 0.9, p.vel.y * 0.9, -60).normalize();
    let best = null, bestA = 0.35;
    for (const t of this.targets()) {
      if (t.z > -10 || t.z < -220) continue;
      const a = t.clone().sub(p.pos).normalize().angleTo(d0);
      if (a < bestA) { bestA = a; best = t; }
    }
    return best;
  }

  fireHomer() {
    const p = this.p;
    const obj = M.glowSprite('#ff6a9a', 3.2);
    obj.position.set(p.pos.x, p.pos.y, p.pos.z - 3);
    this.scene.add(obj);
    this.homers.push({ obj, v: V().set(0, 0, -90), target: p.lock, life: 2.6 });
    audio.homing();
  }

  roll(dir) {
    const p = this.p;
    if (p.rollCd > 0) return;
    p.roll = 0.6; p.rollDir = dir || (p.vel.x >= 0 ? 1 : -1); p.rollCd = 1.0;
    audio.roll();
  }

  bomb() {
    const p = this.p;
    if (p.bombs <= 0) return;
    p.bombs--;
    audio.bomb();
    const c = V().set(p.pos.x, p.pos.y, -45);
    for (let i = 0; i < 80; i++) this.sparks.spawn(c, tmp.set(rand(-1, 1), rand(-1, 1), rand(-0.3, 0.3)).normalize().multiplyScalar(rand(30, 60)), 1.0, i % 2 ? '#ffffff' : '#ffb347', { drag: 1.5 });
    this.flashes.spawn(c, tmp.set(0, 0, 0), 0.6, '#ffffff');
    for (const b of this.bullets) { b.dead = true; b.life = 0; }
    for (const e of this.ents) if (e.enemy && e.pos.z > -130 && e.pos.z < 0 && !e.obstacle) this.damage(e, 8);
    if (this.boss) for (const part of this.boss.parts) if (part.alive) this.boss.hit(part, 6, this);
    this.ui.flash?.();
    this.ui.hud?.(this);
  }

  damage(e, n) {
    if (e.dead) return;
    e.hp -= n;
    if (e.hp > 0) { audio.tink(); return; }
    e.dead = true;
    this.explode(e.pos, e.kind === 'asteroid' ? '#c8a070' : e.kind === 'dart' ? '#ff7ad0' : '#9fb0ff', e.kind === 'splitter' ? 1.8 : e.kind === 'asteroid' ? 0.8 : 1);
    this.score += e.score || 0;
    if (e.kind !== 'asteroid') this.hits++;
    if (e.split) for (let i = 0; i < 3; i++) this.spawnEnemy('drone', e.pos.x + rand(-3, 3), e.pos.y + rand(-3, 3), e.pos.z - 2, { hoverZ: -40, hoverT: 3 });
    if (e.chaser) { e.chaser.chaser = null; this.ui.chaseSaved?.(e.chaser.id); }
    if (e.drop) (e.drop === 'gold' || e.drop === 'silver') ? this.spawnRingAt(e.pos, e.drop === 'gold') : this.spawnItemAt(e.pos, e.drop);
    this.ui.hud?.(this);
  }
  spawnRingAt(p, gold) { const m = M.makeRing(gold); m.position.copy(p); this.addEnt({ kind: 'ring', obj: m, pickup: gold ? 'gold' : 'silver', r: 2.6 }); }
  spawnItemAt(p, kind) { const m = M.makeItem(kind); m.position.copy(p); this.addEnt({ kind: 'item', obj: m, pickup: kind, r: 2.6 }); }

  hurt(n) {
    const p = this.p;
    if (p.inv > 0 || !p.alive) return;
    p.shield = Math.max(0, p.shield - n);
    p.inv = 0.6;
    audio.hit();
    this.ui.hurt?.();
    this.explode(tmp.copy(p.pos), '#ffd060', 0.3);
    if (p.shield <= 25 && p.shield > 0) audio.lowShield();
    if (p.shield <= 0) this.die();
    this.ui.hud?.(this);
  }

  die() {
    const p = this.p;
    p.alive = false;
    this.explode(p.pos, '#ffb060', 3);
    this.ship.visible = false;
    this.state = 'dead';
    setTimeout(() => this.ui.dead?.(), 1800);
  }

  pickup(e) {
    const p = this.p;
    if (e.pickup === 'silver') { p.shield = Math.min(p.maxShield, p.shield + 25); audio.ring(false); }
    if (e.pickup === 'gold') {
      p.shield = Math.min(p.maxShield, p.shield + 50); audio.ring(true); this.goldRings++;
      if (this.goldRings === 3) { p.maxShield = 150; p.shield = 150; this.ui.say?.('mira', 'Drei goldene Ringe! Deine Schilde sind verstärkt, Juno!'); }
    }
    if (e.pickup === 'laser') { p.laser = Math.min(2, p.laser + 1); audio.item(); this.ui.say?.('brakk', p.laser === 1 ? 'Zwillingslaser. Zweimal so viel Ärger für die Echos.' : 'Hyperlaser. Ich wünschte, ich hätte Arme, um dir zu applaudieren.'); }
    if (e.pickup === 'bomb') { p.bombs = Math.min(9, p.bombs + 1); audio.item(); }
    e.dead = true;
    this.score += 5;
    this.ui.hud?.(this);
  }

  // ================= Hauptschleife =================
  update(dt) {
    if (this.state === 'idle' || this.state === 'pause') return;
    dt = Math.min(dt, 0.05);
    const p = this.p;
    const running = this.state === 'play' || this.state === 'boss';
    const scroll = this.state === 'clear' ? this.speed * 2.5 : this.speed;

    // Level-Ereignisse
    if (this.state === 'play') {
      this.t += dt;
      const evs = this.level.events;
      while (this.evIdx < evs.length && evs[this.evIdx][0] <= this.t) { this.runEvent(evs[this.evIdx]); this.evIdx++; }
      const C = this.level.checkpoint;
      if (C && (!this.cp || this.cp.t < C) && this.t >= C) this.cp = { t: C, score: this.score, hits: this.hits, laser: p.laser };
    }

    // Spieler bewegen
    if (p.alive) {
      const inY = this.settings.invertY ? -this.input.y : this.input.y;
      p.vel.x += (this.input.x * 22 - p.vel.x) * Math.min(1, dt * 7);
      p.vel.y += (inY * 16 - p.vel.y) * Math.min(1, dt * 7);
      p.pos.x = clamp(p.pos.x + p.vel.x * dt, -this.bounds.x, this.bounds.x);
      p.pos.y = clamp(p.pos.y + p.vel.y * dt, this.bounds.yMin, this.bounds.yMax);
      if (p.roll > 0) p.roll -= dt;
      if (p.rollCd > 0) p.rollCd -= dt;
      if (p.inv > 0) p.inv -= dt;
      const rollAng = p.roll > 0 ? (1 - p.roll / 0.6) * Math.PI * 2 * p.rollDir : 0;
      this.ship.position.copy(p.pos);
      this.ship.rotation.set(p.vel.y * 0.022, -p.vel.x * 0.01, -p.vel.x * 0.024 - rollAng);
      this.ship.visible = !(p.inv > 0 && p.roll <= 0 && Math.floor(p.inv * 20) % 2 === 0);
      this.ship.userData.engine.scale.setScalar(1.4 + Math.random() * 0.5);

      // Schießen
      if (running) {
        p.fireCd -= dt;
        const auto = this.settings.autofire;
        if (this.input.fire) {
          p.fireHold = (p.fireHold || 0) + dt;
          if (!auto && p.fireHold < 0.05 && p.fireCd <= 0) { this.shoot(); p.fireCd = 0.12; }
          if (p.fireHold > 0.35) {
            if (p.charge === 0) audio.charge();
            p.charge = Math.min(1, p.charge + dt * 1.6);
            if (p.charge >= 1) p.lock = this.findLock() || p.lock;
          }
        } else {
          if (p.fireHold > 0 && p.charge >= 1) this.fireHomer();
          else if (!auto && p.fireHold > 0 && p.fireHold < 0.35 && p.fireCd <= 0) { this.shoot(); p.fireCd = 0.12; }
          p.fireHold = 0; p.charge = 0; p.lock = null;
        }
        if (auto && p.charge === 0 && p.fireCd <= 0) { this.shoot(); p.fireCd = p.laser >= 2 ? 0.11 : 0.14; }
        if (this.input.roll) { this.roll(this.input.x < -0.2 ? -1 : this.input.x > 0.2 ? 1 : 0); this.input.roll = false; }
        if (this.input.bomb) { this.bomb(); this.input.bomb = false; }
      }
    }
    // Fadenkreuz
    for (const r of this.reticle) {
      const d = r.userData.d;
      r.visible = p.alive && running;
      r.position.set(p.pos.x + p.vel.x * 0.9 * (d / 60), p.pos.y + p.vel.y * 0.9 * (d / 60), -d);
      r.material.color.set(p.charge >= 1 ? '#ff5a7a' : '#7fffb0');
    }
    if (p.lock && p.charge >= 1) {
      const lp = p.lock.part ? p.lock.part.obj.getWorldPosition(V()) : p.lock.ent ? p.lock.ent.pos : p.lock;
      if ((p.lock.ent && p.lock.ent.dead) || (p.lock.part && !p.lock.part.alive)) { p.lock = null; this.lockMark.visible = false; }
      else { this.lockMark.visible = true; this.lockMark.position.copy(lp); this.lockMark.rotation.z += dt * 3; }
    } else this.lockMark.visible = false;

    // Kamera
    const cam = this.camera;
    const portrait = window.innerWidth < window.innerHeight;
    const cx = p.pos.x * (portrait ? 0.85 : 0.65), cy = p.pos.y * 0.7 + (portrait ? 3.4 : 2.6);
    cam.position.x += (cx - cam.position.x) * Math.min(1, dt * 5);
    cam.position.y += (cy - cam.position.y) * Math.min(1, dt * 5);
    cam.position.z = portrait ? 13 : 11;
    cam.lookAt(p.pos.x * 0.85, p.pos.y * 0.8 + 0.6, -40);
    cam.rotation.z += (-p.vel.x * 0.006 - cam.rotation.z * 0) * 1;
    if (this.shakeT > 0) { this.shakeT -= dt; cam.position.x += rand(-0.4, 0.4); cam.position.y += rand(-0.4, 0.4); }

    // Sterne scrollen
    const sp = this.stars.geometry.attributes.position;
    const arr = sp.array;
    for (let i = 2; i < arr.length; i += 3) { arr[i] += scroll * dt * 1.2; if (arr[i] > 20) arr[i] -= 720; }
    sp.needsUpdate = true;
    if (this.groundTex) this.groundTex.offset.y += (scroll * dt) / (1400 / 12);

    // Laser
    for (const l of this.lasers) {
      l.life -= dt;
      // Strecke, die der Laser in diesem Bild zurücklegt – plus die Annäherung der Gegner
      const a = this._la || (this._la = V());
      a.copy(l.mesh.position);
      a.z += (scroll + 40) * dt;
      l.mesh.position.addScaledVector(l.v, dt);
      if (l.life <= 0) { l.dead = true; continue; }
      const lp = l.mesh.position;
      const minZ = lp.z - 4, maxZ = a.z + 4;
      for (const e of this.ents) {
        if (!e.enemy || e.dead) continue;
        if (e.pos.z < minZ - e.r || e.pos.z > maxZ + e.r) continue;
        if (segDist2(a, lp, e.pos) < (e.r + 0.7) ** 2) { this.damage(e, l.dmg); l.dead = true; this.sparks.spawn(lp, tmp.set(0, 0, 5), 0.2, '#ffffff'); break; }
      }
      if (!l.dead && this.boss) {
        const part = this.boss.hitTestSeg(a, lp, 0.8);
        if (part) { this.boss.hit(part, l.dmg, this); l.dead = true; this.sparks.spawn(lp, tmp.set(0, 0, 5), 0.2, '#ffffff'); }
      }
    }
    this.lasers = this.lasers.filter((l) => { if (l.dead) this.scene.remove(l.mesh); return !l.dead; });

    // Zielsuchende Ladeschüsse
    for (const h of this.homers) {
      h.life -= dt;
      let tp = null;
      if (h.target) {
        if (h.target.ent && !h.target.ent.dead) tp = h.target.ent.pos;
        else if (h.target.part && h.target.part.alive) tp = h.target.part.obj.getWorldPosition(V());
      }
      if (tp) { tmp.copy(tp).sub(h.obj.position).normalize().multiplyScalar(110); h.v.lerp(tmp, Math.min(1, dt * 6)); }
      h.obj.position.addScaledVector(h.v, dt);
      h.obj.material.rotation += dt * 10;
      this.sparks.spawn(h.obj.position, tmp.set(rand(-2, 2), rand(-2, 2), 8), 0.3, '#ff9ab8');
      let boom = h.life <= 0;
      for (const e of this.ents) if (e.enemy && !e.dead && e.pos.distanceTo(h.obj.position) < e.r + 1.5) boom = true;
      if (this.boss && this.boss.hitTest(h.obj.position, 2)) boom = true;
      if (boom) {
        h.dead = true;
        const c = h.obj.position;
        this.explode(c, '#ff6a9a', 2);
        let kills = 0;
        for (const e of this.ents) if (e.enemy && !e.dead && e.pos.distanceTo(c) < 10) { this.damage(e, 10); if (e.dead) kills++; }
        if (this.boss) for (const part of this.boss.parts) if (part.alive && part.obj.getWorldPosition(V()).distanceTo(c) < 10) this.boss.hit(part, 8, this);
        if (kills >= 2) { this.hits += kills - 1; this.score += kills * 10; this.ui.bonus?.(kills); }
      }
    }
    this.homers = this.homers.filter((h) => { if (h.dead) this.scene.remove(h.obj); return !h.dead; });

    // Objekte / Gegner
    for (const e of this.ents) {
      if (e.dead) continue;
      e.age += dt;
      let vz = e.chaser ? 0 : scroll + (e.vz || 0);
      if (e.hoverZ !== undefined) {
        if (e.pos.z >= e.hoverZ && e.hoverLeft === undefined) { e.hoverLeft = e.hoverT; }
        if (e.hoverLeft !== undefined) {
          e.hoverLeft -= dt;
          if (e.hoverLeft > 0) { vz = 0; e.bx += Math.sin(e.age * 1.3) * dt * 4; }
          else { vz = -20; e.by += dt * 14; }
        }
      }
      e.pos.z += vz * dt;
      if (e.path) { const [px, py] = e.path(e.age); e.pos.x = e.bx + px; e.pos.y = e.by + py; }
      else if (e.hoverLeft !== undefined) { e.pos.x = e.bx; e.pos.y = e.by; }
      if (e.chaser) {
        // Verfolger klebt am Flügelmann
        const w = e.chaser;
        e.pos.lerp(tmp.copy(w.obj.position).add(tmp2.set(Math.sin(e.age * 3) * 2, 1, 6)), Math.min(1, dt * 4));
        if (Math.random() < dt * 2) { this.sparks.spawn(w.obj.position, tmp.set(0, 0, 0), 0.3, '#ff7ad0'); }
      }
      if (e.spin) { e.obj.rotation.x += e.spin.x * dt; e.obj.rotation.y += e.spin.y * dt; }
      if (e.obj.userData.spin) { e.obj.userData.spin.rotation.y += dt * 2; e.obj.userData.spin.rotation.x += dt * 1.2; }
      if (e.kind === 'dart' && !e.chaser) e.obj.lookAt(tmp.copy(e.pos).add(tmp2.set(0, 0, 1)));
      if (e.kind === 'turret' && e.obj.userData.head) e.obj.lookAt(p.pos.x, e.pos.y, p.pos.z);
      if (e.mine && e.obj.userData.glow) e.obj.userData.glow.material.opacity = 0.4 + 0.4 * Math.sin(e.age * 10);
      // Schießen
      if (e.enemy && e.fire && running && p.alive && e.pos.z > -190 && e.pos.z < -18) {
        e.fireT -= dt;
        if (e.fireT <= 0) { this.fireAimed(tmp.copy(e.pos), e.kind === 'turret' ? 38 : 34, 0.6); e.fireT = rand(e.fire[0], e.fire[1]) * (this.level.fireMul || 1); }
      }
      // Kollision mit dem Spieler
      if (p.alive && Math.abs(e.pos.z - p.pos.z) < 12) {
        if (e.pickup) { if (e.pos.distanceToSquared(p.pos) < (e.r + 1.4) ** 2) this.pickup(e); }
        else if (e.boxes) {
          for (const b of e.boxes) {
            const lx = p.pos.x - e.pos.x, ly = p.pos.y - e.pos.y, lz = p.pos.z - e.pos.z;
            if (lx > b.min.x - 1 && lx < b.max.x + 1 && ly > b.min.y - 0.6 && ly < b.max.y + 0.6 && lz > b.min.z - 1 && lz < b.max.z + 1) { this.hurt(15); p.vel.x = -p.vel.x - Math.sign(lx) * 10; break; }
          }
          if (e.arch && !e.archDone && e.pos.z > p.pos.z) { e.archDone = true; if (Math.abs(p.pos.x - e.pos.x) < 7 && p.pos.y - e.pos.y < 15) { this.score += 15; audio.ring(false); this.ui.bonus?.(0, 'Bogen +15'); } }
        } else if (e.enemy && e.r && e.pos.distanceToSquared(p.pos) < (e.r + 1.0) ** 2) {
          this.hurt(e.mine ? 20 : e.obstacle ? 15 : 12);
          this.damage(e, e.mine || !e.obstacle ? 99 : 1);
        }
      }
      if (e.pos.z > KILL_Z) e.dead = true;
    }
    // Flügelmänner
    this.updateWing(dt);
    if (this.ents.some((e) => e.dead)) this.ents = this.ents.filter((e) => { if (e.dead) this.world.remove(e.obj); return !e.dead; });

    // Gegnerschüsse
    for (const b of this.bullets) {
      if (b.dead || b.life <= 0) { b.dead = true; continue; }
      if (b.harmless) continue;
      if (p.alive && Math.abs(b.p.z - p.pos.z) < 2 && b.p.distanceToSquared(p.pos) < 1.7 * 1.7) {
        if (p.roll > 0) { b.v.multiplyScalar(-1.2); b.harmless = true; b.c.set('#80ff80'); audio.deflect(); }
        else { this.hurt(8); b.dead = true; b.life = 0; }
      }
    }
    this.bullets = this.bullets.filter((b) => !b.dead && b.life > 0);

    // Boss
    if (this.boss) {
      this.boss.update(dt, this);
      if (this.boss.defeated && this.state === 'boss') {
        this.state = 'clear';
        this.clearTimer = 0;
        this.ui.bossBar?.(null);
        this.ui.bossDown?.();
      }
      else if (this.state === 'boss') this.ui.bossBar?.(this.boss.hpFrac());
    }
    if (this.state === 'clear') {
      this.clearTimer += dt;
      if (this.clearTimer > 3.5 && !this.clearDone) { this.clearDone = true; this.ui.levelClear?.(); }
    }

    this.sparks.update(dt, scroll);
    this.flashes.update(dt, scroll);
    this.bulletPool.update(dt, 0);
  }

  updateWing(dt) {
    const p = this.p;
    for (const w of this.wing) {
      if (!w.alive) { w.obj.visible = false; continue; }
      w.obj.visible = true;
      const t = this.t + (w.id === 'mira' ? 0 : 2);
      let tx = clamp(p.pos.x * 0.4 + w.off.x + Math.sin(t * 0.7) * 2, -22, 22);
      let ty = p.pos.y * 0.3 + w.off.y + Math.cos(t * 0.9) * 1.5;
      let tz = w.off.z;
      if (w.chaser) {
        tx = Math.sin(t * 1.5) * 10; ty = p.pos.y + 3 + Math.sin(t * 2.3) * 3; tz = -38;
        w.chaseT -= dt;
        if (w.chaseT <= 0) {
          // Hilfe kam zu spät – der Verfolger dreht ab
          w.chaser.dead = true; this.world.remove(w.chaser.obj); w.chaser = null;
          this.ui.chaseFailed?.(w.id);
        }
      }
      const o = w.obj.position;
      o.x += (tx - o.x) * Math.min(1, dt * 1.5);
      o.y += (ty - o.y) * Math.min(1, dt * 1.5);
      o.z += (tz - o.z) * Math.min(1, dt * 1.2);
      w.obj.rotation.z = -(tx - o.x) * 0.08;
      w.obj.userData.engine.scale.setScalar(1.2 + Math.random() * 0.4);
    }
  }

  // ================= Level-Ereignisse =================
  runEvent([, type, a = {}]) {
    switch (type) {
      case 'wave': this.wave(a.kind || 'drone', a.form || 'line', a.n || 5, a); break;
      case 'asteroids': this.spawnAsteroids(a.n || 12, a); break;
      case 'decor': for (let i = 0; i < (a.n || 1); i++) this.spawnDecor(a.kind, a); break;
      case 'mines': for (let i = 0; i < (a.n || 6); i++) this.spawnEnemy('mine', rand(-this.bounds.x, this.bounds.x), rand(this.bounds.yMin, this.bounds.yMax), SPAWN_Z - rand(0, 120)); break;
      case 'turrets': for (let i = 0; i < (a.n || 3); i++) this.spawnDecor('turret', { x: rand(-14, 14), y: a.y }); break;
      case 'ring': this.spawnRing(a.x ?? 0, a.y ?? (this.bounds.yMin + this.bounds.yMax) / 2, a.gold); break;
      case 'item': this.spawnItem(a.kind, a.x ?? 0, a.y ?? (this.bounds.yMin + this.bounds.yMax) / 2); break;
      case 'say': this.ui.say?.(a.who, a.text); break;
      case 'tip': this.ui.tip?.(a.text); break;
      case 'chase': this.chase(a.who); this.ui.say?.(a.who, a.text); break;
      case 'warn': this.ui.warn?.(a.text); break;
      case 'env': this.envTo(a); break;
      case 'lose': { const w = this.wing.find((w) => w.id === a.who); if (w) { this.explode(w.obj.position, '#ffb060', 2); w.alive = false; } break; }
      case 'boss': this.startBoss(a.id); break;
    }
  }

  envTo(a) {
    const from = { stars: this.starMat.opacity, fog: this.scene.fog.color.clone(), sky: this.scene.background.clone(), near: this.scene.fog.near, far: this.scene.fog.far };
    const to = { stars: a.stars ?? from.stars, fog: a.fog ? new THREE.Color(a.fog) : from.fog, sky: a.sky ? new THREE.Color(a.sky) : from.sky, near: a.near ?? from.near, far: a.far ?? from.far };
    const dur = a.dur || 4;
    let k = 0;
    this.envAnim = (dt) => {
      k = Math.min(1, k + dt / dur);
      this.starMat.opacity = from.stars + (to.stars - from.stars) * k;
      this.scene.fog.color.copy(from.fog).lerp(to.fog, k);
      this.scene.background.copy(from.sky).lerp(to.sky, k);
      this.scene.fog.near = from.near + (to.near - from.near) * k;
      this.scene.fog.far = from.far + (to.far - from.far) * k;
      if (a.backdropOpacity !== undefined && this.backdrop) this.backdrop.material.opacity += (a.backdropOpacity - this.backdrop.material.opacity) * k;
      if (k >= 1) this.envAnim = null;
    };
  }

  startBoss(id) {
    this.boss = makeBoss(id, this);
    this.scene.add(this.boss.root);
    this.state = 'boss';
    audio.play('boss');
    audio.alarm();
    this.ui.warn?.('⚠ ' + this.boss.name);
    this.ui.bossBar?.(1, this.boss.name);
    this.cp = { t: this.t - 1, score: this.score, hits: this.hits, laser: this.p.laser };
  }

  render(dt = 0.016) {
    if (this.envAnim) this.envAnim(dt);
    this.renderer.render(this.scene, this.camera);
  }
}
