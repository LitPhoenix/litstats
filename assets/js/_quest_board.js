// api/_quest_board.js
// Per-game "most quests" leaderboard stored in Upstash Redis (the same free-tier KV you already use for max games).
// Every live lookup in api/quest.js records that player's per-game totals; api/quest_top.js reads the board back.
// Uses Upstash's REST API directly (no npm dependency). Accepts either Vercel-KV or plain Upstash env var names.
'use strict';
const { gameName } = require('./_quest_lib');

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const enabled = () => !!(URL_ && TOKEN);

async function pipe(cmds) {
  const r = await fetch(`${URL_}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error(`redis ${r.status}`);
  return r.json();
}

function writes(uuid, name, byGame) {
  const entries = Object.entries(byGame || {}).filter(([g, n]) => g !== 'other' && n > 0);
  if (!entries.length) return null;
  const cmds = [['HSET', 'qb:names', uuid, name || uuid], ['SET', 'qb:updated', String(Date.now())], ['SADD', 'qb:games', ...entries.map(e => e[0])]];
  for (const [g, n] of entries) cmds.push(['ZADD', `qb:g:${g}`, String(n), uuid]);
  return cmds;
}

// Called on live lookups. A player is only re-written once an hour, so repeat searches cost 1 Redis command.
async function record(uuid, name, byGame) {
  if (!enabled() || !uuid) return false;
  const cmds = writes(uuid, name, byGame);
  if (!cmds) return false;
  const [gate] = await pipe([['SET', `qb:seen:${uuid}`, '1', 'NX', 'EX', '3600']]);
  if (!gate || gate.result !== 'OK') return false;
  await pipe(cmds);
  return true;
}

// Used by scripts/build-quest-games.js to seed the board without the hourly gate.
async function seed(uuid, name, byGame) {
  if (!enabled()) return false;
  const cmds = writes(uuid, name, byGame);
  if (cmds) await pipe(cmds);
  return !!cmds;
}

async function getBoard(limit = 100) {
  if (!enabled()) return { last_update: null, games: [], note: 'KV not configured' };
  const [gk, upd] = await pipe([['SMEMBERS', 'qb:games'], ['GET', 'qb:updated']]);
  const keys = gk.result || [];
  if (!keys.length) return { last_update: null, games: [] };
  const z = await pipe(keys.map(g => ['ZREVRANGE', `qb:g:${g}`, 0, limit - 1, 'WITHSCORES']));
  const ids = new Set();
  const lists = z.map(x => { const a = x.result || [], out = []; for (let i = 0; i < a.length; i += 2) { out.push([a[i], +a[i + 1]]); ids.add(a[i]); } return out; });
  const idArr = [...ids], nm = {};
  if (idArr.length) {
    const [h] = await pipe([['HMGET', 'qb:names', ...idArr]]);
    idArr.forEach((u, i) => { nm[u] = (h.result || [])[i] || u; });
  }
  const games = keys.map((g, i) => ({
    key: g, name: gameName(g), total: lists[i][0] ? lists[i][0][1] : 0,
    players: lists[i].map(([u, c]) => ({ uuid: u, username: nm[u], count: c }))
  })).filter(g => g.players.length).sort((a, b) => b.total - a.total);
  return { last_update: upd && upd.result ? new Date(+upd.result).toISOString() : null, games };
}

module.exports = { record, seed, getBoard, enabled };