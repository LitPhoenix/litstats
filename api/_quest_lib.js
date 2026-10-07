// api/_quest_lib.js
// Shared quest logic. Used by api/quest.js (live lookups) and scripts/build-quest-games.js (per-game leaderboard).
// Underscore-prefixed files in /api are not exposed as routes on Vercel, so this is import-only.
'use strict';

// ---- Reset schedule (EDIT HERE if Hypixel's schedule differs) --------------------------------
// Assumed: daily quests reset at 12:00 AM EST (05:00 UTC); weekly quests reset on Fridays at the same time.
const DAILY_RESET_UTC_HOUR = 5;
const WEEKLY_RESET_UTC_DOW = 5;   // 0 = Sunday ... 5 = Friday
const WEEKLY_RESET_UTC_HOUR = 5;
const DAY = 86400000;

const GAME_NAMES = {
  arcade: 'Arcade', arena: 'Arena Brawl', bedwars: 'Bed Wars', blitz: 'Blitz SG', buildbattle: 'Build Battle',
  copsandcrims: 'Cops and Crims', duels: 'Duels', gingerbread: 'Turbo Kart Racers', murder_mystery: 'Murder Mystery',
  paintball: 'Paintball', pit: 'The Pit', quake: 'Quakecraft', skyblock: 'SkyBlock', skywars: 'SkyWars',
  smash: 'Smash Heroes', supersmash: 'Smash Heroes', speed_uhc: 'Speed UHC', speeduhc: 'Speed UHC',
  tntgames: 'TNT Games', truecombat: 'Crazy Walls', uhc: 'UHC', vampirez: 'VampireZ', walls3: 'Mega Walls',
  walls: 'Walls', warlords: 'Warlords', woolgames: 'Wool Games', mcgo: 'Cops and Crims'
};
const PREFIXES = Object.keys(GAME_NAMES).sort((a, b) => b.length - a.length);

function gameName(key) {
  if (GAME_NAMES[key]) return GAME_NAMES[key];
  if (!key || key === 'other') return 'Other';
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function lastDailyReset(now) {
  const d = new Date(now);
  let t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), DAILY_RESET_UTC_HOUR);
  if (t > now) t -= DAY;
  return t;
}

function lastWeeklyReset(now) {
  const d = new Date(now);
  let t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), WEEKLY_RESET_UTC_HOUR);
  t -= ((d.getUTCDay() - WEEKLY_RESET_UTC_DOW + 7) % 7) * DAY;
  if (t > now) t -= 7 * DAY;
  return t;
}

// id -> { game, def }, cached per definitions object
const indexCache = new WeakMap();
function indexDefs(defs) {
  if (indexCache.has(defs)) return indexCache.get(defs);
  const idx = {};
  for (const [game, list] of Object.entries((defs && defs.quests) || {})) {
    for (const def of list || []) idx[def.id] = { game, def };
  }
  indexCache.set(defs, idx);
  return idx;
}

function gameOf(qid, idx) {
  if (idx[qid]) return idx[qid].game;
  for (const p of PREFIXES) if (qid.startsWith(p)) return p;
  return 'other';
}

function kindOf(def) {
  const t = String(def.type || '').toUpperCase();
  if (t.includes('WEEKLY')) return 'weekly';
  if (t.includes('DAILY')) return 'daily';
  return /weekly/i.test(def.id || '') ? 'weekly' : 'daily';
}

function retiredGames(games) {
  const set = new Set();
  const g = games && games.games;
  if (g) for (const v of Object.values(g)) {
    if (v && v.retired && v.databaseName) set.add(String(v.databaseName).toLowerCase());
  }
  return set;
}

// { gameKey: completions } for a player's raw `quests` object. "other" is left in; callers may drop it.
function countByGame(playerQuests, defs) {
  const idx = indexDefs(defs || {});
  const out = {};
  for (const [qid, st] of Object.entries(playerQuests || {})) {
    if (!st || !Array.isArray(st.completions) || !st.completions.length) continue;
    const g = gameOf(qid, idx);
    out[g] = (out[g] || 0) + st.completions.length;
  }
  return out;
}

function buildQuestResponse(player, defs, games) {
  const now = Date.now();
  const dailyCut = lastDailyReset(now);
  const weeklyCut = lastWeeklyReset(now);
  const idx = indexDefs(defs);
  const retired = retiredGames(games);
  const pq = player.quests || {};

  // Current quest list (every quest definition, with this player's state)
  const quests = [];
  for (const [game, list] of Object.entries(defs.quests || {})) {
    if (retired.has(game.toLowerCase())) continue;
    for (const def of list || []) {
      const kind = kindOf(def);
      const cut = kind === 'weekly' ? weeklyCut : dailyCut;
      const st = pq[def.id] || {};
      const comps = Array.isArray(st.completions) ? st.completions : [];
      let last = 0;
      for (const c of comps) if (c && c.time > last) last = c.time;
      const done = last >= cut;
      const active = st.active && (st.active.started || 0) >= cut ? st.active : null;

      const obj = (def.objectives || []).map(o => {
        const target = o.type === 'BooleanObjective' ? 1 : (o.integer || 1);
        let p = 0;
        if (done) p = target;
        else if (active && active.objectives) {
          const v = active.objectives[o.id];
          p = typeof v === 'number' ? v : (v ? 1 : 0);
        }
        return [Math.min(p, target), target];
      });
      const started = obj.some(o => o[0] > 0);

      let xp = 0, coins = 0;
      for (const r of def.rewards || []) {
        const t = String(r.type || '').toLowerCase();
        if (t.includes('experience')) xp += r.amount || 0;
        else if (t.includes('coin')) coins += r.amount || 0;
      }

      quests.push({
        id: def.id, game, name: def.name || def.id,
        desc: String(def.description || '').replace(/§./g, ''),
        kind, status: done ? 'done' : started ? 'progress' : 'todo',
        obj, last: last || null, n: comps.length, xp, coins
      });
    }
  }

  // Full completion history, compact: quest table + delta-encoded timestamps (seconds) + quest index per event
  const qids = [], qpos = {}, rows = [];
  for (const [qid, st] of Object.entries(pq)) {
    if (!st || !Array.isArray(st.completions)) continue;
    let i = qpos[qid];
    if (i === undefined) { i = qids.length; qids.push(qid); qpos[qid] = i; }
    for (const c of st.completions) if (c && c.time) rows.push([Math.floor(c.time / 1000), i]);
  }
  rows.sort((a, b) => a[0] - b[0]);
  const t = [], q = [];
  let prev = 0;
  for (const [sec, i] of rows) { t.push(sec - prev); prev = sec; q.push(i); }

  const qmeta = qids.map(id => {
    const hit = idx[id];
    return { id, name: hit ? (hit.def.name || id) : id, game: gameOf(id, idx), kind: hit ? kindOf(hit.def) : 'daily' };
  });
  const gameKeys = new Set([...quests.map(x => x.game), ...qmeta.map(x => x.game)]);
  const gameNames = {};
  for (const k of gameKeys) gameNames[k] = gameName(k);

  return {
    now,
    name: player.displayname || null,
    resets: { dailyLast: dailyCut, weeklyLast: weeklyCut, dailyNext: dailyCut + DAY, weeklyNext: weeklyCut + 7 * DAY },
    total: rows.length,
    byGame: countByGame(pq, defs),
    gameNames,
    quests,
    history: { qmeta, t, q }
  };
}

module.exports = { buildQuestResponse, countByGame, gameName, GAME_NAMES, lastDailyReset, lastWeeklyReset };