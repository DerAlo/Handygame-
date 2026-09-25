// Chiptune-Musik & Effekte, synthetisiert mit der Web Audio API.

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
function freq(n) {
  const m = /^([A-G]#?)(\d)$/.exec(n);
  if (!m) return 0;
  const midi = 12 * (+m[2] + 1) + NOTE[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}
// Notenfolge: Tokens durch Leerzeichen, "-" hält, "." Pause
const seq = (s) => s.trim().split(/\s+/);

// Musikstücke pro Ort
export const SONGS = {
  title: {
    bpm: 112,
    lead: seq('E4 - G4 A4 B4 - A4 G4 E4 - D4 E4 G4 - - . E4 - G4 A4 B4 - D5 B4 A4 - G4 A4 E4 - - . C5 - B4 A4 G4 - A4 B4 E5 - D5 B4 A4 - - . G4 A4 B4 D5 E5 - D5 B4 A4 G4 E4 G4 A4 - - .'),
    bass: seq('E2 . E3 . E2 . E3 . C2 . C3 . C2 . C3 . D2 . D3 . D2 . D3 . A1 . A2 . B1 . B2 . E2 . E3 . E2 . E3 . C2 . C3 . C2 . C3 . D2 . D3 . D2 . D3 . A1 . A2 . B1 . B2 .'),
    wave: 'square',
  },
  flur: {
    bpm: 84,
    lead: seq('. . E4 . . . G4 . F#4 . . . D4 . . . . . E4 . . . B3 . C4 . D4 . E4 . . . . . A4 . . . G4 . F#4 . E4 . D4 . . . . . E4 . G4 . E4 . D4 . B3 . . . . .'),
    bass: seq('E2 . . E2 . . B1 . C2 . . C2 . . G1 . A1 . . A1 . . E2 . B1 . . B1 . . F#1 .'),
    wave: 'triangle',
  },
  labor: {
    bpm: 96,
    lead: seq('A4 C5 E5 A5 E5 C5 A4 C5 G4 B4 D5 G5 D5 B4 G4 B4 F4 A4 C5 F5 C5 A4 F4 A4 E4 G#4 B4 E5 B4 G#4 E4 G#4'),
    bass: seq('A1 - - - - - - - G1 - - - - - - - F1 - - - - - - - E1 - - - - - - -'),
    wave: 'square', leadVol: 0.035,
  },
  buero: {
    bpm: 72,
    lead: seq('C5 - - B4 A4 - G4 - E4 - - - . . . . F4 - A4 - C5 - B4 A4 G4 - - - . . . . E4 - G4 - C5 - D5 - E5 - D5 C5 A4 - - - F4 - E4 - D4 - E4 - C4 - - - . . . .'),
    bass: seq('C2 . G2 . C2 . G2 . F2 . C3 . F2 . C3 . A1 . E2 . A1 . E2 . F1 . C2 . G1 . D2 .'),
    wave: 'triangle',
  },
  bruecke: {
    bpm: 100,
    // Hicaz-Tonleiter – ein Gruß aus Istanbul an die Innbrücke
    lead: seq('D4 D#4 F#4 G4 A4 - G4 F#4 D#4 D4 - - . . . . A4 A#4 A4 G4 F#4 - G4 A4 F#4 D#4 D4 - . . . . D5 - C5 A#4 A4 - G4 F#4 G4 A4 F#4 G4 D#4 - D4 - . . F#4 G4 A4 - A#4 A4 G4 F#4 D#4 F#4 D4 - - - . .'),
    bass: seq('D2 . A2 . D2 . A2 . C2 . G2 . D2 . A2 . D2 . A2 . D2 . A2 . G1 . D2 . D2 . A2 .'),
    wave: 'square', leadVol: 0.04,
  },
  platz: {
    bpm: 90,
    lead: seq('G4 - B4 - D5 - B4 - C5 - A4 - F#4 - D4 - E4 - G4 - B4 - A4 G4 F#4 - - - . . . . G4 - B4 - D5 - G5 - F#5 - E5 - D5 - C5 - B4 - A4 - B4 - G4 - - - . . . .'),
    bass: seq('G1 . G2 . D2 . G2 . A1 . A2 . D2 . F#2 . C2 . C3 . G1 . G2 . D2 . D3 . D2 . D3 .'),
    wave: 'triangle',
  },
  duell: {
    bpm: 150,
    lead: seq('E5 . E5 D5 E5 . G5 . E5 . D5 . B4 . D5 . E5 . E5 D5 E5 . A5 . G5 . E5 . D5 . . . C5 . C5 B4 C5 . E5 . D5 . C5 . B4 . A4 . B4 . B4 A4 B4 . D5 . E5 - - - . . . .'),
    bass: seq('E2 E3 E2 E3 E2 E3 E2 E3 A1 A2 A1 A2 B1 B2 B1 B2 E2 E3 E2 E3 E2 E3 E2 E3 A1 A2 A1 A2 B1 B2 B1 B2 C2 C3 C2 C3 A1 A2 A1 A2 G1 G2 G1 G2 B1 B2 B1 B2 E2 E3 E2 E3 B1 B2 B1 B2 E2 E3 E2 E3 E2 E3 E2 E3'),
    wave: 'square', leadVol: 0.04,
  },
  saal: {
    bpm: 108,
    lead: seq('C5 - - - G4 - C5 - D5 - E5 - D5 - C5 - A4 - - - F4 - A4 - C5 - D5 - C5 - A4 - G4 - - - E4 - G4 - C5 - B4 - A4 - B4 - C5 - - - - - . . . . . . . .'),
    bass: seq('C2 . C3 . G1 . G2 . A1 . A2 . F1 . F2 . C2 . C3 . G1 . G2 . C2 . G1 . C2 . . .'),
    wave: 'triangle',
  },
  burg: {
    bpm: 88,
    // dorisch, ein bisschen Mittelalter
    lead: seq('D4 - F4 G4 A4 - C5 A4 G4 - F4 E4 D4 - - . A4 - C5 D5 E5 - D5 C5 A4 - G4 - A4 - - . D5 - C5 A4 G4 - A4 - F4 - E4 C4 D4 - - . F4 G4 A4 - G4 F4 E4 - D4 - - - . . . .'),
    bass: seq('D2 . A2 . D2 . A2 . C2 . G2 . C2 . G2 . D2 . A2 . D2 . A2 . A1 . E2 . D2 . . .'),
    wave: 'triangle',
  },
  turm: {
    bpm: 132,
    lead: seq('A4 . A4 C5 . A4 E5 . D5 . C5 . B4 . G4 . A4 . A4 C5 . A4 F5 . E5 . D5 . C5 . E5 . F5 . F5 E5 . D5 C5 . D5 . B4 . G4 . B4 . A4 - - - E4 . A4 . C5 . E5 - - - . . . .'),
    bass: seq('A1 A2 A1 A2 A1 A2 A1 A2 F1 F2 F1 F2 G1 G2 G1 G2 A1 A2 A1 A2 A1 A2 A1 A2 D2 D3 D2 D3 E2 E3 E2 E3'),
    wave: 'square', leadVol: 0.04,
  },
  mittelalter: {
    bpm: 104,
    // Tanzweise im Stil der Renaissance
    lead: seq('D5 . A4 . D5 E5 F5 . E5 D5 C5 . A4 . . . C5 . G4 . C5 D5 E5 . D5 C5 A#4 . A4 . . . D5 . F5 . E5 D5 C5 . A4 . C5 . D5 . . . F5 E5 D5 C5 A4 . G4 . A4 . D4 . D4 . . .'),
    bass: seq('D2 . A2 . C2 . G2 . A#1 . F2 . A1 . E2 . D2 . A2 . C2 . G2 . A#1 . C2 . D2 . . .'),
    wave: 'triangle',
  },
  huette: {
    bpm: 70,
    lead: seq('A4 - C5 - D5 - E5 - D5 - C5 - A4 - - - G4 - A4 - C5 - D5 - C5 - A4 - G4 - - - E4 - G4 - A4 - C5 - A4 - G4 - E4 - - - D4 - E4 - G4 - A4 - - - - - - -'),
    bass: seq('A1 . E2 . A1 . E2 . G1 . D2 . G1 . D2 . C2 . G2 . C2 . G2 . D2 . A2 . A1 . . .'),
    wave: 'triangle',
  },
  ende: {
    bpm: 120,
    lead: seq('C5 E5 G5 C6 - - B5 G5 A5 - F5 - G5 - - - E5 G5 C6 E6 - - D6 C6 B5 - G5 - C6 - - - A5 - C6 - F6 - E6 - D6 - B5 - G5 - - - C6 - - - G5 - E5 - C6 - - - - - - -'),
    bass: seq('C2 C3 C2 C3 G1 G2 G1 G2 F1 F2 F1 F2 G1 G2 G1 G2 C2 C3 C2 C3 G1 G2 G1 G2 F1 F2 G1 G2 C2 C3 C2 C3'),
    wave: 'square', leadVol: 0.04,
  },
};

class Chip {
  constructor() { this.ctx = null; this.sfxOn = true; this.musicOn = true; this.song = null; this.timer = null; }
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = (this.ctx = new AC());
      this.master = c.createGain(); this.master.gain.value = 0.8;
      this.master.connect(c.destination);
      this.sfx = c.createGain(); this.sfx.gain.value = this.sfxOn ? 1 : 0; this.sfx.connect(this.master);
      this.mus = c.createGain(); this.mus.gain.value = this.musicOn ? 1 : 0; this.mus.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.wanted && !this.timer) this.play(this.wanted, true);
  }
  suspend() { if (this.ctx?.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
  setSfx(on) { this.sfxOn = on; if (this.sfx) this.sfx.gain.value = on ? 1 : 0; }
  setMusic(on) { this.musicOn = on; if (this.mus) this.mus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.1); }

  note(f, t, dur, type, vol, dest) {
    if (!f) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + Math.max(0.02, dur - 0.04));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t); o.stop(t + dur + 0.02);
  }

  play(name, force = false) {
    this.wanted = name;
    if (!this.ctx) return;
    if (this.song === name && !force) return;
    this.song = name;
    clearInterval(this.timer);
    const S = SONGS[name];
    if (!S) { this.timer = null; return; }
    const step = 60 / S.bpm / 2;
    let i = 0, next = this.ctx.currentTime + 0.1;
    const len = Math.max(S.lead.length, S.bass.length * 2);
    const hold = (arr, idx) => { let n = 1; while (arr[idx + n] === '-') n++; return n; };
    this.timer = setInterval(() => {
      if (this.ctx.state !== 'running') { next = this.ctx.currentTime + 0.1; return; }
      while (next < this.ctx.currentTime + 0.25) {
        const li = i % S.lead.length;
        const tok = S.lead[li];
        if (tok !== '-' && tok !== '.') this.note(freq(tok), next, step * hold(S.lead, li) * 0.95, S.wave, S.leadVol || 0.05, this.mus);
        if (i % 2 === 0) {
          const bi = (i / 2) % S.bass.length;
          const b = S.bass[bi];
          if (b !== '-' && b !== '.') this.note(freq(b), next, step * 2 * hold(S.bass, bi) * 0.9, 'triangle', 0.12, this.mus);
        }
        // leichte Hi-Hat
        if (S.bpm >= 100 && i % 2 === 1) this.hat(next, 0.02);
        next += step; i = (i + 1) % (len * 4);
      }
    }, 40);
  }
  stop() { clearInterval(this.timer); this.timer = null; this.song = null; this.wanted = null; }

  hat(t, vol) {
    const c = this.ctx, len = Math.floor(c.sampleRate * 0.03);
    const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'highpass'; f.frequency.value = 7000; g.gain.value = vol;
    s.connect(f).connect(g).connect(this.mus); s.start(t);
  }

  ok() { return this.ctx && this.sfxOn && this.ctx.state === 'running'; }
  sweep(f0, f1, dur, type = 'square', vol = 0.1) {
    if (!this.ok()) return;
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.sfx); o.start(t); o.stop(t + dur + 0.02);
  }
  blip() { this.sweep(880, 1320, 0.05, 'square', 0.05); }
  pickup() { if (!this.ok()) return; const t = this.ctx.currentTime; [0, 4, 7, 12].forEach((s, i) => this.note(523 * Math.pow(2, s / 12), t + i * 0.06, 0.08, 'square', 0.07, this.sfx)); }
  door() { this.sweep(160, 60, 0.25, 'triangle', 0.25); }
  bad() { this.sweep(220, 110, 0.2, 'square', 0.06); }
  zap() { this.sweep(2000, 100, 0.5, 'sawtooth', 0.06); }
  talk(pitch = 1) { if (!this.ok()) return; this.note((300 + Math.random() * 120) * pitch, this.ctx.currentTime, 0.04, 'square', 0.02, this.sfx); }
  win() { if (!this.ok()) return; const t = this.ctx.currentTime; [0, 4, 7, 12, 16].forEach((s, i) => this.note(523 * Math.pow(2, s / 12), t + i * 0.08, 0.2, 'square', 0.07, this.sfx)); }
  point(good) { if (!this.ok()) return; const t = this.ctx.currentTime; (good ? [0, 7, 12] : [5, 1, -3]).forEach((s, i) => this.note(440 * Math.pow(2, s / 12), t + i * 0.07, 0.1, 'square', 0.07, this.sfx)); }
  radio() {
    if (!this.ok()) return;
    const c = this.ctx, len = c.sampleRate * 0.8, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1500; g.gain.value = 0.15;
    s.connect(f).connect(g).connect(this.sfx); s.start();
  }
  morse(text) {
    if (!this.ok()) return;
    const M = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
    const u = 0.06;
    let t = this.ctx.currentTime + 0.05;
    for (const ch of text) {
      if (ch === ' ') { t += u * 7; continue; }
      for (const s of M[ch] || '') { const d = s === '.' ? u : u * 3; this.note(700, t, d, 'sine', 0.08, this.sfx); t += d + u; }
      t += u * 2;
    }
  }
}

export const audio = new Chip();
