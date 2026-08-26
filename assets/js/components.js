const sunIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
const moonIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
const navChevron = `<svg class="chevron-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

const litHeader = `
  <header class="site-header">
    <div class="header-inner">
      <a class="logo" href="index.html">
        <img src="img/lq-favicon.png" alt="LitStats" style="width: 30px; height: 30px; border-radius: 6px;">
        <span class="logo-text">LitStats</span>
      </a>

      <!-- Desktop Nav with Hover Dropdowns -->
      <nav class="nav-links desktop-nav">
        <a href="index.html" class="nav-btn">AP Tracker</a>
        
        <!-- Leaderboards Dropdown -->
        <div class="nav-dropdown-wrapper">
          <button type="button" class="nav-btn nav-dropdown-btn">
            Leaderboards ${navChevron}
          </button>
          <div id="nav-leaderboard-menu" class="nav-dropdown-menu">
            <a href="leaderboard.html"><img src="img/diamond.png" alt=""> AP Leaderboard</a>
            <a href="quest.html"><img src="img/xp.png" alt=""> Quest Leaderboard</a>
          </div>
        </div>

        <!-- Blitz Dropdown -->
        <div class="nav-dropdown-wrapper">
          <button type="button" class="nav-btn nav-dropdown-btn">
            Blitz ${navChevron}
          </button>
          <div id="nav-blitz-menu" class="nav-dropdown-menu">
            <a href="blitz.html"><img src="https://api.minecraftitems.xyz/api/item/emerald?size=2&glint=false" alt=""> Kit Kingdom</a>
            <a href="blitzstars.html"><img src="https://api.minecraftitems.xyz/api/item/nether_star?size=2&glint=false" alt=""> Blitz Stars</a>
            <a href="kitlb.html"><img src="https://api.minecraftitems.xyz/api/item/diamond_chestplate?size=2&glint=false" alt=""> Protection Leaderboard</a>
          </div>
        </div>

        <a href="angel.html" class="nav-btn">SkyWars</a>
        <a href="bedwars.html" class="nav-btn">Bed Wars</a>
      </nav>

      <div class="header-controls">
        <!-- Settings Popout -->
        <div class="settings-menu-container">
          <button id="global-settings-btn" class="icon-btn settings-toggle-btn" aria-label="Site Settings" title="Site Settings" type="button" onclick="toggleGlobalSettings(event)">
            <svg style="pointer-events: none;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          
          <div id="global-settings-dropdown" class="settings-dropdown-menu hidden">
            <div class="settings-item">
              <label for="theme-selector">Site Theme</label>
              <select id="theme-selector" class="todo-select" style="width: 100%;">
                <option value="dark">Dark Ember</option>
                <option value="midnight">Stealth</option>
                <option value="amethyst">Amethyst</option>
                <option value="light">Light Ember</option>
                <option value="cherry">Cherry Blossom</option>
                <option value="minecraft">Minecraft</option>
              </select>
            </div>
            <div class="settings-item">
              <label for="a11y-palette-select">Colour Assist</label>
              <select id="a11y-palette-select" class="todo-select" style="width: 100%;">
                <option value="default">Default</option>
                <option value="protan-deutan">Red-Green Assist</option>
                <option value="tritan">Blue-Yellow Assist</option>
              </select>
            </div>
            <div class="settings-item">
              <label for="global-icon-mode">Game Icon Style</label>
              <select id="global-icon-mode" class="todo-select" style="width: 100%;">
                <option value="theme">Theme Default</option>
                <option value="classic">Classic Minecraft Items</option>
                <option value="modern">Modern Badges</option>
              </select>
            </div>
            <div class="settings-item">
              <label for="global-font-mode">Font Style</label>
              <select id="global-font-mode" class="todo-select" style="width: 100%;">
                <option value="default">Default Modern</option>
                <option value="minecraft">Minecraft Pixel</option>
              </select>
            </div>
            <div class="settings-item-row">
              <span>High Contrast</span>
              <label class="toggle-switch">
                <input type="checkbox" id="a11y-contrast-toggle">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <button class="theme-toggle" id="themeBtn" aria-label="Toggle Light/Dark Theme" type="button" onclick="if(typeof toggleTheme==='function')toggleTheme()"></button>
        <button class="mobile-menu-btn" type="button" aria-label="Toggle Navigation Menu" onclick="toggleMobileNav(event)">☰</button>
      </div>
    </div>

    <!-- Mobile Navigation -->
    <nav class="mobile-nav" id="mobileNav">
      <a href="index.html" class="nav-btn">AP Tracker</a>
      
      <div class="mobile-accordion">
        <button type="button" class="nav-btn mobile-accordion-header" onclick="toggleMobileAccordion(this)">
          <span>Leaderboards</span>
          ${navChevron}
        </button>
        <div class="mobile-accordion-body hidden">
          <a href="leaderboard.html" class="nav-btn sub-link"><img src="img/diamond.png" alt=""> AP Leaderboard</a>
          <a href="quest.html" class="nav-btn sub-link"><img src="img/xp.png" alt=""> Quest Leaderboard</a>
        </div>
      </div>

      <div class="mobile-accordion">
        <button type="button" class="nav-btn mobile-accordion-header" onclick="toggleMobileAccordion(this)">
          <span>Blitz</span>
          ${navChevron}
        </button>
        <div class="mobile-accordion-body hidden">
          <a href="blitz.html" class="nav-btn sub-link"><img src="https://api.minecraftitems.xyz/api/item/emerald?size=2&glint=false" alt=""> Kit Kingdom</a>
          <a href="blitzstars.html" class="nav-btn sub-link"><img src="https://api.minecraftitems.xyz/api/item/nether_star?size=2&glint=false" alt=""> Blitz Stars</a>
          <a href="kitlb.html" class="nav-btn sub-link"><img src="https://api.minecraftitems.xyz/api/item/diamond_chestplate?size=2&glint=false" alt=""> Protection Leaderboard</a>
        </div>
      </div>

      <a href="angel.html" class="nav-btn">SkyWars</a>
        <a href="bedwars.html" class="nav-btn">Bed Wars</a>
    </nav>
  </header>
`;

const litFooter = `
  <footer class="site-footer">
    <div class="footer-content">
      <div class="footer-brand">
        <img src="img/lq-favicon.png" alt="LitStats" class="footer-logo">
        <span style="color: var(--text-2);">LitStats</span>
      </div>
      <div class="footer-links">
        <a href="index.html" class="nav-btn">Home</a>
        <a href="leaderboard.html" class="nav-btn">AP Leaderboard</a>
        <a href="quest.html" class="nav-btn">Quest Leaderboard</a>
        <a href="blitz.html" class="nav-btn">Blitz</a>
        <a href="angel.html" class="nav-btn">SkyWars</a>
        <a href="bedwars.html" class="nav-btn">Bed Wars</a>
      </div>
      <div class="footer-copyright">
        &copy; 2026 LitPhoenix. All rights reserved.
      </div>
    </div>
  </footer>
`;

window.toggleMobileAccordion = function(btn) {
  const body = btn.nextElementSibling;
  const arrow = btn.querySelector('.chevron-arrow');
  if (body) {
    body.classList.toggle('hidden');
    if (arrow) {
      arrow.style.transform = body.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }
};

window.toggleMobileNav = function(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const settingsMenu = document.getElementById('global-settings-dropdown');
  if (settingsMenu) settingsMenu.classList.add('hidden');

  const nav = document.getElementById('mobileNav');
  if (nav) nav.classList.toggle('open');
};

window.toggleGlobalSettings = function(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const mobNav = document.getElementById('mobileNav');
  if (mobNav) mobNav.classList.remove('open');

  const menu = document.getElementById('global-settings-dropdown');
  if (menu) menu.classList.toggle('hidden');
};

document.addEventListener('click', (e) => {
  const settingsMenu = document.getElementById('global-settings-dropdown');
  const settingsBtn = document.getElementById('global-settings-btn');
  if (settingsMenu && !settingsMenu.classList.contains('hidden')) {
    if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
      settingsMenu.classList.add('hidden');
    }
  }

  const mobNav = document.getElementById('mobileNav');
  const mobBtn = document.querySelector('.mobile-menu-btn');
  if (mobNav && mobNav.classList.contains('open')) {
    if (!mobNav.contains(e.target) && (!mobBtn || !mobBtn.contains(e.target))) {
      mobNav.classList.remove('open');
    }
  }
});

function initLoader() {
  if (!document.getElementById('global-loader')) {
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.innerHTML = `
      <img src="img/loading.gif" alt="Loading..." class="litstats-loader-gif">
      <span id="global-loader-text">Loading...</span>
    `;
    document.body.appendChild(loader);
  }
}

window.showLoader = (text = 'Loading...') => {
  initLoader();
  const el = document.getElementById('global-loader');
  const label = document.getElementById('global-loader-text');
  if (label) label.textContent = text;
  if (el) el.classList.add('active');
};

window.hideLoader = () => {
  const el = document.getElementById('global-loader');
  if (el) el.classList.remove('active');
};

window.toggleTheme = function() {
  const current = localStorage.getItem('litstats_theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  if (typeof applyTheme === 'function') {
    applyTheme(next);
  } else {
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('litstats_theme', next);
  }
  const themeSelect = document.getElementById('theme-selector');
  if (themeSelect) themeSelect.value = next;
  updateThemeToggleIcon(next);
};

window.applyTheme = function(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('litstats_theme', themeName);
  updateThemeToggleIcon(themeName);
};

window.initTheme = function() {
  const saved = localStorage.getItem('litstats_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeToggleIcon(saved);
};

function updateThemeToggleIcon(themeName) {
  const btn = document.getElementById('themeBtn');
  if (btn) {
    btn.innerHTML = (themeName === 'light' || themeName === 'cherry') ? moonIcon : sunIcon;
  }
}

window.setupControls = function() {
  if (typeof initTheme === 'function') initTheme();

  const themeSelect = document.getElementById('theme-selector');
  if (themeSelect) {
    themeSelect.value = localStorage.getItem('litstats_theme') || 'dark';
    themeSelect.onchange = (e) => {
      if (typeof applyTheme === 'function') applyTheme(e.target.value);
    };
  }

  const a11ySelect = document.getElementById('a11y-palette-select');
  const savedA11y = localStorage.getItem('site-a11y') || 'default';
  if (savedA11y !== 'default') {
    document.documentElement.setAttribute('data-a11y', savedA11y);
  }
  if (a11ySelect) {
    a11ySelect.value = savedA11y;
    a11ySelect.onchange = (e) => {
      const val = e.target.value;
      if (val === 'default') {
        document.documentElement.removeAttribute('data-a11y');
        localStorage.removeItem('site-a11y');
      } else {
        document.documentElement.setAttribute('data-a11y', val);
        localStorage.setItem('site-a11y', val);
      }
    };
  }

  const contrastToggle = document.getElementById('a11y-contrast-toggle');
  const savedContrast = localStorage.getItem('site-a11y-contrast') === 'high';
  if (savedContrast) document.documentElement.setAttribute('data-a11y-contrast', 'high');
  if (contrastToggle) {
    contrastToggle.checked = savedContrast;
    contrastToggle.onchange = (e) => {
      if (e.target.checked) {
        document.documentElement.setAttribute('data-a11y-contrast', 'high');
        localStorage.setItem('site-a11y-contrast', 'high');
      } else {
        document.documentElement.removeAttribute('data-a11y-contrast');
        localStorage.removeItem('site-a11y-contrast');
      }
    };
  }

  const fontSelect = document.getElementById('global-font-mode');
  const savedFont = localStorage.getItem('litstats_font_mode') || 'default';
  if (savedFont !== 'default') document.documentElement.setAttribute('data-font', savedFont);
  if (fontSelect) {
    fontSelect.value = savedFont;
    fontSelect.onchange = (e) => {
      const val = e.target.value;
      if (val === 'default') {
        document.documentElement.removeAttribute('data-font');
        localStorage.removeItem('litstats_font_mode');
      } else {
        document.documentElement.setAttribute('data-font', val);
        localStorage.setItem('litstats_font_mode', val);
      }
    };
  }

  const goldToggle = document.getElementById('global-gold-toggle');
  if (goldToggle) {
    goldToggle.checked = localStorage.getItem('litstats_gold_ap') === 'true';
    goldToggle.onchange = (e) => {
      localStorage.setItem('litstats_gold_ap', e.target.checked ? 'true' : 'false');
      if (typeof renderDashboard === 'function') renderDashboard();
    };
  }

  const iconModeSelect = document.getElementById('global-icon-mode');
  if (iconModeSelect) {
    iconModeSelect.value = localStorage.getItem('litstats_icon_mode') || 'theme';
    iconModeSelect.onchange = (e) => {
      localStorage.setItem('litstats_icon_mode', e.target.value);
      if (typeof populateFilters === 'function') populateFilters();
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof renderCabinet === 'function' && typeof globalPlayerData !== 'undefined' && globalPlayerData) {
        renderCabinet(globalPlayerData, true);
      }
    };
  }

  if (typeof initBanner === 'function') initBanner();
};

function injectLayout() {
  if (!document.querySelector('.site-header')) {
    document.body.insertAdjacentHTML('afterbegin', litHeader);
  }
  if (!document.querySelector('.site-footer')) {
    document.body.insertAdjacentHTML('beforeend', litFooter);
  }
  initLoader();
  window.setupControls();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectLayout);
} else {
  injectLayout();
}
