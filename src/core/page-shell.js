/* ═══════════════════════════════════════════════════════════════════════════
   PB.pageShell — band-aware page orchestrator (v8.11.4 · Ship Page Shell)

   Provides the shared HQ chrome (banner + masthead + content wrapper +
   optional rails + footer) so HQ pages stop reinventing layout. Per design
   bot Q1 ruling, slot-based composition. Mobile path bypasses the shell
   entirely — pages render inline below their HQ_BREAKPOINT.

   Public API:
     PB.pageShell.render(rootEl, {
       pageKey,                                  string · debug stamp
       bands,                                    string[] · which bands the page supports
       banner:        (band) => htmlString,      full-width above masthead
       masthead:      (band) => slotData,        { variant, title, date, condensed?, weatherSiteId? }
       scope:         (band) => htmlString,      rendered inside masthead right cluster
       content:       (band) => htmlString,      band-aware page content
       leftRail:      null | (band) => string,   null or page-shell-internal column
       rightRail:     null | (band) => string,   null or page-shell-internal column
       footer:        () => htmlString,          page footer (HQ default = renderPageFooter)
       contentMaxWidth: (band) => '640px'|...    band → max-width fn
     });

     PB.pageShell.currentBand()                  read current band synchronously
     PB.pageShell.BREAKPOINTS                    object { mobile, A, B, C, D } readable

   Internal masthead chrome:
     'default' variant (Bands B/C/D): 56px single row · wordmark + divider + date
                                       · weather pill + scope cluster
     'bandA' variant (Band A): 68px two rows · hamburger + wordmark + scope
                                · mono date + weather caption

   Stamps: rootEl.dataset.renderPath = "hq-shell" (success) or unchanged on
   throw — caller's try/catch can stamp "hq-fallback" before falling back.

   Out of scope (queued):
     - Mobile shell (post-Clubhouse pivot)
     - Scope switcher functional implementation (currently visual-only)
     - Reactive resize binding (callers handle their own — see _bindHQResize
       in home.js)
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
  // Band breakpoints — MUST match home.js _currentBand() exactly. v8.11.4
  // duplicates the constant for shell autonomy; home.js retains its own copy
  // for the reactive resize binding. Reconcile in a future cleanup ship when
  // other shell-consuming pages migrate. (TODO: deprecate home.js _currentBand
  // when at least 3 pages use shell.)
  var BREAKPOINTS = {
    mobile: 720,   // <720 = mobile (shell bypass)
    A: 960,        // 720-959 = A
    B: 1280,       // 960-1279 = B
    C: 1440,       // 1280-1439 = C
    D: Infinity    // 1440+ = D
  };

  function _currentBand() {
    var w = window.innerWidth;
    if (w < BREAKPOINTS.mobile) return "mobile";
    if (w < BREAKPOINTS.A) return "A";
    if (w < BREAKPOINTS.B) return "B";
    if (w < BREAKPOINTS.C) return "C";
    return "D";
  }

  // ─── Masthead chrome renderers ──────────────────────────────────────────
  // Two variants per design bot Q1. Both accept slotData (page-supplied) +
  // pre-rendered scopeHtml (from the scope slot). Page never rolls its own
  // masthead — shell owns the chrome.

  function _renderMastheadDefault(slotData, scopeHtml) {
    var date = slotData && slotData.date ? slotData.date : "";
    var title = slotData && slotData.title ? slotData.title : "";
    var weatherId = slotData && slotData.weatherSiteId ? slotData.weatherSiteId : "";

    var h = '<div style="background:var(--cb-chalk);border-bottom:1px solid var(--cb-chalk-3);max-width:1152px;margin:0 auto;padding:0 24px;height:56px;display:flex;align-items:center;justify-content:space-between">';

    // Left cluster: wordmark + divider + date
    h += '<div style="display:flex;align-items:center;gap:14px">';
    h += '<div style="font-family:var(--font-display);font-weight:700;font-size:22px;line-height:24px;color:var(--cb-ink);letter-spacing:-0.5px">' + escHtml(title) + '</div>';
    h += '<div style="width:1px;height:24px;background:var(--cb-chalk-3)"></div>';
    h += '<div style="font-family:var(--font-ui);font-weight:500;font-size:13px;color:var(--cb-charcoal)">' + escHtml(date) + '</div>';
    h += '</div>';

    // Right cluster: weather pill + scope slot
    h += '<div style="display:flex;align-items:center;gap:var(--sp-3)">';
    if (weatherId) {
      h += '<div id="' + escHtml(weatherId) + '" data-weather-site="pill" style="display:inline-flex;align-items:center;height:28px;padding:0 12px;background:var(--cb-chalk-2);border-radius:6px;font-family:var(--font-ui);font-weight:500;font-size:12px;color:var(--cb-brass);letter-spacing:0.3px">—°</div>';
    }
    if (scopeHtml) h += scopeHtml;
    h += '</div>';

    h += '</div>';
    return h;
  }

  function _renderMastheadBandA(slotData, scopeHtml) {
    var datePrefix = slotData && slotData.date ? slotData.date : "";
    var title = slotData && slotData.title ? slotData.title : "";
    var weatherId = slotData && slotData.weatherSiteId ? slotData.weatherSiteId : "";

    var h = '<div style="background:var(--cb-chalk);border-bottom:1px solid var(--cb-chalk-3);max-width:640px;margin:0 auto;padding:0 24px">';
    // Row 1 (44px): hamburger + wordmark + scope
    h += '<div style="height:44px;display:flex;align-items:center;justify-content:space-between;gap:var(--sp-2)">';
    h += '<button type="button" onclick="window._toggleHQDrawer && window._toggleHQDrawer()" aria-label="Open menu" style="width:44px;height:44px;background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:-10px">';
    h += '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--cb-ink)" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>';
    h += '</button>';
    h += '<div style="font-family:var(--font-display);font-weight:700;font-size:18px;line-height:1;color:var(--cb-ink);letter-spacing:-0.5px">' + escHtml(title) + '</div>';
    if (scopeHtml) h += scopeHtml;
    else h += '<div style="width:44px"></div>';   // spacer to keep wordmark centered
    h += '</div>';
    // Row 2 (24px): mono date + weather caption
    h += '<div style="height:24px;display:flex;align-items:center">';
    var captionInner = escHtml(datePrefix);
    if (weatherId) {
      captionInner += '<span id="' + escHtml(weatherId) + '" data-weather-site="caption">—°</span>';
    }
    h += '<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--cb-mute);text-transform:uppercase">' + captionInner + '</div>';
    h += '</div>';
    h += '</div>';
    return h;
  }

  // ─── Content row composition ────────────────────────────────────────────
  // Inside content max-width wrapper. Composes leftRail / content / rightRail
  // into a flex row when rails present. Rails are 196px fixed-width per the
  // current HQ Home agate rail convention (Band D). Pages that need different
  // rail widths can extend the API in a future ship.

  var RAIL_WIDTH_PX = 196;

  function _renderContentRow(contentHtml, leftRailHtml, rightRailHtml) {
    var hasLeft = !!leftRailHtml;
    var hasRight = !!rightRailHtml;

    if (!hasLeft && !hasRight) {
      // Single-column flow — no shell-imposed flex. Page's own grid governs.
      return contentHtml;
    }

    var h = '<div style="display:flex;gap:24px;padding-top:32px">';
    if (hasLeft) {
      h += '<aside class="page-shell__left-rail" style="width:' + RAIL_WIDTH_PX + 'px;flex-shrink:0">' + leftRailHtml + '</aside>';
    }
    h += '<main class="page-shell__content" style="flex:1;min-width:0">' + contentHtml + '</main>';
    if (hasRight) {
      h += '<aside class="page-shell__right-rail" style="width:' + RAIL_WIDTH_PX + 'px;flex-shrink:0">' + rightRailHtml + '</aside>';
    }
    h += '</div>';
    return h;
  }

  // ─── Public render entry ────────────────────────────────────────────────

  function render(rootEl, opts) {
    if (!rootEl) throw new Error("[pageShell] rootEl required");
    if (!opts || typeof opts !== "object") throw new Error("[pageShell] opts required");

    var band = _currentBand();

    // Mobile bypass — shell never renders mobile per Call 4.
    if (band === "mobile") {
      throw new Error("[pageShell] mobile band must bypass shell — render inline in page");
    }

    // Optional band gate — page declares which bands it supports.
    if (Array.isArray(opts.bands) && opts.bands.indexOf(band) === -1) {
      throw new Error("[pageShell] band '" + band + "' not in declared bands [" + opts.bands.join(",") + "]");
    }

    // Slot resolution — each slot may be null/undefined or a function.
    function _slot(fn) { return (typeof fn === "function") ? fn(band) : ""; }

    var bannerHtml = _slot(opts.banner);
    var mastheadData = (typeof opts.masthead === "function") ? opts.masthead(band) : null;
    var scopeHtml = _slot(opts.scope);
    var contentHtml = _slot(opts.content);
    var leftRailHtml = (typeof opts.leftRail === "function") ? opts.leftRail(band) : null;
    var rightRailHtml = (typeof opts.rightRail === "function") ? opts.rightRail(band) : null;
    var footerHtml = (typeof opts.footer === "function") ? opts.footer() : "";

    // Resolve content max-width per band.
    var maxWidth = (typeof opts.contentMaxWidth === "function")
      ? opts.contentMaxWidth(band)
      : "1132px";

    // Compose masthead from slot data + scope HTML.
    var mastheadHtml = "";
    if (mastheadData) {
      mastheadHtml = (mastheadData.variant === "bandA")
        ? _renderMastheadBandA(mastheadData, scopeHtml)
        : _renderMastheadDefault(mastheadData, scopeHtml);
    }

    // Assemble the page.
    var h = "";
    if (bannerHtml) h += bannerHtml;
    if (mastheadHtml) h += mastheadHtml;
    h += '<div style="max-width:' + maxWidth + ';margin:0 auto;padding:0 24px">';
    h += _renderContentRow(contentHtml, leftRailHtml, rightRailHtml);
    if (footerHtml) h += footerHtml;
    h += '</div>';

    rootEl.innerHTML = h;
    rootEl.dataset.renderPath = "hq-shell";
    rootEl.dataset.renderBand = band;
    rootEl.dataset.renderWidth = window.innerWidth;
    if (opts.pageKey) rootEl.dataset.renderPage = opts.pageKey;
  }

  // ─── Attach to PB ───────────────────────────────────────────────────────
  if (typeof PB !== "undefined") {
    PB.pageShell = {
      render: render,
      currentBand: _currentBand,
      BREAKPOINTS: BREAKPOINTS
    };
  }
})();
