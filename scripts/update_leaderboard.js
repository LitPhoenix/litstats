const fs = require('fs');
const path = require('path');

// 1. CONFIGURATION
const NADESHIKO_URL = 'https://www.nadeshiko.io/api/leaderboard/NETWORK_ACHIEVEMENT_POINTS?page=1';
const DATA_FILE = path.join(__dirname, '../ap_hunters_data.json');

async function update() {
    console.log("🚀 Starting Daily Update...");

    // 2. LOAD EXISTING DATA
    // We need this to remember your manual country tags and the monthly snapshot
    let db;
    try {
        db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        db = { 
            manual_country_mapping: {}, 
            month_start_snapshot: {}, 
            country_leaderboard: [] 
        };
    }

    // 3. FETCH NADESHIKO
    console.log("Fetching Nadeshiko...");
    const response = await fetch(NADESHIKO_URL);
    const json = await response.json();
    const freshPlayers = json.data; 

    // 4. CHECK FOR NEW MONTH
    const today = new Date();
    const lastUpdate = new Date(db.last_update || 0);
    const isNewMonth = today.getMonth() !== lastUpdate.getMonth();

    if (isNewMonth) {
        console.log("New month! Resetting snapshots.");
        db.month_start_snapshot = {};
        freshPlayers.forEach(p => {
            db.month_start_snapshot[p.uuid] = parseFloat(p.value);
        });
    }

    // 5. PROCESS PLAYERS & CALCULATE GAINS
    const processedPlayers = freshPlayers.map(p => {
        const currentAP = parseFloat(p.value);
        
        // Determine Start AP (for gain calculation)
        if (!db.month_start_snapshot[p.uuid]) {
            db.month_start_snapshot[p.uuid] = currentAP; // Track new players
        }
        const startAP = db.month_start_snapshot[p.uuid];
        const gain = currentAP - startAP;

        return {
            username: p.tagged_name.replace(/§./g, '').trim(), // Your HTML uses 'username'
            uuid: p.uuid,
            current_ap: currentAP, // Your HTML uses 'current_ap'
            last_month_ap: startAP, // Your HTML uses this for rank change calculation
            monthly_gain: gain,
            // Check manual map, default to Unknown
            country: db.manual_country_mapping[p.uuid] || "Unknown" 
        };
    });

    // 6. GROUP BY COUNTRY (This is the format your HTML expects)
    const countryMap = {};

    processedPlayers.forEach(player => {
        const countryName = player.country;
        if (!countryMap[countryName]) {
            countryMap[countryName] = {
                country: countryName,
                top_players: []
            };
        }
        countryMap[countryName].top_players.push(player);
    });

    // Convert map to array
    const countryLeaderboardArray = Object.values(countryMap);

    // 7. SAVE UPDATE
    db.last_update = today.toISOString();
    db.country_leaderboard = countryLeaderboardArray;

    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    console.log(`✅ Saved ${processedPlayers.length} players across ${countryLeaderboardArray.length} countries.`);
}

update();
