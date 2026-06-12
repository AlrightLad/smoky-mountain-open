// S33 — regression guards for the 2026-06-12 fix wave (v8.25.5-.10). Pure
// client-logic, no emulator/seed/visual needed. Locks in three Founder-reported
// fixes so they can't silently regress:
//   1. Theme picker shows all 6 themes (3 ready + 3 locked teasers).
//   2. Caddie roster is 4 voices and "Birdie" is wired across beats.
//   3. Scramble-team derivation counts a course+date only when EVERY member
//      shares a scramble round there (real team scramble, no cross-team bleed).
module.exports = {
  id: 'S33',
  name: 'fix-wave regression — 6 themes / 4 caddies / scramble all-members derivation',
  run: async function (ctx) {
    var page = ctx.page;
    var r = await page.evaluate(function () {
      var out = { fails: [] };

      // 1. Themes — all six visible (unlocked user sees 3 default + 3 locked).
      if (typeof getAvailableThemes === 'function') {
        var themes = getAvailableThemes([]);
        out.themeCount = themes.length;
        out.lockedCount = themes.filter(function (t) { return t.locked; }).length;
        if (themes.length !== 6) out.fails.push('themes != 6 (' + themes.length + ')');
        if (out.lockedCount !== 3) out.fails.push('locked themes != 3 (' + out.lockedCount + ')');
      } else { out.fails.push('getAvailableThemes missing'); }

      // 2. Caddies — four voices, Birdie wired across beats.
      if (window.pbCaddies && window.pbVoices) {
        out.caddieCount = window.pbCaddies.length;
        if (window.pbCaddies.length !== 4) out.fails.push('caddies != 4 (' + window.pbCaddies.length + ')');
        var hasBirdie = window.pbCaddies.some(function (c) { return c.id === 'birdie'; });
        if (!hasBirdie) out.fails.push('Birdie missing from roster');
        var fl = window.pbVoices.line('frame', 'birdie');
        var wn = window.pbVoices.line('win', 'birdie');
        if (!fl || !wn) out.fails.push('Birdie voice line(s) empty (frame/win)');
      } else { out.fails.push('pbCaddies/pbVoices missing'); }

      // 3. Scramble derivation — all-members-present, no bleed.
      if (typeof _deriveTeamScrambleRounds === 'function' && typeof PB !== 'undefined' && PB.setRoundsFromFirestore && PB.getRounds) {
        var saved = PB.getRounds().slice();
        try {
          var sc = function (id, p) { return { id: id, player: p, course: 'Derive Test GC', date: '2026-02-02', score: 77, holesPlayed: 18, format: 'scramble' }; };
          PB.setRoundsFromFirestore([sc('dr1', 'dm1'), sc('dr2', 'dm2'), sc('dr3', 'dm3')]);
          var fullTeam = _deriveTeamScrambleRounds({ members: ['dm1', 'dm2', 'dm3'] });
          var partialTeam = _deriveTeamScrambleRounds({ members: ['dm1', 'dm2', 'dm_absent'] });
          out.fullDerived = fullTeam.length;     // expect 1 (all three present)
          out.partialDerived = partialTeam.length; // expect 0 (dm_absent has no round → no bleed)
          if (fullTeam.length !== 1) out.fails.push('all-members team should derive 1, got ' + fullTeam.length);
          if (partialTeam.length !== 0) out.fails.push('partial team should derive 0 (no bleed), got ' + partialTeam.length);
        } finally {
          PB.setRoundsFromFirestore(saved);
        }
      } else { out.fails.push('_deriveTeamScrambleRounds/PB missing'); }

      return out;
    });
    if (r.fails && r.fails.length) throw new Error(r.fails.join(' | '));
    return { passed: true, details: 'themes=6 (3 locked) · caddies=4 (Birdie wired) · scramble derive: all-members=1, partial=0 (no bleed)' };
  }
};
