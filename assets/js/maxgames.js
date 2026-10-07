(() => {
  const OVERALL = 'overall';
  const TIER_ORDER = ['1st', '2nd', '3rd', '4th', 'extra'];
  const TIER_LABELS = {
    '1st': { title: '1st tier', note: 'hardest' },
    '2nd': { title: '2nd tier' },
    '3rd': { title: '3rd tier' },
    '4th': { title: '4th tier' },
    'extra': { title: 'Extra', note: 'time limited and General' },
  };
  const RESET_NOTE_DAYS = 14;
  const NAME_RE = /^[A-Za-z0-9_]{1,16}$/;

  const COUNTRY_FLAGS = {
    'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at', 'Belgium': 'be', 'Brazil': 'br',
    'Bulgaria': 'bg', 'Canada': 'ca', 'China': 'cn', 'Croatia': 'hr', 'Czech Republic': 'cz',
    'Denmark': 'dk', 'Ecuador': 'ec', 'Finland': 'fi', 'France': 'fr', 'Germany': 'de',
    'Greece': 'gr', 'Hungary': 'hu', 'India': 'in', 'Iraq': 'iq', 'Ireland': 'ie',
    'Israel': 'il', 'Italy': 'it', 'Japan': 'jp', 'Mexico': 'mx', 'Moldova': 'md',
    'New Zealand': 'nz', 'Norway': 'no', 'Poland': 'pl', 'Portugal': 'pt', 'Romania': 'ro',
    'Russia': 'ru', 'Saudi Arabia': 'sa', 'Serbia': 'rs', 'South Korea': 'kr', 'Spain': 'es',
    'Sweden': 'se', 'Switzerland': 'ch', 'Syria': 'sy', 'Taiwan': 'tw', 'The Netherlands': 'nl',
    'Turkey': 'tr', 'UK': 'gb', 'Ukraine': 'ua', 'USA': 'us', 'Chile': 'cl',
    'Bosnia and Herzegovina': 'ba', 'Slovakia': 'sk', 'Slovenia': 'si', 'Lithuania': 'lt'
  };
  const ICONS = {
    'Max Arcade': 'Arcade-64.png', 'Max Bed Wars': 'BedWars-64.png', 'Max Build Battle': 'BuildBattle-64.png',
    'Max Cops and Crims': 'CVC-64.png', 'Max Duels': 'Duels-64.png', 'Max Mega Walls': 'MegaWalls-64.png',
    'Max Murder Mystery': 'MurderMystery-64.png', 'Max Pit': 'Pit-64.png', 'Max Blitz': 'SG-64.png',
    'Max SkyBlock': 'SkyBlock-64.png', 'Max SkyWars': 'Skywars-64.png', 'Max Smash Heroes': 'SmashHeroes-64.png',
    'Max TNT Games': 'TNT-64.png', 'Max UHC': 'UHC-64.png', 'Max Warlords': 'Warlords-64.png',
    'Max Wool Games': 'WoolGames-64.png', 'Max Arena Brawl': 'Arena-64.png', 'Max Paintball': 'Paintball-64.png',
    'Max Quake': 'Quakecraft-64.png', 'Max VampireZ': 'VampireZ-64.png', 'Max Walls': 'Walls-64.png',
    'Max TKR': 'TurboKartRacers-64.png', 'Max Crazy Walls': 'CrazyWalls-64.png', 'Max SkyClash': 'SkyClash-64.png'
  };

  let data = null, byId = {}, badgeToId = {}, topGames = [], order = {};
  let playerGames = new Map();   // uuid -> Set(game ids, parts included)
  let ranking = [];              // [{uuid, count, ap}] most maxed first
  let currentId = OVERALL, query = '', liveText = '';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => (typeof tabNum === 'function' ? tabNum(n) : Number(n || 0).toLocaleString());
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const topLevel = (id) => byId[id]?.parent || id;
  const isPre = (e) => !!data.tracking_since && e.firstSeen === data.tracking_since;

  function iconFor(game) {
    if (game.id === OVERALL) return 'img/diamond.png';
    if (game.id === 'seasonal' || game.parent === 'seasonal') return 'img/games/seasonal.png';
    return `img/games/${ICONS[game.badge] || game.name.replace(/\s/g, '') + '-64.png'}`;
  }
  function flagHTML(country) {
    if (!country || country === 'Unknown') return '<span class="country-name">-</span>';
    const code = COUNTRY_FLAGS[country];
    const src = code ? `https://flagcdn.com/w40/${code}.png` : 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Flag_of_None.svg';
    return `<div class="flag-cell"><img src="${src}" class="flag-img" alt="" loading="lazy"><span class="country-name">${esc(country)}</span></div>`;
  }
  function nameLink(p, href) {
    const col = typeof rankNameColour === 'function' ? rankNameColour(p.rank, p.monthlyRankColor) : '';
    const tag = typeof formatRankText === 'function' ? formatRankText(p.rank, p.rankPlusColor, p.monthlyRankColor) : '';
    return `<a class="mg-name${col ? ' ranked' : ''}"${col ? ` style="--rank-c:${col}"` : ''} href="${href}">${tag ? `<span class="mg-rank-tag">${tag}</span>` : ''}${esc(p.username)}</a>`;
  }
  const cabinetHref = (p) => `/cabinet?player=${encodeURIComponent(p.username)}`;
  const tip = (text, cls = '') => `<span class="mg-tip ${cls}"><button type="button" class="mg-info" aria-label="More info">i</button><span class="mg-tip-body" role="tooltip">${text}</span></span>`;

  /* ---------------- Indexing ---------------- */
  function indexData() {
    byId = Object.fromEntries(data.catalog.map(g => [g.id, g]));
    badgeToId = Object.fromEntries(data.catalog.filter(g => !g.derived).map(g => [g.badge, g.id]));
    topGames = data.catalog.filter(g => !g.parent);
    order = Object.fromEntries(data.catalog.map((g, i) => [g.id, i]));

    // Seasonal = on all four parts (firstSeen = when the last part was spotted)
    const parts = data.catalog.filter(g => g.parent === 'seasonal').map(g => new Map(data.games[g.id].players.map(e => [e.uuid, e.firstSeen])));
    data.games.seasonal.players = [...(parts[0] || [])].filter(([u]) => parts.every(m => m.has(u)))
      .map(([u]) => ({ uuid: u, firstSeen: parts.map(m => m.get(u)).sort().pop() }));

    const apOf = (u) => data.players[u]?.ap || 0;
    for (const g of Object.values(data.games)) {
      g.players.sort((a, b) => a.firstSeen.localeCompare(b.firstSeen) || apOf(b.uuid) - apOf(a.uuid));
    }

    playerGames = new Map();
    for (const [id, g] of Object.entries(data.games)) {
      for (const e of g.players) {
        if (!playerGames.has(e.uuid)) playerGames.set(e.uuid, new Set());
        playerGames.get(e.uuid).add(id);
      }
    }
    ranking = [...playerGames].map(([uuid, ids]) => ({ uuid, count: topGames.filter(g => ids.has(g.id)).length, ap: apOf(uuid) }))
      .filter(r => r.count > 0 && data.players[r.uuid])
      .sort((a, b) => b.count - a.count || b.ap - a.ap);
  }

  /* ---------------- Search helpers ---------------- */
  function matchSet() {
    if (!query) return null;
    const s = new Set();
    for (const [uuid, p] of Object.entries(data.players)) if (p.username.toLowerCase().includes(query)) s.add(uuid);
    return s;
  }
  function hitGames(set) {
    const hits = new Set();
    if (!set || !set.size) return hits;
    hits.add(OVERALL);
    for (const uuid of set) for (const id of playerGames.get(uuid) || []) { hits.add(id); hits.add(topLevel(id)); }
    return hits;
  }
  function exactUuid() {
    if (!query) return null;
    return Object.keys(data.players).find(u => data.players[u].username.toLowerCase() === query) || null;
  }

  /* ---------------- Game list ---------------- */
  function rowHTML(g, count) {
    return `<button type="button" class="mg-row ${count === 0 ? 'empty' : ''}" data-game="${g.id}">
      <img src="${iconFor(g)}" alt="" loading="lazy" onerror="this.style.opacity='0'">
      <span class="mg-row-name">${esc(g.name)}</span><span class="mg-row-count">${Number(count).toLocaleString()}</span></button>`;
  }
  function renderPicker() {
    const overall = rowHTML({ id: OVERALL, name: 'Most maxed games' }, ranking.length).replace('class="mg-row ', 'class="mg-row mg-row-overall ');
    const tiers = TIER_ORDER.map(tier => {
      const inTier = topGames.filter(g => g.tier === tier);
      if (!inTier.length) return '';
      const l = TIER_LABELS[tier];
      let rows = inTier.map(g => rowHTML(g, data.games[g.id].players.length)).join('');
      if (tier === 'extra') {
        rows += `<div class="mg-row disabled"><img src="img/games/Housing-64.png" alt="" onerror="this.style.opacity='0'"><span class="mg-row-name">Housing</span>
          <span class="mg-row-count">not tracked</span>${tip('Too easy to rank. Hundreds of players have it maxed, which would flood the list.', 'up right')}</div>`;
      }
      return `<div class="mg-tier"><div class="mg-tier-label">${l.title}${l.note ? `<small>${l.note}</small>` : ''}</div>${rows}</div>`;
    }).join('');
    $('mg-picker').innerHTML = overall + tiers;
    markPicker();
  }
  function markPicker() {
    const hits = hitGames(matchSet());
    const active = topLevel(currentId);
    document.querySelectorAll('#mg-picker .mg-row[data-game]').forEach(el => {
      el.classList.toggle('active', el.dataset.game === active);
      el.classList.toggle('hit', hits.has(el.dataset.game));
    });
  }

  /* ---------------- Results ---------------- */
  function renderThead() {
    $('mg-thead').innerHTML = currentId === OVERALL
      ? `<tr><th class="rank" style="width:12%;">#${tip('Ranked by how many games they have maxed. Ties go to the higher AP.')}</th>
          <th style="width:46%;">Player</th><th style="text-align:right;width:24%;">Maxed</th><th style="text-align:right;width:18%;">AP</th></tr>`
      : `<tr><th class="rank" style="width:12%;">#${tip(`Ordered by when we first spotted them with this maxed. Anyone who already had it when tracking began${data.tracking_since ? ` (${fmtDate(data.tracking_since)})` : ''} is listed first, by AP.`)}</th>
          <th style="width:46%;">Player</th><th class="mg-col-country" style="width:24%;">Country</th><th style="text-align:right;width:18%;">AP</th></tr>`;
  }
  function renderSubtabs() {
    const wrap = $('mg-subtabs');
    if (topLevel(currentId) !== 'seasonal') { wrap.classList.add('hidden'); wrap.innerHTML = ''; return; }
    const items = [{ id: 'seasonal', name: 'All four (Seasonal)' }, ...data.catalog.filter(g => g.parent === 'seasonal')];
    wrap.innerHTML = items.map(g => `<button type="button" role="tab" class="mg-subtab ${g.id === currentId ? 'active' : ''}" data-game="${g.id}" aria-selected="${g.id === currentId}">${esc(g.name)}<span>${data.games[g.id].players.length}</span></button>`).join('');
    wrap.classList.remove('hidden');
  }
  function resetNote(id) {
    const stamp = data.games[id]?.lastReset;
    if (!stamp || (Date.now() - new Date(stamp).getTime()) / 86400000 > RESET_NOTE_DAYS) return '';
    return `<div class="mg-note">New achievements were added on ${fmtDate(stamp)}, so this list was reset. Players return as they are re-checked.</div>`;
  }
  function renderHead(shown) {
    const g = currentId === OVERALL ? { id: OVERALL, name: 'Most maxed games' } : byId[currentId];
    const title = g.parent ? `Seasonal: ${g.name}` : g.name;
    let meta;
    if (currentId === OVERALL) meta = `<strong>${ranking.length}</strong> players with at least one game maxed`;
    else {
      const n = data.games[currentId].players.length;
      meta = `<strong>${n}</strong> ${n === 1 ? 'player has' : 'players have'} this maxed${currentId === 'seasonal' ? ' (all four parts)' : ''}`;
    }
    if (query) meta += ` · showing ${shown}`;
    $('mg-head').innerHTML = `<img src="${iconFor(g)}" alt="" onerror="this.style.opacity='0'"><div><h2>${esc(title)}</h2><div class="mg-meta">${meta}</div></div>`;
    document.getElementById('mg-note-host')?.remove();
    const note = currentId === OVERALL ? '' : resetNote(currentId);
    if (note) $('mg-head').insertAdjacentHTML('afterend', `<div id="mg-note-host">${note}</div>`);
  }
  const podium = (n) => n === 1 ? 'rank-1' : n === 2 ? 'rank-2' : n === 3 ? 'rank-3' : '';
  function playerCell(p) {
    const href = cabinetHref(p);
    return `<td><div class="player-cell"><img class="player-avatar" src="https://minotar.net/helm/${encodeURIComponent(p.username)}/100" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://vzge.me/face/${esc(p.uuid)}.png'">${nameLink(p, href)}</div></td>`;
  }
  const dividerRow = (text) => `<tr class="mg-divider"><td colspan="4">${text}</td></tr>`;

  function renderBody() {
    const set = matchSet();
    const tbody = $('mg-tbody');
    let rowsHTML = '', shown = 0, emptyMsg = '';

    if (currentId === OVERALL) {
      const total = topGames.length;
      ranking.forEach((r, i) => {
        if (set && !set.has(r.uuid)) return;
        const p = data.players[r.uuid]; shown++;
        rowsHTML += `<tr class="player-row" data-href="${cabinetHref(p)}"><td style="text-align:center;"><span class="rank ${podium(i + 1)}">${i + 1}</span></td>${playerCell(p)}
          <td><div class="mg-maxed"><span><strong>${r.count}</strong><span style="color:var(--text-3)"> / ${total}</span></span><div class="mg-bar"><i style="width:${Math.round(r.count / total * 100)}%"></i></div></div></td>
          <td class="ap-cell" style="text-align:right;">${num(p.ap)}</td></tr>`;
      });
    } else {
      const list = data.games[currentId].players;
      const pre = list.filter(isPre).length;
      list.forEach((e, i) => {
        const p = data.players[e.uuid];
        if (!p || (set && !set.has(e.uuid))) return;
        shown++;
        if (!set && pre > 0 && i === 0) rowsHTML += dividerRow('Already maxed when tracking began, listed by AP');
        if (!set && pre > 0 && pre < list.length && i === pre) rowsHTML += dividerRow('Spotted since, in the order we found them');
        rowsHTML += `<tr class="player-row" data-href="${cabinetHref(p)}"><td style="text-align:center;"><span class="rank ${podium(i + 1)} ${isPre(e) ? 'pre' : ''}">${i + 1}</span></td>${playerCell(p)}
          <td class="mg-country-cell">${flagHTML(p.country)}</td><td class="ap-cell" style="text-align:right;">${num(p.ap)}</td></tr>`;
      });
    }

    if (!shown) {
      const name = currentId === OVERALL ? 'any game' : (byId[currentId].parent ? `Seasonal: ${byId[currentId].name}` : byId[currentId].name);
      if (!query) emptyMsg = `<strong>Nobody yet</strong>No tracked player has maxed ${esc(name)}.`;
      else if (set.size) emptyMsg = `<strong>Not on this list</strong>${esc(query)} hasn't maxed ${esc(name)}. Highlighted games on the list have them.`;
      else emptyMsg = `<strong>No match</strong>Nobody called "${esc(query)}" is tracked yet. Press Enter to check them live.`;
      rowsHTML = `<tr><td colspan="4" class="mg-empty">${emptyMsg}</td></tr>`;
    }
    tbody.innerHTML = rowsHTML;
    return shown;
  }

  function renderMe() {
    const host = $('mg-me'), uuid = exactUuid();
    if (!uuid) { host.classList.add('hidden'); host.innerHTML = ''; return; }
    const p = data.players[uuid];
    const ids = [...(playerGames.get(uuid) || [])].filter(id => !byId[id].parent).sort((a, b) => order[a] - order[b]);
    const total = topGames.length;
    const chips = ids.map(id => `<button type="button" class="mg-chip ${topLevel(currentId) === id ? 'active' : ''}" data-game="${id}"><img src="${iconFor(byId[id])}" alt="" onerror="this.style.display='none'">${esc(byId[id].name)}</button>`).join('');
    host.innerHTML = `<div class="mg-me"><div class="mg-me-top">
      <img src="https://minotar.net/helm/${encodeURIComponent(p.username)}/100" alt="" onerror="this.onerror=null;this.src='https://vzge.me/face/${esc(uuid)}.png'">
      <div class="mg-me-id">${nameLink(p, cabinetHref(p))}<div class="mg-me-sub">${ids.length ? `Maxed ${ids.length} of ${total} games` : 'Hasn\'t maxed a tracked game yet'}</div></div>
      <a class="mg-me-link" href="${cabinetHref(p)}">Open cabinet ➔</a></div>
      ${ids.length ? `<div class="mg-bar"><i style="width:${Math.round(ids.length / total * 100)}%"></i></div><div class="mg-chips">${chips}</div>` : ''}</div>`;
    host.classList.remove('hidden');
  }

  function renderStatus() {
    const el = $('searchResults');
    let html = '';
    if (liveText) html = esc(liveText);
    else if (query) {
      const n = matchSet().size;
      html = n ? `${n} player${n > 1 ? 's' : ''} found. Games they've maxed are highlighted.`
               : `Not on any list yet. Press <strong>Enter</strong> to check "${esc(query)}" live.`;
    }
    el.innerHTML = html;
    el.classList.toggle('hidden', !html);
  }

  function renderAll() {
    markPicker();
    renderStatus();
    renderMe();
    renderHead(renderBody());
  }

  function select(id, opts = {}) {
    if (id !== OVERALL && !byId[id]) return;
    currentId = id;
    renderThead();
    renderSubtabs();
    renderAll();
    if (location.hash.slice(1) !== id) history.replaceState(null, '', `#${id}`);
    if (opts.scroll && window.matchMedia('(max-width: 960px)').matches) $('mg-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------- Live lookup (Enter) ---------------- */
  function ingest(rec) {
    const now = new Date().toISOString();
    const ids = new Set();
    for (const b of rec.maxGames || []) if (badgeToId[b]) ids.add(badgeToId[b]);
    data.players[rec.uuid] = { country: 'Unknown', ...(data.players[rec.uuid] || {}), uuid: rec.uuid, username: rec.username, ap: rec.ap,
      rank: rec.rank, rankPlusColor: rec.rankPlusColor, monthlyRankColor: rec.monthlyRankColor };
    // Add only. Removals are left to the scheduled update so a partial response can never delete someone.
    for (const id of ids) {
      const list = data.games[id].players;
      if (!list.some(e => e.uuid === rec.uuid)) list.push({ uuid: rec.uuid, firstSeen: now });
    }
    indexData();
    renderPicker();
  }

  async function lookup(name) {
    if (!NAME_RE.test(name)) { liveText = 'That doesn\'t look like a Minecraft username.'; renderStatus(); return; }
    liveText = `Checking ${name} on Hypixel...`; renderStatus();
    try {
      const key = `litstats_mg_live_${name.toLowerCase()}`;
      let rec = null;
      try { const c = JSON.parse(sessionStorage.getItem(key) || 'null'); if (c && Date.now() - c.t < 600000) rec = c.rec; } catch (e) {}
      if (!rec) {
        const dbRes = await fetch(`https://playerdb.co/api/player/minecraft/${encodeURIComponent(name)}`);
        if (dbRes.status === 429) throw new Error('RATE_LIMIT');
        const db = await dbRes.json();
        if (db.code !== 'player.found') throw new Error('NOT_FOUND');
        const uuid = db.data.player.raw_id;
        const res = await fetch(`https://api.litstats.com/api/player?uuid=${uuid}`);
        if (res.status === 429) throw new Error('RATE_LIMIT');
        const v = await res.json();
        if (v.error === 'Player not found on Hypixel') throw new Error('NOT_FOUND');
        if (v.error) throw new Error('API_ERROR');
        rec = { uuid, username: v.username || db.data.player.username, ap: v.achievementPoints || 0, rank: v.rank,
          rankPlusColor: v.rankPlusColor, monthlyRankColor: v.monthlyRankColor, maxGames: v.maxGames || [] };
        try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), rec })); } catch (e) {}
      }
      ingest(rec);
      query = rec.username.toLowerCase();
      $('searchInput').value = rec.username;

      // Jump to their hardest maxed game if the current list doesn't have them
      const mine = [...(playerGames.get(rec.uuid) || [])].filter(id => !byId[id].parent).sort((a, b) => order[a] - order[b]);
      const here = currentId === OVERALL || (playerGames.get(rec.uuid) || new Set()).has(currentId);
      select(!here && mine.length ? mine[0] : currentId);
      liveText = mine.length ? `${rec.username} has maxed ${mine.length} of ${topGames.length} games.` : `${rec.username} hasn't maxed a tracked game yet.`;
      renderStatus();
    } catch (e) {
      liveText = e.message === 'NOT_FOUND' ? `Player "${name}" not found on Hypixel.`
        : e.message === 'RATE_LIMIT' ? 'Slow down, you are being rate-limited. Try again in a minute.'
        : `Couldn't check "${name}" right now. Try again later.`;
      renderStatus();
    }
  }

  /* ---------------- Events ---------------- */
  window.runLocalSearch = function (q) {
    query = (q || '').toLowerCase().trim();
    liveText = '';
    if (!query) $('searchInput').value = '';
    if (data) renderAll();
  };
  $('searchInput').addEventListener('input', function () { window.runLocalSearch(this.value); });
  $('searchInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); const n = this.value.trim(); if (n) lookup(n); }
  });

  document.addEventListener('click', (e) => {
    const info = e.target.closest('.mg-info');
    document.querySelectorAll('.mg-tip.open').forEach(t => { if (!info || t !== info.parentElement) t.classList.remove('open'); });
    if (info) info.parentElement.classList.toggle('open');

    const pick = e.target.closest('#mg-picker .mg-row[data-game]');
    if (pick) return select(pick.dataset.game, { scroll: true });
    const chip = e.target.closest('.mg-chip[data-game], .mg-subtab[data-game]');
    if (chip) return select(chip.dataset.game);
    if (!e.target.closest('a, .mg-tip')) {
      const tr = e.target.closest('#mg-tbody tr[data-href]');
      if (tr) window.location.href = tr.dataset.href;
    }
  });

  /* ---------------- Load ---------------- */
  function mergeLive(players) {
    for (const [uuid, rec] of Object.entries(players || {})) {
      let added = false;
      for (const [badge, firstSeen] of Object.entries(rec.games || {})) {
        const id = badgeToId[badge], g = id && data.games[id];
        if (!g || (g.lastReset && firstSeen < g.lastReset)) continue;     // stale: predates the last reset
        if (!g.players.some(e => e.uuid === uuid)) { g.players.push({ uuid, firstSeen }); added = true; }
      }
      if (added && !data.players[uuid]) {
        data.players[uuid] = { uuid, username: rec.username, country: 'Unknown', ap: rec.ap || 0, rank: rec.rank, rankPlusColor: rec.rankPlusColor, monthlyRankColor: rec.monthlyRankColor };
      }
    }
  }

  async function load() {
    try {
      const hour = Math.floor(Date.now() / 3600000);
      const [staticRes, liveRes] = await Promise.allSettled([
        fetch(`max_games_data.json?v=${hour}`),
        fetch('https://api.litstats.com/api/maxgames').then(r => (r.ok ? r.json() : null)),
      ]);
      if (staticRes.status !== 'fulfilled' || !staticRes.value.ok) throw new Error('Data fetch failed (file not found or network error)');
      data = await staticRes.value.json();
      byId = Object.fromEntries(data.catalog.map(g => [g.id, g]));
      badgeToId = Object.fromEntries(data.catalog.filter(g => !g.derived).map(g => [g.badge, g.id]));
      if (liveRes.status === 'fulfilled' && liveRes.value) mergeLive(liveRes.value.players);
      indexData();

      const d = new Date(data.last_update);
      const stamp = `${fmtDate(data.last_update)} at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
      document.querySelectorAll('.last-updated-time').forEach(el => el.textContent = stamp);

      renderPicker();
      $('mg-loading').classList.add('hidden');
      $('mg-layout').classList.remove('hidden');
      const fromHash = location.hash.slice(1);
      select(fromHash === OVERALL || byId[fromHash] ? fromHash : OVERALL);
    } catch (err) {
      console.error('LitStats Error:', err);
      $('mg-loading').classList.add('hidden');
      $('mg-error').textContent = `Script Error: ${err.message}`;
      $('mg-error').classList.remove('hidden');
    }
  }
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (data && (id === OVERALL || byId[id]) && id !== currentId) select(id);
  });

  const sparkObserver = new ResizeObserver(entries => entries.forEach(entry => {
    entry.target.style.setProperty('--spark-speed', `${Math.max(2.5, entry.contentRect.height / 100)}s`);
  }));
  document.querySelectorAll('.table-wrap').forEach(w => sparkObserver.observe(w));

  load();
})();
