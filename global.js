// Theme System
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

// Audio System
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
  gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); 
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}

// Global Keyboard Shortcuts & Easter Egg
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
let konamiIndex = 0;
let konamiCooldown = false;

document.addEventListener('keydown', (e) => {
  // Check if user is typing in ANY input or textarea
  const isTyping = document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);

  // 1. Standard Shortcuts (Disabled whilst typing)
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

  // 2. Konami Logic (Works globally, but disabled whilst typing or during cooldown)
  if (!isTyping && !konamiCooldown) {
    
    // Case insensitive check for 'b' and 'a'
    if (e.key.toLowerCase() === konamiCode[konamiIndex].toLowerCase() || e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      
      try { playTone(800 + (konamiIndex * 50), 'sine'); } catch(err) {}
      
      // Stop the page from scrolling, but let the very first ArrowUp scroll normally
      // so we do not break regular scrolling for users who just want to go up.
      if (konamiIndex > 1 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); 
      }

      // Success
      if (konamiIndex === konamiCode.length) {
        window.location.href = 'trophy.html'; 
      }
      
    } else {
      // Failure state (only trigger if they actually started the code)
      if (konamiIndex > 0) {
        try { playTone(200, 'sawtooth'); } catch(err) {}
        
        // Lock out the code for 3 seconds
        konamiCooldown = true;
        konamiIndex = 0;
        
        setTimeout(() => {
          konamiCooldown = false;
        }, 3000);
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', loadTheme);
