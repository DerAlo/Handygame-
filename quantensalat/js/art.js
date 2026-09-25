// Hintergründe der Szenen – Pixel-Art per Code, 320x200.
import { drawCat, drawQBox, drawCar, drawProMax, drawPigeon } from './sprites.js';

export const W = 320, H = 200;

function tools(ctx) {
  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const dith = (x, y, w, h, c) => { ctx.fillStyle = c; for (let j = 0; j < h; j++) for (let i = (j % 2); i < w; i += 2) ctx.fillRect(x + i, y + j, 1, 1); };
  const bands = (x, y, w, h, cols) => { const n = cols.length; for (let i = 0; i < n; i++) { const y0 = Math.round(y + (h * i) / n), y1 = Math.round(y + (h * (i + 1)) / n); R(cols[i], x, y0, w, y1 - y0); if (i < n - 1) dith(x, y1 - 1, w, 1, cols[i + 1]); } };
  const text = (s, x, y, c, size = 6, align = 'center') => { ctx.fillStyle = c; ctx.font = `bold ${size}px monospace`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); };
  const glow = (x, y, r, col, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', a)); g.addColorStop(1, col.replace('A', 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  return { R, dith, bands, text, glow };
}

function moon(ctx, x, y, r, sky) {
  ctx.fillStyle = 'rgba(255,250,220,0.15)';
  ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fffbe0';
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = sky;
  ctx.beginPath(); ctx.arc(x + r * 0.55, y - r * 0.25, r * 0.85, 0, Math.PI * 2); ctx.fill();
}

function stars(ctx, seed, n, y0, y1, x0 = 0, x1 = W) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = rnd() > 0.8 ? '#fff' : '#9ab';
    ctx.fillRect(Math.floor(x0 + rnd() * (x1 - x0)), Math.floor(y0 + rnd() * (y1 - y0)), 1, 1);
  }
}

// ---------- Statische Hintergründe ----------
export const BG = {
  flur(ctx) {
    const { R, dith, bands, text } = tools(ctx);
    R('#262c34', 0, 0, W, 18);
    for (const x of [30, 145, 255]) { R('#3a424c', x - 2, 10, 36, 5); R('#e8f4ff', x, 12, 32, 2); }
    bands(0, 18, W, 90, ['#8fa89a', '#88a193', '#81998c']);
    R('#4d6a5c', 0, 106, W, 3);
    R('#6d8a7c', 0, 109, W, 32);
    R('#5c7a6c', 0, 138, W, 3);
    // Boden
    for (let y = 141; y < H; y += 7) {
      const off = ((y - 141) / 7) % 2 ? 10 : 0;
      for (let x = -20 + off; x < W; x += 20) R(((x + off) / 20) % 2 ? '#6a6258' : '#625a50', x, y, 20, 7);
    }
    dith(0, 141, W, 2, '#3a342e');
    ctx.globalAlpha = 0.18; R('#cde', 60, 165, 120, 3); R('#cde', 90, 172, 70, 2); ctx.globalAlpha = 1;
    // Labortür
    R('#3a4450', 18, 54, 48, 87); R('#b8c4cc', 22, 58, 40, 83); R('#9aa6ae', 22, 58, 2, 83);
    R('#1a2230', 30, 66, 24, 18); R('#2a3a50', 31, 67, 22, 16);
    R('#f0c030', 34, 92, 16, 14); R('#1a1a1a', 41, 95, 2, 6); R('#1a1a1a', 41, 102, 2, 2);
    R('#8a949c', 54, 104, 5, 2);
    text('LABOR', 42, 50, '#e8f0e8', 6);
    // Schwarzes Brett
    R('#6a4a30', 78, 58, 54, 38); R('#b08050', 80, 60, 50, 34);
    R('#f4f4e8', 84, 63, 16, 12); R('#f4e060', 104, 62, 12, 10); R('#e8f0ff', 118, 64, 9, 14); R('#ffd0d8', 86, 78, 18, 12); R('#f4f4e8', 108, 76, 16, 14);
    R('#c03030', 91, 63, 2, 2); R('#3050c0', 109, 62, 2, 2); R('#c03030', 121, 64, 2, 2);
    for (let i = 0; i < 4; i++) R('#999', 86, 67 + i * 2, 12, 1);
    R('#f4f4e8', 170 - 20, 0, 0, 0);
    // Bürotür
    R('#4a3020', 148, 52, 46, 89); R('#8a5a3a', 152, 56, 38, 85); R('#7a4a2a', 156, 62, 30, 32); R('#7a4a2a', 156, 100, 30, 34);
    R('#d8b060', 183, 100, 4, 3);
    R('#e0d8c0', 158, 44, 26, 7); text('Prof. Brandl', 171, 47.5, '#3a2a1a', 4);
    // Kaffeeautomat
    R('#2a2a30', 206, 78, 30, 63); R('#44444c', 208, 80, 26, 59); R('#1a1a20', 211, 84, 20, 16); R('#c07a30', 213, 86, 16, 12);
    R('#ff3040', 229, 104, 2, 2); R('#666', 212, 106, 8, 3); R('#1a1a20', 214, 118, 14, 12); R('#eee', 218, 124, 6, 5);
    text('KAFFEE', 221, 88, '#fff2d8', 4);
    // Ausgang
    R('#2a3440', 258, 50, 54, 91); R('#0e1628', 262, 54, 22, 87); R('#0e1628', 286, 54, 22, 87);
    dith(262, 54, 22, 87, '#162038'); dith(286, 54, 22, 87, '#162038');
    R('#6a7a8a', 284, 54, 2, 87); R('#8a9aaa', 278, 96, 4, 10); R('#8a9aaa', 288, 96, 4, 10);
    R('#fff', 266, 58, 1, 20); R('#fff', 290, 60, 1, 14);
    R('#1a8a3a', 268, 38, 38, 9); text('AUSGANG', 287, 42.5, '#eaffea', 6);
    // Putzwagen
    R('#3a3a44', 104, 134, 34, 3); R('#555560', 106, 137, 2, 20); R('#555560', 134, 137, 2, 20);
    R('#f0c020', 108, 142, 16, 14); R('#c09010', 108, 142, 16, 2); R('#4aa0e0', 110, 144, 12, 2);
    R('#3a3a44', 104, 155, 34, 3); R('#222', 106, 158, 4, 4); R('#222', 132, 158, 4, 4);
    R('#8844aa', 126, 140, 7, 14); R('#aa66cc', 127, 138, 5, 3);
    R('#e8e8e8', 116, 128, 12, 6); R('#d09040', 117, 129, 10, 3);
  },

  labor(ctx) {
    const { R, dith, bands, text } = tools(ctx);
    R('#262c36', 0, 0, W, H);
    bands(0, 0, W, 140, ['#141c28', '#18222f', '#1c2736', '#1f2b3b']);
    for (let x = 0; x < W; x += 40) R('#243142', x, 0, 1, 140);
    R('#0e141c', 0, 0, W, 10);
    for (const x of [60, 200]) { R('#2a3444', x, 4, 50, 4); R('#8fd4ff', x + 2, 8, 46, 1); }
    // Boden
    R('#2c323c', 0, 140, W, H - 140);
    R('#20252e', 0, 140, W, 2);
    ctx.fillStyle = '#2a303a'; for (let y = 142; y < H; y += 8) for (let x = (((y - 142) / 8) % 2) * 12 + 12; x < W; x += 24) ctx.fillRect(x, y, 12, 8);
    // Tür links
    R('#0a0e14', 0, 54, 20, 87); R('#3a4658', 2, 58, 16, 83); R('#8a949c', 14, 100, 3, 2);
    // Whiteboard
    R('#8a939e', 112, 30, 86, 50); R('#f2f4f6', 114, 32, 82, 46);
    text('Ψ = α|0⟩ + β|1⟩', 150, 40, '#2a4ab0', 6);
    text('ΔE·Δt ≥ ħ/2', 140, 52, '#b02a2a', 5);
    text('P(Unwahrsch.) → 1 ?!', 158, 63, '#2a8a3a', 5);
    R('#2a4ab0', 176, 50, 14, 1); R('#2a4ab0', 176, 50, 1, 8);
    text('Kaffee!!!', 172, 72, '#555', 4);
    // Lasertisch
    R('#3a4250', 40, 118, 60, 4); R('#2a303a', 42, 122, 3, 20); R('#2a303a', 95, 122, 3, 20);
    R('#555c68', 46, 110, 8, 8); R('#555c68', 80, 111, 6, 7); R('#99a', 66, 112, 4, 6);
    // Sockel der Q-Box
    R('#3a4658', 150, 112, 20, 30); R('#4a5a70', 146, 108, 28, 5); R('#2a3444', 152, 116, 2, 24);
    R('#6ab0e0', 148, 106, 24, 2);
    // Glashaube (zerbrochen)
    ctx.globalAlpha = 0.35; R('#9fe0ff', 148, 84, 2, 22); R('#9fe0ff', 170, 90, 2, 16); R('#9fe0ff', 150, 82, 8, 2); ctx.globalAlpha = 1;
    R('#bfefff', 136, 139, 3, 1); R('#bfefff', 176, 141, 2, 1); R('#bfefff', 184, 138, 3, 1); R('#bfefff', 129, 142, 2, 1);
    // Laborbank rechts
    R('#48525e', 212, 112, 106, 5); R('#353d48', 214, 117, 102, 25); R('#2a303a', 214, 117, 102, 2);
    for (let i = 0; i < 4; i++) R('#2a303a', 238 + i * 22, 122, 1, 18);
    R('#9ab', 222, 98, 6, 14); R('#6f6', 223, 104, 4, 8); R('#9ab', 236, 102, 8, 10); R('#f6a', 237, 106, 6, 6);
    R('#9ab', 252, 94, 3, 18); R('#fe6', 252, 100, 3, 12);
    // Kleiderhaken
    R('#556070', 30, 64, 30, 3); R('#8a949c', 34, 67, 2, 4); R('#8a949c', 52, 67, 2, 4);
    // Stickstoff-Dewar
    R('#6a7888', 190, 120, 14, 22); R('#8a98a8', 191, 118, 12, 3); R('#4a5868', 192, 124, 2, 16);
    text('LN₂', 197, 132, '#e8f8ff', 4);
  },

  buero(ctx) {
    const { R, dith, bands, text } = tools(ctx);
    bands(0, 0, W, 142, ['#4a3228', '#553a2e', '#5e4133']);
    for (let x = 6; x < W; x += 14) R('#654638', x, 0, 4, 142);
    R('#3a261c', 0, 138, W, 4);
    for (let y = 142; y < H; y += 6) { R(((y / 6) % 2) ? '#5a3a28' : '#62412d', 0, y, W, 6); for (let x = ((y / 6) % 3) * 30; x < W; x += 90) R('#48301f', x, y, 1, 6); }
    // Tür
    R('#2a1a12', 4, 52, 34, 90); R('#7a4a2a', 7, 55, 28, 87); R('#d8b060', 29, 100, 3, 3);
    // Fenster
    R('#3a261c', 124, 26, 72, 58); bands(128, 30, 64, 50, ['#0a1030', '#141a44', '#20245a', '#2a2a66']);
    stars(ctx, 7, 14, 31, 60, 129, 191);
    moon(ctx, 178, 40, 5, '#0a1030');
    R('#0a0c18', 128, 66, 64, 14);
    R('#0a0c18', 134, 58, 8, 8); R('#0a0c18', 150, 54, 10, 12); R('#0a0c18', 152, 48, 2, 6); R('#0a0c18', 168, 60, 12, 6);
    R('#f0c060', 136, 70, 2, 2); R('#f0c060', 154, 62, 2, 2); R('#f0c060', 172, 68, 2, 2);
    R('#3a261c', 158, 30, 4, 50); R('#3a261c', 128, 54, 64, 3);
    // Bücherregal
    R('#3a2418', 268, 24, 48, 118); R('#4a2e1e', 270, 26, 44, 114);
    for (let s = 0; s < 4; s++) {
      const y = 30 + s * 28;
      R('#2a1a10', 270, y + 22, 44, 3);
      let x = 272;
      const cols = ['#a03030', '#305090', '#c0a040', '#407040', '#806090', '#c06030', '#3a3a3a'];
      while (x < 310) { const w = 3 + ((x * 7 + s) % 3); R(cols[(x + s * 3) % cols.length], x, y + 4 + ((x + s) % 4), w, 18 - ((x + s) % 4)); x += w + 1; }
    }
    // Schreibtisch
    R('#6a4228', 52, 112, 84, 6); R('#4a2e1c', 56, 118, 4, 24); R('#4a2e1c', 128, 118, 4, 24); R('#553520', 96, 118, 32, 18); R('#d8b060', 110, 126, 6, 2);
    R('#1a1a22', 72, 86, 32, 22); R('#2a4a8a', 74, 88, 28, 17); R('#333', 86, 108, 4, 4); R('#222', 78, 110, 20, 2);
    R('#1a6a3a', 114, 100, 12, 4); R('#b08a30', 119, 104, 2, 8); R('#6a4a20', 115, 110, 10, 2);
    // Funkstation
    R('#3a2a1e', 196, 110, 66, 5); R('#2a1e14', 200, 115, 3, 27); R('#2a1e14', 256, 115, 3, 27);
    R('#1a1a1e', 202, 94, 40, 16); R('#2a2a30', 203, 95, 38, 14);
    R('#e8a030', 206, 98, 14, 5); R('#1a1a1e', 212, 99, 1, 3);
    R('#555', 226, 99, 6, 6); R('#888', 228, 101, 2, 2); R('#555', 234, 100, 4, 4);
    R('#3a3', 206, 105, 2, 1); R('#f33', 210, 105, 2, 1);
    R('#888', 246, 107, 10, 3); R('#222', 250, 104, 2, 3);
    R('#222', 244, 96, 2, 10); R('#333', 242, 94, 6, 3);
    // QSL-Karten
    const q = [['#f4d060', 202, 50], ['#80c0f0', 222, 46], ['#f09090', 242, 52], ['#a0e0a0', 210, 66], ['#f4f4e8', 230, 64]];
    for (const [c, x, y] of q) { R('#222', x + 1, y + 1, 16, 11); R(c, x, y, 16, 11); R('#333', x + 2, y + 3, 8, 1); R('#333', x + 2, y + 6, 11, 1); }
    text('QSL', 238, 42, '#e0c090', 5);
  },

  bruecke(ctx) {
    const { R, dith, bands, text } = tools(ctx);
    bands(0, 0, W, 110, ['#070b1e', '#0b1128', '#101736', '#171c44', '#22204e', '#2c2456']);
    stars(ctx, 42, 70, 0, 70);
    moon(ctx, 44, 20, 8, '#070b1e');
    // gegenüberliegendes Ufer
    R('#0c0e1e', 0, 92, W, 24);
    for (let x = 0; x < 200; x += 16) R('#0c0e1e', x, 86 - ((x * 7) % 11), 14, 10);
    R('#f0c060', 20, 98, 2, 2); R('#f0c060', 60, 96, 2, 2); R('#f0c060', 110, 100, 2, 2);
    // Brucktor
    R('#3a2a3a', 226, 16, 62, 110); R('#4a3848', 230, 20, 54, 106);
    R('#6a2a2a', 222, 8, 70, 12); R('#7a3434', 226, 4, 62, 6); R('#8a3a3a', 236, 0, 42, 5);
    R('#f0e8c8', 250, 30, 14, 14); R('#2a2a2a', 256, 32, 2, 6); R('#2a2a2a', 256, 37, 5, 2);
    R('#e8c070', 238, 56, 8, 10); R('#e8c070', 268, 56, 8, 10);
    R('#120c18', 244, 84, 26, 42); R('#120c18', 246, 80, 22, 4); R('#1c1424', 248, 84, 18, 40);
    R('#3a2a3a', 288, 40, 32, 86); R('#4a3848', 290, 44, 30, 82); R('#e8c070', 298, 60, 6, 8); R('#6a2a2a', 286, 34, 34, 8);
    // Fluss
    bands(0, 112, W, 30, ['#0e2230', '#10283a', '#133044']);
    // Geländer
    R('#3a3440', 0, 132, W, 3); R('#2a2430', 0, 146, W, 2);
    for (let x = 4; x < W; x += 12) R('#3a3440', x, 135, 2, 11);
    // Brückenboden
    bands(0, 148, W, 52, ['#3a3438', '#353034', '#302b30']);
    for (let y = 152; y < H; y += 9) for (let x = ((y / 9) % 2) * 8; x < W; x += 16) dith(x, y, 8, 1, '#2a2528');
    // Laterne
    R('#1a1a22', 176, 60, 3, 90); R('#1a1a22', 172, 56, 11, 4); R('#ffe9a0', 173, 60, 9, 6); R('#1a1a22', 174, 66, 7, 2);
    // Kebabstand
    R('#5a3a28', 30, 90, 96, 60); R('#6a4632', 32, 92, 92, 36);
    R('#1a1414', 36, 96, 84, 30);
    for (let i = 0; i < 12; i++) R(i % 2 ? '#e8e8e8' : '#c03030', 26 + i * 9, 78, 9, 10);
    R('#8a2020', 26, 88, 108, 2);
    R('#2a1a14', 30, 60, 96, 18); text('INN-KEBAB', 78, 66, '#ffd060', 9); text('24h · seit 1998', 78, 74, '#ff9a50', 5);
  },

  platz(ctx) {
    const { R, dith, bands, text } = tools(ctx);
    bands(0, 0, W, 120, ['#0a0e26', '#10163a', '#1a1e4a', '#2a2658', '#40306a', '#5a3a70']);
    stars(ctx, 99, 40, 0, 40);
    // Häuser links
    const house = (x, w, h, c, d) => {
      R(d, x, 150 - h, w, h); R(c, x + 1, 150 - h + 1, w - 2, h - 1);
      R(d, x, 150 - h - 4, w, 4);
      for (let yy = 150 - h + 8; yy < 118; yy += 16) for (let xx = x + 5; xx < x + w - 8; xx += 12) { R('#1a1420', xx, yy, 6, 9); if ((xx + yy) % 3 === 0) R('#f0c060', xx + 1, yy + 1, 4, 7); }
      for (let xx = x + 3; xx < x + w - 10; xx += 14) { R('#1a1420', xx, 124, 10, 26); R(d, xx, 122, 10, 3); }
    };
    house(0, 42, 108, '#d8a0a8', '#8a5a64');
    house(42, 58, 96, '#e8d080', '#9a8040');
    house(230, 50, 100, '#98c8a0', '#587a5e');
    house(280, 40, 112, '#a8b8e0', '#5a6a94');
    // Rathaus mit Treppengiebel
    R('#8a7a5a', 100, 34, 130, 116); R('#e4d4b0', 102, 36, 126, 114);
    for (let i = 0; i < 5; i++) { const w = 130 - i * 24; R('#8a7a5a', 165 - w / 2, 34 - i * 7, w, 8); R('#e4d4b0', 166 - w / 2, 35 - i * 7, w - 2, 7); }
    for (let row = 0; row < 3; row++) for (let i = 0; i < 5; i++) {
      const x = 110 + i * 24, y = 42 + row * 22;
      if (row === 2 && i === 2) continue;
      R('#5a4a34', x, y, 12, 16); R('#2a2030', x + 1, y + 1, 10, 15); R('#f4c870', x + 2, y + 5, 8, 10); R('#2a2030', x + 5, y + 5, 1, 10); R('#2a2030', x + 2, y + 10, 8, 1);
      R('#5a4a34', x + 1, y - 2, 10, 2);
    }
    // Banner
    R('#1a3a8a', 118, 104, 94, 12); R('#3a6ad0', 118, 104, 94, 2); text('ZUKUNFTSGIPFEL 2026', 165, 110.5, '#ffffff', 6);
    // Tür
    R('#5a4a34', 150, 118, 30, 32); R('#3a2418', 153, 121, 24, 29); R('#4a2e1e', 164, 121, 2, 29); R('#d8b060', 161, 134, 2, 3); R('#d8b060', 167, 134, 2, 3);
    R('#5a4a34', 148, 116, 34, 3);
    text('GLANZTECH', 165, 96, '#ffe070', 5);
    // Pflaster
    bands(0, 150, W, 50, ['#3a3440', '#35303b', '#302b36']);
    for (let y = 152; y < H; y += 5) for (let x = ((y / 5) % 2) * 4; x < W; x += 8) R('#2a2530', x, y, 1, 1);
    R('#4a4450', 0, 150, W, 1);
  },

  burghof(ctx) {
    const { R, dith, bands, text } = tools(ctx);
    bands(0, 0, W, 120, ['#070b1e', '#0c1230', '#141a40', '#1e2050', '#2a2658']);
    stars(ctx, 13, 50, 0, 60);
    moon(ctx, 60, 22, 7, '#070b1e');
    // Burgmauer
    const wall = (x0, y0, w, h) => {
      R('#4a4250', x0, y0, w, h);
      for (let y = y0; y < y0 + h; y += 7) for (let x = x0 + ((y - y0) / 7 % 2) * 8; x < x0 + w; x += 16) { R('#5a5262', x, y, 15, 6); R('#3a3440', x, y + 6, 16, 1); }
    };
    wall(0, 64, 200, 90);
    for (let x = 0; x < 200; x += 20) wall(x, 54, 12, 10);
    // Torbogen links
    R('#141018', 0, 96, 22, 58); R('#141018', 22, 104, 4, 50);
    // Turm
    wall(196, 8, 86, 146);
    for (let x = 192; x < 286; x += 16) wall(x, 0, 10, 10);
    R('#6a2a2a', 186, 150, 0, 0);
    // Turmfenster (Serverlicht)
    for (const [x, y] of [[214, 30], [250, 30], [232, 62]]) { R('#1a1420', x - 1, y - 1, 12, 18); R('#2a3a5a', x, y, 10, 16); R('#2a3a5a', x + 2, y - 3, 6, 3); }
    // Tür mit Tastenfeld
    R('#1a1420', 222, 112, 34, 42); R('#4a2e1e', 225, 116, 28, 38); R('#3a2418', 238, 116, 2, 38);
    R('#1a1a1a', 258, 124, 8, 11); R('#3a3a3a', 259, 125, 6, 9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R('#888', 260 + i * 2, 127 + j * 2, 1, 1);
    // Banner & Kabel
    R('#1a3a8a', 204, 94, 70, 12); R('#3a6ad0', 204, 94, 70, 2); text('GLANZTECH BURG', 239, 100.5, '#ffe070', 6);
    R('#111', 280, 20, 2, 134); R('#111', 276, 150, 44, 2);
    // Antenne oben
    R('#888', 238, -2, 2, 0);
    // Brunnen
    R('#5a5262', 50, 138, 40, 16); R('#6a6272', 48, 134, 44, 5); R('#3a3440', 54, 142, 32, 2); R('#4a4250', 66, 110, 2, 24); R('#4a4250', 58, 110, 18, 2);
    // Pflaster
    bands(0, 154, W, 46, ['#3a3440', '#35303b', '#302b36']);
    for (let y = 156; y < H; y += 5) for (let x = ((y / 5) % 2) * 4; x < W; x += 8) R('#2a2530', x, y, 1, 1);
    R('#4a4450', 0, 154, W, 1);
  },

  turm(ctx) {
    const { R, dith, bands, text } = tools(ctx);
    bands(0, 0, W, 150, ['#2a2430', '#302a36', '#36303c']);
    for (let y = 0; y < 150; y += 9) for (let x = ((y / 9) % 2) * 11; x < W; x += 22) { R('#3e3846', x, y, 21, 8); R('#26202c', x, y + 8, 22, 1); }
    // Balken
    R('#3a2418', 0, 0, W, 8); R('#4a2e1e', 0, 8, W, 3);
    for (const x of [40, 280]) R('#3a2418', x, 11, 8, 140);
    // Schießscharte mit Nachthimmel
    R('#141018', 150, 20, 20, 44); R('#0b1128', 154, 24, 12, 36); R('#fff', 158, 30, 1, 1); R('#fff', 162, 44, 1, 1);
    // Serverschränke
    for (const x of [8, 56, 234]) {
      R('#111', x, 70, 30, 82); R('#1c1c24', x + 2, 72, 26, 78);
      for (let y = 76; y < 146; y += 8) { R('#2a2a34', x + 4, y, 22, 6); }
    }
    // Monitor
    R('#111', 184, 28, 44, 30); R('#1a0a2a', 186, 30, 40, 26);
    text('UNWAHRSCH.', 206, 36, '#ff9ad0', 4);
    R('#ff5a9a', 190, 50, 4, 3); R('#ff5a9a', 196, 46, 4, 7); R('#ff5a9a', 202, 42, 4, 11); R('#ff5a9a', 208, 38, 4, 15); R('#ffd35a', 214, 34, 8, 19);
    // Steckdose rechts
    R('#d8d0c0', 290, 118, 12, 14); R('#333', 293, 122, 2, 4); R('#333', 297, 122, 2, 4);
    // Boden
    bands(0, 150, W, 50, ['#4a2e1e', '#42281a', '#3a2216']);
    for (let y = 154; y < H; y += 7) R('#34200f', 0, y, W, 1);
    for (let y = 150; y < H; y += 7) for (let x = ((y / 7) % 3) * 25; x < W; x += 75) R('#34200f', x, y, 1, 7);
    // Kabelsalat
    R('#111', 150, 158, 100, 2); R('#111', 250, 150, 2, 10); R('#222', 130, 164, 40, 2);
  },

  saal(ctx) {
    const { R, dith, bands, text } = tools(ctx);
    R('#3a2418', 0, 0, W, 22);
    for (let x = 0; x < W; x += 32) { R('#5a3a24', x + 2, 2, 28, 16); R('#6a4630', x + 5, 5, 22, 10); }
    bands(0, 22, W, 100, ['#6a2a2a', '#722e2e', '#7a3232']);
    for (let x = 0; x < W; x += 20) R('#5e2424', x, 22, 2, 100);
    // Gemälde
    for (const x of [20, 270]) { R('#b08a30', x, 34, 30, 38); R('#2a3a2a', x + 3, 37, 24, 32); R('#e8c8a0', x + 11, 44, 8, 9); R('#3a2a2a', x + 9, 53, 12, 14); }
    // Bühne
    R('#4a2e1c', 0, 118, W, 8); R('#6a4228', 0, 116, W, 3);
    bands(0, 126, W, 74, ['#3a2a24', '#34251f', '#2e211b']);
    // Leinwand
    R('#1a1a22', 96, 26, 128, 76); R('#0e1a3a', 98, 28, 124, 72);
    text('GLANZTECH', 160, 38, '#ffe070', 9);
    text('Q-BOX: Die Zukunft', 160, 52, '#ffffff', 6);
    text('ist wahrscheinlich.™', 160, 61, '#ffffff', 6);
    R('#ffe070', 114, 72, 20, 20); R('#3a8aff', 124, 72, 10, 10);
    R('#3a8aff', 146, 84, 6, 8); R('#3a8aff', 156, 78, 6, 14); R('#3a8aff', 166, 72, 6, 20); R('#ffe070', 176, 66, 6, 26);
    text('↑ 4000%', 200, 80, '#7aff9a', 6);
    // Rednerpult
    R('#2a1a12', 222, 94, 22, 24); R('#4a2e1c', 224, 96, 18, 22); R('#caa040', 226, 100, 14, 3);
  },
};

// ---------- Animierte / zustandsabhängige Ebenen ----------
export const FX = {
  flur(ctx, t, S) {
    const { R } = tools(ctx);
    if (Math.sin(t * 17) + Math.sin(t * 5.3) > 1.2) { R('#262c34', 255, 12, 32, 2); }
    ctx.fillStyle = 'rgba(232,244,255,0.04)';
    ctx.fillRect(0, 18, W, 90);
    // Brotzeitdose auf dem Putzwagen – leer, sobald genommen
    if (S.flags.brotzeitTaken) R('#e8e8e8', 116, 128, 12, 6);
    if (S.ch === 2) {
      // Eimer und Maßband weg?
      if (S.flags.cartTaken) { R('#665e54', 108, 142, 16, 14); R('#555560', 106, 137, 2, 20); }
      // Der Kaffeeautomat funktioniert (!)
      if (!S.flags.coffeeBroken) {
        R('#3aff7a', 229, 104, 2, 2);
        ctx.fillStyle = 'rgba(255,220,150,0.5)'; ctx.fillRect(213, 86, 16, 12);
        for (let i = 0; i < 3; i++) {
          const k = (t * 0.8 + i / 3) % 1;
          ctx.fillStyle = `rgba(240,240,240,${0.5 * (1 - k)})`;
          ctx.fillRect(219 + Math.sin(t * 3 + i) * 2, 122 - k * 14, 2, 2);
        }
      }
    }
  },
  labor(ctx, t, S) {
    const { R, glow } = tools(ctx);
    // Laserstrahl
    ctx.fillStyle = `rgba(255,40,60,${0.6 + 0.3 * Math.sin(t * 30)})`;
    ctx.fillRect(54, 113, 26, 1);
    // Stickstoffnebel
    for (let i = 0; i < 4; i++) {
      const y = 116 - ((t * 8 + i * 5) % 20);
      ctx.fillStyle = `rgba(220,240,255,${0.25 * (1 - ((t * 8 + i * 5) % 20) / 20)})`;
      ctx.fillRect(192 + Math.sin(t * 2 + i) * 3, y, 8, 3);
    }
    // Glühende Kolben
    ctx.fillStyle = `rgba(110,255,110,${0.2 + 0.1 * Math.sin(t * 3)})`; ctx.fillRect(218, 96, 14, 18);
    if (!S.flags.kittelTaken) { R('#c8c8d8', 30, 70, 12, 30); R('#f4f4f8', 31, 70, 10, 29); R('#c8c8d8', 36, 72, 1, 26); }
    if (!S.flags.motorTaken) { R('#ddd', 284, 104, 16, 8); R('#aaa', 284, 111, 16, 1); R('#333', 287, 106, 3, 2); R('#3f3', 295, 106, 2, 1); R('#bbe', 288, 97, 8, 7); }
    // Karton mit Katze
    R('#9a7040', 250, 150, 30, 20); R('#b88a50', 250, 150, 30, 3); R('#7a5a30', 248, 147, 6, 5); R('#7a5a30', 276, 147, 6, 5);
    if (!S.flags.catOut) drawCat(ctx, 262, 153, t, true);
    else if (S.ch === 2) drawCat(ctx, 158, 92, t, false);
    else drawCat(ctx, 106, 172, t, false);
    if (S.flags.catOut && !S.flags.karteTaken) { R('#e8e8f0', 258, 146, 10, 6); R('#3a6ea8', 258, 146, 10, 2); }
    if (S.flags.catOut && S.ch !== 2) { R('#d09040', 112, 170, 6, 2); }
    if (S.ch === 2) {
      const { text } = tools(ctx);
      R('#f2f4f6', 150, 66, 45, 10);
      text('P(Kaffee)=1 ?!', 172, 71, '#d02a6a', 5);
      R('#d02a6a', 152, 75, 40, 1);
    }
    // Q-Box zurück?
    if (S.flags.boxInLab) drawQBox(ctx, 160, 106, t, true);
    if (S.flags.streaming) {
      R('#555', 214, 162, 2, 12); R('#555', 210, 172, 2, 6); R('#555', 218, 172, 2, 6);
      R('#222', 209, 152, 12, 8); R('#4aa0e0', 210, 153, 10, 6);
      if (Math.sin(t * 4) > 0) R('#ff3050', 219, 153, 1, 1);
    }
  },
  buero(ctx, t, S) {
    const { R, glow } = tools(ctx);
    glow(120, 104, 30, 'rgba(255,220,140,A)', 0.25);
    ctx.fillStyle = `rgba(90,150,255,${0.1 + 0.05 * Math.sin(t * 2)})`; ctx.fillRect(74, 88, 28, 17);
    if (S.flags.lockdownOff) { R('#3a8a4a', 76, 92, 24, 8); } else { R('#aa2a2a', 76, 92, 24, 8); R('#fff', 86, 94, 4, 4); }
    if (!S.flags.stativTaken) { R('#333', 294, 138, 6, 3); R('#555', 296, 141, 2, 6); R('#555', 290, 147, 2, 12); R('#555', 296, 147, 2, 12); R('#555', 302, 147, 2, 12); R('#777', 292, 146, 10, 1); }
    if (!S.flags.brilleTaken) { R('#202030', 60, 110, 5, 1); R('#202030', 67, 110, 5, 1); R('#202030', 65, 110, 2, 1); R('#bde', 61, 109, 3, 1); R('#bde', 68, 109, 3, 1); }
    // Funkgerät-Anzeige
    const s = Math.floor((Math.sin(t * 3) + 1) * 3);
    R('#1a1a1e', 207, 99, 12, 3); R('#3a2', 207, 99, 2 + s, 3);
    if (S.flags.drawerOpen) { R('#2a1a10', 98, 124, 28, 4); }
    if (S.ch === 2) {
      if (!S.flags.hfgTaken) { R('#222', 248, 101, 5, 9); R('#555', 250, 95, 1, 6); R('#f33', 251, 102, 1, 1); }
      if (!S.flags.tasseTaken) { R('#f4f4f4', 100, 104, 6, 8); R('#f4f4f4', 106, 106, 2, 1); R('#f4f4f4', 107, 106, 1, 4); R('#c03040', 101, 107, 4, 2); }
      R('#1a1a22', 76, 92, 24, 8); R('#ff5a9a', 76, 99, 4, 1); R('#ff5a9a', 80, 97, 4, 1); R('#ff5a9a', 84, 95, 4, 1); R('#ff5a9a', 88, 93, 4, 1); R('#ff5a9a', 92, 92, 6, 1);
    }
  },
  bruecke(ctx, t, S) {
    const { R, glow } = tools(ctx);
    // Wasserglitzern
    for (let i = 0; i < 18; i++) {
      // In Kapitel 2 fließt der Inn rückwärts
      const d = S.ch === 2 ? -1 : 1;
      const x = (((i * 37 + d * t * 10 * (1 + (i % 3))) % W) + W) % W;
      const y = 115 + (i * 13) % 26;
      ctx.fillStyle = `rgba(180,210,255,${0.25 + 0.2 * Math.sin(t * 3 + i)})`;
      ctx.fillRect(x, y, 4 + (i % 3) * 2, 1);
    }
    glow(177, 64, 40, 'rgba(255,230,150,A)', 0.3);
    glow(78, 68, 50, 'rgba(255,190,80,A)', 0.12 + 0.03 * Math.sin(t * 5));
    // Dönerspieß
    const on = S.flags.spiessFixed;
    const rot = on ? (S.ch === 2 ? -t * 3 : t * 3) : 0;
    R('#888', 98, 94, 2, 34);
    for (let i = 0; i < 7; i++) {
      const w = 16 - Math.abs(i - 3) * 1.5;
      const shade = Math.sin(rot + i) * 0.5 + 0.5;
      ctx.fillStyle = `rgb(${150 + shade * 40},${90 + shade * 30},${50 + shade * 20})`;
      ctx.fillRect(99 - w / 2, 98 + i * 4, w, 4);
    }
    if (on) { ctx.fillStyle = `rgba(255,120,40,${0.3 + 0.1 * Math.sin(t * 9)})`; ctx.fillRect(110, 96, 4, 28); }
  },
  platz(ctx, t, S) {
    const { glow } = tools(ctx);
    glow(165, 118, 30, 'rgba(255,210,120,A)', 0.2);
    drawCar(ctx, 64, 176, t);
    if (S.ch === 2) {
      if (S.flags.karlWashed) { ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 5)})`; ctx.fillRect(40, 162, 1, 1); ctx.fillRect(78, 166, 1, 1); ctx.fillRect(58, 158, 1, 1); }
      drawPigeon(ctx, 128, 186, t, 0); drawPigeon(ctx, 142, 190, t, 1); drawPigeon(ctx, 118, 192, t, 2);
      const { R, text } = tools(ctx);
      // Banner weg, dafür Absperrband vor der Tür
      R('#e4d4b0', 150, 90, 32, 10); R('#e4d4b0', 116, 103, 98, 14);
      for (let i = 0; i < 9; i++) R(i % 2 ? '#fff' : '#e03030', 146 + i * 4, 128 + (i % 2), 4, 3);
      text('GESCHLOSSEN', 165, 110, '#8a3a2a', 5);
      // Wegweiser zur Burg
      R('#5a3a28', 300, 136, 2, 30); R('#e8dcc0', 284, 132, 30, 9); R('#e8dcc0', 314, 134, 3, 5);
      text('BURG →', 298, 137, '#3a2a1a', 5);
    }
  },
  burghof(ctx, t, S) {
    const { R, glow } = tools(ctx);
    for (const [x, y] of [[219, 38], [255, 38], [237, 70]]) glow(x, y, 16, 'rgba(90,220,255,A)', 0.25 + 0.15 * Math.sin(t * 4 + x));
    if (Math.sin(t * 3) > 0) { R('#ff3040', 238, 2, 2, 2); glow(239, 3, 6, 'rgba(255,60,60,A)', 0.5); }
    // unwahrscheinliche Funken
    for (let i = 0; i < 6; i++) {
      const k = (t * 0.3 + i / 6) % 1;
      ctx.fillStyle = `rgba(255,120,200,${0.6 * (1 - k)})`;
      ctx.fillRect(210 + ((i * 29) % 60), 110 - k * 100, 1, 1);
    }
  },
  turm(ctx, t, S) {
    const { R, glow } = tools(ctx);
    for (const x of [8, 56, 234]) for (let y = 76; y < 146; y += 8) {
      if (Math.sin(t * 7 + x + y) > 0) R('#3aff7a', x + 22, y + 2, 2, 2);
      if (Math.sin(t * 5 + x * 2 + y) > 0.4 && !S.flags.proMaxOff) R('#ff5a9a', x + 18, y + 2, 2, 2);
    }
    drawProMax(ctx, 160, 158, t, !S.flags.proMaxOff);
    // Stromkabel zur Steckdose
    R('#111', 176, 152, 116, 2); R('#111', 290, 128, 2, 26);
    if (!S.flags.proMaxOff) { R('#1a1a1a', 292, 124, 6, 6); R('#666', 298, 126, 3, 2); }
    else { R('#1a1a1a', 280, 150, 6, 6); R('#666', 286, 152, 3, 2); }
    if (S.flags.overdrive && !S.flags.proMaxOff) {
      for (let i = 0; i < 8; i++) { ctx.fillStyle = `rgba(255,${120 + i * 15},220,${Math.random() * 0.8})`; ctx.fillRect(130 + Math.random() * 60, 110 + Math.random() * 50, 2, 2); }
    }
    if (S.flags.overdrive) {
      // übrig gebliebene Tuba
      R('#d8b040', 266, 162, 14, 12); R('#f0d060', 274, 152, 10, 12); R('#b89020', 266, 172, 16, 3); R('#f8e080', 278, 152, 8, 2);
    }
  },
  saal(ctx, t, S) {
    const { R } = tools(ctx);
    if (!S.flags.won) drawQBox(ctx, 200, 116, t, true);
    ctx.fillStyle = `rgba(255,240,200,${0.05 + 0.02 * Math.sin(t)})`; ctx.fillRect(0, 0, W, 126);
  },
};

// Vordergrund (vor den Figuren)
export const FG = {
  saal(ctx, t) {
    const { R } = tools(ctx);
    const heads = [[10, '#2a1a14'], [40, '#6a5a4a'], [70, '#1a1a1a'], [104, '#c0a060'], [136, '#3a2a1a'], [168, '#8a8a8a'], [200, '#2a1a14'], [236, '#1a1a1a'], [268, '#6a4a3a'], [300, '#aa7040']];
    for (const [x, c] of heads) {
      const b = Math.round(Math.sin(t * 1.3 + x) * 0.6);
      R('#1a1420', x - 11, 186 + b, 22, 14); R('#2a2230', x - 10, 187 + b, 20, 13);
      R(c, x - 6, 175 + b, 12, 12);
    }
  },
};

// Theke des Kebabstands – wird direkt nach Mehmet gezeichnet, damit sie nur ihn verdeckt
export function drawCounter(ctx) {
  const { R, text } = tools(ctx);
  R('#8a5a3a', 30, 126, 96, 6); R('#a87050', 30, 126, 96, 2);
  R('#5a3a28', 32, 132, 92, 18);
  R('#c0a060', 44, 134, 18, 10); text('Döner 7,50', 53, 139, '#3a2a1a', 3);
}
