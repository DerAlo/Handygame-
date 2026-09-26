// URLICHT – 3D-Modelle, Materialien und Himmel. Alles per Code gebaut.
import * as THREE from './three.module.min.js';

// ---------- Materialien ----------
const cache = {};
const cached = (key, make) => cache[key] || (cache[key] = make());

// Physikalisch basiertes Material (glänzt dank Umgebungs-Map)
export function std(color, o = {}) {
  return cached('S' + color + JSON.stringify(o), () => new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.38, ...o }));
}
// Kompatibilität: matte Variante
export const lambert = (color, o = {}) => std(color, { metalness: 0.15, roughness: 0.7, ...o });
export function basic(color, o = {}) {
  return cached('B' + color + JSON.stringify(o), () => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...o }));
}
export function glowMat(color, opacity = 1) {
  return cached('G' + color + opacity, () => new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
}

export const MAT = {
  hull: (c = '#eef1f6') => std(c, { metalness: 0.35, roughness: 0.28 }),
  dark: () => std('#2e3440', { metalness: 0.75, roughness: 0.35 }),
  metal: () => std('#9aa3b2', { metalness: 0.95, roughness: 0.25 }),
  glass: () => std('#0c2a4c', { metalness: 1, roughness: 0.05, envMapIntensity: 2.5 }),
  paint: (c) => std(c, { metalness: 0.3, roughness: 0.32, emissive: c, emissiveIntensity: 0.15 }),
  // Echos: schwarzes Chrom mit leuchtenden Nähten
  echo: () => std('#565c78', { metalness: 0.85, roughness: 0.22 }),
  echoPlate: () => std('#6e7494', { metalness: 0.75, roughness: 0.3, flatShading: true }),
  lamp: (c) => basic(c),
};

// ---------- Geometrie-Helfer ----------
// Rotationskörper entlang der z-Achse. profile: [[radius, z], ...]
export function lathe(profile, segs = 16, sx = 1, sy = 1) {
  const g = new THREE.LatheGeometry(profile.map(([r, z]) => new THREE.Vector2(r, z)), segs);
  g.rotateX(Math.PI / 2);
  g.scale(sx, sy, 1);
  return g;
}
// Flache Platte (Flügel, Finnen) in der x-z-Ebene. pts: [[x, z], ...]
export function plate(pts, t = 0.1, bevel = 0.035) {
  const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 6 });
  g.rotateX(Math.PI / 2);
  g.translate(0, t / 2, 0);
  return g;
}
const mirror = (pts) => pts.map(([x, z]) => [-x, z]);
// Senkrechte Finne in der z-y-Ebene. pts: [[z, h], ...]
export function fin(pts, t = 0.08) {
  const g = plate(pts.map(([z, h]) => [h, z]), t, 0.03);
  g.rotateZ(Math.PI / 2);
  return g;
}
// Stab zwischen zwei Punkten
const _up = new THREE.Vector3(0, 1, 0);
export function bar(a, b, r, mat, segs = 6) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, segs), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_up, B.clone().sub(A).normalize());
  return m;
}
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };

// Triebwerk entlang z; dir = +1: Düse zeigt nach hinten (+z)
function engine(r, len, glow, dir = 1) {
  const g = new THREE.Group();
  const body = new THREE.CylinderGeometry(r * 0.8, r, len, 14); body.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(body, MAT.dark()));
  const ring = new THREE.TorusGeometry(r * 0.95, r * 0.14, 6, 18);
  g.add(mesh(ring, MAT.metal(), 0, 0, dir * len * 0.5));
  const disc = new THREE.CircleGeometry(r * 0.75, 14);
  const d = mesh(disc, basic(glow), 0, 0, dir * (len * 0.5 + 0.01));
  if (dir < 0) d.rotation.y = Math.PI;
  g.add(d);
  const s = glowSprite(glow, r * 4.5, 0.9); s.position.z = dir * (len * 0.5 + r * 0.6); g.add(s);
  return g;
}

let _glow, _bolt;
export function glowTexture() {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.15)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (_glow = new THREE.CanvasTexture(c));
}
// Geschoss: harter heller Kern mit Halo – gut erkennbar
export function boltTexture() {
  if (_bolt) return _bolt;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (_bolt = new THREE.CanvasTexture(c));
}

export function glowSprite(color, size, opacity = 1) {
  const s = new THREE.Sprite(glowMat(color, opacity));
  s.scale.set(size, size, 1);
  return s;
}

// ---------- Jäger der Allianz (Spieler & Flügelleute) ----------
function buildFighter({ hull, accent, glow }) {
  const g = new THREE.Group();
  const H = MAT.hull(hull), A = MAT.paint(accent);
  // Rumpf
  g.add(new THREE.Mesh(lathe([[0, -3.1], [0.16, -2.75], [0.36, -2.05], [0.55, -1.05], [0.66, 0.05], [0.64, 0.85], [0.5, 1.45], [0.32, 1.7]], 20, 1, 0.72), H));
  // Farbring an der Nase
  const band = new THREE.TorusGeometry(0.4, 0.045, 6, 24); band.scale(1, 0.72, 1);
  g.add(mesh(band, A, 0, 0, -1.9));
  // Cockpit
  const cg = new THREE.SphereGeometry(0.5, 20, 12); cg.scale(0.6, 0.52, 1.75);
  g.add(mesh(cg, MAT.glass(), 0, 0.3, -0.85));
  // Lufteinlässe
  for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.22, 0.3, 0.9), MAT.dark(), s * 0.58, 0.02, -0.15));
  // Flügel
  const wing = [[0.45, -0.55], [2.9, 0.75], [3.0, 1.15], [0.5, 1.35]];
  const stripe = [[1.55, 0.2], [2.85, 0.83], [2.92, 1.02], [1.55, 0.6]];
  const tipFin = [[0.35, 0], [1.2, 0], [1.3, 0.85], [1.0, 0.85]];
  for (const s of [-1, 1]) {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(plate(s > 0 ? wing : mirror(wing), 0.09), H));
    w.add(new THREE.Mesh(plate(s > 0 ? stripe : mirror(stripe), 0.13, 0.02), A));
    const f = new THREE.Mesh(fin(tipFin), A); f.position.x = s * 2.95; w.add(f);
    // Bordkanone unter dem Flügel
    const gun = new THREE.CylinderGeometry(0.06, 0.08, 1.4, 8); gun.rotateX(Math.PI / 2);
    w.add(mesh(gun, MAT.metal(), s * 1.25, -0.14, -0.1));
    w.position.y = -0.12;
    w.rotation.z = s * -0.07;
    g.add(w);
  }
  // Heckflosse
  g.add(new THREE.Mesh(fin([[0.6, 0.25], [1.55, 0.25], [1.75, 0.95], [1.45, 0.95]]), A));
  // Triebwerke
  for (const s of [-1, 1]) { const e = engine(0.3, 1.0, glow); e.position.set(s * 0.46, -0.05, 1.45); g.add(e); }
  const eng = glowSprite(glow, 1.8, 0.8);
  eng.position.set(0, -0.05, 2.25);
  g.add(eng);
  g.userData.engine = eng;
  return g;
}

export function makePlayerShip() {
  return buildFighter({ hull: '#eef1f6', accent: '#ff8a2a', glow: '#7fd8ff' });
}
const WING = { '#ffb0d8': { hull: '#f3edf1', accent: '#ff4f9e', glow: '#ff9ad0' }, '#a8b0b8': { hull: '#707888', accent: '#ffd23a', glow: '#ffb347' } };
export function makeWingman(color) {
  const g = buildFighter(WING[color] || { hull: color, accent: '#7fd8ff', glow: '#7fd8ff' });
  g.scale.setScalar(0.72);
  return g;
}

// ---------- Echos: hohle Kopien von Schiffen ----------
// Alle Gegnermodelle zeigen mit der Nase nach +z (auf den Spieler zu).
const EYE = '#ff3b5c', SEAM = '#a58bff';

// Jäger – vorwärts gepfeilte Klingenflügel
export function makeDrone() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0, -1.6], [0.4, -1.35], [0.66, -0.6], [0.72, 0.25], [0.5, 1.0], [0.18, 1.45], [0, 1.55]], 14, 1, 0.78), MAT.echo()));
  const wing = [[0.5, -0.8], [2.35, 0.1], [2.75, 1.7], [2.4, 1.65], [0.55, 0.45]];
  for (const s of [-1, 1]) {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(plate(s > 0 ? wing : mirror(wing), 0.09), MAT.echoPlate()));
    w.add(bar([s * 0.6, 0.07, 0.45], [s * 2.4, 0.07, 1.62], 0.05, basic(SEAM), 4));
    w.add(bar([s * 2.6, 0, -0.1], [s * 2.6, 0, 1.3], 0.09, MAT.metal(), 6));
    w.rotation.z = s * 0.28;
    g.add(w);
  }
  g.add(mesh(new THREE.SphereGeometry(0.26, 12, 8), basic(EYE), 0, 0.12, 1.2));
  const eye = glowSprite(EYE, 1.4, 0.8); eye.position.set(0, 0.12, 1.35); g.add(eye);
  const e = engine(0.34, 0.5, SEAM, -1); e.position.z = -1.55; g.add(e);
  g.scale.setScalar(1.15);
  return g;
}

// Pfeil – schneller Abfangjäger mit drei Finnen
export function makeDart() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0, -2.3], [0.3, -2.1], [0.44, -1.1], [0.4, 0.6], [0.22, 1.8], [0, 2.9]], 12), MAT.echo()));
  const f = [[0.3, -2.1], [1.4, -2.5], [1.3, -1.75], [0.36, -0.35]];
  for (let k = 0; k < 3; k++) {
    const m = new THREE.Mesh(plate(f, 0.07), MAT.echoPlate());
    const p = new THREE.Group(); p.add(m); p.rotation.z = Math.PI / 2 + (k * Math.PI * 2) / 3; g.add(p);
    const seam = bar([0.35, 0.05, -0.4], [1.35, 0.05, -2.2], 0.035, basic('#ff6ad0'), 4); p.add(seam);
  }
  g.add(mesh(new THREE.SphereGeometry(0.16, 10, 6), basic('#ff6ad0'), 0, 0, 2.2));
  const e = engine(0.3, 0.4, '#ff6ad0', -1); e.position.z = -2.35; g.add(e);
  g.scale.setScalar(1.2);
  return g;
}

// Minen – Stachelkugel mit Warnlicht
export function makeMine() {
  const g = new THREE.Group();
  const core = new THREE.Group();
  core.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), MAT.dark()));
  const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0.7, 0.7, 0], [-0.7, -0.7, 0], [0.7, -0.7, 0], [-0.7, 0.7, 0]];
  for (const [x, y, z] of dirs) core.add(bar([x * 0.8, y * 0.8, z * 0.8], [x * 1.45, y * 1.45, z * 1.45], 0.1, MAT.metal(), 6));
  core.add(new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.07, 6, 24), basic('#ff2a3a')));
  g.add(core);
  const glow = glowSprite('#ff2030', 2.6, 0.7); g.add(glow);
  g.userData.spin = core; g.userData.glow = glow;
  return g;
}

// Träger – großes Schiff, das beim Abschuss Jäger freisetzt
export function makeSplitter() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(lathe([[0, -2.7], [1.0, -2.5], [1.45, -1.2], [1.5, 1.1], [1.05, 2.2], [0.45, 2.75], [0, 2.8]], 8, 1.35, 0.6), MAT.echoPlate()));
  // Brücke
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.6, 1.4), MAT.echo(), 0, 0.95, -0.9));
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.12, 0.2), basic(SEAM), 0, 1.05, -0.2));
  // Seitengondeln mit Augen
  for (const s of [-1, 1]) {
    const pod = new THREE.Mesh(lathe([[0, -1.6], [0.5, -1.3], [0.55, 0.8], [0.3, 1.5], [0, 1.6]], 12), MAT.echo());
    pod.position.set(s * 2.55, -0.1, 0.1); g.add(pod);
    g.add(mesh(new THREE.BoxGeometry(1.2, 0.18, 1.2), MAT.dark(), s * 1.8, -0.1, 0));
    g.add(mesh(new THREE.SphereGeometry(0.2, 10, 6), basic(EYE), s * 2.55, -0.1, 1.55));
    const e = engine(0.36, 0.5, SEAM, -1); e.position.set(s * 2.55, -0.1, -1.75); g.add(e);
  }
  // Hangar-Leuchten und Hauptauge
  g.add(mesh(new THREE.BoxGeometry(1.6, 0.1, 2.2), basic(SEAM), 0, -0.9, 0));
  g.add(mesh(new THREE.SphereGeometry(0.4, 12, 8), basic(EYE), 0, 0.1, 2.55));
  const eye = glowSprite(EYE, 2.4, 0.8); eye.position.set(0, 0.1, 2.8); g.add(eye);
  for (const s of [-0.6, 0.6]) { const e = engine(0.45, 0.5, SEAM, -1); e.position.set(s, 0, -2.75); g.add(e); }
  g.scale.setScalar(1.2);
  return g;
}

// Geschützturm (Boden) – Läufe zeigen nach +z
export function makeTurret() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.7, 0.9, 8), MAT.echoPlate()));
  const head = new THREE.Group(); head.position.y = 0.55;
  head.add(new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.echo()));
  for (const s of [-1, 1]) {
    const b = new THREE.CylinderGeometry(0.11, 0.15, 2.0, 8); b.rotateX(Math.PI / 2);
    head.add(mesh(b, MAT.metal(), s * 0.32, 0.45, 1.2));
    head.add(mesh(new THREE.SphereGeometry(0.1, 8, 6), basic(EYE), s * 0.32, 0.45, 2.22));
  }
  head.add(mesh(new THREE.BoxGeometry(0.6, 0.14, 0.1), basic(EYE), 0, 0.7, 0.85));
  g.add(head);
  g.userData.head = head;
  return g;
}

// ---------- Hindernisse & Kulisse ----------
const astGeos = [];
export function makeAsteroid(r) {
  if (!astGeos.length) {
    for (let k = 0; k < 5; k++) {
      const geo = new THREE.IcosahedronGeometry(1, 2);
      const p = geo.attributes.position;
      const col = new Float32Array(p.count * 3);
      const st = [1 + Math.random() * 0.4, 0.75 + Math.random() * 0.3, 1];
      const v = new THREE.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const n = 1 + 0.2 * Math.sin(v.x * 3.1 + k) * Math.cos(v.y * 2.7 - k) + 0.12 * Math.sin(v.z * 5.3 + k * 2 + v.x * 2) + 0.06 * Math.sin(v.y * 9 + v.z * 7);
        v.multiplyScalar(n); v.x *= st[0]; v.y *= st[1];
        p.setXYZ(i, v.x, v.y, v.z);
        const c = 0.55 + (n - 0.8) * 0.9;
        col[i * 3] = c * 0.62; col[i * 3 + 1] = c * 0.56; col[i * 3 + 2] = c * 0.5;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.computeVertexNormals();
      astGeos.push(geo);
    }
  }
  const m = new THREE.Mesh(astGeos[Math.floor(Math.random() * astGeos.length)], std('#ffffff', { vertexColors: true, metalness: 0.05, roughness: 0.95, flatShading: true }));
  m.scale.setScalar(r);
  m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  return m;
}

export function makeGirder(len = 30) {
  const g = new THREE.Group();
  const mat = MAT.metal();
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(mesh(new THREE.BoxGeometry(0.3, 0.3, len), mat, x, y, 0));
  for (let z = -len / 2; z <= len / 2; z += 4) {
    g.add(mesh(new THREE.BoxGeometry(2.3, 0.22, 0.22), MAT.paint('#ffb020'), 0, 1, z));
    g.add(mesh(new THREE.BoxGeometry(2.3, 0.22, 0.22), MAT.paint('#ffb020'), 0, -1, z));
    g.add(bar([-1, -1, z], [-1, 1, z + 2], 0.08, mat, 4));
    g.add(bar([1, -1, z], [1, 1, z + 2], 0.08, mat, 4));
  }
  const lamp = mesh(new THREE.SphereGeometry(0.2, 8, 6), basic('#ff3030'), 0, 1.3, -len / 2);
  g.add(lamp);
  return g;
}

// Werftmodul am Rand (Kulisse)
export function makeStation() {
  const g = new THREE.Group();
  const L = 14 + Math.random() * 10;
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, L, 20), MAT.hull('#c8ced8')));
  for (const y of [-L / 2 + 1, 0, L / 2 - 1]) g.add(mesh(new THREE.TorusGeometry(2.6, 0.3, 8, 24).rotateX(Math.PI / 2), MAT.dark(), 0, y, 0));
  const panel = std('#1c3a78', { metalness: 0.8, roughness: 0.25, emissive: '#081a40', emissiveIntensity: 0.6 });
  for (const s of [-1, 1]) {
    g.add(bar([s * 2.4, 0, 0], [s * 5, 0, 0], 0.15, MAT.metal()));
    g.add(mesh(new THREE.BoxGeometry(4.5, 0.1, 9), panel, s * 7.3, 0, 0));
  }
  for (let i = 0; i < 6; i++) g.add(mesh(new THREE.BoxGeometry(0.35, 0.3, 0.05), basic('#ffd890'), Math.cos(i) * 2.2, -L / 2 + 2 + i * 1.6, Math.sin(i) * 2.2 + 0.2));
  g.rotation.set(Math.random() * 0.6, 0, Math.PI / 2 + (Math.random() - 0.5) * 0.8);
  return g;
}

const iceMat = () => std('#c4ecff', { metalness: 0.15, roughness: 0.08, flatShading: true, emissive: '#1a4a6e', emissiveIntensity: 0.35 });
export function makeIcePillar(h) {
  const g = new THREE.Group();
  const main = new THREE.CylinderGeometry(0.5, 1.6, h, 6); main.translate(0, h / 2, 0);
  g.add(new THREE.Mesh(main, iceMat()));
  for (const [x, z, k, a] of [[0.9, 0.4, 0.55, 0.3], [-0.8, -0.3, 0.4, -0.35]]) {
    const c = new THREE.CylinderGeometry(0.2, 0.7, h * k, 6); c.translate(0, (h * k) / 2, 0);
    const m = new THREE.Mesh(c, iceMat()); m.position.set(x, 0, z); m.rotation.z = a; g.add(m);
  }
  return g;
}
export function makeArch() {
  const g = new THREE.Group();
  const mat = iceMat();
  for (const s of [-1, 1]) { const c = new THREE.CylinderGeometry(0.9, 1.3, 16, 6); g.add(mesh(c, mat, s * 8, 8, 0)); }
  const t = new THREE.CylinderGeometry(1.0, 1.0, 19, 6); t.rotateZ(Math.PI / 2);
  g.add(mesh(t, mat, 0, 16, 0));
  for (const s of [-1, 1]) g.add(mesh(new THREE.OctahedronGeometry(1.2), mat, s * 8, 16, 0));
  return g;
}
export function makeRing(gold) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.22, 12, 40), std(gold ? '#ffcf40' : '#e4ebf2', { metalness: 1, roughness: 0.18, emissive: gold ? '#6a4a00' : '#303844', emissiveIntensity: 0.5 }));
  g.add(m);
  g.add(glowSprite(gold ? '#ffd35a' : '#ffffff', 3.6, 0.3));
  g.userData.spin = m;
  return g;
}
export function makeItem(kind) {
  const g = new THREE.Group();
  const col = kind === 'laser' ? '#4af0ff' : '#ff9a3a';
  const spin = new THREE.Group();
  const core = kind === 'laser' ? new THREE.OctahedronGeometry(0.8).scale(0.8, 1.4, 0.8) : new THREE.SphereGeometry(0.8, 16, 10);
  spin.add(new THREE.Mesh(core, std(col, { emissive: col, emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.2 })));
  spin.add(new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.12, 8, 28), MAT.metal()));
  g.add(spin);
  g.add(glowSprite(col, 3.6, 0.55));
  g.userData.spin = spin;
  return g;
}
export function makeProtostar(color, r) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), basic(color, { fog: false })));
  const s = glowSprite(color, r * 7, 0.55); s.material = s.material.clone(); s.material.fog = false; g.add(s);
  return g;
}
export function makeWireShape(r) {
  const geo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r, 0));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, toneMapped: false }));
}
// Energieschild als leuchtende Blase
export function makeShield(r, color = '#9fb0ff') {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
  const w = makeWireShape(r * 1.01); w.material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, toneMapped: false }); g.add(w);
  return g;
}

// ---------- Himmel, Planeten, Umgebung ----------
const rnd = (a, b) => a + Math.random() * (b - a);
function srgb(t) { t.colorSpace = THREE.SRGBColorSpace; return t; }

// Sternenhimmel mit Nebel als Rundum-Panorama
export function skyTexture(o = {}) {
  const W = 2048, H = 1024;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = o.base || '#04050c'; x.fillRect(0, 0, W, H);
  const neb = o.nebula || ['#2a3a7a', '#5a2a6a', '#1a5a7a'];
  const dens = o.density ?? 1;
  const blob = (px, py, r, col, a) => {
    for (const dx of [-W, 0, W]) {
      const g = x.createRadialGradient(px + dx, py, 0, px + dx, py, r);
      g.addColorStop(0, col + Math.round(a * 255).toString(16).padStart(2, '0'));
      g.addColorStop(1, col + '00');
      x.fillStyle = g; x.fillRect(px + dx - r, py - r, r * 2, r * 2);
    }
  };
  x.globalCompositeOperation = 'lighter';
  const phase = rnd(0, 6);
  for (let i = 0; i < 110 * dens; i++) {
    const px = rnd(0, W);
    const py = H / 2 + Math.sin((px / W) * Math.PI * 3 + phase) * 140 + rnd(-1, 1) * rnd(0, 220);
    blob(px, py, rnd(50, 240), neb[i % neb.length], rnd(0.05, 0.13) * (o.glow ?? 1));
  }
  // dunkle Staubbahnen
  x.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 40 * dens; i++) {
    const px = rnd(0, W), py = H / 2 + Math.sin((px / W) * Math.PI * 3 + phase) * 140 + rnd(-60, 60);
    blob(px, py, rnd(30, 110), o.dust || '#000000', rnd(0.08, 0.2));
  }
  // Sterne
  x.globalCompositeOperation = 'lighter';
  const stars = o.stars ?? 1;
  for (let i = 0; i < 3500 * stars; i++) {
    const a = Math.pow(Math.random(), 2.5);
    x.fillStyle = `rgba(${200 + rnd(0, 55)},${210 + rnd(0, 45)},255,${0.25 + a * 0.75})`;
    const s = a > 0.85 ? 2 : 1;
    x.fillRect(rnd(0, W), rnd(0, H), s, s);
  }
  for (let i = 0; i < 70 * stars; i++) {
    const px = rnd(0, W), py = rnd(0, H);
    blob(px, py, rnd(4, 10), '#ffffff', 0.7);
    blob(px, py, rnd(12, 26), neb[i % neb.length], 0.25);
  }
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  return srgb(t);
}

// Hellere Umgebung nur für Spiegelungen auf den Schiffen
export function envTexture(o = {}) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, o.top || '#b8c8e8');
  g.addColorStop(0.45, o.mid || '#4a5a8a');
  g.addColorStop(0.55, o.horizon || '#2a2a4a');
  g.addColorStop(1, o.bottom || '#0a0a12');
  x.fillStyle = g; x.fillRect(0, 0, 512, 256);
  x.globalCompositeOperation = 'lighter';
  for (const [px, py, r, col] of [[140, 60, 40, '#ffffff'], [380, 90, 90, o.accent || '#6a4aa0'], [40, 130, 70, o.accent2 || '#2a6a9a']]) {
    const rg = x.createRadialGradient(px, py, 0, px, py, r);
    rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = rg; x.fillRect(0, 0, 512, 256);
  }
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  return srgb(t);
}

// Planeten als echte beleuchtete Kugeln im Hintergrund
export function makePlanet(kind, size) {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const x = c.getContext('2d');
  if (kind === 'saturn') {
    for (let y = 0; y < 256; y++) {
      const v = Math.sin(y * 0.19) * 0.5 + Math.sin(y * 0.047 + 1) * 0.5;
      x.fillStyle = `rgb(${210 + v * 30},${180 + v * 30},${120 + v * 30})`;
      x.fillRect(0, y, 512, 1);
    }
  } else {
    x.fillStyle = '#8a8276'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 260; i++) {
      const px = rnd(0, 512), py = rnd(20, 236), r = Math.pow(Math.random(), 2) * 22 + 2;
      x.fillStyle = 'rgba(40,36,30,0.35)'; x.beginPath(); x.ellipse(px, py, r, r * 0.8, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(220,210,190,0.25)'; x.beginPath(); x.ellipse(px - r * 0.2, py - r * 0.25, r * 0.8, r * 0.55, 0, 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.arc(300, 120, 4, 0, Math.PI * 2); x.fill();
  }
  const mat = new THREE.MeshStandardMaterial({ map: srgb(new THREE.CanvasTexture(c)), roughness: 1, metalness: 0, fog: false });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(size, 48, 32), mat);
  planet.rotation.z = 0.3;
  g.add(planet);
  if (kind === 'saturn') {
    const rc = document.createElement('canvas'); rc.width = rc.height = 512;
    const rx = rc.getContext('2d');
    for (let r = 0; r < 256; r++) {
      const f = r / 256;
      if (f < 0.55) continue;
      const a = (Math.sin(r * 0.7) * 0.3 + 0.55) * (f > 0.8 && f < 0.83 ? 0.1 : 1);
      rx.strokeStyle = `rgba(${220 - r * 0.2},${200 - r * 0.3},${160 - r * 0.3},${a})`;
      rx.beginPath(); rx.arc(256, 256, r, 0, Math.PI * 2); rx.stroke();
    }
    const ring = new THREE.Mesh(new THREE.RingGeometry(size * 1.25, size * 2.3, 96), new THREE.MeshStandardMaterial({ map: srgb(new THREE.CanvasTexture(rc)), transparent: true, side: THREE.DoubleSide, roughness: 1, metalness: 0, fog: false, depthWrite: false }));
    // RingGeometry-UVs sind planar: Kreis-Textur passt genau
    ring.rotation.set(-Math.PI / 2 + 0.35, 0.25, 0);
    g.add(ring);
  }
  return g;
}

export function backdropTexture(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  if (kind === 'galaxy') {
    x.translate(128, 128);
    for (let i = 0; i < 2200; i++) {
      const a = i * 0.05, r = Math.pow(i / 2200, 0.6) * 118;
      const arm = (i % 2) * Math.PI;
      const px = Math.cos(a * 0.5 + arm) * r + (Math.random() - 0.5) * 12, py = Math.sin(a * 0.5 + arm) * r * 0.45 + (Math.random() - 0.5) * 8;
      x.fillStyle = `rgba(${200 + Math.random() * 55},${180 + Math.random() * 60},255,${0.5 * (1 - r / 130)})`;
      x.fillRect(px, py, 2, 2);
    }
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 34); g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(1, 'rgba(255,240,210,0)');
    x.fillStyle = g; x.fillRect(-34, -34, 68, 68);
  } else if (kind === 'cloud') {
    for (let i = 0; i < 26; i++) {
      const px = 60 + Math.random() * 136, py = 60 + Math.random() * 136, r = 20 + Math.random() * 50;
      const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    }
  }
  return srgb(new THREE.CanvasTexture(c));
}

export function iceTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#9ec8e0'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '70,110,150'},${0.08 + Math.random() * 0.12})`; x.fillRect(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 40, 3 + Math.random() * 10); }
  x.strokeStyle = 'rgba(40,80,120,0.5)'; x.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) { x.beginPath(); let px = Math.random() * 256, py = Math.random() * 256; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (Math.random() - 0.5) * 60; py += (Math.random() - 0.5) * 60; x.lineTo(px, py); } x.stroke(); }
  const t = srgb(new THREE.CanvasTexture(c));
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 12);
  return t;
}
