// assets/js/questing.js  (FRONTEND for questing.html — runs in the browser, no require())
(() => {
  'use strict';
  const API = 'https://api.litstats.com/api/quest';
  const TOP_URL = 'quest_games.json';
  const PIN_KEY = 'litstats_pinnedPlayer';   // same key cabinet.js uses (a plain username)
  const REGISTER_MAXGAMES = true;            // ping /api/player once per searched player so they join the max-games list
  const $ = id => document.getElementById(id);
  const fmt = n => Number(n).toLocaleString();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY = 86400000;

  const MC = { BLACK: '#000000', DARK_BLUE: '#0000AA', DARK_GREEN: '#00AA00', DARK_AQUA: '#00AAAA', DARK_RED: '#AA0000', DARK_PURPLE: '#AA00AA', GOLD: '#FFAA00', GRAY: '#AAAAAA', DARK_GRAY: '#555555', BLUE: '#5555FF', GREEN: '#55FF55', AQUA: '#36e9e9', RED: '#FF5555', LIGHT_PURPLE: '#FF55FF', YELLOW: '#FFFF55', WHITE: '#FFFFFF' };

  // ---------- saved preferences ----------
  // Everything persists through Store, so adding accounts later means swapping this one object for a synced version.
  //   litstats_quest_prefs_v1          UI preferences + games you've hidden (apply to every player you look up)
  //   litstats_quest_player_v1:<uuid>  per-player data (quests hidden for that player)
  const Store = {
    read(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' ? v : fallback; } catch (e) { return fallback; } },
    write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} },
    prefs() { return this.read('litstats_quest_prefs_v1', {}); },
    savePrefs(p) { this.write('litstats_quest_prefs_v1', { v: 1, ...p }); },
    player(uuid) { return this.read(`litstats_quest_player_v1:${uuid}`, { skip: [] }); },
    savePlayer(uuid, d) { this.write(`litstats_quest_player_v1:${uuid}`, { v: 1, ...d }); }
  };
  const saved = Store.prefs();

  // Every option the Customize drawer controls, with its default. Saved in the browser with the other preferences.
  const SECTION_KEYS = ['stats', 'board', 'games', 'calendar'];
  const UI_DEFAULTS = {
    order: SECTION_KEYS.slice(),
    secStats: true, secGames: true, secCalendar: true, calAuto: true,
    excludeComp: false, showXp: true, layout: 'cards',
    resetTimers: true,
    showTags: true, rowActions: true, rowPct: false, rowDesc: true, rowBars: true, columns: 'auto',
    gamesOpen: false, gamesSort: 'count', gamesHidden: false,
    timeMode: 'hypixel'
  };
  const UI = { ...UI_DEFAULTS, ...(saved.ui || {}) };
  UI.order = [...(Array.isArray(UI.order) ? UI.order : []).filter(k => SECTION_KEYS.includes(k)), ...SECTION_KEYS.filter(k => !(UI.order || []).includes(k))];
  const COMP_GAMES = new Set(['walls3', 'megawalls', 'uhc', 'pit']);          // Mega Walls, UHC, The Pit
  const isCompOut = x => UI.excludeComp && COMP_GAMES.has(x.game);
  const TICK = '<span class="qt-tick">✓</span>';
  const KIND_LABEL = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', special: 'Special' };

  const S = { data: null, uuid: null, name: null, param: '', kind: saved.kind || 'all', game: 'all', sort: saved.sort || 'game', filter: '', hideDone: !!saved.hideDone, easy: !!saved.easy,
              skip: new Set(saved.ignored || []), bookmarks: new Set(saved.bookmarks || []), view: 'all', hideGames: new Set(saved.hiddenGames || []), open: new Map(Object.entries(saved.open || {})), events: [], days: new Map(), year: null, sel: null, calOpen: false, hasHist: false, gamesOpen: !!UI.gamesOpen, gamesExpanded: new Set(), timer: null, refreshing: false };

  // ---------- helpers ----------
  const pad = n => String(n).padStart(2, '0');
  const savePrefs = () => Store.savePrefs({ kind: S.kind, sort: S.sort, hideDone: S.hideDone, easy: S.easy, open: Object.fromEntries(S.open), hiddenGames: [...S.hideGames], ignored: [...S.skip], bookmarks: [...S.bookmarks], ui: UI });
  const saveSkip = () => savePrefs();          // bookmarks and ignored quests are global, like on the achievement dashboard

  // ---------- Hypixel time ----------
  // Every date and clock time on this page is shown in Hypixel's zone (US Eastern), where quests reset at midnight.
  const HX_ZONE = 'America/New_York';
  let tzOpt, hxDate, hxHourFmt, hxZoneFmt;
  function buildTz() {                                    // rebuilt when "Times shown in" changes
    tzOpt = UI.timeMode === 'local' ? {} : { timeZone: HX_ZONE };
    hxDate = new Intl.DateTimeFormat('en-CA', { ...tzOpt, year: 'numeric', month: '2-digit', day: '2-digit' });
    hxHourFmt = new Intl.DateTimeFormat('en-US', { ...tzOpt, hour: '2-digit', hourCycle: 'h23' });
    hxZoneFmt = new Intl.DateTimeFormat('en-US', { ...tzOpt, timeZoneName: 'short' });
  }
  buildTz();
  const tzIsHypixel = () => UI.timeMode !== 'local';
  const hxKey = ms => {                                   // 'YYYY-MM-DD' of this instant in the chosen zone
    const s = hxDate.format(ms);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const p = {}; hxDate.formatToParts(ms).forEach(x => { p[x.type] = x.value; });
    return `${p.year}-${p.month}-${p.day}`;
  };
  const hxHour = ms => parseInt(hxHourFmt.format(ms), 10) % 24;
  const hxYear = () => +hxKey(Date.now()).slice(0, 4);
  const hxAbbr = ms => { const z = hxZoneFmt.formatToParts(ms).find(p => p.type === 'timeZoneName'); return z ? z.value : 'ET'; };
  const hxTime = (ms, secs = true) => new Date(ms).toLocaleTimeString('en-US', { ...tzOpt, hour: 'numeric', minute: '2-digit', ...(secs ? { second: '2-digit' } : {}) });
  // Hypixel's clock ('hx') and the viewer's ('me') are shown side by side wherever it matters
  const zoneOf = w => w === 'hx' ? { timeZone: HX_ZONE } : {};
  const primaryZone = () => tzIsHypixel() ? 'hx' : 'me', otherZone = () => tzIsHypixel() ? 'me' : 'hx';
  const clock = (ms, w, secs = false) => new Date(ms).toLocaleTimeString('en-US', { ...zoneOf(w), hour: 'numeric', minute: '2-digit', ...(secs ? { second: '2-digit' } : {}) });
  const zoneAbbr = (ms, w) => { const z = new Intl.DateTimeFormat('en-US', { ...zoneOf(w), timeZoneName: 'short' }).formatToParts(ms).find(p => p.type === 'timeZoneName'); return z ? z.value : (w === 'hx' ? 'ET' : 'local'); };
  const zoneName = w => w === 'hx' ? 'Hypixel time' : 'your time';
  function zoneOffset(ms, w) {
    const f = new Intl.DateTimeFormat('en-US', { ...zoneOf(w), hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const o = {}; f.formatToParts(ms).forEach(p => { o[p.type] = p.value; });
    return Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour % 24, +o.minute, +o.second) - Math.floor(ms / 1000) * 1000;
  }
  function dayStart(key, w) {                              // the instant a calendar day ('YYYY-MM-DD') begins in that zone
    const [y, m, d] = key.split('-').map(Number), mid = Date.UTC(y, m - 1, d), noonOff = zoneOffset(mid + 12 * 3600000, w);
    let g = mid - noonOff;
    const off = zoneOffset(g, w);
    if (off !== noonOff) g = mid - off;
    return g;
  }
  const nextKey = k => keyOf(addDays(parseKey(k), 1));
  const prettyKey = k => parseKey(k).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const tzLabel = ms => tzIsHypixel() ? `Hypixel time (${hxAbbr(ms)})` : `Your time (${hxAbbr(ms)})`;
  // Plain calendar maths below (keyOf / parseKey / addDays) never touches a clock, so the browser zone doesn't matter there.
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const timeStr = ms => hxTime(ms);
  function dur(ms) {
    if (ms < 0) ms = 0;
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
    return d ? `${d}d ${h}h ${pad(m)}m` : `${h}h ${pad(m)}m ${pad(s % 60)}s`;
  }
  function ago(ms) {
    const s = (Date.now() - ms) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }
  // Site-wide game names by Hypixel quest id (hungergames is Blitz SG)
  const LABELS = { arcade: 'Arcade', arena: 'Arena Brawl', bedwars: 'Bed Wars', blitz: 'Blitz SG', hungergames: 'Blitz SG', buildbattle: 'Build Battle', copsandcrims: 'Cops and Crims', mcgo: 'Cops and Crims',
    duels: 'Duels', gingerbread: 'TKR', murder_mystery: 'Murder Mystery', murdermystery: 'Murder Mystery', paintball: 'Paintball', pit: 'The Pit', quake: 'Quakecraft', skyblock: 'SkyBlock',
    skywars: 'SkyWars', smash: 'Smash Heroes', supersmash: 'Smash Heroes', speed_uhc: 'Speed UHC', speeduhc: 'Speed UHC', tntgames: 'TNT Games', truecombat: 'Crazy Walls', uhc: 'UHC',
    vampirez: 'VampireZ', walls3: 'Mega Walls', walls: 'Walls', warlords: 'Warlords', battleground: 'Warlords', woolgames: 'Wool Games', halloween: 'Halloween', christmas: 'Christmas',
    easter: 'Easter', summer: 'Summer', seasonal: 'Seasonal', general: 'General' };
  LABELS.__bm = 'Bookmarked';
  const gname = k => LABELS[k] || (S.data && S.data.gameNames[k]) || k;
  const showLoader = m => { if (typeof window.showLoader === 'function') window.showLoader(m); };
  const hideLoader = () => { if (typeof window.hideLoader === 'function') window.hideLoader(); };
  function showError(msg) { const b = $('errorBox'); b.textContent = msg || ''; b.classList.toggle('hidden', !msg); }

  // Game icons live in img/games/. Exact filenames (case matters on Vercel):
  const ICON_FILES = { hungergames: 'SG', arcade: 'Arcade', arena: 'Arena', bedwars: 'BedWars', buildbattle: 'BuildBattle', truecombat: 'CrazyWalls', copsandcrims: 'CVC', mcgo: 'CVC',
    duels: 'Duels', general: 'General', housing: 'Housing', walls3: 'MegaWalls', megawalls: 'MegaWalls', murder_mystery: 'MurderMystery', murdermystery: 'MurderMystery',
    paintball: 'Paintball', pit: 'Pit', quake: 'Quakecraft', blitz: 'SG', skyblock: 'SkyBlock', skyclash: 'SkyClash', skywars: 'Skywars', supersmash: 'SmashHeroes',
    smash: 'SmashHeroes', speeduhc: 'SpeedUHC', speed_uhc: 'SpeedUHC', tntgames: 'TNT', gingerbread: 'TurboKartRacers', uhc: 'UHC', vampirez: 'VampireZ',
    walls: 'Walls', battleground: 'Warlords', woolgames: 'WoolGames' };
  const SEASONAL = ['halloween', 'christmas', 'easter', 'summer', 'seasonal'];   // img/games/<name>.png (no -64)
  // Same rules as the achievement dashboard: Settings > Game Icon Style (Theme Default / Classic Minecraft Items / Modern Badges)
  const CAB_NAME = { blitz: 'Blitz', hungergames: 'Blitz', pit: 'Pit', quake: 'Quake' };       // where the dashboard's name differs from ours
  const MC_ITEMS = {
    "Arcade": "slime_ball.png", "Wool Games": "wool.png", "SkyBlock": "skyblock.png", "Bed Wars": "bed.png", "SkyWars": "eye_of_ender.png", "Murder Mystery": "bow.png",
    "Housing": "dark_oak_door.png", "TNT Games": "tnt.png", "Build Battle": "crafting_table.png", "Duels": "fishing_rod.png", "UHC": "golden_apple.png", "Speed UHC": "golden_carrot.png",
    "Cops and Crims": "iron_bars.png", "Mega Walls": "soul_sand.png", "Pit": "dirt.png", "Smash Heroes": "smash.png", "Warlords": "stone_axe.png", "Blitz": "diamond_sword.png",
    "VampireZ": "wither_skeleton_skull.png", "Quake": "firework.png", "Paintball": "snowball.png", "Arena Brawl": "blaze_powder.png", "Walls": "sand.png", "TKR": "minecart.png",
    "Seasonal": "cookie.png", "Easter": "easter.png", "Christmas": "christmas.png", "Summer": "summer.png", "Halloween": "halloween.png", "General": "book.png",
    "Crazy Walls": "crazywalls.png", "SkyClash": "fire_charge.png"
  };
  const BADGES = {
    "Seasonal": "seasonal.png", "Summer": "summer.png", "Christmas": "christmas.png", "Easter": "easter.png", "Halloween": "halloween.png", "Arcade": "Arcade-64.png",
    "Bed Wars": "BedWars-64.png", "Build Battle": "BuildBattle-64.png", "Cops and Crims": "CVC-64.png", "Duels": "Duels-64.png", "Mega Walls": "MegaWalls-64.png",
    "Murder Mystery": "MurderMystery-64.png", "Pit": "Pit-64.png", "Blitz": "SG-64.png", "SkyBlock": "SkyBlock-64.png", "SkyWars": "Skywars-64.png", "Smash Heroes": "SmashHeroes-64.png",
    "Speed UHC": "SpeedUHC-64.png", "TNT Games": "TNT-64.png", "UHC": "UHC-64.png", "Warlords": "Warlords-64.png", "Wool Games": "WoolGames-64.png", "Arena Brawl": "Arena-64.png",
    "Paintball": "Paintball-64.png", "Quake": "Quakecraft-64.png", "VampireZ": "VampireZ-64.png", "Walls": "Walls-64.png", "TKR": "TurboKartRacers-64.png", "Crazy Walls": "CrazyWalls-64.png",
    "SkyClash": "SkyClash-64.png"
  };
  const themeAttr = () => (document.documentElement && document.documentElement.getAttribute('data-theme')) || '';
  const iconSig = () => `${localStorage.getItem('litstats_icon_mode') || 'theme'}|${themeAttr()}`;
  function siteIconUrl(key) {
    const name = CAB_NAME[key] || LABELS[key] || key;
    const pref = localStorage.getItem('litstats_icon_mode') || 'theme';
    if ((pref === 'classic' || (pref === 'theme' && themeAttr() === 'minecraft')) && MC_ITEMS[name]) return `/img/mc/${MC_ITEMS[name]}`;
    return `/img/games/${BADGES[name] || name.replace(/\s/g, '') + '-64.png'}`;
  }
  function iconTag(key, cls = 'qt-gicon', icon) {
    const k = icon || key, c = [siteIconUrl(k)];
    if (SEASONAL.includes(k)) c.push(`img/games/${k}.png`);
    if (ICON_FILES[k]) c.push(`img/games/${ICON_FILES[k]}-64.png`);
    c.push('img/xp.png');
    const cands = [...new Set(c)];
    return `<img class="${cls}" src="${cands[0]}" data-c="${cands.join('|')}" data-i="0" alt="" loading="lazy">`;
  }
  document.addEventListener('error', e => {
    const im = e.target;
    if (!(im instanceof HTMLImageElement) || !im.dataset.c) return;
    const c = im.dataset.c.split('|'), i = +im.dataset.i + 1;
    if (i < c.length) { im.dataset.i = i; im.src = c[i]; } else im.style.visibility = 'hidden';
  }, true);

  // ---------- manual edits (assets/js/quest-overrides.js) ----------
  // Keys match by id, or by name ignoring case, punctuation and the "Daily Quest:" prefix.
  const PREFIX_RE = /^(daily|weekly|monthly|mythic|special)\s+quest:\s*/i;
  const norm = t => String(t).toLowerCase().replace(PREFIX_RE, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const OV = window.QUEST_OVERRIDES || {}, OVN = {};
  Object.entries(OV).forEach(([k, v]) => { const [g, n] = k.includes('|') ? k.split('|') : [null, k]; OVN[(g ? g.trim().toLowerCase() + '|' : '') + norm(n)] = v; });
  const toLines = v => v == null ? null : (Array.isArray(v) ? v : String(v).split('\n'));
  const SPLIT = /\s+(?=(?:Kill|Win|Get|Play|Deal|Heal|Collect|Complete|Earn|Destroy|Capture|Score|Break|Reach|Place|Open|Defeat|Assist|Eliminate|Survive|Gain|Finish)\b)/g;
  function decorate(quests) {
    return quests.map(x => {
      // safety net if the API still sends raw names/descriptions
      const m = x.name.match(PREFIX_RE);
      if (m) {
        const p = m[1].toLowerCase();
        x.name = x.name.slice(m[0].length);
        x.kind = p === 'weekly' ? 'weekly' : p === 'monthly' ? 'monthly' : p === 'special' ? 'special' : 'daily';
        if (p === 'mythic') x.tag = 'Mythic';
      }
      let d = String(x.desc || '').replace(/§./g, '').replace(/%%\w+%%/g, '').replace(/[ \t]+/g, ' ').trim();
      if (!d.includes('\n') && x.obj.length > 1) d = d.replace(SPLIT, '\n');
      x.desc = d;
      const o = OV[x.id] || OVN[`${x.game}|${norm(x.name)}`] || OVN[norm(x.name)] || {};
      if (x.tag === 'Special') x.tag = null;                // 'Special' is the quest's kind, shown by its tab / label
      if (o.hide) return null;
      x.easy = !!o.easy; x.icon = o.icon || null; x.info = toLines(o.info) || [];
      if (o.name) x.name = o.name;
      if (o.kind) x.kind = o.kind;
      x.lines = toLines(o.desc) || (x.desc ? x.desc.split('\n') : []);
      return x;
    }).filter(Boolean);
  }

  // Hover tooltip (one floating element, so it never gets clipped or depends on CSS)
  let tipBox = null;
  function showTip(t) {
    if (!tipBox) {
      tipBox = document.createElement('div');
      // Updated background, color, and border to use theme variables
      tipBox.style.cssText = 'position:fixed;z-index:9999;display:none;max-width:320px;padding:10px 12px;border-radius:10px;background:var(--surface);color:var(--text);border:1px solid var(--border);font-size:12px;line-height:1.55;box-shadow:0 10px 28px rgba(0,0,0,.4);pointer-events:none;white-space:pre-line;text-align:left';
      document.body.appendChild(tipBox);
    }
    tipBox.textContent = t.dataset.info || t.dataset.tip; tipBox.style.display = 'block';
    const r = t.getBoundingClientRect(), w = tipBox.offsetWidth, h = tipBox.offsetHeight;
    const lx = t.dataset.tip ? r.left + r.width / 2 - w / 2 : r.right - w;
    tipBox.style.left = Math.max(8, Math.min(lx, window.innerWidth - w - 8)) + 'px';
    tipBox.style.top = (r.bottom + 8 + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 8) : r.bottom + 8) + 'px';
  }
  const hideTip = () => { if (tipBox) tipBox.style.display = 'none'; };
  const infoOf = e => e.target && e.target.closest ? e.target.closest('.qt-info,[data-tip]') : null;
  document.addEventListener('mouseover', e => { const t = infoOf(e); if (t) showTip(t); });
  document.addEventListener('mouseout', e => { if (infoOf(e)) hideTip(); });
  document.addEventListener('focusin', e => { const t = infoOf(e); if (t) showTip(t); });
  document.addEventListener('focusout', e => { if (infoOf(e)) hideTip(); });
  document.addEventListener('click', e => { const t = infoOf(e); if (t) showTip(t); else hideTip(); });

  // ---------- rank / name colours ----------
  function rankView(d) {
    const r = d.rank || 'NON', plus = MC[d.rankPlusColor] || MC.RED, sp = (c, t) => `<span style="color:${c};${['#000000', '#555555', '#0000AA', '#AA0000', '#00AA00', '#AA00AA', '#00AAAA'].includes(c) ? 'text-shadow:0 0 3px rgba(255,255,255,.55)' : ''}">${t}</span>`;
    switch (r) {
      case 'MVP++': { const c = d.monthlyRankColor === 'AQUA' ? MC.AQUA : MC.GOLD; return { c, tag: `[MVP${sp(plus, '++')}]` }; }
      case 'MVP+': return { c: MC.AQUA, tag: `[MVP${sp(plus, '+')}]` };
      case 'MVP': return { c: MC.AQUA, tag: '[MVP]' };
      case 'VIP+': return { c: MC.GREEN, tag: `[VIP${sp(MC.GOLD, '+')}]` };
      case 'VIP': return { c: MC.GREEN, tag: '[VIP]' };
      case 'ADMIN': case 'OWNER': return { c: MC.RED, tag: `[${r}]` };
      case 'YOUTUBER': return { c: MC.RED, tag: '[YOUTUBE]' };
      case 'MODERATOR': case 'MOD': return { c: MC.DARK_GREEN, tag: '[MOD]' };
      case 'HELPER': return { c: MC.BLUE, tag: '[HELPER]' };
      case 'NON': return { c: MC.GRAY, tag: '' };
      default: return { c: MC.WHITE, tag: esc(r) };
    }
  }

  // ---------- loading ----------
  const needStreak = () => UI.secStats;
  async function fetchQuest(param, history, streak) {
    const res = await fetch(`${API}?${param}${history ? '&history=1' : ''}${streak ? '&streak=1' : ''}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || (res.status === 404 ? 'The /api/quest endpoint was not found on api.litstats.com.' : `Request failed (${res.status})`));
    return body;
  }

  async function loadPlayer(q, opts = {}) {
    q = String(q || '').trim();
    if (!q) return;
    showError('');
    const uuidLike = /^[0-9a-f]{32}$/i.test(q.replace(/-/g, ''));
    const param = uuidLike ? `uuid=${q.replace(/-/g, '')}` : `name=${encodeURIComponent(q)}`;
    if (!opts.silent) { $('qt-empty').classList.add('hidden'); $('qt-content').classList.add('hidden'); showLoader('Loading quests...'); }
    try {
      const body = await fetchQuest(param, opts.silent && S.calOpen, needStreak());
      if (opts.silent && !body.history && S.data) body.history = S.data.history;   // keep history already loaded
      if (opts.silent && !body.streak && S.data && S.data.streak) body.streak = S.data.streak;
      body.quests = decorate(body.quests);
      S.data = body; S.uuid = body.uuid; S.name = body.name || q; S.param = `uuid=${body.uuid}`;
      const legacy = Store.player(body.uuid).skip || [];          // older versions saved ignored quests per player; they are global now
      if (legacy.length) { legacy.forEach(id => S.skip.add(id)); Store.savePlayer(body.uuid, { skip: [] }); savePrefs(); }
      if (!opts.silent) S.view = 'all';
      if (!opts.silent) {
        S.calOpen = false; S.hasHist = false; S.events = []; S.days = new Map(); S.sel = null; S.gamesOpen = !!UI.gamesOpen; S.gamesExpanded = new Set();
        const u = new URL(location.href); u.searchParams.delete('uuid'); u.searchParams.delete('player'); u.searchParams.set('name', S.name);
        history.replaceState(null, '', u);
      } else if (body.history) prepare();
      render();
      if (!opts.silent) {
        loadExtras(S.uuid);
        histPromise = null;
        if (UI.calAuto && UI.secCalendar) showCalendar();
        else if (needStreak() && !body.streak) loadHistory().then(() => { if (S.data) renderTotals(); }).catch(() => {});   // older API: get the streak from history
      }
    } catch (e) {
      if (!opts.silent) { $('qt-empty').classList.remove('hidden'); $('qt-empty').innerHTML = '<strong>Look up a player</strong>See what they have left today and this week, their progress, and a calendar of every quest they have ever finished.'; showError(e.message); }
    } finally { if (!opts.silent) hideLoader(); }
  }

  // /api/player is also what adds a searched player to the shared max-games list, and it knows the player's country (for the flag).
  const extras = {};
  function applyFlag() {
    const el = $('p-bg-flag'); if (!el) return;
    const c = (extras[S.uuid] || {}).country;
    const url = c && c !== 'Unknown' && typeof window.getFlagUrl === 'function' ? window.getFlagUrl(c) : null;
    el.style.backgroundImage = url ? `url("${url}")` : '';
    el.style.display = url ? 'block' : 'none';
  }
  function loadExtras(uuid) {
    if (!REGISTER_MAXGAMES || !uuid) return;
    if (extras[uuid]) { applyFlag(); return; }
    extras[uuid] = {};
    fetch(`https://api.litstats.com/api/player?uuid=${encodeURIComponent(uuid)}`).then(r => r.ok ? r.json() : null)
      .then(d => { extras[uuid] = { country: d && d.country ? d.country : null }; if (S.uuid === uuid) applyFlag(); }).catch(() => {});
  }

  // history -> events [{ts(ms), qi}] grouped by local day (only runs when the calendar is opened)
  function prepare() {
    const h = S.data.history;
    S.events = []; S.days = new Map();
    let sec = 0;
    for (let i = 0; i < h.t.length; i++) {
      sec += h.t[i];
      S.events.push({ ts: sec * 1000, qi: h.q[i] });
      const k = hxKey(sec * 1000);
      if (!S.days.has(k)) S.days.set(k, []);
      S.days.get(k).push(i);
    }
    S.hasHist = true;
    const years = yearsList();
    if (!years.includes(S.year)) S.year = years[0];
  }
  function yearsList() {
    const cur = hxYear();
    const first = S.events.length ? +hxKey(S.events[0].ts).slice(0, 4) : cur;
    const out = []; for (let y = cur; y >= first; y--) out.push(y);
    return out;
  }

  // ---------- render: header / totals ----------
  function render() {
    const d = S.data, rv = rankView(d);
    $('qt-empty').classList.add('hidden'); $('qt-content').classList.remove('hidden');
    const n = $('p-name'); n.textContent = S.name; n.style.color = rv.c;
    $('p-avatar').src = `https://vzge.me/bust/${d.uuid}.png`;
    const cs = getComputedStyle(n);
    const tp = $('qt-total-pill');
    if (tp) {
      const topG = Object.entries(d.byGame || {}).filter(([g]) => g !== 'other').sort((a, b) => b[1] - a[1])[0];
      tp.textContent = `${fmt(d.total)} quests`; tp.title = topG ? `Most in ${gname(topG[0])} (${fmt(topG[1])})` : '';
    }
    applyFlag();
    const r = $('p-rank'); r.className = ''; r.style.cssText = `font-size:${cs.fontSize};line-height:${cs.lineHeight};font-weight:${cs.fontWeight};margin:0 10px 0 0;color:${rv.c};display:${rv.tag ? 'inline' : 'none'}`; r.innerHTML = rv.tag;
    const nameRow = n.parentElement; if (nameRow) { nameRow.style.display = 'flex'; nameRow.style.alignItems = 'baseline'; }
    renderPills();
    startCountdown();
    $('qt-cal-body').classList.toggle('hidden', !S.calOpen);
    $('qt-year').classList.toggle('hidden', !S.calOpen);
    $('qt-cal-open').textContent = S.calOpen ? 'Hide calendar' : 'Show calendar';
    ['special', 'monthly'].forEach(k => {
      const b = document.querySelector(`#qt-kind [data-kind="${k}"]`);
      if (b) b.classList.toggle('hidden', !d.quests.some(x => x.kind === k));
    });
    if (['special', 'monthly'].includes(S.kind) && !d.quests.some(x => x.kind === S.kind)) S.kind = 'all';
    $('qt-kind').querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.kind === S.kind));
    $('qt-sort').value = S.sort;
    renderTotals(); renderGameSelect(); renderLists(); renderGames();
    if (S.calOpen && S.hasHist) renderCalendar();
  }

  function updateCountdowns() {
    const r = S.data && S.data.resets; if (!r) return;
    const now = Date.now(), set = (id, ms) => { const el = $(id); if (el && ms) el.textContent = dur(ms - now); };
    set('qt-cd-d', r.dailyNext); set('qt-cd-w', r.weeklyNext); set('qt-cd-m', r.monthlyNext);
  }

  function renderPills() {
    const row = $('qt-reset-row'), d = S.data;
    if (!row || !d) return;
    const rs = d.resets, hasMonthly = d.quests.some(x => x.kind === 'monthly');
    const p = primaryZone(), o = otherZone();
    const wd = (ms, w) => new Date(ms).toLocaleDateString('en-US', { ...zoneOf(w), weekday: 'short' });
    const md = (ms, w) => new Date(ms).toLocaleDateString('en-US', { ...zoneOf(w), month: 'short', day: 'numeric' });
    const both = (ms, fmtDay) => [p, o].map(w => `${fmtDay ? fmtDay(ms, w) + ' ' : ''}${clock(ms, w)} ${zoneAbbr(ms, w)}`).join(' · ');
    if (!UI.resetTimers) { row.innerHTML = ''; return; }
    const pill = (on, label, id, ms, fmtDay) => on ? `<span class="qt-pill">${label} reset in <b id="${id}">-</b><small>${both(ms, fmtDay)}</small></span>` : '';
    row.innerHTML = pill(true, 'Daily', 'qt-cd-d', rs.dailyNext) + pill(true, 'Weekly', 'qt-cd-w', rs.weeklyNext, wd) +
      (hasMonthly && rs.monthlyNext ? pill(true, 'Monthly', 'qt-cd-m', rs.monthlyNext, md) : '');
    updateCountdowns();
  }

  function startCountdown() {
    clearInterval(S.timer);
    const tick = () => {
      const now = Date.now(), r = S.data.resets;
      updateCountdowns();
      if (now >= r.dailyNext && !S.refreshing) {          // a reset just passed: pull fresh progress
        S.refreshing = true;
        loadPlayer(S.uuid, { silent: true }).finally(() => { S.refreshing = false; });
      }
    };
    tick(); S.timer = setInterval(tick, 1000);
  }

  const isHiddenQ = x => S.skip.has(x.id) || S.hideGames.has(x.game);

  function renderTotals() {
    const q = S.data.quests.filter(x => !isHiddenQ(x) && !isCompOut(x));          // hidden quests, hidden games and excluded comp games don't count
    const nHidden = S.data.quests.filter(x => isHiddenQ(x) && !isCompOut(x)).length;
    const count = k => { const l = q.filter(x => x.kind === k); return { done: l.filter(x => x.status === 'done').length, all: l.length, xp: l.filter(x => x.status !== 'done').reduce((a, x) => a + x.xp, 0) }; };
    const bar = (a, b) => `<div class="qt-bar ${a === b && b ? 'done' : ''}"><i style="width:${b ? Math.round(a / b * 100) : 0}%"></i></div>`;
    const card = (label, value, sub, extra = '') => `<div class="qt-stat"><div class="qt-stat-label">${label}</div><div class="qt-stat-value">${value}</div>${extra}<div class="qt-stat-sub">${sub}</div></div>`;
    const prog = (label, k) => { const c = count(k); return card(label, `${c.done}<small> / ${c.all}</small>`, `${c.all - c.done} left<span class="qt-xp-any">, ${fmt(c.xp)} XP</span>`, bar(c.done, c.all)); };
    const top = Object.entries(S.data.byGame || {}).filter(([g]) => g !== 'other' && !(UI.excludeComp && COMP_GAMES.has(g))).sort((a, b) => b[1] - a[1])[0];
    const xpLeft = q.filter(x => x.status !== 'done').reduce((a, x) => a + x.xp, 0), easyLeft = q.filter(x => x.easy && x.status !== 'done').length;
    const st = getStreak(), days = n => `${n}<small> day${n === 1 ? '' : 's'}</small>`;
    const out = [];
    out.push(prog('Daily quests', 'daily'));
    out.push(prog('Weekly quests', 'weekly'));
    out.push(card('Current streak', st ? days(st.current) : '-', !st ? 'Loading...' : st.doneToday ? `Today counted ${TICK}` : st.current ? `Quest within ${dur(S.data.resets.dailyNext - Date.now())} to keep it` : 'Quest today to start one'));
    $('qt-totals').innerHTML = out.join('');
  }

  // ---------- render: quest board ----------
  const isEasy = x => !!x.easy;
  const fracOf = x => x.status === 'done' ? 1 : x.obj.length ? x.obj.reduce((a, o) => a + o[0] / o[1], 0) / x.obj.length : 0;
  const autoCols = () => UI.layout === 'list' ? (window.innerWidth >= 1500 ? 2 : 1) : window.innerWidth >= 1180 ? 3 : window.innerWidth >= 760 ? 2 : 1;
  const colCount = () => UI.columns === 'auto' ? autoCols() : Math.min(+UI.columns || 3, window.innerWidth < 760 ? 1 : window.innerWidth < 1180 ? 2 : 4);
  const cnt = o => `${fmt(o[0])}/${fmt(o[1])}`;

  function setGame(g) {
    S.game = g || 'all';
    const sel = $('qt-game'); if (sel) sel.value = S.game;
    renderChips(); renderLists();
  }
  function renderChips() {
    const box = $('qt-chips'); if (!box || !S.data) return;
    const byG = {};
    S.data.quests.filter(x => !isCompOut(x) && !isHiddenQ(x)).forEach(x => {
      const o = byG[x.game] || (byG[x.game] = { done: 0, total: 0 }); o.total++; if (x.status === 'done') o.done++;
    });
    const games = Object.keys(byG).sort((a, b) => gname(a).localeCompare(gname(b)));
    box.innerHTML = `<div class="filter-icon-grid qt-chip-grid">${games.map(g => {
      const { done, total } = byG[g], pct = total ? done / total * 100 : 0;
      return `<div class="filter-pill-btn ${S.game === g ? 'active' : ''}" role="button" tabindex="0" data-g="${esc(g)}" title="${esc(gname(g))}: ${done} of ${total} done">` +
        `<div class="filter-pill-fill" style="width:${pct}%;background-color:${pct >= 100 ? 'var(--qt-green)' : 'color-mix(in srgb, var(--accent) 45%, transparent)'}"></div>` +
        `${iconTag(g, 'filter-pill-icon')}<span class="filter-pill-name">${esc(gname(g))}</span><span class="filter-pill-stat">${done} / ${total}</span></div>`;
    }).join('')}</div>`;
  }
  function renderViewButtons() {
    const bm = $('qt-bm-btn'), ig = $('qt-ign-btn'); if (!bm || !ig || !S.data) return;
    const q = S.data.quests.filter(x => !isCompOut(x));
    const nb = q.filter(x => S.bookmarks.has(x.id) && !isHiddenQ(x)).length, ni = q.filter(isHiddenQ).length;
    bm.textContent = S.view === 'bookmarks' ? 'View All' : `Bookmarks (${nb})`; bm.classList.toggle('active', S.view === 'bookmarks');
    ig.textContent = S.view === 'ignored' ? 'View All' : `Ignored (${ni})`; ig.classList.toggle('active', S.view === 'ignored');
  }

  function renderGameSelect() {
    const sel = $('qt-game'), keep = S.game;
    const games = [...new Set(S.data.quests.filter(x => !isCompOut(x)).map(x => x.game))].sort((a, b) => gname(a).localeCompare(gname(b)));
    sel.innerHTML = `<option value="all">All games</option>` + games.map(g => `<option value="${esc(g)}">${esc(gname(g))}</option>`).join('');
    sel.value = games.includes(keep) ? keep : 'all'; S.game = sel.value;
    const t = $('qt-toggle-done'); t.textContent = S.hideDone ? 'Show completed' : 'Hide completed'; t.setAttribute('aria-pressed', S.hideDone);
    $('qt-toggle-easy').setAttribute('aria-pressed', S.easy);
    renderChips();
  }

  // One quest as a checklist row. `flat` = shown outside a game card, so it carries its own kind badge.
  const pctOf = o => Math.round(o[0] / o[1] * 100);
  function actsHTML(x, done) {
    const hid = S.skip.has(x.id), bm = S.bookmarks.has(x.id);
    if (hid) return `<button type="button" class="qt-unskip" data-unskip="${esc(x.id)}">Restore</button>`;     // always available, even with the buttons switched off
    const star = `<button type="button" class="qt-act star ${bm ? 'on' : ''}" data-bm="${esc(x.id)}" title="${bm ? 'Remove bookmark' : 'Bookmark (pins to the top)'}" aria-label="Bookmark">${bm ? '★' : '☆'}</button>`;
    const ign = done ? '' : `<button type="button" class="qt-act" data-skip="${esc(x.id)}" title="Ignore this quest" aria-label="Ignore">\u2212</button>`;
    return `<span class="qt-acts">${star}${ign}</span>`;
  }
  const tagPills = (x, opts, done) => {
    const pills = [];
    if (opts.kindPill) pills.push(`<span class="qt-p ${x.kind}">${KIND_LABEL[x.kind] || 'Daily'}</span>`);
    if (x.tag && x.tag !== 'Special') pills.push(`<span class="qt-p tag">${esc(x.tag)}</span>`);
    if (x.once) pills.push('<span class="qt-p once" title="This quest can only be completed once">One-time</span>');
    if (!done && x.easy) pills.push('<span class="qt-p easy">Easy</span>');
    const tasksDone = x.obj.filter(o => o[0] >= o[1]).length;
    if (!done && x.obj.length > 1 && tasksDone > 0) pills.push(`<span class="qt-p tasks" title="${tasksDone} of ${x.obj.length} tasks finished">${tasksDone}/${x.obj.length} tasks</span>`);
    return pills.join('');
  };

  // List layout: one compact line per quest
  function lHTML(x, opts = {}) {
    const done = x.status === 'done', hid = S.skip.has(x.id), pct = Math.round(fracOf(x) * 100);
    const tasksDone = x.obj.filter(o => o[0] >= o[1]).length, multi = x.obj.length > 1;
    let prog = '', tip = '';
    if (done) prog = `<span class="qt-ok">Done ${x.last ? ago(x.last) : ''}</span>`;
    else if (x.obj.length) {
      const p = multi ? pct : pctOf(x.obj[0]);
      const label = multi ? `${tasksDone}/${x.obj.length} tasks` : cnt(x.obj[0]);
      prog = `<span class="qt-lr-bar ${p >= 100 ? 'full' : ''}"><i style="width:${p}%"></i></span><b class="qt-lr-count">${label}${UI.rowPct ? ` <span class="qt-pct">${p}%</span>` : ''}</b>`;
      if (multi) tip = ` title="${esc(x.lines.map((l, i) => `${l}: ${x.obj[i] ? cnt(x.obj[i]) : ''}`).join('\n'))}"`;
    }
    const xp = !done && x.xp ? `<span class="qt-xp">${fmt(x.xp)} XP</span>` : '';
    const info = x.info.length ? `<span class="qt-info" tabindex="0" role="note" aria-label="More info" data-info="${esc(x.info.join('\n'))}">ⓘ</span>` : '';
    return `<div class="qt-lr ${x.status}${hid ? ' is-hidden' : ''}" title="${esc(x.id)}">
      <span class="qt-st ${x.status}" style="--p:${pct}" aria-label="${x.status}"></span>
      ${opts.icon ? iconTag(x.game, 'qt-gicon sm', x.icon) : ''}
      <div class="qt-lr-main"><span class="qt-q-name">${esc(x.name)}</span>${tagPills(x, opts, done)}<span class="qt-lr-desc">${esc(x.lines.join(' · '))}</span></div>
      <div class="qt-lr-prog"${tip}>${prog}</div>${xp}${info}${actsHTML(x, done)}</div>`;
  }

  function qHTML(x, opts = {}) {
    if (UI.layout === 'list') return lHTML(x, opts);
    const done = x.status === 'done', pct = Math.round(fracOf(x) * 100);
    const hid = S.skip.has(x.id);
    const info = x.info.length ? `<span class="qt-info" tabindex="0" role="note" aria-label="More info" data-info="${esc(x.info.join('\n'))}">ⓘ</span>` : '';
    const side = done ? `<span class="qt-ok">Done ${x.last ? ago(x.last) : ''}</span>${actsHTML(x, done)}` : `${x.xp ? `<span class="qt-xp">${fmt(x.xp)} XP</span>` : ''}${info}${actsHTML(x, done)}`;

    // each task: finished = green + tick, otherwise the normal bar
    const objHTML = (label, o) => {
      const full = o[0] >= o[1];
      return `<div class="qt-obj${full ? ' is-done' : ''}"><div class="qt-obj-head"><span>${esc(label)}</span><b>${full ? '✓ ' : ''}${cnt(o)}${UI.rowPct ? ` <span class="qt-pct">${pctOf(o)}%</span>` : ''}</b></div>` +
        `<div class="qt-bar ${full ? 'obj-done' : ''}"><i style="width:${pctOf(o)}%"></i></div></div>`;
    };
    let body = '';
    if (!done) {
      const paired = x.lines.length === x.obj.length && x.obj.length > 0;
      if (paired) body = x.lines.map((l, i) => objHTML(l, x.obj[i])).join('');
      else body = (x.lines.length ? `<div class="qt-lines">${x.lines.map(l => `<div>${esc(l)}</div>`).join('')}</div>` : '') + x.obj.map(o => objHTML('', o)).join('');
    }
    return `<div class="qt-q ${x.status}${hid ? ' is-hidden' : ''}" title="${esc(x.id)}">
      <span class="qt-st ${x.status}" style="--p:${pct}" aria-label="${x.status}"></span>
      <div class="qt-q-top"><span class="qt-q-name">${opts.icon ? iconTag(x.game, 'qt-gicon sm', x.icon) : ''}${esc(x.name)}</span>${tagPills(x, opts, done)}</div>
      <div class="qt-q-side">${side}</div>
      ${body ? `<div class="qt-q-body">${body}</div>` : ''}</div>`;
  }

  const stRank = { progress: 0, todo: 1, done: 2 };
  const isOpen = (g, allDone) => S.open.has(g) ? S.open.get(g) : !allDone;

  const BM = '__bm';
  function groupHTML(g, items, all) {
    const done = all.filter(x => x.status === 'done').length, total = all.length, allDone = done === total;
    const single = items.length === 1;
    const kinds = ['daily', 'weekly', 'monthly', 'special'].filter(k => items.some(x => x.kind === k));
    const xpLeft = items.filter(x => x.status !== 'done').reduce((a, x) => a + x.xp, 0);
    const sorted = k => items.filter(x => x.kind === k).sort((a, b) => stRank[a.status] - stRank[b.status] || fracOf(b) - fracOf(a) || a.name.localeCompare(b.name));
    const body = kinds.map(k => {
      const list = sorted(k), d = list.filter(x => x.status === 'done').length;
      return (kinds.length > 1 ? `<div class="qt-sub"><span>${KIND_LABEL[k]}</span><span>${d}/${list.length}</span></div>` : '') +
        list.map(x => qHTML(x, { kindPill: kinds.length === 1, icon: g === BM })).join('');
    }).join('');
    const open = isOpen(g, allDone);
    return `<section class="qt-group ${open ? '' : 'closed'} ${allDone ? 'complete' : ''} ${S.hideGames.has(g) ? 'is-hidden' : ''}" data-g="${esc(g)}" data-done="${allDone ? 1 : 0}">
      <button type="button" class="qt-group-head" aria-expanded="${open}">
        ${g === BM ? '<span class="qt-gicon qt-bm-star">★</span>' : iconTag(g, 'qt-gicon')}<span class="qt-gname">${esc(gname(g))}</span>
        <span class="qt-gcount">${done}/${total}</span><span class="qt-gspace"></span>
        ${g === BM ? '' : S.hideGames.has(g) ? `<span class="qt-ghide restore" role="button" tabindex="0" data-unhidegame="${esc(g)}">Restore game</span>` : `<span class="qt-ghide" role="button" tabindex="0" data-hidegame="${esc(g)}" title="Hide ${esc(gname(g))} entirely (every player)" aria-label="Hide ${esc(gname(g))}">⊘</span>`}
        ${single || !xpLeft ? '' : `<span class="qt-gxp">${fmt(xpLeft)} XP left</span>`}<span class="qt-chev" aria-hidden="true"></span>
        ${single ? '' : `<span class="qt-gbar"><i style="width:${total ? Math.round(done / total * 100) : 0}%"></i></span>`}
      </button><div class="qt-group-body">${body}</div></section>`;
  }

  // Rough height so games can be dealt into the shortest column (masonry) without CSS columns re-balancing on collapse.
  function estimate(items, open) {
    if (!open) return 52;
    return 56 + items.reduce((a, x) => a + (x.status === 'done' ? 34 : 50 + 26 * Math.max(0, x.lines.length - 1) + 20 * Math.max(0, x.obj.length - 1)), 0) + 24;
  }

  function renderLists() {
    const f = S.filter.toLowerCase();
    const base = S.data.quests.filter(x => !isCompOut(x) && (S.kind === 'all' || x.kind === S.kind) && (S.game === 'all' || x.game === S.game) &&
      (!f || (x.name + ' ' + x.lines.join(' ') + ' ' + gname(x.game)).toLowerCase().includes(f)));
    renderViewButtons();
    const isBm = x => S.bookmarks.has(x.id);
    const shown = S.view === 'ignored' ? base.filter(isHiddenQ) : S.view === 'bookmarks' ? base.filter(x => isBm(x) && !isHiddenQ(x)) : base.filter(x => !isHiddenQ(x));
    const left = shown.filter(x => x.status !== 'done' && !isHiddenQ(x));
    $('qt-fast').innerHTML = `<span><b>${left.length}</b> left</span><span><b>${left.filter(isEasy).length}</b> easy</span><span class="qt-xp-any"><b>${fmt(left.reduce((a, x) => a + x.xp, 0))}</b> XP available</span>` +
      (S.sort === 'game' ? '<span class="qt-fast-links"><button type="button" data-act="collapse">Collapse all</button><button type="button" data-act="expand">Expand all</button></span>' : '');

    const list = shown.filter(x => !(S.hideDone && x.status === 'done') && !(S.easy && (x.status === 'done' || !isEasy(x))));
    if (!list.length) {
      const msg = S.view === 'ignored' ? 'Nothing is ignored. Use the − on a quest to hide it.' : S.view === 'bookmarks' ? 'No bookmarks yet. Use the ☆ on a quest to pin it here.' : base.length ? 'Nothing to show with these filters.' : 'No quests match your filters.';
      $('qt-lists').innerHTML = `<div class="qt-none">${msg}</div>`; return;
    }

    if (S.sort !== 'game') {
      const cmp = {
        easy: (a, b) => (isEasy(b) - isEasy(a)) || fracOf(b) - fracOf(a) || b.xp - a.xp,
        close: (a, b) => fracOf(b) - fracOf(a) || b.xp - a.xp,
        xp: (a, b) => b.xp - a.xp
      }[S.sort];
      list.sort((a, b) => (a.status === 'done') - (b.status === 'done') || (isBm(b) - isBm(a)) || cmp(a, b));     // bookmarks first
      $('qt-lists').innerHTML = UI.layout === 'list'
        ? `<div class="qt-flatlist">${list.map(x => qHTML(x, { kindPill: true, icon: true })).join('')}</div>`
        : `<div class="qt-flat" style="--cols:${colCount()}">${list.map(x => `<div class="qt-fcard">${qHTML(x, { kindPill: true, icon: true })}</div>`).join('')}</div>`;
      return;
    }

    // Bookmarked quests are pulled into their own card at the top; everything else is grouped by game.
    const pinned = S.view === 'ignored' ? [] : list.filter(isBm);
    const pinnedIds = new Set(pinned.map(x => x.id));
    const groups = {};
    list.filter(x => !pinnedIds.has(x.id)).forEach(x => (groups[x.game] = groups[x.game] || []).push(x));
    const keys = Object.keys(groups).sort((a, b) => {
      const la = shown.some(x => x.game === a && x.status !== 'done' && !isHiddenQ(x)), lb = shown.some(x => x.game === b && x.status !== 'done' && !isHiddenQ(x));
      return (lb - la) || gname(a).localeCompare(gname(b));
    });
    const entries = [];
    if (pinned.length) entries.push({ g: BM, items: pinned, all: shown.filter(isBm) });
    keys.forEach(g => entries.push({ g, items: groups[g], all: shown.filter(x => x.game === g && !(S.view !== 'ignored' && isBm(x))) }));
    const n = colCount(), cols = Array.from({ length: n }, () => ({ h: 0, html: '' }));
    entries.forEach(({ g, items, all }) => {
      const allDone = all.every(x => x.status === 'done'), open = isOpen(g, allDone && g !== BM);
      const target = cols.reduce((m, c) => c.h < m.h ? c : m, cols[0]);
      target.html += groupHTML(g, items, all); target.h += estimate(items, open) + 12;
    });
    $('qt-lists').innerHTML = `<div class="qt-cols" style="--cols:${n}">${cols.map(c => `<div class="qt-col">${c.html}</div>`).join('')}</div>`;
  }

  // ---------- calendar ----------
  function setCalUI(open) {
    S.calOpen = open;
    $('qt-cal-body').classList.toggle('hidden', !open); $('qt-year').classList.toggle('hidden', !open);
    $('qt-cal-open').textContent = open ? 'Hide calendar' : 'Show calendar';
  }
  async function showCalendar() {
    setCalUI(true);
    if (S.hasHist) return renderCalendar();
    const uuid = S.uuid;
    $('qt-cal').innerHTML = ''; $('qt-day').innerHTML = ''; $('qt-cal-stats').innerHTML = '<span class="qt-loading">Loading questing history...</span>';
    try {
      await loadHistory();
      if (S.uuid !== uuid || !S.hasHist) return;                       // searched someone else meanwhile
      renderCalendar(); renderTotals();                                // the streak card can use the history too
    } catch (e) { if (S.uuid === uuid) { $('qt-cal-stats').innerHTML = `<span class="qt-loading">Couldn't load history: ${esc(e.message)}</span>`; } }
  }
  const toggleCalendar = () => S.calOpen ? setCalUI(false) : showCalendar();

  function streaks() {
    const keys = [...S.days.keys()].sort();
    let best = 0, run = 0, prev = null, bestEnd = null;
    for (const k of keys) { const dt = parseKey(k); run = prev && Math.round((dt - prev) / DAY) === 1 ? run + 1 : 1; if (run > best) { best = run; bestEnd = k; } prev = dt; }
    const today = hxKey(Date.now());
    let cur = 0, cursor = parseKey(today);
    if (!S.days.has(keyOf(cursor))) cursor = addDays(cursor, -1);
    while (S.days.has(keyOf(cursor))) { cur++; cursor = addDays(cursor, -1); }
    return { cur, best, active: keys.length, doneToday: S.days.has(today), bestFrom: bestEnd ? keyOf(addDays(parseKey(bestEnd), -(best - 1))) : null, bestTo: bestEnd };
  }
  // The streak card uses the server's number when it has one; otherwise (older API) it is worked out from the calendar history.
  function getStreak() {
    const fromHist = () => { if (!S.hasHist) return null; const s = streaks(); return { current: s.cur, best: s.best, doneToday: s.doneToday, bestFrom: s.bestFrom, bestTo: s.bestTo }; };
    if (!tzIsHypixel()) return fromHist() || null;          // "my time" days differ from Hypixel's, so don't mix in the server's number
    return (S.data && S.data.streak) || fromHist();
  }
  let histPromise = null;
  async function loadHistory() {                            // one shared fetch for the calendar and the streak fallback
    if (S.hasHist) return;
    const uuid = S.uuid;
    if (!histPromise) histPromise = fetchQuest(S.param, true).then(body => { if (S.uuid === uuid && S.data) { S.data.history = body.history; prepare(); } }).finally(() => { histPromise = null; });
    await histPromise;
  }

  function renderCalendar() {
    const ys = $('qt-year'), years = yearsList();
    ys.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join(''); ys.value = S.year;

    const Y = S.year, jan1 = new Date(Y, 0, 1), start = jan1.getDay();
    const nDays = Math.round((new Date(Y + 1, 0, 1) - jan1) / DAY);
    const todayKey = hxKey(Date.now());
    let max = 0, total = 0, active = 0, bestKey = null;
    const hours = new Array(24).fill(0), cells = [];
    for (let i = 0; i < nDays; i++) {
      const k = keyOf(addDays(jan1, i)), evs = S.days.get(k) || [];
      if (evs.length) { total += evs.length; active++; if (evs.length > max) { max = evs.length; bestKey = k; } evs.forEach(e => hours[hxHour(S.events[e].ts)]++); }
      cells.push({ i, k, n: evs.length, future: k > todayKey });
    }
    const lv = n => !n ? 0 : Math.min(4, Math.ceil(n / max * 4));
    const grid = cells.map(c => {
      const col = Math.floor((start + c.i) / 7) + 1, row = (start + c.i) % 7 + 1, label = `${c.k}: ${c.n} quest${c.n === 1 ? '' : 's'}`;
      return `<button type="button" class="lv${lv(c.n)}" data-k="${c.k}" data-i="${c.i}" style="grid-column:${col};grid-row:${row};${c.future ? 'opacity:.3;' : ''}" title="${label}" aria-label="${label}" ${c.future ? 'disabled' : ''}></button>`;
    }).join('');
    const months = Array.from({ length: 12 }, (_, m) => {
      const i = Math.round((new Date(Y, m, 1) - jan1) / DAY);
      return `<span style="grid-column:${Math.floor((start + i) / 7) + 1}">${new Date(Y, m, 1).toLocaleString([], { month: 'short' })}</span>`;
    }).join('');
    $('qt-cal').innerHTML = `<div class="qt-cal-days"><span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span><span></span></div>
      <div style="display:grid;gap:4px"><div class="qt-cal-months">${months}</div><div class="qt-cal-grid" id="qt-cal-grid">${grid}</div></div>`;

    const sk = streaks(), p = primaryZone(), o = otherZone();
    const peak = hours.indexOf(Math.max(...hours)), h12 = h => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
    const peakAt = dayStart(todayKey, p) + peak * 3600000;
    const rs = S.data.resets, nowMs = Date.now();
    const noteHx = `Quests reset at ${clock(rs.dailyNext, 'hx')} ${zoneAbbr(rs.dailyNext, 'hx')}, which is ${clock(rs.dailyNext, 'me')} ${zoneAbbr(rs.dailyNext, 'me')} for you, so a quest day runs from ${clock(rs.dailyNext, 'me')} to ${clock(rs.dailyNext, 'me')} your time.`;
    const note = tzIsHypixel()
      ? `${noteHx} Days and hours below are Hypixel time; your time is shown next to them.`
      : `${noteHx} Days and hours below follow your own midnight, so a quest done after ${clock(rs.dailyNext, 'me')} counts toward the next quest day. Switch "Show times in" to Hypixel time in settings to group by quest day.`;
    $('qt-cal-stats').innerHTML = `
      <div class="qt-cs-left">
        <div><b>${active ? (total / active).toFixed(1) : '0'}</b>Quests per day<small>${active} active day${active === 1 ? '' : 's'} in ${Y}</small></div>
        <div id="qt-sel-stat"></div>
      </div>
      <div class="qt-cs-right">
        <div class="qt-cs-grp">
          <div><b>${max}</b>Best day<small>${bestKey ? prettyKey(bestKey) : '-'}</small></div>
          <div><b>${total ? h12(peak) + ' ' + zoneAbbr(peakAt, p) : '-'}</b>Most active hour<small>${total ? `${clock(peakAt, o)} ${zoneAbbr(peakAt, o)}` : ''}</small></div>
        </div>
        <div class="qt-cs-grp sep">
          <div><b>${sk.cur}<span> day${sk.cur === 1 ? '' : 's'}</span></b>Current streak<small>${sk.doneToday ? `Today counted ${TICK}` : sk.cur ? 'Quest before the reset to keep it' : '&nbsp;'}</small></div>
          <div><b>${sk.best}<span> day${sk.best === 1 ? '' : 's'}</span></b>Highest streak<small>${sk.bestFrom ? `${prettyKey(sk.bestFrom)} to ${prettyKey(sk.bestTo)}` : '&nbsp;'}</small></div>
        </div>
      </div>
      <div class="qt-cal-note">${esc(note)}</div>`;

    buildScrub(nDays);
    let k = S.sel && S.sel.startsWith(String(Y)) ? S.sel : null;
    if (!k) {
      if (Y === hxYear()) k = todayKey;
      else { const act = cells.filter(c => c.n).pop(); k = act ? act.k : keyOf(new Date(Y, 11, 31)); }
    }
    selectDay(k);
  }

  function buildScrub(nDays) {
    let box = $('qt-scrub');
    if (!box) {
      box = document.createElement('div'); box.id = 'qt-scrub'; box.className = 'qt-scrub';
      box.innerHTML = `<button type="button" id="qt-prev" aria-label="Previous day">‹</button>
        <input type="range" id="qt-range" min="0" value="0" step="1" aria-label="Scrub through the year">
        <button type="button" id="qt-next" aria-label="Next day">›</button><button type="button" id="qt-today">Today</button>`;
      $('qt-day').before(box);
      $('qt-range').addEventListener('input', e => selectDay(keyOf(addDays(new Date(S.year, 0, 1), +e.target.value))));
      $('qt-prev').addEventListener('click', () => step(-1));
      $('qt-next').addEventListener('click', () => step(1));
      $('qt-today').addEventListener('click', () => { S.year = hxYear(); S.sel = hxKey(Date.now()); renderCalendar(); });
    }
    $('qt-range').max = nDays - 1;
  }

  function step(n) {
    if (!S.sel) return;
    const d = addDays(parseKey(S.sel), n);
    if (keyOf(d) > hxKey(Date.now())) return;
    if (d.getFullYear() !== S.year) { S.year = d.getFullYear(); S.sel = keyOf(d); renderCalendar(); } else selectDay(keyOf(d));
  }

  function selectDay(k) {
    S.sel = k;
    document.querySelectorAll('#qt-cal-grid button.sel').forEach(b => b.classList.remove('sel'));
    const btn = document.querySelector(`#qt-cal-grid button[data-k="${k}"]`);
    if (btn) { btn.classList.add('sel'); $('qt-range').value = btn.dataset.i; }
    const evs = (S.days.get(k) || []).map(i => S.events[i]).sort((a, b) => a.ts - b.ts);
    const meta = S.data.history.qmeta;
    const selStat = $('qt-sel-stat');
    if (selStat) selStat.innerHTML = `<b>${evs.length}</b>Selected day<small>${parseKey(k).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</small>`;
    const head = parseKey(k).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const p = primaryZone(), o = otherZone();
    const start = dayStart(k, p), end = dayStart(nextKey(k), p);
    const when = (ms, w) => new Date(ms).toLocaleString('en-US', { ...zoneOf(w), month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    const windowTxt = `${tzIsHypixel() ? 'This quest day' : 'This day'} ran ${clock(start, p)} to ${clock(end, p)} ${zoneAbbr(start, p)} (${zoneName(p)}), which is ${when(start, o)} to ${when(end, o)} ${zoneAbbr(start, o)} (${zoneName(o)}).`;
    const h12 = h => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
    const axis = `<div class="qt-hours-axis">${[0, 6, 12, 18].map(h => `<span>${h12(h)}<i>${clock(start + h * 3600000, o)}</i></span>`).join('')}</div>`;
    const cap = `<div class="qt-hours-cap">Quests by hour. Top labels: ${zoneName(p)} (${zoneAbbr(start, p)}). Small labels: ${zoneName(o)} (${zoneAbbr(start, o)}). Hover a bar.</div>`;
    if (!evs.length) { $('qt-day').innerHTML = `<h3>${head}</h3><div class="qt-day-window">${esc(windowTxt)}</div><div class="qt-day-sum">No quests completed</div><div class="qt-day-games">&nbsp;</div><div class="qt-hours-wrap empty"><div class="qt-hours"></div>${axis}${cap}</div><ul class="qt-day-list"></ul>`; return; }
    const hrs = new Array(24).fill(0); evs.forEach(e => hrs[hxHour(e.ts)]++);
    const hm = Math.max(...hrs);
    const hourBars = `<div class="qt-hours-wrap"><div class="qt-hours">${hrs.map((n, h) => `<b data-tip="${h12(h)} to ${h12((h + 1) % 24)} (${clock(start + h * 3600000, o)} ${zoneAbbr(start, o)}): ${n} quest${n === 1 ? '' : 's'}"><i style="height:${n ? Math.max(14, n / hm * 100) : 4}%"></i></b>`).join('')}</div>${axis}${cap}</div>`;
    const byGame = {}; evs.forEach(e => { const g = meta[e.qi].game; byGame[g] = (byGame[g] || 0) + 1; });
    const gameLine = Object.entries(byGame).sort((a, b) => b[1] - a[1]).map(([g, n]) => `${esc(gname(g))} ${n}`).join(' · ');
    $('qt-day').innerHTML = `<h3>${head}</h3><div class="qt-day-window">${esc(windowTxt)}</div>
      <div class="qt-day-sum"><b>${evs.length}</b> quest${evs.length === 1 ? '' : 's'} · first ${clock(evs[0].ts, p, true)}, last ${clock(evs[evs.length - 1].ts, p, true)} <span class="qt-tz">${zoneAbbr(evs[0].ts, p)}</span></div>
      <div class="qt-day-games" title="${gameLine}">${gameLine}</div>${hourBars}
      <div class="qt-day-listhead"><span>Quest</span><span>${zoneName(p)} (${zoneAbbr(start, p)})</span><span>${zoneName(o)} (${zoneAbbr(start, o)})</span></div>
      <ul class="qt-day-list">${evs.map(e => { const m = meta[e.qi]; return `<li>${iconTag(m.game, 'qt-gicon sm')}<span class="qt-li-name">${esc(m.name)}</span><span class="qt-li-game">${esc(gname(m.game))}</span><em>${KIND_LABEL[m.kind] ? KIND_LABEL[m.kind].toUpperCase() : 'DAILY'}</em><time>${clock(e.ts, p, true)}</time><time class="alt">${clock(e.ts, o, true)}</time></li>`; }).join('')}</ul>`;
  }

  // ---------- top questers by game ----------
  const T = { data: null, game: null, loaded: false };
  async function loadTop() {
    if (T.loaded) return; T.loaded = true;
    const tryUrl = async url => { const r = await fetch(url); if (!r.ok) throw new Error('missing'); const d = await r.json(); if (!d.games || !d.games.length) throw new Error('empty'); return d; };
    try {
      try { T.data = await tryUrl('https://api.litstats.com/api/quest_top'); }
      catch (e) { T.data = await tryUrl(`${TOP_URL}?v=${Math.floor(Date.now() / 3600000)}`); }
      $('top-loading').classList.add('hidden'); $('top-layout').classList.remove('hidden');
      T.game = T.data.games[0].key; renderTop();
    } catch (e) { $('top-loading').classList.add('hidden'); $('top-missing').classList.remove('hidden'); }
  }
  function renderTop() {
    const games = T.data.games;
    $('top-picker').innerHTML = games.map(g => `<button type="button" class="qt-game-btn ${g.key === T.game ? 'active' : ''}" data-g="${esc(g.key)}"><span class="qt-game-btn-name">${iconTag(g.key, 'qt-gicon sm')}${esc(LABELS[g.key] || g.name)}</span><b>${fmt(g.total || 0)}</b></button>`).join('');
    const g = games.find(x => x.key === T.game);
    $('top-head').innerHTML = `<h2 style="font-size:20px;font-weight:700">${esc(LABELS[g.key] || g.name)}</h2><span style="font-size:13px;color:var(--text-3)">${g.players.length} players ranked</span>`;
    $('top-updated').textContent = T.data.last_update ? new Date(T.data.last_update).toLocaleString() : '-';
    renderTopRows();
  }
  function renderTopRows() {
    const g = T.data.games.find(x => x.key === T.game), f = $('top-filter').value.trim().toLowerCase();
    const rows = g.players.map((p, i) => ({ ...p, rank: i + 1 })).filter(p => !f || p.username.toLowerCase().includes(f));
    $('top-tbody').innerHTML = rows.length ? rows.map(p => `<tr style="cursor:pointer" data-name="${esc(p.username)}">
      <td class="rank ${p.rank <= 3 ? 'rank-' + p.rank : ''}">${p.rank}</td>
      <td><span style="display:inline-flex;align-items:center;gap:10px"><img src="https://minotar.net/helm/${esc(p.uuid)}/24.png" width="24" height="24" alt="" loading="lazy" style="border-radius:4px">${esc(p.username)}</span></td>
      <td style="text-align:right;font-weight:700">${fmt(p.count)}</td></tr>`).join('')
      : `<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--text-3)">No players found.</td></tr>`;
  }

  // ---------- pin (shares cabinet.js's storage) ----------
  const getPin = () => { try { return localStorage.getItem(PIN_KEY); } catch (e) { return null; } };
  function renderPin() {
    const box = $('pinned-player-container'), p = getPin();
    if (!p) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.classList.remove('hidden'); box.innerHTML = `📌 ${esc(p)}`; box.style.cursor = 'pointer';
    box.onclick = () => { $('top-search-input').value = p; switchTab('player'); loadPlayer(p); };
  }
  window.pinCurrentPlayer = () => {
    if (!S.name) return showError('Look up a player first, then pin them.');
    try { if (getPin() === S.name) localStorage.removeItem(PIN_KEY); else localStorage.setItem(PIN_KEY, S.name); } catch (e) {}
    renderPin();
  };

  // ---------- global handlers the HTML calls ----------
  window.handleTopSearch = () => { const v = $('top-search-input').value.trim(); if (v) { switchTab('player'); loadPlayer(v); } };
  if (typeof window.clearSearch !== 'function') window.clearSearch = id => { const i = $(id); if (i) { i.value = ''; i.focus(); } };

  function switchTab(tab) {
    document.querySelectorAll('.qt-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    $('panel-player').classList.toggle('hidden', tab !== 'player');
    $('panel-top').classList.toggle('hidden', tab !== 'top');
    if (tab === 'top') loadTop();
  }

  // ---------- wire up ----------
  document.querySelectorAll('.qt-tabs .tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  $('qt-kind').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    S.kind = b.dataset.kind; savePrefs(); $('qt-kind').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b)); renderLists();
  });
  $('qt-game').addEventListener('change', e => setGame(e.target.value));
  $('qt-chips').addEventListener('click', e => { const p = e.target.closest('.filter-pill-btn[data-g]'); if (p) setGame(S.game === p.dataset.g ? 'all' : p.dataset.g); });
  $('qt-chips').addEventListener('keydown', e => { const p = e.target.closest('.filter-pill-btn[data-g]'); if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setGame(S.game === p.dataset.g ? 'all' : p.dataset.g); } });
  $('qt-bm-btn').addEventListener('click', () => { S.view = S.view === 'bookmarks' ? 'all' : 'bookmarks'; if (S.data) renderLists(); });
  $('qt-ign-btn').addEventListener('click', () => { S.view = S.view === 'ignored' ? 'all' : 'ignored'; if (S.data) renderLists(); });
  $('qt-filter-clear').addEventListener('click', () => { const i = $('qt-filter'); i.value = ''; S.filter = ''; if (S.data) renderLists(); i.focus(); });
  $('qt-sort').addEventListener('change', e => { S.sort = e.target.value; savePrefs(); renderLists(); });
  $('qt-filter').addEventListener('input', e => { S.filter = e.target.value.trim(); renderLists(); });
  $('qt-toggle-done').addEventListener('click', () => { S.hideDone = !S.hideDone; savePrefs(); renderGameSelect(); renderLists(); });
  $('qt-toggle-easy').addEventListener('click', () => { S.easy = !S.easy; savePrefs(); renderGameSelect(); renderLists(); });
  // Collapsing only flips a class on that card, so the other columns don't re-flow.
  const setOpen = (el, open) => { el.classList.toggle('closed', !open); const b = el.querySelector('.qt-group-head'); if (b) b.setAttribute('aria-expanded', open); S.open.set(el.dataset.g, open); savePrefs(); };
  const listAction = e => {
    const sk = e.target.closest('[data-skip],[data-unskip]');
    if (sk) { if (sk.dataset.skip) S.skip.add(sk.dataset.skip); else S.skip.delete(sk.dataset.unskip); saveSkip(); renderTotals(); renderGameSelect(); renderLists(); return true; }
    const bmk = e.target.closest('[data-bm]');
    if (bmk) { const id = bmk.dataset.bm; if (S.bookmarks.has(id)) S.bookmarks.delete(id); else S.bookmarks.add(id); savePrefs(); renderLists(); return true; }
    const hg = e.target.closest('[data-hidegame],[data-unhidegame]');
    if (hg) { if (hg.dataset.hidegame) S.hideGames.add(hg.dataset.hidegame); else S.hideGames.delete(hg.dataset.unhidegame); savePrefs(); renderTotals(); renderGameSelect(); renderLists(); return true; }
    return false;
  };
  $('qt-lists').addEventListener('click', e => {
    if (listAction(e)) return;
    const h = e.target.closest('.qt-group-head'); if (h) { const g = h.closest('.qt-group'); setOpen(g, g.classList.contains('closed')); }
  });
  $('qt-lists').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-hidegame],[data-unhidegame]')) { e.preventDefault(); listAction(e); } });
  $('qt-fast').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    document.querySelectorAll('#qt-lists .qt-group').forEach(g => setOpen(g, b.dataset.act === 'expand'));
  });
  let lastCols = colCount();
  window.addEventListener('resize', () => { clearTimeout(window.__qtR); window.__qtR = setTimeout(() => { if (S.data && colCount() !== lastCols) { lastCols = colCount(); renderLists(); } }, 150); });
  $('qt-cal-open').addEventListener('click', toggleCalendar);
  $('qt-year').addEventListener('change', e => { S.year = +e.target.value; S.sel = null; renderCalendar(); });
  $('qt-cal').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (b) selectDay(b.dataset.k); });
  $('qt-cal').addEventListener('keydown', e => {   // up/down = +-1 day, left/right = +-1 week
    const m = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[e.key];
    if (!m) return; e.preventDefault(); step(m);
    const b = document.querySelector('#qt-cal-grid button.sel'); if (b) b.focus();
  });
  $('top-picker').addEventListener('click', e => { const b = e.target.closest('button[data-g]'); if (b) { T.game = b.dataset.g; renderTop(); } });
  $('top-filter').addEventListener('input', renderTopRows);
  $('top-tbody').addEventListener('click', e => {
    const tr = e.target.closest('tr[data-name]'); if (!tr) return;
    $('top-search-input').value = tr.dataset.name; switchTab('player'); loadPlayer(tr.dataset.name);
  });

  // ---------- quests by game (secondary: the checklist is the main thing) ----------
  function setGamesUI(open) {
    S.gamesOpen = !!open;
    $('qt-games-body').classList.toggle('hidden', !open);
    $('qt-games-toggle').setAttribute('aria-expanded', !!open);
    $('qt-games').classList.toggle('open', !!open);
  }
  function renderGames() {
    if (!S.data) return;
    const rows = Object.entries(S.data.byGame || {}).filter(([g, n]) => g !== 'other' && n > 0 && (UI.gamesHidden || !S.hideGames.has(g)) && !(UI.excludeComp && COMP_GAMES.has(g)));
    const max = Math.max(1, ...rows.map(r => r[1]));
    rows.sort(UI.gamesSort === 'name' ? (a, b) => gname(a[0]).localeCompare(gname(b[0])) : (a, b) => b[1] - a[1]);
    $('qt-games-total').textContent = `${fmt(S.data.total)} total · ${rows.length} game${rows.length === 1 ? '' : 's'}`;
    // Opening a game lists every quest they completed in it, most-completed first (counts are all time).
    const breakdown = (g, n) => {
      const qs = S.data.quests.filter(x => x.game === g && x.n > 0).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
      const rest = n - qs.reduce((a, x) => a + x.n, 0), top = Math.max(1, ...qs.map(x => x.n), rest);
      const row = (name, kind, count, cls = '') => `<div class="qt-gb-row ${cls}"><span class="qt-gb-name">${esc(name)}</span><span class="qt-gb-kind">${kind}</span><b>${fmt(count)}</b><span class="qt-gb-bar"><i style="width:${Math.round(count / top * 100)}%"></i></span></div>`;
      return `<div class="qt-gbreak">${qs.map(x => row(x.name, KIND_LABEL[x.kind] || 'Daily', x.n)).join('')}${rest > 0 ? row('Other and retired quests', '', rest, 'other') : ''}</div>`;
    };
    $('qt-games-body').innerHTML = rows.length
      ? `<div class="qt-gtiles">${rows.map(([g, n]) => {
          const open = S.gamesExpanded.has(g);
          return `<div class="qt-gtile ${open ? 'open' : ''}" data-g="${esc(g)}"><button type="button" class="qt-gt-head" aria-expanded="${open}" title="${open ? 'Hide' : 'Show'} every quest they completed in ${esc(gname(g))}">` +
            `${iconTag(g, 'qt-gicon')}<span class="qt-gt-name">${esc(gname(g))}</span><b>${fmt(n)}</b><span class="qt-chev" aria-hidden="true"></span></button>` +
            `<span class="qt-gt-bar"><i style="width:${Math.round(n / max * 100)}%"></i></span>${open ? breakdown(g, n) : ''}</div>`;
        }).join('')}</div>`
      : '<div class="qt-none">No quests completed yet.</div>';
    setGamesUI(S.gamesOpen);
  }
  $('qt-games-toggle').addEventListener('click', () => setGamesUI(!S.gamesOpen));
  $('qt-games-body').addEventListener('click', e => {
    const h = e.target.closest('.qt-gt-head'); if (!h) return;
    const g = h.closest('.qt-gtile').dataset.g;
    if (S.gamesExpanded.has(g)) S.gamesExpanded.delete(g); else S.gamesExpanded.add(g);
    renderGames();
  });

  // ---------- Page settings (same look as the achievement dashboard's settings menu) ----------
  const opt = (key, label, hint) => ({ key, label, hint });
  const selOpt = (key, label, options) => ({ type: 'select', key, label, options });
  const OPTIONS = [
    { title: '', items: [opt('excludeComp', 'Exclude Comp Games', 'Hides Mega Walls, UHC and The Pit quests.'), opt('showXp', 'Show XP values', 'Rewards, XP left and XP totals.')] },
    { title: 'Layout', items: [
      selOpt('layout', 'Layout', [['cards', 'Comfortable (cards)'], ['compact', 'Compact (dense cards)'], ['list', 'List (one row each)']]),
      selOpt('columns', 'Checklist columns', [['auto', 'Auto'], ['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]),
      selOpt('timeMode', 'Show times in', [['hypixel', 'Hypixel time (US Eastern)'], ['local', 'My time']])
    ] },
    { title: 'Show / Hide', items: [
      opt('showTags', 'Tags', 'Easy, Mythic, One-time, Daily/Weekly and task labels.'), opt('rowActions', 'Bookmark and ignore buttons'),
      opt('rowPct', '% of quest completion'), opt('rowDesc', 'Quest descriptions'), opt('rowBars', 'Progress bars'),
      opt('resetTimers', 'Reset timers', 'The daily, weekly and monthly countdowns.')
    ] },
    { title: 'Page sections', items: [
      { type: 'order' }, opt('secStats', 'Summary cards'), opt('secGames', 'Quests by game'), opt('secCalendar', 'Calendar'),
      opt('calAuto', 'Load calendar automatically', 'Off: only when you press Show calendar')
    ] },
    { title: 'Quests by game', items: [
      opt('gamesOpen', 'Open by default'), selOpt('gamesSort', 'Sort', [['count', 'Most quests first'], ['name', 'A to Z']]),
      opt('gamesHidden', 'Include games I ignored')
    ] }
  ];
  const SECTION_NAMES = { stats: 'Summary cards', board: 'Checklist', games: 'Quests by game', calendar: 'Calendar' };

  function renderCustomize() {
    const item = it => {
      if (it.type === 'order') return `<div class="qt-order">${UI.order.map((k, i) => `<div class="qt-order-row"><span>${SECTION_NAMES[k]}</span><span>` +
        `<button type="button" data-move="${k}:-1" ${i === 0 ? 'disabled' : ''} aria-label="Move ${SECTION_NAMES[k]} up">↑</button>` +
        `<button type="button" data-move="${k}:1" ${i === UI.order.length - 1 ? 'disabled' : ''} aria-label="Move ${SECTION_NAMES[k]} down">↓</button></span></div>`).join('')}</div>`;
      if (it.type === 'select') return `<div class="setting-item qt-set-select"><span>${it.label}:</span><select class="todo-select" data-opt="${it.key}">${it.options.map(([v, l]) => `<option value="${v}" ${String(UI[it.key]) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
      return `<div class="setting-item"><span class="qt-set-label">${it.label}${it.hint ? `<small>${it.hint}</small>` : ''}</span><label class="toggle-switch"><input type="checkbox" data-opt="${it.key}" ${UI[it.key] ? 'checked' : ''}><span class="slider"></span></label></div>`;
    };
    $('qt-custom').innerHTML = OPTIONS.map(g => (g.title ? `<div class="qt-set-title">${g.title}</div>` : '') + g.items.map(item).join('')).join('') +
      '<div class="qt-set-foot"><button type="button" class="settings-btn" id="qt-custom-reset">Reset to defaults</button></div>';
  }
  const closeCustomize = () => { const m = $('qt-custom'); if (m) m.classList.add('hidden'); const b = $('qt-custom-open'); if (b) b.classList.remove('active'); };
  window.toggleCustomize = e => {
    if (e) e.stopPropagation();
    const m = $('qt-custom'), willOpen = m.classList.contains('hidden');
    if (willOpen) renderCustomize();
    m.classList.toggle('hidden', !willOpen); $('qt-custom-open').classList.toggle('active', willOpen);
  };
  document.addEventListener('click', e => { if (!e.target.closest('.settings-wrapper')) closeCustomize(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCustomize(); });
  $('qt-custom').addEventListener('change', e => {
    const el = e.target.closest('[data-opt]'); if (!el) return;
    UI[el.dataset.opt] = el.type === 'checkbox' ? el.checked : el.value;
    savePrefs(); applyUI(el.dataset.opt);
  });
  $('qt-custom').addEventListener('click', e => {
    if (e.target.closest('#qt-custom-reset')) {
      Object.assign(UI, JSON.parse(JSON.stringify(UI_DEFAULTS)));
      S.gamesOpen = !!UI.gamesOpen; buildTz(); savePrefs(); renderCustomize(); applyUI('*'); return;
    }
    const b = e.target.closest('[data-move]'); if (!b) return;
    const [k, d] = b.dataset.move.split(':'), i = UI.order.indexOf(k), j = i + (+d);
    if (j < 0 || j >= UI.order.length) return;
    [UI.order[i], UI.order[j]] = [UI.order[j], UI.order[i]];
    savePrefs(); renderCustomize(); applyUI('order');
  });

  // Apply every option. Rows are styled by body classes (no re-render); the rest re-draws only what it changes.
  function applyUI(key = '*') {
    const cl = document.body.classList, all = key === '*';
    const flags = { showXp: 'ui-no-xp', rowDesc: 'ui-no-desc', rowBars: 'ui-no-bars', showTags: 'ui-no-tags', rowActions: 'ui-no-actions' };
    Object.keys(flags).forEach(k => cl.toggle(flags[k], !UI[k]));
    cl.toggle('ui-compact', UI.layout === 'compact');
    cl.toggle('ui-list', UI.layout === 'list');
    const els = { stats: $('qt-totals'), board: $('qt-board'), games: $('qt-games'), calendar: $('qt-calendar-card') };
    const on = { stats: UI.secStats, board: true, games: UI.secGames, calendar: UI.secCalendar };
    UI.order.forEach((k, i) => { if (els[k]) { els[k].style.order = String(i + 1); els[k].classList.toggle('qt-off', !on[k]); } });
    const prof = document.querySelector('.qt-profile'); if (prof) prof.style.order = '0';
    if (!S.data) return;
    if (all || key === 'timeMode') { buildTz(); if (S.hasHist) prepare(); }
    if (all || key === 'secStats' || key === 'timeMode') {
      renderTotals();
      if ((all || key === 'secStats') && needStreak() && !S.data.streak && !S.hasHist) loadHistory().then(() => { if (S.data) renderTotals(); }).catch(() => {});
    }
    if (all || key === 'excludeComp') {
      if (UI.excludeComp && COMP_GAMES.has(S.game)) S.game = 'all';
      renderTotals(); renderGameSelect(); renderLists(); renderGames();
    }
    if (all || key === 'showXp') { renderTotals(); renderLists(); }
    if (all || key === 'resetTimers' || key === 'timeMode') renderPills();
    if (all || ['columns', 'order', 'layout', 'rowPct', 'rowActions', 'showTags'].includes(key)) renderLists();
    if (all || /^games/.test(key) || key === 'secGames') { renderGames(); if (key === 'gamesOpen') setGamesUI(!!UI.gamesOpen); }
    if ((all || key === 'timeMode') && S.calOpen && S.hasHist) renderCalendar();
    if ((all || key === 'secCalendar') && UI.secCalendar && UI.calAuto && !S.hasHist && !S.calOpen) showCalendar();
  }

  // ---------- boot ----------
  applyUI();
  let lastIconSig = iconSig();
  setInterval(() => { const s = iconSig(); if (s !== lastIconSig) { lastIconSig = s; if (S.data) { renderGameSelect(); renderLists(); renderGames(); } } }, 700);
  renderPin();
  const qs = new URLSearchParams(location.search);
  const start = qs.get('uuid') || qs.get('name') || qs.get('player') || getPin();
  if (start) { if (!/^[0-9a-f-]{32,36}$/i.test(start)) $('top-search-input').value = start; loadPlayer(start); }
  if (location.hash === '#top') switchTab('top');
})();
