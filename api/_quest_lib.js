// api/_quest_lib.js
// Shared quest logic. Used by api/quest.js (live lookups) and scripts/build-quest-games.js (per-game leaderboard).
// Underscore-prefixed files in /api are not exposed as routes on Vercel, so this is import-only.
'use strict';

// ---- Reset schedule (EDIT HERE if Hypixel's schedule differs) --------------------------------
const DAILY_RESET_UTC_HOUR = 5;   // assumed 12:00 AM EST
const WEEKLY_RESET_UTC_DOW = 5;   // assumed Friday (0 = Sunday)
const WEEKLY_RESET_UTC_HOUR = 5;
const DAY = 86400000;

const GAME_NAMES = {
  arcade: 'Arcade', arena: 'Arena Brawl', bedwars: 'Bed Wars', blitz: 'Blitz SG', hungergames: 'Blitz SG', buildbattle: 'Build Battle',
  copsandcrims: 'Cops and Crims', duels: 'Duels', gingerbread: 'TKR', murder_mystery: 'Murder Mystery',
  paintball: 'Paintball', pit: 'The Pit', quake: 'Quakecraft', skyblock: 'SkyBlock', skywars: 'SkyWars',
  smash: 'Smash Heroes', supersmash: 'Smash Heroes', speed_uhc: 'Speed UHC', speeduhc: 'Speed UHC',
  tntgames: 'TNT Games', truecombat: 'Crazy Walls', uhc: 'UHC', vampirez: 'VampireZ', walls3: 'Mega Walls',
  walls: 'Walls', warlords: 'Warlords', battleground: 'Warlords', woolgames: 'Wool Games', mcgo: 'Cops and Crims',
  murdermystery: 'Murder Mystery', mm: 'Murder Mystery', thewalls: 'Walls', megawalls: 'Mega Walls',
  halloween: 'Halloween', christmas: 'Christmas', easter: 'Easter', summer: 'Summer', seasonal: 'Seasonal', general: 'General'
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

const indexCache = new WeakMap();
function indexDefs(defs) {
  if (indexCache.has(defs)) return indexCache.get(defs);
  const idx = {};
  for (const [game, list] of Object.entries((defs && defs.quests) || {})) for (const def of list || []) idx[def.id] = { game, def };
  indexCache.set(defs, idx);
  return idx;
}
function gameOf(qid, idx) {
  if (idx[qid]) return idx[qid].game;
  for (const p of PREFIXES) if (qid.startsWith(p)) return p;
  return 'other';
}

// Hypixel names look like "Daily Quest: Arena Kills", "Weekly Quest: ...", "Mythic Quest: ...", "Special Quest: ..."
// Mythic quests count as daily quests (they are part of the in-game daily totals).
function kindOf(def) {
  const n = String(def.name || '');
  if (/^weekly\b/i.test(n)) return 'weekly';
  if (/^(daily|mythic)\b/i.test(n)) return 'daily';
  if (/^special\b/i.test(n)) return 'special';
  const t = String(def.type || '').toUpperCase();
  if (t.includes('WEEKLY')) return 'weekly';
  if (t.includes('DAILY')) return 'daily';
  return /weekly/i.test(def.id || '') ? 'weekly' : 'daily';
}
function tagOf(def) {
  const m = String(def.name || '').match(/^(mythic|special)\b/i);
  return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : null;
}
function cleanName(def) { return String(def.name || def.id || '').replace(/^(daily|weekly|mythic|special)\s+quest:\s*/i, ''); }

// Strips colour codes (§x and %%aqua%%) and puts each objective on its own line when Hypixel runs them together.
const SPLIT = /\s+(?=(?:Kill|Win|Get|Play|Deal|Heal|Collect|Complete|Earn|Destroy|Capture|Score|Break|Reach|Place|Open|Defeat|Assist|Eliminate|Survive|Gain|Finish)\b)/g;
function cleanDesc(def) {
  let d = String(def.description || '').replace(/§./g, '').replace(/%%\w+%%/g, '').replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').trim();
  if (!d.includes('\n') && (def.objectives || []).length > 1) d = d.replace(SPLIT, '\n');
  return d;
}

function retiredGames(games) {
  const set = new Set();
  const g = games && games.games;
  if (g) for (const v of Object.values(g)) if (v && v.retired && v.databaseName) set.add(String(v.databaseName).toLowerCase());
  return set;
}

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

// For checking classification: per-game counts of daily / weekly / special quests as the site sees them.
function summarizeDefs(defs, games) {
  const retired = retiredGames(games);
  const totals = { daily: 0, weekly: 0, special: 0 }, byGame = {}, mythic = [], special = [], skipped = [];
  for (const [game, list] of Object.entries(defs.quests || {})) {
    if (retired.has(game.toLowerCase())) { skipped.push(game); continue; }
    for (const def of list || []) {
      const k = kindOf(def);
      totals[k]++;
      (byGame[game] = byGame[game] || { daily: 0, weekly: 0, special: 0 })[k]++;
      if (tagOf(def) === 'Mythic') mythic.push(def.name);
      if (k === 'special') special.push(`${game}: ${def.name}`);
    }
  }
  return { totals, byGame, mythic, special, retiredGamesSkipped: skipped };
}

function buildQuestResponse(player, defs, games, opts = {}) {
  const now = Date.now();
  const dailyCut = lastDailyReset(now), weeklyCut = lastWeeklyReset(now);
  const idx = indexDefs(defs);
  const retired = retiredGames(games);
  const pq = player.quests || {};

  const quests = [];
  let total = 0;
  for (const st of Object.values(pq)) if (st && Array.isArray(st.completions)) total += st.completions.length;

  for (const [game, list] of Object.entries(defs.quests || {})) {
    if (retired.has(game.toLowerCase())) continue;
    for (const def of list || []) {
      const kind = kindOf(def);
      const cut = kind === 'daily' ? dailyCut : weeklyCut;   // special quests use the weekly cut (assumption)
      const st = pq[def.id] || {};
      const comps = Array.isArray(st.completions) ? st.completions : [];
      let last = 0;
      for (const c of comps) if (c && c.time > last) last = c.time;
      // requirements: [{ type: 'OneTimeQuestRequirement' }] -> can only ever be completed once
      const once = (def.requirements || []).some(r => r && r.type === 'OneTimeQuestRequirement');
      const doneByTime = once ? comps.length > 0 : last >= cut;
      const a = st.active || null;
      const ao = a && a.objectives ? a.objectives : null;
      const aoKeys = ao ? Object.keys(ao) : [];
      const defObjs = def.objectives || [];

      const obj = defObjs.map((o, oi) => {
        const target = o.type === 'BooleanObjective' ? 1 : (o.integer || 1);
        let v = ao ? ao[o.id] : undefined;
        if (v === undefined && ao && aoKeys.length === defObjs.length) v = ao[aoKeys[oi]];
        const p = typeof v === 'number' ? v : (v ? 1 : 0);
        return [Math.min(p, target), target];
      });
      const full = obj.length > 0 && obj.every(o => o[0] >= o[1]);
      const done = doneByTime || full;
      if (done) obj.forEach(o => { o[0] = o[1]; });
      const started = obj.some(o => o[0] > 0);

      let xp = 0, coins = 0;
      for (const r of def.rewards || []) {
        const t = String(r.type || '').toLowerCase();
        if (t.includes('experience')) xp += r.amount || 0;
        else if (t.includes('coin')) coins += r.amount || 0;
      }
      quests.push({
        id: def.id, game, name: cleanName(def), tag: tagOf(def), desc: cleanDesc(def),
        kind, once, status: done ? 'done' : started ? 'progress' : 'todo',
        obj, last: last || null, n: comps.length, xp, coins
      });
    }
  }

  const gameKeys = new Set(quests.map(x => x.game));
  const out = {
    now, name: player.displayname || null,
    resets: { dailyLast: dailyCut, weeklyLast: weeklyCut, dailyNext: dailyCut + DAY, weeklyNext: weeklyCut + 7 * DAY },
    total, byGame: countByGame(pq, defs), quests
  };

  // Completion history: only built when asked for (calendar). Quest table + delta-encoded seconds + quest index.
  if (opts.history) {
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
      return { id, name: hit ? cleanName(hit.def) : id, game: gameOf(id, idx), kind: hit ? kindOf(hit.def) : 'daily' };
    });
    qmeta.forEach(m => gameKeys.add(m.game));
    out.history = { qmeta, t, q };
  }
  out.gameNames = {};
  for (const k of gameKeys) out.gameNames[k] = gameName(k);
  return out;
}

module.exports = { buildQuestResponse, countByGame, summarizeDefs, gameName, GAME_NAMES, lastDailyReset, lastWeeklyReset };
