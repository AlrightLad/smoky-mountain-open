// Synthetic test users for the Playwright E2E suite.
// Never use real UIDs, emails, or names from production members.
// 26 users total: 4 founding-four + 16 inactive + 6 scenario.
//
// After the user list is built, each member doc is back-filled with the
// materialized stats that persistPlayerStats() maintains in production:
// totalRounds, bestRound, avgScore, handicap. Without this, home page
// counts fall back to the league-scoped `myRounds.length` path and the
// global v7.6.4 behavior goes untested.

const rounds = require('./rounds.js').rounds;

const PASSWORD = 'TestPass123!';
const LEAGUE = 'test-league-01';

function founding(key, uid, claimedFrom, role) {
  return {
    key,
    uid,
    email: uid + '@test.local',
    password: PASSWORD,
    memberDoc: {
      id: uid,
      email: uid + '@test.local',
      username: key.toLowerCase() + '#0001',
      name: key,
      claimedFrom,
      role: role || 'member',
      leagues: [LEAGUE],
      activeLeague: LEAGUE,
      computedHandicap: null,
      xp: 0,
      level: 1,
      parcoinBalance: 0,
      founding: true,
      isFoundingFour: true,
      badges: ['founder'],
      onboardingComplete: true,
      createdAt: Date.now(),
    },
  };
}

function inactive(n) {
  const nn = String(n).padStart(2, '0');
  const key = 'testuser_' + nn;
  const uid = 'test_inactive_' + nn + '_uid';
  return {
    key,
    uid,
    email: uid + '@test.local',
    password: PASSWORD,
    memberDoc: {
      id: uid,
      email: uid + '@test.local',
      username: key,
      name: 'Test User ' + nn,
      role: 'member',
      leagues: [LEAGUE],
      activeLeague: LEAGUE,
      founding: false,
      isFoundingFour: false,
      onboardingComplete: true,
      createdAt: Date.now(),
    },
  };
}

function scenario(key, uid, extraLeagues) {
  const leagues = extraLeagues ? [LEAGUE].concat(extraLeagues) : [LEAGUE];
  return {
    key,
    uid,
    email: uid + '@test.local',
    password: PASSWORD,
    memberDoc: {
      id: uid,
      email: uid + '@test.local',
      username: key.toLowerCase(),
      name: key,
      role: 'member',
      leagues,
      activeLeague: LEAGUE,
      founding: false,
      isFoundingFour: false,
      onboardingComplete: true,
      createdAt: Date.now(),
    },
  };
}

const users = [
  founding('testZach',   'test_zach_uid_01',   'testzach',   'commissioner'),
  founding('testNick',   'test_nick_uid_01',   'testnick',   'member'),
  founding('testKayvan', 'test_kayvan_uid_01', 'testkayvan', 'member'),
  founding('testKiyan',  'test_kiyan_uid_01',  'testkiyan',  'member'),
];

for (let i = 1; i <= 16; i++) users.push(inactive(i));

users.push(scenario('scenarioOnlyNineHole', 'test_scen_9h_01'));
users.push(scenario('scenarioOnlyScramble', 'test_scen_scr_01'));
users.push(scenario('scenarioTwentyRounds', 'test_scen_20r_01'));
users.push(scenario('scenarioSingleRound',  'test_scen_1r_01'));
users.push(scenario('scenarioNoRounds',     'test_scen_0r_01'));
users.push(scenario('scenarioMixedLeagues', 'test_scen_ml_01', ['test-league-02']));

// ── Materialized-stat backfill ───────────────────────────────────────
// Mirrors persistPlayerStats() in src/core/sync.js. Pure, Node-safe
// reimplementation of the WHS calculation from src/core/handicap.js —
// keep in sync if the production formula changes.
const WHS_SCALE = {
  3:{count:1,adj:-2}, 4:{count:1,adj:-1}, 5:{count:1,adj:0},
  6:{count:2,adj:-1}, 7:{count:2,adj:0}, 8:{count:2,adj:0},
  9:{count:3,adj:0}, 10:{count:3,adj:0}, 11:{count:3,adj:0},
  12:{count:4,adj:0},13:{count:4,adj:0},14:{count:4,adj:0},
  15:{count:5,adj:0},16:{count:5,adj:0},17:{count:6,adj:0},
  18:{count:6,adj:0},19:{count:7,adj:0},20:{count:8,adj:0},
};

function calculateHandicapIndex(eligible) {
  const sorted = eligible.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const recent = sorted.slice(0, 20);
  if (recent.length < 3) return null;
  const diffs = recent
    .map(r => (113 / parseFloat(r.slope)) * (r.score - parseFloat(r.rating)))
    .sort((a, b) => a - b);
  const rule = WHS_SCALE[Math.min(diffs.length, 20)];
  if (!rule) return null;
  const avg = diffs.slice(0, rule.count).reduce((a, b) => a + b, 0) / rule.count;
  return Math.min(54.0, Math.round((avg + rule.adj) * 10) / 10);
}

function playerIds(u) {
  const ids = [u.uid];
  if (u.memberDoc.claimedFrom) ids.push(u.memberDoc.claimedFrom);
  return ids;
}

function statsFor(u) {
  const ids = playerIds(u);
  const mine = rounds.filter(r => ids.indexOf(r.player) !== -1);
  const eligible18 = mine.filter(r =>
    r.format !== 'scramble'
    && r.format !== 'scramble4'
    && (!r.holesPlayed || r.holesPlayed >= 18)
    && r.score && r.rating && r.slope
  );
  const strokeOnly18 = eligible18.filter(r => r.format === 'stroke' || r.format === 'stableford');
  const avgScore = strokeOnly18.length
    ? Math.round(strokeOnly18.reduce((a, r) => a + r.score, 0) / strokeOnly18.length)
    : null;
  const bestRound = strokeOnly18.length
    ? Math.min(...strokeOnly18.map(r => r.score))
    : null;
  // Per spec: null below 8 eligible rounds, else WHS index.
  const handicap = eligible18.length >= 8 ? calculateHandicapIndex(eligible18) : null;
  return { totalRounds: mine.length, avgScore, bestRound, handicap };
}

// Materialized XP values per user. Production's persistPlayerStats persists
// `xp` on the member doc (computed globally across all leagues). v7.8.4's fix
// makes home/profile displays read that persisted value first.
//
// v7.9 runs persistPlayerStats at session start. That means the persisted
// value always converges to the global-live computation within a few
// seconds of login. Seeded values that diverge from global-live are
// overwritten on first login and any test that asserts against them will
// flake. So these seeds are chosen to MATCH what v7.9's global computation
// produces — the value-compare gate in v7.9 then makes persist idempotent.
//
// For users the XP tests target: testZach (3,100) and scenarioTwentyRounds
// (4,150) match their global-live computation. scenarioMixedLeagues (1,875)
// also matches global-live but is DIFFERENT from its league-scoped live
// value (test-league-01 is their active league, but they have rounds in
// test-league-02 too). That persisted-vs-league-scoped divergence is what
// the XP parity regression test still exercises — displays must read
// persisted (global) not league-scoped live.
const MATERIALIZED_XP = {
  testZach: 3100,
  scenarioTwentyRounds: 4150,
  scenarioMixedLeagues: 1875,
};

for (const u of users) {
  const s = statsFor(u);
  u._expectedRoundCount = s.totalRounds;
  u.memberDoc.avgScore    = s.avgScore;
  u.memberDoc.bestRound   = s.bestRound;
  u.memberDoc.handicap    = s.handicap;
  u.memberDoc.computedHandicap = s.handicap;
  // Only non-founding users get the materialized totalRounds field.
  // Founding members must fall through to myRounds.length on home so that
  // PB.getPlayerRounds → getAllPlayerIds (the claimedFrom merge path fixed
  // in v7.6.5) is exercised. Populating totalRounds on them would short-
  // circuit home.js:80 and mask the regression the tests are designed to
  // catch.
  if (!u.memberDoc.isFoundingFour) {
    u.memberDoc.totalRounds = s.totalRounds;
  }
  if (MATERIALIZED_XP[u.key] !== undefined) {
    u.memberDoc.xp = MATERIALIZED_XP[u.key];
  }
}

// Expected round count as rendered on home page. For non-founding users
// this equals the materialized totalRounds; for founding users it equals
// the merged getPlayerRounds count (same number in fixtures, different
// code path).
const expectedRoundCount = {};
for (const u of users) expectedRoundCount[u.key] = u._expectedRoundCount;

module.exports = users;
module.exports.users = users;
module.exports.expectedRoundCount = expectedRoundCount;
module.exports.PASSWORD = PASSWORD;
module.exports.LEAGUE = LEAGUE;
