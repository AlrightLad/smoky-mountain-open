// ========== W1.I5 — CRISIS BANNER SYSTEM ==========
//
// 3-tier member-visible banner controlled via Firestore `platform_announcements` doc.
// Tiers (highest severity first):
//   - CRITICAL: red, full-width top banner; requires Founder dismissal; reload-persistent
//   - ALERT:    amber, full-width top banner; auto-clears on resolution doc update
//   - NOTICE:   blue, dismissible per session via `pb_crisis_dismissed` localStorage
//
// Storage: `platform_announcements/active` Firestore doc — { tier, message, link, link_label, updated_at, updated_by }
// Empty doc OR doc with tier='none' = no banner.
//
// Activation paths:
//   - Founder via admin UI: write the doc through `setBannerTier(tier, message)`
//   - Emergency via Admin SDK script: `scripts/admin/set-crisis-banner.js` (if admin UI is broken)
//
// Per locked W1.I5 governance: orchestration team can deactivate ALERT/NOTICE
// autonomously; CRITICAL requires Founder.

(function() {
  if (typeof db === 'undefined' || !db) return;

  var BANNER_ID = 'pb-crisis-banner';
  var DISMISS_KEY = 'pb_crisis_dismissed';
  var listenerUnsub = null;

  function tierStyles(tier) {
    var styles = {
      CRITICAL: { bg: '#8E2A2A', color: '#fff', iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
      ALERT:    { bg: '#A67034', color: '#fff', iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
      NOTICE:   { bg: '#3A5A78', color: '#fff', iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' }
    };
    return styles[tier] || null;
  }

  function getDismissKey(bannerDoc) {
    // Dismiss is per-banner-update (so updates re-show even if previously dismissed)
    return DISMISS_KEY + ':' + (bannerDoc.updated_at ? bannerDoc.updated_at.toMillis ? bannerDoc.updated_at.toMillis() : bannerDoc.updated_at : '');
  }

  function isDismissed(bannerDoc) {
    try {
      return sessionStorage.getItem(getDismissKey(bannerDoc)) === '1';
    } catch (e) { return false; }
  }

  function dismiss(bannerDoc) {
    try {
      sessionStorage.setItem(getDismissKey(bannerDoc), '1');
    } catch (e) {}
    hideBanner();
  }

  function hideBanner() {
    var el = document.getElementById(BANNER_ID);
    if (el) el.remove();
    document.body.style.paddingTop = '';
  }

  function showBanner(bannerDoc) {
    var tier = (bannerDoc.tier || '').toUpperCase();
    if (!tier || tier === 'NONE') {
      hideBanner();
      return;
    }
    var styles = tierStyles(tier);
    if (!styles) {
      hideBanner();
      return;
    }
    // NOTICE: respect dismissal
    if (tier === 'NOTICE' && isDismissed(bannerDoc)) {
      hideBanner();
      return;
    }
    // ALERT: respect dismissal too (per-session)
    if (tier === 'ALERT' && isDismissed(bannerDoc)) {
      hideBanner();
      return;
    }
    // CRITICAL: NEVER dismissible by member — only Founder via setBannerTier('none')

    var existing = document.getElementById(BANNER_ID);
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.id = BANNER_ID;
    el.setAttribute('role', 'alert');
    el.style.cssText = [
      'position:fixed',
      'top:0', 'left:0', 'right:0',
      'z-index:10000',
      'padding:10px 14px',
      'background:' + styles.bg,
      'color:' + styles.color,
      'font-family:Inter,sans-serif',
      'font-size:13px',
      'line-height:1.4',
      'box-shadow:0 2px 8px rgba(0,0,0,0.18)',
      'display:flex',
      'align-items:center',
      'gap:10px'
    ].join(';');

    var iconEl = document.createElement('span');
    iconEl.innerHTML = styles.iconSvg;
    iconEl.style.cssText = 'flex-shrink:0;width:18px;display:flex;align-items:center;justify-content:center';
    el.appendChild(iconEl);

    var tierEl = document.createElement('span');
    tierEl.textContent = tier;
    tierEl.style.cssText = 'font-weight:700;letter-spacing:0.06em;flex-shrink:0';
    el.appendChild(tierEl);

    var msgEl = document.createElement('span');
    msgEl.textContent = bannerDoc.message || '';
    msgEl.style.cssText = 'flex:1;min-width:0';
    el.appendChild(msgEl);

    if (bannerDoc.link && bannerDoc.link_label) {
      var linkEl = document.createElement('a');
      linkEl.href = bannerDoc.link;
      linkEl.textContent = bannerDoc.link_label;
      linkEl.style.cssText = 'color:inherit;text-decoration:underline;flex-shrink:0';
      el.appendChild(linkEl);
    }

    // Dismiss button (NOT shown for CRITICAL)
    if (tier !== 'CRITICAL') {
      var dismissBtn = document.createElement('button');
      dismissBtn.type = 'button';
      dismissBtn.setAttribute('aria-label', 'Dismiss this banner');
      dismissBtn.textContent = '×';
      dismissBtn.style.cssText = 'background:rgba(255,255,255,0.18);color:inherit;border:none;border-radius:4px;width:28px;height:28px;font-size:16px;cursor:pointer;flex-shrink:0';
      dismissBtn.addEventListener('click', function() { dismiss(bannerDoc); });
      el.appendChild(dismissBtn);
    }

    document.body.appendChild(el);
    // Push page content down so banner doesn't cover it
    setTimeout(function() {
      var bannerH = el.offsetHeight;
      document.body.style.paddingTop = bannerH + 'px';
    }, 50);
  }

  function attachListener() {
    if (listenerUnsub) listenerUnsub();
    listenerUnsub = db.collection('platform_announcements').doc('active').onSnapshot(
      function(snap) {
        if (!snap.exists) { hideBanner(); return; }
        showBanner(snap.data());
      },
      function(err) {
        if (typeof pbWarn === 'function') pbWarn('[crisis-banner] listener error:', err.message);
      }
    );
  }

  // Founder-only API to set tier (called from admin UI)
  window.setCrisisBanner = function(tier, message, link, linkLabel) {
    if (!db || !currentUser) return Promise.reject(new Error('Not signed in'));
    var validTiers = ['none', 'NOTICE', 'ALERT', 'CRITICAL'];
    if (validTiers.indexOf(tier) === -1) {
      return Promise.reject(new Error('Invalid tier: ' + tier));
    }
    return db.collection('platform_announcements').doc('active').set({
      tier: tier,
      message: message || '',
      link: link || null,
      link_label: linkLabel || null,
      updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_by: currentUser.uid
    });
  };

  // Attach listener once Firebase is ready + user signed in.
  // Some pages don't need it (login/onboarding) — gate on currentUser.
  function tryAttach() {
    if (db && currentUser) {
      attachListener();
    } else {
      // Retry every 2s for up to 30s
      var attempts = 0;
      var iv = setInterval(function() {
        if (db && currentUser) {
          clearInterval(iv);
          attachListener();
        } else if (++attempts > 15) {
          clearInterval(iv);
        }
      }, 2000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryAttach);
  } else {
    tryAttach();
  }
})();
