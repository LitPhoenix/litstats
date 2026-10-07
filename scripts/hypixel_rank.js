/**
 * Turns a raw Hypixel /v2/player `player` object into the three rank fields the site needs.
 * Same logic as getPlayerRank() in player.js, so the leaderboard shows the same rank as the cabinet.
 */
function getPlayerRank(player) {
  if (player.prefix) return player.prefix.replace(/§./g, '');
  if (player.rank && player.rank !== 'NORMAL') return player.rank;
  if (player.monthlyPackageRank && player.monthlyPackageRank !== 'NONE') return 'MVP++';
  const ranks = { MVP_PLUS: 'MVP+', MVP: 'MVP', VIP_PLUS: 'VIP+', VIP: 'VIP' };
  if (player.newPackageRank) return ranks[player.newPackageRank] || 'NON';
  if (player.packageRank) return ranks[player.packageRank] || 'NON';
  return 'NON';
}

function rankFields(player) {
  return {
    rank: getPlayerRank(player),
    rankPlusColor: player.rankPlusColor || 'RED',
    monthlyRankColor: player.monthlyRankColor || 'GOLD',
  };
}

module.exports = { getPlayerRank, rankFields };
