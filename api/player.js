let cachedTemplate = null;
let templateFetchTime = 0;

function getBedwarsLevel(exp) {
  if (!exp || exp <= 0) return 1;
  const XP_PER_PRESTIGE = 487000;
  const prestiges = Math.floor(exp / XP_PER_PRESTIGE);
  let remainder = exp % XP_PER_PRESTIGE;
  let level = prestiges * 100;

  if (remainder >= 500) { level += 1; remainder -= 500; }
  if (remainder >= 1000) { level += 1; remainder -= 1000; }
  if (remainder >= 2000) { level += 1; remainder -= 2000; }
  if (remainder >= 3500) { level += 1; remainder -= 3500; }

  level += Math.floor(remainder / 5000);
  return level;
}

function getPlayerRank(player) {
  if (player.prefix) return player.prefix.replace(/§./g, '');
  if (player.rank && player.rank !== 'NORMAL') return player.rank;
  if (player.monthlyPackageRank && player.monthlyPackageRank !== 'NONE') return 'MVP++';
  if (player.newPackageRank) {
    const ranks = { 'MVP_PLUS': 'MVP+', 'MVP': 'MVP', 'VIP_PLUS': 'VIP+', 'VIP': 'VIP' };
    return ranks[player.newPackageRank] || 'NON';
  }
  if (player.packageRank) {
    const ranks = { 'MVP_PLUS': 'MVP+', 'MVP': 'MVP', 'VIP_PLUS': 'VIP+', 'VIP': 'VIP' };
    return ranks[player.packageRank] || 'NON';
  }
  return 'NON';
}

function getBedwarsStar(activeStar) {
  switch(activeStar) {
    case 'star_hollow': return '✰';
    case 'star_nautical': return '✯';
    case 'star_four_pointed': return '✦';
    case 'star_pinwheel': return '✵';
    case 'star_black_open': return '✫';
    case 'star_black_outlined': return '✭';
    case 'star_four_clubs': return '✥';
    case 'star_white_outlined': return '⚝';
    case 'star_white_circled': return '✪';
    default: return null;
  }
}

function formatBedwarsLevel(level, scheme, activeStar, activeBracket, toggles) {
  let star = getBedwarsStar(activeStar);
  if (!star) {
    if (level >= 1100 && level < 2100) star = '✪';
    else if (level >= 2100 && level < 3100) star = '❀';
    else star = '✫';
  }

  let bL = '[', bR = ']';
  switch(activeBracket) {
    case 'prestige_bracket_parenthesis': bL = '('; bR = ')'; break;
    case 'prestige_bracket_curly_brace': bL = '{'; bR = '}'; break;
    case 'prestige_bracket_angled': bL = '<'; bR = '>'; break;
    case 'prestige_bracket_double_angle_quotation_mark': bL = '«'; bR = '»'; break;
  }

  const isBold = toggles?.toggle_bold_numbers ? '§l' : '';
  const isUnderline = toggles?.toggle_underlined_prestige ? '§n' : '';
  const isStrike = toggles?.toggle_strikethrough_brackets ? '§m' : '';

  const palettes = {
    prestige_scheme_stone: ['§7','§7','§7','§7','§7','§7','§7'],
    prestige_scheme_iron: ['§f','§f','§f','§f','§f','§f','§f'],
    prestige_scheme_gold: ['§6','§6','§6','§6','§6','§6','§6'],
    prestige_scheme_diamond: ['§b','§b','§b','§b','§b','§b','§b'],
    prestige_scheme_emerald: ['§2','§2','§2','§2','§2','§2','§2'],
    prestige_scheme_sapphire: ['§3','§3','§3','§3','§3','§3','§3'],
    prestige_scheme_ruby: ['§4','§4','§4','§4','§4','§4','§4'],
    prestige_scheme_crystal: ['§d','§d','§d','§d','§d','§d','§d'],
    prestige_scheme_opal: ['§9','§9','§9','§9','§9','§9','§9'],
    prestige_scheme_amethyst: ['§5','§5','§5','§5','§5','§5','§5'],
    prestige_scheme_rainbow: ['§c','§6','§e','§a','§b','§d','§5'],
    prestige_scheme_iron_prime: ['§7','§f','§f','§f','§f','§7','§7'],
    prestige_scheme_gold_prime: ['§7','§e','§e','§e','§e','§6','§7'],
    prestige_scheme_diamond_prime: ['§7','§b','§b','§b','§b','§3','§7'],
    prestige_scheme_emerald_prime: ['§7','§a','§a','§a','§a','§2','§7'],
    prestige_scheme_sapphire_prime: ['§7','§3','§3','§3','§3','§9','§7'],
    prestige_scheme_ruby_prime: ['§7','§c','§c','§c','§c','§4','§7'],
    prestige_scheme_crystal_prime: ['§7','§d','§d','§d','§d','§5','§7'],
    prestige_scheme_opal_prime: ['§7','§9','§9','§9','§9','§1','§7'],
    prestige_scheme_amethyst_prime: ['§7','§5','§5','§5','§5','§8','§7'],
    prestige_scheme_mirror: ['§8','§7','§f','§f','§7','§7','§8'],
    prestige_scheme_light: ['§f','§f','§e','§e','§6','§6','§6'],
    prestige_scheme_dawn: ['§6','§6','§f','§f','§b','§3','§3'],
    prestige_scheme_dusk: ['§5','§5','§d','§d','§6','§e','§e'],
    prestige_scheme_air: ['§b','§b','§f','§f','§7','§7','§8'],
    prestige_scheme_wind: ['§f','§f','§a','§a','§2','§2','§2'],
    prestige_scheme_nebula: ['§4','§4','§c','§c','§d','§d','§5'],
    prestige_scheme_thunder: ['§e','§e','§f','§f','§8','§8','§8'],
    prestige_scheme_earth: ['§a','§a','§2','§2','§6','§6','§e'],
    prestige_scheme_water: ['§b','§b','§3','§3','§9','§9','§1'],
    prestige_scheme_fire: ['§e','§e','§6','§6','§c','§c','§4'],
    prestige_scheme_sunrise: ['§9','§9','§3','§3','§6','§6','§e'],
    prestige_scheme_eclipse: ['§c','§4','§7','§7','§4','§c','§c'],
    prestige_scheme_gamma: ['§9','§9','§9','§d','§c','§c','§4'],
    prestige_scheme_majestic: ['§2','§a','§d','§d','§5','§5','§2'],
    prestige_scheme_andesine: ['§c','§c','§4','§4','§2','§a','§a'],
    prestige_scheme_marine: ['§a','§a','§a','§b','§9','§9','§1'],
    prestige_scheme_element: ['§4','§4','§c','§c','§b','§3','§3'],
    prestige_scheme_galaxy: ['§1','§1','§9','§5','§5','§d','§1'],
    prestige_scheme_atomic: ['§c','§c','§a','§a','§3','§9','§9'],
    prestige_scheme_sunset: ['§5','§5','§c','§c','§6','§6','§e'],
    prestige_scheme_time: ['§e','§e','§6','§c','§d','§d','§5'],
    prestige_scheme_winter: ['§1','§9','§3','§b','§f','§7','§7'],
    prestige_scheme_obsidian: ['§0','§5','§8','§8','§5','§5','§0'],
    prestige_scheme_spring: ['§2','§2','§a','§e','§6','§5','§d'],
    prestige_scheme_ice: ['§f','§f','§b','§b','§3','§3','§3'],
    prestige_scheme_summer: ['§3','§b','§e','§e','§6','§d','§5'],
    prestige_scheme_spinel: ['§f','§4','§c','§c','§9','§1','§9'],
    prestige_scheme_autumn: ['§5','§5','§c','§6','§e','§b','§3'],
    prestige_scheme_mystic: ['§2','§a','§f','§f','§a','§a','§2'],
    prestige_scheme_eternal: ['§4','§4','§5','§9','§9','§1','§0'],
    prestige_scheme_burnout: ['§4','§c','§c','§6','§e','§f','§4'],
    prestige_scheme_cooldown: ['§1','§9','§3','§b','§f','§e','§1'],
    prestige_scheme_obliteration: ['§5','§d','§e','§f','§e','§d','§5'],
    prestige_scheme_ender: ['§3','§a','§2','§8','§2','§a','§3'],
    prestige_scheme_brust: ['§2','§a','§e','§f','§b','§d','§5'],
    prestige_scheme_comical: ['§4','§c','§e','§f','§e','§c','§4'],
    prestige_scheme_lusterlost: ['§4','§6','§2','§3','§9','§5','§8'],
    prestige_scheme_maelstrom: ['§5','§c','§6','§f','§b','§3','§9'],
    prestige_scheme_time_undone: ['§7','§0','§8','§7','§f','§f','§7'],
    prestige_scheme_umbrella: ['§c','§f','§f','§f','§f','§c','§f'],
    prestige_scheme_luminous: ['§6','§e','§f','§f','§f','§b','§3'],
    prestige_scheme_tortilla: ['§e','§f','§e','§6','§6','§f','§e'],
    prestige_scheme_corn: ['§a','§e','§e','§e','§e','§a','§2'],
    prestige_scheme_bittersweet: ['§b','§b','§c','§c','§c','§a','§a'],
    prestige_scheme_sweetsour: ['§3','§3','§a','§a','§f','§a','§3'],
    prestige_scheme_pop: ['§9','§d','§d','§d','§d','§b','§9'],
    prestige_scheme_bubblegum: ['§5','§d','§d','§d','§d','§f','§5'],
    prestige_scheme_contrast: ['§0','§6','§6','§e','§e','§f','§f'],
    prestige_scheme_blended: ['§a','§a','§a','§a','§2','§2','§8'],
    prestige_scheme_allay: ['§3','§b','§b','§b','§b','§f','§3'],
    prestige_scheme_blaze: ['§4','§c','§6','§e','§c','§6','§e'],
    prestige_scheme_creeper: ['§2','§a','§f','§2','§a','§f','§8'],
    prestige_scheme_drowned: ['§2','§3','§3','§b','§b','§a','§2'],
    prestige_scheme_enderman: ['§8','§8','§8','§8','§8','§d','§8'],
    prestige_scheme_frog: ['§6','§6','§2','§2','§f','§f','§f'],
    prestige_scheme_ghast: ['§f','§f','§f','§7','§7','§c','§8'],
    prestige_scheme_hoglin: ['§d','§c','§c','§c','§c','§6','§d'],
    prestige_scheme_iron_golem: ['§8','§7','§f','§f','§f','§e','§8'],
    prestige_scheme_jerry: ['§6','§f','§2','§6','§2','§f','§6'],
    prestige_scheme_kringle: ['§2','§a','§a','§a','§c','§4','§2'],
    prestige_scheme_liquid: ['§8','§7','§f','§b','§3','§9','§1'],
    prestige_scheme_mint: ['§f','§f','§f','§f','§f','§a','§f'],
    prestige_scheme_neglected: ['§8','§8','§4','§4','§c','§c','§8'],
    prestige_scheme_onion: ['§f','§d','§d','§d','§a','§a','§f'],
    prestige_scheme_poser: ['§3','§6','§6','§6','§6','§e','§3'],
    prestige_scheme_quartz: ['§d','§f','§f','§f','§f','§e','§d'],
    prestige_scheme_rich: ['§8','§6','§6','§6','§6','§6','§8'],
    prestige_scheme_sanguine: ['§4','§4','§4','§c','§c','§f','§f'],
    prestige_scheme_titanic: ['§9','§b','§b','§b','§3','§3','§9'],
    prestige_scheme_unorthodox: ['§d','§d','§d','§d','§d','§5','§8'],
    prestige_scheme_volcanic: ['§0','§c','§6','§6','§c','§c','§4'],
    prestige_scheme_weeping_cherry: ['§2','§d','§d','§d','§d','§a','§2'],
    prestige_scheme_x_ray: ['§f','§8','§8','§8','§8','§f','§f'],
    prestige_scheme_yearn: ['§e','§6','§4','§8','§8','§8','§8'],
    prestige_scheme_zebra: ['§0','§0','§8','§8','§7','§7','§f'],
    prestige_scheme_caution: ['§e','§e','§e','§0','§0','§e','§0'],
    prestige_scheme_undescribable: ['§d','§d','§d','§e','§e','§b','§e'],
    prestige_scheme_forgotten: ['§0','§8','§8','§8','§8','§8','§0'],
    prestige_scheme_fuse: ['§8','§7','§f','§f','§f','§e','§f'],
    prestige_scheme_prestigious: ['§9','§b','§f','§f','§f','§f','§c','§4']
  };

  let cA = [];
  let mappedScheme = scheme;

  if (!mappedScheme || mappedScheme === 'prestige_scheme_default') {
    if (level < 100) mappedScheme = 'prestige_scheme_stone';
    else if (level < 200) mappedScheme = 'prestige_scheme_iron';
    else if (level < 300) mappedScheme = 'prestige_scheme_gold';
    else if (level < 400) mappedScheme = 'prestige_scheme_diamond';
    else if (level < 500) mappedScheme = 'prestige_scheme_emerald';
    else if (level < 600) mappedScheme = 'prestige_scheme_sapphire';
    else if (level < 700) mappedScheme = 'prestige_scheme_ruby';
    else if (level < 800) mappedScheme = 'prestige_scheme_crystal';
    else if (level < 900) mappedScheme = 'prestige_scheme_opal';
    else if (level < 1000) mappedScheme = 'prestige_scheme_amethyst';
    else if (level < 1100) mappedScheme = 'prestige_scheme_rainbow';
    else if (level < 1200) mappedScheme = 'prestige_scheme_iron_prime';
    else if (level < 1300) mappedScheme = 'prestige_scheme_gold_prime';
    else if (level < 1400) mappedScheme = 'prestige_scheme_diamond_prime';
    else if (level < 1500) mappedScheme = 'prestige_scheme_emerald_prime';
    else if (level < 1600) mappedScheme = 'prestige_scheme_sapphire_prime';
    else if (level < 1700) mappedScheme = 'prestige_scheme_ruby_prime';
    else if (level < 1800) mappedScheme = 'prestige_scheme_crystal_prime';
    else if (level < 1900) mappedScheme = 'prestige_scheme_amethyst_prime';
    else if (level < 2000) mappedScheme = 'prestige_scheme_mirror';
    else if (level < 2100) mappedScheme = 'prestige_scheme_light';
    else if (level < 2200) mappedScheme = 'prestige_scheme_dawn';
    else if (level < 2300) mappedScheme = 'prestige_scheme_dusk';
    else if (level < 2400) mappedScheme = 'prestige_scheme_air';
    else if (level < 2500) mappedScheme = 'prestige_scheme_wind';
    else if (level < 2600) mappedScheme = 'prestige_scheme_nebula';
    else if (level < 2700) mappedScheme = 'prestige_scheme_thunder';
    else if (level < 2800) mappedScheme = 'prestige_scheme_earth';
    else if (level < 2900) mappedScheme = 'prestige_scheme_water';
    else if (level < 3000) mappedScheme = 'prestige_scheme_fire';
    else if (level < 3100) mappedScheme = 'prestige_scheme_sunrise';
    else if (level < 3200) mappedScheme = 'prestige_scheme_eclipse';
    else if (level < 3300) mappedScheme = 'prestige_scheme_gamma';
    else if (level < 3400) mappedScheme = 'prestige_scheme_majestic';
    else if (level < 3500) mappedScheme = 'prestige_scheme_andesine';
    else if (level < 3600) mappedScheme = 'prestige_scheme_marine';
    else if (level < 3700) mappedScheme = 'prestige_scheme_element';
    else if (level < 3800) mappedScheme = 'prestige_scheme_galaxy';
    else if (level < 3900) mappedScheme = 'prestige_scheme_atomic';
    else if (level < 4000) mappedScheme = 'prestige_scheme_sunset';
    else if (level < 4100) mappedScheme = 'prestige_scheme_time';
    else if (level < 4200) mappedScheme = 'prestige_scheme_winter';
    else if (level < 4300) mappedScheme = 'prestige_scheme_obsidian';
    else if (level < 4400) mappedScheme = 'prestige_scheme_spring';
    else if (level < 4500) mappedScheme = 'prestige_scheme_ice';
    else if (level < 4600) mappedScheme = 'prestige_scheme_summer';
    else if (level < 4700) mappedScheme = 'prestige_scheme_spinel';
    else if (level < 4800) mappedScheme = 'prestige_scheme_autumn';
    else if (level < 4900) mappedScheme = 'prestige_scheme_mystic';
    else if (level < 5000) mappedScheme = 'prestige_scheme_eternal';
    else if (level < 5100) mappedScheme = 'prestige_scheme_burnout';
    else if (level < 5200) mappedScheme = 'prestige_scheme_cooldown';
    else if (level < 5300) mappedScheme = 'prestige_scheme_obliteration';
    else if (level < 5400) mappedScheme = 'prestige_scheme_ender';
    else if (level < 5500) mappedScheme = 'prestige_scheme_brust';
    else if (level < 5600) mappedScheme = 'prestige_scheme_comical';
    else if (level < 5700) mappedScheme = 'prestige_scheme_lusterlost';
    else if (level < 5800) mappedScheme = 'prestige_scheme_maelstrom';
    else if (level < 5900) mappedScheme = 'prestige_scheme_time_undone';
    else if (level < 6000) mappedScheme = 'prestige_scheme_umbrella';
    else if (level < 6100) mappedScheme = 'prestige_scheme_luminous';
    else if (level < 6200) mappedScheme = 'prestige_scheme_tortilla';
    else if (level < 6300) mappedScheme = 'prestige_scheme_corn';
    else if (level < 6400) mappedScheme = 'prestige_scheme_bittersweet';
    else if (level < 6500) mappedScheme = 'prestige_scheme_sweetsour';
    else if (level < 6600) mappedScheme = 'prestige_scheme_pop';
    else if (level < 6700) mappedScheme = 'prestige_scheme_bubblegum';
    else if (level < 6800) mappedScheme = 'prestige_scheme_contrast';
    else if (level < 6900) mappedScheme = 'prestige_scheme_blended';
    else if (level < 7000) mappedScheme = 'prestige_scheme_allay';
    else if (level < 7100) mappedScheme = 'prestige_scheme_blaze';
    else if (level < 7200) mappedScheme = 'prestige_scheme_creeper';
    else if (level < 7300) mappedScheme = 'prestige_scheme_drowned';
    else if (level < 7400) mappedScheme = 'prestige_scheme_enderman';
    else if (level < 7500) mappedScheme = 'prestige_scheme_frog';
    else if (level < 7600) mappedScheme = 'prestige_scheme_ghast';
    else if (level < 7700) mappedScheme = 'prestige_scheme_hoglin';
    else if (level < 7800) mappedScheme = 'prestige_scheme_iron_golem';
    else if (level < 7900) mappedScheme = 'prestige_scheme_jerry';
    else if (level < 8000) mappedScheme = 'prestige_scheme_kringle';
    else if (level < 8100) mappedScheme = 'prestige_scheme_liquid';
    else if (level < 8200) mappedScheme = 'prestige_scheme_mint';
    else if (level < 8300) mappedScheme = 'prestige_scheme_neglected';
    else if (level < 8400) mappedScheme = 'prestige_scheme_onion';
    else if (level < 8500) mappedScheme = 'prestige_scheme_poser';
    else if (level < 8600) mappedScheme = 'prestige_scheme_quartz';
    else if (level < 8700) mappedScheme = 'prestige_scheme_rich';
    else if (level < 8800) mappedScheme = 'prestige_scheme_sanguine';
    else if (level < 8900) mappedScheme = 'prestige_scheme_titanic';
    else if (level < 9000) mappedScheme = 'prestige_scheme_unorthodox';
    else if (level < 9100) mappedScheme = 'prestige_scheme_volcanic';
    else if (level < 9200) mappedScheme = 'prestige_scheme_weeping_cherry';
    else if (level < 9300) mappedScheme = 'prestige_scheme_x_ray';
    else if (level < 9400) mappedScheme = 'prestige_scheme_yearn';
    else if (level < 9500) mappedScheme = 'prestige_scheme_zebra';
    else if (level < 9600) mappedScheme = 'prestige_scheme_caution';
    else if (level < 9700) mappedScheme = 'prestige_scheme_undescribable';
    else if (level < 9800) mappedScheme = 'prestige_scheme_forgotten';
    else if (level < 9900) mappedScheme = 'prestige_scheme_fuse';
    else mappedScheme = 'prestige_scheme_prestigious';
  }

  cA = palettes[mappedScheme] || palettes['prestige_scheme_stone'];
  const rawStr = level.toString();
  const chars = [bL, ...rawStr.split(''), star, bR];
  
  let res = '';
  for (let i = 0; i < chars.length; i++) {
    const colorIndex = Math.round(i * ((cA.length - 1) / (chars.length - 1)));
    const color = cA[colorIndex];
    
    if (i === 0 || i === chars.length - 1) {
      res += `${color}${isStrike}${chars[i]}`;
    } else {
      res += `${color}${isUnderline}${isBold}${chars[i]}`;
    }
  }
  res += '§r';
  return res;
}

async function safeFetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("API returned invalid JSON");
  }
}

module.exports = async (req, res) => {
  const allowedOrigins = ['https://www.litstats.com', 'https://litstats.com', 'http://localhost:3000', 'http://127.0.0.1:3000'];
  const requestOrigin = req.headers.origin || req.headers.referer || '';

  const isAllowed = allowedOrigins.some(origin => requestOrigin.startsWith(origin));
  const corsOrigin = isAllowed ? requestOrigin : '*';

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Litstats-Auth');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const secureToken = req.headers['x-litstats-auth'];
  const expectedToken = process.env.CLOUDFLARE_AUTH_TOKEN;
  const isLocalDev = !process.env.VERCEL_ENV || process.env.NODE_ENV === 'development';

  if (!isLocalDev && expectedToken) {
    if (secureToken && secureToken !== expectedToken) {
      return res.status(403).json({ error: "Access Denied: Invalid Auth Token" });
    }
    if (requestOrigin && !isAllowed) {
      return res.status(403).json({ error: "Access Denied: Direct browser origin blocked." });
    }
  }

  const { uuid, name } = req.query;
  let targetUuid = uuid;

  if (name && !uuid) {
    try {
      const mojangRes = await fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`);
      if (!mojangRes.ok) return res.status(404).json({ error: "Player not found on Mojang" });
      const mojangData = await mojangRes.json();
      targetUuid = mojangData.id;
    } catch (e) {
      return res.status(500).json({ error: "Mojang API error" });
    }
  }

  if (!targetUuid) return res.status(400).json({ error: "Missing UUID or Name" });

  const API_KEY = process.env.HYPIXEL_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "Server missing API Key" });

  try {
    if (!cachedTemplate || Date.now() - templateFetchTime > 3600000) {
      try {
        const tData = await safeFetchJSON('https://api.hypixel.net/v2/resources/achievements');
        if (tData && tData.success) {
          cachedTemplate = tData.achievements;
          templateFetchTime = Date.now();
        }
      } catch (e) {
        console.warn("Failed to fetch achievements template");
      }
    }

    const pData = await safeFetchJSON(`https://api.hypixel.net/v2/player?uuid=${targetUuid}`, { headers: { 'API-Key': API_KEY } });
    
    if (pData.rateLimited) return res.status(429).json({ error: "Hypixel API Rate Limit. Try again shortly." });
    if (!pData.success) return res.status(400).json({ error: pData.cause || "Hypixel API Error" });
    if (!pData.player) return res.status(404).json({ error: "Player not found on Hypixel" });

    const profile = pData.player;
    const rawOneTime = profile.achievementsOneTime || [];
    const cleanOneTime = rawOneTime.filter(item => typeof item === 'string');
    const tieredPlayer = profile.achievements || {};

    const swStats = profile.stats?.SkyWars || {};
    const swPackages = swStats.packages || [];
    const vanityPackages = profile.vanityMeta?.packages || [];
    const allPackages = Array.from(new Set([...swPackages, ...vanityPackages]));
    let cleanLevelFormatted = (swStats.levelFormattedWithBrackets || swStats.levelFormatted || '').replace(/§k/gi, '').replace(/&k/gi, '');

    const bwStats = profile.stats?.Bedwars || profile.stats?.bedwars || {};
    const bwExp = bwStats.Experience || bwStats.experience || 0;
    const bwLevel = getBedwarsLevel(bwExp);
    
    const bwSlumber = bwStats.slumber || {};
    const bwDreamfeast = Object.assign({}, bwStats.dreamfeast || {}, bwSlumber.dreamfeast || {});
    const bwBoon = Object.assign({}, bwStats.boon || {}, bwSlumber.boon || {});
    const bwToggles = Object.assign({}, bwDreamfeast.toggles || {}, bwStats.toggles || {});

    const activeScheme = bwStats.active_prestige_scheme || null;
    const activeStar = bwStats.active_star || null;
    const activeBracket = bwStats.active_prestige_bracket || null;
    const finalDeaths = bwStats.final_deaths_bedwars || bwStats.final_deaths || 0;
    const finalKills = bwStats.final_kills_bedwars || bwStats.final_kills || 0;
    const fkdr = finalDeaths > 0 ? (finalKills / finalDeaths).toFixed(2) : finalKills.toFixed(2);

    const mwStats = profile.stats?.Walls3 || {};

    const responseData = {
      username: profile.displayname || "Unknown",
      uuid: profile.uuid,
      rank: getPlayerRank(profile),
      rankPlusColor: profile.rankPlusColor || 'RED',
      monthlyRankColor: profile.monthlyRankColor || 'GOLD',
      
      achievementPoints: profile.achievementPoints || 0,
      questsCompleted: 0, 
      maxGames: [],
      topQuests: [],
      gamePercentages: {},
      missingAchievements: [],
      recentAchievements: [],
      
      gameTotals: {},
      globalTotals: { possibleAP: 0, possibleAchs: 0, unlockedAP: 0, unlockedAchs: 0 },

      bedwars: {
        coins: bwStats.coins || 0,
        wins: bwStats.wins_bedwars || bwStats.wins || 0,
        final_kills: finalKills,
        fkdr: fkdr,
        kills: bwStats.kills_bedwars || bwStats.kills || 0,
        beds_broken: bwStats.beds_broken_bedwars || bwStats.beds_broken || 0,
        experience: bwExp,
        level: bwLevel,
        levelFormatted: formatBedwarsLevel(bwLevel, activeScheme, activeStar, activeBracket, bwToggles),
        boon: bwBoon,
        slumber: bwSlumber,
        dreamfeast: bwDreamfeast,
        toggles: bwToggles,
        packages: bwStats.packages || []
      },

      murderMystery: {
        coins: profile.stats?.MurderMystery?.coins || 0,
        wins: profile.stats?.MurderMystery?.wins || 0,
        kills: profile.stats?.MurderMystery?.kills || 0,
        deaths: profile.stats?.MurderMystery?.deaths || 0,
        games_played: profile.stats?.MurderMystery?.games || 0,
        descent: profile.stats?.MurderMystery?.descent || {},
        challenges: profile.stats?.MurderMystery?.challenges || {}
      },

      megaWalls: {
        skins: {
          cow: {
            moo_brawl: mwStats.cow_bucket_barriers_broken || 0,
            greedy_louis: mwStats.cow_ultra_pasteurized_drank || 0,
            bio_restore: mwStats.cow_players_healed || 0,
            beyond_the_grave: (mwStats.final_kills_after_final_killed || 0) + (mwStats.final_assists_after_final_killed || 0)
          },
          hunter: {
            treasure_hunter: mwStats.hunter_g_activations || 0,
            cake_hunter: mwStats.cakes_found || 0,
            one_with_nature: (mwStats.hunter_force_of_nature_final_kills || 0) + (mwStats.hunter_force_of_nature_final_assists || 0)
          },
          shark: {
            hammerhead: mwStats.shark_water_kills || 0,
            explorer: mwStats.shark_g_activations || 0,
            defender: mwStats.shark_defender_kills || 0
          },
          dreadlord: {
            rushlord: mwStats.dreadlord_wither_damage || 0,
            breadlord: mwStats.dreadlord_bread_crafted || 0,
            gathering_ti: mwStats.dreadlord_dark_matter_armor || 0
          },
          golem: {
            timber: mwStats.golem_wood_chopped || 0,
            iron_hearted: mwStats.golem_iron_heart_absorption || 0
          },
          herobrine: {
            lucky_sunny: mwStats.herobrine_treasures_found || 0,
            seasons_greetings: mwStats.herobrine_iron_armor_gifted_december || 0
          },
          zombie: {
            sleepytime: mwStats.zombie_beds_crafted || 0,
            clutcherson: mwStats.zombie_a_healed_low_teammates || 0,
            unstoppable_force: mwStats.zombie_berserked_kills || 0
          },
          arcanist: {
            potions_of_death: mwStats.arcanist_c_total_final_kills || 0,
            hard_as_steel: mwStats.arcanist_a_blocks_broken || 0,
            abil_spammer: mwStats.arcanist_a_activations || 0
          },
          enderman: {
            surprise: mwStats.enderman_activations || 0,
            sneak_attack: (mwStats.enderman_final_kills_melee_behind || 0) + (mwStats.enderman_final_assists_melee_behind || 0)
          },
          blaze: {
            high_on_ores: mwStats.blaze_amount_healed || 0,
            light_em_up: mwStats.blaze_on_fire_final_kills || 0,
            blazecaller: mwStats.blaze_blazes_spawned || 0
          },
          skeleton: {
            marksman: mwStats.skeleton_final_kills_ranged_30 || 0,
            skele_best_friend: mwStats.skeleton_diamond_ore_broken || 0
          },
          spider: {
            geronimo: mwStats.spider_meters_fallen || 0,
            one_giant_leap: mwStats.spider_a_kills || 0,
            idfsg: mwStats.spider_venom_strike_poison_damage || 0
          },
          creeper: {
            mass_destruction: mwStats.creeper_a_blocks_broken || 0,
            instaboom: mwStats.creeper_primed_tnt_kills || 0
          },
          assassin: {
            dont_blink: mwStats.assassin_enemies_hit || 0,
            alchemy_100: mwStats.assassin_master_alechmy_hearts || 0
          },
          werewolf: {
            dirty_dog: mwStats.werewolf_final_kills_below_10_hp || 0,
            time_to_diet: mwStats.werewolf_steaks_eaten || 0,
            hunting_season: mwStats.werewolf_meters_walked_speed || 0,
            howling_moon: mwStats.werewolf_a_enemies_hit_standard || 0
          },
          phoenix: {
            nights_rest: mwStats.phoenix_amount_healed || 0
          },
          automaton: {
            terminated_script: mwStats.automaton_energy_syphoned || 0
          },
          moleman: {
            constructor: mwStats.moleman_blocks_placed_preparation || 0,
            heavy_eater: mwStats.moleman_c_junk_items_eaten || 0,
            nom_nom: mwStats.moleman_c_activations || 0
          },
          renegade: {
            recycling: mwStats.renegade_arrows_from_rend || 0,
            captain_combo: mwStats.renegade_energy_from_grappling_hook || 0,
            chased_down: mwStats.renegade_final_kills_after_grappling_hook || 0
          },
          snowman: {
            school_cancelled: mwStats.snowman_blizzard_seconds_slow || 0,
            frosty_friendship: mwStats.snowman_snowmen_built || 0,
            australian_winter: mwStats.snowman_snowmen_players_hit || 0
          },
          shaman: {
            much_dogs: mwStats.shaman_c_activations || 0,
            revenge_of_the_wolves: mwStats.shaman_c_total_final_kills || 0,
            spring_hero: mwStats.shaman_heroism_triggers_in_dm || 0
          },
          pigman: {
            collector: mwStats.pigman_g_activations || 0,
            young_thug: mwStats.pigman_enduranced_final_kills || 0,
            tough_skin: mwStats.pigman_resistance_time_seconds || 0
          },
          pirate: {
            grave_robber: mwStats.pirate_g_activations || 0,
            death_from_above: mwStats.pirate_b_total_final_kills || 0,
            burial_at_sea: mwStats.pirate_final_water_kills || 0
          },
          squid: {
            you_shall_not_pass: (mwStats.squid_defender_final_kills || 0) + (mwStats.squid_defender_final_assists || 0),
            trust_me_im: mwStats.squid_a_amount_healed || 0,
            everblind: mwStats.squid_inner_ink_blinds || 0
          },
          angel: {
            rewriting_fate: mwStats.angel_divine_interventions || 0
          },
          dragon: {
            ashes_to_ashes: mwStats.dragon_final_kills_with_fire || 0
          },
          sheep: {
            perfect_disguise: mwStats.sheep_perfect_disguises || 0,
            woolly_respite: mwStats.sheep_amount_healed || 0
          }
        }
      },

      angelsDescent: {
        opals: swStats.opals !== undefined ? swStats.opals : 0,
        coins: swStats.coins || 0,
        souls: swStats.souls || 0,
        tokens: swStats.cosmetic_tokens || 0,
        heads: swStats.heads || 0,
        wins: swStats.wins || 0,
        kills: swStats.kills || 0,
        assists: swStats.assists || 0,
        kdr: swStats.deaths > 0 ? (swStats.kills / swStats.deaths).toFixed(2) : (swStats.kills || 0).toFixed(2),
        wlr: swStats.losses > 0 ? (swStats.wins / swStats.losses).toFixed(2) : (swStats.wins || 0).toFixed(2),
        timePlayed: swStats.time_played || 0,
        potionsBrewed: tieredPlayer.skywars_tonic_taker || 0,
        levelFormatted: cleanLevelFormatted,
        corruptionChance: (swStats.angel_of_death_level || 0) + (allPackages.includes('favor_of_the_angel') ? 1 : 0) + (swStats.angels_offering || 0),
        packages: allPackages,
        stats: swStats
      }
    };

    if (profile.quests) {
      const questTotals = {};
      const qMap = {
        "arcade": "Arcade", "arena": "Arena Brawl", "bedwars": "Bed Wars", "blitz": "Blitz SG",
        "buildbattle": "Build Battle", "copsandcrims": "Cops and Crims", "duels": "Duels",
        "gingerbread": "TKR", "murder_mystery": "Murder Mystery", "paintball": "Paintball",
        "pit": "The Pit", "quake": "Quakecraft", "skyblock": "SkyBlock", "skywars": "SkyWars",
        "smash": "Smash Heroes", "speed_uhc": "Speed UHC", "tntgames": "TNT Games",
        "truecombat": "Crazy Walls", "uhc": "UHC", "vampirez": "VampireZ", "walls3": "Mega Walls",
        "walls": "Walls", "warlords": "Warlords", "woolgames": "Wool Games"
      };

      for (const [qId, qData] of Object.entries(profile.quests)) {
        if (qData.completions && Array.isArray(qData.completions)) {
          const count = qData.completions.length;
          responseData.questsCompleted += count;
          
          let gName = "Other";
          for (const pfx in qMap) {
            if (qId.startsWith(pfx)) { gName = qMap[pfx]; break; }
          }
          if (!questTotals[gName]) questTotals[gName] = 0;
          questTotals[gName] += count;
        }
      }
      
      responseData.topQuests = Object.entries(questTotals)
        .filter(([game, count]) => game !== "Other")
        .map(([game, count]) => ({ game, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    }

    const gameMappings = [
      { internal: "uhc", name: "UHC", badge: "Max UHC" },
      { internal: "pit", name: "Pit", badge: "Max Pit" },
      { internal: "walls3", name: "Mega Walls", badge: "Max Mega Walls" },
      { internal: "skywars", name: "SkyWars", badge: "Max SkyWars" },
      { internal: "blitz", name: "Blitz", badge: "Max Blitz" },
      { internal: "arena", name: "Arena Brawl", badge: "Max Arena Brawl" },
      { internal: "supersmash", name: "Smash Heroes", badge: "Max Smash Heroes" },
      { internal: "paintball", name: "Paintball", badge: "Max Paintball" },
      { internal: "copsandcrims", name: "Cops and Crims", badge: "Max Cops and Crims" },
      { internal: "quake", name: "Quake", badge: "Max Quake" },
      { internal: "skyblock", name: "SkyBlock", badge: "Max SkyBlock" },
      { internal: "speeduhc", name: "Speed UHC", badge: "Max Speed UHC" },
      { internal: "warlords", name: "Warlords", badge: "Max Warlords" },
      { internal: "walls", name: "Walls", badge: "Max Walls" },
      { internal: "tntgames", name: "TNT Games", badge: "Max TNT Games" },
      { internal: "arcade", name: "Arcade", badge: "Max Arcade" },
      { internal: "murdermystery", name: "Murder Mystery", badge: "Max Murder Mystery" },
      { internal: "vampirez", name: "VampireZ", badge: "Max VampireZ" },
      { internal: "bedwars", name: "Bed Wars", badge: "Max Bed Wars" },
      { internal: "gingerbread", name: "TKR", badge: "Max TKR" },
      { internal: "woolgames", name: "Wool Games", badge: "Max Wool Games" },
      { internal: "duels", name: "Duels", badge: "Max Duels" },
      { internal: "buildbattle", name: "Build Battle", badge: "Max Build Battle" },
      { internal: "general", name: "General", badge: "Max General" },
      { internal: "housing", name: "Housing", badge: "Max Housing" },
      { internal: "summer", name: "Summer", badge: "Max Summer", seasonal: true },
      { internal: "christmas2017", name: "Christmas", badge: "Max Christmas", seasonal: true },
      { internal: "easter", name: "Easter", badge: "Max Easter", seasonal: true },
      { internal: "halloween2017", name: "Halloween", badge: "Max Halloween", seasonal: true },
      { internal: "truecombat", name: "Crazy Walls", badge: "Max Crazy Walls", legacy: true },
      { internal: "skyclash", name: "SkyClash", badge: "Max SkyClash", legacy: true }
    ];

    if (cachedTemplate) {
      for (const game of gameMappings) {
        const tGame = cachedTemplate[game.internal];
        if (!tGame) continue;

        let totalPossible = 0;
        let playerUnlocked = 0;
        let isMaxed = true;
        
        responseData.gameTotals[game.name] = { possibleAP: 0, possibleAchs: 0, unlockedAP: 0, unlockedAchs: 0 };

        if (tGame.one_time) {
          for (const [key, ach] of Object.entries(tGame.one_time)) {
            if (ach.legacy) continue; 
            totalPossible++;
            responseData.gameTotals[game.name].possibleAchs++;
            responseData.gameTotals[game.name].possibleAP += ach.points;
            responseData.globalTotals.possibleAchs++;
            responseData.globalTotals.possibleAP += ach.points;
            
            const fullId = `${game.internal}_${key.toLowerCase()}`;
            if (cleanOneTime.includes(fullId)) {
              playerUnlocked++;
              responseData.gameTotals[game.name].unlockedAchs++;
              responseData.gameTotals[game.name].unlockedAP += ach.points;
              responseData.globalTotals.unlockedAchs++;
              responseData.globalTotals.unlockedAP += ach.points;
            } else {
              isMaxed = false;
              responseData.missingAchievements.push({
                game: game.name, 
                title: ach.name, 
                desc: ach.description, 
                reward: ach.points,
                isOneTime: true,
                globalPct: ach.gamePercentUnlocked 
              });
            }
          }
        }

        if (tGame.tiered) {
          for (const [key, ach] of Object.entries(tGame.tiered)) {
            if (ach.legacy) continue; 
            const fullId = `${game.internal}_${key.toLowerCase()}`;
            const playerAmt = tieredPlayer[fullId] || 0;

            let allTiers = ach.tiers.map((t, index) => ({ tier: t.tier || index + 1, amount: t.amount, reward: t.points }));
            let isAchMaxed = true;

            for (const tier of ach.tiers) {
              totalPossible++;
              responseData.gameTotals[game.name].possibleAchs++;
              responseData.gameTotals[game.name].possibleAP += tier.points;
              responseData.globalTotals.possibleAchs++;
              responseData.globalTotals.possibleAP += tier.points;
              
              if (playerAmt >= tier.amount) {
                playerUnlocked++;
                responseData.gameTotals[game.name].unlockedAchs++;
                responseData.gameTotals[game.name].unlockedAP += tier.points;
                responseData.globalTotals.unlockedAchs++;
                responseData.globalTotals.unlockedAP += tier.points;
              } else {
                isMaxed = false;
                isAchMaxed = false;
              }
            }

            if (!isAchMaxed) {
                responseData.missingAchievements.push({
                    game: game.name, 
                    title: ach.name, 
                    desc: ach.description, 
                    allTiers: allTiers,
                    currentAmt: playerAmt
                });
            }
          }
        }

        if (isMaxed && totalPossible > 0) {
          responseData.maxGames.push(game.badge);
        } else if (totalPossible > 0) {
          responseData.gamePercentages[game.badge] = ((playerUnlocked / totalPossible) * 100).toFixed(1);
        }
      }
    }

    responseData.missingAchievements.sort((a, b) => a.reward - b.reward);

    const achDictionary = {};
    if (cachedTemplate) {
      for (const [categoryId, tGame] of Object.entries(cachedTemplate)) {
        const gameMap = gameMappings.find(g => g.internal === categoryId);
        const gameName = gameMap ? gameMap.name : categoryId;
        
        if (tGame.one_time) {
          for (const [key, ach] of Object.entries(tGame.one_time)) {
            achDictionary[`${categoryId}_${key.toLowerCase()}`] = { game: gameName, title: ach.name, desc: ach.description, reward: ach.points };
          }
        }
        if (tGame.tiered) {
          for (const [key, ach] of Object.entries(tGame.tiered)) {
            ach.tiers.forEach((t, index) => {
              const tierNum = t.tier || index + 1;
              achDictionary[`${categoryId}_${key.toLowerCase()}` + `_${tierNum}`] = { game: gameName, title: ach.name, desc: ach.description, reward: t.points };
            });
          }
        }
      }
    }

    const newestFirstIds = [...cleanOneTime].reverse(); 
    for (const fullId of newestFirstIds) {
      if (achDictionary[fullId]) {
        responseData.recentAchievements.push(achDictionary[fullId]);
      } else {
        responseData.recentAchievements.push({
           game: "Unknown", 
           title: fullId, 
           desc: "Raw ID (Not in dictionary)", 
           reward: 0 
        });
      }
    }

    const hg = profile.stats?.HungerGames || {};
    const packages = hg.packages || [];
    const blitzKits = {};
    const blitzPrestiges = {};
    const kitStats = {};
    
    responseData.currentCoins = parseInt(hg.coins) || 0;
    const ramboExpVal = hg.exp_rambo !== undefined ? hg.exp_rambo : (hg.rambo_exp || 0);

    responseData.overallStats = {
        coins: parseInt(hg.coins) || 0,
        kills: hg.kills || 0,
        deaths: hg.deaths || 0,
        wins_solo_normal: hg.wins_solo_normal || 0,
        wins_teams_normal: hg.wins_teams_normal || 0,
        wins: hg.wins || (hg.wins_solo_normal || 0) + (hg.wins_teams_normal || 0),
        timePlayed: hg.time_played || hg.timePlaying || 0,
        currentKit: hg.defaultkit || hg.auto_spawn_kit || 'None',
        exp_rambo: ramboExpVal
    };

    const starCosts = {
        'assassin': 10000, 'wobbuffet': 20000, 'vaulthunter': 15000, 'witherwarrior': 10000,
        'gremlin': 5000, 'roulette': 10000, 'invoker': 10000, 'ironman': 10000,
        'nuke': 15000, 'ninja': 5000, 'robinhood': 10000, 'supplies': 10000,
        'shotgun': 20000, 'koolmove': 20000, 'lockdown': 5000, 'time_warp': 10000,
        'acid_rain': 15000, 'infection': 15000, 'pickpocket': 5000, 'ragnarok': 10000,
        'gladiator': 10000, 'zookeeper': 10000, 'switcheroo': 10000, 'imprison': 20000
    };
    const starsUnlocked = [];
    for (const p of packages) {
        if (starCosts[p]) starsUnlocked.push(p);
    }
    responseData.blitzStars = starsUnlocked;
    
    const kitList = ["horsetamer", "ranger", "archer", "astronaut", "troll", "meatmaster", "reaper", "shark", "reddragon", "toxicologist", "donkeytamer", "rogue", "warlock", "slimeyslime", "jockey", "golem", "viking", "speleologist", "shadow knight", "baker", "knight", "pigman", "guardian", "phoenix", "paladin", "necromancer", "scout", "hunter", "warrior", "hypetrain", "fisherman", "milkman", "florist", "diver", "arachnologist", "blaze", "wolftamer", "tim", "snowman", "rambo", "farmer", "armorer", "creepertamer"];
    const defaultKits = new Set(["armorer", "meatmaster", "archer", "baker", "fisherman", "hunter", "knight", "ranger", "scout", "speleologist", "rambo", "guardian", "hypetrain"]);
    const ultimateKits = new Set(["phoenix", "warrior", "donkeytamer", "milkman", "ranger", "rambo"]);
    
    for (const kit of kitList) {
        let level = defaultKits.has(kit) ? 1 : 0;
        if (packages.includes(kit)) level = 1; 
        for (let i = 1; i <= 9; i++) {
            if (packages.includes(`${kit}_${i}`)) level = i + 1;
        }
        
        if (hg[kit] !== undefined && (hg[kit] + 1) > level) {
            level = hg[kit] + 1;
        }
        
        if (ultimateKits.has(kit)) {
            const xp = kit === 'rambo' ? ramboExpVal : hg[`exp_${kit}`];
            if (xp !== undefined) {
                if (level === 0) level = 1;
                if (xp >= 10000) level = 10;
                else if (xp >= 5000) level = 9;
                else if (xp >= 2500) level = 8;
                else if (xp >= 2000) level = 7;
                else if (xp >= 1500) level = 6;
                else if (xp >= 1000) level = 5;
                else if (xp >= 500) level = 4;
                else if (xp >= 250) level = 3;
                else if (xp >= 100) level = 2;
                else level = 1;
            }
        }
        
        const safeName = kit.replace(/\s+/g, '');
        let pLvl = hg[`p${safeName}`] || 0;
        if (pLvl >= 2 && level === 10) level = 11; 
        
        blitzKits[safeName] = level;
        blitzPrestiges[safeName] = pLvl;

        const kitLower = kit.toLowerCase();
        const kitWinsSolo = hg[`wins_${kitLower}`] || hg[`${kitLower}_wins`] || 0;
        const kitWinsTeams = hg[`wins_teams_${kitLower}`] || hg[`${kitLower}_wins_teams`] || 0;
        const kitWinsTotal = kitWinsSolo + kitWinsTeams;
        const kitGames = hg[`games_played_${kitLower}`] || hg[`games_${kitLower}`] || 0;
        
        let kitLosses = kitGames - kitWinsTotal;
        if (kitLosses < 0) kitLosses = 0; 

        kitStats[safeName] = {
            kills: hg[`kills_${kitLower}`] || hg[`${kitLower}_kills`] || 0,
            losses: kitLosses,
            wins: kitWinsTotal,
            timePlayed: hg[`time_played_${kitLower}`] || hg[`timePlaying_${kitLower}`] || 0
        };
    }
    
    responseData.blitzKits = blitzKits;
    responseData.blitzPrestiges = blitzPrestiges;
    responseData.kitStats = kitStats;

    return res.status(200).json(responseData);

  } catch (error) {
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
