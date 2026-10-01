// SCHWARMSTURM – Spielkern
import * as THREE from '../../urlicht/js/three.module.min.js';
import * as M from './models.js';
import { WEAPONS } from './levels.js';
import { audio } from './audio.js';

const CAP = 220;          // sichtbare blaue Kämpfer (die Zahl darf größer sein)
const RED_CAP = 360;      // sichtbare rote Kämpfer gesamt
const HW = 6;             // halbe Straßenbreite
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const GOLD = 2.39996;
const slot = (i, s = 0.62) => { const r = s * Math.sqrt(i + 0.5), a = i * GOLD; return [Math.cos(a) * r, Math.sin(a) * r]; };

export class Game {
  constructor(canvas, ui) {
    this.ui = ui;
    const touch = 'ontouchstart' in window;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !touch, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, touch ? 1.25 : 2));
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.ui.contextLost?.(); });
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog('#bfe2ff', 60, 150);
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.5, 400);
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#6a7a90', 1.1));
    const sun = new THREE.DirectionalLight('#fff4e0', 1.6); sun.position.set(-5, 12, 6); this.scene.add(sun);

    // Kämpfer als Instanzen: ein Draw-Call für alle
    this.blue = new THREE.InstancedMesh(M.unitGeo('blue'), M.vmat(), CAP);
    this.red = new THREE.InstancedMesh(M.unitGeo('red'), M.vmat(), RED_CAP);
    for (const m of [this.blue, this.red]) { m.frustumCulled = false; m.count = 0; this.scene.add(m); }
    // Schatten-Fleck unter der Truppe
    const sh = document.createElement('canvas'); sh.width = sh.height = 64;
    const sx = sh.getContext('2d'); const g = sx.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = g; sx.fillRect(0, 0, 64, 64);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.03; this.scene.add(this.shadow);
    // Geschosse
    this.bulletGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.8, 5); this.bulletGeo.rotateX(Math.PI / 2);
    this.bulletMesh = new THREE.InstancedMesh(this.bulletGeo, new THREE.MeshBasicMaterial({ color: '#ffffff' }), 300);
    this.bulletMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(300 * 3), 3);
    this.bulletMesh.frustumCulled = false; this.bulletMesh.count = 0; this.scene.add(this.bulletMesh);
    // Partikel (Treffer, Plopp, Konfetti)
    this.pN = 500;
    this.pPos = new Float32Array(this.pN * 3); this.pCol = new Float32Array(this.pN * 3);
    this.parts = Array.from({ length: this.pN }, () => ({ life: 0 }));
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(this.pCol, 3));
    this.points = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.35, vertexColors: true }));
    this.points.frustumCulled = false; this.scene.add(this.points);
    this.pi = 0;
    this.world = new THREE.Group(); this.scene.add(this.world);
    this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.v = new THREE.Vector3(); this.s1 = new THREE.Vector3(1, 1, 1);
    this.state = 'idle';
    this.input = { x: null };
    this.t = 0;
    this.resize();
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 68 : 48;
    this.camera.updateProjectionMatrix();
  }

  // ================= Level aufbauen =================
  load(L, up) {
    this.L = L; this.up = up;
    const T = M.THEMES[L.theme];
    this.theme = T;
    this.world.clear();
    this.scene.background = new THREE.Color(T.sky);
    this.scene.fog.color.set(T.fog);
    const len = L.length + 90;
    this.end = -L.length;
    // Wasser/Sand/Lava
    const wt = M.waterTexture(T);
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(400, len + 300), T.emissiveWater ? new THREE.MeshBasicMaterial({ map: wt }) : new THREE.MeshLambertMaterial({ map: wt }));
    this.water.rotation.x = -Math.PI / 2; this.water.position.set(0, -3, -len / 2 + 60); this.world.add(this.water);
    // Straße in Abschnitten (Engstellen sind schmaler)
    this.segs = [];
    const narrows = L.items.filter((it) => it.type === 'narrow').map((it) => [it.z, it.z - it.len]);
    let z = 40;
    const cuts = [];
    for (const [a, b] of narrows) cuts.push([a, b]);
    cuts.sort((p, q) => q[0] - p[0]);
    for (const [a, b] of cuts) { this.segs.push({ z0: z, z1: a, hw: HW }); this.segs.push({ z0: a, z1: b, hw: 2.4 }); z = b; }
    this.segs.push({ z0: z, z1: -len, hw: HW });
    const rt = M.roadTexture(T);
    const railMat = T.neon ? M.basic(T.rail) : M.mat(T.rail);
    for (const s of this.segs) {
      const l = s.z0 - s.z1, w = s.hw * 2;
      const tex = rt.clone(); tex.needsUpdate = true; tex.repeat.set(1, l / 10);
      const road = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, l), [M.mat(T.side), M.mat(T.side), new THREE.MeshLambertMaterial({ map: tex }), M.mat(T.side), M.mat(T.side), M.mat(T.side)]);
      road.position.set(0, -0.3, (s.z0 + s.z1) / 2); this.world.add(road);
      for (const sd of [-1, 1]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, l), railMat); rail.position.set(sd * (s.hw + 0.12), 0.35, (s.z0 + s.z1) / 2); this.world.add(rail);
      }
      for (let pz = s.z0 - 5; pz > s.z1; pz -= 18) for (const sd of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3, 0.8), M.mat(T.side)); p.position.set(sd * (s.hw - 0.6), -1.9, pz); this.world.add(p); }
    }
    // Ziellinie
    const fin = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2, 2), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
    fin.rotation.x = -Math.PI / 2; fin.position.set(0, 0.02, this.end + 6); this.world.add(fin);

    // Objekte
    this.objs = [];
    this.hordes = [];
    for (const it of L.items) this.spawn(it);
    // Boss
    this.spawnBoss(L.boss);

    // Truppe
    this.n = 10 + (up.start || 0) * 3;
    this.cx = 0; this.cz = 0; this.speed = 8.5;
    this.units = [];
    this.syncUnits();
    for (const u of this.units) { u.x = u.tx; u.z = u.tz; }
    this.weapon = 'pistol';
    this.fireAcc = 0;
    this.bullets = [];
    this.shells = [];
    this.coinsRun = 0;
    this.kills = 0;
    this.t = 0;
    this.clash = null;
    this.state = 'ready';
    this.camera.position.set(0, 15, 13);
    this.ui.hud?.(this);
  }

  segAt(z) { for (const s of this.segs) if (z <= s.z0 && z > s.z1) return s; return this.segs[this.segs.length - 1]; }

  spawn(it) {
    const add = (o) => { this.world.add(o.obj); this.objs.push(o); return o; };
    switch (it.type) {
      case 'gates': {
        const g = new THREE.Group();
        for (const [side, op] of [[-1, it.left], [1, it.right]]) {
          const good = op[0] === '+' || op[0] === '×';
          const p = M.gatePanel(op, good, HW - 0.3); p.position.x = side * HW / 2; g.add(p);
        }
        g.position.z = it.z;
        add({ type: 'gates', obj: g, z: it.z, left: it.left, right: it.right, done: false });
        break;
      }
      case 'horde': {
        const h = { type: 'horde', z: it.z, x: it.x || 0, n: it.n, acc: 0, label: M.labelSprite(String(it.n), { bg: 'rgba(200,30,40,0.9)', w: 3.4 }), offs: [], active: false };
        h.obj = new THREE.Group(); h.obj.add(h.label); h.obj.position.set(h.x, 0, h.z); h.label.position.y = 2.8; this.world.add(h.obj);
        this.hordes.push(h); this.objs.push(h);
        break;
      }
      case 'barrels': {
        const xs = it.n === 1 ? [it.x ?? 0] : it.n === 2 ? [-2.5, 2.5] : [-3.8, 0, 3.8];
        for (const x of xs) {
          const o = M.barrel(); o.position.set(x, 0, it.z);
          const lab = M.labelSprite(String(it.hp), { w: 3 }); lab.position.y = 3.2; o.add(lab);
          add({ type: 'block', obj: o, z: it.z, x, w: 1.1, hp: it.hp, max: it.hp, label: lab });
        }
        break;
      }
      case 'wall': {
        const o = M.wall(HW * 2); o.position.z = it.z;
        const lab = M.labelSprite(String(it.hp), { w: 3.4 }); lab.position.y = 3.6; o.add(lab);
        add({ type: 'block', wall: true, obj: o, z: it.z, x: 0, w: HW, hp: it.hp, max: it.hp, label: lab });
        break;
      }
      case 'crate': {
        const o = M.crate(it.weapon); o.position.set(it.x, 0, it.z);
        const lab = M.labelSprite(String(it.hp), { w: 3 }); lab.position.y = 1.7; lab.position.z = 1.3; o.add(lab);
        add({ type: 'block', crate: it.weapon, obj: o, z: it.z, x: it.x, w: 1.2, hp: it.hp, max: it.hp, label: lab });
        break;
      }
      case 'saw': {
        const o = M.saw(); o.position.z = it.z;
        const track = new THREE.Mesh(new THREE.BoxGeometry(HW * 2 - 0.5, 0.05, 0.6), M.mat('#3a3a40')); track.position.set(0, 0.03, it.z); this.world.add(track);
        add({ type: 'saw', obj: o, z: it.z, speed: it.speed, ph: Math.random() * 6 });
        break;
      }
      case 'hammer': {
        const o = M.hammer(); o.position.set(it.x, 0, it.z);
        const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 24), new THREE.MeshBasicMaterial({ color: '#ff3a3a', transparent: true, opacity: 0.5, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; o.add(ring);
        add({ type: 'hammer', obj: o, z: it.z, x: it.x, ph: Math.random(), ring, hit: false });
        break;
      }
      case 'narrow': {
        const lab = M.labelSprite('ENG!', { fg: '#ffe08a', w: 3 }); lab.position.set(0, 3, it.z + 2);
        this.world.add(lab);
        break;
      }
      case 'plus': {
        for (let k = 0; k < it.n; k++) {
          const z = it.z - k * 2;
          const o = M.plusTile(3.6); o.position.set(it.side * 3.6, 0, z);
          add({ type: 'plus', obj: o, z, x: it.side * 3.6, done: false });
        }
        break;
      }
      case 'tower': {
        const o = M.tower(); const x = it.side * 4.4; o.position.set(x, 0, it.z);
        const lab = M.labelSprite(String(it.hp), { w: 3 }); lab.position.y = 6.2; o.add(lab);
        const shooters = new THREE.InstancedMesh(M.unitGeo('red'), M.vmat(), 2);
        for (let k = 0; k < 2; k++) { this.m4.compose(this.v.set(k ? 0.5 : -0.5, 3.3, 0), this.q.identity(), this.s1); shooters.setMatrixAt(k, this.m4); }
        o.add(shooters);
        add({ type: 'block', tower: true, obj: o, z: it.z, x, w: 1.6, hp: it.hp, max: it.hp, label: lab, fireT: rand(0.5, 1.5) });
        break;
      }
    }
  }

  spawnBoss(B) {
    const make = { brute: M.brute, tank: M.tankBoss, golem: M.golem }[B.type];
    const obj = make();
    const sc = (B.mega ? 1.3 : 1) * { brute: 2, tank: 1.5, golem: 1.8 }[B.type];
    obj.scale.setScalar(sc);
    // eigenes Material für das Aufblitzen bei Treffern
    obj.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshLambertMaterial({ vertexColors: true }); });
    obj.position.set(0, 0, this.end - 16);
    this.world.add(obj);
    this.boss = { ...B, obj, hp: B.hp, max: B.hp, z: this.end - 16, x: 0, r: { brute: 1.3, tank: 2.4, golem: 1.5 }[B.type] * sc, atkT: 2, flash: 0, alive: true };
  }

  // ================= Truppe =================
  syncUnits() {
    const want = Math.min(Math.max(0, Math.round(this.n)), CAP);
    while (this.units.length < want) { const s = slot(this.units.length); this.units.push({ x: this.cx + rand(-0.3, 0.3), z: this.cz + rand(-0.3, 0.3), y: 0, tx: 0, tz: 0, ox: s[0], oz: s[1], ph: Math.random() * 6, fall: 0 }); }
    while (this.units.length > want) { const u = this.units.pop(); this.puff(u.x, 0.8, u.z, '#3a8aff', 4); }
    // Plätze neu verteilen, damit die Formation kompakt bleibt
    this.units.forEach((u, i) => { const s = slot(i); u.ox = s[0]; u.oz = s[1]; });
    this.R = 0.62 * Math.sqrt(this.units.length + 0.5);
  }
  addUnits(k) { this.n += k; this.syncUnits(); this.ui.hud?.(this); }
  loseUnits(k, sound = true) {
    if (k <= 0) return;
    this.n = Math.max(0, this.n - k);
    if (sound) audio.pop();
    this.syncUnits();
    this.ui.hud?.(this);
    if (this.n <= 0 && this.state !== 'lose') this.lose();
  }
  // Einzelnen sichtbaren Kämpfer töten (Säge, Hammer, Absturz)
  killUnit(idx, color = '#3a8aff') {
    const u = this.units[idx];
    if (!u) return;
    this.puff(u.x, 0.8, u.z, color, 6);
    this.units.splice(idx, 1);
    this.dirty = true;
    this.n = Math.max(0, this.n - 1);
    audio.pop();
  }

  // ================= Effekte =================
  puff(x, y, z, color, n = 6, sp = 4) {
    const c = new THREE.Color(color);
    for (let k = 0; k < n; k++) {
      const p = this.parts[this.pi]; this.pi = (this.pi + 1) % this.pN;
      p.life = p.max = rand(0.35, 0.7); p.x = x; p.y = y; p.z = z; p.vx = rand(-sp, sp); p.vy = rand(1, sp * 1.5); p.vz = rand(-sp, sp); p.c = c;
    }
  }

  // ================= Schießen =================
  fire(dt) {
    const W = WEAPONS[this.weapon];
    const up = this.up;
    const n = this.units.length;
    if (!n) return;
    // Mehr Kämpfer = mehr Schüsse, mit sanft abflachender Kurve
    const perSec = W.rate * (1.4 + Math.sqrt(this.n) * 0.9) * (1 + (up.rate || 0) * 0.1);
    this.fireAcc += perSec * dt;
    const dmg = W.dmg * (1 + (up.power || 0) * 0.15);
    let shots = 0;
    while (this.fireAcc >= 1) {
      this.fireAcc -= 1;
      // Schütze aus der vorderen Hälfte
      const u = this.units[Math.floor(Math.random() * Math.min(n, 30))];
      for (let k = 0; k < W.pellets; k++) {
        if (this.bullets.length >= 300) break;
        const a = (W.pellets > 1 ? (k / (W.pellets - 1) - 0.5) * W.spread * 2 : rand(-W.spread, W.spread));
        this.bullets.push({ x: u.x, y: 1.0, z: u.z - 0.6, vx: Math.sin(a) * W.speed, vz: -Math.cos(a) * W.speed, life: 1.4, dmg, W, hits: new Set() });
      }
      shots++;
    }
    if (shots) audio.shot(this.weapon);
  }

  hitTarget(b, o, x, z) {
    const W = b.W;
    if (W.splash) {
      this.boomAt(x, z, W.splash, b.dmg);
      return true;
    }
    this.damage(o, b.dmg, x, z);
    return !W.pierce;
  }
  boomAt(x, z, r, dmg) {
    this.puff(x, 1, z, '#ff9a3a', 16, 7);
    audio.boom(0.6);
    for (const o of this.objs) {
      if (o.dead) continue;
      if (o.type === 'horde' && o.n > 0 && Math.hypot(o.x - x, o.z - z) < r + o.R) this.damage(o, dmg * 2, x, z);
      if (o.type === 'block' && Math.abs(o.z - z) < r && Math.abs(o.x - x) < r + o.w) this.damage(o, dmg, x, z);
    }
    if (this.boss.alive && Math.hypot(this.boss.x - x, this.boss.z - z) < r + this.boss.r) this.damage(this.boss, dmg, x, z);
  }
  damage(o, d, x, z) {
    if (o === this.boss) {
      o.hp -= d; if (o.flash <= -0.15) o.flash = 0.06;
      this.puff(x, 2.5, z, '#ffd23a', 2);
      audio.hit();
      if (o.hp <= 0 && o.alive) this.killBoss();
      return;
    }
    if (o.type === 'horde') {
      o.acc += d;
      let k = Math.floor(o.acc); o.acc -= k;
      k = Math.min(k, o.n);
      if (k > 0) { o.n -= k; this.kills += k; this.puff(x, 1, z, '#ff4a4a', 3 * k); audio.pop(); o.label.userData.set(String(o.n), '#ffffff', 'rgba(200,30,40,0.9)'); }
      if (o.n <= 0) { o.dead = true; o.label.visible = false; }
      return;
    }
    if (o.type === 'block') {
      o.hp -= d;
      this.puff(x, 1.4, z, o.wall ? '#c8784a' : '#ffd23a', 2);
      audio.hit();
      o.label.userData.set(String(Math.max(0, Math.ceil(o.hp))));
      if (o.hp <= 0) this.breakBlock(o);
    }
  }
  breakBlock(o) {
    o.dead = true;
    this.world.remove(o.obj);
    this.puff(o.x, 1, o.z, o.wall ? '#c8784a' : o.crate ? '#a8743a' : '#e04a2a', 24, 6);
    audio.boom(0.8);
    this.coinsRun += o.tower ? 5 : 2;
    if (o.crate) {
      this.weapon = o.crate;
      audio.weapon();
      this.ui.weapon?.(o.crate);
    }
    this.ui.hud?.(this);
  }

  killBoss() {
    const B = this.boss;
    B.alive = false;
    for (let i = 0; i < 6; i++) setTimeout(() => this.puff(B.x + rand(-2, 2), rand(1, 5), B.z + rand(-2, 2), i % 2 ? '#ffd23a' : '#ff6a3a', 30, 8), i * 120);
    audio.boom(2);
    this.coinsRun += 30 + this.L.index * 6;
    this.state = 'win';
    this.winT = 0;
    this.ui.bossBar?.(null);
    setTimeout(() => this.ui.win?.(), 1800);
  }
  lose() {
    this.state = 'lose';
    audio.lose();
    setTimeout(() => this.ui.lose?.(), 900);
  }

  // ================= Hauptschleife =================
  update(dt) {
    dt = Math.min(0.05, Math.max(0, dt));
    this.t += dt;
    const st = this.state;
    if (st === 'idle' || st === 'pause') return;
    const running = st === 'run' || st === 'boss';
    const T = this.t;

    // Steuerung: Zielposition der Truppe
    // Große Truppen drängen sich zusammen, damit sie auf die Brücke passen
    this.sq = Math.min(1, (HW - 0.6) / Math.max(0.01, this.R));
    const seg = this.segAt(this.cz - this.R * 0.5);
    const lim = Math.max(0.3, seg.hw - this.R * this.sq * 0.55);
    if (running && this.input.x !== null) this.cx += (clamp(this.input.x, -HW, HW) - this.cx) * Math.min(1, dt * 10);
    this.cx = clamp(this.cx, -lim, lim);

    // Vorwärts (außer im Nahkampf oder am Boss)
    if (running && !this.clash) {
      const stop = this.end + 2;
      if (this.cz > stop) this.cz = Math.max(stop, this.cz - this.speed * dt);
      if (this.cz <= this.end + 30 && st === 'run') { this.state = 'boss'; audio.play('boss'); this.ui.bossBar?.(1, this.boss.name); }
    }
    if (st === 'ready') this.cz += 0;

    // Kämpfer bewegen
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      u.tx = this.cx + u.ox * this.sq; u.tz = this.cz + u.oz * Math.max(0.75, this.sq);
      if (u.fall > 0) { u.fall += dt; u.y -= dt * (6 + u.fall * 20); continue; }
      u.x += (u.tx - u.x) * Math.min(1, dt * 7);
      u.z += (u.tz - u.z) * Math.min(1, dt * 7);
      // Wer über den Rand läuft, fällt
      const s = this.segAt(u.z);
      if (Math.abs(u.x) > s.hw + 0.15) { u.fall = 0.01; }
    }
    for (let i = this.units.length - 1; i >= 0; i--) if (this.units[i].fall > 0.6) { this.units.splice(i, 1); this.n = Math.max(0, this.n - 1); audio.pop(); if (this.n <= 0) this.lose(); }
    if (this.units.length < Math.min(this.n, CAP)) this.syncUnits();

    // Objekte
    const front = this.cz - this.R;
    for (const o of this.objs) {
      if (o.dead) continue;
      if (o.z > this.cz + 20) { if (o.type !== 'horde') { this.world.remove(o.obj); o.dead = true; } continue; }
      if (o.z < this.cz - 140) continue;
      switch (o.type) {
        case 'gates':
          if (!o.done && this.cz < o.z) {
            o.done = true;
            const op = this.cx < 0 ? o.left : o.right;
            const v = parseInt(op.slice(1), 10);
            const before = this.n;
            if (op[0] === '+') this.n += v; else if (op[0] === '×') this.n *= v; else if (op[0] === '−') this.n -= v; else this.n = Math.ceil(this.n / v);
            const good = this.n >= before;
            audio.gate(good);
            this.ui.float?.(op, good);
            o.obj.children.forEach((p, k) => { if ((k === 0) !== (this.cx < 0)) p.visible = false; });
            if (this.n <= 0) { this.n = 0; this.syncUnits(); this.lose(); } else this.syncUnits();
            this.ui.hud?.(this);
          }
          break;
        case 'plus':
          if (!o.done && this.cz < o.z) { o.done = true; if (Math.abs(this.cx - o.x) < 2.6) { this.addUnits(1); audio.plus(); o.obj.position.y = -0.2; } }
          break;
        case 'block':
          if (o.tower && running && o.z < this.cz - 6 && o.z > this.cz - 55) {
            o.fireT -= dt;
            if (o.fireT <= 0) { o.fireT = 1.5; this.shells.push({ x: o.x, y: 3.6, z: o.z, tx: this.cx, tz: this.cz, t: 0, dur: 0.9, kill: 2, color: '#ff4a4a' }); audio.shot('pistol'); }
          }
          // Zusammenstoß: Kämpfer opfern sich am Hindernis
          if (front < o.z + 0.8 && this.cz + this.R > o.z) {
            for (let i = this.units.length - 1; i >= 0 && o.hp > 0; i--) {
              const u = this.units[i];
              if (Math.abs(u.x - o.x) < o.w + 0.4 && Math.abs(u.z - o.z) < 0.9) { this.killUnit(i); o.hp -= 1; }
            }
            if (o.wall && o.hp > 0 && this.units.length === 0 && this.n > 0) { const k = Math.min(this.n, Math.ceil(o.hp)); o.hp -= k; this.loseUnits(k); }
            o.label.userData.set(String(Math.max(0, Math.ceil(o.hp))));
            if (o.hp <= 0) this.breakBlock(o);
            if (this.n <= 0 && this.state !== 'lose') this.lose();
          }
          if (o.crate && o.obj.userData.gun) o.obj.userData.gun.rotation.y += dt * 2;
          break;
        case 'saw': {
          const x = Math.sin(T * o.speed + o.ph) * (HW - 1.4);
          o.obj.position.x = x;
          o.obj.userData.blade.rotation.y += dt * 14;
          if (Math.abs(o.z - this.cz) < this.R + 2) for (let i = this.units.length - 1; i >= 0; i--) { const u = this.units[i]; if (Math.hypot(u.x - x, u.z - o.z) < 1.35) this.killUnit(i); }
          break;
        }
        case 'hammer': {
          const per = 2.4, k = ((T / per) + o.ph) % 1;
          // ausholen, dann zuschlagen
          const ang = k < 0.75 ? -1.3 * (k / 0.75) : -1.3 + 1.3 * Math.min(1, (k - 0.75) / 0.08);
          o.obj.userData.arm.rotation.x = ang;
          o.ring.material.opacity = k > 0.6 && k < 0.83 ? 0.85 : 0.35;
          const slam = k >= 0.83 && k < 0.9;
          if (slam && !o.hit) {
            o.hit = true;
            if (Math.abs(o.z - this.cz) < 20) { audio.slam(); this.puff(o.x, 0.3, o.z, '#d8d8d8', 14, 5); }
            for (let i = this.units.length - 1; i >= 0; i--) { const u = this.units[i]; if (Math.hypot(u.x - o.x, u.z - o.z) < 2.1) this.killUnit(i); }
          }
          if (!slam) o.hit = false;
          break;
        }
        case 'horde': this.updateHorde(o, dt, running); break;
      }
    }
    if (this.dirty || this.units.length < Math.min(this.n, CAP)) { this.dirty = false; this.syncUnits(); this.ui.hud?.(this); }
    if (this.n <= 0 && this.state !== 'lose' && running) this.lose();

    // Turm- und Panzergranaten
    for (const s of this.shells) {
      s.t += dt / s.dur;
      if (s.t >= 1 && !s.done) {
        s.done = true;
        this.puff(s.tx, 0.5, s.tz, s.color, 12, 4);
        let killed = 0;
        for (let i = this.units.length - 1; i >= 0 && killed < s.kill; i--) { const u = this.units[i]; if (Math.hypot(u.x - s.tx, u.z - s.tz) < 2.2) { this.killUnit(i); killed++; } }
        if (killed < s.kill && this.n > CAP) this.loseUnits(s.kill - killed);
        if (this.n <= 0 && this.state !== 'lose') this.lose();
      }
    }
    this.shells = this.shells.filter((s) => !s.done);

    // Boss
    if (this.state === 'boss' || this.state === 'run') this.updateBoss(dt);

    // Schießen
    if (running && this.n > 0) this.fire(dt);
    for (const b of this.bullets) {
      b.life -= dt;
      b.x += b.vx * dt; b.z += b.vz * dt;
      if (b.life <= 0 || Math.abs(b.x) > HW + 4) { b.dead = true; continue; }
      for (const o of this.objs) {
        if (o.dead || b.hits.has(o)) continue;
        if (o.type === 'horde') {
          if (o.n > 0 && o.active !== 'far' && Math.abs(b.z - o.z) < o.R + 0.5 && Math.abs(b.x - o.x) < o.R + 0.3) { b.hits.add(o); if (this.hitTarget(b, o, b.x, b.z)) { b.dead = true; break; } }
        } else if (o.type === 'block') {
          if (Math.abs(b.z - o.z) < 0.9 && Math.abs(b.x - o.x) < o.w + 0.2) { b.hits.add(o); if (this.hitTarget(b, o, b.x, o.z)) { b.dead = true; break; } }
        }
      }
      const B = this.boss;
      if (!b.dead && B.alive && Math.abs(b.z - B.z) < B.r && Math.abs(b.x - B.x) < B.r) { b.hits.add(B); if (this.hitTarget(b, B, b.x, b.z)) b.dead = true; }
    }
    this.bullets = this.bullets.filter((b) => !b.dead);

    // Sieg-Jubel
    if (this.state === 'win') { this.winT += dt; if (Math.random() < dt * 8) this.puff(this.cx + rand(-4, 4), 4, this.cz - rand(2, 8), ['#ff4ad0', '#ffd23a', '#4af0ff', '#7aff7a'][Math.floor(Math.random() * 4)], 6, 4); }

    this.draw(dt);
  }

  updateHorde(h, dt, running) {
    if (h.n <= 0) return;
    // Formation der roten Kämpfer
    const vis = Math.min(h.n, 120);
    h.R = 0.62 * Math.sqrt(vis + 0.5);
    const dz = this.cz - h.z;
    if (running && dz < 0 && dz > -26 && !this.clash) { h.active = true; }
    if (h.active && !this.clash && running) h.z += 6 * dt;
    h.x += (this.cx - h.x) * Math.min(1, dt * (h.active ? 1.2 : 0));
    h.label.position.set(0, 2.6 + h.R * 0.15, 0);
    h.obj.position.set(h.x, 0, h.z);
    // Zusammenprall
    const gap = (this.cz - this.R) - (h.z + h.R);
    if (running && gap < 0.4 && this.n > 0) {
      this.clash = h;
      h.cacc = (h.cacc || 0) + dt * (18 + Math.min(h.n, this.n) * 0.6);
      let k = Math.floor(h.cacc); h.cacc -= k;
      k = Math.min(k, h.n, Math.max(1, Math.round(this.n)));
      if (k > 0) {
        h.n -= k; this.kills += k;
        this.loseUnits(k, false);
        audio.pop();
        this.puff(this.cx, 1, this.cz - this.R, '#ff4a4a', k * 2); this.puff(this.cx, 1, this.cz - this.R, '#3a8aff', k * 2);
        h.label.userData.set(String(h.n), '#ffffff', 'rgba(200,30,40,0.9)');
      }
      if (h.n <= 0) { h.dead = true; h.label.visible = false; this.clash = null; this.coinsRun += 3; }
    } else if (this.clash === h) this.clash = null;
  }

  updateBoss(dt) {
    const B = this.boss;
    if (!B.alive) return;
    B.flash -= dt;
    const fl = B.flash > 0;
    if (fl !== B.fl) { B.fl = fl; B.obj.traverse((o) => { if (o.isMesh) o.material.emissive.set(fl ? '#5a2020' : '#000000'); }); }
    if (this.state !== 'boss') return;
    const front = this.cz - this.R;
    const dist = front - (B.z + B.r);
    B.atkT -= dt;
    B.x += (this.cx * 0.6 - B.x) * Math.min(1, dt * 0.8);
    B.obj.position.x = B.x;
    if (B.type === 'tank') {
      if (dist > 12) B.z += 2 * dt;
      B.obj.userData.turret.rotation.y = Math.atan2(this.cx - B.x, this.cz - B.z);
      if (B.atkT <= 0) { B.atkT = B.mega ? 1.1 : 1.5; this.shells.push({ x: B.x, y: 3, z: B.z, tx: this.cx + rand(-1.5, 1.5), tz: this.cz + rand(-1, 1), t: 0, dur: 0.8, kill: 3 + Math.floor(this.L.index / 3), color: '#ff7a2a' }); audio.boom(0.5); }
    } else {
      if (dist > 0.5) B.z += (B.type === 'golem' ? 1.6 : 2.2) * dt;
      B.obj.position.y = Math.abs(Math.sin(this.t * 5)) * 0.15;
      const arm = B.obj.userData.arm;
      if (dist <= 1.2) {
        const k = 1 - Math.max(0, B.atkT) / 1.3;
        arm.rotation.x = -1.4 + k * 2.4;
        if (B.atkT <= 0) {
          B.atkT = 1.3;
          audio.slam();
          const kill = (B.type === 'golem' ? 7 : 5) + Math.floor(this.L.index / 2) + (B.mega ? 4 : 0);
          this.puff(B.x, 0.4, front, '#d8d8d8', 20, 6);
          let killed = 0;
          for (let i = this.units.length - 1; i >= 0 && killed < kill; i--) { const u = this.units[i]; if (u.z < this.cz - this.R * 0.2) { this.killUnit(i); killed++; } }
          if (killed < kill) this.loseUnits(kill - killed);
          if (this.n <= 0 && this.state !== 'lose') this.lose();
        }
      } else arm.rotation.x = Math.sin(this.t * 3) * 0.3;
    }
    B.obj.position.z = B.z;
    this.ui.bossBar?.(Math.max(0, B.hp / B.max), B.name);
  }

  // ================= Zeichnen =================
  draw(dt) {
    const T = this.t, m4 = this.m4, q = this.q, e = this.e, v = this.v;
    const moving = (this.state === 'run' || this.state === 'boss') && !this.clash && this.cz > this.end + 2.1;
    // Blau
    let i = 0;
    for (const u of this.units) {
      const bob = moving || this.state === 'win' ? Math.abs(Math.sin(T * (this.state === 'win' ? 8 : 12) + u.ph)) * (this.state === 'win' ? 0.8 : 0.18) : 0;
      e.set(moving ? -0.15 : 0, 0, moving ? Math.sin(T * 12 + u.ph) * 0.08 : 0);
      if (u.fall > 0) e.set(u.fall * 3, 0, u.fall * 4);
      q.setFromEuler(e);
      m4.compose(v.set(u.x, u.y + bob, u.z), q, this.s1);
      this.blue.setMatrixAt(i++, m4);
    }
    this.blue.count = i; this.blue.instanceMatrix.needsUpdate = true;
    // Rot
    let r = 0;
    for (const h of this.hordes) {
      if (h.dead || h.n <= 0 || h.z < this.cz - 120 || h.z > this.cz + 20) continue;
      const vis = Math.min(h.n, 120);
      for (let k = 0; k < vis && r < RED_CAP; k++) {
        const s = slot(k);
        const bob = h.active ? Math.abs(Math.sin(T * 11 + k)) * 0.15 : 0;
        q.setFromEuler(e.set(h.active ? 0.15 : 0, 0, 0));
        m4.compose(v.set(h.x + s[0], bob, h.z + s[1]), q, this.s1);
        this.red.setMatrixAt(r++, m4);
      }
    }
    this.red.count = r; this.red.instanceMatrix.needsUpdate = true;
    // Schatten
    this.shadow.position.set(this.cx, 0.03, this.cz);
    this.shadow.scale.setScalar(this.R * 2.6 + 1);
    this.shadow.visible = this.units.length > 0;
    // Geschosse
    let b = 0; const c = new THREE.Color();
    for (const bl of this.bullets) {
      if (b >= 300) break;
      const sz = bl.W.size;
      q.setFromEuler(e.set(0, Math.atan2(bl.vx, bl.vz), 0));
      m4.compose(v.set(bl.x, bl.y, bl.z), q, v.clone().set(sz, sz, sz * (bl.W.pierce ? 3 : 1)));
      this.bulletMesh.setMatrixAt(b, m4);
      this.bulletMesh.setColorAt(b, c.set(bl.W.color));
      b++;
    }
    for (const s of this.shells) {
      if (b >= 300) break;
      const k = Math.min(1, s.t);
      m4.compose(v.set(s.x + (s.tx - s.x) * k, s.y + Math.sin(k * Math.PI) * 4 * (1 - k * 0.6), s.z + (s.tz - s.z) * k), q.identity(), this.v.clone().set(4, 4, 1.2));
      this.bulletMesh.setMatrixAt(b, m4); this.bulletMesh.setColorAt(b, c.set(s.color)); b++;
    }
    this.bulletMesh.count = b; this.bulletMesh.instanceMatrix.needsUpdate = true; if (this.bulletMesh.instanceColor) this.bulletMesh.instanceColor.needsUpdate = true;
    // Partikel
    for (let k = 0; k < this.pN; k++) {
      const p = this.parts[k];
      if (p.life > 0) {
        p.life -= dt; p.vy -= 14 * dt; p.x += p.vx * dt; p.y = Math.max(0.05, p.y + p.vy * dt); p.z += p.vz * dt;
        const f = Math.max(0, p.life / p.max);
        this.pPos[k * 3] = p.x; this.pPos[k * 3 + 1] = p.y; this.pPos[k * 3 + 2] = p.z;
        this.pCol[k * 3] = p.c.r * f + (1 - f) * 0.5; this.pCol[k * 3 + 1] = p.c.g * f + (1 - f) * 0.5; this.pCol[k * 3 + 2] = p.c.b * f + (1 - f) * 0.5;
        if (p.life <= 0) this.pPos[k * 3 + 1] = -99;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true; this.points.geometry.attributes.color.needsUpdate = true;
    // Wasser bewegt sich
    if (this.water) this.water.material.map.offset.y += dt * 0.03;
    // Kamera
    const cam = this.camera;
    const portrait = innerWidth < innerHeight;
    const back = this.state === 'boss' || this.state === 'win' ? 4 : 0;
    const hgt = (portrait ? 15 : 12) + Math.min(6, this.R * 0.6) + back * 0.6;
    cam.position.x += (this.cx * 0.35 - cam.position.x) * Math.min(1, dt * 4);
    cam.position.y += (hgt - cam.position.y) * Math.min(1, dt * 2);
    cam.position.z += (this.cz + (portrait ? 13 : 11) + back + this.R * 0.5 - cam.position.z) * Math.min(1, dt * 4);
    cam.lookAt(this.cx * 0.25, 0, this.cz - (portrait ? 11 : 9));
  }

  // Bildschirmposition für die Zahl über der Truppe
  screenPos(x, y, z) {
    const p = this.v.set(x, y, z).project(this.camera);
    return [(p.x * 0.5 + 0.5) * innerWidth, (-p.y * 0.5 + 0.5) * innerHeight, p.z < 1];
  }

  render() { this.renderer.render(this.scene, this.camera); }
}
