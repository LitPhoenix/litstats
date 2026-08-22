const STAR_COSTS = {
  'assassin': 10000,
  'stasis': 20000,
  'vaulthunter': 15000,
  'witherwarrior': 10000,
  'gremlin': 5000,
  'roulette': 10000,
  'invoker': 10000,
  'ironman': 10000,
  'nuke': 15000,
  'ninja': 5000,
  'robinhood': 10000,
  'supplies': 10000,
  'nocountryforoldmen': 20000,
  'koolmove': 20000,
  'lockdown': 5000,
  'time_warp': 10000,
  'acid_rain': 15000,
  'infection': 15000,
  'pickpocket': 5000,
  'ragnarok': 10000,
  'gladiator': 10000,
  'zookeeper': 10000,
  'switcheroo': 10000,
  'apocalypse': 0,
  'vampire': 0,
  'jedi_knight': 0,
  'nocturne': 0,
  'lucky_charm': 0
};

const MAX_TOTAL_STAR_COST = 250000;

const starMap = [
  // Row 1 (Slots 0 - 8: Blank border)
  null, null, null, null, null, null, null, null, null,

  // Row 2 (Slots 9 - 17: TNT to End Stone)
  null,
  { 
    id: 'tnt', key: 'apocalypse', name: 'Apocalypse', 
    customImg: 'img/blitz/items/tnt.png', 
    desc: 'Rains a fireball apocalypse from the sky.', 
    type: [
      'Activates immediately!',
      'Gives permanent Fire Resistance',
      'Gives Regeneration II for 30 seconds'
    ]
  },
  { 
    id: 'string', key: 'assassin', name: 'Assassin', 
    desc: 'Teleport to a random player and instantly damage them.', 
    type: 'Gives you an item that you can activate!' 
  },
  { 
    id: 'redstone', key: 'vampire', name: 'Vampire', 
    desc: 'Heal for half of all damage you deal to players.', 
    type: 'Activates immediately!' 
  },
  { 
    id: 'end_portal_frame', key: 'jedi_knight', name: 'Jedi Knight', 
    customImg: 'img/blitz/items/end_portal_frame.png', 
    desc: 'Ridiculously push back a player facing you.', 
    type: 'Gives you an item that you can activate!' 
  },
  { 
    id: 'iron_bars', key: 'stasis', name: 'Stasis', 
    desc: 'No players can move except you for 10s.', 
    type: [
      'Activates immediately!',
      'If a player is higher than you, you can hit them without them hitting you'
    ]
  },
  { 
    id: 'chest', key: 'vaulthunter', name: 'Vault Hunter', 
    customImg: 'img/blitz/items/chest.png', 
    desc: 'Spawn an incredible chest only for 8 seconds.', 
    type: 'Gives you an item that you can activate!' 
  },
  { 
    id: 'end_stone', key: 'witherwarrior', name: 'Wither Warrior', 
    customImg: 'img/blitz/items/end_stone.png', 
    desc: 'Every hit for 20 seconds after activation applies Wither III for 3 seconds.', 
    type: 'Activates immediately!' 
  },
  null,

  // Row 3 (Slots 18 - 26: Water Bottle to Bow)
  null,
  { 
    id: 'potion', key: 'gremlin', name: 'Gremlin', 
    customImg: 'img/blitz/items/water_bottle.png', 
    desc: 'Clears the inventory and armor of the person with the most kills.', 
    type: [
      'Activates immediately!',
      'Does not work if all players have 0 kills'
    ]
  },
  { 
    id: 'diamond', key: 'roulette', name: 'Roulette', 
    desc: 'Kill a random player, might be you!', 
    type: 'Activates immediately!' 
  },
  { 
    id: 'paper', key: 'invoker', name: 'Invoker', 
    desc: 'Gives you three random powerful incantations.', 
    type: [
      'Gives you 3 items that you can activate!',
      '',
      'Iron Sword with Fire Aspect I',
      'Instant Full Heal Scroll',
      'Ranged Poison Bolt Scroll',
      'Ranged Smite Scroll',
      'Ranged Launch Scroll'
    ]
  },
  { 
    id: 'iron_chestplate', key: 'ironman', name: 'Ironman', 
    desc: 'Reflects all damage onto your attacker for 30 seconds, while Iron Man is active gain Fire Resistance, Resistance and Weakness I.', 
    type: 'Gives you an Iron Ingot that you can activate!' 
  },
  { 
    id: 'anvil', key: 'nuke', name: 'Nuke', 
    customImg: 'img/blitz/items/anvil.png', 
    desc: 'Gives you a laser visor to drop a tactical nuke.', 
    type: 'Gives you an item that you can activate!' 
  },
  { 
    id: 'book', key: 'ninja', name: 'Ninja', 
    desc: 'Silently go invisible for 2 minutes and gain incredible speed, your first hit while invisible makes you visible, reduces your speed, and blinds the target for 3 seconds.', 
    type: [
      'Activates immediately!',
      'If used 30 seconds before deathmatch, Speed II carries over to the start of deathmatch'
    ]
  },
  { 
    id: 'bow', key: 'robinhood', name: 'Robinhood', 
    desc: 'Instakill the first player your arrow hits within 15s.', 
    type: 'Activates immediately!' 
  },
  null,

  // Row 4 (Slots 27 - 35: Obsidian to Melon Seeds)
  null,
  { 
    id: 'obsidian', key: 'nocturne', name: 'Nocturne', 
    customImg: 'img/blitz/items/obsidian.png', 
    desc: 'Every player goes blind for 15s.', 
    type: [
      'Activates immediately!',
      'Critical hits do not work while players are blinded'
    ]
  },
  { 
    id: 'arrow', key: 'supplies', name: 'Supplies', 
    desc: 'Gives you one of three rare items randomly.', 
    type: [
      'Gives one of the following randomly',
      '',
      'Protection II Iron Chestplate and Leggings',
      'Sharpness I Iron Sword',
      'Flame Bow'
    ]
  },
  { 
    id: 'comparator', key: 'nocountryforoldmen', name: 'No country for old men', 
    customImg: 'img/blitz/items/comparator.png', 
    desc: 'Gives you a shotgun with 6 pellets.', 
    type: [
      'Gives you an item that you can activate!',
      'Shotgun does not work through walls',
      'After Shotgun breaks, it becomes a Knockback III, Unbreaking X Wooden Shovel'
    ]
  },
  { 
    id: 'hay_bale', key: 'koolmove', name: 'Sweg Move', 
    customImg: 'img/blitz/items/hay_bale.png', 
    desc: 'Starts an early deathmatch.', 
    type: [
      'Activates immediately!',
      'Cannot be used in the void'
    ]
  },
  { 
    id: 'barrier', key: 'lockdown', name: 'Lockdown', 
    desc: 'All chests, enchantment tables and crafting tables are being locked and cannot be opened anymore.', 
    type: 'Activates immediately!' 
  },
  { 
    id: 'ender_eye', key: 'time_warp', name: 'Time Warp', 
    desc: 'Brings you back to where you were 10 seconds ago, heals 10 hearts.', 
    type: 'Activates immediately!' 
  },
  { 
    id: 'melon_seeds', key: 'acid_rain', name: 'Acid Rain', 
    desc: 'It starts to rain for 30s and damages your enemies if they don\'t find cover.', 
    type: 'Activates immediately!' 
  },
  null,

  // Row 5 (Slots 36 - 44: Brewing Stand to Leather Boots)
  null,
  { 
    id: 'brewing_stand', key: 'infection', name: 'Infection', 
    desc: 'Your bare fists have the ability to apply poison and slowness to your enemies.', 
    type: 'Activates immediately!' 
  },
  { 
    id: 'blaze_rod', key: 'pickpocket', name: 'Pickpocket', 
    desc: 'Gives a chance of disarming an enemy on hit.', 
    type: 'Activates immediately!' 
  },
  { 
    id: 'experience_bottle', key: 'lucky_charm', name: 'Lucky Charm', 
    desc: 'You start earning experience points over time!', 
    type: [
      'Activates immediately!',
      'Gives around 45 levels worth of XP'
    ]
  },
  { 
    id: 'skeleton_skull', key: 'ragnarok', name: 'Ragnarok', 
    customImg: 'img/blitz/items/skeleton_skull.png', 
    desc: 'For the rest of the game all enemies have only 7.5 hearts!', 
    type: 'Activates immediately!' 
  },
  { 
    id: 'iron_sword', key: 'gladiator', name: 'Gladiator', 
    desc: 'Challenge an opponent to a fair fight in the Deathmatch Arena.', 
    type: 'Gives you an item that you can activate!' 
  },
  { 
    id: 'ghast_spawn_egg', key: 'zookeeper', name: 'Zookeeper', 
    desc: 'Gives you 5 mystery spawn eggs.', 
    type: [
      'Gives you items that you can activate!',
      '0.34% chance to spawn an Ender Dragon'
    ]
  },
  { 
    id: 'leather_boots', key: 'switcheroo', name: 'Switcheroo', 
    customImg: 'img/blitz/leather_armor/donkeytamer_leather_boots.png', 
    desc: 'Switches your position with that of a random enemy!', 
    type: [
      'Activates immediately!',
      'Cannot be used in the void'
    ]
  },
  null,

  // Row 6 (Slots 45 - 53: Close Button)
  null, null, null, null,
  { id: 'barrier', key: 'close', name: 'Close', desc: 'Click to exit menu.', type: '' },
  null, null, null, null
];

window.PLAYER_STARS = null;

function normalizeKey(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const STAR_ALIASES = {
  'wobbuffet': 'ironman',
  'iron_man': 'ironman',
  'ironman': 'ironman',
  'shotgun': 'nocountryforoldmen',
  'nocountryforoldmen': 'nocountryforoldmen',
  'no_country_for_old_men': 'nocountryforoldmen',
  'imprison': 'stasis',
  'stasis': 'stasis',
  'freeze': 'stasis',
  'sweg_move': 'koolmove',
  'swegmove': 'koolmove',
  'kool_move': 'koolmove',
  'koolmove': 'koolmove',
  'robin_hood': 'robinhood',
  'robinhood': 'robinhood',
  'vault_hunter': 'vaulthunter',
  'vaulthunter': 'vaulthunter',
  'wither_warrior': 'witherwarrior',
  'witherwarrior': 'witherwarrior',
  'time_warp': 'time_warp',
  'timewarp': 'time_warp',
  'acid_rain': 'acid_rain',
  'acidrain': 'acid_rain',
  'lucky_charm': 'lucky_charm',
  'luckycharm': 'lucky_charm'
};

function resolveStarKey(k) {
  const norm = normalizeKey(k);
  return STAR_ALIASES[norm] || STAR_ALIASES[k] || norm;
}

function getPlusColourHex(colourName) {
  const colours = { 'RED': '#FF5555', 'GOLD': '#FFAA00', 'GREEN': '#55FF55', 'YELLOW': '#FFFF55', 'LIGHT_PURPLE': '#FF55FF', 'WHITE': '#FFFFFF', 'BLUE': '#5555FF', 'DARK_GREEN': '#00AA00', 'DARK_RED': '#AA0000', 'DARK_AQUA': '#00AAAA', 'DARK_PURPLE': '#AA00AA', 'DARK_GRAY': '#555555', 'BLACK': '#000000', 'DARK_BLUE': '#0000AA' };
  return colours[colourName] || '#FF5555';
}

function getRankBaseColourHex(rank, monthlyRankColor) {
  if (!rank || rank === 'NON') return '#AAAAAA';
  const clean = rank.replace(/\[|\]/g, ''); 
  if (clean.includes('++')) return monthlyRankColor === 'AQUA' ? '#55FFFF' : '#FFAA00';
  if (clean === 'MOJANG' || clean === 'EVENTS') return '#FFAA00'; 
  if (clean.includes('MVP')) return '#55FFFF'; 
  if (clean.includes('VIP')) return '#55FF55'; 
  if (clean.includes('YOUTUBE') || clean === 'STAFF') return '#FF5555'; 
  if (clean.includes('PIG')) return '#FF55FF'; 
  return '#AAAAAA';
}

function formatRankHtml(rank, plusColour, monthlyRankColor) {
  if (!rank || rank === 'NON') return '';
  const plusHex = getPlusColourHex(plusColour);
  const cleanRank = rank.replace(/\[|\]/g, ''); 
  const baseColor = getRankBaseColourHex(rank, monthlyRankColor);

  let formatted = cleanRank;
  if (cleanRank.includes('++')) formatted = `MVP<span style="color:${plusHex}">++</span>`;
  else if (cleanRank.includes('+')) formatted = `${cleanRank.split('+')[0]}<span style="color:${plusHex}">+</span>`;

  return `<span style="color:${baseColor}; font-family: var(--mc-font), monospace; font-weight: normal;">[${formatted}]</span>`;
}

function renderPlayerSkinViewer(usernameOrUuid) {
    if (typeof MCEngine === 'undefined' || !MCEngine.viewers) return;
    const target = usernameOrUuid || 'MHF_Steve';
    const skinUrl = `https://minotar.net/skin/${target}`;

    Object.values(MCEngine.viewers).forEach(viewer => {
        try {
            if (typeof viewer.loadSkin === 'function') {
                viewer.loadSkin(skinUrl);
            }
        } catch(err) {
            console.warn("Could not load 3D skin viewer:", err);
        }
    });
}

function getStarAssetUrl(it) {
  if (!it) return '';
  if (it.customImg) return it.customImg;
  return `https://api.minecraftitems.xyz/api/item/${it.id}?size=2&glint=false`;
}

function initStarChest() {
  const grid = document.getElementById('star-grid');
  if (!grid) return;

  const userStars = window.PLAYER_STARS ? new Set(window.PLAYER_STARS.map(resolveStarKey)) : null;

  let html = '';
  for (let i = 0; i < 54; i++) {
    const star = starMap[i];
    if (!star) {
      html += `<div class="slot"></div>`;
      continue;
    }

    const safeKey = resolveStarKey(star.key);
    const isFree = STAR_COSTS[star.key] === 0;
    const cost = STAR_COSTS[star.key] || 0;
    
    let isPurchased = false;
    if (userStars) {
      isPurchased = isFree || userStars.has(safeKey);
    }

    const lines = [];

    if (star.desc) {
      const descLines = Array.isArray(star.desc) ? star.desc : [star.desc];
      descLines.forEach(l => {
        if (!l || l.trim() === '') lines.push({ text: ' ', cls: 'tt-spacer' });
        else lines.push({ text: l, cls: 'c-grey' });
      });
    }

    if (star.type) {
      lines.push({ text: ' ', cls: 'tt-spacer' });
      const points = Array.isArray(star.type) ? star.type : [star.type];
      points.forEach(pt => {
        if (!pt || pt.trim() === '') {
          lines.push({ text: ' ', cls: 'tt-spacer' });
        } else {
          lines.push({ text: `- ${pt}`, cls: 'c-grey' });
        }
      });
    }

    if (userStars && star.key !== 'close') {
      if (!isFree) {
        lines.push({ text: ' ', cls: 'tt-spacer' });
        if (isPurchased) {
          lines.push({ html: `<span style="color: #55FF55;">Purchased!</span>` });
        } else {
          lines.push({ 
            html: `<span style="color: #AAAAAA;">Cost: </span><span style="color: #FFAA00;">${cost.toLocaleString()}</span>` 
          });
          lines.push({ html: `<span style="color: #FF5555;">Locked!</span>` });
        }
      }
    } else {
      if (cost > 0) {
        lines.push({ text: ' ', cls: 'tt-spacer' });
        lines.push({ 
          html: `<span style="color: #AAAAAA;">Cost: </span><span style="color: #FFAA00;">${cost.toLocaleString()}</span>` 
        });
      } else if (star.key !== 'close') {
        lines.push({ text: ' ', cls: 'tt-spacer' });
        lines.push({ 
          html: `<span style="color: #AAAAAA;">Cost: </span><span style="color: #55FF55;">Free</span>` 
        });
      }
    }

    const payload = JSON.stringify({
      id: star.id,
      name: star.name,
      rarity: 'common',
      lines: lines,
      customImg: star.customImg || null,
      isPurchased: userStars ? isPurchased : true,
      hasPlayer: Boolean(userStars)
    }).replace(/"/g, '&quot;');

    const imgUrl = getStarAssetUrl(star);
    let slotClass = 'slot';
    if (userStars && !isPurchased && star.key !== 'close') {
      slotClass += ' locked-star-slot';
    }

    html += `
      <div class="${slotClass}" data-item="${payload}">
        <div class="item-wrapper">
          <img src="${imgUrl}" alt="${star.name}" onerror="this.onerror=null; this.src='img/blitz/items/${star.id}.png';">
        </div>
      </div>
    `;
  }
  grid.innerHTML = html;
}

function updateStarCoinPanel() {
  if (!window.PLAYER_STARS) {
    document.getElementById('player-star-panel').style.display = 'none';
    return;
  }

  const userStars = new Set(window.PLAYER_STARS.map(resolveStarKey));
  let spent = 0;
  let unlockedCount = 0;
  const totalPurchasable = Object.entries(STAR_COSTS).filter(([_, c]) => c > 0).length;

  for (const [key, cost] of Object.entries(STAR_COSTS)) {
    if (cost > 0 && userStars.has(resolveStarKey(key))) {
      spent += cost;
      unlockedCount++;
    }
  }

  const remaining = Math.max(0, MAX_TOTAL_STAR_COST - spent);

  document.getElementById('star-total-display').textContent = spent.toLocaleString();
  document.getElementById('star-unlocked-count').textContent = `${unlockedCount} / ${totalPurchasable}`;
  document.getElementById('star-coins-spent').textContent = spent.toLocaleString();
  document.getElementById('star-coins-remaining').textContent = remaining.toLocaleString();

  document.getElementById('player-star-panel').style.display = 'flex';
}

const starSearchInput = document.getElementById('star-player-search');
if (starSearchInput) {
    starSearchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') fetchStarPlayer();
    });
    starSearchInput.addEventListener('change', e => {
        if (typeof window.syncNavigationLinks === 'function') {
            window.syncNavigationLinks(e.target.value.trim());
        }
    });
}

window.enablePreviewAllStars = function() {
  window.PLAYER_STARS = null;
  sessionStorage.removeItem('active_player_session');
  sessionStorage.removeItem('blitz_user');
  
  const searchInput = document.getElementById('star-player-search');
  if (searchInput) searchInput.value = '';
  
  const errEl = document.getElementById('star-error-msg');
  if (errEl) {
    errEl.textContent = "Previewing all Blitz Stars.";
    errEl.style.color = "var(--text-3)";
  }

  const sideLabel = document.getElementById('side-username-label');
  if (sideLabel) {
    sideLabel.innerHTML = 'Username';
    sideLabel.style.color = 'var(--text)';
  }
  document.getElementById('player-avatar-panel').style.display = 'none';
  document.getElementById('player-star-panel').style.display = 'none';

  renderPlayerSkinViewer('MHF_Steve');

  if (typeof window.syncNavigationLinks === 'function') {
    window.syncNavigationLinks('');
  }

  initStarChest();
  window.history.pushState({}, '', window.location.pathname);
};

async function fetchStarPlayer(customUsername) {
  const inputEl = document.getElementById('star-player-search');
  const username = customUsername || (inputEl ? inputEl.value.trim() : '');
  if (!username) return;
  
  if (inputEl) inputEl.value = username;
  const errEl = document.getElementById('star-error-msg');
  if (errEl) {
    errEl.textContent = "Loading Blitz Stars from API...";
    errEl.style.color = "var(--text-3)";
  }

  if (typeof window.showLoader === 'function') {
    window.showLoader('Loading Blitz Stars...');
  }

  try {
    let uuid = username;
    let realName = username;

    if (username.length <= 16) {
      const dbRes = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(username)}`);
      if (dbRes.status === 429) throw new Error("Rate Limited by PlayerDB.");
      const dbData = await dbRes.json();
      if (dbData.code !== 'player.found') throw new Error("Player not found on Mojang.");
      uuid = dbData.data.player.raw_id;
      realName = dbData.data.player.username;
    }

    const res = await fetch(`/api/player?uuid=${encodeURIComponent(uuid)}`);
    if (res.status === 429) throw new Error("Rate Limited by Hypixel. Please wait 60 seconds.");
    
    const contentType = res.headers.get("content-type") || "";
    if (!res.ok || contentType.includes("text/html")) {
      throw new Error(`API returned HTTP ${res.status}.`);
    }

    const vData = await res.json();
    if (vData.error) throw new Error(vData.error);

    window.PLAYER_STARS = vData.blitzStars || [];
    sessionStorage.setItem('active_player_session', realName);
    sessionStorage.setItem('blitz_user', realName);

    if (typeof window.syncNavigationLinks === 'function') {
      window.syncNavigationLinks(realName);
    }

    if (errEl) {
      errEl.textContent = `Showing unlocked Blitz Stars for ${realName}`;
      errEl.style.color = "var(--green)";
    }

    const rankHtml = formatRankHtml(vData.rank, vData.rankPlusColor, vData.monthlyRankColor);
    const baseColor = getRankBaseColourHex(vData.rank, vData.monthlyRankColor);
    const sideLabel = document.getElementById('side-username-label');
    if (sideLabel) {
      sideLabel.innerHTML = `${rankHtml}${rankHtml ? ' ' : ''}<span style="color:${baseColor}; font-family: var(--mc-font), monospace; font-weight: normal;">${realName}</span>`;
    }
    
    const avatarPanel = document.getElementById('player-avatar-panel');
    if (avatarPanel) avatarPanel.style.display = 'flex';

    renderPlayerSkinViewer(uuid || realName);

    updateStarCoinPanel();
    initStarChest();
    window.history.pushState({}, '', `${window.location.pathname}?player=${encodeURIComponent(realName)}`);

  } catch (e) {
    if (errEl) {
      errEl.textContent = e.message;
      errEl.style.color = "var(--red)";
    }
  } finally {
    if (typeof window.hideLoader === 'function') {
      window.hideLoader();
    }
  }
}

document.addEventListener('tt-format', (e) => {
  const it = e.detail.item;
  
  let titleColor = '#FF5555';
  if (it.hasPlayer) {
    titleColor = it.isPurchased ? '#55FF55' : '#FF5555';
  }

  let h = `<span class="tt-name" style="color: ${titleColor};">${it.name}</span>`;
  
  if (it.lines && it.lines.length) {
    for (const l of it.lines) {
      if (l.cls === 'tt-spacer' || l.text === ' ') {
        h += `<span class="tt-line">&nbsp;</span>`;
      } else if (l.html) {
        h += `<span class="tt-line">${l.html}</span>`;
      } else {
        h += `<span class="tt-line ${l.cls || 'c-grey'}">${l.text}</span>`;
      }
    }
  }
  e.detail.html = h;
});

document.addEventListener('DOMContentLoaded', () => {
  initStarChest();

  setTimeout(() => {
    MCEngine.initPlayerCanvas('player-canvas-main', 'side-player-box-id');
  }, 100);

  const searchInput = document.getElementById('star-player-search');
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') fetchStarPlayer();
    });
    searchInput.addEventListener('input', e => {
      if (typeof window.syncNavigationLinks === 'function') {
        window.syncNavigationLinks(e.target.value.trim());
      }
    });
  }

  const params = new URLSearchParams(window.location.search);
  const playerParam = params.get('player') || params.get('uuid') || sessionStorage.getItem('active_player_session') || sessionStorage.getItem('blitz_user');

  if (playerParam) {
    fetchStarPlayer(playerParam);
  }
});
