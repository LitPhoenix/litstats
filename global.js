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
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playTone(freq, type) {
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

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a', 'Enter'];
let konamiIndex = 0;

document.addEventListener('keydown', (e) => {
  // Only intercept normal shortcuts if not typing in an input
  const isTyping = document.activeElement && document.activeElement.tagName === 'INPUT';
  
  if (!isTyping) {
    if (e.key === '1') { const p = document.querySelector('[data-tab="players"]'); if(p) p.click(); return; }
    if (e.key === '2') { const c = document.querySelector('[data-tab="countries"]'); if(c) c.click(); return; }
    if (e.key === '/') {
      e.preventDefault(); 
      const s = document.getElementById('searchInput');
      if(s) s.focus();
      return;
    }
  }

  // --- Konami Logic (Only works while focused in the search bar to protect normal scrolling) ---
  if (isTyping && document.activeElement.id === 'searchInput') {
    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      playTone(800 + (konamiIndex * 50), 'sine'); 
      e.preventDefault(); // Stop the cursor moving in the input box
      
      if (konamiIndex === konamiCode.length) {
        window.location.href = 'control_centre.html';
      }
    } else {
      if (konamiIndex > 0) playTone(200, 'sawtooth'); 
      konamiIndex = 0; 
      
      if (e.key === 'ArrowUp') {
        konamiIndex = 1;
        playTone(850, 'sine');
        e.preventDefault();
      }
    }
  }
});

// Boot the theme globally
loadTheme();
