const litstatsCredits = [
  { name: "Respawnless, Melongan, valericious", role: "Country Data" },
  { name: "Brooke", role: "Life Advice" },
  { name: "Stuffy", role: "Maxed Games Logic" },
  { name: "Mo", role: "Life Advice & Icon Design" },
  { name: "C4PS", role: "Promo" },
  { name: "tobias49", role: "Maxed Game on Click Idea" },
  { name: "Unsplash", role: "Background Textures" },
  { name: "Minotar & Vzge", role: "Avatar Rendering APIs" },
  { name: "Nadeshiko", role: "Data Archiving" },
  { name: "PlayerDB", role: "UUID Resolution" },
  { name: "Vercel", role: "Backend Deployment" }
];

function initCredits() {
  const target = document.getElementById("credits-hover");
  if (!target) return;

  // Prevent duplicate injection if script runs twice
  if (target.querySelector('.credits-tooltip')) return;

  const tooltip = document.createElement("div");
  tooltip.className = "credits-tooltip";
  
  let html = `<h4 style="color:var(--accent); margin-bottom: 8px; font-weight:700; font-size: 13px;">LitStats Credits</h4><ul style="list-style:none; margin:0; padding:0; font-size:11px; color:var(--text-2); display:flex; flex-direction:column; gap:6px;">`;
  
  litstatsCredits.forEach(c => {
    // Replaced the HTML entity with a standard hyphen to fix the tooltip display
    html += `<li><strong style="color:var(--text);">${c.name}</strong> - ${c.role}</li>`;
  });
  
  html += `</ul>`;
  
  tooltip.innerHTML = html;
  
  // Attach tooltip inside the <a> tag for flawless hover triggering
  target.appendChild(tooltip);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCredits);
} else {
  initCredits();
}
