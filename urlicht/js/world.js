// URLICHT – Planetenwelt: Himmel, Gelände, Wasser/Lava, Wolken, Berge und Kulissen.
import * as THREE from './three.module.min.js';
import * as M from './models.js';

const rand = (a, b) => a + Math.random() * (b - a);
const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- Rauschen ----------
function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
export function fbm(x, y) { return vnoise(x, y) * 0.55 + vnoise(x * 2.1, y * 2.1) * 0.28 + vnoise(x * 4.3, y * 4.3) * 0.17; }

// ---------- Biome: Höhe und Farbe ----------
// h(x, d): Geländehöhe an Seitenposition x und Streckenposition d
const C = (hex) => new THREE.Color(hex);
const side = (x, a, b) => smooth(a, b, Math.abs(x));
export const BIOMES = {
  ocean: {
    h: (x, d) => -14 + fbm(x * 0.02, d * 0.02) * 4 + side(x, 90, 160) * 40,
    col: (h) => (h > 1 ? C('#6a8a4a') : C('#c8b48a')),
  },
  city: {
    h: (x, d) => 0.4 + side(x, 120, 190) * 30 * fbm(x * 0.01, d * 0.01),
    col: (h, x, d) => (h > 2 ? C('#6a8a4a') : fbm(x * 0.05, d * 0.05) > 0.62 ? C('#5f8c46') : C('#9a9ca4')),
  },
  hills: {
    h: (x, d) => fbm(x * 0.025, d * 0.02) * 9 - 1 + Math.pow(Math.max(0, Math.abs(x) - 30), 1.25) * 0.35,
    col: (h) => (h < 0.6 ? C('#d8c890') : h < 9 ? C('#5c9a40') : h < 22 ? C('#7a8a5a') : C('#f0f2f4')),
  },
  canyon: {
    h: (x, d) => 1 + fbm(x * 0.05, d * 0.03) * 2 + side(x, 16, 30) * (30 + fbm(x * 0.03, d * 0.015) * 26),
    col: (h) => { const band = Math.floor(h / 4) % 3; return h < 3 ? C('#b8784a') : [C('#c0683a'), C('#a8502e'), C('#d8905a')][band]; },
  },
  lava: {
    h: (x, d) => -3 + fbm(x * 0.04, d * 0.03) * 7 + side(x, 20, 36) * (24 + fbm(x * 0.02, d * 0.02) * 30),
    col: (h) => (h < 0.8 ? C('#ff6a1a') : h < 2 ? C('#6a2a1a') : C('#2e2624')),
  },
  ice: {
    h: (x, d) => fbm(x * 0.03, d * 0.025) * 5 - 1 + side(x, 22, 40) * (22 + fbm(x * 0.04, d * 0.02) * 22),
    col: (h) => (h < 0.5 ? C('#5a9ac8') : h < 6 ? C('#e4eef8') : h < 18 ? C('#9ec0e0') : C('#6a94c4')),
  },
};

// ---------- Himmel ----------
export function makeSky(o) {
  const uniforms = {
    top: { value: C(o.top) }, horizon: { value: C(o.horizon) }, bottom: { value: C(o.bottom || o.horizon) },
    sunDir: { value: new THREE.Vector3(...(o.sunDir || [-0.35, 0.3, -1])).normalize() },
    sunColor: { value: C(o.sunColor || '#fff2d0') },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 top, horizon, bottom, sunColor; uniform vec3 sunDir; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 c = h > 0.0 ? mix(horizon, top, pow(smoothstep(0.0, 0.7, h), 0.7)) : mix(horizon, bottom, smoothstep(0.0, 0.2, -h));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        c += sunColor * (pow(s, 1200.0) * 4.0 + pow(s, 60.0) * 0.4 + pow(s, 6.0) * 0.18);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(880, 32, 16), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}

// Ferne Bergkette als Silhouette (wandert mit der Kamera)
export function makeMountains(color, height = 60, seed = 1) {
  const pos = [], cols = [];
  const n = 160, R = 760;
  const c1 = C(color), c2 = C(color).lerp(C('#ffffff'), 0.35);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const h0 = height * (0.35 + fbm(i * 0.18 + seed, seed) * 0.9), h1 = height * (0.35 + fbm((i + 1) * 0.18 + seed, seed) * 0.9);
    const p = (a, h) => [Math.sin(a) * R, h, -Math.cos(a) * R];
    const A = p(a0, -30), B = p(a1, -30), Cc = p(a1, h1), D = p(a0, h0);
    pos.push(...A, ...B, ...Cc, ...A, ...Cc, ...D);
    for (const c of [c1, c1, c2, c1, c2, c2]) cols.push(c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
  m.renderOrder = -9;
  m.frustumCulled = false;
  return m;
}

// Normal-Map für Wellen
let _waveNormal;
function waveNormal() {
  if (_waveNormal) return _waveNormal;
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d'), img = x.createImageData(S, S);
  const H = (i, j) => { const u = (i / S) * Math.PI * 2, v = (j / S) * Math.PI * 2; return Math.sin(u * 3 + Math.sin(v * 2) * 1.5) * 0.5 + Math.sin(v * 5 + u) * 0.3 + Math.sin((u + v) * 7) * 0.15 + Math.sin(u * 11 - v * 4) * 0.08; };
  for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const dx = H(i + 1, j) - H(i - 1, j), dy = H(i, j + 1) - H(i, j - 1);
    const n = new THREE.Vector3(-dx * 2, -dy * 2, 1).normalize();
    const k = (j * S + i) * 4;
    img.data[k] = (n.x * 0.5 + 0.5) * 255; img.data[k + 1] = (n.y * 0.5 + 0.5) * 255; img.data[k + 2] = (n.z * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(110, 110);
  return (_waveNormal = t);
}

// Wasser- oder Lavafläche
export function makeFluid(kind) {
  const geo = new THREE.PlaneGeometry(1800, 1800); geo.rotateX(-Math.PI / 2);
  let mat;
  if (kind === 'lava') {
    const n = waveNormal().clone(); n.needsUpdate = true; n.repeat.set(50, 50);
    mat = new THREE.MeshStandardMaterial({ color: '#ff5a10', emissive: '#ff4a00', emissiveIntensity: 1.1, roughness: 0.6, normalMap: n, normalScale: new THREE.Vector2(1.5, 1.5) });
  } else {
    mat = new THREE.MeshStandardMaterial({ color: kind === 'ice' ? '#2a6a98' : '#0e5a92', roughness: 0.1, metalness: 0.1, normalMap: waveNormal(), normalScale: new THREE.Vector2(0.35, 0.35), envMapIntensity: 1.1 });
  }
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  m.userData.kind = kind;
  return m;
}

// Weiche Wolken
let _cloudTex;
function cloudTexture() {
  if (_cloudTex) return _cloudTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  for (let i = 0; i < 22; i++) {
    const px = 30 + Math.random() * 68, py = 40 + Math.random() * 50, r = 14 + Math.random() * 26;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  }
  _cloudTex = new THREE.CanvasTexture(c); _cloudTex.colorSpace = THREE.SRGBColorSpace;
  return _cloudTex;
}
export function makeCloud(color = '#ffffff', opacity = 0.85) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(), color, transparent: true, opacity, depthWrite: false, fog: true }));
  return s;
}

// ---------- Gelände in Streifen ----------
export class Terrain {
  constructor(scene) {
    this.scene = scene;
    this.LEN = 60; this.N = 12; this.W = 440;
    this.mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.92, metalness: 0 });
    this.chunks = [];
    for (let i = 0; i < this.N; i++) {
      const g = new THREE.PlaneGeometry(this.W, this.LEN, 44, 6); g.rotateX(-Math.PI / 2);
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
      const m = new THREE.Mesh(g, this.mat);
      m.receiveShadow = true;
      m.frustumCulled = false;
      m.userData.base = Float32Array.from(g.attributes.position.array);
      scene.add(m);
      this.chunks.push(m);
    }
    this.sections = null;
    this.visible = false;
  }
  setSections(sections) {
    this.sections = sections;
    this.visible = !!sections;
    for (const c of this.chunks) c.visible = this.visible;
  }
  biomeAt(d) {
    const S = this.sections;
    let i = 0;
    while (i + 1 < S.length && S[i + 1][0] <= d) i++;
    return { cur: S[i][1], prev: i > 0 ? S[i - 1][1] : S[i][1], t: i > 0 ? smooth(0, 140, d - S[i][0]) : 1 };
  }
  heightAt(x, d) {
    if (!this.sections) return -999;
    const b = this.biomeAt(d);
    const h1 = BIOMES[b.cur].h(x, d);
    return b.t >= 1 ? h1 : lerp(BIOMES[b.prev].h(x, d), h1, b.t);
  }
  colorAt(h, x, d) {
    const b = this.biomeAt(d);
    const c = BIOMES[b.cur].col(h, x, d);
    return b.t >= 1 ? c : BIOMES[b.prev].col(h, x, d).lerp(c, b.t);
  }
  build(chunk, dist) {
    const pos = chunk.geometry.attributes.position, col = chunk.geometry.attributes.color, base = chunk.userData.base;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], lz = base[i * 3 + 2];
      const d = dist - (chunk.position.z + lz);
      const h = this.heightAt(x, d);
      pos.setY(i, h);
      const c = this.colorAt(h, x, d);
      const n = 0.92 + hash(x * 0.37, d * 0.29) * 0.16;
      col.setXYZ(i, c.r * n, c.g * n, c.b * n);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    chunk.geometry.computeVertexNormals();
  }
  reset(dist) {
    if (!this.sections) return;
    this.chunks.forEach((c, i) => { c.position.set(0, 0, 30 - i * this.LEN); this.build(c, dist); });
  }
  update(scrollDz, dist) {
    if (!this.sections) return;
    for (const c of this.chunks) {
      c.position.z += scrollDz;
      if (c.position.z - this.LEN / 2 > 40) { c.position.z -= this.N * this.LEN; this.build(c, dist); }
    }
  }
}

// ---------- Kulissen ----------
const std = M.std;
let facadeTex = {};
function facade(kind) {
  if (facadeTex[kind]) return facadeTex[kind];
  const c = document.createElement('canvas'); c.width = 64; c.height = 64;
  const x = c.getContext('2d');
  if (kind === 'glass') {
    x.fillStyle = '#7fa6c8'; x.fillRect(0, 0, 64, 64);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { x.fillStyle = `rgba(${20 + Math.random() * 40},${50 + Math.random() * 50},${90 + Math.random() * 60},0.85)`; x.fillRect(i * 16 + 1, j * 8 + 1, 14, 6); }
  } else if (kind === 'white') {
    x.fillStyle = '#eeeae2'; x.fillRect(0, 0, 64, 64);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { x.fillStyle = Math.random() < 0.15 ? '#ffe8a0' : '#35485c'; x.fillRect(i * 16 + 4, j * 8 + 2, 8, 4); }
  } else {
    x.fillStyle = '#d8b98e'; x.fillRect(0, 0, 64, 64);
    for (let j = 0; j < 8; j++) for (let i = 0; i < 4; i++) { x.fillStyle = '#4a3a2e'; x.fillRect(i * 16 + 5, j * 8 + 2, 6, 5); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return (facadeTex[kind] = t);
}
const facadeMat = (kind) => std('#ffffff', { map: facade(kind), metalness: kind === 'glass' ? 0.55 : 0.1, roughness: kind === 'glass' ? 0.15 : 0.7, envMapIntensity: kind === 'glass' ? 1.3 : 1 });
function boxUV(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  // Fassadenraster passend zur Größe (je Fläche 0..1 → Meter/8)
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / 8, uv.getY(i) * dims[f][1] / 8); }
  g.translate(0, h / 2, 0);
  return g;
}
const box = (min, max) => ({ min: new THREE.Vector3(...min), max: new THREE.Vector3(...max) });

export function makeBuilding(w, h, d, kind) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(boxUV(w, h, d), facadeMat(kind)); m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.5, d + 0.4), std('#8a8e96', { roughness: 0.8 })); roof.position.y = h + 0.25; g.add(roof);
  if (h > 24 && Math.random() < 0.6) {
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 8, 6), M.MAT.metal()); ant.position.y = h + 4.5; g.add(ant);
    const lamp = M.glowSprite('#ff3030', 2.2, 0.9); lamp.position.y = h + 8.6; g.add(lamp);
  } else if (Math.random() < 0.4) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w * 0.5, 2.5, d * 0.5), std('#b8bcc4', { roughness: 0.6 })); b.position.y = h + 1.5; g.add(b);
  }
  g.userData.boxes = [box([-w / 2, 0, -d / 2], [w / 2, h + 0.5, d / 2])];
  return g;
}

// Straßenstück (liegt flach auf dem Stadtboden)
let _roadMat;
export function makeRoad() {
  if (!_roadMat) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#c8c4bc'; x.fillRect(0, 0, 128, 128);
    x.fillStyle = '#4a4d55'; x.fillRect(14, 0, 100, 128);
    for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},0.06)`; x.fillRect(14 + Math.random() * 100, Math.random() * 128, 2, 2); }
    x.fillStyle = '#f0f0f0'; x.fillRect(18, 0, 2, 128); x.fillRect(108, 0, 2, 128);
    x.fillStyle = '#ffd23a'; x.fillRect(62, 8, 4, 48); x.fillRect(62, 72, 4, 48);
    x.fillStyle = '#e8e8e8'; x.fillRect(38, 20, 2, 30); x.fillRect(88, 20, 2, 30); x.fillRect(38, 84, 2, 30); x.fillRect(88, 84, 2, 30);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    _roadMat = std('#ffffff', { map: t, roughness: 0.85, metalness: 0 });
  }
  const g = new THREE.PlaneGeometry(40, 22.2); g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, _roadMat); m.receiveShadow = true;
  return m;
}

// Brücke/Tor über der Straße – zum Durchfliegen
export function makeGate(span = 26, height = 16, kind = 'city') {
  const g = new THREE.Group();
  const mat = kind === 'rock' ? std('#a8603a', { flatShading: true, roughness: 0.9 }) : kind === 'ice' ? std('#cfefff', { flatShading: true, roughness: 0.1, metalness: 0.1 }) : std('#e8e4dc', { roughness: 0.5 });
  const pw = 3;
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(pw, height, pw), mat); p.position.set(s * span / 2, height / 2, 0); p.castShadow = true; g.add(p); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(span + pw, 2.6, pw + 0.6), mat); top.position.y = height + 1.3; top.castShadow = true; g.add(top);
  if (kind === 'city') {
    const band = new THREE.Mesh(new THREE.BoxGeometry(span + pw + 0.2, 0.6, pw + 0.8), M.MAT.paint('#2a6aff')); band.position.y = height + 0.4; g.add(band);
    for (const s of [-1, 1]) { const l = M.glowSprite('#9ad8ff', 3, 0.9); l.position.set(s * span / 2, height + 3, 0); g.add(l); }
  }
  g.userData.boxes = [
    box([-span / 2 - pw / 2, 0, -pw / 2], [-span / 2 + pw / 2, height, pw / 2]),
    box([span / 2 - pw / 2, 0, -pw / 2], [span / 2 + pw / 2, height, pw / 2]),
    box([-span / 2 - pw / 2, height, -pw / 2 - 0.3], [span / 2 + pw / 2, height + 2.6, pw / 2 + 0.3]),
  ];
  g.userData.gate = { span, height };
  return g;
}

// Natürlicher Felsbogen zum Durchfliegen
export function makeArch(span, kind = 'sea') {
  const R = span / 2, T = 2.6;
  const col = { sea: '#7a6e62', canyon: '#b0603a', ice: '#d8f0ff' }[kind];
  const mat = kind === 'ice' ? std(col, { flatShading: true, roughness: 0.1, metalness: 0.1, emissive: '#1a4a6e', emissiveIntensity: 0.25 }) : std(col, { flatShading: true, roughness: 0.95 });
  const geo = new THREE.TorusGeometry(R, T, 7, 16, Math.PI);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const f = 1 + (hash(p.getX(i) * 0.7, p.getY(i) * 0.9) - 0.5) * 0.35; p.setZ(i, p.getZ(i) * f); p.setY(i, p.getY(i) * (1 + (f - 1) * 0.3)); }
  geo.computeVertexNormals();
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat); m.scale.y = 1.25; m.castShadow = true; g.add(m);
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(T * 1.1, T * 1.6, 12, 7), mat); f.position.set(s * R, -5, 0); g.add(f); }
  if (kind === 'sea') { const top = new THREE.Mesh(new THREE.SphereGeometry(T * 1.2, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2), std('#5a8a3a', { flatShading: true })); top.scale.set(2.2, 0.6, 1.2); top.position.y = R * 1.25 + T * 0.9; g.add(top); }
  const H = R * 1.25;
  g.userData.boxes = [
    box([-R - T, -20, -T], [-R + T, H * 0.55, T]),
    box([R - T, -20, -T], [R + T, H * 0.55, T]),
    box([-R * 0.75, H - T * 0.6, -T], [R * 0.75, H + T * 1.3, T]),
  ];
  g.userData.gate = { span: span - T * 2, height: H - T };
  return g;
}

// Felsnadel (Meer, Canyon, Lava, Eis)
const rockGeos = {};
export function makeSpire(h, kind = 'sea') {
  const key = kind;
  if (!rockGeos[key]) {
    rockGeos[key] = [];
    for (let k = 0; k < 3; k++) {
      const g = new THREE.CylinderGeometry(0.55, 1, 1, 7, 4); g.translate(0, 0.5, 0);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i); const f = 1 + (hash(i * 1.7 + k, y * 3.1) - 0.5) * 0.45; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); }
      g.computeVertexNormals();
      rockGeos[key].push(g);
    }
  }
  const col = { sea: '#7a6e62', canyon: '#b0603a', lava: '#2c2422', ice: '#d8f0ff' }[kind];
  const mat = kind === 'ice' ? std(col, { flatShading: true, roughness: 0.1, metalness: 0.1, emissive: '#1a4a6e', emissiveIntensity: 0.25 }) : std(col, { flatShading: true, roughness: 0.95 });
  const r = h * rand(0.14, 0.2);
  const m = new THREE.Mesh(rockGeos[key][Math.floor(Math.random() * 3)], mat);
  m.scale.set(r, h, r);
  m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m);
  if (kind === 'sea' && Math.random() < 0.5) { const top = new THREE.Mesh(new THREE.ConeGeometry(r * 0.8, r * 0.8, 7), std('#5a8a3a', { flatShading: true })); top.position.y = h + r * 0.3; g.add(top); }
  if (kind === 'lava') { const glow = M.glowSprite('#ff6a1a', r * 5, 0.5); glow.position.y = 0.5; g.add(glow); }
  g.userData.boxes = [box([-r * 0.8, -20, -r * 0.8], [r * 0.8, h, r * 0.8])];
  return g;
}

// Leuchtturm
export function makeLighthouse() {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(2.2 - i * 0.25, 2.45 - i * 0.25, 5, 16), std(i % 2 ? '#d02a2a' : '#f4f4f4', { roughness: 0.5 }));
    s.position.y = 2.5 + i * 5; s.castShadow = true; g.add(s);
  }
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.5, 12), M.MAT.glass()); lamp.position.y = 26.2; g.add(lamp);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.9, 2, 12), std('#d02a2a')); cap.position.y = 28.5; g.add(cap);
  const l = M.glowSprite('#fff2b0', 9, 0.9); l.position.y = 26.2; g.add(l);
  const rock = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 6, 8), std('#7a6e62', { flatShading: true })); rock.position.y = -2; g.add(rock);
  g.userData.boxes = [box([-2.5, -10, -2.5], [2.5, 29, 2.5])];
  return g;
}

// Baumgruppe
export function makeTrees() {
  const g = new THREE.Group();
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const h = rand(4, 8), x = rand(-3, 3), z = rand(-3, 3);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, h * 0.4, 5), std('#6a4a2a')); t.position.set(x, h * 0.2, z); g.add(t);
    const c = new THREE.Mesh(new THREE.ConeGeometry(h * 0.28, h * 0.8, 7), std(Math.random() < 0.5 ? '#2e6a30' : '#3c7a34', { flatShading: true })); c.position.set(x, h * 0.65, z); c.castShadow = true; g.add(c);
  }
  return g;
}

// Hafenkran / Mast mit Warnlicht
export function makeCrane() {
  const g = new THREE.Group();
  const mat = M.MAT.paint('#e0a020');
  g.add(M.bar([0, 0, 0], [0, 24, 0], 0.6, mat, 6));
  g.add(M.bar([-6, 24, 0], [14, 24, 0], 0.45, mat, 6));
  g.add(M.bar([0, 18, 0], [10, 24, 0], 0.25, mat, 4));
  g.add(M.bar([10, 24, 0], [10, 14, 0], 0.06, M.MAT.dark(), 4));
  const l = M.glowSprite('#ff3030', 2, 0.9); l.position.set(14, 24.6, 0); g.add(l);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData.boxes = [box([-1, 0, -1], [1, 24, 1]), box([-6, 23.4, -0.6], [14, 24.6, 0.6])];
  return g;
}

// Kulissen-Generator: was an Streckenposition d je Biom entsteht
// Liefert [{ kind, x, y, obj }]
export function propsFor(biome, d, bounds) {
  const out = [];
  const add = (obj, x, y = 0, rotY = 0) => { obj.rotation.y = rotY; out.push({ obj, x, y }); };
  if (biome === 'city') {
    for (const s of [-1, 1]) {
      if (Math.random() < 0.85) {
        const h = Math.random() < 0.25 ? rand(30, 55) : rand(8, 26), w = rand(7, 14), dd = rand(7, 14);
        add(makeBuilding(w, h, dd, ['glass', 'white', 'sand'][Math.floor(Math.random() * 3)]), s * rand(27 + w / 2, 34 + w / 2));
      }
      if (Math.random() < 0.7) { const h = rand(10, 45); add(makeBuilding(rand(8, 16), h, rand(8, 16), ['glass', 'white', 'sand'][Math.floor(Math.random() * 3)]), s * rand(38, 70)); }
    }
    if (Math.random() < 0.08) { const h = rand(5, 8); add(makeBuilding(rand(5, 7), h, rand(5, 7), 'white'), rand(-9, 9)); }
    out.push({ obj: makeRoad(), x: 0, y: 0.45 });
    if (Math.random() < 0.07) add(makeGate(30, 17, 'city'), 0);
  } else if (biome === 'ocean') {
    if (Math.random() < 0.55) add(makeSpire(rand(8, 26), 'sea'), (Math.random() < 0.5 ? -1 : 1) * rand(12, 60), -2);
    if (Math.random() < 0.035) add(makeArch(24, 'sea'), rand(-4, 4), -1);
    if (Math.random() < 0.03) add(makeLighthouse(), (Math.random() < 0.5 ? -1 : 1) * rand(26, 40), 0);
  } else if (biome === 'hills') {
    for (let i = 0; i < 2; i++) if (Math.random() < 0.8) out.push({ obj: makeTrees(), x: (Math.random() < 0.5 ? -1 : 1) * rand(8, 60), y: 'ground' });
  } else if (biome === 'canyon') {
    if (Math.random() < 0.35) out.push({ obj: makeSpire(rand(10, 24), 'canyon'), x: (Math.random() < 0.5 ? -1 : 1) * rand(6, 16), y: 'ground' });
    if (Math.random() < 0.04) out.push({ obj: makeArch(28, 'canyon'), x: 0, y: 'ground' });
  } else if (biome === 'lava') {
    if (Math.random() < 0.4) out.push({ obj: makeSpire(rand(8, 22), 'lava'), x: (Math.random() < 0.5 ? -1 : 1) * rand(6, 20), y: -1 });
  } else if (biome === 'ice') {
    if (Math.random() < 0.4) out.push({ obj: makeSpire(rand(8, 26), 'ice'), x: (Math.random() < 0.5 ? -1 : 1) * rand(6, 20), y: 'ground' });
    if (Math.random() < 0.04) out.push({ obj: makeArch(28, 'ice'), x: 0, y: 'ground' });
  }
  return out;
}

// Die Wand des Urlichts: glühendes Plasma am Rand des sichtbaren Universums
export function makeWall() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(0.3, 'rgba(255,150,60,0.7)'); g.addColorStop(0.5, 'rgba(255,240,200,1)'); g.addColorStop(0.7, 'rgba(255,150,60,0.7)'); g.addColorStop(1, 'rgba(255,120,40,0)');
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 260; i++) {
    const px = Math.random() * 512, py = 128 + (Math.random() - 0.5) * 180, r = 6 + Math.random() * 30;
    const rg = x.createRadialGradient(px, py, 0, px, py, r);
    const hot = Math.random();
    rg.addColorStop(0, hot > 0.7 ? 'rgba(255,255,230,0.35)' : hot > 0.35 ? 'rgba(255,170,80,0.3)' : 'rgba(220,80,120,0.25)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2600, 900), new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
  m.renderOrder = -8;
  return m;
}
