/* LitStats global pin: one username in localStorage, shared by every page.
 *
 *   <script src="assets/js/pin.js" data-anchor="#some-input-or-container"></script>
 *
 *   data-anchor   where to put the pin button + chip (omit if the page already has its own pin UI).
 *                 Can be the search input itself or its container.
 *   data-param    URL param the page reads the player from (default "player")
 *   data-redirect "false" = never auto-open the pinned player
 *
 * Fresh visit with no player in the URL -> redirects to ?player=<this tab's active search, else the pin>.
 * Put the tag in <head> so the redirect happens before the page renders.
 */
(function () {
  var KEY = 'litstats_pinnedPlayer';      // same key cabinet.js / questing.js already use
  var SESSION_KEY = 'active_player_session';
  var me = document.currentScript;
  var cfg = {
    anchor: (me && me.dataset.anchor) || '',
    param: (me && me.dataset.param) || 'player',
    redirect: !(me && me.dataset.redirect === 'false')
  };

  function read(store, k) { try { return store.getItem(k) || null; } catch (e) { return null; } }
  function same(a, b) { return !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase(); }
  function fire() { try { window.dispatchEvent(new Event('litpin:change')); } catch (e) {} }

  var LitPin = window.LitPin = {
    key: KEY,
    get: function () { return read(localStorage, KEY); },
    set: function (name) { try { localStorage.setItem(KEY, name); } catch (e) {} fire(); },
    clear: function () { try { localStorage.removeItem(KEY); } catch (e) {} fire(); },
    toggle: function (name) { if (same(LitPin.get(), name)) LitPin.clear(); else LitPin.set(name); },
    // who a fresh page should open: this tab's active search wins, otherwise the pin
    resolve: function () { return read(sessionStorage, SESSION_KEY) || LitPin.get(); }
  };

  // ---- auto-open ----
  if (cfg.redirect) {
    var qs = new URLSearchParams(location.search);
    if (!qs.has(cfg.param) && !qs.has('uuid') && !qs.has('name')) {
      var who = LitPin.resolve();
      if (who) {
        qs.set(cfg.param, who);
        location.replace(location.pathname + '?' + qs.toString() + location.hash);
        return;
      }
    }
  }

  // ---- pin button + chip ----
  function mount() {
    if (!cfg.anchor) return;
    var host = document.querySelector(cfg.anchor);
    if (!host) return;
    if (host.tagName === 'INPUT') host = host.parentElement;

    var style = document.createElement('style');
    style.textContent =
      '.lit-pin-btn,.lit-pin-chip{cursor:pointer;padding:8px 12px;background:var(--surface-2,rgba(255,255,255,.06));' +
      'border:1px solid var(--border,rgba(255,255,255,.12));border-radius:8px;font:600 13px/1 inherit;font-family:inherit;' +
      'color:var(--text,#fff);white-space:nowrap;transition:.2s;flex-shrink:0}' +
      '.lit-pin-btn:hover,.lit-pin-chip:hover{border-color:var(--accent,#ff5100)}' +
      '.lit-pin-btn[aria-pressed="true"]{border-color:var(--accent,#ff5100);background:var(--accent-soft,rgba(255,81,0,.15))}' +
      '.lit-pin-chip[hidden]{display:none}';
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'lit-pin-btn'; btn.textContent = '\uD83D\uDCCC';
    var chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'lit-pin-chip'; chip.hidden = true;
    host.appendChild(btn); host.appendChild(chip);

    function current() {
      var input = host.querySelector('input');
      var typed = input ? input.value.trim() : '';
      return typed || new URLSearchParams(location.search).get(cfg.param) || '';
    }
    function render() {
      var pin = LitPin.get();
      var pressed = same(current(), pin);
      btn.setAttribute('aria-pressed', pressed);
      btn.title = pressed ? 'Unpin ' + pin : 'Pin this player site-wide';
      chip.hidden = !pin;
      chip.textContent = pin ? '\uD83D\uDCCC ' + pin : '';
      chip.title = pin ? 'Open pinned player' : '';
    }
    btn.onclick = function () {
      var c = current();
      if (!c) { btn.title = 'Search a player first, then pin them'; return; }
      LitPin.toggle(c);
    };
    chip.onclick = function () {
      var pin = LitPin.get(); if (!pin) return;
      var q = new URLSearchParams(location.search); q.set(cfg.param, pin);
      location.href = location.pathname + '?' + q.toString();
    };
    host.addEventListener('input', render);
    window.addEventListener('litpin:change', render);
    window.addEventListener('storage', function (e) { if (e.key === KEY) render(); });
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();