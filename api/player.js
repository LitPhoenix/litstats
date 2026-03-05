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
function calculateMaxes(profile, achMap) {
  const aplist = [
    ["uhc", "Max UHC"], ["pit", "Max Pit"], ["walls3", "Max Mega Walls"], 
    ["skywars", "Max SkyWars"], ["survivalgames", "Max Blitz"], 
    ["arena", "Max Arena Brawl"], ["supersmash", "Max Smash Heroes"], 
    ["paintball", "Max Paintball"], ["mcgo", "Max Cops and Crims"], 
    ["quake", "Max Quake"], ["skyblock", "Max SkyBlock"], 
    ["speeduhc", "Max Speed UHC"], ["warlords", "Max Warlords"], 
    ["walls", "Max Walls"], ["tntgames", "Max TNT Games"], 
    ["arcade", "Max Arcade"], ["murdermystery", "Max Murder Mystery"], 
    ["vampirez", "Max VampireZ"], ["bedwars", "Max Bed Wars"], 
    ["gingerbread", "Max TKR"], ["woolgames", "Max Wool Games"], 
    ["duels", "Max Duels"], ["buildbattle", "Max Build Battle"], 
    ["holiday", "Max Seasonal"], ["truecombat", "Max Crazy Walls"], 
    ["skyclash", "Max SkyClash"]
  ];

  let maxes = [];
  const oneTimePlayer = profile.achievementsOneTime || [];
  const tieredPlayer = profile.achievements || {};

  for (let i = 0; i < aplist.length; i++) {
    const apgame = aplist[i][0];
    const apgamename = aplist[i][1];
    const includelegacy = ["skyclash", "truecombat"].includes(apgame);
    let tempgive = true;

    const gameData = achMap[apgame];
    if (!gameData) continue;

    // FIX: Handle Hypixel API naming inconsistencies
    let prefix = `${apgame}_`;
    if (apgame === "survivalgames") prefix = "blitz_";
    if (apgame === "mcgo") prefix = "copsandcrims_";
    if (apgame === "holiday") prefix = ""; 

    if (gameData.one_time) {
      for (const y in gameData.one_time) {
        const apdata = `${prefix}${y.toLowerCase()}`;
        const legacy = gameData.one_time[y].legacy || false;

        if (!oneTimePlayer.includes(apdata) && (!legacy || includelegacy)) {
          tempgive = false;
          break;
        }
      }
    }

    if (tempgive && gameData.tiered) {
      for (const y in gameData.tiered) {
        const apdata = `${prefix}${y.toLowerCase()}`;
        const playerap = tieredPlayer[apdata] || 0;
        const legacy = gameData.tiered[y].legacy || false;
        
        const tiers = gameData.tiered[y].tiers;
        const required_amount = tiers[tiers.length - 1].amount;

        if (playerap < required_amount && (!legacy || includelegacy)) {
          tempgive = false;
          break;
        }
      }
    }

    if (tempgive) {
      maxes.push(apgamename);
    }
  }
  return maxes;
}
