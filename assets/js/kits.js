"use strict";

// ── Item constructors ────────────────────────────────────────────────────────
function itm(id, name, rarity = 'common', stack = null, enchants = [], leatherDye = null) {
  const lines = enchants.map(e => ({ text: e, cls: 'c-grey' }));
  const enchanted = enchants.length > 0;
  return { id, name, rarity, stack, lines, enchanted, customImg: null, leatherDye };
}

const _LIDS = { helmet:'leather_helmet', chestplate:'leather_chestplate', leggings:'leather_leggings', boots:'leather_boots' };
function _lth(slot, name, dye, enchants = []) { return itm(_LIDS[slot], name, 'common', null, enchants, dye); }
function lth(slot, name, enchants = []) { return _lth(slot, name, 'white', enchants); }
function lim(slot, name, enchants = []) { return _lth(slot, name, 'lime',  enchants); }
function grn(slot, name, enchants = []) { return _lth(slot, name, 'green', enchants); }

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
  { helmet: lth('helmet','Leather Helmet'), boots: _lth('boots', 'Leather Boots', '#55aa55'), h0: itm('bow','Bow','uncommon'), h1: itm('arrow','Arrow','common',16) },
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
  { helmet: lth('helmet','Leather Helmet'), boots: lth('boots','Leather Boots'), h0: itm('wooden_axe','Wooden Axe','common',null,['Infinity I']), h1: itm('horse_spawn_egg','Horse Spawn Egg','rare'), h2: itm('apple','Apple','common',3), h3: itm('saddle','Saddle','uncommon') },
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
  { helmet: lth('helmet','Leather Helmet'), boots: lth('boots','Leather Boots'), h0: itm('wooden_sword','Wooden Sword','common',null,['Looting I']), h1: itm('cow_spawn_egg','Cow Spawn Egg','uncommon',2), h2: itm('cooked_beef','Steak','common',2) },
  { helmet: lth('helmet','Leather Helmet',['Protection I']), boots: lth('boots','Leather Boots',['Protection I']), h2: itm('cooked_beef','Steak','common',4) },
  { helmet: lth('helmet','Leather Helmet',['Protection II']), boots: itm('iron_boots','Iron Boots','uncommon'), h1: itm('cow_spawn_egg','Cow Spawn Egg','uncommon',3), h2: itm('cooked_beef','Steak','common',6) },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon'), h2: itm('cooked_beef','Steak','common',8) },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection I']), h0: itm('wooden_sword','Wooden Sword','common',null,['Looting II']), h2: itm('cooked_beef','Steak','common',10) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary'), h2: itm('cooked_beef','Steak','common',12) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection I']), h0: itm('stone_sword','Stone Sword','uncommon',null,['Looting II']), h1: itm('cow_spawn_egg','Cow Spawn Egg','uncommon',4), h2: itm('cooked_beef','Steak','common',16) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection II']), h2: itm('cooked_beef','Steak','common',20) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection III']), h0: itm('stone_sword','Stone Sword','uncommon',null,['Looting III']), h1: itm('cow_spawn_egg','Cow Spawn Egg','uncommon',5), h2: itm('cooked_beef','Steak','common',24) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection IV']), h0: itm('iron_sword','Iron Sword','rare',null,['Looting III']), h2: itm('cooked_beef','Steak','common',28), h3: itm('pig_spawn_egg','Pig Spawn Egg','uncommon'), h4: itm('saddle','Saddle','uncommon'), h5: itm('carrot_on_a_stick','Carrot on a Stick','uncommon') },
  { boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection I']), h1: itm('cow_spawn_egg','Cow Spawn Egg','uncommon',6), h2: itm('cooked_beef','Steak','common',32) }
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
  { helmet: itm('iron_helmet','Iron Helmet','uncommon'), boots: lth('boots','Leather Boots'), h0: itm('iron_pickaxe','Iron Pickaxe','uncommon'), h1: itm('bowl','Bowl','common'), h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',1) },
  { boots: lth('boots','Leather Boots',['Protection I']) },
  { boots: lth('boots','Leather Boots',['Protection II']), h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',2) },
  { boots: itm('iron_boots','Iron Boots','uncommon') },
  { chestplate: lth('chestplate','Leather Chestplate'), h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',3) },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection I']), leggings: lth('leggings','Leather Leggings') },
  { helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection II']), boots: itm('iron_boots','Iron Boots','uncommon',null,['Projectile Protection I']), h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',1) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary'), chestplate: lth('chestplate','Leather Chestplate'), h0: itm('iron_pickaxe','Iron Pickaxe','uncommon',null,['Sharpness I']), h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',4) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection I']), chestplate: lth('chestplate','Leather Chestplate',['Protection I']), leggings: lth('leggings','Leather Leggings',['Protection I']) },
  { helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection II']), chestplate: lth('chestplate','Leather Chestplate',['Protection II']), leggings: lth('leggings','Leather Leggings',['Protection II']), boots: itm('iron_boots','Iron Boots','uncommon',null,['Projectile Protection II']), h0: itm('diamond_pickaxe','Diamond Pickaxe','legendary',null,['Sharpness I']), h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',5) },
  { chestplate: itm('golden_chestplate','Golden Chestplate','uncommon'), leggings: lth('leggings','Leather Leggings',['Protection I']), boots: itm('iron_boots','Iron Boots','uncommon',null,['Projectile Protection III']) }
])

};
