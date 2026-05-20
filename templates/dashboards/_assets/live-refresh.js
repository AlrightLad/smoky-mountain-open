/*
 * live-refresh.js — auto-update dashboard data without losing scroll position.
 *
 * Founder request 2026-05-16: "activity counts and all data needs to be live and
 * updating as this is working or at the very least after each commit, ship, or
 * even pause by the orchestration team so that data is as close to live at all
 * times."
 *
 * Mechanism:
 *   - Every POLL_MS ms, HEAD-fetch the current page with a cache-busting param.
 *   - Compute a small fingerprint of the inline <script id="report-data"> block.
 *   - If the fingerprint differs from the loaded copy, save scroll position +
 *     any open filters to sessionStorage and reload the page.
 *   - Restore scroll + filters on next load.
 *
 * Why reload rather than re-render in place:
 *   - The dashboard pages have rendering logic baked into a single
 *     DOMContentLoaded handler. A reload is a 200ms blink but a refactor of
 *     each page's renderer is much riskier. Reload preserves correctness.
 *
 * Visible indicator:
 *   - A small "live · Ns ago" badge bottom-right shows the operator the page
 *     is auto-refreshing. Clicking it forces an immediate refresh.
 *
 * Server-side counterpart:
 *   - .husky/post-commit regens the dashboard on every commit (commit/ship/pause).
 *   - scripts/sidecar/usage-snapshot.ps1 regens every 5 min unconditionally.
 *   - This client-side poll is the "last 30s" closer to live between those.
 */
(function () {
    'use strict';

    // 2026-05-20 iter9 (Founder 'page is randomly refreshing'): 20s poll
    // was reloading the page every time the watcher committed (every 5min)
    // OR when the user was mid-read. Now: 5min poll + ONLY show a 'new
    // data available' indicator. Reload happens ONLY when user clicks the
    // indicator. No more surprise reloads.
    var POLL_MS = 300000;  // 5min — match the regen cadence; user-triggered reload only
    var AUTO_RELOAD = false;  // require explicit click to reload
    var SCROLL_KEY = 'pb-live-scroll-' + location.pathname;
    var FILTER_KEY = 'pb-live-filters-' + location.pathname;
    var INDICATOR_ID = 'pb-live-indicator';
    var loadedFingerprint = null;
    var lastSuccessAt = Date.now();

    function getDataBlock(htmlText) {
        var m = htmlText.match(/<script\s+id="report-data"[^>]*>([\s\S]*?)<\/script>/);
        return m ? m[1].trim() : '';
    }

    function hash(s) {
        // Simple djb2 hash — good enough for change detection.
        var h = 5381;
        for (var i = 0; i < s.length; i++) {
            h = ((h << 5) + h + s.charCodeAt(i)) | 0;
        }
        return h.toString(36);
    }

    function captureFilters() {
        var out = {};
        document.querySelectorAll('select, input[type="search"], input[type="text"]').forEach(function (el) {
            if (el.id) out[el.id] = el.value;
        });
        return out;
    }

    function restoreFilters() {
        try {
            var raw = sessionStorage.getItem(FILTER_KEY);
            if (!raw) return;
            var saved = JSON.parse(raw);
            Object.keys(saved).forEach(function (id) {
                var el = document.getElementById(id);
                if (!el) return;
                el.value = saved[id];
                el.dispatchEvent(new Event('change'));
                el.dispatchEvent(new Event('input'));
            });
        } catch (e) { /* tolerate */ }
    }

    function restoreScroll() {
        try {
            var y = parseInt(sessionStorage.getItem(SCROLL_KEY) || '0', 10);
            if (y > 0) window.scrollTo(0, y);
        } catch (e) { /* tolerate */ }
    }

    function saveStateAndReload() {
        try {
            sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
            sessionStorage.setItem(FILTER_KEY, JSON.stringify(captureFilters()));
        } catch (e) { /* tolerate */ }
        location.reload();
    }

    function ensureIndicator() {
        var el = document.getElementById(INDICATOR_ID);
        if (el) return el;
        el = document.createElement('button');
        el.id = INDICATOR_ID;
        el.type = 'button';
        el.setAttribute('aria-label', 'Live data refresh status. Click to refresh now.');
        el.title = 'Live data — click to refresh now';
        el.style.cssText = [
            'position:fixed', 'right:16px', 'bottom:16px',
            'padding:6px 10px', 'border-radius:999px',
            'background:rgba(20,40,30,0.85)', 'color:var(--text-secondary, #c8d4cf)',
            'border:1px solid rgba(201,169,97,0.35)',
            'font-family:var(--font-mono, JetBrains Mono, ui-monospace, monospace)',
            'font-size:11px', 'letter-spacing:0.04em',
            'cursor:pointer', 'z-index:9999',
            'transition:background 180ms ease-out, border-color 180ms ease-out'
        ].join(';');
        el.innerHTML = '<span style="color:#4CAF50;margin-right:6px">●</span><span data-live-text>live · just now</span>';
        el.addEventListener('click', function () {
            saveStateAndReload();
        });
        document.body.appendChild(el);
        return el;
    }

    function updateIndicator() {
        var el = document.getElementById(INDICATOR_ID);
        if (!el) return;
        var txtEl = el.querySelector('[data-live-text]');
        if (!txtEl) return;
        var sec = Math.floor((Date.now() - lastSuccessAt) / 1000);
        var label;
        if (sec < 5) label = 'live · just now';
        else if (sec < 60) label = 'live · ' + sec + 's ago';
        else label = 'live · ' + Math.floor(sec / 60) + 'm ago';
        txtEl.textContent = label;
    }

    function poll() {
        var url = location.pathname + '?_live=' + Date.now();
        fetch(url, { cache: 'no-cache' }).then(function (r) {
            if (!r.ok) throw new Error('http ' + r.status);
            return r.text();
        }).then(function (html) {
            lastSuccessAt = Date.now();
            updateIndicator();
            var fp = hash(getDataBlock(html));
            if (loadedFingerprint == null) {
                loadedFingerprint = fp;
                return;
            }
            if (fp !== loadedFingerprint) {
                if (AUTO_RELOAD) {
                    saveStateAndReload();
                } else {
                    // Mark indicator as 'new data available' — user clicks to refresh
                    var el = document.getElementById(INDICATOR_ID);
                    if (el) {
                        var txtEl = el.querySelector('[data-live-text]');
                        if (txtEl) txtEl.textContent = 'new data · click to refresh';
                        el.style.borderColor = 'var(--accent-brass, #c9a961)';
                        el.style.background = 'rgba(201, 169, 97, 0.18)';
                    }
                }
            }
        }).catch(function (e) {
            // Silent — leave last-success timestamp untouched; indicator will
            // show the age growing, which is honest. Console-warn for ops.
            console.warn('[live-refresh] poll failed:', e);
        });
    }

    function start() {
        // Capture the initial fingerprint from THIS page's current data block
        // so we only reload when a DIFFERENT version arrives.
        try {
            var el = document.getElementById('report-data');
            if (el) loadedFingerprint = hash((el.textContent || '').trim());
        } catch (e) { /* tolerate */ }
        ensureIndicator();
        restoreScroll();
        restoreFilters();
        setInterval(poll, POLL_MS);
        setInterval(updateIndicator, 1000);
        // First poll runs shortly after load (not immediately — let the page
        // settle).
        setTimeout(poll, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
