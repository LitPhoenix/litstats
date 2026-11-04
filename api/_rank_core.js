/** Shared by api/rank.js and refresh-ranks.js: Hypixel fetching + building one stored record. No KV access in here. */
const lib = require('./_rank_lib');
const LilyWeight = require('lilyweight');
const { getLevelFromXP, getXpFromLevel } = require('lilyweight/lib/utils');

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const SB_STATS = ['sb_level', 'sb_lily'];                       // stats fed by a second Hypixel call; kept from the old record if that call fails
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
/* Lilyweight's own fetching uses the old API layout, so only its pure maths (getWeightRaw) is used, fed from the current /v2 profile layout.
   Order below is the one getWeightRaw expects. */
const LW_SKILLS = ['ENCHANTING', 'TAMING', 'ALCHEMY', 'MINING', 'FARMING', 'FORAGING', 'COMBAT', 'FISHING'];
const LW_ACH = ['skyblock_augmentation', 'skyblock_domesticator', 'skyblock_concoctor', 'skyblock_excavator', 'skyblock_harvester', 'skyblock_gatherer', 'skyblock_combat', 'skyblock_angler'];

/** The current API adds "total" (and an entrance "0" floor) to tier_completions, which makes lilyweight's maths return NaN.
 *  Only floors 1-7 with finite numbers are passed on. */
const cleanFloors = (o) => {
  const out = {};
  for (const [k, v] of Object.entries(o || {})) if (/^[1-7]$/.test(k) && Number.isFinite(v)) out[k] = v;
  return out;
};
const isFiniteWeight = (w) => !!w && Number.isFinite(w.total);

function lilyOf(m, player, full) {
  const xo = m.player_data?.experience || {};
  let xp = LW_SKILLS.map(s => xo['SKILL_' + s] ?? m['experience_skill_' + s.toLowerCase()]), lv;
  if (xp.every(x => typeof x !== 'number')) { lv = LW_ACH.map(a => player?.achievements?.[a] ?? 0); xp = lv.map(getXpFromLevel); }   // skill API off: achievements, like lilyweight does
  else { xp = xp.map(x => x || 0); lv = xp.map(getLevelFromXP); }
  const sl = m.slayer?.slayer_bosses || m.slayer_bosses || {}, dt = m.dungeons?.dungeon_types || {};
  const slayers = ['zombie', 'spider', 'wolf', 'enderman', 'blaze'].map(b => sl[b]?.xp ?? 0);
  const cataXp = Number.isFinite(dt.catacombs?.experience) ? dt.catacombs.experience : 0;
  const run = (normal, master) => LilyWeight.getWeightRaw(lv, xp, normal, master, cataXp, slayers);

  let w = run(cleanFloors(dt.catacombs?.tier_completions), cleanFloors(dt.master_catacombs?.tier_completions));
  if (!isFiniteWeight(w)) {
    // Safety net: never lose the whole profile because of the floor data. Skills, dungeon XP and slayers still count.
    console.warn('lily: non-finite weight with cleaned floors, retrying without floor completions');
    w = run({}, {});
  }
  return full ? w : w.total;   // full = the whole breakdown (see debug-lily.js)
}
/** One profiles call -> { exp: best leveling.experience, lily: best Lily weight } (each number | null = no profiles) | undefined = call failed: keep old values. */
async function fetchSkyblock(uuid, player) {
  try {
    const d = await getJSON(`https://api.hypixel.net/v2/skyblock/profiles?uuid=${uuid}`);
    if (d.rateLimited || !d.success) return undefined;
    const ms = (d.profiles || []).map(p => p.members?.[uuid]).filter(Boolean);
    const xs = ms.map(m => m.leveling?.experience).filter(x => typeof x === 'number');
    const ls = ms.map(m => {
      try {
        const v = lilyOf(m, player);
        if (!Number.isFinite(v)) console.warn('lily NaN for', uuid);
        return v;
      } catch (e) { console.warn('lily error for', uuid, e.message); return NaN; }
    }).filter(Number.isFinite);
    return { exp: xs.length ? Math.max(...xs) : null, lily: ls.length ? Math.max(...ls) : null };
  } catch (e) { return undefined; }
}
/* Guild tag. One extra Hypixel call, so it is cached inside the player record as g = [tag, color, checkedAt] ([null, null, t] = no guild, cached too).
   It is only re-fetched when the record is looked up again after RANK_GUILD_TTL_H hours (default 72). */
const GUILD_TTL_MS = (parseInt(process.env.RANK_GUILD_TTL_H) || 72) * 3600000;
/** [tag, color, checkedAt] | undefined when the call failed (keep the old value; it is retried on the next lookup). */
async function fetchGuild(uuid) {
  try {
    const d = await getJSON(`https://api.hypixel.net/v2/guild?player=${uuid}`);
    if (d.rateLimited || !d.success) return undefined;
    const g = d.guild;
    return [g?.tag || null, g?.tag ? (g.tagColor || 'GRAY') : null, Date.now()];
  } catch (e) { return undefined; }
}
const guildFresh = (rec) => Array.isArray(rec?.g) && Date.now() - rec.g[2] < GUILD_TTL_MS;

/** Put the skyblock numbers where the @derived paths read them. */
const applySkyblock = (player, sb) => { if (!sb) return; if (typeof sb.exp === 'number') player.__sbExp = sb.exp; if (typeof sb.lily === 'number') player.lilyWeight = sb.lily; };
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
  const player = await fetchPlayer(uuid), sb = await fetchSkyblock(uuid, player), list = lib.enabled();
  const g = guildFresh(old) ? old.g : ((await fetchGuild(uuid)) ?? old?.g);       // reuse inside the TTL; a failed call keeps the old tag
  applySkyblock(player, sb);
  const values = lib.extractValues(player);
  if (sb === undefined && usable(old) && old.h === lib.configHash()) list.forEach((s, i) => { if (SB_STATS.includes(s.id) && i < old.v.length) values[s.id] = old.v[i]; });
  const out = score(values, storedRefs);
  const rec = { u: player.displayname || uuid.slice(0, 8), r: getPlayerRank(player), rp: player.rankPlusColor || 'RED', mr: player.monthlyRankColor || 'GOLD',
    s: lib.round(out.scored.total, 2), t: Date.now(), h: lib.configHash(), v: list.map(s => lib.round(values[s.id] || 0)) };
  if (g) rec.g = g;
  if (sb === undefined) rec.f = 1;                    // skyblock call failed: flag it so the cooldown does not keep the gap for hours
  return { rec, values, ...out };
}
module.exports = { HttpError, fetchGuild, guildFresh, lilyOf, fetchPlayer, fetchSkyblock, applySkyblock, getPlayerRank, valuesOf, usable, score, buildRecord };
