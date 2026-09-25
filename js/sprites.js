// Alle Grafiken werden per Code gezeichnet – gestochen scharf auf jeder Auflösung.

export const LEVELS = [
  { name: 'Tropfi',      r: 13,  c: '#7fd3ff', acc: 'drop' },
  { name: 'Blubbi',      r: 18,  c: '#5ee0c0', acc: 'curl' },
  { name: 'Klecks',      r: 24,  c: '#9be15d', acc: 'leaf' },
  { name: 'Glibber',     r: 31,  c: '#ffe066', acc: 'dots' },
  { name: 'Schleimi',    r: 38,  c: '#ffb454', acc: 'drip' },
  { name: 'Wabbel',      r: 47,  c: '#ff7b7b', acc: 'freckles' },
  { name: 'Pudding',     r: 57,  c: '#ff8fc8', acc: 'cream' },
  { name: 'Knödel',      r: 68,  c: '#c79bff', acc: 'antenna' },
  { name: 'Wolke',       r: 80,  c: '#8fa6ff', acc: 'puff' },
  { name: 'Mondi',       r: 94,  c: '#5b6cff', acc: 'stars' },
  { name: 'König Blubb', r: 110, c: '#ffcf3f', acc: 'crown' },
];
export const MAX_LEVEL = LEVELS.length - 1;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// amt > 0 aufhellen (Richtung Weiß), amt < 0 abdunkeln (Richtung Dunkellila statt Schwarz)
export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const t = amt > 0 ? [255, 255, 255] : [40, 20, 60];
  const a = Math.abs(amt);
  const m = (x, y) => Math.round(x + (y - x) * a);
  return `rgb(${m(r, t[0])},${m(g, t[1])},${m(b, t[2])})`;
}
export function rgba(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

const PAD = 0.75; // Platz für Accessoires außerhalb des Kreises

// Körper eines Blubbs (ohne Gesicht), zentriert im Ursprung, Radius r
export function drawBody(ctx, lv, r) {
  const L = LEVELS[lv];
  const base = L.c;
  const outline = shade(base, -0.55);
  const lw = Math.max(1.2, r * 0.075);

  // Accessoires hinter dem Körper
  ctx.save();
  ctx.lineWidth = lw;
  ctx.strokeStyle = outline;
  ctx.lineJoin = ctx.lineCap = 'round';
  if (L.acc === 'antenna') {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * r * 0.3, -r * 0.85);
      ctx.quadraticCurveTo(s * r * 0.45, -r * 1.25, s * r * 0.55, -r * 1.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = '#ffe066';
      ctx.arc(s * r * 0.55, -r * 1.3, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }
  if (L.acc === 'leaf') {
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.quadraticCurveTo(r * 0.1, -r * 1.35, r * 0.55, -r * 1.35);
    ctx.quadraticCurveTo(r * 0.4, -r * 0.95, 0, -r * 0.9);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(-r * 0.05, -r * 1.2);
    ctx.stroke();
  }
  if (L.acc === 'curl') {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.bezierCurveTo(-r * 0.05, -r * 1.35, r * 0.4, -r * 1.35, r * 0.28, -r * 1.12);
    ctx.bezierCurveTo(r * 0.2, -r * 1.0, r * 0.05, -r * 1.1, r * 0.12, -r * 1.18);
    ctx.stroke();
  }
  if (L.acc === 'drop') {
    // Tropfenspitze oben
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.8);
    ctx.quadraticCurveTo(0, -r * 1.05, r * 0.05, -r * 1.45);
    ctx.quadraticCurveTo(r * 0.25, -r * 1.0, r * 0.5, -r * 0.8);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Hauptkörper
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, shade(base, 0.45));
  g.addColorStop(0.55, base);
  g.addColorStop(1, shade(base, -0.18));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r - lw / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = outline;
  ctx.stroke();

  // Innere Unterseite: leichter Schatten
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r - lw, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(60,20,80,0.10)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.75, r * 1.1, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Muster innerhalb des Körpers
  if (L.acc === 'dots') {
    ctx.fillStyle = shade(base, -0.12);
    for (const [x, y, s] of [[-0.55, 0.45, 0.12], [0.6, -0.35, 0.1], [0.45, 0.6, 0.08], [-0.2, -0.7, 0.07]]) {
      ctx.beginPath(); ctx.arc(x * r, y * r, s * r, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (L.acc === 'stars') {
    ctx.fillStyle = 'rgba(255,255,220,0.85)';
    for (const [x, y, s] of [[-0.6, 0.5, 0.07], [0.55, -0.55, 0.09], [0.65, 0.45, 0.06], [-0.1, 0.75, 0.05], [0.1, -0.78, 0.05]]) {
      star(ctx, x * r, y * r, s * r);
    }
  }
  if (L.acc === 'cream') {
    // Sahnehaube
    ctx.fillStyle = '#fff6ee';
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.35);
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const x = -r + (2 * r * i) / n;
      ctx.quadraticCurveTo(x - r / n, -r * 0.1, x, -r * 0.32);
    }
    ctx.lineTo(r, -r);
    ctx.lineTo(-r, -r);
    ctx.fill();
    ctx.fillStyle = '#e53950';
    ctx.beginPath(); ctx.arc(r * 0.05, -r * 0.82, r * 0.14, 0, Math.PI * 2); ctx.fill();
  }
  if (L.acc === 'drip') {
    ctx.fillStyle = shade(base, 0.35);
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.5);
    ctx.bezierCurveTo(-r * 0.6, -r * 0.3, -r * 0.5, -r * 0.1, -r * 0.4, -r * 0.45);
    ctx.bezierCurveTo(-r * 0.3, r * 0.05, -r * 0.1, r * 0.0, -r * 0.05, -r * 0.5);
    ctx.bezierCurveTo(r * 0.2, -r * 0.3, r * 0.5, -r * 0.2, r, -r * 0.55);
    ctx.lineTo(r, -r); ctx.lineTo(-r, -r);
    ctx.fill();
  }
  if (L.acc === 'puff') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (const [x, y, s] of [[-0.55, -0.55, 0.35], [-0.15, -0.72, 0.3], [0.3, -0.65, 0.3]]) {
      ctx.beginPath(); ctx.arc(x * r, y * r, s * r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();

  // Glanzlicht
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.translate(-r * 0.45, -r * 0.45);
  ctx.rotate(-0.7);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.22, r * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.arc(-r * 0.18, -r * 0.66, r * 0.055, 0, Math.PI * 2);
  ctx.fill();

  // Accessoires vor dem Körper
  if (L.acc === 'crown') {
    ctx.save();
    ctx.lineWidth = lw * 0.8;
    ctx.strokeStyle = shade('#ffcf3f', -0.6);
    ctx.lineJoin = 'round';
    const w = r * 0.7, y0 = -r * 0.78, h = r * 0.45;
    const cg = ctx.createLinearGradient(0, y0 - h, 0, y0);
    cg.addColorStop(0, '#fff3a0');
    cg.addColorStop(1, '#ffb300');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(-w / 2, y0);
    ctx.lineTo(-w / 2, y0 - h * 0.6);
    ctx.lineTo(-w / 4, y0 - h * 0.25);
    ctx.lineTo(0, y0 - h);
    ctx.lineTo(w / 4, y0 - h * 0.25);
    ctx.lineTo(w / 2, y0 - h * 0.6);
    ctx.lineTo(w / 2, y0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    for (const [x, c] of [[-w / 4, '#e53950'], [0, '#3fa7ff'], [w / 4, '#43c46a']]) {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(x, y0 - h * 0.12, r * 0.05, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  if (L.acc === 'freckles') {
    ctx.fillStyle = shade(base, -0.3);
    for (const [x, y] of [[-0.5, 0.28], [-0.42, 0.36], [-0.58, 0.38], [0.5, 0.28], [0.42, 0.36], [0.58, 0.38]]) {
      ctx.beginPath(); ctx.arc(x * r, y * r, r * 0.025, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function star(ctx, x, y, s) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const rr = i % 2 ? s * 0.45 : s;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

// Gesicht (live gezeichnet, damit Blinzeln/Blicke/Ausdrücke möglich sind)
// mood: 'normal' | 'happy' | 'worried' | 'squish' | 'sleep'
export function drawFace(ctx, r, mood, blink, lookX, lookY) {
  const dark = '#2d1b3d';
  const ex = r * 0.32, ey = -r * 0.06;
  const er = r * 0.12;
  ctx.lineCap = ctx.lineJoin = 'round';

  // Bäckchen
  ctx.fillStyle = 'rgba(255,90,140,0.35)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * r * 0.55, r * 0.16, r * 0.14, r * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = dark;
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1, r * 0.07);

  if (mood === 'happy' || mood === 'sleep') {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      if (mood === 'happy') ctx.arc(s * ex, ey + er * 0.4, er * 0.9, Math.PI * 1.15, Math.PI * 1.85);
      else ctx.arc(s * ex, ey - er * 0.2, er * 0.9, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
  } else if (mood === 'squish') {
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * ex - s * er, ey - er * 0.8);
      ctx.lineTo(s * ex + s * er * 0.6, ey);
      ctx.lineTo(s * ex - s * er, ey + er * 0.8);
      ctx.stroke();
    }
  } else {
    const open = 1 - blink;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * ex, ey, er * 0.85, Math.max(er * 0.12, er * 1.15 * open), 0, 0, Math.PI * 2);
      ctx.fill();
      if (open > 0.4) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s * ex + lookX * er * 0.5 - er * 0.25, ey + lookY * er * 0.5 - er * 0.4, er * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = dark;
      }
    }
  }

  // Mund
  ctx.beginPath();
  if (mood === 'happy') {
    ctx.moveTo(-r * 0.16, r * 0.14);
    ctx.quadraticCurveTo(0, r * 0.42, r * 0.16, r * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff7a9a';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.26, r * 0.07, r * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (mood === 'worried') {
    ctx.moveTo(-r * 0.12, r * 0.26);
    ctx.quadraticCurveTo(-r * 0.06, r * 0.18, 0, r * 0.24);
    ctx.quadraticCurveTo(r * 0.06, r * 0.3, r * 0.12, r * 0.22);
    ctx.stroke();
    // Schweißtropfen
    ctx.fillStyle = 'rgba(120,200,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(r * 0.62, -r * 0.45);
    ctx.quadraticCurveTo(r * 0.72, -r * 0.25, r * 0.62, -r * 0.2);
    ctx.quadraticCurveTo(r * 0.52, -r * 0.25, r * 0.62, -r * 0.45);
    ctx.fill();
  } else if (mood === 'squish') {
    ctx.ellipse(0, r * 0.24, r * 0.09, r * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (mood === 'sleep') {
    ctx.ellipse(0, r * 0.25, r * 0.05, r * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.arc(0, r * 0.12, r * 0.12, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
}

// Sprite-Cache: vorgerenderte Körper pro Level für die aktuelle Pixeldichte
export class SpriteCache {
  constructor() { this.scale = 0; this.list = []; }
  ensure(scale) {
    if (Math.abs(scale - this.scale) < 0.01) return;
    this.scale = scale;
    this.list = LEVELS.map((L, lv) => {
      const r = L.r;
      const half = r * (1 + PAD);
      const size = Math.ceil(half * 2 * scale);
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const x = c.getContext('2d');
      x.scale(scale, scale);
      x.translate(half, half);
      drawBody(x, lv, r);
      return { canvas: c, half };
    });
  }
}

// Kleine Icons (z.B. für Vorschau/Evolutionskette) als Data-URL
export function iconURL(lv, px, mood = 'normal') {
  const c = document.createElement('canvas');
  c.width = c.height = px;
  const x = c.getContext('2d');
  const r = LEVELS[lv].r;
  const half = r * 1.5;
  const s = px / (half * 2);
  x.scale(s, s);
  x.translate(half, half * 1.08);
  drawBody(x, lv, r);
  drawFace(x, r, mood, 0, 0, 0);
  return c.toDataURL();
}
