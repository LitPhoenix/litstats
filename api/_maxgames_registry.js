/**
 * Shared max-games list for players found by live lookups (the part a GitHub Action can't see).
 * Stored in a Redis hash on Upstash (Vercel Marketplace). Dependency free: talks to the REST API with fetch.
 *
 * Env (either naming works):
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN   or   KV_REST_API_URL / KV_REST_API_TOKEN
 *
 * The leading underscore stops Vercel exposing this file as an endpoint.
 */
const KEY = 'litstats:maxgames:players';

// Housing is intentionally absent (too easy). Max Seasonal is derived from the four parts.
const TRACKED = new Set([
  'Max UHC', 'Max Pit', 'Max Mega Walls', 'Max SkyWars', 'Max Blitz',
  'Max Smash Heroes', 'Max Bed Wars', 'Max Cops and Crims', 'Max Quake', 'Max Paintball', 'Max Arena Brawl',
  'Max SkyBlock', 'Max Speed UHC', 'Max Warlords', 'Max Walls', 'Max TNT Games', 'Max Arcade',
  'Max Murder Mystery', 'Max VampireZ', 'Max TKR', 'Max Wool Games', 'Max Duels', 'Max Build Battle',
  'Max General', 'Max Summer', 'Max Christmas', 'Max Easter', 'Max Halloween', 'Max Crazy Walls', 'Max SkyClash',
]);

const endpoint = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const isConfigured = () => !!(endpoint() && token());

async function redis(command) {
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || `Redis HTTP ${res.status}`);
  return json.result;
}

/** Pure: build the stored record. Badges the player still has keep their original firstSeen. */
function buildRecord(prev, player, badges, now) {
  const games = {};
  for (const b of badges) games[b] = prev?.games?.[b] || now;
  return {
    username: player.username,
    rank: player.rank,
    rankPlusColor: player.rankPlusColor,
    monthlyRankColor: player.monthlyRankColor,
    ap: player.achievementPoints || 0,
    games,
    updated: now,
  };
}

const sameGames = (a, b) => { const x = Object.keys(a || {}).sort().join('|'), y = Object.keys(b || {}).sort().join('|'); return x === y; };

async function registerPlayer(player) {
  if (!isConfigured() || !player?.uuid) return { skipped: true };
  const field = String(player.uuid).replace(/-/g, '');
  const badges = (player.maxGames || []).filter(b => TRACKED.has(b));

  const prevRaw = await redis(['HGET', KEY, field]);
  const prev = prevRaw ? JSON.parse(prevRaw) : null;

  if (!badges.length) {
    if (prev) await redis(['HDEL', KEY, field]);
    return { removed: !!prev };
  }
  const record = buildRecord(prev, player, badges, new Date().toISOString());
  if (prev && sameGames(prev.games, record.games) && prev.rank === record.rank && prev.username === record.username) {
    return { unchanged: true };
  }
  await redis(['HSET', KEY, field, JSON.stringify(record)]);
  return { saved: true };
}

async function listPlayers() {
  if (!isConfigured()) return { configured: false, players: {} };
  const flat = (await redis(['HGETALL', KEY])) || [];
  const players = {};
  for (let i = 0; i < flat.length; i += 2) {
    try { players[flat[i]] = JSON.parse(flat[i + 1]); } catch (e) { /* skip bad record */ }
  }
  return { configured: true, players };
}

module.exports = { registerPlayer, listPlayers, buildRecord, TRACKED };