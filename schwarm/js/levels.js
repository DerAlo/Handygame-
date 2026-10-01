// SCHWARMSTURM – Waffen, Upgrades und Level-Generator

export const WEAPONS = {
  pistol: { name: 'Pistole', icon: '🔫', rate: 2.4, dmg: 1, speed: 40, pellets: 1, spread: 0.03, color: '#ffe08a', size: 1 },
  mg: { name: 'Maschinengewehr', icon: '⚡', rate: 6.5, dmg: 0.7, speed: 48, pellets: 1, spread: 0.06, color: '#ffd23a', size: 0.8 },
  shotgun: { name: 'Schrotflinte', icon: '💥', rate: 1.4, dmg: 0.9, speed: 36, pellets: 5, spread: 0.2, color: '#ffb05a', size: 0.9 },
  rocket: { name: 'Raketenwerfer', icon: '🚀', rate: 0.85, dmg: 4, speed: 26, pellets: 1, spread: 0.02, splash: 3.4, color: '#ff6a3a', size: 1.8 },
  laser: { name: 'Laser', icon: '✨', rate: 2.2, dmg: 1.4, speed: 70, pellets: 1, spread: 0, pierce: true, color: '#4af0ff', size: 1.4 },
};

export const UPGRADES = {
  start: { name: 'Starttrupp', desc: '+3 Kämpfer zu Beginn', base: 40 },
  power: { name: 'Feuerkraft', desc: '+15 % Schaden', base: 60 },
  rate: { name: 'Feuerrate', desc: '+10 % Schüsse', base: 60 },
  coins: { name: 'Münzglück', desc: '+20 % Münzen', base: 80 },
};
export const upgradeCost = (k, lvl) => Math.round(UPGRADES[k].base * Math.pow(1.6, lvl));

// Deterministischer Zufall pro Level
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const WEAPON_ORDER = ['mg', 'shotgun', 'rocket', 'laser'];
const BOSSES = ['brute', 'tank', 'golem'];

export function buildLevel(i) {
  const R = rng(i * 7919 + 17);
  const r = (a, b) => a + R() * (b - a);
  const ri = (a, b) => Math.floor(r(a, b + 1));
  const pick = (arr) => arr[Math.floor(R() * arr.length)];
  const d = i; // Schwierigkeit
  const items = [];
  let z = -24;
  const len = Math.min(460, 230 + i * 18);
  // Waffenkisten an festen Stellen
  const weaponAt = new Set([Math.floor(len * 0.3), Math.floor(len * 0.62)]);
  const gate = () => {
    const good = () => R() < 0.25 + Math.min(0.2, d * 0.02) ? `×${R() < 0.8 ? 2 : 3}` : `+${ri(5, 12) + d * 2}`;
    const bad = () => R() < 0.6 ? `−${ri(4, 10) + d * 2}` : '÷2';
    const a = good(), b = R() < 0.3 ? good() : bad();
    return R() < 0.5 ? { type: 'gates', left: a, right: b } : { type: 'gates', left: b, right: a };
  };
  const patterns = [
    { w: 1.8, f: gate },
    { w: 2.2, f: () => ({ type: 'horde', n: ri(6, 12) + d * 5, x: r(-2, 2) }) },
    { w: 1.4, f: () => ({ type: 'barrels', hp: ri(6, 10) + d * 3, n: ri(2, 3) }) },
    { w: d >= 1 ? 1 : 0, f: () => ({ type: 'wall', hp: ri(10, 16) + d * 5 }) },
    { w: d >= 1 ? 1.1 : 0.4, f: () => ({ type: 'saw', speed: r(1.2, 2) + d * 0.08 }) },
    { w: d >= 2 ? 1 : 0, f: () => ({ type: 'hammer', x: pick([-3, 0, 3]) }) },
    { w: d >= 2 ? 0.9 : 0, f: () => ({ type: 'narrow', len: ri(16, 24) }) },
    { w: 0.9, f: () => ({ type: 'plus', side: pick([-1, 1]), n: ri(8, 12) }) },
    { w: d >= 1 ? 1 : 0, f: () => ({ type: 'tower', side: pick([-1, 1]), hp: ri(10, 14) + d * 3 }) },
  ];
  const total = patterns.reduce((s, p) => s + p.w, 0);
  // Start immer mit einem Tor
  items.push({ z, ...gate() }); z -= 22;
  let wi = 0;
  while (-z < len) {
    if ([...weaponAt].some((w) => -z >= w && -z < w + 22)) {
      const weapon = WEAPON_ORDER[(i + wi) % WEAPON_ORDER.length];
      items.push({ z, type: 'crate', weapon, hp: ri(8, 12) + d * 3, x: pick([-3, 3]) });
      items.push({ z: z + 2, type: 'barrels', hp: ri(4, 7) + d * 2, n: 1, x: 0 });
      wi++;
      z -= 24;
      continue;
    }
    let k = R() * total, p = patterns[0];
    for (const q of patterns) { k -= q.w; if (k <= 0) { p = q; break; } }
    // nie zweimal dasselbe direkt hintereinander
    if (items.length && p.f === patterns.find((q) => q.f === p.f).f && items[items.length - 1].type === p.f().type) continue;
    const it = p.f();
    items.push({ z, ...it });
    z -= it.type === 'narrow' ? it.len + 14 : it.type === 'plus' ? it.n * 2 + 10 : it.type === 'horde' ? 26 : 22;
  }
  // vor dem Boss noch ein gutes Tor
  items.push({ z, type: 'gates', left: `+${10 + d * 3}`, right: '×2' });
  const mega = (i + 1) % 5 === 0;
  const type = BOSSES[i % BOSSES.length];
  return {
    index: i, theme: i % 5, length: -z + 10, items,
    boss: { type, hp: Math.round((50 + d * 32) * (mega ? 1.6 : 1)), mega, name: { brute: 'Rotriese', tank: 'Kampfpanzer', golem: 'Lavagolem' }[type] + (mega ? ' (MEGA)' : '') },
  };
}
