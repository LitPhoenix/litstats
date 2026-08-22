const fs = require('fs');
const path = require('path');

// Support both local Node.js fetch and older environments
const fetch = require('node-fetch') || global.fetch; 

const NADESHIKO_URL = 'https://www.nadeshiko.io/leaderboard/NETWORK_ACHIEVEMENT_POINTS';
const DATA_FILE = path.join(__dirname, '../ap_hunters_data.json');
const ARCHIVE_FILE = path.join(__dirname, '../ap_history_archive.json');
const HYPIXEL_KEY = process.env.HYPIXEL_API_KEY;

// Max Games Calculation Logic (Mirrored from Vercel)
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
    { names: ["summer", "christmas", "easter", "halloween"], badge: "Max Seasonal" },
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

// Custom Fetch to handle random API HTML drops
async function fetchSafeJSON(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      try {
        return JSON.parse(text); 
      } catch (err) {
        throw new Error(`API returned invalid JSON`);
      }
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function update() {
  console.log("🚀 Starting Daily AP Update...");

  if (!HYPIXEL_KEY) {
    console.error("❌ HYPIXEL_API_KEY is missing from environment variables!");
    process.exit(1);
  }

  let db;
  try {
    db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error("❌ Could not load existing data. Starting fresh.");
    db = { manual_country_mapping: {}, month_start_snapshot: {}, country_leaderboard: [] };
  }

  let archive = {};
  try {
    if (fs.existsSync(ARCHIVE_FILE)) {
      archive = JSON.parse(fs.readFileSync(ARCHIVE_FILE, 'utf8'));
    }
  } catch (e) {
    archive = {};
  }

  console.log("🌐 Fetching Nadeshiko Top 200...");
  const nadeshikoPlayers = [];

  try {
    for (let page = 1; page <= 2; page++) {
      const response = await fetch(`${NADESHIKO_URL}?page=${page}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!response.ok) throw new Error(`Nadeshiko HTTP ${response.status}`);
      const json = await response.json();
      nadeshikoPlayers.push(...json.data);
    }
  } catch (e) {
    console.error("Critical failure fetching Nadeshiko: ", e);
    process.exit(1);
  }

  console.log(`✅ Got ${nadeshikoPlayers.length} players from Nadeshiko.`);
  
  console.log("🌐 Fetching Global Achievements Template...");
  let achievementsMap = {};
  try {
    const achTemplate = await fetchSafeJSON('https://api.hypixel.net/v2/resources/achievements');
    if (achTemplate.success) achievementsMap = achTemplate.achievements;
  } catch (e) {
    console.error("Failed to load Hypixel Achievements Template. Max games will not calculate.");
  }

  console.log("🌐 Fetching Live Hypixel Data...");
  const freshPlayers = [];

  for (let i = 0; i < nadeshikoPlayers.length; i++) {
    const p = nadeshikoPlayers[i];
    let maxesArray = [];
    
    try {
      const hypixelData = await fetchSafeJSON(`https://api.hypixel.net/v2/player?uuid=${p.uuid}`, {
        headers: { 'API-Key': HYPIXEL_KEY }
      });

      if (hypixelData && hypixelData.success && hypixelData.player) {
        if (Object.keys(achievementsMap).length > 0) {
            maxesArray = calculateMaxes(hypixelData.player, achievementsMap);
        }

        freshPlayers.push({
          uuid: p.uuid,
          username: hypixelData.player.displayname || p.tagged_name.replace(/§./g, '').replace(/\[.*?\]/g, '').trim(),
          value: hypixelData.player.achievementPoints || parseFloat(p.value),
          maxGames: maxesArray
        });
      } else {
        freshPlayers.push({
          uuid: p.uuid,
          username: p.tagged_name.replace(/§./g, '').replace(/\[.*?\]/g, '').trim(),
          value: parseFloat(p.value),
          maxGames: []
        });
      }
    } catch (error) {
      freshPlayers.push({
        uuid: p.uuid,
        username: p.tagged_name.replace(/§./g, '').replace(/\[.*?\]/g, '').trim(),
        value: parseFloat(p.value),
        maxGames: []
      });
    }

    await new Promise(r => setTimeout(r, 250));
    if ((i + 1) % 50 === 0) console.log(`⏳ Processed ${i + 1}/200 players...`);
  }

  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const lastUpdate = new Date(db.last_update || 0);
  
  if (today.getMonth() !== lastUpdate.getMonth()) {
    console.log("📅 New month detected! Resetting start-of-month snapshot.");
    db.month_start_snapshot = {}; 
    freshPlayers.forEach(p => { db.month_start_snapshot[p.uuid] = p.value; });
  }

  // Record daily history archive
  if (!archive[todayKey]) archive[todayKey] = {};
  freshPlayers.forEach(p => {
    archive[todayKey][p.uuid] = p.value;
  });

  const processedPlayers = freshPlayers.map(p => {
    if (!db.month_start_snapshot[p.uuid]) db.month_start_snapshot[p.uuid] = p.value;
    const startAP = db.month_start_snapshot[p.uuid];
    const gain = p.value - startAP;
    const countryCode = db.manual_country_mapping[p.uuid] || "Unknown";

    return {
      username: p.username,
      uuid: p.uuid,
      country: countryCode,
      current_ap: p.value,
      last_month_ap: startAP,
      monthly_gain: gain,
      maxGames: p.maxGames
    };
  });

  const countryMap = {};
  processedPlayers.forEach(player => {
    const c = player.country;
    if (!countryMap[c]) countryMap[c] = { country: c, top_players: [] };
    countryMap[c].top_players.push(player);
  });

  const sortedGlobal = [...processedPlayers].sort((a,b) => b.current_ap - a.current_ap);
  const baseline = sortedGlobal.length >= 100 ? sortedGlobal[99].current_ap : sortedGlobal[sortedGlobal.length - 1].current_ap;
  const weights = [1.0, 0.50, 0.25, 0.10, 0.05];

  const countryLeaderboardArray = Object.values(countryMap).map(countryObj => {
    countryObj.top_players.sort((a, b) => b.current_ap - a.current_ap);
    const top5 = countryObj.top_players.slice(0, 5);
    
    const score = top5.reduce((sum, p, i) => sum + (Math.max(0, p.current_ap - baseline) * weights[i]), 0);

    return {
      country: countryObj.country,
      score: Math.round(score), 
      top_players: countryObj.top_players
    };
  });

  db.last_update = today.toISOString();
  db.country_leaderboard = countryLeaderboardArray.sort((a,b) => b.score - a.score);

  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  fs.writeFileSync(ARCHIVE_FILE, JSON.stringify(archive, null, 2));
  console.log(`✅ Success! Processed ${processedPlayers.length} players. Wrote archive & database.`);
}

update();
