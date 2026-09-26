// Low-Poly-Modelle im N64-Stil – alles per Code gebaut.
import * as THREE from './three.module.min.js';

// ---------- Hilfen ----------
const cache = {};
export function lambert(color, opts = {}) {
  const key = 'L' + color + JSON.stringify(opts);
  return cache[key] || (cache[key] = new THREE.MeshLambertMaterial({ color, flatShading: true, side: THREE.DoubleSide, ...opts }));
}
export function basic(color, opts = {}) {
  const key = 'B' + color + JSON.stringify(opts);
  return cache[key] || (cache[key] = new THREE.MeshBasicMaterial({ color, ...opts }));
}
export function glowMat(color, opacity = 1) {
  const key = 'G' + color + opacity;
  return cache[key] || (cache[key] = new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
}

// Polygon-Geometrie aus Punkten und Dreiecken (flach schattiert)
function poly(verts, tris) {
  const pos = [];
  for (const [a, b, c] of tris) pos.push(...verts[a], ...verts[b], ...verts[c]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

let _glow;
export function glowTexture() {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  return (_glow = new THREE.CanvasTexture(c));
}

export function glowSprite(color, size, opacity = 1) {
  const s = new THREE.Sprite(glowMat(color, opacity));
  s.scale.set(size, size, 1);
  return s;
}

// ---------- Spielerschiff LUMEN ----------
export function makePlayerShip() {
  const g = new THREE.Group();
  const body = poly(
    [[0, 0, -2.4], [0, 0.42, 0.2], [0, -0.3, 0.3], [-0.55, 0.02, 0.45], [0.55, 0.02, 0.45], [0, 0.08, 1.3]],
    [[0, 1, 3], [0, 4, 1], [0, 3, 2], [0, 2, 4], [1, 5, 3], [1, 4, 5], [2, 3, 5], [2, 5, 4]]
  );
  g.add(new THREE.Mesh(body, lambert('#e8ecf4')));
  // Flügel
  for (const s of [-1, 1]) {
    const w = poly([[s * 0.4, 0, -0.3], [s * 0.45, 0, 0.9], [s * 2.4, -0.25, 1.05], [s * 1.2, 0.05, 0.4]], [[0, 1, 3], [1, 2, 3]]);
    g.add(new THREE.Mesh(w, lambert('#c8d0de')));
    const stripe = poly([[s * 1.2, 0.07, 0.42], [s * 2.35, -0.22, 1.02], [s * 1.9, -0.12, 0.62]], [[0, 1, 2]]);
    g.add(new THREE.Mesh(stripe, lambert('#2fc4c8', { emissive: '#0a4a4c' })));
    // Lichtsegel an den Flügelspitzen
    const fin = poly([[s * 2.35, -0.25, 1.05], [s * 2.2, 0.65, 1.3], [s * 2.3, -0.2, 0.3]], [[0, 1, 2]]);
    g.add(new THREE.Mesh(fin, lambert('#ffb347', { emissive: '#5a2a00' })));
  }
  // Cockpit
  const cp = poly([[0, 0.28, -0.9], [-0.22, 0.3, -0.1], [0.22, 0.3, -0.1], [0, 0.62, 0.15], [0, 0.3, 0.35]], [[0, 1, 3], [0, 3, 2], [1, 4, 3], [2, 3, 4]]);
  g.add(new THREE.Mesh(cp, lambert('#6fe0ff', { emissive: '#1a5a7a' })));
  // Triebwerksglühen
  const eng = glowSprite('#7fd8ff', 1.6);
  eng.position.set(0, 0.05, 1.45);
  g.add(eng);
  g.userData.engine = eng;
  return g;
}

// Flügelmann-Schiffe (kleiner, andere Farben)
export function makeWingman(color) {
  const g = makePlayerShip();
  g.scale.setScalar(0.7);
  g.traverse((o) => { if (o.isMesh && o.material.color && o.material.color.getHexString() === 'e8ecf4') o.material = lambert(color); });
  return g;
}

// ---------- Echos (Gegner aus geordnetem Nichts) ----------
const echoMat = () => lambert('#d8e4ff', { emissive: '#28306a' });
const echoCore = () => basic('#ffffff');

export function makeDrone() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.TetrahedronGeometry(1.1), echoMat());
  m.rotation.set(0.6, 0.3, 0);
  g.add(m);
  const c = glowSprite('#9fb0ff', 1.6, 0.9); g.add(c);
  g.userData.spin = m;
  return g;
}
export function makeDart() {
  const g = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(0.9); geo.scale(0.8, 0.5, 2.6);
  const m = new THREE.Mesh(geo, lambert('#ffd0e8', { emissive: '#5a1440' }));
  g.add(m);
  g.add(glowSprite('#ff7ad0', 1.4, 0.9));
  return g;
}
export function makeMine() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(1.0), lambert('#ff5a6a', { emissive: '#6a0010' }));
  g.add(m);
  for (const [x, y, z] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const s = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), lambert('#aa2030'));
    s.position.set(x * 1.1, y * 1.1, z * 1.1);
    s.lookAt(x * 3, y * 3, z * 3); s.rotateX(Math.PI / 2);
    g.add(s);
  }
  const glow = glowSprite('#ff3040', 2.2, 0.8); g.add(glow);
  g.userData.spin = m; g.userData.glow = glow;
  return g;
}
export function makeSplitter() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(2.0, 0), echoMat());
  g.add(m);
  g.add(glowSprite('#b0c0ff', 3.2, 0.8));
  g.userData.spin = m;
  return g;
}
export function makeTurret() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 1.0, 6), lambert('#5a6070'));
  g.add(base);
  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9), lambert('#d8e4ff', { emissive: '#28306a' }));
  head.position.y = 1.0; g.add(head);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 1.6), lambert('#303848'));
  barrel.position.set(0, 1.0, -0.9); g.add(barrel);
  g.userData.head = head;
  return g;
}

// ---------- Hindernisse & Kulisse ----------
const astGeos = [];
export function makeAsteroid(r) {
  if (!astGeos.length) {
    for (let k = 0; k < 4; k++) {
      const geo = new THREE.IcosahedronGeometry(1, 1);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(p, i);
        const n = 0.75 + 0.5 * Math.abs(Math.sin(v.x * 3.1 + k) * Math.cos(v.y * 2.7 - k) + Math.sin(v.z * 4.3 + k * 2) * 0.4);
        v.multiplyScalar(n);
        p.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals();
      astGeos.push(geo.toNonIndexed());
    }
  }
  const cols = ['#7a6a5a', '#6a625a', '#8a7a68', '#5a5048'];
  const k = Math.floor(Math.random() * 4);
  const m = new THREE.Mesh(astGeos[k], lambert(cols[k]));
  m.scale.setScalar(r);
  m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  return m;
}

export function makeGirder(len = 30) {
  const g = new THREE.Group();
  const mat = lambert('#8a8f9a');
  for (const [x, y] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, len), mat); b.position.set(x, y, 0); g.add(b);
  }
  for (let z = -len / 2; z <= len / 2; z += 4) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 0.2), lambert('#ffb347')); r.position.set(0, 1, z); g.add(r);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.3, 0.2), mat); r2.position.set(-1, 0, z); g.add(r2);
  }
  return g;
}

export function makeIcePillar(h) {
  const geo = new THREE.CylinderGeometry(0.6, 2.2, h, 6, 1);
  const m = new THREE.Mesh(geo, lambert('#bfe6ff', { emissive: '#12324a' }));
  m.position.y = h / 2;
  const g = new THREE.Group(); g.add(m);
  return g;
}
export function makeArch() {
  const g = new THREE.Group();
  const mat = lambert('#9fd8ff', { emissive: '#103048' });
  const l = new THREE.Mesh(new THREE.BoxGeometry(2, 16, 2), mat); l.position.set(-8, 8, 0); g.add(l);
  const r = new THREE.Mesh(new THREE.BoxGeometry(2, 16, 2), mat); r.position.set(8, 8, 0); g.add(r);
  const t = new THREE.Mesh(new THREE.BoxGeometry(18, 2, 2), mat); t.position.set(0, 16, 0); g.add(t);
  return g;
}
export function makeRing(gold) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.28, 5, 12), lambert(gold ? '#ffd35a' : '#e0e8f0', { emissive: gold ? '#6a4a00' : '#404850' }));
  g.add(m);
  g.add(glowSprite(gold ? '#ffd35a' : '#ffffff', 3.2, 0.5));
  g.userData.spin = m;
  return g;
}
export function makeItem(kind) {
  const g = new THREE.Group();
  const col = kind === 'laser' ? '#4af0ff' : '#ff9a3a';
  const m = new THREE.Mesh(new THREE.OctahedronGeometry(1.0), lambert(col, { emissive: col, emissiveIntensity: 0.35 }));
  g.add(m);
  g.add(glowSprite(col, 3.4, 0.7));
  g.userData.spin = m;
  return g;
}
export function makeProtostar(color, r) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), basic(color));
  g.add(m);
  g.add(glowSprite(color, r * 6, 0.6));
  return g;
}
export function makeWireShape(r) {
  const geo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(r, 0));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5 }));
}

// Weltraum-Hintergrundbilder (Planeten, Galaxien) als Canvas-Textur
export function backdropTexture(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  if (kind === 'saturn') {
    x.save(); x.translate(128, 128); x.rotate(-0.35);
    x.strokeStyle = 'rgba(230,210,170,0.8)'; x.lineWidth = 10; x.beginPath(); x.ellipse(0, 0, 118, 30, 0, Math.PI, Math.PI * 2); x.stroke();
    const g = x.createRadialGradient(-20, -20, 10, 0, 0, 62); g.addColorStop(0, '#f4e2b8'); g.addColorStop(1, '#a88a5a');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 60, 0, Math.PI * 2); x.fill();
    for (let i = -3; i <= 3; i++) { x.fillStyle = `rgba(150,110,60,${0.15 + (i % 2) * 0.1})`; x.fillRect(-60, i * 14, 120, 5); }
    x.beginPath(); x.ellipse(0, 0, 118, 30, 0, 0, Math.PI); x.stroke();
    x.restore();
  } else if (kind === 'ceres') {
    const g = x.createRadialGradient(100, 100, 10, 128, 128, 110); g.addColorStop(0, '#b0a898'); g.addColorStop(1, '#4a443c');
    x.fillStyle = g; x.beginPath(); x.arc(128, 128, 110, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(40,36,30,0.35)'; x.beginPath(); x.arc(40 + Math.random() * 180, 40 + Math.random() * 180, 3 + Math.random() * 12, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#fff'; x.beginPath(); x.arc(150, 120, 5, 0, Math.PI * 2); x.fill();
  } else if (kind === 'galaxy') {
    x.translate(128, 128);
    for (let i = 0; i < 1400; i++) {
      const a = i * 0.05, r = Math.pow(i / 1400, 0.6) * 118;
      const arm = (i % 2) * Math.PI;
      const px = Math.cos(a * 0.5 + arm) * r + (Math.random() - 0.5) * 12, py = Math.sin(a * 0.5 + arm) * r * 0.45 + (Math.random() - 0.5) * 8;
      x.fillStyle = `rgba(${200 + Math.random() * 55},${180 + Math.random() * 60},255,${0.5 * (1 - r / 130)})`;
      x.fillRect(px, py, 2, 2);
    }
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 30); g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(1, 'rgba(255,240,210,0)');
    x.fillStyle = g; x.fillRect(-30, -30, 60, 60);
  } else if (kind === 'cloud') {
    for (let i = 0; i < 26; i++) {
      const px = 60 + Math.random() * 136, py = 60 + Math.random() * 136, r = 20 + Math.random() * 50;
      const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    }
  }
  return new THREE.CanvasTexture(c);
}

export function iceTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#9ec8e0'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '70,110,150'},${0.08 + Math.random() * 0.12})`; x.fillRect(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 40, 3 + Math.random() * 10); }
  x.strokeStyle = 'rgba(40,80,120,0.5)'; x.lineWidth = 1.5;
  for (let i = 0; i < 14; i++) { x.beginPath(); let px = Math.random() * 256, py = Math.random() * 256; x.moveTo(px, py); for (let k = 0; k < 5; k++) { px += (Math.random() - 0.5) * 60; py += (Math.random() - 0.5) * 60; x.lineTo(px, py); } x.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 12);
  return t;
}
