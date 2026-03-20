const litHeader = `
  <header>
    <div class="header-inner">
      <a class="logo" href="index.html">
        <img src="img/lq-favicon.png" alt="LitStats" style="width: 32px; height: 32px; border-radius: 8px;">
        <div><div class="logo-text">LitStats</div></div>
      </a>
      <nav class="nav-links desktop-nav">
        <a href="index.html" class="nav-btn">Player Lookup</a>
        <a href="leaderboard.html" class="nav-btn">AP Leaderboard</a>
        <a href="quest.html" class="nav-btn">Quest Leaderboard</a>
      </nav>
      <div class="header-controls">
        <button class="mobile-menu-btn" onclick="document.getElementById('mobileNav').classList.toggle('open')">☰</button>
        <button class="theme-toggle" id="themeBtn" aria-label="Toggle Theme" onclick="toggleTheme()">☀️</button>
      </div>
    </div>
  </header>
  <nav class="mobile-nav" id="mobileNav">
    <a href="index.html" class="nav-btn">Player Lookup</a>
    <a href="leaderboard.html" class="nav-btn">AP Leaderboard</a>
    <a href="quest.html" class="nav-btn">Quest Leaderboard</a>
  </nav>
`;

document.write(litHeader);
