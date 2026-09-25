// Alle Sounds und die Musik werden live mit der Web Audio API synthetisiert – keine Audiodateien.

// Pentatonik (C-Dur) – klingt in jeder Kombination harmonisch
const PENTA = [0, 2, 4, 7, 9];
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const pentaNote = (base, i) => base + PENTA[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5);

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.sfxOn = true;
    this.musicOn = true;
    this.musicTimer = null;
    this.lastThud = 0;
  }

  // Muss aus einer Nutzergeste heraus aufgerufen werden (iOS/Android-Autoplay-Regeln)
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const c = this.ctx;
      this.master = c.createGain();
      this.master.gain.value = 0.9;
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(c.destination);
      this.sfx = c.createGain();
      this.sfx.gain.value = this.sfxOn ? 0.7 : 0;
      this.sfx.connect(this.master);
      this.music = c.createGain();
      this.music.gain.value = 0;
      this.music.connect(this.master);
      // Weicher Hall für die Musik
      this.verb = c.createConvolver();
      this.verb.buffer = this.makeImpulse(2.2);
      const wet = c.createGain();
      wet.gain.value = 0.35;
      this.verb.connect(wet).connect(this.music);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.musicOn) this.startMusic();
  }

  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  makeImpulse(sec) {
    const c = this.ctx, len = Math.floor(c.sampleRate * sec);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    }
    return buf;
  }

  setSfx(on) {
    this.sfxOn = on;
    if (this.sfx) this.sfx.gain.setTargetAtTime(on ? 0.7 : 0, this.ctx.currentTime, 0.02);
  }
  setMusic(on) {
    this.musicOn = on;
    if (!this.ctx) return;
    if (on) this.startMusic(); else this.stopMusic();
  }

  // ---------- Bausteine ----------
  tone({ type = 'sine', f0, f1 = f0, t = 0, dur = 0.2, vol = 0.3, attack = 0.005, dest = this.sfx, curve = 'exp' }) {
    const c = this.ctx;
    const now = c.currentTime + t;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, now);
    if (f1 !== f0) {
      if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(f1, now + dur * 0.8);
      else o.frequency.linearRampToValueAtTime(f1, now + dur * 0.8);
    }
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g).connect(dest);
    o.start(now);
    o.stop(now + dur + 0.05);
    return g;
  }

  noise({ t = 0, dur = 0.1, vol = 0.2, freq = 1200, q = 1 }) {
    const c = this.ctx;
    const now = c.currentTime + t;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(now);
  }

  ok() { return this.ctx && this.sfxOn && this.ctx.state === 'running'; }

  // ---------- Soundeffekte ----------
  drop(lv) {
    if (!this.ok()) return;
    const f = 520 - lv * 40;
    this.tone({ f0: f, f1: f * 2.2, dur: 0.12, vol: 0.25 });
  }

  // Blubb-Geräusch beim Verschmelzen, Tonhöhe nach Stufe und Kombo
  merge(lv, combo) {
    if (!this.ok()) return;
    const n = pentaNote(72, 11 - lv + Math.min(combo - 1, 6));
    const f = midi(n);
    this.tone({ f0: f * 0.5, f1: f * 1.4, dur: 0.14, vol: 0.35 });
    this.tone({ type: 'triangle', f0: f, dur: 0.35, vol: 0.18, t: 0.04 });
    this.tone({ type: 'sine', f0: f * 2, dur: 0.25, vol: 0.06, t: 0.04 });
    if (lv >= 6) this.tone({ type: 'sine', f0: midi(n - 12), dur: 0.6, vol: 0.2, t: 0.02 });
  }

  thud(size) {
    if (!this.ok()) return;
    const now = this.ctx.currentTime;
    if (now - this.lastThud < 0.07) return;
    this.lastThud = now;
    const f = 220 - size * 12;
    this.tone({ f0: f, f1: f * 0.5, dur: 0.12, vol: 0.18 });
  }

  combo(k) {
    if (!this.ok()) return;
    for (let i = 0; i < 3; i++) {
      this.tone({ type: 'triangle', f0: midi(pentaNote(79, k + i)), dur: 0.2, vol: 0.12, t: 0.06 * i + 0.08 });
    }
  }

  discover() {
    if (!this.ok()) return;
    [0, 4, 7, 12].forEach((s, i) =>
      this.tone({ type: 'triangle', f0: midi(76 + s), dur: 0.35, vol: 0.14, t: 0.09 * i + 0.1 }));
  }

  king() {
    if (!this.ok()) return;
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => {
      this.tone({ type: 'square', f0: midi(67 + s), dur: 0.3, vol: 0.05, t: 0.08 * i });
      this.tone({ type: 'triangle', f0: midi(67 + s), dur: 0.5, vol: 0.14, t: 0.08 * i });
    });
    this.noise({ t: 0, dur: 0.6, vol: 0.12, freq: 6000, q: 0.5 });
  }

  pop() {
    if (!this.ok()) return;
    this.tone({ f0: 900, f1: 300, dur: 0.08, vol: 0.2 });
    this.noise({ dur: 0.05, vol: 0.08, freq: 2500 });
  }

  click() {
    if (!this.ok()) return;
    this.tone({ type: 'triangle', f0: 880, f1: 1320, dur: 0.07, vol: 0.12 });
  }

  warn() {
    if (!this.ok()) return;
    this.tone({ type: 'triangle', f0: 660, dur: 0.12, vol: 0.08 });
  }

  gameOver() {
    if (!this.ok()) return;
    [7, 4, 0, -5].forEach((s, i) =>
      this.tone({ type: 'triangle', f0: midi(67 + s), dur: 0.4, vol: 0.16, t: 0.16 * i }));
  }

  record() {
    if (!this.ok()) return;
    [0, 4, 7, 12, 7, 12, 16].forEach((s, i) =>
      this.tone({ type: 'triangle', f0: midi(72 + s), dur: 0.3, vol: 0.14, t: 0.1 * i + 0.7 }));
  }

  // ---------- Musik: ruhige, generative Loop-Musik ----------
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    this.music.gain.cancelScheduledValues(this.ctx.currentTime);
    this.music.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.8);
    this.bpm = 76;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.1;
    // Cmaj7 – Am7 – Fmaj7 – G6
    this.chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 64]];
    this.musicTimer = setInterval(() => this.schedule(), 50);
  }
  stopMusic() {
    if (!this.musicTimer) return;
    clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.music.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }

  schedule() {
    const c = this.ctx;
    if (c.state !== 'running') { this.nextTime = c.currentTime + 0.1; return; }
    const eighth = 60 / this.bpm / 2;
    while (this.nextTime < c.currentTime + 0.2) {
      const bar = Math.floor(this.step / 8) % 4;
      const pos = this.step % 8;
      const t = this.nextTime - c.currentTime;
      const chord = this.chords[bar];
      if (pos === 0) {
        chord.forEach((n) => this.pad(midi(n), t, eighth * 8));
        this.pluck(midi(chord[0] - 24), t, 0.9, 0.16, 'sine');
      }
      if (pos === 4) this.pluck(midi(chord[0] - 12), t, 0.6, 0.07, 'sine');
      // Marimba-Tupfer, zufällig aus der Pentatonik
      if (Math.random() < (pos % 2 ? 0.18 : 0.4)) {
        const n = pentaNote(72, Math.floor(Math.random() * 8));
        this.pluck(midi(n), t, 0.5, 0.06, 'sine');
        this.pluck(midi(n) * 4, t, 0.08, 0.012, 'sine');
      }
      this.nextTime += eighth;
      this.step++;
    }
  }

  pad(f, t, dur) {
    const c = this.ctx, now = c.currentTime + t;
    const o = c.createOscillator(), o2 = c.createOscillator();
    const g = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'sine';
    o.frequency.value = f; o2.frequency.value = f * 1.003;
    lp.type = 'lowpass'; lp.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.022, now + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, now + dur * 1.05);
    o.connect(lp); o2.connect(lp);
    lp.connect(g);
    g.connect(this.music);
    g.connect(this.verb);
    o.start(now); o2.start(now);
    o.stop(now + dur * 1.1); o2.stop(now + dur * 1.1);
  }

  pluck(f, t, dur, vol, type) {
    const c = this.ctx, now = c.currentTime + t;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g);
    g.connect(this.music);
    g.connect(this.verb);
    o.start(now); o.stop(now + dur + 0.05);
  }
}

export const audio = new AudioEngine();
