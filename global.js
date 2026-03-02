// --- Theme System ---
function loadTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  if(saved === 'dark') document.body.setAttribute('data-theme', 'dark');
  else document.body.removeAttribute('data-theme');
  
  const btn = document.getElementById('themeBtn');
  if(btn) btn.textContent = saved === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  
  if (next === 'light') document.body.removeAttribute('data-theme');
  else document.body.setAttribute('data-theme', 'dark');
  
  localStorage.setItem('theme', next);
  const btn = document.getElementById('themeBtn');
  if(btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
}

// --- Audio & Easter Egg System ---
let audioCtx; // Kept undefined until a key is pressed to prevent browser blocking

function playTone(freq, type) {
  // Lazy-load the audio context on the first keypress
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // 5% volume
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
  const searchInput = document.getElementById('searchInput');
  const isTypingInSearch = document.activeElement === searchInput;
  const isTypingAnywhereElse = document.activeElement && document.activeElement.tagName === 'INPUT' && !isTypingInSearch;

  // Ignore if typing in an editor input box
  if (isTypingAnywhereElse) return;

  // 1. Standard Shortcuts (Only trigger if NOT in the search bar)
  if (!isTypingInSearch) {
    if (e.key === '1') { const p = document.querySelector('[data-tab="players"]'); if(p) p.click(); return; }
    if (e.key === '2') { const c = document.querySelector('[data-tab="countries"]'); if(c) c.click(); return; }
    if (e.key === '/') {
      e.preventDefault(); 
      if(searchInput) searchInput.focus();
      return;
    }
  }

  // 2. Konami Logic (Only works while focused in the search bar)
  if (isTypingInSearch) {
    // Check against the sequence (handling case sensitivity for letters)
    if (e.key.toLowerCase() === konamiCode[konamiIndex].toLowerCase() || e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      
      // Try/Catch prevents any weird audio hardware errors from breaking the code
      try { playTone(800 + (konamiIndex * 50), 'sine'); } catch(err) {}
      
      // Stop the cursor from moving around the input box while using arrows
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); 
      }

      if (konamiIndex === konamiCode.length) {
        window.location.href = 'trophy.html'; // Surprise destination
      }
    } else {
      if (konamiIndex > 0) {
        try { playTone(200, 'sawtooth'); } catch(err) {}
      }
      konamiIndex = 0; 
      
      // Allow immediate restart if they hit Up Arrow right after a mistake
      if (e.key === 'ArrowUp') {
        konamiIndex = 1;
        try { playTone(850, 'sine'); } catch(err) {}
        e.preventDefault();
      }
    }
  }
});

// Boot theme on load
document.addEventListener('DOMContentLoaded', loadTheme);
