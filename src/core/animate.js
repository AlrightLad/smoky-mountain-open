/* ================================================
   PARBAUGHS ANIMATION UTILITIES
   rAF-based primitives. No dependencies. Reduced-motion aware.
   ================================================ */

// Respect user's motion preference — cached at module load
var _prefersReducedMotion = (function() {
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch(e) { return false; }
})();

// Update cache when user changes preference mid-session
try {
  if (window.matchMedia) {
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function(e) {
      _prefersReducedMotion = e.matches;
    });
  }
} catch(e) {}

// Ease-out cubic — preserves existing feel from router.js
function _easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animate a numeric value on an element.
 * Supports integers, decimals, negatives, and from-value.
 *
 * @param {HTMLElement} el - target element (uses textContent)
 * @param {number|string} target - final value
 * @param {object} opts
 * @param {number} opts.duration - ms (default 500)
 * @param {number} opts.from - start value (default 0)
 * @param {number} opts.decimals - decimal places (default 0, auto-detect from target if string like "18.8")
 * @param {string} opts.prefix - text before number (e.g., "+")
 * @param {string} opts.suffix - text after number (e.g., "%")
 * @param {function} opts.easing - easing function (t) => t (default easeOutCubic)
 * @param {function} opts.onComplete - callback when animation finishes
 */
function animateNumber(el, target, opts) {
  opts = opts || {};
  if (!el) return;

  // Parse target + auto-detect decimals
  var targetStr = String(target);
  var targetNum = parseFloat(targetStr);
  if (isNaN(targetNum)) return;

  var decimals = opts.decimals;
  if (decimals === undefined) {
    var dotIdx = targetStr.indexOf('.');
    decimals = dotIdx >= 0 ? (targetStr.length - dotIdx - 1) : 0;
  }

  var from = typeof opts.from === 'number' ? opts.from : 0;
  var duration = opts.duration || 500;
  var prefix = opts.prefix || '';
  var suffix = opts.suffix || '';
  var easing = opts.easing || _easeOutCubic;

  // Reduced-motion: snap to final value
  if (_prefersReducedMotion) {
    el.textContent = prefix + targetNum.toFixed(decimals) + suffix;
    if (opts.onComplete) opts.onComplete();
    return;
  }

  // Add will-change hint during animation
  el.style.willChange = 'contents';

  var startTime = null;
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    var eased = easing(progress);
    var current = from + (targetNum - from) * eased;
    el.textContent = prefix + current.toFixed(decimals) + suffix;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = prefix + targetNum.toFixed(decimals) + suffix;
      el.style.willChange = '';
      if (opts.onComplete) opts.onComplete();
    }
  }
  requestAnimationFrame(step);
}

/**
 * Initialize count animations on [data-count] elements.
 * Supports [data-count], [data-count-from], [data-count-decimals],
 * [data-count-prefix], [data-count-suffix] attributes.
 * Backwards-compatible with the existing [data-count] convention.
 */
function initCountAnimations(root) {
  root = root || document;
  var els = root.querySelectorAll('[data-count]');
  els.forEach(function(el) {
    if (el.dataset.countAnimated === '1') return; // idempotent
    var target = el.getAttribute('data-count');
    var from = el.getAttribute('data-count-from');
    var decimals = el.getAttribute('data-count-decimals');
    var prefix = el.getAttribute('data-count-prefix') || '';
    var suffix = el.getAttribute('data-count-suffix') || '';
    // Accessibility: announce count changes to screen readers
    if (!el.hasAttribute('aria-live')) {
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
    }
    animateNumber(el, target, {
      from: from !== null ? parseFloat(from) : 0,
      decimals: decimals !== null ? parseInt(decimals, 10) : undefined,
      prefix: prefix,
      suffix: suffix
    });
    el.dataset.countAnimated = '1';
  });
}

/**
 * Re-animate a specific element to a new target (for live updates).
 * Reads current value as "from" automatically unless opts.from provided.
 */
function reanimateNumber(el, newTarget, opts) {
  opts = opts || {};
  if (!el) return;
  if (opts.from === undefined) {
    opts.from = parseFloat(el.textContent.replace(/[^\-\d.]/g, '')) || 0;
  }
  el.setAttribute('data-count', newTarget);
  animateNumber(el, newTarget, opts);
}

/**
 * Check if reduced motion is currently preferred.
 * Use in application code to conditionally skip custom animations.
 */
function prefersReducedMotion() {
  return _prefersReducedMotion;
}

// Expose as globals for router.js + page code consumption
window.animateNumber = animateNumber;
window.initCountAnimations = initCountAnimations;
window.reanimateNumber = reanimateNumber;
window.prefersReducedMotion = prefersReducedMotion;
