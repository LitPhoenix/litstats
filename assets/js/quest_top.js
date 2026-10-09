// GET /api/quest_top -> { last_update, games: [{ key, name, total, players: [{ uuid, username, count }] }] }
const { getBoard } = require('./_quest_board');

module.exports = async (req, res) => {
  const allowed = ['https://www.litstats.com', 'https://litstats.com', 'http://localhost:3000', 'http://127.0.0.1:3000'];
  const origin = req.headers.origin || '';
  res.setHeader('Access-Control-Allow-Origin', allowed.some(o => origin.startsWith(o)) ? origin : '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120, stale-while-revalidate=600');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try { return res.status(200).json(await getBoard(100)); }
  catch (e) { console.error('quest_top error:', e); return res.status(500).json({ error: `Failed to load board: ${e.message}` }); }
};