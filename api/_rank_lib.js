/** Pure scoring helpers for the global ranking. No network, no KV: unit-testable. */
const config = require('./_rank_config.json');

const enabled = (cfg = config) => cfg.stats.filter(s => !s.disabled && s.path);

/** 'stats.SkyWars.kills' or 'a.b+c.d' (sum). Returns a number, or null when every term is missing. */
function readPath(obj, expr) {
  let sum = 0, found = false;
  for (const term of String(expr).split('+')) {
    let cur = obj;
    for (const key of term.trim().split('.')) { if (cur == null) break; cur = cur[key]; }
    if (typeof cur === 'number' && Number.isFinite(cur)) { sum += cur; found = true; }
  }
  return found ? sum : null;
}

const DERIVED = {
  // Hypixel's level curve from total network exp
  '@networkLevel': (p) => (typeof p.networkExp === 'number' ? Math.round((1 + (-3.5 + Math.sqrt(12.25 + 0.0008 * p.networkExp))) * 100) / 100 : null),
  '@quests': (p) => Object.values(p.quests || {}).reduce((n, q) => n + ((q && q.completions) || []).length, 0),
};

function extractValues(player, cfg = config) {
  const out = {};
  for (const s of cfg.stats) {
    if (s.disabled || !s.path) continue;
    const v = s.path.startsWith('@') ? DERIVED[s.path]?.(player) : readPath(player, s.path);
    out[s.id] = v == null ? 0 : v;
  }
  return out;
}

/** classic = Sk1er style (linear vs #1). balanced = square root, so mid-ranked players aren't flattened by one outlier. */
function fraction(value, ref, mode = 'classic') {
  if (!ref || ref <= 0 || !(value > 0)) return 0;
  const f = Math.min(1, value / ref);
  return mode === 'balanced' ? Math.sqrt(f) : f;
}

/** Raise any reference a player beats. Returns { refs, raised } where raised = ids that changed. */
function ratchet(seedRefs, storedRefs, values) {
  const refs = {}, raised = {};
  for (const s of enabled()) {
    let r = Math.max(seedRefs[s.id] || 0, storedRefs?.[s.id] || 0);
    const v = values[s.id] || 0;
    if (v > r) { r = v; }
    refs[s.id] = r;
    if (r > Math.max(seedRefs[s.id] || 0, storedRefs?.[s.id] || 0)) raised[s.id] = r;
  }
  return { refs, raised };
}

function scorePlayer(values, refs, mode = 'classic', cfg = config) {
  const rows = [], groups = {};
  for (const g of cfg.groups) groups[g.id] = { id: g.id, name: g.name, earned: 0, points: 0 };
  let earned = 0, possible = 0;
  for (const s of enabled(cfg)) {
    const value = values[s.id] || 0, ref = refs[s.id] || s.ref;
    const f = fraction(value, ref, mode), pts = f * s.points;
    rows.push({ id: s.id, label: s.label, group: s.group, points: s.points, value, ref, fraction: f, earned: pts, estimate: !!s.estimate, verify: !!s.verify });
    groups[s.group].earned += pts; groups[s.group].points += s.points;
    earned += pts; possible += s.points;
  }
  const total = possible ? (earned / possible) * cfg.meta.perfectScore : 0;
  return { total, rows, groups: Object.values(groups).filter(g => g.points) };
}

const seedRefs = () => Object.fromEntries(enabled().map(s => [s.id, s.ref]));
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

module.exports = { config, enabled, readPath, extractValues, fraction, ratchet, scorePlayer, seedRefs, round };