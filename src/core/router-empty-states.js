// Empty states + skeleton loaders + pull-to-refresh. Extracted per W1.A5.

// ========== SKELETON LOADING HELPERS ==========
function skeletonCard(lines) {
  var h = '<div class="skel-card">';
  for (var i = 0; i < (lines||3); i++) {
    var cls = i === 0 ? "short" : i === lines-1 ? "short" : "medium";
    h += '<div class="skeleton skel-line ' + cls + '" style="animation-delay:' + (i*0.1) + 's"></div>';
  }
  h += '</div>';
  return h;
}

function skeletonMemberRow() {
  return '<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)">' +
    '<div class="skeleton skel-circle"></div>' +
    '<div style="flex:1"><div class="skeleton skel-line short" style="margin-bottom:6px"></div><div class="skeleton skel-line medium"></div></div></div>';
}

function skeletonFeed() {
  var h = '';
  for (var i = 0; i < 4; i++) {
    h += '<div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;gap:10px">';
    h += '<div class="skeleton" style="width:32px;height:32px;border-radius:50%;flex-shrink:0"></div>';
    h += '<div style="flex:1"><div class="skeleton skel-line short" style="margin-bottom:8px"></div>';
    h += '<div class="skeleton skel-line medium"></div><div class="skeleton skel-line" style="width:40%;margin-top:6px"></div></div></div>';
  }
  return h;
}


// Number animation utilities moved to src/core/animate.js
// Global API: animateNumber, initCountAnimations, reanimateNumber, prefersReducedMotion


// ========== CONTEXTUAL EMPTY STATES ==========
var contextualEmptyStates = {
  rounds: {
    icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' width='28' height='28' style='color:var(--muted)'><path d='M6 21V4l11 3.5L6 11'/><path d='M3.5 21h7'/></svg>",
    text: "No rounds logged yet",
    sub: "Your first round earns 100 XP and the First Blood badge",
    action: "Play Now →",
    actionPage: "playnow"
  },
  teetimes: {
    icon: "",
    text: "No upcoming tee times",
    sub: "Post one and your crew gets notified instantly",
    action: "Post Tee Time →",
    actionPage: "tee-create"
  },
  scramble: {
    icon: "",
    text: "No scramble teams yet",
    sub: "Create a 2, 3, or 4-man team and start tracking W-L records",
    action: "Create Team →",
    actionPage: "scramble"
  },
  chat: {
    icon: "",
    text: "The clubhouse is quiet",
    sub: "Be the first to talk trash. Someone has to.",
    action: null
  },
  challenges: {
    icon: "",
    text: "No active challenges",
    sub: "Call someone out. Loser buys the post-round beers.",
    action: "New Challenge →",
    actionPage: "challenges"
  }
};

function renderContextualEmpty(type) {
  var config = contextualEmptyStates[type];
  if (!config) return '<div class="empty"><div class="empty-text">Nothing here yet</div></div>';
  var h = '<div class="empty" style="padding:28px 16px"><div class="empty-icon" style="font-size:28px;margin-bottom:8px">' + config.icon + '</div>';
  h += '<div class="empty-text" style="font-size:13px">' + config.text + '</div>';
  h += '<div style="font-size:10px;color:var(--muted2);margin-top:6px;line-height:1.5">' + config.sub + '</div>';
  if (config.action) {
    h += '<div style="margin-top:12px"><span style="font-size:11px;color:var(--gold);cursor:pointer;font-weight:600" onclick="Router.go(\'' + config.actionPage + '\')">' + config.action + '</span></div>';
  }
  h += '</div>';
  return h;
}

// renderLoadError(what, retryOnclick) — P10 actionable error state for a
// failed Firestore/network load. Distinct from renderContextualEmpty (an
// empty result is not a failure): an alert glyph + "Couldn't load {what}"
// names WHAT failed and WHERE, and the "Try again" button is the WHAT-ACTION.
// Reuses .empty/.empty-icon/.empty-text for centered layout. `what` must be
// a static literal (not user input — no escaping applied). `retryOnclick` is
// inlined into a double-quoted onclick attribute, so use single quotes inside
// (e.g. "Router.go('richlist', {}, true)").
function renderLoadError(what, retryOnclick) {
  var h = '<div class="empty" style="padding:20px 16px">';
  h += '<div class="empty-icon" style="margin-bottom:6px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="24" height="24" style="color:var(--muted)"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg></div>';
  h += '<div class="empty-text" style="font-size:12px">Couldn’t load ' + what + '</div>';
  h += '<div style="font-size:10px;color:var(--muted2);margin-top:4px">Something went wrong on our end.</div>';
  if (retryOnclick) {
    h += '<button onclick="' + retryOnclick + '" style="margin-top:12px;min-height:44px;padding:10px 20px;background:rgba(var(--gold-rgb),.1);border:1px solid rgba(var(--gold-rgb),.25);color:var(--gold);border-radius:var(--radius);font-size:12px;font-weight:600;cursor:pointer">Try again</button>';
  }
  h += '</div>';
  return h;
}


// ========== PULL TO REFRESH ==========
(function() {
  var startY = 0;
  var pulling = false;
  var triggered = false;
  var threshold = 140;
  var indicator = null;
  
  document.addEventListener("touchstart", function(e) {
    // Skip pull-to-refresh when interacting with form elements
    var tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") { pulling = false; return; }
    if (window.scrollY <= 0 && e.touches.length === 1) {
      // Check if touch is inside a scrollable container that isn't at top
      var el = e.target;
      var insideScrollable = false;
      while (el && el !== document.body) {
        if (el.scrollHeight > el.clientHeight + 2) {
          var style = window.getComputedStyle(el);
          var overflow = style.overflowY;
          if (overflow === "auto" || overflow === "scroll") {
            if (el.scrollTop > 0) {
              // User is scrolling inside a container that has content above — don't pull-to-refresh
              insideScrollable = true;
              break;
            }
          }
        }
        el = el.parentElement;
      }
      if (insideScrollable) { pulling = false; return; }
      startY = e.touches[0].clientY;
      pulling = true;
      triggered = false;
      indicator = document.getElementById("ptrIndicator");
    }
  }, { passive: true });
  
  document.addEventListener("touchmove", function(e) {
    if (!pulling || !indicator || triggered) return;
    var diff = e.touches[0].clientY - startY;
    if (diff > 0 && window.scrollY <= 0) {
      var progress = Math.min(diff / threshold, 1);
      indicator.style.top = (-44 + (56 * progress)) + "px";
      indicator.style.opacity = progress;
      indicator.querySelector("svg").style.transform = "rotate(" + (progress * 360) + "deg)";
      
      if (progress >= 1 && !triggered) {
        triggered = true;
        indicator.style.top = "14px";
        indicator.style.opacity = "1";
        indicator.querySelector("svg").style.animation = "spin .6s linear infinite";
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(15);
        setTimeout(function() { window.location.reload(); }, 400);
      }
    } else if (diff <= 0) {
      pulling = false;
      indicator.style.top = "-44px";
      indicator.style.opacity = "0";
    }
  }, { passive: true });
  
  document.addEventListener("touchend", function() {
    if (!pulling || !indicator || triggered) { pulling = false; return; }
    indicator.style.top = "-44px";
    indicator.style.opacity = "0";
    indicator.querySelector("svg").style.transform = "rotate(0deg)";
    pulling = false;
  }, { passive: true });
})();


