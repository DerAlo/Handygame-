// Pixel-Art-Figuren und Gegenstände, per Code in 320x200 gezeichnet.

// Rechteck relativ zur Figur, spiegelt automatisch bei Blickrichtung links
function mk(ctx, x, y, dir) {
  return (c, dx, dy, w, h) => {
    ctx.fillStyle = c;
    if (dir > 0) ctx.fillRect(Math.round(x + dx), Math.round(y + dy), w, h);
    else ctx.fillRect(Math.round(x - dx - w), Math.round(y + dy), w, h);
  };
}

export const CHARS = {
  kai: { skin: '#f0c09a', skinD: '#c98f6c', hair: '#5a3a22', hairL: '#7c5634', shirt: '#e6e6e6', body: '#3a6ea8', bodyD: '#29507c', legs: '#3a6ea8', legsD: '#29507c', shoe: '#3a2a20', style: 'messy', bib: true, h: 42 },
  kaiDisguise: { skin: '#f0c09a', skinD: '#c98f6c', hair: '#c9c9d4', hairL: '#e9e9f2', shirt: '#e6e6e6', body: '#f4f4f8', bodyD: '#c8c8d8', legs: '#3a6ea8', legsD: '#29507c', shoe: '#3a2a20', style: 'mop', coat: true, glasses: true, h: 42 },
  prof: { skin: '#f3cba8', skinD: '#c9987a', hair: '#e8e8ee', hairL: '#ffffff', shirt: '#8a4a7a', body: '#f4f4f8', bodyD: '#c8c8d8', legs: '#4a3a5a', legsD: '#35283f', shoe: '#2a1a1a', style: 'bun', coat: true, glasses: true, h: 38 },
  glanz: { skin: '#f2c6a0', skinD: '#c9947a', hair: '#e8c860', hairL: '#fff0a0', shirt: '#ffffff', body: '#c8b08a', bodyD: '#a08a68', legs: '#2d4a7a', legsD: '#223a60', shoe: '#f4f4f4', style: 'slick', vest: true, h: 44 },
  guard: { skin: '#b07a52', skinD: '#8a5a3a', hair: '#1a1a1a', hairL: '#333', shirt: '#ffffff', body: '#1e1e28', bodyD: '#12121a', legs: '#1e1e28', legsD: '#12121a', shoe: '#0a0a0a', style: 'buzz', suit: true, earpiece: true, wide: 2, h: 46 },
  kaiPhd: { skin: '#f0c09a', skinD: '#c98f6c', hair: '#5a3a22', hairL: '#7c5634', shirt: '#6aa0d0', body: '#f4f4f8', bodyD: '#c8c8d8', legs: '#3a6ea8', legsD: '#29507c', shoe: '#3a2a20', style: 'messy', coat: true, h: 42 },
  glanzi: { skin: '#f2c6a0', skinD: '#c9947a', hair: '#e8c860', hairL: '#fff0a0', shirt: '#ffffff', body: '#ffffff', bodyD: '#d8d8d8', legs: '#2d4a7a', legsD: '#223a60', shoe: '#f4f4f4', style: 'slick', apron: true, h: 44 },
  glanzEvil: { skin: '#e8b898', skinD: '#b98468', hair: '#e8c860', hairL: '#fff0a0', shirt: '#7a1a2a', body: '#1a1a24', bodyD: '#0e0e16', legs: '#1a1a24', legsD: '#0e0e16', shoe: '#f4f4f4', style: 'slick', vest: true, h: 44 },
  hildegard: { skin: '#f3cba8', skinD: '#c9987a', hair: '#7a4a2a', hairL: '#9a6a40', shirt: '#e8dcc0', body: '#5a7a4a', bodyD: '#3e5a32', legs: '#5a7a4a', legsD: '#3e5a32', shoe: '#3a2a1a', style: 'bun', coat: true, h: 38 },
  sigmund: { skin: '#f2c6a0', skinD: '#c9947a', hair: '#e8c860', hairL: '#fff0a0', shirt: '#f0e8d0', body: '#a02a3a', bodyD: '#701a28', legs: '#e8c860', legsD: '#c8a040', shoe: '#3a2a1a', style: 'barett', vest: true, h: 44 },
  mehmed: { skin: '#d9a57a', skinD: '#b07e58', hair: '#2a2020', hairL: '#4a3a3a', shirt: '#e0d0b0', body: '#2a5a8a', bodyD: '#1a3a60', legs: '#e0d0b0', legsD: '#c0b090', shoe: '#8a3a2a', style: 'turban', glasses: false, mustache: true, apron: true, apronCol: '#2a5a8a', h: 42 },
  bernhard: { skin: '#b07a52', skinD: '#8a5a3a', hair: '#3a2a1a', hairL: '#5a4a3a', shirt: '#8a7a5a', body: '#5a4a2a', bodyD: '#3a2e1a', legs: '#4a4a3a', legsD: '#3a3a2a', shoe: '#2a1a0a', style: 'buzz', suit: true, wide: 2, h: 46 },
  schreiber: { skin: '#f0c8a8', skinD: '#c89878', hair: '#9a9a9a', hairL: '#c0c0c0', shirt: '#e8e0d0', body: '#4a4a5a', bodyD: '#34343f', legs: '#4a4a5a', legsD: '#34343f', shoe: '#2a1a0a', style: 'bald', coat: true, glasses: true, h: 40 },
  ratsherr: { skin: '#f0c8a8', skinD: '#c89878', hair: '#e0e0e0', hairL: '#ffffff', shirt: '#f0f0f0', body: '#1a1a22', bodyD: '#0e0e14', legs: '#1a1a22', legsD: '#0e0e14', shoe: '#0a0a0a', style: 'barett', coat: true, mustache: true, h: 42 },
  mehmet: { skin: '#d9a57a', skinD: '#b07e58', hair: '#2a2020', hairL: '#4a3a3a', shirt: '#e0e0e0', body: '#f0f0f0', bodyD: '#c8c8c8', legs: '#333', legsD: '#222', shoe: '#222', style: 'mehmet', glasses: true, mustache: true, apron: true, h: 42 },
};

// Zeichnet eine Figur. (x,y) = Fußpunkt Mitte.
export function drawPerson(ctx, x, y, o) {
  const c = CHARS[o.who] || o.who;
  const dir = o.dir || 1;
  const r = mk(ctx, x, y, dir);
  const H = c.h;
  const wide = c.wide || 0;
  const walking = o.walking;
  const ph = o.phase || 0;
  const sw = walking ? Math.sin(ph * Math.PI * 2) : 0;
  const bob = walking ? Math.abs(Math.cos(ph * Math.PI * 2)) * -1 : 0;
  const legH = Math.round(H * 0.4);
  const torsoH = Math.round(H * 0.34);
  const headH = H - legH - torsoH - 2;
  const top = -H + bob;
  const hipY = -legH + bob;
  const tw = 10 + wide * 2;

  // Beine
  if (!o.noLegs) {
    const back = Math.round(-sw * 3), front = Math.round(sw * 3);
    r(c.legsD, -3 + back, hipY, 3, legH - 1);
    r(c.shoe, -3 + back, -2, 5, 2);
    r(c.legs, front, hipY, 3, legH - 1);
    r(c.shoe, front, -2, 5, 2);
  }

  // Rumpf
  const ty = hipY - torsoH;
  if (c.coat) {
    r(c.bodyD, -tw / 2, ty, tw, torsoH + 8);
    r(c.body, -tw / 2 + 1, ty, tw - 2, torsoH + 7);
    r(c.shirt, 1, ty + 1, 2, torsoH - 4);
    r(c.bodyD, 0, ty + 2, 1, torsoH + 4);
  } else {
    r(c.shirt, -tw / 2, ty, tw, torsoH);
    if (c.bib) {
      r(c.body, -tw / 2, ty + 5, tw, torsoH - 5);
      r(c.body, -3, ty + 2, 6, 4);
      r(c.bodyD, -tw / 2, ty + 1, 2, 5);
      r('#caa040', 2, ty + 3, 1, 1);
    }
    if (c.vest) {
      r(c.body, -tw / 2, ty + 1, 4, torsoH - 1);
      r(c.body, tw / 2 - 3, ty + 1, 3, torsoH - 1);
      r(c.bodyD, -tw / 2, ty + torsoH - 3, tw, 1);
    }
    if (c.suit) {
      r(c.body, -tw / 2, ty, tw, torsoH);
      r(c.shirt, 1, ty, 3, 5);
      r('#8a1a2a', 2, ty + 1, 1, 6);
    }
    if (c.apron) {
      r(c.body, -tw / 2, ty, tw, torsoH);
      r(c.apronCol || '#b04030', -tw / 2 + 1, ty + 4, tw - 2, torsoH + 2);
      r(c.apronCol ? '#4a7ab0' : '#d05a48', -tw / 2 + 1, ty + 4, tw - 2, 1);
    }
  }

  // Arme
  const armY = ty + 1;
  const aSw = walking ? -sw * 2 : 0;
  const armCol = c.coat ? c.body : c.suit ? c.body : c.apron ? c.shirt : c.shirt;
  const gest = o.talking && !walking ? Math.round(Math.sin(o.t * 12) * 1) : 0;
  r(c.bodyD || armCol, -tw / 2 - 2 - aSw, armY, 3, torsoH - 1);
  r(c.skinD, -tw / 2 - 2 - aSw, armY + torsoH - 1, 3, 2);
  if (o.pose === 'reach') {
    r(armCol, tw / 2 - 1, armY + 2, 7, 3);
    r(c.skin, tw / 2 + 6, armY + 2, 2, 3);
  } else if (o.pose === 'present') {
    r(armCol, tw / 2 - 1, armY - 3, 3, 6);
    r(armCol, tw / 2, armY - 8, 3, 6);
    r(c.skin, tw / 2, armY - 10, 3, 3);
  } else {
    r(armCol, tw / 2 - 2 + aSw, armY + gest, 3, torsoH - 1);
    r(c.skin, tw / 2 - 2 + aSw, armY + torsoH - 1 + gest, 3, 2);
  }

  // Hals & Kopf
  const hy = ty - headH - 1;
  r(c.skinD, -1, ty - 2, 4, 2);
  const hw = 9;
  r(c.skin, -4, hy + 1, hw, headH - 1);
  r(c.skin, -3, hy, hw - 2, headH + 1);
  r(c.skinD, -4, hy + headH - 2, 2, 2);
  // Nase
  r(c.skin, hw - 4, hy + Math.round(headH * 0.45), 1, 2);
  // Auge
  const ey = hy + Math.round(headH * 0.35);
  if (!o.blink) r('#1a1020', 2, ey, 1, 2);
  if (c.glasses) {
    ctx.globalAlpha = (ctx.globalAlpha || 1);
    r('#202030', 0, ey - 1, 5, 1);
    r('#202030', 0, ey + 2, 5, 1);
    r('#202030', 0, ey - 1, 1, 4);
    r('#202030', 4, ey - 1, 1, 4);
    r('#202030', -3, ey, 3, 1);
  }
  // Mund
  const my = hy + Math.round(headH * 0.72);
  if (o.talking && Math.sin(o.t * 22) > 0) r('#6a2020', 3, my, 2, 2);
  else r(c.skinD, 3, my, 2, 1);
  if (c.mustache) r(c.hair, 1, my - 1, 5, 1);

  // Haare
  const hc = c.hair, hl = c.hairL;
  switch (c.style) {
    case 'messy':
      r(hc, -5, hy - 2, 10, 3);
      r(hc, -5, hy, 3, 5);
      r(hc, -4, hy - 3, 3, 1); r(hc, 0, hy - 3, 2, 1); r(hc, 3, hy - 3, 2, 1);
      r(hl, -2, hy - 2, 2, 1); r(hl, 2, hy - 1, 2, 1);
      r(hc, 4, hy, 2, 1);
      break;
    case 'mop':
      r(hc, -6, hy - 3, 12, 4);
      r(hc, -6, hy, 3, 8);
      for (let i = 0; i < 6; i++) r(i % 2 ? hl : hc, -6 + i * 2, hy - 4 + (i % 2), 1, 2);
      r(hl, -6, hy + 8, 1, 2); r(hc, -4, hy + 8, 1, 2);
      break;
    case 'bun':
      r(hc, -5, hy - 1, 10, 3);
      r(hc, -5, hy, 3, 6);
      r(hc, -7, hy - 3, 4, 4);
      r(hl, -6, hy - 3, 2, 1);
      break;
    case 'slick':
      r(hc, -5, hy - 2, 11, 3);
      r(hl, -3, hy - 2, 6, 1);
      r(hc, -5, hy, 2, 4);
      r(hc, 5, hy - 1, 2, 1);
      break;
    case 'buzz':
      r(hc, -4, hy - 1, 9, 2);
      r(hc, -4, hy, 2, 3);
      break;
    case 'barett':
      r(hc, -5, hy, 3, 5);
      r(c.body, -6, hy - 3, 13, 3);
      r(c.bodyD, -5, hy - 5, 10, 2);
      r('#f4f4f4', -7, hy - 8, 2, 5); r('#f4f4f4', -8, hy - 9, 2, 2);
      break;
    case 'turban':
      r('#f0ead8', -6, hy - 4, 12, 5);
      r('#d8d0b8', -6, hy - 2, 12, 1);
      r('#c03040', 0, hy - 3, 2, 2);
      r(hc, -5, hy + 1, 2, 3);
      break;
    case 'bald':
      r(hc, -5, hy + 1, 2, 4);
      r(c.hairL, -4, hy, 2, 1);
      break;
    case 'mehmet':
      r(hc, -5, hy - 1, 10, 2);
      r(hc, -5, hy, 3, 4);
      r(hl, -1, hy - 1, 3, 1);
      break;
  }
  if (c.earpiece) r('#ddd', -3, hy + 4, 1, 3);
}

// ---------- Kleine Figuren/Objekte ----------
export function drawCat(ctx, x, y, t, awake = true) {
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
  const tail = Math.round(Math.sin(t * 3) * 2);
  R('#2a2a33', -6, -6, 12, 6);
  R('#2a2a33', 3, -11, 6, 6);
  R('#2a2a33', 3, -13, 2, 2); R('#2a2a33', 7, -13, 2, 2);
  R('#2a2a33', -9, -8 + tail, 3, 2); R('#2a2a33', -11, -10 + tail, 2, 3);
  if (awake) { R('#9fe870', 5, -9, 1, 1); R('#9fe870', 7, -9, 1, 1); }
  else { R('#555', 4, -8, 2, 1); R('#555', 7, -8, 2, 1); }
  R('#e8a0a0', 6, -7, 1, 1);
}

export function drawQBox(ctx, x, y, t, glow = true) {
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
  if (glow) {
    const a = 0.25 + 0.15 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(120,220,255,${a})`;
    ctx.fillRect(x - 11, y - 20, 22, 22);
  }
  R('#223', -7, -14, 14, 14);
  R('#3a4a6a', -6, -13, 12, 12);
  R('#5a7aa8', -6, -13, 12, 2);
  const p = (Math.sin(t * 5) + 1) / 2;
  R(`rgb(${Math.round(120 + 100 * p)},230,255)`, -3, -10, 6, 6);
  R('#fff', -1, -8, 2, 2);
  R('#ff5a7a', 4, -3, 1, 1);
}

export function drawProMax(ctx, x, y, t, on = true) {
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
  if (on) {
    const a = 0.25 + 0.2 * Math.sin(t * 6);
    ctx.fillStyle = `rgba(255,80,140,${a})`;
    ctx.beginPath(); ctx.arc(x, y - 22, 30 + Math.sin(t * 3) * 3, 0, Math.PI * 2); ctx.fill();
  }
  R('#111', -16, -38, 32, 34);
  R('#2a1a3a', -15, -37, 30, 32);
  R('#4a2a6a', -15, -37, 30, 3);
  const p = on ? (Math.sin(t * 8) + 1) / 2 : 0;
  R(on ? `rgb(255,${Math.round(90 + 120 * p)},${Math.round(160 + 60 * p)})` : '#333', -8, -30, 16, 16);
  R(on ? '#fff' : '#222', -3, -25, 6, 6);
  for (let i = 0; i < 4; i++) R(on && Math.sin(t * 10 + i) > 0 ? '#ff5a9a' : '#3a2a4a', -13 + i * 7, -10, 4, 2);
  ctx.fillStyle = '#ffd35a'; ctx.font = 'bold 5px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('PRO MAX', x, y - 34);
  R('#222', -18, -4, 36, 4);
}

export function drawPortal(ctx, x, y, t, size = 1) {
  for (let i = 0; i < 5; i++) {
    const r = (10 + i * 5) * size + Math.sin(t * 3 + i) * 2;
    ctx.strokeStyle = `hsla(${(t * 80 + i * 40) % 360},90%,70%,${0.7 - i * 0.12})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.7, r, Math.sin(t) * 0.2, t * (i % 2 ? 1 : -1), t * (i % 2 ? 1 : -1) + Math.PI * 1.6);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.ellipse(x, y, 4 * size, 7 * size, 0, 0, Math.PI * 2); ctx.fill();
}

export function drawCage(ctx, x, y, t, catMood = 'angry') {
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
  R('#5a3a1a', -12, -2, 24, 3);
  drawCat(ctx, x, y - 2, t, catMood !== 'sleep');
  if (catMood === 'happy') {
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.7 + i / 3) % 1;
      ctx.fillStyle = `rgba(255,120,160,${1 - k})`;
      ctx.fillRect(x + 4 + i * 3, y - 16 - k * 10, 2, 2);
    }
  }
  if (catMood === 'angry' && Math.sin(t * 5) > 0.6) { ctx.fillStyle = '#fff'; ctx.font = 'bold 5px monospace'; ctx.fillText('FAUCH', x - 18, y - 18); }
  for (let i = -12; i <= 12; i += 4) R('#3a3a3a', i, -20, 1, 18);
  R('#3a3a3a', -12, -21, 25, 2);
}

export function drawPigeon(ctx, x, y, t, i) {
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
  const bob = Math.sin(t * 6 + i * 2) > 0.3 ? 1 : 0;
  R('#8a8a9a', -4, -5, 8, 5); R('#6a6a7a', -5, -4, 2, 3);
  R('#9a9aaa', 2, -8 + bob, 3, 3); R('#4a8a6a', 2, -5 + bob, 3, 1);
  R('#e0a040', 5, -7 + bob, 1, 1); R('#111', 3, -7 + bob, 1, 1);
  R('#c06040', -1, 0, 1, 2); R('#c06040', 2, 0, 1, 2);
}

export function drawCar(ctx, x, y, t) {
  const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
  R('#101018', -34, -2, 68, 3);
  R('#e8ecf2', -34, -14, 68, 12);
  R('#e8ecf2', -22, -22, 40, 8);
  R('#c4ccd8', -34, -5, 68, 3);
  R('#1a2030', -20, -21, 16, 7);
  R('#1a2030', -2, -21, 18, 7);
  R('#2a3448', -19, -20, 6, 2);
  const g = 0.6 + 0.4 * Math.sin(t * 2);
  ctx.fillStyle = `rgba(90,200,255,${g})`;
  ctx.fillRect(x - 34, y - 9, 68, 1);
  R('#ffe9a0', 31, -12, 3, 2);
  R('#ff4050', -34, -12, 2, 2);
  R('#18181e', -26, -4, 10, 6); R('#555', -23, -1, 4, 2);
  R('#18181e', 16, -4, 10, 6); R('#555', 19, -1, 4, 2);
  R('#8a93a8', -6, -12, 10, 1);
}

// ---------- Gegenstände (16x16 Icons) ----------
export const ITEMS = {
  mopp: { name: 'Wischmopp', desc: 'Mein treuer Wischmopp. Wir haben zusammen schon Kilometer an Linoleum erlebt.' },
  handy: { name: 'Handy', desc: 'Mein Handy. 12 % Akku, 3 Sprünge im Display und 400 ungelesene Nachrichten von der Familien-Gruppe.' },
  brotzeit: { name: 'Leberkässemmel', desc: 'Eine Leberkässemmel mit süßem Senf. Mein Mitternachtssnack. Riecht verlockend – nicht nur für Menschen.' },
  karte: { name: 'Schlüsselkarte', desc: 'Die Schlüsselkarte von Prof. Brandl. Leicht angesabbert.' },
  stativ: { name: 'Stativ', desc: 'Ein Kamerastativ. Die Frau Professor fotografiert damit ihre Versuchsaufbauten.' },
  handystativ: { name: 'Handy auf Stativ', desc: 'Mein Handy, professionell auf ein Stativ geschraubt. Bereit für den Livestream!' },
  schere: { name: 'Schere', desc: 'Eine Büroschere. Schneidet Papier, Klebeband und – bei entsprechender Entschlossenheit – auch Moppköpfe.' },
  moppkopf: { name: 'Moppkopf', desc: 'Der abgeschnittene Kopf meines Wischmopps. Grau, zottelig … irgendwie professoral.' },
  kittel: { name: 'Laborkittel', desc: 'Ein weißer Laborkittel. Wer so einen trägt, wirkt sofort 30 % kompetenter.' },
  brille: { name: 'Lesebrille', desc: 'Die Ersatzbrille der Frau Professor. +2,5 Dioptrien. Die Welt verschwimmt, aber ich sehe klug aus.' },
  verkleidung: { name: 'Professoren-Verkleidung', desc: 'Kittel, Brille, Moppkopf-Frisur. Die perfekte Verkleidung als Prof. Brandl. Sofern niemand genau hinschaut.' },
  verkleidungTeil: { name: 'Halbe Verkleidung', desc: 'Da fehlt noch was, damit ich als Frau Professor durchgehe.' },
  einladung: { name: 'Einladung', desc: '„Zukunftsgipfel Wasserburg – Einladung für Prof. Dr. H. Brandl. Einlass 7:00 Uhr, Rathaussaal.“' },
  motor: { name: 'Magnetrührer', desc: 'Ein Magnetrührer aus dem Labor. Im Grunde ein sehr kleiner, sehr gleichmäßiger Motor.' },
  qbox: { name: 'Q-Box', desc: 'Die Q-Box. Sie summt leise. Ich habe das Gefühl, sie ist gleichzeitig warm und kalt.' },
  besenstiel: { name: 'Besenstiel', desc: 'Der Stiel meines alten Wischmopps. Den Kopf habe ich in Kapitel 1 für eine Verkleidung geopfert. Ich trage ihn seitdem bei mir. Aus Sentimentalität.' },
  massband: { name: 'Maßband', desc: 'Ein Stahl-Maßband, fünf Meter. Gelb, federnd, mit Ecken, an denen man sich schneidet.' },
  eimer: { name: 'Eimer', desc: 'Mein alter Putzeimer. Leer. Er riecht nach Zitrusreiniger und Erinnerungen.' },
  wassereimer: { name: 'Eimer mit Innwasser', desc: 'Innwasser. Es dreht sich im Eimer langsam gegen den Uhrzeigersinn. Das sollte es nicht tun.' },
  yagi: { name: 'Maßband-Yagi', desc: 'Drei Stücke Maßband am Besenstiel: eine Richtantenne für das Zwei-Meter-Band. Funkamateure bauen die wirklich so!' },
  funkgeraet: { name: 'Handfunkgerät', desc: 'Das alte Handfunkgerät der Frau Professor. 145 MHz. Der Akku ist leer.' },
  funkgeraetVoll: { name: 'Handfunkgerät (geladen)', desc: 'Voll geladen – mit Strom von KARL. Es rauscht erwartungsvoll.' },
  peiler: { name: 'Peilempfänger', desc: 'Funkgerät plus Maßband-Yagi: ein echter Peilempfänger für die Fuchsjagd. Draußen einsetzen!', self: 'Peilen' },
  stadtplan: { name: 'Stadtplan', desc: 'Ein Stadtplan von Wasserburg. Die Frau Professor hat Funk-Standorte mit Kuli eingezeichnet. Und eine Kaffeetasse.', self: 'Einzeichnen' },
  tasse: { name: 'Tasse', desc: 'Die Tasse der Frau Professor. Aufschrift: „Weltbeste Professorin“. Innen ein Tee-Rand. Seit drei Wochen.' },
  kaffee: { name: 'Kaffee', desc: 'Echter Kaffee aus dem Institutsautomaten. Ein historisches Dokument. Er dampft.' },
  doener: { name: 'Döner', desc: 'Ein Döner von Mehmet. Mit allem und scharf. Er ist so schwer, dass er ein eigenes Gravitationsfeld hat.' },
  namensschild: { name: 'Namensschild', desc: '„Kai Wimmer · Leiter Abt. Unwahrscheinlichkeitsabwehr (Doktorand)“. Das „Hausmeister“ haben sie endlich gestrichen. Mit Tipp-Ex.' },
  chronik: { name: 'Stadtchronik', desc: 'Die Stadtchronik von Wasserburg, Band 3. Die Frau Professor sagt, die Seiten über 1524 schreiben sich gerade neu.', self: 'Lesen' },
  rudi: { name: 'Funkgerät Rudi', desc: 'Rudi, das Handfunkgerät. Über den Zeitriss bleibt er mit der Frau Professor in Kontakt. Funk durch die Zeit – DO5ALO wäre neidisch.', self: 'Funken' },
  kerze: { name: 'Kerze', desc: 'Eine Bienenwachskerze aus Hildegards Hütte. Riecht nach Honig und Mittelalter.' },
  pergament: { name: 'Fürsprech-Brief', desc: 'Ein Brief vom Stadtschreiber: „Der Gelehrte Kai von Wimmer darf vor dem Rat als Fürsprech reden.“ Es fehlt noch ein Siegel.' },
  brief: { name: 'Gesiegelter Fürsprech-Brief', desc: 'Mit meinem Namensschild in Wachs gesiegelt. Man liest „…LEITER ABT. UNWAHRSCH…“. Sehr amtlich.' },
  baldrian: { name: 'Baldrianwurzel', desc: 'Getrocknete Baldrianwurzel. Menschen macht sie ruhig. Katzen macht sie … sehr, sehr glücklich.' },
  zucker: { name: 'Würfelzucker', desc: 'Eine Packung Würfelzucker aus der Institutsküche, durch 500 Jahre geworfen. Im Jahr 1524 ein Vermögen wert.' },
  bohnen: { name: 'Kaffeebohnen', desc: 'Kaffeebohnen von Mehmed Efendi, Jahrgang 1524. Die ersten in ganz Bayern.' },
  amulett: { name: 'Glücksamulett', desc: 'Ein „Glücksamulett“ von Sigmund von Glanz. Bei genauem Hinsehen: ein bemalter Innkiesel. Unten klebt noch Flusssand.' },
  zertifikat: { name: 'Mehmets Zertifikat', desc: '„Kai Wimmer hat die Grundlagen des Peer-Review-Duells erlernt. Gez. Prof. (a. D.) Mehmet Yılmaz, Inn-Kebab.“ Mit Knoblauchsoßen-Fleck.' },
};

export function drawItem(ctx, id) {
  const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  switch (id) {
    case 'mopp':
      R('#a07040', 7, 1, 2, 10); R('#8a8a96', 4, 10, 8, 2); for (let i = 0; i < 4; i++) R(i % 2 ? '#bbb' : '#999', 4 + i * 2, 12, 2, 3); break;
    case 'handy':
      R('#222', 4, 1, 8, 14); R('#4aa0e0', 5, 2, 6, 10); R('#fff', 6, 4, 1, 1); R('#fff', 8, 7, 2, 1); R('#888', 7, 13, 2, 1); R('#aee', 9, 3, 1, 3); break;
    case 'brotzeit':
      R('#d09040', 2, 5, 12, 4); R('#e0a858', 3, 4, 10, 2); R('#c86a5a', 1, 9, 14, 2); R('#d09040', 2, 11, 12, 3); R('#f0d040', 3, 9, 3, 1); R('#f7e0b0', 5, 5, 2, 1); break;
    case 'karte':
      R('#e8e8f0', 1, 4, 14, 9); R('#3a6ea8', 1, 4, 14, 3); R('#f0c09a', 2, 8, 4, 4); R('#555', 8, 9, 5, 1); R('#555', 8, 11, 4, 1); R('#caa040', 11, 5, 3, 1); break;
    case 'stativ':
      R('#333', 6, 1, 4, 3); R('#555', 7, 4, 2, 5); R('#555', 4, 9, 2, 6); R('#555', 7, 9, 2, 6); R('#555', 10, 9, 2, 6); R('#777', 5, 8, 6, 1); break;
    case 'handystativ':
      R('#222', 4, 0, 8, 6); R('#4aa0e0', 5, 1, 6, 4); R('#ff3050', 10, 1, 1, 1); R('#555', 7, 6, 2, 4); R('#555', 4, 10, 2, 6); R('#555', 7, 10, 2, 6); R('#555', 10, 10, 2, 6); break;
    case 'schere':
      R('#c03040', 2, 9, 4, 4); R('#c03040', 9, 9, 4, 4); R('#1a1a24', 3, 10, 2, 2); R('#1a1a24', 10, 10, 2, 2); R('#bbc', 5, 3, 2, 7); R('#99a', 8, 3, 2, 7); R('#dde', 6, 1, 3, 3); break;
    case 'moppkopf':
      for (let i = 0; i < 6; i++) R(i % 2 ? '#c9c9d4' : '#a8a8b8', 2 + i * 2, 3 + (i % 2), 2, 11); R('#e9e9f2', 3, 3, 10, 2); break;
    case 'kittel':
      R('#c8c8d8', 3, 2, 10, 13); R('#f4f4f8', 4, 2, 8, 12); R('#c8c8d8', 7, 4, 1, 10); R('#f4f4f8', 1, 3, 3, 8); R('#f4f4f8', 12, 3, 3, 8); R('#6aa0d0', 9, 6, 2, 2); break;
    case 'brille':
      R('#202030', 1, 6, 6, 1); R('#202030', 9, 6, 6, 1); R('#202030', 1, 10, 6, 1); R('#202030', 9, 10, 6, 1); R('#202030', 1, 6, 1, 5); R('#202030', 6, 6, 1, 5); R('#202030', 9, 6, 1, 5); R('#202030', 14, 6, 1, 5); R('#202030', 7, 7, 2, 1); R('#bde', 2, 7, 4, 3); R('#bde', 10, 7, 4, 3); break;
    case 'verkleidung':
    case 'verkleidungTeil':
      R('#c8c8d8', 3, 5, 10, 11); R('#f4f4f8', 4, 5, 8, 10); R('#c9c9d4', 4, 0, 8, 4); R('#e9e9f2', 5, 0, 6, 1); R('#202030', 4, 5, 3, 1); R('#202030', 9, 5, 3, 1);
      if (id === 'verkleidungTeil') { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, 16, 16); R('#fff', 11, 10, 4, 5); R('#333', 12, 11, 2, 1); R('#333', 13, 12, 1, 1); R('#333', 12, 14, 1, 1); }
      break;
    case 'einladung':
      R('#f4ecd8', 1, 3, 14, 10); R('#caa040', 1, 3, 14, 2); R('#8a6a30', 3, 7, 10, 1); R('#8a6a30', 3, 9, 8, 1); R('#c03040', 11, 9, 3, 3); break;
    case 'motor':
      R('#ddd', 2, 8, 12, 6); R('#aaa', 2, 13, 12, 1); R('#333', 4, 10, 3, 2); R('#3a3', 10, 10, 2, 1); R('#bbe', 5, 3, 6, 5); R('#fff', 7, 5, 2, 1); break;
    case 'qbox':
      R('#223', 2, 2, 12, 12); R('#3a4a6a', 3, 3, 10, 10); R('#9ef', 5, 5, 6, 6); R('#fff', 7, 7, 2, 2); break;
    case 'besenstiel':
      R('#a07040', 7, 0, 2, 16); R('#c09060', 7, 0, 1, 16); R('#777', 6, 14, 4, 2); break;
    case 'massband':
      R('#f0c020', 2, 4, 11, 10); R('#c09010', 2, 12, 11, 2); R('#333', 5, 7, 5, 4); R('#ddd', 13, 9, 3, 2); R('#999', 12, 9, 1, 2); break;
    case 'eimer':
    case 'wassereimer':
      R('#f0c020', 3, 5, 10, 10); R('#c09010', 3, 13, 10, 2); R('#888', 2, 3, 12, 1); R('#888', 2, 3, 1, 4); R('#888', 13, 3, 1, 4);
      if (id === 'wassereimer') { R('#4aa0e0', 4, 5, 8, 2); R('#aee', 6, 5, 3, 1); }
      break;
    case 'yagi':
      R('#a07040', 7, 1, 2, 15); R('#f0c020', 1, 3, 14, 1); R('#f0c020', 2, 7, 12, 1); R('#f0c020', 3, 11, 10, 1); break;
    case 'funkgeraet':
    case 'funkgeraetVoll':
      R('#222', 5, 5, 7, 11); R('#333', 6, 6, 5, 3); R('#555', 8, 0, 1, 5); R('#444', 6, 10, 5, 4); R('#666', 7, 11, 1, 1); R('#666', 9, 11, 1, 1); R('#666', 7, 13, 1, 1); R('#666', 9, 13, 1, 1);
      R(id === 'funkgeraetVoll' ? '#3f3' : '#f33', 10, 6, 1, 1); if (id === 'funkgeraetVoll') R('#9f6', 6, 7, 3, 1);
      break;
    case 'peiler':
      R('#a07040', 1, 7, 14, 2); R('#f0c020', 3, 1, 1, 14); R('#f0c020', 7, 2, 1, 12); R('#f0c020', 11, 3, 1, 10); R('#222', 9, 9, 5, 7); R('#3f3', 12, 10, 1, 1); break;
    case 'stadtplan':
      R('#f0ead0', 1, 2, 14, 12); R('#d8d0b0', 5, 2, 1, 12); R('#d8d0b0', 10, 2, 1, 12); R('#4aa0e0', 1, 9, 14, 2); R('#a0c880', 2, 3, 3, 4); R('#c03040', 8, 4, 3, 3); R('#555', 12, 6, 2, 2); break;
    case 'tasse':
    case 'kaffee':
      R('#f4f4f4', 3, 6, 8, 9); R('#ddd', 3, 14, 8, 1); R('#f4f4f4', 11, 8, 3, 1); R('#f4f4f4', 13, 8, 1, 4); R('#f4f4f4', 11, 11, 3, 1); R('#c03040', 5, 9, 4, 2);
      if (id === 'kaffee') { R('#6a3a1a', 4, 6, 6, 2); R('#ddd', 5, 1, 1, 3); R('#ddd', 7, 2, 1, 3); R('#ddd', 9, 0, 1, 3); }
      break;
    case 'doener':
      R('#e0b070', 2, 3, 12, 11); R('#c89050', 2, 3, 12, 1); R('#8a5a30', 4, 4, 8, 4); R('#6ab04a', 4, 5, 3, 2); R('#e04040', 9, 5, 2, 2); R('#f4f4f4', 5, 8, 6, 1); R('#f0e0c0', 3, 10, 10, 4); break;
    case 'namensschild':
      R('#f4f4f4', 1, 5, 14, 7); R('#3a6ea8', 1, 5, 14, 2); R('#333', 3, 8, 9, 1); R('#999', 3, 10, 6, 1); R('#aaa', 7, 3, 2, 2); break;
    case 'chronik':
      R('#5a2a1a', 2, 2, 12, 13); R('#7a3a22', 3, 2, 11, 12); R('#caa040', 5, 5, 6, 1); R('#caa040', 5, 7, 6, 1); R('#f0e8d0', 13, 3, 1, 11); break;
    case 'rudi':
      R('#222', 5, 5, 7, 11); R('#333', 6, 6, 5, 3); R('#555', 8, 0, 1, 5); R('#444', 6, 10, 5, 4); R('#3f3', 10, 6, 1, 1); R('#9f6', 6, 7, 3, 1); R('#ffd35a', 13, 1, 1, 1); R('#ffd35a', 14, 3, 1, 1); break;
    case 'kerze':
      R('#f0e0a0', 6, 5, 4, 10); R('#d8c880', 6, 13, 4, 2); R('#333', 7, 3, 1, 2); R('#ffb030', 7, 0, 2, 3); R('#fff0a0', 7, 1, 1, 1); break;
    case 'pergament':
    case 'brief':
      R('#e8dcb0', 2, 2, 12, 12); R('#c8b888', 2, 13, 12, 1); R('#6a5a3a', 4, 5, 8, 1); R('#6a5a3a', 4, 7, 7, 1); R('#6a5a3a', 4, 9, 8, 1);
      if (id === 'brief') { R('#b02030', 9, 10, 5, 5); R('#d04050', 10, 11, 2, 2); }
      break;
    case 'baldrian':
      R('#8a6a3a', 5, 6, 6, 8); R('#6a4a2a', 3, 11, 3, 4); R('#6a4a2a', 10, 11, 3, 4); R('#5a8a3a', 6, 1, 1, 5); R('#5a8a3a', 9, 2, 1, 4); R('#f0f0f0', 5, 0, 3, 2); R('#f0f0f0', 8, 1, 3, 2); break;
    case 'zucker':
      R('#3a6ea8', 2, 4, 12, 10); R('#f4f4f4', 4, 6, 3, 3); R('#f4f4f4', 8, 6, 3, 3); R('#f4f4f4', 6, 10, 3, 3); R('#e0e0e0', 11, 10, 2, 2); break;
    case 'bohnen':
      R('#c8a060', 3, 4, 10, 11); R('#a88040', 3, 4, 10, 2); R('#4a2a1a', 5, 7, 3, 2); R('#4a2a1a', 9, 8, 3, 2); R('#4a2a1a', 6, 11, 3, 2); R('#2a1a0a', 6, 7, 1, 2); break;
    case 'amulett':
      R('#8a8a8a', 7, 1, 2, 4); R('#6a7a8a', 4, 5, 8, 9); R('#e03040', 6, 7, 4, 4); R('#ffd35a', 7, 8, 2, 2); R('#c8b888', 5, 13, 6, 1); break;
    case 'zertifikat':
      R('#f4ecd8', 1, 2, 14, 12); R('#8a6a30', 3, 5, 10, 1); R('#8a6a30', 3, 7, 8, 1); R('#f0f0d0', 9, 9, 4, 3); R('#c03040', 3, 10, 3, 3); R('#c03040', 4, 13, 1, 2); break;
  }
}

export function itemIcon(id, px = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  drawItem(c.getContext('2d'), id);
  const big = document.createElement('canvas');
  big.width = big.height = px;
  const b = big.getContext('2d');
  b.imageSmoothingEnabled = false;
  b.drawImage(c, 0, 0, px, px);
  return big.toDataURL();
}
