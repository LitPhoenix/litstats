// Shared, READ-ONLY lookup of what /ranking already stored in Redis: rank colours + guild tag (g = [tag, color, checkedAt]).
// 1 Redis command per call (HMGET for many players), memoised in memory. Never calls Hypixel, so it costs no guild requests.
// Any endpoint that returns a player can do:  await require('./_identity').withGuild(body, uuid)
const kv = require('./_kv');
const KEY = (process.env.RANK_PREFIX || 'litstats:rank') + ':players';
const TTL_MS = 10 * 60000;
const memo = new Map();                                   // uuid -> { t, v }  (v = identity | null, misses are cached too)
const clean = (u) => String(u || '').replace(/-/g, '').toLowerCase();

function shape(raw) {
  let r; try { r = JSON.parse(raw); } catch (e) { return null; }
  if (!r) return null;
  return { username: r.u, rank: r.r, rankPlusColor: r.rp, monthlyRankColor: r.mr, guildTag: r.g?.[0] || null, guildColor: r.g?.[1] || null };
}

/** { uuid: identity } for every uuid that has a record. */
async function getIdentities(uuids) {
  const ids = [...new Set((uuids || []).map(clean).filter(Boolean))], out = {}, miss = [], now = Date.now();
  for (const u of ids) { const h = memo.get(u); if (h && now - h.t < TTL_MS) { if (h.v) out[u] = h.v; } else miss.push(u); }
  if (miss.length && kv.isConfigured()) {
    try {
      const vals = await kv.redis(['HMGET', KEY, ...miss]);
      miss.forEach((u, i) => { const v = vals && vals[i] ? shape(vals[i]) : null; memo.set(u, { t: now, v }); if (v) out[u] = v; });
      while (memo.size > 5000) memo.delete(memo.keys().next().value);
    } catch (e) { console.warn('identity lookup failed:', e.message); }
  }
  return out;
}

/** Adds guildTag/guildColor to an API response body when Redis has one. Never throws, never waits more than 400 ms. */
async function withGuild(body, uuid) {
  try {
    const m = await Promise.race([getIdentities([uuid]), new Promise(r => setTimeout(() => r({}), 400))]);
    const i = m[clean(uuid)];
    if (i && i.guildTag) { body.guildTag = i.guildTag; body.guildColor = i.guildColor; }
  } catch (e) {}
  return body;
}
module.exports = { getIdentities, withGuild };
