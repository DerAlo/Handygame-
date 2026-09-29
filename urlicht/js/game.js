// URLICHT – Spielkern: Flug, Welt, Gegner, Schüsse, Kollisionen, Level-Ablauf.
import * as THREE from './three.module.min.js';
import * as M from './models.js';
import * as W from './world.js';
import { audio } from './audio.js';
import { makeBoss } from './bosses.js';

export const SPAWN_Z = -380;
const PROP_Z = -640;
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

// Kugel-Textur für gegnerische Schüsse: heller Kern, dunkler Rand – sichtbar auf hellem und dunklem Himmel
let _orb;
function orbTexture() {
  if (_orb) return _orb;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(110,110,110,1)'); g.addColorStop(0.72, 'rgba(60,60,60,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (_orb = new THREE.CanvasTexture(c));
}

// ---------- Punkt-Partikel (ein Draw-Call für viele Punkte) ----------
class PointPool {
  constructor(scene, n, size, opacity = 1, o = {}) {
    this.n = n; this.fade = o.fade ?? true;
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3);
    this.items = [];
    for (let i = 0; i < n; i++) { this.items.push({ alive: false, p: V(), v: V(), life: 0, max: 1, c: new THREE.Color(), drag: 0, g: 0 }); this.pos[i * 3 + 1] = -9999; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({ size, map: o.map || M.glowTexture(), vertexColors: true, transparent: true, opacity, blending: o.blending ?? THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, toneMapped: false });
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
      if (!it.alive) continue;
      it.life -= dt;
      if (it.life <= 0) { it.alive = false; this.pos[i * 3 + 1] = -9999; continue; }
      it.v.multiplyScalar(Math.max(0, 1 - it.drag * dt));
      it.v.y -= it.g * dt;
      it.p.addScaledVector(it.v, dt);
      if (it.scroll) it.p.z += scroll * dt * 0.6;
      const f = this.fade ? it.life / it.max : 1;
      this.pos[i * 3] = it.p.x; this.pos[i * 3 + 1] = it.p.y; this.pos[i * 3 + 2] = it.p.z;
      this.col[i * 3] = it.c.r * f; this.col[i * 3 + 1] = it.c.g * f; this.col[i * 3 + 2] = it.c.b * f;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
  clear() { for (let i = 0; i < this.n; i++) { this.items[i].alive = false; this.pos[i * 3 + 1] = -9999; } }
}

export class Game {
  constructor(canvas, ui) {
    this.ui = ui;
    this.settings = { autofire: false, invertY: false };
    const touch = 'ontouchstart' in window;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.5, 1000);
    this.camera.position.set(0, 4, 13);
    this.hemi = new THREE.HemisphereLight('#cfe4ff', '#5a5040', 0.7);
    this.sun = new THREE.DirectionalLight('#fff4e0', 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -45; sc.near = 1; sc.far = 260;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.scene.fog = new THREE.Fog('#a8c8e8', 150, 600);

    // Staub/Sterne für das Geschwindigkeitsgefühl
    const N = 420, sp = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { sp[i * 3] = rand(-120, 120); sp[i * 3 + 1] = rand(-40, 70); sp[i * 3 + 2] = rand(-500, 20); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.starMat = new THREE.PointsMaterial({ color: '#ffffff', size: 0.5, sizeAttenuation: true, transparent: true, opacity: 0.6, fog: false, depthWrite: false });
    this.stars = new THREE.Points(sg, this.starMat);
    this.stars.frustumCulled = false;
    this.scene.add(this.stars);

    this.terrain = new W.Terrain(this.scene);
    this.sparks = new PointPool(this.scene, 500, 1.0);
    this.spray = new PointPool(this.scene, 220, 1.6, 0.9, { blending: THREE.NormalBlending });
    this.bulletPool = new PointPool(this.scene, 160, 2.6, 1, { map: orbTexture(), fade: false, blending: THREE.NormalBlending });
    this.bullets = [];
    this.blasts = [];
    for (let i = 0; i < 28; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.glowTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      s.visible = false; this.scene.add(s);
      this.blasts.push({ s, life: 0, max: 1, size: 1 });
    }

    // Spielerschiff und Staffel
    this.ship = M.makePlayerShip();
    this.scene.add(this.ship);
    this.wing = [
      { id: 'rasko', obj: M.makeWingman('rasko'), off: V().set(-10, 3, -9) },
      { id: 'oli', obj: M.makeWingman('oli'), off: V().set(10, 2, -12) },
      { id: 'hilde', obj: M.makeWingman('hilde'), off: V().set(-4, 7, -20) },
    ];
    for (const w of this.wing) this.scene.add(w.obj);

    // Fadenkreuz
    this.reticle = [];
    for (const [d, s] of [[28, 1.2], [56, 1.8]]) {
      const geo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(s * 2, s * 2));
      const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#7fffb0', transparent: true, opacity: 0.8, fog: false, depthTest: false, toneMapped: false }));
      l.userData.d = d; l.renderOrder = 10;
      this.reticle.push(l); this.scene.add(l);
    }
    this.lockMark = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(3)), new THREE.LineBasicMaterial({ color: '#ff5a7a', depthTest: false, fog: false, toneMapped: false }));
    this.lockMark.visible = false;
    this.scene.add(this.lockMark);

    this.laserGeo = new THREE.BoxGeometry(0.16, 0.16, 4.5);
    this.laserMat = [M.basic('#6aff8a'), M.basic('#6affff')];
    this.lasers = []; this.homers = [];
    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.ents = [];
    this.clouds = [];
    this.state = 'idle';
    this.input = { x: 0, y: 0, fire: false, roll: false, bomb: false, boost: false, brake: false };
    this.t = 0; this.dist = 0;
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.baseFov = w < h ? 82 : 62;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  // ================= Level =================
  load(level, fromCheckpoint = false) {
    this.level = level;
    level.events.sort((a, b) => a[0] - b[0]);
    this.clearWorld();
    const E = level.env;
    this.env = { ...E };
    this.planet = E.type === 'planet';
    // Himmel
    for (const o of [this.sky, this.mountains, this.fluid, this.backdrop, this.wall]) if (o) this.scene.remove(o);
    this.sky = this.mountains = this.fluid = this.backdrop = this.wall = null;
    if (this.planet) {
      this.sky = W.makeSky(E.sky);
      this.scene.add(this.sky);
      this.scene.background = null;
      if (!level._env) {
        const s = new THREE.Scene(); s.add(W.makeSky(E.sky));
        level._env = this.pmrem.fromScene(s, 0.02, 0.1, 2000).texture;
      }
      if (E.mountains) { this.mountains = W.makeMountains(E.mountains.color, E.mountains.height, E.mountains.seed || 1); this.scene.add(this.mountains); }
      if (E.fluid) { this.fluid = W.makeFluid(E.fluid); this.fluid.position.y = E.fluidY ?? 0; this.scene.add(this.fluid); }
    } else {
      if (!level._sky) level._sky = M.skyTexture({ base: E.base, nebula: E.nebula, stars: E.skyStars ?? 1, density: E.nebulaDensity ?? 1, glow: E.nebulaGlow ?? 1 });
      if (!level._env) level._env = this.pmrem.fromEquirectangular(M.envTexture(E.envMap || {})).texture;
      this.scene.background = level._sky;
      if (E.wall) { this.wall = W.makeWall(); this.wall.position.set(0, 0, -860); this.scene.add(this.wall); }
      if (E.planet) { this.backdrop = M.makePlanet(E.planet.kind, E.planet.size); this.backdrop.position.set(...E.planet.pos); this.scene.add(this.backdrop); }
    }
    this.scene.backgroundIntensity = E.skyIntensity ?? 1;
    this.scene.environment = level._env;
    this.scene.fog.color.set(E.fog);
    this.scene.fog.near = E.fogNear ?? 150; this.scene.fog.far = E.fogFar ?? 600;
    this.hemi.color.set(E.light || '#cfe4ff');
    this.hemi.groundColor.set(E.groundLight || '#5a5040');
    this.hemi.intensity = E.hemi ?? 0.7;
    this.sun.color.set(E.sunLight || '#fff4e0');
    this.sun.intensity = E.sunIntensity ?? 2.6;
    const sd = (E.sky && E.sky.sunDir) || [-0.35, 0.5, -1];
    this.sunDir = new THREE.Vector3(sd[0], Math.max(0.5, sd[1] + 0.5), 0.6).normalize();
    this.sun.castShadow = this.planet;
    this.starMat.opacity = E.dust ?? (this.planet ? 0 : 0.7);
    this.starMat.color.set(E.dustColor || '#ffffff');
    this.speed = E.speed || 58;
    this.bounds = this.planet ? { x: 16, yMin: 1, yMax: 26 } : { x: 15, yMin: -11, yMax: 11 };

    // Spielerzustand
    if (!fromCheckpoint) this.cp = null;
    const cp = fromCheckpoint ? this.cp : null;
    this.p = {
      pos: V().set(0, this.planet ? 9 : 0, 0), vel: new THREE.Vector2(), shield: 100, maxShield: 100,
      laser: cp ? cp.laser : 0, bombs: 3, roll: 0, rollDir: 1, rollCd: 0, inv: 1.5, fireCd: 0, charge: 0, lock: null, alive: true,
      boost: 1, boostLock: false, loop: 0, speedMul: 1,
    };
    this.score = cp ? cp.score : 0;
    this.hits = cp ? cp.hits : 0;
    this.goldRings = 0;
    this.t = cp ? cp.t : 0;
    this.dist = this.t * this.speed;
    this.clearDone = false;
    this.evIdx = level.events.findIndex((e) => e[0] >= this.t);
    if (this.evIdx < 0) this.evIdx = level.events.length;
    this.boss = null;
    this.wing.forEach((w) => { w.alive = !(level.without || []).includes(w.id); w.obj.visible = w.alive; w.obj.position.copy(w.off); w.chaser = null; });
    // Gelände und Kulissen vorab füllen
    this.terrain.setSections(this.planet ? level.sections : null);
    this.terrain.reset(this.dist);
    this.nextProp = this.dist;
    this.fillProps(this.dist - PROP_Z);
    if (this.planet && E.clouds) for (let i = 0; i < E.clouds.n; i++) this.addCloud(rand(PROP_Z, 20));
    this.state = 'play';
    this.clearTimer = 0;
    this.ship.visible = true;
    this.shakeT = 0;
    this.envAnim = null;
    this.ui.bossBar?.(null);
    this.ui.hud?.(this);
  }

  clearWorld() {
    for (const e of this.ents) this.world.remove(e.obj);
    this.ents = [];
    for (const l of this.lasers) this.scene.remove(l.mesh);
    this.lasers = [];
    for (const h of this.homers) this.scene.remove(h.obj);
    this.homers = [];
    for (const c of this.clouds) this.scene.remove(c.s);
    this.clouds = [];
    this.bullets = [];
    this.bulletPool.clear(); this.sparks.clear(); this.spray.clear();
    for (const b of this.blasts) { b.life = 0; b.s.visible = false; }
    if (this.boss) { this.scene.remove(this.boss.root); this.boss = null; }
  }

  // Geländehöhe (inkl. Wasser/Lava) unter einer Weltposition
  groundAt(x, z) {
    if (!this.planet) return -999;
    const h = this.terrain.heightAt(x, this.dist - z);
    return this.fluid ? Math.max(h, this.fluid.position.y) : h;
  }

  // ================= Kulissen =================
  fillProps(untilD) {
    if (!this.planet) return;
    while (this.nextProp < untilD) {
      const d = this.nextProp;
      const biome = this.terrain.biomeAt(d).cur;
      const z = this.dist - d;
      for (const pr of W.propsFor(biome, d, this.bounds)) {
        const y = pr.y === 'ground' ? this.terrain.heightAt(pr.x, d) - 0.5 : pr.y;
        pr.obj.position.set(pr.x, y, z);
        const ud = pr.obj.userData;
        this.addEnt({ kind: 'prop', obj: pr.obj, decor: true, obstacle: !!ud.boxes, boxes: ud.boxes, gate: ud.gate });
      }
      this.nextProp += biome === 'city' ? 22 : 16;
    }
  }
  addCloud(z) {
    const E = this.env.clouds;
    const s = W.makeCloud(E.color || '#ffffff', E.opacity ?? 0.85);
    const sc = rand(60, 140); s.scale.set(sc, sc * 0.45, 1);
    const high = Math.random() < 0.7;
    s.position.set(rand(-260, 260), high ? rand(55, 110) : rand(20, 40), z);
    if (!high && Math.abs(s.position.x) < 60) s.position.x = Math.sign(s.position.x || 1) * rand(60, 200);
    this.scene.add(s);
    this.clouds.push({ s });
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
    const mk = { drone: M.makeDrone, dart: M.makeDart, mine: M.makeMine, splitter: M.makeSplitter, turret: M.makeTurret, tank: M.makeTank }[kind];
    const obj = mk();
    obj.position.set(x, y, z);
    const base = {
      drone: { hp: 1, r: 2.4, score: 10, fire: [3.2, 6.5], ship: true },
      dart: { hp: 1, r: 1.9, score: 15, fire: null, vz: 45, ship: true },
      mine: { hp: 2, r: 1.8, score: 5, fire: null, mine: true },
      splitter: { hp: 6, r: 3.6, score: 30, fire: [2.6, 4.2], split: true, ship: true },
      turret: { hp: 3, r: 2.0, score: 20, fire: [2.2, 3.6], ground: true },
      tank: { hp: 3, r: 2.4, score: 20, fire: [2.4, 4], ground: true, vx: rand(-3, 3) },
    }[kind];
    const e = this.addEnt({ kind, obj, enemy: true, ...base, bx: x, by: y, vz: base.vz || 0, ...opts });
    if (e.fire) e.fireT = rand(e.fire[0] * 0.4, e.fire[1]);
    return e;
  }

  wave(kind, form, n, o = {}) {
    const y = o.y ?? rand(this.bounds.yMin + 4, this.bounds.yMax - 4);
    const x = o.x ?? 0;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2;
      switch (form) {
        case 'line': this.spawnEnemy(kind, x + k * 7, y, SPAWN_Z, o); break;
        case 'vee': this.spawnEnemy(kind, x + k * 6.5, y + Math.abs(k) * 2, SPAWN_Z - Math.abs(k) * 10, o); break;
        case 'column': this.spawnEnemy(kind, x, y, SPAWN_Z - i * 14, o); break;
        case 'sine': this.spawnEnemy(kind, x, y, SPAWN_Z - i * 12, { ...o, path: (a) => [Math.sin(a * 1.6 + i * 0.5) * 10, Math.cos(a * 1.1 + i) * 2.5] }); break;
        case 'swoopL': case 'swoopR': {
          const s = form === 'swoopL' ? -1 : 1;
          this.spawnEnemy(kind, 0, y, SPAWN_Z * 0.5 - i * 9, { ...o, path: (a) => [s * 28 * Math.cos(Math.min(a * 0.9, Math.PI)), Math.sin(a * 1.7) * 3] });
          break;
        }
        case 'dive': this.spawnEnemy(kind, x + k * 6, y + 18, SPAWN_Z * 0.45 - i * 8, { ...o, path: (a) => [Math.sin(a * 0.8 + i) * 4, -Math.min(18, a * 9)] }); break;
        case 'hover': this.spawnEnemy(kind, x + k * 7, y + (i % 2) * 3, SPAWN_Z, { ...o, hoverZ: -55 - (i % 2) * 10, hoverT: o.hoverT ?? 5 }); break;
        default: this.spawnEnemy(kind, x + k * 5, y, SPAWN_Z, o);
      }
    }
  }

  spawnAsteroids(n, o = {}) {
    for (let i = 0; i < n; i++) {
      const r = rand(o.min || 1.5, o.max || 4.5);
      const obj = M.makeAsteroid(r);
      obj.position.set(rand(-this.bounds.x * 1.7, this.bounds.x * 1.7), rand(this.bounds.yMin * 1.4, this.bounds.yMax * 1.4), SPAWN_Z - rand(0, o.depth ?? 200));
      this.addEnt({ kind: 'asteroid', obj, enemy: true, obstacle: true, hp: Math.ceil(r), r: r * 0.95, score: 5, spin: V().set(rand(-1, 1), rand(-1, 1), rand(-1, 1)), vz: o.vz ?? 0 });
    }
  }

  // Großkreuzer im All mit Geschütztürmen
  spawnCruiser(side = 1) {
    const obj = M.makeCruiser();
    const x = side * 42, y = -6, z = SPAWN_Z - 40;
    obj.position.set(x, y, z);
    this.addEnt({ kind: 'cruiser', obj, decor: true, obstacle: true, boxes: [{ min: V().set(-12, -5, -26), max: V().set(12, 10, 25) }] });
    for (const dz of [-12, 4, 16]) this.spawnEnemy('turret', x - side * 6, y + 5, z + dz, { onShip: true });
  }

  spawnRing(x, y, gold = false) { const m = M.makeRing(gold); m.position.set(x, y, SPAWN_Z); this.addEnt({ kind: 'ring', obj: m, pickup: gold ? 'gold' : 'silver', r: 2.4 }); }
  spawnItem(kind, x, y) { const m = M.makeItem(kind); m.position.set(x, y, SPAWN_Z); this.addEnt({ kind: 'item', obj: m, pickup: kind, r: 2.4 }); }
  spawnRingAt(p, gold) { const m = M.makeRing(gold); m.position.copy(p); this.addEnt({ kind: 'ring', obj: m, pickup: gold ? 'gold' : 'silver', r: 2.6 }); }
  spawnItemAt(p, kind) { const m = M.makeItem(kind); m.position.copy(p); this.addEnt({ kind: 'item', obj: m, pickup: kind, r: 2.6 }); }

  // Flügelmann wird verfolgt – Spieler muss helfen
  chase(id) {
    const w = this.wing.find((w) => w.id === id && w.alive);
    if (!w || w.chaser) return;
    w.chaseT = 13;
    w.chaser = this.spawnEnemy('drone', 0, 8, -60, { vz: 0, chaser: w, hp: 2, score: 40, fire: null });
  }

  // ================= Gegnerschüsse =================
  fireBullet(from, dir, speed = 40, color = '#ff5a2a') {
    const b = this.bulletPool.spawn(from, dir.clone().multiplyScalar(speed), 6, color, { drag: 0, scroll: false });
    if (b) { b.bullet = true; b.dead = false; b.harmless = false; this.bullets.push(b); }
  }
  fireAimed(from, speed = 40, spread = 0, color) {
    tmp2.copy(this.p.pos).sub(from);
    tmp2.x += rand(-spread, spread); tmp2.y += rand(-spread, spread);
    this.fireBullet(from, tmp2.normalize(), speed, color);
  }
  fireFan(from, n, width, speed = 38, color) {
    const base = tmp2.copy(this.p.pos).sub(from).normalize().clone();
    for (let i = 0; i < n; i++) {
      const d = base.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (i - (n - 1) / 2) * width);
      this.fireBullet(from, d, speed, color);
    }
  }
  fireRing(from, n, speed = 28, color, twist = 0) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + twist;
      this.fireBullet(from, new THREE.Vector3(Math.cos(a) * 0.45, Math.sin(a) * 0.45, 1).normalize(), speed, color);
    }
  }

  // ================= Effekte =================
  explode(p, color = '#ffb060', size = 1) {
    const n = Math.floor(8 * size + 6);
    for (let i = 0; i < n; i++) {
      tmp.set(rand(-1, 1), rand(-1, 1), rand(-1, 1)).normalize().multiplyScalar(rand(6, 18) * Math.sqrt(size));
      this.sparks.spawn(p, tmp, rand(0.3, 0.7) * Math.min(2, size), Math.random() < 0.5 ? '#ffe0a0' : color, { drag: 2.5, g: 8 });
    }
    this.blast(p, '#ff7a2a', 5 * Math.sqrt(size), 0.55 + 0.15 * size);
    this.blast(p, '#ffe6b0', 2.6 * Math.sqrt(size), 0.3 + 0.08 * size);
    this.blast(p, '#3a3a3a', 6 * Math.sqrt(size), 1.0, true);
    audio.boom(size);
  }
  blast(p, color, size, life, smoke = false) {
    const b = this.blasts.find((b) => b.life <= 0) || this.blasts[0];
    b.s.position.copy(p); b.s.material.color.set(color); b.s.visible = true;
    b.s.material.blending = smoke ? THREE.NormalBlending : THREE.AdditiveBlending;
    b.life = b.max = life; b.size = size; b.smoke = smoke;
  }
  updateBlasts(dt, scroll) {
    for (const b of this.blasts) {
      if (b.life <= 0) continue;
      b.life -= dt;
      if (b.life <= 0) { b.s.visible = false; continue; }
      const k = 1 - b.life / b.max;
      b.s.scale.setScalar(b.size * (0.35 + 1.1 * Math.sqrt(k)));
      b.s.material.opacity = b.smoke ? 0.45 * (1 - k) * Math.min(1, k * 4) : Math.pow(1 - k, 1.4);
      b.s.position.z += scroll * dt * 0.5;
      if (b.smoke) b.s.position.y += dt * 2;
    }
  }

  // ================= Spieleraktionen =================
  shoot() {
    const p = this.p;
    const lvl = p.laser;
    const q = this.ship.quaternion;
    const origins = lvl >= 1 ? [[-1.1, -0.15], [1.1, -0.15]] : [[0, -0.1]];
    const dir = this.aimDir();
    for (const [ox, oy] of origins) {
      const mesh = new THREE.Mesh(this.laserGeo, this.laserMat[lvl >= 2 ? 1 : 0]);
      tmp.set(ox, oy, -2.5).applyQuaternion(q);
      mesh.position.copy(p.pos).add(tmp);
      mesh.lookAt(tmp.copy(mesh.position).add(dir));
      this.scene.add(mesh);
      this.lasers.push({ mesh, v: dir.clone().multiplyScalar(200), life: 1.1, dmg: lvl >= 2 ? 2 : 1 });
    }
    audio.laser(lvl);
  }
  aimDir() {
    const p = this.p;
    const aim = tmp.set(p.pos.x + p.vel.x * 0.9, p.pos.y + p.vel.y * 0.9, -60);
    let best = null, bestA = 0.16;
    const d0 = tmp2.copy(aim).sub(p.pos).normalize();
    for (const t of this.targets()) {
      if (t.z > -8 || t.z < -220) continue;
      const d = t.clone().sub(p.pos).normalize();
      const a = d.angleTo(d0);
      if (a < bestA) { bestA = a; best = d; }
    }
    const dir = d0.clone();
    if (best) dir.lerp(best, 0.7).normalize();
    return dir;
  }
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
    const obj = M.glowSprite('#7affb0', 3.4);
    obj.position.set(p.pos.x, p.pos.y, p.pos.z - 3);
    this.scene.add(obj);
    this.homers.push({ obj, v: V().set(0, 0, -95), target: p.lock, life: 2.6 });
    audio.homing();
  }
  roll(dir) {
    const p = this.p;
    if (p.rollCd > 0 || p.loop > 0) return;
    p.roll = 0.6; p.rollDir = dir || (p.vel.x >= 0 ? 1 : -1); p.rollCd = 0.9;
    audio.roll();
  }
  startLoop() {
    const p = this.p;
    if (p.loop > 0 || p.boostLock) return;
    p.loop = 1.3; p.loopY = p.pos.y; p.boost = Math.max(0, p.boost - 0.5);
    audio.boost();
  }
  bomb() {
    const p = this.p;
    if (p.bombs <= 0) return;
    p.bombs--;
    audio.bomb();
    const c = V().set(p.pos.x, p.pos.y, -45);
    for (let i = 0; i < 40; i++) this.sparks.spawn(c, tmp.set(rand(-1, 1), rand(-1, 1), rand(-0.3, 0.3)).normalize().multiplyScalar(rand(30, 60)), 1.0, i % 2 ? '#ffffff' : '#7affb0', { drag: 1.5 });
    this.blast(c, '#b0ffd0', 40, 0.7);
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
    this.explode(e.pos, e.kind === 'asteroid' ? '#c8a070' : '#ffb060', e.kind === 'splitter' ? 1.8 : e.kind === 'asteroid' ? 0.8 : 1);
    this.score += e.score || 0;
    if (e.kind !== 'asteroid') this.hits++;
    if (e.split) for (let i = 0; i < 3; i++) this.spawnEnemy('drone', e.pos.x + rand(-3, 3), e.pos.y + rand(-3, 3), e.pos.z - 2, { hoverZ: -40, hoverT: 3 });
    if (e.chaser) { e.chaser.chaser = null; this.ui.chaseSaved?.(e.chaser.id); }
    if (e.drop) (e.drop === 'gold' || e.drop === 'silver') ? this.spawnRingAt(e.pos, e.drop === 'gold') : this.spawnItemAt(e.pos, e.drop);
    this.ui.hud?.(this);
  }

  hurt(n) {
    const p = this.p;
    if (p.inv > 0 || !p.alive || p.loop > 0) return;
    p.shield = Math.max(0, p.shield - n);
    p.inv = 0.6;
    audio.hit();
    this.ui.hurt?.();
    this.shakeT = 0.25;
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
      if (this.goldRings === 3) { p.maxShield = 150; p.shield = 150; this.ui.say?.('oli', 'Drei Goldringe! Ich hab deine Schilde hochgedreht, Kira!'); }
    }
    if (e.pickup === 'laser') { p.laser = Math.min(2, p.laser + 1); audio.item(); this.ui.say?.('oli', p.laser === 1 ? 'Zwillingslaser online! Doppelt hält besser!' : 'Hyperlaser! Jetzt wird\'s heiß!'); }
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

    // Boost / Bremse / Looping
    let mul = 1;
    if (p.alive && running) {
      const inp = this.input;
      if (inp.boost && inp.y < -0.6 && !p.boostLock && p.loop <= 0) this.startLoop();
      if (p.loop <= 0 && !p.boostLock && (inp.boost || inp.brake)) {
        mul = inp.boost ? 1.75 : 0.5;
        p.boost -= dt * 0.55;
        if (p.boost <= 0) { p.boost = 0; p.boostLock = true; }
      } else if (p.loop <= 0) {
        p.boost = Math.min(1, p.boost + dt * 0.3);
        if (p.boostLock && p.boost >= 1) p.boostLock = false;
      }
      if (p.loop > 0) mul = 0.45;
    }
    p.speedMul += (mul - p.speedMul) * Math.min(1, dt * 4);
    const scroll = (this.state === 'clear' ? this.speed * 2.5 : this.speed * (this.state === 'boss' ? 0.7 : 1)) * p.speedMul;
    this.dist += scroll * dt;

    // Level-Ereignisse
    if (this.state === 'play') {
      this.t += dt * p.speedMul;
      const evs = this.level.events;
      while (this.evIdx < evs.length && evs[this.evIdx][0] <= this.t) { this.runEvent(evs[this.evIdx]); this.evIdx++; }
      const C = this.level.checkpoint;
      if (C && (!this.cp || this.cp.t < C) && this.t >= C) this.cp = { t: C, score: this.score, hits: this.hits, laser: p.laser };
    }

    // Welt
    this.terrain.update(scroll * dt, this.dist);
    this.fillProps(this.dist - PROP_Z);

    // Spieler bewegen
    let loopAng = 0;
    if (p.alive) {
      const inY = this.settings.invertY ? -this.input.y : this.input.y;
      const ctrl = p.loop > 0 ? 0 : 1;
      p.vel.x += (this.input.x * 24 * ctrl - p.vel.x) * Math.min(1, dt * 6);
      p.vel.y += (inY * 18 * ctrl - p.vel.y) * Math.min(1, dt * 6);
      p.pos.x = clamp(p.pos.x + p.vel.x * dt, -this.bounds.x, this.bounds.x);
      if (p.loop > 0) {
        p.loop -= dt;
        const k = 1 - Math.max(0, p.loop) / 1.3;
        loopAng = k * Math.PI * 2;
        p.pos.y = p.loopY + (1 - Math.cos(loopAng)) * 5;
        p.pos.z = -Math.sin(loopAng) * 6;
        if (p.loop <= 0) { p.pos.z = 0; loopAng = 0; }
      } else p.pos.y = clamp(p.pos.y + p.vel.y * dt, this.bounds.yMin, this.bounds.yMax);
      // Boden, Wasser, Canyonwände
      if (this.planet) {
        const g = this.groundAt(p.pos.x, 0);
        const minY = g + 1.7;
        if (p.pos.y < minY) {
          const deep = minY - p.pos.y;
          p.pos.y = minY;
          if (deep > 1.0) { this.hurt(10); p.vel.x = -Math.sign(p.pos.x || 1) * 16; p.vel.y = 10; }
        }
        // Gischt knapp über Wasser/Lava
        if (this.fluid && p.pos.y - this.fluid.position.y < 5 && g <= this.fluid.position.y + 0.1 && Math.random() < dt * 40 * p.speedMul) {
          const lava = this.fluid.userData.kind === 'lava';
          this.spray.spawn(tmp.set(p.pos.x + rand(-1, 1), this.fluid.position.y + 0.3, p.pos.z + 2), tmp2.set(rand(-4, 4), rand(4, 9), rand(10, 20)), rand(0.4, 0.8), lava ? '#ff8a3a' : '#f4fbff', { drag: 1, g: 18 });
        }
      }
      if (p.roll > 0) p.roll -= dt;
      if (p.rollCd > 0) p.rollCd -= dt;
      if (p.inv > 0) p.inv -= dt;
      const rollAng = p.roll > 0 ? (1 - p.roll / 0.6) * Math.PI * 2 * p.rollDir : 0;
      this.ship.position.copy(p.pos);
      this.ship.rotation.set(p.vel.y * 0.028 + loopAng, -p.vel.x * 0.012, -p.vel.x * 0.04 - rollAng, 'XYZ');
      this.ship.visible = !(p.inv > 0 && p.roll <= 0 && p.loop <= 0 && Math.floor(p.inv * 20) % 2 === 0);
      this.ship.userData.engine.scale.setScalar((1.6 + Math.random() * 0.5) * (0.6 + p.speedMul * 0.5));

      // Schießen
      if (running) {
        p.fireCd -= dt;
        const auto = this.settings.autofire;
        if (this.input.fire) {
          p.fireHold = (p.fireHold || 0) + dt;
          if (!auto && p.fireHold < 0.05 && p.fireCd <= 0) { this.shoot(); p.fireCd = 0.11; }
          if (p.fireHold > 0.35) {
            if (p.charge === 0) audio.charge();
            p.charge = Math.min(1, p.charge + dt * 1.6);
            if (p.charge >= 1) p.lock = this.findLock() || p.lock;
          }
        } else {
          if (p.fireHold > 0 && p.charge >= 1) this.fireHomer();
          else if (!auto && p.fireHold > 0 && p.fireHold < 0.35 && p.fireCd <= 0) { this.shoot(); p.fireCd = 0.11; }
          p.fireHold = 0; p.charge = 0; p.lock = null;
        }
        if (auto && p.charge === 0 && p.fireCd <= 0) { this.shoot(); p.fireCd = 0.14; }
        if (this.input.roll) { this.roll(this.input.x < -0.2 ? -1 : this.input.x > 0.2 ? 1 : 0); this.input.roll = false; }
        if (this.input.bomb) { this.bomb(); this.input.bomb = false; }
      }
    }

    // Fadenkreuz
    for (const r of this.reticle) {
      const d = r.userData.d;
      r.visible = p.alive && running && p.loop <= 0;
      r.position.set(p.pos.x + p.vel.x * 0.9 * (d / 60), p.pos.y + p.vel.y * 0.9 * (d / 60), -d);
      r.material.color.set(p.charge >= 1 ? '#ff5a7a' : '#7fffb0');
    }
    if (p.lock && p.charge >= 1) {
      const lp = p.lock.part ? p.lock.part.obj.getWorldPosition(V()) : p.lock.ent ? p.lock.ent.pos : p.lock;
      if ((p.lock.ent && p.lock.ent.dead) || (p.lock.part && !p.lock.part.alive)) { p.lock = null; this.lockMark.visible = false; }
      else { this.lockMark.visible = true; this.lockMark.position.copy(lp); this.lockMark.rotation.z += dt * 3; }
    } else this.lockMark.visible = false;

    // Kamera: dicht hinter dem Schiff, neigt sich mit
    const cam = this.camera;
    const portrait = window.innerWidth < window.innerHeight;
    const cx = p.pos.x * (portrait ? 0.8 : 0.6), cy = p.pos.y * 0.6 + (this.planet ? 4.2 : 2.8) + (portrait ? 1 : 0);
    cam.position.x += (cx - cam.position.x) * Math.min(1, dt * 5);
    cam.position.y += (cy - cam.position.y) * Math.min(1, dt * 5);
    cam.position.z = (portrait ? 15 : 12.5) + (p.speedMul - 1) * 2.5;
    cam.lookAt(p.pos.x * 0.8, p.pos.y * 0.75 + (this.planet ? 2 : 0.6), -40);
    cam.rotateZ(-p.vel.x * 0.006);
    const fov = this.baseFov + (p.speedMul - 1) * 12;
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov = fov; cam.updateProjectionMatrix(); }
    if (this.shakeT > 0) { this.shakeT -= dt; cam.position.x += rand(-0.4, 0.4); cam.position.y += rand(-0.4, 0.4); }

    // Himmel, Sonne und Schatten folgen
    if (this.sky) this.sky.position.copy(cam.position);
    if (this.mountains) this.mountains.position.set(cam.position.x, 0, cam.position.z);
    if (this.wall) { this.wall.position.x = cam.position.x; this.wall.material.map.offset.x += dt * 0.004; }
    if (this.fluid) {
      this.fluid.position.x = cam.position.x; this.fluid.position.z = cam.position.z - 300;
      const nm = this.fluid.material.normalMap; nm.offset.y += (scroll * dt) / (1800 / nm.repeat.y);
    }
    this.sun.position.copy(p.pos).addScaledVector(this.sunDir, 120);
    this.sun.target.position.set(p.pos.x, p.pos.y, p.pos.z - 20);
    for (const c of this.clouds) { c.s.position.z += scroll * dt * 0.9; if (c.s.position.z > 60) { this.scene.remove(c.s); c.dead = true; } }
    if (this.clouds.some((c) => c.dead)) { const n = this.clouds.filter((c) => c.dead).length; this.clouds = this.clouds.filter((c) => !c.dead); for (let i = 0; i < n; i++) this.addCloud(PROP_Z - rand(0, 80)); }

    // Staub scrollen
    if (this.starMat.opacity > 0) {
      const arr = this.stars.geometry.attributes.position.array;
      for (let i = 2; i < arr.length; i += 3) { arr[i] += scroll * dt * 1.3; if (arr[i] > 20) arr[i] -= 520; }
      this.stars.geometry.attributes.position.needsUpdate = true;
    }

    // Laser
    for (const l of this.lasers) {
      l.life -= dt;
      const a = this._la || (this._la = V());
      a.copy(l.mesh.position); a.z += (scroll + 45) * dt;
      l.mesh.position.addScaledVector(l.v, dt);
      if (l.life <= 0) { l.dead = true; continue; }
      const lp = l.mesh.position;
      const minZ = lp.z - 4, maxZ = a.z + 4;
      for (const e of this.ents) {
        if (e.dead || e.pickup) continue;
        if (e.enemy) {
          if (e.pos.z < minZ - e.r || e.pos.z > maxZ + e.r) continue;
          if (segDist2(a, lp, e.pos) < (e.r + 0.7) ** 2) { this.damage(e, l.dmg); l.dead = true; this.sparks.spawn(lp, tmp.set(0, 0, 5), 0.2, '#ffffff'); break; }
        } else if (e.boxes && e.pos.z > minZ - 30 && e.pos.z < maxZ + 30) {
          // Laser prallt an Gebäuden und Felsen ab
          for (const b of e.boxes) {
            const lx = lp.x - e.pos.x, ly = lp.y - e.pos.y, lz = lp.z - e.pos.z;
            if (lx > b.min.x && lx < b.max.x && ly > b.min.y && ly < b.max.y && lz > b.min.z - 2 && lz < b.max.z + 2) { l.dead = true; this.sparks.spawn(lp, tmp.set(0, 3, 5), 0.25, '#ffe0a0'); break; }
          }
          if (l.dead) break;
        }
      }
      if (!l.dead && this.planet && lp.y < this.groundAt(lp.x, lp.z)) { l.dead = true; this.sparks.spawn(lp, tmp.set(0, 4, 4), 0.3, '#ffe0a0'); }
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
      if (tp) { tmp.copy(tp).sub(h.obj.position).normalize().multiplyScalar(115); h.v.lerp(tmp, Math.min(1, dt * 6)); }
      h.obj.position.addScaledVector(h.v, dt);
      h.obj.material.rotation += dt * 10;
      this.sparks.spawn(h.obj.position, tmp.set(rand(-2, 2), rand(-2, 2), 8), 0.3, '#9affc0');
      let boom = h.life <= 0;
      for (const e of this.ents) if (e.enemy && !e.dead && e.pos.distanceTo(h.obj.position) < e.r + 1.5) boom = true;
      if (this.boss && this.boss.hitTest(h.obj.position, 2)) boom = true;
      if (boom) {
        h.dead = true;
        const c = h.obj.position;
        this.explode(c, '#7affb0', 2);
        let kills = 0;
        for (const e of this.ents) if (e.enemy && !e.dead && e.pos.distanceTo(c) < 11) { this.damage(e, 10); if (e.dead) kills++; }
        if (this.boss) for (const part of this.boss.parts) if (part.alive && part.obj.getWorldPosition(V()).distanceTo(c) < 11) this.boss.hit(part, 8, this);
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
        if (e.pos.z >= e.hoverZ && e.hoverLeft === undefined) e.hoverLeft = e.hoverT;
        if (e.hoverLeft !== undefined) {
          e.hoverLeft -= dt;
          if (e.hoverLeft > 0) { vz = 0; e.bx += Math.sin(e.age * 1.3) * dt * 4; }
          else { vz = -20; e.by += dt * 14; }
        }
      }
      e.pos.z += vz * dt;
      if (e.path) { const [px, py] = e.path(e.age); e.pos.x = e.bx + px; e.pos.y = e.by + py; }
      else if (e.hoverLeft !== undefined) { e.pos.x = e.bx; e.pos.y = e.by; }
      // Bodenfahrzeuge folgen dem Gelände
      if (e.ground && !e.onShip && this.planet) {
        if (e.vx) { e.pos.x += e.vx * dt; if (Math.abs(e.pos.x) > 20) e.vx *= -1; }
        e.pos.y = this.groundAt(e.pos.x, e.pos.z);
      }
      // Flieger halten Abstand zum Boden
      if (e.ship && this.planet && !e.chaser) { const g = this.groundAt(e.pos.x, e.pos.z) + 3; if (e.pos.y < g) { e.pos.y = g; e.by = Math.max(e.by, g); } }
      if (e.chaser) {
        const w = e.chaser;
        e.pos.lerp(tmp.copy(w.obj.position).add(tmp2.set(Math.sin(e.age * 3) * 2, 1, 7)), Math.min(1, dt * 4));
        e.obj.lookAt(w.obj.position);
        if (Math.random() < dt * 3) this.sparks.spawn(tmp.copy(e.pos), tmp2.set(0, 0, -60), 0.25, '#ff5a2a', { drag: 0 });
      }
      if (e.ship && !e.chaser) {
        const vx = (e.pos.x - (e.lx ?? e.pos.x)) / Math.max(dt, 1e-3); e.lx = e.pos.x;
        e.obj.rotation.z += (clamp(-vx * 0.05, -0.9, 0.9) - e.obj.rotation.z) * Math.min(1, dt * 5);
      }
      if (e.spin) { e.obj.rotation.x += e.spin.x * dt; e.obj.rotation.y += e.spin.y * dt; }
      if (e.obj.userData.spin) { e.obj.userData.spin.rotation.y += dt * 2; e.obj.userData.spin.rotation.x += dt * 1.2; }
      if (e.kind === 'dart' && !e.chaser) e.obj.lookAt(tmp.copy(e.pos).add(tmp2.set(0, 0, 1)));
      if (e.obj.userData.head && e.ground) e.obj.userData.head.lookAt(p.pos);
      if (e.mine && e.obj.userData.glow) e.obj.userData.glow.material.opacity = 0.4 + 0.4 * Math.sin(e.age * 10);
      // Schießen
      if (e.enemy && e.fire && running && p.alive && e.pos.z > -200 && e.pos.z < -20) {
        e.fireT -= dt;
        if (e.fireT <= 0) {
          const from = tmp.copy(e.pos); if (e.ground) from.y += 2;
          this.fireAimed(from, e.ground ? 36 : 32, 0.6);
          e.fireT = rand(e.fire[0], e.fire[1]) * (this.level.fireMul || 1);
        }
      }
      // Kollision mit dem Spieler
      if (p.alive && Math.abs(e.pos.z - p.pos.z) < 30) {
        if (e.pickup) { if (e.pos.distanceToSquared(p.pos) < (e.r + 1.4) ** 2) this.pickup(e); }
        else if (e.boxes) {
          for (const b of e.boxes) {
            const lx = p.pos.x - e.pos.x, ly = p.pos.y - e.pos.y, lz = p.pos.z - e.pos.z;
            if (lx > b.min.x - 1.2 && lx < b.max.x + 1.2 && ly > b.min.y - 0.6 && ly < b.max.y + 0.6 && lz > b.min.z - 1 && lz < b.max.z + 1) {
              this.hurt(15);
              const cxb = (b.min.x + b.max.x) / 2, side = lx < cxb ? -1 : 1;
              p.vel.x = side * 18; p.pos.x += side * 0.8;
              break;
            }
          }
          if (e.gate && !e.gateDone && e.pos.z > p.pos.z) {
            e.gateDone = true;
            if (Math.abs(p.pos.x - e.pos.x) < e.gate.span / 2 && p.pos.y > e.pos.y && p.pos.y - e.pos.y < e.gate.height) { this.score += 20; this.hits += 1; audio.ring(false); this.ui.bonus?.(0, 'Tor +20'); }
          }
        } else if (e.enemy && e.r && e.pos.distanceToSquared(p.pos) < (e.r + 1.0) ** 2) {
          this.hurt(e.mine ? 20 : e.obstacle ? 15 : 12);
          this.damage(e, e.mine || !e.obstacle ? 99 : 1);
        }
      }
      if (e.pos.z > KILL_Z) e.dead = true;
    }
    this.updateWing(dt);
    if (this.ents.some((e) => e.dead)) this.ents = this.ents.filter((e) => { if (e.dead) this.world.remove(e.obj); return !e.dead; });

    // Gegnerschüsse
    for (const b of this.bullets) {
      if (b.dead || b.life <= 0) { b.dead = true; continue; }
      if (b.harmless) continue;
      if (p.alive && Math.abs(b.p.z - p.pos.z) < 2 && b.p.distanceToSquared(p.pos) < 1.7 * 1.7) {
        if (p.roll > 0 || p.loop > 0) { b.v.multiplyScalar(-1.2); b.harmless = true; b.c.set('#80ff80'); audio.deflect(); }
        else { this.hurt(8); b.dead = true; b.life = 0; }
      }
    }
    this.bullets = this.bullets.filter((b) => !b.dead && b.life > 0);

    // Boss
    if (this.boss) {
      this.boss.update(dt, this);
      if (this.boss.defeated && this.state === 'boss') { this.state = 'clear'; this.clearTimer = 0; this.ui.bossBar?.(null); this.ui.bossDown?.(); }
      else if (this.state === 'boss') this.ui.bossBar?.(this.boss.hpFrac());
    }
    if (this.state === 'clear') {
      this.clearTimer += dt;
      if (this.clearTimer > 3.5 && !this.clearDone) { this.clearDone = true; this.ui.levelClear?.(); }
    }

    this.sparks.update(dt, scroll);
    this.spray.update(dt, scroll);
    this.updateBlasts(dt, scroll);
    this.bulletPool.update(dt, 0);
  }

  updateWing(dt) {
    const p = this.p;
    for (const w of this.wing) {
      if (!w.alive) { w.obj.visible = false; continue; }
      w.obj.visible = true;
      const t = this.t + ({ rasko: 0, oli: 2, hilde: 4 }[w.id] || 0);
      let tx = clamp(p.pos.x * 0.4 + w.off.x + Math.sin(t * 0.7) * 2, -24, 24);
      let ty = p.pos.y * 0.4 + w.off.y + Math.cos(t * 0.9) * 1.5 + (this.planet ? 4 : 0);
      let tz = w.off.z;
      if (w.chaser) {
        tx = Math.sin(t * 1.5) * 10; ty = p.pos.y + 3 + Math.sin(t * 2.3) * 3; tz = -38;
        w.chaseT -= dt;
        if (w.chaseT <= 0) { w.chaser.dead = true; this.world.remove(w.chaser.obj); w.chaser = null; this.ui.chaseFailed?.(w.id); }
      }
      if (this.planet) ty = Math.max(ty, this.groundAt(tx, tz) + 4);
      const o = w.obj.position;
      o.x += (tx - o.x) * Math.min(1, dt * 1.5);
      o.y += (ty - o.y) * Math.min(1, dt * 1.5);
      o.z += (tz - o.z) * Math.min(1, dt * 1.2);
      w.obj.rotation.z = -(tx - o.x) * 0.08;
      w.obj.userData.engine.scale.setScalar(1.4 + Math.random() * 0.4);
    }
  }

  // ================= Level-Ereignisse =================
  runEvent([, type, a = {}]) {
    switch (type) {
      case 'wave': this.wave(a.kind || 'drone', a.form || 'line', a.n || 3, a); break;
      case 'asteroids': this.spawnAsteroids(a.n || 6, a); break;
      case 'mines': for (let i = 0; i < (a.n || 4); i++) this.spawnEnemy('mine', rand(-this.bounds.x, this.bounds.x), rand(this.bounds.yMin + 3, this.bounds.yMax - 2), SPAWN_Z - rand(0, 120)); break;
      case 'tanks': for (let i = 0; i < (a.n || 2); i++) this.spawnEnemy('tank', rand(-14, 14), 0, SPAWN_Z - i * 25); break;
      case 'turrets': for (let i = 0; i < (a.n || 2); i++) this.spawnEnemy('turret', rand(-14, 14), 0, SPAWN_Z - i * 20); break;
      case 'cruiser': this.spawnCruiser(a.side || 1); break;
      case 'ring': this.spawnRing(a.x ?? 0, a.y ?? (this.bounds.yMin + this.bounds.yMax) / 2, a.gold); break;
      case 'item': this.spawnItem(a.kind, a.x ?? 0, a.y ?? (this.bounds.yMin + this.bounds.yMax) / 2); break;
      case 'say': this.ui.say?.(a.who, a.text); break;
      case 'tip': this.ui.tip?.(a.text); break;
      case 'chase': this.chase(a.who); this.ui.say?.(a.who, a.text); break;
      case 'warn': this.ui.warn?.(a.text); break;
      case 'env': this.envTo(a); break;
      case 'boss': this.startBoss(a.id); break;
    }
  }

  envTo(a) {
    const from = { dust: this.starMat.opacity, fog: this.scene.fog.color.clone(), sky: this.scene.backgroundIntensity, near: this.scene.fog.near, far: this.scene.fog.far };
    const to = { dust: a.dust ?? from.dust, fog: a.fog ? new THREE.Color(a.fog) : from.fog, sky: a.sky ?? from.sky, near: a.near ?? from.near, far: a.far ?? from.far };
    const dur = a.dur || 4;
    let k = 0;
    this.envAnim = (dt) => {
      k = Math.min(1, k + dt / dur);
      this.starMat.opacity = from.dust + (to.dust - from.dust) * k;
      this.scene.fog.color.copy(from.fog).lerp(to.fog, k);
      this.scene.backgroundIntensity = from.sky + (to.sky - from.sky) * k;
      this.scene.fog.near = from.near + (to.near - from.near) * k;
      this.scene.fog.far = from.far + (to.far - from.far) * k;
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

  // Zu einem Zeitpunkt im Level springen (Checkpoints, Tests)
  jumpTo(t) {
    this.clearWorld();
    this.t = t; this.dist = t * this.speed;
    this.evIdx = this.level.events.findIndex((e) => e[0] >= t);
    if (this.evIdx < 0) this.evIdx = this.level.events.length;
    this.terrain.reset(this.dist);
    this.nextProp = this.dist;
    this.fillProps(this.dist - PROP_Z);
    if (this.planet && this.env.clouds) for (let i = 0; i < this.env.clouds.n; i++) this.addCloud(rand(PROP_Z, 20));
    this.state = 'play';
  }

  // Automatische Grafikqualität: Auflösung (und notfalls Schatten) an die Bildrate anpassen
  adapt(dt) {
    const q = this.q || (this.q = { t: 0, n: 0, sum: 0, ratio: this.renderer.getPixelRatio(), max: this.renderer.getPixelRatio() });
    q.t += dt; q.n++; q.sum += dt;
    if (q.t < 2) return;
    const avg = q.sum / q.n;
    q.t = q.n = q.sum = 0;
    if (avg > 1 / 45 && q.ratio > 0.6) q.ratio = Math.max(0.6, q.ratio - 0.15);
    else if (avg > 1 / 45 && this.renderer.shadowMap.enabled) { this.renderer.shadowMap.enabled = false; this.scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; }); }
    else if (avg < 1 / 58 && q.ratio < q.max) q.ratio = Math.min(q.max, q.ratio + 0.1);
    else return;
    this.renderer.setPixelRatio(q.ratio);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  render(dt = 0.016) {
    this.adapt(dt);
    if (this.envAnim) this.envAnim(dt);
    this.renderer.render(this.scene, this.camera);
  }
}
