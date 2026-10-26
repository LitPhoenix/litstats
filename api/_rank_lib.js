/** Pure scoring helpers for the global ranking (v2). No network, no KV: unit-testable.
 *
 *  stat score   s in 0..1   = estimated percentile of the value on that stat's leaderboard (log-rank), difficulty-adjusted
 *  game score   G           = power mean of that game's stat scores (weights w come from the leaderboard curves)
 *  games score              = peakShare * best game + (1 - peakShare) * decay-weighted average of ALL games, best first
 *  total                    = (1 - networkShare) * games + networkShare * network      (scaled to perfectScore)
 */
const config = require('./_rank_config.json');

const enabled = (cfg = config) => cfg.stats.filter(s => !s.disabled && s.path);

const getNum = (obj, dotted) => {
  let cur = obj;
  for (const key of dotted.trim().split('.')) { if (cur == null) return null; cur = cur[key]; }
  return typeof cur === 'number' && Number.isFinite(cur) ? cur : null;
};

/**
 * Path syntax:  a.b.c  one field | a.x + a.y  sum | a.x*0.5  weighted term | a.x|a.y  first that exists
 * Returns a number, or null when every term is missing.
 */
function readPath(obj, expr) {
  let sum = 0, found = false;
  for (let term of String(expr).split('+')) {
    let weight = 1;
    const m = term.match(/\*\s*(-?[\d.]+)\s*$/);
    if (m) { weight = parseFloat(m[1]); term = term.slice(0, m.index); }
    for (const alt of term.split('|')) {
      const v = getNum(obj, alt);
      if (v !== null) { sum += v * weight; found = true; break; }
    }
  }
  return found ? sum : null;
}

const DERIVED = {
  '@networkLevel': (p) => (typeof p.networkExp === 'number' ? Math.round((1 + (-3.5 + Math.sqrt(12.25 + 0.0008 * p.networkExp))) * 100) / 100 : null),
  '@quests': (p) => Object.values(p.quests || {}).reduce((n, q) => n + ((q && q.completions) || []).length, 0),
  '@lilyWeight': (p) => (typeof p.lilyWeight === 'number' ? p.lilyWeight : null),
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

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** knots: [[value, position], ...] sorted by value descending / position ascending. Log-log interpolation, power-law tail below the last knot. */
function positionFromKnots(K, value, tail) {
  if (value >= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (value >= K[i][0]) {
    const [v0, p0] = K[i - 1], [v1, p1] = K[i], t = Math.log10(v0 / value) / Math.log10(v0 / v1);
    return Math.pow(10, Math.log10(p0) + t * (Math.log10(p1) - Math.log10(p0)));
  }
  const [vl, pl] = K[K.length - 1];
  return pl * Math.pow(vl / value, tail || 1);
}

/**
 * Estimated position of a value on the stat's leaderboard (like Sk1er's "Position"), or null for fixed-scale anchors.
 *   empirical : knots measured from the real Nadeshiko board
 *   power     : hand-set curve from the tuner, position = (#1 / value)^k
 *   template  : stats with no board borrow the pooled median curve of all real boards, as a function of value / #1
 */
function statPosition(value, st, cfg = config) {
  if (!(value > 0)) return null;
  const sc = st.scale || { type: 'template' };
  if (sc.type === 'anchors') return null;
  if (sc.type === 'empirical') return positionFromKnots(sc.knots, value, sc.tail);
  if (sc.type === 'power') return Math.max(1, Math.pow((st.ref || value) / value, sc.k));      // hand-set: position = (#1 / value)^k
  const x = Math.min(1, value / (st.ref || value));
  return positionFromKnots(cfg.meta.template, x, cfg.meta.templateTail);
}

/** Per-stat score 0..1. st.L = log10 of the (difficulty-adjusted) field size. */
function statScore(value, st, mode, cfg = config) {
  if (!(value > 0)) return 0;
  const sc = st.scale || { type: 'template' };
  if (sc.type === 'anchors') {
    const A = sc.anchors;
    if (value >= A[A.length - 1][0]) return A[A.length - 1][1];
    if (value <= A[0][0]) return A[0][1];
    for (let i = 1; i < A.length; i++) if (value <= A[i][0]) { const [x0, y0] = A[i - 1], [x1, y1] = A[i]; return y0 + ((value - x0) / (x1 - x0)) * (y1 - y0); }
  }
  const pos = statPosition(value, st, cfg);
  return clamp01(1 - Math.log10(Math.max(1, pos)) / (st.L || 5));
}

/**
 * Combine per-stat scores S = {statId: 0..1} into the total. Returns {total, G (per game, 0..1), eff (scores after caps), peak, breadth, network}.
 * gw = optional per-game multipliers (0 removes a game), used by the page's presets.
 */
function composite(S, cfg = config, gw = {}) {
  const P = cfg.meta.params, sts = enabled(cfg), eff = { ...S };
  // purchasable stats can't exceed what the non-purchasable ones support
  for (const s of sts) if (s.cappedBy && s.cappedBy.length) {
    const base = s.cappedBy.reduce((a, id) => a + (S[id] || 0), 0) / s.cappedBy.length;
    eff[s.id] = Math.min(S[s.id] || 0, base + (s.capMargin ?? 0.05));
  }
  // scoreGamma (global, or per game): s^gamma. >1 rewards only strong ranks, <1 is more forgiving of mid ranks
  const gam = Object.fromEntries(cfg.groups.map(g => [g.id, g.gamma ?? P.scoreGamma ?? 1]));
  const byG = {};
  for (const s of sts) (byG[s.group] = byG[s.group] || []).push({ u: Math.pow(eff[s.id] || 0, gam[s.group]), w: s.w ?? 1 });
  // game score = power mean of its stats. A "specialist" game (e.g. Arcade) works like the overall ranking: stats are sorted best first,
  // each next one counts spec.decay times less, and the single best stat gets a spec.peak bonus
  const G = {};
  for (const g of cfg.groups) {
    const act = (byG[g.id] || []).filter(x => x.w > 0);
    if (!act.length) continue;
    if (g.spec) act.sort((a, b) => b.u - a.u);
    let n = 0, d = 0;
    act.forEach((x, k) => { const w = g.spec ? x.w * Math.pow(g.spec.decay, k) : x.w; n += w * Math.pow(x.u, P.statMeanP); d += w; });
    const v = Math.pow(n / d, 1 / P.statMeanP);
    G[g.id] = g.spec ? g.spec.peak * act[0].u + (1 - g.spec.peak) * v : v;
  }
  // popularity: a game's weight (and its peak) is scaled by (field size / nRef)^popExponent, so niche games are worth less
  const pf = (g) => (g.kind === 'network' || !g.pop ? 1 : Math.pow(Math.min(1, g.pop / P.nRef), P.popExponent ?? 0));
  const gwOf = (g) => gw[g.id] ?? g.weight ?? 1;                       // page preset > tuned weight in the config > 1
  // gameCap / capSlope: a game score above gameCap counts only capSlope of the excess (0 = hard ceiling, 1 = no ceiling)
  const cap = P.gameCap ?? 1, slope = P.capSlope ?? 1, cnt = (x) => (x > cap ? cap + (x - cap) * slope : x);
  const games = cfg.groups.filter(g => g.kind !== 'network' && G[g.id] != null && gwOf(g) > 0)
    .map(g => ({ id: g.id, G: cnt(G[g.id]), w: gwOf(g), f: pf(g) })).sort((a, b) => b.G - a.G || b.w * b.f - a.w * a.f);   // ties (e.g. untouched games): heavier game takes the earlier slot
  let wsum = 0, acc = 0, peak = 0;
  games.forEach((g, k) => { const w = Math.pow(P.gameDecay, k) * g.w * g.f; wsum += w; acc += w * g.G; peak = Math.max(peak, g.G * g.f); });
  const breadth = wsum ? acc / wsum : 0;
  const gamesScore = P.peakShare * peak + (1 - P.peakShare) * breadth;
  const net = cfg.groups.find(g => g.kind === 'network');
  const netScore = net && G[net.id] ? G[net.id] : 0, netW = net ? gwOf(net) : 0;
  const wGames = games.length ? 1 - P.networkShare : 0, wNet = P.networkShare * netW;
  const raw = wGames + wNet ? ((wGames * gamesScore + wNet * netScore) / (wGames + wNet)) * cfg.meta.perfectScore : 0;
  // scoreFlatten: a universal, order-preserving squeeze of the final score: perfect * (raw / perfect)^(1 / flatten). 1 = off; higher shrinks the gaps between top players
  const total = P.scoreFlatten > 1 ? cfg.meta.perfectScore * Math.pow(raw / cfg.meta.perfectScore, 1 / P.scoreFlatten) : raw;
  return { total, G, eff, peak, breadth, network: netScore };
}

/** classic = linear vs #1 (kept for the old page option). */
function fraction(value, ref, mode = 'classic') {
  if (!ref || ref <= 0 || !(value > 0)) return 0;
  const f = Math.min(1, value / ref);
  const exp = typeof mode === 'number' ? mode : mode === 'balanced' ? 0.5 : 1;
  return exp === 1 ? f : Math.pow(f, exp);
}

/** Raise any reference a player beats (only matters for template stats and display). */
function ratchet(seedRefs, storedRefs, values) {
  const refs = {}, raised = {};
  for (const s of enabled()) {
    let r = Math.max(seedRefs[s.id] || 0, storedRefs?.[s.id] || 0);
    const v = values[s.id] || 0;
    if (v > r) r = v;
    refs[s.id] = r;
    if (r > Math.max(seedRefs[s.id] || 0, storedRefs?.[s.id] || 0)) raised[s.id] = r;
  }
  return { refs, raised };
}

function scorePlayer(values, refs, mode = 'smart', cfg = config, gw = {}) {
  const S = {}, sts = enabled(cfg);
  for (const s of sts) S[s.id] = statScore(values[s.id] || 0, { ...s, ref: refs[s.id] || s.ref }, mode, cfg);
  const c = composite(S, cfg, gw);
  const rows = sts.map(s => ({ id: s.id, label: s.label, group: s.group, points: s.points, value: values[s.id] || 0, ref: refs[s.id] || s.ref,
    fraction: c.eff[s.id], earned: c.eff[s.id] * s.points, estimate: !!s.estimate, verify: !!s.verify }));
  // game rows are shown out of 1000 (the game's own score), they are not parts of the total
  const groups = cfg.groups.filter(g => c.G[g.id] != null).map(g => ({ id: g.id, name: g.name, earned: c.G[g.id] * 1000, points: 1000 }));
  return { total: c.total, rows, groups, detail: c };
}

/** Short fingerprint of the enabled stat order: stored vectors are only valid while this matches. */
function configHash(cfg = config) {
  let h = 5381;
  for (const ch of enabled(cfg).map(s => s.id).join(',')) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return (h >>> 0).toString(36);
}

const seedRefs = () => Object.fromEntries(enabled().map(s => [s.id, s.ref]));
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

module.exports = { config, enabled, configHash, readPath, extractValues, fraction, statScore, statPosition, positionFromKnots, composite, ratchet, scorePlayer, seedRefs, round };
