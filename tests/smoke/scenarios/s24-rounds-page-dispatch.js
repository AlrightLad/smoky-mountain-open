// S24 — Rounds page list view + new-form route dispatch (Ship 5+7).
//
// v8.22.0 Phase 2 consolidated the Rounds page from "redirect to Activity"
// to a multi-mode dispatch:
//   /rounds            → renderRoundsList
//   /rounds?action=new → renderRoundNewForm
//   /rounds?roundId=X  → renderRoundDetail (existing)
// This scenario validates the two new modes render their expected
// surfaces. Pure DOM probes — no Firestore writes.
//
// P8 visual assertions: handicap box + CTA button + form inputs render
// with non-zero size and non-transparent color.

const visual = require('../helpers/visual.js');

module.exports = {
  id: 'S24',
  name: 'rounds page dispatch — list + new-form modes',
  run: async function(ctx) {
    var page = ctx.page;

    // ── Mode 1: list view (no params) ──────────────────────────────
    await page.evaluate(function() { Router.go('rounds'); });
    await page.waitForFunction(function() { return Router.getPage() === 'rounds'; }, null, { timeout: 5000 });
    await page.waitForTimeout(800);

    var listProbe = await page.evaluate(function() {
      var pageEl = document.querySelector('[data-page="rounds"]');
      if (!pageEl) return { found: false };
      var hcapBox = pageEl.querySelector('.hcap-box');
      // The "+ Log a round" CTA is the only `.btn-sm.green` whose onclick
      // routes to /rounds?action=new.
      var ctaBtn = null;
      var btns = pageEl.querySelectorAll('button');
      btns.forEach(function(b) {
        var oc = b.getAttribute('onclick') || '';
        if (oc.indexOf("Router.go('rounds',{action:'new'})") !== -1) ctaBtn = b;
      });
      var hcapRect = hcapBox ? hcapBox.getBoundingClientRect() : null;
      var ctaRect = ctaBtn ? ctaBtn.getBoundingClientRect() : null;
      var ctaCs = ctaBtn ? getComputedStyle(ctaBtn) : null;
      return {
        found: true,
        hasHcapBox: !!hcapBox,
        hcapW: hcapRect ? hcapRect.width : 0,
        hcapH: hcapRect ? hcapRect.height : 0,
        hasCta: !!ctaBtn,
        ctaText: ctaBtn ? ctaBtn.textContent.trim() : '',
        ctaW: ctaRect ? ctaRect.width : 0,
        ctaH: ctaRect ? ctaRect.height : 0,
        ctaColor: ctaCs ? ctaCs.color : ''
      };
    });

    await ctx.capture.screenshot('S24-list-view');

    if (!listProbe.found) throw new Error('[data-page="rounds"] element absent on list view');
    if (!listProbe.hasHcapBox) throw new Error('list view missing .hcap-box (handicap header)');
    if (!(listProbe.hcapW > 0 && listProbe.hcapH > 0)) {
      throw new Error('handicap box rendered with zero size: ' + listProbe.hcapW + 'x' + listProbe.hcapH);
    }
    if (!listProbe.hasCta) throw new Error('list view missing "+ Log a round" CTA');
    if (listProbe.ctaText.indexOf('Log a round') === -1) {
      throw new Error('CTA text mismatch: "' + listProbe.ctaText + '" (expected to contain "Log a round")');
    }
    if (!(listProbe.ctaW > 20 && listProbe.ctaH > 20)) {
      throw new Error('CTA rendered with sub-min dimensions: ' + listProbe.ctaW + 'x' + listProbe.ctaH);
    }
    if (listProbe.ctaColor === 'rgba(0, 0, 0, 0)' || listProbe.ctaColor === 'transparent') {
      throw new Error('CTA has transparent computed color');
    }

    // ── Mode 2: new-form view (action=new) ─────────────────────────
    await page.evaluate(function() { Router.go('rounds', { action: 'new' }); });
    // Page name is still 'rounds'; the dispatch branches on params.action.
    // Wait for form-input mount as the readiness signal.
    await page.waitForFunction(function() {
      return document.getElementById('rf-course') !== null
          && document.getElementById('rf-format') !== null
          && document.getElementById('rf-date') !== null;
    }, null, { timeout: 5000 });
    await page.waitForTimeout(200);

    var formProbe = await page.evaluate(function() {
      var requiredInputs = ['rf-course', 'rf-format', 'rf-holes', 'rf-date', 'rf-rating', 'rf-slope', 'rf-photo'];
      var missing = requiredInputs.filter(function(id) { return !document.getElementById(id); });
      var hbhSection = document.getElementById('rf-hbh-section');
      // Submit button is the only btn.full.green calling submitRound() in
      // create mode (edit mode calls submitRoundEdit and reads "Save changes").
      var submitBtn = null;
      var btns = document.querySelectorAll('button');
      btns.forEach(function(b) {
        var oc = b.getAttribute('onclick') || '';
        if (oc === 'submitRound()') submitBtn = b;
      });
      var courseInput = document.getElementById('rf-course');
      var courseRect = courseInput ? courseInput.getBoundingClientRect() : null;
      var submitRect = submitBtn ? submitBtn.getBoundingClientRect() : null;
      return {
        missing: missing,
        hasHbhSection: !!hbhSection,
        hasSubmit: !!submitBtn,
        submitText: submitBtn ? submitBtn.textContent.trim() : '',
        courseW: courseRect ? courseRect.width : 0,
        courseH: courseRect ? courseRect.height : 0,
        submitW: submitRect ? submitRect.width : 0,
        submitH: submitRect ? submitRect.height : 0
      };
    });

    await ctx.capture.screenshot('S24-new-form');

    if (formProbe.missing.length > 0) {
      throw new Error('new-form view missing inputs: ' + formProbe.missing.join(', '));
    }
    if (!formProbe.hasHbhSection) throw new Error('new-form missing #rf-hbh-section (hole grid mount point)');
    if (!formProbe.hasSubmit) throw new Error('new-form missing submitRound() button');
    if (formProbe.submitText.indexOf('Log round') === -1) {
      throw new Error('submit text mismatch: "' + formProbe.submitText + '" (expected to contain "Log round")');
    }
    if (!(formProbe.courseW > 0 && formProbe.courseH > 0)) {
      throw new Error('course input rendered with zero size: ' + formProbe.courseW + 'x' + formProbe.courseH);
    }
    if (!(formProbe.submitW > 20 && formProbe.submitH > 20)) {
      throw new Error('submit button rendered with sub-min dimensions: ' + formProbe.submitW + 'x' + formProbe.submitH);
    }

    return {
      passed: true,
      details: 'list view OK (.hcap-box + CTA wired); new-form OK (' + (7 - formProbe.missing.length) + '/7 inputs + submit + hole-grid mount)'
    };
  }
};
