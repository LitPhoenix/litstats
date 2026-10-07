// GET /api/maxgames -> players found by live lookups, merged into the Max Games page on load.
const { listPlayers } = require('./_maxgames_registry');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  try {
    return res.status(200).json(await listPlayers());
  } catch (e) {
    return res.status(200).json({ configured: false, players: {}, error: 'registry unavailable' });
  }
};