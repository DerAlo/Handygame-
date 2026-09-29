// Gemalte Funk-Porträts der Figuren (Canvas-Zeichnungen, 128×128 Einheiten)
const TAU = Math.PI * 2;

export function drawPortrait(cv, who) {
  const x = cv.getContext('2d');
  const S = cv.width / 128;
  x.setTransform(S, 0, 0, S, 0, 0);
  x.clearRect(0, 0, 128, 128);
  const E = (cx, cy, rx, ry, col, rot = 0) => { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, TAU); x.fill(); };
  const P = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fill(); };
  const Ln = (pts, col, w = 2) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.stroke(); };
  const shade = (cx, cy, r, c0, c1) => { const g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.1, cx, cy, r); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
  const bg = (a, b) => { const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, 128, 128); };
  const suit = (col, trim) => { P([10, 128, 20, 104, 44, 96, 84, 96, 108, 104, 118, 128], col); P([48, 96, 64, 112, 80, 96, 74, 94, 64, 104, 54, 94], trim); };
  const eyeC = (cx, cy, r, iris, slit = false) => {
    E(cx, cy, r, r * 0.8, '#ffffff'); E(cx, cy, r * 0.72, r * 0.72, iris);
    if (slit) E(cx, cy, r * 0.18, r * 0.62, '#111'); else E(cx, cy, r * 0.36, r * 0.36, '#111');
    E(cx - r * 0.28, cy - r * 0.3, r * 0.2, r * 0.2, '#ffffff');
  };
  const headset = (cx, cy, r) => {
    x.strokeStyle = '#3a4250'; x.lineWidth = 5; x.beginPath(); x.arc(cx, cy, r, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
    E(cx - r, cy + 4, 6, 9, '#4a5260'); E(cx + r, cy + 4, 6, 9, '#4a5260');
    Ln([cx - r, cy + 10, cx - r + 10, cy + 28, cx - r + 24, cy + 30], '#3a4250', 3); E(cx - r + 26, cy + 30, 3.5, 3.5, '#6ad8ff');
  };

  switch (who) {
    case 'kira': { // Luchs
      bg('#12305a', '#0a1830');
      suit('#1d4fa8', '#6ad8ff');
      P([34, 44, 26, 2, 52, 34], '#c88a4a'); P([94, 44, 102, 2, 76, 34], '#c88a4a');
      P([36, 38, 30, 12, 48, 34], '#f0c8a0'); P([92, 38, 98, 12, 80, 34], '#f0c8a0');
      Ln([27, 3, 24, -6], '#1a1a1a', 3); Ln([101, 3, 104, -6], '#1a1a1a', 3);
      P([22, 70, 30, 96, 50, 92], '#f4e2c8'); P([106, 70, 98, 96, 78, 92], '#f4e2c8');
      E(64, 62, 36, 34, shade(64, 62, 36, '#e8b070', '#b87838'));
      for (const dx of [-8, 0, 8]) Ln([64 + dx, 30, 64 + dx * 1.2, 40], '#6a4020', 2.5);
      E(64, 80, 18, 13, '#f8ecd8');
      eyeC(48, 58, 9, '#5ac85a', true); eyeC(80, 58, 9, '#5ac85a', true);
      Ln([38, 50, 56, 52], '#6a4020', 2); Ln([90, 50, 72, 52], '#6a4020', 2);
      P([58, 72, 70, 72, 64, 79], '#d0707a');
      Ln([64, 79, 64, 84, 57, 88], '#5a3020', 2); Ln([64, 84, 71, 88], '#5a3020', 2);
      Ln([46, 80, 28, 76], '#ffffff', 1); Ln([82, 80, 100, 76], '#ffffff', 1);
      headset(64, 58, 38);
      break;
    }
    case 'rasko': { // Rabe
      bg('#3a1418', '#180a0c');
      suit('#a8202e', '#ffcf3a');
      P([40, 30, 50, 6, 58, 28, 66, 4, 72, 28, 84, 10, 84, 34], '#1a1c26');
      E(62, 62, 34, 36, shade(62, 62, 36, '#3a4058', '#10121a'));
      Ln([40, 44, 56, 36], 'rgba(120,150,255,0.5)', 3);
      P([70, 62, 118, 76, 72, 82], '#3a3a40'); P([70, 72, 118, 76, 72, 82], '#202024');
      Ln([72, 72, 112, 76], '#555', 1);
      P([30, 50, 94, 48, 92, 62, 32, 64], 'rgba(255,60,60,0.85)');
      Ln([30, 50, 94, 48], '#ff9a9a', 2);
      E(52, 56, 5, 4, 'rgba(255,255,255,0.7)');
      P([28, 94, 40, 80, 50, 96], '#1a1c26'); P([96, 94, 84, 80, 76, 96], '#1a1c26');
      break;
    }
    case 'oli': { // Otter
      bg('#10402a', '#082014');
      suit('#1f8a44', '#ffd23a');
      E(34, 36, 10, 10, '#7a4a2a'); E(94, 36, 10, 10, '#7a4a2a'); E(34, 36, 5, 5, '#c89a7a'); E(94, 36, 5, 5, '#c89a7a');
      E(64, 62, 38, 34, shade(64, 62, 38, '#a06a40', '#6a4020'));
      E(64, 80, 28, 20, '#ecd4ac');
      x.strokeStyle = '#3a2a1a'; x.lineWidth = 4; x.beginPath(); x.moveTo(26, 40); x.lineTo(102, 40); x.stroke();
      for (const cx of [48, 80]) { E(cx, 38, 12, 11, '#c8a040'); E(cx, 38, 9, 8, 'rgba(120,255,180,0.8)'); E(cx - 3, 35, 3, 2, '#ffffff'); }
      eyeC(48, 60, 8, '#2a1a10'); eyeC(80, 60, 8, '#2a1a10');
      E(64, 72, 9, 6, '#2a1a14'); E(61, 70, 3, 1.5, '#8a7a70');
      Ln([64, 78, 64, 84], '#3a2a1a', 2); x.strokeStyle = '#3a2a1a'; x.lineWidth = 2; x.beginPath(); x.arc(58, 84, 6, 0, Math.PI * 0.9); x.stroke(); x.beginPath(); x.arc(70, 84, 6, Math.PI * 0.1, Math.PI); x.stroke();
      for (const s of [-1, 1]) for (const dy of [-3, 1, 5]) Ln([64 + s * 16, 78 + dy, 64 + s * 38, 74 + dy * 1.6], 'rgba(255,255,255,0.7)', 1);
      break;
    }
    case 'hilde': { // Dachs
      bg('#40300c', '#201806');
      suit('#6a4a22', '#ffd27a');
      E(32, 40, 10, 9, '#2a2a2a'); E(96, 40, 10, 9, '#2a2a2a'); E(32, 40, 6, 5, '#f0f0f0'); E(96, 40, 6, 5, '#f0f0f0');
      E(64, 64, 38, 36, shade(64, 64, 38, '#b8b8b8', '#7a7a7a'));
      P([54, 30, 74, 30, 70, 100, 58, 100], '#f4f4f4');
      P([36, 44, 52, 36, 58, 90, 50, 92], '#1a1a1a'); P([92, 44, 76, 36, 70, 90, 78, 92], '#1a1a1a');
      E(64, 90, 16, 11, '#f0f0f0'); E(64, 84, 8, 6, '#1a1a1a');
      eyeC(50, 60, 6, '#3a2a1a'); eyeC(78, 60, 6, '#3a2a1a');
      x.strokeStyle = '#c8a040'; x.lineWidth = 2.5; for (const cx of [50, 78]) { x.beginPath(); x.arc(cx, 60, 10, 0, TAU); x.stroke(); } Ln([60, 60, 68, 60], '#c8a040', 2.5);
      Ln([58, 96, 64, 98, 70, 96], '#3a3a3a', 2);
      P([22, 30, 64, 14, 106, 30, 100, 40, 28, 40], '#6a4a2a'); E(64, 24, 8, 5, '#c8a040');
      break;
    }
    case 'ursa': { // Bärin, Generalin
      bg('#1c1a40', '#0c0a20');
      P([6, 128, 18, 100, 110, 100, 122, 128], '#2a3a6a'); for (const cx of [36, 46]) { E(cx, 112, 4, 4, '#ffd23a'); } P([56, 100, 64, 116, 72, 100], '#d8d8e8');
      E(30, 40, 13, 13, '#5a3a24'); E(98, 40, 13, 13, '#5a3a24'); E(30, 40, 7, 7, '#8a6040'); E(98, 40, 7, 7, '#8a6040');
      E(64, 64, 40, 38, shade(64, 64, 40, '#8a5e3c', '#4a3020'));
      E(64, 82, 20, 15, '#c09a70'); E(64, 76, 9, 6, '#1a1210');
      eyeC(48, 60, 6, '#2a1a10'); eyeC(80, 60, 6, '#2a1a10');
      Ln([40, 50, 56, 53], '#2a1a10', 3); Ln([88, 50, 72, 53], '#2a1a10', 3);
      Ln([56, 88, 64, 90, 72, 88], '#2a1a10', 2);
      P([20, 38, 30, 16, 98, 16, 108, 38], '#23305a'); P([16, 38, 112, 38, 104, 44, 24, 44], '#1a2440'); E(64, 26, 7, 7, '#ffd23a');
      break;
    }
    case 'nihil': { // Chamäleon
      bg('#2a0a3a', '#10041a');
      P([4, 128, 20, 96, 108, 96, 124, 128], '#4a1a6a'); P([30, 100, 44, 82, 50, 100], '#f0f0f0'); P([98, 100, 84, 82, 78, 100], '#f0f0f0');
      const g = x.createLinearGradient(20, 20, 110, 100); g.addColorStop(0, '#3ab06a'); g.addColorStop(0.5, '#2a8a9a'); g.addColorStop(1, '#8a3ab0');
      P([30, 30, 60, 8, 78, 20, 70, 34], '#2a7a5a');
      x.fillStyle = g; x.beginPath(); x.moveTo(22, 70); x.quadraticCurveTo(24, 28, 64, 26); x.quadraticCurveTo(104, 28, 118, 70); x.quadraticCurveTo(100, 96, 64, 94); x.quadraticCurveTo(30, 96, 22, 70); x.fill();
      for (let i = 0; i < 5; i++) E(46 + i * 10, 40 + (i % 2) * 4, 3, 2, 'rgba(255,255,255,0.18)');
      E(46, 56, 17, 17, shade(46, 56, 17, '#4ac07a', '#1a6a4a'));
      for (const r of [13, 9]) { x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 1.5; x.beginPath(); x.arc(46, 56, r, 0, TAU); x.stroke(); }
      E(49, 56, 5, 5, '#ffcf3a'); E(50, 56, 2.2, 2.2, '#111');
      Ln([60, 80, 84, 84, 112, 72], '#1a0a2a', 3);
      x.strokeStyle = '#ffd23a'; x.lineWidth = 2; x.beginPath(); x.arc(46, 56, 19, 0, TAU); x.stroke(); Ln([46, 75, 44, 96], '#ffd23a', 1.5);
      break;
    }
    case 'vex': { // Schakal
      bg('#3a0a2a', '#1a0414');
      suit('#4a1a5a', '#ff8ad0');
      P([36, 44, 30, -4, 56, 32], '#b88a50'); P([88, 40, 100, -4, 72, 30], '#b88a50');
      P([38, 38, 34, 10, 50, 32], '#e8c898'); P([86, 36, 96, 10, 76, 30], '#e8c898');
      E(62, 60, 30, 30, shade(62, 60, 30, '#d8b070', '#9a7040'));
      P([40, 38, 64, 30, 88, 38, 82, 50, 46, 50], '#3a2a20');
      P([70, 64, 116, 82, 110, 92, 72, 86], '#e8c898'); E(114, 86, 5, 5, '#1a1a1a');
      eyeC(52, 58, 7, '#ffaa2a'); eyeC(78, 56, 7, '#ffaa2a');
      Ln([72, 46, 84, 66], '#6a2a2a', 2);
      Ln([74, 90, 100, 94], '#3a2a20', 2);
      break;
    }
    case 'urlicht': {
      const g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, '#fff2c0'); g.addColorStop(0.6, '#ff9a40'); g.addColorStop(1, '#3a0a04');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; Ln([64 + Math.cos(a) * 20, 64 + Math.sin(a) * 20, 64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60], 'rgba(255,255,255,0.35)', 2); }
      break;
    }
    default:
      bg('#0e1a3a', '#060c1c');
  }
  // Funk-Scanlines
  x.fillStyle = 'rgba(255,255,255,0.035)';
  for (let y = 0; y < 128; y += 4) x.fillRect(0, y, 128, 1.5);
  x.setTransform(1, 0, 0, 1, 0, 0);
}
