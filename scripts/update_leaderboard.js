const fs = require('fs');
const path = require('path');

// CONFIGURATION
const NADESHIKO_URL = 'https://www.nadeshiko.io/api/leaderboard/NETWORK_ACHIEVEMENT_POINTS?page=1';
const DATA_FILE = path.join(__dirname, '../ap_hunters_data.json');

async function update() {
    console.log("🚀 Starting Update...");

    // 1. LOAD DB (To keep manual countries & history)
    let db;
    try {
        db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        db = { manual_country_mapping: {}, month_start_snapshot: {}, players: [] };
    }

    // 2. FETCH NADESHIKO
    const response = await fetch(NADESHIKO_URL);
    const json = await response.json();
    const freshPlayers = json.data; 

    // 3. MONTH RESET LOGIC
    const today = new Date();
    const lastUpdate = new Date(db.last_update || 0);
    
    if (today.getMonth() !== lastUpdate.getMonth()) {
        console.log("📅 New month! Resetting gains.");
        db.month_start_snapshot = {}; 
        freshPlayers.forEach(p => db.month_start_snapshot[p.uuid] = parseFloat(p.value));
    }

    // 4. BUILD FLAT PLAYER LIST
    const newPlayerList = freshPlayers.map(p => {
        const currentAP = parseFloat(p.value);
        
        // Track stats for gain calc
        if (!db.month_start_snapshot[p.uuid]) {
            db.month_start_snapshot[p.uuid] = currentAP;
        }
        const startAP = db.month_start_snapshot[p.uuid];

        return {
            rank: p.ranking,
            name: p.tagged_name.replace(/§./g, '').replace(/\[.*?\]/g, '').trim(),
            uuid: p.uuid,
            ap: currentAP,
            gain: currentAP - startAP,
            // Tag Country (Default to 'Unknown' if not in manual map)
            country: db.manual_country_mapping[p.uuid] || "Unknown"
        };
    });

    // 5. SAVE
    db.last_update = today.toISOString();
    db.players = newPlayerList; // Saving as a simple flat list

    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    console.log(`✅ Saved ${newPlayerList.length} players.`);
}

update();
