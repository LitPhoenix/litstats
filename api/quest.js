// GET /api/quest?uuid=...  (or ?name=...)  -> a lean quest payload for questing.html.
// Lighter than /api/player (no raw achievement/stat dumps) and cached for less time, so progress feels live.
// If _quest_lib.js is missing from the deploy, answer with a readable JSON error instead of crashing the function.
let buildQuestResponse = null, libError = null;
try { ({ buildQuestResponse } = require('./_quest_lib')); } catch (e) { libError = e.message; }

let defsCache = null, defsTime = 0, gamesCache = null, gamesTime = 0;

async function safeFetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { throw new Error('API returned invalid JSON'); }
}

// Same rank logic as player.js so the name colours match everywhere.
function getPlayerRank(player) {
  if (player.prefix) return player.prefix.replace(/§./g, '');
  if (player.rank && player.rank !== 'NORMAL') return player.rank;
  if (player.monthlyPackageRank && player.monthlyPackageRank !== 'NONE') return 'MVP++';
  const ranks = { MVP_PLUS: 'MVP+', MVP: 'MVP', VIP_PLUS: 'VIP+', VIP: 'VIP' };
  if (player.newPackageRank) return ranks[player.newPackageRank] || 'NON';
  if (player.packageRank) return ranks[player.packageRank] || 'NON';
  return 'NON';
}

module.exports = async (req, res) => {
  const allowedOrigins = ['https://www.litstats.com', 'https://litstats.com', 'http://localhost:3000', 'http://127.0.0.1:3000'];
  const requestOrigin = req.headers.origin || req.headers.referer || '';
  const isAllowed = allowedOrigins.some(origin => requestOrigin.startsWith(origin));

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', isAllowed ? requestOrigin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Litstats-Auth');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const secureToken = req.headers['x-litstats-auth'];
  const expectedToken = process.env.CLOUDFLARE_AUTH_TOKEN;
  const isLocalDev = !process.env.VERCEL_ENV || process.env.NODE_ENV === 'development';
  if (!isLocalDev && expectedToken) {
    if (secureToken && secureToken !== expectedToken) return res.status(403).json({ error: 'Access Denied: Invalid Auth Token' });
    if (requestOrigin && !isAllowed) return res.status(403).json({ error: 'Access Denied: Direct browser origin blocked.' });
  }

  if (!buildQuestResponse) return res.status(500).json({ error: `Quest library failed to load: ${libError}` });

  const { uuid, name } = req.query;
  let targetUuid = uuid;
  if (name && !uuid) {
    try {
      const m = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`);
      if (!m.ok) return res.status(404).json({ error: 'Player not found on Mojang' });
      targetUuid = (await m.json()).id;
    } catch (e) { return res.status(500).json({ error: 'Mojang API error' }); }
  }
  if (!targetUuid) return res.status(400).json({ error: 'Missing UUID or Name' });

  const API_KEY = process.env.HYPIXEL_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'Server missing API Key' });

  try {
    // Definitions change rarely: cache for an hour per warm instance
    if (!defsCache || Date.now() - defsTime > 3600000) {
      const d = await safeFetchJSON('https://api.hypixel.net/v2/resources/quests');
      if (d && d.success) { defsCache = d; defsTime = Date.now(); }
    }
    if (!gamesCache || Date.now() - gamesTime > 86400000) {
      try {
        const g = await safeFetchJSON('https://api.hypixel.net/v2/resources/games');
        if (g && g.success) { gamesCache = g; gamesTime = Date.now(); }
      } catch (e) { /* retired flags are optional */ }
    }
    if (!defsCache) return res.status(502).json({ error: 'Quest definitions unavailable' });

    const pData = await safeFetchJSON(`https://api.hypixel.net/v2/player?uuid=${targetUuid}`, { headers: { 'API-Key': API_KEY } });
    if (pData.rateLimited) return res.status(429).json({ error: 'Hypixel rate limit reached. Try again shortly.' });
    if (!pData.success || !pData.player) return res.status(404).json({ error: 'Player not found on Hypixel' });

    // ?debug=<questId> returns the raw definition + this player's raw entry, for checking field names / reset times
    if (req.query.debug) {
      const id = String(req.query.debug);
      const def = Object.values(defsCache.quests || {}).flat().find(x => x.id === id) || null;
      const raw = (pData.player.quests || {})[id] || null;
      const iso = ms => new Date(ms).toISOString();
      return res.status(200).json({ id, def, player: raw && { ...raw, completions: (raw.completions || []).slice(-8).map(c => ({ ...c, iso: iso(c.time) })) },
        now: iso(Date.now()), sampleKeys: Object.keys(pData.player.quests || {}).slice(0, 12) });
    }
    const body = buildQuestResponse(pData.player, defsCache, gamesCache, { history: req.query.history === '1' });
    body.uuid = pData.player.uuid || targetUuid;
    body.rank = getPlayerRank(pData.player);
    body.rankPlusColor = pData.player.rankPlusColor || 'RED';
    body.monthlyRankColor = pData.player.monthlyRankColor || 'GOLD';
    return res.status(200).json(body);
  } catch (error) {
    console.error('quest api error:', error);
    return res.status(500).json({ error: `Failed to load quest data: ${error.message}` });
  }
};
