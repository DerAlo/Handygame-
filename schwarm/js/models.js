// SCHWARMSTURM – Modelle (alles per Code gebaut, sparsam für Handys)
import * as THREE from '../../urlicht/js/three.module.min.js';

const cache = {};
export const mat = (color, o = {}) => cache['L' + color + JSON.stringify(o)] || (cache['L' + color + JSON.stringify(o)] = new THREE.MeshLambertMaterial({ color, ...o }));
export const vmat = () => cache.V || (cache.V = new THREE.MeshLambertMaterial({ vertexColors: true }));
export const basic = (color, o = {}) => cache['B' + color + JSON.stringify(o)] || (cache['B' + color + JSON.stringify(o)] = new THREE.MeshBasicMaterial({ color, ...o }));

// Mehrere Teile mit eigener Farbe zu einer Geometrie verschmelzen (ein Draw-Call)
export function merge(parts) {
  const pos = [], nor = [], col = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (const p of parts) {
    let g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    e.set(...(p.rot || [0, 0, 0])); q.setFromEuler(e);
    m.compose(new THREE.Vector3(...(p.pos || [0, 0, 0])), q, new THREE.Vector3(...(p.scale || [1, 1, 1])));
    g.applyMatrix4(m);
    const c = new THREE.Color(p.color);
    const P = g.attributes.position.array, N = g.attributes.normal.array;
    for (let i = 0; i < P.length; i++) { pos.push(P[i]); nor.push(N[i]); }
    for (let i = 0; i < P.length / 3; i++) col.push(c.r, c.g, c.b);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return out;
}

// ---------- Kämpfer ----------
// Blau: Helm mit Visier, Gewehr. Rot: Stachelhelm.
export function unitGeo(team) {
  const T = team === 'blue' ? { body: '#2f7fff', dark: '#1a4ab0', light: '#7ab8ff' } : { body: '#e8323a', dark: '#9a1a20', light: '#ff8a7a' };
  const parts = [
    { geo: new THREE.CylinderGeometry(0.13, 0.15, 0.55, 6), pos: [-0.14, 0.28, 0], color: T.dark },
    { geo: new THREE.CylinderGeometry(0.13, 0.15, 0.55, 6), pos: [0.14, 0.28, 0], color: T.dark },
    { geo: new THREE.CylinderGeometry(0.27, 0.3, 0.62, 8), pos: [0, 0.84, 0], color: T.body },
    { geo: new THREE.CylinderGeometry(0.31, 0.31, 0.1, 8), pos: [0, 0.58, 0], color: T.dark },
    { geo: new THREE.SphereGeometry(0.27, 10, 8), pos: [0, 1.38, 0], color: T.body },
    { geo: new THREE.SphereGeometry(0.29, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), pos: [0, 1.42, 0], color: T.light },
    { geo: new THREE.CylinderGeometry(0.09, 0.09, 0.45, 5), pos: [-0.33, 0.9, -0.05], rot: [0.3, 0, 0.15], color: T.body },
    { geo: new THREE.CylinderGeometry(0.09, 0.09, 0.45, 5), pos: [0.33, 0.9, -0.1], rot: [0.9, 0, -0.15], color: T.body },
  ];
  if (team === 'blue') {
    parts.push({ geo: new THREE.BoxGeometry(0.34, 0.1, 0.05), pos: [0, 1.4, -0.25], color: '#0a1a3a' });
    parts.push({ geo: new THREE.BoxGeometry(0.1, 0.12, 0.6), pos: [0.3, 1.0, -0.4], color: '#2a2e36' });
  } else {
    parts.push({ geo: new THREE.ConeGeometry(0.09, 0.32, 5), pos: [0, 1.78, 0], color: '#3a3a3a' });
    parts.push({ geo: new THREE.BoxGeometry(0.3, 0.07, 0.05), pos: [0, 1.38, 0.25], color: '#ffd23a' });
    parts.push({ geo: new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4), pos: [0.36, 1.0, 0.1], rot: [0.3, 0, 0], color: '#6a4a2a' });
  }
  return merge(parts);
}

// ---------- Text-Schilder (Zahlen auf Fässern, Toren, Horden) ----------
export function labelSprite(text, o = {}) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: o.depthTest ?? true, transparent: true }));
  s.scale.set(o.w || 3, (o.w || 3) / 2, 1);
  s.userData.set = (txt, fg = o.fg || '#ffffff', bg = o.bg || null) => {
    const x = c.getContext('2d');
    x.clearRect(0, 0, 256, 128);
    if (bg) { x.fillStyle = bg; x.beginPath(); x.roundRect(8, 14, 240, 100, 30); x.fill(); }
    x.font = `900 ${o.size || 78}px system-ui, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 12; x.strokeStyle = 'rgba(0,0,0,0.55)'; x.strokeText(txt, 128, 68);
    x.fillStyle = fg; x.fillText(txt, 128, 68);
    t.needsUpdate = true;
  };
  s.userData.set(text);
  return s;
}

// Tor-Feld: halbdurchsichtige Scheibe mit Rechenzeichen
export function gatePanel(text, good, w) {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  const grad = x.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, good ? 'rgba(60,170,255,0.75)' : 'rgba(255,60,70,0.75)'); grad.addColorStop(1, good ? 'rgba(20,90,220,0.55)' : 'rgba(180,20,30,0.55)');
  x.fillStyle = grad; x.fillRect(0, 0, 256, 256);
  x.font = '900 110px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 10; x.strokeStyle = 'rgba(0,0,0,0.35)'; x.strokeText(text, 128, 132);
  x.fillStyle = '#ffffff'; x.fillText(text, 128, 132);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, 3.2), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  p.position.y = 1.9; g.add(p);
  const frame = mat(good ? '#e8f4ff' : '#ffe0e0');
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.8, 0.25), frame); post.position.set(s * w / 2, 1.9, 0); g.add(post); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.25, 0.25, 0.25), frame); top.position.y = 3.8; g.add(top);
  g.userData.panel = p;
  return g;
}

// ---------- Hindernisse ----------
export function barrel() {
  const g = new THREE.Group();
  const geo = merge([
    { geo: new THREE.CylinderGeometry(0.9, 0.9, 1.9, 14), pos: [0, 0.95, 0], color: '#e04a2a' },
    { geo: new THREE.CylinderGeometry(0.93, 0.93, 0.18, 14), pos: [0, 0.4, 0], color: '#3a3a3a' },
    { geo: new THREE.CylinderGeometry(0.93, 0.93, 0.18, 14), pos: [0, 1.5, 0], color: '#3a3a3a' },
    { geo: new THREE.CylinderGeometry(0.7, 0.7, 0.05, 14), pos: [0, 1.92, 0], color: '#ffd23a' },
  ]);
  g.add(new THREE.Mesh(geo, vmat()));
  return g;
}
export function wall(w) {
  const parts = [];
  for (let r = 0; r < 4; r++) for (let i = 0; i < Math.ceil(w / 1.2); i++) {
    const off = r % 2 ? 0.6 : 0;
    const x = -w / 2 + i * 1.2 + off + 0.6;
    if (x > w / 2) continue;
    parts.push({ geo: new THREE.BoxGeometry(1.15, 0.55, 0.8), pos: [x, 0.3 + r * 0.6, 0], color: (i + r) % 3 ? '#b0623a' : '#c8784a' });
  }
  const g = new THREE.Group(); g.add(new THREE.Mesh(merge(parts), vmat()));
  return g;
}
// Waffenkiste mit schwebender Waffe darüber
export function crate(weapon) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge([
    { geo: new THREE.BoxGeometry(1.8, 1.4, 1.8), pos: [0, 0.7, 0], color: '#a8743a' },
    { geo: new THREE.BoxGeometry(1.86, 0.18, 1.86), pos: [0, 0.2, 0], color: '#6a4a22' },
    { geo: new THREE.BoxGeometry(1.86, 0.18, 1.86), pos: [0, 1.2, 0], color: '#6a4a22' },
    { geo: new THREE.BoxGeometry(0.18, 1.42, 1.86), pos: [0, 0.7, 0], color: '#6a4a22' },
  ]), vmat()));
  const gun = gunModel(weapon); gun.position.y = 2.4; gun.scale.setScalar(1.6); g.add(gun);
  g.userData.gun = gun;
  return g;
}
export function gunModel(kind) {
  const gold = '#ffcf3a', dark = '#3a3a40';
  const P = {
    mg: [{ geo: new THREE.BoxGeometry(0.2, 0.25, 1.2), pos: [0, 0, 0], color: gold }, { geo: new THREE.CylinderGeometry(0.06, 0.06, 0.6, 6), pos: [0, 0.03, -0.85], rot: [Math.PI / 2, 0, 0], color: dark }, { geo: new THREE.BoxGeometry(0.12, 0.35, 0.18), pos: [0, -0.25, 0.1], color: dark }, { geo: new THREE.BoxGeometry(0.14, 0.3, 0.12), pos: [0, -0.2, -0.3], rot: [0.3, 0, 0], color: gold }],
    shotgun: [{ geo: new THREE.BoxGeometry(0.22, 0.2, 0.8), pos: [0, 0, 0.2], color: '#8a5a2a' }, { geo: new THREE.CylinderGeometry(0.07, 0.07, 1, 6), pos: [-0.05, 0.05, -0.6], rot: [Math.PI / 2, 0, 0], color: gold }, { geo: new THREE.CylinderGeometry(0.07, 0.07, 1, 6), pos: [0.05, 0.05, -0.6], rot: [Math.PI / 2, 0, 0], color: gold }],
    rocket: [{ geo: new THREE.CylinderGeometry(0.18, 0.18, 1.4, 10), pos: [0, 0, 0], rot: [Math.PI / 2, 0, 0], color: '#4a7a3a' }, { geo: new THREE.ConeGeometry(0.16, 0.35, 8), pos: [0, 0, -0.85], rot: [-Math.PI / 2, 0, 0], color: '#e04a2a' }, { geo: new THREE.BoxGeometry(0.1, 0.3, 0.15), pos: [0, -0.25, 0.2], color: dark }],
    laser: [{ geo: new THREE.BoxGeometry(0.24, 0.24, 1.0), pos: [0, 0, 0], color: '#e8ecf4' }, { geo: new THREE.CylinderGeometry(0.1, 0.06, 0.5, 8), pos: [0, 0, -0.7], rot: [Math.PI / 2, 0, 0], color: '#3af0ff' }, { geo: new THREE.BoxGeometry(0.1, 0.3, 0.15), pos: [0, -0.25, 0.2], color: dark }],
    pistol: [{ geo: new THREE.BoxGeometry(0.16, 0.2, 0.6), pos: [0, 0, 0], color: gold }, { geo: new THREE.BoxGeometry(0.12, 0.3, 0.14), pos: [0, -0.22, 0.15], color: dark }],
  }[kind] || [];
  const g = new THREE.Group(); g.add(new THREE.Mesh(merge(P), vmat()));
  return g;
}

// Kreissäge, die quer über die Straße fährt
export function saw() {
  const g = new THREE.Group();
  const blade = new THREE.Group();
  const parts = [{ geo: new THREE.CylinderGeometry(1.3, 1.3, 0.12, 20), color: '#c8ccd4' }, { geo: new THREE.CylinderGeometry(0.35, 0.35, 0.2, 10), color: '#e04a2a' }];
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; parts.push({ geo: new THREE.ConeGeometry(0.16, 0.42, 4), pos: [Math.cos(a) * 1.42, 0, Math.sin(a) * 1.42], rot: [0, -a, -Math.PI / 2], color: '#9aa0aa' }); }
  blade.add(new THREE.Mesh(merge(parts), vmat()));
  blade.rotation.x = Math.PI / 2; blade.position.y = 1.2;
  g.add(blade);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), mat('#3a3a3a')));
  g.userData.blade = blade;
  return g;
}
// Riesenhammer
export function hammer() {
  const g = new THREE.Group();
  const arm = new THREE.Group(); arm.position.y = 6;
  arm.add(new THREE.Mesh(merge([
    { geo: new THREE.CylinderGeometry(0.15, 0.15, 5.4, 6), pos: [0, -2.7, 0], color: '#6a4a2a' },
    { geo: new THREE.BoxGeometry(2.2, 1.4, 1.4), pos: [0, -5.6, 0], color: '#5a5e68' },
    { geo: new THREE.BoxGeometry(2.3, 0.3, 1.5), pos: [0, -6.1, 0], color: '#e04a2a' },
  ]), vmat()));
  g.add(arm);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 6.4, 0.4), mat('#8a8e98')); p.position.set(s * 1.4, 3.2, 0); g.add(p); }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.3, 0.4), mat('#8a8e98')); bar.position.y = 6.2; g.add(bar);
  g.userData.arm = arm;
  return g;
}
// Schützenturm am Straßenrand
export function tower() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge([
    { geo: new THREE.CylinderGeometry(1.2, 1.5, 3, 8), pos: [0, 1.5, 0], color: '#8a6a4a' },
    { geo: new THREE.CylinderGeometry(1.6, 1.6, 0.4, 8), pos: [0, 3.1, 0], color: '#6a4a2a' },
    { geo: new THREE.BoxGeometry(0.3, 0.6, 0.3), pos: [1.3, 3.5, 0], color: '#6a4a2a' }, { geo: new THREE.BoxGeometry(0.3, 0.6, 0.3), pos: [-1.3, 3.5, 0], color: '#6a4a2a' },
  ]), vmat()));
  return g;
}
// Plus-Platte
export function plusTile(w) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#3a8aff'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#7ab8ff'; x.fillRect(0, 0, 128, 8);
  x.font = '900 40px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText('+1', 64, 36);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, 1.7), [mat('#2a6ad0'), mat('#2a6ad0'), new THREE.MeshLambertMaterial({ map: t }), mat('#2a6ad0'), mat('#2a6ad0'), mat('#2a6ad0')]);
  m.position.y = 0.12;
  return m;
}

// ---------- Bosse ----------
export function brute(color = '#e8323a', weapon = 'axe') {
  const g = new THREE.Group();
  const dark = '#7a1a20';
  const parts = [
    { geo: new THREE.CylinderGeometry(0.35, 0.4, 1.4, 8), pos: [-0.45, 0.7, 0], color: dark }, { geo: new THREE.CylinderGeometry(0.35, 0.4, 1.4, 8), pos: [0.45, 0.7, 0], color: dark },
    { geo: new THREE.CylinderGeometry(0.85, 0.7, 1.8, 10), pos: [0, 2.2, 0], color },
    { geo: new THREE.SphereGeometry(0.62, 12, 10), pos: [0, 3.5, 0], color },
    { geo: new THREE.BoxGeometry(0.8, 0.14, 0.1), pos: [0, 3.55, 0.56], color: '#ffd23a' },
    { geo: new THREE.SphereGeometry(0.45, 10, 8), pos: [-1.05, 2.9, 0], color: dark }, { geo: new THREE.SphereGeometry(0.45, 10, 8), pos: [1.05, 2.9, 0], color: dark },
    { geo: new THREE.CylinderGeometry(0.25, 0.28, 1.4, 8), pos: [-1.15, 2.1, 0.1], rot: [0.2, 0, 0.15], color },
    { geo: new THREE.ConeGeometry(0.16, 0.5, 5), pos: [-0.35, 4.0, 0], rot: [0, 0, 0.5], color: '#e8e0c8' }, { geo: new THREE.ConeGeometry(0.16, 0.5, 5), pos: [0.35, 4.0, 0], rot: [0, 0, -0.5], color: '#e8e0c8' },
  ];
  g.add(new THREE.Mesh(merge(parts), vmat()));
  const arm = new THREE.Group(); arm.position.set(1.15, 2.9, 0);
  arm.add(new THREE.Mesh(merge([
    { geo: new THREE.CylinderGeometry(0.25, 0.28, 1.4, 8), pos: [0, -0.7, 0], color },
    { geo: new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), pos: [0, -1.2, 0.6], rot: [Math.PI / 2, 0, 0], color: '#6a4a2a' },
    { geo: new THREE.BoxGeometry(0.15, 1.0, 0.8), pos: [0, -1.2, 1.9], color: '#c8ccd4' },
  ]), vmat()));
  g.add(arm);
  g.userData.arm = arm;
  return g;
}
export function tankBoss() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge([
    { geo: new THREE.BoxGeometry(1.2, 1.2, 5.5), pos: [-1.9, 0.6, 0], color: '#2a2a2e' }, { geo: new THREE.BoxGeometry(1.2, 1.2, 5.5), pos: [1.9, 0.6, 0], color: '#2a2a2e' },
    { geo: new THREE.BoxGeometry(3.4, 1.4, 5), pos: [0, 1.5, 0], color: '#a8323a' },
    { geo: new THREE.BoxGeometry(3.5, 0.2, 0.6), pos: [0, 2.25, 1.8], color: '#ffd23a' },
  ]), vmat()));
  const turret = new THREE.Group(); turret.position.y = 2.6;
  turret.add(new THREE.Mesh(merge([
    { geo: new THREE.CylinderGeometry(1.3, 1.5, 1.1, 10), color: '#c83a42' },
    { geo: new THREE.CylinderGeometry(0.22, 0.26, 3.2, 8), pos: [0, 0.1, 2.0], rot: [Math.PI / 2, 0, 0], color: '#3a3a40' },
  ]), vmat()));
  g.add(turret);
  g.userData.turret = turret;
  return g;
}
export function golem() {
  const g = new THREE.Group();
  const rock = '#7a6e66', glow = '#ff7a2a';
  const parts = [
    { geo: new THREE.DodecahedronGeometry(0.7), pos: [-0.6, 0.7, 0], color: rock }, { geo: new THREE.DodecahedronGeometry(0.7), pos: [0.6, 0.7, 0], color: rock },
    { geo: new THREE.DodecahedronGeometry(1.4), pos: [0, 2.4, 0], color: rock },
    { geo: new THREE.DodecahedronGeometry(0.75), pos: [0, 4.1, 0.1], color: rock },
    { geo: new THREE.SphereGeometry(0.16, 6, 4), pos: [-0.28, 4.2, 0.7], color: glow }, { geo: new THREE.SphereGeometry(0.16, 6, 4), pos: [0.28, 4.2, 0.7], color: glow },
    { geo: new THREE.SphereGeometry(0.4, 8, 6), pos: [0, 2.5, 1.25], color: glow },
    { geo: new THREE.DodecahedronGeometry(0.75), pos: [-1.8, 2.6, 0], color: rock }, { geo: new THREE.DodecahedronGeometry(0.9), pos: [-1.9, 1.3, 0.3], color: rock },
  ];
  g.add(new THREE.Mesh(merge(parts), vmat()));
  const arm = new THREE.Group(); arm.position.set(1.8, 3.0, 0);
  arm.add(new THREE.Mesh(merge([{ geo: new THREE.DodecahedronGeometry(0.75), color: rock }, { geo: new THREE.DodecahedronGeometry(1.0), pos: [0, -1.4, 0.4], color: rock }]), vmat()));
  g.add(arm);
  g.userData.arm = arm;
  return g;
}

// ---------- Welt ----------
export const THEMES = [
  { name: 'Meeresbrücke', sky: '#8ecbff', fog: '#bfe2ff', water: '#2a8ae0', road: '#c8ccd4', rail: '#8a8e98', side: '#4a7ab8' },
  { name: 'Wüstenpass', sky: '#ffd8a0', fog: '#ffe8c8', water: '#d8a860', road: '#c8b090', rail: '#8a6a4a', side: '#b88a50' },
  { name: 'Eisbrücke', sky: '#cfe8ff', fog: '#eaf4ff', water: '#8ac8f0', road: '#e8f0f8', rail: '#a8c0d8', side: '#c8dcf0' },
  { name: 'Lavaschlucht', sky: '#4a1a1a', fog: '#6a2a1a', water: '#ff6a1a', road: '#5a5050', rail: '#3a3030', side: '#2a2020', emissiveWater: true },
  { name: 'Neonstadt', sky: '#1a1440', fog: '#2a1a5a', water: '#3a2a8a', road: '#3a3a4a', rail: '#ff4ad0', side: '#2a2a4a', neon: true },
];

export function roadTexture(theme) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = theme.road; x.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},0.05)`; x.fillRect(Math.random() * 128, Math.random() * 256, 3, 3); }
  x.fillStyle = theme.neon ? '#4af0ff' : 'rgba(255,255,255,0.85)';
  x.fillRect(42, 0, 4, 110); x.fillRect(82, 0, 4, 110);
  x.fillStyle = 'rgba(0,0,0,0.15)'; x.fillRect(0, 0, 6, 256); x.fillRect(122, 0, 6, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
export function waterTexture(theme) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = theme.water; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.12})`; x.fillRect(Math.random() * 128, Math.random() * 128, 6 + Math.random() * 14, 2); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 60);
  return t;
}
