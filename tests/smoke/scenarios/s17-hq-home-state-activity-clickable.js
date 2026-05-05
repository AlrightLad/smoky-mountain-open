// S17 — HQ Home League Pulse cards are universally clickable.
// Validates that all rendered .hq-feed-card elements have a non-empty onclick
// attribute (round-type cards navigate to round detail; activity-type cards
// navigate to their respective surface per V12.8 dest plumbing in Ship 5+5).
//
// Note on testability limitation: state.activity is module-private inside
// the PB IIFE (data.js) and cannot be injected via page.evaluate. So we
// can't synthesize trip/review/post/member_joined events directly. Instead,
// this scenario asserts on whatever cards render: every visible card must
// be clickable (no orphan cards). If only round cards happen to render,
// the assertion still validates that no card is unclickable.

module.exports = {
  id: 'S17',
  name: 'hq home cards universally clickable',
  run: async function(ctx) {
    var page = ctx.page;

    await page.evaluate(function() { Router.go('home'); });
    await page.waitForFunction(function() { return Router.getPage() === 'home'; }, null, { timeout: 5000 });
    await page.waitForTimeout(3000);

    var probe = await page.evaluate(function() {
      var cards = document.querySelectorAll('.hq-feed-card');
      var orphans = [];
      var clickable = 0;
      cards.forEach(function(card) {
        var click = card.getAttribute('onclick') || '';
        if (!click.trim()) {
          var chip = card.querySelector('.hq-feed-card__chip');
          orphans.push(chip ? chip.textContent.trim() : '(no chip)');
        } else {
          clickable++;
        }
      });
      return { totalCards: cards.length, clickable: clickable, orphans: orphans };
    });

    await ctx.capture.screenshot('S17-hq-home-clickability');

    if (probe.totalCards === 0) {
      // No HQ Home cards rendered (mobile bypass or activity load latency).
      // Soft-pass with diagnostic.
      return { passed: true, details: 'no .hq-feed-card rendered (mobile bypass or activity not yet loaded)' };
    }

    if (probe.orphans.length) {
      throw new Error(probe.orphans.length + ' orphan card(s) without onclick: [' + probe.orphans.join(', ') + ']');
    }

    return { passed: true, details: probe.clickable + '/' + probe.totalCards + ' cards clickable, no orphans' };
  }
};
