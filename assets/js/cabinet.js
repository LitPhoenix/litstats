let globalPlayerData = null;
let activeGameFilters = new Set();

function getPlusColourHex(colourName) {
    const colours = {
        'RED': '#FF5555', 'GOLD': '#FFAA00', 'GREEN': '#55FF55',
        'YELLOW': '#FFFF55', 'LIGHT_PURPLE': '#FF55FF', 'WHITE': '#FFFFFF',
        'BLUE': '#5555FF', 'DARK_GREEN': '#00AA00', 'DARK_RED': '#AA0000',
        'DARK_AQUA': '#00AAAA', 'DARK_PURPLE': '#AA00AA', 'DARK_GRAY': '#555555',
        'BLACK': '#000000', 'DARK_BLUE': '#0000AA'
    };
    return colours[colourName] || '#FF5555';
}

function formatRankText(rank, plusColour) {
    if (!rank || rank === 'NON') return '';
    const plusHex = getPlusColourHex(plusColour);
    
    if (rank === 'MVP_PLUS_PLUS' || rank.includes('++')) {
        return `<span style="color: #FFAA00; background: rgba(255, 170, 0, 0.1); padding: 2px 6px; border-radius: 4px;">[MVP<span style="color: ${plusHex}">++</span>]</span>`;
    } else if (rank === 'MVP_PLUS' || (rank.includes('+') && rank.includes('MVP'))) {
        return `<span style="color: #55FFFF; background: rgba(85, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px;">[MVP<span style="color: ${plusHex}">+</span>]</span>`;
    } else if (rank === 'MVP') {
        return `<span style="color: #55FFFF; background: rgba(85, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px;">[MVP]</span>`;
    } else if (rank === 'VIP_PLUS') {
        return `<span style="color: #55FF55; background: rgba(85, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px;">[VIP<span style="color: ${plusHex}">+</span>]</span>`;
    } else if (rank === 'VIP') {
        return `<span style="color: #55FF55; background: rgba(85, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px;">[VIP]</span>`;
    }
    return `<span style="color: #AAAAAA; background: rgba(170, 170, 170, 0.1); padding: 2px 6px; border-radius: 4px;">[${rank}]</span>`;
}

function populateFilters() {
    const container = document.getElementById('gameFilterContainer');
    if (!container || !globalPlayerData || !globalPlayerData.missingAchievements) return;
    
    const games = [...new Set(globalPlayerData.missingAchievements.map(a => a.game))].sort();
    
    let html = `<div class="checkbox-grid">`;
    games.forEach(g => { 
        html += `
          <label class="game-cb-label">
            <input type="checkbox" value="${g}" onchange="toggleGameFilter(this)">
            ${g}
          </label>
        `; 
    });
    html += `</div>`;
    container.innerHTML = html;
}

function toggleGameFilter(checkbox) {
    if (checkbox.checked) {
        activeGameFilters.add(checkbox.value);
        checkbox.parentElement.classList.add('active');
    } else {
        activeGameFilters.delete(checkbox.value);
        checkbox.parentElement.classList.remove('active');
    }
    renderTodoGrid();
}

function renderTodoGrid() {
    const container = document.getElementById('todo-grid');
    if (!globalPlayerData || !globalPlayerData.missingAchievements) return;

    let achs = [...globalPlayerData.missingAchievements];
    const sortVal = document.getElementById('sortFilter') ? document.getElementById('sortFilter').value : 'easiest';

    if (activeGameFilters.size > 0) {
        achs = achs.filter(a => activeGameFilters.has(a.game));
    }

    if (sortVal === 'easiest') achs.sort((a, b) => a.reward - b.reward);
    else achs.sort((a, b) => b.reward - a.reward);

    achs = achs.slice(0, 50);

    if (achs.length === 0) {
        container.innerHTML = `<span style="color:var(--text-3); padding: 20px; width: 100%; text-align: center;">No achievements match your filters.</span>`;
        return;
    }

    container.innerHTML = achs.map(ach => {
        let pct = ach.globalPercentage !== undefined ? Number(ach.globalPercentage).toFixed(1) : "0.0";
        let amountToReach = ach.nextTierAmount || ach.target || "?";
        let parsedDesc = ach.desc ? ach.desc.replace(/%%value%%/g, amountToReach) : "";
        
        return `
          <div class="ach-card">
            <span class="ach-percent">${pct}%</span>
            <div class="ach-card-header">
              <img src="${getGameIconUrl('Max ' + ach.game)}" class="todo-game-icon" onerror="this.style.display='none'">
              <span class="ach-game">${ach.game}</span>
            </div>
            <span class="ach-title">${ach.title}</span>
            <span class="ach-desc">${parsedDesc}</span>
            <span class="ach-reward">
              <img src="/img/diamond.png" alt="AP" style="width:14px; height:14px; object-fit:contain;"> 
              ${ach.reward} AP
            </span>
          </div>
        `;
    }).join('');
}

const MAX_POSSIBLE_AP = 32475; 
const TOTAL_GAMES = 26;

const trophyStructure = [
  { name: "4th Tier", classes: "legendary", games: ["Max UHC", "Max Pit", "Max Mega Walls", "Max SkyWars", "Max Blitz"] },
  { name: "3rd Tier", classes: "epic", games: ["Max Smash Heroes", "Max Cops and Crims", "Max Quake", "Max Paintball", "Max Arena Brawl"] },
  { name: "2nd Tier", classes: "rare", games: ["Max SkyBlock", "Max Speed UHC", "Max Warlords", "Max Walls", "Max TNT Games", "Max Arcade"] },
  { name: "1st Tier", classes: "common", games: ["Max Murder Mystery", "Max VampireZ", "Max Bed Wars", "Max TKR", "Max Wool Games", "Max Duels", "Max Build Battle"] },
  { name: "Time Limited", classes: "legacy", isLegacy: true, games: ["Max Seasonal", "Max Crazy Walls", "Max SkyClash"] }
];

function getGameIconUrl(gameName) {
  const iconMap = {
    "Max Seasonal": "seasonal.png",
    "Max Arcade": "Arcade-64.png", 
    "Max Bed Wars": "BedWars-64.png", 
    "Max Build Battle": "BuildBattle-64.png",
    "Max Cops and Crims": "CVC-64.png", 
    "Max Duels": "Duels-64.png", 
    "Max Mega Walls": "MegaWalls-64.png",
    "Max Murder Mystery": "MurderMystery-64.png", 
    "Max Pit": "Pit-64.png", 
    "Max Blitz": "SG-64.png",
    "Max SkyBlock": "SkyBlock-64.png", 
    "Max SkyWars": "Skywars-64.png", 
    "Max Smash Heroes": "SmashHeroes-64.png",
    "Max Speed UHC": "SpeedUHC-64.png",
    "Max TNT Games": "TNT-64.png", 
    "Max UHC": "UHC-64.png", 
    "Max Warlords": "Warlords-64.png",
    "Max Wool Games": "WoolGames-64.png", 
    "Max Arena Brawl": "Arena-64.png", 
    "Max Paintball": "Paintball-64.png",
    "Max Quake": "Quakecraft-64.png", 
    "Max VampireZ": "VampireZ-64.png", 
    "Max Walls": "Walls-64.png",
    "Max TKR": "TurboKartRacers-64.png", 
    "Max Crazy Walls": "CrazyWalls-64.png", 
    "Max SkyClash": "SkyClash-64.png"
  };

  const filename = iconMap[gameName] || gameName.replace('Max ', '').replace(/\s/g, '') + '-64.png';
  return `/img/games/${filename}`;
}

function renderCabinet(data) {
    document.title = `LitStats - ${data.username}'s Cabinet`;
    
    document.getElementById('p-avatar').src = `https://visage.surgeplay.com/bust/${data.uuid}`;
    document.getElementById('p-avatar').onerror = function() { this.src = `https://vzge.me/bust/${data.uuid}.png`; };
    document.getElementById('p-name').textContent = data.username;

    const rankEl = document.getElementById('p-rank');
    if (data.rank && data.rank !== 'NON') {
        rankEl.innerHTML = formatRankText(data.rank, data.rankPlusColor);
        rankEl.style.display = 'inline-block';
    } else {
        rankEl.style.display = 'none'; 
    }

    const ap = data.achievementPoints || data.current_ap || 0;
    document.getElementById('p-ap').innerHTML = `<img src="/img/diamond.png" alt="AP" style="width:14px; height:14px; object-fit:contain;"> ${Number(ap).toLocaleString()} AP`;
    
    const userMaxes = data.maxGames || [];
    document.getElementById('p-max-count').textContent = `${userMaxes.length} / ${TOTAL_GAMES} Maxed`;
    const percentage = Math.min(100, (ap / MAX_POSSIBLE_AP) * 100).toFixed(1);
    document.getElementById('p-ap-bar').style.width = `${percentage}%`;
    document.getElementById('p-ap-percent').textContent = `${percentage}%`;

    const cabinetGrid = document.getElementById('cabinet-grid');
    let html = '';

    trophyStructure.forEach(tier => {
      html += `<div class="tier-group ${tier.classes} ${tier.isLegacy ? 'legacy' : ''}">`;
      html += `<div class="tier-header"><span class="tier-label">${tier.name}</span></div>`;
      html += `<div class="badge-row">`;
      
      tier.games.forEach(game => {
        const isAchieved = userMaxes.includes(game);
        const statusClass = isAchieved ? 'achieved' : 'unachieved';
        
        let innerHtml = '';
        let tooltip = game.replace('Max ', '');
        
        if (!isAchieved && data.gamePercentages) {
            const percent = data.gamePercentages[game] || 0;
            innerHtml = `<div class="slot-progress"><div class="slot-fill" style="width: ${percent}%;"></div></div>`;
            tooltip = `${game.replace('Max ', '')} - ${percent}% Complete`;
        } else if (!isAchieved) {
            tooltip = `${game.replace('Max ', '')} - API Data Pending`;
        }

        html += `
          <div class="game-badge ${statusClass}" title="${tooltip}">
            <div class="img-wrapper">
              <img src="${getGameIconUrl(game)}" onerror="this.style.display='none'">
            </div>
            <span>${game.replace('Max ', '')}</span>
            ${innerHtml}
          </div>
        `;
      });
      html += `</div></div>`;
    });

    cabinetGrid.innerHTML = html;

    globalPlayerData = data;
    
    if (data.missingAchievements && data.missingAchievements.length > 0) {
        populateFilters();
        renderTodoGrid();
    } else if (data.missingAchievements && data.missingAchievements.length === 0) {
        document.getElementById('todo-grid').innerHTML = `<span style="color:var(--text-3); padding: 20px; width: 100%; text-align: center;">No missing achievements found, or API data incomplete.</span>`;
    }

    document.getElementById('loader').classList.add('hidden');
    document.getElementById('cabinet-content').classList.remove('hidden');
}

async function initCabinet() {
  const urlParams = new URLSearchParams(window.location.search);
  const lookupId = urlParams.get('uuid');

  if (!lookupId) {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('errorBox').textContent = "No valid player provided.";
    document.getElementById('errorBox').classList.remove('hidden');
    return;
  }

  try {
    let uuid = lookupId;
    if (lookupId.length <= 16) {
      document.getElementById('loader').textContent = "Resolving username...";
      const dbRes = await fetch(`https://playerdb.co/api/player/minecraft/${lookupId}`);
      const dbData = await dbRes.json();
      if (dbData.code === 'player.found') uuid = dbData.data.player.raw_id;
    }

    // Phase 1: INSTANT LOCAL LOAD
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const jsonRes = await fetch(`/ap_hunters_data.json?v=${currentHour}`);
    
    if (jsonRes.ok) {
        const localData = await jsonRes.json();
        const localPlayer = localData.country_leaderboard.flatMap(c => c.top_players).find(p => p.uuid === uuid);
        if (localPlayer && localPlayer.maxGames) {
            renderCabinet(localPlayer); 
        }
    }

    // Phase 2: AUTOMATIC LIVE FETCH
    document.getElementById('loader').textContent = "Fetching live network data...";
    document.getElementById('loader').classList.remove('hidden');

    const res = await fetch(`https://litstats.vercel.app/api/player?uuid=${uuid}`);
    if (res.status === 429) throw new Error("Rate Limited by Hypixel. Please wait 60 seconds.");
    
    const data = await res.json();
    if (data.error) throw new Error(`API Error: ${data.error}`);

    // Snapshot legacy games
    const legacyGamesList = ["Max Seasonal", "Max Crazy Walls", "Max SkyClash"];
    const preservedMaxes = (globalPlayerData?.maxGames || []).filter(g => legacyGamesList.includes(g));
    data.maxGames = [...new Set([...(data.maxGames || []), ...preservedMaxes])];
    
    renderCabinet(data);

  } catch (err) {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('errorBox').textContent = err.message;
    document.getElementById('errorBox').classList.remove('hidden');
  }
}

initCabinet();
