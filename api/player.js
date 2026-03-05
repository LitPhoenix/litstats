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

  // 2. Set strict CORS headers
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
  // 1. The Hypixel Bug Fix
  // Safely extract One-Time achievements, ignoring corrupted non-string entries
  const rawOneTime = profile.achievementsOneTime || [];
  const cleanOneTime = [];
  for (let i = 0; i < rawOneTime.length; i++) {
    if (typeof rawOneTime[i] === 'string') {
      cleanOneTime.push(rawOneTime[i]);
    }
  }

  const tieredPlayer = profile.achievements || {};

  // 2. Dictionary Mapping (Fixed Blitz and CvC names)
  const gameMappings = [
    { names: ["uhc"], badge: "Max UHC" },
    { names: ["pit"], badge: "Max Pit" },
    { names: ["walls3"], badge: "Max Mega Walls" },
    { names: ["skywars"], badge: "Max SkyWars" },
    { names: ["blitz"], badge: "Max Blitz" }, // Fixed: Changed from 'survivalgames' to 'blitz'
    { names: ["arena"], badge: "Max Arena Brawl" },
    { names: ["supersmash"], badge: "Max Smash Heroes" },
    { names: ["paintball"], badge: "Max Paintball" },
    { names: ["copsandcrims"], badge: "Max Cops and Crims" }, // Fixed: Changed from 'mcgo' to 'copsandcrims'
    { names: ["quake"], badge: "Max Quake" },
    { names: ["skyblock"], badge: "Max SkyBlock" },
    { names: ["speeduhc"], badge: "Max Speed UHC" },
    { names: ["warlords"], badge: "Max Warlords" },
    { names: ["walls"], badge: "Max Walls" },
    { names: ["tntgames"], badge: "Max TNT Games" },
    { names: ["arcade"], badge: "Max Arcade" },
    { names: ["murdermystery"], badge: "Max Murder Mystery" },
    { names: ["vampirez"], badge: "Max VampireZ" },
    { names: ["bedwars"], badge: "Max Bed Wars" },
    { names: ["gingerbread"], badge: "Max TKR" },
    { names: ["woolgames"], badge: "Max Wool Games" },
    { names: ["duels"], badge: "Max Duels" },
    { names: ["buildbattle"], badge: "Max Build Battle" },
    { names: ["easter", "christmas2017", "halloween2017", "summer"], badge: "Max Seasonal" },
    { names: ["truecombat"], badge: "Max Crazy Walls", isLegacyGame: true },
    { names: ["skyclash"], badge: "Max SkyClash", isLegacyGame: true }
  ];

  let maxes = [];

  for (const group of gameMappings) {
    let hasMaxedGroup = true;

    for (const apgame of group.names) {
      const gameData = achMap[apgame];
      
      // FAIL CLOSED LOGIC FIX: Deny the badge if the game doesn't exist.
      if (!gameData) {
        hasMaxedGroup = false;
        break;
      }

      // 3. Process One-Time Achievements
      if (gameData.one_time) {
        for (const key in gameData.one_time) {
          const achInfo = gameData.one_time[key];
          
          // Skip legacy achievements unless the game itself is a legacy game
          if (achInfo.legacy && !group.isLegacyGame) {
            continue;
          }

          const apdata = `${apgame}_${key.toLowerCase()}`;
          if (!cleanOneTime.includes(apdata)) {
            hasMaxedGroup = false;
            break;
          }
        }
      }

      if (!hasMaxedGroup) break;

      // 4. Process Tiered Achievements
      if (gameData.tiered) {
        for (const key in gameData.tiered) {
          const achInfo = gameData.tiered[key];

          // Skip legacy achievements unless the game itself is a legacy game
          if (achInfo.legacy && !group.isLegacyGame) {
            continue;
          }

          const apdata = `${apgame}_${key.toLowerCase()}`;
          const playerap = tieredPlayer[apdata] || 0;
          
          // Dynamically find the highest tier amount
          let maxTierAmount = 0;
          if (achInfo.tiers && Array.isArray(achInfo.tiers)) {
            for (const tier of achInfo.tiers) {
              if (tier.amount > maxTierAmount) {
                maxTierAmount = tier.amount;
              }
            }
          }

          if (playerap < maxTierAmount) {
            hasMaxedGroup = false;
            break;
          }
        }
      }

      if (!hasMaxedGroup) break;
    }

    // 5. Award Badge
    if (hasMaxedGroup) {
      maxes.push(group.badge);
    }
  }

  return maxes;
}
