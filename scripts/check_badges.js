/**
 * check_badges.js: explains why General / Seasonal lists are empty.
 *
 *   node scripts/check_badges.js                 -> reports on the JSON files you already have
 *   node scripts/check_badges.js Name1 Name2     -> also checks those players live (needs HYPIXEL_API_KEY)
 *
 * For each named player it shows, for General and the four seasonal sets, how many achievements
 * they are missing, using the exact same rules as update_leaderboard.js.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));

const WATCH = ['Max General', 'Max Summer', 'Max Christmas', 'Max Easter', 'Max Halloween', 'Max Seasonal'];
const SETS = ['general', 'summer', 'christmas2017', 'easter', 'halloween2017'];

/** Missing non-legacy achievements for one game, same rules as calculateMaxes. */
function missingFor(game, tGame, profile) {
  const done = new Set((profile.achievementsOneTime || []).filter(x => typeof x === 'string'));
  const tiered = profile.achievements || {};
  const missing = [];
  let total = 0;
  for (const [key, a] of Object.entries(tGame.one_time || {})) {
    if (a.legacy) continue;
    total++;
    if (!done.has(`${game}_${key.toLowerCase()}`)) missing.push(a.name || key);
  }
  for (const [key, a] of Object.entries(tGame.tiered || {})) {
    if (a.legacy) continue;
    total++;
    const max = Math.max(0, ...(a.tiers || []).map(t => t.amount));
    const have = tiered[`${game}_${key.toLowerCase()}`] || 0;
    if (have < max) missing.push(`${a.name || key} (${have}/${max})`);
  }
  return { total, missing };
}

async function getJson(url, headers) {
  const f = globalThis.fetch || require('node-fetch');
  const r = await f(url, { headers });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function main() {
  // 1. Which version of the leaderboard script is on disk?
  const lbSrc = fs.readFileSync(path.join(__dirname, 'update_leaderboard.js'), 'utf8');
  const isNew = lbSrc.includes('christmas2017') && lbSrc.includes('"Max General"');
  console.log(`update_leaderboard.js is the ${isNew ? 'NEW' : 'OLD'} version${isNew ? '' : '  <-- replace it with the new one, it never checks General/Seasonal parts'}`);

  // 2. What did the last run write?
  const lb = read('ap_hunters_data.json');
  const players = lb.country_leaderboard.flatMap(c => c.top_players);
  const ageH = ((Date.now() - new Date(lb.last_update)) / 3600000).toFixed(1);
  console.log(`\nap_hunters_data.json: ${players.length} players, written ${lb.last_update} (${ageH}h ago)`);
  const empty = players.filter(p => !p.maxGames || p.maxGames.length === 0).length;
  console.log(`  players with an empty maxGames list: ${empty}${empty > 20 ? '  <-- many failed Hypixel calls (rate limit / bad key?)' : ''}`);
  for (const b of WATCH) console.log(`  ${b.padEnd(14)} ${players.filter(p => (p.maxGames || []).includes(b)).length}`);
  console.log(`  players with a rank saved: ${players.filter(p => p.rank).length}`);

  // 3. What did update_max_games.js build from it?
  try {
    const reg = read('max_games_data.json');
    console.log(`\nmax_games_data.json: written ${reg.last_update} (source data ${reg.source_update})`);
    for (const id of ['general', 'summer', 'christmas', 'easter', 'halloween', 'seasonal']) {
      console.log(`  ${id.padEnd(10)} ${reg.games[id]?.players.length ?? 'missing'}`);
    }
    if (reg.source_update && reg.source_update !== lb.last_update) {
      console.log('  <-- registry was built from an OLDER ap_hunters_data.json. Run update_max_games.js again AFTER update_leaderboard.js.');
    }
  } catch { console.log('\nmax_games_data.json not found. Run: node scripts/update_max_games.js'); }

  // 4. Optional live check of named players
  const names = process.argv.slice(2);
  if (!names.length) return;
  const key = process.env.HYPIXEL_API_KEY;
  if (!key) { console.log('\nSet HYPIXEL_API_KEY to check players live.'); return; }
  const tpl = (await getJson('https://api.hypixel.net/v2/resources/achievements')).achievements;
  const { calculateMaxes } = require('./update_leaderboard.js');

  for (const n of names) {
    let uuid = n.replace(/-/g, '');
    if (!/^[0-9a-f]{32}$/i.test(uuid)) uuid = (await getJson(`https://playerdb.co/api/player/minecraft/${n}`)).data.player.raw_id;
    const { player } = await getJson(`https://api.hypixel.net/v2/player?uuid=${uuid}`, { 'API-Key': key });
    console.log(`\n== ${player?.displayname || n} ==`);
    console.log('  script says maxed:', calculateMaxes(player, tpl).filter(b => WATCH.includes(b)).join(', ') || '(none of the watched badges)');
    for (const g of SETS) {
      if (!tpl[g]) { console.log(`  ${g}: not in Hypixel resources (wrong key?)`); continue; }
      const { total, missing } = missingFor(g, tpl[g], player);
      console.log(`  ${g.padEnd(14)} ${total - missing.length}/${total} done` + (missing.length ? `  missing: ${missing.slice(0, 6).join('; ')}${missing.length > 6 ? ` +${missing.length - 6} more` : ''}` : '  MAXED'));
    }
  }
}

if (require.main === module) main().catch(e => { console.error(e.message); process.exit(1); });
module.exports = { missingFor };