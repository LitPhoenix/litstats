const chestMap = [
    {id:'saddle', name:'Horsetamer', lore:'It\'s a real horse I ride'}, {id:'arrow', name:'Ranger', lore:'Gone beyond the wall'}, {id:'bow', name:'Archer', lore:'Ranged attacks.'}, {id:'iron_boots', name:'Astronaut', lore:'One mini step for man.'},
    {id:'witch_spawn_egg', name:'Troll', lore:'Trololololol.'}, {id:'cooked_beef', name:'MeatMaster', lore:'Harvset those mobs!'}, {id:'iron_hoe', name:'Reaper', lore:'Lurking in the darkness'},
    {id:'player_head', name:'Shark', customImg:'img/blitz/shark.png', scale: 0.75, lore:'*Jaws theme plays*'}, {id:'flint_and_steel', name:'RedDragon', lore:'You saw it here first'},
    {id:'potion', name:'Toxicologist', customImg:'img/blitz/items/Splash_Potion_of_Poison.png', stack: 2, lore:'Make them taste their own medicine'}, {id:'chest', name:'Donkeytamer', customImg:'img/blitz/chest.png', lore:'The finest loot'},
    {id:'wooden_sword', name:'Rogue', lore:'Sneak attack!'}, {id:'potion', name:'Warlock', customImg:'img/blitz/items/Splash_Potion_of_Harming.png', lore:'Draining is existence.'}, {id:'slime_ball', name:'Slimey Slime', lore:'It\'s kinda Slimey'},
    {id:'ghast_spawn_egg',name:'Jockey', lore:'Spawn a friend, to fight a foe!'}, {id:'golden_apple', name:'Golem', lore:'May the ancient rise again'}, {id:'oak_boat', name:'Viking', lore:'Fear my axe.'}, {id:'iron_pickaxe', name:'Speleologist', lore:'It means you like caves'},
    {id:'wither_skeleton_skull',name:'Shadow Knight',customImg:'img/blitz/wither_skeleton_skull.png', scale: 0.75, lore:'I\'m not batman.'}, {id:'cake', name:'Baker', lore:'Mmm, food!'},
    {id:'golden_sword', name:'Knight', lore:'Keep fighting!'}, {id:'cooked_porkchop', name:'Pigman', lore:'Bacon from Hell.'}, {id:'potion', name:'Guardian', customImg:'img/blitz/items/Potion_of_Fire_Resistance.png', lore:'Guarding for eternity!'},
    {id:'feather', name:'Phoenix', lore:'Reborn from the ashes'}, {id:'iron_chestplate', name:'Paladin', lore:'Justice.'}, {id:'rotten_flesh', name:'Necromancer', lore:'Living dead mobs'},
    {id:'potion', name:'Scout', customImg:'img/blitz/items/Potion_of_Swiftness.png', stack: 2, lore:'Keep running!'}, {id:'grass', name:'Hunter', customImg:'img/blitz/items/Grass.png', lore:'Chase down your prey!'}, {id:'stone_sword', name:'Warrior', lore:'Pure combat'},
    {id:'minecart', name:'Hype Train', lore:'Can\'t stop this!'}, {id:'fishing_rod', name:'Fisherman', lore:'Here - fishy fishy.'}, {id:'milk_bucket', name:'Milkman', lore:'Hits the spot!'},
    {id:'cactus', name:'Florist', customImg:'img/blitz/cactus.png', lore:'Every rose has its thorn'}, {id:'diamond_boots', name:'Diver', lore:'Dive deep into Blitz.'}, {id:'spider_spawn_egg', name:'Arachnologist', lore:'Some people might be scared'},
    {id:'blaze_rod', name:'Blaze', lore:'Burn, baby burn.'}, {id:'bone', name:'Wolftamer', lore:'Howl at the moon!'}, {id:'experience_bottle', name:'Tim', stack: 3, lore:'The Enchanter'},
    {id:'snowball', name:'Snowman', lore:'Full of festive spirit'}, {id:'stick', name:'Rambo', lore:'Blood. Sweat. Tears.'}, {id:'egg', name:'Farmer', lore:'Me chicken be layin\' eggs'}, {id:'leather_chestplate', name:'Armorer', customImg:'img/blitz/leather_armor/armorer_leather_chestplate.png', lore:'Not quite a bodyguard'},
    {id:'tnt', name:'Creepertamer', customImg:'img/blitz/tnt.png', lore:'Explosions are tasty'}, null,
];

const RANDOM_IDS = ['saddle','arrow','bow','iron_boots','witch_spawn_egg','cooked_beef','iron_hoe','flint_and_steel','potion','wooden_sword','slime_ball','golden_apple','oak_boat','iron_pickaxe','cake','golden_sword','cooked_porkchop','feather','iron_chestplate','rotten_flesh','grass','stone_sword','minecart','fishing_rod','milk_bucket','diamond_boots','spider_spawn_egg','blaze_rod','bone','experience_bottle','snowball','stick','egg','leather_chestplate','tnt'];
const NUM_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "P2"];

let rndIdx=0, rndTimer=null;
let activeKitName=null, currentLevelIndex=9;

function normalizeKey(str) {
    return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeKitMap(obj) {
    if (!obj || typeof obj !== 'object') return {};
    const normalized = {};
    for (const [key, val] of Object.entries(obj)) {
        normalized[normalizeKey(key)] = val;
    }
    return normalized;
}

function getBlitzAssetUrl(it) {
    if (!it) return '';
    if (it.customImg) return it.customImg;
    const id = (it.id || '').toLowerCase();
    
    if (id === 'potion' || id.includes('potion')) {
        const nameLower = (it.name || '').toLowerCase();
        if (nameLower.includes('health boost') || nameLower.includes('fire resistance') || nameLower.includes('absorption')) return 'img/blitz/items/Splash_Potion_of_Fire_Resistance.png';
        if (nameLower.includes('of harming')) return 'img/blitz/items/Splash_Potion_of_Harming.png';
        if (nameLower.includes('of wither') || nameLower.includes('weakness')) return 'img/blitz/items/Splash_Potion_of_Weakness.png';
        if (nameLower.includes('strength')) return 'img/blitz/items/Splash_Potion_of_Strength.png';
        if (nameLower.includes('healing')) return 'img/blitz/items/Splash_Potion_of_Healing.png';
        if (nameLower.includes('milk') || nameLower.includes('slowness') || nameLower.includes('hunger')) return 'img/blitz/items/Splash_Potion_of_Slowness.png';
        if (nameLower.includes('invisibility')) return 'img/blitz/items/Splash_Potion_of_Invisibility.png';
        if (nameLower.includes('potion of speed')) return 'img/blitz/items/Potion_of_Swiftness.png';
        if (nameLower.includes('speed') || nameLower.includes('swiftness')) return 'img/blitz/items/Splash_Potion_of_Swiftness.png';
        if (nameLower.includes('regeneration')) return 'img/blitz/items/Splash_Potion_of_Regeneration.png';
        if (nameLower.includes('poison')) return 'img/blitz/items/Splash_Potion_of_Poison.png';
        if (nameLower.includes('resistance')) return 'img/blitz/items/Potion_of_Resistance.png';
        if (nameLower === 'scout') return 'img/blitz/items/Potion_of_Swiftness.png';
    }
    
    if (id === 'player_head' || (it.name && it.name.toLowerCase() === 'shark head')) return 'img/blitz/shark.png';
    if (id === 'leather_chestplate' && it.name && it.name.toLowerCase() === 'armorer') return 'img/blitz/leather_armor/armorer_leather_chestplate.png';
    if (id === 'tall_grass' || id === 'grass' || id === 'short_grass') return 'img/blitz/items/Grass.png';

    return `img/blitz/items/${id}.png`;
}

function switchTab(panelContext, tabName) {
    const isMain = panelContext === 'main';
    const wrapperId = isMain ? 'player-summary-panel' : 'inventory-view';
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;
    
    wrapper.querySelectorAll('.panel-tab').forEach((btn, idx) => {
        if ((tabName === 'stats' && idx === 0) || (tabName === 'coins' && idx === 1)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    
    const prefix = isMain ? 'main' : 'kit';
    const statsTab = document.getElementById(`${prefix}-tab-stats`);
    const coinsTab = document.getElementById(`${prefix}-tab-coins`);
    if (statsTab) statsTab.classList.remove('active');
    if (coinsTab) coinsTab.classList.remove('active');
    
    const activeEl = document.getElementById(`${prefix}-tab-${tabName}`);
    if (activeEl) activeEl.classList.add('active');
}

function formatTime(seconds) {
    if (!seconds || seconds <= 0) return '0m';
    const m = Math.floor(seconds / 60);
    const d = Math.floor(m / 1440);
    const h = Math.floor((m % 1440) / 60);
    const mins = m % 60;
    let str = '';
    if (d > 0) str += `${d}d, `;
    if (h > 0) str += `${h}h, `;
    str += `${mins}m`;
    return str;
}

function clearStats() {
    ['wins','wlr','kills','kdr'].forEach(s => {
        const el = document.getElementById(`kit-stat-${s}`);
        if (el) el.textContent = '0';
    });
    ['kills','kdr','wins','wlr'].forEach(s => {
        const el = document.getElementById(`main-stat-${s}`);
        if (el) el.textContent = '0';
    });
    
    const kpt = document.getElementById('kit-stat-playtime');
    if (kpt) kpt.textContent = '0m';
    const mpt = document.getElementById('main-stat-playtime');
    if (mpt) mpt.textContent = '0m';
    
    const coinEls = ['coin-total-display','coin-unlocks','coin-upgrades','coin-prestiges','coin-stars','coin-lifetime','coin-spent'];
    coinEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = '0';
            el.className = (id.includes('lifetime') || id.includes('spent')) ? 'text-gold' : '';
        }
    });
}

const BASE_UNLOCKS = {
    'horsetamer': 100000, 'astronaut': 30000, 'troll': 35000, 'reaper': 10000,
    'shark': 30000, 'reddragon': 50000, 'toxicologist': 30000, 'rogue': 30000,
    'warlock': 20000, 'slimeyslime': 20000, 'jockey': 5000, 'golem': 25000,
    'viking': 10000, 'shadowknight': 15000, 'pigman': 10000, 'paladin': 20000,
    'necromancer': 30000, 'florist': 10000, 'diver': 10000, 'arachnologist': 30000,
    'blaze': 20000, 'wolftamer': 40000, 'tim': 40000, 'farmer': 10000,
    'creepertamer': 30000, 'snowman': 385000
};
const UPGRADE_COSTS = [0, 80, 400, 1000, 3000, 12000, 50000, 100000, 250000, 1000000];
const STAR_COSTS = {
    'assassin': 10000, 'wobbuffet': 20000, 'vaulthunter': 15000, 'witherwarrior': 10000,
    'gremlin': 5000, 'roulette': 10000, 'invoker': 10000, 'ironman': 10000,
    'nuke': 15000, 'ninja': 5000, 'robinhood': 10000, 'supplies': 10000,
    'shotgun': 20000, 'koolmove': 20000, 'lockdown': 5000, 'time_warp': 10000,
    'acid_rain': 15000, 'infection': 15000, 'pickpocket': 5000, 'ragnarok': 10000,
    'gladiator': 10000, 'zookeeper': 10000, 'switcheroo': 10000
};

const ULTIMATE_KITS = new Set(["phoenix", "warrior", "donkeytamer", "milkman", "ranger"]);
const ULTIMATE_ACHIEVEMENTS = {
    'ranger': 'Ranged Combat V',
    'warrior': 'Fighting Expert V',
    'phoenix': 'Kit Collector V',
    'donkeytamer': 'Mob Master V',
    'milkman': 'Kit XP Collector V'
};

const MAX_UNLOCK_COST = 1045000; 
const MAX_UPGRADE_COST = 38 * 1416480; 
const MAX_STAR_COST = 250000;

function calculateTotalCoins(kits, prestiges, currentCoins, starsArray = []) {
    let unlocks = 0, upgrades = 0, pTotal = 0, sTotal = 0;
    
    for (const [kit, level] of Object.entries(kits)) {
        const safeKit = normalizeKey(kit);
        if (level > 0) {
            if (BASE_UNLOCKS[safeKit]) unlocks += BASE_UNLOCKS[safeKit];
            
            const maxLvl = Math.min(level, 10);
            if (!ULTIMATE_KITS.has(safeKit)) {
                for (let i = 1; i <= maxLvl - 1; i++) {
                    if (UPGRADE_COSTS[i]) upgrades += UPGRADE_COSTS[i];
                }
            }
            
            const pLvl = prestiges[safeKit] || 0;
            if (pLvl >= 1) pTotal += 2000000;
            if (pLvl >= 2) pTotal += 500000; 
        }
    }
    
    for (const star of starsArray) {
        const safeStar = normalizeKey(star);
        if (STAR_COSTS[safeStar]) sTotal += STAR_COSTS[safeStar];
    }
    
    const totalSpent = unlocks + upgrades + pTotal + sTotal;
    
    return {
        total: totalSpent.toLocaleString(),
        unlocks: unlocks.toLocaleString(),
        upgrades: upgrades.toLocaleString(),
        prestiges: pTotal.toLocaleString(),
        stars: sTotal.toLocaleString(),
        current: currentCoins.toLocaleString(),
        lifetime: (totalSpent + currentCoins).toLocaleString(),
        isMaxUnlocks: unlocks >= MAX_UNLOCK_COST,
        isMaxUpgrades: upgrades >= MAX_UPGRADE_COST,
        isMaxStars: sTotal >= MAX_STAR_COST
    };
}

function updateKitCoins(kitName, selectedTierIndex) {
    const safeName = normalizeKey(kitName);
    let unlockCost = BASE_UNLOCKS[safeName] || 0;
    let unlockHtml = unlockCost > 0 ? unlockCost.toLocaleString() : "0";
    
    if (ULTIMATE_KITS.has(safeName)) {
        unlockHtml = `<span class="text-orange">${ULTIMATE_ACHIEVEMENTS[safeName] || 'Achievement'}</span>`;
    }

    let cumulativeUpgrades = 0;
    let nextTierCostHtml = "0";

    if (ULTIMATE_KITS.has(safeName)) {
        cumulativeUpgrades = 0;
        nextTierCostHtml = `<span class="text-blue">Ultimate</span>`;
    } else if (selectedTierIndex > 0) {
        const targetLvl = Math.min(selectedTierIndex + 1, 10);
        for (let i = 1; i <= targetLvl - 1; i++) {
            cumulativeUpgrades += UPGRADE_COSTS[i] || 0;
        }
    }

    if (!ULTIMATE_KITS.has(safeName)) {
        if (selectedTierIndex < 9) {
            const nextCost = UPGRADE_COSTS[selectedTierIndex + 1] || 0;
            nextTierCostHtml = `${nextCost.toLocaleString()}`;
        } else if (selectedTierIndex === 9) {
            nextTierCostHtml = "2,000,000";
        } else if (selectedTierIndex === 10) {
            nextTierCostHtml = "Max Tier";
        }
    }

    let prestigeCost = 0;
    if (selectedTierIndex === 10) {
        prestigeCost = 2500000;
    }

    const totalCost = (typeof unlockCost === 'number' ? unlockCost : 0) + cumulativeUpgrades + prestigeCost;

    const totalEl = document.getElementById('kit-coin-total');
    if (totalEl) totalEl.textContent = totalCost.toLocaleString();
    
    const unlEl = document.getElementById('kit-coin-unlock');
    if (unlEl) unlEl.innerHTML = unlockHtml;

    const upgEl = document.getElementById('kit-coin-upgrades');
    if (upgEl) upgEl.innerHTML = ULTIMATE_KITS.has(safeName) ? `<span class="text-blue">Ultimate</span>` : cumulativeUpgrades.toLocaleString();

    let nextRow = document.getElementById('kit-coin-next-tier-row');
    if (!nextRow) {
        const container = document.querySelector('#kit-tab-coins .coin-breakdown-container');
        if (container) {
            nextRow = document.createElement('div');
            nextRow.id = 'kit-coin-next-tier-row';
            nextRow.className = 'breakdown-row';
            const prestigeRow = document.getElementById('kit-coin-prestige')?.parentElement;
            if (prestigeRow) container.insertBefore(nextRow, prestigeRow);
            else container.appendChild(nextRow);
        }
    }
    if (nextRow) {
        nextRow.innerHTML = `<span>Next Upgrade</span> <span>${nextTierCostHtml}</span>`;
    }

    const presEl = document.getElementById('kit-coin-prestige');
    if (presEl) presEl.textContent = prestigeCost.toLocaleString();
}

window.enablePreviewAll = function() {
    window.PLAYER_KITS = null;
    window.PLAYER_PRESTIGES = null;
    window.KIT_STATS = null;
    
    const searchInput = document.getElementById('blitz-player-search');
    if (searchInput) searchInput.value = '';
    
    const errEl = document.getElementById('blitz-error-msg');
    if (errEl) {
        errEl.textContent = "Previewing all kits and max tiers.";
        errEl.style.color = "var(--green)";
    }
    
    localStorage.removeItem('blitz_skin_username');
    if (MCEngine.viewers) {
        Object.values(MCEngine.viewers).forEach(v => {
            try { v.loadSkin('img/skin.png'); } catch(e) {}
        });
    }
    
    const sideName = document.getElementById('side-username-label');
    if (sideName) sideName.textContent = 'Username';
    const invName = document.getElementById('inv-username-label');
    if (invName) invName.textContent = 'Username';
    
    const pSum = document.getElementById('player-summary-panel');
    if (pSum) pSum.style.display = 'none';
    const pAv = document.getElementById('player-avatar-panel');
    if (pAv) pAv.style.display = 'none';
    
    clearStats();
    showChestView(true);
    initChest();
    
    window.history.pushState({}, '', window.location.pathname);
};

async function fetchBlitzPlayer() {
    const username = document.getElementById('blitz-player-search').value.trim();
    if (!username) return;
    const errEl = document.getElementById('blitz-error-msg');
    errEl.textContent = "Loading live stats from API...";
    errEl.style.color = "var(--text-3)";

    try {
        const dbRes = await fetch(`https://playerdb.co/api/player/minecraft/${username}`);
        if (dbRes.status === 429) throw new Error("Rate Limited by PlayerDB.");
        const dbData = await dbRes.json();
        if (dbData.code !== 'player.found') throw new Error("Player not found.");
        const uuid = dbData.data.player.raw_id;

        const isLocalVercel = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '3000';
        const apiUrl = isLocalVercel 
            ? `/api/player?uuid=${uuid}` 
            : `https://api.litstats.com/api/player?uuid=${uuid}`;

        const res = await fetch(apiUrl);
        if (res.status === 429) throw new Error("Rate Limited by Hypixel.");
        const vData = await res.json();
        if (vData.error) throw new Error(vData.error);

        if (vData.blitzKits) {
            window.PLAYER_KITS = normalizeKitMap(vData.blitzKits);
            window.PLAYER_PRESTIGES = normalizeKitMap(vData.blitzPrestiges || {});
            window.KIT_STATS = normalizeKitMap(vData.kitStats || {});
            
            const os = vData.overallStats || {};
            const totalWins = (os.wins_solo_normal || 0) + (os.wins_teams_normal || 0);
            const totalDeaths = os.deaths || 0;
            
            document.getElementById('main-stat-kills').textContent = (os.kills || 0).toLocaleString();
            document.getElementById('main-stat-kdr').textContent = totalDeaths > 0 ? (os.kills / totalDeaths).toFixed(2) : os.kills || 0;
            document.getElementById('main-stat-wins').textContent = totalWins.toLocaleString();
            document.getElementById('main-stat-wlr').textContent = totalDeaths > 0 ? (totalWins / totalDeaths).toFixed(2) : totalWins;
            document.getElementById('main-stat-playtime').textContent = formatTime(os.timePlayed || 0);
            
            const soloWins = os.wins_solo_normal || 0;
            const teamWins = os.wins_teams_normal || 0;
            const soloPct = totalWins > 0 ? (soloWins / totalWins) * 100 : 50;

            const winBar = document.getElementById('main-win-bar');
            if (winBar) {
                winBar.style.background = `linear-gradient(to right, #FF5555 ${soloPct}%, #5555FF ${soloPct}%)`;
            }
            
            const costData = calculateTotalCoins(window.PLAYER_KITS, window.PLAYER_PRESTIGES, vData.currentCoins || 0, vData.blitzStars || []);
            
            document.getElementById('coin-total-display').textContent = costData.current;
            
            const uEl = document.getElementById('coin-unlocks');
            uEl.textContent = costData.unlocks;
            uEl.className = costData.isMaxUnlocks ? 'text-gold' : '';
            
            const upEl = document.getElementById('coin-upgrades');
            upEl.textContent = costData.upgrades;
            upEl.className = costData.isMaxUpgrades ? 'text-gold' : '';
            
            const sEl = document.getElementById('coin-stars');
            sEl.textContent = costData.stars;
            sEl.className = costData.isMaxStars ? 'text-gold' : '';
            
            document.getElementById('coin-prestiges').textContent = costData.prestiges;
            
            const lifeEl = document.getElementById('coin-lifetime');
            if (lifeEl) lifeEl.textContent = costData.lifetime;

            document.getElementById('coin-spent').textContent = costData.total;
        } else {
            throw new Error("API did not return Blitz Survival Games data.");
        }

        errEl.textContent = `Showing unlocked kits for ${dbData.data.player.username}`;
        errEl.style.color = "var(--green)"; 
        
        document.getElementById('side-username-label').textContent = dbData.data.player.username;
        document.getElementById('inv-username-label').textContent = dbData.data.player.username;
        
        if (MCEngine.viewers) {
            Object.values(MCEngine.viewers).forEach(v => v.loadSkin(`https://minotar.net/skin/${dbData.data.player.username}`));
        }
        localStorage.setItem('blitz_skin_username', dbData.data.player.username);
        
        switchTab('main', 'stats');
        document.getElementById('player-summary-panel').style.display = 'flex';
        document.getElementById('player-avatar-panel').style.display = 'flex';
        showChestView(true);
        initChest(); 
        window.history.pushState({}, '', window.location.pathname);
        
    } catch(e) {
        if (e.message.includes('Failed to fetch') && window.location.port === '5500') {
            errEl.textContent = "CORS Blocked: Please run 'vercel dev' on port 3000 to test locally.";
        } else {
            errEl.textContent = e.message;
        }
        errEl.style.color = "var(--red)";
    }
}

document.getElementById('blitz-player-search').addEventListener('keydown', e => {
    if (e.key === 'Enter') fetchBlitzPlayer();
});

function initChest() {
    const grid = document.getElementById('chest-grid');
    let html='';
    const starImg = `<img src="img/blitz/star_texture.png" class="tt-p2-star" alt="*">`;
    
    for (let i=0; i<45; i++) {
        if (i===44) {
            html += `<div class="slot" id="random-slot" title="Random Kit"><div class="item-wrapper"><img id="random-img" src="${getBlitzAssetUrl({id: RANDOM_IDS[0]})}" alt="?"></div></div>`;
        } else if (!chestMap[i]) {
            html += `<div class="slot"></div>`;
        } else {
            const k = chestMap[i];
            const safeName = normalizeKey(k.name);
            let isLocked = false;
            let displayTitle = k.name;
            let ownedLevel = 0;
            let pLvl = 0;
            
            if (window.PLAYER_KITS) {
                ownedLevel = window.PLAYER_KITS[safeName] || 0;
                pLvl = window.PLAYER_PRESTIGES ? (window.PLAYER_PRESTIGES[safeName] || 0) : 0;
                
                if (ownedLevel === 0) {
                    isLocked = true;
                } else if (pLvl >= 2) {
                    displayTitle = `${k.name} ${starImg}${starImg}`;
                } else if (pLvl === 1) {
                    displayTitle = `${k.name} ${starImg}`;
                } else {
                    displayTitle = `${k.name} ${NUM_ROMAN[ownedLevel - 1]}`;
                }
            }

            if (isLocked) {
                const imgUrl = "https://api.minecraftitems.xyz/api/item/red_stained_glass_pane?apiKey=mcapi_5cb1f0643162ea2f7b0aa174d27061cdfa1f35c318532b602a9bf86045063ff9&size=4&glint=false";
                const td = JSON.stringify({id:'red_stained_glass_pane', name:`Locked: ${k.name}`, rarity:'common', lines:[{text:'Player does not own this kit.', cls:'c-red'}]}).replace(/"/g,'&quot;');
                html += `<div class="slot" data-item="${td}"><div class="item-wrapper"><img src="${imgUrl}" alt="Locked"></div></div>`;
            } else {
                const imgUrl = getBlitzAssetUrl(k);
                
                let lines = [];
                if (k.lore) lines.push({text: k.lore, cls: 'c-grey'});
                lines.push({text: ' ', cls: ''});
                lines.push({text:'Click to view upgrades!', cls:'c-yellow'});
                
                const td = JSON.stringify({id:k.id, name:displayTitle, rarity:'uncommon', stack:k.stack||null, lines:lines, enchanted:false, customImg:k.customImg||null}).replace(/"/g,'&quot;');
                const onErrorScript = "this.style.opacity='0';";
                
                let extraClass = '';
                if (window.PLAYER_KITS && ownedLevel > 0) {
                    if (pLvl >= 1) extraClass = ` lvl-p1`;
                    else extraClass = ` lvl-${ownedLevel}`;
                }

                let inner = `<div class="item-wrapper"><img src="${imgUrl}" alt="${k.name}" onerror="${onErrorScript}"></div>`;
                if (k.stack && k.stack > 1) inner += `<span class="count">${k.stack}</span>`;
                html += `<div class="slot${extraClass}" data-item="${td}" onclick="openKit('${k.name}')">${inner}</div>`;
            }
        }
    }
    grid.innerHTML = html;
    startRandom();
}

function startRandom() {
    if (rndTimer) clearInterval(rndTimer);
    rndTimer = setInterval(() => {
        rndIdx = (rndIdx+1) % RANDOM_IDS.length;
        const img = document.getElementById('random-img');
        if (img) img.src = getBlitzAssetUrl({id: RANDOM_IDS[rndIdx]});
    }, 800);
}

function showChestView(skipPush = false) {
    document.getElementById('inventory-view').style.display = 'none';
    document.getElementById('main-menu-layout').style.display = 'flex';
    activeKitName = null; 
    
    startRandom();
    
    if (!skipPush) {
        window.history.pushState({chest: true}, '', window.location.pathname);
    }
}

function openKit(name, skipPush = false) {
    if (!window.KIT_DATABASE) window.KIT_DATABASE = {};
    if (!window.KIT_DATABASE[name]) window.KIT_DATABASE[name] = Array(11).fill().map(()=>({armour:{},hotbar:[],inv:[]}));
    
    activeKitName = name; 
    
    let maxLevel = 11;
    const safeName = normalizeKey(name);
    
    if (window.PLAYER_KITS && name !== 'Rambo') {
        maxLevel = window.PLAYER_KITS[safeName] || 0;
    }

    document.querySelectorAll('.level-btn').forEach((btn, i) => {
        if (name === 'Rambo') {
            btn.style.display = i === 0 ? 'flex' : 'none';
        } else {
            btn.style.display = 'flex';
            if (window.PLAYER_KITS && (i + 1 > maxLevel)) {
                btn.classList.add('unowned-tier');
            } else {
                btn.classList.remove('unowned-tier');
            }
        }
    });

    const hasPlayer = Boolean(window.PLAYER_KITS);
    const tabsWrapper = document.querySelector('#inventory-view .panel-tabs');
    const statsTabBtn = tabsWrapper?.querySelectorAll('.panel-tab')[0];
    const coinsTabBtn = tabsWrapper?.querySelectorAll('.panel-tab')[1];
    
    if (!hasPlayer) {
        if (statsTabBtn) statsTabBtn.style.display = 'none';
        if (coinsTabBtn) coinsTabBtn.style.display = 'none';
        switchTab('kit', 'coins');
    } else {
        if (statsTabBtn) statsTabBtn.style.display = 'flex';
        if (coinsTabBtn) coinsTabBtn.style.display = 'flex';
        switchTab('kit', 'stats');
    }

    if (rndTimer) { clearInterval(rndTimer); rndTimer = null; }
    
    if (window.KIT_STATS) {
        const ks = window.KIT_STATS[safeName] || {};
        const kWins = ks.wins || 0;
        const kKills = ks.kills || 0;
        const kLosses = ks.losses || 0; 

        document.getElementById('kit-stat-wins').textContent = kWins.toLocaleString();
        document.getElementById('kit-stat-wlr').textContent = kLosses > 0 ? (kWins / kLosses).toFixed(2) : kWins;
        document.getElementById('kit-stat-kills').textContent = kKills.toLocaleString();
        document.getElementById('kit-stat-kdr').textContent = kLosses > 0 ? (kKills / kLosses).toFixed(2) : kKills;
        document.getElementById('kit-stat-playtime').textContent = formatTime(ks.timePlayed || 0);
    } else {
        clearStats();
    }

    document.getElementById('main-menu-layout').style.display = 'none';
    document.getElementById('inventory-view').style.display = 'flex';
    
    if (name !== 'Rambo') {
        setLevel(window.PLAYER_KITS ? Math.max(0, maxLevel - 1) : 9);
    } else {
        setLevel(0);
    }
    
    if (!skipPush) {
        window.history.pushState({kit: name}, '', window.location.pathname + '?kit=' + safeName);
    }
}

function setLevel(i) {
    currentLevelIndex = i;
    document.querySelectorAll('.level-btn').forEach((b,j) => b.classList.toggle('active', j===i));
    renderInventory();
    if (activeKitName) {
        updateKitCoins(activeKitName, currentLevelIndex);
    }
}

function renderInventory() {
    const d = window.KIT_DATABASE[activeKitName][currentLevelIndex];
    const activeLabel = NUM_ROMAN[currentLevelIndex];
    
    let pLvl = 0;
    if (window.PLAYER_PRESTIGES) pLvl = window.PLAYER_PRESTIGES[normalizeKey(activeKitName)] || 0;
    
    let displayLabel = ` ${activeLabel}`;
    
    if (currentLevelIndex === 10) {
        displayLabel = ` <img src="img/blitz/star_texture.png" class="kit-title-p2-star" alt="*"><img src="img/blitz/star_texture.png" class="kit-title-p2-star" alt="*">`;
    } else if (currentLevelIndex === 9 && pLvl >= 1) {
        displayLabel = ` <img src="img/blitz/star_texture.png" class="kit-title-p2-star" alt="*">`;
    }

    const kData = chestMap.find(k => k && k.name === activeKitName) || { id: 'stick' };
    const kImg = getBlitzAssetUrl(kData);
    
    const topNameEl = document.getElementById('top-kit-name');
    if (topNameEl) topNameEl.innerHTML = `${activeKitName}${displayLabel}`;
    
    const topIconEl = document.getElementById('top-kit-icon');
    if (topIconEl) topIconEl.src = kImg;

    let isOwned = true;
    if (window.PLAYER_KITS && activeKitName !== 'Rambo') {
        const safeName = normalizeKey(activeKitName);
        const ownedLevel = window.PLAYER_KITS[safeName] || 0;
        if (currentLevelIndex + 1 > ownedLevel) isOwned = false;
    }
    
    const invContainer = document.getElementById('inventory-container');
    if (!isOwned) invContainer.classList.add('locked-tier-view');
    else invContainer.classList.remove('locked-tier-view');

    document.getElementById('armour-slots').innerHTML = ['helmet','chestplate','leggings','boots']
        .map(t => MCEngine.makeSlotHtml(d.armour[t], getBlitzAssetUrl(d.armour[t]), t)).join('');
        
    let m=''; for(let i=0; i<27; i++) m += MCEngine.makeSlotHtml(d.inv[i], getBlitzAssetUrl(d.inv[i]));
    document.getElementById('main-inv').innerHTML = m;
    
    const hb = sortHotbar(d.hotbar);
    let h=''; for(let i=0; i<9; i++) h += MCEngine.makeSlotHtml(hb[i], getBlitzAssetUrl(hb[i]));
    document.getElementById('hotbar-inv').innerHTML = h;
}

function sortHotbar(raw) {
    const hasEnch = (it,txt) => it.lines && it.lines.some(l => l.text.toLowerCase().includes(txt));
    const score = it => {
        const id = it.id.toLowerCase();
        if (id.includes('_sword')) return 1;
        if (id.includes('_axe')) return 2;
        if (hasEnch(it,'sharpness')) return 3;
        if (id.includes('_pickaxe')) return 4;
        if (id==='stick' || id==='ghast_tear') return 5;
        if (id.includes('_shovel')) return 6;
        if (id==='bow') return 7;
        if (id==='fishing_rod') return 8;
        return 99;
    };
    const items = raw.filter(i => i && i.id && i.id !== 'compass');
    items.sort((a,b) => score(a) - score(b));
    const out = Array(9).fill(null);
    for(let i=0; i<8 && i<items.length; i++) out[i] = items[i];
    out[8] = {id: 'compass', name: 'Tracking Device', rarity: 'common'};
    return out;
}

function getPotionEffectText(it) {
    if (!it) return null;
    const raw = ((it && it.rawName) || it.name || '').trim();
    if (!raw.toLowerCase().includes('potion')) return null;

    const m = raw.match(/^(.*)\(([^)]+)\)\s*$/);
    let effectPart = raw;
    let duration = '';
    if (m) {
        effectPart = m[1].trim();
        duration = m[2].trim();
    }

    effectPart = effectPart.replace(/^(splash potion of|potion of)\s+/i, '').trim();
    const parts = effectPart.split(/\s*(?:&|,|and)\s*/i).map(s => s.trim()).filter(Boolean);

    const instantKeywords = ['healing', 'harming', 'instant', 'milk'];
    return parts.map(p => {
        let dur = duration || '';
        if (!dur) {
            const lower = p.toLowerCase();
            if (instantKeywords.some(k => lower.includes(k))) dur = 'Instant';
        }
        return { effect: p, duration: dur };
    });
}

document.addEventListener('tt-format', (e) => {
    const it = e.detail.item;
    const potionInfos = getPotionEffectText(it);
    if (potionInfos && potionInfos.length) {
        if (!it.lines) it.lines = [];
        for (const pi of potionInfos) {
            const lineText = pi.duration ? `${pi.effect} (${pi.duration})` : `${pi.effect}`;
            if (!it.lines.some(l => l && l.text && l.text.indexOf(pi.effect) !== -1)) {
                it.lines.push({ text: lineText, cls: 'c-grey' });
            }
        }
    }
    let displayName = it.name;
    let wrapperClass = `r-${it.rarity}`;
    
    const isSkullOrShark = it.id && (it.id.includes('skull') || it.id.includes('shark'));
    const isArmour = it.id && (it.id.includes('helmet') || it.id.includes('chestplate') || it.id.includes('leggings') || it.id.includes('boots') || it.id.includes('skull') || it.id.includes('shark') || it.id.includes('sword') || it.id.includes('axe') || it.id.includes('bow'));
    
    if (activeKitName && isArmour) {
        const levelLabel = NUM_ROMAN[currentLevelIndex];
        const isGoldKit = currentLevelIndex === 10 || activeKitName.includes('P2') || activeKitName.includes('✫✫');
        const baseItemName = isSkullOrShark ? it.name : `${activeKitName}'s ${it.name}`;
        
        let pLvl = 0;
        if (window.PLAYER_PRESTIGES) pLvl = window.PLAYER_PRESTIGES[normalizeKey(activeKitName)] || 0;

        let starsHTML = `<img src="img/blitz/star_texture.png" class="tt-p2-star" alt="*"><img src="img/blitz/star_texture.png" class="tt-p2-star" alt="*">`;
        if (pLvl === 1 && currentLevelIndex === 9) starsHTML = `<img src="img/blitz/star_texture.png" class="tt-p2-star" alt="*">`;
        
        if (isGoldKit || (currentLevelIndex === 9 && pLvl >= 1)) {
            displayName = `<span style="color:#FFAA00">${baseItemName}</span> <span style="color:#FFAA00">(${starsHTML})</span>`;
            wrapperClass = 'r-legendary'; 
        } else {
            displayName = `<span class="r-common">${baseItemName}</span> <span class="c-grey">(${levelLabel})</span>`;
            wrapperClass = ''; 
        }
    }

    displayName = displayName.replace(/(\[[^\]]+\])/g, '<span style="color:#FFAA00">$1</span>');

    let h = `<span class="tt-name ${wrapperClass}">${displayName}</span>`;
    if (it.lines && it.lines.length) {
        for (const l of it.lines) h += `<span class="tt-line ${l.cls || ''}">${l.text}</span>`;
    }
    e.detail.html = h;
});

document.addEventListener('DOMContentLoaded', () => {
    localStorage.removeItem('blitz_skin_username');
    
    setTimeout(() => {
        MCEngine.initPlayerCanvas('player-canvas-main', 'side-player-box-id');
        MCEngine.initPlayerCanvas('player-canvas-inv', 'inv-player-box-id');
        if (MCEngine.viewers) {
            Object.values(MCEngine.viewers).forEach(v => {
                try { v.loadSkin('img/skin.png'); } catch(e) {}
            });
        }
    }, 100);

    initChest();
    
    const params = new URLSearchParams(window.location.search);
    const kitParam = params.get('kit');
    
    if (kitParam && window.KIT_DATABASE) {
        const kitName = Object.keys(window.KIT_DATABASE).find(k => normalizeKey(k) === normalizeKey(kitParam));
        if (kitName) openKit(kitName, true);
    }
});

window.addEventListener('popstate', (e) => {
    if (e.state && e.state.kit) openKit(e.state.kit, true);
    else showChestView(true);
});
