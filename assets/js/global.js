function isThemeLight(theme) {
  return ['light', 'cherry'].includes(theme);
}

function applyTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('litstats_theme', themeName);

  if (isThemeLight(themeName)) {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }

  const themeSelect = document.getElementById('theme-selector');
  if (themeSelect) themeSelect.value = themeName;
  updateThemeIcon(themeName);

  if (typeof populateFilters === 'function') populateFilters();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderCabinet === 'function' && typeof globalPlayerData !== 'undefined' && globalPlayerData) {
    renderCabinet(globalPlayerData, true);
  }
}

function updateThemeIcon(themeName) {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  const isLight = isThemeLight(themeName || document.documentElement.getAttribute('data-theme'));
  if (typeof sunIcon !== 'undefined' && typeof moonIcon !== 'undefined') {
    btn.innerHTML = isLight ? moonIcon : sunIcon;
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = isThemeLight(current) ? 'dark' : 'light';
  applyTheme(next);
}

function initTheme() {
  const savedTheme = localStorage.getItem('litstats_theme') || 'dark';
  applyTheme(savedTheme);
}

function setupControls() {
  initTheme();

  const themeSelect = document.getElementById('theme-selector');
  if (themeSelect) {
    themeSelect.value = localStorage.getItem('litstats_theme') || 'dark';
    themeSelect.addEventListener('change', (e) => {
      applyTheme(e.target.value);
    });
  }

  // Global Settings Cog Popout
  const settingsBtn = document.getElementById('global-settings-btn');
  const settingsMenu = document.getElementById('global-settings-dropdown');

  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      settingsMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!settingsMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
        settingsMenu.classList.add('hidden');
      }
    });
  }

  // Colour Assist Mode
  const a11ySelect = document.getElementById('a11y-palette-select');
  const savedA11y = localStorage.getItem('site-a11y') || 'default';
  
  if (savedA11y !== 'default') {
    document.documentElement.setAttribute('data-a11y', savedA11y);
  } else {
    document.documentElement.removeAttribute('data-a11y');
  }

  if (a11ySelect) {
    a11ySelect.value = savedA11y;
    a11ySelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'default') {
        document.documentElement.removeAttribute('data-a11y');
        localStorage.removeItem('site-a11y');
      } else {
        document.documentElement.setAttribute('data-a11y', val);
        localStorage.setItem('site-a11y', val);
      }
    });
  }

  // Global Font Preference
  const fontSelect = document.getElementById('global-font-mode');
  const savedFont = localStorage.getItem('litstats_font_mode') || 'default';
  if (savedFont !== 'default') {
    document.documentElement.setAttribute('data-font', savedFont);
  }
  if (fontSelect) {
    fontSelect.value = savedFont;
    fontSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'default') {
        document.documentElement.removeAttribute('data-font');
        localStorage.removeItem('litstats_font_mode');
      } else {
        document.documentElement.setAttribute('data-font', val);
        localStorage.setItem('litstats_font_mode', val);
      }
    });
  }

  // Global Gold AP Reward Overrides
  const goldToggle = document.getElementById('global-gold-toggle');
  const savedGold = localStorage.getItem('litstats_gold_ap') === 'true';
  if (goldToggle) {
    goldToggle.checked = savedGold;
    goldToggle.addEventListener('change', (e) => {
      localStorage.setItem('litstats_gold_ap', e.target.checked);
      if (typeof renderDashboard === 'function') renderDashboard();
    });
  }

  // Global Icon Style Override
  const iconModeSelect = document.getElementById('global-icon-mode');
  const savedIconMode = localStorage.getItem('litstats_icon_mode') || 'theme';
  if (iconModeSelect) {
    iconModeSelect.value = savedIconMode;
    iconModeSelect.addEventListener('change', (e) => {
      localStorage.setItem('litstats_icon_mode', e.target.value);
      if (typeof populateFilters === 'function') populateFilters();
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof renderCabinet === 'function' && typeof globalPlayerData !== 'undefined' && globalPlayerData) {
        renderCabinet(globalPlayerData, true);
      }
    });
  }

  // High Contrast Mode
  const contrastToggle = document.getElementById('a11y-contrast-toggle');
  const savedContrast = localStorage.getItem('site-a11y-contrast') === 'high';
  if (contrastToggle) {
    contrastToggle.checked = savedContrast;
    if (savedContrast) document.documentElement.setAttribute('data-a11y-contrast', 'high');

    contrastToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.documentElement.setAttribute('data-a11y-contrast', 'high');
        localStorage.setItem('site-a11y-contrast', 'high');
      } else {
        document.documentElement.removeAttribute('data-a11y-contrast');
        localStorage.removeItem('site-a11y-contrast');
      }
    });
  }

  initBanner();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupControls);
} else {
  setupControls();
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

  return `<span style="color:${baseColor}; font-weight:700;">[${formatted}]</span>`;
}

// --- AUDIO CONTEXT ---
let audioCtx; 
document.addEventListener('click', () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: true });

function playTone(freq, type) {
  try {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (err) {}
}

// --- SHORTCUTS & KONAMI ---
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
let konamiIndex = 0;
let konamiCooldown = false;

document.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

  if (e.key === 'Escape') {
    const searchBox = document.getElementById('searchInput') || document.getElementById('achSearch') || document.getElementById('top-search-input');
    if (searchBox) {
      searchBox.blur(); 
      if (typeof runLocalSearch === "function") runLocalSearch('');
    }
    return;
  }

  if (!isTyping) {
    if (e.key === '1') { const p = document.querySelector('[data-tab="players"]'); if (p) p.click(); return; }
    if (e.key === '2') { const c = document.querySelector('[data-tab="countries"]'); if (c) c.click(); return; }
    if (e.key === '/') {
      e.preventDefault(); 
      const searchBox = document.getElementById('searchInput') || document.getElementById('achSearch') || document.getElementById('top-search-input');
      if (searchBox) searchBox.focus();
      return;
    }
  }

  if (!isTyping && !konamiCooldown) {
    const key = e.key.toLowerCase();
    const expectedKey = konamiCode[konamiIndex].toLowerCase();

    if (key === expectedKey) {
      konamiIndex++;
      playTone(800 + (konamiIndex * 50), 'sine'); 
      
      if (konamiIndex > 1 && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault(); 
      }

      if (konamiIndex === konamiCode.length) {
        konamiIndex = 0;
        window.location.href = 'blitz.html'; 
      }
      
    } else {
      if (konamiIndex > 0) {
        playTone(200, 'sawtooth'); 
        konamiIndex = 0;
        konamiCooldown = true;
        setTimeout(() => { konamiCooldown = false; }, 3000);
      }
    }
  }
});

const leaderSearch = document.getElementById('searchInput');
if (leaderSearch) {
  leaderSearch.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.blur();
    }
  });
}

// --- BANNER SYSTEM ---
const mainBanner = {
  text: "🔥 Huge Update: The Quest Leaderboard is now live!",
  btnText: "Check it out",
  btnLink: "quest.html"
};

const emergencyBanner = {
  text: "⚠️ Hypixel API is currently experiencing troubles."
};

const randomBanners = [
  { text: "Did you know? LitStats tracks over 20 different Hypixel games.", btnText: "", btnLink: "" },
  { text: "Check out the Blitz kit selector (Still a Work in Progress!)", btnText: "", btnLink: "blitz.html" },
  { text: "Found a bug or have an idea? Let me know on Discord @litphoenix.", btnText: "Discord", btnLink: "https://discord.com" }
];

let bannerMode = 'random'; 
const bannerVersion = 'v1'; 

function initBanner() {
  if (bannerMode === 'off') return; 
  if (localStorage.getItem(`litBannerClosed_${bannerVersion}`) === 'true') return;

  const banner = document.getElementById('lit-banner');
  if (!banner) return;

  let data;
  if (bannerMode === 'main') data = mainBanner;
  else if (bannerMode === 'emergency') {
    data = emergencyBanner;
    banner.classList.add('emergency');
  } 
  else data = randomBanners[Math.floor(Math.random() * randomBanners.length)];

  const textEl = document.getElementById('banner-text');
  if (textEl) textEl.textContent = data.text;

  const btn = document.getElementById('banner-link');
  if (btn) {
    if (data.btnText && data.btnLink) {
      btn.textContent = data.btnText;
      btn.href = data.btnLink;
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  }

  banner.classList.remove('hidden');
}

function closeBanner() {
  const banner = document.getElementById('lit-banner');
  if (banner) banner.classList.add('hidden');
  localStorage.setItem(`litBannerClosed_${bannerVersion}`, 'true');
}
