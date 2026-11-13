let globalPlayerData = null;
let activeGameFilters = new Set();
let searchQuery = '';
let apChartInstance = null;
let comparisonPlayers = [];
let localAPDataCache = null;
let historicalArchiveData = {};

let isCompExcluded = localStorage.getItem('litstats_excludeComp') === 'true';
let isMultiSelect = localStorage.getItem('litstats_multiSelect') === 'true';
let isMultiExclude = localStorage.getItem('litstats_multiExclude') === 'true';
let isHighestTierOnly = localStorage.getItem('litstats_highestTier') === 'true';
let isHistoryHidden = localStorage.getItem('litstats_historyHidden') === 'true';
let isMaxesHidden = localStorage.getItem('litstats_maxesHidden') === 'true';
let isGoldApEnabled = localStorage.getItem('litstats_gold_ap') === 'true';
let uiDensity = localStorage.getItem('litstats_density') || 'comfortable';   // 'comfortable' | 'compact' | 'list'
let uiFilterStyle = localStorage.getItem('litstats_filterStyle') || 'auto';  // 'auto' (compact chips in list layout) | 'grid' | 'chips'
if (!['auto', 'grid', 'chips'].includes(uiFilterStyle)) uiFilterStyle = 'auto';
const DISPLAY_DEFAULTS = { heroPct: true, cardAp: true, tierPct: false, chalPct: true, rarity: true };
let uiTierStyle = localStorage.getItem('litstats_tierStyle') === 'dots' ? 'dots' : 'chip';   // List layout: numbered chip or colour dots
let displayPrefs = { ...DISPLAY_DEFAULTS };
try { Object.assign(displayPrefs, JSON.parse(localStorage.getItem('litstats_display') || '{}')); } catch (e) {}

let showSecretTags = localStorage.getItem('litstats_showSecret') !== 'false';
let showBrokenTags = localStorage.getItem('litstats_showBroken') !== 'false';

let progressDisplayMode = localStorage.getItem('litstats_progressMode') || 'points'; 
let filterLabelMode = localStorage.getItem('litstats_filterLabelMode') || 'percent'; 

let isShowCompleted = localStorage.getItem('litstats_showCompleted') === 'true';
let isLegacyMode = false;

let activeMwClass = null;
let activeArcadeGame = null;
let activeTntGame = null;
let activeWoolGame = null;

const mwClassesList = ["Angel", "Arcanist", "Assassin", "Automaton", "Blaze", "Cow", "Creeper", "Dragon", "Dreadlord", "Enderman", "Golem", "Herobrine", "Hunter", "Moleman", "Phoenix", "Pigman", "Pirate", "Renegade", "Shaman", "Shark", "Sheep", "Skeleton", "Snowman", "Spider", "Squid", "Werewolf", "Zombie", "Legendary", "Other"];
const arcadeGamesList = ["Blocking Dead", "Bounty Hunters", "Creeper Attack", "Disasters", "Dragon Wars", "Dropper", "Ender Spleef", "Farm Hunt", "Football", "Galaxy Wars", "Hide and Seek", "Hole in the Wall", "Hypixel Says", "Mini Walls", "Party Games", "Pixel Painters", "Pixel Party", "Throw Out", "Zombies", "Other"];
const tntGamesList = ["Bow Spleef", "PVP Run", "TNT Run", "TNT Tag", "TNT Wizards", "Other"];
const woolGamesList = ["Capture the Wool", "Sheep Wars", "Wool Wars", "Other"];


// Bed Wars Dreamfeast "main path": 21 items, bought with Ticket Tarts at 1, 5, 10, 15 ... 95, 100 (1,051 total).
// The 21 apiKeys in path order (cheapest first), taken from menuConfig on the Bed Wars page.
const BW_MAIN_PATH_KEYS = [
  "appetizer_boon", "first_dream_of_wood_skins", "dream_of_animals", "first_nightmare_of_challenges", "first_course_boon",
  "dream_of_prestige_stars", "first_dream_of_shopkeeper_skins", "second_nightmare_of_challenges", "second_course_boon", "second_dream_of_wood_skins",
  "dream_of_prestige_brackets", "third_nightmare_of_challenges", "third_course_boon", "team_color_selector", "dream_of_prestige_formatting",
  "dream_of_kill_messages", "fourth_course_boon", "second_dream_of_shopkeeper_skins", "dream_of_prestige", "golden_starting_sword", "dessert_boon"
];   // costs 1, 5, 10, 15 ... 95, 100 tarts
const bwTartCost = i => i === 0 ? 1 : i * 5;                 // 1, 5, 10, ... 100
const BW_MAIN_PATH_TOTAL = 1051;

function bwDreamfeastMainPath(data) {
  if (BW_MAIN_PATH_KEYS.length !== 21) return null;           // not configured yet: card falls back to a plain challenge
  const bw = (data && data.bedwars) || {};
  const boon = bw.boon || {}, feast = bw.dreamfeast || {}, toggles = bw.toggles || {};
  const owned = key => {                                      // same unlock test the Dreamfeast page uses
    const lower = key.toLowerCase();
    return Boolean(boon[key] || boon[lower] || boon[key.replace('_boon', '')] || feast[key] || feast[lower] || feast[`${key}_boon`] || toggles[key] || toggles[lower]);
  };
  let items = 0, tarts = 0, next = null;
  BW_MAIN_PATH_KEYS.forEach((key, i) => {
    if (owned(key)) { items++; tarts += bwTartCost(i); }
    else if (next === null) next = i;
  });
  return {
    current: tarts,
    note: items >= 21 ? `All 21 main path items bought` : `${items} / 21 main path items${next !== null ? ` · next one costs ${bwTartCost(next)} Tart${bwTartCost(next) === 1 ? '' : 's'}` : ''}`
  };
}

const CustomChallengeTrackers = {
  "bedwars:luciddreamsoffeastfood": { compute: bwDreamfeastMainPath, max: BW_MAIN_PATH_TOTAL, unit: "Tarts" },
  "blitz:brutalwarrior": { path: ["rawStats", "HungerGames", "exp_warrior"], max: 10000 },
  "donkeytamermaster": { path: ["rawStats", "HungerGames", "exp_donkeytamer"], max: 10000 },
  "firstranger": { path: ["rawStats", "HungerGames", "exp_ranger"], max: 10000 },
  "phoenixmaster": { path: ["rawStats", "HungerGames", "exp_phoenix"], max: 10000 },
  "iveseenitall": {
  paths: [
    { path: ["rawStats", "GingerBread", "gold_trophy_canyon"], req: 1, label: "Canyon" },
    { path: ["rawStats", "GingerBread", "gold_trophy_olympus"], req: 1, label: "Olympus" },
    { path: ["rawStats", "GingerBread", "gold_trophy_junglerush"], req: 1, label: "Jungle Rush" },
    { path: ["rawStats", "GingerBread", "gold_trophy_retro"], req: 1, label: "Retro" },
    { path: ["rawStats", "GingerBread", "gold_trophy_hypixelgp"], req: 1, label: "Hypixel GP" }
  ],
  max: 5
},
"veteran": { path: ["rawAchievements", "walls3_jack_of_all_trades"], max: 12 },
"blitz:jackofalltrades": { path: ["rawAchievements", "blitz_kit_collector"], max: 31 },
"champion!": { path: ["rawStats", "uhc", "score"], max: 10000 },
}



const MW_CUSTOM_MAPPINGS = {
  "bigleap": "Spider",
  "unbridledriches": "Dragon",
  "configuration": "Automaton",
  "contractkiller": "Assassin",
  "teamkill": "Sheep",
  "snowballfight": "Snowman",
  "unwavering": "Angel",
  "borntalented": "Renegade",
  "soulbbq": "Pigman",
  "kingofthesprings": "Pigman"
};

function getMwClassForAchievement(title, desc) {
  const cleanT = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const tLow = title.toLowerCase();
  const dLow = (desc || '').toLowerCase();

  if (MW_CUSTOM_MAPPINGS[cleanT]) return MW_CUSTOM_MAPPINGS[cleanT];
  if (tLow.includes('legendary')) return 'Legendary';
  if (normalizedSkinRewards[cleanT]?.mwClass) {
    const cls = normalizedSkinRewards[cleanT].mwClass;
    return cls.charAt(0).toUpperCase() + cls.slice(1);
  }
  if (MWSkinData[cleanT]?.class) return MWSkinData[cleanT].class;

  for (const cls of mwClassesList) {
    if (cls === 'Other' || cls === 'Legendary') continue;
    const cLow = cls.toLowerCase();
    if (tLow.includes(cLow) || dLow.includes(cLow)) return cls;
  }
  return 'Other';
}

const TNT_CUSTOM_MAPPINGS = {
  "sorcery": "TNT Wizards",
  "prosurfer": "TNT Wizards",
  "havefun": "Bow Spleef",
  "asecondchance": "TNT Tag",
  "holeinmypocket": "Other",
  "conqueror": "Other",
  "triathlon": "Other",
  "banker": "Other",
  "iknowhowthisworks": "Other",
  "skilled": "Other",
  "spooky": "Other"
};

function getTntGameForAchievement(title, desc) {
  const cleanT = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (TNT_CUSTOM_MAPPINGS[cleanT]) return TNT_CUSTOM_MAPPINGS[cleanT];

  const combined = `${title} ${desc || ''}`.toLowerCase();
  if (combined.includes('wizard')) return 'TNT Wizards';
  if (combined.includes('tag')) return 'TNT Tag';
  if (combined.includes('bow spleef') || combined.includes('spleef')) return 'Bow Spleef';
  if (combined.includes('pvp run')) return 'PVP Run';
  if (combined.includes('tnt run')) return 'TNT Run';

  return 'Other';
}

function getArcadeGameForAchievement(title, desc) {
  const combined = `${title} ${desc || ''}`.toLowerCase();
  for (const game of arcadeGamesList) {
    if (game === 'Other') continue;
    if (combined.includes(game.toLowerCase())) return game;
  }
  return 'Other';
}

function getWoolGameForAchievement(title, desc) {
  const combined = `${title} ${desc || ''}`.toLowerCase();
  for (const game of woolGamesList) {
    if (game === 'Other') continue;
    if (combined.includes(game.toLowerCase())) return game;
  }
  return 'Other';
}

window.toggleLegacyMode = function() {
  isLegacyMode = !isLegacyMode;
  document.getElementById('toggle-legacy-btn').classList.toggle('active', isLegacyMode);
  updateProgressDisplay();
  populateFilters();
  renderDashboard();
};

window.toggleShowCompleted = function() {
  isShowCompleted = !isShowCompleted;
  localStorage.setItem('litstats_showCompleted', isShowCompleted);
  document.getElementById('toggle-completed-btn').classList.toggle('active', isShowCompleted);
  populateFilters();
  renderDashboard();
};

window.setLegacyMode = function(mode) {
  isLegacyMode = mode;
  document.getElementById('tab-normal').classList.toggle('active', !mode);
  document.getElementById('tab-legacy').classList.toggle('active', mode);
  updateProgressDisplay();
  populateFilters();
  renderDashboard();
};

window.clearSearch = function(id) {
  const input = document.getElementById(id);
  if(input) {
    input.value = '';
    if(id === 'achSearch') handleAchSearch();
  }
};

window.pinCurrentPlayer = function() {
  if (!globalPlayerData) return;
  const currentPinned = localStorage.getItem('litstats_pinnedPlayer');
  
  if (currentPinned === globalPlayerData.username) {
    localStorage.removeItem('litstats_pinnedPlayer');
    document.getElementById('pinned-player-container').classList.add('hidden');
  } else {
    localStorage.setItem('litstats_pinnedPlayer', globalPlayerData.username);
    loadPinnedPlayer();
  }
};

function loadPinnedPlayer() {
  const pinned = localStorage.getItem('litstats_pinnedPlayer');
  const container = document.getElementById('pinned-player-container');
  if (pinned) {
    container.innerHTML = `📌 ${pinned}`;
    container.classList.remove('hidden');
    container.onclick = () => window.location.href = `/cabinet?player=${pinned}`;
  }
}

const compGames = ["Mega Walls", "Pit", "UHC"];

window.activeTierView = {}; 
window.limits = { tiered: 48, challenge: 48, recent: 20 };
let viewMode = 'all'; 
let ignoredAchs = JSON.parse(localStorage.getItem('litstats_ignored')) || [];
let bookmarkedAchs = JSON.parse(localStorage.getItem('litstats_bookmarked')) || [];

const countryFlags = {
  'argentina': 'ar', 'ar': 'ar', 'australia': 'au', 'au': 'au',
  'austria': 'at', 'at': 'at', 'belgium': 'be', 'be': 'be',
  'brazil': 'br', 'br': 'br', 'bulgaria': 'bg', 'bg': 'bg',
  'canada': 'ca', 'ca': 'ca', 'china': 'cn', 'cn': 'cn',
  'croatia': 'hr', 'hr': 'hr', 'czech republic': 'cz', 'czech_republic': 'cz', 'cz': 'cz',
  'denmark': 'dk', 'dk': 'dk', 'ecuador': 'ec', 'ec': 'ec',
  'finland': 'fi', 'fi': 'fi', 'france': 'fr', 'fr': 'fr',
  'germany': 'de', 'de': 'de', 'greece': 'gr', 'gr': 'gr',
  'hungary': 'hu', 'hu': 'hu', 'india': 'in', 'in': 'in',
  'iraq': 'iq', 'iq': 'iq', 'ireland': 'ie', 'ie': 'ie',
  'israel': 'il', 'il': 'il', 'italy': 'it', 'it': 'it',
  'japan': 'jp', 'jp': 'jp', 'mexico': 'mx', 'mx': 'mx',
  'moldova': 'md', 'md': 'md', 'new zealand': 'nz', 'new_zealand': 'nz', 'nz': 'nz',
  'norway': 'no', 'no': 'no', 'poland': 'pl', 'pl': 'pl',
  'portugal': 'pt', 'pt': 'pt', 'romania': 'ro', 'ro': 'ro',
  'russia': 'ru', 'ru': 'ru', 'saudi arabia': 'sa', 'saudi_arabia': 'sa', 'sa': 'sa',
  'serbia': 'rs', 'rs': 'rs', 'south korea': 'kr', 'south_korea': 'kr', 'korea': 'kr', 'kr': 'kr',
  'spain': 'es', 'es': 'es', 'sweden': 'se', 'se': 'se',
  'switzerland': 'ch', 'ch': 'ch', 'syria': 'sy', 'sy': 'sy',
  'taiwan': 'tw', 'tw': 'tw', 'the netherlands': 'nl', 'netherlands': 'nl', 'the_netherlands': 'nl', 'nl': 'nl',
  'turkey': 'tr', 'tr': 'tr', 'uk': 'gb', 'united kingdom': 'gb', 'united_kingdom': 'gb', 'gb': 'gb',
  'ukraine': 'ua', 'ua': 'ua', 'usa': 'us', 'us': 'us', 'united states': 'us', 'united_states': 'us',
  'chile': 'cl', 'cl': 'cl', 'bosnia and herzegovina': 'ba', 'bosnia': 'ba', 'ba': 'ba',
  'slovakia': 'sk', 'sk': 'sk', 'slovenia': 'si', 'si': 'si', 'lithuania': 'lt', 'lt': 'lt'
};

function getFlagUrl(c) {
  if (!c) return null;
  const clean = c.toLowerCase().trim().replace(/_/g, ' ');
  if (clean === 'youtubers') return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1280px-YouTube_full-color_icon_%282017%29.svg.png';
  if (clean === 'staff') return 'https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/gigs2/317699597/original/fb21937c8742ee5d3de5c9e02b4d340d80a39513/setup-minecraft-server-that-you-pay.jpg';
  if (countryFlags[clean]) return `https://flagcdn.com/w640/${countryFlags[clean]}.png`;
  return null;
}

window.handleTopSearch = function() {
  const input = document.getElementById('top-search-input');
  const term = (input?.value || '').trim();
  if (term) {
    window.location.href = `/cabinet?player=${encodeURIComponent(term)}`;
  }
};

window.toggleSection = function(wrapperId, sectionId) {
  const wrap = document.getElementById(wrapperId);
  const sec = document.getElementById(sectionId);
  if(wrap && sec) {
    const isHidden = wrap.classList.toggle('hidden');
    sec.classList.toggle('collapsed-section');
    localStorage.setItem('litstats_collapse_' + wrapperId, isHidden);
    syncDashLayout();
  }
};

// Collapsing Tiered/Challenge keeps both headers on one row; the open list takes the freed width (see #main-dash-grid CSS).
function syncDashLayout() {
  const grid = document.getElementById('main-dash-grid');
  if (!grid) return;
  const hidden = id => { const el = document.getElementById(id); return !!(el && el.classList.contains('hidden')); };
  grid.classList.toggle('tiered-collapsed', hidden('col-tiered-wrapper'));
  grid.classList.toggle('challenge-collapsed', hidden('col-challenge-wrapper'));
}

const TRUE_MAX_POSSIBLE_AP = 32510;
const TRUE_MAX_POSSIBLE_ACHS = 3500;

window.toggleProgressMode = function() {
  progressDisplayMode = progressDisplayMode === 'points' ? 'achs' : 'points';
  localStorage.setItem('litstats_progressMode', progressDisplayMode);
  updateProgressDisplay();
};

window.toggleMwClass = function(cls) {
  activeMwClass = (activeMwClass === cls) ? null : cls;
  document.querySelectorAll('.mw-class-pill').forEach(pill => {
    pill.classList.toggle('active', pill.innerText.trim() === activeMwClass);
  });
  renderDashboard();
};

window.toggleArcadeGame = function(game) {
  activeArcadeGame = (activeArcadeGame === game) ? null : game;
  document.querySelectorAll('#arcade-game-filter .sub-filter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.innerText.trim() === activeArcadeGame);
  });
  renderDashboard();
};

window.toggleTntGame = function(game) {
  activeTntGame = (activeTntGame === game) ? null : game;
  document.querySelectorAll('#tnt-game-filter .sub-filter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.innerText.trim() === activeTntGame);
  });
  renderDashboard();
};

window.toggleWoolGame = function(game) {
  activeWoolGame = (activeWoolGame === game) ? null : game;
  document.querySelectorAll('#wool-game-filter .sub-filter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.innerText.trim() === activeWoolGame);
  });
  renderDashboard();
};

function updateProgressDisplay() {
  if(!globalPlayerData) return;
  const glTotals = isLegacyMode ? globalPlayerData.legacyGlobalTotals : globalPlayerData.globalTotals;
  const ap = glTotals?.unlockedAP || 0;
  let possibleAP = glTotals?.possibleAP || (isLegacyMode ? 1000 : 32510);
  let unlockedCount = glTotals?.unlockedAchs || 0;
  let totalCount = glTotals?.possibleAchs || (isLegacyMode ? 100 : 3500);
  
  if (progressDisplayMode === 'points') {
    const percentage = Math.min(100, (ap / possibleAP) * 100).toFixed(2);
    document.getElementById('p-progress-label').textContent = `${ap.toLocaleString()} / ${possibleAP.toLocaleString()} Points`;
    document.getElementById('p-ap-percent').textContent = `${percentage}%`;
    document.getElementById('p-ap-bar').style.width = `${percentage}%`;
  } else {
    const percentage = Math.min(100, (unlockedCount / totalCount) * 100).toFixed(2);
    document.getElementById('p-progress-label').textContent = `${unlockedCount.toLocaleString()} / ${totalCount.toLocaleString()} Achievements`;
    document.getElementById('p-ap-percent').textContent = `${percentage}%`;
    document.getElementById('p-ap-bar').style.width = `${percentage}%`;
  }
}

window.changeFilterLabelMode = function(mode) {
  filterLabelMode = mode;
  localStorage.setItem('litstats_filterLabelMode', mode);
  populateFilters();
};

window.toggleViewMode = function(mode) {
  viewMode = (viewMode === mode) ? 'all' : mode;
  renderDashboard();
};

window.toggleIgnore = function(uniqueId) {
  if (!ignoredAchs.includes(uniqueId)) {
    if (!confirm("Are you sure you want to hide this achievement?")) return;
    ignoredAchs.push(uniqueId);
    bookmarkedAchs = bookmarkedAchs.filter(i => i !== uniqueId); 
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
    ignoredAchs = ignoredAchs.filter(i => i !== uniqueId); 
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
  if (clean.includes('++')) return monthlyRankColor === 'AQUA' ? '#2cd9d9' : '#FFAA00';
  if (clean === 'MOJANG' || clean === 'EVENTS') return '#FFAA00'; 
  if (clean.includes('MVP')) return '#2cd9d9'; 
  if (clean.includes('VIP')) return '#55FF55'; 
  if (clean.includes('YOUTUBE') || clean === 'STAFF') return '#FF5555'; 
  if (clean.includes('PIG') || clean.includes('INNIT')) return '#FF55FF'; 
  return 'var(--text-2)';
}

function formatRankText(rank, plusColour, monthlyRankColor) {
  if (!rank || rank === 'NON') return '';
  const cleanRank = rank.replace(/\[|\]/g, ''); 
  const baseColor = getRankBaseColourHex(rank, monthlyRankColor);

  let plusHex = cleanRank.includes('VIP') ? '#FFAA00' : getPlusColourHex(plusColour);

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
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const iconPreference = localStorage.getItem('litstats_icon_mode') || 'theme';

  const shouldUseClassic = iconPreference === 'classic' || (iconPreference === 'theme' && currentTheme === 'minecraft');

  if (shouldUseClassic) {
    const mcItemMap = {
      "Arcade": "slime_ball.png", "Wool Games": "wool.png", "SkyBlock": "skyblock.png",
      "Bed Wars": "bed.png", "SkyWars": "eye_of_ender.png", "Murder Mystery": "bow.png",
      "Housing": "dark_oak_door.png", "TNT Games": "tnt.png", "Build Battle": "crafting_table.png",
      "Duels": "fishing_rod.png", "UHC": "golden_apple.png", "Speed UHC": "golden_carrot.png",
      "Cops and Crims": "iron_bars.png", "Mega Walls": "soul_sand.png", "Pit": "dirt.png",
      "Smash Heroes": "smash.png", "Warlords": "stone_axe.png", "Blitz": "diamond_sword.png",
      "VampireZ": "wither_skeleton_skull.png", "Quake": "firework.png", "Paintball": "snowball.png",
      "Arena Brawl": "blaze_powder.png", "Walls": "sand.png", "TKR": "minecart.png",
      "Seasonal": "cookie.png", "Easter": "easter.png", "Christmas": "christmas.png",
      "Summer": "summer.png", "Halloween": "halloween.png", "General": "book.png",
      "Crazy Walls": "crazywalls.png", "SkyClash": "fire_charge.png"
    };
    if (mcItemMap[clean]) return `/img/mc/${mcItemMap[clean]}`;
  }

  const iconMap = {
    "Seasonal": "seasonal.png", "Summer": "summer.png", "Christmas": "christmas.png",
    "Easter": "easter.png", "Halloween": "halloween.png", "Arcade": "Arcade-64.png", 
    "Bed Wars": "BedWars-64.png", "Build Battle": "BuildBattle-64.png", 
    "Cops and Crims": "CVC-64.png", "Duels": "Duels-64.png", "Mega Walls": "MegaWalls-64.png", 
    "Murder Mystery": "MurderMystery-64.png", "Pit": "Pit-64.png", "Blitz": "SG-64.png", 
    "SkyBlock": "SkyBlock-64.png", "SkyWars": "Skywars-64.png", "Smash Heroes": "SmashHeroes-64.png", 
    "Speed UHC": "SpeedUHC-64.png", "TNT Games": "TNT-64.png", "UHC": "UHC-64.png", 
    "Warlords": "Warlords-64.png", "Wool Games": "WoolGames-64.png", "Arena Brawl": "Arena-64.png", 
    "Paintball": "Paintball-64.png", "Quake": "Quakecraft-64.png", "VampireZ": "VampireZ-64.png", 
    "Walls": "Walls-64.png", "TKR": "TurboKartRacers-64.png", "Crazy Walls": "CrazyWalls-64.png", 
    "SkyClash": "SkyClash-64.png"
  };
  const filename = iconMap[clean] || clean.replace(/\s/g, '') + '-64.png';
  return `/img/games/${filename}`;
}

let _searchTimer;
window.handleAchSearch = function() {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => {
    searchQuery = document.getElementById('achSearch').value.toLowerCase();
    renderDashboard();
  }, 150);
};

function toggleSettingsMenu(e) {
  if (e) e.stopPropagation();
  const menu = document.getElementById('settings-menu');
  if (!menu) return;
  menu.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('settings-menu');
  const wrapper = e.target.closest('.settings-wrapper');
  if (menu && !wrapper && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
  }
});

function toggleGameFilter(gameName) {
  if (isCompExcluded && compGames.includes(gameName)) return;

  if (!isMultiSelect && !isMultiExclude) {          // single-select unless one of the multi modes is on
    if (activeGameFilters.has(gameName) && activeGameFilters.size === 1) {
      activeGameFilters.clear();
    } else {
      activeGameFilters.clear();
      activeGameFilters.add(gameName);
    }
  } else {
    activeGameFilters.has(gameName) ? activeGameFilters.delete(gameName) : activeGameFilters.add(gameName);
  }
  
  if (!activeGameFilters.has('Mega Walls')) activeMwClass = null;
  if (!activeGameFilters.has('Arcade')) activeArcadeGame = null;
  if (!activeGameFilters.has('TNT Games')) activeTntGame = null;
  if (!activeGameFilters.has('Wool Games')) activeWoolGame = null;
  
  document.querySelectorAll('.filter-pill-btn').forEach(btn => {
    let name = btn.getAttribute('data-gamename');
    btn.classList.toggle('active', activeGameFilters.has(name));
  });

  renderDashboard();
}

function toggleExcludeComp() {
  isCompExcluded = document.getElementById('excludeComp').checked;
  localStorage.setItem('litstats_excludeComp', isCompExcluded);
  if (isCompExcluded) compGames.forEach(g => activeGameFilters.delete(g));
  populateFilters();
  renderDashboard();
}

function toggleMultiSelect() {
  isMultiSelect = document.getElementById('multiSelectToggle').checked;
  localStorage.setItem('litstats_multiSelect', isMultiSelect);
  if (isMultiSelect && isMultiExclude) {
    isMultiExclude = false;
    document.getElementById('multiExcludeToggle').checked = false;
    localStorage.setItem('litstats_multiExclude', 'false');
    activeGameFilters.clear();                      // "selected" meant "excluded" a moment ago, so start clean
  } else if (!isMultiSelect && !isMultiExclude && activeGameFilters.size > 1) {
    const first = activeGameFilters.values().next().value;
    activeGameFilters.clear();
    if (first) activeGameFilters.add(first);
  }
  populateFilters();
  renderDashboard();
}

// ---- Layout density (Settings > Layout): purely a body class, so switching is instant and needs no re-render ----
function applyDensity() {
  document.body.classList.remove('density-compact', 'density-list');
  if (uiDensity === 'compact' || uiDensity === 'list') document.body.classList.add('density-' + uiDensity);
  document.body.classList.toggle('filters-chips', uiFilterStyle === 'chips' || (uiFilterStyle === 'auto' && uiDensity === 'list'));
  document.body.classList.toggle('highest-tier', !!isHighestTierOnly);
  document.body.classList.toggle('tier-dots', uiTierStyle === 'dots');
  const hideClass = { heroPct: 'hide-hero-pct', cardAp: 'hide-card-ap', tierPct: 'hide-tier-pct', chalPct: 'hide-chal-pct', rarity: 'hide-rarity' };
  Object.keys(hideClass).forEach(k => {
    document.body.classList.toggle(hideClass[k], !displayPrefs[k]);
    const cb = document.getElementById('disp-' + k);
    if (cb) cb.checked = !!displayPrefs[k];
  });
  const sel = document.getElementById('densitySelect');
  if (sel) sel.value = uiDensity;
  const fs = document.getElementById('filterStyleSelect');
  if (fs) fs.value = uiFilterStyle;
  const ts = document.getElementById('tierStyleSelect');
  if (ts) ts.value = uiTierStyle;
}
window.changeFilterStyle = function(val) {
  uiFilterStyle = ['auto', 'grid', 'chips'].includes(val) ? val : 'auto';
  localStorage.setItem('litstats_filterStyle', uiFilterStyle);
  applyDensity();
};
window.changeTierStyle = function(val) {
  uiTierStyle = val === 'dots' ? 'dots' : 'chip';
  localStorage.setItem('litstats_tierStyle', uiTierStyle);
  applyDensity();
};
window.toggleDisplayPref = function(key, checked) {
  displayPrefs[key] = !!checked;
  localStorage.setItem('litstats_display', JSON.stringify(displayPrefs));
  applyDensity();
};
window.changeDensity = function(val) {
  uiDensity = ['comfortable', 'compact', 'list'].includes(val) ? val : 'comfortable';
  localStorage.setItem('litstats_density', uiDensity);
  applyDensity();
};

window.toggleMultiExclude = function() {
  isMultiExclude = document.getElementById('multiExcludeToggle').checked;
  localStorage.setItem('litstats_multiExclude', isMultiExclude);
  if (isMultiExclude && isMultiSelect) {
    isMultiSelect = false;
    document.getElementById('multiSelectToggle').checked = false;
    localStorage.setItem('litstats_multiSelect', 'false');
  }
  // Selected games mean "show" in one mode and "hide" in the other, so reset the selection when switching.
  activeGameFilters.clear();
  activeMwClass = activeArcadeGame = activeTntGame = activeWoolGame = null;
  populateFilters();
  renderDashboard();
};

function toggleGoldApRewards() {
  isGoldApEnabled = document.getElementById('goldApToggle').checked;
  localStorage.setItem('litstats_gold_ap', isGoldApEnabled);
  renderCabinet(globalPlayerData, true);
  renderDashboard();
}

function toggleHighestTier() {
  isHighestTierOnly = document.getElementById('highestTierToggle').checked;
  localStorage.setItem('litstats_highestTier', isHighestTierOnly);
  document.body.classList.toggle('highest-tier', isHighestTierOnly);
  renderDashboard();
}

window.populateFilters = function() {
  const container = document.getElementById('gameFilterContainer');
  if (!globalPlayerData) return;
  
  let dataRef = isLegacyMode ? globalPlayerData.legacyMissing : globalPlayerData.missingAchievements;
  if (isShowCompleted) {
    dataRef = dataRef.concat(isLegacyMode ? globalPlayerData.legacyCompleted : globalPlayerData.completedAchievements);
  }

  const games = [...new Set(dataRef.map(a => a.game))].sort();
  const isMobile = window.innerWidth <= 800;
  
  let html = `<div class="filter-icon-grid ${isMultiExclude ? 'exclude-mode' : ''}">`;
  games.forEach(g => { 
    let cleanName = g.replace('Max ', '');
    let isDisabled = isCompExcluded && compGames.includes(cleanName) ? 'disabled' : '';
    let isActive = activeGameFilters.has(cleanName) ? 'active' : '';
    
    const gameTots = isLegacyMode ? globalPlayerData.legacyGameTotals?.[cleanName] : globalPlayerData.gameTotals?.[cleanName];
    let percent = gameTots && gameTots.possibleAchs > 0 ? (gameTots.unlockedAchs / gameTots.possibleAchs) * 100 : 0;
    let isMaxed = percent >= 100;
    
    let maxClass = isMaxed && isShowCompleted ? 'maxed-game-pill' : '';
    let color = percent >= 80 ? 'var(--tier-1)' : percent >= 40 ? 'var(--tier-2)' : 'var(--tier-4)';
    if(isMaxed && isShowCompleted) color = '#e9af10'; 

    let statLabel = `${Math.round(percent)}%`;
    if (!isMobile && gameTots) {
      if (filterLabelMode === 'points') {
        statLabel = `${gameTots.unlockedAP.toLocaleString()} / ${gameTots.possibleAP.toLocaleString()}`;
      } else if (filterLabelMode === 'achs') {
        statLabel = `${gameTots.unlockedAchs} / ${gameTots.possibleAchs}`;
      } else {
        statLabel = `${percent.toFixed(1)}%`;
      }
    }
    if (filterLabelMode === 'none') statLabel = '';

    html += `
      <div class="filter-pill-btn ${isActive} ${isDisabled} ${maxClass}" data-gamename="${cleanName}" onclick="toggleGameFilter('${cleanName}')" title="${cleanName} (${percent.toFixed(1)}%)">
        <div class="filter-pill-fill" style="width: ${percent}%; background-color: ${color};"></div>
        <img src="${getGameIconUrl(cleanName)}" class="filter-pill-icon" onerror="this.style.display='none'">
        <span class="filter-pill-name">${cleanName}</span>
        <span class="filter-pill-stat">${statLabel}</span>
      </div>
    `; 
  });
  container.innerHTML = html + `</div>`;

  const sel = document.getElementById('filterLabelSelect');
  if (sel) sel.value = filterLabelMode;
}

// Tier chip (List layout): click = next tier, right-click = previous tier
window.tierMeta = {};
window.cycleTier = function(id, dir) {
  const m = window.tierMeta[id];
  if (!m || !m.tiers.length) return;
  const cur = window.activeTierView[id] || m.cur;
  const i = Math.max(0, m.tiers.indexOf(cur));
  setTierView(id, m.tiers[(i + dir + m.tiers.length) % m.tiers.length]);
};

window.setTierView = function(base64Id, tierNum) {
  window.activeTierView[base64Id] = parseInt(tierNum);
  renderDashboard();
};

function computeAchievementTags(ach) {
  let tagsHtml = '';
  let tipHtml = '';
  let cleanGame = ach.game.replace('Max ', '');
  const tagData = TAG_DB[`[${cleanGame}] ${ach.title}`] || TAG_DB[ach.title];

  if (tagData) {
    if (tagData.desc) ach.desc = tagData.desc;

    if (tagData.type) {
      if (!showSecretTags && tagData.type === 'Secret') return ach;
      if (!showBrokenTags && tagData.type === 'Broken') return ach;
      
      let skipTypeTag = tagData.type === 'Renown';

      if (!skipTypeTag) {
        let colour = tagData.type === 'Broken' ? 'var(--red)' : tagData.type === 'Map' ? 'var(--green)' : tagData.type === 'Secret' ? '#ff33ff' : 'var(--gold)';
        
        if (tagData.type === 'Prestige' && tagData.level) {
          let lvl = parseInt(tagData.level, 10);
          let bCol = lvl <= 4 ? '#5555FF' : lvl <= 9 ? '#FACC15' : lvl <= 14 ? '#FFAA00' : 
                  lvl <= 19 ? '#FF5555' : lvl <= 24 ? '#AA00AA' : lvl <= 29 ? '#FF55FF' : 
                  lvl <= 34 ? '#FFFFFF' : lvl <= 39 ? 'var(--blue)' : lvl <= 44 ? '#0000AA' : 
                  lvl <= 47 ? '#000000' : lvl <= 49 ? '#AA0000' : '#555555';
          
          const romanMap = { L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
          let rStr = '', n = lvl;
          for (let i of Object.keys(romanMap)) {
            let q = Math.floor(n / romanMap[i]);
            n -= q * romanMap[i];
            rStr += i.repeat(q);
          }
          
          tagsHtml += `<span class="sleek-tag" style="--tag-color: ${bCol};"><span style="color: var(--text);">${rStr}</span></span>`;
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
    }
    
    if (tagData.renown) tagsHtml += ` <span class="sleek-tag" data-tag="renown" style="margin-left: 4px;">${tagData.renown} Renown</span>`;
    if (tagData.souls) tagsHtml += ` <span class="sleek-tag" style="--tag-color: #41dada; margin-left: 4px;">${tagData.souls} Souls</span>`;
    
    if (tagData.tip) {
      let linkedTip = tagData.tip
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => `<a href="${url.startsWith('http') ? url : `https://${url}`}" target="_blank" style="color: inherit; text-decoration: underline;">${text}</a>`)
        .replace(/(?<!["'])(https?:\/\/[^\s<]+|www\.[^\s<]+)(?![^<]*>)/g, match => `<a href="${match.startsWith('http') ? match : `https://${match}`}" target="_blank" style="color: inherit; text-decoration: underline;">${match}</a>`)
        .replace(/\n/g, '<br>');
      tipHtml = `<div class="ach-tip"><i>Tip: ${linkedTip}</i></div>`;
    }
  }
  
  ach.tagsHtml = tagsHtml;
  ach.tipHtml = tipHtml;
  return ach;
}

// Tags/tips depend only on game+title, so compute once instead of on every render.
const _tagCache = new Map();
function applyAchievementTags(ach) {
  const key = `${showSecretTags}${showBrokenTags}|${ach.game}|${ach.title}`;
  let c = _tagCache.get(key);
  if (!c) {
    const probe = { game: ach.game, title: ach.title, desc: ach.desc };
    computeAchievementTags(probe);
    c = { desc: probe.desc !== ach.desc ? probe.desc : undefined, tagsHtml: probe.tagsHtml || '', tipHtml: probe.tipHtml || '' };
    _tagCache.set(key, c);
  }
  if (c.desc !== undefined) ach.desc = c.desc;
  ach.tagsHtml = c.tagsHtml;
  ach.tipHtml = c.tipHtml;
  return ach;
}

const _idCache = new Map();
function achId(title) {
  let id = _idCache.get(title);
  if (id === undefined) { id = btoa(encodeURIComponent(title)); _idCache.set(title, id); }
  return id;
}

function renderDashboard() {
  if (!globalPlayerData) return;

  const isBookmarkViewActive = viewMode === 'bookmarks';
  const ignoredSet = new Set(ignoredAchs), bookmarkedSet = new Set(bookmarkedAchs);
  
  let dataRefMissing = (isLegacyMode ? globalPlayerData.legacyMissing : globalPlayerData.missingAchievements).map(a => ({...a, trulyCompleted: false}));
  let dataRefCompleted = (isLegacyMode ? globalPlayerData.legacyCompleted : globalPlayerData.completedAchievements).map(a => ({...a, trulyCompleted: true}));
  
  let allMissing = dataRefMissing;
  if (isShowCompleted) {
    const missingTitles = new Set(dataRefMissing.map(a => `${a.game}:${a.title}`));
    const uniqueCompleted = dataRefCompleted.filter(a => !missingTitles.has(`${a.game}:${a.title}`));
    allMissing = allMissing.concat(uniqueCompleted);
  }

  const activeTagF = document.getElementById('tagFilter')?.value || 'All';
  if (activeTagF !== 'All') {
    allMissing = allMissing.filter(a => {
      let cleanGame = a.game.replace('Max ', '');
      const tData = TAG_DB[`[${cleanGame}] ${a.title}`] || TAG_DB[a.title];
      if (!tData) return false;
      
      if (activeTagF === 'Cost') return tData.cost !== undefined || tData.type === 'Coins' || tData.type === 'Gold';
      if (activeTagF === 'Renown') return tData.renown !== undefined || tData.type === 'Renown';
      if (activeTagF === 'Prestige') return tData.type === 'Prestige';
      
      return tData.type === activeTagF;
    });
  }

  if (!isBookmarkViewActive) {
    if (isCompExcluded) allMissing = allMissing.filter(a => !compGames.includes(a.game.replace('Max ', '')));
    
    if (activeGameFilters.size > 0) {
      if (isMultiExclude) {
        allMissing = allMissing.filter(a => !activeGameFilters.has(a.game.replace('Max ', '')));
      } else {
        allMissing = allMissing.filter(a => activeGameFilters.has(a.game.replace('Max ', '')));
      }
    }
  }

  const mwClassFilterContainer = document.getElementById('mw-class-filter');
  const arcadeFilterContainer = document.getElementById('arcade-game-filter');
  const tntFilterContainer = document.getElementById('tnt-game-filter');
  const woolFilterContainer = document.getElementById('wool-game-filter');
  
  mwClassFilterContainer.classList.add('hidden');
  arcadeFilterContainer.classList.add('hidden');
  tntFilterContainer.classList.add('hidden');
  woolFilterContainer.classList.add('hidden');

  if (activeGameFilters.size === 1 && !isMultiExclude && !isBookmarkViewActive) {
    if (activeGameFilters.has('Mega Walls')) {
      mwClassFilterContainer.classList.remove('hidden');
      const allMwAchs = dataRefMissing.concat(dataRefCompleted).filter(a => a.game.replace('Max ', '') === 'Mega Walls');
      
      const mwPillStatus = {};
      mwClassesList.forEach(cls => mwPillStatus[cls] = { total: 0, completed: 0 });
      
      allMwAchs.forEach(ach => {
        const cls = getMwClassForAchievement(ach.title, ach.desc);
        if (mwPillStatus[cls]) {
          mwPillStatus[cls].total++;
          if (ach.trulyCompleted) mwPillStatus[cls].completed++;
        }
      });

      mwClassFilterContainer.innerHTML = mwClassesList.map(cls => {
        const lowerCls = cls.toLowerCase();
        let iconPath = cls === 'Legendary' ? 'img/diamond.png' : cls === 'Other' ? 'img/book.png' : `img/megawalls/${lowerCls}/${cls}.png`;
        const activeClass = activeMwClass === cls ? 'active' : '';
        const stat = mwPillStatus[cls];
        const isComplete = stat.total > 0 && stat.completed === stat.total;
        const goldClass = isComplete ? 'gold-pill' : '';

        return `<div class="mw-class-pill ${activeClass} ${goldClass}" onclick="toggleMwClass('${cls}')">
          <img src="${iconPath}" onerror="this.style.display='none'">
          ${cls}
        </div>`;
      }).join('');

      if (activeMwClass) {
        allMissing = allMissing.filter(a => activeMwClass === getMwClassForAchievement(a.title, a.desc));
      }
    } else if (activeGameFilters.has('Arcade')) {
      arcadeFilterContainer.classList.remove('hidden');
      const allArcadeAchs = dataRefMissing.concat(dataRefCompleted).filter(a => a.game.replace('Max ', '') === 'Arcade');
      
      const arcadePillStatus = {};
      arcadeGamesList.forEach(game => arcadePillStatus[game] = { total: 0, completed: 0 });

      allArcadeAchs.forEach(ach => {
        const game = getArcadeGameForAchievement(ach.title, ach.desc);
        if (arcadePillStatus[game]) {
          arcadePillStatus[game].total++;
          if (ach.trulyCompleted) arcadePillStatus[game].completed++;
        }
      });

      arcadeFilterContainer.innerHTML = arcadeGamesList.map(game => {
        let safeName = game.toLowerCase().replace(/ /g, '_');
        let iconPath = game === 'Other' ? 'img/book.png' : `img/arcade/${safeName}.png`;
        const activeClass = activeArcadeGame === game ? 'active' : '';
        const stat = arcadePillStatus[game];
        const isComplete = stat.total > 0 && stat.completed === stat.total;
        const goldClass = isComplete ? 'gold-pill' : '';

        return `<div class="sub-filter-pill ${activeClass} ${goldClass}" onclick="toggleArcadeGame('${game}')">
          <img src="${iconPath}" onerror="this.style.display='none'">
          ${game}
        </div>`;
      }).join('');

      if (activeArcadeGame) {
        allMissing = allMissing.filter(a => activeArcadeGame === getArcadeGameForAchievement(a.title, a.desc));
      }
    } else if (activeGameFilters.has('TNT Games')) {
      tntFilterContainer.classList.remove('hidden');
      const allTntAchs = dataRefMissing.concat(dataRefCompleted).filter(a => a.game.replace('Max ', '') === 'TNT Games');
      
      const tntPillStatus = {};
      tntGamesList.forEach(game => tntPillStatus[game] = { total: 0, completed: 0 });

      allTntAchs.forEach(ach => {
        const game = getTntGameForAchievement(ach.title, ach.desc);
        if (tntPillStatus[game]) {
          tntPillStatus[game].total++;
          if (ach.trulyCompleted) tntPillStatus[game].completed++;
        }
      });

      tntFilterContainer.innerHTML = tntGamesList.map(game => {
        let safeName = game.toLowerCase().replace(/ /g, '_');
        let iconPath = game === 'Other' ? 'img/book.png' : `img/tnt/${safeName}.png`;
        const activeClass = activeTntGame === game ? 'active' : '';
        const stat = tntPillStatus[game];
        const isComplete = stat.total > 0 && stat.completed === stat.total;
        const goldClass = isComplete ? 'gold-pill' : '';

        return `<div class="sub-filter-pill ${activeClass} ${goldClass}" onclick="toggleTntGame('${game}')">
          <img src="${iconPath}" onerror="this.style.display='none'">
          ${game}
        </div>`;
      }).join('');

      if (activeTntGame) {
        allMissing = allMissing.filter(a => activeTntGame === getTntGameForAchievement(a.title, a.desc));
      }
    } else if (activeGameFilters.has('Wool Games')) {
      woolFilterContainer.classList.remove('hidden');
      const allWoolAchs = dataRefMissing.concat(dataRefCompleted).filter(a => a.game.replace('Max ', '') === 'Wool Games');
      
      const woolPillStatus = {};
      woolGamesList.forEach(game => woolPillStatus[game] = { total: 0, completed: 0 });

      allWoolAchs.forEach(ach => {
        const game = getWoolGameForAchievement(ach.title, ach.desc);
        if (woolPillStatus[game]) {
          woolPillStatus[game].total++;
          if (ach.trulyCompleted) woolPillStatus[game].completed++;
        }
      });

      woolFilterContainer.innerHTML = woolGamesList.map(game => {
        let safeName = game.toLowerCase().replace(/ /g, '_');
        let iconPath = game === 'Other' ? 'img/book.png' : `img/woolgames/${safeName}.png`;
        const activeClass = activeWoolGame === game ? 'active' : '';
        const stat = woolPillStatus[game];
        const isComplete = stat.total > 0 && stat.completed === stat.total;
        const goldClass = isComplete ? 'gold-pill' : '';

        return `<div class="sub-filter-pill ${activeClass} ${goldClass}" onclick="toggleWoolGame('${game}')">
          <img src="${iconPath}" onerror="this.style.display='none'">
          ${game}
        </div>`;
      }).join('');

      if (activeWoolGame) {
        allMissing = allMissing.filter(a => activeWoolGame === getWoolGameForAchievement(a.title, a.desc));
      }
    }
  }

  if (searchQuery.trim().length > 0) {
    allMissing = allMissing.filter(a => 
      a.title.toLowerCase().includes(searchQuery) || 
      (a.desc && a.desc.toLowerCase().includes(searchQuery)) ||
      a.game.toLowerCase().includes(searchQuery)
    );
  }

  const mainTitleEl = document.getElementById('main-section-title');
  if (mainTitleEl) {
    mainTitleEl.innerText = isShowCompleted ? "Achievements" : "Incomplete";
  }

  let tiered = [];
  let challenges = [];

  const isGoldOverride = localStorage.getItem('litstats_gold_ap') === 'true';
  const rewardIconSrc = isGoldOverride ? "img/gold_ingot.png" : "img/diamond.png";
  const tieredHeaderIconSrc = isGoldOverride ? "img/gold_block.png" : "img/diamond_block.png";
  const chalHeaderIconSrc = isGoldOverride ? "img/gold_ingot.png" : "img/diamond.png";

  const tieredHImg = document.querySelector('#col-tiered-section h3 img');
  if (tieredHImg) tieredHImg.src = tieredHeaderIconSrc;
  const chalHImg = document.querySelector('#col-challenge-section h3 img');
  if (chalHImg) chalHImg.src = chalHeaderIconSrc;

  const isMobile = window.innerWidth <= 800;
  const igBtn = document.getElementById('ignoredToggleBtn');
  const bkBtn = document.getElementById('bookmarkToggleBtn');
  if (igBtn) igBtn.innerText = viewMode === 'ignored' ? "View All" : `Ignored (${ignoredAchs.length})`;
  if (igBtn) igBtn.classList.toggle('active', viewMode === 'ignored');
  if (bkBtn) bkBtn.innerHTML = viewMode === 'bookmarks' ? "View All" : (isMobile ? `★ ${bookmarkedAchs.length}` : `Bookmarks (${bookmarkedAchs.length})`);
  if (bkBtn) bkBtn.classList.toggle('active', viewMode === 'bookmarks');

  allMissing.forEach(ach => {
    let uniqueId = achId(ach.title); 
    ach.uniqueId = uniqueId;

    let isIgnored = ignoredSet.has(uniqueId);
    let isBookmarked = bookmarkedSet.has(uniqueId);

    if (viewMode === 'ignored' && !isIgnored) return;
    if (viewMode === 'bookmarks' && !isBookmarked) return;
    if (viewMode === 'all' && isIgnored) return;

    ach = applyAchievementTags(ach);

    let cleanGame = ach.game.replace('Max ', '');
    let isChallenge = ach.isOneTime || (ach.gamePct !== undefined && ach.currentAmt === undefined && !ach.allTiers);

    let customTargetAmt = null;
    let customCurrentAmt = null;
    let customProgPct = null;

    // Build keys
    const cleanTitle = ach.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanGameKey = cleanGame.toLowerCase().replace(/[^a-z0-9]/g, '');
    const namespacedKey = `${cleanGameKey}:${cleanTitle}`;
    
    // Check for a namespaced match first, fallback to the generic title
    let tracker = CustomChallengeTrackers[namespacedKey] || CustomChallengeTrackers[cleanTitle];
    let trackerResult = null;
    if (tracker && tracker.compute) {                 // computed trackers (e.g. Dreamfeast main path)
      trackerResult = tracker.compute(globalPlayerData);
      if (!trackerResult) tracker = null;             // not configured: behave like an untracked challenge
    }

    if (cleanGame === 'Mega Walls' && MWSkinData[cleanTitle]) {
      const mwData = MWSkinData[cleanTitle];
      isChallenge = true; 
      customCurrentAmt = globalPlayerData.megaWalls?.skins?.[mwData.class.toLowerCase()]?.[mwData.stat] || 0;
      customTargetAmt = mwData.max;
    } else if (tracker) {
      isChallenge = true;
      let missingLabels = [];

      if (trackerResult) {
        customCurrentAmt = trackerResult.current;
        if (trackerResult.note) ach.trackerNote = trackerResult.note;
        if (tracker.unit) ach.trackerUnit = tracker.unit;
      } else if (tracker.paths) {
        customCurrentAmt = 0;
        for (const p of tracker.paths) {
          let val = globalPlayerData;
          let targetPath = p.path || p;
          let req = p.req || 1;

          for (const key of targetPath) {
            if (val !== undefined && val !== null) val = val[key];
          }

          let currentVal = typeof val === 'number' ? val : 0;
          customCurrentAmt += Math.min(currentVal, req);

          if (p.label && currentVal < req) {
            if (req > 1) {
              missingLabels.push(`${p.label} (${currentVal}/${req})`);
            } else {
              missingLabels.push(p.label);
            }
          }
        }
      } else {
        let val = globalPlayerData;
        for (const key of tracker.path) {
          if (val !== undefined && val !== null) val = val[key];
        }
        customCurrentAmt = typeof val === 'number' ? val : 0;
      }

      customTargetAmt = tracker.max;
      if (missingLabels.length > 0) {
        ach.missingLabels = missingLabels;
      }
    }

    if (customTargetAmt !== null) {
      if (ach.trulyCompleted && customCurrentAmt < customTargetAmt) {
          customCurrentAmt = customTargetAmt;
      }
      ach.customCurrentAmt = customCurrentAmt;
      ach.customTargetAmt = customTargetAmt;
      ach.customProgPct = Math.min(100, (ach.customCurrentAmt / ach.customTargetAmt) * 100);
    }

    if (isChallenge) {
      ach.calcPct = (ach.gamePercentUnlocked || ach.gamePct || 0);

      if(ach.customTargetAmt !== undefined) {
         ach.isCompleted = ach.customCurrentAmt >= ach.customTargetAmt || ach.trulyCompleted;
      } else {
         ach.isCompleted = ach.trulyCompleted;
      }
      challenges.push(ach);
    } else {
      if (!ach.allTiers) ach.allTiers = [{ tier: ach.tier || 1, amount: ach.amount || 1, reward: ach.reward || 0 }];

      if (ach.trulyCompleted) {
         const maxTierAmt = ach.allTiers[ach.allTiers.length - 1].amount;
         if ((ach.currentAmt || 0) < maxTierAmt) {
             ach.currentAmt = maxTierAmt;
         }
      }

      let missingTiers = ach.allTiers.filter(t => (ach.currentAmt || 0) < t.amount);
      let firstMissing = missingTiers.length ? missingTiers[0].tier : ach.allTiers[ach.allTiers.length - 1].tier;
      
      let viewingTierNum = isHighestTierOnly ? ach.allTiers[ach.allTiers.length - 1].tier : (window.activeTierView[uniqueId] || firstMissing);
      let targetTierObj = ach.allTiers.find(t => t.tier === viewingTierNum) || ach.allTiers[0];

      let targetAmt = targetTierObj.amount;
      let trueCurrentAmt = ach.currentAmt || 0;
      
      let displayAmt = trueCurrentAmt;
      let pct = Math.min(100, (trueCurrentAmt / targetAmt) * 100);
      let isCompleted = ach.trulyCompleted || trueCurrentAmt >= targetAmt;

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
  if (activeGameFilters.size > 0 && !isBookmarkViewActive) {
    if (isMultiExclude) {
      recents = recents.filter(a => !activeGameFilters.has(a.game.replace('Max ', '')));
    } else {
      recents = recents.filter(a => activeGameFilters.has(a.game.replace('Max ', '')));
    }
  }
  const sortRec = document.getElementById('sortRecent')?.value || 'newest';
  if (sortRec === 'oldest') {
    recents = [...recents].reverse();
  }
  
  recents = recents.map(ach => {
    ach.uniqueId = achId(ach.title);
    return applyAchievementTags(ach);
  });

  const generateCard = (ach, isTiered, progressBlock, notches, isHistory = false) => {
    let isIgnored = ignoredSet.has(ach.uniqueId);
    let isBookmarked = bookmarkedSet.has(ach.uniqueId);
    let ignoreText = isIgnored ? 'Restore' : 'Ignore';
    let bookmarkClass = isBookmarked ? 'active-bookmark' : '';
    let bookmarkIcon = isBookmarked ? '★' : '☆';
    
    const notchClass = (isTiered && !isHighestTierOnly) ? 'has-tier' : 'no-notches';
    const historyClass = isHistory ? 'history-card' : '';
    const legacyClass = ach.isLegacy ? 'legacy-challenge-card' : '';
    
    let customRewardImg = '';
    
    if (ach.game.replace('Max ', '') === 'Mega Walls') {
      const cleanTitle = ach.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const skinData = normalizedSkinRewards[cleanTitle];
      
      if (skinData) {
        const skinName = skinData.name;
        const safePath = encodeURI(skinData.path);
        customRewardImg = `<span class="custom-skin-badge" title="${skinName}"><img src="${safePath}" loading="lazy" decoding="async" onerror="this.style.display='none'"> <span>${skinName}</span></span>`;
      }
    }

    let tierChipHtml = '';
    if (isTiered && !isHighestTierOnly && ach.allTiers && ach.allTiers.length > 1) {
      const n = ach.allTiers.length;
      const pos = Math.max(0, ach.allTiers.findIndex(t => t.tier === ach.viewingTierNum)) + 1;
      tierChipHtml = `<button type="button" class="tier-chip" style="--tc: var(--tier-${ach.viewingTierNum})" title="Tier ${pos} of ${n}. Click for the next tier, right-click for the previous" onclick="cycleTier('${ach.uniqueId}', 1)" oncontextmenu="cycleTier('${ach.uniqueId}', -1); return false;">${pos}<i>/${n}</i></button>`;
    }

    return `
      <div class="ach-card ${notchClass} ${historyClass} ${legacyClass} ${/ach-progress-container/.test(progressBlock) ? '' : 'no-prog'}">
        ${!isTiered && !isHistory && !ach.isLegacy ? `<span class="ach-percent">${ach.calcPct.toFixed(2)}%</span>` : ''}
        
        <div class="ach-card-header" title="${ach.game.replace('Max ', '')}">
          <img src="${getGameIconUrl(ach.game)}" class="todo-game-icon" loading="lazy" decoding="async" onerror="this.style.display='none'">
          <span class="ach-game">${ach.game.replace('Max ', '')}</span>
        </div>
        
        <span class="ach-title" ${ach.isCompleted ? 'style="color: var(--gold);"' : ''}>${ach.title} ${ach.tagsHtml || ''}</span>
        <span class="ach-desc" title="${String(ach.desc).replace(/<[^>]*>/g, '').replace(/"/g, '&quot;')}">${ach.desc}</span>
        ${ach.tipHtml || ''}
        
        ${progressBlock}

        <div class="ach-card-footer">
          <span class="ach-reward"><img class="ach-ap-icon" src="${rewardIconSrc}" alt="AP" style="width:14px; height:14px; object-fit:contain; flex-shrink: 0;"> <span class="ach-ap-amt" style="white-space: nowrap; flex-shrink: 0;">${isTiered ? ach.activeReward : ach.reward} AP</span> ${customRewardImg}</span>
          ${!isHistory ? `
            <div class="ach-actions">
              <button onclick="toggleBookmark('${ach.uniqueId}')" class="ach-action-btn ${bookmarkClass}" title="Bookmark">${bookmarkIcon}</button>
              <button onclick="toggleIgnore('${ach.uniqueId}')" class="ach-action-btn ach-ignore" title="${ignoreText}"><span class="lbl">${ignoreText}</span><span class="sym">${isIgnored ? '+' : '\u2212'}</span></button>
            </div>
          ` : ''}
        </div>
        ${isTiered && !isHighestTierOnly ? `<div class="tier-notch-container">${notches}</div>${tierChipHtml}` : ''}
      </div>
    `;
  };

  let viewLimitTiered = limits.tiered;
  let viewLimitChal = limits.challenge;

  document.getElementById('col-tiered').innerHTML = tiered.slice(0, viewLimitTiered).map(ach => {
    let targetStr = ach.targetAmt.toLocaleString();
    let displayStr = ach.displayAmt.toLocaleString();
    let parsedDesc = ach.desc.replace(/%%value%%|%tieramount%|\?/gi, targetStr);
    ach.desc = parsedDesc;
    
    let progressText = `${displayStr} / ${targetStr}`;
    let barClass = ach.isCompleted ? "ach-progress-fill completed-tier" : "ach-progress-fill";

    let notches = '';
    if (ach.allTiers && ach.allTiers.length > 0) window.tierMeta[ach.uniqueId] = { tiers: ach.allTiers.map((t, i) => t.tier || i + 1), cur: ach.viewingTierNum };
    if(!isHighestTierOnly && ach.allTiers && ach.allTiers.length > 0) {
      ach.allTiers.forEach((tierObj, index) => {
        const tierNum = tierObj.tier || index + 1;
        let isPastOrCurrent = tierNum <= ach.viewingTierNum;
        let op = isPastOrCurrent ? '0.7' : '0.15'; 
        let bg = isPastOrCurrent ? `var(--tier-${tierNum})` : 'var(--border)';
        let glow = (tierNum === ach.viewingTierNum) ? `box-shadow: 0 0 4px var(--tier-${tierNum}); transform: scaleY(1.3);` : '';
        notches += `<div class="tier-notch" style="background: ${bg}; opacity: ${op}; ${glow}" onclick="setTierView('${ach.uniqueId}', ${tierNum})"></div>`;
      });
    }

    let progressBlock = `
      <div class="ach-progress-container"><div class="${barClass}" style="width: ${ach.calcPct.toFixed(2)}%;"></div></div>
      <div class="tier-progress-text">${progressText} <span class="ach-pct">(${ach.calcPct.toFixed(2)}%)</span></div>
    `;

    return generateCard(ach, true, progressBlock, notches);
  }).join('');

  document.getElementById('col-challenge').innerHTML = challenges.slice(0, viewLimitChal).map(ach => {
    ach.desc = ach.desc.replace(/%%value%%|%tieramount%|\?/gi, ach.customTargetAmt ? ach.customTargetAmt.toLocaleString() : "1");
    
    let missingHtml = '';
    if (ach.missingLabels && ach.missingLabels.length > 0) {
      missingHtml = `<div class="ach-missing" style="font-size: 11px; color: var(--text-3); margin-top: 6px;">Missing: ${ach.missingLabels.join(', ')}</div>`;
    }

    let progressBlock = '';
    if (ach.customTargetAmt) {
      let displayStr = ach.customCurrentAmt.toLocaleString();
      let targetStr = ach.customTargetAmt.toLocaleString();
      let progressText = `${displayStr} / ${targetStr}${ach.trackerUnit ? ' ' + ach.trackerUnit : ''}`;
      let barClass = ach.isCompleted ? "ach-progress-fill completed-tier" : "ach-progress-fill";
      if (ach.trackerNote) missingHtml = `<div class="ach-missing" style="font-size: 11px; color: var(--text-3); margin-top: 6px;">${ach.trackerNote}</div>`;
      progressBlock = `
        <div class="ach-progress-container"><div class="${barClass}" style="width: ${ach.customProgPct.toFixed(2)}%;"></div></div>
        <div class="tier-progress-text">${progressText} <span class="ach-pct">(${ach.customProgPct.toFixed(2)}%)</span></div>
        ${missingHtml}
      `;
    }

    return generateCard(ach, false, progressBlock, '');
  }).join('');

  if (!globalPlayerData.recentAchievements) {
    document.getElementById('col-recent').innerHTML = `<span style="color:var(--text-3); font-size: 13px;">Recent history unavailable for this profile.</span>`;
  } else if (recents.length === 0) {
    document.getElementById('col-recent').innerHTML = `<span style="color:var(--text-3); font-size: 13px;">No recent history data returned for this game.</span>`;
  } else {
    document.getElementById('col-recent').innerHTML = recents.slice(0, limits.recent).map(ach => {
      return generateCard(ach, false, '', '', true);
    }).join('');
  }

  document.getElementById('btn-more-tiered').style.display = viewLimitTiered < tiered.length ? 'block' : 'none';
  document.getElementById('btn-more-chal').style.display = viewLimitChal < challenges.length ? 'block' : 'none';
  document.getElementById('btn-more-rec').style.display = limits.recent < recents.length ? 'block' : 'none';
}

const trophyStructure = [
  { name: "4th Tier", classes: "legendary", games: ["Max UHC", "Max Pit", "Max Mega Walls", "Max SkyWars", "Max Blitz"] },
  { name: "3rd Tier", classes: "epic", games: ["Max Smash Heroes", "Max Bed Wars", "Max Cops and Crims", "Max Quake", "Max Paintball", "Max Arena Brawl"] },
  { name: "2nd Tier", classes: "rare", games: ["Max SkyBlock", "Max Speed UHC", "Max Warlords", "Max Walls", "Max TNT Games", "Max Arcade"] },
  { name: "1st Tier", classes: "common", games: ["Max Murder Mystery", "Max VampireZ", "Max TKR", "Max Wool Games", "Max Duels", "Max Build Battle"] },
  { name: "Time Limited", classes: "legacy", isLegacy: true, games: ["Max Seasonal", "Max Crazy Walls", "Max SkyClash"] }
];

function getApColor(ap) {
  const apColors = [
    { ap: 0, hex: '#ffeeff' },      
    { ap: 5000, hex: '#ffb3ff' },   
    { ap: 10000, hex: '#df80ff' },  
    { ap: 15000, hex: '#9933ff' },  
    { ap: 20000, hex: '#3366ff' },  
    { ap: 25000, hex: '#00bfff' },  
    { ap: 29000, hex: '#00e6ff' },  
    { ap: 32000, hex: '#99ffff' }   
  ];

  let lower = apColors[0], upper = apColors[apColors.length - 1];
  for (let i = 0; i < apColors.length - 1; i++) {
    if (ap >= apColors[i].ap && ap <= apColors[i+1].ap) {
      lower = apColors[i];
      upper = apColors[i+1];
      break;
    }
  }
  
  const factor = ap >= upper.ap ? 1 : ap <= lower.ap ? 0 : (ap - lower.ap) / (upper.ap - lower.ap);
  const hex2rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const l = hex2rgb(lower.hex), u = hex2rgb(upper.hex);
  
  const r = (l[0] + factor * (u[0] - l[0])) / 255;
  const g = (l[1] + factor * (u[1] - l[1])) / 255;
  const b = (l[2] + factor * (u[2] - l[2])) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, lit = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = lit > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  const theme = document.documentElement.getAttribute('data-theme');
  const isLight = ['light', 'cherry'].includes(theme);

  if (isLight) {
    s = Math.min(1, s * 1.1);
    lit = Math.min(0.4, lit * 0.8);
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(lit * 100)}%)`;
}

const MAX_COMPARE = 8; // compared players, on top of the profile being viewed
// Base colour per player (claims get an automatically derived alternate shade of the same hue).
const PLAYER_COLORS = ['#ff5100', '#00bfff', '#55ff55', '#ffd700', '#ff55ff', '#ff3366', '#9d7bff', '#2de2c4', '#aab4c3'];

function getApiBase() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:3000' : 'https://api.litstats.com';
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function resolveUuid(input) {
  const clean = input.trim().replace(/-/g, '');
  if (/^[0-9a-f]{32}$/i.test(clean)) return clean.toLowerCase();
  const res = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(input.trim())}`);
  const json = await res.json();
  if (json.code !== 'player.found') throw new Error(`Player "${input.trim()}" not found.`);
  return json.data.player.raw_id.toLowerCase();
}

// Claim timestamps from achievementRewardsNew ("for_points_N": ms timestamp).
// Lower rewards can be claimed late, so each claim is flagged `late` if a higher
// reward was already claimed before it. Only non-late claims are charted, which
// keeps the claim line strictly upward over time.
function processClaims(rewards) {
  const claims = Object.entries(rewards || {}).map(([key, ts]) => {
    const m = /^for_points_(\d+)$/.exec(key);
    return m && Number.isFinite(ts) ? { points: parseInt(m[1], 10), ts } : null;
  }).filter(Boolean).sort((a, b) => a.ts - b.ts || a.points - b.points);

  let runningMax = -Infinity;
  claims.forEach(c => {
    c.late = c.points <= runningMax;
    if (!c.late) runningMax = c.points;
  });
  return claims;
}

function fmtClaimDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function setCompareError(msg) {
  const el = document.getElementById('compare-error');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('hidden', !msg);
}

window.addComparisonPlayer = async function() {
  const input = document.getElementById('compare-player-input');
  const btn = document.querySelector('.compare-btn');
  const query = (input?.value || '').trim();
  if (!query || !globalPlayerData) return;

  setCompareError('');
  if (comparisonPlayers.length >= MAX_COMPARE) {
    setCompareError(`You can compare up to ${MAX_COMPARE} players.`);
    return;
  }

  if (btn) btn.disabled = true;
  try {
    const uuid = await resolveUuid(query);
    if (uuid === normUuid(globalPlayerData.uuid)) throw new Error('That is the player you are already viewing.');
    if (comparisonPlayers.some(p => p.uuid === uuid)) throw new Error('Player already added.');

    const res = await fetch(`${getApiBase()}/api/player?uuid=${encodeURIComponent(uuid)}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Failed to fetch player (${res.status})`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    comparisonPlayers.push({
      uuid,
      username: data.username,
      currentAp: data.achievementPoints || 0,
      claims: processClaims(data.achievementRewardsNew)
    });
    if (input) input.value = '';
    initOrUpdateAnalyticsChart();
  } catch (err) {
    setCompareError(err.message || 'Could not add player.');
  } finally {
    if (btn) btn.disabled = false;
  }
};

window.removeComparisonPlayer = function(uuid) {
  comparisonPlayers = comparisonPlayers.filter(p => p.uuid !== uuid);
  mutedPlayers.delete(uuid);
  setCompareError('');
  initOrUpdateAnalyticsChart();
};

(function bindCompareEnter() {
  const input = document.getElementById('compare-player-input');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') window.addComparisonPlayer(); });
})();

// ==== AP analytics (start) ====
const DAY_MS = 86400000;
const ANA_DEFAULTS = { mode: 'claims', milestones: true, late: false, yZero: false };
// Achievement rewards launched in early Nov 2017, so earlier claim timestamps are invalid and are ignored.
const CLAIMS_EPOCH = Date.UTC(2017, 10, 1);
const ANA_CLIP = { top: 8, bottom: 8, left: 6, right: 6 }; // let edge markers overflow the plot slightly instead of being cut in half
let anaPrefs = { ...ANA_DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem('litstats_anaPrefs2') || '{}');
  Object.keys(ANA_DEFAULTS).forEach(k => { if (typeof saved[k] === typeof ANA_DEFAULTS[k]) anaPrefs[k] = saved[k]; });
} catch (e) {}
if (!['claims', 'history'].includes(anaPrefs.mode)) anaPrefs.mode = ANA_DEFAULTS.mode;
// Visible window set by the drag handles / date boxes (null = full extent). Not persisted: it only makes sense for the data loaded.
const anaView = { min: null, max: null };
let anaExtent = { min: Date.now() - 30 * 86400000, max: Date.now() }, anaWin = { ...anaExtent };
const mutedPlayers = new Set();

function saveAnaPrefs() { try { localStorage.setItem('litstats_anaPrefs2', JSON.stringify(anaPrefs)); } catch (e) {} }

const normUuid = u => String(u || '').replace(/-/g, '').toLowerCase();
const parseDay = v => (/^\d{4}-\d{2}-\d{2}$/.test(v || '') ? Date.parse(v + 'T00:00:00Z') : NaN);
const isoDay = ts => new Date(ts).toISOString().slice(0, 10);
const fmtDayUTC = ts => new Date(ts).toLocaleDateString(undefined, { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' });

function isLightTheme() { return ['light', 'cherry'].includes(document.documentElement.getAttribute('data-theme')); }
function cssVar(name, fallback) { return (getComputedStyle(document.body).getPropertyValue(name) || '').trim() || fallback; }
function hexRgb(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
// Mix a hex colour towards white (255) or black (0) - used for the "claims" alternate shade.
function mixHex(h, target, amt) { const c = hexRgb(h).map(v => Math.round(v + (target - v) * amt)); return `rgb(${c[0]}, ${c[1]}, ${c[2]})`; }
function hexAlpha(h, a) { const c = hexRgb(h); return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`; }

// Archive re-indexed per player: { uuid: [{x: ms, y: ap}, ...] }. UUIDs are normalised (no dashes,
// lowercase) so a format mismatch between the archive and the API can't silently drop a player's data.
let _archiveSrc = null, _archiveIdx = null;
function getArchiveIndex() {
  if (_archiveIdx && _archiveSrc === historicalArchiveData) return _archiveIdx;
  const idx = {};
  Object.keys(historicalArchiveData || {}).forEach(date => {
    const day = historicalArchiveData[date];
    const x = parseDay(date);
    if (!Number.isFinite(x) || !day || typeof day !== 'object') return;
    Object.entries(day).forEach(([u, ap]) => {
      const y = Number(ap);
      if (!Number.isFinite(y)) return;
      (idx[normUuid(u)] ||= []).push({ x, y });
    });
  });
  Object.values(idx).forEach(a => a.sort((p, q) => p.x - q.x));
  _archiveSrc = historicalArchiveData; _archiveIdx = idx;
  return idx;
}

// Collapse runs of identical values: keep the first and last point of each run, drop the days in
// between (a straight line between them already says "unchanged"). Run-end points remember `since`.
function collapseFlat(pts) {
  const out = [];
  let runStart = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], prev = pts[i - 1], next = pts[i + 1];
    if (prev && p.y !== prev.y) runStart = i;
    if (prev && next && p.y === prev.y && p.y === next.y) continue;
    out.push(prev && p.y === prev.y ? { ...p, since: pts[runStart].x } : p);
  }
  return out;
}

// History = real archive snapshots + the live AP as the final point. No invented fill-in days.
function buildHistorySeries(e) {
  const pts = (getArchiveIndex()[e.uuid] || []).map(p => ({ ...p }));
  if (!pts.length && e.primary) {
    const start = Number(globalPlayerData.last_month_ap);
    if (Number.isFinite(start) && start > 0) {
      const d = new Date();
      pts.push({ x: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1), y: start, note: 'Month start' });
    }
  }
  if (e.currentAp > 0) pts.push({ x: Date.now(), y: e.currentAp, live: true });
  return collapseFlat(pts); // Collapse toggle was removed from the UI: always collapse unchanged history days
}

// Claims = non-late claims at their real timestamps. With "collapse" on, claims made on the same
// day merge into one point (highest reward that day). Late claims are returned separately.
function buildClaimSeries(claims) {
  const valid = claims.filter(c => c.ts >= CLAIMS_EPOCH);
  const sorted = (anaPrefs.late ? valid : valid.filter(c => !c.late)).sort((a, b) => a.ts - b.ts);
  const pts = sorted.map(c => ({ x: c.ts, y: c.points, late: c.late }));
  const milestones = [], top = sorted.reduce((m, c) => Math.max(m, c.points), 0);
  for (let m = 5000; m <= top; m += 5000) {
    const c = sorted.find(x => x.points === m && !x.late);
    if (c) milestones.push({ x: c.ts, y: m, ms: true });
  }
  return { pts, milestones };
}

// Keep points inside [min,max] plus the nearest neighbour on each side so lines run to the edges.
function windowed(pts, min, max) {
  const out = [];
  if (!Array.isArray(pts)) return out;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (!p || typeof p.x !== 'number') continue;
    if (p.x >= min && p.x <= max) out.push(p);
    else if (p.x < min && pts[i + 1] && typeof pts[i + 1].x === 'number' && pts[i + 1].x >= min) out.push(p);
    else if (p.x > max && pts[i - 1] && typeof pts[i - 1].x === 'number' && pts[i - 1].x <= max) out.push(p);
  }
  return out;
}

// Calendar-aligned ticks for a millisecond x-axis (no date adapter needed).
const TIME_STEPS = [{ d: 1 }, { d: 2 }, { d: 7 }, { d: 14 }, { m: 1 }, { m: 2 }, { m: 3 }, { m: 6 }, { y: 1 }, { y: 2 }, { y: 5 }, { y: 10 }];
function pickTimeStep(span, target) {
  const len = s => (s.d ? s.d * DAY_MS : s.m ? s.m * 30.44 * DAY_MS : s.y * 365.25 * DAY_MS);
  return TIME_STEPS.find(s => span / len(s) <= target) || TIME_STEPS[TIME_STEPS.length - 1];
}
function niceTimeTicks(min, max, target) {
  const step = pickTimeStep(max - min, target), ticks = [];
  if (step.d) {
    const len = step.d * DAY_MS;
    for (let t = Math.ceil(min / len) * len, n = 0; t <= max && n < 500; t += len, n++) ticks.push(t);
  } else {
    const stepM = step.y ? step.y * 12 : step.m, d0 = new Date(min);
    let idx = step.y ? Math.floor(d0.getUTCFullYear() / step.y) * step.y * 12
                     : d0.getUTCFullYear() * 12 + Math.floor(d0.getUTCMonth() / step.m) * step.m;
    for (let n = 0; n < 500; n++, idx += stepM) {
      const t = Date.UTC(Math.floor(idx / 12), idx % 12, 1);
      if (t > max) break;
      if (t >= min) ticks.push(t);
    }
  }
  return ticks;
}
function fmtAnaTick(v, scale) {
  const span = scale.max - scale.min, step = pickTimeStep(span, Math.max(3, Math.floor(scale.width / 100)));
  const d = new Date(v), tz = { timeZone: 'UTC' };
  if (step.y) return String(d.getUTCFullYear());
  if (step.m) return d.toLocaleDateString(undefined, { ...tz, month: 'short', year: 'numeric' });
  return d.toLocaleDateString(undefined, { ...tz, day: 'numeric', month: 'short', ...(span > 200 * DAY_MS ? { year: '2-digit' } : {}) });
}

window.toggleMutePlayer = function(uuid) {
  if (mutedPlayers.has(uuid)) mutedPlayers.delete(uuid); else mutedPlayers.add(uuid);
  initOrUpdateAnalyticsChart();
};

// Chips double as the chart legend: swatch = the line colour in the current mode, number = current AP.
function renderCompareChips(entries) {
  const el = document.getElementById('compare-chips');
  if (!el) return;
  el.innerHTML = entries.map(e => `
    <span class="compare-chip ${mutedPlayers.has(e.uuid) ? 'muted' : ''}">
      <button type="button" class="chip-main" title="Click to show / hide on the chart" onclick="toggleMutePlayer('${e.uuid}')">
        <span class="dot" style="background:${e.line}"></span>${escHtml(e.username)}${e.currentAp > 0 ? `<span class="chip-ap">${Number(e.currentAp).toLocaleString()} AP</span>` : ''}
      </button>
      ${e.primary ? '' : `<button type="button" class="chip-x" title="Remove" onclick="removeComparisonPlayer('${e.uuid}')">&times;</button>`}
    </span>`).join('');
}

function renderAnaInfo(shown) {
  const el = document.getElementById('ana-info');
  if (!el) return;
  let lo = Infinity, hi = -Infinity, hidden = 0;
  shown.forEach(e => {
    if (anaPrefs.mode === 'claims') {
      (e.claims || []).forEach(c => {
        if (!c || typeof c.ts !== 'number') return;
        if (c.ts < CLAIMS_EPOCH) { hidden++; return; }
        if (c.ts < lo) lo = c.ts; if (c.ts > hi) hi = c.ts;
      });
    } else {
      (e.hist || []).forEach(p => { if (!p || p.live || p.note || typeof p.x !== 'number') return; if (p.x < lo) lo = p.x; if (p.x > hi) hi = p.x; });
    }
  });
  const claims = anaPrefs.mode === 'claims', fmt = claims ? fmtClaimDate : fmtDayUTC;
  let text = Number.isFinite(lo) ? `${claims ? 'Claims' : 'History'}: ${fmt(lo)} → ${fmt(hi)}` : `${claims ? 'Claims' : 'History'}: no data`;
  if (claims && hidden) text += ` · ${hidden} claim${hidden > 1 ? 's' : ''} dated before Nov 2017 ignored`;
  el.textContent = text;
}

function updateAnaSlider() {
  const $ = id => document.getElementById(id), span = anaExtent.max - anaExtent.min || 1;
  const l = ((anaWin.min - anaExtent.min) / span) * 100, r = ((anaWin.max - anaExtent.min) / span) * 100;
  if ($('ana-hl')) $('ana-hl').style.left = l + '%';
  if ($('ana-hr')) $('ana-hr').style.left = r + '%';
  if ($('ana-sel')) { $('ana-sel').style.left = l + '%'; $('ana-sel').style.width = (r - l) + '%'; }
}

// Line the slider track up with the chart's plot area so the handles sit on the plot's left/right edges.
function alignAnaSlider(chart = apChartInstance) {
  const slider = document.getElementById('ana-slider'), canvas = document.getElementById('apHistoryChart');
  if (!slider || !canvas || !chart || !chart.chartArea) return;
  const box = canvas.parentElement, ca = chart.chartArea;
  if (!(ca.right - ca.left > 20)) return; // chart is hidden / not laid out yet: keep the CSS default until it is
  const off = (box && box.clientLeft || 0) + (canvas.offsetLeft || 0);
  slider.style.marginLeft = (off + ca.left) + 'px';
  slider.style.width = (ca.right - ca.left) + 'px';
}

let _anaViewRaf = 0;
function scheduleAnaView() { // coalesce rapid changes (dragging) into one chart redraw per frame
  if (_anaViewRaf) return;
  _anaViewRaf = requestAnimationFrame(() => { _anaViewRaf = 0; initOrUpdateAnalyticsChart({ viewOnly: true }); });
}

function syncAnaControls() {
  const $ = id => document.getElementById(id);
  document.querySelectorAll('#ana-mode button').forEach(b => b.classList.toggle('active', b.dataset.mode === anaPrefs.mode));
  [['ana-late', 'late'], ['ana-ms', 'milestones'], ['ana-yzero', 'yZero']].forEach(([id, k]) => { const el = $(id); if (el) el.checked = !!anaPrefs[k]; });
  document.querySelectorAll('[data-only]').forEach(el => el.classList.toggle('hidden', el.dataset.only !== anaPrefs.mode));
  const f = $('ana-from'), t = $('ana-to');
  if (f && t) {
    f.min = t.min = isoDay(anaExtent.min); f.max = t.max = isoDay(anaExtent.max); // the picker only offers days that have data
    f.value = isoDay(anaWin.min); t.value = isoDay(anaWin.max);
  }
  if ($('ana-full')) $('ana-full').disabled = anaView.min == null && anaView.max == null;
  updateAnaSlider();
}

function renderClaimsPanel(entries) {
  const el = document.getElementById('ap-claims-wrapper');
  if (!el) return;
  el.innerHTML = entries.map(e => {
    const claims = e.claims;
    if (!claims.length) {
      return `<details><summary><span class="dot" style="background:${e.color}"></span><b>${escHtml(e.username)}</b> No AP reward claim data</summary></details>`;
    }
    const last = claims[claims.length - 1];
    const highest = Math.max(...claims.map(c => c.points));
    const lateCount = claims.filter(c => c.late).length;
    const rows = [...claims].reverse().map(c =>
      `<div class="claim-row ${c.late ? 'late' : ''}"><b>${c.points.toLocaleString()} AP</b> <i>${fmtClaimDate(c.ts)}${c.late ? ' (late claim)' : ''}</i></div>`
    ).join('');
    return `<details>
      <summary><span class="dot" style="background:${e.color}"></span><b>${escHtml(e.username)}</b>
        ${e.currentAp > 0 ? `${Number(e.currentAp).toLocaleString()} AP now · ` : ''}${claims.length.toLocaleString()} rewards claimed · highest ${highest.toLocaleString()} AP · last claim ${fmtClaimDate(last.ts)}${lateCount ? ` · ${lateCount} late` : ''}
      </summary>
      <div class="claim-list">${rows}</div>
    </details>`;
  }).join('');
}

const anaMilestonePlugin = {
  id: 'anaMilestones',
  afterLayout(chart) { alignAnaSlider(chart); }, // runs after every layout (first show, resize, tab/section reveal)
  afterDatasetsDraw(chart) {
    const { ctx, chartArea: a } = chart, boxes = [];
    ctx.save();
    ctx.font = '600 11px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    chart.data.datasets.forEach((ds, i) => {
      if (ds.kind !== 'milestone' || !chart.isDatasetVisible(i)) return;
      const meta = chart.getDatasetMeta(i);
      if (!meta || !meta.data) return;
      meta.data.forEach((pt, j) => {
        if (!pt || typeof pt.x !== 'number' || typeof pt.y !== 'number') return;
        const dataObj = ds.data[j];
        if (!dataObj || typeof dataObj.y !== 'number') return;
        const text = Number(dataObj.y).toLocaleString(), w = ctx.measureText(text).width, x = pt.x;
        let y = pt.y - 10;
        if (y - 13 < a.top) y = pt.y + 22;
        const box = [x - w / 2 - 2, y - 13, x + w / 2 + 2, y + 2];
        if (box[0] < a.left || box[2] > a.right || box[1] < a.top || box[3] > a.bottom) return;
        if (boxes.some(q => box[0] < q[2] && box[2] > q[0] && box[1] < q[3] && box[3] > q[1])) return;
        boxes.push(box);
        ctx.fillStyle = ds.borderColor;
        ctx.fillText(text, x, y);
      });
    });
    ctx.restore();
  }
};

function buildAnaChartOptions() {
  const font = { family: 'DM Sans' };
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      legend: { display: false }, // the player chips are the legend
      tooltip: {
        callbacks: {
          title(items) {
            const it = items[0];
            if (!it) return '';
            const r = it.raw || {};
            if (r.live) return 'Current (live)';
            if (it.dataset.kind === 'history') return fmtDayUTC(r.x) + (r.note ? ` · ${r.note}` : '');
            return fmtClaimDate(r.x);
          },
          label(it) {
            const ds = it.dataset, r = it.raw || {}, ap = Number(r.y).toLocaleString();
            if (ds.kind === 'history') {
              const out = [`${ds.player}: ${ap} AP`];
              if (r.since) out.push(`Unchanged since ${fmtDayUTC(r.since)}`);
              return out;
            }
            if (ds.kind === 'late') return `${ds.player}: ${ap} AP reward (late claim)`;
            if (ds.kind === 'milestone') return `${ds.player}: ${ap} AP reward claimed ★`;
            const out = [`${ds.player}: ${ap} AP reward claimed${r.late ? ' (late claim)' : ''}`];
            if (r.n > 1) out.push(`${r.n} rewards claimed that day (${r.lo.toLocaleString()} → ${r.hi.toLocaleString()} AP)`);
            return out;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        bounds: 'data',
        grid: {},
        ticks: { font, maxRotation: 0, minRotation: 0, autoSkip: false, callback: function(v) { return fmtAnaTick(v, this); } },
        afterBuildTicks(scale) {
          scale.ticks = niceTimeTicks(scale.min, scale.max, Math.max(3, Math.floor(scale.width / 100))).map(value => ({ value }));
        }
      },
      y: { grid: {}, ticks: { font } }
    }
  };
}

function initOrUpdateAnalyticsChart(opts = {}) {
  const ctx = document.getElementById('apHistoryChart');
  if (!ctx || !globalPlayerData || typeof Chart === 'undefined') return;

  const primaryUuid = normUuid(globalPlayerData.uuid);
  comparisonPlayers = comparisonPlayers.filter(p => p.uuid !== primaryUuid);

  const entries = [
    {
      uuid: primaryUuid,
      username: globalPlayerData.username,
      currentAp: globalPlayerData.achievementPoints || globalPlayerData.current_ap || 0,
      claims: processClaims(globalPlayerData.achievementRewardsNew),
      primary: true
    },
    ...comparisonPlayers.map(p => ({ uuid: p.uuid, username: p.username, currentAp: p.currentAp, claims: p.claims }))
  ];
  const light = isLightTheme();
  entries.forEach((e, i) => {
    e.color = PLAYER_COLORS[i % PLAYER_COLORS.length];
    e.line = e.color;
    e.hist = buildHistorySeries(e);
    e.claimSeries = buildClaimSeries(e.claims);
  });

  const showH = anaPrefs.mode === 'history';
  const showC = !showH;
  const shown = entries.filter(e => !mutedPlayers.has(e.uuid));
  const now = Date.now();

  // ---- x range: the full extent of the data shown; the drag handles / date boxes crop it ----
  let dataMin = Infinity, dataMax = -Infinity;
  shown.forEach(e => {
    const list = showH ? e.hist : e.claimSeries.pts;
    list.forEach(p => { if (p.x < dataMin) dataMin = p.x; if (p.x > dataMax) dataMax = p.x; });
  });
  if (!Number.isFinite(dataMin)) { dataMax = now; dataMin = now - 30 * DAY_MS; }
  if (dataMax <= dataMin) dataMax = dataMin + DAY_MS;
  const minSpan = Math.max(DAY_MS, (dataMax - dataMin) * 0.01);
  const rawMin = Math.min(Math.max(anaView.min ?? dataMin, dataMin), dataMax - minSpan);
  const rawMax = Math.max(Math.min(anaView.max ?? dataMax, dataMax), rawMin + minSpan);
  const xMin = rawMin, xMax = rawMax;
  anaExtent = { min: dataMin, max: dataMax };
  anaWin = { min: rawMin, max: rawMax };

  // ---- datasets: one solid connected line per player (history = base colour, claims = muted shade) ----
  const showPts = anaPrefs.points !== false; // Points toggle was removed from the UI: always on
  const textColor = cssVar('--text', light ? '#111' : '#fff');
  const datasets = [];
  shown.forEach(e => {
    if (showH) {
      const pts = windowed(e.hist, xMin, xMax);
      if (pts.length) datasets.push({
        kind: 'history', player: e.username, label: `${e.username} (history)`, data: pts, order: 1,
        borderColor: e.line, borderWidth: 2, tension: 0, spanGaps: true, backgroundColor: 'transparent', fill: false,
        pointBackgroundColor: e.line, pointBorderColor: e.line, pointHoverBackgroundColor: e.line, pointHoverBorderColor: textColor,
        clip: ANA_CLIP, pointRadius: c => (!showPts ? 0 : c.raw && c.raw.live ? 5.5 : 3.5), pointHoverRadius: 7, pointHitRadius: 10
      });
    } else {
      const cp = windowed(e.claimSeries.pts, xMin, xMax);
      if (cp.length) datasets.push({
        kind: 'claims', player: e.username, label: `${e.username} (claims)`, data: cp, order: 1,
        borderColor: e.line, borderWidth: 2, tension: 0, spanGaps: true, backgroundColor: 'transparent', fill: false,
        pointBackgroundColor: e.line, pointBorderColor: e.line, pointHoverBackgroundColor: e.line, pointHoverBorderColor: textColor,
        clip: ANA_CLIP, pointRadius: showPts ? 2 : 0, pointHoverRadius: 6, pointHitRadius: 8
      });
      const inWin = p => p.x >= xMin && p.x <= xMax;
      const ms = e.claimSeries.milestones.filter(inWin);
      if (anaPrefs.milestones && ms.length) datasets.push({
        kind: 'milestone', player: e.username, label: `${e.username} (milestones)`, data: ms, showLine: false, order: 0,
        borderColor: e.line, backgroundColor: e.line, pointBackgroundColor: e.line, pointBorderColor: textColor, pointBorderWidth: 2,
        clip: ANA_CLIP, pointRadius: 6, pointHoverRadius: 8, pointHitRadius: 10
      });
    }
  });

  if (!opts.viewOnly) { // chips + claim lists don't depend on the visible window, so skip them while cropping
    renderCompareChips(entries);
    renderClaimsPanel(entries);
  }
  renderAnaInfo(shown);
  syncAnaControls();

  const emptyEl = document.getElementById('ap-chart-empty');
  if (emptyEl) {
    emptyEl.classList.toggle('hidden', datasets.length > 0);
    emptyEl.textContent = shown.length ? 'No data in this range for the selected mode.' : 'All players are hidden. Click a player chip to show them.';
  }

  if (!apChartInstance) apChartInstance = new Chart(ctx, { type: 'line', data: { datasets }, options: buildAnaChartOptions(), plugins: [anaMilestonePlugin] });
  else apChartInstance.data.datasets = datasets;

  const o = apChartInstance.options;
  const tickColor = cssVar('--text-3', '#888');
  const gridColor = light ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
  o.scales.x.min = xMin;
  o.scales.x.max = xMax;
  o.scales.y.beginAtZero = anaPrefs.yZero;
  [o.scales.x, o.scales.y].forEach(s => { s.ticks.color = tickColor; s.grid.color = gridColor; });
  apChartInstance.update(opts.viewOnly ? 'none' : undefined);
  alignAnaSlider();
}

function bindAnaSlider() {
  const slider = document.getElementById('ana-slider');
  if (!slider) return;
  let drag = null;
  slider.addEventListener('pointerdown', e => {
    const h = e.target.closest && e.target.closest('[data-h]');
    if (!h) return;
    e.preventDefault();
    if (slider.setPointerCapture) slider.setPointerCapture(e.pointerId);
    drag = { kind: h.dataset.h, x0: e.clientX, win: { ...anaWin } };
  });
  slider.addEventListener('pointermove', e => {
    if (!drag) return;
    const width = slider.getBoundingClientRect().width || 1, span = anaExtent.max - anaExtent.min;
    const minSpan = Math.max(DAY_MS, span * 0.01), d = ((e.clientX - drag.x0) / width) * span;
    let { min, max } = drag.win;
    if (drag.kind === 'l') min = Math.min(Math.max(anaExtent.min, min + d), max - minSpan);
    else if (drag.kind === 'r') max = Math.max(Math.min(anaExtent.max, max + d), min + minSpan);
    else { const w = max - min; min = Math.min(Math.max(anaExtent.min, min + d), anaExtent.max - w); max = min + w; }
    anaView.min = min; anaView.max = max;
    scheduleAnaView();
  });
  const end = () => { drag = null; };
  slider.addEventListener('pointerup', end);
  slider.addEventListener('pointercancel', end);
}

(function bindAnaControls() {
  const $ = id => document.getElementById(id);
  const resetView = () => { anaView.min = null; anaView.max = null; };
  document.querySelectorAll('#ana-mode button').forEach(b => b.addEventListener('click', () => {
    anaPrefs.mode = b.dataset.mode; resetView(); saveAnaPrefs(); initOrUpdateAnalyticsChart();
  }));
  const dateChange = () => {
    const f = parseDay($('ana-from').value), t = parseDay($('ana-to').value);
    anaView.min = Number.isFinite(f) ? f : null;
    anaView.max = Number.isFinite(t) ? t + DAY_MS - 1 : null;
    scheduleAnaView();
  };
  ['ana-from', 'ana-to'].forEach(id => $(id)?.addEventListener('change', dateChange));
  $('ana-full')?.addEventListener('click', () => { resetView(); scheduleAnaView(); });
  [['ana-late', 'late'], ['ana-ms', 'milestones'], ['ana-yzero', 'yZero']]
    .forEach(([id, k]) => $(id)?.addEventListener('change', e => { anaPrefs[k] = e.target.checked; saveAnaPrefs(); scheduleAnaView(); }));
  $('ana-reset')?.addEventListener('click', () => { anaPrefs = { ...ANA_DEFAULTS }; resetView(); mutedPlayers.clear(); saveAnaPrefs(); initOrUpdateAnalyticsChart(); });
  bindAnaSlider();
  syncAnaControls();
})();
// ==== AP analytics (end) ====

let cabinetTour = null;
function initCabinetTour() {
  if (typeof LitTour === 'undefined') return;
  cabinetTour = new LitTour('cabinet', [
    {
      target: '#cabinet-settings-toggle-btn',
      fallbackTarget: '.settings-wrapper .settings-btn',
      title: 'Cabinet Settings',
      desc: 'Customise your tracker view, toggle competitive bans, and change display formats.',
      position: 'bottom',
      onShow: () => {
        document.getElementById('settings-menu')?.classList.add('hidden');
      }
    },
    {
      target: '#settings-menu',
      title: 'Settings & Overrides',
      desc: 'Enable Gold AP rewards or hide maxed badges directly from this menu.',
      position: 'left',
      onShow: () => {
        const menu = document.getElementById('settings-menu');
        if (menu) menu.classList.remove('hidden');
      }
    },
    {
      target: '#col-tiered .ach-card:first-child',
      fallbackTarget: '#col-tiered-section',
      title: 'Tiered Milestones',
      desc: 'Click notches on tiered cards to preview milestones, rewards, and descriptions for that tier.',
      position: 'right',
      onShow: () => {
        document.getElementById('settings-menu')?.classList.add('hidden');
      }
    },
    {
      target: '#col-tiered-section .col-header',
      title: 'Collapse Sections',
      desc: 'Click column headers to minimise or expand entire Tiered, Challenge, or History columns.',
      position: 'bottom'
    },
    {
      target: '.ach-card .ach-action-btn:first-child',
      title: 'Bookmark Achievements',
      desc: 'Star any achievement to save it into your quick-access focus list.',
      position: 'bottom'
    },
    {
      target: '#bookmarkToggleBtn',
      title: 'View Bookmarks',
      desc: 'Toggle Bookmarks mode to filter down exclusively to your starred list, bypassing all game filters.',
      position: 'bottom'
    }
  ]);
}

window.startCabinetTour = function(force = false) {
  if (!cabinetTour) initCabinetTour();
  if (cabinetTour) {
    cabinetTour.start(force);
  }
};

// The archive is large and only the analytics chart needs it, so load it (and build the chart)
// when that section is about to scroll into view rather than during first paint.
let _archiveP = null, _anaObserver = null;
function loadArchive() {
  return _archiveP ||= fetch('ap_history_archive.json')
    .then(r => (r.ok ? r.json() : {}))
    .then(d => { historicalArchiveData = d || {}; return historicalArchiveData; })
    .catch(() => { _archiveP = null; return historicalArchiveData; });
}
function scheduleAnalytics() {
  if (apChartInstance) { initOrUpdateAnalyticsChart(); return; }
  const section = document.getElementById('analytics-section');
  if (!section) return;
  if (_anaObserver) _anaObserver.disconnect();
  if (!('IntersectionObserver' in window)) { loadArchive().then(() => initOrUpdateAnalyticsChart()); return; }
  _anaObserver = new IntersectionObserver((entries, obs) => {
    if (!entries.some(e => e.isIntersecting)) return;
    obs.disconnect();
    loadArchive().then(() => initOrUpdateAnalyticsChart());
  }, { rootMargin: '400px' });
  _anaObserver.observe(section);
}

function renderCabinet(data, softRender = false) {
  if (!softRender) document.title = `LitStats - ${data.username}'s Cabinet`;
  
  data.gamePercentages = data.gamePercentages || {};
  data.missingAchievements = data.missingAchievements || [];

  const errorBox = document.getElementById('errorBox');
  if (errorBox) {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }

  document.getElementById('p-avatar').src = `https://visage.surgeplay.com/bust/${data.uuid}`;
  document.getElementById('p-avatar').onerror = function() { this.src = `https://vzge.me/bust/${data.uuid}.png`; };
  
  const helmEl = document.getElementById('p-helm');
  if (helmEl && data.username) { helmEl.style.display = ''; helmEl.src = `https://minotar.net/helm/${encodeURIComponent(data.username)}/100`; }
  const nameEl = document.getElementById('p-name');
  nameEl.textContent = data.username;
  nameEl.style.setProperty('color', getRankBaseColourHex(data.rank, data.monthlyRankColor), 'important');

  nameEl.parentNode.querySelectorAll('.guild-tag').forEach(e => e.remove());
  if (data.guildTag && typeof guildTagHTML === 'function') nameEl.insertAdjacentHTML('afterend', guildTagHTML(data.guildTag, data.guildColor));

  const rankEl = document.getElementById('p-rank');
  if (data.rank && data.rank !== 'NON') {
    rankEl.innerHTML = formatRankText(data.rank, data.rankPlusColor, data.monthlyRankColor);
    rankEl.style.display = 'inline-block';
  } else {
    rankEl.style.display = 'none'; 
  }

  const rankPill = document.getElementById('p-top-rank-pill');
  if (data.leaderboardRank) {
    rankPill.textContent = `#${data.leaderboardRank}`;
    rankPill.className = 'rank-num-pill';
    if (data.leaderboardRank <= 10) rankPill.classList.add('rank-top10');
    else if (data.leaderboardRank <= 25) rankPill.classList.add('rank-top25');
    else if (data.leaderboardRank <= 50) rankPill.classList.add('rank-top50');
    else if (data.leaderboardRank <= 100) rankPill.classList.add('rank-top100');
    else if (data.leaderboardRank <= 200) rankPill.classList.add('rank-top200');
    rankPill.style.display = 'inline-flex';
  } else {
    rankPill.style.display = 'none';
  }

  const bgFlagEl = document.getElementById('p-bg-flag');
  if (bgFlagEl) {
    if (data.country && data.country !== 'Unknown') {
      const flagUrl = getFlagUrl(data.country);
      if (flagUrl) {
        bgFlagEl.style.backgroundImage = `url("${flagUrl}")`;
        bgFlagEl.style.display = 'block';
      } else {
        bgFlagEl.style.display = 'none';
      }
    } else {
      bgFlagEl.style.display = 'none';
    }
  }

  const miniFlagEl = document.getElementById('p-mini-flag');
  if (miniFlagEl) {
    const fu = data.country && data.country !== 'Unknown' ? getFlagUrl(data.country) : null;
    if (fu) { miniFlagEl.src = fu.replace('/w640/', '/w40/'); miniFlagEl.alt = data.country; miniFlagEl.title = data.country; miniFlagEl.dataset.ok = '1'; }
    else { miniFlagEl.removeAttribute('src'); miniFlagEl.dataset.ok = '0'; }
  }

  const isGoldOverride = localStorage.getItem('litstats_gold_ap') === 'true';
  const rewardIconSrc = isGoldOverride ? "img/gold_ingot.png" : "img/diamond.png";

  const ap = data.achievementPoints || data.current_ap || 0;
  const dynamicColor = getApColor(ap);
  const dynamicGlow = dynamicColor.replace('rgb', 'rgba').replace(')', ', 0.35)');
  let displayAp = (ap || 0).toLocaleString();
  
  document.getElementById('p-ap-container').innerHTML = `
    <div class="ap-stat-pill" style="--ap-color: ${dynamicColor}; --ap-glow: ${dynamicGlow};">
      <div class="ap-stat-pill-inner">
        <img src="${rewardIconSrc}" style="width: 16px; height: 16px; filter: drop-shadow(0 0 4px var(--ap-glow));">
        <span id="p-ap">${displayAp} AP</span>
      </div>
    </div>
  `;
  
  const standardActiveGames = [
    "Max UHC", "Max Pit", "Max Mega Walls", "Max SkyWars", "Max Blitz",
    "Max Smash Heroes", "Max Bed Wars", "Max Cops and Crims", "Max Quake", "Max Paintball", "Max Arena Brawl",
    "Max SkyBlock", "Max Speed UHC", "Max Warlords", "Max Walls", "Max TNT Games", "Max Arcade",
    "Max Murder Mystery", "Max VampireZ", "Max TKR", "Max Wool Games", "Max Duels", "Max Build Battle"
  ];

  const userMaxes = data.maxGames || [];
  const activeStandardMaxed = standardActiveGames.filter(g => userMaxes.includes(g));
  const seasonalEvents = ["Max Summer", "Max Winter", "Max Easter", "Max Halloween"];
  const hasMaxedAllSeasonals = seasonalEvents.every(s => userMaxes.includes(s)) || userMaxes.includes("Max Seasonal");

  const totalMaxedCount = activeStandardMaxed.length + (hasMaxedAllSeasonals ? 1 : 0);
  const TOTAL_STANDARD_GAMES = 23;

  document.getElementById('p-max-count').innerHTML = `<span style="font-weight:400; font-family:'DM Sans', sans-serif; color:var(--text);">${totalMaxedCount} / ${TOTAL_STANDARD_GAMES} Maxed</span>`;
  
  globalPlayerData = data;
  updateProgressDisplay();

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
      let apLeftHtml = '';
      
      if (!isAchieved) {
        const percent = data.gamePercentages?.[game] || 0;
        let color = percent >= 80 ? 'var(--tier-1)' : percent >= 40 ? 'var(--tier-2)' : 'var(--tier-4)';
        innerHtml = `<div class="slot-progress"><div class="slot-fill" style="width: ${percent}%; background-color: ${color};"></div></div>`;
        
        const gTotals = data.gameTotals?.[cleanGameName];
        if (gTotals && gTotals.possibleAP > 0) {
          const apLeft = Math.max(0, gTotals.possibleAP - gTotals.unlockedAP);
          apLeftHtml = `<span class="badge-ap-left">${apLeft.toLocaleString()} AP Left</span>`;
          tooltip = `${cleanGameName} - ${apLeft.toLocaleString()} AP Left (${Number(percent).toFixed(1)}%)`;
        } else {
          tooltip = `${cleanGameName} - ${Number(percent).toFixed(1)}% Complete`;
        }
      }

      html += `
        <div class="game-badge ${statusClass}" title="${tooltip}">
          <div class="img-wrapper"><img src="${getGameIconUrl(cleanGameName)}" onerror="this.style.display='none'"></div>
          <span>${cleanGameName}</span>
          ${apLeftHtml}
          ${innerHtml}
        </div>
      `;
    });
    html += `</div></div>`;
  });

  cabinetGrid.innerHTML = html;
  
  if (data.missingAchievements && !softRender) {
    populateFilters();
    renderDashboard();
  }

  scheduleAnalytics();
  document.getElementById('cabinet-content').classList.remove('hidden');

  setTimeout(() => {
    startCabinetTour(false);
  }, 600);
}

async function initCabinet(explicitLookupId) {
  const urlParams = new URLSearchParams(window.location.search);
  let lookupId = explicitLookupId || urlParams.get('player') || urlParams.get('uuid');

  // No player in the URL: fall back to this tab's active search, then the site-wide pin
  if (!lookupId) {
    let fallback = null;
    try { fallback = sessionStorage.getItem('active_player_session') || localStorage.getItem('litstats_pinnedPlayer'); } catch (e) {}
    if (fallback) {
      lookupId = fallback;
      const topInput = document.getElementById('top-search-input');
      if (topInput) topInput.value = fallback;
      window.history.replaceState(null, '', `${window.location.pathname}?player=${encodeURIComponent(fallback)}`);
    }
  }

  const errorBox = document.getElementById('errorBox');
  if (errorBox) {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }

  if (!lookupId) {
    if (typeof window.hideLoader === 'function') window.hideLoader();
    if (errorBox) {
      errorBox.textContent = "Please enter a username above to load achievements.";
      errorBox.classList.remove('hidden');
    }
    return;
  }

  // Start the leaderboard fetch now so it overlaps the player lookups below.
  const huntersP = fetch('ap_hunters_data.json').then(r => (r.ok ? r.json() : null)).catch(() => null);

  if (typeof window.showLoader === 'function') {
    window.showLoader("Loading achievements...");
  }

  try {
    let uuid = lookupId;
    if (lookupId.length <= 16) {
      const dbRes = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(lookupId)}`);
      const dbData = await dbRes.json();
      if (dbData.code === 'player.found') {
        uuid = dbData.data.player.raw_id;
      }
    }
    
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? 'http://localhost:3000' : 'https://api.litstats.com';
    const apiUrl = `${baseUrl}/api/player?uuid=${encodeURIComponent(uuid)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) {
      throw new Error(`Failed to fetch player stats (${res.status})`);
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    try {
      const huntersData = await huntersP;
      if (huntersData && huntersData.country_leaderboard) {
        const allPlayers = [];
        huntersData.country_leaderboard.forEach(c => allPlayers.push(...c.top_players));
        allPlayers.sort((a, b) => b.current_ap - a.current_ap);
        const uname = (data.username || '').toLowerCase();
        const hunterIndex = allPlayers.findIndex(h => h.uuid === data.uuid || (h.username || '').toLowerCase() === uname);
        if (hunterIndex !== -1 && hunterIndex < 200) {
          data.leaderboardRank = hunterIndex + 1;
          data.country = allPlayers[hunterIndex].country || data.country;
        }
      }
    } catch (err) {
      console.log("Could not load hunters data");
    }

    renderCabinet(data);

  } catch (err) {
    if (errorBox) {
      errorBox.textContent = err.message || "Failed to load player data.";
      errorBox.classList.remove('hidden');
    }
  } finally {
    if (typeof window.hideLoader === 'function') {
      window.hideLoader();
    }
  }
}

let _wasMobile = window.innerWidth <= 800, _resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(() => {
    const m = window.innerWidth <= 800;
    if (m === _wasMobile) return;          // layout is CSS-driven; only labels differ across the breakpoint
    _wasMobile = m;
    if (globalPlayerData) { populateFilters(); renderDashboard(); }
  }, 150);
});

document.addEventListener("DOMContentLoaded", () => {
  loadPinnedPlayer();
  if(isShowCompleted) {
      const btn = document.getElementById('toggle-completed-btn');
      if (btn) btn.classList.add('active');
  }

  const collapsibleSections = ['col-tiered-wrapper', 'col-challenge-wrapper', 'history-column-wrapper', 'overview-grid-wrapper', 'analytics-content-wrapper', 'incomplete-filters-wrapper'];
  
  collapsibleSections.forEach(id => {
    if (localStorage.getItem('litstats_collapse_' + id) === 'true') {
      document.getElementById(id)?.classList.add('hidden');
      const wrapper = document.getElementById(id);
      if (wrapper && id === 'incomplete-filters-wrapper') {
        document.getElementById('dynamic-dash-title')?.classList.add('collapsed-section');
      } else if (wrapper && wrapper.previousElementSibling) {
        wrapper.previousElementSibling.classList.add('collapsed-section');
      }
    }
  });

  applyDensity();
  syncDashLayout();
  if (document.getElementById('excludeComp')) document.getElementById('excludeComp').checked = isCompExcluded;
  if (document.getElementById('multiSelectToggle')) document.getElementById('multiSelectToggle').checked = isMultiSelect;
  if (document.getElementById('multiExcludeToggle')) document.getElementById('multiExcludeToggle').checked = isMultiExclude;
  if (document.getElementById('highestTierToggle')) document.getElementById('highestTierToggle').checked = isHighestTierOnly;
  if (document.getElementById('hideHistoryToggle')) document.getElementById('hideHistoryToggle').checked = isHistoryHidden;
  if (document.getElementById('hideMaxesToggle')) document.getElementById('hideMaxesToggle').checked = isMaxesHidden;
  if (document.getElementById('goldApToggle')) document.getElementById('goldApToggle').checked = isGoldApEnabled;

  if (document.getElementById('showSecretToggle')) document.getElementById('showSecretToggle').checked = showSecretTags;
  if (document.getElementById('showBrokenToggle')) document.getElementById('showBrokenToggle').checked = showBrokenTags;

  if (isHistoryHidden) {
    document.getElementById('history-column-wrapper').style.display = 'none';
  }
  if (isMaxesHidden) {
    document.getElementById('maxed-column').style.display = 'none';
  }

  initCabinet();
});

if (document.getElementById('showCompletedToggle')) document.getElementById('showCompletedToggle').checked = isShowCompleted;
