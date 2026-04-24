/* ═══════════════════════════════════════════════════════════════════════════
   CHALK DRY — loading state system (v8.3.4 · Ship 0c)

   Duration-gated three-state pattern:
     < 200ms       → nothing (render real content directly)
     200-700ms     → Running Pin (1px brass rule + 4px dot sliding L→R)
     > 700ms       → Skeleton scaffold (chalk-2 blocks sized to real content)

   Reusable primitives:
     skelHeader(eyebrow)  — eyebrow + title + body block
     skelRow()            — avatar + two body lines (for list items)
     skelStat()           — small label + big number (for stat triplets)
     runningPin()         — 1px brass rule with sliding dot
     breathPin()          — single brass pin, 2.4s pulse (scaffold anchor)
     syncRibbon(text,off) — inline sync-state ribbon (Live HUD exception)

   State manager:
     createLoadingState({ showAt, scaffoldAt })
       .update(isPending) .subscribe(fn) .dispose() .get()

   No adoption in this ship — screen ships (1-7) wire as they restructure.
   ═══════════════════════════════════════════════════════════════════════════ */

function createLoadingState(opts) {
  opts = opts || {};
  var showAt = opts.showAt || 200;
  var scaffoldAt = opts.scaffoldAt || 700;
  var state = "none";
  var pendingSince = null;
  var timer1 = null;
  var timer2 = null;
  var listeners = [];

  function _emit() {
    for (var i = 0; i < listeners.length; i++) listeners[i](state);
  }

  return {
    update: function(isPending) {
      if (isPending && !pendingSince) {
        pendingSince = Date.now();
        state = "none";
        clearTimeout(timer1);
        clearTimeout(timer2);
        timer1 = setTimeout(function() {
          if (state === "none") { state = "pin"; _emit(); }
        }, showAt);
        timer2 = setTimeout(function() {
          if (state === "pin" || state === "none") { state = "scaffold"; _emit(); }
        }, scaffoldAt);
        _emit();
      } else if (!isPending && pendingSince) {
        clearTimeout(timer1);
        clearTimeout(timer2);
        timer1 = null;
        timer2 = null;
        pendingSince = null;
        state = "none";
        _emit();
      }
    },
    subscribe: function(fn) {
      listeners.push(fn);
      return function() {
        listeners = listeners.filter(function(x) { return x !== fn; });
      };
    },
    dispose: function() {
      clearTimeout(timer1);
      clearTimeout(timer2);
      timer1 = null;
      timer2 = null;
      listeners = [];
    },
    get: function() { return state; }
  };
}

// ── Skeleton HTML helpers ─────────────────────────────────────────────────

function skelHeader(eyebrow) {
  eyebrow = eyebrow || "LOADING";
  return '<div class="skel-header">' +
    '<div class="skel-eyebrow">' + eyebrow + '</div>' +
    '<div class="skel skel--title"></div>' +
    '<div class="skel skel--body"></div>' +
  '</div>';
}

function skelRow() {
  return '<div class="skel-row">' +
    '<div class="skel skel--avatar"></div>' +
    '<div class="skel-row__body">' +
      '<div class="skel skel--body"></div>' +
      '<div class="skel skel--body"></div>' +
    '</div>' +
  '</div>';
}

function skelStat() {
  return '<div class="skel-stat">' +
    '<div class="skel skel--meta"></div>' +
    '<div class="skel skel--stat-value"></div>' +
  '</div>';
}

function runningPin() { return '<div class="load-rule"></div>'; }

function breathPin() { return '<div class="breath-pin"></div>'; }

function syncRibbon(text, offline) {
  var label = offline ? "OFFLINE · CHANGES QUEUED" : (text || "SYNCING");
  return '<div class="sync-ribbon">' +
    '<span class="sync-ribbon__dot"></span>' +
    '<span>' + label + '</span>' +
  '</div>';
}

// ── Expose as window globals (matches bottomsheet/haptics/transitions pattern) ──
if (typeof window !== "undefined") {
  window.createLoadingState = createLoadingState;
  window.skelHeader = skelHeader;
  window.skelRow = skelRow;
  window.skelStat = skelStat;
  window.runningPin = runningPin;
  window.breathPin = breathPin;
  window.syncRibbon = syncRibbon;
}

/* ── Demo panel (dev only, accessed via #chalk-dry-demo) ──────────────────
   Matches the #bs-demo pattern from Ship 0b-i. Four test scenarios that
   exercise the loading states end-to-end. NOT wired to navigation.
   Auto-removes when the hash changes away from #chalk-dry-demo. */

function _cdInitDemoPanel() {
  if (document.getElementById("chalkDryDemoPanel")) return;
  var panel = document.createElement("div");
  panel.id = "chalkDryDemoPanel";
  panel.style.cssText = "position:fixed;top:20px;right:20px;z-index:1500;background:var(--cb-chalk);border:1px solid var(--cb-chalk-3);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);min-width:260px;max-width:280px";
  panel.innerHTML =
    '<div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--cb-ink)">Chalk Dry Demo</div>' +
    '<div style="font-size:10px;color:var(--cb-mute);margin-bottom:6px">v8.3.4 · dev only (#chalk-dry-demo)</div>' +
    '<button id="cdDemo150" class="tappable" style="padding:10px 14px;background:var(--cb-chalk-2);border:1px solid var(--cb-chalk-3);border-radius:8px;color:var(--cb-ink);font-size:13px;font-weight:600;cursor:pointer;text-align:left">150ms → nothing shown</button>' +
    '<button id="cdDemo500" class="tappable" style="padding:10px 14px;background:var(--cb-chalk-2);border:1px solid var(--cb-chalk-3);border-radius:8px;color:var(--cb-ink);font-size:13px;font-weight:600;cursor:pointer;text-align:left">500ms → Running Pin</button>' +
    '<button id="cdDemo1500" class="tappable" style="padding:10px 14px;background:var(--cb-chalk-2);border:1px solid var(--cb-chalk-3);border-radius:8px;color:var(--cb-ink);font-size:13px;font-weight:600;cursor:pointer;text-align:left">1500ms → Scaffold + crossfade</button>' +
    '<button id="cdDemoSync" class="tappable" style="padding:10px 14px;background:var(--cb-chalk-2);border:1px solid var(--cb-chalk-3);border-radius:8px;color:var(--cb-ink);font-size:13px;font-weight:600;cursor:pointer;text-align:left">Sync ribbon → offline</button>' +
    '<div id="cdDemoStage" style="margin-top:10px;padding:14px;background:var(--cb-chalk);border:1px solid var(--cb-chalk-3);border-radius:10px;position:relative;min-height:80px"></div>';
  document.body.appendChild(panel);

  var stage = document.getElementById("cdDemoStage");

  function realContent() {
    return '<div class="data-stage">' +
      '<div style="font-family:var(--font-mono);font-size:10px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--cb-mute);margin-bottom:6px">TODAY</div>' +
      '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--cb-ink);line-height:1.2">Sample content</div>' +
      '<div style="font-size:13px;color:var(--cb-charcoal);margin-top:8px">This is the real data that appeared after loading resolved.</div>' +
    '</div>';
  }

  function runScenario(delayMs) {
    // Dispose any prior state object.
    if (stage._ls) { stage._ls.dispose(); stage._ls = null; }
    stage.innerHTML = "";
    var ls = createLoadingState({ showAt: 200, scaffoldAt: 700 });
    stage._ls = ls;
    ls.subscribe(function(s) {
      if (s === "none") {
        // nothing rendered until data arrives; noop during pending
      } else if (s === "pin") {
        stage.innerHTML = runningPin();
      } else if (s === "scaffold") {
        stage.innerHTML = breathPin() + skelHeader("LOADING · TODAY") + skelRow() + skelRow();
      }
    });
    ls.update(true);
    setTimeout(function() {
      ls.update(false);
      stage.innerHTML = realContent();
    }, delayMs);
  }

  document.getElementById("cdDemo150").addEventListener("click", function() { runScenario(150); });
  document.getElementById("cdDemo500").addEventListener("click", function() { runScenario(500); });
  document.getElementById("cdDemo1500").addEventListener("click", function() { runScenario(1500); });
  document.getElementById("cdDemoSync").addEventListener("click", function() {
    stage.innerHTML = syncRibbon("SYNCING · HOLE 14 · 2S");
    setTimeout(function() { stage.innerHTML = syncRibbon(null, true); }, 1800);
  });
}

function _cdDemoSync() {
  var existing = document.getElementById("chalkDryDemoPanel");
  if (window.location.hash === "#chalk-dry-demo") {
    if (!existing) _cdInitDemoPanel();
  } else if (existing) {
    if (existing._ls) existing._ls.dispose();
    existing.parentNode.removeChild(existing);
  }
}

if (typeof window !== "undefined") {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(_cdDemoSync, 0);
  } else {
    window.addEventListener("DOMContentLoaded", _cdDemoSync);
  }
  window.addEventListener("hashchange", _cdDemoSync);
}
