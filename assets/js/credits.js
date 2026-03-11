const litstatsCredits = [
  { name: "respawnless", role: "Quest Country Data" },
  { name: "Melongan", role: "Quest Country Data (Support)" },
  { name: "Brooke", role: "Life Advice" },
  { name: "Mo", role: "Life Advice & Icon Design" },
  { name: "C4PS", role: "Promo Opportunity" },
  { name: "tobias49", role: "Maxed Game On-Click Idea" },
  { name: "valericious", role: "Country Analytics" },
  { name: "Unsplash", role: "Background Textures" },
  { name: "Minotar & Vzge", role: "Avatar Rendering APIs" },
  { name: "Nadeshiko", role: "Data Archiving" },
  { name: "PlayerDB", role: "UUID Resolution" },
  { name: "Vercel", role: "Backend Deployment" }
];

document.addEventListener("DOMContentLoaded", () => {
  const target = document.getElementById("credits-hover");
  if (!target) return;

  const tooltip = document.createElement("div");
  tooltip.className = "credits-tooltip";
  
  let html = `<h4 style="color:var(--accent); margin-bottom: 8px;">LitStats Credits</h4><ul style="list-style:none; font-size:11px; color:var(--text-2); display:flex; flex-direction:column; gap:4px;">`;
  litstatsCredits.forEach(c => {
    html += `<li><strong style="color:var(--text);">${c.name}</strong> &ndash; ${c.role}</li>`;
  });
  html += `</ul>`;
  
  tooltip.innerHTML = html;
  target.parentElement.appendChild(tooltip);
  target.parentElement.style.position = 'relative';
});
