// Synthetic rounds for the Playwright E2E suite.
// Reproduces the v7.6.5 bug class: founding members have rounds split
// between the pre-claim seed id (e.g. "testzach") and the post-claim Firebase
// UID (e.g. "test_zach_uid_01"). getPlayerRounds() must merge both.

const LEAGUE_01 = 'test-league-01';
const LEAGUE_02 = 'test-league-02';
const HOLE_PARS_18 = [4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4]; // par 72 dummy
const HOLE_PARS_9  = [4,4,4,4,4,4,4,4,4];                    // par 36 dummy

let _seq = 0;
function mk(r) {
  _seq++;
  return Object.assign({
    id: 'testrnd_' + _seq.toString(36),
    leagueId: LEAGUE_01,
    format: 'stroke',
    notes: '',
    highlights: [],
    blunders: [],
    visibility: 'public',
    timestamp: Date.now() - _seq * 60000,
    createdAt: Date.now() - _seq * 60000,
    holePars: r.holesPlayed === 9 ? HOLE_PARS_9 : HOLE_PARS_18,
  }, r);
}

const rounds = [
  // ── testZach: 4 old-seed + 1 new-UID ────────────────────────────────
  mk({ player: 'testzach',          playerName: 'testZach', course: 'Test Course A', score: 98,  date: '2026-04-11', rating: 68.4, slope: 121, format: 'stableford', holesPlayed: 18 }),
  mk({ player: 'testzach',          playerName: 'testZach', course: 'Test Course B', score: 100, date: '2026-04-10', rating: 69.1, slope: 129, format: 'stableford', holesPlayed: 18 }),
  mk({ player: 'testzach',          playerName: 'testZach', course: 'Test Course C', score: 102, date: '2026-04-10', rating: 70.3, slope: 126, format: 'stableford', holesPlayed: 18 }),
  mk({ player: 'testzach',          playerName: 'testZach', course: 'Test Course D', score: 77,  date: '2026-04-09', rating: 67.5, slope: 130, format: 'scramble',  holesPlayed: 18 }),
  mk({ player: 'test_zach_uid_01',  playerName: 'testZach', course: 'Test Course E', score: 44,  date: '2026-04-08', rating: 34.2, slope: 119, format: 'stroke',    holesPlayed: 9  }),

  // ── testNick: 5 old-seed + 1 new-UID (2 nine-holes matches production) ─
  mk({ player: 'testnick',          playerName: 'testNick', course: 'Test Course A', score: 130, date: '2026-04-11', rating: 68.4, slope: 121, format: 'stroke', holesPlayed: 18 }),
  mk({ player: 'testnick',          playerName: 'testNick', course: 'Test Course B', score: 132, date: '2026-04-10', rating: 69.1, slope: 129, format: 'stroke', holesPlayed: 18 }),
  mk({ player: 'testnick',          playerName: 'testNick', course: 'Test Course C', score: 128, date: '2026-04-10', rating: 70.3, slope: 126, format: 'stroke', holesPlayed: 18 }),
  mk({ player: 'testnick',          playerName: 'testNick', course: 'Test Course D', score: 77,  date: '2026-04-09', rating: 67.5, slope: 130, format: 'scramble', holesPlayed: 18 }),
  mk({ player: 'testnick',          playerName: 'testNick', course: 'Test Course F', score: 57,  date: '2026-04-08', rating: 34.2, slope: 119, format: 'stroke', holesPlayed: 9  }),
  mk({ player: 'test_nick_uid_01',  playerName: 'testNick', course: 'Test Course G', score: 56,  date: '2026-04-07', rating: 34.0, slope: 118, format: 'stroke', holesPlayed: 9  }),

  // ── testKayvan: 5 old-seed + 1 new-UID ───────────────────────────────
  mk({ player: 'testkayvan',          playerName: 'testKayvan', course: 'Test Course A', score: 110, date: '2026-04-11', rating: 68.4, slope: 121, format: 'stroke',   holesPlayed: 18 }),
  mk({ player: 'testkayvan',          playerName: 'testKayvan', course: 'Test Course B', score: 110, date: '2026-04-10', rating: 69.1, slope: 129, format: 'stroke',   holesPlayed: 18 }),
  mk({ player: 'testkayvan',          playerName: 'testKayvan', course: 'Test Course C', score: 112, date: '2026-04-10', rating: 70.3, slope: 126, format: 'stroke',   holesPlayed: 18 }),
  mk({ player: 'testkayvan',          playerName: 'testKayvan', course: 'Test Course A', score: 107, date: '2026-04-09', rating: 68.4, slope: 121, format: 'stroke',   holesPlayed: 18 }),
  mk({ player: 'testkayvan',          playerName: 'testKayvan', course: 'Test Course D', score: 77,  date: '2026-04-09', rating: 67.5, slope: 130, format: 'scramble', holesPlayed: 18 }),
  mk({ player: 'test_kayvan_uid_01',  playerName: 'testKayvan', course: 'Test Course F', score: 48,  date: '2026-04-08', rating: 34.2, slope: 119, format: 'stroke',   holesPlayed: 9  }),

  // ── testKiyan: 4 old-seed + 1 new-UID ────────────────────────────────
  mk({ player: 'testkiyan',          playerName: 'testKiyan', course: 'Test Course A', score: 102, date: '2026-04-11', rating: 68.4, slope: 121, format: 'stroke',   holesPlayed: 18 }),
  mk({ player: 'testkiyan',          playerName: 'testKiyan', course: 'Test Course B', score: 108, date: '2026-04-10', rating: 69.1, slope: 129, format: 'stroke',   holesPlayed: 18 }),
  mk({ player: 'testkiyan',          playerName: 'testKiyan', course: 'Test Course C', score: 124, date: '2026-04-10', rating: 70.3, slope: 126, format: 'stroke',   holesPlayed: 18 }),
  mk({ player: 'testkiyan',          playerName: 'testKiyan', course: 'Test Course D', score: 77,  date: '2026-04-09', rating: 67.5, slope: 130, format: 'scramble', holesPlayed: 18 }),
  mk({ player: 'test_kiyan_uid_01',  playerName: 'testKiyan', course: 'Test Course F', score: 47,  date: '2026-04-08', rating: 34.2, slope: 119, format: 'stroke',   holesPlayed: 9  }),

  // ── scenarioOnlyNineHole: 3 × 9-hole stroke ──────────────────────────
  mk({ player: 'test_scen_9h_01', playerName: 'scenarioOnlyNineHole', course: 'Test Course H', score: 48, date: '2026-04-11', rating: 34.0, slope: 118, format: 'stroke', holesPlayed: 9 }),
  mk({ player: 'test_scen_9h_01', playerName: 'scenarioOnlyNineHole', course: 'Test Course I', score: 51, date: '2026-04-10', rating: 34.5, slope: 120, format: 'stroke', holesPlayed: 9 }),
  mk({ player: 'test_scen_9h_01', playerName: 'scenarioOnlyNineHole', course: 'Test Course J', score: 46, date: '2026-04-09', rating: 33.8, slope: 117, format: 'stroke', holesPlayed: 9 }),

  // ── scenarioOnlyScramble: 4 × scramble ───────────────────────────────
  mk({ player: 'test_scen_scr_01', playerName: 'scenarioOnlyScramble', course: 'Test Course D', score: 72, date: '2026-04-11', rating: 67.5, slope: 130, format: 'scramble', holesPlayed: 18 }),
  mk({ player: 'test_scen_scr_01', playerName: 'scenarioOnlyScramble', course: 'Test Course D', score: 75, date: '2026-04-10', rating: 67.5, slope: 130, format: 'scramble', holesPlayed: 18 }),
  mk({ player: 'test_scen_scr_01', playerName: 'scenarioOnlyScramble', course: 'Test Course K', score: 78, date: '2026-04-09', rating: 68.0, slope: 125, format: 'scramble', holesPlayed: 18 }),
  mk({ player: 'test_scen_scr_01', playerName: 'scenarioOnlyScramble', course: 'Test Course K', score: 70, date: '2026-04-08', rating: 68.0, slope: 125, format: 'scramble', holesPlayed: 18 }),
];

// ── scenarioTwentyRounds: 20 × 18-hole stroke, 5 courses, 85-110 ───────
const TWENTY_COURSES = ['Test Course A', 'Test Course B', 'Test Course C', 'Test Course L', 'Test Course M'];
const TWENTY_SCORES  = [95, 92, 98, 101, 88, 89, 107, 85, 94, 99, 103, 90, 97, 110, 86, 93, 102, 96, 91, 100];
for (let i = 0; i < 20; i++) {
  const d = new Date(2026, 2, 15 + i);
  rounds.push(mk({
    player: 'test_scen_20r_01',
    playerName: 'scenarioTwentyRounds',
    course: TWENTY_COURSES[i % 5],
    score: TWENTY_SCORES[i],
    date: d.toISOString().slice(0, 10),
    rating: 70.0,
    slope: 125,
    format: 'stroke',
    holesPlayed: 18,
  }));
}

// ── scenarioSingleRound: 1 × 18-hole stroke ────────────────────────────
rounds.push(mk({ player: 'test_scen_1r_01', playerName: 'scenarioSingleRound', course: 'Test Course A', score: 95, date: '2026-04-11', rating: 68.4, slope: 121, format: 'stroke', holesPlayed: 18 }));

// ── scenarioMixedLeagues: 3 in league-01 + 2 in league-02 ──────────────
rounds.push(mk({ player: 'test_scen_ml_01', playerName: 'scenarioMixedLeagues', course: 'Test Course A', score: 90, date: '2026-04-11', rating: 68.4, slope: 121, format: 'stroke', holesPlayed: 18, leagueId: LEAGUE_01 }));
rounds.push(mk({ player: 'test_scen_ml_01', playerName: 'scenarioMixedLeagues', course: 'Test Course B', score: 92, date: '2026-04-10', rating: 69.1, slope: 129, format: 'stroke', holesPlayed: 18, leagueId: LEAGUE_01 }));
rounds.push(mk({ player: 'test_scen_ml_01', playerName: 'scenarioMixedLeagues', course: 'Test Course C', score: 94, date: '2026-04-09', rating: 70.3, slope: 126, format: 'stroke', holesPlayed: 18, leagueId: LEAGUE_01 }));
rounds.push(mk({ player: 'test_scen_ml_01', playerName: 'scenarioMixedLeagues', course: 'Test Course N', score: 88, date: '2026-04-08', rating: 69.0, slope: 123, format: 'stroke', holesPlayed: 18, leagueId: LEAGUE_02 }));
rounds.push(mk({ player: 'test_scen_ml_01', playerName: 'scenarioMixedLeagues', course: 'Test Course N', score: 91, date: '2026-04-07', rating: 69.0, slope: 123, format: 'stroke', holesPlayed: 18, leagueId: LEAGUE_02 }));

module.exports = rounds;
module.exports.rounds = rounds;
