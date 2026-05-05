// Navigation helpers — wait for app boot, route changes, etc.

async function waitForAppBoot(page, timeoutMs) {
  timeoutMs = timeoutMs || 15000;
  await page.waitForFunction(function() {
    return typeof window.APP_VERSION === 'string'
        && typeof window.Router !== 'undefined'
        && typeof window.Router.go === 'function';
  }, null, { timeout: timeoutMs });
}

async function gotoPage(page, route, params) {
  await page.evaluate(function(args) {
    window.Router.go(args.route, args.params || {});
  }, { route: route, params: params || {} });
  await page.waitForFunction(function(expected) {
    return window.Router.getPage() === expected;
  }, route, { timeout: 5000 });
}

async function readVersion(page) {
  return await page.evaluate(function() { return window.APP_VERSION; });
}

// Wait until liveNotifications contains a specific title. Tolerant of extras
// (stale items from prior scenarios) — only requires the named one to exist.
// More resilient than length-based waits across browsers with variable
// Firestore snapshot replication speed (especially webkit).
async function waitForNotifByTitle(page, title, timeoutMs) {
  return page.waitForFunction(function(t) {
    var list = window.liveNotifications;
    if (!Array.isArray(list)) return false;
    return list.some(function(n) { return n && n.title === t; });
  }, title, { timeout: timeoutMs || 30000 });
}

// Convenience: wait for ALL named titles to be present in liveNotifications.
async function waitForAllNotifTitles(page, titles, timeoutMs) {
  return page.waitForFunction(function(args) {
    var list = window.liveNotifications;
    if (!Array.isArray(list)) return false;
    return args.titles.every(function(t) {
      return list.some(function(n) { return n && n.title === t; });
    });
  }, { titles: titles }, { timeout: timeoutMs || 30000 });
}

// Reset client-side notification cache + close panel + return to home.
// Call at the start of any scenario that depends on fresh panel state —
// readHistory persists across panel toggles per R1 (only cleared on logout).
async function resetNotifClientState(page) {
  await page.evaluate(function() {
    if (Array.isArray(window.readHistory)) window.readHistory.length = 0;
    if (typeof window.readHistoryCursor !== 'undefined') window.readHistoryCursor = null;
    if (window._readHistoryObserver) {
      window._readHistoryObserver.disconnect();
      window._readHistoryObserver = null;
    }
    if (typeof window.closeNotifPanel === 'function') window.closeNotifPanel();
    if (typeof window.Router !== 'undefined' && Router.getPage() !== 'home') Router.go('home');
  });
  await page.waitForFunction(function() {
    return typeof Router !== 'undefined' && Router.getPage() === 'home' && window.notifPanelOpen !== true;
  }, null, { timeout: 5000 });
}

// Open the notification panel and wait for items to render. Returns once
// at least one .notif-item or the empty-state element is in the DOM.
async function openPanelAndWaitForRender(page) {
  await page.click('#notifBell');
  await page.waitForFunction(function() { return window.notifPanelOpen === true; }, null, { timeout: 5000 });
  // Wait for at least one notif-item OR the empty-state node
  await page.waitForFunction(function() {
    return document.querySelectorAll('.notif-item').length > 0
        || !!document.querySelector('#notifList .empty');
  }, null, { timeout: 5000 });
}

// Click the inner clickable div of a notification (the one with handleNotifClick
// onclick). Clicking the .notif-item wrapper itself is a no-op because the
// onclick is on its child div, not the wrapper. Returns true if found+clicked.
async function clickNotificationByText(page, textMatch) {
  return await page.evaluate(function(label) {
    var items = document.querySelectorAll('.notif-item');
    for (var j = 0; j < items.length; j++) {
      if (items[j].textContent.indexOf(label) !== -1) {
        var inner = items[j].querySelector('div[onclick*="handleNotifClick"]');
        if (inner) { inner.click(); return true; }
      }
    }
    return false;
  }, textMatch);
}

// Click the X (dismiss) child of a notification matching textMatch.
async function dismissNotificationByText(page, textMatch) {
  return await page.evaluate(function(label) {
    var items = document.querySelectorAll('.notif-item');
    for (var j = 0; j < items.length; j++) {
      if (items[j].textContent.indexOf(label) !== -1) {
        var children = items[j].querySelectorAll('div');
        for (var k = 0; k < children.length; k++) {
          if (children[k].textContent.trim() === '×') { children[k].click(); return true; }
        }
      }
    }
    return false;
  }, textMatch);
}

module.exports = {
  waitForAppBoot: waitForAppBoot,
  gotoPage: gotoPage,
  readVersion: readVersion,
  waitForNotifByTitle: waitForNotifByTitle,
  waitForAllNotifTitles: waitForAllNotifTitles,
  resetNotifClientState: resetNotifClientState,
  openPanelAndWaitForRender: openPanelAndWaitForRender,
  clickNotificationByText: clickNotificationByText,
  dismissNotificationByText: dismissNotificationByText
};
