const fs = require('fs');
const path = require('path');

// 1. CONFIGURATION
const NADESHIKO_URL = 'https://www.nadeshiko.io/api/leaderboard/NETWORK_ACHIEVEMENT_POINTS?page=1';
const DATA_FILE = path.join(__dirname, '../ap_hunters_data.json');

async function update() {
    console.log("🚀 Starting Daily Update...");

    // 2. LOAD EXISTING DATA
    // We need to load this to get your manual country mappings and history
    let db;
    try {
        db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        console.error("❌ Could not load existing data. Starting fresh.");
        db = { manual_country_mapping: {}, month_start_snapshot: {}, country_leaderboard: [] };
    }

    // 3. FETCH FLAT DATA (From Nadeshiko)
    console.log("🌐 Fetching Nadeshiko...");
    const response = await fetch(NADESHIKO_URL);
    const json = await response.json();
    const freshPlayers = json.data; 

    // 4. MONTHLY SNAPSHOT LOGIC
    // We check if we need to reset the "Start of Month" scores
    const today = new Date();
    const lastUpdate = new Date(db.last_update || 0);
    
    // Simple check: Is the month different from the last update?
    if (today.getMonth() !== lastUpdate.getMonth()) {
        console.log("📅 New month detected! Resetting start-of-month snapshot.");
        db.month_start_snapshot = {}; // Clear old history
        
        // Snapshot everyone's CURRENT score as their START score
        freshPlayers.forEach(p => {
            db.month_start_snapshot[p.uuid] = parseFloat(p.value);
        });
    }

    // 5. TRANSFORM PLAYERS
    // Map Nadeshiko format -> LitStats format
    const processedPlayers = freshPlayers.map(p => {
        const currentAP = parseFloat(p.value);
        
        // 5a. Calculate Gain
        // If player isn't in snapshot, add them now.
        if (!db.month_start_snapshot[p.uuid]) {
            db.month_start_snapshot[p.uuid] = currentAP;
        }
        const startAP = db.month_start_snapshot[p.uuid];
        const gain = currentAP - startAP;

        // 5b. Clean Username (Remove [MVP+] ranks)
        // Nadeshiko gives "§b[MVP§c+§b] Name". We need just "Name".
        const cleanName = p.tagged_name.replace(/§./g, '').replace(/\[.*?\]/g, '').trim();

        // 5c. Resolve Country
        const countryCode = db.manual_country_mapping[p.uuid] || "Unknown";

        return {
            username: cleanName,     // Index.html expects 'username'
            uuid: p.uuid,
            country: countryCode,    // Index.html expects 'country'
            current_ap: currentAP,   // Index.html expects 'current_ap'
            last_month_ap: startAP,  // Index.html uses this for positioning
            monthly_gain: gain       // Index.html expects 'monthly_gain'
        };
    });

    // 6. GROUP BY COUNTRY & CALCULATE SCORES
    const countryMap = {};

    processedPlayers.forEach(player => {
        const c = player.country;
        if (!countryMap[c]) {
            countryMap[c] = { country: c, top_players: [] };
        }
        countryMap[c].top_players.push(player);
    });

    // Convert Map to Array and Calculate Country Scores
    const countryLeaderboardArray = Object.values(countryMap).map(countryObj => {
        // Sort players by AP descending
        countryObj.top_players.sort((a, b) => b.current_ap - a.current_ap);

        // Calculate Score: Average AP of top 5 players
        const top5 = countryObj.top_players.slice(0, 5);
        const totalAP = top5.reduce((sum, p) => sum + p.current_ap, 0);
        const avgScore = top5.length > 0 ? (totalAP / 5) : 0;

        return {
            country: countryObj.country,
            score: avgScore, // Index.html uses this to sort countries
            top_players: countryObj.top_players
        };
    });

    // 7. SAVE EVERYTHING
    // We update the 'country_leaderboard' for the frontend, but keep mappings/snapshots safe
    db.last_update = today.toISOString();
    db.country_leaderboard = countryLeaderboardArray;

    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    console.log(`✅ Success! Processed ${processedPlayers.length} players into ${countryLeaderboardArray.length} countries.`);
}

update();
