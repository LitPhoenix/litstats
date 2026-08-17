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
        'Does not work if all players have 0 kills',
    ]
  },
  { 
    id: 'diamond', key: 'roulette', name: 'Roulette', 
    desc: 'Kill a random player, might be you!', 
    type: [
        'Activates immediately!'
    ]
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
        'If used 30 seconds before deathmatch, Speed II carries over to the start of deathmatch',
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
    type: 'Activates immediately!' 
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
    type: 'Activates immediately!',
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
  { 
    id: 'barrier', key: 'close', name: 'Close', 
    desc: 'Click to exit menu.', 
    type: '' 
  },
  null, null, null, null
];

function getStarAssetUrl(it) {
  if (!it) return '';
  if (it.customImg) return it.customImg;
  return `https://api.minecraftitems.xyz/api/item/${it.id}?size=2&glint=false`;
}

function initStarChest() {
  const grid = document.getElementById('star-grid');
  if (!grid) return;

  let html = '';
  for (let i = 0; i < 54; i++) {
    const star = starMap[i];
    if (!star) {
      html += `<div class="slot"></div>`;
      continue;
    }

    const cost = STAR_COSTS[star.key];
    const lines = [];

    // Description
    if (star.desc) {
    const descLines = Array.isArray(star.desc) ? star.desc : [star.desc];
    descLines.forEach(l => {
        if (!l || l.trim() === '') {
        lines.push({ text: ' ', cls: 'tt-spacer' });
        } else {
        lines.push({ text: l, cls: 'c-grey' });
        }
    });
    }

    // Use cases / bullet points
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

    // Cost (spaced after use cases)
    if (cost && cost > 0) {
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

    const payload = JSON.stringify({
      id: star.id,
      name: star.name,
      rarity: 'common',
      lines: lines,
      customImg: star.customImg || null
    }).replace(/"/g, '&quot;');

    const imgUrl = getStarAssetUrl(star);
    html += `
      <div class="slot" data-item="${payload}">
        <div class="item-wrapper">
          <img src="${imgUrl}" alt="${star.name}" onerror="this.onerror=null; this.src='img/blitz/items/${star.id}.png';">
        </div>
      </div>
    `;
  }
  grid.innerHTML = html;
}

document.addEventListener('tt-format', (e) => {
  const it = e.detail.item;
  let h = `<span class="tt-name" style="color: #55ff55;">${it.name}</span>`;
  
  if (it.lines && it.lines.length) {
    for (const l of it.lines) {
      if (l.cls === 'tt-spacer' || l.text === ' ') {
        // Natural full-height line break
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

document.addEventListener('DOMContentLoaded', initStarChest);