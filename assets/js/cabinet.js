let globalPlayerData = null;
let activeGameFilters = new Set();
let isCompExcluded = localStorage.getItem('litstats_excludeComp') === 'true';
let maxedHidden = localStorage.getItem('litstats_maxedHidden') === 'true';
const compGames = ["Mega Walls", "Pit", "UHC"];

// Custom tags DB
const TAG_DB = {
    // Broken
    "Untouched": { type: "Broken", tip: "Obtainable on Dwarven, Nordic, Outback and Jungle, if these maps don't work, try leave a game you know your team will win, or eat a gapple before your absorption ends when the walls fall" },
    // Cost - Prestige +/ Renown
    "Prestige": { type: "Prestige", level: 15 },
    "Renown": { renown: 2000 },
    "Gold": { type: "Gold", cost: "30,000,000" },
    "All hail the King!": { type: "Prestige", level: 1 },
    "Mysticism": { type: "Prestige", level: 1, renown: 10, tip: "Mysticism unlocks at Prestige 1" },
    "Did I see some blue?": { type: "Prestige", level: 1, renown: 10, tip: "Mysticism I costs 10 renown. Has about a 0.2% chance to drop from kills" },
    "Scam Artist": { type: "Prestige", level: 1, renown: 10, tip: "First tier of Scam Artist unlocks at Prestige 1" },
    "One small step for Pants": { type: "Prestige", level: 1, renown: 30, tip: "Mysticism IV costs 30 renown" },
    "Rare!": { type: "Prestige", level: 1, renown: 10, tip: "Need Mysticism to enchant items, possible with Tier II items, however more common with Tier III" },
    "This isn't the lobby!": { type: "Prestige", level: 1, renown: 5, tip: "Need Fishing Club I renown upgrade" },
    "Rambo": { type: "Prestige", level: 3, renown: 15, tip: "Need Rambo renown perk" },
    "Paint Job": { type: "Prestige", level: 5, renown: 10, tip: "Need Fancy Hat renown upgrade" },
    "Poet": { type: "Prestige", level: 6, renown: 10, tip: "Need Heresy renown upgrade, complete the night quest in chat, night falls every 36 minutes or you can check [here](https://pit.wiki/Night_Quests)" },
    "In the Club": { type: "Prestige", level: 7, renown: 30, tip: "Need Fishing Club V renown upgrade" },
    "Big Belly": { type: "Prestige", level: 7, renown: 50, tip: "Soup is 30 renown, Olympus is 20 renown, Steaks from pants enchant, Golden Head from its perk, Golden Apple from disabling healing perks" },
    "Fast Pass": { type: "Prestige", level: 10, renown: 100 },
    "The XX": { type: "Prestige", level: 20},
    "Big Time": { type: "Prestige", level: 25, renown: 3400 },
    // Cost
    "Mountain of Wool": { type: "Wool", cost: "10,000" },
    "Magical Box": { type: "Coins", cost: "1,350,000", tip: "You can buy 100 keys for 45,000 coins\nPrice tag shown is the minimum for Tier 5" },
    "Runic Enhancements": { type: "Coins", cost: "500" },
    "Melee Specialization": { type: "Coins", cost: "250,530" },
    "Health Specialization": { type: "Coins", cost: "250,530" },
    "Energy Specialization": { type: "Coins", cost: "250,530" },
    "Cooldown Specialization": { type: "Coins", cost: "250,530" },
    "Maximum Runic Magic": { type: "Coins", cost: "296,250" },
    "Kit Collector": { type: "Coins", cost: "120,000", tip: "View Blitz kit prices [here](www.litstats.com/blitzkits)\nPrice tag shown is the minimum for Tier 5" },
    "Can't Decide!": { type: "Coins", cost: "560" },
    "Lucky #7": { type: "Coins", cost: "66,480" },
    "Raised By Wolves": { type: "Coins", cost: "40,000", tip: "Could get Wolftamer during Blitz Hour" },
    "Blitz Maniac": { type: "Coins", cost: "80,000", tip: "Price shown is the minimum" },
    "Finally": { type: "Coins", cost: "1,416,480" },
    "HORSEEEYYY": { type: "Coins", cost: "100,000", tip: "Could get Horsetamer during Blitz Hour" },
    "#pigrider77": { type: "Coins", cost: "1,416,480", tip: "Could ride the pig mob while using the pig taunt" },
    "Collector": { type: "Coins", cost: "4,249,440", tip: "3 standard Level X kits costs 4,249,440, however it's free to level Ultimate kits" },
    "So Shiny": { type: "Coins", cost: "3,416,480", tip: "Standard Prestige kit costs 3,416,480, if you prestige an Ultimate kit, you only spend 2,000,000 extra" },
    "Even Shinier": { type: "Coins", cost: "3,916,480", tip: "Standard Prestige II kit costs 3,916,480, if you prestige an Ultimate kit, you only spend 2,500,000 extra" },
    "Jack of All Trades": { type: "Coins", cost: "1,045,000", tip: "Need Ultimate kit requirements too" },
    "Superior Vote": { type: "Tokens", cost: "2,000"},
    "Fancy": { type: "Tokens", cost: "900"},
    "Musician": { type: "Tokens", cost: "125,000", tip: "All songs cost the same amount, 5,000 coins" },
    "The Hat Master": { type: "Tokens", cost: "652,937"},
    "Like my gun?": { type: "Coins", cost: "10,000", tip: "Need VIP/VIP+ and 10k coins for Pistol, SMG, Auto Shotgun, Scoped Rifle, Carbine skins, or get 100 pistol kills for free skin" },
    "Fancy New Toys": { type: "Coins", cost: "125,000", tip: "Need VIP/VIP+ and 10k coins for Pistol, SMG, Auto Shotgun, Scoped Rifle, Carbine skins, other gun skins are 15k, or obtain free stat skins" },
    "Warfare Stylist": { type: "Coins", cost: "4,000", tip: "Variations are 1,000 coins each, 350 for helmet, 650 for chestplate"},
    "Maximizado": { type: "Gold", cost: "15,000" },
    "Fully Upgraded": { type: "Gold", cost: "175,250", tip: "Best to do it in combination with Gold Magnate" },
    "Gold Magnate": { type: "Gold", cost: "250,000", tip: "Best to do it in combination with Fully Upgraded" },
    "I bought a thing!": { type: "Gold", cost: "10,000", tip: "Can be bought for 5k-10k gold if the item is bad" },
    "Hat Collector": { type: "Coins", cost: "522,000", tip: "Between each tier: 7,600 / 29400 / 475,000 coins" },
    "Mad Hatter": { type: "Coins", cost: "2,000", tip: "Cheapest hat is 2,000 coins" },
    "Now you see me": { type: "Coins", cost: "4,200" },
    "Explosive Death": { type: "Coins", cost: "4,200" },
    "Go home, you're drunk": { type: "Coins", cost: "4,200", tip: "You can disable distortion effects in the latest version in accessibility settings" },
    "Cheating Death": { type: "Coins", cost: "50,000" },
    "Espionage": { type: "Coins", cost: "75,000" },
    "Undercover Sloth": { type: "Coins", cost: "75,000" },
    "The Originals": { type: "Coins", cost: "150,000", tip: "Required hats are 75k coins each" },
    "Godfather": { type: "Coins", cost: "2,325,000", tip: "It is recommended to upgrade Endurance before Godfather" },
    "Endurance": { type: "Coins", cost: "3,487,500", tip: "It is recommended to upgrade Endurance before Godfather" },
    "New Style": { type: "Mystery Dust", cost: "5", tip: "Blueshell Inc's Eclipse costs 5 Mystery Dust" },
    "Mechanic": { type: "Coins", cost: "1,406", tip: "Cheapest part costs 1,406 coins" },
    "I'm Lucky": { type: "Coins", cost: "2,500" },
    "Honking Amazing": { type: "Coins", cost: "10,000" },
    "Show Off": { type: "Coins", cost: "25,000" },
    "Ungrateful": { type: "Coins", cost: "120,000", tip: "It is recommended to scrap the one you get from the Gettin' Paid achievement" },
    "Eternally Awesome": { type: "Coins", cost: "871,872", tip: "Engine = 290,623, Frame = 290,624, Turbocharger = 290,625" },
    "Getting Ready": { type: "Coins", cost: "350", tip: "Farmer, Escapist, Trap Engineer, Watch Your Step! all cost 350 coins" },
    "Getting Stronger": { type: "Coins", cost: "2,500", tip: "Adrenaline I costs 2,500 coins" },
    "MOAR!!": { type: "Coins", cost: "13,140", tip: "Cheapest kits cost 13,140 coins" },
    "This isn't VampireZ...": { type: "Coins", cost: "16,600" },
    "Conan the Barbarian": { type: "Coins", cost: "18,600" },
    "Robbed!": { type: "Coins", cost: "977,500" },
    "Experience Express": { type: "Coins", cost: "6,000" },
    "Reaching The Sky": { type: "Coins", cost: "50,000" },
    "Young Apprentice, You are not": { type: "Coins", cost: "250,000", tip: "Requires a Prestige 5 Level 20 Hero" },
    "Master of Masters": { type: "Coins", cost: "250,000", tip: "Requires 2000 kills with a Mastery" },
    "Kit Specialist": { type: "Coins", cost: "37,500", tip: "Cheapest 15 kits cost 37,500 coins" },
    "Feels Good Man": { type: "Coins", cost: "2,500", tip: "Cheapest kit cost 2,500 coins" },
    "Feels Good Man": { type: "Coins", cost: "2,500", tip: "Cheapest kit cost 2,500 coins" },
    // Tips
    "Contracts": {tip: "Purchasing the Contractor renown upgrade allows players to complete up to 8 contracts a day" },
    "Sugar Rush": {tip: "Aim for cherries, they give more gold" },
    // Maps
    "Well Traveled": { type: "Map", map: "Transport" },
    "I Am Your Shield": { type: "Map", map: "Transport" },
    "Totally Tubular": { type: "Map", map: "Transport" },
    "Paranoid much?": { type: "Map", map: "Transport" },
    "Mixed messages": { type: "Map", map: "Ancient Tomb" },
    "It's Time To Stop": { type: "Map", map: "Ancient Tomb" },
    "Beyond The Grave": { type: "Map", map: "Ancient Tomb" },
    "This Isn't A Funfair ... Maybe": { type: "Map", map: "Hypixel World" },
    "Wicked Ride": { type: "Map", map: "Hypixel World" },
    "You Did Not See That Coming!": { type: "Map", map: "Hypixel World" },
    "We're Set": { type: "Map", map: "Gold Rush" },
    "It's High Noon": { type: "Map", map: "Gold Rush" },
    "Cacti Cleared": { type: "Map", map: "Gold Rush" },
    "Storm Chaser": { type: "Map", map: "Cruise Ship" },
    "Game-ception": { type: "Map", map: "Cruise Ship" },
    "JAWS!": { type: "Map", map: "Aquarium" },
    "Dropper: Well, Well, Well": { type: "Map", map: "Floating Island" }
};

let ignoredAchs = JSON.parse(localStorage.getItem('litstats_ignored')) || [];
let bookmarkedAchs = JSON.parse(localStorage.getItem('litstats_bookmarked')) || [];
let viewMode = 'all'; // 'all', 'ignored', 'bookmarks'

window.activeTierView = {}; 
window.limits = { tiered: 12, challenge: 12, recent: 24 };

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
    localStorage.setItem('litstats_maxedHidden', maxedHidden);
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
    localStorage.setItem('litstats_excludeComp', isCompExcluded);
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
            if (tagData.type) {
                let colour = tagData.type === 'Broken' ? 'var(--red)' : tagData.type === 'Map' ? 'var(--green)' : 'var(--gold)';
                
                if (tagData.type === 'Prestige' && tagData.level) {
                    let lvl = parseInt(tagData.level, 10);
                    let bCol = lvl <= 4 ? '#5555FF' : lvl <= 9 ? '#FFFF55' : lvl <= 14 ? '#FFAA00' : 
                            lvl <= 19 ? '#FF5555' : lvl <= 24 ? '#AA00AA' : lvl <= 29 ? '#FF55FF' : 
                            lvl <= 34 ? '#FFFFFF' : lvl <= 39 ? '#55FFFF' : lvl <= 44 ? '#0000AA' : 
                            lvl <= 47 ? '#000000' : lvl <= 49 ? '#AA0000' : '#555555';
                    
                    const romanMap = { L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
                    let rStr = '', n = lvl;
                    for (let i of Object.keys(romanMap)) {
                        let q = Math.floor(n / romanMap[i]);
                        n -= q * romanMap[i];
                        rStr += i.repeat(q);
                    }
                    
                    tagsHtml += `<span class="sleek-tag" style="--tag-color: ${bCol};"><span style="color: ${bCol}; font-weight: bold;">[</span><span style="color: var(--text);">${rStr}</span><span style="color: ${bCol}; font-weight: bold;">]</span></span>`;
                } else {
                    let tagText;
                    if (tagData.type === 'Map') {
                        tagText = tagData.map;
                    } else if (tagData.cost) {
                        let num = parseInt(tagData.cost.replace(/,/g, ''), 10);
                        let formattedCost = num >= 1000000 
                            ? (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M' 
                            : num >= 1000 
                                ? (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K' 
                                : num;
                        tagText = `${formattedCost} ${tagData.type}`;
                    } else {
                        tagText = tagData.type;
                    }
                    
                    tagsHtml += `<span class="sleek-tag" style="--tag-color: ${colour};">${tagText}</span>`;
                }
            }
            
            if (tagData.renown) {
                tagsHtml += ` <span class="sleek-tag" style="--tag-color: #FFFF55; margin-left: 4px;">${tagData.renown} Renown</span>`;
            }
            
            if (tagData.tip) {
                let linkedTip = tagData.tip
                    // Convert [text](url) to a clickable hyperlink
                    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
                        let href = url.startsWith('http') ? url : `https://${url}`;
                        return `<a href="${href}" target="_blank" style="color: inherit; text-decoration: underline;">${text}</a>`;
                    })
                    // Convert remaining raw URLs
                    .replace(/(?<!["'])(https?:\/\/[^\s<]+|www\.[^\s<]+)(?![^<]*>)/g, match => {
                        let href = match.startsWith('http') ? match : `https://${match}`;
                        return `<a href="${href}" target="_blank" style="color: inherit; text-decoration: underline;">${match}</a>`;
                    })
                    // Convert newline characters to HTML line breaks
                    .replace(/\n/g, '<br>');
                    
                tipHtml = `<div class="ach-tip"><i>Tip: ${linkedTip}</i></div>`;
            }
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
        let targetStr = ach.targetAmt.toLocaleString();
        let displayStr = ach.displayAmt.toLocaleString();

        let parsedDesc = ach.desc.replace(/%%value%%|%tieramount%|\?/gi, targetStr);
        ach.desc = parsedDesc;
        
        let progressText = ach.isCompleted ? `${targetStr} / ${targetStr}` : `${displayStr} / ${targetStr}`;
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

    let displayAp = ap >= 1000 ? (ap / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : ap;
    
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

document.addEventListener("DOMContentLoaded", () => {
    const excludeCheckbox = document.getElementById('excludeComp');
    if (excludeCheckbox) excludeCheckbox.checked = isCompExcluded;

    if (maxedHidden) {
        document.getElementById('maxed-column')?.classList.add('collapsed');
        const toggleBtn = document.getElementById('toggleMaxedBtn');
        if (toggleBtn) {
            toggleBtn.innerText = "Show Max Games";
            toggleBtn.setAttribute('aria-pressed', 'true');
        }
    }
});

initCabinet();
