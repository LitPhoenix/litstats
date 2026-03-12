let globalPlayerData = null;

function getPlusColourHex(colourName) {
    const colours = {
        'RED': '#FF5555', 'GOLD': '#FFAA00', 'GREEN': '#55FF55',
        'YELLOW': '#FFFF55', 'LIGHT_PURPLE': '#FF55FF', 'WHITE': '#FFFFFF',
        'BLUE': '#5555FF', 'DARK_GREEN': '#00AA00', 'DARK_RED': '#AA0000',
        'DARK_AQUA': '#00AAAA', 'DARK_PURPLE': '#AA00AA', 'DARK_GRAY': '#555555',
        'BLACK': '#000000', 'DARK_BLUE': '#0000AA'
    };
    return colours[colourName] || '#FF5555'; // Defaults to red
}

// Formats the rank string with the correct spans
function formatRankText(rank, plusColour) {
    if (!rank || rank === 'NON') return '';
    const plusHex = getPlusColourHex(plusColour);
    
    if (rank.includes('++')) {
        return `<span style="color: #FFAA00; background: rgba(255, 170, 0, 0.1); padding: 2px 6px; border-radius: 4px;">[MVP<span style="color: ${plusHex}">++</span>]</span>`;
    } else if (rank.includes('+') && rank.includes('MVP')) {
        return `<span style="color: #55FFFF; background: rgba(85, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px;">[MVP<span style="color: ${plusHex}">+</span>]</span>`;
    } else if (rank.includes('VIP')) {
        return `<span style="color: #55FF55; background: rgba(85, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px;">[${rank}]</span>`;
    }
    return `<span style="color: #AAAAAA; background: rgba(170, 170, 170, 0.1); padding: 2px 6px; border-radius: 4px;">[${rank}]</span>`;
}

function populateFilters() {
    const select = document.getElementById('gameFilter');
    if (!globalPlayerData || !globalPlayerData.missingAchievements) return;
    
    const games = [...new Set(globalPlayerData.missingAchievements.map(a => a.game))].sort();
    
    let html = `<option value="all">Games: All</option>
                <option value="no_comp">Games: Exclude Comp (Pit, UHC, MW)</option>
                <option disabled>──────────</option>`;
                
    games.forEach(g => { html += `<option value="${g}">${g}</option>`; });
    select.innerHTML = html;
}

function renderTodoGrid() {
    const container = document.getElementById('todo-grid');
    if (!globalPlayerData || !globalPlayerData.missingAchievements) return;

    let achs = [...globalPlayerData.missingAchievements];
    const sortVal = document.getElementById('sortFilter').value;
    const filterVal = document.getElementById('gameFilter').value;

    if (filterVal === 'no_comp') {
        achs = achs.filter(a => !['Pit', 'UHC', 'Mega Walls'].includes(a.game));
    } else if (filterVal !== 'all') {
        achs = achs.filter(a => a.game === filterVal);
    }

    if (sortVal === 'easiest') achs.sort((a, b) => a.reward - b.reward);
    else achs.sort((a, b) => b.reward - a.reward);

    achs = achs.slice(0, 50);

    if (achs.length === 0) {
        container.innerHTML = `<span style="color:var(--text-3); padding: 20px; width: 100%; text-align: center;">No achievements match your filters.</span>`;
        return;
    }

    container.innerHTML = achs.map(ach => {
        // FIX: Grab the achievement's specific global rarity, not the game's overall progress.
        // Falls back to 0.0 if the API backend hasn't provided the globalPercentage field.
        let percent = ach.globalPercentage !== undefined 
            ? Number(ach.globalPercentage).toFixed(1) 
            : '0.0';
        
        return `
          <div class="ach-card">
            <span class="ach-percent">${percent}%</span>
            <span class="ach-game">${ach.game}</span>
            <span class="ach-title">${ach.title}</span>
            <span class="ach-desc">${ach.desc}</span>
            <span class="ach-reward">
              <img src="img/diamond.png" alt="AP" style="width:14px; height:14px; object-fit:contain;"> 
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
  
  return `img/games/${filename}`;
}

function renderCabinet(data) {
    document.title = `LitStats - ${data.username}'s Cabinet`;

    document.getElementById('p-avatar').src = `https://visage.surgeplay.com/bust/${data.uuid}`;
    document.getElementById('p-avatar').onerror = function() { this.src = `https://vzge.me/bust/${data.uuid}.png`; };
    document.getElementById('p-name').textContent = data.username;

    // Update Rank
    const rankEl = document.getElementById('p-rank');
    if (data.rank && data.rank !== 'NON') {
        rankEl.innerHTML = formatRankText(data.rank, data.rankPlusColor);
        rankEl.style.display = 'inline-block';
    } else {
        rankEl.style.display = 'none'; 
    }

    // Update AP Badge (No trophy, added diamond)
    const ap = data.achievementPoints || data.current_ap || 0;
    document.getElementById('p-ap').innerHTML = `<img src="img/diamond.png" alt="AP" style="width:14px; height:14px; object-fit:contain;"> ${Number(ap).toLocaleString()} AP`;
    
    // Update Max Count (No fire emoji)
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
    } else {
        document.getElementById('todo-grid').innerHTML = `
          <div style="width: 100%; text-align: center; grid-column: 1 / -1; padding: 40px;">
            <span style="color:var(--text-3); font-size: 14px;">Achievement tracking requires live data.</span><br><br>
            <button class="nav-btn active" style="border:none; cursor:pointer;" onclick="forceLiveFetch('${data.uuid}')">Fetch Live Data</button>
          </div>
        `;
    }

    document.getElementById('loader').classList.add('hidden');
    document.getElementById('cabinet-content').classList.remove('hidden');
}

async function forceLiveFetch(uuid) {
    document.getElementById('cabinet-content').classList.add('hidden');
    document.getElementById('loader').textContent = "Fetching live achievement data...";
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('errorBox').classList.add('hidden');

    try {
        const res = await fetch(`https://litstats.vercel.app/api/player?uuid=${uuid}`);
        if (res.status === 429) throw new Error("Rate Limited by Hypixel. Please wait 60 seconds.");
        
        const data = await res.json();
        if (data.error) throw new Error(`API Error: ${data.error}`);
        
        renderCabinet(data);
    } catch (err) {
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('errorBox').textContent = err.message;
        document.getElementById('errorBox').classList.remove('hidden');
    }
}

async function initCabinet() {
  const urlParams = new URLSearchParams(window.location.search);
  let lookupId = urlParams.get('uuid');

  // 1. Grab ID from the new clean URL if not in query params
  if (!lookupId || lookupId === "undefined") {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if ((pathSegments[0] === 'cabinet' || pathSegments[0] === 'player') && pathSegments[1]) {
      lookupId = pathSegments[1];
    }
  }

  if (!lookupId || lookupId === "undefined") {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('errorBox').textContent = "No valid player provided.";
    document.getElementById('errorBox').classList.remove('hidden');
    return;
  }

  try {
    // 2. If it is a username (16 chars or less), fetch the UUID first
    let uuid = lookupId;
    if (lookupId.length <= 16) {
      document.getElementById('loader').textContent = "Resolving username...";
      const dbRes = await fetch(`https://playerdb.co/api/player/minecraft/${lookupId}`);
      const dbData = await dbRes.json();
      
      if (dbData.code === 'player.found') {
        uuid = dbData.data.player.raw_id;
        document.getElementById('loader').textContent = "Summoning network data...";
      } else {
        throw new Error("Minecraft player not found.");
      }
    }

    // 3. Proceed with the normal data fetch using the UUID
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const jsonRes = await fetch(`ap_hunters_data.json?v=${currentHour}`);
    
    if (jsonRes.ok) {
        const localData = await jsonRes.json();
        const localPlayer = localData.country_leaderboard.flatMap(c => c.top_players).find(p => p.uuid === uuid);
        if (localPlayer && localPlayer.maxGames) {
            renderCabinet(localPlayer);
            return; 
        }
    }

    const res = await fetch(`https://litstats.vercel.app/api/player?uuid=${uuid}`);
    if (res.status === 429) throw new Error("Rate Limited by Hypixel. Please wait 60 seconds.");
    const data = await res.json();
    
    if (data.error) throw new Error(`API Error: ${data.error}`);

    renderCabinet(data);
  } catch (err) {
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('errorBox').textContent = err.message;
    document.getElementById('errorBox').classList.remove('hidden');
  }
}

initCabinet();
