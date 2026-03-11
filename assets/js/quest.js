const countryFlags = {
  'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at', 'Belgium': 'be', 'Brazil': 'br',
  'Bulgaria': 'bg', 'Canada': 'ca', 'China': 'cn', 'Croatia': 'hr', 'Czech Republic': 'cz',
  'Denmark': 'dk', 'Ecuador': 'ec', 'Finland': 'fi', 'France': 'fr', 'Germany': 'de',
  'Greece': 'gr', 'Hungary': 'hu', 'India': 'in', 'Iraq': 'iq', 'Ireland': 'ie',
  'Israel': 'il', 'Italy': 'it', 'Japan': 'jp', 'Mexico': 'mx', 'Moldova': 'md',
  'New Zealand': 'nz', 'Norway': 'no', 'Poland': 'pl', 'Portugal': 'pt', 'Romania': 'ro',
  'Russia': 'ru', 'Saudi Arabia': 'sa', 'Serbia': 'rs', 'South Korea': 'kr', 'Spain': 'es',
  'Sweden': 'se', 'Switzerland': 'ch', 'Syria': 'sy', 'Taiwan': 'tw', 'The Netherlands': 'nl',
  'Turkey': 'tr', 'UK': 'gb', 'Ukraine': 'ua', 'USA': 'us'
};

let currentData = null;
let allPlayersList = [];
let processedCountries = [];
let currentTab = 'players';
let sortCol = 'rank', sortDir = 1;
let playerQuestCache = {}; 

const BATCH_SIZE = 25;
let currentFilteredPlayers = [];
let playersRenderCount = 0;
let currentFilteredCountries = [];
let countriesRenderCount = 0;

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.dataset.tab;
    document.getElementById('panel-players').classList.add('hidden');
    document.getElementById('panel-countries').classList.add('hidden');
    document.getElementById(`panel-${currentTab}`).classList.remove('hidden');
  });
});

function fmt(n) { return Number(n).toLocaleString(); }
function getRankClass(r) { return r === 1 ? 'rank-1' : r === 2 ? 'rank-2' : r === 3 ? 'rank-3' : ''; }

function getFlagHTML(c) {
  if (c === 'youtubers') return `<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1280px-YouTube_full-color_icon_%282017%29.svg.png" class="flag-img" style="object-fit: contain;">`;
  if (c === 'staff') return `<img src="https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/gigs2/317699597/original/fb21937c8742ee5d3de5c9e02b4d340d80a39513/setup-minecraft-server-that-you-pay.jpg" class="flag-img" style="object-fit: cover;">`;
  if (countryFlags[c]) return `<img src="https://flagcdn.com/w40/${countryFlags[c]}.png" class="flag-img">`;
  return `<img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Flag_of_None.svg" class="flag-img">`;
}

async function togglePlayerExpand(uuid) {
  const expandRow = document.getElementById(`expand-${uuid}`);
  if (!expandRow) return;

  if (expandRow.classList.contains('open')) {
    expandRow.classList.remove('open');
    return;
  }

  document.querySelectorAll('.player-expanded-row').forEach(row => row.classList.remove('open'));
  expandRow.classList.add('open');

  const container = document.getElementById(`maxes-${uuid}`);

  if (playerQuestCache[uuid]) {
    renderQuestStatsHTML(container, playerQuestCache[uuid], uuid);
    return;
  }

  container.innerHTML = `<span style="color:var(--text-3); font-size:12px; font-weight: 500;">Loading quest stats from network...</span>`;

  try {
    const res = await fetch(`https://litstats.vercel.app/api/player?uuid=${uuid}`);
    if (res.status === 429) throw new Error('RATE_LIMIT');
    const data = await res.json();
    if (data.error) throw new Error(data.error); 
    
    playerQuestCache[uuid] = data;
    renderQuestStatsHTML(container, data, uuid);
  } catch (e) {
    container.innerHTML = `<span style="color:var(--red); font-size:12px;">${e.message === 'RATE_LIMIT' ? 'Slow down! Too many network requests.' : `Error: ${e.message}`}</span>`;
  }
}

function renderQuestStatsHTML(container, data, uuid) {
  let html = `<div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">`;
  
  if (data.topQuests && data.topQuests.length > 0) {
    data.topQuests.forEach((q, i) => {
      let medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
      html += `<div class="stat-pill"><span>${medal} ${q.game}</span> <b>${fmt(q.count)}</b></div>`;
    });
  } else {
    html += `<span style="color:var(--text-3); font-size:12px;">Detailed quest stats pending API sync.</span>`;
  }
  
  html += `</div><a href="cabinet.html?uuid=${uuid}" class="cabinet-btn">Enter Player Hub ➔</a>`;
  container.innerHTML = html;
}

function initPlayersRender(players) {
  currentFilteredPlayers = players;
  playersRenderCount = 0;
  const tbody = document.getElementById('players-tbody');
  tbody.innerHTML = '';
  
  if (!players.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px; color: var(--text-3);">No players found.</td></tr>`;
    document.getElementById('players-sentinel').classList.add('hidden');
    return;
  }
  renderNextPlayersBatch();
}

function renderNextPlayersBatch() {
  const tbody = document.getElementById('players-tbody');
  const toRender = currentFilteredPlayers.slice(playersRenderCount, playersRenderCount + BATCH_SIZE);
  if (!toRender.length) return;

  const fragment = document.createDocumentFragment();

  toRender.forEach(p => {
    const rc = getRankClass(p.globalRank);
    let gainHTML = p.monthly_gain === "NEW" ? `<span class="gain-new">NEW</span>` : 
                   p.monthly_gain > 0 ? `<span class="gain-pos">+${fmt(p.monthly_gain)}</span>` : 
                   p.monthly_gain < 0 ? `<span class="gain-neg">${fmt(p.monthly_gain)}</span>` : 
                   `<span class="gain-zero">-</span>`;

    let posHTML = p.posChange > 0 ? `<span class="position-indicator pos-up">▲ ${p.posChange}</span>` : 
                  p.posChange < 0 ? `<span class="position-indicator pos-down">▼ ${Math.abs(p.posChange)}</span>` : 
                  p.previousRank > 0 ? `<span class="position-indicator pos-same">=</span>` : '';

    const tr = document.createElement('tr');
    tr.className = 'player-row';
    tr.onclick = () => togglePlayerExpand(p.uuid);
    tr.innerHTML = `
        <td style="text-align: center;"><span class="rank ${rc}">${p.globalRank || ''} ${posHTML}</span></td>
        <td>
          <div class="player-cell">
            <img class="player-avatar" src="https://minotar.net/helm/${p.username}/100" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://vzge.me/face/${p.uuid || ''}.png'">
            <span class="player-name">${p.username}</span>
          </div>
        </td>
        <td><div class="flag-cell">${getFlagHTML(p.country)}<span class="country-name">${p.country}</span></div></td>
        <td class="ap-cell" style="text-align: right;">${fmt(p.current_quests)}</td>
        <td style="text-align: right;">${gainHTML}</td>
    `;
    fragment.appendChild(tr);

    const expand = document.createElement('tr');
    expand.className = 'player-expanded-row';
    expand.id = `expand-${p.uuid}`;
    expand.innerHTML = `<td colspan="5"><div class="maxes-container" id="maxes-${p.uuid}"></div></td>`;
    fragment.appendChild(expand);
  });

  tbody.appendChild(fragment);
  playersRenderCount += toRender.length;

  if (playersRenderCount < currentFilteredPlayers.length) {
    document.getElementById('players-sentinel').classList.remove('hidden');
  } else {
    document.getElementById('players-sentinel').classList.add('hidden');
  }
}

function initCountriesRender(countries) {
  currentFilteredCountries = countries;
  countriesRenderCount = 0;
  const tbody = document.getElementById('countries-tbody');
  tbody.innerHTML = '';

  if (!countries.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 30px; color: var(--text-3);">No countries found.</td></tr>`;
    document.getElementById('countries-sentinel').classList.add('hidden');
    return;
  }
  renderNextCountriesBatch();
}

function renderNextCountriesBatch() {
  const tbody = document.getElementById('countries-tbody');
  const toRender = currentFilteredCountries.slice(countriesRenderCount, countriesRenderCount + BATCH_SIZE);
  if (!toRender.length) return;

  const fragment = document.createDocumentFragment();

  toRender.forEach((c) => {
    const rank = c.globalRank;
    const topP = c.top_players[0] || {};
    
    const tr = document.createElement('tr');
    tr.className = 'country-row';
    tr.innerHTML = `
      <td style="text-align: center;"><span class="rank ${getRankClass(rank)}">${rank}</span></td>
      <td><div class="flag-cell">${getFlagHTML(c.country)}<span class="country-name" style="font-weight:600; color:var(--text);">${c.country}</span></div></td>
      <td class="ap-cell" style="text-align: right;">${c.score > 0 ? fmt(Math.round(c.score)) : '-'}</td>
      <td style="padding-left: 40px;">
        <div class="player-cell" style="gap:8px;">
          <img class="player-avatar" style="width:24px;height:24px;border-radius:4px;" src="https://minotar.net/helm/${topP.username||'?'}/100" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://vzge.me/face/${topP.uuid}.png'">
          <span class="country-name" style="font-weight:600; color:var(--text);">${topP.username || 'Unknown'}</span>
        </div>
      </td>
      <td style="text-align:right; padding-right:20px;"><span class="expand-icon">▶</span></td>
    `;

    const expandRow = document.createElement('tr');
    expandRow.className = 'country-players-row';
    let subPlayersHTML = c.top_players.slice(0, 10).map((sp, i) => `
        <div class="sub-player">
          <div class="sub-player-left">
            <span class="sub-rank">${i+1}</span>
            <img class="player-avatar" style="width:20px;height:20px;" src="https://minotar.net/helm/${sp.username}/100" onerror="this.onerror=null;this.src='https://vzge.me/face/${sp.uuid}.png'">
            <span class="sub-name">${sp.username}</span>
          </div>
          <span class="sub-ap">${fmt(sp.current_quests)} Quests</span>
        </div>
      `).join('');

    expandRow.innerHTML = `<td colspan="5"><div class="country-players-inner"><div class="sub-player-list">${subPlayersHTML}</div></div></td>`;

    tr.addEventListener('click', () => {
      tr.classList.toggle('open');
      expandRow.classList.toggle('open');
    });

    fragment.appendChild(tr);
    fragment.appendChild(expandRow);
  });

  tbody.appendChild(fragment);
  countriesRenderCount += toRender.length;

  if (countriesRenderCount < currentFilteredCountries.length) {
    document.getElementById('countries-sentinel').classList.remove('hidden');
  } else {
    document.getElementById('countries-sentinel').classList.add('hidden');
  }
}

async function loadData() {
  try {
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const res = await fetch(`questers_data.json?v=${currentHour}`);
    
    if (!res.ok) throw new Error('Data fetch failed');
    currentData = await res.json();
    
    const tempPlayers = currentData.country_leaderboard.flatMap(c => c.top_players.map(p => ({...p, country: c.country})));
    const sortedByQuests = [...tempPlayers].sort((a,b) => b.current_quests - a.current_quests);
    const sortedByPrev = [...tempPlayers].sort((a,b) => (b.last_month_quests||0) - (a.last_month_quests||0));
    
    allPlayersList = sortedByQuests.map((p, idx) => {
      const prevIdx = sortedByPrev.findIndex(op => op.uuid === p.uuid);
      return {
        ...p,
        globalRank: idx + 1,
        previousRank: prevIdx + 1,
        posChange: prevIdx >= 0 ? ((prevIdx + 1) - (idx + 1)) : 0
      };
    });

    const cMap = {};
    allPlayersList.forEach(p => { if(!cMap[p.country]) cMap[p.country] = []; cMap[p.country].push(p); });

    const weights = [1.0, 0.50, 0.25, 0.10, 0.05]; 
    let minScore = Math.min(...allPlayersList.map(p => p.current_quests)) - 100;
    const baseline = Math.max(0, minScore);

    processedCountries = Object.keys(cMap).map(c => {
      const top5 = cMap[c].slice(0, 5);
      const score = top5.reduce((sum, p, i) => sum + (Math.max(0, p.current_quests - baseline) * weights[i]), 0);
      return { country: c, top_players: cMap[c], score: Math.round(score) };
    });

    const known = processedCountries.filter(c => c.country !== 'Unknown').sort((a,b) => b.score - a.score);
    const unknown = processedCountries.filter(c => c.country === 'Unknown');
    processedCountries = [...known, ...unknown].map((c, idx) => ({ ...c, globalRank: idx + 1 }));

    const d = new Date(currentData.last_update);
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('.last-updated-time').forEach(el => el.textContent = `${dateStr} at ${timeStr}`);

    document.getElementById('players-loading').classList.add('hidden');
    document.getElementById('players-table').classList.remove('hidden');
    document.getElementById('countries-loading').classList.add('hidden');
    document.getElementById('countries-table').classList.remove('hidden');

    initPlayersRender(allPlayersList);
    initCountriesRender(processedCountries);
  } catch (err) {
    document.getElementById('players-loading').classList.add('hidden');
    document.getElementById('players-error').classList.remove('hidden');
  }
}

const searchInput = document.getElementById('searchInput');

function runLocalSearch(q) {
  let fPlayers = allPlayersList;
  let fCountries = processedCountries;

  if (q) {
    fPlayers = fPlayers.filter(p => p.username.toLowerCase().includes(q) || p.country.toLowerCase().includes(q));
    fCountries = fCountries.filter(c => c.country.toLowerCase().includes(q));

    if (fPlayers.length > 0 || fCountries.length > 0) {
      let res = [];
      if (fPlayers.length) res.push(`${fPlayers.length} player${fPlayers.length === 1 ? '' : 's'}`);
      if (fCountries.length) res.push(`${fCountries.length} countr${fCountries.length === 1 ? 'y' : 'ies'}`);
      document.getElementById('searchResults').innerHTML = `Found ${res.join(' and ')}`;
      document.getElementById('searchResults').classList.remove('hidden');
      initPlayersRender(fPlayers);
      initCountriesRender(fCountries);
    } else {
      document.getElementById('searchResults').innerHTML = `No local results found. Press <strong>Enter</strong> to search the network live.`;
      document.getElementById('searchResults').classList.remove('hidden');
      initPlayersRender([]);
      initCountriesRender([]);
    }
  } else {
    document.getElementById('searchResults').classList.add('hidden');
    fPlayers.sort((a, b) => {
      let va = sortCol === 'rank' ? a.globalRank : sortCol === 'quests' ? a.current_quests : sortCol === 'gain' ? (a.monthly_gain === "NEW" ? 0 : a.monthly_gain) : sortCol === 'player' ? a.username.toLowerCase() : a.country.toLowerCase();
      let vb = sortCol === 'rank' ? b.globalRank : sortCol === 'quests' ? b.current_quests : sortCol === 'gain' ? (b.monthly_gain === "NEW" ? 0 : b.monthly_gain) : sortCol === 'player' ? b.username.toLowerCase() : b.country.toLowerCase();
      if (va < vb) return -1 * sortDir;
      if (va > vb) return 1 * sortDir;
      return 0;
    });
    initPlayersRender(fPlayers);
    initCountriesRender(fCountries);
  }
}

searchInput.addEventListener('input', function() { runLocalSearch(this.value.toLowerCase().trim()); });

searchInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    const q = this.value.toLowerCase().trim();
    if (!q) return;

    let localPlayers = allPlayersList.filter(p => p.username.toLowerCase().includes(q) || p.country.toLowerCase().includes(q));
    let localCountries = processedCountries.filter(c => c.country.toLowerCase().includes(q));

    if (localPlayers.length === 0 && localCountries.length === 0) {
      document.getElementById('searchResults').textContent = `Searching network for "${q}"...`;
      document.getElementById('searchResults').classList.remove('hidden');
      fetchLivePlayer(q);
    }
  }
});

document.querySelectorAll('#players-table th[data-col]').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (sortCol === col) sortDir *= -1;
    else { sortCol = col; sortDir = (col === 'rank' || col === 'quests' || col === 'gain') ? -1 : 1; }

    document.querySelectorAll('#players-table th').forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
    th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
    
    runLocalSearch(document.getElementById('searchInput').value.toLowerCase().trim());
  });
});

async function fetchLivePlayer(username) {
  const qLower = username.toLowerCase();
  const cacheKey = `litstats_live_${qLower}`;
  const searchBox = document.getElementById('searchResults');

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsedCache = JSON.parse(cached);
      if (Date.now() - parsedCache.timestamp < 10 * 60 * 1000) {
        displayLiveResult(parsedCache.data);
        searchBox.textContent = `Showing cached live data for ${parsedCache.data.actualName}`;
        return;
      }
    }

    const dbRes = await fetch(`https://playerdb.co/api/player/minecraft/${username}`);
    if (dbRes.status === 429) throw new Error('RATE_LIMIT');
    const dbData = await dbRes.json();
    if (dbData.code !== 'player.found') throw new Error('NOT_FOUND');
    
    const uuid = dbData.data.player.raw_id;
    const actualName = dbData.data.player.username;

    searchBox.textContent = `Loading live stats for ${actualName}...`;
    const vRes = await fetch(`https://litstats.vercel.app/api/player?uuid=${uuid}`);
    
    if (vRes.status === 429) throw new Error('RATE_LIMIT');
    const vData = await vRes.json();
    if (vData.error === "Player not found on Hypixel") throw new Error('NOT_FOUND');
    if (vData.error) throw new Error('API_ERROR');

    const finalData = {
      actualName: actualName,
      uuid: uuid,
      current_quests: vData.questsCompleted || 0,
      topQuests: vData.topQuests || []
    };

    sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: finalData }));
    playerQuestCache[uuid] = finalData; 

    displayLiveResult(finalData);
    searchBox.textContent = `Showing live data for ${actualName}`;

  } catch (e) {
    if (e.message === 'NOT_FOUND') {
      searchBox.textContent = `Player "${username}" not found on Hypixel.`;
    } else if (e.message === 'RATE_LIMIT') {
      searchBox.textContent = `Slow down! You are being rate-limited. Try again in a minute.`;
    } else {
      searchBox.textContent = `Error fetching data for "${username}". Try again later.`;
    }
  }
}

function displayLiveResult(data) {
  const score = data.current_quests;
  const tbody = document.getElementById('players-tbody');
  
  const trHTML = `
    <tr class="player-row" style="background: var(--accent-soft); border-left: 3px solid var(--accent);" onclick="togglePlayerExpand('${data.uuid}')">
      <td style="text-align: center;"><span class="rank" style="color: var(--accent); font-weight: bold;">LIVE</span></td>
      <td>
        <div class="player-cell">
          <img class="player-avatar" src="https://minotar.net/helm/${data.actualName}/100">
          <span class="player-name">${data.actualName}</span>
        </div>
      </td>
      <td><div class="flag-cell"><span class="country-name" style="color: var(--text-3); font-style: italic;">Unknown</span></div></td>
      <td class="ap-cell" style="text-align: right;">${Number(score).toLocaleString()}</td>
      <td style="text-align: right;"><span class="gain-new" style="background:var(--surface);border:1px solid var(--accent);">LIVE API</span></td>
    </tr>
    <tr class="player-expanded-row" id="expand-${data.uuid}">
      <td colspan="5"><div class="maxes-container" id="maxes-${data.uuid}"></div></td>
    </tr>
  `;
  
  tbody.insertAdjacentHTML('afterbegin', trHTML);
  document.querySelector('[data-tab="players"]').click();
}

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (entry.target.id === 'players-sentinel' && currentTab === 'players' && playersRenderCount < currentFilteredPlayers.length) {
        renderNextPlayersBatch();
      } else if (entry.target.id === 'countries-sentinel' && currentTab === 'countries' && countriesRenderCount < currentFilteredCountries.length) {
        renderNextCountriesBatch();
      }
    }
  });
}, { rootMargin: '800px' });

scrollObserver.observe(document.getElementById('players-sentinel'));
scrollObserver.observe(document.getElementById('countries-sentinel'));

const sparkObserver = new ResizeObserver(entries => {
  entries.forEach(entry => {
    const height = entry.contentRect.height;
    entry.target.style.setProperty('--spark-speed', `${Math.max(2.5, height / 100)}s`);
  });
});
document.querySelectorAll('.table-wrap').forEach(wrap => sparkObserver.observe(wrap));

loadData();
