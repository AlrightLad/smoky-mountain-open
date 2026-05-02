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
       masthead:      (band) => slotData,        slot data; shape varies by variant:
                                                   default: { variant, title, date, weatherSiteId? }
                                                   bandA:   { variant, title, date, weatherSiteId? }
                                                   hqHome:  { variant, eyebrow, headline, subhead, date, weatherSiteId? }
       scope:         (band) => htmlString,      rendered inside masthead right cluster
       content:       (band) => htmlString,      band-aware page content
       leftRail:      null | (band) => string,   null or page-shell-internal column
       rightRail:     null | (band) => string,   null or page-shell-internal column
       footer:        () => htmlString,          page footer (HQ default = renderPageFooter)
       contentMaxWidth: (band) => '640px'|'none' band → max-width fn ("none" opts into container queries)
     });

     PB.pageShell.currentBand()                  read current band synchronously
     PB.pageShell.BREAKPOINTS                    object { mobile, A, B, C, D } readable

   Internal masthead chrome:
     'default' variant (Bands B/C/D): 56px single row · wordmark + divider + date
                                       · weather pill + scope cluster
     'bandA' variant (Band A): 68px two rows · hamburger + wordmark + scope
                                · mono date + weather caption
     'hqHome' variant (HQ Home all bands · v8.15.1 Gate 2): editorial eyebrow
                                + Fraunces italic headline (84/64/52px via
                                --hq-masthead-size) + subhead + mono date,
                                weather pill + scope cluster on right

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

  // Ship 5 Gate 2 (v8.15.1) — third masthead variant per Q6 ruling. Editorial
  // hqHome chrome: eyebrow ("HQ · Saturday Edition"), oversized italic
  // wordmark headline (Fraunces 84/64/52px per band via --hq-masthead-size
  // token), subhead, mono date stamp. Scope cluster + weather pill on the
  // right same as default. Variant fields beyond default: { eyebrow, headline,
  // subhead } — slot data shape is documented at top of this file.
  //
  // Per memory P9 (variable font axis discipline), font-variation-settings
  // 'opsz' 144 declared on the headline so Fraunces selects its largest
  // optical size master at the largest rendered size. Per P14, "Parbaughs"
  // wordmark is identity-bearing and floors at 44px at mobile (handled in
  // mobile path, not here — this variant only renders at bands A/B/C/D).
  function _renderMastheadHQHome(slotData, scopeHtml) {
    var eyebrow = slotData && slotData.eyebrow ? slotData.eyebrow : "";
    var headline = slotData && slotData.headline ? slotData.headline : "";
    var subhead = slotData && slotData.subhead ? slotData.subhead : "";
    var date = slotData && slotData.date ? slotData.date : "";
    var weatherId = slotData && slotData.weatherSiteId ? slotData.weatherSiteId : "";

    var h = '<header class="page-shell__masthead page-shell__masthead--hq-home" style="background:var(--cb-chalk);border-bottom:1px solid var(--cb-chalk-3);padding:32px 24px 28px">';
    // Inner row spans two columns at standard+: editorial stack on left, scope+weather cluster on right.
    h += '<div style="max-width:1380px;margin:0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:24px">';
    // Left: editorial stack
    h += '<div style="flex:1;min-width:0">';
    if (eyebrow) {
      h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2.5px;color:var(--cb-brass);text-transform:uppercase;margin-bottom:10px">' + escHtml(eyebrow) + '</div>';
    }
    if (headline) {
      h += '<h1 class="page-shell__masthead-headline" style="font-family:var(--font-display);font-size:var(--hq-masthead-size);font-style:italic;font-weight:700;line-height:0.95;letter-spacing:-2px;color:var(--cb-ink);margin:0 0 8px;font-variation-settings:\'opsz\' 144">' + escHtml(headline) + '</h1>';
    }
    if (subhead) {
      h += '<div style="font-family:var(--font-ui);font-size:var(--hq-subhead-size);font-weight:500;color:var(--cb-charcoal);line-height:1.4;max-width:640px">' + escHtml(subhead) + '</div>';
    }
    if (date) {
      h += '<div style="font-family:var(--font-mono);font-size:var(--hq-eyebrow-size);font-weight:700;letter-spacing:2px;color:var(--cb-mute);text-transform:uppercase;margin-top:14px">' + escHtml(date) + '</div>';
    }
    h += '</div>';
    // Right: scope cluster + weather pill (matches default variant chrome)
    h += '<div style="display:flex;align-items:center;gap:var(--sp-3);flex-shrink:0;padding-top:4px">';
    if (weatherId) {
      h += '<div id="' + escHtml(weatherId) + '" data-weather-site="pill" style="display:inline-flex;align-items:center;height:28px;padding:0 12px;background:var(--cb-chalk-2);border-radius:6px;font-family:var(--font-ui);font-weight:500;font-size:12px;color:var(--cb-brass);letter-spacing:0.3px">—°</div>';
    }
    if (scopeHtml) h += scopeHtml;
    h += '</div>';
    h += '</div>';
    h += '</header>';
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

    // Compose masthead from slot data + scope HTML. Ship 5 Gate 2 (v8.15.1)
    // — dispatch table replaces 2-branch ternary; supports 3 variants:
    // 'default' (Bands B/C/D wordmark + date), 'bandA' (compact two-row),
    // and 'hqHome' (editorial eyebrow + headline + subhead + date). Default
    // and bandA variants are byte-identical to pre-v8.15.1 per Q6 ruling.
    var MASTHEAD_VARIANTS = {
      bandA: _renderMastheadBandA,
      hqHome: _renderMastheadHQHome,
      default: _renderMastheadDefault
    };
    var mastheadHtml = "";
    if (mastheadData) {
      var renderVariant = MASTHEAD_VARIANTS[mastheadData.variant] || _renderMastheadDefault;
      mastheadHtml = renderVariant(mastheadData, scopeHtml);
    }

    // Assemble the page.
    var h = "";
    if (bannerHtml) h += bannerHtml;
    if (mastheadHtml) h += mastheadHtml;
    // Ship 5 Gate 2 (v8.15.1) — class + inline max-width + container-type host
    // for @container hq-content queries. Container-type rule lives in
    // components.css (.page-shell__container declaration is always-on; only
    // pages that author @container hq-content rules respond, so non-HQ-Home
    // consumers are unaffected). Per Q-AUDIT-A ruling Option A.
    var maxWidthCss = (maxWidth && maxWidth !== "none") ? "max-width:" + maxWidth + ";" : "";
    h += '<div class="page-shell__container" style="' + maxWidthCss + 'margin:0 auto;padding:0 24px">';
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
