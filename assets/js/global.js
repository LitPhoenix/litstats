function initTheme() {
  const themeBtn = document.getElementById('themeBtn');
  const savedTheme = localStorage.getItem('litstats_theme');

  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    document.body.removeAttribute('data-theme');
    if (themeBtn) themeBtn.textContent = '🌙'; 
  } else {
    document.body.classList.remove('light-theme');
    document.body.setAttribute('data-theme', 'dark');
    if (themeBtn) themeBtn.textContent = '☀️'; 
    localStorage.setItem('litstats_theme', 'dark');
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  const themeBtn = document.getElementById('themeBtn');
  
  if (isLight) {
    document.body.classList.remove('light-theme');
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('litstats_theme', 'dark');
    if (themeBtn) themeBtn.textContent = '☀️';
  } else {
    document.body.classList.add('light-theme');
    document.body.removeAttribute('data-theme');
    localStorage.setItem('litstats_theme', 'light');
    if (themeBtn) themeBtn.textContent = '🌙';
  }
}

initTheme();

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

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
let konamiIndex = 0;
let konamiCooldown = false;

document.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

  // NEW: ESCAPE KEY LOGIC
  if (e.key === 'Escape') {
    const searchBox = document.getElementById('searchInput');
    if (searchBox) {
      searchBox.blur(); 
      if (typeof runLocalSearch === "function") runLocalSearch('');
    }
    return;
  }

  if (!isTyping) {
    if (e.key === '1') { const p = document.querySelector('[data-tab="players"]'); if(p) p.click(); return; }
    if (e.key === '2') { const c = document.querySelector('[data-tab="countries"]'); if(c) c.click(); return; }
    if (e.key === '/') {
      e.preventDefault(); 
      const searchBox = document.getElementById('searchInput');
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
      event.preventDefault(); // Blocks the browser from wiping the text
      this.blur();            // Drops the focus ring
    }
  });
}

// --- BANNER DATA ---
const mainBanner = {
  text: "🔥 Huge Update: The Quest Leaderboard is now live!",
  btnText: "Check it out",
  btnLink: "quest.html"
};

const emergencyBanner = {
  text: "⚠️ Hypixel API is currently experiencing troubles.",
  btnText: "",
  btnLink: ""
};

const randomBanners = [
  { text: "Did you know? LitStats tracks over 20 different Hypixel games.", btnText: "", btnLink: "" },
  { text: "Found a bug or have an idea? Let me know.", btnText: "My Profile", btnLink: "https://namemc.com/profile/litphoenix.1" }
];

// Toggle: 'main', 'emergency', 'random', or 'off'
let bannerMode = 'emergency'; 

// Increment this string (e.g., 'v2', 'v3') to force the banner to reappear for users who closed an older one
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

  document.getElementById('banner-text').textContent = data.text;
  const btn = document.getElementById('banner-link');
  
  if (data.btnText && data.btnLink) {
    btn.textContent = data.btnText;
    btn.href = data.btnLink;
    btn.classList.remove('hidden');
  } else {
    btn.classList.add('hidden');
  }

  banner.classList.remove('hidden');
}

function closeBanner() {
  document.getElementById('lit-banner').classList.add('hidden');
  localStorage.setItem(`litBannerClosed_${bannerVersion}`, 'true');
}

document.addEventListener('DOMContentLoaded', initBanner);
