const fs = require('fs');

const API_KEY = process.env.HYPIXEL_API_KEY;

function calculateMaxes(profile, achMap) {
  const rawOneTime = profile.achievementsOneTime || [];
  const cleanOneTime = rawOneTime.filter(item => typeof item === 'string');
  const tieredPlayer = profile.achievements || {};

  const gameMappings = [
    { names: ["uhc"], badge: "Max UHC" },
    { names: ["pit"], badge: "Max Pit" },
    { names: ["walls3"], badge: "Max Mega Walls" },
    { names: ["skywars"], badge: "Max SkyWars" },
    { names: ["blitz"], badge: "Max Blitz" },
    { names: ["arena"], badge: "Max Arena Brawl" },
    { names: ["supersmash"], badge: "Max Smash Heroes" },
    { names: ["paintball"], badge: "Max Paintball" },
    { names: ["copsandcrims"], badge: "Max Cops and Crims" },
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
      if (!gameData) { hasMaxedGroup = false; break; }

      if (gameData.one_time) {
        for (const key in gameData.one_time) {
          const achInfo = gameData.one_time[key];
          if (achInfo.legacy && !group.isLegacyGame) continue;
          if (!cleanOneTime.includes(`${apgame}_${key.toLowerCase()}`)) {
            hasMaxedGroup = false; break;
          }
        }
      }
      if (!hasMaxedGroup) break;

      if (gameData.tiered) {
        for (const key in gameData.tiered) {
          const achInfo = gameData.tiered[key];
          if (achInfo.legacy && !group.isLegacyGame) continue;
          let maxTierAmount = 0;
          if (achInfo.tiers && Array.isArray(achInfo.tiers)) {
            for (const tier of achInfo.tiers) {
              if (tier.amount > maxTierAmount) maxTierAmount = tier.amount;
            }
          }
          if ((tieredPlayer[`${apgame}_${key.toLowerCase()}`] || 0) < maxTierAmount) {
            hasMaxedGroup = false; break;
          }
        }
      }
      if (!hasMaxedGroup) break;
    }
    if (hasMaxedGroup) maxes.push(group.badge);
  }
  return maxes;
}

// HIGHLY ROBUST FETCH WITH HTML ERROR CATCHING
async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1))); 
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const text = await res.text();
      try {
        return JSON.parse(text); // Try parsing JSON safely
      } catch (err) {
        throw new Error(`API returned invalid JSON (HTML page)`);
      }
    } catch (e) {
      console.warn(`Attempt ${i+1} failed for ${url}: ${e.message}`);
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function run() {
  try {
    const [nadRes, achMapRes] = await Promise.all([
      fetchWithRetry('https://nadeshiko.io/api/leaderboard/achievement_points'),
      fetchWithRetry('https://api.hypixel.net/v2/resources/achievements')
    ]);

    const topPlayers = nadRes.slice(0, 200);
    const achievementsMap = achMapRes.achievements;

    let oldData = { month_start_snapshot: {}, country_leaderboard: [] };
    if (fs.existsSync('ap_hunters_data.json')) {
      try { oldData = JSON.parse(fs.readFileSync('ap_hunters_data.json', 'utf8')); } 
      catch (e) {}
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    if (oldData.current_month !== currentMonth) {
      oldData.month_start_snapshot = {};
      oldData.current_month = currentMonth;
    }

    const livePlayers = [];

    for (let i = 0; i < topPlayers.length; i++) {
      const uuid = topPlayers[i].uuid;
      const cachedPlayer = oldData.country_leaderboard.flatMap(c => c.top_players).find(p => p.uuid === uuid);
      const startAP = oldData.month_start_snapshot[uuid];

      try {
        const playerData = await fetchWithRetry(`https://api.hypixel.net/v2/player?uuid=${uuid}`, { headers: { 'API-Key': API_KEY } });
        
        if (playerData.success && playerData.player) {
          const profile = playerData.player;
          const liveAP = profile.achievementPoints || 0;
          
          if (startAP === undefined) oldData.month_start_snapshot[uuid] = liveAP;
          const finalStartAP = oldData.month_start_snapshot[uuid];
          const monthlyGain = finalStartAP === liveAP && cachedPlayer ? cachedPlayer.monthly_gain : (liveAP - finalStartAP);

          const playerMaxes = calculateMaxes(profile, achievementsMap);

          livePlayers.push({
            uuid: profile.uuid,
            username: profile.displayname || topPlayers[i].name,
            country: topPlayers[i].country || 'Unknown',
            current_ap: liveAP,
            monthly_gain: finalStartAP === liveAP && cachedPlayer && cachedPlayer.monthly_gain === "NEW" ? "NEW" : monthlyGain,
            maxGames: playerMaxes
          });
        } else {
           if (cachedPlayer) livePlayers.push(cachedPlayer);
        }
      } catch (err) {
        if (cachedPlayer) livePlayers.push(cachedPlayer);
      }
      await new Promise(r => setTimeout(r, 200)); 
    }

    const cMap = {};
    livePlayers.forEach(p => {
      if(!cMap[p.country]) cMap[p.country] = [];
      cMap[p.country].push(p);
    });

    const baseline = Math.min(...livePlayers.map(p => p.current_ap)) - 100;
    const weights = [1.0, 0.50, 0.25, 0.10, 0.05];

    const processedCountries = Object.keys(cMap).map(c => {
      cMap[c].sort((a,b) => b.current_ap - a.current_ap);
      const top5 = cMap[c].slice(0, 5);
      const score = top5.reduce((sum, p, i) => sum + (Math.max(0, p.current_ap - baseline) * weights[i]), 0);
      
      return { country: c, top_players: cMap[c], score: Math.round(score) };
    });

    const output = {
      last_update: new Date().toISOString(),
      current_month: currentMonth,
      month_start_snapshot: oldData.month_start_snapshot,
      country_leaderboard: processedCountries.sort((a,b) => b.score - a.score)
    };

    fs.writeFileSync('ap_hunters_data.json', JSON.stringify(output, null, 2));
  } catch (error) {
    console.error("Critical Error:", error);
    process.exit(1);
  }
}
run();
