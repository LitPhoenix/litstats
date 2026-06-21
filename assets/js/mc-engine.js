const MCEngine = {
    API_BASE: "https://api.minecraftitems.xyz/api/item/",
    API_KEY: "mcapi_5cb1f0643162ea2f7b0aa174d27061cdfa1f35c318532b602a9bf86045063ff9",
    BLOCK_IDS: new Set(['chest','tnt','cactus','wither_skeleton_skull','grass','minecart','chest_minecart','rail','powered_rail','redstone_torch']),
    viewers: {},

    getApiFallback(it) {
        return `${this.API_BASE}${it.id}?apiKey=${this.API_KEY}&size=4&glint=false`;
    },

    makeSlotHtml(it, imgUrl, emptyType = null) {
        if (!it || (!it.id && !it.customImg)) {
            if (emptyType) {
                const capType = emptyType.charAt(0).toUpperCase() + emptyType.slice(1);
                const emptyUrl = `img/blitz/Empty_Armor_Slot_${capType}.png`;
                return `<div class="slot"><div class="item-wrapper"><img src="${emptyUrl}" style="opacity:0.3; width:100%; height:100%; object-fit:contain; pointer-events:none;" alt="Empty ${capType}"></div></div>`;
            }
            return `<div class="slot"></div>`;
        }
        
        const fallbackUrl = this.getApiFallback(it);
        const isBlock = this.BLOCK_IDS.has(it.id);
        
        const wrap = it.enchanted ? 'item-wrapper enchanted' : 'item-wrapper';
        const mask = (!isBlock && it.enchanted) ? `style="--mask-img:url('${imgUrl}')"` : '';
        const td = JSON.stringify(it).replace(/"/g,'&quot;');
        
        let html = `<div class="slot" data-item="${td}">`;
        html += `<div class="${wrap}" ${mask}>`;
        
        const onErrorScript = `if(this.getAttribute('data-failed')){this.style.opacity='0';const w=this.closest('.item-wrapper');if(w)w.style.setProperty('--mask-img','none');}else{this.setAttribute('data-failed','true');this.src='${fallbackUrl}';}`;
        html += `<img src="${imgUrl}" alt="item" onerror="${onErrorScript}">`;
        
        html += `</div>`;
        
        if (it.durability !== undefined) {
            const color = it.durability > 50 ? '#55ff55' : (it.durability > 20 ? '#ffff55' : '#ff0000');
            html += `<div class="durability-bar" style="width:90%; height:4px; background:#000; position:absolute; bottom:2px; border:2px solid #000; border-top:none; border-radius:2px; overflow:hidden; border-left:none; border-right:none;">
                        <div style="width:${it.durability}%; height:100%; background:${color};"></div>
                    </div>`;
        }
        
        if (it.stack && it.stack > 1) html += `<span class="count">${it.stack}</span>`;
        html += `</div>`;
        return html;
    },

    setZoom() {
        const base = 500;
        const zoom = Math.min(Math.max(window.innerWidth / base, 0.5), 1.5);
        document.querySelectorAll('.mc-scale-engine, .mc-tooltip, .blitz-settings').forEach(el => {
            if(el) el.style.zoom = zoom;
        });
        window._uiZoom = zoom; 
    },

    initTooltip() {
        if (!document.getElementById('tooltip')) {
            const tt = document.createElement('div');
            tt.id = 'tooltip';
            tt.className = 'mc-tooltip';
            document.body.appendChild(tt);
        }
        
        const tooltip = document.getElementById('tooltip');
        
        document.addEventListener('mouseover', e => {
            const s = e.target.closest('.slot');
            if (!s) return;
            const d = s.getAttribute('data-item');
            if (!d) return;
            
            const event = new CustomEvent('tt-format', { detail: { item: JSON.parse(d), html: '' }});
            document.dispatchEvent(event);
            
            tooltip.innerHTML = event.detail.html;
            tooltip.classList.add('show');
        });

        document.addEventListener('mousemove', e => {
            if (!tooltip.classList.contains('show')) return;
            const z = window._uiZoom || 1;
            const p = 15;
            const tw = tooltip.offsetWidth * z;
            const th = tooltip.offsetHeight * z;
            let x = e.clientX + p;
            let y = e.clientY + p;
            if (x + tw > window.innerWidth)  x = e.clientX - tw - p;
            if (y + th > window.innerHeight) y = e.clientY - th - p;
            tooltip.style.left = (x / z) + 'px';
            tooltip.style.top  = (y / z) + 'px';
        });

        document.addEventListener('mouseout', e => {
            if(e.target.closest('.slot')) tooltip.classList.remove('show');
        });
    },

    initPlayerCanvas(canvasId, boxId) {
        const c = document.getElementById(canvasId);
        if (!c || this.viewers[canvasId]) return;
        
        const isMain = canvasId === 'player-canvas-main';
        
        // Strictly hardcoded base dimensions so they NEVER rely on DOM rendering
        const sizeX = isMain ? 100 : 112;
        const sizeY = isMain ? 160 : 144;
        
        try {
            const viewer = new skinview3d.SkinViewer({
                canvas: c, width: sizeX, height: sizeY, skin: 'img/skin.png',
                enableControls: false, devicePixelRatio: window.devicePixelRatio 
            });
            
            // ==========================================================
            // 3D SKIN CUSTOMIZATION GUIDE
            // ==========================================================
            // To make the skin LARGER or SMALLER, change the `viewer.zoom` value below.
            //   - isMain controls the Main Menu box. (E.g. 1.3 to zoom way in)
            //   - !isMain controls the Specific Kit Info box.
            //
            // To move the skin UP or DOWN, change `viewer.playerObject.position.y`.
            //   - A lower number (e.g., -4) moves the model DOWN.
            //   - A higher number (e.g., 0) moves the model UP.
            // ==========================================================
            viewer.zoom = isMain ? 0.9 : 0.85; 
            viewer.playerObject.position.y = isMain ? 1.6 : -2;
            
            viewer.autoRotate = false;
            this.viewers[canvasId] = viewer;
            
            const cachedName = localStorage.getItem('blitz_skin_username');
            if (cachedName) viewer.loadSkin(`https://minotar.net/skin/${cachedName}`);

            const box = document.getElementById(boxId);
            if (box) {
                document.addEventListener('mousemove', e => {
                    if(!viewer || !viewer.playerObject || box.offsetWidth === 0) return;
                    const cb = box.getBoundingClientRect();
                    
                    let mouseX = (e.clientX - (cb.left + cb.width/2)) / (window.innerWidth/2);
                    let mouseY = (e.clientY - (cb.top + cb.height/2)) / (window.innerHeight/2);
                    viewer.playerObject.skin.head.rotation.y = Math.max(-0.5, Math.min(0.5, mouseX * 0.8));
                    viewer.playerObject.skin.head.rotation.x = mouseY * 0.5;
                    viewer.playerObject.rotation.y = Math.max(-0.5, Math.min(0.5, mouseX * 0.6));
                    viewer.playerObject.rotation.x = mouseY * 0.15; 
                });
            }

        } catch(err) {
            console.error('3D Skin Viewer failed to load:', err);
        }
    }
};

window.addEventListener('resize', () => MCEngine.setZoom());
document.addEventListener('DOMContentLoaded', () => {
    MCEngine.initTooltip();
    MCEngine.setZoom();
});
