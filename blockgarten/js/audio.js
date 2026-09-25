// Sounds & Musik, komplett synthetisiert (Web Audio API).

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
// F-Dur-Pentatonik: F G A C D
const PENTA = [0, 2, 4, 7, 9];
const penta = (base, i) => base + PENTA[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5);

class Audio {
  constructor() { this.ctx = null; this.sfxOn = true; this.musicOn = true; this.timer = null; }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const c = (this.ctx = new AC());
      this.master = c.createGain();
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -14;
      this.master.connect(comp).connect(c.destination);
      this.sfx = c.createGain();
      this.sfx.gain.value = this.sfxOn ? 0.7 : 0;
      this.sfx.connect(this.master);
      this.music = c.createGain();
      this.music.gain.value = 0;
      this.music.connect(this.master);
      // Hall
      const len = c.sampleRate * 2.5, buf = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      }
      this.verb = c.createConvolver();
      this.verb.buffer = buf;
      const wet = c.createGain();
      wet.gain.value = 0.4;
      this.verb.connect(wet).connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.musicOn) this.startMusic();
  }
  suspend() { if (this.ctx?.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); }
  setSfx(on) { this.sfxOn = on; if (this.sfx) this.sfx.gain.setTargetAtTime(on ? 0.7 : 0, this.ctx.currentTime, 0.02); }
  setMusic(on) { this.musicOn = on; if (!this.ctx) return; on ? this.startMusic() : this.stopMusic(); }
  ok() { return this.ctx && this.sfxOn && this.ctx.state === 'running'; }

  // Kalimba-artiger Zupfton
  pluck(f, t = 0, vol = 0.2, dur = 0.5, dest = this.sfx, verb = true) {
    const c = this.ctx, now = c.currentTime + t;
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o2.type = 'sine';
    o.frequency.value = f; o2.frequency.value = f * 3.01;
    const g2 = c.createGain(); g2.gain.value = 0.12;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.connect(g); o2.connect(g2).connect(g);
    g.connect(dest);
    if (verb) g.connect(this.verb);
    o.start(now); o2.start(now); o.stop(now + dur + 0.05); o2.stop(now + dur + 0.05);
  }
  // Holzklötzchen
  wood(f, t = 0, vol = 0.3) {
    const c = this.ctx, now = c.currentTime + t;
    const o = c.createOscillator(), g = c.createGain(), bp = c.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f * 1.6, now);
    o.frequency.exponentialRampToValueAtTime(f, now + 0.03);
    bp.type = 'bandpass'; bp.frequency.value = f * 1.5; bp.Q.value = 2;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    o.connect(bp).connect(g).connect(this.sfx);
    o.start(now); o.stop(now + 0.15);
  }

  pick() { if (this.ok()) this.pluck(midi(84), 0, 0.08, 0.15, this.sfx, false); }
  place(n) { if (!this.ok()) return; this.wood(300 + Math.random() * 30, 0, 0.35); this.wood(220, 0.02, 0.15 + n * 0.01); }
  bad() { if (this.ok()) this.wood(140, 0, 0.25); }
  clear(lines, streak) {
    if (!this.ok()) return;
    const start = Math.min(streak - 1, 6);
    const n = 3 + lines * 2;
    for (let i = 0; i < n; i++) this.pluck(midi(penta(65, start + i)), i * 0.05, 0.16, 0.8);
    if (lines >= 2) this.pluck(midi(penta(65, start + n + 2)), n * 0.05 + 0.05, 0.12, 1.2);
  }
  big() {
    if (!this.ok()) return;
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.pluck(midi(65 + s), i * 0.07, 0.15, 1.2));
  }
  newTray() { if (this.ok()) [0, 2, 4].forEach((s, i) => this.pluck(midi(penta(77, s)), i * 0.05, 0.05, 0.25, this.sfx, false)); }
  click() { if (this.ok()) this.pluck(midi(89), 0, 0.08, 0.12, this.sfx, false); }
  over() { if (this.ok()) [7, 4, 2, 0].forEach((s, i) => this.pluck(midi(60 + s), i * 0.18, 0.15, 0.9)); }
  record() { if (this.ok()) [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => this.pluck(midi(72 + s), 0.6 + i * 0.1, 0.13, 0.6)); }

  // Ruhige Kalimba-Musik: F – Dm – B♭ – C
  startMusic() {
    if (!this.ctx || this.timer) return;
    this.music.gain.cancelScheduledValues(this.ctx.currentTime);
    this.music.gain.setTargetAtTime(0.45, this.ctx.currentTime, 1);
    this.step = 0;
    this.next = this.ctx.currentTime + 0.1;
    this.chords = [[53, 57, 60], [50, 53, 57], [46, 50, 53], [48, 52, 55]];
    this.melody = this.makeMelody();
    this.timer = setInterval(() => this.schedule(), 60);
  }
  stopMusic() {
    if (!this.timer) return;
    clearInterval(this.timer); this.timer = null;
    this.music.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }
  makeMelody() {
    // 32 Achtel, zufällig aber ruhig (Schrittbewegung)
    const m = []; let idx = 5;
    for (let i = 0; i < 32; i++) {
      if (Math.random() < 0.45) { idx = Math.max(2, Math.min(10, idx + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)])); m.push(idx); }
      else m.push(null);
    }
    return m;
  }
  schedule() {
    const c = this.ctx;
    if (c.state !== 'running') { this.next = c.currentTime + 0.1; return; }
    const eighth = 60 / 84 / 2;
    while (this.next < c.currentTime + 0.25) {
      const t = this.next - c.currentTime;
      const bar = Math.floor(this.step / 8) % 4, pos = this.step % 8;
      const ch = this.chords[bar];
      if (pos === 0) this.pluck(midi(ch[0] - 12), t, 0.1, 1.6, this.music);
      if (pos % 2 === 0) this.pluck(midi(ch[(pos / 2) % 3] + 12), t, 0.035, 0.7, this.music);
      const mel = this.melody[this.step % 32];
      if (mel !== null) this.pluck(midi(penta(65, mel)), t, 0.06, 0.9, this.music);
      this.step++;
      if (this.step % 64 === 0) this.melody = this.makeMelody();
      this.next += eighth;
    }
  }
}

export const audio = new Audio();
