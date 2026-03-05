export default async function handler(req, res) {
  // 1. SECURITY BOUNCER: Define exactly which websites are allowed
  const allowedOrigins = [
    'https://litstats.com',
    'https://www.litstats.com',
    'https://litphoenix.github.io' // Added just in case you test on your raw GitHub Pages URL
  ];

  const requestOrigin = req.headers.origin;
  const requestReferer = req.headers.referer;

  // Check if the request comes from an allowed domain
  const isAllowed = allowedOrigins.includes(requestOrigin) || 
                    (requestReferer && allowedOrigins.some(o => requestReferer.startsWith(o)));

  // If someone visits the API directly in their browser URL bar, or tries to embed it on their own site, reject it.
  if (!isAllowed) {
    return res.status(403).json({ error: "Forbidden: API access restricted to litstats.com" });
  }

  // 2. Set strict CORS headers (Replacing the vulnerable '*')
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', requestOrigin || allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 3. Normal API Execution
  const { uuid } = req.query;
  if (!uuid) return res.status(400).json({ error: "Missing UUID parameter" });

  const API_KEY = process.env.HYPIXEL_API_KEY;

  try {
    // Fetch Player Data & Achievements Template concurrently
    const [playerRes, achRes] = await Promise.all([
      fetch(`https://api.hypixel.net/v2/player?uuid=${uuid}`, { headers: { 'API-Key': API_KEY } }),
      fetch('https://api.hypixel.net/v2/resources/achievements')
    ]);

    const playerData = await playerRes.json();
    const achData = await achRes.json();

    if (!playerData.success || !playerData.player) {
      return res.status(404).json({ error: "Player not found on Hypixel" });
    }

    const profile = playerData.player;
    const achievementsMap = achData.achievements;
    
    const maxes = calculateMaxes(profile, achievementsMap);

    // Set Edge Cache: Caches response globally for 10 mins (600s)
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

    return res.status(200).json({
      uuid: profile.uuid,
      username: profile.displayname,
      achievementPoints: profile.achievementPoints || 0,
      questsCompleted: profile.quests_completed || 0,
      maxGames: maxes
    });

  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// Translated Python Logic
// Translated Python Logic
function calculateMaxes(profile, achMap) {
  // Corrected mappings based on Hypixel API structure
  const aplist = [
    ["uhc", "Max UHC"], 
    ["pit", "Max Pit"], 
    ["walls3", "Max Mega Walls"], 
    ["skywars", "Max SkyWars"], 
    ["survivalgames", "Max Blitz"], // Hypixel internally calls Blitz 'survivalgames' or 'HungerGames'. The Achievements API uses 'survivalgames'.
    ["arena", "Max Arena Brawl"], 
    ["supersmash", "Max Smash Heroes"], 
    ["paintball", "Max Paintball"], 
    ["mcgo", "Max Cops and Crims"], // Hypixel internally calls CvC 'mcgo'
    ["quake", "Max Quake"], 
    ["skyblock", "Max SkyBlock"], 
    ["speeduhc", "Max Speed UHC"], 
    ["warlords", "Max Warlords"], 
    ["walls", "Max Walls"], 
    ["tntgames", "Max TNT Games"], 
    ["arcade", "Max Arcade"], 
    ["murdermystery", "Max Murder Mystery"], 
    ["vampirez", "Max VampireZ"], 
    ["bedwars", "Max Bed Wars"], 
    ["gingerbread", "Max TKR"], // Hypixel internally calls TKR 'gingerbread'
    ["woolgames", "Max Wool Games"], 
    ["duels", "Max Duels"], 
    ["buildbattle", "Max Build Battle"], 
    ["holiday", "Max Seasonal"], // Hypixel internally calls Seasonal 'holiday'
    ["truecombat", "Max Crazy Walls"], 
    ["skyclash", "Max SkyClash"]
  ];

  let maxes = [];
  const oneTimePlayer = profile.achievementsOneTime || [];
  const tieredPlayer = profile.achievements || {};

  for (let i = 0; i < aplist.length; i++) {
    const apgame = aplist[i][0];
    const apgamename = aplist[i][1];
    
    // SkyClash and Crazy Walls (truecombat) are legacy games.
    const includelegacy = ["skyclash", "truecombat"].includes(apgame);
    let tempgive = true;

    const gameData = achMap[apgame];
    
    // If the game data doesn't exist in the achievements resource, skip it.
    if (!gameData) continue;

    // Check One Time Achievements
    if (gameData.one_time) {
      for (const y in gameData.one_time) {
        const apdata = `${apgame}_${y.toLowerCase()}`;
        const legacy = gameData.one_time[y].legacy || false;

        // If the player doesn't have the achievement, AND it's not a legacy achievement 
        // (unless we explicitly include legacy for this game), they fail.
        if (!oneTimePlayer.includes(apdata) && (!legacy || includelegacy)) {
          tempgive = false;
          break; // Stop checking this game
        }
      }
    }

    // Check Tiered Achievements
    if (tempgive && gameData.tiered) {
      for (const y in gameData.tiered) {
        const apdata = `${apgame}_${y.toLowerCase()}`;
        const playerap = tieredPlayer[apdata] || 0;
        const legacy = gameData.tiered[y].legacy || false;
        
        const tiers = gameData.tiered[y].tiers;
        
        // Find the maximum amount required for the highest tier of this achievement
        let required_amount = 0;
        for(let t = 0; t < tiers.length; t++) {
            if(tiers[t].amount > required_amount) {
                required_amount = tiers[t].amount;
            }
        }

        // If the player's amount is less than the required amount, AND it's not a legacy achievement
        // (unless we explicitly include legacy for this game), they fail.
        if (playerap < required_amount && (!legacy || includelegacy)) {
          tempgive = false;
          break; // Stop checking this game
        }
      }
    }

    // If they passed all non-legacy checks (or all checks for legacy games), they get the max badge!
    if (tempgive) {
      maxes.push(apgamename);
    }
  }
  return maxes;
}
