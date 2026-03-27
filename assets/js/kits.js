// =============================================================================
// KIT DATA — kit-data.js
// =============================================================================
//
// FORMAT OVERVIEW
// ───────────────
// Each kit is an array of 11 entries (levels I–X + Prestige II).
// Instead of repeating every slot on every level, each entry is a PATCH —
// only the keys that CHANGE from the previous level need to be listed.
// Unchanged slots are inherited automatically via applyPatch().
//
// SLOT KEYS
//   Armour:  "helmet" | "chestplate" | "leggings" | "boots"
//   Hotbar:  "h0"–"h7"   (h8 is always the compass, auto-filled)
//   Inv:     "i0"–"i26"
//   Special: setting any slot to null clears it from that level onward.
//
// ITEM SHORTHAND  →  itm(id, name, rarity, stack, enchants, leatherDye)
//   id          : Minecraft item ID string
//   name        : display name
//   rarity      : 'common'|'uncommon'|'rare'|'epic'|'legendary'  (default 'common')
//   stack       : count badge number, or null
//   enchants    : array of enchant strings, e.g. ["Power II", "Punch I"]
//                 — any entry makes the item enchanted (glint ON)
//   leatherDye  : 'lime'|'green'|'white'|null  (triggers colour API param)
//
// LEATHER SHORTHANDS
//   lth(slot, name, enchants)  — plain/undyed leather armour piece
//   lim(slot, name, enchants)  — lime-dyed leather
//   grn(slot, name, enchants)  — green-dyed leather
//
// POTION SHORTHANDS
//   pot(name, stack)           — regular potion  (potion id)
//   spot(name, stack)          — splash potion   (splash_potion id)
//
// RARITY INFERENCE
//   Items with enchants auto-promote rarity unless you specify one:
//     no enchants + base material → common/uncommon/rare/legendary per tier
//   You can always override by passing rarity explicitly to itm().
// =============================================================================

"use strict";

// ── Item constructors ────────────────────────────────────────────────────────

function itm(id, name, rarity = 'common', stack = null, enchants = [], leatherDye = null) {
  const lines = enchants.map(e => ({ text: e, cls: 'c-grey' }));
  const enchanted = enchants.length > 0;
  return { id, name, rarity, stack, lines, enchanted, customImg: null, leatherDye };
}

// Leather armour by slot name → correct leather_* id
const _LIDS = { helmet:'leather_helmet', chestplate:'leather_chestplate', leggings:'leather_leggings', boots:'leather_boots' };
function _lth(slot, name, dye, enchants = []) {
  return itm(_LIDS[slot], name, 'common', null, enchants, dye);
}
function lth(slot, name, enchants = []) { return _lth(slot, name, 'white', enchants); }
function lim(slot, name, enchants = []) { return _lth(slot, name, 'lime',  enchants); }
function grn(slot, name, enchants = []) { return _lth(slot, name, 'green', enchants); }

// Potion helpers
function pot(name, stack = null)  { return itm('potion',        name, 'common', stack); }
function spot(name, stack = null) { return itm('splash_potion', name, 'common', stack); }

// Common item shortcuts
const COMPASS = itm('compass', 'Compass', 'common');

// ── Patch engine ─────────────────────────────────────────────────────────────
// applyPatch(base, patch) → merged object (base untouched)
function applyPatch(base, patch) {
  const out = JSON.parse(JSON.stringify(base)); // deep clone
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) { delete out[k]; }
    else            { out[k] = v;   }
  }
  return out;
}

// Expand an array of patches into 11 fully-resolved level objects
function expand(patches) {
  const levels = [];
  let state = {};
  for (const patch of patches) {
    state = applyPatch(state, patch);
    levels.push(state);
  }
  return levels;
}

// Convert a resolved level object into the {armour, hotbar, inv} shape
// the renderer expects.
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
  hotbar.push(COMPASS); // slot 8 always compass
  for (let i = 0; i < 27; i++) {
    inv.push(resolved[`i${i}`] || null);
  }
  return { armour, hotbar, inv };
}

// Full pipeline: patches → rendered levels array
function kit(patches) {
  return expand(patches).map(toLevel);
}

// =============================================================================
// KIT DEFINITIONS
// =============================================================================

const KIT_DATA = {

// ── ARCHER ───────────────────────────────────────────────────────────────────
// Plain leather armour (undyed white)
"Archer": kit([
  { // I
    helmet: lth('helmet','Leather Helmet'),
    boots:  lth('boots', 'Leather Boots'),
    h0: itm('bow','Bow','uncommon'),
    h1: itm('arrow','Arrow','common',16),
  },
  { // II — + leggings
    leggings: lth('leggings','Leather Leggings'),
  },
  { // III — iron helmet
    helmet: itm('iron_helmet','Iron Helmet','uncommon'),
  },
  { // IV — iron helmet Prot I
    helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection I']),
  },
  { // V — diamond helmet, 18 arrows
    helmet: itm('diamond_helmet','Diamond Helmet','legendary'),
    h1: itm('arrow','Arrow','common',18),
  },
  { // VI — bow Power I, 20 arrows
    h0: itm('bow','Bow','rare',null,['Power I']),
    h1: itm('arrow','Arrow','common',20),
  },
  { // VII — diamond helmet Prot I, 22 arrows
    helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection I']),
    h1: itm('arrow','Arrow','common',22),
  },
  { // VIII — + leather chestplate, 26 arrows
    chestplate: lth('chestplate','Leather Chestplate'),
    h1: itm('arrow','Arrow','common',26),
  },
  { // IX — chestplate Prot I, 30 arrows
    chestplate: lth('chestplate','Leather Chestplate',['Protection I']),
    h1: itm('arrow','Arrow','common',30),
  },
  { // X — bow Power II, helmet Prot II, 48 arrows
    helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection II']),
    h0: itm('bow','Bow','legendary',null,['Power II']),
    h1: itm('arrow','Arrow','common',48),
  },
  { // P2 — chestplate Prot II, 64 arrows
    chestplate: lth('chestplate','Leather Chestplate',['Protection II']),
    h1: itm('arrow','Arrow','common',64),
  },
]),

// ── RANGER ───────────────────────────────────────────────────────────────────
"Ranger": kit([
  { // I
    chestplate: lth('chestplate','Leather Chestplate',['Protection I']),
    leggings:   lth('leggings',  'Leather Leggings',  ['Protection I']),
    boots:      itm('chainmail_boots','Chainmail Boots','uncommon',null,['Protection I']),
    h0: itm('bow','Bow','rare',null,['Power I']),
    h1: itm('arrow','Arrow','common',15),
  },
  { // II — chest Prot II, leggings plain, 16a
    chestplate: lth('chestplate','Leather Chestplate',['Protection II']),
    leggings:   lth('leggings',  'Leather Leggings'),
    h1: itm('arrow','Arrow','common',16),
  },
  { // III — leggings Prot I, boots Prot II, 17a
    leggings: lth('leggings','Leather Leggings',['Protection I']),
    boots:    itm('chainmail_boots','Chainmail Boots','uncommon',null,['Protection II']),
    h1: itm('arrow','Arrow','common',17),
  },
  { // IV — chainmail chest, 18a
    chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon'),
    h1: itm('arrow','Arrow','common',18),
  },
  { // V — leggings Prot II, iron boots, 19a
    leggings: lth('leggings','Leather Leggings',['Protection II']),
    boots:    itm('iron_boots','Iron Boots','uncommon'),
    h1: itm('arrow','Arrow','common',19),
  },
  { // VI — chain chest Prot I, 20a
    chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Protection I']),
    h1: itm('arrow','Arrow','common',20),
  },
  { // VII — gold leggings, iron boots Prot I, 21a
    leggings: itm('golden_leggings','Gold Leggings','uncommon'),
    boots:    itm('iron_boots','Iron Boots','uncommon',null,['Protection I']),
    h1: itm('arrow','Arrow','common',21),
  },
  { // VIII — chain chest Prot II, 22a
    chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Protection II']),
    h1: itm('arrow','Arrow','common',22),
  },
  { // IX — iron boots Prot II, 23a
    boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection II']),
    h1: itm('arrow','Arrow','common',23),
  },
  { // X — bow Power I+Punch I, diamond boots, 24a
    boots: itm('diamond_boots','Diamond Boots','legendary'),
    h0: itm('bow','Bow','legendary',null,['Power I','Punch I']),
    h1: itm('arrow','Arrow','common',24),
  },
  { // P2 — + wooden axe Unbreaking III, diamond boots Prot I, 28a
    boots: itm('diamond_boots','Diamond Boots','legendary',null,['Protection I']),
    h0: itm('wooden_axe','Wooden Axe','uncommon',null,['Unbreaking III']),
    h1: itm('bow','Bow','legendary',null,['Power I','Punch I']),
    h2: itm('arrow','Arrow','common',28),
  },
]),

// ── HORSETAMER ───────────────────────────────────────────────────────────────
"Horsetamer": kit([
  { // I
    helmet: lth('helmet','Leather Helmet'),
    boots:  lth('boots', 'Leather Boots'),
    h0: itm('wooden_axe','Wooden Axe','common',null,['Infinity I']),
    h1: itm('horse_spawn_egg','Horse Spawn Egg','rare'),
    h2: itm('apple','Apple','common',3),
    h3: itm('saddle','Saddle','uncommon'),
  },
  { // II — leggings, chainmail boots
    leggings: lth('leggings','Leather Leggings'),
    boots:    itm('chainmail_boots','Chainmail Boots','uncommon'),
  },
  { // III — stone axe
    h0: itm('stone_axe','Stone Axe','uncommon',null,['Infinity I']),
  },
  { // IV — + leather chestplate
    chestplate: lth('chestplate','Leather Chestplate'),
  },
  { // V — chainmail boots Prot I
    boots: itm('chainmail_boots','Chainmail Boots','uncommon',null,['Protection I']),
  },
  { // VI — iron boots
    boots: itm('iron_boots','Iron Boots','uncommon'),
  },
  { // VII — iron axe, 4 apples
    h0: itm('iron_axe','Iron Axe','rare',null,['Infinity I']),
    h2: itm('apple','Apple','common',4),
  },
  { // VIII — diamond boots
    boots: itm('diamond_boots','Diamond Boots','legendary'),
  },
  { // IX — chest Prot I, diamond boots Prot I, 6 apples
    chestplate: lth('chestplate','Leather Chestplate',['Protection I']),
    boots: itm('diamond_boots','Diamond Boots','legendary',null,['Protection I']),
    h2: itm('apple','Apple','common',6),
  },
  { // X — diamond axe, chest Prot I (same), boots Prot II, 8 apples
    h0: itm('diamond_axe','Diamond Axe','legendary',null,['Infinity I']),
    boots: itm('diamond_boots','Diamond Boots','legendary',null,['Protection II']),
    h2: itm('apple','Apple','common',8),
  },
  { // P2 — chest Prot II, leggings Prot I
    chestplate: lth('chestplate','Leather Chestplate',['Protection II']),
    leggings:   lth('leggings',  'Leather Leggings',  ['Protection I']),
  },
]),

// ── ARMORER ──────────────────────────────────────────────────────────────────
"Armorer": kit([
  { // I
    helmet:     lth('helmet',     'Leather Helmet'),
    chestplate: lth('chestplate', 'Leather Chestplate', ['Protection I','Blast Protection I']),
    leggings:   lth('leggings',   'Leather Leggings',   ['Protection I','Fire Protection I']),
    boots:      lth('boots',      'Leather Boots'),
    h0: itm('cookie','Cookie','common',1),
  },
  { // II — helmet Prot I+ProjProt I, 2 cookies
    helmet: lth('helmet','Leather Helmet',['Protection I','Projectile Protection I']),
    h0: itm('cookie','Cookie','common',2),
  },
  { // III — chest Prot II+Blast I, leggings Prot I+Fire I, boots Prot I+FF I, 3 cookies
    chestplate: lth('chestplate','Leather Chestplate',['Protection II','Blast Protection I']),
    leggings:   lth('leggings',  'Leather Leggings',  ['Protection I','Fire Protection I']),
    boots:      lth('boots',     'Leather Boots',      ['Protection I','Feather Falling I']),
    h0: itm('cookie','Cookie','common',3),
  },
  { // IV — helmet Proj II, chest Blast II, boots FF II, 4 cookies
    helmet:     lth('helmet',     'Leather Helmet',    ['Protection I','Projectile Protection II']),
    chestplate: lth('chestplate', 'Leather Chestplate',['Protection II','Blast Protection II']),
    boots:      lth('boots',      'Leather Boots',      ['Protection I','Feather Falling II']),
    h0: itm('cookie','Cookie','common',4),
  },
  { // V — helmet Prot II+Proj II, chest Prot III+Blast III, 5 cookies
    helmet:     lth('helmet',     'Leather Helmet',    ['Protection II','Projectile Protection II']),
    chestplate: lth('chestplate', 'Leather Chestplate',['Protection III','Blast Protection III']),
    h0: itm('cookie','Cookie','common',5),
  },
  { // VI — helmet Proj III, leggings Prot II+Fire III, boots FF III, 6 cookies
    helmet:   lth('helmet',   'Leather Helmet',  ['Protection II','Projectile Protection III']),
    leggings: lth('leggings', 'Leather Leggings',['Protection II','Fire Protection III']),
    boots:    lth('boots',    'Leather Boots',    ['Protection I','Feather Falling III']),
    h0: itm('cookie','Cookie','common',6),
  },
  { // VII — chest Blast IV, leggings Prot III+Fire IV, boots Prot II+FF III, 7 cookies
    chestplate: lth('chestplate','Leather Chestplate',['Protection III','Blast Protection IV']),
    leggings:   lth('leggings',  'Leather Leggings',  ['Protection III','Fire Protection IV']),
    boots:      lth('boots',     'Leather Boots',      ['Protection II','Feather Falling III']),
    h0: itm('cookie','Cookie','common',7),
  },
  { // VIII — helmet Proj IV, chest Blast V, 8 cookies
    helmet:     lth('helmet',     'Leather Helmet',    ['Protection II','Projectile Protection IV']),
    chestplate: lth('chestplate', 'Leather Chestplate',['Protection III','Blast Protection V']),
    h0: itm('cookie','Cookie','common',8),
  },
  { // IX — chest Prot IV, leggings Prot IV+Fire V, 9 cookies
    chestplate: lth('chestplate','Leather Chestplate',['Protection IV','Blast Protection V']),
    leggings:   lth('leggings',  'Leather Leggings',  ['Protection IV','Fire Protection V']),
    h0: itm('cookie','Cookie','common',9),
  },
  { // X — helmet Proj X, chest Blast X, leggings Fire X, boots FF IV, 10 cookies
    helmet:     lth('helmet',     'Leather Helmet',    ['Protection II','Projectile Protection X']),
    chestplate: lth('chestplate', 'Leather Chestplate',['Protection IV','Blast Protection X']),
    leggings:   lth('leggings',   'Leather Leggings',  ['Protection IV','Fire Protection X']),
    boots:      lth('boots',      'Leather Boots',      ['Protection II','Feather Falling IV']),
    h0: itm('cookie','Cookie','common',10),
  },
  { // P2 — boots FF X, + wood axe Unbreaking III, 12 cookies
    boots: lth('boots','Leather Boots',['Protection II','Feather Falling X']),
    h0: itm('cookie','Cookie','common',12),
    h1: itm('wooden_axe','Wooden Axe','uncommon',null,['Unbreaking III']),
  },
]),

// ── BAKER ────────────────────────────────────────────────────────────────────
"Baker": kit([
  { // I
    helmet: lth('helmet','Leather Helmet'),
    h0: itm('wooden_sword','Wooden Sword','common'),
    h1: itm('bread','Bread','common',2),
    h2: itm('cake','Cake','common',1),
    h3: spot('Splash Potion of Resistance I (10s)'),
  },
  { // II — + chestplate, 4 bread
    chestplate: lth('chestplate','Leather Chestplate'),
    h1: itm('bread','Bread','common',4),
  },
  { // III — + leggings, 6 bread, 2 cakes
    leggings: lth('leggings','Leather Leggings'),
    h1: itm('bread','Bread','common',6),
    h2: itm('cake','Cake','common',2),
  },
  { // IV — + boots, 8 bread
    boots: lth('boots','Leather Boots'),
    h1: itm('bread','Bread','common',8),
  },
  { // V — 10 bread, 3 cakes, 2 potions
    h1: itm('bread','Bread','common',10),
    h2: itm('cake','Cake','common',3),
    h3: spot('Splash Potion of Resistance I (10s)',2),
  },
  { // VI — boots Prot I, 12 bread
    boots: lth('boots','Leather Boots',['Protection I']),
    h1: itm('bread','Bread','common',12),
  },
  { // VII — stone sword Unbreaking I, 16 bread
    h0: itm('stone_sword','Stone Sword','uncommon',null,['Unbreaking I']),
    h1: itm('bread','Bread','common',16),
  },
  { // VIII — boots Prot II, 20 bread, 4 cakes, 3 potions
    boots: lth('boots','Leather Boots',['Protection II']),
    h1: itm('bread','Bread','common',20),
    h2: itm('cake','Cake','common',4),
    h3: spot('Splash Potion of Resistance I (10s)',3),
  },
  { // IX — plain stone sword, iron boots, 24 bread, 5 cakes
    h0: itm('stone_sword','Stone Sword','uncommon'),
    boots: itm('iron_boots','Iron Boots','uncommon'),
    h1: itm('bread','Bread','common',24),
    h2: itm('cake','Cake','common',5),
  },
  { // X — iron sword Unbreaking I, iron boots Prot I, 32 bread, + golden apple
    h0: itm('iron_sword','Iron Sword','rare',null,['Unbreaking I']),
    boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection I']),
    h1: itm('bread','Bread','common',32),
    h4: itm('golden_apple','Golden Apple','rare'),
  },
  { // P2 — iron helmet, 4 potions
    helmet: itm('iron_helmet','Iron Helmet','uncommon'),
    h3: spot('Splash Potion of Resistance I (10s)',4),
  },
]),

// ── GUARDIAN ─────────────────────────────────────────────────────────────────
"Guardian": kit([
  { // I
    chestplate: lth('chestplate','Leather Chestplate'),
    h0: itm('wooden_axe','Wooden Axe','common'),
    h1: pot('Potion of Healing I'),
  },
  { // II — + boots
    boots: lth('boots','Leather Boots'),
  },
  { // III — + leggings
    leggings: lth('leggings','Leather Leggings'),
  },
  { // IV — + helmet, stone axe
    helmet: lth('helmet','Leather Helmet'),
    h0: itm('stone_axe','Stone Axe','uncommon'),
  },
  { // V — + health boost potion
    h2: pot('Potion of Health Boost I (2 hearts, 20 min)'),
  },
  { // VI — chest Prot I, Healing II
    chestplate: lth('chestplate','Leather Chestplate',['Protection I']),
    h1: pot('Potion of Healing II'),
  },
  { // VII — chest Prot II, boots Prot I
    chestplate: lth('chestplate','Leather Chestplate',['Protection II']),
    boots: lth('boots','Leather Boots',['Protection I']),
  },
  { // VIII — chainmail chest Prot I, iron boots
    chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Protection I']),
    boots: itm('iron_boots','Iron Boots','uncommon'),
  },
  { // IX — iron chestplate, boots Prot II
    chestplate: itm('iron_chestplate','Iron Chestplate','uncommon'),
    boots: lth('boots','Leather Boots',['Protection II']),
  },
  { // X — iron axe, iron boots, 2x Healing II
    h0: itm('iron_axe','Iron Axe','rare'),
    boots: itm('iron_boots','Iron Boots','uncommon'),
    h1: pot('Potion of Healing II',2),
  },
  { // P2 — 3x Healing II+Resistance II, (health boost stays)
    h1: pot('Potion of Healing II & Resistance II (2s)',3),
  },
]),

// ── HUNTER ───────────────────────────────────────────────────────────────────
"Hunter": kit([
  { // I
    chestplate: lth('chestplate','Leather Chestplate'),
    leggings:   lth('leggings',  'Leather Leggings'),
    h0: itm('bow','Bow','uncommon',null,['Unbreaking I']),
    h1: itm('wooden_axe','Wooden Axe','common'),
    h2: itm('arrow','Arrow','common',8),
  },
  { // II — 12 arrows
    h2: itm('arrow','Arrow','common',12),
  },
  { // III — wooden sword instead of axe
    h1: itm('wooden_sword','Wooden Sword','common'),
  },
  { // IV — + speed potion
    h3: spot('Splash Potion of Speed II (8s)'),
  },
  { // V — plain bow, 16 arrows
    h0: itm('bow','Bow','uncommon'),
    h2: itm('arrow','Arrow','common',16),
  },
  { // VI — leggings Prot I, 2x speed potions
    leggings: lth('leggings','Leather Leggings',['Protection I']),
    h3: spot('Splash Potion of Speed II (8s)',2),
  },
  { // VII — stone sword Unbreaking I, gold leggings, 3x speed potions
    leggings: itm('golden_leggings','Gold Leggings','uncommon'),
    h1: itm('stone_sword','Stone Sword','uncommon',null,['Unbreaking I']),
  },
  { // VIII — plain stone sword, 3x speed
    h1: itm('stone_sword','Stone Sword','uncommon'),
    h3: spot('Splash Potion of Speed II (8s)',3),
  },
  { // IX — bow Power I, chest Prot I, chain leggings, 20 arrows
    chestplate: lth('chestplate','Leather Chestplate',['Protection I']),
    leggings:   itm('chainmail_leggings','Chainmail Leggings','uncommon'),
    h0: itm('bow','Bow','rare',null,['Power I']),
    h2: itm('arrow','Arrow','common',20),
  },
  { // X — chain chest Punch I, chain leggings Punch I, 18 arrows, 10s potions
    chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon',null,['Punch I']),
    leggings:   itm('chainmail_leggings',  'Chainmail Leggings',  'uncommon',null,['Punch I']),
    h2: itm('arrow','Arrow','common',18),
    h3: spot('Splash Potion of Speed II (10s)',3),
  },
  { // P2 — 22 arrows, 4x potions
    h2: itm('arrow','Arrow','common',22),
    h3: spot('Splash Potion of Speed II (10s)',4),
  },
]),

// ── HYPE TRAIN ───────────────────────────────────────────────────────────────
"Hype Train": kit([
  { // I
    helmet: lth('helmet','Leather Helmet'),
    h0: itm('stone_axe','Stone Axe','uncommon'),
    h1: itm('minecart','Minecart','common'),
    h2: itm('rail','Rail','common',16),
    h3: itm('powered_rail','Powered Rail','uncommon',3),
    h4: itm('redstone_torch','Redstone Torch','common',3),
  },
  { // II — + chestplate, 20 rails
    chestplate: lth('chestplate','Leather Chestplate'),
    h2: itm('rail','Rail','common',20),
  },
  { // III — helmet Proj I, chest Proj I, 24 rails
    helmet:     lth('helmet',     'Leather Helmet',    ['Projectile Protection I']),
    chestplate: lth('chestplate', 'Leather Chestplate',['Projectile Protection I']),
    h2: itm('rail','Rail','common',24),
  },
  { // IV — 28 rails, + TNT
    h2: itm('rail','Rail','common',28),
    h5: itm('tnt','TNT','rare',1),
  },
  { // V — + boots, 32 rails
    boots: lth('boots','Leather Boots'),
    h2: itm('rail','Rail','common',32),
  },
  { // VI — iron axe, 36 rails
    h0: itm('iron_axe','Iron Axe','rare'),
    h2: itm('rail','Rail','common',36),
  },
  { // VII — boots Prot I, 40 rails, 4 powered, 4 torches
    boots: lth('boots','Leather Boots',['Protection I']),
    h2: itm('rail','Rail','common',40),
    h3: itm('powered_rail','Powered Rail','uncommon',4),
    h4: itm('redstone_torch','Redstone Torch','common',4),
  },
  { // VIII — boots Prot II, 44 rails, 6 powered, 6 torches
    boots: lth('boots','Leather Boots',['Protection II']),
    h2: itm('rail','Rail','common',44),
    h3: itm('powered_rail','Powered Rail','uncommon',6),
    h4: itm('redstone_torch','Redstone Torch','common',6),
  },
  { // IX — + fishing rod, iron boots, 48 rails, 8 powered, 8 torches, 2 TNT
    chestplate: lth('chestplate','Leather Chestplate',['Projectile Protection II']),
    boots: itm('iron_boots','Iron Boots','uncommon'),
    h0: itm('iron_axe','Iron Axe','rare'),
    h1: itm('fishing_rod','Fishing Rod','uncommon'),
    h2: itm('rail','Rail','common',48),
    h3: itm('powered_rail','Powered Rail','uncommon',8),
    h4: itm('redstone_torch','Redstone Torch','common',8),
    h5: itm('minecart','Minecart','common'),
    h6: itm('tnt','TNT','rare',2),
  },
  { // X — iron sword, fishing rod Silk+Unbreaking, helmet Proj II, leggings Prot I, iron boots Prot I, storage minecart, 64 rails, 10 powered, 10 torches, 3 TNT
    helmet:     lth('helmet',     'Leather Helmet',    ['Projectile Protection II']),
    chestplate: lth('chestplate', 'Leather Chestplate',['Projectile Protection II']),
    leggings:   lth('leggings',   'Leather Leggings',  ['Protection I']),
    boots:      itm('iron_boots','Iron Boots','uncommon',null,['Protection I']),
    h0: itm('iron_sword','Iron Sword','rare'),
    h1: itm('fishing_rod','Fishing Rod','uncommon',null,['Silk Touch I','Unbreaking II']),
    h2: itm('rail','Rail','common',64),
    h3: itm('powered_rail','Powered Rail','uncommon',10),
    h4: itm('redstone_torch','Redstone Torch','common',10),
    h5: itm('minecart','Minecart','common'),
    h6: itm('chest_minecart','Storage Minecart','uncommon'),
    h7: itm('tnt','TNT','rare',3),
  },
  { // P2 — boots Prot III (only change)
    boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection III']),
  },
]),

// ── KNIGHT ───────────────────────────────────────────────────────────────────
"Knight": kit([
  { // I
    helmet: lth('helmet','Leather Helmet'),
    boots:  itm('golden_boots','Golden Boots','uncommon'),
    h0: itm('wooden_sword','Wooden Sword','common'),
  },
  { // II — + leather chestplate
    chestplate: lth('chestplate','Leather Chestplate'),
  },
  { // III — golden helmet
    helmet: itm('golden_helmet','Golden Helmet','uncommon'),
  },
  { // IV — leather chest Prot I
    chestplate: lth('chestplate','Leather Chestplate',['Protection I']),
  },
  { // V — stone sword Unbreaking I, golden chestplate
    chestplate: itm('golden_chestplate','Golden Chestplate','uncommon'),
    h0: itm('stone_sword','Stone Sword','uncommon',null,['Unbreaking I']),
  },
  { // VI — + leather leggings
    leggings: lth('leggings','Leather Leggings'),
  },
  { // VII — golden leggings
    leggings: itm('golden_leggings','Golden Leggings','uncommon'),
  },
  { // VIII — plain stone sword, chest Prot I, leggings Prot I, + golden carrot
    chestplate: itm('golden_chestplate','Golden Chestplate','uncommon',null,['Protection I']),
    leggings:   itm('golden_leggings',  'Golden Leggings',  'uncommon',null,['Protection I']),
    h0: itm('stone_sword','Stone Sword','uncommon'),
    h1: itm('golden_carrot','Golden Carrot','uncommon',1),
  },
  { // IX — helmet Prot I, all gold Prot I, boots Prot I, 2 carrots
    helmet: itm('golden_helmet','Golden Helmet','uncommon',null,['Protection I']),
    boots:  itm('golden_boots', 'Golden Boots', 'uncommon',null,['Protection I']),
    h1: itm('golden_carrot','Golden Carrot','uncommon',2),
  },
  { // X — iron sword Unbreaking I, chest Prot II, leggings Prot II, 3 carrots
    chestplate: itm('golden_chestplate','Golden Chestplate','uncommon',null,['Protection II']),
    leggings:   itm('golden_leggings',  'Golden Leggings',  'uncommon',null,['Protection II']),
    boots:      itm('golden_boots',     'Golden Boots',     'uncommon',null,['Protection I']),
    h0: itm('iron_sword','Iron Sword','rare',null,['Unbreaking I']),
    h1: itm('golden_carrot','Golden Carrot','uncommon',3),
  },
  { // P2 — chest Prot III, leggings Prot II, boots Prot II, 5 carrots
    chestplate: itm('golden_chestplate','Golden Chestplate','uncommon',null,['Protection III']),
    boots:      itm('golden_boots',     'Golden Boots',     'uncommon',null,['Protection II']),
    h1: itm('golden_carrot','Golden Carrot','uncommon',5),
  },
]),

// ── FISHERMAN ────────────────────────────────────────────────────────────────
"Fisherman": kit([
  { // I  — rod acts as weapon (Sharpness); sits in h0 as primary
    helmet: lth('helmet','Leather Helmet'),
    h0: itm('fishing_rod','Fishing Rod','legendary',null,['Sharpness II','Unbreaking X']),
    h1: itm('cooked_cod','Cooked Fish','common',2),
  },
  { // II — chainmail helmet, 3 fish
    helmet: itm('chainmail_helmet','Chainmail Helmet','uncommon'),
    h1: itm('cooked_cod','Cooked Fish','common',3),
  },
  { // III — rod Sharp III
    h0: itm('fishing_rod','Fishing Rod','legendary',null,['Sharpness III','Unbreaking X']),
  },
  { // IV — + leather chestplate, 4 fish
    chestplate: lth('chestplate','Leather Chestplate'),
    h1: itm('cooked_cod','Cooked Fish','common',4),
  },
  { // V — + leather leggings
    leggings: lth('leggings','Leather Leggings'),
  },
  { // VI — + iron boots
    boots: itm('iron_boots','Iron Boots','uncommon'),
  },
  { // VII — chainmail chestplate, gold leggings
    chestplate: itm('chainmail_chestplate','Chainmail Chestplate','uncommon'),
    leggings:   itm('golden_leggings',     'Golden Leggings',     'uncommon'),
  },
  { // VIII — rod Sharp IV
    h0: itm('fishing_rod','Fishing Rod','legendary',null,['Sharpness IV','Unbreaking X']),
  },
  { // IX — chainmail leggings, 6 fish
    leggings: itm('chainmail_leggings','Chainmail Leggings','uncommon'),
    h1: itm('cooked_cod','Cooked Fish','common',6),
  },
  { // X — rod Sharp V+Unbreaking X+Luck III, diamond boots, 8 fish
    boots: itm('diamond_boots','Diamond Boots','legendary'),
    h0: itm('fishing_rod','Fishing Rod','legendary',null,['Sharpness V','Unbreaking X','Luck of the Sea III']),
    h1: itm('cooked_cod','Cooked Fish','common',8),
  },
  { // P2 — rod +Lure III, diamond boots Depth Strider I+Prot I
    boots: itm('diamond_boots','Diamond Boots','legendary',null,['Depth Strider I','Protection I']),
    h0: itm('fishing_rod','Fishing Rod','legendary',null,['Sharpness V','Unbreaking X','Luck of the Sea III','Lure III']),
  },
]),

// ── MEATMASTER ───────────────────────────────────────────────────────────────
"MeatMaster": kit([
  { // I
    helmet: lth('helmet','Leather Helmet'),
    boots:  lth('boots', 'Leather Boots'),
    h0: itm('wooden_sword','Wooden Sword','common',null,['Looting I']),
    h1: itm('cow_spawn_egg','Cow Spawn Egg','uncommon',2),
    h2: itm('cooked_beef','Steak','common',2),
  },
  { // II — helmet Prot I, boots Prot I, 4 steak
    helmet: lth('helmet','Leather Helmet',['Protection I']),
    boots:  lth('boots', 'Leather Boots', ['Protection I']),
    h2: itm('cooked_beef','Steak','common',4),
  },
  { // III — helmet Prot II, iron boots, 3 eggs, 6 steak
    helmet: lth('helmet','Leather Helmet',['Protection II']),
    boots:  itm('iron_boots','Iron Boots','uncommon'),
    h1: itm('cow_spawn_egg','Cow Spawn Egg','uncommon',3),
    h2: itm('cooked_beef','Steak','common',6),
  },
  { // IV — iron helmet plain boots, 8 steak
    helmet: itm('iron_helmet','Iron Helmet','uncommon'),
    h2: itm('cooked_beef','Steak','common',8),
  },
  { // V — helmet Prot I, Looting II, 10 steak
    helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection I']),
    h0: itm('wooden_sword','Wooden Sword','common',null,['Looting II']),
    h2: itm('cooked_beef','Steak','common',10),
  },
  { // VI — diamond helmet, 12 steak
    helmet: itm('diamond_helmet','Diamond Helmet','legendary'),
    h2: itm('cooked_beef','Steak','common',12),
  },
  { // VII — stone sword Looting II, helmet Prot I, 4 eggs, 16 steak
    helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection I']),
    h0: itm('stone_sword','Stone Sword','uncommon',null,['Looting II']),
    h1: itm('cow_spawn_egg','Cow Spawn Egg','uncommon',4),
    h2: itm('cooked_beef','Steak','common',16),
  },
  { // VIII — helmet Prot II, 20 steak
    helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection II']),
    h2: itm('cooked_beef','Steak','common',20),
  },
  { // IX — Looting III, helmet Prot III, 5 eggs, 24 steak
    helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection III']),
    h0: itm('stone_sword','Stone Sword','uncommon',null,['Looting III']),
    h1: itm('cow_spawn_egg','Cow Spawn Egg','uncommon',5),
    h2: itm('cooked_beef','Steak','common',24),
  },
  { // X — iron sword Looting III, helmet Prot IV, + pig egg + saddle + carrot stick, 28 steak
    helmet: itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection IV']),
    h0: itm('iron_sword','Iron Sword','rare',null,['Looting III']),
    h2: itm('cooked_beef','Steak','common',28),
    h3: itm('pig_spawn_egg','Pig Spawn Egg','uncommon'),
    h4: itm('saddle','Saddle','uncommon'),
    h5: itm('carrot_on_a_stick','Carrot on a Stick','uncommon'),
  },
  { // P2 — iron boots Prot I, 6 cow eggs, 32 steak
    boots: itm('iron_boots','Iron Boots','uncommon',null,['Protection I']),
    h1: itm('cow_spawn_egg','Cow Spawn Egg','uncommon',6),
    h2: itm('cooked_beef','Steak','common',32),
  },
]),

// ── SCOUT ────────────────────────────────────────────────────────────────────
"Scout": kit([
  { // I — no armour, potions only
    h0: pot('Potion of Speed II (12s)',2),
    h1: spot('Splash Potion of Slowness II (8s)'),
    h2: spot('Splash Potion of Invisibility II (10s)'),
    chestplate: lth('chestplate','Leather Chestplate'),
  },
  { // II — + helmet
    helmet: lth('helmet','Leather Helmet'),
  },
  { // III — helmet Respiration I, speed 14s
    helmet: lth('helmet','Leather Helmet',['Respiration I']),
    h0: pot('Potion of Speed II (14s)',2),
  },
  { // IV — 4x speed, 2x slow
    h0: pot('Potion of Speed II (14s)',4),
    h1: spot('Splash Potion of Slowness II (8s)',2),
  },
  { // V — helmet Respiration II, 3x speed
    helmet: lth('helmet','Leather Helmet',['Respiration II']),
    h0: pot('Potion of Speed II (14s)',3),
  },
  { // VI — speed 16s
    h0: pot('Potion of Speed II (16s)',3),
  },
  { // VII — + regen potion
    h3: pot('Potion of Regeneration II (10s)'),
  },
  { // VIII — + boots, 5x speed 18s, slow 6s
    boots: lth('boots','Leather Boots'),
    h0: pot('Potion of Speed II (18s)',5),
    h1: spot('Splash Potion of Slowness II (6s)',2),
  },
  { // IX — slow back to 8s
    h1: spot('Splash Potion of Slowness II (8s)',2),
  },
  { // X — + leggings, speed 20s 5x, 3x slow, 2x regen
    leggings: lth('leggings','Leather Leggings'),
    h0: pot('Potion of Speed II (20s)',5),
    h1: spot('Splash Potion of Slowness II (8s)',3),
    h3: pot('Potion of Regeneration II (10s)',2),
  },
  { // P2 — same as X (no documented changes)
  },
]),

// ── SPELEOLOGIST ─────────────────────────────────────────────────────────────
"Speleologist": kit([
  { // I
    helmet: itm('iron_helmet','Iron Helmet','uncommon'),
    boots:  lth('boots','Leather Boots'),
    h0: itm('iron_pickaxe','Iron Pickaxe','uncommon'),
    h1: itm('bowl','Bowl','common'),
    h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',1),
  },
  { // II — boots Prot I
    boots: lth('boots','Leather Boots',['Protection I']),
  },
  { // III — boots Prot II, 2 eggs
    boots: lth('boots','Leather Boots',['Protection II']),
    h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',2),
  },
  { // IV — iron boots
    boots: itm('iron_boots','Iron Boots','uncommon'),
  },
  { // V — + leather chestplate, 3 eggs
    chestplate: lth('chestplate','Leather Chestplate'),
    h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',3),
  },
  { // VI — helmet Prot I, + leggings
    helmet:   itm('iron_helmet','Iron Helmet','uncommon',null,['Protection I']),
    leggings: lth('leggings','Leather Leggings'),
  },
  { // VII — helmet Prot II, boots ProjProt I, 1 egg
    helmet: itm('iron_helmet','Iron Helmet','uncommon',null,['Protection II']),
    boots:  itm('iron_boots','Iron Boots','uncommon',null,['Projectile Protection I']),
    h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',1),
  },
  { // VIII — pickaxe Sharp I, diamond helmet, 4 eggs
    helmet: itm('diamond_helmet','Diamond Helmet','legendary'),
    chestplate: lth('chestplate','Leather Chestplate'),
    h0: itm('iron_pickaxe','Iron Pickaxe','uncommon',null,['Sharpness I']),
    h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',4),
  },
  { // IX — helmet Prot I, chest Prot I, leggings Prot I
    helmet:     itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection I']),
    chestplate: lth('chestplate','Leather Chestplate',['Protection I']),
    leggings:   lth('leggings',  'Leather Leggings',  ['Protection I']),
  },
  { // X — diamond pickaxe, helmet Prot II, chest Prot II, leggings Prot II, boots ProjProt II, 5 eggs
    helmet:     itm('diamond_helmet','Diamond Helmet','legendary',null,['Protection II']),
    chestplate: lth('chestplate','Leather Chestplate',['Protection II']),
    leggings:   lth('leggings',  'Leather Leggings',  ['Protection II']),
    boots:      itm('iron_boots','Iron Boots','uncommon',null,['Projectile Protection II']),
    h0: itm('diamond_pickaxe','Diamond Pickaxe','legendary',null,['Sharpness I']),
    h2: itm('mooshroom_spawn_egg','Mooshroom Spawn Egg','uncommon',5),
  },
  { // P2 — gold chestplate, leggings Prot I, boots ProjProt III
    chestplate: itm('golden_chestplate','Golden Chestplate','uncommon'),
    leggings:   lth('leggings','Leather Leggings',['Protection I']),
    boots:      itm('iron_boots','Iron Boots','uncommon',null,['Projectile Protection III']),
  },
]),

};

// Export for consumption by the main page script
if (typeof module !== 'undefined') module.exports = KIT_DATA;
