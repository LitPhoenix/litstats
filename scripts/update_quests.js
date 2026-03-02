const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const NADESHIKO_URL = 'https://www.nadeshiko.io/leaderboard/NETWORK_QUESTS_COMPLETED?page=1';
const DATA_FILE = path.join(__dirname, '../questers_data.json');

async function update() {
    console.log("🚀 Starting Daily Quest Update...");

    let db;
    try {
        db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        console.error("❌ Could not load existing data. Starting fresh.");
        db = { manual_country_mapping: {}, month_start_snapshot: {}, country_leaderboard: [] };
    }

    console.log("🌐 Fetching Nadeshiko Quests...");
    
    const response = await fetch(NADESHIKO_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`Nadeshiko returned status: ${response.status}`);
    }

    const json = await response.json();
    const freshPlayers = json.data; 

    const today = new Date();
    const lastUpdate = new Date(db.last_update || 0);
    
    if (today.getMonth() !== lastUpdate.getMonth()) {
        console.log("📅 New month detected! Resetting start-of-month snapshot.");
        db.month_start_snapshot = {};
        
        freshPlayers.forEach(p => {
            db.month_start_snapshot[p.uuid] = parseFloat(p.value);
        });
    }

    const processedPlayers = freshPlayers.map(p => {
        const currentQuests = parseFloat(p.value);
        
        if (!db.month_start_snapshot[p.uuid]) {
            db.month_start_snapshot[p.uuid] = currentQuests;
        }
        const startQuests = db.month_start_snapshot[p.uuid];
        const gain = currentQuests - startQuests;

        const cleanName = p.tagged_name.replace(/§./g, '').replace(/\[.*?\]/g, '').trim();
        const countryCode = db.manual_country_mapping[p.uuid] || "Unknown";

        return {
            username: cleanName,
            uuid: p.uuid,
            country: countryCode,
            current_quests: currentQuests,
            last_month_quests: startQuests,
            monthly_gain: gain
        };
    });

    const countryMap = {};

    processedPlayers.forEach(player => {
        const c = player.country;
        if (!countryMap[c]) {
            countryMap[c] = { country: c, top_players: [] };
        }
        countryMap[c].top_players.push(player);
    });

    const countryLeaderboardArray = Object.values(countryMap).map(countryObj => {
        countryObj.top_players.sort((a, b) => b.current_quests - a.current_quests);

        const top5 = countryObj.top_players.slice(0, 5);
        const totalQuests = top5.reduce((sum, p) => sum + p.current_quests, 0);
        const avgScore = top5.length > 0 ? (totalQuests / 5) : 0;

        return {
            country: countryObj.country,
            score: avgScore,
            top_players: countryObj.top_players
        };
    });

    db.last_update = today.toISOString();
    db.country_leaderboard = countryLeaderboardArray;

    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    console.log(`✅ Success! Processed ${processedPlayers.length} questers into ${countryLeaderboardArray.length} countries.`);
}

update();
