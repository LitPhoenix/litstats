const fs = require('fs');
const path = require('path');

// 1. CONFIGURATION
// This is the direct API link Nadeshiko uses (returns JSON)
const NADESHIKO_URL = 'https://www.nadeshiko.io/api/leaderboard/NETWORK_ACHIEVEMENT_POINTS?page=1';
const DATA_FILE = path.join(__dirname, '../ap_hunters_data.json');

async function update() {
    console.log("🚀 Starting Daily Update...");

    // 2. LOAD EXISTING DATA (To keep our country map and history)
    let db;
    try {
        db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (e) {
        db = { manual_country_mapping: {}, month_start_snapshot: {}, global_top_100: [] };
    }

    // 3. FETCH NADESHIKO (No API Key needed)
    console.log("🌐 Fetching Nadeshiko...");
    const response = await fetch(NADESHIKO_URL);
    const json = await response.json();
    
    // Nadeshiko returns { count: 100000, data: [...] }
    const freshPlayers = json.data; 

    // 4. CHECK FOR NEW MONTH (To reset the tracker)
    const today = new Date();
    const lastUpdate = new Date(db.last_update || 0);
    const isNewMonth = today.getMonth() !== lastUpdate.getMonth();

    if (isNewMonth) {
        console.log("📅 It's a new month! Resetting snapshots.");
        db.month_start_snapshot = {}; // Clear old snapshots
        
        // Take a picture of everyone's score right now
        freshPlayers.forEach(p => {
            db.month_start_snapshot[p.uuid] = parseFloat(p.value);
        });
    }

    // 5. PROCESS PLAYERS
    const processedList = freshPlayers.map(p => {
        const currentAP = parseFloat(p.value);
        
        // If we don't have a snapshot for this month (new player?), assume start AP = current AP
        const startAP = db.month_start_snapshot[p.uuid] || currentAP;
        
        // Ensure they exist in the snapshot now so we track them tomorrow
        if (!db.month_start_snapshot[p.uuid]) {
            db.month_start_snapshot[p.uuid] = currentAP;
        }

        return {
            rank: p.ranking,
            name: p.tagged_name.replace(/§./g, '').trim(), // Remove Minecraft colors
            uuid: p.uuid,
            ap: currentAP,
            monthly_gain: currentAP - startAP,
            // Check our manual list for country, default to "Unknown"
            country: db.manual_country_mapping[p.uuid] || "Unknown" 
        };
    });

    // 6. SAVE UPDATE
    db.last_update = today.toISOString();
    db.global_top_100 = processedList;

    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    console.log("✅ Updated ap_hunters_data.json successfully.");
}

update();
