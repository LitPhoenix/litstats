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
  if (player.packageRank) {
    const ranks = { 'MVP_PLUS': 'MVP+', 'MVP': 'MVP', 'VIP_PLUS': 'VIP+', 'VIP': 'VIP' };
    return ranks[player.packageRank] || 'NON';
  }
  return 'NON';
}

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
  const allowedOrigins = ['https://www.litstats.com', 'https://litstats.com', 'http://localhost:3000', 'http://127.0.0.1:3000'];
  const requestOrigin = req.headers.origin || req.headers.referer || '';

  // 1. CHECK AUTH
  const secureToken = req.headers['x-litstats-auth'];
  const expectedToken = process.env.CLOUDFLARE_AUTH_TOKEN;

  // Skip the token check if running locally
  const isLocalDev = !process.env.VERCEL_ENV || process.env.NODE_ENV === 'development';

  if (!isLocalDev) {
      if (secureToken !== expectedToken) {
          return res.status(403).json({ error: "Access Denied: Direct origin bypass detected." });
      }
      // Block humans typing the URL directly into their browser
      if (!allowedOrigins.some(origin => requestOrigin.startsWith(origin))) {
          return res.status(403).json({ error: "Access Denied: Direct browser visits are blocked." });
      }
  }

  // 2. BROWSER CORS
  const isAllowed = allowedOrigins.some(origin => requestOrigin.startsWith(origin));
  const corsOrigin = isAllowed ? requestOrigin : allowedOrigins[0];

  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { uuid, name } = req.query;
  let targetUuid = uuid;

  // Resolve Username to UUID if needed (for Cabinet compatibility)
  if (name && !uuid) {
    try {
      const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`);
      if (!mojangRes.ok) return res.status(404).json({ error: "Player not found on Mojang" });
      const mojangData = await mojangRes.json();
      targetUuid = mojangData.id;
    } catch (e) {
      return res.status(500).json({ error: "Mojang API error" });
    }
  }

  if (!targetUuid) return res.status(400).json({ error: "Missing UUID or Name" });

  const API_KEY = process.env.HYPIXEL_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "Server missing API Key" });

  try {
    // Check and Fetch Achievement Template Cache
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

    // Fetch Master Hypixel Profile
    const pData = await safeFetchJSON(`https://api.hypixel.net/v2/player?uuid=${targetUuid}`, { headers: { 'API-Key': API_KEY } });
    
    if (pData.rateLimited) return res.status(429).json({ error: "Hypixel API Rate Limit. Try again shortly." });
    if (!pData.success) return res.status(400).json({ error: pData.cause || "Hypixel API Error" });
    if (!pData.player) return res.status(404).json({ error: "Player not found on Hypixel" });

    const profile = pData.player;
    const rawOneTime = profile.achievementsOneTime || [];
    const cleanOneTime = rawOneTime.filter(item => typeof item === 'string');
    const tieredPlayer = profile.achievements || {};

    // --- SHARED PAYLOAD INIT ---
    const responseData = {
      username: profile.displayname || "Unknown",
      uuid: profile.uuid,
      rank: getPlayerRank(profile),
      rankPlusColor: profile.rankPlusColor || 'RED',
      monthlyRankColor: profile.monthlyRankColor || 'GOLD',
      
      // Cabinet Specifics
      achievementPoints: profile.achievementPoints || 0,
      questsCompleted: 0, 
      maxGames: [],
      topQuests: [],
      gamePercentages: {},
      missingAchievements: [],
      recentAchievements: []
    };

    // ==========================================
    // CABINET DATA PARSING (QUESTS & ACHS)
    // ==========================================
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
        .filter(([game, count]) => game !== "Other")
        .map(([game, count]) => ({ game, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    }

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

    if (cachedTemplate) {
      for (const game of gameMappings) {
        const tGame = cachedTemplate[game.internal];
        if (!tGame) continue;

        let totalPossible = 0;
        let playerUnlocked = 0;
        let isMaxed = true;

        if (tGame.one_time) {
          for (const [key, ach] of Object.entries(tGame.one_time)) {
            if (ach.legacy) continue; 
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
                reward: ach.points,
                isOneTime: true,
                globalPct: ach.gamePercentUnlocked 
              });
            }
          }
        }

        if (tGame.tiered) {
          for (const [key, ach] of Object.entries(tGame.tiered)) {
            if (ach.legacy) continue; 
            const fullId = `${game.internal}_${key.toLowerCase()}`;
            const playerAmt = tieredPlayer[fullId] || 0;

            let allTiers = ach.tiers.map((t, index) => ({ tier: t.tier || index + 1, amount: t.amount, reward: t.points }));
            let isAchMaxed = true;

            for (const tier of ach.tiers) {
              totalPossible++;
              if (playerAmt >= tier.amount) {
                playerUnlocked++;
              } else {
                isMaxed = false;
                isAchMaxed = false;
              }
            }

            if (!isAchMaxed) {
                responseData.missingAchievements.push({
                    game: game.name, 
                    title: ach.name, 
                    desc: ach.description, 
                    allTiers: allTiers,
                    currentAmt: playerAmt
                });
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

    const achDictionary = {};
    if (cachedTemplate) {
      for (const [categoryId, tGame] of Object.entries(cachedTemplate)) {
        const gameMap = gameMappings.find(g => g.internal === categoryId);
        const gameName = gameMap ? gameMap.name : categoryId;
        
        if (tGame.one_time) {
          for (const [key, ach] of Object.entries(tGame.one_time)) {
            achDictionary[`${categoryId}_${key.toLowerCase()}`] = { game: gameName, title: ach.name, desc: ach.description, reward: ach.points };
          }
        }
        if (tGame.tiered) {
          for (const [key, ach] of Object.entries(tGame.tiered)) {
            ach.tiers.forEach((t, index) => {
              const tierNum = t.tier || index + 1;
              achDictionary[`${categoryId}_${key.toLowerCase()}_${tierNum}`] = { game: gameName, title: ach.name, desc: ach.description, reward: t.points };
            });
          }
        }
      }
    }

    const newestFirstIds = [...cleanOneTime].reverse(); 
    for (const fullId of newestFirstIds) {
      if (achDictionary[fullId]) {
        responseData.recentAchievements.push(achDictionary[fullId]);
      } else {
        responseData.recentAchievements.push({
           game: "Unknown", 
           title: fullId, 
           desc: "Raw ID (Not in dictionary)", 
           reward: 0 
        });
      }
    }

    // ==========================================
    // BLITZ KITS & COMBAT PARSING
    // ==========================================
    const hg = profile.stats?.HungerGames || {};
    const packages = hg.packages || [];
    const blitzKits = {};
    const blitzPrestiges = {};
    const kitStats = {};
    
    responseData.currentCoins = parseInt(hg.coins) || 0;

    responseData.overallStats = {
        kills: hg.kills || 0,
        deaths: hg.deaths || 0,
        wins_solo_normal: hg.wins_solo_normal || 0,
        wins_teams_normal: hg.wins_teams_normal || 0,
        timePlayed: hg.time_played || hg.timePlaying || 0,
        currentKit: hg.defaultkit || hg.auto_spawn_kit || 'None'
    };

    const starCosts = {
        'assassin': 10000, 'wobbuffet': 20000, 'vaulthunter': 15000, 'witherwarrior': 10000,
        'gremlin': 5000, 'roulette': 10000, 'invoker': 10000, 'ironman': 10000,
        'nuke': 15000, 'ninja': 5000, 'robinhood': 10000, 'supplies': 10000,
        'shotgun': 20000, 'koolmove': 20000, 'lockdown': 5000, 'time_warp': 10000,
        'acid_rain': 15000, 'infection': 15000, 'pickpocket': 5000, 'ragnarok': 10000,
        'gladiator': 10000, 'zookeeper': 10000, 'switcheroo': 10000
    };
    const starsUnlocked = [];
    for (const p of packages) {
        if (starCosts[p]) starsUnlocked.push(p);
    }
    responseData.blitzStars = starsUnlocked;
    
    const kitList = ["horsetamer", "ranger", "archer", "astronaut", "troll", "meatmaster", "reaper", "shark", "reddragon", "toxicologist", "donkeytamer", "rogue", "warlock", "slimeyslime", "jockey", "golem", "viking", "speleologist", "shadow knight", "baker", "knight", "pigman", "guardian", "phoenix", "paladin", "necromancer", "scout", "hunter", "warrior", "hype train", "fisherman", "milkman", "florist", "diver", "arachnologist", "blaze", "wolftamer", "tim", "snowman", "rambo", "farmer", "armorer", "creepertamer"];
    const defaultKits = new Set(["armorer", "meatmaster", "archer", "baker", "fisherman", "hunter", "knight", "ranger", "scout", "speleologist", "rambo", "guardian", "hype train"]);
    const ultimateKits = new Set(["phoenix", "warrior", "donkeytamer", "milkman", "ranger"]);
    
    for (const kit of kitList) {
        let level = defaultKits.has(kit) ? 1 : 0;
        if (packages.includes(kit)) level = 1; 
        for (let i = 1; i <= 9; i++) {
            if (packages.includes(`${kit}_${i}`)) level = i + 1;
        }
        
        if (hg[kit] !== undefined && (hg[kit] + 1) > level) {
            level = hg[kit] + 1;
        }
        
        if (ultimateKits.has(kit)) {
            const xp = hg[`exp_${kit}`];
            if (xp !== undefined) {
                if (level === 0) level = 1;
                if (xp >= 10000) level = 10;
                else if (xp >= 5000) level = 9;
                else if (xp >= 2500) level = 8;
                else if (xp >= 2000) level = 7;
                else if (xp >= 1500) level = 6;
                else if (xp >= 1000) level = 5;
                else if (xp >= 500) level = 4;
                else if (xp >= 250) level = 3;
                else if (xp >= 100) level = 2;
            }
        }
        
        const safeName = kit.replace(/\s+/g, '');
        let pLvl = hg[`p${safeName}`] || 0;
        if (pLvl >= 2 && level === 10) level = 11; 
        
        blitzKits[safeName] = level;
        blitzPrestiges[safeName] = pLvl;

        const kitLower = kit.toLowerCase();
        const kitWinsSolo = hg[`wins_${kitLower}`] || hg[`${kitLower}_wins`] || 0;
        const kitWinsTeams = hg[`wins_teams_${kitLower}`] || hg[`${kitLower}_wins_teams`] || 0;
        const kitWinsTotal = kitWinsSolo + kitWinsTeams;
        const kitGames = hg[`games_played_${kitLower}`] || hg[`games_${kitLower}`] || 0;
        
        // Formula: Losses = Games - Wins (Treating Deaths as Losses for KD Math)
        let kitLosses = kitGames - kitWinsTotal;
        if (kitLosses < 0) kitLosses = 0; 

        kitStats[safeName] = {
            kills: hg[`kills_${kitLower}`] || hg[`${kitLower}_kills`] || 0,
            losses: kitLosses,
            wins: kitWinsTotal,
            timePlayed: hg[`time_played_${kitLower}`] || hg[`timePlaying_${kitLower}`] || 0
        };
    }
    
    responseData.blitzKits = blitzKits;
    responseData.blitzPrestiges = blitzPrestiges;
    responseData.kitStats = kitStats;

    return res.status(200).json(responseData);

  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
