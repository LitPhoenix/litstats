class LitTour {
  constructor(tourId, steps = []) {
    this.tourId = tourId;
    this.steps = steps;
    this.currentStep = 0;
    this.active = false;
    this.svgOverlay = null;
    this.maskPath = null;
    this.spotBorder = null;
    this.box = null;
    this._handleKey = this._handleKey.bind(this);
    this._handleResize = this._handleResize.bind(this);
    this._handleScroll = this._handleScroll.bind(this);
  }

  start(force = false) {
    if (!force && localStorage.getItem(`littour_${this.tourId}`) === 'completed') {
      return;
    }
    if (!this.steps || this.steps.length === 0) return;

    this.active = true;
    this.currentStep = 0;
    this._createDOM();
    this._renderStep();

    window.addEventListener('keydown', this._handleKey);
    window.addEventListener('resize', this._handleResize);
    window.addEventListener('scroll', this._handleScroll, { passive: true });
  }

  _createDOM() {
    this._cleanupDOM();

    // SVG Mask Overlay (zero DOM style mutations on target elements)
    this.svgOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svgOverlay.setAttribute('class', 'lit-tour-mask');
    this.svgOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99990;
      pointer-events: auto;
      cursor: pointer;
    `;
    this.svgOverlay.onclick = () => this.finish();

    this.maskPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.maskPath.setAttribute('fill', 'rgba(0, 0, 0, 0.45)');
    this.maskPath.setAttribute('fill-rule', 'evenodd');
    this.svgOverlay.appendChild(this.maskPath);

    // Spotlight Outline
    this.spotBorder = document.createElement('div');
    this.spotBorder.className = 'lit-tour-spotlight-border';
    this.spotBorder.style.cssText = `
      position: fixed;
      z-index: 99995;
      border-radius: 8px;
      border: 2px solid var(--accent, #f95716);
      box-shadow: 0 0 14px rgba(249, 87, 22, 0.4);
      pointer-events: none;
      transition: top 0.2s cubic-bezier(0.2, 0.8, 0.2, 1),
                  left 0.2s cubic-bezier(0.2, 0.8, 0.2, 1),
                  width 0.2s cubic-bezier(0.2, 0.8, 0.2, 1),
                  height 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
      box-sizing: border-box;
    `;

    // Tour Dialog Box
    this.box = document.createElement('div');
    this.box.className = 'lit-tour-box';
    this.box.style.cssText = `
      position: fixed;
      z-index: 99999;
      background: var(--surface, rgba(28, 28, 34, 0.95));
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid var(--border-strong, rgba(255, 255, 255, 0.15));
      border-top: 1px solid var(--glass-edge, rgba(255, 255, 255, 0.25));
      border-radius: 12px;
      padding: 16px 18px;
      width: 310px;
      max-width: calc(100vw - 32px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
      color: var(--text, #ffffff);
      font-family: 'DM Sans', sans-serif;
      box-sizing: border-box;
      cursor: default;
      transition: top 0.2s cubic-bezier(0.2, 0.8, 0.2, 1),
                  left 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    `;
    this.box.onclick = (e) => e.stopPropagation();

    document.body.appendChild(this.svgOverlay);
    document.body.appendChild(this.spotBorder);
    document.body.appendChild(this.box);
  }

  _renderStep() {
    const step = this.steps[this.currentStep];
    if (!step) {
      this.finish();
      return;
    }

    if (typeof step.onShow === 'function') {
      step.onShow();
    }

    let targetEl = document.querySelector(step.target);
    if (!targetEl && step.fallbackTarget) {
      targetEl = document.querySelector(step.fallbackTarget);
    }

    const pad = step.pad !== undefined ? step.pad : 6;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (targetEl && targetEl.offsetParent !== null) {
      const rect = targetEl.getBoundingClientRect();
      const x = Math.max(0, rect.left - pad);
      const y = Math.max(0, rect.top - pad);
      const w = Math.min(vw, rect.width + pad * 2);
      const h = Math.min(vh, rect.height + pad * 2);
      const r = 8;

      // SVG Cutout definition
      this.maskPath.setAttribute('d', `
        M 0,0 L ${vw},0 L ${vw},${vh} L 0,${vh} Z
        M ${x + r},${y}
        H ${x + w - r}
        A ${r},${r} 0 0 1 ${x + w},${y + r}
        V ${y + h - r}
        A ${r},${r} 0 0 1 ${x + w - r},${y + h}
        H ${x + r}
        A ${r},${r} 0 0 1 ${x},${y + h - r}
        V ${y + r}
        A ${r},${r} 0 0 1 ${x + r},${y} Z
      `);

      this.spotBorder.style.display = 'block';
      this.spotBorder.style.top = `${Math.round(y)}px`;
      this.spotBorder.style.left = `${Math.round(x)}px`;
      this.spotBorder.style.width = `${Math.round(w)}px`;
      this.spotBorder.style.height = `${Math.round(h)}px`;

      let top = rect.bottom + 12;
      let left = rect.left;

      if (step.position === 'right') {
        top = rect.top;
        left = rect.right + 14;
      } else if (step.position === 'left') {
        top = rect.top;
        left = rect.left - 324;
      } else if (step.position === 'top') {
        top = rect.top - 150;
        left = rect.left;
      }

      if (left + 310 > vw - 16) left = vw - 326;
      if (left < 16) left = 16;
      if (top + 150 > vh - 16) top = Math.max(16, rect.top - 150);
      if (top < 16) top = 16;

      this.box.style.transform = 'none';
      this.box.style.top = `${Math.round(top)}px`;
      this.box.style.left = `${Math.round(left)}px`;
    } else {
      this.maskPath.setAttribute('d', `M 0,0 L ${vw},0 L ${vw},${vh} L 0,${vh} Z`);
      this.spotBorder.style.display = 'none';
      this.box.style.top = '50%';
      this.box.style.left = '50%';
      this.box.style.transform = 'translate(-50%, -50%)';
    }

    const isLast = this.currentStep === this.steps.length - 1;

    this.box.innerHTML = `
      <div style="font-weight: 700; font-size: 14.5px; margin-bottom: 6px; color: var(--accent, #f95716);">
        ${step.title}
      </div>
      <div style="font-size: 12.5px; line-height: 1.4; color: var(--text-2, #b5b5b5); margin-bottom: 14px;">
        ${step.desc}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; font-weight: 600; color: var(--text-3, #7a7a7a);">${this.currentStep + 1} of ${this.steps.length}</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button id="lit-tour-skip" style="background: none; border: none; color: var(--text-3, #888); cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 6px; font-family: inherit;">Skip</button>
          <button id="lit-tour-next" style="background: var(--accent, #f95716); border: none; border-radius: 6px; color: #fff; font-weight: 700; cursor: pointer; font-size: 12px; padding: 5px 12px; font-family: inherit;">
            ${isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    `;

    document.getElementById('lit-tour-skip').onclick = () => this.skip();
    document.getElementById('lit-tour-next').onclick = () => this.next();
  }

  next() {
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.finish();
    } else {
      this._renderStep();
    }
  }

  skip() {
    this.finish();
  }

  finish() {
    this.active = false;
    localStorage.setItem(`littour_${this.tourId}`, 'completed');
    this._cleanupDOM();
    window.removeEventListener('keydown', this._handleKey);
    window.removeEventListener('resize', this._handleResize);
    window.removeEventListener('scroll', this._handleScroll);
  }

  _cleanupDOM() {
    if (this.svgOverlay) this.svgOverlay.remove();
    if (this.spotBorder) this.spotBorder.remove();
    if (this.box) this.box.remove();
    this.svgOverlay = null;
    this.spotBorder = null;
    this.box = null;
  }

  _handleKey(e) {
    if (e.key === 'Escape') this.skip();
    if (e.key === 'ArrowRight' || e.key === 'Enter') this.next();
  }

  _handleResize() {
    if (this.active) this._renderStep();
  }

  _handleScroll() {
    if (this.active) this._renderStep();
  }
}