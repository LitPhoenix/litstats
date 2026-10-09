// scripts/build-quest-games.js
// Builds quest_games.json (most quests completed PER GAME) for the "Most Quests by Game" tab.
// Run it in the same scheduled job that builds questers_data.json:   HYPIXEL_API_KEY=xxx node scripts/build-quest-games.js
// Player pool = every uuid already in questers_data.json + anyone ranked in the previous quest_games.json,
// so the board only ranks players your site already tracks (it cannot discover brand-new players by itself).
'use strict';
const fs = require('fs');
const path = require('path');
const { countByGame, gameName } = require('../api/_quest_lib');
const board = require('../api/_quest_board');   // also seeds the live board when KV_REST_API_URL / TOKEN are set

const ROOT = process.env.SITE_ROOT || path.join(__dirname, '..');
const SRC = path.join(ROOT, 'questers_data.json');
const OUT = path.join(ROOT, 'quest_games.json');
const KEY = process.env.HYPIXEL_API_KEY;
const KEEP = 100;          // players kept per game
const DELAY_MS = 1100;     // stay under Hypixel's 300 requests / 5 min
if (!KEY) { console.error('Set HYPIXEL_API_KEY'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const readJSON = p => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } };

async function hypixel(url, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'API-Key': KEY } });
    if (res.status === 429) { await sleep(30000); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  throw new Error('rate limited');
}

(async () => {
  const src = readJSON(SRC);
  if (!src) throw new Error(`Cannot read ${SRC}`);
  const prev = readJSON(OUT);

  const pool = new Map();   // uuid -> last known username
  Object.keys(src.month_start_snapshot || {}).forEach(u => pool.set(u, null));
  Object.keys(src.manual_country_mapping || {}).forEach(u => pool.set(u, null));
  (src.country_leaderboard || []).forEach(c => (c.top_players || []).forEach(p => pool.set(p.uuid, p.username)));
  ((prev && prev.games) || []).forEach(g => g.players.forEach(p => { if (!pool.get(p.uuid)) pool.set(p.uuid, p.username); }));
  console.log(`Pool: ${pool.size} players`);

  const defs = await hypixel('https://api.hypixel.net/v2/resources/quests');
  if (!defs.success) throw new Error('Could not load quest definitions');

  const boards = {};   // gameKey -> [{uuid, username, count}]
  let i = 0;
  for (const [uuid, oldName] of pool) {
    i++;
    try {
      const d = await hypixel(`https://api.hypixel.net/v2/player?uuid=${uuid}`);
      if (d.success && d.player) {
        const name = d.player.displayname || oldName || uuid;
        const counts = countByGame(d.player.quests, defs);
        if (board.enabled()) await board.seed(uuid, name, counts).catch(e => console.warn('seed failed', e.message));
        for (const [g, n] of Object.entries(counts)) {
          if (g === 'other' || !n) continue;
          (boards[g] = boards[g] || []).push({ uuid, username: name, count: n });
        }
      }
    } catch (e) { console.warn(`skip ${uuid}: ${e.message}`); }
    if (i % 10 === 0) console.log(`${i}/${pool.size}`);
    await sleep(DELAY_MS);
  }

  const games = Object.entries(boards).map(([key, list]) => {
    list.sort((a, b) => b.count - a.count);
    return { key, name: gameName(key), total: list[0].count, players: list.slice(0, KEEP) };   // total = leader's count
  }).sort((a, b) => b.total - a.total);

  fs.writeFileSync(OUT, JSON.stringify({ last_update: new Date().toISOString(), games }));
  console.log(`Wrote ${OUT} (${games.length} games)`);
})().catch(e => { console.error(e); process.exit(1); });