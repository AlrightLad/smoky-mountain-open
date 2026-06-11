// Server-authoritative ParCoin rate table + award calculators.
//
// ParCoin Stage 2 (closes pentest #16 — client-written balances). This is the
// ONE economy spec shared by client (src/core/parcoins.js) and the server
// (grantCoins in index.js). The server NEVER trusts a client-sent amount — it
// re-derives every award from the authoritative source doc using these rates.
//
// Ported VERBATIM from src/core/parcoins.js PARCOIN_RATES + calc fns, plus the
// two literals that were hardcoded at their call sites (scorecard_contribution,
// scorecard_verify). The 5 dead rates with no live trigger
// (event_win/season_champion/invite_joined/new_member_welcome/tee_time_filled)
// are intentionally OMITTED — the server mints only wired reasons.
//
// AMD-018: code-only. firebase deploy is still Founder-gated.

const PARCOIN_RATES = {
  round_18h_base:          50,
  round_18h_attested:      25,
  round_9h_base:           25,
  round_9h_attested:       10,
  range_session:           10,
  attest_round:            5,
  daily_login:             1,
  achievement_play:        25,
  achievement_play_max:    50,
  achievement_social:      10,
  personal_best_18h:       100,
  personal_best_9h:        50,
  scorecard_contribution:  50,   // was a hardcoded literal at courses.js:908
  scorecard_verify:        10,   // was a hardcoded literal at courses.js:933
};

// 18H: 50 base (+25 attested). 9H: 25 base (+10 attested).
function calcRoundCoins(is9hole, isAttested) {
  if (is9hole) {
    return PARCOIN_RATES.round_9h_base + (isAttested ? PARCOIN_RATES.round_9h_attested : 0);
  }
  return PARCOIN_RATES.round_18h_base + (isAttested ? PARCOIN_RATES.round_18h_attested : 0);
}

// Flat 10 for a 30+ minute range session (1/day cap enforced server-side).
function calcRangeCoins(durationMinutes) {
  if ((durationMinutes || 0) < 30) return 0;
  return PARCOIN_RATES.range_session;
}

// Play achievements 25–50 by XP; social/misc capped at 10.
function calcAchievementCoins(achievementXP, isSocial) {
  if (isSocial) return PARCOIN_RATES.achievement_social;
  if (!achievementXP || achievementXP <= 50) return PARCOIN_RATES.achievement_play;
  if (achievementXP >= 200) return PARCOIN_RATES.achievement_play_max;
  return Math.round(25 + (achievementXP - 50) * (25 / 150));
}

module.exports = { PARCOIN_RATES, calcRoundCoins, calcRangeCoins, calcAchievementCoins };
