// tests/smoke/helpers/project-guard.js
//
// Rounds engagement scenarios (S13/S14/S15/S16/S23/S25/S26) seed test rounds
// via the Firebase Admin SDK (scripts/.service-account.json) and then assert
// against what the BROWSER sees. That only works when the admin service account
// and the web app point at the SAME Firebase project.
//
// Today they don't: the web app is hardcoded to the production project
// (parbaughs, src/core/firebase.js) while the committed service account is for
// parbaughs-staging. Admin-seeded rounds land in staging; the browser reads
// production; the seed is invisible to the page and the scenario reports a
// spurious failure that has nothing to do with the member-facing code.
//
// roundsSeedGuard() detects that pairing and lets the scenario soft-pass (skip)
// with an actionable diagnostic instead of failing. It self-heals: the moment a
// production-matching admin SA is in place, the projects match and the
// scenarios run for real. See task-queue/founder/smoke-rounds-production-sa.md.

const seedRounds = require('../setup/seed-rounds.js');

var FOUNDER_DOC = 'task-queue/founder/smoke-rounds-production-sa.md';

// projectId the browser's Firebase app was initialized with, or null if it
// can't be read. projectId is public client config (already in
// src/core/firebase.js) — never a secret.
async function browserProjectId(page) {
  return page.evaluate(function() {
    try {
      if (window.firebase && typeof firebase.app === 'function') {
        var opts = firebase.app().options;
        if (opts && opts.projectId) return opts.projectId;
      }
    } catch (e) {}
    try {
      if (typeof db !== 'undefined' && db && db._databaseId && db._databaseId.projectId) {
        return db._databaseId.projectId;
      }
    } catch (e) {}
    return null;
  });
}

// Returns a skip result ({ passed: true, skipped: true, details }) when the
// admin SA project can't be matched to the browser's web-app project, or null
// when the scenario is safe to proceed.
async function roundsSeedGuard(page) {
  var adminProject = seedRounds.getProjectId();
  if (!adminProject) {
    return {
      passed: true,
      skipped: true,
      details: 'SKIPPED — no admin service account available (scripts/.service-account.json absent/unreadable). ' +
               'Rounds engagement scenarios seed via the Admin SDK. See ' + FOUNDER_DOC
    };
  }
  var browserProject = await browserProjectId(page);
  if (browserProject && adminProject !== browserProject) {
    return {
      passed: true,
      skipped: true,
      details: 'SKIPPED — admin SA project "' + adminProject + '" != web app project "' + browserProject + '". ' +
               'Admin-seeded rounds are written to a different Firebase project than the browser reads, so the seed ' +
               'is invisible to the page. A production-matching admin SA is required. See ' + FOUNDER_DOC
    };
  }
  return null;
}

module.exports = {
  browserProjectId: browserProjectId,
  roundsSeedGuard: roundsSeedGuard
};
