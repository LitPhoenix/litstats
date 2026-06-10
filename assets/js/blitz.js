// Blitz Specific Variables
const chestMap = [
    {id:'saddle', name:'Horsetamer'}, {id:'arrow', name:'Ranger'}, {id:'bow', name:'Archer'}, {id:'iron_boots', name:'Astronaut'},
    {id:'witch_spawn_egg', name:'Troll'}, {id:'cooked_beef', name:'MeatMaster'}, {id:'iron_hoe', name:'Reaper'},
    {id:'player_head', name:'Shark', customImg:'img/blitz/shark.png', scale: 0.75}, {id:'flint_and_steel', name:'RedDragon'},
    {id:'potion', name:'Toxicologist', customImg:'img/blitz/items/Splash_Potion_of_Poison.png', stack: 2}, {id:'chest', name:'Donkeytamer', customImg:'img/blitz/chest.png'},
    {id:'wooden_sword', name:'Rogue'}, {id:'potion', name:'Warlock', customImg:'img/blitz/items/Splash_Potion_of_Harming.png'}, {id:'slime_ball', name:'Slimey Slime'},
    {id:'ghast_spawn_egg',name:'Jockey'}, {id:'golden_apple', name:'Golem'}, {id:'oak_boat', name:'Viking'}, {id:'iron_pickaxe', name:'Speleologist'},
    {id:'wither_skeleton_skull',name:'Shadow Knight',customImg:'img/blitz/wither_skeleton_skull.png', scale: 0.75}, {id:'cake', name:'Baker'},
    {id:'golden_sword', name:'Knight'}, {id:'cooked_porkchop', name:'Pigman'}, {id:'potion', name:'Guardian', customImg:'img/blitz/items/Potion_of_Fire_Resistance.png'},
    {id:'feather', name:'Phoenix'}, {id:'iron_chestplate', name:'Paladin'}, {id:'rotten_flesh', name:'Necromancer'},
    {id:'potion', name:'Scout', customImg:'img/blitz/items/Potion_of_Swiftness.png', stack: 2}, {id:'grass', name:'Hunter', customImg:'img/blitz/items/Grass.png'}, {id:'stone_sword', name:'Warrior'},
    {id:'minecart', name:'Hype Train'}, {id:'fishing_rod', name:'Fisherman'}, {id:'milk_bucket', name:'Milkman'},
    {id:'cactus', name:'Florist', customImg:'img/blitz/cactus.png'}, {id:'diamond_boots', name:'Diver'}, {id:'spider_spawn_egg', name:'Arachnologist'},
    {id:'blaze_rod', name:'Blaze'}, {id:'bone', name:'Wolftamer'}, {id:'experience_bottle', name:'Tim', stack: 3},
    {id:'snowball', name:'Snowman'}, {id:'stick', name:'Rambo'}, {id:'egg', name:'Farmer'}, {id:'leather_chestplate', name:'Armorer', customImg:'img/blitz/items/leather_armor/armorer_leather_chestplate.png'},
    {id:'tnt', name:'Creepertamer', customImg:'img/blitz/tnt.png'}, null,
];
const RANDOM_IDS = ['saddle','arrow','bow','iron_boots','witch_spawn_egg','cooked_beef','iron_hoe','flint_and_steel','potion','wooden_sword','slime_ball','golden_apple','oak_boat','iron_pickaxe','cake','golden_sword','cooked_porkchop','feather','iron_chestplate','rotten_flesh','grass','stone_sword','minecart','fishing_rod','milk_bucket','diamond_boots','spider_spawn_egg','blaze_rod','bone','experience_bottle','snowball','stick','egg','leather_chestplate','tnt'];

let useRoman = localStorage.getItem('blitz_roman') === 'true';
let useClassic = localStorage.getItem('blitz_classic') === 'true';
const NUM_ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "✫✫"];
const NUM_DIGIT = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "P2"];

let rndIdx=0, rndTimer=null;
let activeKitName=null, currentLevelIndex=9;

function getBlitzAssetUrl(it) {
    if (!it) return '';
    if (it.customImg) return it.customImg;
    
    const id = (it.id || '').toLowerCase();
    const nameLower = (it.name || '').toLowerCase();
    
    if (nameLower.includes('health boost')) return 'img/blitz/items/Potion_of_Fire_Resistance.png';
    if (nameLower.includes('of harming')) return 'img/blitz/items/Splash_Potion_of_Harming.png';
    if (nameLower.includes('of wither')) return 'img/blitz/items/Splash_Potion_of_Weakness.png';
    if (nameLower.includes('splash potion of weakness')) return 'img/blitz/items/Splash_Potion_of_Weakness.png';
    if (nameLower.includes('splash potion of strength')) return 'img/blitz/items/Splash_Potion_of_Strength.png';
    if (nameLower.includes('splash potion of healing')) return 'img/blitz/items/Splash_Potion_of_Healing.png';
    if (nameLower.includes('potion of milk')) return 'img/blitz/items/Splash_Potion_of_Slowness.png';
    if (nameLower.includes('of invisibility')) return 'img/blitz/items/Splash_Potion_of_Invisibility.png';
    if (nameLower.includes('splash potion of speed')) return 'img/blitz/items/Splash_Potion_of_Swiftness.png';
    if (nameLower.includes('of speed')) return 'img/blitz/items/Potion_of_Swiftness.png';
    if (nameLower.includes('splash potion of resistance')) return 'img/blitz/items/Splash_Potion_of_Regeneration.png';
    if (nameLower.includes('splash potion of slowness')) return 'img/blitz/items/Splash_Potion_of_Slowness.png';
    if (nameLower.includes('splash potion of hunger')) return 'img/blitz/items/Splash_Potion_of_Slowness.png';
    if (nameLower.includes('splash potion of fire resistance')) return 'img/blitz/items/Splash_Potion_of_Fire_Resistance.png';
    if (nameLower.includes('splash potion of absorption')) return 'img/blitz/items/Splash_Potion_of_Fire_Resistance.png';
    if (nameLower.includes('splash potion of poison')) return 'img/blitz/items/Splash_Potion_of_Poison.png';
    if (nameLower.includes('of resistance')) return 'img/blitz/items/Potion_of_Resistance.png';
    if (nameLower === 'scout') return 'img/blitz/items/Potion_of_Speed.png';
    if (nameLower === 'shark head' || id === 'player_head') return 'img/blitz/shark.png';
    if (nameLower === 'armorer') return 'img/blitz/items/leather_armor/armorer_leather_chestplate.png';
    if (id === 'tall_grass' || id === 'grass' || id === 'short_grass') return 'img/blitz/items/Grass.png';

    return `img/blitz/items/${id}.png`;
}

function initSettings() {
    document.getElementById('toggleClassic').checked = useClassic;
    document.getElementById('toggleRoman').checked = useRoman;
    document.body.classList.toggle('theme-classic', useClassic);
    updateNumeralLabels();
}

function toggleClassicMode(isActive) {
    useClassic = isActive;
    localStorage.setItem('blitz_classic', isActive);
    document.body.classList.toggle('theme-classic', isActive);
    if (activeKitName) renderInventory();
}

function toggleRomanNumerals(isActive) {
    useRoman = isActive;
    localStorage.setItem('blitz_roman', isActive);
    updateNumeralLabels();
    if (activeKitName) renderInventory();
}

function updateNumeralLabels() {
    const labels = useRoman ? NUM_ROMAN : NUM_DIGIT;
    const colorClasses = ['2','2','2','a','a','e','e','c','c','4','6'];
    document.querySelectorAll('.level-btn').forEach((btn, i) => {
        btn.textContent = labels[i];
        btn.classList.remove('level-color-2','level-color-a','level-color-e','level-color-c','level-color-4','level-color-6');
        btn.classList.add(`level-color-${colorClasses[i]}`);
    });
}

function initChest() {
    const grid = document.getElementById('chest-grid');
    let html='';
    for (let i=0; i<45; i++) {
        if (i===44) {
            html += `<div class="slot locked" id="random-slot" title="Random Kit"><div class="item-wrapper"><img id="random-img" src="${getBlitzAssetUrl({id: RANDOM_IDS[0]})}" alt="?"></div></div>`;
        } else if (!chestMap[i]) {
            html += `<div class="slot"></div>`;
        } else {
            const k = chestMap[i];
            const imgUrl = getBlitzAssetUrl(k);
            const fallbackUrl = MCEngine.getApiFallback({id: k.id});
            const td = JSON.stringify({id:k.id, name:k.name, rarity:'uncommon', stack:k.stack||null, lines:[{text:'Click to view upgrades!', cls:'c-yellow'}], enchanted:false, customImg:k.customImg||null}).replace(/"/g,'&quot;');
            const scaleStr = k.scale ? `style="transform:scale(${k.scale})"` : '';
            const onErrorScript = `if(this.getAttribute('data-failed')){this.style.opacity='0';}else{this.setAttribute('data-failed','true');this.src='${fallbackUrl}';}`;
            
            let inner = `<div class="item-wrapper"><img src="${imgUrl}" alt="${k.name}" ${scaleStr} onerror="${onErrorScript}"></div>`;
            if (k.stack && k.stack > 1) inner += `<span class="count">${k.stack}</span>`;
            
            html += `<div class="slot" data-item="${td}" onclick="openKit('${k.name}')">${inner}</div>`;
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

function showChestView() {
    document.getElementById('inventory-view').style.display = 'none';
    document.getElementById('chest-view').style.display = 'flex';
    activeKitName = null; 
    startRandom();
    window.history.pushState(null, '', window.location.pathname);
}

function openKit(name, skipPush = false) {
    if (!window.KIT_DATABASE) window.KIT_DATABASE = {};
    if (!window.KIT_DATABASE[name]) window.KIT_DATABASE[name] = Array(11).fill().map(()=>({armour:{},hotbar:[],inv:[]}));
    
    activeKitName = name; 
    
    // Rambo only has level 1
    if (name === 'Rambo') {
        setLevel(0);
        document.querySelectorAll('.level-btn').forEach((btn, i) => {
            btn.style.display = i === 0 ? 'flex' : 'none';
        });
    } else {
        setLevel(9);
        document.querySelectorAll('.level-btn').forEach((btn) => {
            btn.style.display = 'flex';
        });
    }
    
    if (rndTimer) { clearInterval(rndTimer); rndTimer = null; }
    
    document.getElementById('chest-view').style.display = 'none';
    document.getElementById('inventory-view').style.display = 'flex';
    
    if (!skipPush) {
        const safeName = name.toLowerCase().replace(/\s+/g, '-');
        window.history.pushState({kit: name}, '', `?kit=${safeName}`);
    }
    setTimeout(() => MCEngine.initPlayerCanvas('player-canvas', 'player-box', useClassic), 50);
}

function setLevel(i) {
    currentLevelIndex = i;
    document.querySelectorAll('.level-btn').forEach((b,j) => b.classList.toggle('active', j===i));
    renderInventory();
}

function renderInventory() {
    const d = window.KIT_DATABASE[activeKitName][currentLevelIndex];
    const activeLabel = useRoman ? NUM_ROMAN[currentLevelIndex] : NUM_DIGIT[currentLevelIndex];
    
    document.getElementById('kit-name-display').innerHTML = useClassic ? 
        `${activeKitName} ${activeLabel}` : `<span style="color:var(--accent)">${activeKitName}</span> ${activeLabel}`;

    document.getElementById('armour-slots').innerHTML = ['helmet','chestplate','leggings','boots']
        .map(t => MCEngine.makeSlotHtml(d.armour[t], getBlitzAssetUrl(d.armour[t]), t)).join('');
        
    let m=''; for(let i=0; i<27; i++) m += MCEngine.makeSlotHtml(d.inv[i], getBlitzAssetUrl(d.inv[i]));
    document.getElementById('main-inv').innerHTML = m;
    
    const hb = sortHotbar(d.hotbar);
    let h=''; for(let i=0; i<9; i++) h += MCEngine.makeSlotHtml(hb[i], getBlitzAssetUrl(hb[i]));
    document.getElementById('hotbar-inv').innerHTML = h;
    
    MCEngine.initPlayerCanvas('player-canvas', 'player-box', useClassic);
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
        if (id==='bow') return 6;
        if (id==='fishing_rod') return 7;
        return 99;
    };
    const items = raw.filter(i => i && i.id && i.id !== 'compass');
    items.sort((a,b) => score(a) - score(b));
    const out = Array(9).fill(null);
    for(let i=0; i<8 && i<items.length; i++) out[i] = items[i];
    out[8] = {id: 'compass', name: 'Tracking Device', rarity: 'common'};
    return out;
}

// Tooltip formatting override specific to Blitz
document.addEventListener('tt-format', (e) => {
    const it = e.detail.item;
    let displayName = it.name;
    let wrapperClass = `r-${it.rarity}`;
    
    const isSkullOrShark = it.id && (it.id.includes('skull') || it.id.includes('shark'));
    const isArmour = it.id && (it.id.includes('helmet') || it.id.includes('chestplate') || it.id.includes('leggings') || it.id.includes('boots') || it.id.includes('skull') || it.id.includes('shark') || it.id.includes('sword') || it.id.includes('axe') || it.id.includes('bow'));
    
    if (activeKitName && isArmour) {
        const levelLabel = useRoman ? NUM_ROMAN[currentLevelIndex] : NUM_DIGIT[currentLevelIndex];
        const isGoldKit = activeKitName.includes('P2') || activeKitName.includes('✫✫');
        const baseItemName = isSkullOrShark ? it.name : `${activeKitName}'s ${it.name}`;
        
        if (isGoldKit) {
            displayName = `${baseItemName} (${levelLabel})`;
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

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    initChest();
    
    const params = new URLSearchParams(window.location.search);
    const kitParam = params.get('kit');
    
    if (kitParam && window.KIT_DATABASE) {
        const kitName = Object.keys(window.KIT_DATABASE).find(k => k.toLowerCase().replace(/\s+/g, '-') === kitParam);
        if (kitName) openKit(kitName, true);
    }
});

window.addEventListener('popstate', (e) => {
    if (e.state && e.state.kit) openKit(e.state.kit, true);
    else showChestView();
});