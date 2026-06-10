// ═══════════════════════════════════════════════════════════════════════════
// QUICK SEARCH — Cmd-K / Ctrl-K command palette
// ═══════════════════════════════════════════════════════════════════════════
//
// W2.S5 G2 pull-forward (2026-05-24). Linear / Vercel / Stripe pattern:
// global hotkey opens a fuzzy-search overlay over the page. Members type to
// filter — pages, members, courses surface in real time. Enter navigates;
// Esc dismisses. Arrow keys cycle results.
//
// No external library — vanilla JS string matching keeps the bundle small.
// Sources its search index from:
//   - Static page catalog (hand-maintained list of routes + labels)
//   - PB.getPlayers() (live member directory)
//   - PB.getCourses() (live course directory)
// Index rebuilds lazily when the overlay opens (cheap; <30ms for 26 members
// + 30 courses + 30 pages).

(function() {
    'use strict';

    var _qsOverlay = null;
    var _qsInput = null;
    var _qsResults = null;
    var _qsSelectedIdx = 0;
    var _qsLastResults = [];

    // Static page catalog. Each entry: { type, label, sub, route, params? }.
    // The hotkey scope is the signed-in app; auth screen + onboarding skip.
    var PAGE_CATALOG = [
        { type: 'page', label: 'Home',           sub: 'Today\'s edition',           route: 'home' },
        { type: 'page', label: 'Rounds',         sub: 'Your round history',         route: 'rounds' },
        { type: 'page', label: 'Feed',           sub: 'League activity feed',       route: 'feed' },
        { type: 'page', label: 'Leaderboard',    sub: 'Season standings',           route: 'standings' },
        { type: 'page', label: 'Members',        sub: 'League directory',           route: 'members' },
        { type: 'page', label: 'Profile',        sub: 'Your member detail',         route: 'profile' },
        { type: 'page', label: 'Trophy Room',    sub: 'Level, achievements, titles', route: 'trophyroom' },
        { type: 'page', label: 'Shop',           sub: 'Cosmetics & power-ups',      route: 'shop' },
        { type: 'page', label: 'Settings',       sub: 'Account + appearance',       route: 'settings' },
        { type: 'page', label: 'Calendar',       sub: 'Events + tee times',         route: 'calendar' },
        { type: 'page', label: 'Tee Times',      sub: 'Upcoming league tees',       route: 'teetimes' },
        { type: 'page', label: 'Play Now',       sub: 'Start a round',              route: 'playnow' },
        { type: 'page', label: 'Courses',        sub: 'Course directory',           route: 'courses' },
        { type: 'page', label: 'Wagers',         sub: 'Head-to-head bets',          route: 'wagers' },
        { type: 'page', label: 'Bounties',       sub: 'Coin bounty board',          route: 'bounties' },
        { type: 'page', label: 'Challenges',     sub: 'H2H matches',                route: 'challenges' },
        { type: 'page', label: 'Records',        sub: 'All-time records',           route: 'records' },
        { type: 'page', label: 'Aces',           sub: 'Hole-in-one wall',           route: 'aces' },
        { type: 'page', label: 'Awards',         sub: 'Season awards',              route: 'awards' },
        { type: 'page', label: 'Season Recap',   sub: 'Year-end summary',           route: 'seasonrecap' },
        { type: 'page', label: 'Range',          sub: 'Practice session timer',     route: 'range' },
        { type: 'page', label: 'Events',         sub: 'League events + trips',      route: 'trips' },
        { type: 'page', label: 'Party Games',    sub: 'Mid-round side bets',        route: 'partygames' },
        { type: 'page', label: 'Scramble Teams', sub: 'Team management',            route: 'scramble' },
        { type: 'page', label: 'Find Players',   sub: 'Discover golfers',           route: 'findplayers' },
        { type: 'page', label: 'My Leagues',     sub: 'League membership',          route: 'leagues' },
        { type: 'page', label: 'Rich List',      sub: 'Top ParCoin earners',        route: 'richlist' },
        { type: 'page', label: 'Caddy Notes',    sub: 'What\'s new + roadmap',      route: 'caddynotes' },
        { type: 'page', label: 'FAQ',            sub: 'Frequently asked',           route: 'faq' },
        { type: 'page', label: 'Rules',          sub: 'League rules',               route: 'rules' },
        { type: 'page', label: 'Merch',          sub: 'League merch shop',          route: 'merch' },
        { type: 'page', label: 'Report a Bug',   sub: 'Send a note to the Commissioner', route: 'bugreport' },
        { type: 'page', label: 'More',           sub: 'Everything else',            route: 'more' }
    ];

    function buildIndex() {
        var idx = PAGE_CATALOG.slice();
        try {
            if (typeof PB !== 'undefined' && PB.getPlayers) {
                (PB.getPlayers() || []).forEach(function(p) {
                    if (!p || !p.id) return;
                    var label = p.name || p.username || p.id;
                    var sub = p.equippedTitle || (p.founding || p.isFoundingFour ? 'Founding member' : 'Member');
                    idx.push({ type: 'member', label: label, sub: sub, route: 'members', params: { id: p.id } });
                });
            }
            if (typeof PB !== 'undefined' && PB.getCourses) {
                (PB.getCourses() || []).forEach(function(c) {
                    if (!c || !c.id) return;
                    idx.push({ type: 'course', label: c.name || 'Course', sub: c.loc || 'Course', route: 'courses', params: { id: c.id } });
                });
            }
        } catch (e) { /* index falls back to page catalog */ }
        return idx;
    }

    // Fuzzy match: case-insensitive substring + word-start bonus.
    function score(needle, hay) {
        if (!needle) return 1; // empty query matches everything
        var n = needle.toLowerCase();
        var h = (hay || '').toLowerCase();
        if (h === n) return 100;
        if (h.indexOf(n) === 0) return 80; // prefix match
        // Word-start bonus: split on whitespace + check each word's prefix
        var words = h.split(/\s+/);
        for (var i = 0; i < words.length; i++) {
            if (words[i].indexOf(n) === 0) return 60 - i * 5;
        }
        if (h.indexOf(n) >= 0) return 40 - h.indexOf(n); // substring
        return 0;
    }

    function search(query) {
        var index = buildIndex();
        var hits = [];
        var q = (query || '').trim();
        index.forEach(function(item) {
            var labelScore = score(q, item.label);
            var subScore = score(q, item.sub) * 0.5;
            var total = Math.max(labelScore, subScore);
            if (total > 0) hits.push({ item: item, score: total });
        });
        hits.sort(function(a, b) { return b.score - a.score; });
        return hits.slice(0, 8).map(function(h) { return h.item; });
    }

    function renderResults(items) {
        _qsLastResults = items;
        if (!_qsResults) return;
        if (!items.length) {
            _qsResults.innerHTML = '<div style="padding:20px 16px;font-size:12px;color:var(--cb-mute);text-align:center">No matches.</div>';
            return;
        }
        var html = '';
        items.forEach(function(it, idx) {
            var icon = it.type === 'member'
                ? '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>'
                : it.type === 'course'
                ? '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3v16"/><path d="M9 3l6.5 2-6.5 2"/><ellipse cx="11" cy="19.5" rx="7" ry="1.6"/></svg>'
                : '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="17" y2="12"/><polyline points="12 7 17 12 12 17"/></svg>';
            var iconColor = it.type === 'member' ? 'var(--cb-brass)' : it.type === 'course' ? 'var(--cb-moss)' : 'var(--cb-mute)';
            var active = idx === _qsSelectedIdx;
            var bg = active ? 'background:var(--cb-chalk-2);' : '';
            html += '<div data-qs-idx="' + idx + '" style="' + bg + 'display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;border-bottom:1px solid var(--cb-chalk-3)">';
            html += '<div style="width:28px;display:flex;align-items:center;justify-content:center;color:' + iconColor + ';flex-shrink:0">' + icon + '</div>';
            html += '<div style="flex:1;min-width:0">';
            html += '<div style="font-family:var(--font-ui);font-size:14px;font-weight:600;color:var(--cb-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (typeof escHtml === 'function' ? escHtml(it.label) : it.label) + '</div>';
            html += '<div style="font-family:var(--font-mono);font-size:10px;color:var(--cb-mute);letter-spacing:0.5px;margin-top:2px">' + (typeof escHtml === 'function' ? escHtml(it.sub) : it.sub) + '</div>';
            html += '</div>';
            html += '<div style="font-family:var(--font-mono);font-size:9px;color:var(--cb-mute);text-transform:uppercase;letter-spacing:1.5px">' + it.type + '</div>';
            html += '</div>';
        });
        _qsResults.innerHTML = html;
        // Wire click handlers
        Array.prototype.forEach.call(_qsResults.querySelectorAll('[data-qs-idx]'), function(el) {
            el.onclick = function() {
                var i = parseInt(el.getAttribute('data-qs-idx'), 10);
                navigateToResult(_qsLastResults[i]);
            };
        });
    }

    function navigateToResult(item) {
        if (!item) return;
        close();
        if (typeof Router !== 'undefined' && Router.go) {
            if (item.params) Router.go(item.route, item.params);
            else Router.go(item.route);
        } else {
            location.hash = '#/' + item.route;
        }
    }

    function open() {
        if (_qsOverlay) return;
        // Skip if auth screen is showing — quick search is signed-in only.
        var auth = document.getElementById('authScreen');
        if (auth && !auth.classList.contains('hidden')) return;

        _qsOverlay = document.createElement('div');
        _qsOverlay.id = 'qsOverlay';
        _qsOverlay.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(15,61,46,0.45);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding-top:14vh';

        var panel = document.createElement('div');
        panel.style.cssText = 'width:100%;max-width:560px;margin:0 16px;background:var(--cb-chalk);border:1px solid var(--border-default);border-radius:14px;box-shadow:0 24px 64px rgba(0,0,0,0.35);overflow:hidden;font-family:var(--font-ui)';

        panel.innerHTML = '<div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--cb-chalk-3)">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--cb-mute)" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
            '<input id="qsInput" type="text" placeholder="Search pages, members, courses…" aria-label="Quick search" style="flex:1;border:none;outline:none;background:transparent;font-family:var(--font-ui);font-size:15px;color:var(--cb-ink)">' +
            '<kbd style="font-family:var(--font-mono);font-size:10px;letter-spacing:1px;color:var(--cb-mute);background:var(--cb-chalk-2);padding:3px 7px;border-radius:4px;border:1px solid var(--border-default)">ESC</kbd>' +
            '</div>' +
            '<div id="qsResults" style="max-height:50vh;overflow-y:auto"></div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-top:1px solid var(--cb-chalk-3);font-family:var(--font-mono);font-size:9.5px;letter-spacing:1px;color:var(--cb-mute);text-transform:uppercase">' +
            '<span><kbd style="background:var(--cb-chalk-2);padding:1px 6px;border-radius:3px;border:1px solid var(--border-default);color:var(--cb-ink)">↑↓</kbd> navigate · <kbd style="background:var(--cb-chalk-2);padding:1px 6px;border-radius:3px;border:1px solid var(--border-default);color:var(--cb-ink)">↵</kbd> open</span>' +
            '<span><kbd style="background:var(--cb-chalk-2);padding:1px 6px;border-radius:3px;border:1px solid var(--border-default);color:var(--cb-ink)">⌘K</kbd> open anywhere</span>' +
            '</div>';

        _qsOverlay.appendChild(panel);
        _qsOverlay.onclick = function(e) { if (e.target === _qsOverlay) close(); };
        document.body.appendChild(_qsOverlay);

        _qsInput = document.getElementById('qsInput');
        _qsResults = document.getElementById('qsResults');
        _qsSelectedIdx = 0;
        renderResults(search(''));

        _qsInput.oninput = function() {
            _qsSelectedIdx = 0;
            renderResults(search(_qsInput.value));
        };
        _qsInput.onkeydown = function(e) {
            if (e.key === 'Escape') { e.preventDefault(); close(); return; }
            if (e.key === 'Enter') {
                e.preventDefault();
                if (_qsLastResults[_qsSelectedIdx]) navigateToResult(_qsLastResults[_qsSelectedIdx]);
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                _qsSelectedIdx = Math.min(_qsLastResults.length - 1, _qsSelectedIdx + 1);
                renderResults(_qsLastResults);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                _qsSelectedIdx = Math.max(0, _qsSelectedIdx - 1);
                renderResults(_qsLastResults);
                return;
            }
        };
        setTimeout(function() { if (_qsInput) _qsInput.focus(); }, 30);
    }

    function close() {
        if (_qsOverlay && _qsOverlay.parentNode) _qsOverlay.parentNode.removeChild(_qsOverlay);
        _qsOverlay = null;
        _qsInput = null;
        _qsResults = null;
        _qsLastResults = [];
    }

    // Global hotkey wiring — Cmd-K (Mac) / Ctrl-K (Windows/Linux). Also
    // listens for "/" as a vim-style shortcut when no input is focused.
    document.addEventListener('keydown', function(e) {
        // Don't intercept when user is typing in an input
        var t = e.target;
        var isTyping = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);

        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (_qsOverlay) close(); else open();
            return;
        }
        if (e.key === '/' && !isTyping && !_qsOverlay) {
            e.preventDefault();
            open();
            return;
        }
    });

    // Expose for app code (e.g. nav button "Search…" can call this).
    window.PB = window.PB || {};
    window.PB.quickSearch = { open: open, close: close };
})();
