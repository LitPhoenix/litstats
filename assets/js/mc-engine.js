const MCEngine = {
    API_BASE: "https://api.minecraftitems.xyz/api/item/",
    API_KEY: "mcapi_5cb1f0643162ea2f7b0aa174d27061cdfa1f35c318532b602a9bf86045063ff9",
    BLOCK_IDS: new Set(['chest','tnt','cactus','wither_skeleton_skull','grass','minecart','chest_minecart','rail','powered_rail','redstone_torch']),
    viewers: {},
    _tooltip: null,
    _ttWidth: 0,
    _ttHeight: 0,
    _clientX: 0,
    _clientY: 0,
    _activeSlot: null,
    _rafId: null,

    getApiFallback(it) {
        return `${this.API_BASE}${it.id}?apiKey=${this.API_KEY}&size=4&glint=false`;
    },

    makeSlotHtml(it, imgUrl, emptyType = null) {
        if (!it || (!it.id && !it.customImg)) {
            if (emptyType) {
                const capType = emptyType.charAt(0).toUpperCase() + emptyType.slice(1);
                const emptyUrl = `img/blitz/Empty_Armor_Slot_${capType}.png`;
                return `<div class="slot"><div class="item-wrapper"><img src="${emptyUrl}" style="opacity:0.3; width:100%; height:100%; object-fit:contain;" alt="Empty ${capType}"></div></div>`;
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

    _renderTooltipPosition() {
        if (!MCEngine._activeSlot || !MCEngine._tooltip) {
            MCEngine._rafId = null;
            return;
        }

        const offset = 12;
        let left = MCEngine._clientX + offset;
        let top = MCEngine._clientY + offset;

        const maxW = window.innerWidth;
        const maxH = window.innerHeight;

        // Mobile clamp to prevent right-edge clipping
        if (left + MCEngine._ttWidth > maxW - 10) {
            left = maxW - MCEngine._ttWidth - 10;
        }
        if (left < 10) {
            left = 10;
        }

        if (top + MCEngine._ttHeight > maxH - 10) {
            top = MCEngine._clientY - MCEngine._ttHeight - offset;
        }
        if (top < 10) {
            top = 10;
        }

        MCEngine._tooltip.style.left = `${Math.round(left)}px`;
        MCEngine._tooltip.style.top = `${Math.round(top)}px`;
        MCEngine._rafId = null;
    },

    initTooltip() {
        this._tooltip = document.getElementById('tooltip');
        if (!this._tooltip) {
            this._tooltip = document.createElement('div');
            this._tooltip.id = 'tooltip';
            this._tooltip.className = 'mc-tooltip';
            document.body.appendChild(this._tooltip);
        }

        document.addEventListener('mouseover', e => {
            const slot = e.target.closest('.slot');
            if (!slot || slot === this._activeSlot) return;

            const rawData = slot.getAttribute('data-item');
            if (!rawData) {
                if (this._activeSlot) {
                    this._tooltip.classList.remove('show');
                    this._activeSlot = null;
                }
                return;
            }

            this._activeSlot = slot;
            try {
                const itemData = JSON.parse(rawData);
                const event = new CustomEvent('tt-format', { detail: { item: itemData, html: '' }});
                document.dispatchEvent(event);

                this._tooltip.innerHTML = event.detail.html;
                this._tooltip.classList.add('show');

                this._ttWidth = this._tooltip.offsetWidth;
                this._ttHeight = this._tooltip.offsetHeight;

                this._clientX = e.clientX;
                this._clientY = e.clientY;

                if (!this._rafId) {
                    this._rafId = requestAnimationFrame(this._renderTooltipPosition);
                }
            } catch (err) {}
        }, { passive: true });

        document.addEventListener('mousemove', e => {
            if (!this._activeSlot) return;
            this._clientX = e.clientX;
            this._clientY = e.clientY;

            if (!this._rafId) {
                this._rafId = requestAnimationFrame(this._renderTooltipPosition);
            }
        }, { passive: true });

        document.addEventListener('mouseout', e => {
            const related = e.relatedTarget ? e.relatedTarget.closest('.slot') : null;
            if (!related && this._activeSlot) {
                this._tooltip.classList.remove('show');
                this._activeSlot = null;
                if (this._rafId) {
                    cancelAnimationFrame(this._rafId);
                    this._rafId = null;
                }
            }
        }, { passive: true });
    },

    initPlayerCanvas(canvasId, boxId) {
        const c = document.getElementById(canvasId);
        if (!c || this.viewers[canvasId]) return;

        const isMain = canvasId === 'player-canvas-main';
        const sizeX = isMain ? 100 : 112;
        const sizeY = isMain ? 160 : 144;

        const cachedName = localStorage.getItem('blitz_skin_username') || sessionStorage.getItem('blitz_user');
        const initialSkin = cachedName ? `https://minotar.net/skin/${cachedName}` : 'img/skin.png';

        try {
            const viewer = new skinview3d.SkinViewer({
                canvas: c,
                width: sizeX,
                height: sizeY,
                skin: initialSkin,
                enableControls: false,
                devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5)
            });

            viewer.zoom = isMain ? 0.9 : 0.85;
            viewer.playerObject.position.y = isMain ? 1.6 : -2;
            viewer.autoRotate = false;
            this.viewers[canvasId] = viewer;

            const box = document.getElementById(boxId);
            if (box) {
                let skinRaf = null;
                let mouseX = 0, mouseY = 0;

                const animateHead = () => {
                    if (!viewer?.playerObject || box.offsetWidth === 0) {
                        skinRaf = null;
                        return;
                    }
                    const cb = box.getBoundingClientRect();
                    const relX = (mouseX - (cb.left + cb.width / 2)) / (window.innerWidth / 2);
                    const relY = (mouseY - (cb.top + cb.height / 2)) / (window.innerHeight / 2);

                    viewer.playerObject.skin.head.rotation.y = Math.max(-0.5, Math.min(0.5, relX * 0.8));
                    viewer.playerObject.skin.head.rotation.x = relY * 0.5;
                    viewer.playerObject.rotation.y = Math.max(-0.5, Math.min(0.5, relX * 0.6));
                    viewer.playerObject.rotation.x = relY * 0.15;
                    skinRaf = null;
                };

                document.addEventListener('mousemove', e => {
                    mouseX = e.clientX;
                    mouseY = e.clientY;
                    if (!skinRaf) {
                        skinRaf = requestAnimationFrame(animateHead);
                    }
                }, { passive: true });
            }
        } catch (err) {
            console.error('3D Skin Viewer init failed:', err);
        }
    },

    updatePlayerSkin(canvasId, usernameOrUrl) {
        const viewer = this.viewers[canvasId];
        if (!viewer) return;
        const skinUrl = usernameOrUrl.startsWith('http') ? usernameOrUrl : `https://minotar.net/skin/${usernameOrUrl}`;
        viewer.loadSkin(skinUrl);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    MCEngine.initTooltip();
});
