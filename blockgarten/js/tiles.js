// Alle Grafiken per Code gezeichnet: Beet-Kacheln mit Blütenmotiv, leere Erde, Blumen.

export const COLORS = ['#ff7aa2', '#ffae5c', '#ffd54f', '#7ed957', '#4fd1c5', '#6aa9ff', '#b18cff'];

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const t = amt > 0 ? [255, 255, 255] : [45, 25, 30];
  const a = Math.abs(amt);
  const m = (x, y) => Math.round(x + (y - x) * a);
  return `rgb(${m(r, t[0])},${m(g, t[1])},${m(b, t[2])})`;
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function flower(ctx, x, y, s, petal, center, petals = 5, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = petal;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.5, s * 0.32, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Eine farbige Beet-Kachel der Größe s (Ursprung links oben)
export function drawTile(ctx, color, s) {
  const r = s * 0.2;
  const g = ctx.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, shade(color, 0.35));
  g.addColorStop(1, color);
  // Unterkante (3D)
  ctx.fillStyle = shade(color, -0.35);
  rrect(ctx, s * 0.04, s * 0.06, s * 0.92, s * 0.92, r);
  ctx.fill();
  ctx.fillStyle = g;
  rrect(ctx, s * 0.04, s * 0.02, s * 0.92, s * 0.86, r);
  ctx.fill();
  // Glanz
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  rrect(ctx, s * 0.14, s * 0.09, s * 0.5, s * 0.1, s * 0.05);
  ctx.fill();
  // Blüte
  flower(ctx, s * 0.5, s * 0.47, s * 0.2, 'rgba(255,255,255,0.6)', shade(color, -0.15), 5, 0.3);
}

// Leeres Feld (Erde)
export function drawSoil(ctx, s) {
  ctx.fillStyle = 'rgba(40,20,10,0.25)';
  rrect(ctx, s * 0.05, s * 0.05, s * 0.9, s * 0.9, s * 0.18);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,230,200,0.07)';
  rrect(ctx, s * 0.05, s * 0.5, s * 0.9, s * 0.45, s * 0.18);
  ctx.fill();
  ctx.fillStyle = 'rgba(30,15,5,0.25)';
  for (const [x, y] of [[0.3, 0.35], [0.65, 0.62], [0.42, 0.72]]) {
    ctx.beginPath(); ctx.arc(x * s, y * s, s * 0.035, 0, Math.PI * 2); ctx.fill();
  }
}

// Cache der Kacheln für die aktuelle Pixelgröße
export class TileCache {
  constructor() { this.px = 0; this.tiles = []; this.soil = null; }
  ensure(px) {
    px = Math.max(8, Math.round(px));
    if (px === this.px) return;
    this.px = px;
    const make = (fn) => {
      const c = document.createElement('canvas');
      c.width = c.height = px;
      fn(c.getContext('2d'));
      return c;
    };
    this.tiles = COLORS.map((col) => make((x) => drawTile(x, col, px)));
    this.soil = make((x) => drawSoil(x, px));
  }
}

// Icon für Manifest/Titel
export function drawIcon(ctx, px, maskable = false) {
  const g = ctx.createLinearGradient(0, 0, 0, px);
  g.addColorStop(0, '#bfe6ff');
  g.addColorStop(1, '#e9f8d9');
  ctx.fillStyle = g;
  if (maskable) ctx.fillRect(0, 0, px, px);
  else { ctx.beginPath(); ctx.roundRect(0, 0, px, px, px * 0.22); ctx.fill(); }
  const pad = maskable ? px * 0.22 : px * 0.14;
  const s = (px - pad * 2) / 3;
  const grid = [[0, 2, 1], [5, 3, 3], [6, 4, 0]];
  ctx.fillStyle = '#8a5a3c';
  ctx.beginPath(); ctx.roundRect(pad - s * 0.12, pad - s * 0.12, s * 3.24, s * 3.24, s * 0.35); ctx.fill();
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    ctx.save();
    ctx.translate(pad + c * s, pad + r * s);
    drawTile(ctx, COLORS[grid[r][c]], s);
    ctx.restore();
  }
}
