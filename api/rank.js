// GET /api/rank?uuid=…|name=…   -> score breakdown for one player (and saves them to the ranking pool)
// GET /api/rank?meta=1          -> list of groups/stats (for the leaderboard picker)
// GET /api/rank?stat=total|<id>&limit=50&offset=0 -> leaderboard page
const lib = require('./_rank_lib');
const kv = require('./_kv');

const K = { refs: 'litstats:rank:refs', total: 'litstats:rank:total', players: 'litstats:rank:players', stat: (id) => `litstats:rank:stat:${id}` };
const playerCache = new Map();

async function safeFetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return JSON.parse(await res.text());
}
function getPlayerRank(player) {
  if (player.prefix) return player.prefix.replace(/§./g, '');
  if (player.rank && player.rank !== 'NORMAL') return player.rank;
  if (player.monthlyPackageRank && player.monthlyPackageRank !== 'NONE') return 'MVP++';
  const ranks = { MVP_PLUS: 'MVP+', MVP: 'MVP', VIP_PLUS: 'VIP+', VIP: 'VIP' };
  if (player.newPackageRank) return ranks[player.newPackageRank] || 'NON';
  if (player.packageRank) return ranks[player.packageRank] || 'NON';
  return 'NON';
}
const num = (x) => (x === null || x === undefined ? null : Number(x));

async function leaderboard(req, res) {
  const stat = String(req.query.stat);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = Math.max(0, parseInt(req.query.offset) || 0);
  if (stat !== 'total' && !lib.enabled().some(s => s.id === stat)) return res.status(400).json({ error: 'Unknown stat' });
  if (!kv.isConfigured()) return res.status(200).json({ stat, entries: [], size: 0, configured: false });

  const key = stat === 'total' ? K.total : K.stat(stat);
  const [flat, size] = await kv.pipeline([['ZREVRANGE', key, offset, offset + limit - 1, 'WITHSCORES'], ['ZCARD', key]]);
  const ids = [], scores = [];
  for (let i = 0; i < flat.length; i += 2) { ids.push(flat[i]); scores.push(Number(flat[i + 1])); }
  const recs = ids.length ? await kv.redis(['HMGET', K.players, ...ids]) : [];
  const entries = ids.map((uuid, i) => {
    let p = {}; try { p = JSON.parse(recs[i] || '{}'); } catch (e) {}
    return { uuid, username: p.u || uuid.slice(0, 8), rank: p.r, rankPlusColor: p.rp, monthlyRankColor: p.mr, value: scores[i], total: p.s ?? null };
  });
  return res.status(200).json({ stat, offset, size, configured: true, entries });
}

module.exports = async (req, res) => {
  const allowedOrigins = ['https://www.litstats.com', 'https://litstats.com', 'http://localhost:3000', 'http://127.0.0.1:3000'];
  const requestOrigin = req.headers.origin || req.headers.referer || '';
  const isAllowed = allowedOrigins.some(o => requestOrigin.startsWith(o));
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? requestOrigin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Content-Type, X-Litstats-Auth');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const secureToken = req.headers['x-litstats-auth'];
  const expectedToken = process.env.CLOUDFLARE_AUTH_TOKEN;
  const isLocalDev = !process.env.VERCEL_ENV || process.env.NODE_ENV === 'development';
  if (!isLocalDev && expectedToken) {
    if (secureToken && secureToken !== expectedToken) return res.status(403).json({ error: 'Access Denied: Invalid Auth Token' });
    if (requestOrigin && !isAllowed) return res.status(403).json({ error: 'Access Denied: Direct browser origin blocked.' });
  }

  try {
    if (req.query.meta) {
      return res.status(200).json({ perfectScore: lib.config.meta.perfectScore, groups: lib.config.groups,
        stats: lib.enabled().map(({ id, label, group, points }) => ({ id, label, group, points })) });
    }
    if (req.query.stat) return await leaderboard(req, res);

    let uuid = req.query.uuid;
    if (req.query.name && !uuid) {
      const m = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(req.query.name)}`);
      if (!m.ok) return res.status(404).json({ error: 'Player not found on Mojang' });
      uuid = (await m.json()).id;
    }
    if (!uuid) return res.status(400).json({ error: 'Missing UUID or Name' });
    uuid = String(uuid).replace(/-/g, '');
    if (!process.env.HYPIXEL_API_KEY) return res.status(500).json({ error: 'Server missing API Key' });

    let pData; const hit = playerCache.get(uuid);
    if (hit && Date.now() - hit.t < 45000) pData = hit.data;
    else {
      pData = await safeFetchJSON(`https://api.hypixel.net/v2/player?uuid=${uuid}`, { headers: { 'API-Key': process.env.HYPIXEL_API_KEY } });
      if (pData && pData.success && pData.player) {
        playerCache.set(uuid, { t: Date.now(), data: pData });
        if (playerCache.size > 100) playerCache.delete(playerCache.keys().next().value);
      }
    }
    if (pData.rateLimited) return res.status(429).json({ error: 'Hypixel rate limit reached. Try again shortly.' });
    if (!pData.success || !pData.player) return res.status(404).json({ error: 'Player not found on Hypixel' });
    const player = pData.player;

    // 1. values + references (references only ever go up)
    const values = lib.extractValues(player);
    const seed = lib.seedRefs();
    const stored = {};
    const useKv = kv.isConfigured();
    if (useKv) {
      try { const flat = await kv.redis(['HGETALL', K.refs]); for (let i = 0; i < (flat || []).length; i += 2) stored[flat[i]] = Number(flat[i + 1]); } catch (e) { console.warn('rank refs read failed:', e.message); }
    }
    const { refs, raised } = lib.ratchet(seed, stored, values);

    // 2. score (classic)
    const scored = lib.scorePlayer(values, refs, 'classic');
    const username = player.displayname || uuid.slice(0, 8);
    const rec = { u: username, r: getPlayerRank(player), rp: player.rankPlusColor || 'RED', mr: player.monthlyRankColor || 'GOLD', s: lib.round(scored.total, 2), t: Date.now() };

    // 3. save + read positions in one round trip
    let positions = null, poolSize = null, totalPos = null;
    if (useKv) {
      try {
        const cmds = [];
        if (Object.keys(raised).length) cmds.push(['HSET', K.refs, ...Object.entries(raised).flat()]);
        const writeCount = cmds.length;
        cmds.push(['HSET', K.players, uuid, JSON.stringify(rec)], ['ZADD', K.total, rec.s, uuid]);
        const stats = lib.enabled();
        for (const s of stats) cmds.push(values[s.id] > 0 ? ['ZADD', K.stat(s.id), values[s.id], uuid] : ['ZREM', K.stat(s.id), uuid]);
        const readStart = cmds.length;
        cmds.push(['ZCOUNT', K.total, `(${rec.s}`, '+inf'], ['ZCARD', K.total]);
        for (const s of stats) if (values[s.id] > 0) cmds.push(['ZCOUNT', K.stat(s.id), `(${values[s.id]}`, '+inf']);
        const out = await kv.pipeline(cmds);
        totalPos = Number(out[readStart]) + 1; poolSize = Number(out[readStart + 1]);
        positions = {}; let i = readStart + 2;
        for (const s of stats) if (values[s.id] > 0) positions[s.id] = Number(out[i++]) + 1;
        void writeCount;
      } catch (e) { console.warn('rank persist failed:', e.message); positions = null; }
    }

    return res.status(200).json({
      uuid, username, rank: rec.r, rankPlusColor: rec.rp, monthlyRankColor: rec.mr,
      total: rec.s, totalPosition: totalPos, poolSize, perfectScore: lib.config.meta.perfectScore,
      groups: scored.groups.map(g => ({ id: g.id, name: g.name, earned: lib.round(g.earned), points: g.points })),
      rows: scored.rows.map(r => ({ id: r.id, label: r.label, group: r.group, points: r.points, value: r.value, ref: r.ref,
        earned: lib.round(r.earned), position: positions ? positions[r.id] || null : null, estimate: r.estimate || undefined, verify: r.verify || undefined })),
      generated: Date.now(),
    });
  } catch (error) {
    console.error('rank api error:', error);
    return res.status(500).json({ error: `Failed to build ranking: ${error.message}` });
  }
};