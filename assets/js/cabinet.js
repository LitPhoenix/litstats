let globalPlayerData = null;
let activeGameFilters = new Set();
let isCompExcluded = false;
let maxedHidden = false;
const compGames = ["Mega Walls", "Pit", "UHC"];

// Custom tags DB
const TAG_DB = {
    "Kill Secured": { type: "Broken", tip: "Currently bugged and does not track." },
    "Mountain of Wool": { type: "Coin", cost: "50,000", tip: "Buy the wool weaver perk." },
    "Block Runner": { type: "Map", tip: "Best done on Map A." }
};

let ignoredAchs = JSON.parse(localStorage.getItem('litstats_ignored')) || [];
let bookmarkedAchs = JSON.parse(localStorage.getItem('litstats_bookmarked')) || [];
let viewMode = 'all'; // 'all', 'ignored', 'bookmarks'

window.activeTierView = {}; 
window.limits = { tiered: 10, challenge: 10, recent: 20 };

window.toggleViewMode = function(mode) {
    if (viewMode === mode) viewMode = 'all';
    else viewMode = mode;
    renderDashboard();
};

window.toggleIgnore = function(uniqueId) {
    if (!ignoredAchs.includes(uniqueId)) {
        if (!confirm("Are you sure you want to hide this achievement?")) return;
        ignoredAchs.push(uniqueId);
        bookmarkedAchs = bookmarkedAchs.filter(i => i !== uniqueId); // Remove from bookmarks if ignored
    } else {
        ignoredAchs = ignoredAchs.filter(i => i !== uniqueId);
    }
    localStorage.setItem('litstats_ignored', JSON.stringify(ignoredAchs));
    localStorage.setItem('litstats_bookmarked', JSON.stringify(bookmarkedAchs));
    renderDashboard();
};

window.toggleBookmark = function(uniqueId) {
    if (!bookmarkedAchs.includes(uniqueId)) {
        bookmarkedAchs.push(uniqueId);
        ignoredAchs = ignoredAchs.filter(i => i !== uniqueId); // Remove from ignored if bookmarked
    } else {
        bookmarkedAchs = bookmarkedAchs.filter(i => i !== uniqueId);
    }
    localStorage.setItem('litstats_bookmarked', JSON.stringify(bookmarkedAchs));
    localStorage.setItem('litstats_ignored', JSON.stringify(ignoredAchs));
    renderDashboard();
};

function getPlusColourHex(colourName) {
    const colours = { 'RED': '#FF5555', 'GOLD': '#FFAA00', 'GREEN': '#55FF55', 'YELLOW': '#FFFF55', 'LIGHT_PURPLE': '#FF55FF', 'WHITE': '#FFFFFF', 'BLUE': '#5555FF', 'DARK_GREEN': '#00AA00', 'DARK_RED': '#AA0000', 'DARK_AQUA': '#00AAAA', 'DARK_PURPLE': '#AA00AA', 'DARK_GRAY': '#555555', 'BLACK': '#000000', 'DARK_BLUE': '#0000AA' };
    return colours[colourName] || '#FF5555';
}

function getRankBaseColourHex(rank, monthlyRankColor) {
    if (!rank || rank === 'NON') return 'var(--text-3)';
    const clean = rank.replace(/\[|\]/g, ''); 
    if (clean.includes('++')) return monthlyRankColor === 'AQUA' ? '#55FFFF' : '#FFAA00';
    if (clean === 'MOJANG' || clean === 'EVENTS') return '#FFAA00'; 
    if (clean.includes('MVP')) return '#36e9e9'; 
    if (clean.includes('VIP')) return '#55FF55'; 
    if (clean.includes('YOUTUBE') || clean === 'STAFF') return '#FF5555'; 
    if (clean.includes('PIG') || clean.includes('INNIT')) return '#FF55FF'; 
    return 'var(--text-2)';
}

function formatRankText(rank, plusColour, monthlyRankColor) {
    if (!rank || rank === 'NON') return '';
    const plusHex = getPlusColourHex(plusColour);
    const cleanRank = rank.replace(/\[|\]/g, ''); 
    const baseColor = getRankBaseColourHex(rank, monthlyRankColor);

    let formatted = cleanRank;
    if (cleanRank === 'STAFF' || cleanRank.includes('staff')) formatted = `<span style="color:#FFAA00">ዞ</span>`;
    else if (cleanRank === 'YOUTUBE' || cleanRank.includes('youtube')) formatted = `<span style="color:#FFFFFF">YOUTUBE</span>`;
    else if (cleanRank.includes('PIG')) formatted = `PIG<span style="color:#00FFFF">+++</span>`;
    else if (cleanRank.includes('++')) formatted = `MVP<span style="color:${plusHex}">++</span>`;
    else if (cleanRank.includes('+')) formatted = `${cleanRank.split('+')[0]}<span style="color:${plusHex}">+</span>`;

    return `<span style="color:${baseColor}; font-weight:700;">[${formatted}]</span>`;
}

function getGameIconUrl(gameName) {
  const clean = gameName.replace('Max ', '');
  const iconMap = {
    "Seasonal": "seasonal.png", "Arcade": "Arcade-64.png", "Bed Wars": "BedWars-64.png", 
    "Build Battle": "BuildBattle-64.png", "Cops and Crims": "CVC-64.png", "Duels": "Duels-64.png", 
    "Mega Walls": "MegaWalls-64.png", "Murder Mystery": "MurderMystery-64.png", "Pit": "Pit-64.png", 
    "Blitz": "SG-64.png", "SkyBlock": "SkyBlock-64.png", "SkyWars": "Skywars-64.png", 
    "Smash Heroes": "SmashHeroes-64.png", "Speed UHC": "SpeedUHC-64.png", "TNT Games": "TNT-64.png", 
    "UHC": "UHC-64.png", "Warlords": "Warlords-64.png", "Wool Games": "WoolGames-64.png", 
    "Arena Brawl": "Arena-64.png", "Paintball": "Paintball-64.png", "Quake": "Quakecraft-64.png", 
    "VampireZ": "VampireZ-64.png", "Walls": "Walls-64.png", "TKR": "TurboKartRacers-64.png", 
    "Crazy Walls": "CrazyWalls-64.png", "SkyClash": "SkyClash-64.png"
  };
  const filename = iconMap[clean] || clean.replace(/\s/g, '') + '-64.png';
  return `/img/games/${filename}`;
}

function toggleMaxedGames() {
    maxedHidden = !maxedHidden;
    document.getElementById('maxed-column').classList.toggle('collapsed', maxedHidden);
    const toggleBtn = document.getElementById('toggleMaxedBtn');
    toggleBtn.innerText = maxedHidden ? "Show Max Games" : "Hide Max Games";
    toggleBtn.setAttribute('aria-pressed', maxedHidden ? 'true' : 'false');
}

function toggleGameFilter(gameName) {
    if (isCompExcluded && compGames.includes(gameName)) return;
    activeGameFilters.has(gameName) ? activeGameFilters.delete(gameName) : activeGameFilters.add(gameName);
    
    document.querySelectorAll('.filter-icon-btn').forEach(btn => {
        let name = btn.getAttribute('title');
        btn.classList.toggle('active', activeGameFilters.has(name));
    });

    document.querySelectorAll('.game-badge').forEach(badge => {
        let nameSpan = badge.querySelector('span');
        if (nameSpan) {
            let name = nameSpan.innerText;
            badge.classList.toggle('active-filter', activeGameFilters.has(name));
        }
    });

    renderDashboard();
}

function toggleExcludeComp() {
    isCompExcluded = document.getElementById('excludeComp').checked;
    if (isCompExcluded) compGames.forEach(g => activeGameFilters.delete(g));
    
    document.querySelectorAll('.game-badge').forEach(badge => {
        let nameSpan = badge.querySelector('span');
        if (nameSpan) {
            let name = nameSpan.innerText;
            if (isCompExcluded && compGames.includes(name)) badge.classList.remove('active-filter');
        }
    });

    populateFilters();
    renderDashboard();
}

function populateFilters() {
    const container = document.getElementById('gameFilterContainer');
    if (!globalPlayerData) return;
    
    const games = [...new Set(globalPlayerData.missingAchievements.map(a => a.game))].sort();
    
    let html = `<div class="filter-icon-grid">`;
    games.forEach(g => { 
        let cleanName = g.replace('Max ', '');
        let isDisabled = isCompExcluded && compGames.includes(cleanName) ? 'disabled' : '';
        let isActive = activeGameFilters.has(cleanName) ? 'active' : '';
        let percent = globalPlayerData.gamePercentages[g] || 0;
        let color = percent >= 80 ? 'var(--tier-1)' : percent >= 40 ? 'var(--tier-2)' : 'var(--tier-4)';

        html += `
          <div class="filter-icon-btn ${isActive} ${isDisabled}" onclick="toggleGameFilter('${cleanName}')" title="${cleanName}" style="--f-color: ${color};">
            <img src="${getGameIconUrl(g)}" onerror="this.style.display='none'">
          </div>
        `; 
    });
    container.innerHTML = html + `</div>`;
}

// BULLETPROOF ID ROUTING: Reads Base64 safely
window.setTierView = function(base64Id, tierNum) {
    window.activeTierView[base64Id] = parseInt(tierNum);
    renderDashboard();
};

function renderDashboard() {
    if (!globalPlayerData) return;

    let allMissing = [...(globalPlayerData.missingAchievements || [])];
    if (isCompExcluded) allMissing = allMissing.filter(a => !compGames.includes(a.game.replace('Max ', '')));
    if (activeGameFilters.size > 0) allMissing = allMissing.filter(a => activeGameFilters.has(a.game.replace('Max ', '')));

    let tiered = [];
    let challenges = [];

    // Button States
    const igBtn = document.getElementById('ignoredToggleBtn');
    const bkBtn = document.getElementById('bookmarkToggleBtn');
    if (igBtn) igBtn.innerText = viewMode === 'ignored' ? "View All" : `Show Ignored (${ignoredAchs.length})`;
    if (igBtn) igBtn.classList.toggle('active', viewMode === 'ignored');
    if (bkBtn) bkBtn.innerText = viewMode === 'bookmarks' ? "View All" : `Bookmarks (${bookmarkedAchs.length})`;
    if (bkBtn) bkBtn.classList.toggle('active', viewMode === 'bookmarks');

    allMissing.forEach(ach => {
        let uniqueId = btoa(encodeURIComponent(ach.title)); 
        ach.uniqueId = uniqueId;

        let isIgnored = ignoredAchs.includes(uniqueId);
        let isBookmarked = bookmarkedAchs.includes(uniqueId);

        // View Mode Filter Logic
        if (viewMode === 'ignored' && !isIgnored) return;
        if (viewMode === 'bookmarks' && !isBookmarked) return;
        if (viewMode === 'all' && isIgnored) return;

        // Process custom tags
        let tagsHtml = '';
        let tipHtml = '';
        const tagData = TAG_DB[ach.title];
        if (tagData) {
            let colour = tagData.type === 'Broken' ? 'var(--red)' : tagData.type === 'Map' ? 'var(--green)' : 'var(--gold)';
            let costStr = tagData.cost ? ` (${tagData.cost})` : '';
            tagsHtml = `<span class="sleek-tag" style="--tag-color: ${colour};">${tagData.type}${costStr}</span>`;
            if (tagData.tip) tipHtml = `<div class="ach-tip"><i>Tip: ${tagData.tip}</i></div>`;
        }
        ach.tagsHtml = tagsHtml;
        ach.tipHtml = tipHtml;
        
        let isChallenge = ach.isOneTime || (ach.globalPct !== undefined && ach.currentAmt === undefined && !ach.allTiers);

        if (isChallenge) {
            ach.calcPct = Number(ach.gamePercentUnlocked || ach.globalPct || 0);
            challenges.push(ach);
        } else {
            if (!ach.allTiers) ach.allTiers = [{ tier: ach.tier || 1, amount: ach.amount || 1, reward: ach.reward || 0 }];

            let missingTiers = ach.allTiers.filter(t => (ach.currentAmt || 0) < t.amount);
            let firstMissing = missingTiers.length ? missingTiers[0].tier : 5;
            
            let viewingTierNum = window.activeTierView[uniqueId] || firstMissing;
            let targetTierObj = ach.allTiers.find(t => t.tier === viewingTierNum) || ach.allTiers[0];

            let targetAmt = targetTierObj.amount;
            let trueCurrentAmt = ach.currentAmt || 0;
            
            let displayAmt = Math.min(trueCurrentAmt, targetAmt);
            let pct = Math.min(100, (displayAmt / targetAmt) * 100);
            let isCompleted = trueCurrentAmt >= targetAmt;

            let trueMissingObj = ach.allTiers.find(t => t.tier === firstMissing) || ach.allTiers[0];
            let sortAmt = Math.min(trueCurrentAmt, trueMissingObj.amount);
            let sortPct = Math.min(100, (sortAmt / trueMissingObj.amount) * 100);

            tiered.push({
                ...ach, uniqueId, viewingTierNum, targetAmt, displayAmt, isCompleted, 
                calcPct: pct, sortPct: sortPct, activeReward: targetTierObj.reward, sortReward: trueMissingObj.reward
            });
        }
    });

    const sortTiered = document.getElementById('sortTiered').value;
    tiered.sort((a, b) => sortTiered === 'closest' ? b.sortPct - a.sortPct || a.sortReward - b.sortReward : a.sortPct - b.sortPct || b.sortReward - a.sortReward);

    const sortChal = document.getElementById('sortChallenge').value;
    challenges.sort((a, b) => sortChal === 'easiest' 
        ? (b.calcPct - a.calcPct) || (a.reward - b.reward) 
        : (a.calcPct - b.calcPct) || (b.reward - a.reward));

    let recents = [...(globalPlayerData.recentAchievements || [])];
    const sortRec = document.getElementById('sortRecent').value;
    if (sortRec === 'oldest') recents.reverse(); 

    // Helper for rendering cards
    const generateCard = (ach, isTiered, progressBlock, notches) => {
        let isIgnored = ignoredAchs.includes(ach.uniqueId);
        let isBookmarked = bookmarkedAchs.includes(ach.uniqueId);
        let ignoreText = isIgnored ? 'Restore' : 'Ignore';
        let bookmarkClass = isBookmarked ? 'active-bookmark' : '';
        let bookmarkIcon = isBookmarked ? '★' : '☆';

        return `
          <div class="ach-card ${isTiered ? 'has-tier' : ''}">
            ${!isTiered ? `<span class="ach-percent">${ach.calcPct.toFixed(2)}%</span>` : ''}
            <div class="ach-card-header">
              <img src="${getGameIconUrl(ach.game)}" class="todo-game-icon" onerror="this.style.display='none'">
              <span class="ach-game">${ach.game.replace('Max ', '')}</span>
            </div>
            
            <span class="ach-title">${ach.title} ${ach.tagsHtml}</span>
            <span class="ach-desc">${ach.desc}</span>
            ${ach.tipHtml}
            
            ${progressBlock}

            <div class="ach-card-footer">
              <span class="ach-reward"><img src="/img/diamond.png" alt="AP" style="width:14px; height:14px; object-fit:contain;"> ${isTiered ? ach.activeReward : ach.reward} AP</span>
              <div class="ach-actions">
                <button onclick="toggleBookmark('${ach.uniqueId}')" class="ach-action-btn ${bookmarkClass}" title="Bookmark">${bookmarkIcon}</button>
                <button onclick="toggleIgnore('${ach.uniqueId}')" class="ach-action-btn" title="${ignoreText}">${ignoreText}</button>
              </div>
            </div>
            ${isTiered ? `<div class="tier-notch-container">${notches}</div>` : ''}
          </div>
        `;
    };

    document.getElementById('col-tiered').innerHTML = tiered.slice(0, limits.tiered).map(ach => {
        let parsedDesc = ach.desc.replace(/%%value%%|%tieramount%|\?/gi, ach.targetAmt);
        ach.desc = parsedDesc;
        
        let progressText = ach.isCompleted ? `${ach.targetAmt} / ${ach.targetAmt}` : `${ach.displayAmt} / ${ach.targetAmt}`;
        let barClass = ach.isCompleted ? "ach-progress-fill completed-tier" : "ach-progress-fill";

        let notches = '';
        for(let i = 1; i <= 5; i++) {
            let isPastOrCurrent = i <= ach.viewingTierNum;
            let op = isPastOrCurrent ? '1' : '0.3';
            let bg = isPastOrCurrent ? `var(--tier-${i})` : 'var(--border)';
            let glow = (i === ach.viewingTierNum) ? `box-shadow: 0 0 6px var(--tier-${i}); transform: scaleY(1.3);` : '';
            notches += `<div class="tier-notch" style="background: ${bg}; opacity: ${op}; ${glow}" onclick="setTierView('${ach.uniqueId}', ${i})"></div>`;
        }

        let progressBlock = `
            <div class="ach-progress-container"><div class="${barClass}" style="width: ${ach.calcPct.toFixed(2)}%;"></div></div>
            <div class="tier-progress-text">${progressText} (${ach.calcPct.toFixed(2)}%)</div>
        `;

        return generateCard(ach, true, progressBlock, notches);
    }).join('');

    document.getElementById('col-challenge').innerHTML = challenges.slice(0, limits.challenge).map(ach => {
        ach.desc = ach.desc.replace(/%%value%%|%tieramount%|\?/gi, "1");
        return generateCard(ach, false, '', '');
    }).join('');

    if (!globalPlayerData.recentAchievements) {
        document.getElementById('col-recent').innerHTML = `<span style="color:var(--text-3); font-size: 13px;">Awaiting Vercel Cache... recentAchievements missing from API payload.</span>`;
    } else if (recents.length === 0) {
        document.getElementById('col-recent').innerHTML = `<span style="color:var(--text-3); font-size: 13px;">No recent history data returned from API.</span>`;
    } else {
        document.getElementById('col-recent').innerHTML = recents.slice(0, limits.recent).map(ach => {
            return `
              <div class="ach-card" style="border-color: var(--tier-1); box-shadow: none;">
                <div class="ach-card-header">
                  <img src="${getGameIconUrl(ach.game)}" class="todo-game-icon" onerror="this.style.display='none'">
                  <span class="ach-game">${ach.game.replace('Max ', '')}</span>
                </div>
                <span class="ach-title" style="color: var(--tier-1);">${ach.title}</span>
                <span class="ach-desc">${ach.desc}</span>
                <div class="ach-card-footer">
                  <span class="ach-reward"><img src="/img/diamond.png" alt="AP" style="width:14px; height:14px; object-fit:contain;"> ${ach.reward} AP</span>
                </div>
              </div>
            `;
        }).join('');
    }

    document.getElementById('btn-more-tiered').style.display = limits.tiered < tiered.length ? 'block' : 'none';
    document.getElementById('btn-more-chal').style.display = limits.challenge < challenges.length ? 'block' : 'none';
    document.getElementById('btn-more-rec').style.display = limits.recent < recents.length ? 'block' : 'none';
}

const MAX_POSSIBLE_AP = 32510; 
const TOTAL_GAMES = 26;
const trophyStructure = [
  { name: "4th Tier", classes: "legendary", games: ["Max UHC", "Max Pit", "Max Mega Walls", "Max SkyWars", "Max Blitz"] },
  { name: "3rd Tier", classes: "epic", games: ["Max Smash Heroes", "Max Bed Wars", "Max Cops and Crims", "Max Quake", "Max Paintball", "Max Arena Brawl"] },
  { name: "2nd Tier", classes: "rare", games: ["Max SkyBlock", "Max Speed UHC", "Max Warlords", "Max Walls", "Max TNT Games", "Max Arcade"] },
  { name: "1st Tier", classes: "common", games: ["Max Murder Mystery", "Max VampireZ", "Max TKR", "Max Wool Games", "Max Duels", "Max Build Battle"] },
  { name: "Time Limited", classes: "legacy", isLegacy: true, games: ["Max Seasonal", "Max Crazy Walls", "Max SkyClash"] }
];

function getApColor(ap) {
    const apColors = [
        { ap: 0, hex: '#ffeeff' },      // Pale pink
        { ap: 5000, hex: '#ffb3ff' },   // Light pink
        { ap: 10000, hex: '#df80ff' },  // Pink-purple
        { ap: 15000, hex: '#9933ff' },  // Purple
        { ap: 20000, hex: '#3366ff' },  // Royal Blue
        { ap: 25000, hex: '#00bfff' },  // Deep Sky Blue
        { ap: 29000, hex: '#00e6ff' },  // Cyan
        { ap: 32000, hex: '#99ffff' }   // Pale Cyan
    ];

    let lower = apColors[0], upper = apColors[apColors.length - 1];
    for (let i = 0; i < apColors.length - 1; i++) {
        if (ap >= apColors[i].ap && ap <= apColors[i+1].ap) {
            lower = apColors[i];
            upper = apColors[i+1];
            break;
        }
    }
    
    if (ap >= upper.ap) return upper.hex;
    if (ap <= lower.ap) return lower.hex;
    
    const factor = (ap - lower.ap) / (upper.ap - lower.ap);
    const hex2rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    const l = hex2rgb(lower.hex), u = hex2rgb(upper.hex);
    
    const r = Math.round(l[0] + factor * (u[0] - l[0]));
    const g = Math.round(l[1] + factor * (u[1] - l[1]));
    const b = Math.round(l[2] + factor * (u[2] - l[2]));
    
    return `rgb(${r}, ${g}, ${b})`;
}

function renderCabinet(data) {
    document.title = `LitStats - ${data.username}'s Cabinet`;
    
    const loaderEl = document.getElementById('loader');
    if (loaderEl) loaderEl.style.display = 'none';

    document.getElementById('p-avatar').src = `https://visage.surgeplay.com/bust/${data.uuid}`;
    document.getElementById('p-avatar').onerror = function() { this.src = `https://vzge.me/bust/${data.uuid}.png`; };
    
    const nameEl = document.getElementById('p-name');
    nameEl.textContent = data.username;
    nameEl.style.color = getRankBaseColourHex(data.rank, data.monthlyRankColor);

    const rankEl = document.getElementById('p-rank');
    if (data.rank && data.rank !== 'NON') {
        rankEl.innerHTML = formatRankText(data.rank, data.rankPlusColor, data.monthlyRankColor);
        rankEl.style.display = 'inline-block';
    } else {
        rankEl.style.display = 'none'; 
    }

    const ap = data.achievementPoints || data.current_ap || 0;
    
    // Smooth interpolator matching your scale precisely
    const dynamicColor = getApColor(ap);
    const dynamicGlow = dynamicColor.replace('rgb', 'rgba').replace(')', ', 0.35)');

    let displayAp = Number(ap).toLocaleString();
    
    const apPillHTML = `
        <div class="ap-stat-pill" style="--ap-color: ${dynamicColor}; --ap-glow: ${dynamicGlow};">
            <div class="ap-stat-pill-inner">
                <img src="img/diamond.png" style="width: 16px; height: 16px; filter: drop-shadow(0 0 4px var(--ap-glow));">
                <span id="p-ap">${displayAp} AP</span>
            </div>
        </div>
    `;
    document.getElementById('p-ap-container').innerHTML = apPillHTML;
    
    const userMaxes = data.maxGames || [];
    document.getElementById('p-max-count').innerHTML = `<span style="font-weight:400; font-family:'DM Sans', sans-serif; color:var(--text);">${userMaxes.length} / ${TOTAL_GAMES} Maxed</span>`;
    
    const percentage = Math.min(100, (ap / MAX_POSSIBLE_AP) * 100).toFixed(2);
    document.getElementById('p-ap-bar').style.width = `${percentage}%`;
    document.getElementById('p-ap-percent').textContent = `${percentage}%`;

    const cabinetGrid = document.getElementById('cabinet-grid');
    let html = '';

    trophyStructure.forEach(tier => {
      const badgeRowClass = `badge-row count-${tier.games.length}`;
      html += `<div class="tier-group ${tier.classes} ${tier.isLegacy ? 'legacy' : ''}">`;
      html += `<div class="tier-header"><span class="tier-label">${tier.name}</span></div>`;
      html += `<div class="${badgeRowClass}">`;
      
      tier.games.forEach(game => {
        const isAchieved = userMaxes.includes(game);
        const statusClass = isAchieved ? 'achieved' : 'unachieved';
        let cleanGameName = game.replace('Max ', '');
        let tooltip = cleanGameName;
        let innerHtml = '';
        
        if (!isAchieved && data.gamePercentages) {
            const percent = data.gamePercentages[game] || 0;
            let color = percent >= 80 ? 'var(--tier-1)' : percent >= 40 ? 'var(--tier-2)' : 'var(--tier-4)';
            innerHtml = `<div class="slot-progress"><div class="slot-fill" style="width: ${percent}%; background-color: ${color};"></div></div>`;
            tooltip = `${cleanGameName} - ${Number(percent).toFixed(2)}% Complete`;
        }

        let clickLogic = isAchieved ? '' : `onclick="toggleGameFilter('${cleanGameName}')"`;

        html += `
          <div class="game-badge ${statusClass}" title="${tooltip}" ${clickLogic}>
            <div class="img-wrapper"><img src="${getGameIconUrl(game)}" onerror="this.style.display='none'"></div>
            <span>${cleanGameName}</span>
            ${innerHtml}
          </div>
        `;
      });
      html += `</div></div>`;
    });

    cabinetGrid.innerHTML = html;
    globalPlayerData = data;
    
    if (data.missingAchievements) {
        populateFilters();
        renderDashboard();
    }

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

    let hasRenderedLocal = false;
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const jsonRes = await fetch(`/ap_hunters_data.json?v=${currentHour}`);
    
    if (jsonRes.ok) {
        const localData = await jsonRes.json();
        const localPlayer = localData.country_leaderboard.flatMap(c => c.top_players).find(p => p.uuid === uuid);
        if (localPlayer && localPlayer.maxGames) {
            renderCabinet(localPlayer); 
            hasRenderedLocal = true;
        }
    }

    if (!hasRenderedLocal) {
        document.getElementById('loader').textContent = "Fetching live network data...";
        document.getElementById('loader').classList.remove('hidden');
    }

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiUrl = isLocal 
        ? `/api/player?uuid=${uuid}` 
        : `https://api.litstats.com/api/player?uuid=${uuid}`;
        
    const res = await fetch(apiUrl);
    if (res.status === 429) throw new Error("Rate Limited by Hypixel. Please wait 60 seconds.");

    if (!res.ok || res.headers.get("content-type")?.includes("text/html")) {
        const errorHtml = await res.text();
        console.error("API returned HTML instead of JSON:", errorHtml);
        throw new Error(`API failed with status: ${res.status}. Check browser console.`);
    }
    
    const data = await res.json();
    if (data.error) throw new Error(`API Error: ${data.error}`);

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
