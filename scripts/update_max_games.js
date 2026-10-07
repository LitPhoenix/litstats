/**
 * update_max_games.js
 *
 * Maintains max_games_data.json: the shared, server-side list of who has maxed each game.
 *
 * Runs right after update_leaderboard.js in the same GitHub Action, so it needs no extra
 * Hypixel player calls. It reads the per-player `maxGames` badges that update_leaderboard.js
 * already wrote into ap_hunters_data.json.
 *
 * Rules it enforces:
 *  1. A player is added to a game's list the first time they are seen with that badge.
 *     `firstSeen` is kept forever, so earlier discoveries are listed first.
 *  2. Every game gets a signature (hash of its non-legacy achievements + tiers + points)
 *     from https://api.hypixel.net/v2/resources/achievements. If the signature changes
 *     (achievements added/removed/re-pointed), the game's list is wiped to 0. Players
 *     re-enter on later runs once the player data shows them maxed against the new definition.
 *  3. If the achievements endpoint can't be reached, signatures are left untouched.
 *     A network blip never wipes a list.
 *  4. "Seasonal" is derived: someone is on it only if they are on all four sub-lists
 *     (Summer, Christmas, Easter, Halloween).
 *
 *  5. Players found by live lookups (stored in KV by /api/player) are folded in when MAXGAMES_API_URL is set,
 *     keeping the firstSeen the API recorded.
 *
 * Env:
 *   ACH_RESOURCES_FILE   path to a saved resources JSON (for tests / offline seeding)
 *   MAXGAMES_API_URL     e.g. https://www.litstats.com/api/maxgames   (optional)
 *   MAXGAMES_LIVE_FILE   path to a saved copy of that response (tests)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SRC_FILE = path.join(ROOT, 'ap_hunters_data.json');
const OUT_FILE = path.join(ROOT, 'max_games_data.json');
const RESOURCES_URL = 'https://api.hypixel.net/v2/resources/achievements';

// Tiers: 1st is the hardest, 4th the easiest (the cabinet chart uses the opposite numbering).
// `internal` is the key in the Hypixel resources response, `badge` is what maxGames contains.
const CATALOG = [
  { id: 'uhc',           internal: 'uhc',           name: 'UHC',            badge: 'Max UHC',            tier: '1st' },
  { id: 'pit',           internal: 'pit',           name: 'Pit',            badge: 'Max Pit',            tier: '1st' },
  { id: 'megawalls',     internal: 'walls3',        name: 'Mega Walls',     badge: 'Max Mega Walls',     tier: '1st' },
  { id: 'skywars',       internal: 'skywars',       name: 'SkyWars',        badge: 'Max SkyWars',        tier: '1st' },
  { id: 'blitz',         internal: 'blitz',         name: 'Blitz',          badge: 'Max Blitz',          tier: '1st' },

  { id: 'smashheroes',   internal: 'supersmash',    name: 'Smash Heroes',   badge: 'Max Smash Heroes',   tier: '2nd' },
  { id: 'bedwars',       internal: 'bedwars',       name: 'Bed Wars',       badge: 'Max Bed Wars',       tier: '2nd' },
  { id: 'copsandcrims',  internal: 'copsandcrims',  name: 'Cops and Crims', badge: 'Max Cops and Crims', tier: '2nd' },
  { id: 'quake',         internal: 'quake',         name: 'Quake',          badge: 'Max Quake',          tier: '2nd' },
  { id: 'paintball',     internal: 'paintball',     name: 'Paintball',      badge: 'Max Paintball',      tier: '2nd' },
  { id: 'arenabrawl',    internal: 'arena',         name: 'Arena Brawl',    badge: 'Max Arena Brawl',    tier: '2nd' },

  { id: 'skyblock',      internal: 'skyblock',      name: 'SkyBlock',       badge: 'Max SkyBlock',       tier: '3rd' },
  { id: 'speeduhc',      internal: 'speeduhc',      name: 'Speed UHC',      badge: 'Max Speed UHC',      tier: '3rd' },
  { id: 'warlords',      internal: 'warlords',      name: 'Warlords',       badge: 'Max Warlords',       tier: '3rd' },
  { id: 'walls',         internal: 'walls',         name: 'Walls',          badge: 'Max Walls',          tier: '3rd' },
  { id: 'tntgames',      internal: 'tntgames',      name: 'TNT Games',      badge: 'Max TNT Games',      tier: '3rd' },
  { id: 'arcade',        internal: 'arcade',        name: 'Arcade',         badge: 'Max Arcade',         tier: '3rd' },

  { id: 'murdermystery', internal: 'murdermystery', name: 'Murder Mystery', badge: 'Max Murder Mystery', tier: '4th' },
  { id: 'vampirez',      internal: 'vampirez',      name: 'VampireZ',       badge: 'Max VampireZ',       tier: '4th' },
  { id: 'tkr',           internal: 'gingerbread',   name: 'TKR',            badge: 'Max TKR',            tier: '4th' },
  { id: 'woolgames',     internal: 'woolgames',     name: 'Wool Games',     badge: 'Max Wool Games',     tier: '4th' },
  { id: 'duels',         internal: 'duels',         name: 'Duels',          badge: 'Max Duels',          tier: '4th' },
  { id: 'buildbattle',   internal: 'buildbattle',   name: 'Build Battle',   badge: 'Max Build Battle',   tier: '4th' },

  // Extra: the time limited games plus General. "seasonal" is derived from the four parts below.
  // Housing is deliberately NOT tracked: it is easy enough that hundreds of players have it maxed.
  { id: 'seasonal',      internal: null,            name: 'Seasonal',       badge: 'Max Seasonal',       tier: 'extra', derived: true },
  { id: 'crazywalls',    internal: 'truecombat',    name: 'Crazy Walls',    badge: 'Max Crazy Walls',    tier: 'extra', includeLegacy: true },
  { id: 'skyclash',      internal: 'skyclash',      name: 'SkyClash',       badge: 'Max SkyClash',       tier: 'extra', includeLegacy: true },
  { id: 'general',       internal: 'general',       name: 'General',        badge: 'Max General',        tier: 'extra' },

  { id: 'summer',        internal: 'summer',        name: 'Summer',         badge: 'Max Summer',         tier: 'seasonal-part', parent: 'seasonal' },
  { id: 'christmas',     internal: 'christmas2017', name: 'Christmas',      badge: 'Max Christmas',      tier: 'seasonal-part', parent: 'seasonal' },
  { id: 'easter',        internal: 'easter',        name: 'Easter',         badge: 'Max Easter',         tier: 'seasonal-part', parent: 'seasonal' },
  { id: 'halloween',     internal: 'halloween2017', name: 'Halloween',      badge: 'Max Halloween',      tier: 'seasonal-part', parent: 'seasonal' },
];

const SEASONAL_PARTS = CATALOG.filter(g => g.parent === 'seasonal').map(g => g.id);
const BADGE_TO_ID = Object.fromEntries(CATALOG.filter(g => !g.derived).map(g => [g.badge, g.id]));

const sha = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);
const readJson = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; } };

/**
 * Same definition of "possible" as update_leaderboard.js / player.js: non-legacy one-time achievements
 * + every non-legacy tier. Crazy Walls and SkyClash (includeLegacy) count legacy ones too, exactly like
 * the isLegacyGame flag in update_leaderboard.js.
 */
function gameSignature(tGame, includeLegacy = false) {
  const parts = [];
  for (const [key, ach] of Object.entries(tGame.one_time || {})) {
    if (ach.legacy && !includeLegacy) continue;
    parts.push(`o:${key.toLowerCase()}:${ach.points}`);
  }
  for (const [key, ach] of Object.entries(tGame.tiered || {})) {
    if (ach.legacy && !includeLegacy) continue;
    (ach.tiers || []).forEach((t, i) => parts.push(`t:${key.toLowerCase()}:${t.tier || i + 1}:${t.amount}:${t.points}`));
  }
  parts.sort();
  return sha(parts.join('|'));
}

async function loadResources() {
  try {
    if (process.env.ACH_RESOURCES_FILE) {
      return JSON.parse(fs.readFileSync(process.env.ACH_RESOURCES_FILE, 'utf8')).achievements;
    }
    const doFetch = globalThis.fetch || require('node-fetch');
    const res = await doFetch(RESOURCES_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success || !json.achievements) throw new Error('bad payload');
    return json.achievements;
  } catch (e) {
    console.warn(`[max-games] Could not load achievement resources (${e.message}). Signatures left unchanged.`);
    return null;
  }
}

function collectPlayers(src) {
  const out = new Map();
  for (const c of src.country_leaderboard || []) {
    for (const p of c.top_players || []) {
      out.set(p.uuid, {
        uuid: p.uuid,
        username: p.username,
        country: p.country || c.country || 'Unknown',
        ap: p.current_ap || 0,
        // Left undefined when update_leaderboard.js doesn't provide them yet, so we never overwrite a known rank with a default.
        rank: p.rank,
        rankPlusColor: p.rankPlusColor,
        monthlyRankColor: p.monthlyRankColor,
        badges: Array.isArray(p.maxGames) ? p.maxGames : null,
      });
    }
  }
  return out;
}

async function loadLive() {
  try {
    if (process.env.MAXGAMES_LIVE_FILE) return JSON.parse(fs.readFileSync(process.env.MAXGAMES_LIVE_FILE, 'utf8')).players || {};
    if (!process.env.MAXGAMES_API_URL) return {};
    const doFetch = globalThis.fetch || require('node-fetch');
    const res = await doFetch(process.env.MAXGAMES_API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).players || {};
  } catch (e) {
    console.warn(`[max-games] Live lookups not merged (${e.message}).`);
    return {};
  }
}

async function main() {
  const src = readJson(SRC_FILE, null);
  if (!src) { console.error('[max-games] ap_hunters_data.json missing or invalid.'); process.exit(1); }

  const prev = readJson(OUT_FILE, { games: {}, players: {} });
  const now = new Date().toISOString();
  const incoming = collectPlayers(src);
  const resources = await loadResources();
  const live = await loadLive();

  const games = {};
  const resetThisRun = new Set();

  // 1. Signatures + invalidation (real games only; seasonal is derived afterwards)
  for (const g of CATALOG.filter(x => !x.derived)) {
    const old = prev.games?.[g.id] || {};
    let signature = old.signature || null;
    let lastReset = old.lastReset || null;
    let list = (old.players || []).map(p => ({ ...p }));

    if (resources) {
      const tGame = resources[g.internal];
      if (tGame) {
        const sig = gameSignature(tGame, !!g.includeLegacy);
        if (old.signature && old.signature !== sig) {
          console.log(`[max-games] ${g.name}: achievements changed (${old.signature} -> ${sig}). Resetting list to 0.`);
          list = [];
          lastReset = now;
          resetThisRun.add(g.id);
        }
        signature = sig;
      }
    }
    games[g.id] = { signature, lastReset, players: list };
  }

  // 2. Merge this run's evidence
  const known = new Map(Object.entries(prev.players || {}));
  for (const p of incoming.values()) {
    known.set(p.uuid, { ...(known.get(p.uuid) || {}), ...stripBadges(p) });

    // A player with an empty/missing badge array is treated as "no information", never "lost everything".
    if (!p.badges || p.badges.length === 0) continue;

    const flagged = new Set();
    for (const b of p.badges) {
      if (b === 'Max Seasonal') SEASONAL_PARTS.forEach(id => flagged.add(id));
      else if (BADGE_TO_ID[b]) flagged.add(BADGE_TO_ID[b]);
    }

    for (const g of CATALOG.filter(x => !x.derived)) {
      const entry = games[g.id];
      const idx = entry.players.findIndex(e => e.uuid === p.uuid);
      if (resetThisRun.has(g.id)) continue;           // wait for fresh data against the new definition
      if (flagged.has(g.id)) {
        if (idx === -1) entry.players.push({ uuid: p.uuid, firstSeen: now });
      } else if (idx !== -1) {
        entry.players.splice(idx, 1);                 // evaluated again and no longer maxed
      }
    }
  }

  // 2b. Fold in players found by live lookups. Entries older than a game's last reset are stale and ignored.
  for (const [uuid, rec] of Object.entries(live)) {
    let added = false;
    for (const [badge, firstSeen] of Object.entries(rec.games || {})) {
      const id = BADGE_TO_ID[badge];
      const entry = id && games[id];
      if (!entry || resetThisRun.has(id)) continue;
      if (entry.lastReset && firstSeen < entry.lastReset) continue;
      if (!entry.players.some(e => e.uuid === uuid)) { entry.players.push({ uuid, firstSeen }); added = true; }
    }
    if (added && !incoming.has(uuid)) {
      known.set(uuid, { ...(known.get(uuid) || { country: 'Unknown' }), uuid, username: rec.username, ap: rec.ap || 0,
        rank: rec.rank, rankPlusColor: rec.rankPlusColor, monthlyRankColor: rec.monthlyRankColor });
    }
  }

  // 3. Derive Seasonal = all four parts
  const partSets = SEASONAL_PARTS.map(id => new Map(games[id].players.map(e => [e.uuid, e.firstSeen])));
  const seasonalPlayers = [];
  for (const [uuid, t0] of partSets[0]) {
    if (partSets.every(m => m.has(uuid))) {
      const latest = partSets.map(m => m.get(uuid)).sort().pop();   // done once the last piece was seen
      seasonalPlayers.push({ uuid, firstSeen: latest });
    }
  }
  games.seasonal = {
    signature: sha(SEASONAL_PARTS.map(id => games[id].signature || '').join('|')),
    lastReset: SEASONAL_PARTS.map(id => games[id].lastReset).filter(Boolean).sort().pop() || null,
    players: seasonalPlayers,
  };

  // 4. Order: earliest first seen, then higher AP, then name
  const apOf = (uuid) => known.get(uuid)?.ap || 0;
  const nameOf = (uuid) => (known.get(uuid)?.username || '').toLowerCase();
  for (const g of Object.values(games)) {
    g.players.sort((a, b) =>
      a.firstSeen.localeCompare(b.firstSeen) || apOf(b.uuid) - apOf(a.uuid) || nameOf(a.uuid).localeCompare(nameOf(b.uuid)));
  }

  // 5. Only keep player records that appear on a list
  const used = new Set(Object.values(games).flatMap(g => g.players.map(p => p.uuid)));
  const players = {};
  for (const uuid of used) if (known.has(uuid)) players[uuid] = known.get(uuid);

  // The date tracking began. Anyone already maxed then shares this timestamp (their order is by AP, not by time).
  const allStamps = Object.values(prev.games || {}).flatMap(g => (g.players || []).map(p => p.firstSeen));
  const trackingSince = prev.tracking_since || (allStamps.length ? allStamps.sort()[0] : now);

  const out = {
    last_update: now,
    tracking_since: trackingSince,
    source_update: src.last_update || null,
    catalog: CATALOG.map(({ id, name, badge, tier, derived, parent }) => ({ id, name, badge, tier, derived: !!derived, parent: parent || null })),
    games,
    players,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 1));
  const summary = CATALOG.filter(g => !g.parent).map(g => `${g.name}:${games[g.id].players.length}`).join('  ');
  console.log(`[max-games] Wrote ${path.basename(OUT_FILE)}  ${summary}`);
}

function stripBadges(p) {
  const { badges, ...rest } = p;
  return Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
}

main().catch(e => { console.error(e); process.exit(1); });