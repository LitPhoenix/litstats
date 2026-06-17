const MCEngine = {
    API_BASE: "https://api.minecraftitems.xyz/api/item/",
    API_KEY: "mcapi_5cb1f0643162ea2f7b0aa174d27061cdfa1f35c318532b602a9bf86045063ff9",
    BLOCK_IDS: new Set(['chest','tnt','cactus','wither_skeleton_skull','grass','minecart','chest_minecart','rail','powered_rail','redstone_torch']),
    viewer: null,

    getApiFallback(it) {
        return `${this.API_BASE}${it.id}?apiKey=${this.API_KEY}&size=4&glint=false`;
    },

    // Add this helper inside MCEngine or global scope
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
        const wrap = it.enchanted ? 'item-wrapper enchanted' : 'item-wrapper';
        const isBlock = this.BLOCK_IDS.has(it.id);
        const mask = (!isBlock && it.enchanted) ? `style="--mask-img:url('${imgUrl}')"` : '';
        const ds = JSON.stringify(it).replace(/"/g,'&quot;');
        
        const onErrorScript = `if(this.getAttribute('data-failed')){this.style.opacity='0';const w=this.closest('.item-wrapper');if(w)w.style.setProperty('--mask-img','none');}else{this.setAttribute('data-failed','true');this.src='${fallbackUrl}';}`;

    
        let html = `<div class="slot" data-item="${ds}">`;
        html += `<div class="${wrap}" ${mask}>`;
        html += `<img src="${imgUrl}" ... >`;
        html += `</div>`;
        
        // NEW: Durability Bar logic
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
            
            // Fire custom event so specific pages can format the tooltip text
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

    initPlayerCanvas(canvasId, boxId, isClassic) {
        const c = document.getElementById(canvasId);
        const box = document.getElementById(boxId);
        if (!c || !box) return;
        
        const b = box.getBoundingClientRect();
        const sizeX = b.width || (isClassic ? 112 : 140);
        const sizeY = b.height || (isClassic ? 144 : 172);
        
        if (this.viewer) {
            this.viewer.setSize(sizeX, sizeY);
            return;
        }
        
        try {
            this.viewer = new skinview3d.SkinViewer({
                canvas: c, 
                width: sizeX, 
                height: sizeY, 
                skin: 'img/skin.png',
                enableControls: false, // Disables clicking and dragging
                devicePixelRatio: window.devicePixelRatio 
            });
            
            this.viewer.zoom = 0.55; 
            this.viewer.autoRotate = false;
            
            if (!this.trackingActive) {
                // Mouse tracking
                document.addEventListener('mousemove', e => {
                    if(!this.viewer || !this.viewer.playerObject) return;
                    
                    const currentBox = document.getElementById(boxId);
                    if (!currentBox) return;

                    const cb = currentBox.getBoundingClientRect();
                    if(cb.width === 0) return; 
                    
                    const boxCenterX = cb.left + (cb.width / 2);
                    const boxCenterY = cb.top + (cb.height / 2);
                    
                    let mouseX = (e.clientX - boxCenterX) / (window.innerWidth / 2);
                    let mouseY = (e.clientY - boxCenterY) / (window.innerHeight / 2);

                    this.viewer.playerObject.skin.head.rotation.y = mouseX * 0.8;
                    this.viewer.playerObject.skin.head.rotation.x = mouseY * 0.5;
                    
                    // Increased horizontal body movement for less stiffness
                    this.viewer.playerObject.rotation.y = mouseX * 0.6;
                    this.viewer.playerObject.rotation.x = mouseY * 0.15; 
                });

                this.viewer.playerObject.position.y = -2;

                // Username input handling & Caching
                const usernameInput = document.getElementById('skin-username');
                if (usernameInput) {
                    // 1. Check cache when the viewer loads
                    const cachedName = localStorage.getItem('blitz_skin_username');
                    if (cachedName) {
                        usernameInput.value = cachedName;
                        this.viewer.loadSkin(`https://minotar.net/skin/${cachedName}`);
                    }

                    // Highlight text automatically
                    usernameInput.addEventListener('click', e => e.target.select());
                    
                    // Fetch new skin and save to cache on Enter
                    usernameInput.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            const name = e.target.value.trim();
                            if (name) {
                                localStorage.setItem('blitz_skin_username', name); // Save to cache
                                this.viewer.loadSkin(`https://minotar.net/skin/${name}`);
                            }
                            usernameInput.blur(); 
                        }
                    });
                }

                this.trackingActive = true;
            }
        } catch(err) {
            console.error('3D Skin Viewer failed to load:', err);
        }
    }
};

window.addEventListener('resize', () => MCEngine.setZoom());

document.addEventListener('DOMContentLoaded', () => {
    // Permanent comment: Tooltip needs to render before zoom so it doesn't scale the off centre
    MCEngine.initTooltip();
    MCEngine.setZoom();
});
