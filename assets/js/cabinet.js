let globalPlayerData = null;
let activeGameFilters = new Set();
let searchQuery = '';
let apChartInstance = null;
let comparisonPlayers = [];
let localAPDataCache = null;
let historicalArchiveData = {};

let isCompExcluded = localStorage.getItem('litstats_excludeComp') === 'true';
let isMultiSelect = localStorage.getItem('litstats_multiSelect') === 'true';
let isHighestTierOnly = localStorage.getItem('litstats_highestTier') === 'true';
let isHistoryHidden = localStorage.getItem('litstats_historyHidden') === 'true';
let isMaxesHidden = localStorage.getItem('litstats_maxesHidden') === 'true';
let isGoldApEnabled = localStorage.getItem('litstats_gold_ap') === 'true';
let progressDisplayMode = localStorage.getItem('litstats_progressMode') || 'points'; 
let filterLabelMode = localStorage.getItem('litstats_filterLabelMode') || 'percent'; 

const compGames = ["Mega Walls", "Pit", "UHC"];

window.activeTierView = {}; 
window.limits = { tiered: 24, challenge: 24, recent: 24 };
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

const TAG_DB = {
  "Untouched": { type: "Broken", tip: "Obtainable on Dwarven, Nordic, Outback and Jungle, if these maps don't work, try leave a game you know your team will win, or eat a gapple before your absorption ends when the walls fall" },
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
  "[Pit] Rambo": { type: "Prestige", level: 3, renown: 15, tip: "Need Rambo renown perk" },
  "Paint Job": { type: "Prestige", level: 5, renown: 10, tip: "Need Fancy Hat renown upgrade" },
  "Poet": { type: "Prestige", level: 6, renown: 10, tip: "Need Heresy renown upgrade, complete the night quest in chat, night falls every 36 minutes or you can check [here](https://pit.wiki/Night_Quests)" },
  "In the Club": { type: "Prestige", level: 7, renown: 30, tip: "Need Fishing Club V renown upgrade" },
  "Big Belly": { type: "Prestige", level: 7, renown: 50, tip: "Soup is 30 renown, Olympus is 20 renown, Steaks from pants enchant, Golden Head from its perk, Golden Apple from disabling healing perks" },
  "Fast Pass": { type: "Prestige", level: 10, renown: 100 },
  "The XX": { type: "Prestige", level: 20},
  "Big Time": { type: "Prestige", level: 25, renown: 3400 },
  "Well, well": { souls: 10 },
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
  "[Blitz] Collector": { type: "Coins", cost: "4,249,440", tip: "3 standard Level X kits costs 4,249,440, however it's free to level Ultimate kits" },
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
  "Contracts": { tip: "Purchasing the Contractor renown upgrade allows players to complete up to 8 contracts a day" },
  "Sugar Rush": { tip: "Aim for cherries, they give more gold" },
  "Blasphemous": { tip: "Check Opal costs for the the Fallen Angel Kit [here](https://www.litstats.com/angel)" },
  "Well Traveled": { type: "Map", map: "Transport" },
  "I Am Your Shield": { type: "Map", map: "Transport" },
  "Totally Tubular": { type: "Map", map: "Transport" },
  "Paranoid much?": { type: "Map", map: "Transport" },
  "Mixed messages": { type: "Map", map: "Ancient Tomb" },
  "It's Time To Stop": { type: "Map", map: "Ancient Tomb" },
  "[Murder Mystery] Beyond The Grave": { type: "Map", map: "Ancient Tomb" },
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

const MWSkinData = {
  "moobrawl": { class: "cow", stat: "moo_brawl", max: 600 },
  "greedylouis": { class: "cow", stat: "greedy_louis", max: 500 },
  "biologicalrestoration": { class: "cow", stat: "bio_restore", max: 2500 },
  "beyondthegrave": { class: "cow", stat: "beyond_the_grave", max: 15 },
  "treasurehunter": { class: "hunter", stat: "treasure_hunter", max: 300 },
  "cakehunter": { class: "hunter", stat: "cake_hunter", max: 150 },
  "onewithnature": { class: "hunter", stat: "one_with_nature", max: 50 },
  "hammerhead": { class: "shark", stat: "hammerhead", max: 100 },
  "oceansexplorer": { class: "shark", stat: "explorer", max: 1000 },
  "oceansdefender": { class: "shark", stat: "defender", max: 250 },
  "rushlord": { class: "dreadlord", stat: "rushlord", max: 20000 },
  "breadlord": { class: "dreadlord", stat: "breadlord", max: 617 },
  "gatheringtalentindeed": { class: "dreadlord", stat: "gathering_ti", max: 500 },
  "timber": { class: "golem", stat: "timber", max: 5000 },
  "ironhearted": { class: "golem", stat: "iron_hearted", max: 1000 },
  "chestsfound": { class: "herobrine", stat: "lucky_sunny", max: 1000 },
  "luckysunny": { class: "herobrine", stat: "lucky_sunny", max: 1000 },
  "seasonsgreetings": { class: "herobrine", stat: "seasons_greetings", max: 1000 },
  "sleepytime": { class: "zombie", stat: "sleepytime", max: 50 },
  "mrclutcherson": { class: "zombie", stat: "clutcherson", max: 100 },
  "unstoppableforce": { class: "zombie", stat: "unstoppable_force", max: 25 },
  "potionsofdeath": { class: "arcanist", stat: "potions_of_death", max: 8 },
  "hardassteel": { class: "arcanist", stat: "hard_as_steel", max: 5000 },
  "abilspammer": { class: "arcanist", stat: "abil_spammer", max: 1000 },
  "surprise": { class: "enderman", stat: "surprise", max: 2500 },
  "sneakattack": { class: "enderman", stat: "sneak_attack", max: 100 },
  "highonores": { class: "blaze", stat: "high_on_ores", max: 2000 },
  "lightemup": { class: "blaze", stat: "light_em_up", max: 10 },
  "blazecaller": { class: "blaze", stat: "blazecaller", max: 500 },
  "marksman": { class: "skeleton", stat: "marksman", max: 25 },
  "skeletonsbestfriend": { class: "skeleton", stat: "skele_best_friend", max: 50 },
  "geronimo": { class: "spider", stat: "geronimo", max: 25000 },
  "onegiantleap": { class: "spider", stat: "one_giant_leap", max: 250 },
  "idontfeelsogood": { class: "spider", stat: "idfsg", max: 600 },
  "massdestruction": { class: "creeper", stat: "mass_destruction", max: 3000 },
  "instaboom": { class: "creeper", stat: "instaboom", max: 20 },
  "dontblink": { class: "assassin", stat: "dont_blink", max: 1200 },
  "alchemy100": { class: "assassin", stat: "alchemy_100", max: 1000 },
  "dirtydog": { class: "werewolf", stat: "dirty_dog", max: 15 },
  "timetodiet": { class: "werewolf", stat: "time_to_diet", max: 750 },
  "huntingseason": { class: "werewolf", stat: "hunting_season", max: 50000 },
  "howlingmoon": { class: "werewolf", stat: "howling_moon", max: 1000 },
  "nightsrest": { class: "phoenix", stat: "nights_rest", max: 1000 },
  "terminatedscript": { class: "automaton", stat: "terminated_script", max: 3000 },
  "constructor": { class: "moleman", stat: "constructor", max: 15000 },
  "heavyeater": { class: "moleman", stat: "heavy_eater", max: 1000 },
  "nomnom": { class: "moleman", stat: "nom_nom", max: 1000 },
  "recycling": { class: "renegade", stat: "recycling", max: 3000 },
  "captaincombo": { class: "renegade", stat: "captain_combo", max: 20000 },
  "chaseddown": { class: "renegade", stat: "chased_down", max: 20 },
  "schoolcancelled": { class: "snowman", stat: "school_cancelled", max: 7200 },
  "frostyfriendship": { class: "snowman", stat: "frosty_friendship", max: 500 },
  "australianwinterseasonal": { class: "snowman", stat: "australian_winter", max: 500 },
  "australianwinter": { class: "snowman", stat: "australian_winter", max: 500 },
  "muchdogs": { class: "shaman", stat: "much_dogs", max: 500 },
  "revengeofthewolves": { class: "shaman", stat: "revenge_of_the_wolves", max: 5 },
  "livingontheedge": { class: "shaman", stat: "spring_hero", max: 250 },
  "collector": { class: "pigman", stat: "collector", max: 500 },
  "youngthug": { class: "pigman", stat: "young_thug", max: 5 },
  "toughskin": { class: "pigman", stat: "tough_skin", max: 500 },
  "graverobber": { class: "pirate", stat: "grave_robber", max: 100 },
  "deathfromabove": { class: "pirate", stat: "death_from_above", max: 12 },
  "burialatsea": { class: "pirate", stat: "burial_at_sea", max: 5 },
  "youshallnotpass": { class: "squid", stat: "you_shall_not_pass", max: 10 },
  "trustmeimadoctor": { class: "squid", stat: "trust_me_im", max: 2500 },
  "everblind": { class: "squid", stat: "everblind", max: 250 },
  "rewritingfate": { class: "angel", stat: "rewriting_fate", max: 250 },
  "ashestoashes": { class: "dragon", stat: "ashes_to_ashes", max: 5 },
  "perfectdisguise": { class: "sheep", stat: "perfect_disguise", max: 100 },
  "woollyrespite": { class: "sheep", stat: "woolly_respite", max: 250 }
};

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
    wrap.classList.toggle('hidden');
    sec.classList.toggle('collapsed-section');
  }
};

const TRUE_MAX_POSSIBLE_AP = 32535;
const TRUE_MAX_POSSIBLE_ACHS = 3500;

window.toggleProgressMode = function() {
  progressDisplayMode = progressDisplayMode === 'points' ? 'achs' : 'points';
  localStorage.setItem('litstats_progressMode', progressDisplayMode);
  updateProgressDisplay();
};

function updateProgressDisplay() {
  if(!globalPlayerData) return;
  const ap = globalPlayerData.achievementPoints || 0;
  
  let unlockedCount = globalPlayerData.globalTotals?.unlockedAchs || 0;
  let totalCount = globalPlayerData.globalTotals?.possibleAchs || TRUE_MAX_POSSIBLE_ACHS;
  let possibleAP = TRUE_MAX_POSSIBLE_AP;

  if (unlockedCount === 0 && globalPlayerData.missingAchievements) {
    unlockedCount = Math.max(0, totalCount - globalPlayerData.missingAchievements.length);
  }
  
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

window.handleAchSearch = function() {
  searchQuery = document.getElementById('achSearch').value.toLowerCase();
  renderDashboard();
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

  if (!isMultiSelect) {
    if (activeGameFilters.has(gameName) && activeGameFilters.size === 1) {
      activeGameFilters.clear();
    } else {
      activeGameFilters.clear();
      activeGameFilters.add(gameName);
    }
  } else {
    activeGameFilters.has(gameName) ? activeGameFilters.delete(gameName) : activeGameFilters.add(gameName);
  }
  
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
  if (!isMultiSelect && activeGameFilters.size > 1) {
    const first = activeGameFilters.values().next().value;
    activeGameFilters.clear();
    if (first) activeGameFilters.add(first);
    populateFilters();
    renderDashboard();
  }
}

function toggleGoldApRewards() {
  isGoldApEnabled = document.getElementById('goldApToggle').checked;
  localStorage.setItem('litstats_gold_ap', isGoldApEnabled);
  renderCabinet(globalPlayerData, true);
  renderDashboard();
}

function toggleHighestTier() {
  isHighestTierOnly = document.getElementById('highestTierToggle').checked;
  localStorage.setItem('litstats_highestTier', isHighestTierOnly);
  renderDashboard();
}

function toggleHideHistory() {
  isHistoryHidden = document.getElementById('hideHistoryToggle').checked;
  localStorage.setItem('litstats_historyHidden', isHistoryHidden);
  document.getElementById('history-column-wrapper').style.display = isHistoryHidden ? 'none' : 'flex';
}

function toggleHideMaxes() {
  isMaxesHidden = document.getElementById('hideMaxesToggle').checked;
  localStorage.setItem('litstats_maxesHidden', isMaxesHidden);
  document.getElementById('maxed-column').style.display = isMaxesHidden ? 'none' : 'block';
}

function populateFilters() {
  const container = document.getElementById('gameFilterContainer');
  if (!globalPlayerData) return;
  
  const games = [...new Set((globalPlayerData.missingAchievements || []).map(a => a.game))].sort();
  const isMobile = window.innerWidth <= 800;
  
  let html = `<div class="filter-icon-grid">`;
  games.forEach(g => { 
    let cleanName = g.replace('Max ', '');
    let isDisabled = isCompExcluded && compGames.includes(cleanName) ? 'disabled' : '';
    let isActive = activeGameFilters.has(cleanName) ? 'active' : '';
    
    const gTotals = globalPlayerData.gameTotals?.[cleanName];
    let percent = 0;
    if (gTotals && gTotals.possibleAchs > 0) {
      percent = (gTotals.unlockedAchs / gTotals.possibleAchs) * 100;
    } else if (globalPlayerData.gamePercentages?.[`Max ${cleanName}`]) {
      percent = Number(globalPlayerData.gamePercentages[`Max ${cleanName}`]);
    } else if (globalPlayerData.gamePercentages?.[cleanName]) {
      percent = Number(globalPlayerData.gamePercentages[cleanName]);
    }

    let color = percent >= 80 ? 'var(--tier-1)' : percent >= 40 ? 'var(--tier-2)' : 'var(--tier-4)';
    
    let statLabel = `${Math.round(percent)}%`;
    if (!isMobile && gTotals) {
      if (filterLabelMode === 'points') {
        statLabel = `${gTotals.unlockedAP.toLocaleString()} / ${gTotals.possibleAP.toLocaleString()}`;
      } else if (filterLabelMode === 'achs') {
        statLabel = `${gTotals.unlockedAchs} / ${gTotals.possibleAchs}`;
      } else {
        statLabel = `${percent.toFixed(1)}%`;
      }
    }

    html += `
      <div class="filter-pill-btn ${isActive} ${isDisabled}" data-gamename="${cleanName}" onclick="toggleGameFilter('${cleanName}')" title="${cleanName} (${percent.toFixed(1)}%)">
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

window.setTierView = function(base64Id, tierNum) {
  window.activeTierView[base64Id] = parseInt(tierNum);
  renderDashboard();
};

function renderDashboard() {
  if (!globalPlayerData) return;

  const isBookmarkViewActive = viewMode === 'bookmarks';
  let allMissing = [...(globalPlayerData.missingAchievements || [])];

  if (!isBookmarkViewActive) {
    if (isCompExcluded) allMissing = allMissing.filter(a => !compGames.includes(a.game.replace('Max ', '')));
    if (activeGameFilters.size > 0) allMissing = allMissing.filter(a => activeGameFilters.has(a.game.replace('Max ', '')));
  }

  if (searchQuery.trim().length > 0) {
    allMissing = allMissing.filter(a => 
      a.title.toLowerCase().includes(searchQuery) || 
      (a.desc && a.desc.toLowerCase().includes(searchQuery)) ||
      a.game.toLowerCase().includes(searchQuery)
    );
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

  const igBtn = document.getElementById('ignoredToggleBtn');
  const bkBtn = document.getElementById('bookmarkToggleBtn');
  if (igBtn) igBtn.innerText = viewMode === 'ignored' ? "View All" : `Show Ignored (${ignoredAchs.length})`;
  if (igBtn) igBtn.classList.toggle('active', viewMode === 'ignored');
  if (bkBtn) bkBtn.innerText = viewMode === 'bookmarks' ? "View All" : `Bookmarks (${bookmarkedAchs.length})`;
  if (bkBtn) bkBtn.classList.toggle('active', viewMode === 'bookmarks');

  const dashBoxEl = document.getElementById('dynamic-dash-box');
  if (activeGameFilters.size === 1 && !searchQuery && !isBookmarkViewActive) {
    let selectedGame = activeGameFilters.values().next().value;
    let t = globalPlayerData.gameTotals?.[selectedGame];
    
    if (t && t.possibleAchs > 0) {
      let pct = Math.min(100, (t.unlockedAchs / t.possibleAchs) * 100).toFixed(1);
      let isMax = t.unlockedAchs >= t.possibleAchs;
      dashBoxEl.innerHTML = `
        <div class="dynamic-title-top">
          <img src="${getGameIconUrl(selectedGame)}" alt="">
          <h2>${selectedGame}</h2>
        </div>
        <div class="game-sub-stats">
          <span>${t.unlockedAchs} / ${t.possibleAchs} Achievements (${t.unlockedAP.toLocaleString()} / ${t.possibleAP.toLocaleString()} AP)</span>
          <span class="game-header-bar"><span class="game-header-bar-fill" style="width: ${pct}%;"></span></span>
          ${isMax ? '<span style="color:#F6C85F;font-weight:700;">Maxed!</span>' : ''}
        </div>
      `;
    }
  } else {
    dashBoxEl.innerHTML = `
      <div class="dynamic-title-top">
        <h2>${isBookmarkViewActive ? 'Bookmarked Achievements' : 'Incomplete'}</h2>
      </div>
    `;
  }

  allMissing.forEach(ach => {
    let uniqueId = btoa(encodeURIComponent(ach.title)); 
    ach.uniqueId = uniqueId;

    let isIgnored = ignoredAchs.includes(uniqueId);
    let isBookmarked = bookmarkedAchs.includes(uniqueId);

    if (viewMode === 'ignored' && !isIgnored) return;
    if (viewMode === 'bookmarks' && !isBookmarked) return;
    if (viewMode === 'all' && isIgnored) return;

    let tagsHtml = '';
    let tipHtml = '';
    let cleanGame = ach.game.replace('Max ', '');
    const tagData = TAG_DB[`[${cleanGame}] ${ach.title}`] || TAG_DB[ach.title];

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
        tagsHtml += ` <span class="sleek-tag" data-tag="renown" style="margin-left: 4px;">${tagData.renown} Renown</span>`;
      }

      if (tagData.souls) {
        tagsHtml += ` <span class="sleek-tag" style="--tag-color: #55ffff; margin-left: 4px;">${tagData.souls} Souls</span>`;
      }
      
      if (tagData.tip) {
        let linkedTip = tagData.tip
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            let href = url.startsWith('http') ? url : `https://${url}`;
            return `<a href="${href}" target="_blank" style="color: inherit; text-decoration: underline;">${text}</a>`;
          })
          .replace(/(?<!["'])(https?:\/\/[^\s<]+|www\.[^\s<]+)(?![^<]*>)/g, match => {
            let href = match.startsWith('http') ? match : `https://${match}`;
            return `<a href="${href}" target="_blank" style="color: inherit; text-decoration: underline;">${match}</a>`;
          })
          .replace(/\n/g, '<br>');
          
        tipHtml = `<div class="ach-tip"><i>Tip: ${linkedTip}</i></div>`;
      }
    }
    ach.tagsHtml = tagsHtml;
    ach.tipHtml = tipHtml;
    
    let isChallenge = ach.isOneTime || (ach.globalPct !== undefined && ach.currentAmt === undefined && !ach.allTiers);

    // MW Skin Reformat Interceptor
    let mwTargetAmt = null;
    let mwCurrentAmt = null;
    let mwProgPct = null;

    if (cleanGame === 'Mega Walls') {
      const t = ach.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const mwData = MWSkinData[t];
      if (mwData) {
        isChallenge = true; 
        mwCurrentAmt = globalPlayerData.megaWalls?.skins?.[mwData.class]?.[mwData.stat] || 0; // responsedata: megawalls.skins.dreadlord.gathering_ti
        mwTargetAmt = mwData.max;
        
        ach.mwCurrentAmt = Math.min(mwCurrentAmt, mwTargetAmt);
        ach.mwTargetAmt = mwTargetAmt;
        
        ach.mwProgPct = (ach.mwCurrentAmt / ach.mwTargetAmt) * 100;
        ach.isCompleted = ach.mwCurrentAmt >= ach.mwTargetAmt;
      }
    }

    if (isChallenge) {
      ach.calcPct = Number(ach.gamePercentUnlocked || ach.globalPct || 0);
      challenges.push(ach);
    } else {
      if (!ach.allTiers) ach.allTiers = [{ tier: ach.tier || 1, amount: ach.amount || 1, reward: ach.reward || 0 }];

      let missingTiers = ach.allTiers.filter(t => (ach.currentAmt || 0) < t.amount);
      let firstMissing = missingTiers.length ? missingTiers[0].tier : ach.allTiers[ach.allTiers.length - 1].tier;
      
      let viewingTierNum = isHighestTierOnly ? ach.allTiers[ach.allTiers.length - 1].tier : (window.activeTierView[uniqueId] || firstMissing);
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
  if (activeGameFilters.size > 0 && !isBookmarkViewActive) {
    recents = recents.filter(a => activeGameFilters.has(a.game.replace('Max ', '')));
  }
  const sortRec = document.getElementById('sortRecent')?.value || 'newest';
  if (sortRec === 'oldest') {
    recents = [...recents].reverse();
  }

  const generateCard = (ach, isTiered, progressBlock, notches, isHistory = false) => {
    let isIgnored = ignoredAchs.includes(ach.uniqueId);
    let isBookmarked = bookmarkedAchs.includes(ach.uniqueId);
    let ignoreText = isIgnored ? 'Restore' : 'Ignore';
    let bookmarkClass = isBookmarked ? 'active-bookmark' : '';
    let bookmarkIcon = isBookmarked ? '★' : '☆';
    
    const notchClass = (isTiered && !isHighestTierOnly) ? 'has-tier' : 'no-notches';
    const historyClass = isHistory ? 'history-card' : '';

    return `
      <div class="ach-card ${notchClass} ${historyClass}">
        ${!isTiered && !isHistory ? `<span class="ach-percent">${ach.calcPct.toFixed(2)}%</span>` : ''}
        <div class="ach-card-header">
          <img src="${getGameIconUrl(ach.game)}" class="todo-game-icon" onerror="this.style.display='none'">
          <span class="ach-game">${ach.game.replace('Max ', '')}</span>
        </div>
        
        <span class="ach-title">${ach.title} ${ach.tagsHtml || ''}</span>
        <span class="ach-desc">${ach.desc}</span>
        ${ach.tipHtml || ''}
        
        ${progressBlock}

        <div class="ach-card-footer">
          <span class="ach-reward"><img src="${rewardIconSrc}" alt="AP" style="width:14px; height:14px; object-fit:contain;"> ${isTiered ? ach.activeReward : ach.reward} AP</span>
          ${!isHistory ? `
            <div class="ach-actions">
              <button onclick="toggleBookmark('${ach.uniqueId}')" class="ach-action-btn ${bookmarkClass}" title="Bookmark">${bookmarkIcon}</button>
              <button onclick="toggleIgnore('${ach.uniqueId}')" class="ach-action-btn" title="${ignoreText}">${ignoreText}</button>
            </div>
          ` : ''}
        </div>
        ${isTiered && !isHighestTierOnly ? `<div class="tier-notch-container">${notches}</div>` : ''}
      </div>
    `;
  };

  let viewLimitTiered = searchQuery ? tiered.length : limits.tiered;
  let viewLimitChal = searchQuery ? challenges.length : limits.challenge;

  document.getElementById('col-tiered').innerHTML = tiered.slice(0, viewLimitTiered).map(ach => {
    let targetStr = ach.targetAmt.toLocaleString();
    let displayStr = ach.displayAmt.toLocaleString();
    let parsedDesc = ach.desc.replace(/%%value%%|%tieramount%|\?/gi, targetStr);
    ach.desc = parsedDesc;
    
    let progressText = ach.isCompleted ? `${targetStr} / ${targetStr}` : `${displayStr} / ${targetStr}`;
    let barClass = ach.isCompleted ? "ach-progress-fill completed-tier" : "ach-progress-fill";

    let notches = '';
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
      <div class="tier-progress-text">${progressText} (${ach.calcPct.toFixed(2)}%)</div>
    `;

    return generateCard(ach, true, progressBlock, notches);
  }).join('');

  document.getElementById('col-challenge').innerHTML = challenges.slice(0, viewLimitChal).map(ach => {
    ach.desc = ach.desc.replace(/%%value%%|%tieramount%|\?/gi, ach.mwTargetAmt ? ach.mwTargetAmt.toLocaleString() : "1");
    
    let progressBlock = '';
    if (ach.mwTargetAmt) {
      let displayStr = ach.mwCurrentAmt.toLocaleString();
      let targetStr = ach.mwTargetAmt.toLocaleString();
      let progressText = `${displayStr} / ${targetStr}`;
      let barClass = ach.isCompleted ? "ach-progress-fill completed-tier" : "ach-progress-fill";
      progressBlock = `
        <div class="ach-progress-container"><div class="${barClass}" style="width: ${ach.mwProgPct.toFixed(2)}%;"></div></div>
        <div class="tier-progress-text">${progressText} (${ach.mwProgPct.toFixed(2)}%)</div>
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

  document.getElementById('btn-more-tiered').style.display = (viewLimitTiered < tiered.length && !searchQuery) ? 'block' : 'none';
  document.getElementById('btn-more-chal').style.display = (viewLimitChal < challenges.length && !searchQuery) ? 'block' : 'none';
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

  // RGB to HSL
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
    // Maximise saturation and drop lightness to keep text readable
    s = Math.min(1, s * 1.1);
    lit = Math.min(0.4, lit * 0.8);
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(lit * 100)}%)`;
}

function initOrUpdateAnalyticsChart() {
  const ctx = document.getElementById('apHistoryChart');
  if (!ctx || !globalPlayerData) return;

  const colorPalette = ['#ff5100', '#00bfff', '#55ff55', '#ffd700', '#ff55ff', '#ff3366'];
  const allKnownDates = Object.keys(historicalArchiveData || {}).sort();

  let timeLabels = [];
  if (allKnownDates.length > 0) {
    timeLabels = [...allKnownDates];
    const lastDate = allKnownDates[allKnownDates.length - 1];
    const todayIso = new Date().toISOString().split('T')[0];
    if (lastDate !== todayIso && lastDate !== 'Current') {
      timeLabels.push('Current');
    }
  } else {
    timeLabels = ['Month Start', 'Current'];
  }

  function resolveTimelinePoints(uuid, fallbackCurrent, fallbackStart) {
    if (allKnownDates.length > 0) {
      return timeLabels.map(tLabel => {
        if (tLabel === 'Current') return fallbackCurrent;
        if (historicalArchiveData[tLabel]?.[uuid] !== undefined) {
          return historicalArchiveData[tLabel][uuid];
        }
        return localAPDataCache?.month_start_snapshot?.[uuid] ?? fallbackStart;
      });
    }
    return [fallbackStart, fallbackCurrent];
  }

  const currentPrimaryAp = globalPlayerData.achievementPoints || globalPlayerData.current_ap || 0;
  const startPrimaryAp = globalPlayerData.last_month_ap || (localAPDataCache?.month_start_snapshot?.[globalPlayerData.uuid]) || currentPrimaryAp;
  const primaryPoints = resolveTimelinePoints(globalPlayerData.uuid, currentPrimaryAp, startPrimaryAp);

  const datasets = [{
    label: globalPlayerData.username,
    data: primaryPoints,
    borderColor: colorPalette[0],
    backgroundColor: 'rgba(255, 81, 0, 0.12)',
    pointBackgroundColor: colorPalette[0],
    pointHoverBackgroundColor: colorPalette[0],
    pointBorderColor: colorPalette[0],
    pointHoverBorderColor: '#ffffff',
    tension: 0.2,
    fill: true,
    pointRadius: 5,
    pointHoverRadius: 7
  }];

  if (apChartInstance) {
    apChartInstance.data.labels = timeLabels;
    apChartInstance.data.datasets = datasets;
    apChartInstance.update();
  } else {
    apChartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels: timeLabels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            labels: { 
              color: '#e0e0e0', 
              font: { family: 'DM Sans', size: 12 },
              usePointStyle: true,
              pointStyle: 'line',
              boxWidth: 24,
              padding: 18
            } 
          }
        },
        scales: {
          x: { ticks: { color: '#888', font: { family: 'DM Sans' } }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#888', font: { family: 'DM Sans' } }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }
}

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
  
  const nameEl = document.getElementById('p-name');
  nameEl.textContent = data.username;
  nameEl.style.setProperty('color', getRankBaseColourHex(data.rank, data.monthlyRankColor), 'important');

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
    if (data.leaderboardRank === 1) rankPill.classList.add('rank-1');
    else if (data.leaderboardRank === 2) rankPill.classList.add('rank-2');
    else if (data.leaderboardRank === 3) rankPill.classList.add('rank-3');
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

  initOrUpdateAnalyticsChart();
  document.getElementById('cabinet-content').classList.remove('hidden');

  setTimeout(() => {
    startCabinetTour(false);
  }, 600);
}

async function initCabinet(explicitLookupId) {
  const urlParams = new URLSearchParams(window.location.search);
  const lookupId = explicitLookupId || urlParams.get('player') || urlParams.get('uuid');

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

    const apiUrl = `https://api.litstats.com/api/player?uuid=${encodeURIComponent(uuid)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) {
      throw new Error(`Failed to fetch player stats (${res.status})`);
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);

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

window.addEventListener('resize', () => {
  if (globalPlayerData) {
    populateFilters();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById('excludeComp')) document.getElementById('excludeComp').checked = isCompExcluded;
  if (document.getElementById('multiSelectToggle')) document.getElementById('multiSelectToggle').checked = isMultiSelect;
  if (document.getElementById('highestTierToggle')) document.getElementById('highestTierToggle').checked = isHighestTierOnly;
  if (document.getElementById('hideHistoryToggle')) document.getElementById('hideHistoryToggle').checked = isHistoryHidden;
  if (document.getElementById('hideMaxesToggle')) document.getElementById('hideMaxesToggle').checked = isMaxesHidden;
  if (document.getElementById('goldApToggle')) document.getElementById('goldApToggle').checked = isGoldApEnabled;

  if (isHistoryHidden) {
    document.getElementById('history-column-wrapper').style.display = 'none';
  }
  if (isMaxesHidden) {
    document.getElementById('maxed-column').style.display = 'none';
  }

  initCabinet();
});
