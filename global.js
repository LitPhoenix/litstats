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

// --- Audio System ---
let audioCtx; 

function playTone(freq, type) {
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

// --- Global Keyboard Shortcuts & Easter Egg ---
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
let konamiIndex = 0;
let konamiCooldown = false;

document.addEventListener('keydown', (e) => {
  const isTyping = document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

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

  // 2. Konami Logic (Tracks in background, NEVER overrides default scrolling)
  if (!isTyping && !konamiCooldown) {
    
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const expectedKey = konamiCode[konamiIndex].length === 1 ? konamiCode[konamiIndex].toLowerCase() : konamiCode[konamiIndex];

    if (key === expectedKey) {
      konamiIndex++;
      
      try { playTone(800 + (konamiIndex * 50), 'sine'); } catch(err) {}

      // Success
      if (konamiIndex === konamiCode.length) {
        konamiIndex = 0;
        window.location.href = 'trophy.html'; 
      }
      
    } else {
      // Failure (only buzz if they were actively in a sequence)
      if (konamiIndex > 0) {
        try { playTone(200, 'sawtooth'); } catch(err) {}
        
        konamiIndex = 0;
        konamiCooldown = true;
        setTimeout(() => { konamiCooldown = false; }, 3000); // 3 Second Penalty Lock
      }
      
      // If they failed but pressed Up, start the sequence over if not on cooldown
      if (key === 'ArrowUp' && !konamiCooldown) {
        konamiIndex = 1;
        try { playTone(850, 'sine'); } catch(err) {}
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', loadTheme);
