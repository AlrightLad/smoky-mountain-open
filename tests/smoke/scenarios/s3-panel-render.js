// S3 — Notification panel render with seeded data across 8 cluster types.
// Validates: notification-types.js + cluster icon rendering + meta wiring.

const seed = require('../setup/seed-notifications.js');

module.exports = {
  id: 'S3',
  name: 'panel render with 8 cluster icons',
  setup: async function() {
    await seed.clearForSmoke();
    // One notification per cluster (social, dm, coins, league, round, tee, admin, misc).
    await seed.insertForSmoke([
      { type: 'feed_like',       title: 'S3 social',  message: 'kudos test',          page: 'chat',     read: false, createdAt: seed.tsAgo(60) },
      { type: 'dm',              title: 'S3 dm',      message: 'dm test',             page: 'dms',      read: false, createdAt: seed.tsAgo(120) },
      { type: 'wager_challenge', title: 'S3 coins',   message: 'wager test',          page: 'wagers',   read: false, createdAt: seed.tsAgo(180) },
      { type: 'league_request',  title: 'S3 league',  message: 'league test',         page: 'leagues',  read: false, createdAt: seed.tsAgo(240) },
      { type: 'round_posted',    title: 'S3 round',   message: 'round test',          page: 'feed',     read: false, createdAt: seed.tsAgo(300) },
      { type: 'tee_posted',      title: 'S3 tee',     message: 'tee test',            page: 'teetimes', read: false, createdAt: seed.tsAgo(360) },
      { type: 'suspension',      title: 'S3 admin',   message: 'admin test',          page: 'admin',    read: false, createdAt: seed.tsAgo(420) },
      { type: 'welcome',         title: 'S3 misc',    message: 'misc test',           page: 'home',     read: false, createdAt: seed.tsAgo(480) }
    ]);
  },
  run: async function(ctx) {
    var page = ctx.page;
    var nav = require('../helpers/navigation.js');
    await nav.resetNotifClientState(page);
    // Wait for ALL 8 cluster items so the panel renders the full set
    await nav.waitForAllNotifTitles(page, [
      'S3 social', 'S3 dm', 'S3 coins', 'S3 league',
      'S3 round', 'S3 tee', 'S3 admin', 'S3 misc'
    ]);

    // Open the panel
    await page.click('#notifBell');
    await page.waitForFunction(function() { return window.notifPanelOpen === true; }, null, { timeout: 3000 });

    // Wait for items to render
    await page.waitForFunction(function() {
      return document.querySelectorAll('.notif-item').length >= 8;
    }, null, { timeout: 5000 });

    await ctx.capture.screenshot('S3-panel-with-clusters');

    var stats = await page.evaluate(function() {
      var items = document.querySelectorAll('.notif-item');
      var icons = document.querySelectorAll('.notif-item-icon');
      var clusterClasses = {};
      icons.forEach(function(el) {
        var classes = el.className.split(/\s+/);
        classes.forEach(function(c) {
          if (c.indexOf('notif-item-icon--') === 0) {
            clusterClasses[c] = (clusterClasses[c] || 0) + 1;
          }
        });
      });
      return {
        itemCount: items.length,
        iconCount: icons.length,
        clusters: clusterClasses
      };
    });

    if (stats.iconCount < 8) {
      throw new Error('Expected >=8 .notif-item-icon nodes, found ' + stats.iconCount);
    }
    var distinctClusters = Object.keys(stats.clusters).length;
    if (distinctClusters < 6) {
      throw new Error('Expected >=6 distinct cluster classes, found ' + distinctClusters + ': ' + JSON.stringify(stats.clusters));
    }
    return { passed: true, details: stats.iconCount + ' icons / ' + distinctClusters + ' distinct clusters' };
  }
};
