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

// Safely handle Hypixel API random Cloudflare HTML blocks
async function safeFetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("API returned invalid JSON (HTML Page)");
  }
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // NEW: Global Edge Caching (Browser caches for 1 min, Vercel caches globally for 5 mins)
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { uuid } = req.query;
  if (!uuid) return res.status(400).json({ error: "Missing UUID" });

  const API_KEY = process.env.HYPIXEL_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "Server missing API Key" });

  try {
    // 1. Fetch Global Achievements Template
    if (!cachedTemplate || Date.now() - templateFetchTime > 3600000) {
      try {
        const tData = await safeFetchJSON('https://api.hypixel.net/v2/resources/achievements');
        if (tData && tData.success) {
          cachedTemplate = tData.achievements;
          templateFetchTime = Date.now();
        }
      } catch (e) {
        console.warn("Failed to fetch achievements template");
      }
    }

    // 2. Fetch Player Data
    const pData = await safeFetchJSON(`https://api.hypixel.net/v2/player?uuid=${uuid}`, { headers: { 'API-Key': API_KEY } });
    
    if (pData.rateLimited) return res.status(429).json({ error: "Hypixel API Rate Limit. Try again shortly." });
    if (!pData.success) return res.status(400).json({ error: pData.cause || "Hypixel API Error" });
    if (!pData.player) return res.status(404).json({ error: "Player not found on Hypixel" });

    const profile = pData.player;
    const rawOneTime = profile.achievementsOneTime || [];
    const cleanOneTime = rawOneTime.filter(item => typeof item === 'string');
    const tieredPlayer = profile.achievements || {};

    const responseData = {
      username: profile.displayname || "Unknown",
      uuid: profile.uuid,
      rank: getPlayerRank(profile),
      achievementPoints: profile.achievementPoints || 0,
      questsCompleted: 0, 
      maxGames: [],
      topQuests: [],
      gamePercentages: {},
      missingAchievements: []
    };

    // --- QUEST CALCULATION ---
    if (profile.quests) {
      const questTotals = {};
      const qMap = {
        "arcade": "Arcade", "arena": "Arena Brawl", "bedwars": "Bed Wars", "blitz": "Blitz SG",
        "buildbattle": "Build Battle", "copsandcrims": "Cops and Crims", "duels": "Duels",
        "gingerbread": "TKR", "murder_mystery": "Murder Mystery", "paintball": "Paintball",
        "pit": "The Pit", "quake": "Quakecraft", "skyblock": "SkyBlock", "skywars": "SkyWars",
        "smash": "Smash Heroes", "speed_uhc": "Speed UHC", "tntgames": "TNT Games",
        "truecombat": "Crazy Walls", "uhc": "UHC", "vampirez": "VampireZ", "walls3": "Mega Walls",
        "walls": "Walls", "warlords": "Warlords", "woolgames": "Wool Games"
      };

      for (const [qId, qData] of Object.entries(profile.quests)) {
        if (qData.completions && Array.isArray(qData.completions)) {
          const count = qData.completions.length;
          responseData.questsCompleted += count;
          
          let gName = "Other";
          for (const pfx in qMap) {
            if (qId.startsWith(pfx)) { gName = qMap[pfx]; break; }
          }
          if (!questTotals[gName]) questTotals[gName] = 0;
          questTotals[gName] += count;
        }
      }
      
      responseData.topQuests = Object.entries(questTotals)
        .filter(([game, count]) => game !== "Other") // Filters out Other BEFORE slicing
        .map(([game, count]) => ({ game, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    }

    // --- AP MAXES & PERCENTAGES CALCULATION ---
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

        if (tGame.one_time) {
          for (const [key, ach] of Object.entries(tGame.one_time)) {
            if (ach.legacy) continue; // Exclude legacy achievements
            totalPossible++;
            const fullId = `${game.internal}_${key.toLowerCase()}`;
            
            if (cleanOneTime.includes(fullId)) {
              playerUnlocked++;
            } else {
              isMaxed = false;
              responseData.missingAchievements.push({
                game: game.name, title: ach.name, desc: ach.description, reward: ach.points
              });
            }
          }
        }

        if (tGame.tiered) {
          for (const [key, ach] of Object.entries(tGame.tiered)) {
            if (ach.legacy) continue; // Exclude legacy achievements
            const fullId = `${game.internal}_${key.toLowerCase()}`;
            const playerAmt = tieredPlayer[fullId] || 0;

            for (const tier of ach.tiers) {
              totalPossible++;
              if (playerAmt >= tier.amount) {
                playerUnlocked++;
              } else {
                isMaxed = false;
                responseData.missingAchievements.push({
                  game: game.name, title: `${ach.name} (Tier ${tier.amount})`, desc: ach.description, reward: tier.points
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

    responseData.missingAchievements.sort((a, b) => a.reward - b.reward);

    return res.status(200).json(responseData);

  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
