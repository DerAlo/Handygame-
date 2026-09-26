// Synth-Musik & Effekte – alles live mit der Web Audio API erzeugt.

const NOTES = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function midi(n) { const m = /^([A-G][#b]?)(-?\d)$/.exec(n); return m ? 12 * (+m[2] + 1) + NOTES[m[1]] : null; }
// Akkord wie "Am", "F", "Gsus", "Em7" -> MIDI-Töne (Grundlage Oktave 3)
function chord(name) {
  const m = /^([A-G][#b]?)(m|sus|maj7|m7|7)?$/.exec(name);
  const root = 48 + NOTES[m[1]];
  const q = m[2] || '';
  const iv = q === 'm' ? [0, 3, 7] : q === 'sus' ? [0, 5, 7] : q === 'maj7' ? [0, 4, 7, 11] : q === 'm7' ? [0, 3, 7, 10] : q === '7' ? [0, 4, 7, 10] : [0, 4, 7];
  return iv.map((i) => root + i);
}
const seq = (s) => s.trim().split(/\s+/);

// Lieder: Akkorde pro Takt (16 Schritte), Melodie in 8teln, Schlagzeug als Muster
export const SONGS = {
  title: { bpm: 80, chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'Em', 'Em'], pad: 0.05, arp: 0.02, bass: 0, lead: seq('E5 - - - - - - - D5 - C5 - - - - - E5 - - - G5 - - - A5 - - - - - - - . . A5 - G5 - E5 - D5 - - - C5 - D5 - E5 - - - - - - - - - - - . . . .'), leadVol: 0.05, drums: null },
  ceres: { bpm: 132, chords: ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'F', 'E'], pad: 0.025, arp: 0.035, bass: 0.1, lead: seq('A4 . C5 . E5 . A5 - G5 . E5 . D5 - E5 . A4 . C5 . E5 . G5 - F5 . E5 . D5 . C5 . F4 . A4 . C5 . F5 - E5 . C5 . D5 - B4 - G4 . B4 . D5 . G5 - F5 . D5 . B4 - G#4 -'), leadVol: 0.045, drums: { k: 'x...x...x...x...', s: '....x.......x...', h: '..x...x...x...x.' } },
  tethys: { bpm: 120, chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'], pad: 0.035, arp: 0.03, bass: 0.09, lead: seq('B4 - - - E5 - G5 - F#5 - - - E5 - D5 - E5 - - - B4 - - - G4 - A4 - B4 - - - C5 - - - E5 - G5 - A5 - - - G5 - E5 - F#5 - - - D5 - A4 - B4 - - - D#5 - - -'), leadVol: 0.04, drums: { k: 'x.....x...x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' } },
  aurin: { bpm: 108, chords: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A'], pad: 0.045, arp: 0.03, bass: 0.08, lead: seq('A4 - - - D5 - - - F5 - E5 - D5 - - - C5 - - - D5 - F5 - A5 - - - G5 - - - F5 - - - E5 - D5 - C5 - - - A4 - - - D5 - - - F5 - E5 - D5 - - - C#5 - - -'), leadVol: 0.04, drums: { k: 'x.......x.......', s: '........x.......', h: '..x...x...x...x.' } },
  licht: { bpm: 96, chords: ['Cm', 'Ab', 'Eb', 'Bb', 'Cm', 'Ab', 'Fm', 'G'], pad: 0.05, arp: 0.025, bass: 0.08, lead: seq('G4 - - - - - C5 - Eb5 - - - D5 - C5 - Bb4 - - - - - Eb5 - G5 - - - F5 - - - Ab5 - - - G5 - Eb5 - C5 - - - Bb4 - - - C5 - - - - - - - D5 - - - B4 - - -'), leadVol: 0.04, drums: { k: 'x.......x.....x.', s: '....x.......x...', h: '................' } },
  urlicht: { bpm: 72, chords: ['Cmaj7', 'Am', 'Fmaj7', 'G', 'Cmaj7', 'Am', 'Fmaj7', 'Gsus'], pad: 0.06, arp: 0.02, bass: 0.06, lead: seq('E5 - - - - - - - G5 - - - C6 - - - B5 - - - A5 - - - G5 - - - - - - - A5 - - - C6 - - - E6 - - - D6 - - - C6 - - - - - - - - - - - - - - -'), leadVol: 0.04, drums: null },
  boss: { bpm: 150, chords: ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B'], pad: 0.02, arp: 0.04, bass: 0.12, lead: seq('E5 . E5 . G5 . E5 . B5 - A5 . G5 . F#5 . E5 . E5 . G5 . B5 . E6 - D6 . B5 . A5 . C6 . B5 . A5 . G5 . E5 - G5 . A5 . B5 . F#5 . D#5 . B4 . F#5 - D#5 - B4 -'), leadVol: 0.045, drums: { k: 'x...x...x...x...', s: '....x.......x..x', h: 'xxxxxxxxxxxxxxxx' } },
  ende: { bpm: 84, chords: ['F', 'C', 'G', 'Am', 'F', 'C', 'G', 'C'], pad: 0.06, arp: 0.025, bass: 0.07, lead: seq('A4 - - - C5 - - - E5 - - - D5 - C5 - G4 - - - - - - - C5 - D5 - E5 - G5 - A5 - - - G5 - - - E5 - - - D5 - C5 - D5 - - - - - E5 - C5 - - - - - - -'), leadVol: 0.045, drums: { k: 'x.......x.......', s: '....x.......x...', h: '..x...x...x...x.' } },
};

class Synth {
  constructor() { this.ctx = null; this.sfxOn = true; this.musicOn = true; this.timer = null; this.song = null; }
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = (this.ctx = new AC());
      this.master = c.createGain(); this.master.gain.value = 0.85;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 5;
      this.master.connect(comp).connect(c.destination);
      this.sfx = c.createGain(); this.sfx.gain.value = this.sfxOn ? 1 : 0; this.sfx.connect(this.master);
      this.mus = c.createGain(); this.mus.gain.value = this.musicOn ? 0.9 : 0; this.mus.connect(this.master);
      // Echo für die Musik
      this.delay = c.createDelay(1); this.delay.delayTime.value = 0.28;
      const fb = c.createGain(); fb.gain.value = 0.3;
      const wet = c.createGain(); wet.gain.value = 0.25;
      this.delay.connect(fb).connect(this.delay); this.delay.connect(wet).connect(this.mus);
      this.noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.wanted && !this.timer) this.play(this.wanted, true);
  }
  suspend() { if (this.ctx?.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
  setSfx(on) { this.sfxOn = on; if (this.sfx) this.sfx.gain.value = on ? 1 : 0; }
  setMusic(on) { this.musicOn = on; if (this.mus) this.mus.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.1); }
  ok() { return this.ctx && this.sfxOn && this.ctx.state === 'running'; }

  osc(type, f, t, dur, vol, dest, { f1, attack = 0.008, cutoff, q = 1, echo = false } = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (cutoff) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff; lp.Q.value = q; o.connect(lp); node = lp; }
    node.connect(g).connect(dest);
    if (echo) g.connect(this.delay);
    o.start(t); o.stop(t + dur + 0.05);
  }
  noise(t, dur, vol, dest, type = 'lowpass', f0 = 2000, f1 = null) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; f.type = type; f.frequency.setValueAtTime(f0, t);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(dest); s.start(t); s.stop(t + dur + 0.05);
  }

  // ---------- Musik ----------
  play(name, force = false) {
    this.wanted = name;
    if (!this.ctx) return;
    if (this.song === name && !force) return;
    this.song = name;
    clearInterval(this.timer); this.timer = null;
    const S = SONGS[name];
    if (!S) return;
    const step = 60 / S.bpm / 4; // 16tel
    let i = 0, next = this.ctx.currentTime + 0.12;
    const bars = S.chords.length;
    this.timer = setInterval(() => {
      if (this.ctx.state !== 'running') { next = this.ctx.currentTime + 0.1; return; }
      while (next < this.ctx.currentTime + 0.2) {
        const bar = Math.floor(i / 16) % bars, s16 = i % 16;
        const ch = chord(S.chords[bar]);
        const t = next;
        if (s16 === 0 && S.pad) for (const n of ch) this.osc('sawtooth', hz(n + 12), t, step * 16, S.pad / ch.length * 2, this.mus, { attack: 0.3, cutoff: 1200 });
        if (S.arp) { const n = ch[s16 % ch.length] + 24 + (s16 >= 8 ? 12 : 0) * (s16 % 3 === 0 ? 1 : 0); this.osc('square', hz(n), t, step * 0.9, S.arp, this.mus, { cutoff: 2600 }); }
        if (S.bass && s16 % 2 === 0) this.osc('sawtooth', hz(ch[0] - 12 + (s16 % 8 === 6 ? 12 : 0)), t, step * 1.8, S.bass, this.mus, { cutoff: 500, q: 4 });
        // Melodie in 8teln
        if (s16 % 2 === 0) {
          const li = (Math.floor(i / 2)) % S.lead.length;
          const tok = S.lead[li];
          if (tok !== '-' && tok !== '.') {
            let h = 1; while (S.lead[(li + h) % S.lead.length] === '-') h++;
            this.osc('square', hz(midi(tok)), t, step * 2 * h * 0.95, S.leadVol, this.mus, { cutoff: 3200, echo: true });
          }
        }
        if (S.drums) {
          if (S.drums.k[s16] === 'x') this.osc('sine', 150, t, 0.25, 0.5, this.mus, { f1: 40 });
          if (S.drums.s[s16] === 'x') this.noise(t, 0.14, 0.18, this.mus, 'bandpass', 1800);
          if (S.drums.h[s16] === 'x') this.noise(t, 0.04, 0.05, this.mus, 'highpass', 8000);
        }
        next += step; i++;
      }
    }, 30);
  }
  stop() { clearInterval(this.timer); this.timer = null; this.song = null; this.wanted = null; }

  // ---------- Effekte ----------
  laser(lvl = 0) { if (!this.ok()) return; const t = this.ctx.currentTime; this.osc('square', lvl >= 2 ? 1500 : 1200, t, 0.09, 0.05, this.sfx, { f1: 300 }); }
  charge() { if (!this.ok()) return; const t = this.ctx.currentTime; this.osc('sawtooth', 200, t, 0.5, 0.03, this.sfx, { f1: 900, cutoff: 2000 }); }
  homing() { if (!this.ok()) return; const t = this.ctx.currentTime; this.osc('sawtooth', 600, t, 0.35, 0.08, this.sfx, { f1: 120, cutoff: 3000 }); this.noise(t, 0.3, 0.1, this.sfx, 'bandpass', 3000, 400); }
  boom(size = 1) {
    if (!this.ok()) return; const t = this.ctx.currentTime;
    this.noise(t, 0.35 + size * 0.25, 0.25 + size * 0.12, this.sfx, 'lowpass', 3000, 120);
    this.osc('sine', 110, t, 0.3 + size * 0.2, 0.3 * Math.min(1.5, size), this.sfx, { f1: 30 });
  }
  hit() { if (!this.ok()) return; const t = this.ctx.currentTime; this.noise(t, 0.2, 0.3, this.sfx, 'lowpass', 1200, 200); this.osc('square', 180, t, 0.2, 0.08, this.sfx, { f1: 60 }); }
  tink() { if (!this.ok()) return; const t = this.ctx.currentTime; this.osc('triangle', 2400, t, 0.06, 0.04, this.sfx); }
  deflect() { if (!this.ok()) return; const t = this.ctx.currentTime; this.osc('triangle', 3000, t, 0.12, 0.06, this.sfx, { f1: 5000 }); }
  ring(gold) { if (!this.ok()) return; const t = this.ctx.currentTime; (gold ? [0, 4, 7, 12, 16] : [0, 7, 12]).forEach((s, i) => this.osc('triangle', hz(79 + s), t + i * 0.05, 0.25, 0.08, this.sfx)); }
  item() { if (!this.ok()) return; const t = this.ctx.currentTime; [0, 5, 7, 12, 17, 19, 24].forEach((s, i) => this.osc('square', hz(72 + s), t + i * 0.04, 0.12, 0.05, this.sfx)); }
  roll() { if (!this.ok()) return; const t = this.ctx.currentTime; this.noise(t, 0.45, 0.12, this.sfx, 'bandpass', 400, 3000); }
  bomb() { if (!this.ok()) return; const t = this.ctx.currentTime; this.noise(t, 1.4, 0.4, this.sfx, 'lowpass', 4000, 60); this.osc('sine', 80, t, 1.2, 0.5, this.sfx, { f1: 25 }); }
  alarm() { if (!this.ok()) return; const t = this.ctx.currentTime; for (let i = 0; i < 3; i++) { this.osc('square', 880, t + i * 0.5, 0.25, 0.05, this.sfx); this.osc('square', 660, t + i * 0.5 + 0.25, 0.25, 0.05, this.sfx); } }
  lowShield() { if (!this.ok()) return; const t = this.ctx.currentTime; this.osc('square', 1000, t, 0.08, 0.04, this.sfx); this.osc('square', 1000, t + 0.15, 0.08, 0.04, this.sfx); }
  // „Stimme“ im Funk: Piepser in charakterspezifischer Tonhöhe
  voice(pitch = 1, type = 'square') { if (!this.ok()) return; const t = this.ctx.currentTime; this.osc(type, (240 + Math.random() * 160) * pitch, t, 0.05, 0.03, this.sfx, { cutoff: 2500 }); }
  radio() { if (!this.ok()) return; const t = this.ctx.currentTime; this.noise(t, 0.12, 0.08, this.sfx, 'bandpass', 1800); this.osc('sine', 1400, t + 0.05, 0.05, 0.03, this.sfx); }
}

export const audio = new Synth();
