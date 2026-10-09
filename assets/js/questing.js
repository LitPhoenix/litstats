// assets/js/questing.js  (FRONTEND for questing.html — runs in the browser, no require())
(() => {
  'use strict';
  const API = 'https://api.litstats.com/api/quest';
  const TOP_URL = 'quest_games.json';
  const PIN_KEY = 'litstats_pinnedPlayer';   // same key cabinet.js uses (a plain username)
  const AUTO_LOAD_CALENDAR = true;           // load history in the background after the quests show (false = only when 'Show calendar' is clicked)
  const REGISTER_MAXGAMES = true;            // ping /api/player once per searched player so they join the max-games list
  const $ = id => document.getElementById(id);
  const fmt = n => Number(n).toLocaleString();
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAY = 86400000;

  const MC = { BLACK: '#000000', DARK_BLUE: '#0000AA', DARK_GREEN: '#00AA00', DARK_AQUA: '#00AAAA', DARK_RED: '#AA0000', DARK_PURPLE: '#AA00AA', GOLD: '#FFAA00', GRAY: '#AAAAAA', DARK_GRAY: '#555555', BLUE: '#5555FF', GREEN: '#55FF55', AQUA: '#55FFFF', RED: '#FF5555', LIGHT_PURPLE: '#FF55FF', YELLOW: '#FFFF55', WHITE: '#FFFFFF' };

  const S = { data: null, uuid: null, name: null, param: '', kind: 'all', game: 'all', sort: 'game', filter: '', hideDone: false, easy: false,
              open: new Map(), events: [], days: new Map(), year: null, sel: null, calOpen: false, hasHist: false, timer: null, refreshing: false };

  // ---------- helpers ----------
  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const timeStr = ms => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
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
  function iconTag(key, cls = 'qt-gicon', icon) {
    const n = gname(key), c = [];
    const pick = icon || key;
    if (SEASONAL.includes(pick)) c.push(`img/games/${pick}.png`);
    if (ICON_FILES[pick]) c.push(`img/games/${ICON_FILES[pick]}-64.png`);
    [n, n.replace(/\s+/g, ''), n.replace(/\s+/g, '-'), key].forEach(b => c.push(`img/games/${encodeURIComponent(b)}-64.png`));
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
  const PREFIX_RE = /^(daily|weekly|mythic|special)\s+quest:\s*/i;
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
        x.kind = p === 'weekly' ? 'weekly' : p === 'special' ? 'special' : 'daily';
        if (p === 'mythic') x.tag = 'Mythic';
      }
      let d = String(x.desc || '').replace(/§./g, '').replace(/%%\w+%%/g, '').replace(/[ \t]+/g, ' ').trim();
      if (!d.includes('\n') && x.obj.length > 1) d = d.replace(SPLIT, '\n');
      x.desc = d;
      const o = OV[x.id] || OVN[`${x.game}|${norm(x.name)}`] || OVN[norm(x.name)] || {};
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
      tipBox.style.cssText = 'position:fixed;z-index:9999;display:none;max-width:320px;padding:10px 12px;border-radius:10px;background:#1c1c22;color:#f1f1f4;border:1px solid rgba(255,255,255,.15);font-size:12px;line-height:1.55;box-shadow:0 10px 28px rgba(0,0,0,.4);pointer-events:none;white-space:pre-line;text-align:left';
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
  async function fetchQuest(param, history) {
    const res = await fetch(`${API}?${param}${history ? '&history=1' : ''}`);
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
      const body = await fetchQuest(param, opts.silent && S.calOpen);
      if (opts.silent && !body.history && S.data) body.history = S.data.history;   // keep history already loaded
      body.quests = decorate(body.quests);
      S.data = body; S.uuid = body.uuid; S.name = body.name || q; S.param = `uuid=${body.uuid}`;
      if (!opts.silent) {
        S.calOpen = false; S.hasHist = false; S.events = []; S.days = new Map(); S.sel = null;
        const u = new URL(location.href); u.searchParams.delete('uuid'); u.searchParams.delete('player'); u.searchParams.set('name', S.name);
        history.replaceState(null, '', u);
      } else if (body.history) prepare();
      render();
      if (!opts.silent) { registerForMaxGames(S.uuid); if (AUTO_LOAD_CALENDAR) showCalendar(); }
    } catch (e) {
      if (!opts.silent) { $('qt-empty').classList.remove('hidden'); $('qt-empty').innerHTML = '<strong>Look up a player</strong>See what they have left today and this week, their progress, and a calendar of every quest they have ever finished.'; showError(e.message); }
    } finally { if (!opts.silent) hideLoader(); }
  }

  function registerForMaxGames(uuid) {
    if (!REGISTER_MAXGAMES || !uuid || registerForMaxGames.done.has(uuid)) return;
    registerForMaxGames.done.add(uuid);
    fetch(`https://api.litstats.com/api/player?uuid=${encodeURIComponent(uuid)}`).catch(() => {});
  }
  registerForMaxGames.done = new Set();

  // history -> events [{ts(ms), qi}] grouped by local day (only runs when the calendar is opened)
  function prepare() {
    const h = S.data.history;
    S.events = []; S.days = new Map();
    let sec = 0;
    for (let i = 0; i < h.t.length; i++) {
      sec += h.t[i];
      S.events.push({ ts: sec * 1000, qi: h.q[i] });
      const k = keyOf(new Date(sec * 1000));
      if (!S.days.has(k)) S.days.set(k, []);
      S.days.get(k).push(i);
    }
    S.hasHist = true;
    const years = yearsList();
    if (!years.includes(S.year)) S.year = years[0];
  }
  function yearsList() {
    const cur = new Date().getFullYear();
    const first = S.events.length ? new Date(S.events[0].ts).getFullYear() : cur;
    const out = []; for (let y = cur; y >= first; y--) out.push(y);
    return out;
  }

  // ---------- render: header / totals ----------
  function render() {
    const d = S.data, rv = rankView(d);
    $('qt-empty').classList.add('hidden'); $('qt-content').classList.remove('hidden');
    const n = $('p-name'); n.textContent = S.name; n.style.color = rv.c;
    $('p-avatar').src = `https://minotar.net/helm/${d.uuid}/96.png`;
    const cs = getComputedStyle(n);
    const r = $('p-rank'); r.className = ''; r.style.cssText = `font-size:${cs.fontSize};line-height:${cs.lineHeight};font-weight:${cs.fontWeight};margin:0 10px 0 0;color:${rv.c};display:${rv.tag ? 'inline' : 'none'}`; r.innerHTML = rv.tag;
    const nameRow = n.parentElement; if (nameRow) { nameRow.style.display = 'flex'; nameRow.style.alignItems = 'baseline'; }
    $('qt-reset-row').innerHTML = `<span class="qt-pill">Daily reset in <b id="qt-cd-d">-</b></span><span class="qt-pill">Weekly reset in <b id="qt-cd-w">-</b></span>`;
    startCountdown();
    $('qt-cal-body').classList.toggle('hidden', !S.calOpen);
    $('qt-year').classList.toggle('hidden', !S.calOpen);
    $('qt-cal-open').textContent = S.calOpen ? 'Hide calendar' : 'Show calendar';
    const sp = document.querySelector('#qt-kind [data-kind="special"]');
    if (sp) sp.classList.toggle('hidden', !d.quests.some(x => x.kind === 'special'));
    renderTotals(); renderGameSelect(); renderLists();
    if (S.calOpen && S.hasHist) renderCalendar();
  }

  function startCountdown() {
    clearInterval(S.timer);
    const tick = () => {
      const now = Date.now(), r = S.data.resets;
      const a = $('qt-cd-d'), b = $('qt-cd-w');
      if (a) a.textContent = dur(r.dailyNext - now);
      if (b) b.textContent = dur(r.weeklyNext - now);
      if (now >= r.dailyNext && !S.refreshing) {          // a reset just passed: pull fresh progress
        S.refreshing = true;
        loadPlayer(S.uuid, { silent: true }).finally(() => { S.refreshing = false; });
      }
    };
    tick(); S.timer = setInterval(tick, 1000);
  }

  function renderTotals() {
    const q = S.data.quests;
    const count = k => { const l = q.filter(x => x.kind === k); return { done: l.filter(x => x.status === 'done').length, all: l.length, xp: l.filter(x => x.status !== 'done').reduce((a, x) => a + x.xp, 0) }; };
    const dly = count('daily'), wk = count('weekly');
    const bar = (a, b) => `<div class="qt-bar ${a === b && b ? 'done' : ''}"><i style="width:${b ? Math.round(a / b * 100) : 0}%"></i></div>`;
    const top = Object.entries(S.data.byGame || {}).filter(([g]) => g !== 'other').sort((a, b) => b[1] - a[1])[0];
    const xpLeft = dly.xp + wk.xp, easyLeft = q.filter(x => x.easy && x.status !== 'done').length;
    $('qt-totals').innerHTML = `
      <div class="qt-stat"><div class="qt-stat-label">Quests completed</div><div class="qt-stat-value">${fmt(S.data.total)}</div><div class="qt-stat-sub">${top ? `Most in ${esc(gname(top[0]))} (${fmt(top[1])})` : '&nbsp;'}</div></div>
      <div class="qt-stat"><div class="qt-stat-label">Daily today</div><div class="qt-stat-value">${dly.done}<small> / ${dly.all}</small></div>${bar(dly.done, dly.all)}<div class="qt-stat-sub">${dly.all - dly.done} left, ${fmt(dly.xp)} XP</div></div>
      <div class="qt-stat"><div class="qt-stat-label">Weekly this week</div><div class="qt-stat-value">${wk.done}<small> / ${wk.all}</small></div>${bar(wk.done, wk.all)}<div class="qt-stat-sub">${wk.all - wk.done} left, ${fmt(wk.xp)} XP</div></div>
      <div class="qt-stat"><div class="qt-stat-label">XP still available</div><div class="qt-stat-value">${fmt(xpLeft)}</div><div class="qt-stat-sub">${easyLeft ? easyLeft + ' easy quests left' : 'Daily + weekly'}</div></div>`;
  }

  // ---------- render: quest board ----------
  const isEasy = x => !!x.easy;
  const fracOf = x => x.status === 'done' ? 1 : x.obj.length ? x.obj.reduce((a, o) => a + o[0] / o[1], 0) / x.obj.length : 0;
  const colCount = () => window.innerWidth >= 1180 ? 3 : window.innerWidth >= 760 ? 2 : 1;
  const cnt = o => `${fmt(o[0])}/${fmt(o[1])}`;

  function renderGameSelect() {
    const sel = $('qt-game'), keep = S.game, left = {};
    S.data.quests.forEach(x => { if (x.status !== 'done') left[x.game] = (left[x.game] || 0) + 1; });
    const games = [...new Set(S.data.quests.map(x => x.game))].sort((a, b) => gname(a).localeCompare(gname(b)));
    sel.innerHTML = `<option value="all">All games</option>` + games.map(g => `<option value="${esc(g)}">${esc(gname(g))} (${left[g] || 0} left)</option>`).join('');
    sel.value = games.includes(keep) ? keep : 'all'; S.game = sel.value;
    const t = $('qt-toggle-done'); t.textContent = S.hideDone ? 'Show completed' : 'Hide completed'; t.setAttribute('aria-pressed', S.hideDone);
    $('qt-toggle-easy').setAttribute('aria-pressed', S.easy);
  }

  // One quest as a checklist row. `flat` = shown outside a game card, so it carries its own kind badge.
  function qHTML(x, opts = {}) {
    const done = x.status === 'done', pct = Math.round(fracOf(x) * 100);
    const pills = [];
    if (opts.kindPill) pills.push(`<span class="qt-p ${x.kind}">${x.kind === 'weekly' ? 'Weekly' : x.kind === 'special' ? 'Special' : 'Daily'}</span>`);
    if (x.tag) pills.push(`<span class="qt-p tag">${esc(x.tag)}</span>`);
    if (x.once) pills.push('<span class="qt-p once" title="This quest can only be completed once">One-time</span>');
    if (!done && x.easy) pills.push('<span class="qt-p easy">Easy</span>');
    const info = x.info.length ? `<span class="qt-info" tabindex="0" role="note" aria-label="More info" data-info="${esc(x.info.join('\n'))}">ⓘ</span>` : '';
    const side = done ? `<span class="qt-ok">Done ${x.last ? ago(x.last) : ''}</span>` : `${x.xp ? `<span class="qt-xp">${fmt(x.xp)} XP</span>` : ''}${info}`;

    let body = '';
    if (!done) {
      const paired = x.lines.length === x.obj.length && x.obj.length > 0;
      if (paired) body = x.lines.map((l, i) => `<div class="qt-obj"><div class="qt-obj-head"><span>${esc(l)}</span><b>${cnt(x.obj[i])}</b></div><div class="qt-bar"><i style="width:${Math.round(x.obj[i][0] / x.obj[i][1] * 100)}%"></i></div></div>`).join('');
      else body = (x.lines.length ? `<div class="qt-lines">${x.lines.map(l => `<div>${esc(l)}</div>`).join('')}</div>` : '') +
        x.obj.map(o => `<div class="qt-obj"><div class="qt-obj-head"><span></span><b>${cnt(o)}</b></div><div class="qt-bar"><i style="width:${Math.round(o[0] / o[1] * 100)}%"></i></div></div>`).join('');
    }
    return `<div class="qt-q ${x.status}" title="${esc(x.id)}">
      <span class="qt-st ${x.status}" style="--p:${pct}" aria-label="${x.status}"></span>
      <div class="qt-q-top"><span class="qt-q-name">${opts.icon ? iconTag(x.game, 'qt-gicon sm', x.icon) : ''}${esc(x.name)}</span>${pills.join('')}</div>
      <div class="qt-q-side">${side}</div>
      ${body ? `<div class="qt-q-body">${body}</div>` : ''}</div>`;
  }

  const stRank = { progress: 0, todo: 1, done: 2 };
  const isOpen = (g, allDone) => S.open.has(g) ? S.open.get(g) : !allDone;

  function groupHTML(g, items, all) {
    const done = all.filter(x => x.status === 'done').length, total = all.length, allDone = done === total;
    const single = items.length === 1;
    const kinds = ['daily', 'weekly', 'special'].filter(k => items.some(x => x.kind === k));
    const xpLeft = items.filter(x => x.status !== 'done').reduce((a, x) => a + x.xp, 0);
    const sorted = k => items.filter(x => x.kind === k).sort((a, b) => stRank[a.status] - stRank[b.status] || fracOf(b) - fracOf(a) || a.name.localeCompare(b.name));
    const body = kinds.map(k => {
      const list = sorted(k), d = list.filter(x => x.status === 'done').length;
      return (kinds.length > 1 ? `<div class="qt-sub"><span>${k === 'daily' ? 'Daily' : k === 'weekly' ? 'Weekly' : 'Special'}</span><span>${d}/${list.length}</span></div>` : '') +
        list.map(x => qHTML(x, { kindPill: kinds.length === 1 })).join('');
    }).join('');
    const open = isOpen(g, allDone);
    return `<section class="qt-group ${open ? '' : 'closed'} ${allDone ? 'complete' : ''}" data-g="${esc(g)}" data-done="${allDone ? 1 : 0}">
      <button type="button" class="qt-group-head" aria-expanded="${open}">
        ${iconTag(g, 'qt-gicon', (all.find(q => q.icon) || {}).icon)}<span class="qt-gname">${esc(gname(g))}</span>
        <span class="qt-gcount">${done}/${total}</span><span class="qt-gspace"></span>
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
    const base = S.data.quests.filter(x => (S.kind === 'all' || x.kind === S.kind) && (S.game === 'all' || x.game === S.game) &&
      (!f || (x.name + ' ' + x.lines.join(' ') + ' ' + gname(x.game)).toLowerCase().includes(f)));
    const left = base.filter(x => x.status !== 'done');
    $('qt-fast').innerHTML = `<span><b>${left.length}</b> left</span><span><b>${left.filter(isEasy).length}</b> easy</span><span><b>${fmt(left.reduce((a, x) => a + x.xp, 0))}</b> XP available</span>` +
      (S.sort === 'game' ? '<span class="qt-fast-links"><button type="button" data-act="collapse">Collapse all</button><button type="button" data-act="expand">Expand all</button></span>' : '');

    const list = base.filter(x => !(S.hideDone && x.status === 'done') && !(S.easy && (x.status === 'done' || !isEasy(x))));
    if (!list.length) { $('qt-lists').innerHTML = `<div class="qt-none">${base.length ? 'Nothing to show with these filters.' : 'No quests match your filters.'}</div>`; return; }

    if (S.sort !== 'game') {
      const cmp = {
        easy: (a, b) => (isEasy(b) - isEasy(a)) || fracOf(b) - fracOf(a) || b.xp - a.xp,
        close: (a, b) => fracOf(b) - fracOf(a) || b.xp - a.xp,
        xp: (a, b) => b.xp - a.xp
      }[S.sort];
      list.sort((a, b) => (a.status === 'done') - (b.status === 'done') || cmp(a, b));
      $('qt-lists').innerHTML = `<div class="qt-flat" style="--cols:${colCount()}">${list.map(x => `<div class="qt-fcard">${qHTML(x, { kindPill: true, icon: true })}</div>`).join('')}</div>`;
      return;
    }

    const groups = {};
    list.forEach(x => (groups[x.game] = groups[x.game] || []).push(x));
    const keys = Object.keys(groups).sort((a, b) => {
      const la = base.some(x => x.game === a && x.status !== 'done'), lb = base.some(x => x.game === b && x.status !== 'done');
      return (lb - la) || gname(a).localeCompare(gname(b));
    });
    const n = colCount(), cols = Array.from({ length: n }, () => ({ h: 0, html: '' }));
    keys.forEach(g => {
      const all = base.filter(x => x.game === g), allDone = all.every(x => x.status === 'done');
      const open = isOpen(g, allDone), target = cols.reduce((m, c) => c.h < m.h ? c : m, cols[0]);
      target.html += groupHTML(g, groups[g], all); target.h += estimate(groups[g], open) + 12;
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
      const body = await fetchQuest(S.param, true);
      if (S.uuid !== uuid) return;                       // searched someone else meanwhile
      S.data.history = body.history; prepare(); renderCalendar();
    } catch (e) { if (S.uuid === uuid) { $('qt-cal-stats').innerHTML = `<span class="qt-loading">Couldn't load history: ${esc(e.message)}</span>`; } }
  }
  const toggleCalendar = () => S.calOpen ? setCalUI(false) : showCalendar();

  function streaks() {
    const keys = [...S.days.keys()].sort();
    let best = 0, run = 0, prev = null;
    for (const k of keys) { const dt = parseKey(k); run = prev && Math.round((dt - prev) / DAY) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = dt; }
    let cur = 0, cursor = new Date(); cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    if (!S.days.has(keyOf(cursor))) cursor = addDays(cursor, -1);
    while (S.days.has(keyOf(cursor))) { cur++; cursor = addDays(cursor, -1); }
    return { cur, best, active: keys.length };
  }

  function renderCalendar() {
    const ys = $('qt-year'), years = yearsList();
    ys.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join(''); ys.value = S.year;

    const Y = S.year, jan1 = new Date(Y, 0, 1), start = jan1.getDay();
    const nDays = Math.round((new Date(Y + 1, 0, 1) - jan1) / DAY);
    const todayKey = keyOf(new Date());
    let max = 0, total = 0, active = 0, bestKey = null;
    const hours = new Array(24).fill(0), cells = [];
    for (let i = 0; i < nDays; i++) {
      const k = keyOf(addDays(jan1, i)), evs = S.days.get(k) || [];
      if (evs.length) { total += evs.length; active++; if (evs.length > max) { max = evs.length; bestKey = k; } evs.forEach(e => hours[new Date(S.events[e].ts).getHours()]++); }
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

    const sk = streaks();
    const peak = hours.indexOf(Math.max(...hours)), h12 = h => `${h % 12 || 12}${h < 12 ? ' AM' : ' PM'}`;
    $('qt-cal-stats').innerHTML = `
      <div><b>${fmt(total)}</b>quests in ${Y}</div><div><b>${active}</b>active days</div>
      <div><b>${active ? (total / active).toFixed(1) : '0'}</b>per active day</div>
      <div><b>${max}</b>best day${bestKey ? ` (${bestKey})` : ''}</div><div><b>${total ? h12(peak) : '-'}</b>busiest hour</div>
      <div><b>${sk.cur}</b>current streak</div><div><b>${sk.best}</b>longest streak</div>`;

    buildScrub(nDays);
    let k = S.sel && S.sel.startsWith(String(Y)) ? S.sel : null;
    if (!k) {
      if (Y === new Date().getFullYear()) k = todayKey;
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
      $('qt-today').addEventListener('click', () => { S.year = new Date().getFullYear(); S.sel = keyOf(new Date()); renderCalendar(); });
    }
    $('qt-range').max = nDays - 1;
  }

  function step(n) {
    if (!S.sel) return;
    const d = addDays(parseKey(S.sel), n);
    if (d > new Date()) return;
    if (d.getFullYear() !== S.year) { S.year = d.getFullYear(); S.sel = keyOf(d); renderCalendar(); } else selectDay(keyOf(d));
  }

  function selectDay(k) {
    S.sel = k;
    document.querySelectorAll('#qt-cal-grid button.sel').forEach(b => b.classList.remove('sel'));
    const btn = document.querySelector(`#qt-cal-grid button[data-k="${k}"]`);
    if (btn) { btn.classList.add('sel'); $('qt-range').value = btn.dataset.i; }
    const evs = (S.days.get(k) || []).map(i => S.events[i]).sort((a, b) => a.ts - b.ts);
    const meta = S.data.history.qmeta;
    const head = parseKey(k).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!evs.length) { $('qt-day').innerHTML = `<h3>${head}</h3><div class="qt-day-sum">No quests completed</div><div class="qt-day-games">&nbsp;</div><div class="qt-hours-wrap empty"><div class="qt-hours"></div><div class="qt-hours-axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span></div><div class="qt-hours-cap">Quests by hour of day, your local time.</div></div><ul class="qt-day-list"></ul>`; return; }
    const hrs = new Array(24).fill(0); evs.forEach(e => hrs[new Date(e.ts).getHours()]++);
    const hm = Math.max(...hrs);
    const h12 = h => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
    const hourBars = `<div class="qt-hours-wrap"><div class="qt-hours">${hrs.map((n, h) => `<b data-tip="${h12(h)} to ${h12((h + 1) % 24)}: ${n} quest${n === 1 ? '' : 's'}"><i style="height:${n ? Math.max(14, n / hm * 100) : 4}%"></i></b>`).join('')}</div>
      <div class="qt-hours-axis"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span></div><div class="qt-hours-cap">Quests by hour of day, your local time. Hover a bar.</div></div>`;
    const byGame = {}; evs.forEach(e => { const g = meta[e.qi].game; byGame[g] = (byGame[g] || 0) + 1; });
    const gameLine = Object.entries(byGame).sort((a, b) => b[1] - a[1]).map(([g, n]) => `${esc(gname(g))} ${n}`).join(' · ');
    $('qt-day').innerHTML = `<h3>${head}</h3>
      <div class="qt-day-sum"><b>${evs.length}</b> quest${evs.length === 1 ? '' : 's'} · ${timeStr(evs[0].ts)} to ${timeStr(evs[evs.length - 1].ts)} <span class="qt-tz">${esc(tz)}</span></div>
      <div class="qt-day-games" title="${gameLine}">${gameLine}</div>${hourBars}
      <ul class="qt-day-list">${evs.map(e => { const m = meta[e.qi]; return `<li>${iconTag(m.game, 'qt-gicon sm')}<span class="qt-li-name">${esc(m.name)}</span><span class="qt-li-game">${esc(gname(m.game))}</span><em>${m.kind === 'weekly' ? 'WEEKLY' : 'DAILY'}</em><time>${timeStr(e.ts)}</time></li>`; }).join('')}</ul>`;
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
    S.kind = b.dataset.kind; $('qt-kind').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b)); renderLists();
  });
  $('qt-game').addEventListener('change', e => { S.game = e.target.value; renderLists(); });
  $('qt-sort').addEventListener('change', e => { S.sort = e.target.value; renderLists(); });
  $('qt-filter').addEventListener('input', e => { S.filter = e.target.value.trim(); renderLists(); });
  $('qt-toggle-done').addEventListener('click', () => { S.hideDone = !S.hideDone; renderGameSelect(); renderLists(); });
  $('qt-toggle-easy').addEventListener('click', () => { S.easy = !S.easy; renderGameSelect(); renderLists(); });
  // Collapsing only flips a class on that card, so the other columns don't re-flow.
  const setOpen = (el, open) => { el.classList.toggle('closed', !open); const b = el.querySelector('.qt-group-head'); if (b) b.setAttribute('aria-expanded', open); S.open.set(el.dataset.g, open); };
  $('qt-lists').addEventListener('click', e => { const h = e.target.closest('.qt-group-head'); if (h) { const g = h.closest('.qt-group'); setOpen(g, g.classList.contains('closed')); } });
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

  // ---------- boot ----------
  renderPin();
  const qs = new URLSearchParams(location.search);
  const start = qs.get('uuid') || qs.get('name') || qs.get('player') || getPin();
  if (start) { if (!/^[0-9a-f-]{32,36}$/i.test(start)) $('top-search-input').value = start; loadPlayer(start); }
  if (location.hash === '#top') switchTab('top');
})();