const MCEngine = {
    API_BASE: "https://api.minecraftitems.xyz/api/item/",
    API_KEY: "mcapi_5cb1f0643162ea2f7b0aa174d27061cdfa1f35c318532b602a9bf86045063ff9",
    BLOCK_IDS: new Set(['chest','tnt','cactus','wither_skeleton_skull','grass','minecart','chest_minecart','rail','powered_rail','redstone_torch']),
    viewer: null,

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
        const wrap = it.enchanted ? 'item-wrapper enchanted' : 'item-wrapper';
        const isBlock = this.BLOCK_IDS.has(it.id);
        const mask = (!isBlock && it.enchanted) ? `style="--mask-img:url('${imgUrl}')"` : '';
        const ds = JSON.stringify(it).replace(/"/g,'&quot;');
        
        const onErrorScript = `if(this.getAttribute('data-failed')){this.style.opacity='0';const w=this.closest('.item-wrapper');if(w)w.style.setProperty('--mask-img','none');}else{this.setAttribute('data-failed','true');this.src='${fallbackUrl}';}`;

        let html = `<div class="slot" data-item="${ds}">`;
        html += `<div class="${wrap}" ${mask}>`;
        html += `<img src="${imgUrl}" alt="${it.name}" style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; image-rendering:pixelated;" onerror="${onErrorScript}">`;
        html += `</div>`;
        
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
        if (!c) return;
        
        const sizeX = isClassic ? 112 : 160;
        const sizeY = isClassic ? 150 : 220;
        
        if (this.viewer) {
            this.viewer.setSize(sizeX, sizeY);
            return;
        }
        
        try {
            this.viewer = new skinview3d.SkinViewer({canvas: c, width: sizeX, height: sizeY, skin: 'https://crafatar.com/skins/853c80ef3c3749fdaa49938b674adae6'});
            this.viewer.zoom = 0.8; 
            this.viewer.autoRotate = false;
            
            document.addEventListener('mousemove', e => {
                if(!this.viewer?.playerObject) return;
                const b = document.getElementById(boxId).getBoundingClientRect();
                // Check if box is actually visible before rotating
                if(b.width === 0) return;
                
                this.viewer.playerObject.rotation.y = ((e.clientX - b.left - b.width / 2) / window.innerWidth) * 3;
                this.viewer.playerObject.rotation.x = ((e.clientY - b.top - b.height / 2) / window.innerHeight) * 1.5;
            });
        } catch(err) {
            console.error('3D failed:', err);
        }
    }
};

window.addEventListener('resize', () => MCEngine.setZoom());
document.addEventListener('DOMContentLoaded', () => {
    // Permanent comment: Tooltip needs to render before zoom so it doesn't scale the off centre
    MCEngine.initTooltip();
    MCEngine.setZoom();
});