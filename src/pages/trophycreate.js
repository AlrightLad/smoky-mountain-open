// ============================================================================
// CUSTOM TROPHY CREATOR — editor page (W4.S3 / CLUBHOUSE_SPEC-HQ-3q §3q.1)
// ============================================================================
// Consumes the data layer in trophies-data.js. Role-gated: founder (platform or
// league scope) or active-league commissioner (league scope only); everyone else
// gets 404 obscurity. Renders the form ONCE, then updates only the live-preview
// pane + Save-button state on input so focus is never lost. Preview evaluation is
// debounced 300ms (aria-live polite); the leader line is honest per P9 — it shows
// a real current leader, "no qualifying rounds yet", or "leader pending" for
// measures whose data source has not landed. Never a fabricated value.

var _tcState = { scope: "platform", emblem: { source: "library", key: "cup", svg: null }, draft: null, editingId: null, from: "admin", _prefill: null, _previewTimer: null };

// ── Role gate + entry ────────────────────────────────────────────────────────
function renderTrophyCreate(p) {
  var page = document.querySelector('[data-page="trophycreate"]');
  if (!page) return;
  p = p || {};

  var founder = (typeof currentProfile !== "undefined") && typeof isFounderRole === "function" && isFounderRole(currentProfile);
  var commish = typeof isActiveLeagueCommissioner === "function" && isActiveLeagueCommissioner();

  if (!founder && !commish) {
    // Commissioner cache may be cold on a deep link — confirm async, but show the
    // 404 immediately so an unauthorized viewer never sees a flash of the editor.
    page.innerHTML = tcNotFoundHtml();
    if (typeof ensureActiveLeagueCommissioner === "function") {
      ensureActiveLeagueCommissioner(function(isC) { if (isC) renderTrophyCreate(p); });
    }
    return;
  }

  // Edit mode (or scope detection) needs the catalog loaded first.
  if (p.editId && typeof _pbTrophyCache !== "undefined" && !_pbTrophyCache.loaded) {
    page.innerHTML = tcLoadingHtml();
    loadTrophyCatalog(function() { renderTrophyCreate(p); });
    return;
  }

  _tcState = tcInitState(p, founder);
  page.innerHTML = tcFormHtml(founder);

  tcOnWhen();        // reveal the custom-range row if prefilled to custom
  tcSyncPreview();   // paint the initial preview
  tcSyncSave();      // set the initial Save-disabled state
  var nm = document.getElementById("tcName");
  if (nm && !_tcState.editingId) nm.focus();
}

function tcInitState(p, founder) {
  var st = {
    scope: founder ? "platform" : "league",
    emblem: { source: "library", key: "cup", svg: null },
    draft: null, editingId: null,
    from: (p && p.from) || "admin",
    _prefill: null, _previewTimer: null
  };
  if (p && p.scope) st.scope = (p.scope === "platform" && founder) ? "platform" : "league";
  if (!founder) st.scope = "league";

  if (p && p.editId && typeof pbCachedTrophyDefs === "function") {
    var defs = pbCachedTrophyDefs(), found = null;
    for (var i = 0; i < defs.length; i++) if (defs[i] && defs[i].id === p.editId) found = defs[i];
    if (found) {
      st.editingId = found.id;
      st.scope = found.scope === "platform" ? "platform" : "league";
      if (!founder) st.scope = "league";
      st.emblem = Object.assign({ source: "library", key: "cup", svg: null }, found.emblem || {});
      st._prefill = found;
    }
  }
  return st;
}

// ── Live input → draft → preview/save ─────────────────────────────────────────
function tcReadForm() {
  function g(id) { var el = document.getElementById(id); return el ? el.value : ""; }
  var tierEl = document.querySelector('input[name="tcTier"]:checked');
  var thr = g("tcThreshold");
  return {
    id: _tcState.editingId || null,
    name: g("tcName"),
    desc: g("tcDesc"),
    tier: tierEl ? tierEl.value : "",
    criteria: {
      measure: g("tcMeasure"),
      how: g("tcHow"),
      operator: g("tcOp") || null,
      threshold: thr === "" ? null : thr,
      when: g("tcWhen"),
      rangeStart: g("tcRangeStart"),
      rangeEnd: g("tcRangeEnd")
    },
    emblem: _tcState.emblem,
    championTitle: g("tcChampionTitle")
  };
}

function tcInput() {
  _tcState.draft = tcReadForm();
  tcSyncSave();
  clearTimeout(_tcState._previewTimer);
  _tcState._previewTimer = setTimeout(tcSyncPreview, 300);
}

function tcSyncSave() {
  var btn = document.getElementById("tcSave");
  if (!btn) return;
  if (!_tcState.draft) _tcState.draft = tcReadForm();
  btn.disabled = typeof pbTrophyDefValid === "function" ? !pbTrophyDefValid(_tcState.draft) : false;
}

function tcSyncPreview() {
  var box = document.getElementById("tcPreview");
  if (!box) return;
  if (!_tcState.draft) _tcState.draft = tcReadForm();
  box.innerHTML = tcPreviewHtml(_tcState.draft);
}

function tcOnWhen() {
  var sel = document.getElementById("tcWhen");
  var row = document.getElementById("tcCustomRow");
  if (row) row.classList.toggle("hidden", !(sel && sel.value === "custom"));
  tcInput();
}

// ── Emblem source / library / upload ──────────────────────────────────────────
function tcSetEmblemSource(source) {
  _tcState.emblem = _tcState.emblem || {};
  _tcState.emblem.source = source === "upload" ? "upload" : "library";
  var lib = document.getElementById("tcLibPanel"), up = document.getElementById("tcUpPanel");
  if (lib) lib.classList.toggle("hidden", _tcState.emblem.source !== "library");
  if (up) up.classList.toggle("hidden", _tcState.emblem.source !== "upload");
  tcInput();
}

function tcPickLibrary(key) {
  _tcState.emblem = { source: "library", key: key, svg: null };
  var cells = document.querySelectorAll(".tc-lib-cell");
  for (var i = 0; i < cells.length; i++) cells[i].classList.toggle("is-sel", cells[i].getAttribute("data-key") === key);
  tcInput();
}

function tcOnFile(input) {
  var f = input && input.files && input.files[0];
  if (f) tcReadSvgFile(f);
}
function tcDragOver(e) { if (e) e.preventDefault(); var z = document.getElementById("tcDropZone"); if (z) z.classList.add("is-drag"); }
function tcDragLeave(e) { var z = document.getElementById("tcDropZone"); if (z) z.classList.remove("is-drag"); }
function tcDrop(e) {
  if (e) e.preventDefault();
  var z = document.getElementById("tcDropZone"); if (z) z.classList.remove("is-drag");
  var f = e && e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) tcReadSvgFile(f);
}

function tcReadSvgFile(f) {
  var msg = document.getElementById("tcUploadMsg");
  function show(cls, txt) { if (msg) { msg.className = "tc-upload-msg " + cls; msg.textContent = txt; } }
  if (typeof PB_TROPHY_SVG_MAX === "number" && f.size > PB_TROPHY_SVG_MAX) {
    show("tc-upload-msg--err", "File is " + Math.round(f.size / 1024) + "KB; the limit is 50KB.");
    return;
  }
  var rd = new FileReader();
  rd.onload = function() {
    var text = String(rd.result || "");
    var res = typeof validateTrophySvg === "function" ? validateTrophySvg(text, f.size) : { ok: false, errors: ["Validation unavailable."], warnings: [] };
    if (!res.ok) { show("tc-upload-msg--err", res.errors.join(" ")); return; }
    _tcState.emblem = { source: "upload", svg: res.svg, key: null };
    if (res.warnings.length) show("tc-upload-msg--warn", res.warnings.join(" "));
    else show("tc-upload-msg--ok", "Emblem looks good.");
    tcInput();
  };
  rd.onerror = function() { show("tc-upload-msg--err", "Couldn't read that file."); };
  rd.readAsText(f);
}

// ── Scope (founder only) ──────────────────────────────────────────────────────
function tcSetScope(scope) {
  _tcState.scope = scope === "platform" ? "platform" : "league";
  var el = document.getElementById("tcEyebrow");
  if (el) el.textContent = tcEyebrowText();
}

// ── Cancel / save ─────────────────────────────────────────────────────────────
function tcCancel() {
  if (typeof Router !== "undefined" && Router.go) Router.go(_tcState.from || "admin");
}

function tcSave() {
  var draft = tcReadForm();
  if (typeof pbTrophyDefValid === "function" && !pbTrophyDefValid(draft)) {
    if (typeof Router !== "undefined" && Router.toast) Router.toast("Fill in every required field first.");
    return;
  }
  var btn = document.getElementById("tcSave");
  if (btn) { btn.disabled = true; btn.textContent = "Saving…"; }
  saveTrophyDef(draft, _tcState.scope, function(ok, err) {
    if (ok) {
      if (typeof Router !== "undefined" && Router.toast) Router.toast(_tcState.editingId ? "Trophy updated." : "Trophy saved.");
      if (typeof Router !== "undefined" && Router.go) Router.go(_tcState.from || "admin");
      return;
    }
    if (btn) { btn.disabled = false; btn.textContent = _tcState.editingId ? "Save changes" : "Save trophy"; }
    if (typeof Router !== "undefined" && Router.toast) Router.toast(err || "Couldn't save the trophy.");
  });
}

// ── Preview pane ──────────────────────────────────────────────────────────────
function tcEmblemSvg() {
  var e = _tcState.emblem || {};
  if (e.source === "upload" && e.svg) return e.svg; // sanitized by validateTrophySvg on upload
  if (e.source === "library" && e.key && typeof pbTrophyLibrary === "function") {
    var lib = pbTrophyLibrary(e.key);
    return lib ? lib.svg : "";
  }
  return "";
}

function tcEmblemPlaceholder() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2.4 2.4" opacity="0.45"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>';
}

function tcLeaderLine(def) {
  if (!def || !def.criteria || !def.criteria.measure) {
    return '<span class="tc-leader__pending">Pick a measure to preview the current leader.</span>';
  }
  var m = typeof pbTrophyMeasure === "function" ? pbTrophyMeasure(def.criteria.measure) : null;
  if (!m) return '<span class="tc-leader__pending">Pick a measure to preview the current leader.</span>';
  if (!m.computable) {
    return '<span class="tc-leader__label">Leader pending</span> <span class="tc-leader__pending">This measure saves and displays today; its live data source lands in a later stats release.</span>';
  }
  var ev = typeof evaluateTrophy === "function" ? evaluateTrophy(def) : { leader: null };
  if (!ev.leader) {
    return '<span class="tc-leader__pending">No qualifying rounds yet. The leader appears once members post rounds that match.</span>';
  }
  return '<span class="tc-leader__label">Current leader</span> <span class="tc-leader__name">' + escHtml(ev.leader.name) + '</span> <span class="tc-leader__val">' + escHtml(ev.leader.display) + '</span>';
}

function tcPreviewHtml(def) {
  def = def || {};
  var tier = def.tier || "common";
  var tierLabel = "Tier";
  if (typeof PB_TROPHY_TIERS !== "undefined") {
    for (var i = 0; i < PB_TROPHY_TIERS.length; i++) if (PB_TROPHY_TIERS[i].key === def.tier) tierLabel = PB_TROPHY_TIERS[i].label;
  }
  var emblem = tcEmblemSvg() || tcEmblemPlaceholder();
  var name = def.name ? escHtml(def.name) : "Untitled trophy";
  var summary = (typeof trophyCriteriaSummary === "function" && trophyCriteriaSummary(def)) || "Choose what's measured to see the criteria.";
  var champ = typeof championTitleFor === "function" ? championTitleFor(def) : "Trophy Champion";
  var descHtml = def.desc ? '<div class="tc-card__desc">' + escHtml(def.desc) + '</div>' : '';
  return ''
    + '<div class="tc-card tc-card--' + tier + '">'
    +   '<div class="tc-card__emblem">' + emblem + '</div>'
    +   '<div class="tc-card__tier">' + escHtml(tierLabel) + '</div>'
    +   '<div class="tc-card__name">' + name + '</div>'
    +   '<div class="tc-card__summary">' + escHtml(summary) + '</div>'
    +   descHtml
    +   '<div class="tc-card__champ">Champion title · ' + escHtml(champ) + '</div>'
    + '</div>'
    + '<div class="tc-leader" aria-live="polite">' + tcLeaderLine(def) + '</div>';
}

// ── Form HTML ─────────────────────────────────────────────────────────────────
function tcEyebrowText() {
  return (_tcState.scope === "platform" ? "FOUNDER" : "COMMISSIONER") + " · TROPHY CATALOG · " + (_tcState.editingId ? "EDIT TROPHY" : "NEW TROPHY");
}

function tcFormHtml(founder) {
  var d = _tcState._prefill || {};
  return ''
    + '<div class="tc-wrap">'
    +   '<a class="tc-back" href="#" role="link" tabindex="0" onclick="tcCancel();return false" onkeydown="if(event.key===\'Enter\'){tcCancel();return false}">Back to catalog</a>'
    +   '<header class="tc-mast">'
    +     '<div class="tc-eyebrow" id="tcEyebrow">' + escHtml(tcEyebrowText()) + '</div>'
    +     '<h1 class="tc-headline">' + (_tcState.editingId ? "Refine a trophy." : "Compose a trophy.") + '</h1>'
    +     '<p class="tc-subdeck">Define what earns it, choose an emblem, and watch the live preview update as you build.</p>'
    +   '</header>'
    +   '<div class="tc-grid">'
    +     '<form class="tc-form" oninput="tcInput()" onsubmit="return false">'
    +       tcSecIdentity(d)
    +       tcSecCriteria(d.criteria || {})
    +       tcSecEmblem()
    +       tcSecTitleScope(d, founder)
    +       '<div class="tc-footer">'
    +         '<a class="tc-cancel" href="#" role="link" tabindex="0" onclick="tcCancel();return false" onkeydown="if(event.key===\'Enter\'){tcCancel();return false}">Cancel</a>'
    +         '<button type="button" class="tc-save" id="tcSave" onclick="tcSave()" disabled>' + (_tcState.editingId ? "Save changes" : "Save trophy") + '</button>'
    +       '</div>'
    +     '</form>'
    +     '<aside class="tc-preview-pane" aria-label="Live preview">'
    +       '<div class="tc-preview-label">Live preview</div>'
    +       '<div id="tcPreview" class="tc-preview"></div>'
    +     '</aside>'
    +   '</div>'
    + '</div>';
}

function tcSecIdentity(d) {
  var tiers = (PB_TROPHY_TIERS || []).map(function(t) {
    var ck = d.tier === t.key ? " checked" : "";
    return '<label class="tc-radio"><input type="radio" name="tcTier" value="' + t.key + '"' + ck + '> <span>' + escHtml(t.label) + '</span></label>';
  }).join("");
  return ''
    + '<fieldset class="tc-sec">'
    +   '<legend class="tc-legend"><span class="tc-legend__idx">A</span> Identity</legend>'
    +   '<div class="tc-field">'
    +     '<label class="tc-label" for="tcName">Name <span class="tc-req">required</span></label>'
    +     '<input class="tc-input" id="tcName" type="text" maxlength="50" placeholder="Iron Schedule" value="' + escHtml(d.name || "") + '" aria-describedby="tcNameHint">'
    +     '<div class="tc-hint" id="tcNameHint">Up to 50 characters. The trophy\'s display name.</div>'
    +   '</div>'
    +   '<div class="tc-field">'
    +     '<label class="tc-label" for="tcDesc">Description <span class="tc-req">required</span></label>'
    +     '<textarea class="tc-input tc-textarea" id="tcDesc" maxlength="280" rows="3" placeholder="Awarded to the member who…" aria-describedby="tcDescHint">' + escHtml(d.desc || "") + '</textarea>'
    +     '<div class="tc-hint" id="tcDescHint">Up to 280 characters. Tell members what it celebrates.</div>'
    +   '</div>'
    +   '<div class="tc-field">'
    +     '<span class="tc-label">Tier <span class="tc-req">required</span></span>'
    +     '<div class="tc-radio-row" role="radiogroup" aria-label="Tier">' + tiers + '</div>'
    +   '</div>'
    + '</fieldset>';
}

function tcSecCriteria(c) {
  var measures = '<option value="">Choose what\'s measured</option>' + (PB_TROPHY_MEASURES || []).map(function(m) {
    var sel = c.measure === m.key ? " selected" : "";
    var pend = m.computable ? "" : " (leader pending)";
    return '<option value="' + m.key + '"' + sel + '>' + escHtml(m.label + pend) + '</option>';
  }).join("");
  var hows = '<option value="">Choose how it\'s measured</option>' + (PB_TROPHY_HOWS || []).map(function(x) {
    return '<option value="' + x.key + '"' + (c.how === x.key ? " selected" : "") + '>' + escHtml(x.label) + '</option>';
  }).join("");
  var ops = '<option value="">No threshold (superlative: most or lowest wins)</option>' + (PB_TROPHY_OPS || []).map(function(o) {
    return '<option value="' + o.key + '"' + (c.operator === o.key ? " selected" : "") + '>' + escHtml(o.label + "  " + o.verb) + '</option>';
  }).join("");
  var whens = (PB_TROPHY_WHENS || []).map(function(w) {
    var sel = (c.when || "all-time") === w.key ? " selected" : "";
    return '<option value="' + w.key + '"' + sel + '>' + escHtml(w.label) + '</option>';
  }).join("");
  return ''
    + '<fieldset class="tc-sec">'
    +   '<legend class="tc-legend"><span class="tc-legend__idx">B</span> Criteria</legend>'
    +   '<div class="tc-field">'
    +     '<label class="tc-label" for="tcMeasure">What\'s measured <span class="tc-req">required</span></label>'
    +     '<select class="tc-input tc-select" id="tcMeasure">' + measures + '</select>'
    +   '</div>'
    +   '<div class="tc-field">'
    +     '<label class="tc-label" for="tcHow">How it\'s measured <span class="tc-req">required</span></label>'
    +     '<select class="tc-input tc-select" id="tcHow">' + hows + '</select>'
    +   '</div>'
    +   '<div class="tc-field-pair">'
    +     '<div class="tc-field">'
    +       '<label class="tc-label" for="tcOp">Threshold rule</label>'
    +       '<select class="tc-input tc-select" id="tcOp">' + ops + '</select>'
    +     '</div>'
    +     '<div class="tc-field">'
    +       '<label class="tc-label" for="tcThreshold">Threshold value</label>'
    +       '<input class="tc-input" id="tcThreshold" type="number" step="any" inputmode="decimal" placeholder="optional" value="' + escHtml(c.threshold != null ? String(c.threshold) : "") + '">'
    +     '</div>'
    +   '</div>'
    +   '<div class="tc-field">'
    +     '<label class="tc-label" for="tcWhen">Time window <span class="tc-req">required</span></label>'
    +     '<select class="tc-input tc-select" id="tcWhen" onchange="tcOnWhen()">' + whens + '</select>'
    +   '</div>'
    +   '<div class="tc-field-pair hidden" id="tcCustomRow">'
    +     '<div class="tc-field"><label class="tc-label" for="tcRangeStart">From</label><input class="tc-input" id="tcRangeStart" type="date" value="' + escHtml(c.rangeStart || "") + '"></div>'
    +     '<div class="tc-field"><label class="tc-label" for="tcRangeEnd">To</label><input class="tc-input" id="tcRangeEnd" type="date" value="' + escHtml(c.rangeEnd || "") + '"></div>'
    +   '</div>'
    + '</fieldset>';
}

function tcSecEmblem() {
  var e = _tcState.emblem || { source: "library", key: "cup" };
  var libSel = e.source !== "upload";
  var cells = (PB_TROPHY_LIBRARY || []).map(function(l) {
    var sel = (e.source === "library" && e.key === l.key) ? " is-sel" : "";
    return '<button type="button" class="tc-lib-cell' + sel + '" data-key="' + l.key + '" title="' + escHtml(l.label) + '" aria-label="' + escHtml(l.label) + '" onclick="tcPickLibrary(\'' + l.key + '\')">' + l.svg + '</button>';
  }).join("");
  return ''
    + '<fieldset class="tc-sec">'
    +   '<legend class="tc-legend"><span class="tc-legend__idx">C</span> Emblem</legend>'
    +   '<div class="tc-radio-row" role="radiogroup" aria-label="Emblem source">'
    +     '<label class="tc-radio"><input type="radio" name="tcEmblemSrc" value="library"' + (libSel ? " checked" : "") + ' onchange="tcSetEmblemSource(\'library\')"> <span>Pick from library</span></label>'
    +     '<label class="tc-radio"><input type="radio" name="tcEmblemSrc" value="upload"' + (!libSel ? " checked" : "") + ' onchange="tcSetEmblemSource(\'upload\')"> <span>Upload an SVG</span></label>'
    +   '</div>'
    +   '<div id="tcLibPanel" class="tc-lib-grid' + (libSel ? "" : " hidden") + '">' + cells + '</div>'
    +   '<div id="tcUpPanel" class="tc-up-panel' + (libSel ? " hidden" : "") + '">'
    +     '<div class="tc-drop" id="tcDropZone" ondragover="tcDragOver(event)" ondragleave="tcDragLeave(event)" ondrop="tcDrop(event)">'
    +       '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M8 8l4-4 4 4M5 20h14"/></svg>'
    +       '<div class="tc-drop__txt">Drop an SVG here, or</div>'
    +       '<label class="tc-drop__btn">Choose file<input type="file" accept="image/svg+xml,.svg" hidden onchange="tcOnFile(this)"></label>'
    +       '<div class="tc-drop__hint">Max 50KB. No scripts, styles, or external references. Use currentColor or the brass and ink palette.</div>'
    +     '</div>'
    +     '<div class="tc-upload-msg" id="tcUploadMsg" role="alert"></div>'
    +   '</div>'
    + '</fieldset>';
}

function tcSecTitleScope(d, founder) {
  var scopeHtml;
  if (founder) {
    scopeHtml = ''
      + '<div class="tc-field">'
      +   '<span class="tc-label">Scope</span>'
      +   '<div class="tc-radio-row" role="radiogroup" aria-label="Scope">'
      +     '<label class="tc-radio"><input type="radio" name="tcScope" value="platform"' + (_tcState.scope === "platform" ? " checked" : "") + ' onchange="tcSetScope(\'platform\')"> <span>Platform-wide (every league)</span></label>'
      +     '<label class="tc-radio"><input type="radio" name="tcScope" value="league"' + (_tcState.scope === "league" ? " checked" : "") + ' onchange="tcSetScope(\'league\')"> <span>This league only</span></label>'
      +   '</div>'
      + '</div>';
  } else {
    scopeHtml = '<div class="tc-field"><span class="tc-label">Scope</span><div class="tc-scope-fixed">This league only</div></div>';
  }
  return ''
    + '<fieldset class="tc-sec">'
    +   '<legend class="tc-legend"><span class="tc-legend__idx">D</span> Champion title &amp; scope</legend>'
    +   '<div class="tc-field">'
    +     '<label class="tc-label" for="tcChampionTitle">Champion title</label>'
    +     '<input class="tc-input" id="tcChampionTitle" type="text" maxlength="60" placeholder="Auto from the name" value="' + escHtml(d.championTitle || "") + '" aria-describedby="tcChampHint">'
    +     '<div class="tc-hint" id="tcChampHint">Shown on the holder\'s profile. Leave blank to use "{Name} Champion".</div>'
    +   '</div>'
    +   scopeHtml
    + '</fieldset>';
}

// ── Fallback states ───────────────────────────────────────────────────────────
function tcNotFoundHtml() {
  return '<div class="tc-wrap"><div class="tc-404"><div class="tc-404__code">404</div><p class="tc-404__msg">This page could not be found.</p><a class="tc-back" href="#" role="link" tabindex="0" onclick="if(typeof Router!==\'undefined\')Router.go(\'home\');return false">Back to the clubhouse</a></div></div>';
}
function tcLoadingHtml() {
  return '<div class="tc-wrap"><div class="tc-loading">Loading the catalog…</div></div>';
}

if (typeof Router !== "undefined" && Router.register) {
  Router.register("trophycreate", function(p) { renderTrophyCreate(p || {}); });
}
