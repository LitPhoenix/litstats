"use strict";

// ── Item constructors ────────────────────────────────────────────────────────
function itm(id, name, rarity = 'common', stack = null, enchants = []) {
  // Forces enchants to be an array, preventing crashes if a hex string is passed
  const validEnchants = Array.isArray(enchants) ? enchants : [];
  const lines = validEnchants.map(e => ({ text: e, cls: 'c-grey' }));
  const enchanted = validEnchants.length > 0;
  
  return { id, name, rarity, stack, lines, enchanted, customImg: null };
}

const _LIDS = { helmet:'leather_helmet', chestplate:'leather_chestplate', leggings:'leather_leggings', boots:'leather_boots' };

// Accepts the legacy dye argument but ignores it, mapping enchants correctly
function _lth(slot, name, dyeOrEnchants, enchants = []) { 
  const actualEnchants = Array.isArray(dyeOrEnchants) ? dyeOrEnchants : enchants;
  return itm(_LIDS[slot], name, 'common', null, actualEnchants); 
}

function lth(slot, name, enchants = []) { return _lth(slot, name, null, enchants); }
function lim(slot, name, enchants = []) { return _lth(slot, name, null, enchants); }
function grn(slot, name, enchants = []) { return _lth(slot, name, null, enchants); }

function pot(name, stack = null)  { return itm('potion',        name, 'common', stack); }
function spot(name, stack = null) { return itm('splash_potion', name, 'common', stack); }

const COMPASS = itm('compass', 'Compass', 'common');

// ── Patch engine ─────────────────────────────────────────────────────────────
function applyPatch(base, patch) {
  const out = JSON.parse(JSON.stringify(base)); 
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) { delete out[k]; }
    else            { out[k] = v;   }
  }
  return out;
}

function expand(patches) {
  const levels = [];
  let state = {};
  for (const patch of patches) {
    state = applyPatch(state, patch);
    levels.push(state);
  }
  return levels;
}

function toLevel(resolved) {
  const armourKeys = ['helmet','chestplate','leggings','boots'];
  const armour = {};
  const hotbar  = [];
  const inv     = [];

  for (const k of armourKeys) {
    if (resolved[k]) armour[k] = resolved[k];
  }
  for (let i = 0; i < 8; i++) {
    hotbar.push(resolved[`h${i}`] || null);
  }
  hotbar.push(COMPASS);
  for (let i = 0; i < 27; i++) {
    inv.push(resolved[`i${i}`] || null);
  }
  return { armour, hotbar, inv };
}

function kit(patches) {
  return expand(patches).map(toLevel);
}

// =============================================================================
// KIT DATABASE (Exposed to the global window object)
// =============================================================================
window.KIT_DATABASE = {

"Archer": kit([
  { helmet: lth('helmet','Leather Helmet'), boots: _lth('boots', 'Leather Boots', '#ff0000'), h0: itm('bow','Bow','uncommon'), h1: itm('arrow','Arrow','common',16) },
  { leggings: lth('leggings','Leather Leggings') },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon') },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection I']) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary'), h1: itm('arrow','Arrow','common',18) },
  { h0: itm('bow','Bow','rare',null,['Power I']), h1: itm('arrow','Arrow','common',20) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection I']), h1: itm('arrow','Arrow','common',22) },
  { chestplate: lth('chestplate','Leather Chestplate'), h1: itm('arrow','Arrow','common',26) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection I']), h1: itm('arrow','Arrow','common',30) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection II']), h0: itm('bow','Bow','legendary',null,['Power II']), h1: itm('arrow','Arrow','common',48) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection II']), h1: itm('arrow','Arrow','common',64) }
]),

"Ranger": kit([
  { chestplate: lth('chestplate','Leather Chestplate',['Protection I']), leggings: lth('leggings','Leather Leggings',['Protection I']), boots: itm('chainmail_boots','Chainmail Boots','uncommon',null,['Protection I']), h0: itm('bow','Bow','rare',null,['Power I']), h1: itm('arrow','Arrow','common',15) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection II']), leggings: lth('leggings','Leather Leggings'), h1: itm('arrow','Arrow','common',16) },
  { leggings: lth('leggings','Leather Leggings',['Protection I']), boots: itm('chainmail_boots','Chainmail Boots','uncommon',null,['Protection II']), h1: itm('arrow','Arrow','common',17) },
  { chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon'), h1: itm('arrow','Arrow','common',18) },
  { leggings: lth('leggings','Leather Leggings',['Protection II']), boots: itm('iron_boots','Iron Boots','uncommon'), h1: itm('arrow','Arrow','common',19) },
  { chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Protection I']), h1: itm('arrow','Arrow','common',20) },
  { leggings: itm('golden_leggings','Gold Leggings','uncommon'), boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection I']), h1: itm('arrow','Arrow','common',21) },
  { chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Protection II']), h1: itm('arrow','Arrow','common',22) },
  { boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection II']), h1: itm('arrow','Arrow','common',23) },
  { boots: itm('diamond_boots','Diamond Boots','legendary'), h0: itm('bow','Bow','legendary',null,['Power I','Punch I']), h1: itm('arrow','Arrow','common',24) },
  { boots: itm('diamond_boots','Diamond Boots','legendary',null,['Protection I']), h0: itm('wooden_axe','Wooden Axe','uncommon',null,['Unbreaking III']), h1: itm('bow','Bow','legendary',null,['Power I','Punch I']), h2: itm('arrow','Arrow','common',28) }
]),

"Horsetamer": kit([
  { helmet: lth('helmet','Leather Helmet'), boots: lth('boots','Leather Boots'), h0: itm('wooden_axe','Wooden Axe','common',null,['Infinity I']), h1: itm('horse_spawn_egg','Horse Egg','rare'), h2: itm('apple','Apple','common',3), h3: itm('saddle','Saddle','uncommon') },
  { leggings: lth('leggings','Leather Leggings'), boots: itm('chainmail_boots','Chainmail Boots','uncommon') },
  { h0: itm('stone_axe','Stone Axe','uncommon',null,['Infinity I']) },
  { chestplate: lth('chestplate','Leather Chestplate') },
  { boots: itm('chainmail_boots','Chainmail Boots','uncommon',null,['Protection I']) },
  { boots: itm('iron_boots','Iron Boots','uncommon') },
  { h0: itm('iron_axe','Iron Axe','rare',null,['Infinity I']), h2: itm('apple','Apple','common',4) },
  { boots: itm('diamond_boots','Diamond Boots','legendary') },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection I']), boots: itm('diamond_boots','Diamond Boots','legendary',null,['Protection I']), h2: itm('apple','Apple','common',6) },
  { h0: itm('diamond_axe','Diamond Axe','legendary',null,['Infinity I']), boots: itm('diamond_boots','Diamond Boots','legendary',null,['Protection II']), h2: itm('apple','Apple','common',8) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection II']), leggings: lth('leggings','Leather Leggings',['Protection I']) }
]),

"Armorer": kit([
  { helmet: lth('helmet','Leather Helmet'), chestplate: lth('chestplate','Leather Chestplate',['Protection I','Blast Protection I']), leggings: lth('leggings','Leather Leggings',['Protection I','Fire Protection I']), boots: lth('boots','Leather Boots'), h0: itm('cookie','Cookie','common',1) },
  { helmet: lth('helmet','Leather Helmet',['Protection I','Projectile Protection I']), h0: itm('cookie','Cookie','common',2) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection II','Blast Protection I']), boots: lth('boots','Leather Boots',['Protection I','Feather Falling I']), h0: itm('cookie','Cookie','common',3) },
  { helmet: lth('helmet','Leather Helmet',['Protection I','Projectile Protection II']), chestplate: lth('chestplate','Leather Chestplate',['Protection II','Blast Protection II']), boots: lth('boots','Leather Boots',['Protection I','Feather Falling II']), h0: itm('cookie','Cookie','common',4) },
  { helmet: lth('helmet','Leather Helmet',['Protection II','Projectile Protection II']), chestplate: lth('chestplate','Leather Chestplate',['Protection III','Blast Protection III']), h0: itm('cookie','Cookie','common',5) },
  { helmet: lth('helmet','Leather Helmet',['Protection II','Projectile Protection III']), leggings: lth('leggings','Leather Leggings',['Protection II','Fire Protection III']), boots: lth('boots','Leather Boots',['Protection I','Feather Falling III']), h0: itm('cookie','Cookie','common',6) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection III','Blast Protection IV']), leggings: lth('leggings','Leather Leggings',['Protection III','Fire Protection IV']), boots: lth('boots','Leather Boots',['Protection II','Feather Falling III']), h0: itm('cookie','Cookie','common',7) },
  { helmet: lth('helmet','Leather Helmet',['Protection II','Projectile Protection IV']), chestplate: lth('chestplate','Leather Chestplate',['Protection III','Blast Protection V']), h0: itm('cookie','Cookie','common',8) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection IV','Blast Protection V']), leggings: lth('leggings','Leather Leggings',['Protection IV','Fire Protection V']), h0: itm('cookie','Cookie','common',9) },
  { helmet: lth('helmet','Leather Helmet',['Protection II','Projectile Protection X']), chestplate: lth('chestplate','Leather Chestplate',['Protection IV','Blast Protection X']), leggings: lth('leggings','Leather Leggings',['Protection IV','Fire Protection X']), boots: lth('boots','Leather Boots',['Protection II','Feather Falling IV']), h0: itm('cookie','Cookie','common',10) },
  { boots: lth('boots','Leather Boots',['Protection II','Feather Falling X']), h0: itm('cookie','Cookie','common',12), h1: itm('wooden_axe','Wooden Axe','uncommon',null,['Unbreaking III']) }
]),

"Baker": kit([
  { helmet: lth('helmet','Leather Helmet'), h0: itm('wooden_sword','Wooden Sword','common'), h1: itm('bread','Bread','common',2), h2: itm('cake','Cake','common',1), h3: spot('Splash Potion of Resistance I (10s)') },
  { chestplate: lth('chestplate','Leather Chestplate'), h1: itm('bread','Bread','common',4) },
  { leggings: lth('leggings','Leather Leggings'), h1: itm('bread','Bread','common',6), h2: itm('cake','Cake','common',2) },
  { boots: lth('boots','Leather Boots'), h1: itm('bread','Bread','common',8) },
  { h1: itm('bread','Bread','common',10), h2: itm('cake','Cake','common',3), h3: spot('Splash Potion of Resistance I (10s)',2) },
  { boots: lth('boots','Leather Boots',['Protection I']), h1: itm('bread','Bread','common',12) },
  { h0: itm('stone_sword','Stone Sword','uncommon',null,['Unbreaking I']), h1: itm('bread','Bread','common',16) },
  { boots: lth('boots','Leather Boots',['Protection II']), h1: itm('bread','Bread','common',20), h2: itm('cake','Cake','common',4), h3: spot('Splash Potion of Resistance I (10s)',3) },
  { h0: itm('stone_sword','Stone Sword','uncommon'), boots: itm('iron_boots','Iron Boots','uncommon'), h1: itm('bread','Bread','common',24), h2: itm('cake','Cake','common',5) },
  { h0: itm('iron_sword','Iron Sword','rare',null,['Unbreaking I']), boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection I']), h1: itm('bread','Bread','common',32), h4: itm('golden_apple','Golden Apple','rare') },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon'), h3: spot('Splash Potion of Resistance I (10s)',4) }
]),

"Guardian": kit([
  { chestplate: lth('chestplate','Leather Chestplate'), h0: itm('wooden_axe','Wooden Axe','common'), h1: pot('Potion of Healing I') },
  { boots: lth('boots','Leather Boots') },
  { leggings: lth('leggings','Leather Leggings') },
  { helmet: lth('helmet','Leather Helmet'), h0: itm('stone_axe','Stone Axe','uncommon') },
  { h2: pot('Potion of Health Boost I (2 hearts, 20 min)') },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection I']), h1: pot('Potion of Healing II') },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection II']), boots: lth('boots','Leather Boots',['Protection I']) },
  { chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Protection I']), boots: itm('iron_boots','Iron Boots','uncommon') },
  { chestplate: itm('iron_chestplate','Iron Chestplate','uncommon'), boots: lth('boots','Leather Boots',['Protection II']) },
  { h0: itm('iron_axe','Iron Axe','rare'), boots: itm('iron_boots','Iron Boots','uncommon'), h1: pot('Potion of Healing II',2) },
  { h1: pot('Potion of Healing II & Resistance II (2s)',3) }
]),

"Hunter": kit([
  { chestplate: lth('chestplate','Leather Chestplate'), leggings: lth('leggings','Leather Leggings'), h0: itm('bow','Bow','uncommon',null,['Unbreaking I']), h1: itm('wooden_axe','Wooden Axe','common'), h2: itm('arrow','Arrow','common',8) },
  { h2: itm('arrow','Arrow','common',12) },
  { h1: itm('wooden_sword','Wooden Sword','common') },
  { h3: spot('Splash Potion of Speed II (8s)') },
  { h0: itm('bow','Bow','uncommon'), h2: itm('arrow','Arrow','common',16) },
  { leggings: lth('leggings','Leather Leggings',['Protection I']), h3: spot('Splash Potion of Speed II (8s)',2) },
  { leggings: itm('golden_leggings','Gold Leggings','uncommon'), h1: itm('stone_sword','Stone Sword','uncommon',null,['Unbreaking I']) },
  { h1: itm('stone_sword','Stone Sword','uncommon'), h3: spot('Splash Potion of Speed II (8s)',3) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection I']), leggings: itm('chainmail_leggings','Chainmail Leggings','uncommon'), h0: itm('bow','Bow','rare',null,['Power I']), h2: itm('arrow','Arrow','common',20) },
  { chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Punch I']), leggings: itm('chainmail_leggings','Chainmail Leggings','uncommon',null,['Punch I']), h2: itm('arrow','Arrow','common',18), h3: spot('Splash Potion of Speed II (10s)',3) },
  { h2: itm('arrow','Arrow','common',22), h3: spot('Splash Potion of Speed II (10s)',4) }
]),

"Hype Train": kit([
  { helmet: lth('helmet','Leather Helmet'), h0: itm('stone_axe','Stone Axe','uncommon'), h1: itm('minecart','Minecart','common'), h2: itm('rail','Rail','common',16), h3: itm('powered_rail','Powered Rail','uncommon',3), h4: itm('redstone_torch','Redstone Torch','common',3) },
  { chestplate: lth('chestplate','Leather Chestplate'), h2: itm('rail','Rail','common',20) },
  { helmet: lth('helmet','Leather Helmet',['Projectile Protection I']), chestplate: lth('chestplate','Leather Chestplate',['Projectile Protection I']), h2: itm('rail','Rail','common',24) },
  { h2: itm('rail','Rail','common',28), h5: itm('tnt','TNT','rare',1) },
  { boots: lth('boots','Leather Boots'), h2: itm('rail','Rail','common',32) },
  { h0: itm('iron_axe','Iron Axe','rare'), h2: itm('rail','Rail','common',36) },
  { boots: lth('boots','Leather Boots',['Protection I']), h2: itm('rail','Rail','common',40), h3: itm('powered_rail','Powered Rail','uncommon',4), h4: itm('redstone_torch','Redstone Torch','common',4) },
  { boots: lth('boots','Leather Boots',['Protection II']), h2: itm('rail','Rail','common',44), h3: itm('powered_rail','Powered Rail','uncommon',6), h4: itm('redstone_torch','Redstone Torch','common',6) },
  { chestplate: lth('chestplate','Leather Chestplate',['Projectile Protection II']), boots: itm('iron_boots','Iron Boots','uncommon'), h0: itm('iron_axe','Iron Axe','rare'), h1: itm('fishing_rod','Fishing Rod','uncommon'), h2: itm('rail','Rail','common',48), h3: itm('powered_rail','Powered Rail','uncommon',8), h4: itm('redstone_torch','Redstone Torch','common',8), h5: itm('minecart','Minecart','common'), h6: itm('tnt','TNT','rare',2) },
  { helmet: lth('helmet','Leather Helmet',['Projectile Protection II']), chestplate: lth('chestplate','Leather Chestplate',['Projectile Protection II']), leggings: lth('leggings','Leather Leggings',['Protection I']), boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection I']), h0: itm('iron_sword','Iron Sword','rare'), h1: itm('fishing_rod','Fishing Rod','uncommon',null,['Silk Touch I','Unbreaking II']), h2: itm('rail','Rail','common',64), h3: itm('powered_rail','Powered Rail','uncommon',10), h4: itm('redstone_torch','Redstone Torch','common',10), h5: itm('minecart','Minecart','common'), h6: itm('chest_minecart','Storage Minecart','uncommon'), h7: itm('tnt','TNT','rare',3) },
  { boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection III']) }
]),

"Knight": kit([
  { helmet: lth('helmet','Leather Helmet'), boots: itm('golden_boots','Golden Boots','uncommon'), h0: itm('wooden_sword','Wooden Sword','common') },
  { chestplate: lth('chestplate','Leather Chestplate') },
  { helmet: itm('golden_helmet','Golden Helmet','uncommon') },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection I']) },
  { chestplate: itm('golden_chestplate','Golden Chestplate','uncommon'), h0: itm('stone_sword','Stone Sword','uncommon',null,['Unbreaking I']) },
  { leggings: lth('leggings','Leather Leggings') },
  { leggings: itm('golden_leggings','Golden Leggings','uncommon') },
  { chestplate: itm('golden_chestplate','Golden Chestplate','uncommon',null,['Protection I']), leggings: itm('golden_leggings','Golden Leggings','uncommon',null,['Protection I']), h0: itm('stone_sword','Stone Sword','uncommon'), h1: itm('golden_carrot','Golden Carrot','uncommon',1) },
  { helmet: itm('golden_helmet','Golden Helmet','uncommon',null,['Protection I']), boots: itm('golden_boots','Golden Boots','uncommon',null,['Protection I']), h1: itm('golden_carrot','Golden Carrot','uncommon',2) },
  { chestplate: itm('golden_chestplate','Golden Chestplate','uncommon',null,['Protection II']), leggings: itm('golden_leggings','Golden Leggings','uncommon',null,['Protection II']), boots: itm('golden_boots','Golden Boots','uncommon',null,['Protection I']), h0: itm('iron_sword','Iron Sword','rare',null,['Unbreaking I']), h1: itm('golden_carrot','Golden Carrot','uncommon',3) },
  { chestplate: itm('golden_chestplate','Golden Chestplate','uncommon',null,['Protection III']), boots: itm('golden_boots','Golden Boots','uncommon',null,['Protection II']), h1: itm('golden_carrot','Golden Carrot','uncommon',5) }
]),

"Fisherman": kit([
  { helmet: lth('helmet','Leather Helmet'), h0: itm('fishing_rod','Fishing Rod','legendary',null,['Sharpness II','Unbreaking X']), h1: itm('cooked_cod','Cooked Fish','common',2) },
  { helmet: itm('chainmail_helmet','Chainmail Helmet','uncommon'), h1: itm('cooked_cod','Cooked Fish','common',3) },
  { h0: itm('fishing_rod','Fishing Rod','legendary',null,['Sharpness III','Unbreaking X']) },
  { chestplate: lth('chestplate','Leather Chestplate'), h1: itm('cooked_cod','Cooked Fish','common',4) },
  { leggings: lth('leggings','Leather Leggings') },
  { boots: itm('iron_boots','Iron Boots','uncommon') },
  { chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon'), leggings: itm('golden_leggings','Golden Leggings','uncommon') },
  { h0: itm('fishing_rod','Fishing Rod','legendary',null,['Sharpness IV','Unbreaking X']) },
  { leggings: itm('chainmail_leggings','Chainmail Leggings','uncommon'), h1: itm('cooked_cod','Cooked Fish','common',6) },
  { boots: itm('diamond_boots','Diamond Boots','legendary'), h0: itm('fishing_rod','Fishing Rod','legendary',null,['Sharpness V','Unbreaking X','Luck of the Sea III']), h1: itm('cooked_cod','Cooked Fish','common',8) },
  { boots: itm('diamond_boots','Diamond Boots','legendary',null,['Depth Strider I','Protection I']), h0: itm('fishing_rod','Fishing Rod','legendary',null,['Sharpness V','Unbreaking X','Luck of the Sea III','Lure III']) }
]),

"MeatMaster": kit([
  { helmet: lth('helmet','Leather Helmet'), boots: lth('boots','Leather Boots'), h0: itm('wooden_sword','Wooden Sword','common',null,['Looting I']), h1: itm('cow_spawn_egg','Cow Egg','uncommon',2), h2: itm('cooked_beef','Steak','common',2) },
  { helmet: lth('helmet','Leather Helmet',['Protection I']), boots: lth('boots','Leather Boots',['Protection I']), h2: itm('cooked_beef','Steak','common',4) },
  { helmet: lth('helmet','Leather Helmet',['Protection II']), boots: itm('iron_boots','Iron Boots','uncommon'), h1: itm('cow_spawn_egg','Cow Egg','uncommon',3), h2: itm('cooked_beef','Steak','common',6) },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon'), h2: itm('cooked_beef','Steak','common',8) },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection I']), h0: itm('wooden_sword','Wooden Sword','common',null,['Looting II']), h2: itm('cooked_beef','Steak','common',10) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary'), h2: itm('cooked_beef','Steak','common',12) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection I']), h0: itm('stone_sword','Stone Sword','uncommon',null,['Looting II']), h1: itm('cow_spawn_egg','Cow Egg','uncommon',4), h2: itm('cooked_beef','Steak','common',16) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection II']), h2: itm('cooked_beef','Steak','common',20) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection III']), h0: itm('stone_sword','Stone Sword','uncommon',null,['Looting III']), h1: itm('cow_spawn_egg','Cow Egg','uncommon',5), h2: itm('cooked_beef','Steak','common',24) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection IV']), h0: itm('iron_sword','Iron Sword','rare',null,['Looting III']), h2: itm('cooked_beef','Steak','common',28), h3: itm('pig_spawn_egg','Pig Egg','uncommon'), h4: itm('saddle','Saddle','uncommon'), h5: itm('carrot_on_a_stick','Carrot on a Stick','uncommon') },
  { boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection I']), h1: itm('cow_spawn_egg','Cow Egg','uncommon',6), h2: itm('cooked_beef','Steak','common',32) }
]),

"Scout": kit([
  { chestplate: lth('chestplate','Leather Chestplate'), h0: pot('Potion of Speed II (12s)',2), h1: spot('Splash Potion of Slowness II (8s)'), h2: spot('Splash Potion of Invisibility II (10s)') },
  { helmet: lth('helmet','Leather Helmet') },
  { helmet: lth('helmet','Leather Helmet',['Respiration I']), h0: pot('Potion of Speed II (14s)',2) },
  { h0: pot('Potion of Speed II (14s)',4), h1: spot('Splash Potion of Slowness II (8s)',2) },
  { helmet: lth('helmet','Leather Helmet',['Respiration II']), h0: pot('Potion of Speed II (14s)',3) },
  { h0: pot('Potion of Speed II (16s)',3) },
  { h3: pot('Potion of Regeneration II (10s)') },
  { boots: lth('boots','Leather Boots'), h0: pot('Potion of Speed II (18s)',5), h1: spot('Splash Potion of Slowness II (6s)',2) },
  { h1: spot('Splash Potion of Slowness II (8s)',2) },
  { leggings: lth('leggings','Leather Leggings'), h0: pot('Potion of Speed II (20s)',5), h1: spot('Splash Potion of Slowness II (8s)',3), h3: pot('Potion of Regeneration II (10s)',2) },
  {} 
]),

"Speleologist": kit([
  { helmet: itm('iron_helmet','Iron Helmet','uncommon'), boots: lth('boots','Leather Boots'), h0: itm('iron_pickaxe','Iron Pickaxe','uncommon'), h1: itm('bowl','Bowl','common'), h2: itm('mooshroom_spawn_egg','Mooshroom Egg','uncommon',1) },
  { boots: lth('boots','Leather Boots',['Protection I']) },
  { boots: lth('boots','Leather Boots',['Protection II']), h2: itm('mooshroom_spawn_egg','Mooshroom Egg','uncommon',2) },
  { boots: itm('iron_boots','Iron Boots','uncommon') },
  { chestplate: lth('chestplate','Leather Chestplate'), h2: itm('mooshroom_spawn_egg','Mooshroom Egg','uncommon',3) },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection I']), leggings: lth('leggings','Leather Leggings') },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection II']), boots: itm('iron_boots','Iron Boots','uncommon',null,['Projectile Protection I']), h2: itm('mooshroom_spawn_egg','Mooshroom Egg','uncommon',1) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary'), chestplate: lth('chestplate','Leather Chestplate'), h0: itm('iron_pickaxe','Iron Pickaxe','uncommon',null,['Sharpness I']), h2: itm('mooshroom_spawn_egg','Mooshroom Egg','uncommon',4) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection I']), chestplate: lth('chestplate','Leather Chestplate',['Protection I']), leggings: lth('leggings','Leather Leggings',['Protection I']) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection II']), chestplate: lth('chestplate','Leather Chestplate',['Protection II']), leggings: lth('leggings','Leather Leggings',['Protection II']), boots: itm('iron_boots','Iron Boots','uncommon',null,['Projectile Protection II']), h0: itm('diamond_pickaxe','Diamond Pickaxe','legendary',null,['Sharpness I']), h2: itm('mooshroom_spawn_egg','Mooshroom Egg','uncommon',5) },
  { chestplate: itm('golden_chestplate','Golden Chestplate','uncommon'), leggings: lth('leggings','Leather Leggings',['Protection I']), boots: itm('iron_boots','Iron Boots','uncommon',null,['Projectile Protection III']) }
]),

"Astronaut": kit([
  { boots: itm('chainmail_boots','Chainmail Boots','uncommon',null,['Feather Falling III']), h0: itm('wooden_axe','Wooden Axe','common'), h1: pot('Potion of Resistance I (8s)',2) },
  { boots: itm('chainmail_boots','Chainmail Boots','uncommon',null,['Feather Falling IV']), h1: pot('Potion of Resistance I (10s)',2) },
  { h0: itm('stone_axe','Stone Axe','uncommon') },
  { h1: pot('Potion of Resistance I (12s)',2) },
  { leggings: lth('leggings','Leather Leggings') },
  { chestplate: lth('chestplate','Leather Chestplate'), boots: itm('chainmail_boots','Chainmail Boots','uncommon',null,['Feather Falling V']) },
  { chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon') },
  { helmet: lth('helmet','Leather Helmet'), boots: itm('iron_boots','Iron Boots','uncommon',null,['Feather Falling VI']) },
  { helmet: itm('chainmail_helmet','Chainmail Helmet','uncommon',null,['Blast Protection III']), h0: itm('stone_sword','Stone Sword','uncommon',null,['Unbreaking I']), h1: pot('Potion of Resistance I (13s)',2) },
  { boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection I','Feather Falling X']), h0: itm('stone_sword','Stone Sword','uncommon'), h1: pot('Potion of Resistance I (14s)',4) },
  { leggings: itm('chainmail_leggings','Chainmail Leggings','uncommon'), boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection II','Feather Falling X']), h1: pot('Potion of Resistance I (16s)',4) }
]),

"Troll": kit([
  { chestplate: lth('chestplate','Leather Chestplate'), h0: itm('stick','Stick','common',null,['Sharpness II','Smite II','Bane Of Arthopods II']), h1: itm('ocelot_spawn_egg','Ocelot Egg','rare',1), h2: itm('snowball','Snowball','common',32) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection I']) },
  { h0: itm('stick','Stick','common',null,['Sharpness III','Smite III','Bane Of Arthopods III']), h2: itm('snowball','Snowball','common',48) },
  { boots: lth('boots','Leather Boots') },
  { boots: lth('boots','Leather Boots',['Protection I']), h2: itm('snowball','Snowball','common',64), h3: itm('fire_charge','Fire Charge','common',2) },
  { leggings: lth('leggings','Leather Leggings') },
  { leggings: lth('leggings','Leather Leggings',['Protection I']) },
  { helmet: lth('helmet','Leather Helmet') },
  { helmet: lth('helmet','Leather Helmet',['Protection I']), h0: itm('stick','Stick','common',null,['Sharpness IV','Smite IV','Bane Of Arthopods IV']), h1: itm('ocelot_spawn_egg','Ocelot Egg','rare',2) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection II']), leggings: lth('leggings','Leather Leggings',['Protection II']), h0: itm('stick','Stick','common',null,['Sharpness V','Smite V','Bane Of Arthopods V']), h1: itm('witch_spawn_egg','Witch Egg','rare',1), h2: itm('ocelot_spawn_egg','Ocelot Egg','rare',2), h3: itm('snowball','Snowball','common',64), h4: itm('fire_charge','Fire Charge','common',3), h5: pot('Potion of Invisibility II (20s)',2), h6: spot('Splash Potion of Confusion I (10s)',1) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection III']), h0: itm('bone','Bone','uncommon',null,['Sharpness V','Smite V','Bane Of Arthopods V']), h2: itm('ocelot_spawn_egg','Ocelot Egg','rare',3), h6: spot('Splash Potion of Confusion I (10s)',3) }
]),

"Reaper": kit([
  { helmet: lth('helmet','Leather Helmet'), leggings: lth('leggings','Leather Leggings'), h0: itm('wooden_hoe','Wooden Hoe','common',null,['Sharpness II']), h1: spot('Splash Potion of Wither III (4s)') },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon') },
  { boots: lth('boots','Leather Boots'), h0: itm('stone_hoe','Stone Hoe','uncommon',null,['Sharpness III']) },
  { chestplate: lth('chestplate','Leather Chestplate') },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection I']), h1: spot('Splash Potion of Wither III (4s)',2) },
  { leggings: lth('leggings','Leather Leggings',['Protection II']) },
  { h0: itm('iron_hoe','Iron Hoe','rare',null,['Sharpness IV']) },
  { leggings: itm('chainmail_leggings','Chainmail Leggings','uncommon') },
  { leggings: itm('chainmail_leggings','Chainmail Leggings','uncommon',null,['Protection I']) },
  { h0: itm('diamond_hoe','Diamond Hoe','legendary',null,['Sharpness V']), h1: spot('Splash Potion of Wither III (4s)',3) },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection II']), h1: spot('Splash Potion of Wither III (4s)',4) }
]),

"Shark": kit([
  { helmet: itm('shark','Shark Head','rare',null,['Protection I','Depth Strider I','Respiration X']), chestplate: lth('chestplate','Leather Chestplate'), h0: itm('ghast_tear','Shark Tooth','uncommon',null,['Sharpness II']), h1: pot('Potion of Saturation I (20m)') },
  { leggings: lth('leggings','Leather Leggings') },
  { helmet: itm('shark','Shark Head','rare',null,['Protection II','Depth Strider I','Respiration X']), h2: spot('Splash Potion of Hunger XX & Slowness I (8s)') },
  { boots: lth('boots','Leather Boots'), h0: itm('ghast_tear','Ghast Tear','uncommon',null,['Sharpness III']) },
  { h2: spot('Splash Potion of Hunger XX & Slowness I (8s)',2) },
  { helmet: itm('shark','Shark Head','rare',null,['Protection III','Depth Strider I','Respiration X']), chestplate: lth('chestplate','Leather Chestplate',['Protection I']) },
  { chestplate: lth('chestplate','Leather Chestplate',['Protection III']) },
  { helmet: itm('shark','Shark Head','rare',null,['Protection III','Depth Strider II','Respiration X']), chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon') },
  { helmet: itm('shark','Shark Head','rare',null,['Protection IV','Depth Strider II','Respiration X']), h0: itm('ghast_tear','Shark Tooth','uncommon',null,['Sharpness IV']) },
  { helmet: itm('shark','Shark Head','rare',null,['Protection V','Depth Strider II','Respiration X']), chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Protection I']), h0: itm('ghast_tear','Shark Tooth','uncommon',null,['Sharpness V']), h2: spot('Splash Potion of Hunger XX & Slowness I (8s)',3) },
  { chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Protection II']), h2: spot('Splash Potion of Hunger XX & Slowness I (8s)',4) }
]),

"RedDragon": kit([
  { helmet: lth('helmet','Leather Helmet',['Fire Protection III']), chestplate: lth('chestplate','Leather Chestplate',['Fire Protection III']), h0: itm('wooden_axe','Wooden Axe','common'), h1: itm('magma_cube_spawn_egg','Magma Cube Egg','uncommon',1), h2: spot('Splash Potion of Fire Resistance II (17s)') },
  { boots: lth('boots','Leather Boots') },
  { boots: lth('boots','Leather Boots',['Fire Protection III']), h0: itm('stone_axe','Stone Axe','uncommon'), h1: itm('magma_cube_spawn_egg','Magma Cube Egg','uncommon',2) },
  { leggings: lth('leggings','Leather Leggings'), boots: itm('iron_boots','Iron Boots','uncommon') },
  { leggings: lth('leggings','Leather Leggings',['Fire Protection III']), boots: itm('iron_boots','Iron Boots','uncommon',null,['Fire Protection III']), h2: spot('Splash Potion of Fire Resistance II (17s)',2) },
  { helmet: lth('helmet','Leather Helmet',['Protection I','Fire Protection III']), h3: itm('flint_and_steel','Flint and Steel','uncommon',null,['1 use']) },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon'), h1: itm('magma_cube_spawn_egg','Magma Cube Egg','uncommon',3), h3: itm('flint_and_steel','Flint and Steel','uncommon',null,['2 uses']) },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Fire Protection III']), h0: itm('stone_sword','Stone Sword','uncommon',null,['Unbreaking I']) },
  { chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Fire Protection III']), h0: itm('stone_sword','Stone Sword','uncommon'), h2: spot('Splash Potion of Fire Resistance II (17s)',3), h3: itm('flint_and_steel','Flint and Steel','uncommon',null,['3 uses']) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Fire Protection III']), h1: itm('magma_cube_spawn_egg','Magma Cube Egg','uncommon',4), h3: itm('flint_and_steel','Flint and Steel','uncommon',null,['5 uses']) },
  { h0: itm('iron_sword','Iron Sword','rare',null,['Unbreaking I']) }
]),

"Toxicologist": kit([
  { leggings: lth('leggings','Leather Leggings'), h0: itm('wooden_sword','Wooden Sword','common'), h1: spot('Splash Potion of Poison II (3s)',2), h2: pot('Potion of Regeneration II (6s)') },
  { boots: itm('golden_boots','Gold Boots','uncommon') },
  { chestplate: lth('chestplate','Leather Chestplate') },
  { helmet: lth('helmet','Leather Helmet'), h1: spot('Splash Potion of Poison II (3s)',3) },
  { helmet: lth('helmet','Leather Helmet',['Protection I']), chestplate: lth('chestplate','Leather Chestplate',['Protection I']), h2: pot('Potion of Regeneration II (8s)') },
  { helmet: lth('helmet','Leather Helmet',['Protection II']), chestplate: lth('chestplate','Leather Chestplate',['Protection II']), h1: spot('Splash Potion of Poison II (4s)',3) },
  { helmet: itm('golden_helmet','Gold Helmet','uncommon'), chestplate: lth('chestplate','Leather Chestplate',['Protection III']) },
  { chestplate: itm('golden_chestplate','Gold Chestplate','uncommon'), h0: itm('stone_sword','Stone Sword','uncommon',null,['Unbreaking I']) },
  { chestplate: itm('golden_chestplate','Gold Chestplate','uncommon',null,['Protection II']), h1: spot('Splash Potion of Poison II (5s)',3), h2: pot('Potion of Regeneration II (8s)',2) },
  { chestplate: itm('iron_chestplate','Iron Chestplate','uncommon'), h0: itm('stone_sword','Stone Sword','uncommon'), h1: spot('Splash Potion of Poison II (5s)',4) },
  { chestplate: itm('iron_chestplate','Iron Chestplate','uncommon',null,['Projectile Protection III']), h2: pot('Potion of Regeneration II (10s)',2) }
]),

"Donkeytamer": kit([
  { h0: itm('wooden_sword','Wooden Sword','common'), h1: itm('donkey_spawn_egg','Donkey Egg','rare',1), h2: itm('wheat','Wheat','common',2), h3: itm('saddle','Saddle','uncommon') },
  { leggings: lth('leggings','Leather Leggings'), boots: lth('boots','Leather Boots'), h2: itm('wheat','Wheat','common',4) },
  { boots: lth('boots','Leather Boots',['Protection I']), h2: itm('wheat','Wheat','common',6) },
  { leggings: lth('leggings','Leather Leggings',['Protection I']), h2: itm('wheat','Wheat','common',8) },
  { h0: itm('stone_sword','Stone Sword','uncommon',null,['Unbreaking I']), h2: itm('wheat','Wheat','common',10) },
  { boots: lth('boots','Leather Boots',['Protection II']), h2: itm('wheat','Wheat','common',12) },
  { leggings: lth('leggings','Leather Leggings',['Protection II']), h2: itm('wheat','Wheat','common',16) },
  { h0: itm('stone_sword','Stone Sword','uncommon'), h2: itm('wheat','Wheat','common',20) },
  { boots: itm('iron_boots','Iron Boots','uncommon'), h2: itm('wheat','Wheat','common',24) },
  { boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection I']), h2: itm('wheat','Wheat','common',32) },
  { boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection II']), h0: itm('iron_sword','Iron Sword','rare',null,['Unbreaking I']) }
]),

"Rogue": kit([
  { helmet: lth('helmet','Leather Helmet'), chestplate: lth('chestplate','Leather Chestplate'), boots: lth('boots','Leather Boots'), h0: itm('wooden_sword','Wooden Sword','common') },
  { h1: itm('wooden_sword','Wooden Sword','common',null,['Knockback III','1 use']) },
  { boots: lth('boots','Leather Boots',['Feather Falling II']), h2: spot('Splash Potion of Weakness III (9s)') },
  { boots: lth('boots','Leather Boots',['Feather Falling III']), h3: spot('Splash Potion of Speed I & Invisibility II (9s)') },
  { boots: itm('iron_boots','Iron Boots','uncommon',null,['Feather Falling III']), h0: itm('wooden_sword','Wooden Sword','common',null,['Knockback I']), h1: itm('wooden_sword','Wooden Sword','common',null,['Knockback IV','1 use']) },
  { h2: spot('Splash Potion of Weakness III (9s)',2), h3: spot('Splash Potion of Speed I & Invisibility II (9s)',2) },
  { h0: itm('stone_sword','Stone Sword','uncommon',null,['Knockback I']), h4: itm('bow','Bow','uncommon',null,['Punch I','3 uses']), h5: itm('arrow','Arrow','common',3) },
  { h1: itm('wooden_sword','Wooden Sword','common',null,['Knockback V','1 use']), h4: itm('bow','Bow','uncommon',null,['Power I','Punch I','4 uses']), h5: itm('arrow','Arrow','common',4) },
  { leggings: lth('leggings','Leather Leggings'), h4: itm('bow','Bow','uncommon',null,['Power I','Punch II','4 uses']), h5: itm('arrow','Arrow','common',5) },
  { h0: itm('iron_sword','Iron Sword','rare',null,['Knockback I']), h2: spot('Splash Potion of Weakness III (9s)',3), h3: spot('Splash Potion of Speed I & Invisibility II (9s)',3), h4: itm('bow','Bow','uncommon',null,['Power III','Punch III','4 uses']) },
  { boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection II','Feather Falling IV']) }
]),

"Rambo": kit([
  { h0: itm('stick', 'Stick', 'common') }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
]),

"Warlock": kit([
  { h0: itm('wooden_sword', 'Wooden Sword', 'common', null, ['Unbreaking X']), chestplate: lth('chestplate', 'Leather Chestplate', ['Unbreaking I']), boots: lth('boots', 'Leather Boots'), h1: spot('Splash Potion of Strength I & Slowness I (7s)') },
  { helmet: lth('helmet', 'Leather Helmet'), chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I', 'Unbreaking I']) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection II', 'Unbreaking X']) },
  { chestplate: itm('golden_chestplate', 'Gold Chestplate', 'uncommon', null, ['Unbreaking X']), leggings: lth('leggings', 'Leather Leggings') },
  { chestplate: itm('golden_chestplate', 'Gold Chestplate', 'uncommon', null, ['Protection I', 'Unbreaking X']), h1: spot('Splash Potion of Strength I & Slowness I (7s)', 2) },
  { chestplate: itm('golden_chestplate', 'Gold Chestplate', 'uncommon', null, ['Protection II', 'Unbreaking X']), boots: lth('boots', 'Leather Boots', ['Protection I']) },
  { chestplate: itm('iron_chestplate', 'Iron Chestplate', 'uncommon', null, ['Unbreaking X']), boots: lth('boots', 'Leather Boots', ['Protection II']) },
  { chestplate: itm('iron_chestplate', 'Iron Chestplate', 'uncommon', null, ['Protection I', 'Unbreaking X']), boots: itm('iron_boots', 'Iron Boots', 'uncommon') },
  { chestplate: itm('iron_chestplate', 'Iron Chestplate', 'uncommon', null, ['Protection II', 'Unbreaking X']) },
  { chestplate: itm('diamond_chestplate', 'Diamond Chestplate', 'legendary', null, ['Unbreaking X']), h1: spot('Splash Potion of Strength I & Slowness I (7s)', 3) },
  { h1: spot('Splash Potion of Strength I & Slowness I (7s)', 4) }
]),

"Slimey Slime": kit([
  { h0: itm('wooden_sword', 'Wooden Sword', 'common', null, ['Knockback I']), helmet: lth('helmet', 'Leather Helmet', ['Projectile Protection IV']), h1: itm('slime_spawn_egg', 'Slime Egg', 'uncommon', 1), h2: spot('Splash Potion of Slowness II (6s)') },
  { helmet: itm('iron_helmet', 'Iron Helmet', 'uncommon', null, ['Projectile Protection IV']) },
  { h1: itm('slime_spawn_egg', 'Slime Egg', 'uncommon', 2), h2: spot('Splash Potion of Slowness II (6s)', 2) },
  { boots: itm('iron_boots', 'Iron Boots', 'uncommon'), h2: spot('Splash Potion of Slowness II (8s)', 2) },
  { boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Projectile Protection IV']), h1: itm('slime_spawn_egg', 'Slime Egg', 'uncommon', 3) },
  { chestplate: lth('chestplate', 'Leather Chestplate') },
  { h0: itm('iron_axe', 'Iron Axe', 'rare', null, ['Knockback I']), h2: spot('Splash Potion of Slowness II (8s)', 3) },
  { leggings: lth('leggings', 'Leather Leggings') },
  { boots: itm('diamond_boots', 'Diamond Boots', 'legendary', null, ['Projectile Protection IV']), h1: itm('slime_spawn_egg', 'Slime Egg', 'uncommon', 4), h2: spot('Splash Potion of Slowness II (8s)', 4) },
  { h0: itm('diamond_axe', 'Diamond Axe', 'legendary', null, ['Knockback I']), boots: itm('diamond_boots', 'Diamond Boots', 'legendary', null, ['Projectile Protection IV', 'Feather Falling II']) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I']), leggings: lth('leggings', 'Leather Leggings', ['Protection I']) }
]),

"Golem": kit([
  { h0: itm('wooden_axe', 'Wooden Axe', 'common'), chestplate: lth('chestplate', 'Leather Chestplate', ['Unbreaking III']), boots: lth('boots', 'Leather Boots', ['Unbreaking III']) },
  { h1: spot('Splash Potion of Absorption I (3s)') },
  { h2: itm('golden_apple', 'Golden Apple', 'rare', 1) },
  { h0: itm('wooden_axe', 'Wooden Axe', 'common', null, ['Unbreaking X']) },
  { h0: itm('stone_axe', 'Stone Axe', 'uncommon') },
  { h0: itm('iron_axe', 'Iron Axe', 'rare') },
  { boots: lth('boots', 'Leather Boots', ['Protection I', 'Unbreaking III']), h1: spot('Splash Potion of Absorption I (3s)', 2) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I', 'Unbreaking III']), h1: spot('Splash Potion of Absorption I (5s)', 2) },
  { chestplate: itm('chainmail_chestplate', 'Chainmail Chestplate', 'uncommon', null, ['Protection I', 'Unbreaking III']) },
  { h0: itm('iron_axe', 'Iron Axe', 'rare', null, ['Sharpness I']), boots: itm('chainmail_boots', 'Chainmail Boots', 'uncommon', null, ['Protection I', 'Unbreaking III']), h1: spot('Splash Potion of Absorption I (7s)', 2) },
  { h1: spot('Splash Potion of Absorption I (7s)', 3) }
]),

"Viking": kit([
  { h0: itm('wooden_axe', 'Wooden Axe', 'common'), helmet: lth('helmet', 'Leather Helmet'), chestplate: lth('chestplate', 'Leather Chestplate'), boots: lth('boots', 'Leather Boots'), h1: itm('oak_boat', 'Boat', 'common'), h2: itm('cooked_cod', 'Cooked Fish', 'common', 2) },
  { helmet: lth('helmet', 'Leather Helmet', ['Protection I']), h2: itm('cooked_cod', 'Cooked Fish', 'common', 4) },
  { h0: itm('stone_axe', 'Stone Axe', 'uncommon'), h2: itm('cooked_cod', 'Cooked Fish', 'common', 6) },
  { boots: lth('boots', 'Leather Boots', ['Protection I']), h2: itm('cooked_cod', 'Cooked Fish', 'common', 8) },
  { helmet: lth('helmet', 'Leather Helmet', ['Protection II']), boots: lth('boots', 'Leather Boots', ['Protection II']), h2: itm('cooked_cod', 'Cooked Fish', 'common', 10) },
  { helmet: itm('iron_helmet', 'Iron Helmet', 'uncommon'), boots: itm('iron_boots', 'Iron Boots', 'uncommon'), h2: itm('cooked_cod', 'Cooked Fish', 'common', 12) },
  { h0: itm('iron_axe', 'Iron Axe', 'rare'), helmet: itm('iron_helmet', 'Iron Helmet', 'uncommon', null, ['Protection I']), h2: itm('cooked_cod', 'Cooked Fish', 'common', 14) },
  { helmet: itm('iron_helmet', 'Iron Helmet', 'uncommon', null, ['Protection II']), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Protection I']), h2: itm('cooked_cod', 'Cooked Fish', 'common', 16) },
  { helmet: itm('iron_helmet', 'Iron Helmet', 'uncommon', null, ['Protection III']), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Protection II']), h2: itm('cooked_cod', 'Cooked Fish', 'common', 18) },
  { h0: itm('diamond_axe', 'Diamond Axe', 'legendary'), leggings: lth('leggings', 'Leather Leggings'), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Protection III']), h2: itm('cooked_cod', 'Cooked Fish', 'common', 20) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection II']), h2: itm('cooked_cod', 'Cooked Fish', 'common', 24) }
]),

"Shadow Knight": kit([
  { h0: itm('wooden_axe', 'Wooden Axe', 'common'), helmet: itm('wither_skeleton_skull', 'Shadow Knight Head', 'rare', null, ['Protection I', 'Feather Falling I']), leggings: lth('leggings', 'Leather Leggings'), boots: lth('boots', 'Leather Boots') },
  { h0: itm('wooden_sword', 'Wooden Sword', 'common'), helmet: itm('wither_skeleton_skull', 'Shadow Knight Head', 'rare', null, ['Protection II', 'Feather Falling I']) },
  { helmet: itm('wither_skeleton_skull', 'Shadow Knight Head', 'rare', null, ['Protection III', 'Feather Falling I']), h1: spot('Splash Potion of Blindness (6s)') },
  { chestplate: lth('chestplate', 'Leather Chestplate') },
  { helmet: itm('wither_skeleton_skull', 'Shadow Knight Head', 'rare', null, ['Protection III', 'Feather Falling II']), leggings: lth('leggings', 'Leather Leggings', ['Protection I']) },
  { leggings: itm('golden_leggings', 'Gold Leggings', 'uncommon') },
  { h0: itm('stone_sword', 'Stone Sword', 'uncommon', null, ['Unbreaking I']), h1: spot('Splash Potion of Blindness (6s)', 2) },
  { helmet: itm('wither_skeleton_skull', 'Shadow Knight Head', 'rare', null, ['Protection III', 'Feather Falling III']) },
  { helmet: itm('wither_skeleton_skull', 'Shadow Knight Head', 'rare', null, ['Protection IV', 'Feather Falling III']), leggings: itm('golden_leggings', 'Gold Leggings', 'uncommon', null, ['Protection I']), h1: spot('Splash Potion of Blindness (7s)', 3) },
  { h0: itm('iron_sword', 'Iron Sword', 'rare', null, ['Unbreaking I']), helmet: itm('wither_skeleton_skull', 'Shadow Knight Head', 'rare', null, ['Protection V', 'Feather Falling IV']), leggings: itm('chainmail_leggings', 'Chainmail Leggings', 'uncommon') },
  { h1: spot('Splash Potion of Blindness (7s)', 4) }
]),

"Pigman": kit([
  { h0: itm('golden_sword', 'Gold Sword', 'uncommon', null, ['Unbreaking X']), leggings: lth('leggings', 'Leather Leggings', ['Unbreaking I']), boots: lth('boots', 'Leather Boots', ['Unbreaking I']), h1: spot('Splash Potion of Harming I') },
  { helmet: lth('helmet', 'Leather Helmet', ['Unbreaking I']) },
  { h1: spot('Splash Potion of Harming I', 2) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Unbreaking I']) },
  { h0: itm('golden_sword', 'Gold Sword', 'uncommon', null, ['Sharpness I', 'Unbreaking X']) },
  { helmet: lth('helmet', 'Leather Helmet', ['Protection I', 'Unbreaking I']) },
  { helmet: lth('helmet', 'Leather Helmet', ['Protection II', 'Unbreaking I']), boots: lth('boots', 'Leather Boots', ['Protection I', 'Unbreaking I']) },
  { helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Unbreaking I']), chestplate: lth('chestplate', 'Leather Chestplate', ['Fire Protection I', 'Unbreaking I']) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Fire Protection II', 'Unbreaking I']), boots: itm('golden_boots', 'Gold Boots', 'uncommon', null, ['Protection I', 'Unbreaking I']) },
  { h0: itm('golden_sword', 'Gold Sword', 'uncommon', null, ['Sharpness II', 'Unbreaking X']), helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Protection II', 'Unbreaking I']), chestplate: lth('chestplate', 'Leather Chestplate', ['Fire Protection III', 'Unbreaking I']) },
  { helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Protection III', 'Unbreaking I']), h1: spot('Splash Potion of Harming I', 3) }
]),

"Phoenix": kit([
  { h0: itm('bow', 'Bow', 'uncommon'), helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon'), chestplate: lth('chestplate', 'Leather Chestplate', ['Unbreaking I']), leggings: lth('leggings', 'Leather Leggings', ['Unbreaking I']), boots: itm('golden_boots', 'Gold Boots', 'uncommon'), h1: itm('arrow', 'Arrow', 'common', 3) },
  { boots: itm('golden_boots', 'Gold Boots', 'uncommon', null, ['Protection I']) },
  { helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Protection I']), h1: itm('arrow', 'Arrow', 'common', 6) },
  { boots: itm('golden_boots', 'Gold Boots', 'uncommon', null, ['Protection II']) },
  { h0: itm('bow', 'Bow', 'rare', null, ['Flame I', '9 uses']), h1: itm('arrow', 'Arrow', 'common', 8) },
  { helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Protection I', 'Fire Protection I']), chestplate: lth('chestplate', 'Leather Chestplate'), leggings: lth('leggings', 'Leather Leggings') },
  { h0: itm('bow', 'Bow', 'rare', null, ['Flame I', '10 uses']), helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Protection I', 'Fire Protection II']), h1: itm('arrow', 'Arrow', 'common', 9) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Fire Protection I']), boots: itm('golden_boots', 'Gold Boots', 'uncommon', null, ['Protection III']) },
  { h0: itm('golden_sword', 'Gold Sword', 'uncommon', null, ['Unbreaking I']), h1: itm('bow', 'Bow', 'rare', null, ['Flame I', '11 uses']), helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Protection I', 'Fire Protection III']), leggings: lth('leggings', 'Leather Leggings', ['Fire Protection I']), h2: itm('arrow', 'Arrow', 'common', 10) },
  { h0: itm('golden_sword', 'Gold Sword', 'rare', null, ['Sharpness I', 'Unbreaking I']), boots: itm('golden_boots', 'Gold Boots', 'uncommon', null, ['Protection IV']) },
  { h0: itm('golden_sword', 'Gold Sword', 'rare', null, ['Sharpness I', 'Unbreaking III']), h1: itm('bow', 'Bow', 'rare', null, ['Flame I', '13 uses']), chestplate: itm('golden_chestplate', 'Gold Chestplate', 'uncommon'), h2: itm('arrow', 'Arrow', 'common', 12) }
]),

"Paladin": kit([
  { h0: itm('wooden_sword', 'Wooden Sword', 'common'), helmet: lth('helmet', 'Leather Helmet', ['Unbreaking I']), chestplate: lth('chestplate', 'Leather Chestplate', ['Unbreaking I']), h1: spot('Splash Potion of Healing I') },
  { helmet: itm('iron_helmet', 'Iron Helmet', 'uncommon', null, ['Unbreaking I']) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I', 'Unbreaking I']) },
  { chestplate: itm('chainmail_chestplate', 'Chainmail Chestplate', 'uncommon', null, ['Unbreaking I']) },
  { h1: spot('Splash Potion of Healing I', 2) },
  { h0: itm('stone_sword', 'Stone Sword', 'uncommon', null, ['Unbreaking I']) },
  { chestplate: itm('chainmail_chestplate', 'Chainmail Chestplate', 'uncommon', null, ['Protection I', 'Unbreaking I']) },
  { chestplate: itm('iron_chestplate', 'Iron Chestplate', 'uncommon', null, ['Unbreaking I']) },
  { helmet: itm('iron_helmet', 'Iron Helmet', 'uncommon'), h1: spot('Splash Potion of Healing I', 3) },
  { h0: itm('iron_sword', 'Iron Sword', 'rare', null, ['Unbreaking I']), helmet: itm('iron_helmet', 'Iron Helmet', 'uncommon', null, ['Protection I', 'Unbreaking I']), chestplate: itm('iron_chestplate', 'Iron Chestplate', 'uncommon') },
  { chestplate: itm('iron_chestplate', 'Iron Chestplate', 'uncommon', null, ['Protection II', 'Unbreaking I']) }
]),

"Necromancer": kit([
  { h0: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '10 uses']), helmet: itm('chainmail_helmet', 'Chainmail Helmet', 'uncommon'), boots: itm('chainmail_boots', 'Chainmail Boots', 'uncommon'), h1: itm('zombie_spawn_egg', 'Zombie Egg', 'uncommon', 1), h2: itm('arrow', 'Arrow', 'common', 10) },
  { h0: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '11 uses']), boots: itm('chainmail_boots', 'Chainmail Boots', 'uncommon', null, ['Projectile Protection I']), h2: itm('skeleton_spawn_egg', 'Skeleton Egg', 'uncommon', 1), h3: itm('arrow', 'Arrow', 'common', 11) },
  { h0: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '12 uses']), helmet: itm('chainmail_helmet', 'Chainmail Helmet', 'uncommon', null, ['Projectile Protection I']), h3: itm('arrow', 'Arrow', 'common', 12) },
  { h0: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '13 uses']), leggings: itm('chainmail_leggings', 'Chainmail Leggings', 'uncommon'), h3: itm('arrow', 'Arrow', 'common', 13) },
  { h0: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '14 uses']), leggings: itm('chainmail_leggings', 'Chainmail Leggings', 'uncommon', null, ['Projectile Protection I']), h3: itm('arrow', 'Arrow', 'common', 14) },
  { h0: itm('iron_shovel', 'Iron Shovel', 'uncommon'), h1: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '15 uses']), h2: itm('skeleton_spawn_egg', 'Skeleton Egg', 'uncommon', 1), h3: itm('zombie_spawn_egg', 'Zombie Egg', 'uncommon', 1), h4: itm('arrow', 'Arrow', 'common', 15) },
  { h1: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '16 uses']), h3: itm('zombie_spawn_egg', 'Zombie Egg', 'uncommon', 2), h4: itm('arrow', 'Arrow', 'common', 16) },
  { h0: itm('diamond_shovel', 'Diamond Shovel', 'rare'), h1: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '17 uses']), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Projectile Protection I']), h4: itm('arrow', 'Arrow', 'common', 17) },
  { h1: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '18 uses']), chestplate: itm('chainmail_chestplate', 'Chainmail Chestplate', 'uncommon'), h4: itm('arrow', 'Arrow', 'common', 18) },
  { h0: itm('diamond_shovel', 'Diamond Shovel', 'rare', null, ['Sharpness I']), h1: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '19 uses']), chestplate: itm('chainmail_chestplate', 'Chainmail Chestplate', 'uncommon', null, ['Projectile Protection I']), h2: itm('skeleton_spawn_egg', 'Skeleton Egg', 'uncommon', 2), h4: itm('arrow', 'Arrow', 'common', 19) },
  { h1: itm('bow', 'Bow', 'uncommon', null, ['Punch I', '20 uses']), h3: itm('zombie_spawn_egg', 'Zombie Egg', 'uncommon', 3), h4: itm('arrow', 'Arrow', 'common', 20) }
]),

"Warrior": kit([
  { h0: itm('stone_axe', 'Stone Axe', 'uncommon', null, ['Sharpness I']), chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I']), boots: lth('boots', 'Leather Boots', ['Protection I']), h1: spot('Splash Potion of Speed I & Regen I (4s)'), h2: itm('cooked_beef', 'Steak', 'common', 1) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection II']), h2: itm('cooked_beef', 'Steak', 'common', 2) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection III']), boots: itm('golden_boots', 'Gold Boots', 'uncommon', null, ['Protection I']), h1: spot('Splash Potion of Speed I & Regen I (6s)'), h2: itm('cooked_beef', 'Steak', 'common', 3) },
  { chestplate: itm('golden_chestplate', 'Gold Chestplate', 'uncommon'), h2: itm('cooked_beef', 'Steak', 'common', 4) },
  { h0: itm('wooden_sword', 'Wooden Sword', 'common', null, ['Sharpness I']), h1: spot('Splash Potion of Speed I & Regen I (6s)', 2), h2: itm('cooked_beef', 'Steak', 'common', 5) },
  { boots: itm('golden_boots', 'Gold Boots', 'uncommon', null, ['Protection II']), h2: itm('cooked_beef', 'Steak', 'common', 6) },
  { h0: itm('wooden_sword', 'Wooden Sword', 'common', null, ['Sharpness I']), chestplate: itm('chainmail_chestplate', 'Chainmail Chestplate', 'uncommon', null, ['Protection I']), boots: itm('iron_boots', 'Iron Boots', 'uncommon'), h1: spot('Splash Potion of Speed I & Regen I (8s)', 2), h2: itm('cooked_beef', 'Steak', 'common', 8) },
  { chestplate: itm('chainmail_chestplate', 'Chainmail Chestplate', 'uncommon', null, ['Protection II']), h1: spot('Splash Potion of Speed I & Regen I (8s)', 3), h2: itm('cooked_beef', 'Steak', 'common', 10) },
  { h0: itm('iron_axe', 'Iron Axe', 'rare', null, ['Sharpness I']), h2: itm('cooked_beef', 'Steak', 'common', 12) },
  { h0: itm('stone_sword', 'Stone Sword', 'uncommon', null, ['Sharpness I']), chestplate: itm('iron_chestplate', 'Iron Chestplate', 'uncommon'), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Protection I']), h1: spot('Splash Potion of Speed I & Regen I (10s)', 3), h2: itm('cooked_beef', 'Steak', 'common', 16) },
  { h1: spot('Splash Potion of Speed I & Regen I (10s)', 4), h2: itm('cooked_beef', 'Steak', 'common', 32) }
]),

"Milkman": kit([
  { h0: itm('wooden_axe', 'Wooden Axe', 'common', null, ['Looting I']), helmet: lth('helmet', 'Leather Helmet'), h1: itm('milk_bucket', 'Milk Bucket', 'common'), h2: pot('Potion of Milk') },
  { boots: lth('boots', 'Leather Boots') },
  { helmet: lth('helmet', 'Leather Helmet', ['Protection I', 'Unbreaking I']) },
  { h0: itm('stone_axe', 'Stone Axe', 'uncommon', null, ['Looting I']), leggings: lth('leggings', 'Leather Leggings') },
  { h2: pot('Potion of Milk', 2) },
  { chestplate: lth('chestplate', 'Leather Chestplate') },
  { h0: itm('iron_axe', 'Iron Axe', 'rare', null, ['Looting I']) },
  { helmet: lth('helmet', 'Leather Helmet', ['Protection II', 'Unbreaking I']), h2: pot('Potion of Milk', 3) },
  { helmet: lth('helmet', 'Leather Helmet', ['Protection III', 'Unbreaking I']), boots: itm('iron_boots', 'Iron Boots', 'uncommon'), h2: pot('Potion of Milk', 4) },
  { h0: itm('iron_axe', 'Iron Axe', 'rare', null, ['Sharpness I', 'Looting I']), helmet: lth('helmet', 'Leather Helmet', ['Protection IV', 'Unbreaking I']) },
  { boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Protection I']), h2: pot('Potion of Milk', 5) }
]),

"Florist": kit([
  { h0: itm('wooden_axe', 'Wooden Axe', 'common', null, ['Thorns I']), helmet: lth('helmet', 'Leather Helmet', ['Unbreaking X', 'Thorns I']), boots: lth('boots', 'Leather Boots', ['Unbreaking X', 'Thorns I']), h1: itm('poppy', 'Rose', 'common', 1, ['Knockback I']), h2: itm('melon_slice', 'Melon', 'common', 4) },
  { leggings: lth('leggings', 'Leather Leggings') },
  { chestplate: lth('chestplate', 'Leather Chestplate'), leggings: lth('leggings', 'Leather Leggings', ['Unbreaking X', 'Thorns I']) },
  { h0: itm('stone_axe', 'Stone Axe', 'uncommon', null, ['Thorns I']), h2: itm('melon_slice', 'Melon', 'common', 6) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Unbreaking X', 'Thorns I']), boots: itm('iron_boots', 'Iron Boots', 'uncommon'), h2: itm('melon_slice', 'Melon', 'common', 8) },
  { leggings: itm('golden_leggings', 'Gold Leggings', 'uncommon', null, ['Unbreaking X', 'Thorns I']), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Unbreaking X', 'Thorns I']), h2: itm('melon_slice', 'Melon', 'common', 12) },
  { h0: itm('iron_axe', 'Iron Axe', 'rare', null, ['Thorns I']), h2: itm('melon_slice', 'Melon', 'common', 16) },
  { h0: itm('iron_axe', 'Iron Axe', 'rare', null, ['Thorns II']), leggings: itm('chainmail_leggings', 'Chainmail Leggings', 'uncommon'), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Unbreaking X', 'Thorns II']), h2: itm('melon_slice', 'Melon', 'common', 20) },
  { leggings: itm('chainmail_leggings', 'Chainmail Leggings', 'uncommon', null, ['Unbreaking X', 'Thorns I']), h2: itm('melon_slice', 'Melon', 'common', 24) },
  { h0: itm('diamond_axe', 'Diamond Axe', 'legendary', null, ['Thorns II']), helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Unbreaking X', 'Thorns I']), leggings: itm('chainmail_leggings', 'Chainmail Leggings', 'uncommon', null, ['Protection I', 'Unbreaking X', 'Thorns II']), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Protection I', 'Unbreaking X', 'Thorns II']), h2: itm('melon_slice', 'Melon', 'common', 32) },
  { helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Protection I', 'Unbreaking X', 'Thorns II']), chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I', 'Unbreaking X', 'Thorns II']) }
]),

"Diver": kit([
  { h0: itm('wooden_axe', 'Wooden Axe', 'common'), helmet: lth('helmet', 'Leather Helmet', ['Respiration I', 'Aqua Affinity I']), boots: lth('boots', 'Leather Boots', ['Depth Strider I']) },
  { h0: itm('wooden_sword', 'Wooden Sword', 'common') },
  { boots: itm('golden_boots', 'Gold Boots', 'uncommon', null, ['Depth Strider I']) },
  { helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Respiration II', 'Aqua Affinity I']) },
  { leggings: lth('leggings', 'Leather Leggings'), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Depth Strider II']) },
  { helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Respiration III', 'Aqua Affinity I']), chestplate: lth('chestplate', 'Leather Chestplate') },
  { h0: itm('stone_sword', 'Stone Sword', 'uncommon', null, ['Unbreaking I']), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Protection I', 'Depth Strider II']) },
  { helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Protection I', 'Respiration III', 'Aqua Affinity I']), boots: itm('diamond_boots', 'Diamond Boots', 'legendary', null, ['Protection I', 'Depth Strider II']) },
  { boots: itm('diamond_boots', 'Diamond Boots', 'legendary', null, ['Protection II', 'Depth Strider II']) },
  { helmet: itm('golden_helmet', 'Gold Helmet', 'uncommon', null, ['Protection II', 'Respiration III', 'Aqua Affinity I']), boots: itm('diamond_boots', 'Diamond Boots', 'legendary', null, ['Protection II', 'Depth Strider III']) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I']), leggings: lth('leggings', 'Leather Leggings', ['Protection I']) }
]),

"Arachnologist": kit([
  { h0: itm('wooden_axe', 'Wooden Axe', 'common'), helmet: lth('helmet', 'Leather Helmet'), leggings: lth('leggings', 'Leather Leggings'), boots: lth('boots', 'Leather Boots'), h1: itm('spider_spawn_egg', 'Spider Egg', 'uncommon', 1) },
  { h1: itm('spider_spawn_egg', 'Spider Egg', 'uncommon', 2) },
  { chestplate: lth('chestplate', 'Leather Chestplate') },
  { h0: itm('stone_axe', 'Stone Axe', 'uncommon'), h1: itm('spider_spawn_egg', 'Spider Egg', 'uncommon', 3) },
  { helmet: itm('iron_helmet', 'Iron Helmet', 'uncommon') },
  { h0: itm('stone_sword', 'Stone Sword', 'uncommon', null, ['Unbreaking I']) },
  { boots: itm('iron_boots', 'Iron Boots', 'uncommon') },
  { leggings: itm('golden_leggings', 'Gold Leggings', 'uncommon') },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I']), h1: itm('spider_spawn_egg', 'Spider Egg', 'uncommon', 4) },
  { h0: itm('iron_sword', 'Iron Sword', 'rare', null, ['Unbreaking I']), leggings: itm('chainmail_leggings', 'Chainmail Leggings', 'uncommon'), h1: itm('spider_spawn_egg', 'Spider Egg', 'uncommon', 5) },
  { chestplate: itm('iron_chestplate', 'Iron Chestplate', 'uncommon') }
]),

"Blaze": kit([
  { h0: itm('wooden_sword', 'Wooden Sword', 'common'), h1: itm('stone_axe', 'Stone Axe', 'uncommon', null, ['Fire Aspect I', '1 use']), boots: lth('boots', 'Leather Boots', ['Fire Protection II']), h2: itm('blaze_spawn_egg', 'Blaze Egg', 'rare', 1) },
  { h2: itm('blaze_spawn_egg', 'Blaze Egg', 'rare', 2) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Fire Protection I']) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Fire Protection II']) },
  { leggings: lth('leggings', 'Leather Leggings', ['Fire Protection I']) },
  { h0: itm('stone_sword', 'Stone Sword', 'uncommon', null, ['Unbreaking I']) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I', 'Fire Protection III']) },
  { chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I', 'Fire Protection IV']), h1: itm('stone_axe', 'Stone Axe', 'uncommon', null, ['Fire Aspect I', '3 uses']), h2: itm('blaze_spawn_egg', 'Blaze Egg', 'rare', 3) },
  { helmet: lth('helmet', 'Leather Helmet', ['Fire Protection II']), chestplate: itm('golden_chestplate', 'Gold Chestplate', 'uncommon', null, ['Fire Protection V']), h1: itm('stone_axe', 'Stone Axe', 'uncommon', null, ['Fire Aspect I', '4 uses']) },
  { h0: itm('iron_sword', 'Iron Sword', 'rare', null, ['Unbreaking I']), chestplate: itm('iron_chestplate', 'Iron Chestplate', 'uncommon', null, ['Fire Protection X']), h1: itm('stone_axe', 'Stone Axe', 'uncommon', null, ['Fire Aspect I', '5 uses']) },
  { h1: itm('stone_axe', 'Stone Axe', 'uncommon', null, ['Fire Aspect I', '6 uses']), h2: itm('blaze_spawn_egg', 'Blaze Egg', 'rare', 4) }
]),

"Wolftamer": kit([
  { h0: itm('wooden_axe', 'Wooden Axe', 'common'), boots: itm('chainmail_boots', 'Chainmail Boots', 'uncommon'), h1: itm('wolf_spawn_egg', 'Wolf Egg', 'uncommon', 1), h2: itm('bone', 'Bone', 'common', 10) },
  { boots: itm('chainmail_boots', 'Chainmail Boots', 'uncommon', null, ['Protection I']) },
  { boots: itm('chainmail_boots', 'Chainmail Boots', 'uncommon', null, ['Protection II']), h1: itm('wolf_spawn_egg', 'Wolf Egg', 'uncommon', 2), h2: itm('bone', 'Bone', 'common', 12) },
  { boots: itm('iron_boots', 'Iron Boots', 'uncommon') },
  { h0: itm('stone_axe', 'Stone Axe', 'uncommon'), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Protection I']), h1: itm('wolf_spawn_egg', 'Wolf Egg', 'uncommon', 3), h2: itm('bone', 'Bone', 'common', 14) },
  { helmet: lth('helmet', 'Leather Helmet'), boots: itm('iron_boots', 'Iron Boots', 'uncommon', null, ['Protection II']) },
  { leggings: lth('leggings', 'Leather Leggings'), boots: itm('diamond_boots', 'Diamond Boots', 'legendary') },
  { chestplate: lth('chestplate', 'Leather Chestplate'), boots: itm('diamond_boots', 'Diamond Boots', 'legendary', null, ['Protection II']), h1: itm('wolf_spawn_egg', 'Wolf Egg', 'uncommon', 4), h2: itm('bone', 'Bone', 'common', 18) },
  { boots: itm('diamond_boots', 'Diamond Boots', 'legendary', null, ['Protection III']) },
  { h0: itm('iron_axe', 'Iron Axe', 'rare'), boots: itm('diamond_boots', 'Diamond Boots', 'legendary', null, ['Protection IV']), h2: itm('bone', 'Bone', 'common', 20) },
  { h0: itm('stone_sword', 'Stone Sword', 'uncommon'), h1: itm('wolf_spawn_egg', 'Wolf Egg', 'uncommon', 5) }
]),

"Tim": kit([
  { h0: itm('wooden_sword', 'Wooden Sword', 'common'), leggings: lth('leggings', 'Leather Leggings'), h1: itm('experience_bottle', 'EXP Bottle', 'common', 3), h2: itm('apple', 'Apple', 'common', 2) },
  { leggings: itm('golden_leggings', 'Gold Leggings', 'uncommon') },
  { leggings: itm('chainmail_leggings', 'Chainmail Leggings', 'uncommon'), h1: itm('experience_bottle', 'EXP Bottle', 'common', 6), h2: itm('apple', 'Apple', 'common', 3) },
  { leggings: itm('chainmail_leggings', 'Chainmail Leggings', 'uncommon', null, ['Protection I']) },
  { leggings: itm('iron_leggings', 'Iron Leggings', 'uncommon'), h1: itm('experience_bottle', 'EXP Bottle', 'common', 9) },
  { chestplate: lth('chestplate', 'Leather Chestplate'), h1: itm('experience_bottle', 'EXP Bottle', 'common', 12), h2: itm('apple', 'Apple', 'common', 4) },
  { h0: itm('stone_sword', 'Stone Sword', 'uncommon', null, ['Unbreaking I']) },
  { leggings: itm('iron_leggings', 'Iron Leggings', 'uncommon', null, ['Protection I']), h1: itm('experience_bottle', 'EXP Bottle', 'common', 15) },
  { leggings: itm('iron_leggings', 'Iron Leggings', 'uncommon', null, ['Protection II']) },
  { h0: itm('stone_sword', 'Stone Sword', 'uncommon'), h3: itm('rabbit_spawn_egg', 'Rabbit Egg', 'uncommon'), leggings: itm('diamond_leggings', 'Diamond Leggings', 'legendary'), boots: lth('boots', 'Leather Boots'), h1: itm('experience_bottle', 'EXP Bottle', 'common', 18), h2: itm('apple', 'Apple', 'common', 5) },
  { h0: itm('stone_sword', 'Stone Sword', 'uncommon', null, ['Unbreaking I']), h1: itm('experience_bottle', 'EXP Bottle', 'common', 24) }
])

};

// --- BIND PRE-BAKED LEATHER ARMOUR ---
for (const [kitName, levels] of Object.entries(window.KIT_DATABASE)) {
  const applyCustomImg = (item, slotName) => {
    if (!item || !item.id || !item.id.startsWith('leather_')) return;

    let searchKey = kitName;
    
    // Fallback for SlimeySlime typo in your list vs kit name
    if (searchKey === 'Slimey Slime') searchKey = 'SlimeySlime';

    // Make safe: e.g., 'armorerhelmet', 'hypetrain', 'archer'
    const safeKey = searchKey.toLowerCase().replace(/\s+/g, '');
    
    // Maps to: img/blitz/leather_armor/paladin_leather_chestplate.png
    // Or: img/blitz/leather_armor/armorerhelmet_leather_helmet.png
    item.customImg = `img/blitz/leather_armor/${safeKey}_${item.id}.png`;
  };

  levels.forEach(lvl => {
    // Process equipped armour slots
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
        applyCustomImg(lvl.armour[slot], slot);
    });

    // Process inventory/hotbar items. If leather is unequipped, we guess the slot based on the item ID.
    const guessSlotAndApply = (item) => {
        if (!item || !item.id || !item.id.startsWith('leather_')) return;
        const guessedSlot = item.id.split('_')[1]; // e.g., 'leather_helmet' -> 'helmet'
        applyCustomImg(item, guessedSlot);
    };

    lvl.hotbar.forEach(guessSlotAndApply);
    lvl.inv.forEach(guessSlotAndApply);
  });
}
