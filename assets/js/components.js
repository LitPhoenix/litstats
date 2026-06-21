const sunIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
const moonIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

const litHeader = `
  <header class="site-header">
    <div class="header-inner">
      <a class="logo" href="index.html">
        <img src="img/lq-favicon.png" alt="LitStats" style="width: 32px; height: 32px; border-radius: 8px;">
        <div><div class="logo-text">LitStats</div></div>
      </a>
      <nav class="nav-links desktop-nav">
        <a href="index.html" class="nav-btn">Player Lookup</a>
        <a href="leaderboard.html" class="nav-btn">AP Leaderboard</a>
        <a href="quest.html" class="nav-btn">Quest Leaderboard</a>
        <a href="blitz.html" class="nav-btn">Blitz Kits</a>
        <a href="angel.html" class="nav-btn">Angel's Descent</a>
      </nav>
      <div class="header-controls">
        <button class="mobile-menu-btn" onclick="document.getElementById('mobileNav').classList.toggle('open')">☰</button>
        <button class="theme-toggle" id="themeBtn" aria-label="Toggle Theme" onclick="toggleTheme()"></button>
      </div>
    </div>
  </header>
  <nav class="mobile-nav" id="mobileNav">
    <a href="index.html" class="nav-btn">Player Lookup</a>
    <a href="leaderboard.html" class="nav-btn">AP Leaderboard</a>
    <a href="quest.html" class="nav-btn">Quest Leaderboard</a>
    <a href="blitz.html" class="nav-btn">Blitz Kits</a>
    <a href="angel.html" class="nav-btn">Angel's Descent</a>
  </nav>
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
        <a href="leaderboard.html" class="nav-btn">Achievements</a>
        <a href="quest.html" class="nav-btn">Quests</a>
        <a href="blitz.html" class="nav-btn">Blitz Kits</a>
        <a href="angel.html" class="nav-btn">Angel's Descent</a>
      </div>
      <div class="footer-copyright">
        &copy; 2026 LitPhoenix. All rights reserved.
      </div>
    </div>
  </footer>
`;

document.write(litHeader);

document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('beforeend', litFooter);
});
