const fs = require('fs');

async function runMonthlyArchive() {
  const dateKey = new Date().toISOString().slice(0, 7) + '-01'; // e.g., '2026-11-01'

  // 1. Fetch top 200 players (Adjust URL/API to match your source)
  const res = await fetch('https://api.litstats.com/top200');
  const top200 = await res.json();

  // 2. Load existing archive
  let archive = {};
  if (fs.existsSync('ap_history_archive.json')) {
    archive = JSON.parse(fs.readFileSync('ap_history_archive.json', 'utf8'));
  }

  // 3. Map UUID -> AP for this month
  const snapshot = {};
  top200.forEach(player => {
    snapshot[player.uuid] = player.achievementPoints;
  });

  // 4. Save snapshot under date key
  archive[dateKey] = snapshot;
  fs.writeFileSync('ap_history_archive.json', JSON.stringify(archive, null, 2));
  console.log(`Saved snapshot for ${dateKey}`);
}

runMonthlyArchive();