const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// 1. CONFIGURATION
const NADESHIKO_URL = 'https://www.nadeshiko.io/leaderboard/NETWORK_ACHIEVEMENT_POINTS';
const DATA_FILE = path.join(__dirname, '../ap_hunters_data.json');
const HYPIXEL_KEY = process.env.HYPIXEL_API_KEY;

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

    // 2. FETCH TOP 200 FROM NADESHIKO (Page 1 & 2)
    console.log("🌐 Fetching Nadeshiko Top 200...");
    const nadeshikoPlayers = [];

    for (let page = 1; page <= 2; page++) {
        const response = await fetch(`${NADESHIKO_URL}?page=${page}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
        });
        if (!response.ok) throw new Error(`Nadeshiko returned status: ${response.status}`);
        const json = await response.json();
        nadeshikoPlayers.push(...json.data);
    }

    console.log(`✅ Got ${nadeshikoPlayers.length} players from Nadeshiko.`);
    console.log("🌐 Fetching Live Hypixel Data (This will take ~50 seconds)...");

    const freshPlayers = [];

    // 3. LIVE HYPIXEL API CHECK
    for (let i = 0; i < nadeshikoPlayers.length; i++) {
        const p = nadeshikoPlayers[i];
        
        try {
            const hypixelRes = await fetch(`https://api.hypixel.net/v2/player?uuid=${p.uuid}`, {
                headers: { 'API-Key': HYPIXEL_KEY }
            });

            if (hypixelRes.ok) {
                const hypixelData = await hypixelRes.json();
                
                if (hypixelData.success && hypixelData.player) {
                    freshPlayers.push({
                        uuid: p.uuid,
                        username: hypixelData.player.displayname || p.tagged_name.replace(/§./g, '').replace(/\[.*?\]/g, '').trim(),
                        value: hypixelData.player.achievementPoints || parseFloat(p.value)
                    });
                } else {
                    // Fallback to Nadeshiko data if player API fails
                    freshPlayers.push({
                        uuid: p.uuid,
                        username: p.tagged_name.replace(/§./g, '').replace(/\[.*?\]/g, '').trim(),
                        value: parseFloat(p.value)
                    });
                }
            } else {
                freshPlayers.push({
                    uuid: p.uuid,
                    username: p.tagged_name.replace(/§./g, '').replace(/\[.*?\]/g, '').trim(),
                    value: parseFloat(p.value)
                });
            }
        } catch (error) {
            freshPlayers.push({
                uuid: p.uuid,
                username: p.tagged_name.replace(/§./g, '').replace(/\[.*?\]/g, '').trim(),
                value: parseFloat(p.value)
            });
        }

        // CRUCIAL: 250ms delay limits us to 4 requests/sec. Hypixel limit is 300/5mins (1 per sec average).
        await new Promise(r => setTimeout(r, 250));
        
        if ((i + 1) % 50 === 0) console.log(`⏳ Processed ${i + 1}/200 players...`);
    }

    // 4. MONTHLY SNAPSHOT LOGIC
    const today = new Date();
    const lastUpdate = new Date(db.last_update || 0);
    
    if (today.getMonth() !== lastUpdate.getMonth()) {
        console.log("📅 New month detected! Resetting start-of-month snapshot.");
        db.month_start_snapshot = {}; 
        
        freshPlayers.forEach(p => {
            db.month_start_snapshot[p.uuid] = p.value;
        });
    }

    // 5. TRANSFORM PLAYERS
    const processedPlayers = freshPlayers.map(p => {
        if (!db.month_start_snapshot[p.uuid]) {
            db.month_start_snapshot[p.uuid] = p.value;
        }
        const startAP = db.month_start_snapshot[p.uuid];
        const gain = p.value - startAP;
        const countryCode = db.manual_country_mapping[p.uuid] || "Unknown";

        return {
            username: p.username,
            uuid: p.uuid,
            country: countryCode,
            current_ap: p.value,
            last_month_ap: startAP,
            monthly_gain: gain
        };
    });

    // 6. GROUP BY COUNTRY & CALCULATE SCORES
    const countryMap = {};

    processedPlayers.forEach(player => {
        const c = player.country;
        if (!countryMap[c]) countryMap[c] = { country: c, top_players: [] };
        countryMap[c].top_players.push(player);
    });

    const countryLeaderboardArray = Object.values(countryMap).map(countryObj => {
        countryObj.top_players.sort((a, b) => b.current_ap - a.current_ap);

        const top5 = countryObj.top_players.slice(0, 5);
        const totalAP = top5.reduce((sum, p) => sum + p.current_ap, 0);
        const avgScore = top5.length > 0 ? (totalAP / 5) : 0;

        return {
            country: countryObj.country,
            score: avgScore, 
            top_players: countryObj.top_players
        };
    });

    // 7. SAVE EVERYTHING
    db.last_update = today.toISOString();
    db.country_leaderboard = countryLeaderboardArray;

    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    console.log(`✅ Success! Processed ${processedPlayers.length} players into ${countryLeaderboardArray.length} countries.`);
}

update();
