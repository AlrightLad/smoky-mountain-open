// S32 — rounds dedup regression guard (v8.25.5 P0). The Founder-reported 7-0
// rivalry was duplicate rounds in client state (the league migration regenerated
// trip rounds under new ids). setRoundsFromFirestore now dedups by round id AND
// by content signature (player|normCourse|date|score|holes|format). This locks
// that in so the "MASSIVE ISSUE" can't silently regress.
//
// Pure client-logic test: calls PB.setRoundsFromFirestore with a dup-laden array,
// asserts the collapse, then RESTORES the real rounds (no state pollution for
// later scenarios, no Firestore/prod write — setRoundsFromFirestore only mutates
// in-memory state.rounds).
module.exports = {
  id: 'S32',
  name: 'rounds dedup — setRoundsFromFirestore collapses id + content duplicates (P0 regression guard)',
  run: async function (ctx) {
    var page = ctx.page;
    var r = await page.evaluate(function () {
      var out = {};
      if (typeof PB === 'undefined' || !PB.setRoundsFromFirestore || !PB.getRounds) { out.missing = true; return out; }
      var saved = PB.getRounds().slice();
      out.savedCount = saved.length;
      var base = { player: 'sd_px', course: 'Smoke Dedup GC', date: '2026-01-01', score: 90, holesPlayed: 18, format: 'stroke' };
      var r1 = Object.assign({ id: 'sd_t1' }, base);
      var r1IdDup = Object.assign({ id: 'sd_t1' }, base);          // same id  -> dedup by id
      var r1ContentDup = Object.assign({ id: 'sd_t1b' }, base);    // new id, same content -> dedup by signature
      var r2 = Object.assign({}, base, { id: 'sd_t2', course: 'Other Smoke GC', date: '2026-01-02', score: 85 });
      try {
        PB.setRoundsFromFirestore([r1, r1IdDup, r1ContentDup, r2]);
        var got = PB.getRounds();
        out.dedupCount = got.length;
        out.ids = got.map(function (x) { return x.id; }).sort().join(',');
      } finally {
        PB.setRoundsFromFirestore(saved); // restore the real rounds
        out.restoredCount = PB.getRounds().length;
      }
      return out;
    });
    if (r.missing) throw new Error('PB.setRoundsFromFirestore/getRounds missing from bundle');
    var fails = [];
    if (r.dedupCount !== 2) fails.push('expected 2 deduped rounds, got ' + r.dedupCount + ' (ids: ' + r.ids + ')');
    if (r.restoredCount !== r.savedCount) fails.push('real rounds not restored (' + r.restoredCount + ' vs saved ' + r.savedCount + ')');
    if (fails.length) throw new Error(fails.join(' | '));
    return { passed: true, details: 'dedup: 4 in (1 id-dup + 1 content-dup) -> 2 out; real rounds restored (' + r.savedCount + ')' };
  }
};
