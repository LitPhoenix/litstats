// GET /api/rank?uuid=…|name=…              -> score breakdown for one player (saved to the pool)
// GET /api/rank?meta=1                     -> groups/stats config
// GET /api/rank?pool=1&limit=2000          -> every stored player's values (tuner)
// GET /api/rank?stat=total|<id>&limit&offset -> leaderboard page (built from the pool snapshot)
// GET /api/rank?inspect=1&name=…           -> raw API values + path alternatives (needs the auth token on prod)
//
// Storage model (kept deliberately small, Upstash bills per command):
//   litstats:rank:players  hash  uuid -> {u,r,rp,mr,s,t,h,v[]}   one record per player, everything in it
//   litstats:rank:total    zset  uuid -> total                    only for "your position"
//   litstats:rank:refs     hash  statId -> #1 reference
// Per-stat sorted sets are gone: stat leaderboards and the tuner are computed from one cached read of the players hash.
const lib = require('./_rank_lib');
const kv = require('./_kv');
const core = require('./_rank_core');

const K = { refs: 'litstats:rank:refs', total: 'litstats:rank:total', players: 'litstats:rank:players' };
const COOLDOWN_MS = (parseInt(process.env.RANK_COOLDOWN_MIN) || 360) * 60000;   // re-lookup of a player inside this window: no Hypixel call, no writes
const POOL_TTL_MS = (parseInt(process.env.RANK_POOL_TTL_MIN) || 30) * 60000;     // in-memory snapshot of the whole pool per server instance
const RESP_TTL_MS = 10 * 60000;                                                  // identical lookups answered from memory: 0 commands
const memo = { pool: { t: 0, map: null, refs: {} }, resp: new Map(), names: new Map() };

async function getPool() {
  if (memo.pool.map && Date.now() - memo.pool.t < POOL_TTL_MS) return memo.pool;
  const [pf, rf] = await kv.pipeline([['HGETALL', K.players], ['HGETALL', K.refs]]);      // 2 commands for the whole pool
  const map = new Map(), refs = {};
  for (let i = 0; i < (pf || []).length; i += 2) { try { map.set(pf[i], JSON.parse(pf[i + 1])); } catch (e) {} }
  for (let i = 0; i < (rf || []).length; i += 2) refs[rf[i]] = Number(rf[i + 1]);
  const sr = { ...lib.seedRefs(), ...refs }, h = lib.configHash();      // totals follow the CURRENT config: no refresh-ranks needed after tuning
  for (const [, r] of map) if (r && Array.isArray(r.v) && r.h === h && core.usable(r)) { try { r.s = lib.round(lib.scorePlayer(core.valuesOf(r), sr).total, 2); } catch (e) {} }
  memo.pool = { t: Date.now(), map, refs };
  return memo.pool;
}
const validPlayers = (P) => { const h = lib.configHash(), n = lib.enabled().length; return [...P.map].filter(([, r]) => r && Array.isArray(r.v) && r.h === h && r.v.length === n); };
const CDN_POOL = 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600';

async function leaderboard(req, res) {
  const stat = String(req.query.stat), list = lib.enabled();
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50)), offset = Math.max(0, parseInt(req.query.offset) || 0);
  const idx = list.findIndex(s => s.id === stat);
  if (stat !== 'total' && idx < 0) return res.status(400).json({ error: 'Unknown stat' });
  if (!kv.isConfigured()) return res.status(200).json({ stat, entries: [], size: 0, configured: false });
  const rows = validPlayers(await getPool()).map(([uuid, r]) => ({ uuid, r, value: idx < 0 ? r.s : r.v[idx] })).filter(x => x.value > 0).sort((a, b) => b.value - a.value);
  res.setHeader('Cache-Control', CDN_POOL);
  return res.status(200).json({ stat, offset, size: rows.length, configured: true, entries: rows.slice(offset, offset + limit).map(({ uuid, r, value }) =>
    ({ uuid, username: r.u || uuid.slice(0, 8), rank: r.r, rankPlusColor: r.rp, monthlyRankColor: r.mr, value, total: r.s ?? null })) });
}
async function pool(req, res) {
  const limit = Math.min(3000, Math.max(1, parseInt(req.query.limit) || 2000));
  if (!kv.isConfigured()) return res.status(200).json({ configured: false, players: [], size: 0 });
  const P = await getPool(), ok = validPlayers(P).sort((a, b) => b[1].s - a[1].s).slice(0, limit);
  const refs = lib.seedRefs(); for (const k in P.refs) refs[k] = Math.max(refs[k] || 0, P.refs[k]);
  res.setHeader('Cache-Control', CDN_POOL);
  return res.status(200).json({ configured: true, h: lib.configHash(), ids: lib.enabled().map(x => x.id), refs, size: P.map.size, returned: ok.length, stale: P.map.size - validPlayers(P).length,
    players: ok.map(([uuid, r]) => [uuid, r.u, r.r, r.rp, r.mr, r.v]) });
}
async function resolveUuid(req) {
  let uuid = req.query.uuid;
  if (req.query.name && !uuid) {
    const key = String(req.query.name).toLowerCase(), hit = memo.names.get(key);
    if (hit && Date.now() - hit.t < 3600000) uuid = hit.uuid;
    else {
      const m = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(req.query.name)}`);
      if (!m.ok) throw new core.HttpError(404, 'Player not found on Mojang');
      uuid = (await m.json()).id; memo.names.set(key, { t: Date.now(), uuid });
      if (memo.names.size > 500) memo.names.delete(memo.names.keys().next().value);
    }
  }
  if (!uuid) throw new core.HttpError(400, 'Missing UUID or Name');
  return String(uuid).replace(/-/g, '');
}

module.exports = async (req, res) => {
  const allowedOrigins = ['https://www.litstats.com', 'https://litstats.com', 'http://localhost:3000', 'http://127.0.0.1:3000'];
  const requestOrigin = req.headers.origin || req.headers.referer || '';
  const isAllowed = allowedOrigins.some(o => requestOrigin.startsWith(o));
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? requestOrigin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Content-Type, X-Litstats-Auth');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=3600');   // identical player lookups are served by the CDN
  if (req.method === 'OPTIONS') return res.status(200).end();

  const secureToken = req.headers['x-litstats-auth'], expectedToken = process.env.CLOUDFLARE_AUTH_TOKEN;
  const isLocalDev = !process.env.VERCEL_ENV || process.env.NODE_ENV === 'development';
  if (!isLocalDev && expectedToken) {
    if (secureToken && secureToken !== expectedToken) return res.status(403).json({ error: 'Access Denied: Invalid Auth Token' });
    if (requestOrigin && !isAllowed) return res.status(403).json({ error: 'Access Denied: Direct browser origin blocked.' });
  }

  try {
    if (req.query.meta) {
      res.setHeader('Cache-Control', CDN_POOL);
      return res.status(200).json({ perfectScore: lib.config.meta.perfectScore, groups: lib.config.groups,
        population: lib.config.meta.population, params: lib.config.meta.params, template: lib.config.meta.template, templateTail: lib.config.meta.templateTail,
        stats: lib.enabled().map(({ id, label, group, points, icon, estimate, verify, scale, ref, population, L, w, wBase, unb, emp, popNat, cappedBy, capMargin }) => ({ id, label, group, points, icon, estimate, verify, scale, ref, population, L, w, wBase, unb, emp, popNat, cappedBy, capMargin })) });
    }
    if (req.query.pool) return await pool(req, res);
    if (req.query.stat) return await leaderboard(req, res);

    const uuid = await resolveUuid(req), statList = lib.enabled(), useKv = kv.isConfigured();

    if (req.query.inspect) {                                           // admin: no KV access
      if (!isLocalDev && secureToken !== expectedToken) return res.status(403).json({ error: 'inspect needs the auth token' });
      const player = await core.fetchPlayer(uuid), sb = await core.fetchSkyblockExp(uuid);
      if (typeof sb === 'number') player.__sbExp = sb;
      const values = lib.extractValues(player);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ uuid, username: player.displayname, skyblockExp: sb ?? null,
        stats: statList.map(st => ({ id: st.id, label: st.label, group: st.group, path: st.path, value: values[st.id], alts: lib.probe(player, st.path) })), raw: player });
    }

    const hit = memo.resp.get(uuid);
    if (hit && Date.now() - hit.t < RESP_TTL_MS) return res.status(200).json(hit.out);       // 0 commands

    // 1 command: the previous record. Within the cooldown it is reused as is (no Hypixel call, no writes).
    let old = null;
    if (useKv) { try { const raw = await kv.redis(['HGET', K.players, uuid]); old = raw ? JSON.parse(raw) : null; } catch (e) {} }
    let storedRefs = memo.pool.refs;
    if (useKv && !memo.pool.map) { try { const f = await kv.redis(['HGETALL', K.refs]); storedRefs = {}; for (let i = 0; i < (f || []).length; i += 2) storedRefs[f[i]] = Number(f[i + 1]); memo.pool.refs = storedRefs; } catch (e) {} }

    const fresh = old && old.h === lib.configHash() && old.v?.length === statList.length && Date.now() - old.t < COOLDOWN_MS && !req.query.force;
    let rec, scored, raised = {}, cached = !!fresh;
    if (fresh) { ({ scored } = core.score(core.valuesOf(old), storedRefs)); rec = { ...old, s: lib.round(scored.total, 2) }; }
    else { ({ rec, scored, raised } = await core.buildRecord(uuid, old, storedRefs)); }

    // writes only when something was fetched: 1 record + 1 total (+ references, rarely); reads: position + pool size
    let totalPos = null, poolSize = null;
    if (useKv) {
      try {
        const cmds = [];
        if (!cached) {
          if (Object.keys(raised).length) { cmds.push(['HSET', K.refs, ...Object.entries(raised).flat()]); Object.assign(memo.pool.refs, raised); }
          cmds.push(['HSET', K.players, uuid, JSON.stringify(rec)], ['ZADD', K.total, rec.s, uuid]);
          if (memo.pool.map) memo.pool.map.set(uuid, rec);
        }
        await kv.pipeline(cmds);
        const P = await getPool(); P.map.set(uuid, rec);                 // position is computed from the pool with current scores
        const ss = validPlayers(P).map(([, x]) => x.s);
        totalPos = ss.filter(x => x > rec.s).length + 1; poolSize = ss.length;
      } catch (e) { console.warn('rank persist failed:', e.message); }
    }

    const body = {
      uuid, username: rec.u, rank: rec.r, rankPlusColor: rec.rp, monthlyRankColor: rec.mr, cached,
      total: rec.s, totalPosition: totalPos, poolSize, perfectScore: lib.config.meta.perfectScore,
      groups: scored.groups.map(g => ({ id: g.id, name: g.name, earned: lib.round(g.earned), points: g.points })),
      rows: scored.rows.map(r => ({ id: r.id, label: r.label, group: r.group, points: r.points, value: r.value, ref: r.ref,
        icon: (lib.config.stats.find(x => x.id === r.id) || {}).icon, earned: lib.round(r.earned), position: null, estimate: r.estimate || undefined })),
      generated: Date.now(),
    };
    memo.resp.set(uuid, { t: Date.now(), out: body });
    if (memo.resp.size > 200) memo.resp.delete(memo.resp.keys().next().value);
    return res.status(200).json(body);
  } catch (error) {
    if (error instanceof core.HttpError) return res.status(error.status).json({ error: error.message });
    console.error('rank api error:', error);
    return res.status(500).json({ error: `Failed to build ranking: ${error.message}` });
  }
};
