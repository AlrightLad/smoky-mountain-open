/* ═══════════════════════════════════════════════════════════════════════════
   BOTTOM SHEET — single reusable component atom (v8.3.1, Ship 0b-i)
   Three size variants: compact (auto / max 40dvh), half (60dvh), full (92dvh).
   Stacks to max 2 deep (form + confirmation). No production adoption yet —
   this file is the foundation. Future ships wire specific flows.
   ═══════════════════════════════════════════════════════════════════════════ */

var _bsStack = [];           // open sheets, oldest → newest. Max 2 deep.
var _bsNextId = 1;
var _bsSavedBodyOverflow = null;
var _bsKeydownAttached = false;

function _bsTop() { return _bsStack.length ? _bsStack[_bsStack.length - 1] : null; }

function isSheetOpen(sheetId) {
  if (sheetId == null) return _bsStack.length > 0;
  for (var i = 0; i < _bsStack.length; i++) if (_bsStack[i].id === sheetId) return true;
  return false;
}

function openBottomSheet(opts) {
  opts = opts || {};
  if (_bsStack.length >= 2) {
    if (typeof console !== "undefined") console.warn("[BottomSheet] Max 2 sheets stacked — third request ignored.");
    return null;
  }

  var sheet = {
    id: _bsNextId++,
    size: opts.size || "half",
    title: opts.title || "",
    content: opts.content != null ? opts.content : "",
    dismissible: opts.dismissible !== false,
    primaryAction: opts.primaryAction || null,
    onDismiss: opts.onDismiss || null,
    onOpen: opts.onOpen || null,
    onCloseClick: opts.onCloseClick || null,
    el: null,
    backdrop: null,
    dragStartY: 0, dragLastY: 0, dragLastT: 0,
    dragging: false, dragVelocity: 0,
    vvListener: null
  };

  _bsBuildDOM(sheet);
  _bsStack.push(sheet);

  // Lock body scroll on first sheet; restore on last close.
  if (_bsStack.length === 1) {
    _bsSavedBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  // When a second sheet opens, dim the first.
  if (_bsStack.length === 2) {
    var first = _bsStack[0];
    if (first.el) first.el.setAttribute("data-stacked-below", "true");
  }

  // Global ESC listener — attach once.
  if (!_bsKeydownAttached) {
    document.addEventListener("keydown", _bsOnKeydown);
    _bsKeydownAttached = true;
  }

  // rAF so the browser paints the initial translated-down state, THEN transitions.
  requestAnimationFrame(function() {
    sheet.backdrop.setAttribute("data-open", "true");
    sheet.el.setAttribute("data-open", "true");
    if (sheet.onOpen) setTimeout(sheet.onOpen, 340);
  });

  return sheet.id;
}

function closeBottomSheet(sheetId) {
  var idx = -1;
  if (sheetId == null) {
    idx = _bsStack.length - 1;
  } else {
    for (var i = 0; i < _bsStack.length; i++) {
      if (_bsStack[i].id === sheetId) { idx = i; break; }
    }
  }
  if (idx === -1) return;

  var sheet = _bsStack[idx];

  // Restore CSS-driven transition + strip any inline transform from drag.
  if (sheet.el) {
    sheet.el.style.transition = "";
    sheet.el.style.transform = "";
    sheet.el.removeAttribute("data-open");
  }
  if (sheet.backdrop) sheet.backdrop.setAttribute("data-dismissing", "true");

  // If a sheet below exists and we're closing the top one, un-dim it.
  if (idx > 0) {
    var prior = _bsStack[idx - 1];
    if (prior.el) prior.el.removeAttribute("data-stacked-below");
  }

  // Tear down visualViewport listener if this sheet had one.
  if (sheet.vvListener && window.visualViewport) {
    window.visualViewport.removeEventListener("resize", sheet.vvListener);
    sheet.vvListener = null;
  }

  setTimeout(function() {
    if (sheet.el && sheet.el.parentNode) sheet.el.parentNode.removeChild(sheet.el);
    if (sheet.backdrop && sheet.backdrop.parentNode) sheet.backdrop.parentNode.removeChild(sheet.backdrop);
  }, 320);

  _bsStack.splice(idx, 1);

  // Restore body scroll on last close; detach ESC listener.
  if (_bsStack.length === 0) {
    document.body.style.overflow = _bsSavedBodyOverflow || "";
    _bsSavedBodyOverflow = null;
    if (_bsKeydownAttached) {
      document.removeEventListener("keydown", _bsOnKeydown);
      _bsKeydownAttached = false;
    }
  }

  if (sheet.onDismiss) sheet.onDismiss();
}

function _bsOnKeydown(e) {
  if (e.key !== "Escape") return;
  var top = _bsTop();
  if (!top || !top.dismissible) return;
  closeBottomSheet(top.id);
}

function _bsBuildDOM(sheet) {
  // Backdrop
  var backdrop = document.createElement("div");
  backdrop.className = "bs-backdrop";
  backdrop.addEventListener("click", function() {
    // Full sheets never dismiss via backdrop (even when dismissible=true).
    if (sheet.size === "full") return;
    if (!sheet.dismissible) return;
    closeBottomSheet(sheet.id);
  });
  document.body.appendChild(backdrop);
  sheet.backdrop = backdrop;

  // Sheet shell
  var el = document.createElement("div");
  el.className = "bs-sheet";
  el.setAttribute("data-size", sheet.size);
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  if (sheet.title) el.setAttribute("aria-label", sheet.title);

  // Drag handle (always present)
  var handle = document.createElement("div");
  handle.className = "bs-handle";
  handle.setAttribute("aria-hidden", "true");
  el.appendChild(handle);

  // Header — rendered when title OR full-size (close button) OR primaryAction present.
  var showHeader = !!sheet.title || sheet.size === "full" || !!sheet.primaryAction;
  var headerEl = null;
  if (showHeader) {
    headerEl = document.createElement("div");
    headerEl.className = "bs-header";

    var titleEl = document.createElement("div");
    titleEl.className = "bs-title";
    titleEl.textContent = sheet.title || "";
    headerEl.appendChild(titleEl);

    var rightWrap = document.createElement("div");
    rightWrap.className = "bs-header-actions";

    if (sheet.primaryAction) {
      var primary = document.createElement("button");
      primary.className = "bs-primary-action tappable tappable--primary";
      primary.textContent = sheet.primaryAction.label || "Save";
      primary.addEventListener("click", function() {
        if (sheet.primaryAction.onClick) sheet.primaryAction.onClick(sheet.id);
      });
      rightWrap.appendChild(primary);
    }

    if (sheet.size === "full") {
      var closeBtn = document.createElement("button");
      closeBtn.className = "bs-close tappable";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      closeBtn.addEventListener("click", function() {
        if (sheet.onCloseClick) sheet.onCloseClick(sheet.id);
        else closeBottomSheet(sheet.id);
      });
      rightWrap.appendChild(closeBtn);
    }

    headerEl.appendChild(rightWrap);
    el.appendChild(headerEl);
  }

  // Body
  var body = document.createElement("div");
  body.className = "bs-body";
  if (typeof sheet.content === "string") {
    body.innerHTML = sheet.content;
  } else if (sheet.content && sheet.content.nodeType) {
    body.appendChild(sheet.content);
  }
  el.appendChild(body);

  // Drag handlers on handle + header (if header exists).
  _bsWireDrag(sheet, handle);
  if (headerEl) _bsWireDrag(sheet, headerEl);

  // visualViewport keyboard handling for Full sheets.
  if (sheet.size === "full") _bsWireKeyboard(sheet, body);

  document.body.appendChild(el);
  sheet.el = el;
}

function _bsWireDrag(sheet, targetEl) {
  if (!sheet.dismissible) return;

  targetEl.addEventListener("touchstart", function(e) {
    if (e.touches.length !== 1) return;
    e.stopPropagation(); // block document-level PTR listener
    sheet.dragging = true;
    sheet.dragStartY = e.touches[0].clientY;
    sheet.dragLastY = sheet.dragStartY;
    sheet.dragLastT = Date.now();
    sheet.dragVelocity = 0;
    sheet.el.style.transition = "none";
  }, { passive: true });

  targetEl.addEventListener("touchmove", function(e) {
    if (!sheet.dragging) return;
    e.stopPropagation();
    var y = e.touches[0].clientY;
    var dy = y - sheet.dragStartY;
    var now = Date.now();
    var dt = Math.max(1, now - sheet.dragLastT);
    sheet.dragVelocity = (y - sheet.dragLastY) / dt * 1000;
    sheet.dragLastY = y;
    sheet.dragLastT = now;

    if (dy > 0) {
      sheet.el.style.transform = "translate(-50%, " + dy + "px)";
    } else {
      // rubber band upward
      sheet.el.style.transform = "translate(-50%, " + (dy * 0.3) + "px)";
    }
  }, { passive: true });

  targetEl.addEventListener("touchend", function(e) {
    if (!sheet.dragging) return;
    e.stopPropagation();
    sheet.dragging = false;

    var dy = sheet.dragLastY - sheet.dragStartY;
    var height = sheet.el.getBoundingClientRect().height || 1;
    var threshold = height * 0.2;

    if (dy > threshold || sheet.dragVelocity > 500) {
      // Dismiss — closeBottomSheet resets transition + transform and removes data-open.
      closeBottomSheet(sheet.id);
    } else {
      // Snap back — restore CSS transition; data-open state keeps sheet at 0.
      sheet.el.style.transition = "";
      sheet.el.style.transform = "";
    }
  }, { passive: true });
}

function _bsWireKeyboard(sheet, bodyEl) {
  if (!window.visualViewport) return;
  var listener = function() {
    var vvH = window.visualViewport.height;
    var winH = window.innerHeight;
    var keyboardUp = vvH < (winH - 100);
    if (keyboardUp) {
      sheet.el.setAttribute("data-keyboard-open", "true");
      var active = document.activeElement;
      if (active && bodyEl.contains(active)) {
        setTimeout(function() {
          try { active.scrollIntoView({ block: "center", behavior: "smooth" }); } catch(err) {}
        }, 50);
      }
    } else {
      sheet.el.removeAttribute("data-keyboard-open");
    }
  };
  window.visualViewport.addEventListener("resize", listener);
  sheet.vvListener = listener;
}

/* ── Demo page ────────────────────────────────────────────────────────────
   Accessible only via #bs-demo URL hash. NOT wired into navigation.
   Renders a floating dev panel with buttons that exercise each sheet size
   plus the stacked confirmation pattern. Intended for manual QA + future
   debugging. Hidden the moment the hash changes away from #bs-demo. */

function _bsInitDemoPanel() {
  if (document.getElementById("bsDemoPanel")) return;
  var panel = document.createElement("div");
  panel.id = "bsDemoPanel";
  panel.style.cssText = "position:fixed;top:20px;right:20px;z-index:1500;background:var(--cb-chalk);border:1px solid var(--cb-chalk-3);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);min-width:220px";
  panel.innerHTML =
    '<div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--cb-ink)">Bottom Sheet Demo</div>' +
    '<div style="font-size:10px;color:var(--cb-mute);margin-bottom:6px">v8.3.1 · dev only (#bs-demo)</div>' +
    '<button id="bsDemoCompact" class="tappable" style="padding:10px 14px;background:var(--cb-chalk-2);border:1px solid var(--cb-chalk-3);border-radius:8px;color:var(--cb-ink);font-size:13px;font-weight:600;cursor:pointer;text-align:left">Compact · Finish?</button>' +
    '<button id="bsDemoHalf" class="tappable" style="padding:10px 14px;background:var(--cb-chalk-2);border:1px solid var(--cb-chalk-3);border-radius:8px;color:var(--cb-ink);font-size:13px;font-weight:600;cursor:pointer;text-align:left">Half · Round detail</button>' +
    '<button id="bsDemoFull" class="tappable" style="padding:10px 14px;background:var(--cb-chalk-2);border:1px solid var(--cb-chalk-3);border-radius:8px;color:var(--cb-ink);font-size:13px;font-weight:600;cursor:pointer;text-align:left">Full · Add course</button>' +
    '<button id="bsDemoStacked" class="tappable" style="padding:10px 14px;background:var(--cb-chalk-2);border:1px solid var(--cb-chalk-3);border-radius:8px;color:var(--cb-ink);font-size:13px;font-weight:600;cursor:pointer;text-align:left">Full + stacked confirm</button>';
  document.body.appendChild(panel);

  document.getElementById("bsDemoCompact").addEventListener("click", function() {
    openBottomSheet({
      size: "compact",
      title: "Finish round?",
      content:
        '<div style="font-size:14px;color:var(--cb-charcoal);line-height:1.5;padding-top:8px">Your scores will be saved and the round posted to your league.</div>' +
        '<div style="display:flex;gap:8px;margin-top:16px">' +
          '<button id="bsDemoCompactCancel" class="tappable" style="flex:1;padding:12px;background:transparent;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;color:var(--cb-ink);cursor:pointer">Cancel</button>' +
          '<button id="bsDemoCompactConfirm" class="tappable tappable--primary" style="flex:1;padding:12px;background:var(--cb-brass);border:none;border-radius:8px;font-size:14px;font-weight:600;color:var(--cb-ink);cursor:pointer">Finish</button>' +
        '</div>'
    });
    setTimeout(function() {
      var btnCancel = document.getElementById("bsDemoCompactCancel");
      var btnConfirm = document.getElementById("bsDemoCompactConfirm");
      if (btnCancel) btnCancel.addEventListener("click", function() { closeBottomSheet(); });
      if (btnConfirm) btnConfirm.addEventListener("click", function() { closeBottomSheet(); });
    }, 50);
  });

  document.getElementById("bsDemoHalf").addEventListener("click", function() {
    var body = "";
    for (var i = 0; i < 14; i++) {
      body += '<p style="font-size:13px;line-height:1.6;color:var(--cb-charcoal);margin-bottom:12px">Sample scrolling content line ' + (i + 1) + ' — a round detail view could render scores, hole-by-hole dots, and caddie notes in this area.</p>';
    }
    openBottomSheet({ size: "half", title: "Round detail", content: body });
  });

  document.getElementById("bsDemoFull").addEventListener("click", function() {
    var formHTML =
      '<div style="padding-top:8px;display:flex;flex-direction:column;gap:12px">' +
        '<label style="font-size:12px;color:var(--cb-mute);letter-spacing:.3px">Course name</label>' +
        '<input type="text" placeholder="e.g. Augusta National" style="padding:12px 14px;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;font-family:var(--font-ui)">' +
        '<label style="font-size:12px;color:var(--cb-mute);letter-spacing:.3px">Location</label>' +
        '<input type="text" placeholder="e.g. Augusta, GA" style="padding:12px 14px;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;font-family:var(--font-ui)">' +
        '<label style="font-size:12px;color:var(--cb-mute);letter-spacing:.3px">Par</label>' +
        '<input type="number" placeholder="72" style="padding:12px 14px;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;font-family:var(--font-ui)">' +
      '</div>';
    openBottomSheet({
      size: "full",
      title: "Add course",
      content: formHTML,
      primaryAction: { label: "Save", onClick: function(id) { closeBottomSheet(id); } }
    });
  });

  document.getElementById("bsDemoStacked").addEventListener("click", function() {
    var formId = openBottomSheet({
      size: "full",
      title: "Add course",
      dismissible: false,
      content:
        '<div style="padding-top:8px"><input type="text" placeholder="Course name" style="width:100%;padding:12px 14px;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;font-family:var(--font-ui)"></div>' +
        '<div style="margin-top:16px;font-size:12px;color:var(--cb-mute)">Close X asks to discard.</div>',
      primaryAction: { label: "Save", onClick: function(id) { closeBottomSheet(id); } },
      onCloseClick: function(id) {
        openBottomSheet({
          size: "compact",
          title: "Discard changes?",
          content:
            '<div style="font-size:14px;color:var(--cb-charcoal);line-height:1.5;padding-top:8px">You have unsaved changes. Are you sure you want to leave?</div>' +
            '<div style="display:flex;gap:8px;margin-top:16px">' +
              '<button id="bsStackKeep" class="tappable" style="flex:1;padding:12px;background:transparent;border:1px solid var(--cb-chalk-3);border-radius:8px;font-size:14px;color:var(--cb-ink);cursor:pointer">Keep editing</button>' +
              '<button id="bsStackDiscard" class="tappable tappable--primary" style="flex:1;padding:12px;background:var(--cb-claret);border:none;border-radius:8px;font-size:14px;font-weight:600;color:#fff;cursor:pointer">Discard</button>' +
            '</div>'
        });
        setTimeout(function() {
          var bKeep = document.getElementById("bsStackKeep");
          var bDiscard = document.getElementById("bsStackDiscard");
          if (bKeep) bKeep.addEventListener("click", function() { closeBottomSheet(); });
          if (bDiscard) bDiscard.addEventListener("click", function() {
            closeBottomSheet();          // close confirmation
            closeBottomSheet(formId);    // then close the form
          });
        }, 50);
      }
    });
  });
}

function _bsDemoSync() {
  var existing = document.getElementById("bsDemoPanel");
  if (window.location.hash === "#bs-demo") {
    if (!existing) _bsInitDemoPanel();
  } else if (existing) {
    existing.parentNode.removeChild(existing);
  }
}

if (typeof window !== "undefined") {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(_bsDemoSync, 0);
  } else {
    window.addEventListener("DOMContentLoaded", _bsDemoSync);
  }
  window.addEventListener("hashchange", _bsDemoSync);
}
