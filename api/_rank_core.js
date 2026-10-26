/** Shared by api/rank.js and refresh-ranks.js: Hypixel fetching + building one stored record. No KV access in here. */
const lib = require('./_rank_lib');

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const SB_STATS = ['sb_level'];                       // stats fed by a second Hypixel call; kept from the old record if that call fails
const playerCache = new Map();

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'API-Key': process.env.HYPIXEL_API_KEY } });
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return JSON.parse(await res.text());
}
function getPlayerRank(p) {
  if (p.prefix) return p.prefix.replace(/§./g, '');
  if (p.rank && p.rank !== 'NORMAL') return p.rank;
  if (p.monthlyPackageRank && p.monthlyPackageRank !== 'NONE') return 'MVP++';
  const ranks = { MVP_PLUS: 'MVP+', MVP: 'MVP', VIP_PLUS: 'VIP+', VIP: 'VIP' };
  return ranks[p.newPackageRank] || ranks[p.packageRank] || 'NON';
}
async function fetchPlayer(uuid) {
  if (!process.env.HYPIXEL_API_KEY) throw new HttpError(500, 'Server missing API Key');
  const hit = playerCache.get(uuid);
  if (hit && Date.now() - hit.t < 45000) return hit.player;
  const d = await getJSON(`https://api.hypixel.net/v2/player?uuid=${uuid}`);
  if (d.rateLimited) throw new HttpError(429, 'Hypixel rate limit reached. Try again shortly.');
  if (!d.success || !d.player) throw new HttpError(404, 'Player not found on Hypixel');
  playerCache.set(uuid, { t: Date.now(), player: d.player });
  if (playerCache.size > 100) playerCache.delete(playerCache.keys().next().value);
  return d.player;
}
/** Best profile's leveling.experience: number | null (no profiles) | undefined (call failed: keep old value). */
async function fetchSkyblockExp(uuid) {
  try {
    const d = await getJSON(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${uuid}`);
    if (d.rateLimited || !d.success) return undefined;
    const xs = (d.profiles || []).map(p => p.members?.[uuid]?.leveling?.experience).filter(x => typeof x === 'number');
    return xs.length ? Math.max(...xs) : null;
  } catch (e) { return undefined; }
}
/** Values map from a stored record (valid when the record is a prefix of the current config order). */
const valuesOf = (rec) => Object.fromEntries(lib.enabled().map((s, i) => [s.id, (rec.v && rec.v[i]) || 0]));
const usable = (rec) => rec && Array.isArray(rec.v) && rec.v.length <= lib.enabled().length;

/** Score values against references. Returns the scored breakdown plus the references that were raised. */
function score(values, storedRefs) {
  const { refs, raised } = lib.ratchet(lib.seedRefs(), storedRefs || {}, values);
  return { scored: lib.scorePlayer(values, refs, 'smart'), refs, raised };
}
/** Fetch from Hypixel and build the record that gets stored. `old` is the previous record (or null). */
async function buildRecord(uuid, old, storedRefs) {
  const player = await fetchPlayer(uuid), sb = await fetchSkyblockExp(uuid), list = lib.enabled();
  if (typeof sb === 'number') player.__sbExp = sb;
  const values = lib.extractValues(player);
  if (sb === undefined && usable(old)) list.forEach((s, i) => { if (SB_STATS.includes(s.id) && i < old.v.length) values[s.id] = old.v[i]; });
  const out = score(values, storedRefs);
  const rec = { u: player.displayname || uuid.slice(0, 8), r: getPlayerRank(player), rp: player.rankPlusColor || 'RED', mr: player.monthlyRankColor || 'GOLD',
    s: lib.round(out.scored.total, 2), t: Date.now(), h: lib.configHash(), v: list.map(s => lib.round(values[s.id] || 0)) };
  return { rec, values, ...out };
}
module.exports = { HttpError, fetchPlayer, fetchSkyblockExp, getPlayerRank, valuesOf, usable, score, buildRecord };
