// --- THEME TOGGLE LOGIC ---

function initTheme() {
  const themeBtn = document.getElementById('themeBtn');
  if (!themeBtn) return;

  // 1. Check if they have a saved preference from a previous visit
  const savedTheme = localStorage.getItem('litstats_theme');

  // 2. If no saved preference, FORCE dark mode by default
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeBtn.textContent = '🌙'; 
  } else {
    document.body.classList.remove('light-theme');
    themeBtn.textContent = '☀️'; 
    localStorage.setItem('litstats_theme', 'dark'); // Lock in dark mode
  }
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-theme');
  const themeBtn = document.getElementById('themeBtn');
  
  if (isLight) {
    localStorage.setItem('litstats_theme', 'light');
    if (themeBtn) themeBtn.textContent = '🌙';
  } else {
    localStorage.setItem('litstats_theme', 'dark');
    if (themeBtn) themeBtn.textContent = '☀️';
  }
}

// Run immediately on load
initTheme();


// --- Audio System ---
let audioCtx; 

// Modern browsers block audio until the user clicks on the page. 
// This invisible listener safely unlocks the audio context in the background on the first click.
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
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // 10% volume
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (err) {
    // Fails silently if the browser strictly blocks it, preventing crashes
  }
}


// --- Global Keyboard Shortcuts & Easter Egg ---
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
let konamiIndex = 0;
let konamiCooldown = false;

document.addEventListener('keydown', (e) => {
  // Check if user is actively typing in a search bar or editor
  const activeTag = document.activeElement ? document.activeElement.tagName : '';
  const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

  // 1. Standard Shortcuts
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

  // 2. Easter Egg Logic (Tracks globally, disabled whilst typing or on cooldown)
  if (!isTyping && !konamiCooldown) {
    
    // Convert both to lowercase to prevent Caps Lock or Shift from breaking 'a' and 'b'
    const key = e.key.toLowerCase();
    const expectedKey = konamiCode[konamiIndex].toLowerCase();

    if (key === expectedKey) {
      konamiIndex++;
      playTone(800 + (konamiIndex * 50), 'sine'); // Pitch raises per correct key
      
      // Prevent the page from scrolling wildly while the user inputs the code.
      // The very first ArrowUp is ignored so normal users can still scroll up.
      if (konamiIndex > 1 && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault(); 
      }

      // Success
      if (konamiIndex === konamiCode.length) {
        konamiIndex = 0;
        window.location.href = 'blitz.html'; 
      }
      
    } else {
      // Failure (Only triggers if they were actively in the middle of a sequence)
      if (konamiIndex > 0) {
        playTone(200, 'sawtooth'); // Error Buzz
        
        // 3 Second Penalty Lock
        konamiIndex = 0;
        konamiCooldown = true;
        setTimeout(() => { konamiCooldown = false; }, 3000);
      }
    }
  }
});

// Boot theme on load
document.addEventListener('DOMContentLoaded', loadTheme);
