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

let showSecretTags = localStorage.getItem('litstats_showSecret') !== 'false';
let showBrokenTags = localStorage.getItem('litstats_showBroken') !== 'false';

let progressDisplayMode = localStorage.getItem('litstats_progressMode') || 'points'; 
let filterLabelMode = localStorage.getItem('litstats_filterLabelMode') || 'percent'; 

let isShowCompleted = localStorage.getItem('litstats_showCompleted') === 'true';
let isLegacyMode = false;
let activeMwClass = null;

const mwClassesList = ["Angel", "Arcanist", "Assassin", "Automaton", "Blaze", "Cow", "Creeper", "Dragon", "Dreadlord", "Enderman", "Golem", "Herobrine", "Hunter", "Moleman", "Phoenix", "Pigman", "Pirate", "Renegade", "Shaman", "Shark", "Sheep", "Skeleton", "Snowman", "Spider", "Squid", "Werewolf", "Zombie", "Legendary"];

const customSkinRewards = {
  "i am cow": "img/megawalls/cow/Cow Suit.png",
  "moo brawl": "img/megawalls/cow/Iron Cow.png",
  "greedy louis": "img/megawalls/cow/Skelly Moo.png",
  "team player": "img/megawalls/cow/Fungu Madness.png",
  "legendary cow": "img/megawalls/cow/One Serious Bull.png",
  "beyond the grave": "img/megawalls/cow/Parasite.png",
  "fine dining": "img/megawalls/cow/Sir Loin.png",
  "biological restoration": "img/megawalls/cow/Sacred Bull.png",
  "on point": "img/megawalls/hunter/Edge.png",
  "treasure hunter": "img/megawalls/hunter/Tucson.png",
  "yeehaw": "img/megawalls/hunter/Hippie Moon.png",
  "ba boom": "img/megawalls/hunter/Animal Tamer.png",
  "cake hunter": "img/megawalls/hunter/Cake Hunter.png",
  "legendary hunter": "img/megawalls/hunter/Kuba the Caveman.png",
  "one with nature": "img/megawalls/hunter/Annie.png",
  "target eliminated": "img/megawalls/hunter/Bounty.png",
  "hammerhead": "img/megawalls/shark/Shelly.png",
  "great white": "img/megawalls/shark/Treasure.png",
  "tiger shark": "img/megawalls/shark/Devourer.png",
  "bull shark": "img/megawalls/shark/Wata.png",
  "legendary shark": "img/megawalls/shark/Bblurgbl.png",
  "oceans explorer": "img/megawalls/shark/Cosmo.png",
  "oceans defender": "img/megawalls/shark/Chum.png",
  "potions of death": "img/megawalls/arcanist/Drufus.png",
  "hard as steel": "img/megawalls/arcanist/Steele.png",
  "to infinity": "img/megawalls/arcanist/Chester.png",
  "laser precision": "img/megawalls/arcanist/Byron Boy.png",
  "legendary arcanist": "img/megawalls/arcanist/Emperor.png",
  "abil spammer": "img/megawalls/arcanist/Archmage.png",
  "tripleshot": "img/megawalls/arcanist/Arcana.png",
  "maximum effort": "img/megawalls/dreadlord/Doomboy.png",
  "birds eye": "img/megawalls/dreadlord/Crowe.png",
  "rushlord": "img/megawalls/dreadlord/Rushlord.png",
  "breadlord": "img/megawalls/dreadlord/Breadlord.png",
  "legendary dreadlord": "img/megawalls/dreadlord/Sweets.png",
  "gathering talent indeed": "img/megawalls/dreadlord/Frostlord.png",
  "the chosen few": "img/megawalls/dreadlord/Conquest.png",
  "its all ogre now": "img/megawalls/golem/Ogre.png",
  "timber": "img/megawalls/golem/Bryce.png",
  "taking the heat": "img/megawalls/golem/Flint.png",
  "hammer down": "img/megawalls/golem/Victor.png",
  "legendary golem": "img/megawalls/golem/Grey.png",
  "judgement call": "img/megawalls/golem/Cooper.png",
  "iron hearted": "img/megawalls/golem/Iglu.png",
  "thunder": "img/megawalls/herobrine/Thunders.png",
  "not a golem": "img/megawalls/herobrine/Larry.png",
  "lucky sunny": "img/megawalls/herobrine/Sunny.png",
  "multi kill": "img/megawalls/herobrine/Boxer.png",
  "legendary herobrine": "img/megawalls/herobrine/Odin.png",
  "seasons greetings": "img/megawalls/herobrine/Santabrine.png",
  "world ender": "img/megawalls/herobrine/Jerry.png",
  "derpbrines revenge": "img/megawalls/herobrine/Derpbrine.png",
  "circle of trust": "img/megawalls/pigman/Super Pig.png",
  "blowing bubbles": "img/megawalls/pigman/King Pig.png",
  "collector": "img/megawalls/pigman/Kai.png",
  "masterpiece": "img/megawalls/pigman/Picasso.png",
  "legendary pigman": "img/megawalls/pigman/Bandit.png",
  "young thug": "img/megawalls/pigman/Soos.png",
  "tough skin": "img/megawalls/pigman/Goliath.png",
  "alotv1": "img/megawalls/zombie/Toon.png",
  "hug me": "img/megawalls/zombie/Jumbo.png",
  "gone vegan": "img/megawalls/zombie/Taco.png",
  "sleepytime": "img/megawalls/zombie/Yawn.png",
  "legendary zombie": "img/megawalls/zombie/Gorilla.png",
  "mr clutcherson": "img/megawalls/zombie/Furbie.png",
  "unstoppable force": "img/megawalls/zombie/King Dainn.png",
  "throwing hot coconuts": "img/megawalls/blaze/Mango.png",
  "max render distance": "img/megawalls/blaze/Proto.png",
  "blaze party": "img/megawalls/blaze/Scorch.png",
  "high on ores": "img/megawalls/blaze/Chaze.png",
  "legendary blaze": "img/megawalls/blaze/Ghaze.png",
  "light em up": "img/megawalls/blaze/Matcho.png",
  "blazecaller": "img/megawalls/blaze/Miquella.png",
  "speed run": "img/megawalls/enderman/Dash.png",
  "untouchable": "img/megawalls/enderman/Seeker.png",
  "surprise": "img/megawalls/enderman/Gamer.png",
  "sneak attack": "img/megawalls/enderman/Shadow.png",
  "legendary enderman": "img/megawalls/enderman/Hoops.png",
  "true teleporter": "img/megawalls/enderman/Inno.png",
  "end to end": "img/megawalls/enderman/Plexi.png",
  "whirlwind": "img/megawalls/shaman/Totem.png",
  "much dogs": "img/megawalls/shaman/Doggo.png",
  "stayin alive": "img/megawalls/shaman/Brian the Disco Bear.png",
  "revenge of the wolves": "img/megawalls/shaman/Wolf.png",
  "legendary shaman": "img/megawalls/shaman/Nikolaos.png",
  "souls bound": "img/megawalls/shaman/Fina.png",
  "call it a comeback": "img/megawalls/shaman/Avarion.png",
  "living on the edge": "img/megawalls/shaman/Dauntless.png",
  "you shall not pass": "img/megawalls/squid/Guardian.png",
  "trust me im a doctor": "img/megawalls/squid/Doctor Squish.png",
  "whirlpool": "img/megawalls/squid/K'Tulu.png",
  "i feel sick": "img/megawalls/squid/Grumps.png",
  "legendary squid": "img/megawalls/squid/Sea Warrior.png",
  "fiery tomb": "img/megawalls/squid/Lava Kraken.png",
  "everblind": "img/megawalls/squid/Glow Squid.png",
  "peacekreeper": "img/megawalls/creeper/Johnny.png",
  "ready set boom": "img/megawalls/creeper/Bomberdude.png",
  "mass destruction": "img/megawalls/creeper/Destructo.png",
  "remote detonation": "img/megawalls/creeper/Kreeft.png",
  "legendary creeper": "img/megawalls/creeper/Cricket.png",
  "collateral": "img/megawalls/creeper/Haze.png",
  "instaboom": "img/megawalls/creeper/Steampunk.png",
  "grave robber": "img/megawalls/pirate/Captain Bones.png",
  "fire in the hole": "img/megawalls/pirate/Jameson.png",
  "esc": "img/megawalls/pirate/Guy.png",
  "death from above": "img/megawalls/pirate/Parrot Frank.png",
  "legendary pirate": "img/megawalls/pirate/Fjodor.png",
  "lady luck": "img/megawalls/pirate/Killigrew.png",
  "burial at sea": "img/megawalls/pirate/Axe.png",
  "think twice": "img/megawalls/sheep/Pablo.png",
  "magical party": "img/megawalls/sheep/Mutton.png",
  "perfect disguise": "img/megawalls/sheep/Lord Lambchop.png",
  "woolly respite": "img/megawalls/sheep/Llama.png",
  "teamkill": "img/megawalls/sheep/Ramsay.png",
  "legendary sheep": "img/megawalls/sheep/Dolly.png",
  "moodsetter": "img/megawalls/skeleton/Jazz Hands.png",
  "bow down": "img/megawalls/skeleton/Space Armor.png",
  "marksman": "img/megawalls/skeleton/Trick.png",
  "skeletons best friend": "img/megawalls/skeleton/Spookster.png",
  "legendary skeleton": "img/megawalls/skeleton/Red Ted.png",
  "ranged training": "img/megawalls/skeleton/Symphony.png",
  "explosive ending": "img/megawalls/skeleton/dave.png",
  "skitterama": "img/megawalls/spider/Lethal.png",
  "ninja 7s": "img/megawalls/spider/Vinny.png",
  "geronimo": "img/megawalls/spider/Flutter.png",
  "feels bad": "img/megawalls/spider/Frog.png",
  "legendary spider": "img/megawalls/spider/Shade.png",
  "i dont feel so good": "img/megawalls/spider/spoderman.png",
  "one giant leap": "img/megawalls/spider/Earl.png",
  "dirty dog": "img/megawalls/werewolf/Crunch.png",
  "time to diet": "img/megawalls/werewolf/Bloo.png",
  "hunting season": "img/megawalls/werewolf/Duster.png",
  "time to feast": "img/megawalls/werewolf/Jake.png",
  "legendary werewolf": "img/megawalls/werewolf/Cruze.png",
  "howling moon": "img/megawalls/werewolf/Lupus.png",
  "vegetarian": "img/megawalls/werewolf/Savage.png",
  "the hand that feeds": "img/megawalls/angel/Athena.png",
  "rewriting fate": "img/megawalls/angel/Goddess.png",
  "guardian angel": "img/megawalls/angel/Chad.png",
  "unwavering": "img/megawalls/angel/Eyeless.png",
  "delaying the inevitable": "img/megawalls/angel/Puck.png",
  "legendary angel": "img/megawalls/angel/Justice.png",
  "dont blink": "img/megawalls/assassin/Hitguy.png",
  "alchemy 100": "img/megawalls/assassin/Torny.png",
  "thanks connor": "img/megawalls/assassin/Connor.png",
  "morra": "img/megawalls/assassin/Blu.png",
  "legendary assassin": "img/megawalls/assassin/Okamoto.png",
  "contract killer": "img/megawalls/assassin/Shady.png",
  "kingmaker": "img/megawalls/assassin/Baba Yaga.png",
  "short circuit": "img/megawalls/automaton/Atomic.png",
  "into the future": "img/megawalls/automaton/Fender.png",
  "terminated script": "img/megawalls/automaton/Vacuum.png",
  "failed experiment": "img/megawalls/automaton/Failed Experiment.png",
  "legendary automaton": "img/megawalls/automaton/Crank.png",
  "configuration": "img/megawalls/automaton/CCDA-3301.png",
  "current objective survive": "img/megawalls/automaton/Soldier.png",
  "gotcha": "img/megawalls/moleman/Truck.png",
  "speedy mineman": "img/megawalls/moleman/Mineman Tyler.png",
  "coming through": "img/megawalls/moleman/Jolly.png",
  "constructor": "img/megawalls/moleman/Brick.png",
  "legendary moleman": "img/megawalls/moleman/Graen.png",
  "nom nom": "img/megawalls/moleman/Capybara.png",
  "sixty feet under": "img/megawalls/moleman/Mole-rat.png",
  "heavy eater": "img/megawalls/moleman/Rat.png",
  "whats the big idea": "img/megawalls/phoenix/Sailor Sid.png",
  "nights rest": "img/megawalls/phoenix/Owl.png",
  "ashes to bashes": "img/megawalls/phoenix/Ember.png",
  "cruising flames": "img/megawalls/phoenix/Fringe.png",
  "legendary phoenix": "img/megawalls/phoenix/Falcon X.png",
  "reborn": "img/megawalls/phoenix/Fae.png",
  "simmer down": "img/megawalls/phoenix/Hotshot.png",
  "frightful flames": "img/megawalls/dragon/Frightful.png",
  "dragonborn": "img/megawalls/dragon/Jade.png",
  "unbridled riches": "img/megawalls/dragon/Greg.png",
  "ashes to ashes": "img/megawalls/dragon/Fury.png",
  "dragons eye": "img/megawalls/dragon/Hydragon.png",
  "legendary dragon": "img/megawalls/dragon/Pip.png",
  "born talented": "img/megawalls/renegade/Bedrock.png",
  "recycling": "img/megawalls/renegade/Traitor.png",
  "inventory management": "img/megawalls/renegade/Ara.png",
  "captain combo": "img/megawalls/renegade/Hood.png",
  "legendary renegade": "img/megawalls/renegade/Morde.png",
  "chased down": "img/megawalls/renegade/Deathskull.png",
  "crossfire": "img/megawalls/renegade/Renny.png",
  "chill sniper": "img/megawalls/snowman/Gus.png",
  "school cancelled": "img/megawalls/snowman/Frozen.png",
  "avalanche": "img/megawalls/snowman/Abominable.png",
  "frosty friendship": "img/megawalls/snowman/Ice Bug.png",
  "legendary snowman": "img/megawalls/snowman/Dobu.png",
  "snowball fight": "img/megawalls/snowman/Feathers.png",
  "grave digger": "img/megawalls/snowman/David.png"
};

const normalizedSkinRewards = {};
Object.entries(customSkinRewards).forEach(([key, path]) => {
  const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  const parts = path.split('/');
  const fileName = parts.pop();
  const folder = parts.join('/');
  
  const cleanName = fileName.replace('.png', '');
  const noSpaceFile = fileName.replace(/ /g, '');
  
  const safeFolder = folder.startsWith('/') ? folder : '/' + folder;
  
  normalizedSkinRewards[normKey] = {
    path: `${safeFolder}/${noSpaceFile}`,
    name: cleanName,
    mwClass: parts.length > 2 ? parts[2].toLowerCase() : null // extracts class from 'img/megawalls/cow/...'
  };
});

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
window.limits = { tiered: 48, challenge: 48, recent: 48 };
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
  "Hot Potato": { type: "Secret", desc: "Pass the hot potato after fishing it" },
  "Main Lobby: Keep Quiet": { type: "Secret", desc: "Talk to Albus, the librarian", tip: "Go to 143 66 -31 and sneak click the NPC three times" },
  "Main Lobby: Code Breaker": { type: "Secret", desc: "Enter the code into the vault", tip: "You must enter a 3 part code at the coordinates -33 16 90 and go inside. The first number is from the librarian after sneak them clicking 3 times. The second number is found by catching a secret fish and hovering over the text in chat, and the third is located at 208 37 -158. Put these in this same order, to open the vault!" },
  "Main Lobby: Crash Landed": { type: "Secret", tip: "Enter the SkyBlock portal at -158, 128, 115" },
  "Main Lobby: Hypixel Historian": { type: "Secret", tip: "Click on every bookshelf with green particles in the library to read them, each of them will be at eye level on the ground" },
  "Sneaky Snake": { type: "Secret", desc: "Score 50 points in the snake lobby minigame", tip: "The snake arcade machines are located behind the game NPCs, up the stairs" },
  "Dragon Wars: Voidseeker": { type: "Secret", desc: "Jump into the void", tip: "Climb up the mountain using your jump boost and wither blasts and jump off" },
  "Dropper: Well, Well, Well": { type: "Map", map: "Floating Island", desc: "Only on the Floating Island map, you must drop down small jumps at a time to not die, and click on the frog in the well, near the bottom of the map" },
  "Ender Spleef: No Powerhouse": { type: "Secret", desc: "Win without using any powerups" },
  "Hypixel Says: Rebel Movement": { type: "Secret", desc: "Jump off when you are told to stand still" },
  "Zombies: Technical Difficulties!": { type: "Secret", desc: "Interact with all of the computers on the prison map" },
  "Zombies: What Lies Beyond?": { type: "Secret", desc: "Find the Black Hole gun, found behind the cracked wall in the storage room", tip: "Place a turret on every single teleport pad and look for the message in chat. Then place a turret in front of the cracked wall in the storage room to access the Black Hole gun" },
  "Disasters: Titanfall": { type: "Secret", desc: "Kill a Giant during the Zombie Apocalypse", tip: "This is easier as Werewolf as you get a weapon, you can also use a Stone Sword from a powerup or kill it with lava" },
  "Disasters: Dragon Tamer": { type: "Secret", desc: "Hit a dragon with a snowball powerup to force it to change directions" },
  "Perfectceptionception": { type: "Secret", desc: "Complete every round first and with 100% accuracy in a single Speed Builders game" },
  "Configuration": { type: "Secret", desc: "Final kill 3 players from one team, 2 from another, and 1 from the third in a single game", tip: "This unlocks a skin for Automaton, though can be done on any class" },
  "We're Set": { type: "Map", map: "Gold Rush", desc: "Open the bank vault on the map Gold Rush", tip: "Don't mind the quality, but here's a video tutorial: https://www.youtube.com/watch?v=jSd1P0eiiy0" },
  "Dragon Slayer": { type: "Secret", desc: "Kill an Ender Dragon" },
  "That's... not the exit...": { type: "Secret", desc: "Help Ikrus in the Rift", tip: "It doesn't matter what dialogue options you pick" },
  "\"If you wish to defeat me...\"": { type: "Secret", desc: "Defeat Sun Gecko in the Rift" },
  "Zoop!": { type: "Secret", desc: "Pop a link of 10 Puffs in the Rift" },
  "The ultimate scheme": { type: "Secret", desc: "Secure the final Timecharm in the Rift" },
  "Tragedy reversed": { type: "Secret", desc: "Murder your past self in the Rift quest" },
  "Lily Mania": { type: "Secret", desc: "ngl idk this secret ap" },
  "Top of the Wizard food chain": { type: "Secret", desc: "Become Wizardman in the Rift quest" },
  "Finally over...": { type: "Secret", desc: "Murder Special Agent Amog in the Rift quest" },
  "The first to have ever done it": { type: "Secret", desc: "Return back from the breach" },
  "Genius": { type: "Secret", desc: "Obtain a Free Will from Ubik", tip: "Select the right number from 1 to 100 when talking to Ubik on the Rift's Mountaintop. It has often been 13-15" },
  "What the flip?": { type: "Secret", desc: "Flip the Iceberg in the Critter Safari", tip: "Tip the Iceberg at -68, 66, -43 by jumping on the edge around 20 times" },
  "The Miracle in a Sunbeam": { type: "Secret", desc: "Encounter a Rainbug", tip: "Ring all 7 bells in the Critter Safari. Coordinates (1) -4, 96, -42 (2) 47, 55, -7 (3) -30, 125, 59 (4) -90, 109, 16 (5) -50, 81, 0 (6) -96, 46, -57 (7) -68, 66, -43. Last one requires an Icebreaker" },
  "Hasta la vista!": { type: "Secret", desc: "Receive a postcard from your minion", tip: "Give a Free Will item to a minion in order to activate the chance of a minion leaving, lower tier minions have a higher chance to leave" },
  "[SkyBlock] Maximum Power": { type: "Secret", desc: "Defeat Sun Gecko with all 7 modifiers enabled" },
  "Too much joy": { type: "Secret", desc: "Sometimes too much happiness can kill you.", tip: "Wear the Sunflower Head and Right Click 20 people. Accept the message in chat so you die. https://youtu.be/TiQxrBK3Llw" },
  "Cleaning House": { type: "Secret", desc: "Break all cobwebs in the Critter Safari", tip: "Located in the Haunted House and the small shack next to it" },
  "Empty Flower Pot?": { type: "Secret", desc: "Place a flower in the Park's flower pot", tip: "You must place an Oxeye Daisy in the Park's flower pot, you will have to click for 5 minutes straight or longer and hear the sound increase in pitch, if it resets it means you must start over" },
  "I am Superior": { type: "Secret", desc: "Defeat a Superior Dragon", tip: "There is a 4% chance for a Superior Dragon to spawn once all 8 eyes are placed, you must get at least 1 hit on the Dragon to get the achievement" },
  "Sirius Business": { type: "Secret", desc: "Participate in the Dark Auction", tip: "Every hour at 0:55, 1:55... etc. an NPC called Sirius will spawn in the Wilderness at 91, 75, 176. Click on him within 35 seconds, you need a minimum of 400,000 but it is recommended to bring multiple million. Stay for the entire auction to get the achievement" },
  "Shrimp!?!": { type: "Secret", desc: "Obtain Shrimp the Traveler Fish", tip: "Find Shrimp by mining glowing blocks in the end, or from the Auction House. Drop it on the ground and pick it up to get the achievement" },
  "Royal Conversation": { type: "Secret", desc: "Listen to the full Royal Resident's dialogue in the Dwarven Mines", tip: "At the coordinates 63 204 200, there is an NPC who you have to talk to for over 30 minutes, he moves to 65 211 199, which you must then talk to for another 6 hours, while he counts down from 5000" },
  "Existential Revelations": { type: "Secret", desc: "Find the mushroom in the catacombs", tip: "Find the mushroom room in dungeons, then use a Superboom TNT to blow up the wall in that room. Ignore the NPC behind the wall, instead click one of the mushrooms in the group of 3 to get the achievement" },
  "Defeating Death": { type: "Secret", desc: "Kill a Deathmite in a dungeon", tip: "In the Ancient evil tomb room, use Superboom TNT on the Diorite blocks and kill the deathmite that has 1 billion HP. Another way is to die as mage and suffocate it using an Insta wall as a spectator. There is also a room with lava in the middle, you can use a Superboom TNT there to get it stuck to kill it" },
  "I knew it!": { type: "Secret", desc: "Wear the full Monster Hunter armor set", tip: "Wear the Skeleton Helmet, Guardian Chestplate, Creeper Pants, and the Spider Boots at the same time" },
  "Rebirth": { type: "Secret", desc: "Kill a fairy in the fairy room while dead", tip: "The fairy room is pink on your map, visit once you are dead and kill a fairy" },
  "The Cult of the Fallen Star": { type: "Secret", desc: "Participate in a Cult of the Fallen Star meeting", tip: "Visit Cliffside Veins in the Dwarven Mines at -45, 193, 45. To enter, players need to arrive between 0 AM and 6 AM in-game time on either the 7th, 14th, 21st or 28th day of each SkyBlock month. The entrance to the cult's cave is at -26, 198, 40. Attend a meeting to get the achievement" },
  "Nightmare": { type: "Secret", desc: "Complete Bednom's secret quest", tip: "Go to -31, 214, -90 in the Dwarven Mines, talk to Bednom on 3 different SkyBlock days. After the third day, go to the treasure at 3, 177, -69 and speak to him again for the achievement" },
  "The Ring": { type: "Secret", desc: "Drop an Eternal Flame Ring into the lava in the special room in the Crystal Hollows", tip: "Killing a fished up Flaming Worm, Lava Blaze, and Lava Pigman each have a chance to drop an Eternal Flame Ring, or you can buy one. Find the ring shaped room with a chest in the middle, and drop your ring in lava for the achievement" },
  "This is the Way": { type: "Secret", desc: "Find the Belly of the Beast", tip: "In the Crimson Isles, go to the coordinates -530 40 -890 and get eaten by the ghast mob" },
  "The Itsy Bitsy Spider": { type: "Secret", desc: "Feed a player to Aranya", tip: "Go to the cave in the Crimson Isles at the coordinates -335 -1003, bring someone else with no armor to walk up to it and get killed, only you will get the achievement" },
  "[SkyBlock] Geronimo!": { type: "Secret", desc: "Get launched into the air by the Blazing Volcano", tip: "Every 30 minutes the lava rises and the Blazing Volcano erupts in the Crimson Isles, stand at the top when the volcano errupts to get launched" },
  "Meal fit for a King": { type: "Secret", desc: "Put a Trophy Fish into the Melancholic Viking's furnace at the house in the Spruce Woods" },
  "Wasted Potential": { type: "Secret", desc: "Feed a Staff of the Volcano to a Cow", tip: "Fish up a Fire Eel with a 5% chance to drop one or buy one" },
  "What is this place...": { type: "Secret", desc: "Enter the secret room in The End", tip: "On the large outer spikes, enter the room at -659 36 -193" },
  "Jake's Mystery": { type: "Secret", desc: "Complete Beth's Quest", tip: "Accept Beth's 3rd garden offer, then she will tell you to visit 175 44 -470 on the Mushroom Island, click on the dirt to enter. After Beth's 4th garden visit, go back down the ladder and talk to Jake" },
  "End Credits": { type: "Secret", desc: "Face your demise with the Temporal Pillar in the Rift", tip: "Stand in front of and die to an Enderman in the Rift's main village" },
  "Responsible Pet Owner": { type: "Secret", desc: "Have your rabbit get squashed in the Half-Eaten Cave", tip: "In the cave by Marco's flower house in the Rift, explode some hay with your Horsezooka and let your rabbit die in the respawning hay" },
  "One Pound Slap": { type: "Secret", desc: "Hit a player off a cliff using the Slap Fish", tip: "Obtain the Slap Fish from the Pandora's Box craft" },
  "Wool Wars: Enderman": { type: "Secret", desc: "Go through 15 portals in one round" },
  "Capture the Wool: Magician": { type: "Secret", desc: "Capture 2 Wools in a single game" },
  "Sheep Wars: Shopping for Wool": { type: "Secret", desc: "Break every single magic wool in a round", tip: "Magic Wool spawns in the sky on a fixed timer, look in chat for when they spawn" },
  "That Time of Year": { type: "Secret", desc: "Find the dancing Spooky Scary Skeleton in the Main Lobby", tip: "Under the well in the farm, enter the room with a painting to find the Skeleton" },
  "New Years Celebrations": { type: "Secret", desc: "Watch the fireworks go off in the SkyBlock Hub or Main lobby", tip: "On New Years Eve, fireworks will display at the end of every hour 0:00, 1:00 etc." },
  "Prestige": { type: "Prestige", level: 15 },
  "Renown": { type: "Renown", renown: 2000 },
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
  "It's High Noon": { type: "Map", map: "Gold Rush" },
  "Cacti Cleared": { type: "Map", map: "Gold Rush" },
  "Storm Chaser": { type: "Map", map: "Cruise Ship" },
  "Game-ception": { type: "Map", map: "Cruise Ship" },
  "JAWS!": { type: "Map", map: "Aquarium" }
};

const MWSkinData = {
  "moobrawl": { class: "Cow", stat: "moo_brawl", max: 600 },
  "greedylouis": { class: "Cow", stat: "greedy_louis", max: 500 },
  "biologicalrestoration": { class: "Cow", stat: "bio_restore", max: 2500 },
  "beyondthegrave": { class: "Cow", stat: "beyond_the_grave", max: 15 },
  "treasurehunter": { class: "Hunter", stat: "treasure_hunter", max: 300 },
  "cakehunter": { class: "Hunter", stat: "cake_hunter", max: 150 },
  "onewithnature": { class: "Hunter", stat: "one_with_nature", max: 50 },
  "hammerhead": { class: "Shark", stat: "hammerhead", max: 100 },
  "oceansexplorer": { class: "Shark", stat: "explorer", max: 1000 },
  "oceansdefender": { class: "Shark", stat: "defender", max: 250 },
  "rushlord": { class: "Dreadlord", stat: "rushlord", max: 20000 },
  "breadlord": { class: "Dreadlord", stat: "breadlord", max: 617 },
  "gatheringtalentindeed": { class: "Dreadlord", stat: "gathering_ti", max: 500 },
  "timber": { class: "Golem", stat: "timber", max: 5000 },
  "ironhearted": { class: "Golem", stat: "iron_hearted", max: 1000 },
  "chestsfound": { class: "Herobrine", stat: "lucky_sunny", max: 1000 },
  "luckysunny": { class: "Herobrine", stat: "lucky_sunny", max: 1000 },
  "seasonsgreetings": { class: "Herobrine", stat: "seasons_greetings", max: 1000 },
  "sleepytime": { class: "Zombie", stat: "sleepytime", max: 50 },
  "mrclutcherson": { class: "Zombie", stat: "clutcherson", max: 100 },
  "unstoppableforce": { class: "Zombie", stat: "unstoppable_force", max: 25 },
  "potionsofdeath": { class: "Arcanist", stat: "potions_of_death", max: 8 },
  "hardassteel": { class: "Arcanist", stat: "hard_as_steel", max: 5000 },
  "abilspammer": { class: "Arcanist", stat: "abil_spammer", max: 1000 },
  "surprise": { class: "Enderman", stat: "surprise", max: 2500 },
  "sneakattack": { class: "Enderman", stat: "sneak_attack", max: 100 },
  "highonores": { class: "Blaze", stat: "high_on_ores", max: 2000 },
  "lightemup": { class: "Blaze", stat: "light_em_up", max: 10 },
  "blazecaller": { class: "Blaze", stat: "blazecaller", max: 500 },
  "marksman": { class: "Skeleton", stat: "marksman", max: 25 },
  "skeletonsbestfriend": { class: "Skeleton", stat: "skele_best_friend", max: 50 },
  "geronimo": { class: "Spider", stat: "geronimo", max: 25000 },
  "onegiantleap": { class: "Spider", stat: "one_giant_leap", max: 250 },
  "idontfeelsogood": { class: "Spider", stat: "idfsg", max: 600 },
  "massdestruction": { class: "Creeper", stat: "mass_destruction", max: 3000 },
  "instaboom": { class: "Creeper", stat: "instaboom", max: 20 },
  "dontblink": { class: "Assassin", stat: "dont_blink", max: 1200 },
  "alchemy100": { class: "Assassin", stat: "alchemy_100", max: 1000 },
  "dirtydog": { class: "Werewolf", stat: "dirty_dog", max: 15 },
  "timetodiet": { class: "Werewolf", stat: "time_to_diet", max: 750 },
  "huntingseason": { class: "Werewolf", stat: "hunting_season", max: 50000 },
  "howlingmoon": { class: "Werewolf", stat: "howling_moon", max: 1000 },
  "nightsrest": { class: "Phoenix", stat: "nights_rest", max: 1000 },
  "terminatedscript": { class: "Automaton", stat: "terminated_script", max: 3000 },
  "constructor": { class: "Moleman", stat: "constructor", max: 15000 },
  "heavyeater": { class: "Moleman", stat: "heavy_eater", max: 1000 },
  "nomnom": { class: "Moleman", stat: "nom_nom", max: 1000 },
  "recycling": { class: "Renegade", stat: "recycling", max: 3000 },
  "captaincombo": { class: "Renegade", stat: "captain_combo", max: 20000 },
  "chaseddown": { class: "Renegade", stat: "chased_down", max: 20 },
  "schoolcancelled": { class: "Snowman", stat: "school_cancelled", max: 7200 },
  "frostyfriendship": { class: "Snowman", stat: "frosty_friendship", max: 500 },
  "australianwinterseasonal": { class: "Snowman", stat: "australian_winter", max: 500 },
  "australianwinter": { class: "Snowman", stat: "australian_winter", max: 500 },
  "muchdogs": { class: "Shaman", stat: "much_dogs", max: 500 },
  "revengeofthewolves": { class: "Shaman", stat: "revenge_of_the_wolves", max: 5 },
  "livingontheedge": { class: "Shaman", stat: "spring_hero", max: 250 },
  "collector": { class: "Pigman", stat: "collector", max: 500 },
  "youngthug": { class: "Pigman", stat: "young_thug", max: 5 },
  "toughskin": { class: "Pigman", stat: "tough_skin", max: 500 },
  "graverobber": { class: "Pirate", stat: "grave_robber", max: 100 },
  "deathfromabove": { class: "Pirate", stat: "death_from_above", max: 12 },
  "burialatsea": { class: "Pirate", stat: "burial_at_sea", max: 5 },
  "youshallnotpass": { class: "Squid", stat: "you_shall_not_pass", max: 10 },
  "trustmeimadoctor": { class: "Squid", stat: "trust_me_im", max: 2500 },
  "everblind": { class: "Squid", stat: "everblind", max: 250 },
  "rewritingfate": { class: "Angel", stat: "rewriting_fate", max: 250 },
  "ashestoashes": { class: "Dragon", stat: "ashes_to_ashes", max: 5 },
  "perfectdisguise": { class: "Sheep", stat: "perfect_disguise", max: 100 },
  "woollyrespite": { class: "Sheep", stat: "woolly_respite", max: 250 }
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
    const isHidden = wrap.classList.toggle('hidden');
    sec.classList.toggle('collapsed-section');
    localStorage.setItem('litstats_collapse_' + wrapperId, isHidden);

    if (wrapperId === 'col-tiered-wrapper') {
      document.getElementById('col-challenge-section').classList.toggle('full-width', isHidden);
    } else if (wrapperId === 'col-challenge-wrapper') {
      document.getElementById('col-tiered-section').classList.toggle('full-width', isHidden);
    }
  }
};

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
  
  if (!activeGameFilters.has('Mega Walls')) {
    activeMwClass = null;
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

window.populateFilters = function() {
  const container = document.getElementById('gameFilterContainer');
  if (!globalPlayerData) return;
  
  let dataRef = isLegacyMode ? globalPlayerData.legacyMissing : globalPlayerData.missingAchievements;
  if (isShowCompleted) {
    dataRef = dataRef.concat(isLegacyMode ? globalPlayerData.legacyCompleted : globalPlayerData.completedAchievements);
  }

  const games = [...new Set(dataRef.map(a => a.game))].sort();
  const isMobile = window.innerWidth <= 800;
  
  let html = `<div class="filter-icon-grid">`;
  games.forEach(g => { 
    let cleanName = g.replace('Max ', '');
    let isDisabled = isCompExcluded && compGames.includes(cleanName) ? 'disabled' : '';
    let isActive = activeGameFilters.has(cleanName) ? 'active' : '';
    
    const gameTots = isLegacyMode ? globalPlayerData.legacyGameTotals?.[cleanName] : globalPlayerData.gameTotals?.[cleanName];
    let percent = gameTots && gameTots.possibleAchs > 0 ? (gameTots.unlockedAchs / gameTots.possibleAchs) * 100 : 0;
    let isMaxed = percent >= 100;
    
    let maxClass = isMaxed && isShowCompleted ? 'maxed-game-pill' : '';
    let color = percent >= 80 ? 'var(--tier-1)' : percent >= 40 ? 'var(--tier-2)' : 'var(--tier-4)';
    if(isMaxed && isShowCompleted) color = '#00e6ff'; 

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

window.setTierView = function(base64Id, tierNum) {
  window.activeTierView[base64Id] = parseInt(tierNum);
  renderDashboard();
};

function renderDashboard() {
  if (!globalPlayerData) return;

  const isBookmarkViewActive = viewMode === 'bookmarks';
  
  let dataRefMissing = (isLegacyMode ? globalPlayerData.legacyMissing : globalPlayerData.missingAchievements).map(a => ({...a, trulyCompleted: false}));
  let dataRefCompleted = (isLegacyMode ? globalPlayerData.legacyCompleted : globalPlayerData.completedAchievements).map(a => ({...a, trulyCompleted: true}));
  
  let allMissing = dataRefMissing;
  if (isShowCompleted) {
    allMissing = allMissing.concat(dataRefCompleted);
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
    if (activeGameFilters.size > 0) allMissing = allMissing.filter(a => activeGameFilters.has(a.game.replace('Max ', '')));
  }

  const mwClassFilterContainer = document.getElementById('mw-class-filter');
  if (activeGameFilters.size === 1 && activeGameFilters.has('Mega Walls') && !isBookmarkViewActive) {
    mwClassFilterContainer.classList.remove('hidden');
    mwClassFilterContainer.innerHTML = mwClassesList.map(cls => {
      const lowerCls = cls.toLowerCase();
      const iconPath = cls === 'Legendary' ? 'img/diamond.png' : `img/megawalls/${lowerCls}/${cls}.png`;
      return `<div class="mw-class-pill ${activeMwClass === cls ? 'active' : ''}" onclick="toggleMwClass('${cls}')">
        <img src="${iconPath}" onerror="this.style.display='none'">
        ${cls}
      </div>`;
    }).join('');
    
    if (activeMwClass) {
      allMissing = allMissing.filter(a => {
        let t = a.title.toLowerCase();
        
        if (activeMwClass === 'Legendary') {
          return t.includes('legendary');
        }

        let d = a.desc?.toLowerCase() || '';
        let classLow = activeMwClass.toLowerCase();
        
        // 1. Check title/desc
        if (t.includes(classLow) || d.includes(classLow)) return true;
        
        // 2. Check skin data progress mapping
        let skinData = MWSkinData[t.replace(/[^a-z0-9]/g, '')];
        if (skinData && skinData.class.toLowerCase() === classLow) return true;
        
        // 3. Check custom rewards folder path
        const cleanTitle = t.replace(/[^a-z0-9]/g, '');
        let customSkin = normalizedSkinRewards[cleanTitle];
        if (customSkin && customSkin.mwClass === classLow) return true;
        
        return false;
      });
    }
  } else {
    mwClassFilterContainer.classList.add('hidden');
    activeMwClass = null;
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
      if (tagData.desc) ach.desc = tagData.desc; 

      if (tagData.type) {
        if (!showSecretTags && tagData.type === 'Secret') return;
        if (!showBrokenTags && tagData.type === 'Broken') return;
        
        let skipTypeTag = tagData.type === 'Renown';

        if (!skipTypeTag) {
          let colour = tagData.type === 'Broken' ? 'var(--red)' : tagData.type === 'Map' ? 'var(--green)' : tagData.type === 'Secret' ? '#ff33ff' : 'var(--gold)';
          
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
      }
      
      if (tagData.renown) tagsHtml += ` <span class="sleek-tag" data-tag="renown" style="margin-left: 4px;">${tagData.renown} Renown</span>`;
      if (tagData.souls) tagsHtml += ` <span class="sleek-tag" style="--tag-color: #55ffff; margin-left: 4px;">${tagData.souls} Souls</span>`;
      
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
    
    let isChallenge = ach.isOneTime || (ach.gamePct !== undefined && ach.currentAmt === undefined && !ach.allTiers);

    let mwTargetAmt = null;
    let mwCurrentAmt = null;
    let mwProgPct = null;

    if (cleanGame === 'Mega Walls') {
      const t = ach.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const mwData = MWSkinData[t];
      if (mwData) {
        isChallenge = true; 
        mwCurrentAmt = globalPlayerData.megaWalls?.skins?.[mwData.class.toLowerCase()]?.[mwData.stat] || 0;
        mwTargetAmt = mwData.max;
        
        ach.mwCurrentAmt = mwCurrentAmt;
        ach.mwTargetAmt = mwTargetAmt;
        
        ach.mwProgPct = Math.min(100, (ach.mwCurrentAmt / ach.mwTargetAmt) * 100);
      }
    }

    if (isChallenge) {
      ach.calcPct = Number(ach.gamePercentUnlocked || ach.gamePct || 0);
      if(ach.mwTargetAmt !== undefined) {
         ach.isCompleted = ach.mwCurrentAmt >= ach.mwTargetAmt;
      } else {
         ach.isCompleted = ach.trulyCompleted;
      }
      challenges.push(ach);
    } else {
      if (!ach.allTiers) ach.allTiers = [{ tier: ach.tier || 1, amount: ach.amount || 1, reward: ach.reward || 0 }];

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
    const legacyClass = ach.isLegacy ? 'legacy-challenge-card' : '';
    
    let customRewardImg = '';
    
    const cleanTitle = ach.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const skinData = normalizedSkinRewards[cleanTitle];
    
    if (skinData) {
      const skinName = skinData.name;
      const safePath = encodeURI(skinData.path);
      customRewardImg = `<span class="custom-skin-badge" title="${skinName}"><img src="${safePath}" onerror="this.style.display='none'"> <span>${skinName}</span></span>`;
    }

    return `
      <div class="ach-card ${notchClass} ${historyClass} ${legacyClass}">
        ${!isTiered && !isHistory && !ach.isLegacy ? `<span class="ach-percent">${ach.calcPct.toFixed(2)}%</span>` : ''}
        
        <div class="ach-card-header">
          <img src="${getGameIconUrl(ach.game)}" class="todo-game-icon" onerror="this.style.display='none'">
          <span class="ach-game">${ach.game.replace('Max ', '')}</span>
        </div>
        
        <span class="ach-title">${ach.title} ${ach.tagsHtml || ''}</span>
        <span class="ach-desc">${ach.desc}</span>
        ${ach.tipHtml || ''}
        
        ${progressBlock}

        <div class="ach-card-footer">
          <span class="ach-reward"><img src="${rewardIconSrc}" alt="AP" style="width:14px; height:14px; object-fit:contain; flex-shrink: 0;"> <span style="white-space: nowrap; flex-shrink: 0;">${isTiered ? ach.activeReward : ach.reward} AP</span> ${customRewardImg}</span>
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
    else if (data.leaderboardRank <= 10) rankPill.classList.add('rank-top10');
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
    // DO NOT REMOVE THIS COMMENT: swap between litstats and local host for testing
    // const apiUrl = `https://www.litstats.com/api/player?uuid=${encodeURIComponent(uuid)}`;
    // const apiUrl = `http://localhost:3000/api/player?uuid=${encodeURIComponent(uuid)}`;
    
    const apiUrl = `https://www.litstats.com/api/player?uuid=${encodeURIComponent(uuid)}`;
    const res = await fetch(apiUrl);

    if (!res.ok) {
      throw new Error(`Failed to fetch player stats (${res.status})`);
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    try {
      const huntersRes = await fetch('ap_hunters_data.json');
      if (huntersRes.ok) {
        const huntersData = await huntersRes.json();
        
        let allPlayers = [];
        huntersData.country_leaderboard.forEach(c => allPlayers.push(...c.top_players));
        allPlayers.sort((a, b) => b.current_ap - a.current_ap);

        const hunterIndex = allPlayers.findIndex(h => h.uuid === data.uuid || h.username.toLowerCase() === data.username.toLowerCase());
        
        if (hunterIndex !== -1 && hunterIndex < 100) {
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

window.addEventListener('resize', () => {
  if (globalPlayerData) {
    populateFilters();
    renderDashboard();
  }
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
      
      if (id === 'col-tiered-wrapper') {
        document.getElementById('col-challenge-section')?.classList.add('full-width');
      } else if (id === 'col-challenge-wrapper') {
        document.getElementById('col-tiered-section')?.classList.add('full-width');
      }
    }
  });

  if (document.getElementById('excludeComp')) document.getElementById('excludeComp').checked = isCompExcluded;
  if (document.getElementById('multiSelectToggle')) document.getElementById('multiSelectToggle').checked = isMultiSelect;
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
