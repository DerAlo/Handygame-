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
      r('#b04030', -tw / 2 + 1, ty + 4, tw - 2, torsoH + 2);
      r('#d05a48', -tw / 2 + 1, ty + 4, tw - 2, 1);
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
