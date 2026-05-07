// S25 — Round detail "Manage round" section visibility tiers (Ship 5+7).
//
// v8.22.0 Phase 4 introduced the grouped Manage section on round detail
// with 3-tier visibility:
//   - Author    → eyebrow + Edit + Delete
//   - Founder   → eyebrow + Delete only (not author)
//   - Spectator → entire section hidden
//
// This scenario validates the author + spectator tiers via dual-seed:
// one round owned by the smoke account (author tier from smoke's view),
// one owned by SMOKE_OTHER_UID (spectator tier from smoke's view).
//
// Founder tier requires a separate Auth account with founder role —
// out of scope for unattended smoke. The two-tier check covers the
// author guard + the spectator hide, which are the load-bearing cases.
//
// P8 visual assertions: Edit + Delete buttons render with non-zero size,
// non-transparent computed color, and intact <svg> child glyphs.

const seedRounds = require('../setup/seed-rounds.js');
const SMOKE_UID = require('../setup/seed-notifications.js').SMOKE_UID;

module.exports = {
  id: 'S25',
  name: 'round detail manage section visibility tiers',
  setup: async function() {
    await seedRounds.clearSmokeRounds();
    // Author-tier round: owned by the smoke account itself
    var authorId = await seedRounds.insertSmokeRound({
      player: SMOKE_UID,
      playerName: '[TEST] Smoke',
      course: 'S25 Author Course',
      score: 75
    });
    // Spectator-tier round: owned by the synthetic non-smoke UID
    var spectatorId = await seedRounds.insertSmokeRound({
      // player defaults to SMOKE_OTHER_UID via the helper's opts.player fallback
      course: 'S25 Spectator Course',
      score: 80
    });
    module.exports.__authorRoundId = authorId;
    module.exports.__spectatorRoundId = spectatorId;
  },
  run: async function(ctx) {
    var page = ctx.page;
    var authorId = module.exports.__authorRoundId;
    var spectatorId = module.exports.__spectatorRoundId;
    if (!authorId || !spectatorId) throw new Error('seed did not record round IDs');

    // Wait for db + currentUser ready (renderRoundDetail reads currentProfile/currentUser)
    await page.waitForFunction(function() {
      return typeof db !== 'undefined' && db && typeof currentUser !== 'undefined' && currentUser;
    }, null, { timeout: 15000 });

    // Deterministic readiness — wait until BOTH seeded rounds are in
    // PB.getRounds(). renderRoundDetail looks rounds up via PB.getRounds().find;
    // if the snapshot listener hasn't populated yet, the handler redirects
    // back to the list with no Manage section, and the assertions below
    // (looking for the Manage eyebrow) would fail with a misleading message.
    await page.waitForFunction(function(args) {
      if (typeof PB === 'undefined' || !PB.getRounds) return false;
      var rounds = PB.getRounds();
      return rounds.some(function(r) { return r.id === args.aId; })
          && rounds.some(function(r) { return r.id === args.sId; });
    }, { aId: authorId, sId: spectatorId }, { timeout: 15000 });

    // ── Tier A: Author (smoke account viewing own round) ───────────
    await page.evaluate(function(rid) { Router.go('rounds', { roundId: rid }); }, authorId);
    await page.waitForFunction(function() { return Router.getPage() === 'rounds'; }, null, { timeout: 5000 });
    await page.waitForTimeout(500);

    var authorProbe = await page.evaluate(function() {
      var pageEl = document.querySelector('[data-page="rounds"]');
      if (!pageEl) return { found: false };

      // The Manage section eyebrow contains the literal "Manage round"
      // text (CSS uppercase styling doesn't change DOM textContent).
      var allDivs = pageEl.querySelectorAll('div');
      var manageEyebrow = null;
      for (var i = 0; i < allDivs.length; i++) {
        if (allDivs[i].textContent.trim() === 'Manage round') { manageEyebrow = allDivs[i]; break; }
      }

      // Edit + Delete buttons in the Manage section. Edit identified by
      // its onclick to /rounds?action=edit; Delete identified by its
      // onclick toggling #del-confirm display.
      var editBtn = null, deleteBtn = null;
      var btns = pageEl.querySelectorAll('button');
      btns.forEach(function(b) {
        var oc = b.getAttribute('onclick') || '';
        if (oc.indexOf("action:'edit'") !== -1) editBtn = b;
        if (oc.indexOf("'del-confirm'") !== -1 && oc.indexOf("'block'") !== -1) deleteBtn = b;
      });

      function buttonProbe(btn) {
        if (!btn) return null;
        var rect = btn.getBoundingClientRect();
        var cs = getComputedStyle(btn);
        var svg = btn.querySelector('svg');
        var svgRect = svg ? svg.getBoundingClientRect() : null;
        return {
          width: rect.width,
          height: rect.height,
          color: cs.color,
          hasSvg: !!svg,
          svgWidth: svgRect ? svgRect.width : 0,
          svgHeight: svgRect ? svgRect.height : 0,
          text: btn.textContent.trim()
        };
      }

      return {
        found: true,
        hasEyebrow: !!manageEyebrow,
        edit: buttonProbe(editBtn),
        del: buttonProbe(deleteBtn)
      };
    });

    await ctx.capture.screenshot('S25-author-tier');

    if (!authorProbe.found) throw new Error('[data-page="rounds"] absent on author detail render');
    if (!authorProbe.hasEyebrow) {
      throw new Error('author tier: "Manage round" eyebrow not in DOM (section hidden when it should show)');
    }
    if (!authorProbe.edit) throw new Error('author tier: Edit button missing');
    if (!authorProbe.del)  throw new Error('author tier: Delete button missing');

    // P8 visual integrity — both buttons must render with size, color,
    // and intact <svg> glyph children. Catches the data-count-style
    // regression class plus CSS-layout issues that could collapse them.
    function assertManageButton(probe, label) {
      if (!(probe.width > 20 && probe.height > 20)) {
        throw new Error('author tier ' + label + ': sub-min dimensions ' + probe.width.toFixed(1) + 'x' + probe.height.toFixed(1));
      }
      if (probe.color === 'rgba(0, 0, 0, 0)' || probe.color === 'transparent') {
        throw new Error('author tier ' + label + ': transparent computed color');
      }
      if (!probe.hasSvg) {
        throw new Error('author tier ' + label + ': missing <svg> glyph child');
      }
      if (!(probe.svgWidth > 0 && probe.svgHeight > 0)) {
        throw new Error('author tier ' + label + ': SVG rendered at zero size ' + probe.svgWidth + 'x' + probe.svgHeight);
      }
    }
    assertManageButton(authorProbe.edit, 'Edit button');
    assertManageButton(authorProbe.del, 'Delete button');

    if (authorProbe.edit.text.indexOf('Edit round') === -1) {
      throw new Error('author tier Edit button text mismatch: "' + authorProbe.edit.text + '"');
    }
    if (authorProbe.del.text.indexOf('Delete round') === -1) {
      throw new Error('author tier Delete button text mismatch: "' + authorProbe.del.text + '"');
    }

    // ── Tier B: Spectator (smoke account viewing other-owned round) ─
    await page.evaluate(function(rid) { Router.go('rounds', { roundId: rid }); }, spectatorId);
    await page.waitForFunction(function() { return Router.getPage() === 'rounds'; }, null, { timeout: 5000 });
    await page.waitForTimeout(500);

    var spectatorProbe = await page.evaluate(function() {
      var pageEl = document.querySelector('[data-page="rounds"]');
      if (!pageEl) return { found: false };
      var allDivs = pageEl.querySelectorAll('div');
      var manageEyebrow = null;
      for (var i = 0; i < allDivs.length; i++) {
        if (allDivs[i].textContent.trim() === 'Manage round') { manageEyebrow = allDivs[i]; break; }
      }
      var editBtn = null, deleteBtn = null;
      var btns = pageEl.querySelectorAll('button');
      btns.forEach(function(b) {
        var oc = b.getAttribute('onclick') || '';
        if (oc.indexOf("action:'edit'") !== -1) editBtn = b;
        if (oc.indexOf("'del-confirm'") !== -1 && oc.indexOf("'block'") !== -1) deleteBtn = b;
      });
      return {
        found: true,
        hasEyebrow: !!manageEyebrow,
        hasEdit: !!editBtn,
        hasDelete: !!deleteBtn
      };
    });

    await ctx.capture.screenshot('S25-spectator-tier');

    if (!spectatorProbe.found) throw new Error('[data-page="rounds"] absent on spectator detail render');
    if (spectatorProbe.hasEyebrow) {
      throw new Error('spectator tier: "Manage round" eyebrow found (section should be hidden)');
    }
    if (spectatorProbe.hasEdit) {
      throw new Error('spectator tier: Edit button found (should be hidden)');
    }
    if (spectatorProbe.hasDelete) {
      throw new Error('spectator tier: Delete button found (should be hidden)');
    }

    return {
      passed: true,
      details: 'author tier: eyebrow + Edit + Delete + glyph integrity OK; spectator tier: section absent (' +
               'rounds: author=' + authorId + ', spectator=' + spectatorId + ')'
    };
  }
};
