(() => {
  const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';
  const API = isLocal ? 'http://localhost:3000' : 'https://api.litstats.com';
  const NAME_RE = /^[A-Za-z0-9_]{1,16}$/;
  const PAGE = 50;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = { get: (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString() : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }));
  const num = (n) => (typeof tabNum === 'function' ? tabNum(Math.round(n * 100) / 100) : fmt(n));
  const withLoader = async (text, fn) => { if (window.showLoader) window.showLoader(text); try { return await fn(); } finally { if (window.hideLoader) window.hideLoader(); } };
  const showError = (msg) => { const b = $('errorBox'); b.textContent = msg || ''; b.classList.toggle('hidden', !msg); };

  /* ================= icons (same logic as cabinet's getGameIconUrl) ================= */
  const MC_ICONS = { 'Arcade': 'slime_ball.png', 'Bed Wars': 'bed.png', 'SkyWars': 'eye_of_ender.png', 'Murder Mystery': 'bow.png', 'TNT Games': 'tnt.png', 'Build Battle': 'crafting_table.png', 'Duels': 'fishing_rod.png', 'UHC': 'golden_apple.png', 'Speed UHC': 'golden_carrot.png', 'Cops and Crims': 'iron_bars.png', 'Mega Walls': 'soul_sand.png', 'Smash Heroes': 'smash.png', 'Warlords': 'stone_axe.png', 'Blitz': 'diamond_sword.png', 'VampireZ': 'wither_skeleton_skull.png', 'Quake': 'firework.png', 'Paintball': 'snowball.png', 'Arena Brawl': 'blaze_powder.png', 'Walls': 'sand.png', 'TKR': 'minecart.png' };
  const GAME_ICONS = { 'Arcade': 'Arcade-64.png', 'Bed Wars': 'BedWars-64.png', 'Build Battle': 'BuildBattle-64.png', 'Cops and Crims': 'CVC-64.png', 'Duels': 'Duels-64.png', 'Mega Walls': 'MegaWalls-64.png', 'Murder Mystery': 'MurderMystery-64.png', 'Blitz': 'SG-64.png', 'SkyWars': 'Skywars-64.png', 'Smash Heroes': 'SmashHeroes-64.png', 'Speed UHC': 'SpeedUHC-64.png', 'TNT Games': 'TNT-64.png', 'UHC': 'UHC-64.png', 'Warlords': 'Warlords-64.png', 'Arena Brawl': 'Arena-64.png', 'Paintball': 'Paintball-64.png', 'Quake': 'Quakecraft-64.png', 'VampireZ': 'VampireZ-64.png', 'Walls': 'Walls-64.png', 'The Pit': 'Pit-64.png', 'TKR': 'TurboKartRacers-64.png' };
  function gameIcon(name) {
    const pref = localStorage.getItem('litstats_icon_mode') || 'theme';
    const classic = pref === 'classic' || (pref === 'theme' && document.documentElement.getAttribute('data-theme') === 'minecraft');
    if (classic && MC_ICONS[name]) return `/img/mc/${MC_ICONS[name]}`;
    return `/img/games/${GAME_ICONS[name] || String(name).replace(/\s/g, '') + '-64.png'}`;
  }
  let META = { groups: [], stats: [], perfect: 1000, population: 36411202 }, G = {}, ST = {};
  const groupIcon = (gid) => (gid === 'network' ? 'img/diamond.png' : gameIcon((G[gid] || {}).game || gid));
  function statIcon(st) {
    const i = st && st.icon;
    if (i) return i.startsWith('arcade:') ? `img/arcade/${i.slice(7)}.png` : i;
    return groupIcon(st && st.group);
  }
  const ico = (src) => `<img class="rk-ico" src="${esc(src)}" alt="" loading="lazy" onerror="this.style.display='none'">`;

  /* ================= customisation state ================= */
  const defaults = () => ({ model: 'smart', curve: 1, ref: 'known', gw: {}, cols: ['s:network_level', 's:quests', 's:achievement_points'], filters: [], sort: { key: 'score', dir: -1 } });
  const encode = (c) => btoa(encodeURIComponent(JSON.stringify(c))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const decode = (s) => JSON.parse(decodeURIComponent(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  let CFG = (() => {
    const v = new URLSearchParams(location.search).get('v');
    if (v) { try { return { ...defaults(), ...decode(v) }; } catch (e) { /* fall through */ } }
    return { ...defaults(), ...store.get('litstats_rank_cfg', {}) };
  })();
  const PRESETS = {
    'Default': {},
    'Competitive PvP': { bedwars: 2, skywars: 2, duels: 2, megawalls: 1.5, blitz: 1.5, uhc: 1.5, speeduhc: 0.8, warlords: 1, smash: 0.8, network: 0.5, arcade: 0.25, tnt: 0.25, buildbattle: 0.25, murdermystery: 0.25, vampirez: 0.25, quake: 0.25, paintball: 0.25, arena: 0.5, walls: 1, cvc: 0.5, tkr: 0.1 },
    'Achievement hunter': { network: 3, bedwars: 0.5, skywars: 0.5, duels: 0.5 },
    'Minigames': { arcade: 2, tnt: 2, buildbattle: 1.5, quake: 1.5, paintball: 1.5, arena: 1.5, walls: 1.5, vampirez: 1.5, tkr: 1.5, bedwars: 0.5, skywars: 0.5, duels: 0.5, megawalls: 0.5, network: 0.5 },
    'Ignore network stats': { network: 0 },
  };

  /* ================= data ================= */
  const POOL = { loaded: false, players: [], ids: [], refs: {}, size: 0, stale: 0, off: false };
  let IDX = {}, ROWS = [], REFS = {}, shown = PAGE;
  const S = { tab: 'board', player: null, cmp: { a: null, b: null, group: 'all', sort: 'swing', open: new Set() }, pl: { group: 'all', hideZero: false, sort: { key: 'fraction', dir: -1 } } };
  const cache = new Map();

  const gw = (gid) => (CFG.gw[gid] ?? ((META.groups.find(g => g.id === gid) || {}).weight ?? 1));
  const frac = (v, ref) => (v > 0 && ref > 0 ? Math.pow(Math.min(1, v / ref), CFG.curve) : 0);

  /** Mirror of positionFromKnots / statPosition / statScore in api/_rank_lib.js (v2). */
  function knotPos(K, value, tail) {
    if (value >= K[0][0]) return K[0][1];
    for (let i = 1; i < K.length; i++) if (value >= K[i][0]) { const [v0, p0] = K[i - 1], [v1, p1] = K[i], t = Math.log10(v0 / value) / Math.log10(v0 / v1); return Math.pow(10, Math.log10(p0) + t * (Math.log10(p1) - Math.log10(p0))); }
    const [vl, pl] = K[K.length - 1]; return pl * Math.pow(vl / value, tail || 1);
  }
  /** Estimated position of a value on the stat's leaderboard (null for fixed-scale anchors). */
  function sPos(value, st, ref) {
    if (!(value > 0)) return null;
    const sc = st.scale || { type: 'template' };
    if (sc.type === 'anchors') return null;
    if (sc.type === 'empirical') return knotPos(sc.knots, value, sc.tail);
    if (sc.type === 'power') return Math.max(1, Math.pow((ref || value) / value, sc.k));
    return knotPos(META.template, Math.min(1, value / (ref || value)), META.templateTail);
  }
  function sScore(value, st, ref) {
    if (!(value > 0)) return 0;
    const sc = st.scale || { type: 'template' };
    if (sc.type === 'anchors') {
      const A = sc.anchors;
      if (value >= A[A.length - 1][0]) return A[A.length - 1][1];
      if (value <= A[0][0]) return A[0][1];
      for (let i = 1; i < A.length; i++) if (value <= A[i][0]) { const [x0, y0] = A[i - 1], [x1, y1] = A[i]; return y0 + ((value - x0) / (x1 - x0)) * (y1 - y0); }
    }
    const r = Math.max(0, Math.min(1, 1 - Math.log10(Math.max(1, sPos(value, st, ref))) / (st.L || 5)));
    if (st.sat && sc.type === 'empirical') {   // saturating stat: also reward being numerically close to #1 (mirror of statScore in _rank_lib.js)
      const top = sc.knots[0][0], p = Math.max(0, Math.min(1, 1 - Math.log10(top / Math.min(value, top)) / Math.log10(top / st.sat.v1k)));
      return Math.max(r, (1 - st.sat.m) * r + st.sat.m * p);
    }
    return r;
  }
  /** Mirror of composite() in api/_rank_lib.js: stat scores S -> {score, G (per game, 0..1), eff (after caps)}. Game weights (gw) come from the page presets. */
  function compose(S) {
    const P = META.params, eff = { ...S }, gam = {}, byG = {}, Gm = {};
    for (const s of META.stats) if (s.cappedBy && s.cappedBy.length) eff[s.id] = Math.min(S[s.id] || 0, s.cappedBy.reduce((a, id) => a + (S[id] || 0), 0) / s.cappedBy.length + (s.capMargin ?? 0.05));
    for (const g of META.groups) gam[g.id] = g.gamma ?? P.scoreGamma ?? 1;
    for (const s of META.stats) (byG[s.group] = byG[s.group] || []).push({ u: Math.pow(eff[s.id] || 0, gam[s.group]), w: s.w ?? 1, fx: !!s.fixed });
    for (const g of META.groups) {
      const all = (byG[g.id] || []).filter(x => x.w > 0); if (!all.length) continue;
      const act = all.filter(x => !x.fx), fx = all.filter(x => x.fx);
      if (g.spec) act.sort((a, b) => b.u - a.u);
      let n = 0, d = 0; act.forEach((x, k) => { const w = g.spec ? x.w * Math.pow(g.spec.decay, k) : x.w; n += w * Math.pow(x.u, P.statMeanP); d += w; });
      fx.forEach(x => { n += x.w * Math.pow(x.u, P.statMeanP); d += x.w; });
      const v = Math.pow(n / d, 1 / P.statMeanP); Gm[g.id] = (g.spec && act.length ? g.spec.peak * act[0].u + (1 - g.spec.peak) * v : v) * (g.strength ?? 1);
    }
    const pf = (g) => (g.kind === 'network' || !g.pop ? 1 : Math.pow(Math.min(1, g.pop / P.nRef), P.popExponent ?? 0));
    const cap = P.gameCap ?? 1, slope = P.capSlope ?? 1, cnt = (x) => (x > cap ? cap + (x - cap) * slope : x);
    const games = META.groups.filter(g => g.kind !== 'network' && Gm[g.id] != null && gw(g.id) > 0).map(g => ({ id: g.id, G: cnt(Gm[g.id]), w: gw(g.id), f: pf(g) })).sort((a, b) => b.G - a.G || b.w * b.f - a.w * a.f);
    let wsum = 0, acc = 0, peak = 0, peakId = null; games.forEach((g, k) => { const w = Math.pow(P.gameDecay, k) * g.w * g.f; g.wk = w; wsum += w; acc += w * g.G; if (g.G * g.f > peak) { peak = g.G * g.f; peakId = g.id; } });
    const gamesScore = P.peakShare * peak + (1 - P.peakShare) * (wsum ? acc / wsum : 0);
    const net = META.groups.find(g => g.kind === 'network'), netScore = net && Gm[net.id] ? Gm[net.id] : 0, netW = net ? gw(net.id) : 0;
    const wG = games.length ? 1 - P.networkShare : 0, wN = P.networkShare * netW;
    const raw = wG + wN ? ((wG * gamesScore + wN * netScore) / (wG + wN)) * META.perfect : 0;
    const score = P.scoreFlatten > 1 ? META.perfect * Math.pow(raw / META.perfect, 1 / P.scoreFlatten) : raw;
    // parts: how many of the final points each game adds (they sum to score). mult: points per 1.0 of that game's score. The best game gets the peak bonus on top of its decay slot.
    const den = (wG + wN) || 1, k = raw > 0 ? score / raw : 0, parts = {}, mult = {};
    for (const g of games) { const m = (wG / den) * (P.peakShare * (g.id === peakId ? g.f : 0) + (1 - P.peakShare) * (wsum ? g.wk / wsum : 0)) * META.perfect * k; mult[g.id] = m; parts[g.id] = m * g.G; }
    if (net && netW) parts[net.id] = (wN / den) * netScore * META.perfect * k;
    return { score, G: Gm, eff, parts, mult, peakId };
  }
  const stScore = (v, id, ref) => (CFG.model === 'classic' ? frac(v, ref) : sScore(v, ST[id] || {}, ref));

  /* ================= custom-scoring flag (so edited rankings are obvious in screenshots) ================= */
  function scoringChanges() {
    const out = [];
    if (CFG.model === 'classic') { out.push('Classic model (% of #1)'); if (CFG.curve !== 1) out.push(`curve ${CFG.curve}`); if (CFG.ref !== 'known') out.push(`#1 = ${CFG.ref === 'pool' ? 'best tracked' : '99th percentile'}`); }
    for (const g of META.groups) { const def = g.weight ?? 1, cur = gw(g.id); if (Math.abs(cur - def) > 1e-9) out.push(cur === 0 ? `${g.name} removed` : `${g.name} ×${+cur.toFixed(2)}`); }
    return out;
  }
  const isCustom = () => scoringChanges().length > 0;
  const customBadge = () => (isCustom() ? `<span class="rk-cbadge" title="${esc('Scoring was edited: ' + scoringChanges().join(', '))}">Custom scoring</span>` : '');
  function updateCustomUI() {
    const ch = scoringChanges(), on = ch.length > 0;
    document.body.classList.toggle('rk-is-custom', on);
    $('rk-custom').classList.toggle('hidden', !on);
    $('rk-custom-list').textContent = ch.slice(0, 6).join(', ') + (ch.length > 6 ? `, +${ch.length - 6} more` : '');
    document.querySelectorAll('.settings-btn[data-pop="scoring"]').forEach(b => b.classList.toggle('custom', on));
  }
  const resetScoring = () => { CFG.model = 'smart'; CFG.curve = 1; CFG.ref = 'known'; CFG.gw = {}; };
  const gname = (id) => (G[id] || {}).name || id;
  const p1 = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 1 });
  const p2 = (n) => Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  /** How many times more a game counts than the average game for this player (the best game gets the peak bonus). */
  const weightX = (d, id) => { const v = Object.values(d.mult || {}).filter(x => x > 0), avg = v.length ? v.reduce((a, b) => a + b, 0) / v.length : 1; return (d.mult[id] || 0) / avg; };
  const netId = () => (Object.values(G).find(g => g.kind === 'network') || {}).id;
  /** A player's game order (1 = best) by game score, network excluded. This is the order the weights are handed out in. */
  const slotOf = (d, id) => (id === netId() ? 0 : d.groups.filter(g => g.id !== netId() && g.points).sort((a, b) => b.earned - a.earned).findIndex(g => g.id === id) + 1);
  const tier = (x, cuts) => cuts.filter(c => x >= c).length;
  const verdict = (W, L) => {
    const a = `<b>${esc(W.username)}</b>`, b = `<b>${esc(L.username)}</b>`;
    return [`${a} edges out ${b}`, `${a} beats ${b}`, `${a} is better than ${b}`, `${a} outclasses ${b}`, `${a} mogs ${b}`, `${a} absolutely mogs ${b}`, `${a} sent ${b} back to the tutorial`, `${b} never stood a chance against ${a}`][tier(W.score - L.score, [3, 10, 25, 60, 120, 250, 400])];
  };
  const roundTag = (r, A, B) => {
    if (r.pa === r.pb) return 'Dead level';
    const w = r.pa > r.pb ? A : B, l = w === A ? B : A, hi = Math.max(r.pa, r.pb), lo = Math.min(r.pa, r.pb);
    const a = `<b>${esc(w.username)}</b>`, b = `<b>${esc(l.username)}</b>`;
    if (!(lo > 0)) return `${b} forgot to play this`;
    return [`Photo finish, ${a} by a hair`, `${a} takes it`, `${a} is better here`, `${a} mogs ${b}`, `${a} flattens ${b}`, `${b} wasn't ready for this`, `${a} deleted ${b}`][tier(1 - lo / hi, [0.05, 0.2, 0.4, 0.6, 0.8, 0.92])];
  };
  const HOW = `<details class="rk-how"><summary>How are these points worked out?</summary><ol><li>Every game gets a score out of 1,000 from that player's stats.</li><li>A player's games are ranked best to worst. Their #1 game counts for far more than their #8.</li><li>Points = game score × that weight. So having more stats in a game can still earn fewer points if it sits lower on your list.</li></ol></details>`;
  function minorIds(A, B) {
    const all = Object.keys(A.parts), mx = (id) => Math.max(A.parts[id] || 0, B.parts[id] || 0), mean = all.reduce((s, id) => s + mx(id), 0) / (all.length || 1);
    const out = all.filter(id => id !== A.peakId && id !== B.peakId && mx(id) < 0.6 * mean);
    return out.length >= 3 ? new Set(out) : new Set();
  }
  /** Stacked bar of where a player's points come from; the best game is hatched and called out. */
  function contribBar(d, side) {
    const ents = Object.entries(d.parts || {}).filter(([, v]) => v > 0.0001).sort((x, y) => y[1] - x[1]), tot = ents.reduce((s, [, v]) => s + v, 0) || 1;
    const pk = d.peakId ? d.parts[d.peakId] : 0;
    return `<div class="rk-contrib ${side}"><div class="rk-contrib-bar">${ents.map(([id, v], i) => `<i class="${id === d.peakId ? 'pk' : ''}" style="width:${(v / tot) * 100}%;opacity:${id === d.peakId ? 1 : Math.max(0.28, 0.72 - i * 0.04)}" title="${esc(gname(id))}: ${p1(v)} pts"></i>`).join('')}</div>
      ${pk ? `<div class="rk-contrib-cap"><span class="rk-star">★</span> Best game: <b>${esc(gname(d.peakId))}</b> adds <b>${p1(pk)}</b> pts (${Math.round((pk / tot) * 100)}% of the score) and counts ×${weightX(d, d.peakId).toFixed(1)} the average game</div>` : ''}</div>`;
  }

  function computeRefs() {
    const out = {};
    for (const s of META.stats) {
      const known = POOL.refs[s.id] || 0;
      if (CFG.model !== 'classic' || CFG.ref === 'known' || !POOL.players.length) { out[s.id] = Math.max(known, s.ref || 0); continue; }
      const vals = POOL.players.map(p => p.v[IDX[s.id]]).filter(x => x > 0).sort((a, b) => a - b);
      out[s.id] = !vals.length ? known : CFG.ref === 'pool' ? vals[vals.length - 1] : vals[Math.min(vals.length - 1, Math.floor(vals.length * 0.99))];
    }
    REFS = out;
  }
  function scoreWith(get, refOf) {
    const S = {}, pts = {}, g = {};
    for (const s of META.stats) S[s.id] = stScore(get(s.id), s.id, refOf(s.id));
    const C = compose(S);
    for (const s of META.stats) pts[s.id] = gw(s.group) ? (C.eff[s.id] || 0) * s.points : 0;
    for (const id of Object.keys(C.G)) g[id] = C.G[id] * 1000;
    return { score: C.score, g, pts };
  }
  function rebuild() {
    if (!POOL.loaded) return;
    computeRefs();
    ROWS = POOL.players.map(p => ({ p, ...scoreWith(id => p.v[IDX[id]] || 0, id => REFS[id]) }));
    ROWS.slice().sort((a, b) => b.score - a.score).forEach((r, i) => { r.rank = i + 1; });
  }

  /* ================= small renderers ================= */
  const GUILD_COL = { BLACK: '#555555', DARK_BLUE: '#0000AA', DARK_GREEN: '#00AA00', DARK_AQUA: '#00AAAA', DARK_RED: '#AA0000', DARK_PURPLE: '#AA00AA', GOLD: '#FFAA00', GRAY: '#AAAAAA', DARK_GRAY: '#555555', BLUE: '#5555FF', GREEN: '#55FF55', AQUA: '#55FFFF', RED: '#FF5555', LIGHT_PURPLE: '#FF55FF', YELLOW: '#FFFF55', WHITE: '#FFFFFF' };
  const guildHTML = (t, c) => (t ? ` <span class="rk-guild" style="color:${GUILD_COL[c] || GUILD_COL.GRAY}">[${esc(t)}]</span>` : '');
  function nameHTML(p, href) {
    const col = typeof getRankBaseColourHex === 'function' ? getRankBaseColourHex(p.rank, p.monthlyRankColor) : '';
    const tag = typeof formatRankText === 'function' ? formatRankText(p.rank, p.rankPlusColor, p.monthlyRankColor) : '';
    const colored = col && col.startsWith('#');
    return `<a class="rk-name-link${colored ? ' ranked' : ''}" ${href ? `href="${href}"` : ''} style="${colored ? `color:${col}` : 'color:var(--text)'}">${tag ? `<span class="rk-rank-tag">${tag}</span>` : ''}${esc(p.name || p.username)}</a>${guildHTML(p.guildTag, p.guildColor)}`;
  }
  const avatarSrc = (name) => `https://minotar.net/helm/${encodeURIComponent(name)}/100`;
  const onErr = (uuid) => `this.onerror=null;this.src='https://vzge.me/face/${esc(uuid)}.png'`;
  const parseVal = (t) => {
    const m = String(t).trim().toLowerCase().replace(/,/g, '').match(/^(-?\d*\.?\d+)\s*([kmb])?$/);
    if (!m) return NaN;
    return parseFloat(m[1]) * ({ k: 1e3, m: 1e6, b: 1e9 }[m[2]] || 1);
  };

  /* ================= keys, filters, sorting ================= */
  const RANK_ORDER = ['OWNER', 'ADMIN', 'MODERATOR', 'HELPER', 'GAME_MASTER', 'YOUTUBER', 'SUPERSTAR', 'MVP_PLUS_PLUS', 'MVP_PLUS', 'MVP', 'VIP_PLUS', 'VIP', 'NON'];
  const RANK_NAMES = { OWNER: 'Owner', ADMIN: 'Admin', MODERATOR: 'Moderator', HELPER: 'Helper', GAME_MASTER: 'Game Master', YOUTUBER: 'YouTube', SUPERSTAR: 'MVP++', MVP_PLUS_PLUS: 'MVP++', MVP_PLUS: 'MVP+', MVP: 'MVP', VIP_PLUS: 'VIP+', VIP: 'VIP', NON: 'No rank' };
  const hrankOf = (p) => (!p.rank || p.rank === 'NORMAL' ? 'NON' : p.rank);
  const rankLabel = (k) => RANK_NAMES[k] || String(k).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  const rankSort = (k) => (k === 'NON' ? 999 : RANK_ORDER.indexOf(k) < 0 ? 500 : RANK_ORDER.indexOf(k));
  function keyLabel(key) {
    if (key === 'hrank') return 'Hypixel rank';
    if (key === 'rank') return 'Rank';
    if (key === 'score') return 'Score';
    if (key === 'name') return 'Name';
    const t = key[0], id = key.slice(2);
    if (t === 'g') return `${(G[id] || {}).name || id} pts`;
    if (t === 's') return (ST[id] || {}).label || id;
    if (t === 'p') return `${(ST[id] || {}).label || id} pts`;
    return key;
  }
  function val(row, key) {
    if (key === 'rank') return row.rank;
    if (key === 'hrank') return hrankOf(row.p);
    if (key === 'score') return row.score;
    if (key === 'name') return row.p.name;
    const t = key[0], id = key.slice(2);
    if (t === 'g') return row.g[id] || 0;
    if (t === 's') return row.p.v[IDX[id]] ?? 0;
    if (t === 'p') return row.pts[id] || 0;
    return 0;
  }
  const OPS = { 'in': (a, b) => b.includes(a), '!in': (a, b) => !b.includes(a), '>': (a, b) => a > b, '>=': (a, b) => a >= b, '<': (a, b) => a < b, '<=': (a, b) => a <= b, '=': (a, b) => a === b, '!=': (a, b) => a !== b,
    'contains': (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()), '!contains': (a, b) => !String(a).toLowerCase().includes(String(b).toLowerCase()) };
  const OP_LABEL = { 'in': 'is any of', '!in': 'is not any of', '>': '>', '>=': '≥', '<': '<', '<=': '≤', '=': '=', '!=': '≠', 'contains': 'contains', '!contains': 'does not contain' };
  const passes = (row) => CFG.filters.every(f => OPS[f.op](val(row, f.f), f.v));
  function sortedRows() {
    const { key, dir } = CFG.sort;
    return ROWS.filter(passes).sort((a, b) => {
      const x = val(a, key), y = val(b, key);
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir || b.score - a.score;
    });
  }

  /* ================= leaderboard ================= */
  function fieldOptions() {
    const stat = (t) => META.groups.map(g => {
      const sts = META.stats.filter(s => s.group === g.id);
      return sts.length ? `<optgroup label="${esc(g.name)}${t === 'p' ? ' (points)' : ''}">${sts.map(s => `<option value="${t}:${s.id}">${esc(s.label)}${t === 'p' ? ' pts' : ''}</option>`).join('')}</optgroup>` : '';
    }).join('');
    return `<optgroup label="Overall"><option value="score">Total score</option><option value="name">Name</option><option value="hrank">Hypixel rank</option></optgroup>
      <optgroup label="Game points">${META.groups.map(g => `<option value="g:${g.id}">${esc(g.name)} pts</option>`).join('')}</optgroup>${stat('s')}${stat('p')}`;
  }
  function buildRankPicker() {
    const counts = {}, sample = {};
    ROWS.forEach(r => { const k = hrankOf(r.p); counts[k] = (counts[k] || 0) + 1; sample[k] = sample[k] || r.p; });
    $('ff-ranks-list').innerHTML = Object.keys(counts).sort((x, y) => rankSort(x) - rankSort(y)).map(k => {
      const c = typeof getRankBaseColourHex === 'function' && k !== 'NON' ? getRankBaseColourHex(sample[k].rank, sample[k].monthlyRankColor) : '';
      return `<label class="rk-opt"><input type="checkbox" value="${esc(k)}"><span style="${c && c.startsWith('#') ? `color:${c}` : ''}">${esc(rankLabel(k))}</span><em>${counts[k].toLocaleString()}</em></label>`;
    }).join('');
  }
  const pickedRanks = () => [...document.querySelectorAll('#ff-ranks-list input:checked')].map(i => i.value);
  function setOps(field) {
    const isName = field === 'name', isRank = field === 'hrank';
    $('ff-op').innerHTML = isRank ? `<option value="in">is any of</option><option value="!in">is not any of</option>`
      : isName ? `<option value="contains">contains</option><option value="!contains">does not contain</option>`
      : `<option value=">">is greater than</option><option value=">=">is at least</option><option value="<">is less than</option><option value="<=">is at most</option><option value="=">equals</option><option value="!=">does not equal</option>`;
    $('ff-val').classList.toggle('hidden', isRank);
    $('ff-ranks').classList.toggle('hidden', !isRank);
    if (isRank) buildRankPicker();
    $('ff-val').placeholder = isName ? 'part of a name' : '25000  or  25k';
  }
  function addRankFilter(op) {
    const picked = pickedRanks();
    if (!picked.length) { $('ff-ranks-sum').style.borderColor = 'var(--red)'; return; }
    const ex = CFG.filters.find(f => f.f === 'hrank' && f.op === op);
    if (ex) ex.v = [...new Set([...ex.v, ...picked])]; else CFG.filters.push({ f: 'hrank', op, v: picked });
    document.querySelectorAll('#ff-ranks-list input').forEach(i => { i.checked = false; });
    $('ff-ranks-sum').textContent = 'Choose ranks'; $('ff-ranks').open = false;
    onCfg();
  }
  function addFilter(f, op, raw) {
    const v = op.includes('contains') ? String(raw).trim() : parseVal(raw);
    if ((typeof v === 'number' && !Number.isFinite(v)) || v === '') { $('ff-val').focus(); $('ff-val').style.borderColor = 'var(--red)'; return false; }
    $('ff-val').style.borderColor = '';
    CFG.filters.push({ f, op, v });
    onCfg(); return true;
  }
  function renderTry() {
    const tries = [['s:achievement_points', '>', 25000], ['s:quests', '>', 50000], ['s:sw_experience', '>', 200000], ['score', '>', 100]].filter(([f]) => f === 'score' || ST[f.slice(2)]);
    $('ff-try').innerHTML = 'Try: ' + tries.map(([f, o, v], i) => `<button type="button" data-try="${i}">${esc(keyLabel(f))} ${OP_LABEL[o]} ${fmt(v)}</button>`).join('');
    $('ff-try').onclick = (e) => { const b = e.target.closest('[data-try]'); if (b) { const [f, o, v] = tries[+b.dataset.try]; addFilter(f, o, v); } };
  }
  function renderChips() {
    const chips = CFG.filters.map((f, i) => `<span class="rk-chip">${esc(keyLabel(f.f))} <b>${OP_LABEL[f.op]}</b> ${Array.isArray(f.v) ? esc(f.v.map(rankLabel).join(', ')) : typeof f.v === 'number' ? fmt(f.v) : esc(f.v)}<button type="button" data-rm="${i}" aria-label="Remove filter">✕</button></span>`).join('');
    $('bd-chips').innerHTML = chips + (CFG.filters.length > 1 ? `<span class="rk-chip clear" data-clear="1">Clear all</span>` : '');
  }
  function colCell(row, key) { const v = val(row, key); return `<td class="r rk-num">${v ? num(v) : '<span class="rk-dim">–</span>'}</td>`; }
  function renderBoard() {
    if (!POOL.loaded) return;
    renderChips();
    const rows = sortedRows();
    const { key, dir } = CFG.sort;
    const th = (k, label, cls = 'r') => `<th class="${cls}${key === k ? ' sorted' + (dir === 1 ? ' asc' : '') : ''}" data-key="${k}">${esc(label)}</th>`;
    $('bd-thead').innerHTML = `<tr><th class="rank${key === 'rank' ? ' sorted' + (dir === 1 ? ' asc' : '') : ''}" data-key="rank" style="width:56px;">#</th>${th('name', 'Player', '')}${th('score', isCustom() ? 'Score*' : 'Score')}${CFG.cols.filter(c => c !== 'score').map(c => th(c, keyLabel(c))).join('')}</tr>`;
    const cols = CFG.cols.filter(c => c !== 'score');
    $('bd-tbody').innerHTML = rows.slice(0, shown).map((r, i) => {
      const href = `?player=${encodeURIComponent(r.p.name)}`, pod = r.rank === 1 ? 'rank-1' : r.rank === 2 ? 'rank-2' : r.rank === 3 ? 'rank-3' : '';
      return `<tr class="player-row" data-name="${esc(r.p.name)}"><td style="text-align:center;"><span class="rank ${pod}">${r.rank}</span></td>
        <td><div class="rk-who"><img class="player-avatar" src="${avatarSrc(r.p.name)}" alt="" loading="lazy" onerror="${onErr(r.p.uuid)}">${nameHTML(r.p, href)}</div></td>
        <td class="r rk-num ap-cell">${num(r.score)}</td>${cols.map(c => colCell(r, c)).join('')}</tr>`;
    }).join('') || `<tr><td colspan="${3 + cols.length}" class="rk-off" style="margin:0;padding:34px;"><strong>No players match</strong>Loosen or remove a filter.</td></tr>`;
    $('bd-summary').textContent = `${rows.length.toLocaleString()} of ${ROWS.length.toLocaleString()} tracked players`;
    $('bd-foot').textContent = POOL.stale ? `${POOL.stale} players need re-scoring (the weekly seeding job refreshes them)` : `Scores are out of ${META.perfect.toLocaleString()}. Click a column to sort.`;
    $('bd-more').classList.toggle('hidden', rows.length <= shown);
    $('bd-more').textContent = `Show more (${Math.min(PAGE, rows.length - shown)})`;
  }

  /* ================= options panel ================= */
  const pop = $('rk-pop');
  let popType = null;
  function openPop(type) { popType = type; renderPop(); pop.classList.remove('hidden'); }
  function closePop() { popType = null; pop.classList.add('hidden'); }
  function renderPop() {
    if (!popType) return;
    const head = (t, sub) => `<div class="rk-pop-head"><h3>${t}</h3><button type="button" class="rk-pop-x" data-act="close" aria-label="Close">✕</button></div><div class="sub">${sub}</div>`;
    if (popType === 'scoring') {
      const smart = CFG.model !== 'classic';
      pop.innerHTML = head('Scoring', 'Applies everywhere on this page and is saved in your browser.') +
        `<div class="rk-sec"><label>Scoring model</label>
          <select class="todo-select" data-act="model" style="width:100%"><option value="smart" ${smart ? 'selected' : ''}>Smart: percentile among tracked players (recommended)</option><option value="classic" ${smart ? '' : 'selected'}>Classic: % of the #1 player (Sk1er style)</option></select>
          <div class="sub" style="margin:8px 0 0">${smart ? 'Each stat is scored by where the value ranks on the real leaderboard for that stat (rank 1 = full score, the last tracked rank = 0), so one absurd #1 cannot flatten everyone, a hard stat is not punished for having a huge leader, and a few casual wins earn nothing.' : 'Each stat is scored as a straight percentage of the best player. Simple, but easily skewed by outliers.'}</div></div>` +
        (smart ? '' : `<div class="rk-sec"><span class="lab">Curve <span class="val" id="curve-val" style="float:right">${CFG.curve.toFixed(2)}</span></span>
          <div class="rk-row"><input type="range" min="0.2" max="1" step="0.05" value="${CFG.curve}" data-act="curve"></div>
          <div class="rk-presets"><button type="button" data-curve="1" class="${CFG.curve === 1 ? 'on' : ''}">Linear 1.0</button><button type="button" data-curve="0.7" class="${CFG.curve === 0.7 ? 'on' : ''}">Gentle 0.7</button><button type="button" data-curve="0.5" class="${CFG.curve === 0.5 ? 'on' : ''}">Balanced 0.5</button></div></div>
        <div class="rk-sec"><label>What counts as the "#1" value</label>
          <select class="todo-select" data-act="ref" style="width:100%"><option value="known" ${CFG.ref === 'known' ? 'selected' : ''}>Best known value (default)</option><option value="pool" ${CFG.ref === 'pool' ? 'selected' : ''}>Best among tracked players</option><option value="p99" ${CFG.ref === 'p99' ? 'selected' : ''}>99th percentile (ignores outliers)</option></select></div>`) +
        `<div class="rk-sec"><span class="lab">Game weights</span><div class="rk-presets">${Object.keys(PRESETS).map(n => `<button type="button" data-preset="${esc(n)}">${esc(n)}</button>`).join('')}</div>
          ${META.groups.map(g => `<div class="rk-row"><span class="nm">${ico(groupIcon(g.id))}${esc(g.name)}</span><input type="range" min="0" max="3" step="0.25" value="${gw(g.id)}" data-gw="${g.id}"><span class="val" id="gw-${g.id}">${Math.round(gw(g.id) * 100)}%</span></div>`).join('')}</div>
        <div class="rk-sec"><button type="button" class="rk-btn" data-act="reset-scoring">Reset scoring</button></div>`;
    } else if (popType === 'columns') {
      pop.innerHTML = head('Columns', 'Pick what the leaderboard shows. <b>Value</b> is the raw stat, <b>Pts</b> is the points it earns.') +
        `<div class="rk-row group"><span class="nm">Column</span><span class="mini">Value</span><span class="mini">Pts</span></div>` +
        META.groups.map(g => `<div class="rk-row group"><span class="nm">${ico(groupIcon(g.id))}${esc(g.name)} total</span><span class="mini"></span><span class="mini"><input type="checkbox" data-col="g:${g.id}" ${CFG.cols.includes('g:' + g.id) ? 'checked' : ''}></span></div>` +
          META.stats.filter(s => s.group === g.id).map(s => `<div class="rk-row"><span class="nm">${ico(statIcon(s))}${esc(s.label)}</span><span class="mini"><input type="checkbox" data-col="s:${s.id}" ${CFG.cols.includes('s:' + s.id) ? 'checked' : ''}></span><span class="mini"><input type="checkbox" data-col="p:${s.id}" ${CFG.cols.includes('p:' + s.id) ? 'checked' : ''}></span></div>`).join('')).join('') +
        `<div class="rk-sec"><button type="button" class="rk-btn" data-act="reset-cols">Reset columns</button></div>`;
    } else if (popType === 'views') {
      const saved = store.get('litstats_rank_views', {});
      pop.innerHTML = head('Views', 'Save your filters, columns, sorting and scoring, or share them as a link.') +
        `<div class="rk-sec"><div class="rk-row"><input class="rk-input" id="view-name" placeholder="Name this view" style="flex:1"><button type="button" class="rk-btn" data-act="save-view">Save</button></div>
          ${Object.keys(saved).map(n => `<div class="rk-saved"><span>${esc(n)}</span><button type="button" class="rk-btn" data-load="${esc(n)}">Open</button><button type="button" class="rk-btn" data-del="${esc(n)}">Delete</button></div>`).join('') || '<div class="sub" style="margin:8px 0 0">No saved views yet.</div>'}</div>
        <div class="rk-sec"><button type="button" class="rk-btn" data-act="copy-view">Copy share link</button> <button type="button" class="rk-btn" data-act="reset-all">Reset everything</button></div>`;
    }
  }
  let t = null;
  function onCfg(delay = 40) {   // delay: sliders pass a longer one so a drag doesn't re-score the whole pool on every tick
    store.set('litstats_rank_cfg', CFG); updateCustomUI();
    clearTimeout(t);
    t = setTimeout(() => { rebuild(); shown = PAGE; renderBoard(); if (S.player) renderPlayer(); if (S.cmp.a && S.cmp.b) renderCompare(); }, delay);
  }
  pop.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.act === 'curve') { CFG.curve = parseFloat(el.value); $('curve-val').textContent = CFG.curve.toFixed(2); onCfg(180); }
    else if (el.dataset.gw) { CFG.gw[el.dataset.gw] = parseFloat(el.value); $(`gw-${el.dataset.gw}`).textContent = Math.round(el.value * 100) + '%'; onCfg(180); }
  });
  pop.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.act === 'model') { CFG.model = el.value; onCfg(); renderPop(); }
    else if (el.dataset.act === 'ref') { CFG.ref = el.value; onCfg(); }
    else if (el.dataset.col) {
      const k = el.dataset.col; CFG.cols = CFG.cols.filter(c => c !== k); if (el.checked) CFG.cols.push(k); onCfg();
    }
  });
  pop.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'close') return closePop();
    if (b.dataset.curve) { CFG.curve = parseFloat(b.dataset.curve); onCfg(); return renderPop(); }
    if (b.dataset.preset) { CFG.gw = { ...PRESETS[b.dataset.preset] }; onCfg(); return renderPop(); }
    if (act === 'reset-scoring') { resetScoring(); onCfg(); return renderPop(); }
    if (act === 'reset-cols') { CFG.cols = defaults().cols; onCfg(); return renderPop(); }
    if (act === 'reset-all') { CFG = defaults(); onCfg(); return renderPop(); }
    if (act === 'save-view') { const n = $('view-name').value.trim(); if (!n) return; const s = store.get('litstats_rank_views', {}); s[n] = CFG; store.set('litstats_rank_views', s); return renderPop(); }
    if (b.dataset.load) { CFG = { ...defaults(), ...store.get('litstats_rank_views', {})[b.dataset.load] }; onCfg(); return renderPop(); }
    if (b.dataset.del) { const s = store.get('litstats_rank_views', {}); delete s[b.dataset.del]; store.set('litstats_rank_views', s); return renderPop(); }
    if (act === 'copy-view') {
      const u = new URL(location.href); u.search = ''; u.searchParams.set('v', encode(CFG));
      (navigator.clipboard ? navigator.clipboard.writeText(u.toString()) : Promise.reject()).then(() => { b.textContent = 'Copied'; }, () => { b.textContent = 'Copy failed'; });
    }
  });
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-pop]');
    if (opener) { const type = opener.dataset.pop; return popType === type ? closePop() : openPop(type); }
    // composedPath() is captured at dispatch time, so it still works after a button re-rendered (and detached from) the panel
    if (popType && !e.composedPath().includes(pop)) closePop();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && popType) closePop(); });
  /* keyboard shortcuts: / search, Esc blur, 1 2 3 switch tabs */
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || !$('rk-arena').classList.contains('hidden')) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === 'Escape') { if (typing) e.target.blur(); return; }
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); (S.tab === 'compare' ? $('cmp-a') : $('top-search-input')).focus(); }
    else if (e.key === '1') showTab('board');
    else if (e.key === '2') showTab('player');
    else if (e.key === '3') showTab('compare');
  });

  /* ================= board wiring ================= */
  $('bd-add').addEventListener('click', () => { $('bd-form').classList.toggle('hidden'); if (!$('bd-form').classList.contains('hidden')) $('ff-val').focus(); });
  $('ff-field').addEventListener('change', (e) => setOps(e.target.value));
  const submitFilter = () => {
    if ($('ff-field').value === 'hrank') return addRankFilter($('ff-op').value);
    if (addFilter($('ff-field').value, $('ff-op').value, $('ff-val').value)) $('ff-val').value = '';
  };
  $('ff-ranks-list').addEventListener('change', () => { const p = pickedRanks(); $('ff-ranks-sum').textContent = p.length ? p.map(rankLabel).join(', ') : 'Choose ranks'; $('ff-ranks-sum').style.borderColor = ''; });
  document.addEventListener('click', (e) => { const d = $('ff-ranks'); if (d.open && !d.contains(e.target)) d.open = false; });
  $('ff-add').addEventListener('click', submitFilter);
  $('ff-val').addEventListener('keydown', (e) => { if (e.key === 'Enter') submitFilter(); });
  $('bd-chips').addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]'); if (rm) { CFG.filters.splice(+rm.dataset.rm, 1); onCfg(); }
    if (e.target.closest('[data-clear]')) { CFG.filters = []; onCfg(); }
  });
  $('bd-thead').addEventListener('click', (e) => {
    const th = e.target.closest('th[data-key]'); if (!th) return;
    const k = th.dataset.key;
    CFG.sort = { key: k, dir: CFG.sort.key === k ? -CFG.sort.dir : (k === 'name' || k === 'rank' ? 1 : -1) };
    store.set('litstats_rank_cfg', CFG); renderBoard();
  });
  $('bd-more').addEventListener('click', () => { shown += PAGE; renderBoard(); });
  $('bd-tbody').addEventListener('click', (e) => { const tr = e.target.closest('tr[data-name]'); if (tr) { e.preventDefault(); openPlayer(tr.dataset.name); } });

  /* ================= fetching a player ================= */
  async function fetchRank(name) {
    const key = name.toLowerCase();
    if (cache.has(key)) return cache.get(key);
    if (!NAME_RE.test(name)) throw new Error('That does not look like a Minecraft username.');
    const db = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(name)}`);
    if (db.status === 429) throw new Error('Rate limited. Try again in a minute.');
    const dj = await db.json();
    if (dj.code !== 'player.found') throw new Error(`Player "${name}" not found.`);
    const uuid = dj.data.player.raw_id;
    const res = await fetch(`${API}/api/rank?uuid=${uuid}`);
    const body = await res.json().catch(() => ({}));
    if (res.status === 429) throw new Error('Hypixel rate limit reached. Try again shortly.');
    if (!res.ok || body.error) throw new Error(body.error || 'Could not build this ranking right now.');
    cache.set(key, body); cache.set(body.username.toLowerCase(), body);
    return body;
  }
  /** Re-score a server payload with the current curve / weights / reference choice. */
  function scorePayload(d) {
    const refOf = (r) => (CFG.model !== 'classic' || CFG.ref === 'known' || !POOL.loaded ? Math.max(r.ref, POOL.refs[r.id] || 0) : REFS[r.id] || r.ref);
    const S = {};
    for (const r of d.rows) S[r.id] = stScore(r.value, r.id, refOf(r));
    const C = compose(S);
    const rows = d.rows.map(r => {
      const w = gw(r.group), ref = refOf(r), f = w ? (C.eff[r.id] || 0) : 0;
      const strength = (G[r.group] || {}).strength ?? 1;
      const out = r.points * w * strength;
      return { ...r, ref, fraction: f, outOf: out, earned: f * out, st: ST[r.id], gpos: sPos(r.value, ST[r.id] || {}, ref) };
    });
    const groups = d.groups.map(g => {
      const strength = (G[g.id] || {}).strength ?? 1;
      return { ...g, earned: (C.G[g.id] || 0) * 1000, points: gw(g.id) ? 1000 * strength : 0 };
    });
    const score = C.score;
    const better = POOL.loaded ? ROWS.filter(r => r.score > score + 1e-9 && r.p.uuid !== d.uuid).length : null;
    const known = POOL.loaded ? ROWS.some(r => r.p.uuid === d.uuid) : false;
    return { ...d, rows, groups, score, parts: C.parts, mult: C.mult, peakId: C.peakId, position: better === null ? null : better + 1, poolN: POOL.loaded ? ROWS.length + (known ? 0 : 1) : null };
  }

  /* ================= tabs + url ================= */
  function showTab(tab, push = true) {
    S.tab = tab; closePop();
    document.querySelectorAll('.rk-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    ['board', 'player', 'compare'].forEach(x => $(`panel-${x}`).classList.toggle('hidden', x !== tab));
    $('rk-lookup').classList.toggle('hidden', tab === 'compare');           // compare has its own two inputs
    if (push) {
      const u = new URL(location.href); u.search = '';
      if (tab === 'player' && S.player) u.searchParams.set('player', S.player.username);
      if (tab === 'compare' && S.cmp.a && S.cmp.b) { u.searchParams.set('a', S.cmp.a.username); u.searchParams.set('b', S.cmp.b.username); }
      history.replaceState(null, '', u);
    }
  }
  document.querySelectorAll('.rk-tabs .tab-btn').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  window.handleTopSearch = () => { const n = $('top-search-input').value.trim(); if (n) openPlayer(n); };
  window.clearSearch = (id) => { $(id).value = ''; $(id).focus(); };
  $('rk-custom-reset').addEventListener('click', () => { resetScoring(); onCfg(); if (popType) renderPop(); });

  /* ================= player ================= */
  async function openPlayer(name, push = true) {
    showError(''); showTab('player', false);
    $('pl-content').classList.add('hidden'); $('pl-empty').classList.add('hidden');      // never leave the previous player on screen
    $('top-search-input').value = name;
    try {
      S.player = await withLoader('Calculating ranking...', () => fetchRank(name));
      S.pl.group = 'all'; renderPlayer(); showTab('player', push);
    } catch (e) { showError(e.message); $('pl-empty').classList.remove('hidden'); }
  }
  function renderPlayer() {
    const d = scorePayload(S.player);
    $('pl-empty').classList.add('hidden'); $('pl-content').classList.remove('hidden');
    $('pl-avatar').src = `https://visage.surgeplay.com/bust/${d.uuid}`; $('pl-avatar').onerror = function () { this.onerror = null; this.src = `https://vzge.me/bust/${d.uuid}.png`; };
    const nameEl = $('pl-name'); nameEl.textContent = d.username;
    const gEl = $('pl-guild'); if (gEl) gEl.innerHTML = guildHTML(d.guildTag, d.guildColor);
    nameEl.style.setProperty('color', typeof getRankBaseColourHex === 'function' ? getRankBaseColourHex(d.rank, d.monthlyRankColor) : '', 'important');
    const rankEl = $('pl-rank');
    if (d.rank && d.rank !== 'NON' && typeof formatRankText === 'function') { rankEl.innerHTML = formatRankText(d.rank, d.rankPlusColor, d.monthlyRankColor); rankEl.style.display = 'inline-block'; } else rankEl.style.display = 'none';

    const best = d.groups.find(g => g.id === d.peakId) || d.groups.slice().sort((a, b) => (b.points ? b.earned / b.points : 0) - (a.points ? a.earned / a.points : 0))[0];
    const posCls = !d.position ? '' : d.position <= 10 ? 'rank-top10' : d.position <= 25 ? 'rank-top25' : d.position <= 50 ? 'rank-top50' : d.position <= 100 ? 'rank-top100' : '';
    $('pl-pills').innerHTML = (d.position ? `<span class="rank-num-pill ${posCls}" title="Position among tracked players with your current scoring">#${d.position.toLocaleString()} of ${d.poolN.toLocaleString()}</span>` : '') +
      (best && best.points ? `<span class="rk-pill" title="The game that counts the most toward your score">Best game <b>${esc(best.name)}</b></span>` : '') + `<a class="rk-pill" href="/cabinet?player=${encodeURIComponent(d.username)}">Open cabinet ➔</a>` + customBadge();
    $('pl-score').textContent = d.score.toLocaleString(undefined, { maximumFractionDigits: 2 });
    $('pl-outof').textContent = `out of ${d.perfectScore.toLocaleString()}`;
    const pct = Math.min(100, (d.score / d.perfectScore) * 100);
    $('pl-contrib').innerHTML = contribBar(d, 'a');
    $('pl-bar').style.width = pct + '%'; $('pl-bar-pct').textContent = pct.toFixed(1) + '%';
    $('pl-bar-label').textContent = CFG.model === 'classic' ? (CFG.curve === 1 ? 'Score (% of #1)' : `Score (% of #1, curve ${CFG.curve.toFixed(2)})`) : 'Score (rank-based percentile)';
    const pctTh = document.querySelector('#pl-table th[data-sort="fraction"]'); if (pctTh) pctTh.textContent = CFG.model === 'classic' ? '% of #1' : 'Percentile';

    $('pl-group').innerHTML = `<option value="all">All games</option>` + d.groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('');
    $('pl-group').value = S.pl.group;
    $('pl-zero').setAttribute('aria-pressed', S.pl.hideZero);
    $('pl-groups').innerHTML = d.groups.slice().sort((a, b) => (b.points ? b.earned / b.points : 0) - (a.points ? a.earned / a.points : 0)).map(g => {
      const p = g.points ? Math.round((g.earned / g.points) * 100) : 0;
      return `<div class="filter-pill-btn ${S.pl.group === g.id ? 'active' : ''} ${g.points ? '' : 'disabled'}" data-group="${g.id}" title="${esc(g.name)}: ${slotOf(d, g.id) ? '#' + slotOf(d, g.id) + ' game, ' : ''}+${p1(d.parts[g.id] || 0)} pts"><div class="filter-pill-fill" style="width:${p}%"></div>${ico(groupIcon(g.id)).replace('rk-ico', 'filter-pill-icon')}<span class="filter-pill-name">${slotOf(d, g.id) ? `<em class="rk-slotn">#${slotOf(d, g.id)}</em> ` : ''}${esc(g.name)}</span><span class="filter-pill-stat">${p}%</span></div>`;
    }).join('');

    const { key, dir } = S.pl.sort;
    const rows = d.rows.filter(r => r.outOf > 0 && (S.pl.group === 'all' || r.group === S.pl.group) && (!S.pl.hideZero || r.value > 0))
      .sort((a, b) => { const x = key === 'label' ? a.label : (a[key] ?? Infinity), y = key === 'label' ? b.label : (b[key] ?? Infinity); return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir || (b.fraction - a.fraction); });
    $('pl-tbody').innerHTML = rows.map(r => {
      const p = Math.round(r.fraction * 1000) / 10;
      return `<tr><td><div class="rk-statcell">${ico(statIcon(r.st || r))}<span>${esc(r.label)}${r.estimate || (r.st && r.st.verify) ? '<span class="rk-flag" title="The #1 value for this stat is an estimate, not read from a real leaderboard">est</span>' : ''}</span></div></td>
        <td class="r rk-num">${num(r.value)}</td><td class="r rk-dim rk-hide-sm">${r.st && r.st.verify ? '~' : ''}${num(r.ref)}</td>
        <td><div class="rk-pct"><div class="rk-track"><i style="width:${Math.min(100, p)}%"></i></div><em>${p}%</em></div></td>
        <td class="r rk-num">${num(r.earned)} <span class="rk-dim" style="font-weight:500">/ ${fmt(r.outOf)}</span></td>
        <td class="r rk-dim rk-hide-sm" title="${r.position ? `Among tracked players: #${r.position.toLocaleString()}` : ''}">${r.gpos ? '≈#' + Math.round(r.gpos).toLocaleString() : '-'}</td></tr>`;
    }).join('') || `<tr><td colspan="6" class="rk-off" style="margin:0;padding:30px;">Nothing to show.</td></tr>`;
    document.querySelectorAll('#pl-table th[data-sort]').forEach(th => { th.classList.toggle('sorted', th.dataset.sort === key); th.classList.toggle('asc', th.dataset.sort === key && dir === 1); });
    $('pl-foot').textContent = 'Global rank is estimated from real leaderboard data (≈). Points use your current scoring.';
  }
  $('pl-group').addEventListener('change', (e) => { S.pl.group = e.target.value; renderPlayer(); });
  $('pl-groups').addEventListener('click', (e) => { const b = e.target.closest('[data-group]'); if (b) { S.pl.group = S.pl.group === b.dataset.group ? 'all' : b.dataset.group; renderPlayer(); } });
  $('pl-zero').addEventListener('click', () => { S.pl.hideZero = !S.pl.hideZero; renderPlayer(); });
  $('pl-table').querySelector('thead').addEventListener('click', (e) => {
    const th = e.target.closest('th[data-sort]'); if (!th) return;
    S.pl.sort = { key: th.dataset.sort, dir: S.pl.sort.key === th.dataset.sort ? -S.pl.sort.dir : (['label', 'gpos'].includes(th.dataset.sort) ? 1 : -1) };
    renderPlayer();
  });
  $('pl-compare').addEventListener('click', () => { if (S.player) { $('cmp-a').value = S.player.username; showTab('compare', false); $('cmp-b').focus(); } });

  /* ================= compare ================= */
  let CMPV = null;
  async function runCompare(a, b, push = true) {
    showError('');
    if (!a || !b) { showError('Enter two usernames.'); return; }
    $('cmp-a').value = a; $('cmp-b').value = b; showTab('compare', false);
    $('cmp-content').classList.add('hidden'); $('cmp-empty').classList.add('hidden');
    try {
      const [da, db] = await withLoader('Comparing players...', () => Promise.all([fetchRank(a), fetchRank(b)]));
      S.cmp.a = da; S.cmp.b = db; S.cmp.group = 'all'; S.cmp.open = new Set(); S.cmp.minorOpen = false; renderCompare(); showTab('compare', push); playFight();
    } catch (e) { showError(e.message); $('cmp-empty').classList.remove('hidden'); }
  }
  function renderCompare() {
    const A = scorePayload(S.cmp.a), B = scorePayload(S.cmp.b);
    CMPV = { A, B };
    $('cmp-empty').classList.add('hidden'); $('cmp-content').classList.remove('hidden');
    const card = (d, win, side) => {
      const col = typeof getRankBaseColourHex === 'function' ? getRankBaseColourHex(d.rank, d.monthlyRankColor) : '';
      const tag = d.rank && d.rank !== 'NON' && typeof formatRankText === 'function' ? `<span class="mc-rank" style="font-size:18px">${formatRankText(d.rank, d.rankPlusColor, d.monthlyRankColor)}</span>` : '';
      return `<div class="rk-cmp-card ${side} ${win ? 'win' : ''}">${win ? '<span class="rk-crown">Leads</span>' : ''}<img class="player-avatar" src="https://visage.surgeplay.com/bust/${d.uuid}" alt="" onerror="this.onerror=null;this.src='https://vzge.me/bust/${d.uuid}.png'">
        <div><div class="player-name-row" style="gap:6px">${tag}<h2 style="${col && col.startsWith('#') ? `color:${col}` : ''}">${esc(d.username)}</h2>${guildHTML(d.guildTag, d.guildColor)}</div><div class="rk-muted" style="margin-top:6px">${d.position ? `#${d.position.toLocaleString()} of ${d.poolN.toLocaleString()}` : ''} ${customBadge()}</div></div>
        <div class="rk-bigscore"><b>${p2(d.score)}</b><span>score</span></div>${contribBar(d, side)}</div>`;
    };
    $('cmp-head').innerHTML = card(A, A.score > B.score, 'a') + card(B, B.score > A.score, 'b');

    const byId = Object.fromEntries(B.rows.map(r => [r.id, r]));
    const pairs = A.rows.filter(r => r.outOf > 0).map(r => ({ id: r.id, label: r.label, group: r.group, st: r.st || r, a: r, b: byId[r.id] }));
    let aLead = 0, bLead = 0, tie = 0;
    pairs.forEach(p => { if (p.a.value > p.b.value) aLead++; else if (p.b.value > p.a.value) bLead++; else tie++; });
    CMPV.pairs = pairs;
    const diff = A.score - B.score;
    $('cmp-summary').innerHTML = (diff === 0 ? '' : `<div class="rk-verdict">${verdict(diff > 0 ? A : B, diff > 0 ? B : A)}</div>`) + `<b>${esc(A.username)}</b> leads in <b>${aLead}</b> stats, <b>${esc(B.username)}</b> in <b>${bLead}</b>${tie ? `, ${tie} level` : ''}. ${diff === 0 ? 'Dead level overall.' : `<b>${esc(diff > 0 ? A.username : B.username)}</b> is ahead by <b>${p2(Math.abs(diff))}</b> points.`}` + HOW;
    $('cmp-group').innerHTML = `<option value="all">All games</option>` + A.groups.filter(g => g.points).map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('');
    $('cmp-group').value = S.cmp.group; $('cmp-sort').value = S.cmp.sort;
    renderCmpList();
  }
  function renderCmpList() {
    if (!CMPV) return;
    const { A, B, pairs } = CMPV, gB = Object.fromEntries(B.groups.map(g => [g.id, g]));
    let games = A.groups.filter(g => g.points && (S.cmp.group === 'all' || S.cmp.group === g.id)).map(g => ({ id: g.id, name: g.name, ea: g.earned, eb: (gB[g.id] || {}).earned || 0, pa: A.parts[g.id] || 0, pb: B.parts[g.id] || 0 }));
    if (S.cmp.sort === 'swing') games.sort((x, y) => Math.abs(y.pa - y.pb) - Math.abs(x.pa - x.pb));
    const split = (x, y) => { const tot = x + y, pa = tot ? (x / tot) * 100 : 50; return `<div class="rk-split"><i style="width:${pa}%"></i><i style="width:${100 - pa}%"></i></div>`; };
    const stat = (x, y, side) => `<div class="${side} ${x > y ? 'w' : x < y ? 'n' : ''} rk-num">${num(x)}</div>`;
    const head = (d, id, e, p, o, side) => `<span class="${side} ${p > o ? 'w' : p < o ? 'n' : ''}"><b class="rk-num">+${p1(p)}</b><small>${Math.round(e).toLocaleString()} / 1,000</small>${d.peakId === id ? `<em class="rk-best">★ Best game · ×${weightX(d, id).toFixed(1)}</em>` : slotOf(d, id) ? `<em class="rk-best dim">#${slotOf(d, id)} game · ×${weightX(d, id).toFixed(1)}</em>` : ''}</span>`;
    const gTag = (g) => (Math.abs(g.pa - g.pb) / (Math.max(g.pa, g.pb) || 1) >= 0.4 ? `<small class="rk-tag">${roundTag(g, A, B)}</small>` : '');
    const why = (g, rows) => {
      const la = rows.filter(p => p.a.value > p.b.value).length, lb = rows.filter(p => p.b.value > p.a.value).length;
      const sw = la > lb ? 'a' : lb > la ? 'b' : null, pw = g.pa > g.pb ? 'a' : g.pb > g.pa ? 'b' : null;
      if (!sw || !pw || sw === pw) return '';
      const S1 = sw === 'a' ? A : B, S2 = sw === 'a' ? B : A;
      if (!slotOf(S1, g.id) || !slotOf(S2, g.id)) return '';
      return `<div class="rk-why"><b>${esc(S1.username)}</b> leads ${Math.max(la, lb)} of ${rows.length} stats here but earns fewer points. This is ${esc(S1.username)}'s #${slotOf(S1, g.id)} game (×${weightX(S1, g.id).toFixed(1)}) and ${esc(S2.username)}'s #${slotOf(S2, g.id)} (×${weightX(S2, g.id).toFixed(1)}), and higher games count for more.</div>`;
    };
    const card = (g) => {
      const open = S.cmp.open.has(g.id), rows = pairs.filter(p => p.group === g.id);
      return `<section class="rk-g ${open ? 'open' : ''}"><button type="button" class="rk-g-h" data-g="${g.id}" aria-expanded="${open}">
        ${head(A, g.id, g.ea, g.pa, g.pb, 'l')}<span class="rk-g-mid"><span class="rk-g-name">${ico(groupIcon(g.id))}${esc(g.name)}<i class="rk-chev" aria-hidden="true"></i></span>${split(g.pa, g.pb)}</span>${head(B, g.id, g.eb, g.pb, g.pa, 'r')}</button>
        ${open ? `<div class="rk-g-body">${why(g, rows)}${rows.map(p => `<div class="rk-cmp-row">${stat(p.a.value, p.b.value, 'l')}<div class="rk-cmp-mid"><span>${ico(statIcon(p.st))}${esc(p.label)}</span>${split(p.a.value, p.b.value)}</div>${stat(p.b.value, p.a.value, 'r')}</div>`).join('')}</div>` : ''}</section>`;
    };
    const minor = S.cmp.group === 'all' ? minorIds(A, B) : new Set(), big = games.filter(g => !minor.has(g.id)), small = games.filter(g => minor.has(g.id));
    let html = big.map(card).join('');
    if (small.length) {
      const sa = small.reduce((s, g) => s + g.pa, 0), sb = small.reduce((s, g) => s + g.pb, 0), mo = S.cmp.minorOpen;
      const side = (p, o, cls) => `<span class="${cls} ${p > o ? 'w' : p < o ? 'n' : ''}"><b class="rk-num">+${p1(p)}</b><small>combined</small></span>`;
      html += `<section class="rk-g rk-minor ${mo ? 'open' : ''}"><button type="button" class="rk-g-h" data-minor="1" aria-expanded="${mo}">${side(sa, sb, 'l')}<span class="rk-g-mid"><span class="rk-g-name"><span class="rk-icons">${small.slice(0, 6).map(g => ico(groupIcon(g.id))).join('')}</span>${small.length} smaller games<i class="rk-chev" aria-hidden="true"></i></span>${split(sa, sb)}</span>${side(sb, sa, 'r')}</button>${mo ? `<div class="rk-minor-body">${small.map(card).join('')}</div>` : ''}</section>`;
    }
    $('cmp-list').innerHTML = html || '<div class="rk-off" style="margin:24px auto;">Nothing to show.</div>';
    const all = games.length && games.every(g => S.cmp.open.has(g.id));
    $('cmp-expand').textContent = all ? 'Collapse all' : 'Expand all';
  }
  $('cmp-go').addEventListener('click', () => runCompare($('cmp-a').value.trim(), $('cmp-b').value.trim()));
  ['cmp-a', 'cmp-b'].forEach(id => $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') $('cmp-go').click(); }));
  $('cmp-group').addEventListener('change', (e) => { S.cmp.group = e.target.value; renderCmpList(); });
  $('cmp-sort').addEventListener('change', (e) => { S.cmp.sort = e.target.value; renderCmpList(); });
  $('cmp-expand').addEventListener('click', () => {
    const ids = CMPV.A.groups.filter(g => g.points && (S.cmp.group === 'all' || S.cmp.group === g.id)).map(g => g.id), all = ids.every(i => S.cmp.open.has(i));
    ids.forEach(i => (all ? S.cmp.open.delete(i) : S.cmp.open.add(i))); S.cmp.minorOpen = !all; renderCmpList();
  });
  $('cmp-list').addEventListener('click', (e) => {
    const h = e.target.closest('.rk-g-h'); if (!h) return;
    if (h.dataset.minor) { S.cmp.minorOpen = !S.cmp.minorOpen; return renderCmpList(); }
    const id = h.dataset.g; S.cmp.open.has(id) ? S.cmp.open.delete(id) : S.cmp.open.add(id); renderCmpList();
  });
  $('cmp-replay').addEventListener('click', () => playFight());
  const shareCompare = async (btn, idle) => {
    const u = new URL(location.href); u.search = ''; u.searchParams.set('a', S.cmp.a.username); u.searchParams.set('b', S.cmp.b.username);
    if (isCustom()) u.searchParams.set('v', encode(CFG));      // custom scoring travels with the link
    try { await navigator.clipboard.writeText(u.toString()); btn.textContent = 'Copied'; } catch (e) { btn.textContent = 'Copy failed'; }
    setTimeout(() => { btn.textContent = idle; }, 1500);
  };
  $('cmp-share').addEventListener('click', function () { shareCompare(this, 'Copy link'); });

  /* ================= fight arena ================= */
  const arena = $('rk-arena');
  let FIGHT = null;
  const SPEEDS = [1, 2, 4];
  const prefersReduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function stopFight() { if (FIGHT) { FIGHT.dead = true; [...FIGHT.wake].forEach(w => w()); } }
  function closeArena() { stopFight(); arena.classList.add('hidden'); document.body.style.overflow = ''; $('cmp-replay').focus(); }
  const fighterHTML = (d, side) => {
    const col = typeof getRankBaseColourHex === 'function' ? getRankBaseColourHex(d.rank, d.monthlyRankColor) : '';
    return `<div class="ar-f ${side}" id="ar-f${side}"><span class="ar-crown">Winner</span><div class="ar-fp"><img class="ar-av" src="https://visage.surgeplay.com/bust/${d.uuid}" alt="" onerror="this.onerror=null;this.src='https://vzge.me/bust/${d.uuid}.png'"><div class="ar-fn"><span class="ar-name" style="${col && col.startsWith('#') ? `color:${col}` : ''}">${esc(d.username)}</span>${guildHTML(d.guildTag, d.guildColor)}</div></div>
      <div class="ar-tot" id="ar-t${side}">0.00</div><div class="ar-meter"><i id="ar-m${side}"></i></div><div class="ar-sub" id="ar-s${side}">0 rounds won</div></div>`;
  };
  const sideHTML = (side, d, r, pk) => {
    const sl = r.bunch ? 0 : slotOf(d, r.id), x = r.bunch ? 0 : weightX(d, r.id);
    return `<div class="ar-side ${side} ${pk ? 'peak' : ''}" id="ar-sd${side}"><div class="ar-gv" id="ar-gv${side}">0</div><div class="ar-gl">${r.bunch ? 'points' : 'game score / 1,000'}</div><div class="ar-gbar"><i id="ar-gb${side}"></i></div><div class="ar-best ${pk ? '' : 'dim'}">${r.bunch ? 'lowest weights' : pk ? `★ Best game · ×${x.toFixed(1)}` : sl ? `#${sl} game · ×${x.toFixed(1)}` : 'Network share'}</div><div class="ar-pts" id="ar-pt${side}"></div></div>`;
  };

  async function playFight() {
    if (!S.cmp.a || !S.cmp.b) return;
    stopFight();
    const A = scorePayload(S.cmp.a), B = scorePayload(S.cmp.b), gB = Object.fromEntries(B.groups.map(g => [g.id, g]));
    const all = A.groups.filter(g => g.points).map(g => ({ id: g.id, name: g.name, ga: g.earned, gb: (gB[g.id] || {}).earned || 0, pa: A.parts[g.id] || 0, pb: B.parts[g.id] || 0 }));
    const MAXR = 10, order = all.slice().sort((x, y) => Math.max(y.pa, y.pb) - Math.max(x.pa, x.pb));     // 10 rounds: the 9 biggest games alone, every smaller game bundled into the opening round
    const rest = order.length > MAXR ? order.slice(MAXR - 1) : [], rounds = order.slice(0, order.length > MAXR ? MAXR - 1 : order.length).reverse();
    if (rest.length) rounds.unshift({ id: '_small', bunch: rest, name: `${rest.length} smaller games`, pa: rest.reduce((s, r) => s + r.pa, 0), pb: rest.reduce((s, r) => s + r.pb, 0) });
    const tok = FIGHT = { skip: prefersReduced(), dead: false, speed: 1, wake: new Set(), done: false };
    const sleep = (ms) => new Promise(res => { if (tok.skip || tok.dead) return res(); const w = () => { clearTimeout(id); tok.wake.delete(w); res(); }; const id = setTimeout(w, ms / tok.speed); tok.wake.add(w); });
    const tween = (from, to, ms, apply) => new Promise(res => {
      if (tok.skip || tok.dead) { if (!tok.dead) apply(to); return res(); }
      let raf; const t0 = performance.now();
      const w = () => { cancelAnimationFrame(raf); tok.wake.delete(w); if (!tok.dead) apply(to); res(); };
      tok.wake.add(w);
      const step = (now) => { if (tok.dead) return; const k = Math.min(1, ((now - t0) * tok.speed) / ms); apply(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) raf = requestAnimationFrame(step); else { tok.wake.delete(w); res(); } };
      raf = requestAnimationFrame(step);
    });

    arena.innerHTML = `<div class="ar-top"><div class="ar-top-l"><span class="ar-roundlab" id="ar-rl">Get ready</span>${customBadge()}</div>
        <div class="ar-ctrl"><button type="button" class="ar-btn" id="ar-speed" aria-label="Playback speed">1×</button><button type="button" class="ar-btn" id="ar-close" aria-label="Close">✕</button></div></div>
      <div class="ar-stage">${fighterHTML(A, 'a')}<div class="ar-mid" id="ar-mid" aria-live="polite"></div>${fighterHTML(B, 'b')}</div>
      <div class="ar-skiprow" id="ar-skiprow"><button type="button" class="ar-btn ar-main" id="ar-skip">Skip</button></div>
      <div class="ar-track" id="ar-track">${rounds.map((r, i) => `<span class="ar-chip" id="ar-c${i}" title="${esc(r.name)}">${r.bunch ? `<b>${r.bunch.length}</b>` : ico(groupIcon(r.id))}</span>`).join('')}</div>`;
    arena.classList.remove('hidden'); document.body.style.overflow = 'hidden'; $('ar-skip').focus();
    $('ar-close').onclick = closeArena;
    $('ar-skip').onclick = () => { tok.skip = true; [...tok.wake].forEach(w => w()); };
    $('ar-speed').onclick = function () { tok.speed = SPEEDS[(SPEEDS.indexOf(tok.speed) + 1) % SPEEDS.length]; this.textContent = tok.speed + '×'; };

    const maxT = Math.max(A.score, B.score) || 1;
    const setTot = (s, v) => { $('ar-t' + s).textContent = p2(v); $('ar-m' + s).style.width = Math.min(100, (v / maxT) * 100) + '%'; };
    const setG = (s, v, r) => { $('ar-gv' + s).textContent = r.bunch ? '+' + p2(v) : Math.round(v).toLocaleString(); $('ar-gb' + s).style.width = (r.bunch ? (v / (Math.max(r.pa, r.pb) || 1)) * 100 : v / 10) + '%'; };
    const float = (s, txt, big) => { if (tok.skip) return; const el = document.createElement('span'); el.className = 'ar-float' + (big ? ' big' : ''); el.textContent = txt; $('ar-f' + s).appendChild(el); setTimeout(() => el.remove(), 1100); };
    const bump = (s) => { const el = $('ar-t' + s); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };
    let tA = 0, tB = 0, wA = 0, wB = 0;

    $('ar-mid').innerHTML = `<div class="ar-intro"><div class="ar-vs-big">VS</div><ol class="ar-how"><li>${rounds.length} rounds. Each game is scored out of 1,000 from the player's stats.</li><li>A player's best games count for more, their lowest games for less.</li><li>Points = game score × that weight. More stats in a lower game can still earn fewer points.</li></ol></div>`;
    await sleep(4500); if (tok.dead) return;

    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i], pkA = A.peakId === r.id, pkB = B.peakId === r.id;
      $('ar-rl').textContent = `Round ${i + 1} of ${rounds.length}`;
      $('ar-mid').innerHTML = `<div class="ar-round"><div class="ar-gname">${r.bunch ? `<span class="rk-icons">${r.bunch.slice(0, 6).map(x => ico(groupIcon(x.id))).join('')}</span>` : ico(groupIcon(r.id))}<span>${esc(r.name)}</span></div><div class="ar-duel">${sideHTML('a', A, r, pkA)}${sideHTML('b', B, r, pkB)}</div><div class="ar-tagline" id="ar-tag"></div></div>`;
      await sleep(260); if (tok.dead) return;
      await Promise.all([tween(0, r.bunch ? r.pa : r.ga, 520, v => setG('a', v, r)), tween(0, r.bunch ? r.pb : r.gb, 520, v => setG('b', v, r))]); if (tok.dead) return;
      const win = r.pa > r.pb ? 'a' : r.pb > r.pa ? 'b' : null;
      if (win) { $('ar-sd' + win).classList.add('win'); win === 'a' ? wA++ : wB++; }
      float('a', '+' + p2(r.pa), pkA); float('b', '+' + p2(r.pb), pkB);
      $('ar-pta').textContent = '+' + p2(r.pa) + ' pts'; $('ar-ptb').textContent = '+' + p2(r.pb) + ' pts'; $('ar-tag').innerHTML = roundTag(r, A, B);
      await Promise.all([tween(tA, tA + r.pa, 520, v => setTot('a', v)), tween(tB, tB + r.pb, 520, v => setTot('b', v))]); if (tok.dead) return;
      tA += r.pa; tB += r.pb; bump('a'); bump('b');
      $('ar-sa').textContent = `${wA} round${wA === 1 ? '' : 's'} won`; $('ar-sb').textContent = `${wB} round${wB === 1 ? '' : 's'} won`;
      $('ar-c' + i).classList.add(win || 'tie', 'done');
      await sleep(pkA || pkB ? 800 : 160); if (tok.dead) return;
    }
    setTot('a', A.score); setTot('b', B.score);
    tok.done = true; $('ar-skiprow').classList.add('off'); $('ar-speed').classList.add('hidden'); $('ar-rl').textContent = 'Final result';
    const win = A.score === B.score ? null : A.score > B.score ? 'a' : 'b', W = win === 'a' ? A : B;
    if (win) $('ar-f' + win).classList.add('champ');
    const sw = rounds.slice().sort((x, y) => Math.abs(y.pa - y.pb) - Math.abs(x.pa - x.pb))[0], swWho = sw.pa > sw.pb ? A : B;
    $('ar-mid').innerHTML = `<div class="ar-result"><div class="ar-kicker">${win ? 'Winner' : 'Dead heat'}</div><h2>${win ? esc(W.username) : 'All square'}</h2>${win ? `<p class="ar-margin">by ${p2(Math.abs(A.score - B.score))} points</p><p class="ar-verdict">${verdict(W, win === 'a' ? B : A)}</p>` : ''}
      <div class="ar-facts"><div><b>${wA} – ${wB}</b><span>rounds won</span></div><div><b>${esc(sw.name)}</b><span>decisive round: ${esc(swWho.username)} by ${p2(Math.abs(sw.pa - sw.pb))}</span></div><div><b>${A.peakId === B.peakId ? esc(gname(A.peakId)) : `${esc(gname(A.peakId))} vs ${esc(gname(B.peakId))}`}</b><span>${A.peakId === B.peakId ? 'best game for both' : 'best games'}</span></div></div>
      <div class="ar-actions"><button type="button" class="ar-btn" id="ar-again">Replay</button><button type="button" class="ar-btn ar-main" id="ar-done">Continue</button><button type="button" class="ar-btn" id="ar-copy">Copy link</button></div></div>`;
    $('ar-again').onclick = playFight; $('ar-done').onclick = closeArena; $('ar-copy').onclick = function () { shareCompare(this, 'Copy link'); };
    $('ar-done').focus();
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !arena.classList.contains('hidden')) closeArena(); });
  arena.addEventListener('click', (e) => { if (FIGHT && FIGHT.done && !e.target.closest('.ar-f, .ar-result, .ar-btn')) closeArena(); });   // click outside the cards once it has ended

  /* ================= init ================= */
  async function init() {
    const q = new URLSearchParams(location.search);
    try {
      await withLoader('Loading rankings...', async () => {
        const [m, p] = await Promise.all([
          fetch(`${API}/api/rank?meta=1`).then(r => { if (!r.ok) throw new Error('Could not load ranking info.'); return r.json(); }),
          fetch(`${API}/api/rank?pool=1`).then(r => (r.ok ? r.json() : { configured: false })).catch(() => ({ configured: false })),
        ]);
        META = { groups: m.groups, stats: m.stats, perfect: m.perfectScore, population: m.population || 36411202, params: m.params, template: m.template, templateTail: m.templateTail };
        G = Object.fromEntries(m.groups.map(g => [g.id, g])); ST = Object.fromEntries(m.stats.map(s => [s.id, s]));
        if (p.configured && p.players.length) {
          IDX = Object.fromEntries(p.ids.map((id, i) => [id, i]));
          POOL.players = p.players.map(([uuid, name, rank, rp, mr, v, , gt, gc]) => ({ uuid, name, rank, rankPlusColor: rp, monthlyRankColor: mr, v, guildTag: gt, guildColor: gc }));
          POOL.ids = p.ids; POOL.refs = p.refs; POOL.size = p.size; POOL.stale = p.stale; POOL.loaded = true;
        } else { POOL.off = true; POOL.stale = p.stale || 0; POOL.msg = p.configured ? `${p.stale || 0} players need re-scoring. Run the seeding job to refresh them.` : 'The ranking pool needs the Redis database on the API project.'; }
      });
    } catch (e) { showError(e.message); $('board-off').classList.remove('hidden'); return; }

    updateCustomUI(); $('ff-field').innerHTML = fieldOptions(); $('ff-field').value = 's:achievement_points'; setOps('s:achievement_points'); renderTry();
    if (POOL.loaded) { rebuild(); $('board-ui').classList.remove('hidden'); renderBoard(); }
    else { $('board-off-msg').textContent = POOL.msg; $('board-off').classList.remove('hidden'); }

    if (q.get('a') && q.get('b')) runCompare(q.get('a'), q.get('b'), false);
    else if (q.get('player')) openPlayer(q.get('player'), false);
  }
  init();
})();
