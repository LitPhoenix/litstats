const fetch = require('node-fetch');

// Cache the template in server memory so we don't hit Hypixel twice per request
let cachedTemplate = null;
let templateFetchTime = 0;

function getPlayerRank(player) {
  if (player.prefix) return player.prefix.replace(/§./g, '');
  if (player.rank && player.rank !== 'NORMAL') return player.rank;
  if (player.monthlyPackageRank && player.monthlyPackageRank !== 'NONE') return 'MVP++';
  if (player.newPackageRank) {
    const ranks = { 'MVP_PLUS': 'MVP+', 'MVP': 'MVP', 'VIP_PLUS': 'VIP+', 'VIP': 'VIP' };
    return ranks[player.newPackageRank] || 'NON';
  }
  return 'NON';
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { uuid } = req.query;
  if (!uuid) return res.status(400).json({ error: "Missing UUID" });

  const API_KEY = process.env.HYPIXEL_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "Server missing API Key" });

  try {
    // 1. Fetch Global Achievements Template (Cached for 1 hour to save API limits)
    if (!cachedTemplate || Date.now() - templateFetchTime > 3600000) {
      const tRes = await fetch('https://api.hypixel.net/v2/resources/achievements');
      if (tRes.ok) {
        const tData = await tRes.json();
        cachedTemplate = tData.achievements;
        templateFetchTime = Date.now();
      }
    }

    // 2. Fetch Player Data
    const pRes = await fetch(`https://api.hypixel.net/v2/player?uuid=${uuid}`, { headers: { 'API-Key': API_KEY } });
    if (pRes.status === 429) return res.status(429).json({ error: "Hypixel API Rate Limit. Try again shortly." });
    
    const pData = await pRes.json();
    if (!pData.success) return res.status(400).json({ error: pData.cause || "Hypixel API Error" });
    if (!pData.player) return res.status(404).json({ error: "Player not found" });

    const profile = pData.player;
    const rawOneTime = profile.achievementsOneTime || [];
    const cleanOneTime = rawOneTime.filter(item => typeof item === 'string');
    const tieredPlayer = profile.achievements || {};

    // Base Data
    const responseData = {
      username: profile.displayname || "Unknown",
      uuid: profile.uuid,
      rank: getPlayerRank(profile),
      achievementPoints: profile.achievementPoints || 0,
      questsCompleted: 0, 
      maxGames: [],
      gamePercentages: {},
      missingAchievements: []
    };

    // Calculate Quests
    if (profile.quests) {
      for (const quest in profile.quests) {
        if (profile.quests[quest].completions) {
          responseData.questsCompleted += profile.quests[quest].completions.length;
        }
      }
    }

    // Advanced Calculation: Maxes, Percentages & Missing
    if (cachedTemplate) {
      const gameMappings = [
        { internal: "uhc", name: "UHC", badge: "Max UHC" },
        { internal: "pit", name: "Pit", badge: "Max Pit" },
        { internal: "walls3", name: "Mega Walls", badge: "Max Mega Walls" },
        { internal: "skywars", name: "SkyWars", badge: "Max SkyWars" },
        { internal: "blitz", name: "Blitz", badge: "Max Blitz" },
        { internal: "arena", name: "Arena Brawl", badge: "Max Arena Brawl" },
        { internal: "supersmash", name: "Smash Heroes", badge: "Max Smash Heroes" },
        { internal: "paintball", name: "Paintball", badge: "Max Paintball" },
        { internal: "copsandcrims", name: "Cops and Crims", badge: "Max Cops and Crims" },
        { internal: "quake", name: "Quake", badge: "Max Quake" },
        { internal: "skyblock", name: "SkyBlock", badge: "Max SkyBlock" },
        { internal: "speeduhc", name: "Speed UHC", badge: "Max Speed UHC" },
        { internal: "warlords", name: "Warlords", badge: "Max Warlords" },
        { internal: "walls", name: "Walls", badge: "Max Walls" },
        { internal: "tntgames", name: "TNT Games", badge: "Max TNT Games" },
        { internal: "arcade", name: "Arcade", badge: "Max Arcade" },
        { internal: "murdermystery", name: "Murder Mystery", badge: "Max Murder Mystery" },
        { internal: "vampirez", name: "VampireZ", badge: "Max VampireZ" },
        { internal: "bedwars", name: "Bed Wars", badge: "Max Bed Wars" },
        { internal: "gingerbread", name: "TKR", badge: "Max TKR" },
        { internal: "woolgames", name: "Wool Games", badge: "Max Wool Games" },
        { internal: "duels", name: "Duels", badge: "Max Duels" },
        { internal: "buildbattle", name: "Build Battle", badge: "Max Build Battle" },
        { internal: "truecombat", name: "Crazy Walls", badge: "Max Crazy Walls", legacy: true },
        { internal: "skyclash", name: "SkyClash", badge: "Max SkyClash", legacy: true }
      ];

      for (const game of gameMappings) {
        const tGame = cachedTemplate[game.internal];
        if (!tGame) continue;

        let totalPossible = 0;
        let playerUnlocked = 0;
        let isMaxed = true;

        // Process One-Time
        if (tGame.one_time) {
          for (const [key, ach] of Object.entries(tGame.one_time)) {
            if (ach.legacy && !game.legacy) continue; // Skip legacy unless it's a legacy game
            totalPossible++;
            const fullId = `${game.internal}_${key.toLowerCase()}`;
            
            if (cleanOneTime.includes(fullId)) {
              playerUnlocked++;
            } else {
              isMaxed = false;
              responseData.missingAchievements.push({
                game: game.name,
                title: ach.name,
                desc: ach.description,
                reward: ach.points
              });
            }
          }
        }

        // Process Tiered
        if (tGame.tiered) {
          for (const [key, ach] of Object.entries(tGame.tiered)) {
            if (ach.legacy && !game.legacy) continue;
            const fullId = `${game.internal}_${key.toLowerCase()}`;
            const playerAmt = tieredPlayer[fullId] || 0;

            for (const tier of ach.tiers) {
              totalPossible++;
              if (playerAmt >= tier.amount) {
                playerUnlocked++;
              } else {
                isMaxed = false;
                responseData.missingAchievements.push({
                  game: game.name,
                  title: `${ach.name} (Tier ${tier.amount})`,
                  desc: ach.description,
                  reward: tier.points
                });
              }
            }
          }
        }

        if (isMaxed && totalPossible > 0) {
          responseData.maxGames.push(game.badge);
        } else if (totalPossible > 0) {
          responseData.gamePercentages[game.badge] = ((playerUnlocked / totalPossible) * 100).toFixed(1);
        }
      }
    }

    // Sort missing achievements by Easiest First (lowest reward points)
    responseData.missingAchievements.sort((a, b) => a.reward - b.reward);
    // Limit to Top 50 to prevent massive browser lag
    responseData.missingAchievements = responseData.missingAchievements.slice(0, 50);

    return res.status(200).json(responseData);

  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
