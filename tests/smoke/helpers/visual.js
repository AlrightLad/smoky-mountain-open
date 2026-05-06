// tests/smoke/helpers/visual.js
// Visual-layer assertions + page-state snapshots for no-flash tests.
//
// P8 (locked Phase 7 / Ship 5+6): smoke must verify rendered visuals on
// engagement surfaces, not just data-layer writes. The S1.2 kudos heart
// regression (data-count namespace collision wiping child SVG via
// initCountAnimations textContent overwrite) shipped because no scenario
// asserted the heart icon was actually visible. P8 closes that gap.
//
// Three helpers:
//   - assertEngagementSurfaceVisible(page, opts) — kudos/comment-style btn
//     visibility, dimensions, color, child-node integrity, data contract
//   - capturePulse(page) — snapshot of fields that would change on a full
//     re-render (scrollY, greeting, masthead, kudos data attrs)
//   - assertPulseUnchanged(before, after, expectedDeltas) — diff helper
//     used by S23 to verify surgical engagement patches don't trigger a
//     full page re-render.

// ── P8 visual-layer assertion ──────────────────────────────────────────
// opts:
//   selector:         CSS selector for the engagement element (default
//                     '[data-action="kudos"]')
//   label:            human-readable name in error messages (default
//                     'kudos surface')
//   minSize:          minimum acceptable element dimension in px (default
//                     20). Comment-like hearts are smaller — pass 8.
//   requireSvg:       require <svg> child (default true). Kudos buttons
//                     use SVG; comment-like hearts use a glyph.
//   requireSpan:      require <span> label child (default true). False
//                     for span-only elements like comment-like hearts.
//   requireTextMatch: optional RegExp; element textContent must match.
//                     Used for glyph-based surfaces (♥, etc.) where the
//                     visible character is the asset at risk of being
//                     wiped by a textContent overwrite.
// Returns the probe object for follow-on assertions; throws on failure.
async function assertEngagementSurfaceVisible(page, opts) {
  opts = opts || {};
  var selector = opts.selector || '[data-action="kudos"]';
  var label = opts.label || 'kudos surface';
  var minSize = opts.minSize || 20;
  var requireSvg = opts.requireSvg !== false;
  var requireSpan = opts.requireSpan !== false;
  var textMatchSource = opts.requireTextMatch ? opts.requireTextMatch.source : null;
  var textMatchFlags = opts.requireTextMatch ? opts.requireTextMatch.flags : '';

  var probe = await page.evaluate(function(args) {
    var el = document.querySelector(args.selector);
    if (!el) return { found: false };
    var rect = el.getBoundingClientRect();
    var cs = getComputedStyle(el);
    var svg = el.querySelector('svg');
    var svgRect = svg ? svg.getBoundingClientRect() : null;
    var span = el.querySelector('span');
    var text = (el.textContent || '').trim();
    var textOk = true;
    if (args.textMatchSource) {
      try {
        var re = new RegExp(args.textMatchSource, args.textMatchFlags || '');
        textOk = re.test(text);
      } catch(e) { textOk = false; }
    }
    return {
      found: true,
      width: rect.width,
      height: rect.height,
      color: cs.color,
      hasSvg: !!svg,
      svgWidth: svgRect ? svgRect.width : 0,
      svgHeight: svgRect ? svgRect.height : 0,
      hasSpan: !!span,
      text: text,
      textOk: textOk,
      iLiked: el.getAttribute('data-i-liked'),
      likesCount: el.getAttribute('data-likes-count')
    };
  }, { selector: selector, textMatchSource: textMatchSource, textMatchFlags: textMatchFlags });

  if (!probe.found) {
    throw new Error(label + ' not in DOM (selector: ' + selector + ')');
  }
  if (!(probe.width > minSize && probe.height > minSize)) {
    throw new Error(label + ' rendered with sub-min dimensions: ' + probe.width.toFixed(1) + 'x' + probe.height.toFixed(1));
  }
  if (probe.color === 'rgba(0, 0, 0, 0)' || probe.color === 'transparent') {
    throw new Error(label + ' has transparent computed color');
  }
  if (requireSvg && !probe.hasSvg) {
    throw new Error(label + ' missing <svg> child — possible textContent wipe (animate.js collision regression)');
  }
  if (requireSvg && probe.hasSvg && !(probe.svgWidth > 0 && probe.svgHeight > 0)) {
    throw new Error(label + ' SVG has zero rendered size: ' + probe.svgWidth + 'x' + probe.svgHeight);
  }
  if (requireSpan && !probe.hasSpan) {
    throw new Error(label + ' missing <span> label child');
  }
  if (textMatchSource && !probe.textOk) {
    throw new Error(label + ' textContent "' + probe.text + '" did not match /' + textMatchSource + '/' + textMatchFlags + ' — possible textContent wipe');
  }
  if (probe.iLiked !== '0' && probe.iLiked !== '1') {
    throw new Error(label + ' data-i-liked malformed: "' + probe.iLiked + '"');
  }
  if (isNaN(parseInt(probe.likesCount, 10))) {
    throw new Error(label + ' data-likes-count malformed: "' + probe.likesCount + '"');
  }
  return probe;
}

// ── No-flash snapshot capture ──────────────────────────────────────────
// Returns a small JSON-safe object representing the visible page state
// for fields a full re-render would change but a surgical patch would
// preserve. Forgiving on mobile-bypass (returns empty strings rather
// than throwing); the caller decides how to handle missing chrome.
async function capturePulse(page) {
  return await page.evaluate(function() {
    // Greeting hero — no class hook; located via leading text content.
    var greeting = null;
    var divs = document.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
      var t = divs[i].textContent || '';
      if (t.indexOf('Welcome back,') === 0 && t.length < 200) {
        greeting = divs[i];
        break;
      }
    }
    var masthead = document.querySelector('.page-shell__masthead');
    var kudosBtn = document.querySelector('[data-action="kudos"]');
    return {
      scrollY: window.scrollY,
      greetingText: greeting ? greeting.innerText.trim() : '',
      mastheadHash: masthead ? masthead.outerHTML : '',
      mastheadLength: masthead ? masthead.outerHTML.length : 0,
      kudosILiked: kudosBtn ? kudosBtn.getAttribute('data-i-liked') : null,
      kudosLikesCount: kudosBtn ? parseInt(kudosBtn.getAttribute('data-likes-count') || '0', 10) : null,
      kudosOuterHTMLLength: kudosBtn ? kudosBtn.outerHTML.length : 0
    };
  });
}

// ── Pulse-diff assertion ───────────────────────────────────────────────
// expectedDeltas:
//   kudosCountDelta:   integer (default 0) — required count change
//   kudosLikedToggle:  boolean (default false) — whether data-i-liked
//                      should flip; when false, the value must match
// Throws Error with all mismatches concatenated; passes silently.
function assertPulseUnchanged(before, after, expectedDeltas) {
  expectedDeltas = expectedDeltas || {};
  var errs = [];

  if (before.scrollY !== after.scrollY) {
    errs.push('scrollY changed: ' + before.scrollY + ' → ' + after.scrollY);
  }
  if (before.greetingText !== after.greetingText) {
    errs.push('greetingText changed:\n      BEFORE: ' + JSON.stringify(before.greetingText) +
              '\n      AFTER:  ' + JSON.stringify(after.greetingText));
  }
  if (before.mastheadHash !== after.mastheadHash) {
    errs.push('masthead outerHTML changed (length ' + before.mastheadLength + ' → ' + after.mastheadLength + ')');
  }

  var expectedDelta = typeof expectedDeltas.kudosCountDelta === 'number' ? expectedDeltas.kudosCountDelta : 0;
  var actualDelta = (after.kudosLikesCount == null ? 0 : after.kudosLikesCount) -
                    (before.kudosLikesCount == null ? 0 : before.kudosLikesCount);
  if (actualDelta !== expectedDelta) {
    errs.push('kudos count delta mismatch: expected ' + expectedDelta + ', got ' + actualDelta);
  }
  if (expectedDeltas.kudosLikedToggle) {
    if (before.kudosILiked === after.kudosILiked) {
      errs.push('expected data-i-liked toggle but it stayed at "' + before.kudosILiked + '"');
    }
  } else {
    if (before.kudosILiked !== after.kudosILiked) {
      errs.push('unexpected data-i-liked toggle: "' + before.kudosILiked + '" → "' + after.kudosILiked + '"');
    }
  }

  if (errs.length) {
    throw new Error('pulse changed unexpectedly:\n  - ' + errs.join('\n  - '));
  }
}

module.exports = {
  assertEngagementSurfaceVisible: assertEngagementSurfaceVisible,
  capturePulse: capturePulse,
  assertPulseUnchanged: assertPulseUnchanged
};
